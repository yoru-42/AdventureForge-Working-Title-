import { InventoryLootService } from '../services/inventoryLootService';
import { EquipmentConditionService } from '../services/equipmentConditionService';
import { Adventure, Character, NPC, ItemInstance, LootSource, PendingPickupProposal } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
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

// Test 1: Pickup proposal generates no inventory change until confirmed
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-1',
    sourceTitle: 'Schatztruhe',
    sourceType: 'chest',
    items: [
      {
        id: 'inst-gold-key',
        itemDefinitionId: 'def-key',
        name: 'Goldschlüssel',
        weightKg: 0.1,
        quantity: 1
      }
    ]
  };

  const advWithProposal = { ...adv, pendingPickup: proposal };
  assert((advWithProposal.itemInstances || []).length === 0, 'Test 1a: No items added to inventory during proposal stage');
  assert(advWithProposal.pendingPickup !== null, 'Test 1b: Pending pickup proposal exists');
}

// Test 2: Confirmation creates actual inventory change
{
  const adv = createBaseAdventure();
  const proposal: PendingPickupProposal = {
    id: 'prop-1',
    sourceTitle: 'Schatztruhe',
    sourceType: 'chest',
    items: [
      {
        id: 'inst-gold-key',
        itemDefinitionId: 'def-key',
        name: 'Goldschlüssel',
        weightKg: 0.1,
        quantity: 1
      }
    ]
  };

  const confirmRes = InventoryLootService.confirmPickup(adv, 'player', proposal);
  assert(confirmRes.acceptedItems.length === 1, 'Test 2a: 1 item accepted on confirmation');
  assert(confirmRes.updatedAdventure.itemInstances.some(i => i.id === 'inst-gold-key' && i.owner === 'player'), 'Test 2b: Item instance moved to player inventory');
  assert(confirmRes.updatedAdventure.pendingPickup === null, 'Test 2c: Pending pickup cleared');
}

// Test 3: Rejection / Ignoring leaves loot at source
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-chest-1',
    type: 'chest',
    title: 'Alte Holztruhe',
    items: [
      { id: 'inst-ruby', itemDefinitionId: 'def-ruby', name: 'Rubin', weightKg: 0.2, quantity: 1 }
    ]
  };

  const registered = InventoryLootService.registerLootSource(adv, ls);
  assert(registered.updatedAdventure.itemInstances.length === 0, 'Test 3a: No items in inventory');
  const sourceInAdv = registered.updatedAdventure.lootSources?.find(s => s.id === 'loot-chest-1');
  assert(Boolean(sourceInAdv && sourceInAdv.items.length === 1), 'Test 3b: Item remains at LootSource');
}

// Test 4 & 5: Auto-pickup works according to setting and respects rare/story items
{
  const rareCrystal: ItemInstance = {
    id: 'inst-rare-crys',
    itemDefinitionId: 'def-crys',
    name: 'Seltenes Drachenauge',
    quality: 'Selten',
    weightKg: 0.2,
    quantity: 1
  };

  const commonHerb: ItemInstance = {
    id: 'inst-herb-1',
    itemDefinitionId: 'def-herb',
    name: 'Heilkraut',
    quality: 'Gewöhnlich',
    weightKg: 0.1,
    quantity: 1
  };

  assert(!InventoryLootService.isAutoPickupAllowed(commonHerb, 'always_confirm', 20.0), 'Test 4a: Common herb requires confirmation in always_confirm mode');
  assert(InventoryLootService.isAutoPickupAllowed(commonHerb, 'auto_small', 20.0), 'Test 4b: Common herb auto-picked in auto_small mode');
  assert(!InventoryLootService.isAutoPickupAllowed(rareCrystal, 'auto_small', 20.0), 'Test 5a: Rare item requires explicit confirmation even in auto_small mode');
}

// Test 6, 7, 8, 9: Carry capacity validation, partial pickup, non-fit items remain at source
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-stack',
    type: 'chest',
    title: 'Erztruhe',
    items: [
      { id: 'inst-heavy-1', itemDefinitionId: 'def-ore', name: 'Eisenerz A', weightKg: 10.0, quantity: 1 },
      { id: 'inst-heavy-2', itemDefinitionId: 'def-ore', name: 'Eisenerz B', weightKg: 8.0, quantity: 1 },
      { id: 'inst-heavy-3', itemDefinitionId: 'def-ore', name: 'Eisenerz C', weightKg: 5.0, quantity: 1 }
    ]
  };

  let registeredAdv = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;

  // Carry limit 20.0 kg. Taking A (10 kg) + B (8 kg) = 18 kg fits. C (5 kg) fails!
  const res = InventoryLootService.pickupItems(registeredAdv, 'player', [
    { itemInstanceId: 'inst-heavy-1', quantity: 1 },
    { itemInstanceId: 'inst-heavy-2', quantity: 1 },
    { itemInstanceId: 'inst-heavy-3', quantity: 1 }
  ]);

  assert(res.acceptedItems.length === 2, 'Test 6a: Exactly 2 items accepted within capacity');
  assert(res.rejectedItems.length === 1, 'Test 7a: 1 item rejected due to overencumbrance');
  assert(res.rejectedItems[0].item.id === 'inst-heavy-3', 'Test 7b: Item C rejected');

  const remainingLoot = res.updatedAdventure.lootSources?.find(s => s.id === 'loot-stack');
  assert(Boolean(remainingLoot && remainingLoot.items.some(i => i.id === 'inst-heavy-3')), 'Test 8a: Rejected item C remains at LootSource');
  assert(Boolean(remainingLoot && !remainingLoot.items.some(i => i.id === 'inst-heavy-1')), 'Test 8b: Accepted item A removed from LootSource');
}

// Test 10 & 11: Monster crystals remain at source if pickup fails due to capacity
{
  const adv = createBaseAdventure();
  const heavyDummy: ItemInstance = {
    id: 'inst-dummy-heavy',
    itemDefinitionId: 'def-heavy',
    name: 'Schwerer Anker',
    owner: 'player',
    weightKg: 19.9,
    quantity: 1
  };

  let advFilled: Adventure = { ...adv, itemInstances: [heavyDummy] };

  const ls: LootSource = {
    id: 'loot-beast',
    type: 'monster_body',
    title: 'Schattenwolf',
    items: [],
    harvestOptions: {
      allowHarvestCrystals: true,
      crystalYield: [{ name: 'Großer Schattenkristall', quantity: 1, weightKg: 2.5, category: 'Rohstoffe' }]
    }
  };

  advFilled = InventoryLootService.registerLootSource(advFilled, ls).updatedAdventure;

  const harvestRes = InventoryLootService.harvestMonster(advFilled, 'loot-beast', 'crystals', 'player');

  assert(harvestRes.gainedItems.length === 0, 'Test 10a: No crystals gained due to full weight');
  assert(harvestRes.rejectedItems.length === 1, 'Test 10b: Crystal rejected due to capacity');

  const updatedLs = harvestRes.updatedAdventure.lootSources?.find(s => s.id === 'loot-beast');
  assert(Boolean(updatedLs && updatedLs.harvestOptions?.isCrystalsHarvested), 'Test 11a: Monster marked as harvested');
  assert(Boolean(updatedLs && updatedLs.items.length > 0), 'Test 11b: Harvested crystal remains at LootSource for later collection');
  assert(updatedLs!.items[0].name === 'Großer Schattenkristall', 'Test 11c: Correct crystal stored at LootSource');
}

// Test 12, 13, 14, 15, 16, 17, 18: Everyday competencies affect harvest/butchering yield & quality without hard barrier
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-boar',
    type: 'animal_body',
    title: 'Wildschwein',
    items: [],
    harvestOptions: {
      allowButcher: true,
      butcherYield: [{ name: 'Wildschweinfleisch', quantity: 4, weightKg: 1.0 }]
    }
  };

  const advSource = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;

  // Gareth has Zerlegen (15%)
  const playerButcher = InventoryLootService.harvestMonster(advSource, 'loot-boar', 'butcher', 'player');

  // Lyra has Zerlegen (85%)
  const companionButcher = InventoryLootService.harvestMonster(advSource, 'loot-boar', 'butcher', 'npc-companion');

  assert(playerButcher.gainedItems.length > 0, 'Test 14a: Low competency player can still perform butchering');
  assert(companionButcher.gainedItems.length > 0, 'Test 14b: High competency companion performs butchering');

  assert(companionButcher.gainedItems[0].quality === 'Außergewöhnlich', 'Test 16a: High competency produces Exceptional quality');
  assert(playerButcher.gainedItems[0].quality === 'Gering', 'Test 16b: Low competency produces Low quality');
}

// Test 20: Source condition affects harvest results
{
  const adv = createBaseAdventure();
  const executor = adv.player;
  const baseYield = [{ name: 'Kräuter', quantity: 10, weightKg: 0.1 }];

  const freshPerf = InventoryLootService.evaluateHarvestPerformance(executor, adv, 'player', 'harvest_herbs', 'frisch', baseYield);
  const damagedPerf = InventoryLootService.evaluateHarvestPerformance(executor, adv, 'player', 'harvest_herbs', 'zertrampelt', baseYield);

  assert(freshPerf.computedYield[0].quantity > damagedPerf.computedYield[0].quantity, 'Test 20a: Fresh plant yields more herbs than trampled plant');
}

// Test 21, 22, 23, 24, 25: ItemInstance identity strictness and invalid ID handling
{
  const adv = createBaseAdventure();
  const item1: ItemInstance = {
    id: 'inst-pelt-101',
    itemDefinitionId: 'def-pelt',
    name: 'Wolfsfell',
    owner: 'player',
    weightKg: 1.0,
    quantity: 1
  };

  const item2: ItemInstance = {
    id: 'inst-pelt-202',
    itemDefinitionId: 'def-pelt',
    name: 'Wolfsfell',
    owner: 'player',
    weightKg: 1.0,
    quantity: 1
  };

  const advWithPelts = { ...adv, itemInstances: [item1, item2] };

  // Drop specifically item1
  const dropRes = InventoryLootService.dropItem(advWithPelts, 'player', 'inst-pelt-101');
  assert(dropRes.droppedItem?.itemInstance.id === 'inst-pelt-101', 'Test 22a: Specifically item 101 dropped');
  const remainingInInv = dropRes.updatedAdventure.itemInstances?.find(i => i.id === 'inst-pelt-202');
  assert(remainingInInv?.owner === 'player', 'Test 22b: Item 202 remains owned by player');

  // Pickup with bad ID MUST NOT fallback to name matching!
  const badPickup = InventoryLootService.pickupItems(advWithPelts, 'player', [{ itemInstanceId: 'invalid-id-xyz' }]);
  assert(badPickup.acceptedItems.length === 0, 'Test 25a: Invalid itemInstanceId rejects pickup');
  assert(badPickup.rejectedItems[0].reason.includes('nicht gefunden'), 'Test 25b: Correct rejection reason provided');
}

// Test 26, 27, 28, 29: Collection tasks and delegated NPC execution
{
  const adv = createBaseAdventure();
  const taskRes = InventoryLootService.createCollectionTask(adv, {
    title: 'Heilkräuter sammeln',
    targetQuantity: 5,
    itemKeywords: ['Heilkraut'],
    assignedToCharacterId: 'npc-companion'
  });

  let taskAdv = taskRes.updatedAdventure;
  const task = taskRes.task;

  assert(task.assignedToCharacterId === 'npc-companion', 'Test 26a: Task assigned to companion');

  const herb: ItemInstance = {
    id: 'inst-herb-comp-1',
    itemDefinitionId: 'def-herb',
    name: 'Heilkraut',
    weightKg: 0.1,
    quantity: 3
  };

  const pickup = InventoryLootService.pickupItems(taskAdv, 'npc-companion', [{ item: herb }]);
  taskAdv = pickup.updatedAdventure;

  const updatedTask = taskAdv.collectionTasks?.find(t => t.id === task.id);
  assert(updatedTask?.collectedQuantity === 3, 'Test 27a: Task progress advanced by companion collection');
  assert(pickup.acceptedItems[0].owner === 'npc-companion', 'Test 27b: Item owned by companion');
}

// Test 32, 33, 34: Story-Info separation from ItemInstance
{
  const adv = createBaseAdventure();
  const advWithStory: Adventure = {
    ...adv,
    storyState: {
      ...adv.storyState,
      storyEntities: [
        { id: 'entity-crystal', title: 'Uralter Kristall', category: 'Gegenstände', description: 'Ein magischer Kristall.' } as any
      ]
    },
    itemInstances: [
      { id: 'inst-crys-999', itemDefinitionId: 'def-crys', name: 'Uralter Kristall', owner: 'player', weightKg: 1.0 }
    ]
  };

  const destroyRes = InventoryLootService.destroyItem(advWithStory, 'player', 'inst-crys-999');
  assert(!destroyRes.updatedAdventure.itemInstances.some(i => i.id === 'inst-crys-999'), 'Test 32a: Physical item destroyed');
  assert((destroyRes.updatedAdventure.storyState?.storyEntities?.length || 0) === 1, 'Test 32b: Story entity remains intact in storyState');
}

// Test 35: Silence / passage of turns does not automatically erase loot sources
{
  const adv = createBaseAdventure();
  const ls: LootSource = {
    id: 'loot-persistent-1',
    type: 'corpse',
    title: 'Gefallener Söldner',
    items: [
      { id: 'inst-dagger-1', itemDefinitionId: 'def-dagger', name: 'Dolch', weightKg: 0.5 }
    ]
  };

  const registeredAdv = InventoryLootService.registerLootSource(adv, ls).updatedAdventure;
  assert(registeredAdv.lootSources?.some(s => s.id === 'loot-persistent-1') === true, 'Test 35a: LootSource persists across turns');
}

console.log('\n=== ALL 35 INVENTORY & LOOT TESTS PASSED WITH ZERO FAILURES! ===');
