import { InventoryLootService } from '../services/inventoryLootService';
import { EquipmentConditionService } from '../services/equipmentConditionService';
import { Adventure, Character, NPC, ItemInstance, LootSource, PendingPickupProposal } from '../types';

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
// Test A: Always Confirm -> unbestätigter Pickup blockiert, Proposal vorhanden
{
  const adv = createBaseAdventure();
  const newItem = { action: 'added' as const, item: 'Seltene Schriftrolle', ownerId: 'player' };
  let notifications: any[] = [];
  const advWithProposal = EquipmentConditionService.processAiStateChanges(adv, [newItem], [], notifications);

  assert(Boolean(advWithProposal.pendingPickup), 'Test A: always_confirm erzeugt PendingPickupProposal');
  assert(!advWithProposal.itemInstances.some(i => i.name === 'Seltene Schriftrolle' && i.owner === 'player'), 'Test A: Item ohne Bestätigung noch NICHT im Besitz');
}

// Test B: Gültige Bestätigung -> Inventar aktualisiert, Proposal gelöscht
{
  const adv = createBaseAdventure();
  const newItem = { action: 'added' as const, item: 'Zauberstab', ownerId: 'player' };
  let notifications: any[] = [];
  const advProp = EquipmentConditionService.processAiStateChanges(adv, [newItem], [], notifications);

  const proposal = advProp.pendingPickup!;
  const confirmRes = InventoryLootService.confirmPickup(advProp, 'player', proposal);

  assert(confirmRes.acceptedItems.length === 1, 'Test B: confirmPickup nimmt Gegenstand erfolgreich auf');
  assert(confirmRes.updatedAdventure.itemInstances.some(i => i.name === 'Zauberstab' && i.owner === 'player'), 'Test B: Item nach Bestätigung im Inventar');
  assert(confirmRes.updatedAdventure.pendingPickup === null, 'Test B: Proposal nach vollständiger Bestätigung bereinigt');
}

// Test C: Falsche ItemInstanceId -> Abweisung, kein Inventareintrag
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-1',
    sourceTitle: 'Truhe',
    sourceType: 'chest',
    items: [{ id: 'inst-real-id', itemDefinitionId: 'def-1', name: 'Dolch', quantity: 1, weightKg: 0.5 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...adv, pendingPickup: proposal };

  const confirmRes = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'inst-fake-id', quantity: 1 }]);
  assert(confirmRes.acceptedItems.length === 0, 'Test C: Falsche ItemInstanceId wird abgewiesen');
  assert(confirmRes.rejectedItems.length > 0, 'Test C: Rejection Grund für falsche ID vorhanden');
  assert(!confirmRes.updatedAdventure.itemInstances.some(i => i.name === 'Dolch' && i.owner === 'player'), 'Test C: Kein Inventareintrag bei falscher ID');
}

// Test D: Zu große Bestätigungsmenge -> Deckelung auf vorhandene Proposalmenge
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-qty',
    sourceTitle: 'Sack',
    sourceType: 'world_item',
    items: [{ id: 'inst-coins', itemDefinitionId: 'def-coin', name: 'Goldmünzen', quantity: 3, weightKg: 0.1 }],
    timestamp: new Date().toISOString()
  };
  const advProp = { ...adv, pendingPickup: proposal };

  const confirmRes = InventoryLootService.confirmPickup(advProp, 'player', [{ itemInstanceId: 'inst-coins', quantity: 5 }]);
  assert(confirmRes.acceptedItems.length === 1 && confirmRes.acceptedItems[0].quantity === 3, 'Test D: Menge auf vorgeschlagene 3 Stück gedeckelt');
}

// Test E: Ungültiges Proposal / Fehlende ID -> Abweisung ohne Inventarmutation
{
  const adv = createBaseAdventure();
  const confirmRes = InventoryLootService.confirmPickup(adv, 'player', [{ itemInstanceId: 'non-existent-id-999' }]);
  assert(confirmRes.acceptedItems.length === 0, 'Test E: confirmPickup ohne gültigen Vorschlag/Quelle abgewiesen');
  assert(confirmRes.updatedAdventure.itemInstances.length === 0, 'Test E: Keine Inventarmutation bei ungültigem Proposal');
}

// Test F: Direkte pickupItems-Aufrufe -> Direkte Aufnahme blockiert bei always_confirm
{
  const adv = createBaseAdventure();
  const item: ItemInstance = { id: 'inst-herb-direct', itemDefinitionId: 'def-herb', name: 'Heilkraut', weightKg: 0.1, quantity: 1 };
  const directRes = InventoryLootService.pickupItems(adv, 'player', [{ itemInstanceId: item.id, item }]);

  assert(directRes.acceptedItems.length === 0, 'Test F: Direkte pickupItems() ohne confirm ist bei always_confirm blockiert');
  assert(Boolean(directRes.updatedAdventure.pendingPickup), 'Test F: Proposal wurde stattdessen erzeugt');
}

// Test G: Monsterernte bei always_confirm -> kein sofortiger Inventarzugang, Proposal vorhanden
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-beast-g',
    type: 'monster_body',
    title: 'Schattenwolf',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Schattenkristall', quantity: 1, weightKg: 0.5, category: 'Rohstoffe' }]
    }
  };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const harvRes = InventoryLootService.harvestMonster(advReg, 'loot-beast-g', 'crystals', 'player');

  assert(harvRes.gainedItems.length === 0, 'Test G: Monsterernte bewirkt KEINEN sofortigen Inventarzugang bei always_confirm');
  assert(Boolean(harvRes.updatedAdventure.pendingPickup), 'Test G: PendingPickupProposal nach harvestMonster vorhanden');
}

// Test H: Bestätigte Monsterernte -> Inventar erhält tatsächliche ItemInstance
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-beast-h',
    type: 'monster_body',
    title: 'Schattenwolf',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Schattenkristall', quantity: 1, weightKg: 0.5, category: 'Rohstoffe' }]
    }
  };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const harvRes = InventoryLootService.harvestMonster(advReg, 'loot-beast-h', 'crystals', 'player');
  const confirmRes = InventoryLootService.confirmPickup(harvRes.updatedAdventure, 'player', harvRes.updatedAdventure.pendingPickup!, { sourceId: 'loot-beast-h' });

  assert(confirmRes.acceptedItems.length === 1, 'Test H: Bestätigte Monsterernte nimmt Item in Inventar auf');
  assert(confirmRes.updatedAdventure.itemInstances.some(i => i.name.includes('Schattenkristall') && i.owner === 'player'), 'Test H: Item ist im Inventar des Spielers');
}

// Test I: Auto Small
{
  const advSmall = {
    ...createBaseAdventure(),
    inventorySettings: {
      pickupConfirmationMode: 'auto_small' as const,
      maxCarryCapacityKg: 20.0
    }
  };
  const lightHerb: ItemInstance = { id: 'inst-light-herb', itemDefinitionId: 'def-herb', name: 'Waldkräuter', quantity: 1, weightKg: 0.2 };
  assert(InventoryLootService.isAutoPickupAllowed(lightHerb, 'auto_small', 20.0), 'Test I: Kleines normales Item darf auto-aufgenommen werden');
}

// Test J: Same-Name Items -> Gezielte Aufnahme über itemInstanceId
{
  const adv = createBaseAdventure();
  const peltA: ItemInstance = { id: 'inst-pelt-A', itemDefinitionId: 'def-pelt', name: 'Wolfsfell', quantity: 5, weightKg: 1.0 };
  const peltB: ItemInstance = { id: 'inst-pelt-B', itemDefinitionId: 'def-pelt', name: 'Wolfsfell', quantity: 1, weightKg: 1.0 };
  const ls: LootSource = { id: 'loot-pelts-j', type: 'chest', title: 'Truhe', items: [peltA, peltB] };
  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;

  const pickupB = InventoryLootService.confirmPickup(advReg, 'player', [{ itemInstanceId: 'inst-pelt-B', quantity: 1 }], { sourceId: 'loot-pelts-j' });
  assert(pickupB.acceptedItems.length === 1 && pickupB.acceptedItems[0].id === 'inst-pelt-B', 'Test J: Gezielt nur inst-pelt-B aufgenommen');
  const lsItems = pickupB.updatedAdventure.lootSources?.find(s => s.id === 'loot-pelts-j')?.items || [];
  assert(lsItems.length === 1 && lsItems[0].id === 'inst-pelt-A' && lsItems[0].quantity === 5, 'Test J: inst-pelt-A unverändert an Quelle');
}

// Test K: Teilaufnahme mit Menge 4 aus 10 -> Rest-ID mit Menge 6 entsteht
{
  const adv = createBaseAdventure();
  const herbInst: ItemInstance = { id: 'inst-herb-10', itemDefinitionId: 'def-herb', name: 'Schattenkraut', quantity: 10, weightKg: 1.0, owner: 'world' };
  const ls: LootSource = { id: 'loot-patch-k', type: 'resource_node', title: 'Fundstelle', items: [herbInst] };
  let advCap4 = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  advCap4 = { ...advCap4, inventorySettings: { pickupConfirmationMode: 'always_confirm', maxCarryCapacityKg: 4.0 } };

  const pickup1 = InventoryLootService.confirmPickup(advCap4, 'player', [{ itemInstanceId: 'inst-herb-10', quantity: 10 }], { sourceId: 'loot-patch-k' });
  assert(pickup1.acceptedItems.length === 1 && pickup1.acceptedItems[0].quantity === 4, 'Test K: Genau 4 von 10 Kräutern aufgenommen');

  const lsAfter = pickup1.updatedAdventure.lootSources?.find(s => s.id === 'loot-patch-k');
  assert(lsAfter?.items.length === 1, 'Test K: Quelle enthält Restmenge');
  assert(lsAfter!.items[0].id !== 'inst-herb-10', 'Test K: Restmenge hat NEUE ItemInstanceId erhalten');
  assert(lsAfter!.items[0].quantity === 6, 'Test K: Restmenge beträgt exakt 6');
}

console.log(`\n=== TEST RUN COMPLETE ===`);
console.log(`Tests ausgeführt: ${testCount}`);
console.log(`Bestanden: ${passCount}`);
console.log(`Fehlgeschlagen: ${testCount - passCount}`);

if (passCount !== testCount) {
  process.exit(1);
}
