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

  // Attempt 3: Pickup now succeeds
  const res3 = InventoryLootService.harvestMonster(advFree, 'loot-crystal-beast', 'crystals', 'player');
  assert(res3.gainedItems.length === 1, '7. Kristalle erfolgreich in Inventar aufgenommen bei freier Traglast');

  const lsAfter3 = res3.updatedAdventure.lootSources?.find(s => s.id === 'loot-crystal-beast');
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
  assert(butcherRes.gainedItems.length === 1, '10. Partial butchering pickup: 1 item accepted within 12kg capacity');
  assert(butcherRes.rejectedItems.length === 1, '11. 1 butchered item rejected due to weight limit');

  const lsAfterButcher = butcherRes.updatedAdventure.lootSources?.find(s => s.id === 'loot-boar-1');
  assert(lsAfterButcher?.harvestOptions?.isBodyHarvested !== true, '12. isBodyHarvested IST FALSE bei Teilaufnahme');
  assert(Boolean(lsAfterButcher && lsAfterButcher.items.length === 1), '13. Verbleibendes Leder verbleibt an LootSource');

  // Free capacity and take remaining item
  const advHigherCap: Adventure = {
    ...butcherRes.updatedAdventure,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 30.0
    }
  };

  const butcherRes2 = InventoryLootService.harvestMonster(advHigherCap, 'loot-boar-1', 'butcher', 'player');
  assert(butcherRes2.gainedItems.length === 1, '14. Verbleibendes Leder später erfolgreich aufgenommen');

  const lsAfterButcher2 = butcherRes2.updatedAdventure.lootSources?.find(s => s.id === 'loot-boar-1');
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

  const pickupRes = InventoryLootService.pickupItems(adv, 'player', [{ item: testItem }]);
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
// Test A & B & C: Teilaufnahme erzeugt neue Rest-ID, keine doppelten IDs, zweiter Pickup verwendet Rest-ID
{
  const adv = createBaseAdventure();
  const herbInst: ItemInstance = {
    id: 'inst-herb-001',
    itemDefinitionId: 'def-herb',
    name: 'Schattenkraut',
    quantity: 10,
    weightKg: 1.0,
    owner: 'world',
    currentState: 'am Boden'
  };

  const ls: LootSource = {
    id: 'loot-herb-patch',
    type: 'resource_node',
    title: 'Kräuterfundstelle',
    items: [herbInst]
  };

  let advNode = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;

  // Set carry capacity limit to 4 kg so only 4 items fit out of 10
  advNode = {
    ...advNode,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 4.0
    }
  };

  // Test A: Pickup 4 from 10
  const pickup1 = InventoryLootService.pickupItems(advNode, 'player', [
    { itemInstanceId: 'inst-herb-001', quantity: 10 }
  ], { sourceId: 'loot-herb-patch' });

  const takenInst1 = pickup1.acceptedItems.find(i => i.id === 'inst-herb-001');
  assert(Boolean(takenInst1 && takenInst1.quantity === 4 && takenInst1.owner === 'player'), 'Test A: Inventar enthält inst-herb-001 mit Menge 4');

  const lsAfterA = pickup1.updatedAdventure.lootSources?.find(s => s.id === 'loot-herb-patch');
  assert(lsAfterA?.items.length === 1, 'Test A: LootQuelle enthält genau 1 Rest-Eintrag');

  const restItemA = lsAfterA!.items[0];
  assert(restItemA.id !== 'inst-herb-001', 'Test A: Restmenge hat eine NEUE konkrete ItemInstanceId erhalten');
  assert(restItemA.quantity === 6, 'Test A: Restmenge an Quelle beträgt exakt 6');

  // Test B: Keine doppelte ID in itemInstances
  const allIdsInItemInstances = pickup1.updatedAdventure.itemInstances.map(i => i.id);
  const uniqueIdsCount = new Set(allIdsInItemInstances).size;
  assert(allIdsInItemInstances.length === uniqueIdsCount, 'Test B: Alle itemInstanceIds in itemInstances sind streng eindeutig (keine Duplikate)');
  assert(!pickup1.updatedAdventure.itemInstances.some(i => i.id === restItemA.id && i.owner === 'player'), 'Test B: Rest-ID gehört noch nicht dem Spieler');

  // Test C: Zweite Aufnahme verwendet Rest-ID
  const advMoreCap: Adventure = {
    ...pickup1.updatedAdventure,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 20.0
    }
  };

  const pickup2 = InventoryLootService.pickupItems(advMoreCap, 'player', [
    { itemInstanceId: restItemA.id, quantity: 6 }
  ], { sourceId: 'loot-herb-patch' });

  assert(pickup2.acceptedItems.length === 1, 'Test C: Restliche 6 Stücke erfolgreich aufgenommen');
  assert(pickup2.acceptedItems[0].id === restItemA.id, 'Test C: Rest-ID wurde zur Aufnahme genutzt');

  const lsAfterC = pickup2.updatedAdventure.lootSources?.find(s => s.id === 'loot-herb-patch');
  assert(lsAfterC?.items.length === 0, 'Test C: LootQuelle ist nun vollständig leer');
}

// Test D: Traglast 0
{
  const adv = createBaseAdventure();
  const heavyInst: ItemInstance = {
    id: 'inst-ore-99',
    itemDefinitionId: 'def-ore',
    name: 'Golderz',
    quantity: 5,
    weightKg: 5.0,
    owner: 'world'
  };
  const ls: LootSource = {
    id: 'loot-ore-node',
    type: 'resource_node',
    title: 'Ader',
    items: [heavyInst]
  };
  let adv0Cap = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  adv0Cap = {
    ...adv0Cap,
    inventorySettings: {
      pickupConfirmationMode: 'always_confirm',
      maxCarryCapacityKg: 0.0
    }
  };

  const pickupRes = InventoryLootService.pickupItems(adv0Cap, 'player', [
    { itemInstanceId: 'inst-ore-99', quantity: 5 }
  ], { sourceId: 'loot-ore-node' });

  assert(pickupRes.acceptedItems.length === 0, 'Test D: Traglast 0 verhindert Aufnahme vollständig');
  const lsAfter = pickupRes.updatedAdventure.lootSources?.find(s => s.id === 'loot-ore-node');
  assert(lsAfter?.items[0].id === 'inst-ore-99' && lsAfter?.items[0].quantity === 5, 'Test D: Quelle unverändert bei Traglast 0');
}

// Test E & F: Confirmation Gate & ConfirmPickup
{
  const adv = createBaseAdventure();
  const newItem = {
    action: 'added' as const,
    item: 'Seltene Schriftrolle',
    ownerId: 'player'
  };

  // Processing AI change with always_confirm -> must produce PendingPickupProposal
  let notifications: any[] = [];
  const advWithProposal = EquipmentConditionService.processAiStateChanges(adv, [newItem], [], notifications);

  assert(Boolean(advWithProposal.pendingPickup), 'Test E: Confirmation Gate erzeugt PendingPickupProposal bei always_confirm');
  assert(!advWithProposal.itemInstances.some(i => i.name === 'Seltene Schriftrolle' && i.owner === 'player'), 'Test E: Item ohne Bestätigung noch NICHT im Besitz');

  // Test F: confirmPickup()
  const proposal = advWithProposal.pendingPickup!;
  const confirmRes = InventoryLootService.confirmPickup(advWithProposal, 'player', proposal);

  assert(confirmRes.acceptedItems.length === 1, 'Test F: confirmPickup nimmt Gegenstand erfolgreich auf');
  assert(confirmRes.updatedAdventure.itemInstances.some(i => i.name === 'Seltene Schriftrolle' && i.owner === 'player'), 'Test F: Item nach Bestätigung im Inventar');
  assert(confirmRes.updatedAdventure.pendingPickup === null, 'Test F: Proposal nach vollständiger Bestätigung bereinigt');
}

// Test G: Auto-Small
{
  const advSmall = {
    ...createBaseAdventure(),
    inventorySettings: {
      pickupConfirmationMode: 'auto_small' as const,
      maxCarryCapacityKg: 20.0
    }
  };

  const lightHerb: ItemInstance = {
    id: 'inst-light-herb',
    itemDefinitionId: 'def-light-herb',
    name: 'Waldkräuter',
    quantity: 1,
    weightKg: 0.2
  };

  const questKey: ItemInstance = {
    id: 'inst-quest-key',
    itemDefinitionId: 'def-key',
    name: 'Burgschlüssel (Quest)',
    quantity: 1,
    weightKg: 0.1
  };

  assert(InventoryLootService.isAutoPickupAllowed(lightHerb, 'auto_small', 20.0), 'Test G: Kleines normales Item darf auto-aufgenommen werden');
  assert(!InventoryLootService.isAutoPickupAllowed(questKey, 'auto_small', 20.0, { isQuestItem: true }), 'Test G: Quest-Gegenstand bleibt geschützt vor Auto-Pickup');
}

// Test H: Gleiche Namen
{
  const adv = createBaseAdventure();
  const peltA: ItemInstance = { id: 'inst-pelt-A', itemDefinitionId: 'def-pelt', name: 'Wolfsfell', quantity: 5, weightKg: 1.0 };
  const peltB: ItemInstance = { id: 'inst-pelt-B', itemDefinitionId: 'def-pelt', name: 'Wolfsfell', quantity: 1, weightKg: 1.0 };

  const ls: LootSource = {
    id: 'loot-pelts-stack',
    type: 'chest',
    title: 'Truhe mit Fellen',
    items: [peltA, peltB]
  };

  const advReg = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  const pickupB = InventoryLootService.pickupItems(advReg, 'player', [{ itemInstanceId: 'inst-pelt-B' }], { sourceId: 'loot-pelts-stack' });

  assert(pickupB.acceptedItems.length === 1 && pickupB.acceptedItems[0].id === 'inst-pelt-B', 'Test H: Gezielt nur inst-pelt-B aufgenommen');
  const lsItems = pickupB.updatedAdventure.lootSources?.find(s => s.id === 'loot-pelts-stack')?.items || [];
  assert(lsItems.length === 1 && lsItems[0].id === 'inst-pelt-A' && lsItems[0].quantity === 5, 'Test H: inst-pelt-A vollständig unverändert an Quelle');
}

// Test I: Falsche ID
{
  const adv = createBaseAdventure();
  const pickupBad = InventoryLootService.pickupItems(adv, 'player', [{ itemInstanceId: 'non-existent-id-xyz' }]);
  assert(pickupBad.acceptedItems.length === 0, 'Test I: Falsche ID wird ohne Namens-Fallback abgewiesen');
}

// Test J: WorldDrop Teilaufnahme
{
  const adv = createBaseAdventure();
  const targetId = EquipmentConditionService.resolveTargetId(adv, 'player');
  const dropItem: ItemInstance = { id: 'inst-ore-001', itemDefinitionId: 'def-ore', name: 'Eisenerz', quantity: 8, weightKg: 1.0, owner: targetId };
  const dropRes = InventoryLootService.dropItem({ ...adv, itemInstances: [dropItem] }, 'player', 'inst-ore-001');

  // Set capacity to 3 kg so only 3 out of 8 iron ore fit
  let advCap3 = {
    ...dropRes.updatedAdventure,
    inventorySettings: { pickupConfirmationMode: 'always_confirm' as const, maxCarryCapacityKg: 3.0 }
  };

  const worldDropId = dropRes.droppedItem!.id;
  const pickup3 = InventoryLootService.pickupItems(advCap3, 'player', [{ itemInstanceId: 'inst-ore-001', quantity: 8 }]);

  assert(pickup3.acceptedItems.length === 1 && pickup3.acceptedItems[0].quantity === 3, 'Test J: WorldDrop Teilaufnahme von 3 Stücken ins Inventar');
  const remainingWd = pickup3.updatedAdventure.worldDrops?.find(w => w.id === worldDropId);
  assert(Boolean(remainingWd && remainingWd.itemInstance.quantity === 5), 'Test J: WorldDrop behält 5 Reststücke');
  assert(remainingWd!.itemInstance.id !== 'inst-ore-001', 'Test J: Restmenge im WorldDrop hat neue eindeutige ID');
}

// Test K: Harvest Teilaufnahme & Status-Abschluss
{
  const adv = createBaseAdventure();
  const skilledPlayer = {
    ...adv.player,
    professionCompetencies: [
      { id: 'comp-1', name: 'Kräuterkunde', category: 'Fortgeschritten', proficiency: 100, talent: 5, experiencePoints: 1000 },
      { id: 'comp-2', name: 'Zerlegen', category: 'Grundlage', proficiency: 100, talent: 5, experiencePoints: 1000 }
    ]
  };
  const advSkilled = { ...adv, player: skilledPlayer };

  const ls: LootSource = {
    id: 'loot-beast-k',
    type: 'monster_body',
    title: 'Schattenpanzer',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Monsterkristall', quantity: 3, weightKg: 1.0, category: 'Rohstoffe' }]
    }
  };

  let advCap1 = InventoryLootService.registerLootSource(advSkilled, ls).updatedAdventure;
  advCap1 = { ...advCap1, inventorySettings: { pickupConfirmationMode: 'always_confirm', maxCarryCapacityKg: 1.0 } };

  // First attempt: crystals generated on source, capacity only holds 1
  const harv1 = InventoryLootService.harvestMonster(advCap1, 'loot-beast-k', 'crystals', 'player');
  assert(harv1.gainedItems.length === 1 && harv1.gainedItems[0].quantity === 1, 'Test K: 1 Kristall aufgenommen');

  const ls1 = harv1.updatedAdventure.lootSources?.find(s => s.id === 'loot-beast-k');
  assert(ls1?.harvestOptions?.isCrystalsHarvested !== true, 'Test K: isCrystalsHarvested IST FALSE bei Teilaufnahme');

  const restCrystalItem = ls1!.items[0];
  const restCrystalId = restCrystalItem.id;
  const expectedRemainingQty = restCrystalItem.quantity;
  assert(restCrystalId !== 'inst-harv-crystal-0', 'Test K: Restkristall an Quelle hat neue Rest-ID');

  // Second attempt: free capacity to 20 kg and pick up remaining crystals
  let advCap20 = { ...harv1.updatedAdventure, inventorySettings: { pickupConfirmationMode: 'always_confirm', maxCarryCapacityKg: 20.0 } };
  const harv2 = InventoryLootService.harvestMonster(advCap20, 'loot-beast-k', 'crystals', 'player');

  assert(harv2.gainedItems.length === 1 && harv2.gainedItems[0].quantity === expectedRemainingQty, `Test K: ${expectedRemainingQty} restliche Kristalle aufgenommen`);
  const ls2 = harv2.updatedAdventure.lootSources?.find(s => s.id === 'loot-beast-k');
  assert(ls2?.harvestOptions?.isCrystalsHarvested === true, 'Test K: isCrystalsHarvested IST TRUE erst nach vollständiger Aufnahme');
}

console.log(`\n=== TEST RUN COMPLETE ===`);
console.log(`Tests ausgeführt: ${testCount}`);
console.log(`Bestanden: ${passCount}`);
console.log(`Fehlgeschlagen: ${testCount - passCount}`);

if (passCount !== testCount) {
  process.exit(1);
}
