import {
  CombatState,
  TacticalEntity,
  TacticalGroup,
  TacticalFormation,
  TacticalDirection,
  TacticalCommand,
  PlacedCombatObject
} from '../types';
import {
  FormationPosition,
  GridDimensions,
  generateLocalFormationOffsets,
  collectOccupiedAndBlockedCells,
  changeTacticalGroupFormation,
  splitTacticalGroup,
  spawnTacticalGroup
} from './tacticalEngine';

// =============================================================
// Interfaces & Types for Movement & Pathfinding
// =============================================================

export interface FindPathParams {
  start: FormationPosition;
  target: FormationPosition;
  grid: GridDimensions;
  blockedCells?: Set<string>; // "x,y"
  combatState?: CombatState;
  allowDiagonal?: boolean;
  costFunction?: (x: number, y: number) => number;
}

export interface PathResult {
  success: boolean;
  path: FormationPosition[];
  totalCost: number;
  reason?: 'SUCCESS' | 'NO_PATH' | 'OUT_OF_BOUNDS' | 'START_BLOCKED' | 'TARGET_BLOCKED';
}

export interface MoveEntityParams {
  combatState: CombatState;
  entityId: string;
  targetPosition: FormationPosition;
  allowDiagonal?: boolean;
}

export interface MoveEntityResult {
  success: boolean;
  entity?: TacticalEntity;
  path?: FormationPosition[];
  updatedCombatState: CombatState;
  reason?: string;
}

export interface MoveGroupParams {
  combatState: CombatState;
  groupId: string;
  targetPosition: FormationPosition;
  formation?: TacticalFormation;
  direction?: TacticalDirection;
  allowDiagonal?: boolean;
}

export interface MoveGroupResult {
  success: boolean;
  groupId: string;
  movedCount: number;
  blockedCount: number;
  totalUnits: number;
  reason?: 'SUCCESS' | 'NO_PATH' | 'PARTIAL_FORMATION' | 'GROUP_NOT_FOUND' | 'OUT_OF_BOUNDS' | string;
  mainPath?: FormationPosition[];
  updatedCombatState: CombatState;
}

export interface ExecuteCommandResult {
  success: boolean;
  command: TacticalCommand;
  updatedCombatState: CombatState;
  reason?: string;
  movedCount?: number;
  blockedCount?: number;
}

// =============================================================
// Helper: Coordinate rotation based on TacticalDirection
// Local coords: u = lateral (right), v = depth / forward (away from front)
// =============================================================
function rotateOffset(
  u: number,
  v: number,
  direction: TacticalDirection = 'south'
): { dx: number; dy: number } {
  switch (direction) {
    case 'north':
      return { dx: u, dy: -v };
    case 'south':
      return { dx: -u, dy: v };
    case 'east':
      return { dx: v, dy: u };
    case 'west':
      return { dx: -v, dy: -u };
    case 'northeast': {
      const x = Math.round((u + v) * 0.7071);
      const y = Math.round((-v + u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'northwest': {
      const x = Math.round((-u + v) * 0.7071);
      const y = Math.round((-v - u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'southeast': {
      const x = Math.round((u - v) * 0.7071);
      const y = Math.round((v + u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'southwest': {
      const x = Math.round((-u - v) * 0.7071);
      const y = Math.round((v - u) * 0.7071);
      return { dx: x, dy: y };
    }
    default:
      return { dx: u, dy: v };
  }
}

// Derive a general TacticalDirection from movement vector (dx, dy)
export function deriveDirectionFromVector(dx: number, dy: number, fallback: TacticalDirection = 'south'): TacticalDirection {
  if (dx === 0 && dy === 0) return fallback;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy * 2) {
    return dx > 0 ? 'east' : 'west';
  } else if (absDy > absDx * 2) {
    return dy > 0 ? 'south' : 'north';
  } else {
    // Diagonal
    if (dx > 0 && dy < 0) return 'northeast';
    if (dx < 0 && dy < 0) return 'northwest';
    if (dx > 0 && dy > 0) return 'southeast';
    return 'southwest';
  }
}

// =============================================================
// 1. Terrain Movement Cost Abstraction
// =============================================================
export function getTerrainMovementCost(
  x: number,
  y: number,
  combatState?: CombatState
): number {
  if (!combatState) return 1.0;

  const key = `${x},${y}`;
  const tile = combatState.tiles?.[key]?.toLowerCase();

  if (tile) {
    if (tile.includes('road') || tile.includes('weg') || tile.includes('straße') || tile.includes('pfad')) {
      return 0.8;
    }
    if (tile.includes('forest') || tile.includes('wald') || tile.includes('dunkelwald')) {
      return 2.0;
    }
    if (tile.includes('mud') || tile.includes('schlamm') || tile.includes('sumpf')) {
      return 2.5;
    }
    if (tile.includes('sand') || tile.includes('düne')) {
      return 1.4;
    }
    if (tile.includes('water') || tile.includes('wasser') || tile.includes('fluss') || tile.includes('see') || tile.includes('ocean')) {
      return Infinity; // Impassable
    }
    if (tile.includes('mountain') || tile.includes('gebirge') || tile.includes('felswand') || tile.includes('chasm')) {
      return Infinity; // Impassable
    }
    if (tile.includes('lava') || tile.includes('magma')) {
      return Infinity; // Impassable
    }
  }

  // Check placed objects that may slow movement or block
  if (combatState.placedObjects) {
    const obj = combatState.placedObjects.find(o => o.x === x && o.y === y && !o.isDestroyed);
    if (obj) {
      const cat = (obj.category || '').toLowerCase();
      const rules = (obj.rules || '').toLowerCase();
      const name = (obj.name || '').toLowerCase();

      if (
        rules.includes('blockiert') ||
        cat.includes('barriere') ||
        cat.includes('hindernis') ||
        name.includes('wand') ||
        name.includes('mauer')
      ) {
        return Infinity;
      }
    }
  }

  return 1.0;
}

// =============================================================
// 2. A* Pathfinding Engine (Grid-Based, Deterministic, 8-Way with Corner-Cutting Check)
// =============================================================

interface AStarNode {
  x: number;
  y: number;
  gScore: number;
  hScore: number;
  fScore: number;
  parent: AStarNode | null;
}

export function findPath(params: FindPathParams): PathResult {
  const {
    start,
    target,
    grid,
    blockedCells = new Set<string>(),
    combatState,
    allowDiagonal = true,
    costFunction
  } = params;

  // 1. Boundary checks
  const isInside = (x: number, y: number) => x >= 0 && x < grid.width && y >= 0 && y < grid.height;

  if (!isInside(start.x, start.y) || !isInside(target.x, target.y)) {
    return {
      success: false,
      path: [],
      totalCost: 0,
      reason: 'OUT_OF_BOUNDS'
    };
  }

  // 2. Start == Target
  if (start.x === target.x && start.y === target.y) {
    return {
      success: true,
      path: [{ x: start.x, y: start.y }],
      totalCost: 0,
      reason: 'SUCCESS'
    };
  }

  const startKey = `${start.x},${start.y}`;
  const targetKey = `${target.x},${target.y}`;

  // Start blocked? (Informational check, allow escaping if unit is already there)
  // Target blocked check
  if (blockedCells.has(targetKey)) {
    return {
      success: false,
      path: [],
      totalCost: 0,
      reason: 'TARGET_BLOCKED'
    };
  }

  const defaultCostFn = (x: number, y: number) => {
    if (costFunction) return costFunction(x, y);
    return getTerrainMovementCost(x, y, combatState);
  };

  // Heuristic: Octile distance for diagonal, Manhattan for orthogonal
  const heuristic = (x: number, y: number): number => {
    const dx = Math.abs(x - target.x);
    const dy = Math.abs(y - target.y);
    if (allowDiagonal) {
      // Octile distance
      return 1.0 * Math.max(dx, dy) + (1.414 - 1.0) * Math.min(dx, dy);
    }
    return dx + dy;
  };

  const isCellPassable = (x: number, y: number): boolean => {
    if (!isInside(x, y)) return false;
    const key = `${x},${y}`;
    if (blockedCells.has(key)) return false;
    const cost = defaultCostFn(x, y);
    if (!isFinite(cost) || cost <= 0) return false;
    return true;
  };

  // Open set and closed set
  const openSet: AStarNode[] = [];
  const openMap = new Map<string, AStarNode>();
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    x: start.x,
    y: start.y,
    gScore: 0,
    hScore: heuristic(start.x, start.y),
    fScore: heuristic(start.x, start.y),
    parent: null
  };

  openSet.push(startNode);
  openMap.set(startKey, startNode);

  // Directions
  // Orthogonal: N, S, E, W
  const orthoDirs = [
    { dx: 0, dy: -1, costMult: 1.0 }, // North
    { dx: 0, dy: 1, costMult: 1.0 },  // South
    { dx: 1, dy: 0, costMult: 1.0 },  // East
    { dx: -1, dy: 0, costMult: 1.0 }  // West
  ];

  // Diagonal: NE, NW, SE, SW
  const diagDirs = [
    { dx: 1, dy: -1, costMult: 1.414 },  // Northeast
    { dx: -1, dy: -1, costMult: 1.414 }, // Northwest
    { dx: 1, dy: 1, costMult: 1.414 },   // Southeast
    { dx: -1, dy: 1, costMult: 1.414 }   // Southwest
  ];

  const maxIterations = grid.width * grid.height * 8;
  let iterations = 0;

  while (openSet.length > 0 && iterations++ < maxIterations) {
    // Deterministic selection: Lowest fScore, tie-break with hScore, then deterministic coordinate order
    let bestIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      const a = openSet[i];
      const b = openSet[bestIndex];
      if (a.fScore < b.fScore) {
        bestIndex = i;
      } else if (Math.abs(a.fScore - b.fScore) < 1e-6) {
        if (a.hScore < b.hScore) {
          bestIndex = i;
        } else if (Math.abs(a.hScore - b.hScore) < 1e-6) {
          // Stable coordinate tie-break (NO Math.random!)
          const coordA = a.y * 10000 + a.x;
          const coordB = b.y * 10000 + b.x;
          if (coordA < coordB) {
            bestIndex = i;
          }
        }
      }
    }

    const current = openSet.splice(bestIndex, 1)[0];
    const currentKey = `${current.x},${current.y}`;
    openMap.delete(currentKey);
    closedSet.add(currentKey);

    // Target reached!
    if (current.x === target.x && current.y === target.y) {
      const path: FormationPosition[] = [];
      let curr: AStarNode | null = current;
      while (curr) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return {
        success: true,
        path,
        totalCost: current.gScore,
        reason: 'SUCCESS'
      };
    }

    // Explore neighbors
    const directionsToTest = allowDiagonal ? [...orthoDirs, ...diagDirs] : orthoDirs;

    for (const dir of directionsToTest) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (closedSet.has(nKey)) continue;
      if (!isCellPassable(nx, ny)) continue;

      // CRITICAL Corner-Cutting Prevention for Diagonal Movement:
      // A diagonal move from (x, y) to (x+dx, y+dy) must NOT pass through blocked corners.
      // E.g.: if (x+dx, y) or (x, y+dy) is blocked, diagonal movement across that corner is forbidden.
      if (dir.dx !== 0 && dir.dy !== 0) {
        const corner1Passable = isCellPassable(current.x + dir.dx, current.y);
        const corner2Passable = isCellPassable(current.x, current.y + dir.dy);
        // Neither corner can be blocked for diagonal transit
        if (!corner1Passable || !corner2Passable) {
          continue;
        }
      }

      const stepCost = dir.costMult * defaultCostFn(nx, ny);
      const tentativeG = current.gScore + stepCost;

      const existingNode = openMap.get(nKey);
      if (!existingNode) {
        const h = heuristic(nx, ny);
        const neighborNode: AStarNode = {
          x: nx,
          y: ny,
          gScore: tentativeG,
          hScore: h,
          fScore: tentativeG + h,
          parent: current
        };
        openSet.push(neighborNode);
        openMap.set(nKey, neighborNode);
      } else if (tentativeG < existingNode.gScore) {
        existingNode.gScore = tentativeG;
        existingNode.fScore = tentativeG + existingNode.hScore;
        existingNode.parent = current;
      }
    }
  }

  // No path found
  return {
    success: false,
    path: [],
    totalCost: 0,
    reason: 'NO_PATH'
  };
}

// =============================================================
// 3. Single Tactical Entity Movement (moveTacticalEntity)
// =============================================================

export function moveTacticalEntity(params: MoveEntityParams): MoveEntityResult {
  const { combatState, entityId, targetPosition, allowDiagonal = true } = params;

  const entity = combatState.tacticalEntities?.[entityId];
  if (!entity) {
    return {
      success: false,
      updatedCombatState: combatState,
      reason: `TacticalEntity "${entityId}" not found.`
    };
  }

  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;
  const grid: GridDimensions = { width: gridWidth, height: gridHeight };

  // Collect obstacles & occupied cells (excluding the moving entity itself)
  const { occupied, blocked } = collectOccupiedAndBlockedCells(combatState);
  occupied.delete(`${entity.position.x},${entity.position.y}`);

  // Combine occupied cells and blocked cells as obstacle set for A*
  const blockedForPath = new Set<string>([...blocked, ...occupied]);

  const pathResult = findPath({
    start: entity.position,
    target: targetPosition,
    grid,
    blockedCells: blockedForPath,
    combatState,
    allowDiagonal
  });

  if (!pathResult.success) {
    return {
      success: false,
      entity,
      path: [],
      updatedCombatState: combatState,
      reason: pathResult.reason || 'NO_PATH'
    };
  }

  const updatedEntity: TacticalEntity = {
    ...entity,
    position: targetPosition
  };

  const nextEntities = {
    ...(combatState.tacticalEntities || {}),
    [entityId]: updatedEntity
  };

  // Backward compatibility: If this entity represents a named character in positions, sync it
  let nextPositions = combatState.positions;
  if (combatState.positions) {
    const charName = entity.worldEntityId || entity.displayName;
    if (combatState.positions[charName]) {
      nextPositions = {
        ...combatState.positions,
        [charName]: { x: targetPosition.x, y: targetPosition.y }
      };
    }
  }

  // Update group centroid if part of a group
  let nextGroups = combatState.tacticalGroups;
  if (entity.groupId && combatState.tacticalGroups?.[entity.groupId]) {
    const group = combatState.tacticalGroups[entity.groupId];
    const groupEntities = group.unitIds.map(id => nextEntities[id]).filter(Boolean) as TacticalEntity[];
    if (groupEntities.length > 0) {
      const sumX = groupEntities.reduce((acc, e) => acc + e.position.x, 0);
      const sumY = groupEntities.reduce((acc, e) => acc + e.position.y, 0);
      const newCentroid = {
        x: Math.round(sumX / groupEntities.length),
        y: Math.round(sumY / groupEntities.length)
      };
      nextGroups = {
        ...(combatState.tacticalGroups || {}),
        [group.id]: {
          ...group,
          center: newCentroid
        }
      };
    }
  }

  const updatedCombatState: CombatState = {
    ...combatState,
    tacticalEntities: nextEntities,
    tacticalGroups: nextGroups,
    positions: nextPositions
  };

  return {
    success: true,
    entity: updatedEntity,
    path: pathResult.path,
    updatedCombatState,
    reason: 'SUCCESS'
  };
}

// =============================================================
// 4. Group Movement & Formation Engine (moveTacticalGroup)
// Preserves formation offsets, executes pathfinding,
// handles bottlenecks and reservations with graceful degradation
// =============================================================

export function moveTacticalGroup(params: MoveGroupParams): MoveGroupResult {
  const {
    combatState,
    groupId,
    targetPosition,
    formation: overrideFormation,
    direction: overrideDirection,
    allowDiagonal = true
  } = params;

  const group = combatState.tacticalGroups?.[groupId];
  if (!group) {
    return {
      success: false,
      groupId,
      movedCount: 0,
      blockedCount: 0,
      totalUnits: 0,
      reason: 'GROUP_NOT_FOUND',
      updatedCombatState: combatState
    };
  }

  const currentEntities = combatState.tacticalEntities || {};
  const groupEntities = group.unitIds.map(id => currentEntities[id]).filter(Boolean) as TacticalEntity[];

  if (groupEntities.length === 0) {
    return {
      success: true,
      groupId,
      movedCount: 0,
      blockedCount: 0,
      totalUnits: 0,
      reason: 'SUCCESS',
      updatedCombatState: combatState
    };
  }

  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;
  const grid: GridDimensions = { width: gridWidth, height: gridHeight };

  // Calculate current centroid
  const sumX = groupEntities.reduce((acc, e) => acc + e.position.x, 0);
  const sumY = groupEntities.reduce((acc, e) => acc + e.position.y, 0);
  const currentCenter: FormationPosition = {
    x: Math.round(sumX / groupEntities.length),
    y: Math.round(sumY / groupEntities.length)
  };

  // 1. Check if target is inside grid
  if (
    targetPosition.x < 0 ||
    targetPosition.x >= gridWidth ||
    targetPosition.y < 0 ||
    targetPosition.y >= gridHeight
  ) {
    return {
      success: false,
      groupId,
      movedCount: 0,
      blockedCount: groupEntities.length,
      totalUnits: groupEntities.length,
      reason: 'OUT_OF_BOUNDS',
      updatedCombatState: combatState
    };
  }

  // 2. Obstacle detection: collect occupied & blocked cells
  const { occupied, blocked } = collectOccupiedAndBlockedCells(combatState);

  // Exclude cells currently occupied by members of THIS group so they can traverse freely
  groupEntities.forEach(e => {
    occupied.delete(`${e.position.x},${e.position.y}`);
  });

  const blockedForGroupLeader = new Set<string>([...blocked, ...occupied]);

  // 3. Compute main group path from currentCenter to targetPosition
  let mainPathResult = findPath({
    start: currentCenter,
    target: targetPosition,
    grid,
    blockedCells: blockedForGroupLeader,
    combatState,
    allowDiagonal
  });

  // If target itself is blocked (e.g. village building, wall, or enemy at target coordinates),
  // find the closest free/walkable approach cell to targetPosition so the group can march there!
  if (!mainPathResult.success && mainPathResult.reason === 'TARGET_BLOCKED') {
    const candidates: Array<{ x: number; y: number; dist: number }> = [];
    for (let r = 1; r <= 3; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r) {
            const nx = targetPosition.x + dx;
            const ny = targetPosition.y + dy;
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
              if (!blockedForGroupLeader.has(`${nx},${ny}`)) {
                const dist = Math.hypot(nx - currentCenter.x, ny - currentCenter.y);
                candidates.push({ x: nx, y: ny, dist });
              }
            }
          }
        }
      }
      if (candidates.length > 0) break;
    }

    candidates.sort((a, b) => a.dist - b.dist);
    for (const cand of candidates) {
      const altPath = findPath({
        start: currentCenter,
        target: { x: cand.x, y: cand.y },
        grid,
        blockedCells: blockedForGroupLeader,
        combatState,
        allowDiagonal
      });
      if (altPath.success) {
        mainPathResult = altPath;
        break;
      }
    }
  }

  // If no path at all to target, check if target itself was blocked or if there is no route
  if (!mainPathResult.success) {
    return {
      success: false,
      groupId,
      movedCount: 0,
      blockedCount: groupEntities.length,
      totalUnits: groupEntities.length,
      reason: mainPathResult.reason || 'NO_PATH',
      updatedCombatState: combatState
    };
  }

  // 4. Formation & Orientation setup
  const finalFormation: TacticalFormation = overrideFormation || group.formation || 'loose';
  const movementVector = {
    dx: targetPosition.x - currentCenter.x,
    dy: targetPosition.y - currentCenter.y
  };
  const derivedDirection = deriveDirectionFromVector(movementVector.dx, movementVector.dy, group.direction || 'south');
  const finalDirection: TacticalDirection = overrideDirection || derivedDirection;

  // 5. Reservation & Collision System for Individual Units
  // Get raw local offsets for the formation
  const rawOffsets = generateLocalFormationOffsets(finalFormation, groupEntities.length);

  // Set of reserved cells for the destination
  const reservedDestinationCells = new Set<string>();
  // Other external obstacles that cannot be stepped on
  const externalObstacles = new Set<string>([...blocked, ...occupied]);

  const isCellAvailableForUnit = (x: number, y: number): boolean => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return false;
    const key = `${x},${y}`;
    if (reservedDestinationCells.has(key)) return false;
    if (externalObstacles.has(key)) return false;
    const cost = getTerrainMovementCost(x, y, combatState);
    if (!isFinite(cost) || cost <= 0) return false;
    return true;
  };

  // Spiral search for finding nearest free cell if ideal formation cell is blocked (Degradation)
  const findNearestFreeCell = (desiredX: number, desiredY: number): FormationPosition | null => {
    const clampedX = Math.min(gridWidth - 1, Math.max(0, desiredX));
    const clampedY = Math.min(gridHeight - 1, Math.max(0, desiredY));

    if (isCellAvailableForUnit(clampedX, clampedY)) {
      return { x: clampedX, y: clampedY };
    }

    const maxRadius = Math.max(gridWidth, gridHeight);
    for (let r = 1; r < maxRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r) {
            const cx = clampedX + dx;
            const cy = clampedY + dy;
            if (isCellAvailableForUnit(cx, cy)) {
              return { x: cx, y: cy };
            }
          }
        }
      }
    }
    return null;
  };

  // 6. Assign unique target cells to each entity
  // Entity IDs are preserved!
  const nextEntities = { ...currentEntities };
  let movedCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < groupEntities.length; i++) {
    const entity = groupEntities[i];
    const localOffset = rawOffsets[i] || { u: i % 10, v: Math.floor(i / 10) };
    const rotated = rotateOffset(localOffset.u, localOffset.v, finalDirection);

    const desiredX = targetPosition.x + rotated.dx;
    const desiredY = targetPosition.y + rotated.dy;

    const assignedCell = findNearestFreeCell(desiredX, desiredY);

    if (assignedCell) {
      reservedDestinationCells.add(`${assignedCell.x},${assignedCell.y}`);
      nextEntities[entity.id] = {
        ...entity,
        position: assignedCell,
        assignedSlotIndex: i
      };
      movedCount++;
    } else {
      // Bottleneck or grid fully congested: Unit retains previous valid position!
      blockedCount++;
      // nextEntities[entity.id] remains untouched
    }
  }

  // 7. Update Group state
  const updatedGroup: TacticalGroup = {
    ...group,
    formation: finalFormation,
    direction: finalDirection,
    facingDirection: finalDirection,
    center: targetPosition,
    anchorPosition: targetPosition,
    targetPosition
  };

  const nextGroups = {
    ...(combatState.tacticalGroups || {}),
    [groupId]: updatedGroup
  };

  // Backward compatibility: If the group leader is in combatState.positions, sync leader position
  let nextPositions = combatState.positions;
  if (combatState.positions && group.name) {
    if (combatState.positions[group.name]) {
      nextPositions = {
        ...combatState.positions,
        [group.name]: { x: targetPosition.x, y: targetPosition.y }
      };
    }
  }

  const updatedCombatState: CombatState = {
    ...combatState,
    tacticalEntities: nextEntities,
    tacticalGroups: nextGroups,
    positions: nextPositions
  };

  const finalReason = blockedCount > 0 ? 'PARTIAL_FORMATION' : 'SUCCESS';

  return {
    success: true,
    groupId,
    movedCount,
    blockedCount,
    totalUnits: groupEntities.length,
    reason: finalReason,
    mainPath: mainPathResult.path,
    updatedCombatState
  };
}

// =============================================================
// 5. Central Tactical Command Execution (executeTacticalCommand)
// =============================================================

export function executeTacticalCommand(
  combatState: CombatState,
  command: TacticalCommand
): ExecuteCommandResult {
  const cmd = { ...command };
  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;

  // Validation
  if (cmd.targetPosition) {
    if (
      cmd.targetPosition.x < 0 ||
      cmd.targetPosition.x >= gridWidth ||
      cmd.targetPosition.y < 0 ||
      cmd.targetPosition.y >= gridHeight
    ) {
      cmd.status = 'failed';
      return {
        success: false,
        command: cmd,
        updatedCombatState: combatState,
        reason: `Target position (${cmd.targetPosition.x}, ${cmd.targetPosition.y}) is out of grid bounds (${gridWidth}x${gridHeight}).`
      };
    }
  }

  switch (cmd.type) {
    case 'move':
    case 'move_entity': {
      if (!cmd.entityId || !cmd.targetPosition) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing entityId or targetPosition for move_entity.'
        };
      }

      const res = moveTacticalEntity({
        combatState,
        entityId: cmd.entityId,
        targetPosition: cmd.targetPosition
      });

      cmd.status = res.success ? 'completed' : 'failed';
      const nextCommands = [...(combatState.tacticalCommands || []), cmd];

      return {
        success: res.success,
        command: cmd,
        updatedCombatState: {
          ...res.updatedCombatState,
          tacticalCommands: nextCommands
        },
        reason: res.reason,
        movedCount: res.success ? 1 : 0,
        blockedCount: res.success ? 0 : 1
      };
    }

    case 'move_group': {
      if (!cmd.groupId || !cmd.targetPosition) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing groupId or targetPosition for move_group.'
        };
      }

      const res = moveTacticalGroup({
        combatState,
        groupId: cmd.groupId,
        targetPosition: cmd.targetPosition,
        formation: cmd.formation
      });

      cmd.status = res.success ? 'completed' : 'failed';
      const nextCommands = [...(combatState.tacticalCommands || []), cmd];

      return {
        success: res.success,
        command: cmd,
        updatedCombatState: {
          ...res.updatedCombatState,
          tacticalCommands: nextCommands
        },
        reason: res.reason,
        movedCount: res.movedCount,
        blockedCount: res.blockedCount
      };
    }

    case 'formation_move': {
      if (!cmd.groupId || !cmd.targetPosition) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing groupId or targetPosition for formation_move.'
        };
      }

      const res = moveTacticalGroup({
        combatState,
        groupId: cmd.groupId,
        targetPosition: cmd.targetPosition,
        formation: cmd.formation || 'wedge'
      });

      cmd.status = res.success ? 'completed' : 'failed';
      const nextCommands = [...(combatState.tacticalCommands || []), cmd];

      return {
        success: res.success,
        command: cmd,
        updatedCombatState: {
          ...res.updatedCombatState,
          tacticalCommands: nextCommands
        },
        reason: res.reason,
        movedCount: res.movedCount,
        blockedCount: res.blockedCount
      };
    }

    case 'formation': {
      if (!cmd.groupId || !cmd.formation) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing groupId or formation.'
        };
      }

      try {
        const res = changeTacticalGroupFormation({
          combatState,
          groupId: cmd.groupId,
          newFormation: cmd.formation
        });
        cmd.status = 'completed';
        const nextCommands = [...(combatState.tacticalCommands || []), cmd];
        return {
          success: true,
          command: cmd,
          updatedCombatState: {
            ...res.updatedCombatState,
            tacticalCommands: nextCommands
          },
          reason: 'SUCCESS',
          movedCount: res.updatedGroup.unitIds.length
        };
      } catch (err: any) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: err?.message || 'Failed to change formation'
        };
      }
    }

    case 'stop':
    case 'hold': {
      cmd.status = 'completed';
      const nextCommands = [...(combatState.tacticalCommands || []), cmd];
      return {
        success: true,
        command: cmd,
        updatedCombatState: {
          ...combatState,
          tacticalCommands: nextCommands
        },
        reason: 'SUCCESS',
        movedCount: 0,
        blockedCount: 0
      };
    }

    case 'split_group': {
      if (!cmd.groupId) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing groupId for split_group.'
        };
      }
      try {
        const count = cmd.metadata?.countToSplit || 10;
        const newName = cmd.metadata?.newGroupName || `${cmd.groupId}_split`;
        const res = splitTacticalGroup({
          combatState,
          sourceGroupId: cmd.groupId,
          countToSplit: count,
          newGroupName: newName,
          newFormation: cmd.formation,
          newCenter: cmd.targetPosition
        });
        cmd.status = 'completed';
        const nextCommands = [...(combatState.tacticalCommands || []), cmd];
        return {
          success: true,
          command: cmd,
          updatedCombatState: {
            ...res.updatedCombatState,
            tacticalCommands: nextCommands
          },
          reason: 'SUCCESS',
          movedCount: res.newGroup.unitIds.length
        };
      } catch (err: any) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: err?.message || 'Failed to split group'
        };
      }
    }

    case 'move_to_entity':
    case 'follow': {
      if (!cmd.targetEntityId) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: 'Missing targetEntityId.'
        };
      }
      const targetEntity = combatState.tacticalEntities?.[cmd.targetEntityId];
      if (!targetEntity) {
        cmd.status = 'failed';
        return {
          success: false,
          command: cmd,
          updatedCombatState: combatState,
          reason: `Target entity "${cmd.targetEntityId}" not found.`
        };
      }

      const adjTarget = {
        x: Math.min(gridWidth - 1, Math.max(0, targetEntity.position.x + 1)),
        y: targetEntity.position.y
      };

      if (cmd.groupId) {
        return executeTacticalCommand(combatState, {
          ...cmd,
          type: 'move_group',
          targetPosition: adjTarget
        });
      } else if (cmd.entityId) {
        return executeTacticalCommand(combatState, {
          ...cmd,
          type: 'move_entity',
          targetPosition: adjTarget
        });
      }

      cmd.status = 'failed';
      return {
        success: false,
        command: cmd,
        updatedCombatState: combatState,
        reason: 'Neither groupId nor entityId provided.'
      };
    }

    case 'retreat': {
      // Retreat towards edge or south
      const retreatTarget = {
        x: Math.floor(gridWidth / 2),
        y: Math.max(1, gridHeight - 2)
      };

      if (cmd.groupId) {
        return executeTacticalCommand(combatState, {
          ...cmd,
          type: 'move_group',
          targetPosition: retreatTarget
        });
      } else if (cmd.entityId) {
        return executeTacticalCommand(combatState, {
          ...cmd,
          type: 'move_entity',
          targetPosition: retreatTarget
        });
      }
      cmd.status = 'completed';
      return {
        success: true,
        command: cmd,
        updatedCombatState: combatState,
        reason: 'SUCCESS'
      };
    }

    default: {
      cmd.status = 'failed';
      return {
        success: false,
        command: cmd,
        updatedCombatState: combatState,
        reason: `Unsupported TacticalCommandType "${cmd.type}".`
      };
    }
  }
}

// =============================================================
// 6. Process Tactical Command Queue
// =============================================================

export function processTacticalCommandQueue(combatState: CombatState): {
  updatedCombatState: CombatState;
  executedCount: number;
  results: ExecuteCommandResult[];
} {
  const commands = combatState.tacticalCommands || [];
  let currentState = { ...combatState };
  const pendingCommands = commands.filter(c => c.status === 'pending');
  const results: ExecuteCommandResult[] = [];

  for (const cmd of pendingCommands) {
    const res = executeTacticalCommand(currentState, {
      ...cmd,
      status: 'executing'
    });
    results.push(res);
    currentState = res.updatedCombatState;
  }

  return {
    updatedCombatState: currentState,
    executedCount: results.length,
    results
  };
}

// =============================================================
// 7. Parse Tactical Movement Commands from Chat/AI Output
// Structured syntax & Narrative intent detection
// =============================================================

export function parseTacticalCommandsFromText(
  text: string,
  combatState: CombatState
): TacticalCommand[] {
  const commands: TacticalCommand[] = [];
  const groups = combatState.tacticalGroups || {};
  const entities = combatState.tacticalEntities || {};
  const placedObjects = combatState.placedObjects || [];

  // A) JSON Block syntax: [[TACTICAL: {"type": "move_group", "groupId": "...", "targetPosition": {"x": 15, "y": 12}}]]
  const jsonMatches = text.matchAll(/\[\[TACTICAL:\s*(\{.*?\})\s*\]\]/gis);
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type) {
        commands.push({
          id: `cmd_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
          type: parsed.type,
          entityId: parsed.entityId,
          groupId: parsed.groupId,
          targetPosition: parsed.targetPosition,
          formation: parsed.formation,
          priority: parsed.priority || 1,
          source: 'ai',
          status: 'pending',
          metadata: parsed.metadata
        });
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  // B) Flexible Shorthand status tags:
  // [[STATUS: MoveGroup_Goblins=15,12]] or [[STATUS: MoveGroup_Goblins=15,12, Formation=wedge]]
  // Handles tags inside single or multi-attribute STATUS blocks as well as standalone
  const groupMatches = text.matchAll(/(?:MoveGroup|GroupMove)_([^\s=,]+)\s*=\s*(\d+)\s*,\s*(\d+)(?:[,\s]+(?:formation|form)=([a-zA-Z_]+))?/gi);
  for (const match of groupMatches) {
    const rawTarget = match[1].replace(/_/g, ' ').trim().toLowerCase();
    const tx = parseInt(match[2]);
    const ty = parseInt(match[3]);
    const optFormation = (match[4] || '').toLowerCase() as TacticalFormation;

    // Find group by id or name
    let matchedGroup = Object.values(groups).find(g => 
      g.id.toLowerCase() === rawTarget || 
      g.name.toLowerCase().includes(rawTarget) ||
      rawTarget.includes(g.name.toLowerCase())
    );

    // If group does not exist yet, check if there is a matching opponent in combatState.opponents
    if (!matchedGroup && combatState.opponents && combatState.opponents.length > 0) {
      const matchedOpp = combatState.opponents.find(o => 
        o.name.toLowerCase().includes(rawTarget) || 
        rawTarget.includes(o.name.toLowerCase())
      );
      if (matchedOpp) {
        const count = matchedOpp.count && matchedOpp.count > 1 ? matchedOpp.count : 50;
        const spawnRes = spawnTacticalGroup({
          combatState,
          groupName: matchedOpp.name,
          count,
          formation: optFormation || ((matchedOpp as any).formation as TacticalFormation) || 'wedge',
          direction: 'south',
          spawnSource: matchedOpp.spawnSource || 'Wald',
          unitDisplayName: matchedOpp.name.replace(/\s*\d+x?$/, '').trim(),
          baseHp: matchedOpp.hp ? Math.max(10, Math.round(matchedOpp.hp / count)) : 30
        });
        matchedGroup = spawnRes.group;
        Object.assign(groups, spawnRes.updatedCombatState.tacticalGroups);
        Object.assign(entities, spawnRes.updatedCombatState.tacticalEntities);
      }
    }

    // Fallback: If text specifically says "Goblins" or rawTarget is "goblins" and no group exists yet,
    // auto-spawn 50 Goblins in wedge from Wald
    if (!matchedGroup && (rawTarget.includes('goblin') || rawTarget === 'goblins')) {
      const spawnRes = spawnTacticalGroup({
        combatState,
        groupName: 'Goblins',
        count: 50,
        formation: optFormation || 'wedge',
        direction: 'south',
        spawnSource: 'Wald',
        unitDisplayName: 'Goblin',
        baseHp: 30
      });
      matchedGroup = spawnRes.group;
      Object.assign(groups, spawnRes.updatedCombatState.tacticalGroups);
      Object.assign(entities, spawnRes.updatedCombatState.tacticalEntities);
    }

    if (matchedGroup) {
      commands.push({
        id: `cmd_grp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'move_group',
        groupId: matchedGroup.id,
        targetPosition: { x: tx, y: ty },
        formation: optFormation || matchedGroup.formation || 'wedge',
        source: 'ai',
        status: 'pending'
      });
    }
  }

  // [[STATUS: Formation_Goblins=wedge]] or Formation_Goblins=wedge
  const formationMatches = text.matchAll(/(?:Formation|Form)_([^\s=,]+)\s*=\s*([a-zA-Z_]+)/gi);
  for (const match of formationMatches) {
    const rawTarget = match[1].replace(/_/g, ' ').trim().toLowerCase();
    const newForm = match[2].trim().toLowerCase() as TacticalFormation;

    const matchedGroup = Object.values(groups).find(g => 
      g.id.toLowerCase() === rawTarget || 
      g.name.toLowerCase().includes(rawTarget) ||
      rawTarget.includes(g.name.toLowerCase())
    );

    if (matchedGroup) {
      commands.push({
        id: `cmd_form_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'formation',
        groupId: matchedGroup.id,
        formation: newForm,
        source: 'ai',
        status: 'pending'
      });
    }
  }

  // [[STATUS: MoveEntity_EntityId=15,12]] or MoveEntity_...
  const entityMatches = text.matchAll(/(?:MoveEntity|EntityMove)_([^\s=,]+)\s*=\s*(\d+)\s*,\s*(\d+)/gi);
  for (const match of entityMatches) {
    const rawId = match[1].trim();
    const tx = parseInt(match[2]);
    const ty = parseInt(match[3]);

    const matchedEntity = Object.values(entities).find(e => 
      e.id === rawId || 
      e.displayName.toLowerCase() === rawId.toLowerCase()
    );

    if (matchedEntity) {
      commands.push({
        id: `cmd_ent_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'move_entity',
        entityId: matchedEntity.id,
        targetPosition: { x: tx, y: ty },
        source: 'ai',
        status: 'pending'
      });
    }
  }

  // C) Narrative Intent Detection:
  // e.g. "Die 50 Goblins brechen aus dem Wald hervor und stürmen auf das Dorf zu"
  const lowerText = text.toLowerCase();
  if (commands.length === 0 && Object.keys(groups).length > 0) {
    // Check for movement verbs
    const hasMoveIntent = 
      lowerText.includes('stürmen auf') ||
      lowerText.includes('rücken vor') ||
      lowerText.includes('marschieren nach') ||
      lowerText.includes('brechen aus dem wald hervor') ||
      lowerText.includes('greifen das dorf an') ||
      lowerText.includes('bewegen sich auf') ||
      lowerText.includes('rücken in richtung');

    if (hasMoveIntent) {
      // Find candidate group
      const candidateGroup = Object.values(groups).find(g => {
        const cleanGName = g.name.toLowerCase();
        return lowerText.includes(cleanGName) || (cleanGName.includes('goblin') && lowerText.includes('goblin'));
      });

      if (candidateGroup) {
        // Find destination target object (e.g. "Dorf", "Festung", "Tor", "Brücke")
        let targetPos: FormationPosition | null = null;

        if (lowerText.includes('dorf')) {
          const villageObj = placedObjects.find(o => o.name.toLowerCase().includes('dorf') || o.category?.toLowerCase().includes('dorf'));
          if (villageObj) targetPos = { x: villageObj.x, y: villageObj.y };
        } else if (lowerText.includes('festung') || lowerText.includes('burg')) {
          const fortObj = placedObjects.find(o => o.name.toLowerCase().includes('festung') || o.category?.toLowerCase().includes('gebäude'));
          if (fortObj) targetPos = { x: fortObj.x, y: fortObj.y };
        } else if (lowerText.includes('hafen') || lowerText.includes('schiff')) {
          const harborObj = placedObjects.find(o => o.name.toLowerCase().includes('hafen') || o.category?.toLowerCase().includes('schiff'));
          if (harborObj) targetPos = { x: harborObj.x, y: harborObj.y };
        }

        // If target position found, create structured move_group command!
        if (targetPos) {
          commands.push({
            id: `cmd_narrative_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'move_group',
            groupId: candidateGroup.id,
            targetPosition: targetPos,
            formation: candidateGroup.formation || 'wedge',
            source: 'ai',
            status: 'pending',
            metadata: { narrativeInferred: true }
          });
        }
      }
    }
  }

  return commands;
}
