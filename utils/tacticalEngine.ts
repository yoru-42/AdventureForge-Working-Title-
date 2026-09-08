import { 
  TacticalEntity, 
  TacticalGroup, 
  TacticalFormation, 
  TacticalDirection, 
  TacticalSpawnSource,
  CombatState,
  PlacedCombatObject,
  BattleParticipantRelation
} from '../types';

export interface FormationPosition {
  x: number;
  y: number;
}

export interface GridDimensions {
  width: number;
  height: number;
}

export interface CalculateFormationParams {
  center: FormationPosition;
  count: number;
  formation: TacticalFormation;
  direction?: TacticalDirection;
  grid: GridDimensions;
  occupiedCells?: Set<string>; // "x,y"
  blockedCells?: Set<string>;  // "x,y"
}

export interface SpawnTacticalGroupParams {
  combatState: CombatState;
  groupName: string;
  count: number;
  unitDisplayName?: string;
  factionId?: string;
  unitType?: string;
  formation?: TacticalFormation;
  direction?: TacticalDirection;
  spawnSource?: TacticalSpawnSource | string;
  sourcePosition?: FormationPosition;
  existingCharacterIds?: string[];
  baseHp?: number;
  groupId?: string;
  behavior?: string;
}

export interface ChangeFormationParams {
  combatState: CombatState;
  groupId: string;
  newFormation: TacticalFormation;
  newDirection?: TacticalDirection;
  targetCenter?: FormationPosition;
}

export interface SplitGroupParams {
  combatState: CombatState;
  sourceGroupId: string;
  targetUnitIds?: string[];
  countToSplit?: number;
  newGroupName: string;
  newFormation?: TacticalFormation;
  newDirection?: TacticalDirection;
  newCenter?: FormationPosition;
}

// -------------------------------------------------------------
// Helper: Coordinate rotation based on TacticalDirection
// Local coords: u = lateral (right), v = depth / forward (away from front)
// -------------------------------------------------------------
function rotateOffset(
  u: number, 
  v: number, 
  direction: TacticalDirection = 'south'
): { dx: number; dy: number } {
  switch (direction) {
    case 'north':
      // Forward is negative Y, lateral right is positive X
      return { dx: u, dy: -v };
    case 'south':
      // Forward is positive Y, lateral right is negative X
      return { dx: -u, dy: v };
    case 'east':
      // Forward is positive X, lateral right is positive Y
      return { dx: v, dy: u };
    case 'west':
      // Forward is negative X, lateral right is negative Y
      return { dx: -v, dy: -u };
    case 'northeast': {
      // 45 degrees clockwise from North
      const x = Math.round((u + v) * 0.7071);
      const y = Math.round((-v + u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'northwest': {
      // 45 degrees counter-clockwise from North
      const x = Math.round((-u + v) * 0.7071);
      const y = Math.round((-v - u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'southeast': {
      // 45 degrees from South
      const x = Math.round((u - v) * 0.7071);
      const y = Math.round((v + u) * 0.7071);
      return { dx: x, dy: y };
    }
    case 'southwest': {
      // 45 degrees from South
      const x = Math.round((-u - v) * 0.7071);
      const y = Math.round((v - u) * 0.7071);
      return { dx: x, dy: y };
    }
    default:
      return { dx: u, dy: v };
  }
}

// -------------------------------------------------------------
// Deterministic pseudo-random helper for organic formations
// -------------------------------------------------------------
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// -------------------------------------------------------------
// 1. Raw Local Formation Offsets Generator
// Generates ideal (u, v) pairs for all 12 formations
// -------------------------------------------------------------
export function generateLocalFormationOffsets(
  formation: TacticalFormation, 
  count: number
): Array<{ u: number; v: number }> {
  const offsets: Array<{ u: number; v: number }> = [];

  switch (formation) {
    case 'line': {
      // Broad front ranks, up to 12 wide per rank
      const maxPerRank = Math.min(12, Math.max(4, Math.ceil(count / Math.ceil(count / 12))));
      for (let i = 0; i < count; i++) {
        const rank = Math.floor(i / maxPerRank);
        const col = i % maxPerRank;
        // Center the rank: 0, 1, -1, 2, -2, etc.
        const u = col % 2 === 0 ? Math.floor(col / 2) : -Math.ceil(col / 2);
        const v = rank;
        offsets.push({ u, v });
      }
      break;
    }

    case 'column': {
      // Narrow column moving forward, 2 units wide (or 1 if count <= 4)
      const width = count <= 4 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / width);
        const col = i % width;
        const u = width === 1 ? 0 : (col === 0 ? 0 : 1);
        const v = row;
        offsets.push({ u, v });
      }
      break;
    }

    case 'wedge': {
      // V-shaped arrow pointing forward (v=0 is apex)
      // Rank 0: (0, 0)
      // Rank 1: (-1, 1), (1, 1)
      // Rank 2: (-2, 2), (0, 2), (2, 2)
      // etc.
      let rank = 0;
      let placedInRank = 0;
      for (let i = 0; i < count; i++) {
        const rankUnits = rank + 1;
        const u = -rank + (placedInRank * 2);
        const v = rank;
        offsets.push({ u, v });
        placedInRank++;
        if (placedInRank >= rankUnits) {
          rank++;
          placedInRank = 0;
        }
      }
      break;
    }

    case 'square': {
      // Compact box of equal or near-equal width & depth
      const side = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / side);
        const col = i % side;
        const u = col - Math.floor(side / 2);
        const v = row - Math.floor(side / 2);
        offsets.push({ u, v });
      }
      break;
    }

    case 'circle': {
      // Concentric rings around center
      if (count === 1) {
        offsets.push({ u: 0, v: 0 });
        break;
      }
      // Center unit
      offsets.push({ u: 0, v: 0 });
      let currentRing = 1;
      let unitsPlaced = 1;

      while (unitsPlaced < count) {
        const radius = currentRing * 1.5;
        const unitsInThisRing = Math.min(count - unitsPlaced, Math.max(6, Math.round(currentRing * 6)));
        for (let j = 0; j < unitsInThisRing; j++) {
          const angle = (j / unitsInThisRing) * 2 * Math.PI;
          const u = Math.round(radius * Math.cos(angle));
          const v = Math.round(radius * Math.sin(angle));
          offsets.push({ u, v });
        }
        unitsPlaced += unitsInThisRing;
        currentRing++;
      }
      break;
    }

    case 'loose': {
      // Scattered irregular distribution with 1-2 cell spacing
      const used = new Set<string>();
      let i = 0;
      let radius = 1;
      while (offsets.length < count && radius < 25) {
        const attempts = 15;
        for (let a = 0; a < attempts && offsets.length < count; a++) {
          const angle = pseudoRandom(i * 3 + a) * 2 * Math.PI;
          const r = 0.5 + pseudoRandom(i * 7 + a) * radius;
          const u = Math.round(r * Math.cos(angle));
          const v = Math.round(r * Math.sin(angle));
          const key = `${u},${v}`;
          if (!used.has(key)) {
            used.add(key);
            offsets.push({ u, v });
          }
          i++;
        }
        radius += 0.8;
      }
      break;
    }

    case 'swarm': {
      // Dense packed organic blob around center
      const used = new Set<string>();
      offsets.push({ u: 0, v: 0 });
      used.add('0,0');
      let r = 1;
      while (offsets.length < count && r < 30) {
        for (let dx = -r; dx <= r && offsets.length < count; dx++) {
          for (let dy = -r; dy <= r && offsets.length < count; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= r + 1) {
              const key = `${dx},${dy}`;
              if (!used.has(key)) {
                used.add(key);
                offsets.push({ u: dx, v: dy });
              }
            }
          }
        }
        r++;
      }
      break;
    }

    case 'spread': {
      // Wide spacing (stride of 2)
      const cols = Math.max(4, Math.ceil(Math.sqrt(count * 1.5)));
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const u = (col - Math.floor(cols / 2)) * 2;
        const v = row * 2;
        offsets.push({ u, v });
      }
      break;
    }

    case 'defensive_line': {
      // Interlocking tight 2-rank shield wall
      const unitsPerRow = Math.ceil(count / 2);
      for (let i = 0; i < count; i++) {
        const rank = i % 2; // 0 = front, 1 = support
        const col = Math.floor(i / 2);
        // Stagger rank 1 between rank 0 units
        const offsetU = rank === 1 ? 0.5 : 0;
        const u = Math.round((col - Math.floor(unitsPerRow / 2)) + offsetU);
        const v = rank;
        offsets.push({ u, v });
      }
      break;
    }

    case 'archer_line': {
      // Staggered firing line with firing gaps (every 2 tiles)
      const unitsPerRow = Math.min(10, Math.ceil(count / 2));
      for (let i = 0; i < count; i++) {
        const rank = Math.floor(i / unitsPerRow);
        const col = i % unitsPerRow;
        const u = (col - Math.floor(unitsPerRow / 2)) * 2 + (rank % 2 === 1 ? 1 : 0);
        const v = rank * 2;
        offsets.push({ u, v });
      }
      break;
    }

    case 'wall': {
      // Heavy solid wall with 2 solid ranks
      const width = Math.max(4, Math.ceil(count / 2));
      for (let i = 0; i < count; i++) {
        const rank = Math.floor(i / width);
        const col = i % width;
        const u = col - Math.floor(width / 2);
        const v = rank;
        offsets.push({ u, v });
      }
      break;
    }

    case 'scattered': {
      // Broadly dispersed units over a wide area
      const used = new Set<string>();
      let seed = 42;
      let ring = 1;
      while (offsets.length < count && ring < 30) {
        for (let a = 0; a < 8 && offsets.length < count; a++) {
          const angle = pseudoRandom(seed++) * 2 * Math.PI;
          const dist = 2 + ring * 2 + pseudoRandom(seed++) * 3;
          const u = Math.round(dist * Math.cos(angle));
          const v = Math.round(dist * Math.sin(angle));
          const key = `${u},${v}`;
          if (!used.has(key)) {
            used.add(key);
            offsets.push({ u, v });
          }
        }
        ring++;
      }
      break;
    }

    default:
      // Fallback: grid
      for (let i = 0; i < count; i++) {
        offsets.push({ u: i % 5, v: Math.floor(i / 5) });
      }
      break;
  }

  return offsets.slice(0, count);
}

// -------------------------------------------------------------
// 2. Formation Engine: calculateFormationPositions
// Generates real grid coordinates respecting grid bounds,
// direction, obstacles, occupied cells and degradation
// -------------------------------------------------------------
export function calculateFormationPositions(params: CalculateFormationParams): FormationPosition[] {
  const {
    center,
    count,
    formation,
    direction = 'south',
    grid,
    occupiedCells = new Set<string>(),
    blockedCells = new Set<string>()
  } = params;

  if (count <= 0) return [];

  const rawOffsets = generateLocalFormationOffsets(formation, count);
  const assignedCells = new Set<string>();
  const results: FormationPosition[] = [];

  const isCellAvailable = (x: number, y: number): boolean => {
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return false;
    const key = `${x},${y}`;
    if (assignedCells.has(key)) return false;
    if (occupiedCells.has(key)) return false;
    if (blockedCells.has(key)) return false;
    return true;
  };

  // Function to find nearest valid cell via spiral search if ideal spot is blocked
  const findNearestFreeCell = (targetX: number, targetY: number): FormationPosition | null => {
    // Check target cell first
    if (isCellAvailable(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }

    // Spiral search outward
    const maxRadius = Math.max(grid.width, grid.height);
    for (let r = 1; r < maxRadius; r++) {
      // Scan square perimeter around targetX, targetY
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r) {
            const cx = targetX + dx;
            const cy = targetY + dy;
            if (isCellAvailable(cx, cy)) {
              return { x: cx, y: cy };
            }
          }
        }
      }
    }
    return null;
  };

  // Place each unit
  for (let i = 0; i < count; i++) {
    const local = rawOffsets[i] || { u: i % 10, v: Math.floor(i / 10) };
    const rotated = rotateOffset(local.u, local.v, direction);
    const candidateX = center.x + rotated.dx;
    const candidateY = center.y + rotated.dy;

    const freeCell = findNearestFreeCell(candidateX, candidateY);
    if (freeCell) {
      const key = `${freeCell.x},${freeCell.y}`;
      assignedCells.add(key);
      results.push(freeCell);
    } else {
      // Grid is completely full! Formation degradation stops here without falsifying count.
      break;
    }
  }

  return results;
}

// -------------------------------------------------------------
// 3. Find Available Spawn Cells & Spawn Sources
// -------------------------------------------------------------
export function findAvailableSpawnCells(params: {
  center?: FormationPosition;
  count: number;
  grid: GridDimensions;
  occupiedCells: Set<string>;
  blockedCells: Set<string>;
  spawnSource?: TacticalSpawnSource | string;
  placedObjects?: PlacedCombatObject[];
  direction?: TacticalDirection;
}): FormationPosition[] {
  const {
    count,
    grid,
    occupiedCells,
    blockedCells,
    spawnSource = 'point',
    placedObjects = [],
    direction = 'south'
  } = params;

  let origin = params.center || { x: Math.floor(grid.width / 2), y: Math.floor(grid.height / 2) };

  // Resolve spawn source position if specific source was named
  switch (spawnSource) {
    case 'forest_edge': {
      const forestObj = placedObjects.find(o => 
        (o.category || '').toLowerCase().includes('natur') || 
        o.name.toLowerCase().includes('wald') || 
        o.name.toLowerCase().includes('baum')
      );
      if (forestObj) {
        origin = { x: forestObj.x, y: forestObj.y };
      } else {
        // Fallback: top edge of map
        origin = { x: Math.floor(grid.width / 2), y: 1 };
      }
      break;
    }
    case 'map_edge': {
      // Put at edge matching direction or north edge
      if (direction === 'south') origin = { x: Math.floor(grid.width / 2), y: 1 };
      else if (direction === 'north') origin = { x: Math.floor(grid.width / 2), y: grid.height - 2 };
      else if (direction === 'east') origin = { x: 1, y: Math.floor(grid.height / 2) };
      else if (direction === 'west') origin = { x: grid.width - 2, y: Math.floor(grid.height / 2) };
      else origin = { x: Math.floor(grid.width / 2), y: 1 };
      break;
    }
    case 'building': {
      const building = placedObjects.find(o => 
        (o.category || '').toLowerCase().includes('gebäude') || 
        o.name.toLowerCase().includes('haus') ||
        o.name.toLowerCase().includes('festung')
      );
      if (building) {
        origin = { x: building.x, y: building.y };
      }
      break;
    }
    case 'ship': {
      const ship = placedObjects.find(o => 
        (o.category || '').toLowerCase().includes('schiff') || 
        (o.category || '').toLowerCase().includes('fahrzeug') || 
        o.name.toLowerCase().includes('schiff') ||
        o.name.toLowerCase().includes('boot')
      );
      if (ship) {
        origin = { x: ship.x, y: ship.y };
      }
      break;
    }
    case 'road': {
      // Center lane or middle horizontal road
      origin = { x: Math.floor(grid.width / 2), y: Math.floor(grid.height / 2) };
      break;
    }
    case 'around_entity':
    case 'point':
    case 'area':
    default:
      // Uses provided center or defaults
      break;
  }

  // Use formation engine loose as the default spawn cell seeker
  return calculateFormationPositions({
    center: origin,
    count,
    formation: 'loose',
    direction,
    grid,
    occupiedCells,
    blockedCells
  });
}

// -------------------------------------------------------------
// Helper: Collect occupied and blocked cells from CombatState
// -------------------------------------------------------------
export function collectOccupiedAndBlockedCells(combatState: CombatState): {
  occupied: Set<string>;
  blocked: Set<string>;
} {
  const occupied = new Set<string>();
  const blocked = new Set<string>();

  // 1. Existing character/token positions (player, companions, named NPCs)
  if (combatState.positions) {
    Object.values(combatState.positions).forEach(pos => {
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        occupied.add(`${pos.x},${pos.y}`);
      }
    });
  }

  // 2. Existing tactical entities
  if (combatState.tacticalEntities) {
    Object.values(combatState.tacticalEntities).forEach(entity => {
      if (entity?.position) {
        occupied.add(`${entity.position.x},${entity.position.y}`);
      }
    });
  }

  // 3. Placed objects that block passage (walls, heavy obstacles, closed doors)
  if (combatState.placedObjects) {
    combatState.placedObjects.forEach(obj => {
      const cat = (obj.category || '').toLowerCase();
      const name = (obj.name || '').toLowerCase();
      const rules = (obj.rules || '').toLowerCase();

      const isBlocker = 
        rules.includes('blockiert') ||
        cat.includes('barriere') ||
        cat.includes('hindernis') ||
        name.includes('wand') ||
        name.includes('mauer') ||
        name.includes('eisentür') ||
        name.includes('lavariß') ||
        name.includes('felswand');

      if (isBlocker) {
        blocked.add(`${obj.x},${obj.y}`);
      }
    });
  }

  // 4. Non-walkable terrain tiles (e.g. deep water, chasms, lava)
  if (combatState.tiles) {
    Object.entries(combatState.tiles).forEach(([key, tileType]) => {
      const t = (tileType || '').toLowerCase();
      if (t.includes('water') || t.includes('lava') || t.includes('chasm') || t.includes('wall')) {
        blocked.add(key);
      }
    });
  }

  return { occupied, blocked };
}

// -------------------------------------------------------------
// 4. Central Spawn Function: spawnTacticalGroup
// -------------------------------------------------------------
export function spawnTacticalGroup(params: SpawnTacticalGroupParams): {
  group: TacticalGroup;
  entities: TacticalEntity[];
  requestedCount: number;
  spawnedCount: number;
  updatedCombatState: CombatState;
} {
  const {
    combatState,
    groupName,
    count,
    unitDisplayName,
    factionId,
    unitType = 'infantry',
    formation = 'loose',
    direction = 'south',
    spawnSource = 'point',
    sourcePosition,
    existingCharacterIds = [],
    baseHp = 100,
    behavior = 'aggressive'
  } = params;

  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;
  const grid: GridDimensions = { width: gridWidth, height: gridHeight };

  // Determine spawn center
  let center = sourcePosition;
  if (!center) {
    if (direction === 'south') {
      center = { x: Math.floor(gridWidth / 2), y: Math.max(1, Math.floor(gridHeight * 0.2)) };
    } else if (direction === 'north') {
      center = { x: Math.floor(gridWidth / 2), y: Math.min(gridHeight - 2, Math.floor(gridHeight * 0.8)) };
    } else {
      center = { x: Math.floor(gridWidth * 0.7), y: Math.floor(gridHeight / 2) };
    }
  }

  // Collect occupied and blocked cells
  const { occupied, blocked } = collectOccupiedAndBlockedCells(combatState);

  // Calculate formation positions
  const positions = calculateFormationPositions({
    center,
    count,
    formation,
    direction,
    grid,
    occupiedCells: occupied,
    blockedCells: blocked
  });

  const spawnedCount = positions.length;

  // Create or reuse group ID
  const cleanName = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const finalGroupId = params.groupId || `group_${cleanName}_${Date.now().toString(36)}`;

  const entities: TacticalEntity[] = [];
  const unitIds: string[] = [];

  for (let i = 0; i < spawnedCount; i++) {
    const pos = positions[i];
    const existingCharId = existingCharacterIds[i];

    // Stable, unique ID for every tactical entity
    const entityId = existingCharId ? `tactical_${existingCharId}` : `tactical_${cleanName}_${(i + 1).toString().padStart(3, '0')}_${Date.now().toString(36).substr(-4)}`;
    const displayName = unitDisplayName || groupName.replace(/\s+\d+$/, '');

    const entity: TacticalEntity = {
      id: entityId,
      displayName,
      groupId: finalGroupId,
      factionId,
      unitType,
      position: pos,
      anonymous: !existingCharId,
      worldEntityId: existingCharId,
      hp: baseHp,
      maxHp: baseHp,
      morale: 100,
      movementPoints: 3,
      actionPoints: 1,
      assignedSlotIndex: i,
      status: []
    };

    entities.push(entity);
    unitIds.push(entityId);
  }

  const group: TacticalGroup = {
    id: finalGroupId,
    name: groupName,
    factionId,
    unitIds,
    formation,
    direction,
    requestedCount: count,
    spawnedCount,
    spawnSource,
    center,
    behavior,
    active: true,
    morale: 100
  };

  // Immutable update of CombatState
  const nextEntities = { ...(combatState.tacticalEntities || {}) };
  entities.forEach(e => {
    nextEntities[e.id] = e;
  });

  const nextGroups = { ...(combatState.tacticalGroups || {}) };
  nextGroups[group.id] = group;

  const updatedCombatState: CombatState = {
    ...combatState,
    gridWidth,
    gridHeight,
    tacticalMode: true,
    tacticalEntities: nextEntities,
    tacticalGroups: nextGroups
  };

  return {
    group,
    entities,
    requestedCount: count,
    spawnedCount,
    updatedCombatState
  };
}

// -------------------------------------------------------------
// 5. Change Formation of an Existing Group
// Note: Entity IDs DO NOT change! Only positions and group metadata.
// -------------------------------------------------------------
export function changeTacticalGroupFormation(params: ChangeFormationParams): {
  updatedGroup: TacticalGroup;
  updatedEntities: Record<string, TacticalEntity>;
  updatedCombatState: CombatState;
} {
  const { combatState, groupId, newFormation, newDirection, targetCenter } = params;

  const group = combatState.tacticalGroups?.[groupId];
  if (!group) {
    throw new Error(`TacticalGroup with id "${groupId}" not found.`);
  }

  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;
  const grid: GridDimensions = { width: gridWidth, height: gridHeight };

  const currentEntities = combatState.tacticalEntities || {};
  const groupEntities = group.unitIds.map(id => currentEntities[id]).filter(Boolean) as TacticalEntity[];

  if (groupEntities.length === 0) {
    return {
      updatedGroup: { ...group, formation: newFormation, direction: newDirection || group.direction },
      updatedEntities: currentEntities,
      updatedCombatState: combatState
    };
  }

  // Calculate current centroid if no targetCenter provided
  const center: FormationPosition = targetCenter || (() => {
    const sumX = groupEntities.reduce((acc, e) => acc + e.position.x, 0);
    const sumY = groupEntities.reduce((acc, e) => acc + e.position.y, 0);
    return {
      x: Math.round(sumX / groupEntities.length),
      y: Math.round(sumY / groupEntities.length)
    };
  })();

  const direction = newDirection || group.direction || 'south';

  // For collision checking: exclude units from THIS group so they can occupy each other's old spots
  const { occupied, blocked } = collectOccupiedAndBlockedCells(combatState);
  groupEntities.forEach(e => {
    occupied.delete(`${e.position.x},${e.position.y}`);
  });

  // Calculate new formation positions
  const newPositions = calculateFormationPositions({
    center,
    count: groupEntities.length,
    formation: newFormation,
    direction,
    grid,
    occupiedCells: occupied,
    blockedCells: blocked
  });

  // Re-assign positions to existing entities WITHOUT changing their IDs
  const nextEntities = { ...currentEntities };
  groupEntities.forEach((entity, idx) => {
    const newPos = newPositions[idx] || entity.position;
    nextEntities[entity.id] = {
      ...entity,
      position: newPos,
      assignedSlotIndex: idx
    };
  });

  const updatedGroup: TacticalGroup = {
    ...group,
    formation: newFormation,
    direction,
    center,
    spawnedCount: groupEntities.length
  };

  const nextGroups = {
    ...(combatState.tacticalGroups || {}),
    [groupId]: updatedGroup
  };

  const updatedCombatState: CombatState = {
    ...combatState,
    tacticalEntities: nextEntities,
    tacticalGroups: nextGroups
  };

  return {
    updatedGroup,
    updatedEntities: nextEntities,
    updatedCombatState
  };
}

// -------------------------------------------------------------
// 6. Split a Tactical Group
// Note: Entity IDs are preserved! Units are cleanly migrated.
// -------------------------------------------------------------
export function splitTacticalGroup(params: SplitGroupParams): {
  sourceGroup: TacticalGroup;
  newGroup: TacticalGroup;
  updatedCombatState: CombatState;
} {
  const {
    combatState,
    sourceGroupId,
    targetUnitIds,
    countToSplit,
    newGroupName,
    newFormation,
    newDirection,
    newCenter
  } = params;

  const sourceGroup = combatState.tacticalGroups?.[sourceGroupId];
  if (!sourceGroup) {
    throw new Error(`Source TacticalGroup "${sourceGroupId}" not found.`);
  }

  const currentEntities = combatState.tacticalEntities || {};
  let idsToMove: string[] = [];

  if (targetUnitIds && targetUnitIds.length > 0) {
    idsToMove = targetUnitIds.filter(id => sourceGroup.unitIds.includes(id));
  } else if (countToSplit && countToSplit > 0) {
    const num = Math.min(countToSplit, sourceGroup.unitIds.length - 1);
    idsToMove = sourceGroup.unitIds.slice(-num);
  }

  if (idsToMove.length === 0) {
    return {
      sourceGroup,
      newGroup: sourceGroup,
      updatedCombatState: combatState
    };
  }

  const newGroupId = `group_${newGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
  const remainingIds = sourceGroup.unitIds.filter(id => !idsToMove.includes(id));

  // Update entities to point to new groupId
  const nextEntities = { ...currentEntities };
  idsToMove.forEach(id => {
    if (nextEntities[id]) {
      nextEntities[id] = {
        ...nextEntities[id],
        groupId: newGroupId
      };
    }
  });

  const updatedSourceGroup: TacticalGroup = {
    ...sourceGroup,
    unitIds: remainingIds,
    spawnedCount: remainingIds.length
  };

  const newGroup: TacticalGroup = {
    id: newGroupId,
    name: newGroupName,
    factionId: sourceGroup.factionId,
    unitIds: idsToMove,
    formation: newFormation || sourceGroup.formation,
    direction: newDirection || sourceGroup.direction,
    requestedCount: idsToMove.length,
    spawnedCount: idsToMove.length,
    active: true,
    morale: sourceGroup.morale,
    center: newCenter || sourceGroup.center
  };

  let finalCombatState: CombatState = {
    ...combatState,
    tacticalEntities: nextEntities,
    tacticalGroups: {
      ...(combatState.tacticalGroups || {}),
      [sourceGroupId]: updatedSourceGroup,
      [newGroupId]: newGroup
    }
  };

  // If a new formation / center was specified for the split group, reposition its units
  if (newFormation || newCenter) {
    const res = changeTacticalGroupFormation({
      combatState: finalCombatState,
      groupId: newGroupId,
      newFormation: newGroup.formation || 'loose',
      newDirection: newGroup.direction,
      targetCenter: newCenter
    });
    finalCombatState = res.updatedCombatState;
  }

  return {
    sourceGroup: updatedSourceGroup,
    newGroup,
    updatedCombatState: finalCombatState
  };
}

// -------------------------------------------------------------
// 7. Validate Tactical State (Verification / Tests)
// -------------------------------------------------------------
export function validateTacticalState(combatState: CombatState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;

  const entities = combatState.tacticalEntities || {};
  const groups = combatState.tacticalGroups || {};

  const seenEntityIds = new Set<string>();
  const occupiedCells = new Map<string, string>(); // "x,y" -> entityId

  // 1. Check entities
  Object.values(entities).forEach(e => {
    // Unique IDs
    if (seenEntityIds.has(e.id)) {
      errors.push(`Duplicate TacticalEntity id found: "${e.id}"`);
    }
    seenEntityIds.add(e.id);

    // Raster boundaries (0 <= x < gridWidth, 0 <= y < gridHeight)
    if (e.position.x < 0 || e.position.x >= gridWidth) {
      errors.push(`Entity "${e.id}" position X out of bounds: ${e.position.x} (gridWidth: ${gridWidth})`);
    }
    if (e.position.y < 0 || e.position.y >= gridHeight) {
      errors.push(`Entity "${e.id}" position Y out of bounds: ${e.position.y} (gridHeight: ${gridHeight})`);
    }

    // Cell collisions: no two tactical entities on the exact same tile
    const cellKey = `${e.position.x},${e.position.y}`;
    if (occupiedCells.has(cellKey)) {
      errors.push(`Collision: Entity "${e.id}" and "${occupiedCells.get(cellKey)}" share cell (${cellKey})`);
    } else {
      occupiedCells.set(cellKey, e.id);
    }

    // Valid group reference
    if (e.groupId && !groups[e.groupId]) {
      errors.push(`Entity "${e.id}" references non-existent groupId "${e.groupId}"`);
    }
  });

  // 2. Check groups
  Object.values(groups).forEach(g => {
    // Check orphaned unitIds
    g.unitIds.forEach(uId => {
      if (!entities[uId]) {
        errors.push(`Group "${g.id}" has orphaned unitId "${uId}" that does not exist in tacticalEntities`);
      }
    });

    // Check count sync
    if (g.spawnedCount !== undefined && g.spawnedCount !== g.unitIds.length) {
      errors.push(`Group "${g.id}" spawnedCount (${g.spawnedCount}) does not match unitIds length (${g.unitIds.length})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// -------------------------------------------------------------
// 8. Multi-Force Tactical Relations & Helpers
// -------------------------------------------------------------

/**
 * Resolves the relation between two forces, factions, or groups.
 * Supports getForceRelation(fromId, toId, relations) and getForceRelation(combatState, fromId, toId).
 */
export function getForceRelation(
  arg1: string | CombatState,
  arg2: string,
  arg3?: BattleParticipantRelation[] | string,
  arg4?: 'ally' | 'hostile' | 'neutral' | 'disputed'
): 'ally' | 'hostile' | 'neutral' | 'disputed' {
  let fromId: string;
  let toId: string;
  let relations: BattleParticipantRelation[] = [];
  let defaultRelation: 'ally' | 'hostile' | 'neutral' | 'disputed' = 'hostile';

  if (typeof arg1 === 'object' && arg1 !== null && 'isCombatActive' in arg1) {
    relations = (arg1 as CombatState).participantRelations || [];
    fromId = arg2;
    toId = typeof arg3 === 'string' ? arg3 : '';
    if (arg4) defaultRelation = arg4;
  } else {
    fromId = typeof arg1 === 'string' ? arg1 : '';
    toId = arg2;
    if (Array.isArray(arg3)) relations = arg3;
    if (arg4) defaultRelation = arg4;
  }

  if (!fromId || !toId) return defaultRelation;
  if (fromId === toId) return 'ally';

  // Check direct relation
  const direct = relations.find(
    r => (r.fromForceId === fromId && r.toForceId === toId) ||
         (r.fromForceId === toId && r.toForceId === fromId)
  );
  if (direct) return direct.relation;

  // Check aliases / prefixes (e.g. 'player' or faction names)
  const normFrom = fromId.toLowerCase().trim();
  const normTo = toId.toLowerCase().trim();
  if (normFrom === normTo) return 'ally';

  return defaultRelation;
}

/**
 * Checks whether two forces/groups are hostile to each other.
 * Supports areForcesHostile(fromId, toId, relations) and areForcesHostile(combatState, fromId, toId).
 */
export function areForcesHostile(
  arg1: string | CombatState,
  arg2: string,
  arg3?: BattleParticipantRelation[] | string
): boolean {
  if (typeof arg1 === 'object' && arg1 !== null) {
    const rel = getForceRelation(arg1, arg2, arg3 as string);
    return rel === 'hostile' || rel === 'disputed';
  } else {
    const rel = getForceRelation(arg1, arg2, arg3 as BattleParticipantRelation[]);
    return rel === 'hostile' || rel === 'disputed';
  }
}

/**
 * Checks whether two forces/groups are allied with each other.
 * Supports areForcesAllied(fromId, toId, relations) and areForcesAllied(combatState, fromId, toId).
 */
export function areForcesAllied(
  arg1: string | CombatState,
  arg2: string,
  arg3?: BattleParticipantRelation[] | string
): boolean {
  if (typeof arg1 === 'object' && arg1 !== null) {
    const rel = getForceRelation(arg1, arg2, arg3 as string, 'ally');
    return rel === 'ally';
  } else {
    const rel = getForceRelation(arg1, arg2, arg3 as BattleParticipantRelation[], 'ally');
    return rel === 'ally';
  }
}

export interface TargetValidationResult {
  allowed: boolean;
  reason?: 'self' | 'same_group' | 'allied' | 'neutral' | 'invalid_target';
}

/**
 * Validates whether an attacker entity can target/attack another entity on the tactical grid.
 * Supports canTargetEntity(attacker, target, combatState) and canTargetEntity(combatState, attackerId, targetId).
 */
export function canTargetEntity(
  arg1: TacticalEntity | string | CombatState,
  arg2: TacticalEntity | string,
  arg3?: CombatState | string
): TargetValidationResult & { valueOf: () => boolean; toString: () => string } {
  let attacker: TacticalEntity | null = null;
  let target: TacticalEntity | null = null;
  let combatState: CombatState | null = null;

  if (typeof arg1 === 'object' && arg1 !== null && 'isCombatActive' in arg1) {
    combatState = arg1 as CombatState;
    const attackerId = typeof arg2 === 'string' ? arg2 : arg2?.id;
    const targetId = typeof arg3 === 'string' ? arg3 : (arg3 as any)?.id;
    attacker = combatState.tacticalEntities?.[attackerId] || null;
    target = combatState.tacticalEntities?.[targetId] || null;
  } else {
    combatState = (typeof arg3 === 'object' && arg3 !== null && 'isCombatActive' in arg3) ? (arg3 as CombatState) : null;
    if (combatState) {
      const attackerId = typeof arg1 === 'string' ? arg1 : (arg1 && typeof arg1 === 'object' && 'id' in arg1 ? arg1.id : '');
      const targetId = typeof arg2 === 'string' ? arg2 : (arg2 && typeof arg2 === 'object' && 'id' in arg2 ? arg2.id : '');
      attacker = combatState.tacticalEntities?.[attackerId] || (typeof arg1 === 'object' && 'position' in arg1 ? arg1 as TacticalEntity : null);
      target = combatState.tacticalEntities?.[targetId] || (typeof arg2 === 'object' && 'position' in arg2 ? arg2 as TacticalEntity : null);
    } else {
      attacker = typeof arg1 === 'object' && 'position' in arg1 ? arg1 as TacticalEntity : null;
      target = typeof arg2 === 'object' && 'position' in arg2 ? arg2 as TacticalEntity : null;
    }
  }

  const makeRes = (allowed: boolean, reason?: 'self' | 'same_group' | 'allied' | 'neutral' | 'invalid_target') => {
    return Object.assign(
      { allowed, reason },
      {
        valueOf: () => allowed,
        toString: () => String(allowed)
      }
    );
  };

  if (!attacker || !target) {
    return makeRes(false, 'invalid_target');
  }
  if (attacker.id === target.id) {
    return makeRes(false, 'self');
  }

  const groups = combatState?.tacticalGroups || {};
  const attackerGroup = attacker.groupId ? groups[attacker.groupId] : null;
  const targetGroup = target.groupId ? groups[target.groupId] : null;

  // Same group is always allied
  if (attacker.groupId && target.groupId && attacker.groupId === target.groupId) {
    return makeRes(false, 'same_group');
  }

  // Check group sourceType
  if (attackerGroup?.sourceType === 'player' && targetGroup?.sourceType === 'player') {
    return makeRes(false, 'allied');
  }
  if (attackerGroup?.sourceType === 'player' && targetGroup?.sourceType === 'ally') {
    return makeRes(false, 'allied');
  }
  if (attackerGroup?.sourceType === 'ally' && targetGroup?.sourceType === 'player') {
    return makeRes(false, 'allied');
  }

  const relations = combatState?.participantRelations || [];

  // Determine force/faction keys to check
  const attackerKey = attackerGroup?.encounterForceId || attacker.factionId || attacker.groupId || attacker.id;
  const targetKey = targetGroup?.encounterForceId || target.factionId || target.groupId || target.id;

  const relation = getForceRelation(attackerKey, targetKey, relations, 'hostile');
  if (relation === 'ally') {
    return makeRes(false, 'allied');
  }
  if (relation === 'neutral') {
    return makeRes(false, 'neutral');
  }

  return makeRes(true);
}

/**
 * Calculates distinct, non-overlapping spawn centers and facing directions for multiple tactical groups.
 */
export function calculateMultiGroupSpawnPositions(
  groupsCount: number,
  gridWidth: number = 30,
  gridHeight: number = 20
): Array<{ center: FormationPosition; direction: TacticalDirection; name?: string }> {
  const positions: Array<{ center: FormationPosition; direction: TacticalDirection }> = [];

  const defaultLocations: Array<{ center: FormationPosition; direction: TacticalDirection }> = [
    // South / Player & Allies
    { center: { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight * 0.8) }, direction: 'north' },
    // North / Main Enemy Force
    { center: { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight * 0.2) }, direction: 'south' },
    // East / Flanking Force 1
    { center: { x: Math.floor(gridWidth * 0.8), y: Math.floor(gridHeight * 0.35) }, direction: 'west' },
    // West / Flanking Force 2
    { center: { x: Math.floor(gridWidth * 0.2), y: Math.floor(gridHeight * 0.35) }, direction: 'east' },
    // North-East / Secondary Enemy Group
    { center: { x: Math.floor(gridWidth * 0.75), y: Math.floor(gridHeight * 0.15) }, direction: 'south' },
    // North-West / Secondary Enemy Group
    { center: { x: Math.floor(gridWidth * 0.25), y: Math.floor(gridHeight * 0.15) }, direction: 'south' },
    // South-East / Allied Reinforcements
    { center: { x: Math.floor(gridWidth * 0.8), y: Math.floor(gridHeight * 0.75) }, direction: 'north' },
    // South-West / Allied Reinforcements
    { center: { x: Math.floor(gridWidth * 0.2), y: Math.floor(gridHeight * 0.75) }, direction: 'north' }
  ];

  for (let i = 0; i < groupsCount; i++) {
    if (i < defaultLocations.length) {
      positions.push(defaultLocations[i]);
    } else {
      // Dynamic fallback distribution
      const angle = (i / groupsCount) * 2 * Math.PI;
      const radiusX = Math.floor(gridWidth * 0.35);
      const radiusY = Math.floor(gridHeight * 0.35);
      const cx = Math.max(2, Math.min(gridWidth - 3, Math.floor(gridWidth / 2 + Math.cos(angle) * radiusX)));
      const cy = Math.max(2, Math.min(gridHeight - 3, Math.floor(gridHeight / 2 + Math.sin(angle) * radiusY)));
      const dir: TacticalDirection = cy > gridHeight / 2 ? 'north' : 'south';
      positions.push({ center: { x: cx, y: cy }, direction: dir });
    }
  }

  return positions;
}

// Re-export Movement and Pathfinding Engine functions
export {
  findPath,
  getTerrainMovementCost,
  deriveDirectionFromVector,
  moveTacticalEntity,
  moveTacticalGroup,
  executeTacticalCommand,
  processTacticalCommandQueue,
  parseTacticalCommandsFromText
} from './tacticalMovementEngine';
export type {
  FindPathParams,
  PathResult,
  MoveEntityParams,
  MoveEntityResult,
  MoveGroupParams,
  MoveGroupResult,
  ExecuteCommandResult
} from './tacticalMovementEngine';
