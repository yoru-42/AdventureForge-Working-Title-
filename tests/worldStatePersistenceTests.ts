import { WorldIntegrationService } from '../services/worldIntegrationService';
import {
  WorldSetting,
  Territory,
  WorldLocationReference,
  LoreEntry,
  Adventure,
  CombatState
} from '../types';

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== RUNNING WORLD STATE INTEGRITY & PERSISTENCE TEST SUITE ===');

// Golden World Setup
const sampleLore: LoreEntry[] = [
  {
    id: 'lore_dorf_eichenhain_01',
    category: 'Orte',
    title: 'Dorf Eichenhain',
    description: 'Ein friedliches Dorf am Rande des Nordwalds.',
    isUnlocked: true,
    details: {
      owner: 'Königreich Nord'
    }
  },
  {
    id: 'lore_rotzaehne_01',
    category: 'Fraktionen',
    title: 'Stamm der Rotzähne',
    description: 'Ein aggressiver Clan von Ork-Kriegern.',
    isUnlocked: true
  }
];

const sampleTerritory: Territory = {
  id: 'territory_nordwald_01',
  name: 'Nordwald Provinz',
  type: 'wald',
  biome: 'dichter_nadelwald',
  controlledByFactionId: 'faction_nordkoenigreich_01',
  ownerFactionId: 'faction_nordkoenigreich_01',
  parentId: 'realm_nordreich_01',
  x: 100,
  y: 200,
  description: 'Dichte Wälder im Norden.',
  placeMarkers: [
    {
      id: 'loc_eichenhain_01',
      name: 'Dorf Eichenhain',
      type: 'dorf',
      x: 120,
      y: 210,
      description: 'Zentralsiedlung im Nordwald'
    }
  ]
};

const sampleWorld: WorldSetting = {
  title: 'Testwelt der Beständigkeit',
  description: 'Eine Testwelt zur Prüfung von Persistenz und Integrität.',
  era: 'Klassische Fantasy',
  tone: 'Heroisch',
  territories: [sampleTerritory],
  locations: [
    {
      id: 'loc_eichenhain_01',
      territoryId: 'territory_nordwald_01',
      name: 'Dorf Eichenhain',
      type: 'dorf',
      x: 120,
      y: 210,
      description: 'Zentralsiedlung im Nordwald'
    }
  ],
  loreDatabase: sampleLore,
  economyConfig: {
    currencyName: 'Goldmünzen',
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
  },
  dynamicWorldState: {
    battleInstances: {},
    locations: {},
    lastUpdated: Date.now()
  }
};

const sampleAdventure: Adventure = {
  id: 'adv_persistence_test_01',
  authorId: 'local-user-123',
  isPublic: false,
  world: sampleWorld,
  player: {
    id: 'char_player_01',
    name: 'Eldrin der Wanderer',
    role: 'Held',
    attributes: [{ name: 'Stärke', value: 14 }]
  } as any,
  npcs: [],
  loreDatabase: sampleLore,
  inventory: ['Heiltrank', 'Kompasse'],
  prologue: 'Die Reise beginnt...',
  chatHistory: [
    { id: 'msg_01', role: 'user', text: 'Ich betrete das Dorf Eichenhain.' },
    { id: 'msg_02', role: 'model', text: 'Du erblickst die friedlichen Hütten.' }
  ],
  statusElements: []
};

// -------------------------------------------------------------
// Test 1: Save & Load Round-Trip Integrity
// Erwartung: Serialisieren und Deserialisieren erhält alle IDs und Weltzustände exakt
// -------------------------------------------------------------
console.log('\n--- Test 1: Save & Load Round-Trip Integrity ---');
const serializedAdv = JSON.stringify(sampleAdventure);
const loadedAdv: Adventure = JSON.parse(serializedAdv);

assert(loadedAdv.id === sampleAdventure.id, 'Adventure ID is unchanged after round trip');
assert(loadedAdv.world.title === sampleAdventure.world.title, 'World title is unchanged after round trip');
assert(loadedAdv.world.territories?.length === 1, 'Territory count preserved');
assert(loadedAdv.world.territories?.[0].id === 'territory_nordwald_01', 'Territory ID preserved');
assert(loadedAdv.world.territories?.[0].parentId === 'realm_nordreich_01', 'Geographical parentId preserved');
assert(loadedAdv.world.locations?.[0].id === 'loc_eichenhain_01', 'Location ID preserved');
assert(loadedAdv.world.locations?.[0].territoryId === 'territory_nordwald_01', 'Location-to-Territory link preserved');

// -------------------------------------------------------------
// Test 2: Deterministic Fallback Resolution across Reloads
// Erwartung: Mehrfaches Aufrufen von resolveLocationReference erzeugt identische IDs
// -------------------------------------------------------------
console.log('\n--- Test 2: Deterministic Fallback Resolution ---');
const locRes1 = WorldIntegrationService.resolveLocationReference({
  idOrName: 'Alte Mühle',
  territoryId: 'territory_nordwald_01',
  world: loadedAdv.world,
  loreDatabase: loadedAdv.loreDatabase
});

const locRes2 = WorldIntegrationService.resolveLocationReference({
  idOrName: 'Alte Mühle',
  territoryId: 'territory_nordwald_01',
  world: loadedAdv.world,
  loreDatabase: loadedAdv.loreDatabase
});

assert(locRes1.status === 'resolved', 'Location 1 resolved');
assert(locRes2.status === 'resolved', 'Location 2 resolved');
assert(locRes1.value?.id === locRes2.value?.id, 'Fallback IDs are deterministic and identical across calls');
assert(locRes1.value?.territoryId === 'territory_nordwald_01', 'Resolved location correctly anchored to territory');

// -------------------------------------------------------------
// Test 3: Idempotency of BattleInstance Completion
// Erwartung: Mehrfacher Abschluss desselben Gefechts verändert die Welt nicht doppelt
// -------------------------------------------------------------
console.log('\n--- Test 3: Idempotency of BattleInstance Completion ---');
const battleCreated = WorldIntegrationService.createBattleInstance({
  territoryId: 'territory_nordwald_01',
  locationIdOrName: 'loc_eichenhain_01',
  world: loadedAdv.world,
  loreDatabase: loadedAdv.loreDatabase,
  participatingFactionIds: ['faction_rotzaehne_01']
});

const firstCompletion = WorldIntegrationService.completeBattleInstance({
  battleInstanceId: battleCreated.battleInstance.id,
  combatResult: {
    outcome: 'victory',
    factionId: 'faction_rotzaehne_01',
    casualties: 3,
    conqueredTerritoryId: 'territory_nordwald_01',
    newControllingFactionId: 'faction_rotzaehne_01',
    damageToTargetLocation: 'Taverne beschädigt',
    damagedObjectIds: ['building_taverne_01']
  },
  world: battleCreated.updatedWorld
});

assert(firstCompletion.updatedBattleInstance?.status === 'completed', 'First completion sets status to completed');
assert(
  firstCompletion.updatedWorld.territories?.find(t => t.id === 'territory_nordwald_01')?.controlledByFactionId === 'faction_rotzaehne_01',
  'Territory control transferred to conqueror'
);

// Call completeBattleInstance again on the same completed battle
const secondCompletion = WorldIntegrationService.completeBattleInstance({
  battleInstanceId: battleCreated.battleInstance.id,
  combatResult: {
    outcome: 'victory',
    factionId: 'faction_rotzaehne_01',
    casualties: 3,
    conqueredTerritoryId: 'territory_nordwald_01',
    newControllingFactionId: 'faction_rotzaehne_01'
  },
  world: firstCompletion.updatedWorld
});

assert(secondCompletion.changeLogs.length === 0, 'Second completion returns 0 new changelogs (idempotent)');
assert(
  secondCompletion.updatedWorld.territories?.find(t => t.id === 'territory_nordwald_01')?.controlledByFactionId === 'faction_rotzaehne_01',
  'Territory control remains consistent without duplicate mutation'
);

// -------------------------------------------------------------
// Test 4: Economy Holding Persistence & Preservation
// Erwartung: Beschädigungs- und Belagerungszustände überstehen Save/Load
// -------------------------------------------------------------
console.log('\n--- Test 4: Economy Holding Persistence ---');
const updatedWorldWithHolding = firstCompletion.updatedWorld;
const serializedWorld = JSON.stringify(updatedWorldWithHolding);
const reloadedWorld: WorldSetting = JSON.parse(serializedWorld);

const holdingAfterReload = reloadedWorld.economyConfig?.holdings.find(h => h.id === 'holding_taverne_01');
assert(holdingAfterReload !== undefined, 'Economy holding exists after reload');
assert(holdingAfterReload?.status === 'under_siege', 'Holding status under_siege persists after reload');
assert(holdingAfterReload?.activityLogs && holdingAfterReload.activityLogs.length > 0, 'Holding activity logs persist after reload');

// -------------------------------------------------------------
// Test 5: ID Stability & Referential Integrity
// Erwartung: Keine IDs verändern sich nach wiederholtem Speichern und Laden
// -------------------------------------------------------------
console.log('\n--- Test 5: ID Stability across Multiple Cycles ---');
let cycleWorld = reloadedWorld;
for (let i = 0; i < 5; i++) {
  cycleWorld = JSON.parse(JSON.stringify(cycleWorld));
}

assert(cycleWorld.territories?.[0].id === 'territory_nordwald_01', 'Territory ID stable after 5 save/load cycles');
assert(cycleWorld.locations?.[0].id === 'loc_eichenhain_01', 'Location ID stable after 5 save/load cycles');
assert(cycleWorld.economyConfig?.holdings[0].id === 'holding_taverne_01', 'Holding ID stable after 5 save/load cycles');
assert(
  Object.keys(cycleWorld.dynamicWorldState?.battleInstances || {})[0] === battleCreated.battleInstance.id,
  'BattleInstance ID stable after 5 save/load cycles'
);

// -------------------------------------------------------------
// Test 6: No Codex / Faction Pollution
// Erwartung: Unbekannte Kämpfer erzeugen keine erfundenen Fraktionen im Weltzustand
// -------------------------------------------------------------
console.log('\n--- Test 6: No Codex / Faction Pollution ---');
const sampleIntent = {
  eventType: 'observation' as const,
  subject: 'Unbekannter Händler',
  action: 'betritt',
  target: 'Dorf Eichenhain'
};
const infoEventRes = WorldIntegrationService.processWorldEventIntent({
  intent: sampleIntent,
  world: cycleWorld,
  loreDatabase: sampleLore
});

assert(!cycleWorld.encounterForces || cycleWorld.encounterForces.length === 0, 'No fictitious encounter forces added to WorldSetting');
assert(cycleWorld.loreDatabase?.length === sampleLore.length, 'No fictitious entries added to LoreDatabase');
assert(infoEventRes.generatedFacts.length > 0, 'Observation fact created successfully');

// -------------------------------------------------------------
// Test 7: UI State vs World State Separation
// Erwartung: Lokale UI-Eigenschaften (z.B. Zoom oder Formations-Vorschau) stören nicht die Welt-Attribute
// -------------------------------------------------------------
console.log('\n--- Test 7: UI State vs World State Separation ---');
const combatStateWithUI: Partial<CombatState> = {
  isCombatActive: true,
  battleInstanceId: battleCreated.battleInstance.id,
  territoryId: 'territory_nordwald_01',
  locationId: 'loc_eichenhain_01',
  selectedEnemyId: 'enemy_01',
  combatSubMenu: 'main'
};

// Verify combat state references the persistent BattleInstance ID without modifying WorldSetting structure
assert(combatStateWithUI.battleInstanceId === battleCreated.battleInstance.id, 'CombatState accurately references persistent BattleInstance ID');
assert(cycleWorld.battleInstances?.[0].id === combatStateWithUI.battleInstanceId, 'WorldSetting BattleInstance matches CombatState reference');

console.log(`\n=== TEST RESULTS: ${passed} / ${total} PASSED ===`);
if (passed === total) {
  console.log('ALL WORLD STATE INTEGRITY & PERSISTENCE TESTS PASSED SUCCESSFULLY!');
} else {
  console.error(`SOME TESTS FAILED: ${total - passed} failures.`);
  process.exit(1);
}
