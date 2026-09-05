import {
  WorldSetting,
  LoreEntry,
  Character,
  NPC,
  CombatState,
  Territory
} from '../types';
import { WorldIntegrationService } from '../services/worldIntegrationService';
import { WorldKnowledgeService } from '../services/worldKnowledgeService';

export function runWorldIntegrationTests() {
  console.log('=== RUNNING WORLD INTEGRATION LAYER TEST SUITE ===\n');
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

  // Sample World Data
  const sampleLore: LoreEntry[] = [
    {
      id: 'race_goblin_01',
      category: 'Rassen',
      title: 'Goblin',
      description: 'Kleine, zähe Humanoide mit grüner Haut und scharfen Sinnen.',
      isUnlocked: true
    },
    {
      id: 'enemy_goblin_warrior_01',
      category: 'Gegner',
      title: 'Goblin-Krieger',
      description: 'Gewöhnlicher Krieger der Goblinstämme, bewaffnet mit Krummsäbel und Lederschild.',
      isUnlocked: true,
      details: {
        species: 'Goblin',
        faction: 'Stamm der Rotzähne',
        enemyType: 'Regulärer Gegner',
        threatLevel: 'Niedrig (Stufe 2-3)'
      }
    },
    {
      id: 'enemy_bandit_01',
      category: 'Gegner',
      title: 'Bandit',
      description: 'Wegelagerer und Gesetzloser.',
      isUnlocked: true
    },
    {
      id: 'faction_rotzaehne_01',
      category: 'Fraktionen',
      title: 'Stamm der Rotzähne',
      description: 'Ein kriegerischer Goblinstamm aus den tiefen Wäldern.',
      isUnlocked: true,
      details: {
        leader: 'Grukk',
        species: 'Goblin'
      }
    },
    {
      id: 'faction_schwarzkrallen_01',
      category: 'Fraktionen',
      title: 'Schwarzkrallen',
      description: 'Ein rivalisierender Stamm im Süden.',
      isUnlocked: true
    },
    {
      id: 'char_grukk_01',
      category: 'Charaktere',
      title: 'Grukk',
      description: 'Häuptling des Stamms der Rotzähne. Ein erfahrener Krieger.',
      isUnlocked: true,
      details: {
        role: 'Häuptling',
        faction: 'Stamm der Rotzähne'
      }
    }
  ];

  const sampleTerritories: Territory[] = [
    {
      id: 'territory_nordwald_01',
      name: 'Nordwald',
      description: 'Ein dichter, dunkler Nadelwald.',
      type: 'Region',
      parentId: null,
      x: 10,
      y: 10
    },
    {
      id: 'place_eichenhain_01',
      name: 'Dorf Eichenhain',
      description: 'Ein friedliches Bauerndorf am Rande des Waldes.',
      type: 'Dorf',
      parentId: 'territory_nordwald_01',
      x: 20,
      y: 15
    },
    {
      id: 'territory_suedberge_01',
      name: 'Südberge',
      description: 'Schroffe Bergkette.',
      type: 'Gebirge',
      parentId: null,
      x: 15,
      y: 40
    }
  ];

  const sampleWorld: WorldSetting = {
    title: 'Testwelt',
    description: 'Eine Testwelt für die Integration.',
    era: 'Mittelalter',
    tone: 'Bodenständig',
    territories: sampleTerritories,
    loreDatabase: sampleLore,
    facts: [
      {
        id: 'fact_grukk_leads_rotzaehne',
        subjectId: 'char_grukk_01',
        subjectName: 'Grukk',
        predicate: 'leads',
        objectId: 'faction_rotzaehne_01',
        objectName: 'Stamm der Rotzähne',
        sourceType: 'established_story',
        status: 'known',
        knowledgeType: 'fact',
        confidence: 100,
        isCurrent: true
      },
      {
        id: 'fact_rotzaehne_controls_nordwald',
        subjectId: 'faction_rotzaehne_01',
        subjectName: 'Stamm der Rotzähne',
        predicate: 'controls',
        objectId: 'territory_nordwald_01',
        objectName: 'Nordwald',
        sourceType: 'established_story',
        status: 'known',
        knowledgeType: 'fact',
        confidence: 100,
        isCurrent: true
      }
    ]
  };

  const sampleCharacters: Character[] = [
    {
      name: 'Eldrin',
      role: 'Waldläufer',
      personality: 'Ruhig und aufmerksam',
      bio: 'Ein junger Späher aus Eichenhain.',
      appearance: {
        hairColor: 'Dunkelbraun',
        eyeColor: 'Grün',
        age: '24',
        build: 'Schlank',
        gender: 'Männlich'
      },
      attributes: []
    }
  ];

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
  // Test 1: Einfacher Gegner (Definition existiert im Codex, kein Encounter)
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Simple Enemy in Codex ---');
  const resolvedEnemy = WorldIntegrationService.resolveEnemyType(sampleLore, 'Goblin-Krieger');
  assert(resolvedEnemy !== null && resolvedEnemy.id === 'enemy_goblin_warrior_01', 'Enemy definition resolved correctly');
  assert(resolvedEnemy?.category === 'Gegner', 'Category is Gegner');
  assert(!sampleWorld.encounterForces || sampleWorld.encounterForces.length === 0, 'No unsolicited Encounter created');

  // -------------------------------------------------------------
  // Test 2: Gruppe ohne Kampf (20 Banditen im Wald -> EncounterForce detected, Tactical Spawn = NEIN)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Group without Combat (Encounter ≠ Combat) ---');
  const encounter2 = WorldIntegrationService.createEncounterForce({
    name: '20 Banditen im Nordwald',
    enemyTypeIdOrName: 'Bandit',
    originIdOrName: 'Nordwald',
    count: 20,
    objective: 'camp',
    context: 'Leben in einem Waldlager',
    hostility: 'suspicious',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(encounter2.encounterForce.count === 20, 'Encounter force count is 20');
  assert(encounter2.encounterForce.enemyTypeId === 'enemy_bandit_01', 'Enemy type resolved to enemy_bandit_01');
  assert(encounter2.encounterForce.originId === 'territory_nordwald_01', 'Origin territory resolved to territory_nordwald_01');
  assert(encounter2.encounterForce.isTacticalSpawned === false, 'Tactical spawn is FALSE (Encounter ≠ Combat)');
  assert(encounter2.encounterForce.status === 'detected', 'Status is detected');

  // -------------------------------------------------------------
  // Test 3: Normaler Angriff (50 Goblins greifen Dorf an -> Force + TacticalGroup + 50 TacticalEntities)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Normal Raid (50 Goblins on Village) ---');
  const raidRes = WorldIntegrationService.createEncounterForce({
    factionIdOrName: 'Stamm der Rotzähne',
    enemyTypeIdOrName: 'Goblin-Krieger',
    originIdOrName: 'Nordwald',
    targetIdOrName: 'Dorf Eichenhain',
    count: 50,
    objective: 'raid',
    hostility: 'hostile',
    escalation: 'local',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(raidRes.encounterForce.factionId === 'faction_rotzaehne_01', 'Faction resolved to faction_rotzaehne_01');
  assert(raidRes.encounterForce.enemyTypeId === 'enemy_goblin_warrior_01', 'EnemyType resolved to enemy_goblin_warrior_01');
  assert(raidRes.encounterForce.raceId === 'race_goblin_01', 'Race resolved to race_goblin_01');
  assert(raidRes.encounterForce.originId === 'territory_nordwald_01', 'Origin resolved to territory_nordwald_01');
  assert(raidRes.encounterForce.targetId === 'place_eichenhain_01', 'Target resolved to place_eichenhain_01');

  // Now spawn into tactical combat
  const tacticalRaid = WorldIntegrationService.spawnEncounterForceToTactical({
    encounterForce: raidRes.encounterForce,
    combatState: baseCombatState,
    formation: 'wedge',
    direction: 'south'
  });

  assert(tacticalRaid.group.encounterForceId === raidRes.encounterForce.id, 'TacticalGroup references encounterForceId');
  assert(tacticalRaid.entities.length === 50, 'Exactly 50 TacticalEntities spawned');
  assert(Object.keys(tacticalRaid.updatedCombatState.tacticalEntities || {}).length === 50, 'CombatState contains 50 entities');
  assert(tacticalRaid.updatedEncounterForce.isTacticalSpawned === true, 'EncounterForce is marked isTacticalSpawned');
  assert(tacticalRaid.updatedEncounterForce.status === 'engaged', 'EncounterForce status is engaged');

  // Verify no 50 duplicate Codex entries were created
  assert(sampleLore.length === 6, 'Codex loreDatabase remains exactly 6 entries (no 50 duplicate NPCs created)');

  // -------------------------------------------------------------
  // Test 4: Benannter Anführer (Grukk führt 50 Goblins an -> leaderCharacterId = Grukk, TacticalEntity verweist auf Grukk)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Named Leader (Grukk leads 50 Goblins) ---');
  const leaderEncounter = WorldIntegrationService.createEncounterForce({
    factionIdOrName: 'Stamm der Rotzähne',
    enemyTypeIdOrName: 'Goblin-Krieger',
    leaderIdOrName: 'Grukk',
    originIdOrName: 'Nordwald',
    targetIdOrName: 'Dorf Eichenhain',
    count: 50,
    objective: 'raid',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(leaderEncounter.encounterForce.leaderCharacterId === 'char_grukk_01', 'Leader resolved to char_grukk_01');
  assert(leaderEncounter.encounterForce.leaderCharacterName === 'Grukk', 'Leader name is Grukk');

  const tacticalLeaderSpawn = WorldIntegrationService.spawnEncounterForceToTactical({
    encounterForce: leaderEncounter.encounterForce,
    combatState: baseCombatState
  });

  const leaderEntity = tacticalLeaderSpawn.entities[0];
  assert(leaderEntity.isLeader === true, 'First entity is flagged as leader');
  assert(leaderEntity.worldEntityId === 'char_grukk_01', 'Leader TacticalEntity worldEntityId points to char_grukk_01');
  assert(leaderEntity.anonymous === false, 'Leader TacticalEntity is not anonymous');
  assert(tacticalLeaderSpawn.entities[1].anonymous === true, 'Rank-and-file entities are anonymous');

  // -------------------------------------------------------------
  // Test 5: Unbekannte Kontrolle (Inference vs. Canon)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Observation / Inference vs. Canon ---');
  const observationFact = WorldIntegrationService.recordObservationOrInference({
    subjectId: 'faction_rotzaehne_01',
    subjectName: 'Stamm der Rotzähne',
    predicate: 'has_trait',
    value: 'Goblins greifen ungewöhnlich koordiniert an',
    note: 'Verdacht auf fremde Beeinflussung'
  });

  assert(observationFact.sourceType === 'ai_inference', 'Observation sourceType is ai_inference');
  assert(observationFact.knowledgeType === 'inference', 'Observation knowledgeType is inference');
  assert(observationFact.status === 'implied', 'Observation status is implied (NOT confirmed canon)');
  assert(observationFact.confidence === 60, 'Observation has non-absolute confidence');

  // -------------------------------------------------------------
  // Test 6: Große Invasion / Multi-Force
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Multi-Force Escalation ---');
  const forceA = WorldIntegrationService.createEncounterForce({
    factionIdOrName: 'Stamm der Rotzähne',
    enemyTypeIdOrName: 'Goblin-Krieger',
    originIdOrName: 'Nordwald',
    targetIdOrName: 'Dorf Eichenhain',
    count: 40,
    escalation: 'regional',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  const forceB = WorldIntegrationService.createEncounterForce({
    factionIdOrName: 'Schwarzkrallen',
    enemyTypeIdOrName: 'Goblin-Krieger',
    originIdOrName: 'Südberge',
    targetIdOrName: 'Dorf Eichenhain',
    count: 35,
    escalation: 'regional',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(forceA.encounterForce.id !== forceB.encounterForce.id, 'Distinct force IDs');
  assert(forceA.encounterForce.factionId === 'faction_rotzaehne_01', 'Force A faction is Rotzähne');
  assert(forceB.encounterForce.factionId === 'faction_schwarzkrallen_01', 'Force B faction is Schwarzkrallen');
  assert(forceA.encounterForce.originId === 'territory_nordwald_01', 'Force A origin is Nordwald');
  assert(forceB.encounterForce.originId === 'territory_suedberge_01', 'Force B origin is Südberge');

  // -------------------------------------------------------------
  // Test 7: Ungültige Referenz (Sauberer Fallback / Warnung, kein Fantasie-Codex)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Invalid Reference Handling ---');
  const invalidRes = WorldIntegrationService.createEncounterForce({
    factionIdOrName: 'does_not_exist_xyz',
    enemyTypeIdOrName: 'unknown_monster_abc',
    originIdOrName: 'nowhere_land',
    count: 15,
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(invalidRes.encounterForce.factionId === undefined, 'Invalid faction is not assigned a fake ID');
  assert(invalidRes.validationWarnings.length > 0, 'Validation warnings generated');
  assert(sampleLore.length === 6, 'No duplicate/fake LoreEntry created in Codex');

  // -------------------------------------------------------------
  // Test 8: Charakter wird taktisch relevant
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Character Becomes Tactical ---');
  const charRes = WorldIntegrationService.resolveCharacter([], [], sampleLore, 'Grukk');
  assert(charRes !== null && charRes.loreEntry?.id === 'char_grukk_01', 'Codex character Grukk resolved');

  const ref = WorldIntegrationService.resolveEntityReference({
    idOrName: 'Grukk',
    world: sampleWorld,
    loreDatabase: sampleLore
  });
  assert(ref?.entityId === 'char_grukk_01', 'WorldEntityReference resolved for Grukk');

  // -------------------------------------------------------------
  // Test 9: Combat Result -> World State Feedback (50 Goblins -> 17 fallen -> 33 survivors)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Combat Result -> World State Update ---');
  const feedbackRes = WorldIntegrationService.applyCombatResultToWorldState({
    feedback: {
      forceId: raidRes.encounterForce.id,
      factionId: 'faction_rotzaehne_01',
      initialCount: 50,
      casualties: 17,
      survivors: 33,
      targetId: 'place_eichenhain_01',
      outcome: 'victory', // Player defended village
      leaderStatus: 'injured',
      details: 'Dorfverteidigung erfolgreich: 17 Goblins gefallen, 33 zogen sich zurück.'
    },
    world: sampleWorld
  });

  const updatedFactionState = feedbackRes.updatedWorldState.factions?.['faction_rotzaehne_01'];
  assert(updatedFactionState !== undefined, 'FactionWorldState updated for Rotzähne');
  assert(updatedFactionState?.mobilizedForce === 33, 'Mobilized force updated to 33 survivors');
  assert(updatedFactionState?.casualtyCount === 17, 'Casualty count recorded as 17');
  assert(feedbackRes.changeLogs.length > 0, 'ChangeLog entry created');
  assert(feedbackRes.updatedWorldState.recentCombatOutcomes?.length === 1, 'Combat outcome recorded in dynamicWorldState');

  // Summary
  console.log(`\n=== TEST RESULTS: ${passed} / ${total} PASSED ===`);
  if (passed === total) {
    console.log('ALL WORLD INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Failed ${total - passed} tests`);
  }
}

if (process.argv[1]?.includes('worldIntegrationTests')) {
  runWorldIntegrationTests();
}
