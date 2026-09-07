import {
  WorldSetting,
  LoreEntry,
  Character,
  NPC,
  CombatState,
  Territory,
  WorldFact
} from '../types';
import { WorldIntegrationService } from '../services/worldIntegrationService';
import { WorldKnowledgeService } from '../services/worldKnowledgeService';

export function runWorldIntegrationTests() {
  console.log('=== RUNNING WORLD INTEGRATION LAYER & CONTEXT RESOLUTION TEST SUITE ===\n');
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
      id: 'enemy_goblin_scout_01',
      category: 'Gegner',
      title: 'Goblin-Späher',
      description: 'Schneller Kundschafter der Goblins.',
      isUnlocked: true,
      details: {
        species: 'Goblin'
      }
    },
    {
      id: 'enemy_bandit_01',
      category: 'Gegner',
      title: 'Bandit',
      description: 'Wegelagerer und Gesetzloser ohne feste Fraktion.',
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

  const sampleFacts: WorldFact[] = [
    {
      id: 'fact_warrior_belongs_rotzaehne',
      subjectId: 'enemy_goblin_warrior_01',
      subjectName: 'Goblin-Krieger',
      predicate: 'member_of',
      objectId: 'faction_rotzaehne_01',
      objectName: 'Stamm der Rotzähne',
      sourceType: 'established_story',
      status: 'known',
      knowledgeType: 'fact',
      confidence: 100,
      isCurrent: true
    },
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
  ];

  const sampleWorld: WorldSetting = {
    title: 'Testwelt',
    description: 'Eine Testwelt für die Integration.',
    era: 'Mittelalter',
    tone: 'Bodenständig',
    territories: sampleTerritories,
    loreDatabase: sampleLore,
    facts: sampleFacts,
    encounterForces: [],
    dynamicWorldState: {
      factions: {},
      encounterForces: {}
    }
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
  // Test 1: 50 Goblins -> 1 EncounterForce, count=50, 50 TacticalEntities nach Spawn
  // -------------------------------------------------------------
  console.log('\n--- Test 1: 50 Goblins (1 Force -> 1 Group -> 50 TacticalEntities) ---');
  const t1Res = WorldIntegrationService.createEncounterForce({
    count: 50,
    raceIdOrName: 'Goblin',
    enemyTypeIdOrName: 'Goblin-Krieger',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(t1Res.encounterForce.count === 50, '1 EncounterForce with count = 50 created');
  assert(t1Res.encounterForce.enemyTypeId === 'enemy_goblin_warrior_01', 'EnemyType resolved correctly');
  assert(t1Res.encounterForce.raceId === 'race_goblin_01', 'Race resolved correctly');

  const t1Tactical = WorldIntegrationService.spawnEncounterForceToTactical({
    encounterForce: t1Res.encounterForce,
    combatState: baseCombatState
  });

  assert(t1Tactical.entities.length === 50, 'Exactly 50 TacticalEntities spawned');
  assert(Object.keys(t1Tactical.updatedCombatState.tacticalEntities || {}).length === 50, 'CombatState contains 50 entities');
  assert(t1Tactical.updatedCombatState.tacticalGroups[t1Tactical.group.id] !== undefined, '1 TacticalGroup registered');

  // -------------------------------------------------------------
  // Test 2: Keine Faction erfunden
  // Input: enemyType = Bandit (no faction in lore details or facts)
  // Erwartung: factionId = undefined
  // -------------------------------------------------------------
  console.log('\n--- Test 2: No Faction Invented ---');
  const t2Res = WorldIntegrationService.createEncounterForce({
    enemyTypeIdOrName: 'Bandit',
    count: 10,
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(t2Res.encounterForce.factionId === undefined, 'factionId is undefined when no faction is linked or specified');
  assert(t2Res.encounterForce.enemyTypeId === 'enemy_bandit_01', 'Bandit enemy type resolved');

  // -------------------------------------------------------------
  // Test 3: Explizite Faction
  // Input: enemyType = Goblin-Krieger, faction = Stamm der Rotzähne
  // Erwartung: factionId = faction_rotzaehne_01
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Explicit Faction Resolution ---');
  const t3Res = WorldIntegrationService.createEncounterForce({
    enemyTypeIdOrName: 'Goblin-Krieger',
    factionIdOrName: 'Stamm der Rotzähne',
    count: 25,
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(t3Res.encounterForce.factionId === 'faction_rotzaehne_01', 'factionId matches ID of Stamm der Rotzähne');
  assert(t3Res.encounterForce.factionName === 'Stamm der Rotzähne', 'factionName is Stamm der Rotzähne');

  // -------------------------------------------------------------
  // Test 4: Leader Referenz (Grukk)
  // Input: leader = Grukk -> leaderCharacterId = char_grukk_01
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Named Leader Reference ---');
  const t4Res = WorldIntegrationService.createEncounterForce({
    leaderIdOrName: 'Grukk',
    enemyTypeIdOrName: 'Goblin-Krieger',
    count: 30,
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(t4Res.encounterForce.leaderCharacterId === 'char_grukk_01', 'Existing character ID char_grukk_01 is referenced');
  assert(t4Res.encounterForce.leaderCharacterName === 'Grukk', 'Leader name is Grukk');

  const t4Tactical = WorldIntegrationService.spawnEncounterForceToTactical({
    encounterForce: t4Res.encounterForce,
    combatState: baseCombatState
  });

  assert(t4Tactical.entities[0].isLeader === true, 'First entity is marked as leader');
  assert(t4Tactical.entities[0].worldEntityId === 'char_grukk_01', 'Leader entity references char_grukk_01');
  assert(t4Tactical.entities[1].isLeader === false, 'Rank and file entity is not leader');

  // -------------------------------------------------------------
  // Test 5: Ambiguous Match & No False Fuzzy Override
  // Codex: Goblin, Goblin-Krieger, Goblin-Späher
  // Input: 'Goblin'
  // Erwartung: Resolves to 'Goblin' (Race), NOT 'Goblin-Krieger'!
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Exact vs Compound Resolution (No false fuzzy override) ---');
  const raceRes = WorldIntegrationService.resolveRaceDetailed(sampleLore, 'Goblin');
  assert(raceRes.status === 'resolved' && raceRes.value?.id === 'race_goblin_01', 'Goblin resolves strictly to race_goblin_01');
  assert(raceRes.value?.title === 'Goblin', 'Exact title is Goblin, not Goblin-Krieger');

  // An ambiguous search across similar entries where no exact match exists
  const ambiguousLoreList: LoreEntry[] = [
    { id: 'item_sword_a', category: 'Gegenstände', title: 'Stahlschwert des Lichts', description: 'Ein magisches Schwert', isUnlocked: true },
    { id: 'item_sword_b', category: 'Gegenstände', title: 'Stahlschwert der Nacht', description: 'Ein finsteres Schwert', isUnlocked: true }
  ];
  const ambRes = WorldIntegrationService.resolveLoreEntryDetailed(ambiguousLoreList, 'Stahlschwert');
  assert(ambRes.status === 'ambiguous' || ambRes.status === 'unresolved', 'Ambiguous term does not select arbitrary entry');
  assert(ambRes.value === null, 'Ambiguous value is null');

  // -------------------------------------------------------------
  // Test 6: Falsche Kategorie
  // Input as Race: Goblin-Krieger
  // Erwartung: null/unresolved (weil Goblin-Krieger ein Gegner ist, keine Rasse)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Strict Category Separation ---');
  const wrongCategoryRes = WorldIntegrationService.resolveRaceDetailed(sampleLore, 'Goblin-Krieger');
  assert(wrongCategoryRes.value === null, 'Goblin-Krieger as Race returns null');
  assert(wrongCategoryRes.status === 'unresolved', 'Status is unresolved');

  const enemyAsFaction = WorldIntegrationService.resolveFactionDetailed(sampleLore, 'Goblin-Krieger');
  assert(enemyAsFaction.value === null, 'Goblin-Krieger as Faction returns null');

  const raceAsEnemy = WorldIntegrationService.resolveEnemyTypeDetailed(sampleLore, 'Goblin');
  assert(raceAsEnemy.value === null, 'Goblin as EnemyType returns null (it is a Race)');

  // -------------------------------------------------------------
  // Test 7: World Fact Graph Verbindung
  // Goblin-Krieger -> member_of -> Rotzähne -> leads -> Grukk -> controls -> Nordwald
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Bounded World-Fact Graph Traversal ---');
  const graphFaction = WorldIntegrationService.traverseFactGraphForRelation({
    startEntityId: 'enemy_goblin_warrior_01',
    targetCategory: 'Fraktionen',
    facts: sampleFacts,
    loreDatabase: sampleLore
  });

  assert(graphFaction !== null, 'Fact graph discovered connected faction');
  assert(graphFaction?.entityId === 'faction_rotzaehne_01', 'Discovered Stamm der Rotzähne from Goblin-Krieger');

  const graphLeader = WorldIntegrationService.traverseFactGraphForRelation({
    startEntityId: 'faction_rotzaehne_01',
    targetCategory: 'Charaktere',
    facts: sampleFacts,
    loreDatabase: sampleLore
  });

  assert(graphLeader !== null, 'Fact graph discovered connected leader');
  assert(graphLeader?.entityId === 'char_grukk_01', 'Discovered Grukk as leader of Rotzähne');

  // -------------------------------------------------------------
  // Test 8: Normale Information (Encounter ≠ Combat)
  // "Im Nordwald leben 50 Goblins."
  // Erwartung: Observation Fact, kein Tactical Spawn, kein Combat
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Pure Information (No Tactical Spawn) ---');
  const infoIntent = {
    type: 'info',
    subject: 'Goblin',
    count: 50,
    origin: 'Nordwald',
    attack: false,
    movement: false
  };

  const infoProcessRes = WorldIntegrationService.processWorldEventIntent({
    intent: infoIntent,
    world: sampleWorld,
    combatState: baseCombatState
  });

  assert(infoProcessRes.status === 'info_only', 'Information event processed as info_only');
  assert(infoProcessRes.tacticalSpawnNeeded === false, 'tacticalSpawnNeeded is false');
  assert(infoProcessRes.encounterForce === null, 'No active EncounterForce created for pure info');
  assert(infoProcessRes.generatedFacts.length > 0, 'Observation WorldFact generated');

  // -------------------------------------------------------------
  // Test 9: Angriff
  // "50 Goblins greifen Eichenhain an."
  // Erwartung: hostile EncounterForce und taktischer Spawn
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Attack Situation (EncounterForce + Tactical Spawn) ---');
  const attackIntent = {
    type: 'raid',
    enemyType: 'Goblin-Krieger',
    count: 50,
    origin: 'Nordwald',
    target: 'Dorf Eichenhain',
    attack: true,
    objective: 'raid'
  };

  const attackProcessRes = WorldIntegrationService.processWorldEventIntent({
    intent: attackIntent,
    world: sampleWorld,
    combatState: baseCombatState,
    allowTacticalSpawn: true
  });

  assert(attackProcessRes.status === 'tactical_spawned', 'Attack processed and tactical spawned');
  assert(attackProcessRes.tacticalSpawnNeeded === true, 'tacticalSpawnNeeded is true');
  assert(attackProcessRes.encounterForce !== null, 'EncounterForce created');
  assert(attackProcessRes.encounterForce?.status === 'engaged', 'EncounterForce status is engaged');
  assert(attackProcessRes.tacticalResult?.entities.length === 50, '50 tactical entities spawned for raid');

  // -------------------------------------------------------------
  // Test 10: Bewegung
  // "50 Goblins marschieren auf Eichenhain zu."
  // Erwartung: moving EncounterForce, aber kein automatischer Kampf
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Movement (Moving EncounterForce, No Combat) ---');
  const moveIntent = {
    type: 'movement',
    enemyType: 'Goblin-Krieger',
    count: 50,
    origin: 'Nordwald',
    target: 'Dorf Eichenhain',
    movement: true,
    attack: false,
    objective: 'patrol'
  };

  const moveProcessRes = WorldIntegrationService.processWorldEventIntent({
    intent: moveIntent,
    world: sampleWorld,
    combatState: baseCombatState
  });

  assert(moveProcessRes.status === 'force_created', 'Movement created moving force');
  assert(moveProcessRes.tacticalSpawnNeeded === false, 'Tactical spawn is false for movement');
  assert(moveProcessRes.encounterForce?.status === 'moving', 'Status is moving');
  assert(moveProcessRes.encounterForce?.isTacticalSpawned === false, 'isTacticalSpawned is false');

  // -------------------------------------------------------------
  // Test 11: Unbekannte Faction (Keine Erfindung im Codex)
  // Input: faction = Schattenhorde
  // Erwartung: Warning/unresolved, keine neue Fraktion erzeugen
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Unknown Faction Handling ---');
  const initialLoreCount = sampleLore.length;
  const unknownFactionRes = WorldIntegrationService.createEncounterForce({
    enemyTypeIdOrName: 'Goblin-Krieger',
    factionIdOrName: 'Schattenhorde',
    count: 20,
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(unknownFactionRes.encounterForce.factionId === undefined, 'Unknown faction has factionId undefined');
  assert(unknownFactionRes.validationWarnings.length > 0, 'Validation warning recorded');
  assert(sampleLore.length === initialLoreCount, 'Codex was NOT polluted with fictitious faction');

  // -------------------------------------------------------------
  // Test 12: Duplicate Event Prevention
  // Dasselbe Event zweimal verarbeiten
  // Erwartung: Keine Verdopplung identischer aktiver EncounterForces
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Duplicate Event Prevention ---');
  const initialWorldWithForce: WorldSetting = {
    ...sampleWorld,
    encounterForces: [t1Res.encounterForce]
  };

  const dupRes = WorldIntegrationService.createEncounterForce({
    count: 50,
    raceIdOrName: 'Goblin',
    enemyTypeIdOrName: 'Goblin-Krieger',
    objective: t1Res.encounterForce.objective,
    world: initialWorldWithForce,
    loreDatabase: sampleLore
  });

  assert(dupRes.encounterForce.id === t1Res.encounterForce.id, 'Duplicate creation returned existing force ID');

  // -------------------------------------------------------------
  // Test 13: World Location Resolution & Hierarchy
  // Erwartung: Stabile ID-Auflösung für Orte im Territory
  // -------------------------------------------------------------
  console.log('\n--- Test 13: World Location Resolution & Hierarchy ---');
  const locRes = WorldIntegrationService.resolveLocationReference({
    idOrName: 'Dorf Eichenhain',
    territoryId: 'territory_nordwald_01',
    world: sampleWorld,
    loreDatabase: sampleLore
  });

  assert(locRes.status === 'resolved', 'Location resolved successfully');
  assert(Boolean(locRes.value?.id), 'Resolved location has a stable ID');
  assert(locRes.value?.territoryId === 'territory_nordwald_01', 'Location hierarchy correctly linked to Territory');

  // -------------------------------------------------------------
  // Test 14: Battle Instance Creation & Snapshot
  // Erwartung: BattleInstance mit Terrain-/Objekt-Snapshot
  // -------------------------------------------------------------
  console.log('\n--- Test 14: Battle Instance Creation & Snapshot ---');
  const battleInstanceRes = WorldIntegrationService.createBattleInstance({
    territoryId: 'territory_nordwald_01',
    locationIdOrName: 'Dorf Eichenhain',
    world: sampleWorld,
    loreDatabase: sampleLore,
    participatingFactionIds: ['faction_rotzaehne_01']
  });

  assert(Boolean(battleInstanceRes.battleInstance.id), 'BattleInstance created with unique ID');
  assert(battleInstanceRes.battleInstance.status === 'active', 'BattleInstance is active');
  assert(battleInstanceRes.battleInstance.territoryId === 'territory_nordwald_01', 'BattleInstance tied to Territory');
  assert(Boolean(battleInstanceRes.battleInstance.terrainSnapshot), 'Terrain snapshot captured');
  assert(battleInstanceRes.updatedCombatState.battleInstanceId === battleInstanceRes.battleInstance.id, 'CombatState linked to BattleInstance');

  // -------------------------------------------------------------
  // Test 15: Battle Completion & Economy Update Propagation
  // Erwartung: Gefechtsende aktualisiert Territory-Kontrolle und EconomyHolding
  // -------------------------------------------------------------
  console.log('\n--- Test 15: Battle Completion & Economy Update Propagation ---');
  const worldWithEconomy: WorldSetting = {
    ...battleInstanceRes.updatedWorld,
    economyConfig: {
      currencyName: 'Gold',
      currencyIcon: 'coin',
      payoutInterval: 'daily',
      allowPassiveIncome: true,
      enableRandomEvents: true,
      holdings: [
        {
          id: 'holding_taverne_01',
          name: 'Taverne Zum Grünen Wald',
          type: 'taverne',
          level: 1,
          ownerType: 'user',
          incomePerInterval: 50,
          upkeepPerInterval: 10,
          staffCount: 3,
          status: 'active',
          territoryId: 'territory_nordwald_01',
          locationName: 'Dorf Eichenhain'
        }
      ]
    }
  };

  const combatCompletionRes = WorldIntegrationService.completeBattleInstance({
    battleInstanceId: battleInstanceRes.battleInstance.id,
    combatResult: {
      outcome: 'victory',
      factionId: 'faction_rotzaehne_01',
      casualties: 5,
      conqueredTerritoryId: 'territory_nordwald_01',
      newControllingFactionId: 'faction_rotzaehne_01',
      damageToTargetLocation: 'Gebäude beschädigt',
      damagedObjectIds: ['building_01']
    },
    world: worldWithEconomy
  });

  assert(combatCompletionRes.updatedBattleInstance?.status === 'completed', 'BattleInstance status set to completed');
  assert(
    combatCompletionRes.updatedWorld.territories?.find(t => t.id === 'territory_nordwald_01')?.controlledByFactionId === 'faction_rotzaehne_01',
    'Territory political control updated in WorldState'
  );
  const updatedHolding = combatCompletionRes.updatedWorld.economyConfig?.holdings[0];
  assert(updatedHolding?.status === 'under_siege', 'EconomyHolding status updated due to conquest');
  assert(updatedHolding?.activityLogs && updatedHolding.activityLogs.length > 0, 'Economic activity log recorded combat impact');

  // -------------------------------------------------------------
  // Test 16: Tactical Spawn Source Tracking
  // Erwartung: TacticalGroup und TacticalEntity besitzen sourceType und sourceId
  // -------------------------------------------------------------
  console.log('\n--- Test 16: Tactical Spawn Source Tracking ---');
  const dummyCombatState: CombatState = {
    isCombatActive: true,
    selectedEnemyId: '',
    customEnemyName: 'Goblins',
    opponents: [],
    playerHp: 100,
    playerMaxHp: 100,
    playerMp: 50,
    playerMaxMp: 50,
    enemyHp: 100,
    enemyMaxHp: 100,
    combatSubMenu: 'main'
  };

  const spawnWithSource = WorldIntegrationService.spawnEncounterForceToTactical({
    encounterForce: t1Res.encounterForce,
    combatState: dummyCombatState
  });

  assert(spawnWithSource.group.sourceType === 'encounter_force', 'TacticalGroup has sourceType = encounter_force');
  assert(spawnWithSource.group.sourceId === t1Res.encounterForce.id, 'TacticalGroup has sourceId matching EncounterForce');
  assert(spawnWithSource.entities[0].sourceType === 'encounter_force', 'TacticalEntity has sourceType = encounter_force');
  assert(spawnWithSource.entities[0].sourceId === t1Res.encounterForce.id, 'TacticalEntity has sourceId matching EncounterForce');

  // Summary
  console.log(`\n=== TEST RESULTS: ${passed} / ${total} PASSED ===`);
  if (passed === total) {
    console.log('ALL WORLD INTEGRATION & CONTEXT RESOLUTION TESTS PASSED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Failed ${total - passed} tests`);
  }
}

if (process.argv[1]?.includes('worldIntegrationTests')) {
  runWorldIntegrationTests();
}
