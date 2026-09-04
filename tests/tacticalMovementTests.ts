import { CombatState } from '../types';
import {
  spawnTacticalGroup,
  splitTacticalGroup,
  validateTacticalState
} from '../utils/tacticalEngine';
import {
  findPath,
  moveTacticalEntity,
  moveTacticalGroup,
  executeTacticalCommand
} from '../utils/tacticalMovementEngine';

function runTests() {
  console.log('=== RUNNING TACTICAL MOVEMENT & PATHFINDING TEST SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, details || '');
    }
  }

  // Initial base state
  const baseCombatState: CombatState = {
    isCombatActive: true,
    selectedEnemyId: '',
    customEnemyName: '',
    opponents: [],
    playerHp: 100,
    playerMaxHp: 100,
    playerMp: 100,
    playerMaxMp: 100,
    enemyHp: 100,
    enemyMaxHp: 100,
    combatSubMenu: 'main',
    gridWidth: 30,
    gridHeight: 20,
    tacticalMode: true,
    tacticalEntities: {},
    tacticalGroups: {},
    tacticalCommands: []
  };

  // -------------------------------------------------------------
  // Test 1: 1 Entity A -> B
  // -------------------------------------------------------------
  console.log('\n--- Test 1: 1 Entity A -> B ---');
  const spawn1 = spawnTacticalGroup({
    combatState: baseCombatState,
    groupName: 'Hero Scout',
    count: 1,
    sourcePosition: { x: 2, y: 2 }
  });
  const entity1Id = spawn1.group.unitIds[0];
  const move1 = moveTacticalEntity({
    combatState: spawn1.updatedCombatState,
    entityId: entity1Id,
    targetPosition: { x: 10, y: 10 }
  });
  assert(move1.success === true, 'Test 1: Move single entity succeeds');
  assert(move1.entity?.position.x === 10 && move1.entity?.position.y === 10, 'Test 1: Entity reached target (10, 10)');
  assert((move1.path?.length || 0) > 1, 'Test 1: Path array populated');

  // -------------------------------------------------------------
  // Test 2: 10 Entities in Formation
  // -------------------------------------------------------------
  console.log('\n--- Test 2: 10 Entities in Formation ---');
  const spawn2 = spawnTacticalGroup({
    combatState: baseCombatState,
    groupName: 'Squad 10',
    count: 10,
    sourcePosition: { x: 4, y: 4 },
    formation: 'line'
  });
  const group2Id = spawn2.group.id;
  const move2 = moveTacticalGroup({
    combatState: spawn2.updatedCombatState,
    groupId: group2Id,
    targetPosition: { x: 16, y: 12 }
  });
  assert(move2.success === true, 'Test 2: Move group with 10 entities succeeds');
  assert(move2.movedCount === 10, 'Test 2: All 10 entities moved');
  // Check unique positions
  const posSet2 = new Set<string>();
  spawn2.group.unitIds.forEach(id => {
    const e = move2.updatedCombatState.tacticalEntities?.[id];
    if (e) posSet2.add(`${e.position.x},${e.position.y}`);
  });
  assert(posSet2.size === 10, 'Test 2: All 10 entities occupy unique cells');

  // -------------------------------------------------------------
  // Test 3: 50 Goblins Scenario
  // -------------------------------------------------------------
  console.log('\n--- Test 3: 50 Goblins Scenario ---');
  const spawn3 = spawnTacticalGroup({
    combatState: baseCombatState,
    groupName: '50 Goblins Horde',
    count: 50,
    sourcePosition: { x: 5, y: 5 },
    formation: 'swarm'
  });
  const group3Id = spawn3.group.id;
  assert(spawn3.group.unitIds.length === 50, 'Test 3: Exactly 50 goblins spawned');

  const move3 = moveTacticalGroup({
    combatState: spawn3.updatedCombatState,
    groupId: group3Id,
    targetPosition: { x: 22, y: 14 }
  });
  assert(move3.success === true, 'Test 3: 50 goblins move successfully');
  assert(move3.movedCount === 50, 'Test 3: All 50 goblins moved');
  assert(move3.blockedCount === 0, 'Test 3: Zero goblins blocked');

  const posSet3 = new Set<string>();
  spawn3.group.unitIds.forEach(id => {
    const e = move3.updatedCombatState.tacticalEntities?.[id];
    if (e) posSet3.add(`${e.position.x},${e.position.y}`);
  });
  assert(posSet3.size === 50, 'Test 3: All 50 goblins occupy unique cells (no collisions)');

  // -------------------------------------------------------------
  // Test 4: Obstacle in Direct Path
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Obstacle in Direct Path ---');
  // Build a vertical wall from y=1 to y=6 at x=5
  const blockedWall = new Set<string>();
  for (let y = 1; y <= 6; y++) {
    blockedWall.add(`5,${y}`);
  }
  const pathObstacle = findPath({
    start: { x: 2, y: 3 },
    target: { x: 8, y: 3 },
    grid: { width: 30, height: 20 },
    blockedCells: blockedWall
  });
  assert(pathObstacle.success === true, 'Test 4: A* routes around obstacle wall');
  const intersectsWall = pathObstacle.path.some(p => blockedWall.has(`${p.x},${p.y}`));
  assert(!intersectsWall, 'Test 4: Path does not step on any blocked cell');
  assert(pathObstacle.path.length > 7, 'Test 4: Path length reflects bypass route');

  // -------------------------------------------------------------
  // Test 5: Completely Blocked Path (No Path)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Completely Blocked Path ---');
  // Enclose target (10, 10) with impassable wall
  const enclosedWall = new Set<string>();
  for (let x = 9; x <= 11; x++) {
    for (let y = 9; y <= 11; y++) {
      if (x !== 10 || y !== 10) {
        enclosedWall.add(`${x},${y}`);
      }
    }
  }
  const blockedPath = findPath({
    start: { x: 2, y: 2 },
    target: { x: 10, y: 10 },
    grid: { width: 30, height: 20 },
    blockedCells: enclosedWall
  });
  assert(blockedPath.success === false, 'Test 5: Returns false for completely boxed target');
  assert(blockedPath.reason === 'NO_PATH', 'Test 5: Reason is NO_PATH');
  assert(blockedPath.path.length === 0, 'Test 5: Path is empty, no teleportation');

  // -------------------------------------------------------------
  // Test 6: 30 x 20 Grid
  // -------------------------------------------------------------
  console.log('\n--- Test 6: 30 x 20 Grid ---');
  const path30x20 = findPath({
    start: { x: 0, y: 0 },
    target: { x: 29, y: 19 },
    grid: { width: 30, height: 20 }
  });
  assert(path30x20.success === true, 'Test 6: Traverses 30x20 grid corner to corner');
  assert(path30x20.path[0].x === 0 && path30x20.path[0].y === 0, 'Test 6: Starts at (0, 0)');
  assert(path30x20.path[path30x20.path.length - 1].x === 29 && path30x20.path[path30x20.path.length - 1].y === 19, 'Test 6: Ends at (29, 19)');

  // -------------------------------------------------------------
  // Test 7: 20 x 20 Grid (Agnostic Grid Dimensions)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: 20 x 20 Grid (Agnostic Dimensions) ---');
  const path20x20 = findPath({
    start: { x: 0, y: 0 },
    target: { x: 19, y: 19 },
    grid: { width: 20, height: 20 }
  });
  assert(path20x20.success === true, 'Test 7: Traverses 20x20 grid');
  // Check out of bounds on 20x20 when target is 25
  const oobPath = findPath({
    start: { x: 0, y: 0 },
    target: { x: 25, y: 10 },
    grid: { width: 20, height: 20 }
  });
  assert(oobPath.success === false && oobPath.reason === 'OUT_OF_BOUNDS', 'Test 7: Out-of-bounds rejected on 20x20');

  // -------------------------------------------------------------
  // Test 8: Formation + Movement
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Formation + Movement ---');
  const spawn8 = spawnTacticalGroup({
    combatState: baseCombatState,
    groupName: 'Wedge Vanguard',
    count: 15,
    sourcePosition: { x: 5, y: 5 },
    formation: 'wedge'
  });
  const move8 = moveTacticalGroup({
    combatState: spawn8.updatedCombatState,
    groupId: spawn8.group.id,
    targetPosition: { x: 20, y: 15 },
    formation: 'wedge'
  });
  assert(move8.success === true, 'Test 8: Group moves with wedge formation');
  assert(move8.movedCount === 15, 'Test 8: All 15 units moved');
  const updatedGroup8 = move8.updatedCombatState.tacticalGroups?.[spawn8.group.id];
  assert(updatedGroup8?.formation === 'wedge', 'Test 8: Group formation remains wedge');
  assert(updatedGroup8?.center?.x === 20 && updatedGroup8?.center?.y === 15, 'Test 8: Group center updated to (20, 15)');

  // -------------------------------------------------------------
  // Test 9: 50 Goblins + Bottleneck (Degradation)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: 50 Goblins + Bottleneck ---');
  // Canyon wall at x=12 with 2-cell bottleneck at y=9,10
  const tightBlocked = new Set<string>();
  for (let y = 0; y < 20; y++) {
    if (y !== 9 && y !== 10) {
      tightBlocked.add(`12,${y}`);
    }
  }
  // Also restrict destination area around (20, 10) so only 35 spots are free
  for (let x = 16; x < 30; x++) {
    for (let y = 0; y < 20; y++) {
      // Leave open a 6x6 room around (20, 10) -> exactly 36 cells, plus doorway at y=10
      const inRoom = x >= 18 && x <= 23 && y >= 8 && y <= 13;
      const isDoorway = (x === 16 || x === 17) && (y === 9 || y === 10);
      if (!inRoom && !isDoorway && x > 15) {
        tightBlocked.add(`${x},${y}`);
      }
    }
  }

  // Group of 50 moving to pocket
  const spawn9 = spawnTacticalGroup({
    combatState: {
      ...baseCombatState,
      gridWidth: 30,
      gridHeight: 20
    },
    groupName: 'Bottleneck Goblins',
    count: 50,
    sourcePosition: { x: 5, y: 10 }
  });

  // Put blocked cells into placedObjects
  const bottleneckState: CombatState = {
    ...spawn9.updatedCombatState,
    placedObjects: Array.from(tightBlocked).map((key, i) => {
      const [bx, by] = key.split(',').map(Number);
      return {
        id: `wall_${i}`,
        name: 'Felswand',
        icon: 'mountain',
        category: 'barriere',
        description: 'Blockierende Wand',
        rules: 'blockiert',
        x: bx,
        y: by
      };
    })
  };

  const move9 = moveTacticalGroup({
    combatState: bottleneckState,
    groupId: spawn9.group.id,
    targetPosition: { x: 20, y: 10 }
  });

  assert(move9.success === true, 'Test 9: Group handles bottleneck gracefully');
  // Verify all moved units have unique positions
  const posSet9 = new Set<string>();
  let totalEntities9 = 0;
  spawn9.group.unitIds.forEach(id => {
    const e = move9.updatedCombatState.tacticalEntities?.[id];
    if (e) {
      totalEntities9++;
      posSet9.add(`${e.position.x},${e.position.y}`);
    }
  });
  assert(totalEntities9 === 50, 'Test 9: Exactly 50 entity IDs preserved');
  assert(posSet9.size === 50, 'Test 9: Zero coordinate collisions among all 50 units');
  console.log(`Test 9 Stats: Moved=${move9.movedCount}, Blocked=${move9.blockedCount}, Reason=${move9.reason}`);

  // -------------------------------------------------------------
  // Test 10: Group Split -> Movement
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Group Split -> Movement ---');
  const spawn10 = spawnTacticalGroup({
    combatState: baseCombatState,
    groupName: 'Horde Prime',
    count: 50,
    sourcePosition: { x: 10, y: 10 }
  });

  const split10 = splitTacticalGroup({
    combatState: spawn10.updatedCombatState,
    sourceGroupId: spawn10.group.id,
    countToSplit: 20,
    newGroupName: 'Flank detachment',
    newCenter: { x: 10, y: 4 }
  });

  assert(split10.sourceGroup.unitIds.length === 30, 'Test 10: Source group retains 30 units');
  assert(split10.newGroup.unitIds.length === 20, 'Test 10: Flank group has 20 units');

  // Verify group integrity
  const integrity = validateTacticalState(split10.updatedCombatState);
  assert(integrity.valid === true, 'Test 10: Post-split integrity check passed');

  // Move source group to (25, 15)
  const move10Source = moveTacticalGroup({
    combatState: split10.updatedCombatState,
    groupId: split10.sourceGroup.id,
    targetPosition: { x: 25, y: 15 }
  });
  assert(move10Source.success === true, 'Test 10: Main group moves to (25, 15)');

  // Move flank group to (25, 3)
  const move10Flank = moveTacticalGroup({
    combatState: move10Source.updatedCombatState,
    groupId: split10.newGroup.id,
    targetPosition: { x: 25, y: 3 }
  });
  assert(move10Flank.success === true, 'Test 10: Flank group moves to (25, 3)');

  // Ensure all 50 units are unique across both groups
  const allPos10 = new Set<string>();
  [...split10.sourceGroup.unitIds, ...split10.newGroup.unitIds].forEach(id => {
    const e = move10Flank.updatedCombatState.tacticalEntities?.[id];
    if (e) allPos10.add(`${e.position.x},${e.position.y}`);
  });
  assert(allPos10.size === 50, 'Test 10: All 50 units across both split groups occupy unique cells');

  // -------------------------------------------------------------
  // Test 11: TacticalCommand Execution Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 11: TacticalCommand Execution Engine ---');
  const cmdResult = executeTacticalCommand(move10Flank.updatedCombatState, {
    id: 'cmd_test_01',
    type: 'formation_move',
    groupId: split10.newGroup.id,
    targetPosition: { x: 18, y: 6 },
    formation: 'defensive_line',
    source: 'ai',
    status: 'pending'
  });
  assert(cmdResult.success === true, 'Test 11: formation_move command executed successfully');
  assert(cmdResult.command.status === 'completed', 'Test 11: Command status updated to completed');
  assert(cmdResult.updatedCombatState.tacticalCommands?.some(c => c.id === 'cmd_test_01'), 'Test 11: Command logged in tacticalCommands');

  console.log(`\n=== TEST RESULTS: ${passed} / ${total} PASSED ===`);
  if (passed === total) {
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
