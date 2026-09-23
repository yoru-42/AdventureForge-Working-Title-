import { InventoryLootService } from '../services/inventoryLootService';
import { EquipmentConditionService } from '../services/equipmentConditionService';
import { Adventure, Character, NPC, ItemInstance, LootSource, PendingPickupProposal, PendingItemTransferProposal } from '../types';

let testCount = 0;
let passCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  passCount++;
  console.log(`PASS: ${message}`);
}

function createBaseAdventure(): Adventure {
  const player: Character = {
    id: 'player-1',
    name: 'Gareth',
    role: 'Abenteurer',
    personality: 'Mutig',
    bio: 'Ein erfahrener Abenteurer.',
    attributes: [
      { name: 'Stärke', value: 12, max: 20 }
    ],
    appearance: {
      gender: 'Männlich',
      build: 'athletisch',
      hairColor: 'braun',
      eyeColor: 'braun',
      age: '28',
      activeConditions: []
    },
    professionCompetencies: [
      {
        id: 'comp-1',
        name: 'Kräuterkunde',
        category: 'Fortgeschritten',
        proficiency: 65,
        talent: 3,
        experiencePoints: 100
      },
      {
        id: 'comp-2',
        name: 'Zerlegen',
        category: 'Grundlage',
        proficiency: 15,
        talent: 2,
        experiencePoints: 10
      }
    ],
    equipment: []
  };

  const npc: NPC = {
    id: 'npc-companion',
    name: 'Lyra',
    role: 'Begleiterin',
    personality: 'Aufmerksam',
    bio: 'Erfahrene Jägerin.',
    isHostile: false,
    attributes: [
      { name: 'Stärke', value: 10, max: 20 }
    ],
    appearance: {
      gender: 'Weiblich',
      build: 'schlank',
      hairColor: 'schwarz',
      eyeColor: 'grün',
      age: '24',
      activeConditions: []
    },
    professionCompetencies: [
      {
        id: 'comp-lyra-1',
        name: 'Zerlegen',
        category: 'Spezialisierung',
        proficiency: 85,
        talent: 4,
        experiencePoints: 500
      }
    ],
    equipment: []
  };

  return {
    id: 'adv-test-123',
    authorId: 'test-user',
    isPublic: false,
    world: { id: 'world-1', name: 'Aethelgard', description: 'Testwelt' } as any,
    player,
    npcs: [npc],
    storyTitle: 'Test Abenteuer',
    itemInstances: [] as ItemInstance[],
    itemDefinitions: [],
    lootSources: [],
    worldDrops: [],
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 20.0
    },
    storyState: {
      currentLocationName: 'Wald'
    }
  } as unknown as Adventure;
}

console.log('=== RUNNING INVENTORY & LOOT SERVICE TESTS ===\n');

// 1. HARVEST & ZERLEGEN TESTS
// Requirement 1-9: Kristalle erzeugen, Pickup bei ausreich/0 Traglast, Erhalt bei Fehlversuch, Teilaufnahme, Rest an Quelle, Identität, Keine Duplikate, State erst nach Aufnahme true.
{
  const adv = createBaseAdventure();
  const heavyDummy: ItemInstance = {
    id: 'inst-dummy-heavy',
    itemDefinitionId: 'def-heavy',
    name: 'Schwerer Anker',
    owner: 'player',
    weightKg: 20.0,
    quantity: 1
  };

  // Full weight -> 0 remaining capacity
  let advFull: Adventure = { ...adv, itemInstances: [heavyDummy] };

  const ls: LootSource = {
    id: 'loot-crystal-beast',
    type: 'monster_body',
    title: 'Schattenwolf',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Schattenkristall', quantity: 2, weightKg: 1.0, category: 'Rohstoffe' }]
    }
  };

  advFull = InventoryLootService.registerLootSource(advFull, ls).updatedAdventure;

  // Attempt 1: Full weight, crystals generated on LootSource but pickup fails
  const res1 = InventoryLootService.harvestMonster(advFull, 'loot-crystal-beast', 'crystals', 'player');
  assert(res1.gainedItems.length === 0, '1. Kristalle nicht aufgenommen bei 0 Traglast');
  assert(res1.rejectedItems.length > 0, '2. Rejection notification generated for full weight');

  const lsAfter1 = res1.updatedAdventure.lootSources?.find(s => s.id === 'loot-crystal-beast');
  assert(Boolean(lsAfter1 && lsAfter1.items.length === 1), '3. Kristalle bleiben an LootSource nach fehlgeschlagenem Pickup');
  assert(lsAfter1?.harvestOptions?.isCrystalsHarvested !== true, '4. isCrystalsHarvested IST FALSE solange Kristalle an Quelle liegen');

  const initialCrystalInstanceId = lsAfter1!.items[0].id;

  // Attempt 2: Repeat harvestMonster on same source -> MUST REUSE existing itemInstanceId, NOT create duplicate!
  const res2 = InventoryLootService.harvestMonster(res1.updatedAdventure, 'loot-crystal-beast', 'crystals', 'player');
  const lsAfter2 = res2.updatedAdventure.lootSources?.find(s => s.id === 'loot-crystal-beast');
  assert(lsAfter2!.items.length === 1, '5. Keine doppelten Kristalle bei erneutem Harvest-Aufruf erzeugt');
  assert(lsAfter2!.items[0].id === initialCrystalInstanceId, '6. Dieselbe itemInstanceId bleibt an LootSource erhalten');

  // Remove heavy dummy to free capacity
  let advFree: Adventure = {
    ...res2.updatedAdventure,
    itemInstances: []
  };

  // Attempt 3: Pickup now succeeds after confirmation
  const res3 = InventoryLootService.harvestMonster(advFree, 'loot-crystal-beast', 'crystals', 'player');
  assert(res3.gainedItems.length === 0, '7a. harvestMonster erzeugt bei always_confirm ein proposal ohne direkten Inventareintrag');
  assert(Boolean(res3.updatedAdventure.pendingPickup), '7b. pendingPickup nach harvestMonster vorhanden');

  const confirmRes3 = InventoryLootService.confirmPickup(res3.updatedAdventure, 'player', res3.updatedAdventure.pendingPickup!);
  assert(confirmRes3.acceptedItems.length === 1, '7c. Kristalle erfolgreich in Inventar aufgenommen nach Bestätigung');

  const lsAfter3 = confirmRes3.updatedAdventure.lootSources?.find(s => s.id === 'loot-crystal-beast');
  assert(lsAfter3!.items.length === 0, '8. Kristalle nach Aufnahme aus LootSource entfernt');
  assert(lsAfter3?.harvestOptions?.isCrystalsHarvested === true, '9. isCrystalsHarvested IST TRUE erst NACH vollständiger Aufnahme');
}

// Requirement 10-15: Zerlegen (Butcher) - Erzeugung, Erhalt, Teilaufnahme, Status erst nach vollständiger Aufnahme.
{
  const adv = createBaseAdventure();

  const ls: LootSource = {
    id: 'loot-boar-1',
    type: 'animal_body',
    title: 'Keiler',
    items: [],
    harvestOptions: {
      allowButcher: true,
      butcherYield: [
        { name: 'Wildschweinfleisch', quantity: 2, weightKg: 8.0, category: 'Nahrung' },
        { name: 'Keilerleder', quantity: 1, weightKg: 10.0, category: 'Rohstoffe' }
      ]
    }
  };

  // Set carry capacity to 12 kg. Fleisch (8kg) fits, Leder (10kg) will exceed 12kg limit!
  const advCap12: Adventure = {
    ...adv,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 12.0
    }
  };

  const advReg = InventoryLootService.registerLootSource(advCap12, ls).updatedAdventure;

  const butcherRes = InventoryLootService.harvestMonster(advReg, 'loot-boar-1', 'butcher', 'player');
  assert(butcherRes.gainedItems.length === 0 && Boolean(butcherRes.updatedAdventure.pendingPickup), '10a. Butcher erzeugt pendingPickup bei always_confirm');

  const confirmButcher = InventoryLootService.confirmPickup(butcherRes.updatedAdventure, 'player', butcherRes.updatedAdventure.pendingPickup!);
  assert(confirmButcher.acceptedItems.length === 1, '10b. Partial butchering pickup: 1 item accepted within 12kg capacity');
  assert(confirmButcher.rejectedItems.length === 1, '11. 1 butchered item rejected due to weight limit');

  const lsAfterButcher = confirmButcher.updatedAdventure.lootSources?.find(s => s.id === 'loot-boar-1');
  assert(lsAfterButcher?.harvestOptions?.isBodyHarvested !== true, '12. isBodyHarvested IST FALSE bei Teilaufnahme');
  assert(Boolean(lsAfterButcher && lsAfterButcher.items.length === 1), '13. Verbleibendes Leder verbleibt an LootSource');

  // Free capacity and take remaining item
  const advHigherCap: Adventure = {
    ...confirmButcher.updatedAdventure,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 30.0
    }
  };

  const butcherRes2 = InventoryLootService.harvestMonster(advHigherCap, 'loot-boar-1', 'butcher', 'player');
  const confirmButcher2 = InventoryLootService.confirmPickup(butcherRes2.updatedAdventure, 'player', butcherRes2.updatedAdventure.pendingPickup!);
  assert(confirmButcher2.acceptedItems.length === 1, '14. Verbleibendes Leder später erfolgreich aufgenommen');

  const lsAfterButcher2 = confirmButcher2.updatedAdventure.lootSources?.find(s => s.id === 'loot-boar-1');
  assert(lsAfterButcher2?.harvestOptions?.isBodyHarvested === true, '15. isBodyHarvested IST TRUE erst nach vollständiger Beräumung');
}

// 2. IDENTITÄT & UNTERSCHEIDUNG
// Requirement 16-20: Konkrete itemInstanceId, Trennung gleichnamiger Items, kein Namens-Fallback bei falscher ID.
{
  const adv = createBaseAdventure();
  const pelt1: ItemInstance = {
    id: 'inst-pelt-101',
    itemDefinitionId: 'def-pelt',
    name: 'Wolfsfell',
    owner: 'player',
    weightKg: 1.0,
    quantity: 1
  };

  const pelt2: ItemInstance = {
    id: 'inst-pelt-202',
    itemDefinitionId: 'def-pelt',
    name: 'Wolfsfell',
    owner: 'player',
    weightKg: 1.0,
    quantity: 1
  };

  const advWithPelts = { ...adv, itemInstances: [pelt1, pelt2] };

  // Drop specifically pelt1
  const dropRes = InventoryLootService.dropItem(advWithPelts, 'player', 'inst-pelt-101');
  assert(dropRes.droppedItem?.itemInstance.id === 'inst-pelt-101', '16. Gleichnamiges Item A (inst-pelt-101) gezielt abgelegt');
  const remainingInInv = dropRes.updatedAdventure.itemInstances?.find(i => i.id === 'inst-pelt-202');
  assert(remainingInInv?.owner === 'player', '17. Gleichnamiges Item B (inst-pelt-202) bleibt unbeeinträchtigt im Inventar');

  // Pickup with bad itemInstanceId MUST NOT fall back to name matching
  const badPickup = InventoryLootService.pickupItems(advWithPelts, 'player', [{ itemInstanceId: 'invalid-id-999' }]);
  assert(badPickup.acceptedItems.length === 0, '18. Ungültige itemInstanceId wird abgewiesen');
  assert(badPickup.rejectedItems[0].reason.includes('nicht gefunden'), '19. Abweisungsgrund nennt fehlende ID (kein Fallback auf Name)');

  // Destroy specifically pelt2
  const destroyRes = InventoryLootService.destroyItem(advWithPelts, 'player', 'inst-pelt-202');
  assert(!destroyRes.updatedAdventure.itemInstances.some(i => i.id === 'inst-pelt-202'), '20. Zerstören betrifft ausschließlich konkrete itemInstanceId');
}

// 3. KANONISCHES INVENTAR & LEGACY ISOLATION
// Requirement 21-24: Possession tracked via ItemInstance, no writes/reliance on legacy inventory string array.
{
  const adv = createBaseAdventure();

  const testItem: ItemInstance = {
    id: 'inst-amulet-77',
    itemDefinitionId: 'def-amulet',
    name: 'Uraltes Amulett',
    weightKg: 0.2,
    quantity: 1
  };

  const pickupRes = InventoryLootService.executePickup(adv, 'player', [{ item: testItem }]);
  const canonicalItem = pickupRes.updatedAdventure.itemInstances.find(i => i.id === 'inst-amulet-77');

  assert(Boolean(canonicalItem && canonicalItem.owner === 'player' && canonicalItem.currentState === 'im Inventar'), '21. ItemInstance in kanonischem Inventar gespeichert');
  assert(!((pickupRes.updatedAdventure.inventory || []).includes('Uraltes Amulett')), '22. Pickup schreibt NICHT in legacy inventory: string[] Array');

  // Verify capacity & carry calculation works strictly from ItemInstance registry
  const capacity = InventoryLootService.getCarryCapacity(pickupRes.updatedAdventure, 'player');
  assert(capacity.currentWeightKg === 0.2, '23. Traglast wird kanonisch aus ItemInstance berechnet');
  assert(capacity.remainingCapacityKg === 19.8, '24. Verbleibende Traglast exakt berechnet');
}

// 4. ALLTAGSKOMPETENZEN & WERKZEUGE
// Requirement 25-27: Kompetenz beeinflusst Qualität/Ertrag ohne harte Barriere, Werkzeug- & Quellenzustandsberücksichtigung.
{
  const adv = createBaseAdventure();
  const baseYield = [{ name: 'Heilkraut', quantity: 5, weightKg: 0.1 }];

  // Fresh vs Damaged plant
  const freshPerf = InventoryLootService.evaluateHarvestPerformance(adv.player, adv, 'player', 'harvest_herbs', 'frisch', baseYield);
  const damagedPerf = InventoryLootService.evaluateHarvestPerformance(adv.player, adv, 'player', 'harvest_herbs', 'zertrampelt', baseYield);
  assert(freshPerf.computedYield[0].quantity > damagedPerf.computedYield[0].quantity, '25. Frische Quelle ergibt höheren Ertrag als zertrampelte Quelle');

  // Low vs High competency
  // Gareth: Zerlegen (15%) vs Lyra: Zerlegen (85%)
  const garethPerf = InventoryLootService.evaluateHarvestPerformance(adv.player, adv, 'player', 'butcher', 'frisch', baseYield);
  const lyraChar = adv.npcs![0];
  const lyraPerf = InventoryLootService.evaluateHarvestPerformance(lyraChar, adv, 'npc-companion', 'butcher', 'frisch', baseYield);

  assert(garethPerf.computedYield[0].quality === 'Gering', '26. Niedrige Kompetenz erzeugt geringe Qualität');
  assert(lyraPerf.computedYield[0].quality === 'Außergewöhnlich', '27. Hohe Kompetenz erzeugt außergewöhnliche Qualität');
}

// 5. ABSCHLUSSKORREKTUR TESTS (TESTS A BIS K)
// Test A: Kein Proposal -> confirmPickup scheitert, Inventar unverändert, kein Proposal erzeugt
{
  const adv = createBaseAdventure();
  delete adv.pendingPickup;
  const res = InventoryLootService.confirmPickup(adv, 'player', [{ itemInstanceId: 'inst-123', quantity: 1 }]);
  assert(res.acceptedItems.length === 0, 'Test A: confirmPickup ohne pendingPickup nimmt nichts auf');
  assert(!res.updatedAdventure.pendingPickup, 'Test A: Kein neues Proposal erzeugt');
  assert(res.updatedAdventure.itemInstances.length === 0, 'Test A: Inventar unverändert');
}

// Test B: Falsche ID -> Proposal hat item-inst-A, Bestätigung fordert item-inst-B -> Abweisung
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-b',
    sourceTitle: 'Truhe',
    sourceType: 'chest',
    items: [{ id: 'item-inst-A', itemDefinitionId: 'def-a', name: 'Dolch', quantity: 1, weightKg: 0.5 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...adv, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-B', quantity: 1 }]);
  assert(res.acceptedItems.length === 0, 'Test B: Falsche ID wird abgewiesen');
  assert(!res.updatedAdventure.itemInstances.some(i => i.id === 'item-inst-B'), 'Test B: Kein Inventareintrag für unpassende ID');
}

// Test C: Richtige ID -> Pickup erfolgreich
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-c',
    sourceTitle: 'Kiste',
    sourceType: 'chest',
    items: [{ id: 'item-inst-A', itemDefinitionId: 'def-a', name: 'Schwert', quantity: 5, weightKg: 1.0 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...adv, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-A', quantity: 5 }]);
  assert(res.acceptedItems.length === 1 && res.acceptedItems[0].quantity === 5, 'Test C: Bestätigung mit korrekter ID nimmt 5 Schwerter auf');
  assert(!res.updatedAdventure.pendingPickup, 'Test C: Proposal nach vollständiger Bestätigung gelöscht');
}

// Test D: Teilbestätigung -> Proposal hat 5, Bestätigung fordert 2 -> 2 aufgenommen, 3 verbleiben
{
  const adv = createBaseAdventure();
  const itemInst: ItemInstance = { id: 'item-inst-A', itemDefinitionId: 'def-a', name: 'Trank', quantity: 5, weightKg: 0.5 };
  const ls: LootSource = { id: 'ls-d', type: 'chest', title: 'Truhe', items: [itemInst] };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const proposal: PendingPickupProposal = {
    id: 'prop-d',
    sourceTitle: 'Truhe',
    sourceType: 'chest',
    lootSourceId: 'ls-d',
    items: [itemInst],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...advReg, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-A', quantity: 2 }]);
  assert(res.acceptedItems.length === 1 && res.acceptedItems[0].quantity === 2, 'Test D: 2 von 5 Tränken aufgenommen');
  assert(Boolean(res.updatedAdventure.pendingPickup), 'Test D: Rest-Proposal bleibt vorhanden');
}

// Test E: Zu große Bestätigungsmenge -> Proposal hat 5, Bestätigung fordert 8 -> Abweisung
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-e',
    sourceTitle: 'Truhe',
    sourceType: 'chest',
    items: [{ id: 'item-inst-A', itemDefinitionId: 'def-a', name: 'Pfeile', quantity: 5, weightKg: 0.1 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...adv, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-A', quantity: 8 }]);
  assert(res.acceptedItems.length === 0, 'Test E: Zu große Bestätigungsmenge wird strikt abgewiesen');
  assert(res.rejectedItems.length > 0, 'Test E: Abweisungsgrund für überschrittene Menge vorhanden');
  assert(res.updatedAdventure.itemInstances.length === 0, 'Test E: Keine automatische Reduzierung / kein Pickup');
}

// Test F: Gleichnamiges anderes Item -> Proposal hat item-inst-A, Welt hat item-inst-B -> Abweisung
{
  const adv = createBaseAdventure();
  const peltB: ItemInstance = { id: 'item-inst-B', itemDefinitionId: 'def-p', name: 'Wolfsfell', quantity: 1, weightKg: 1.0 };
  const ls: LootSource = { id: 'ls-f', type: 'chest', title: 'Truhe', items: [peltB] };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;

  const proposal: PendingPickupProposal = {
    id: 'prop-f',
    sourceTitle: 'Andere Quelle',
    sourceType: 'chest',
    items: [{ id: 'item-inst-A', itemDefinitionId: 'def-p', name: 'Wolfsfell', quantity: 1, weightKg: 1.0 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...advReg, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-B', quantity: 1 }]);
  assert(res.acceptedItems.length === 0, 'Test F: Gleichnamiges anderes Item außerhalb des Proposals wird abgewiesen');
}

// Test G: Item existiert noch in Quelle -> Erfolgreicher Pickup
{
  const adv = createBaseAdventure();
  const herb: ItemInstance = { id: 'item-inst-g', itemDefinitionId: 'def-h', name: 'Heilkraut', quantity: 1, weightKg: 0.1 };
  const ls: LootSource = { id: 'ls-g', type: 'resource_node', title: 'Busch', items: [herb] };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const proposal: PendingPickupProposal = {
    id: 'prop-g',
    sourceTitle: 'Busch',
    sourceType: 'resource_node',
    lootSourceId: 'ls-g',
    items: [herb],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...advReg, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-g', quantity: 1 }]);
  assert(res.acceptedItems.length === 1, 'Test G: Vorhandener Gegenstand an Quelle erfolgreich aufgenommen');
}

// Test H: Item inzwischen verschwunden -> Abweisung bei Quellprüfung
{
  const adv = createBaseAdventure();
  const ls: LootSource = { id: 'ls-h', type: 'chest', title: 'Leere Truhe', items: [] };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const proposal: PendingPickupProposal = {
    id: 'prop-h',
    sourceTitle: 'Truhe',
    sourceType: 'chest',
    lootSourceId: 'ls-h',
    items: [{ id: 'item-inst-vanished', itemDefinitionId: 'def-v', name: 'Verschwundener Ring', quantity: 1, weightKg: 0.1 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...advReg, pendingPickup: proposal };

  const res = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'item-inst-vanished', quantity: 1 }]);
  assert(res.acceptedItems.length === 0, 'Test H: Aus Quelle verschwundener Gegenstand wird bei Quellprüfung abgewiesen');
}

// Test I: Monsterernte bei always_confirm -> pendingPickup, Bestätigung nimmt Item auf
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-beast-i',
    type: 'monster_body',
    title: 'Schattenwolf',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Schattenkristall', quantity: 1, weightKg: 0.5, category: 'Rohstoffe' }]
    }
  };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const harvRes = InventoryLootService.harvestMonster(advReg, 'loot-beast-i', 'crystals', 'player');

  assert(harvRes.gainedItems.length === 0, 'Test I: Monsterernte bewirkt KEINEN sofortigen Inventarzugang bei always_confirm');
  assert(Boolean(harvRes.updatedAdventure.pendingPickup), 'Test I: PendingPickupProposal nach harvestMonster vorhanden');

  const confirmRes = InventoryLootService.confirmPickup(harvRes.updatedAdventure, 'player', harvRes.updatedAdventure.pendingPickup!, { sourceId: 'loot-beast-i' });
  assert(confirmRes.acceptedItems.length === 1, 'Test I: Bestätigte Monsterernte nimmt Item in Inventar auf');
  assert(confirmRes.updatedAdventure.itemInstances.some(i => i.name.includes('Schattenkristall') && i.owner === 'player'), 'Test I: Item ist im Inventar des Spielers');
}

// Test J: WorldDrop mit Proposal erfolgreich, ohne Proposal abgelehnt
{
  const adv = createBaseAdventure();
  const item: ItemInstance = { id: 'wd-item-1', itemDefinitionId: 'def-wd', name: 'Münzbeutel', quantity: 1, weightKg: 0.2 };
  const advWithDrop: Adventure = {
    ...adv,
    worldDrops: [{ id: 'drop-1', itemInstance: item, droppedAtTime: new Date().toISOString() }]
  };

  const noPropRes = InventoryLootService.confirmPickup(advWithDrop, 'player', [{ itemInstanceId: 'wd-item-1', quantity: 1 }]);
  assert(noPropRes.acceptedItems.length === 0, 'Test J: confirmPickup ohne Proposal für WorldDrop wird abgelehnt');

  const prop: PendingPickupProposal = {
    id: 'prop-wd',
    sourceTitle: 'Boden',
    sourceType: 'world_item',
    items: [item],
    timestamp: new Date().toISOString()
  };
  const advWithProp = { ...advWithDrop, pendingPickup: prop };

  const withPropRes = InventoryLootService.confirmPickup(advWithProp, 'player', [{ itemInstanceId: 'wd-item-1', quantity: 1 }]);
  assert(withPropRes.acceptedItems.length === 1, 'Test J: confirmPickup mit Proposal für WorldDrop ist erfolgreich');
}

// Test K: Auto Pickup Einstellungen funktionieren weiterhin ohne manuelles Proposal
{
  const advSmall = {
    ...createBaseAdventure(),
    inventorySettings: {
      pickupConfirmationMode: 'auto_small' as const,
      maxCarryCapacityKg: 20.0
    }
  };
  const lightHerb: ItemInstance = { id: 'inst-light-herb', itemDefinitionId: 'def-herb', name: 'Waldkräuter', quantity: 1, weightKg: 0.2 };
  assert(InventoryLootService.isAutoPickupAllowed(lightHerb, 'auto_small', 20.0), 'Test K: Auto-Pickup erlaubt kleine normale Gegenstände');
}

// Test L: AI Transfer Action erzeugt pendingTransfer Proposal und Bestätigung transferiert Gegenstand
{
  const adv = createBaseAdventure();
  const npcItem: ItemInstance = {
    id: 'npc-item-1',
    itemDefinitionId: 'def-elixir',
    name: 'Heilelixier',
    owner: 'npc-lyra',
    quantity: 2,
    weightKg: 0.5
  };
  adv.itemInstances = [npcItem];

  // Process AI Inventory Change with action 'transfer' from NPC to Player
  const updatedAdv = EquipmentConditionService.processAiStateChanges(
    adv,
    [
      {
        item: 'Heilelixier',
        action: 'transfer',
        ownerId: 'npc-lyra',
        toOwnerId: 'player',
        quantity: 1,
        itemInstanceId: 'npc-item-1'
      }
    ]
  );

  assert(Boolean(updatedAdv.pendingTransfer), 'Test L: pendingTransfer Proposal erzeugt bei NPC->Spieler Übergabe');
  assert(updatedAdv.pendingTransfer?.itemName === 'Heilelixier', 'Test L: Korrekter Itemname im Proposal');
  assert(updatedAdv.pendingTransfer?.quantity === 1, 'Test L: Korrekte Übergabemenge im Proposal');

  // Confirm transfer
  const confirmRes = EquipmentConditionService.confirmItemTransfer(updatedAdv, updatedAdv.pendingTransfer!);
  assert(confirmRes.success, 'Test L: Übergabe erfolgreich bestätigt');
  assert(!confirmRes.updatedAdventure.pendingTransfer, 'Test L: pendingTransfer nach Bestätigung geleert');

  const playerInst = confirmRes.updatedAdventure.itemInstances?.find(i => i.owner === 'player' && i.name === 'Heilelixier');
  const npcInst = confirmRes.updatedAdventure.itemInstances?.find(i => i.owner === 'npc-lyra' && i.name === 'Heilelixier');
  assert(Boolean(playerInst && playerInst.quantity === 1), 'Test L: Spieler besitzt 1 Heilelixier');
  assert(Boolean(npcInst && npcInst.quantity === 1), 'Test L: NPC behält 1 verbleibendes Heilelixier');
}

// Test M: AI Transfer Ablehnung
{
  const adv = createBaseAdventure();
  const npcItem: ItemInstance = {
    id: 'npc-item-2',
    itemDefinitionId: 'def-amulet',
    name: 'Schutzamulett',
    owner: 'npc-lyra',
    quantity: 1,
    weightKg: 0.1
  };
  adv.itemInstances = [npcItem];

  const updatedAdv = EquipmentConditionService.processAiStateChanges(
    adv,
    [
      {
        item: 'Schutzamulett',
        action: 'transfer',
        ownerId: 'npc-lyra',
        toOwnerId: 'player',
        quantity: 1,
        itemInstanceId: 'npc-item-2'
      }
    ]
  );

  const rejectRes = EquipmentConditionService.rejectItemTransfer(updatedAdv);
  assert(rejectRes.success, 'Test M: Übergabe erfolgreich abgelehnt');
  assert(!rejectRes.updatedAdventure.pendingTransfer, 'Test M: pendingTransfer nach Ablehnung geleert');
  const playerHasItem = rejectRes.updatedAdventure.itemInstances?.some(i => i.owner === 'player' && i.name === 'Schutzamulett');
  const npcStillHasItem = rejectRes.updatedAdventure.itemInstances?.some(i => i.owner === 'npc-lyra' && i.name === 'Schutzamulett');
  assert(!playerHasItem, 'Test M: Spieler hat das abgelehnte Item nicht erhalten');
  assert(npcStillHasItem, 'Test M: NPC behält das abgelehnte Item');
}

// === COMPREHENSIVE TRANSFER & FIRESTORE SECURITY TESTS ===

// Test A – Kein pendingTransfer vorhanden
{
  const adv = createBaseAdventure();
  adv.pendingTransfer = null;
  const res = EquipmentConditionService.confirmItemTransfer(adv);
  assert(res.success === false, 'Test A: confirmItemTransfer ohne pendingTransfer liefert success: false');
  assert(res.error?.includes('Kein ausstehender Übergabe-Vorschlag'), 'Test A: Verständliche Fehlermeldung');
}

// Test B – Vollständiges Proposal stimmt exakt mit pendingTransfer überein
{
  const adv = createBaseAdventure();
  const sword: ItemInstance = {
    id: 'sword-inst-1',
    itemDefinitionId: 'def-sword',
    name: 'Langschwert',
    owner: 'npc-lyra',
    quantity: 1,
    weightKg: 2.0
  };
  adv.itemInstances = [sword];
  const proposal: PendingItemTransferProposal = {
    id: 'transfer-b-1',
    itemInstanceId: 'sword-inst-1',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Langschwert',
    createdAt: Date.now()
  };
  adv.pendingTransfer = proposal;

  const res = EquipmentConditionService.confirmItemTransfer(adv, proposal);
  assert(res.success === true, 'Test B: Vollständiges, identisches Proposal erfolgreich übertragen');
  assert(res.updatedAdventure.pendingTransfer === null, 'Test B: pendingTransfer nach Erfolg geleert');
  const playerItem = res.updatedAdventure.itemInstances?.find(i => i.id === 'sword-inst-1');
  assert(playerItem?.owner === 'player', 'Test B: Gegenstand gehört nun dem Spieler');
}

// Test C – Falsche Proposal-ID wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-c', itemDefinitionId: 'def-c', name: 'Dolch', owner: 'npc-lyra', quantity: 1 }];
  adv.pendingTransfer = {
    id: 'transfer-real',
    itemInstanceId: 'inst-c',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Dolch',
    createdAt: Date.now()
  };

  const fakeProp = { ...adv.pendingTransfer, id: 'transfer-fake' };
  const res = EquipmentConditionService.confirmItemTransfer(adv, fakeProp);
  assert(res.success === false, 'Test C: Falsche Proposal-ID wird abgelehnt');
  assert(res.updatedAdventure.pendingTransfer?.id === 'transfer-real', 'Test C: pendingTransfer bleibt unverändert aktiv');
}

// Test D – Falsche ItemInstance-ID wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [
    { id: 'inst-d1', itemDefinitionId: 'def-d', name: 'Stab', owner: 'npc-lyra', quantity: 1 },
    { id: 'inst-d2', itemDefinitionId: 'def-d', name: 'Stab', owner: 'npc-lyra', quantity: 1 }
  ];
  adv.pendingTransfer = {
    id: 'transfer-d',
    itemInstanceId: 'inst-d1',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Stab',
    createdAt: Date.now()
  };

  const tamperedProp = { ...adv.pendingTransfer, itemInstanceId: 'inst-d2' };
  const res = EquipmentConditionService.confirmItemTransfer(adv, tamperedProp);
  assert(res.success === false, 'Test D: Mismatch bei ItemInstance-ID abgelehnt');
}

// Test E – Proposal mit fehlendem Identitätsfeld wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-e', itemDefinitionId: 'def-e', name: 'Ring', owner: 'npc-lyra', quantity: 1 }];
  adv.pendingTransfer = {
    id: 'transfer-e',
    itemInstanceId: 'inst-e',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Ring',
    createdAt: Date.now()
  };

  const incompleteProp = {
    id: 'transfer-e',
    itemInstanceId: 'inst-e',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: '', // FEHLT!
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    itemName: 'Ring',
    createdAt: Date.now()
  } as any;

  const res = EquipmentConditionService.confirmItemTransfer(adv, incompleteProp);
  assert(res.success === false, 'Test E: Unvollständiges Proposal mit fehlendem Identitätsfeld abgewiesen');
}

// Test F – Falscher Geber (fromOwnerId) wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-f', itemDefinitionId: 'def-f', name: 'Helm', owner: 'npc-lyra', quantity: 1 }];
  adv.pendingTransfer = {
    id: 'transfer-f',
    itemInstanceId: 'inst-f',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Helm',
    createdAt: Date.now()
  };

  const wrongSender = { ...adv.pendingTransfer, fromOwnerId: 'npc-stranger' };
  const res = EquipmentConditionService.confirmItemTransfer(adv, wrongSender);
  assert(res.success === false, 'Test F: Mismatch beim Absender (fromOwnerId) abgewiesen');
}

// Test G – Falscher Empfänger (toOwnerId) wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-g', itemDefinitionId: 'def-g', name: 'Schild', owner: 'npc-lyra', quantity: 1 }];
  adv.pendingTransfer = {
    id: 'transfer-g',
    itemInstanceId: 'inst-g',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Schild',
    createdAt: Date.now()
  };

  const wrongReceiver = { ...adv.pendingTransfer, toOwnerId: 'npc-other' };
  const res = EquipmentConditionService.confirmItemTransfer(adv, wrongReceiver);
  assert(res.success === false, 'Test G: Mismatch beim Empfänger abgewiesen');
}

// Test H – Falsche Menge (Proposal verlangt mehr als Geber besitzt) wird abgelehnt
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-h', itemDefinitionId: 'def-h', name: 'Pfeile', owner: 'npc-lyra', quantity: 5 }];
  adv.pendingTransfer = {
    id: 'transfer-h',
    itemInstanceId: 'inst-h',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 10, // Mehr als die 5 vorhandenen!
    itemName: 'Pfeile',
    createdAt: Date.now()
  };

  const res = EquipmentConditionService.confirmItemTransfer(adv, adv.pendingTransfer);
  assert(res.success === false, 'Test H: Überschrittene Menge beim Geber wird abgewiesen');
  assert(res.updatedAdventure.itemInstances?.[0].quantity === 5, 'Test H: Geber behält alle 5 Pfeile');
}

// Test I – Gegenstand inzwischen verschwunden
{
  const adv = createBaseAdventure();
  adv.itemInstances = []; // Item existiert nicht mehr in itemInstances
  adv.pendingTransfer = {
    id: 'transfer-i',
    itemInstanceId: 'inst-deleted',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Verschwundenes Buch',
    createdAt: Date.now()
  };

  const res = EquipmentConditionService.confirmItemTransfer(adv, adv.pendingTransfer);
  assert(res.success === false, 'Test I: Nicht mehr existierendes Item wird abgewiesen');
  assert(res.updatedAdventure.pendingTransfer?.id === 'transfer-i', 'Test I: pendingTransfer bleibt zur Einsicht erhalten');
}

// Test J – Gegenstand inzwischen bei anderem Besitzer
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'inst-j', itemDefinitionId: 'def-j', name: 'Karte', owner: 'npc-other', quantity: 1 }];
  adv.pendingTransfer = {
    id: 'transfer-j',
    itemInstanceId: 'inst-j',
    fromOwnerId: 'npc-lyra', // Geber war Lyra, aber Item ist bei npc-other
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Karte',
    createdAt: Date.now()
  };

  const res = EquipmentConditionService.confirmItemTransfer(adv, adv.pendingTransfer);
  assert(res.success === false, 'Test J: Transfer abgewiesen da Geber nicht mehr Eigentümer ist');
  assert(res.updatedAdventure.itemInstances?.[0].owner === 'npc-other', 'Test J: Besitz bleibt unverändert');
}

// Test K – Teilübergabe (10 -> Vorschlag 3 -> Spieler 3 / Geber 7)
{
  const adv = createBaseAdventure();
  adv.itemInstances = [{ id: 'potion-stack', itemDefinitionId: 'def-potion', name: 'Heiltrank', owner: 'npc-lyra', quantity: 10, weightKg: 0.5 }];
  adv.pendingTransfer = {
    id: 'transfer-k',
    itemInstanceId: 'potion-stack',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 3,
    itemName: 'Heiltrank',
    createdAt: Date.now()
  };

  const res = EquipmentConditionService.confirmItemTransfer(adv, adv.pendingTransfer);
  assert(res.success === true, 'Test K: Teilübergabe erfolgreich');
  const playerPotions = res.updatedAdventure.itemInstances?.find(i => i.owner === 'player' && i.name === 'Heiltrank');
  const npcPotions = res.updatedAdventure.itemInstances?.find(i => i.owner === 'npc-lyra' && i.name === 'Heiltrank');
  assert(playerPotions?.quantity === 3, 'Test K: Spieler erhält exakt 3 Tränke');
  assert(npcPotions?.quantity === 7, 'Test K: NPC behält exakt 7 Tränke');
}

// Test L – Gleichnamiger anderer Gegenstand: Niemals Item B statt Item A übertragen
{
  const adv = createBaseAdventure();
  const swordA: ItemInstance = { id: 'sword-a', itemDefinitionId: 'def-sw', name: 'Breitschwert', owner: 'npc-lyra', quantity: 1, condition: 'abgenutzt' };
  const swordB: ItemInstance = { id: 'sword-b', itemDefinitionId: 'def-sw', name: 'Breitschwert', owner: 'npc-lyra', quantity: 1, condition: 'meisterhaft' };
  adv.itemInstances = [swordA, swordB];

  adv.pendingTransfer = {
    id: 'transfer-l',
    itemInstanceId: 'sword-a',
    fromOwnerId: 'npc-lyra',
    fromOwnerName: 'Lyra',
    toOwnerId: 'player',
    toOwnerName: 'Gareth',
    quantity: 1,
    itemName: 'Breitschwert',
    createdAt: Date.now()
  };

  const res = EquipmentConditionService.confirmItemTransfer(adv, adv.pendingTransfer);
  assert(res.success === true, 'Test L: Transfer von sword-a erfolgreich');
  const transferred = res.transferredItem;
  assert(transferred?.id === 'sword-a', 'Test L: Exakt sword-a wurde übertragen');
  assert(transferred?.condition === 'abgenutzt', 'Test L: Übertragener Zustand entspricht sword-a');
  const remainingNpcSword = res.updatedAdventure.itemInstances?.find(i => i.owner === 'npc-lyra');
  assert(remainingNpcSword?.id === 'sword-b', 'Test L: sword-b (meisterhaft) verbleibt unberührt beim NPC');
}

// === FIRESTORE SECURITY & ERROR TESTS ===

// Test M – Erfolgreicher Cloud-Read (Normaler Reconcile)
{
  const { StorageService } = await import('../lib/storageService');
  const localAdvs = [{ id: 'adv-m', storyTitle: 'Abenteuer M', updatedAt: '2026-09-23T01:00:00Z', storyHistory: ['A'] }];
  const cloudAdvs = [{ id: 'adv-m', storyTitle: 'Abenteuer M Cloud', updatedAt: '2026-09-23T02:00:00Z', storyHistory: ['A', 'B'] }];

  const reconciled = StorageService.reconcileAdventures(localAdvs, cloudAdvs);
  assert(reconciled.mergedAdventures.length === 1, 'Test M: 1 Abenteuer zusammengeführt');
  assert(reconciled.mergedAdventures[0].storyTitle === 'Abenteuer M Cloud', 'Test M: Neuere Cloud-Version gewinnt');
}

// Test N – Cloud tatsächlich leer (Leerer Snapshot erlaubt Upload)
{
  const { StorageService } = await import('../lib/storageService');
  const localAdvs = [{ id: 'adv-n', storyTitle: 'Lokales Solo-Abenteuer', updatedAt: '2026-09-23T01:00:00Z' }];
  await StorageService.setItem('adventures', localAdvs);

  // Simuliere erfolgreichen Cloud-Read, der eine leere Liste zurückgibt
  const res = await StorageService.syncAllToFirestore('test-user-n', {
    cloudReader: async () => [],
    skipCloudWrite: true
  });

  assert(res.success === true, 'Test N: Sync mit tatsächlich leerer Cloud erfolgreich');
  assert(res.mergedAdventures?.length === 1, 'Test N: Lokale Daten bleiben in mergedAdventures erhalten');
}

// Test O – Cloud-Read-Fehler (Netzwerkfehler bricht ab, lokale Daten geschützt)
{
  const { StorageService } = await import('../lib/storageService');
  const originalLocalAdvs = [{ id: 'adv-o', storyTitle: 'Geschütztes Abenteuer', updatedAt: '2026-09-23T01:00:00Z' }];
  await StorageService.setItem('adventures', originalLocalAdvs);

  // Simuliere Firestore-Lesefehler
  const res = await StorageService.syncAllToFirestore('test-user-o', {
    cloudReader: async () => {
      throw new Error('Firestore connection failure / timeout');
    },
    skipCloudWrite: true
  });

  assert(res.success === false, 'Test O: Lesefehler führt zu success: false');
  assert(res.message.includes('Cloud-Daten konnten nicht gelesen werden'), 'Test O: Meldung weist auf Lesefehler hin');

  // Prüfe dass lokale Daten unverändert geblieben sind
  const currentLocal = await StorageService.getItem<any[]>('adventures');
  assert(currentLocal?.length === 1 && currentLocal[0].id === 'adv-o', 'Test O: Lokale IndexedDB-Daten bleiben unangetastet');
}

// Test P – Cloud-Read-Fehler durch Quota
{
  const { StorageService } = await import('../lib/storageService');
  const originalLocalAdvs = [{ id: 'adv-p', storyTitle: 'Quota-Geschütztes Abenteuer', updatedAt: '2026-09-23T01:00:00Z' }];
  await StorageService.setItem('adventures', originalLocalAdvs);

  const res = await StorageService.syncAllToFirestore('test-user-p', {
    cloudReader: async () => {
      throw new Error('Quota exceeded for Firestore database');
    },
    skipCloudWrite: true
  });

  assert(res.success === false, 'Test P: Quota-Fehler führt zu success: false');
  assert(res.message.includes('Firestore-Quota'), 'Test P: Spezifische Quota-Warnung zurückgegeben');

  const currentLocal = await StorageService.getItem<any[]>('adventures');
  assert(currentLocal?.length === 1 && currentLocal[0].id === 'adv-p', 'Test P: Lokale Daten bleiben trotz Quota-Fehler sicher erhalten');
}

console.log(`\n=== TEST RUN COMPLETE ===`);
console.log(`Tests ausgeführt: ${testCount}`);
console.log(`Bestanden: ${passCount}`);
console.log(`Fehlgeschlagen: ${testCount - passCount}`);

if (passCount !== testCount) {
  process.exit(1);
}
