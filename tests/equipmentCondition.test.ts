import { EquipmentConditionService } from '../services/equipmentConditionService';
import { AIStoryStateProcessor } from '../services/aiStoryStateProcessor';
import { Adventure, Character, NPC, BodyArea } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function createBaseAdventure(): Adventure {
  const player: Character = {
    id: 'player-1',
    name: 'Kaelen',
    role: 'Abenteurer',
    personality: 'Mutig',
    bio: 'Ein reisender Schwertkämpfer.',
    attributes: [
      { name: 'Stärke', value: 14, max: 20 },
      { name: 'Geschicklichkeit', value: 12, max: 20 }
    ],
    appearance: {
      gender: 'Männlich',
      build: 'athletisch',
      hairColor: 'schwarz',
      eyeColor: 'grau',
      age: '24',
      activeConditions: []
    },
    equipment: []
  };

  const npc: NPC = {
    id: 'npc-lyra',
    name: 'Lyra',
    role: 'Schurkin',
    personality: 'Verschlagen',
    bio: 'Eine geschickte Diebin.',
    isHostile: false,
    attributes: [
      { name: 'Geschicklichkeit', value: 16, max: 20 }
    ],
    appearance: {
      gender: 'Weiblich',
      build: 'zierlich',
      hairColor: 'rot',
      eyeColor: 'grün',
      age: '22',
      activeConditions: []
    },
    equipment: []
  };

  return {
    id: 'adv-test-1',
    authorId: 'user-1',
    isPublic: false,
    world: {
      title: 'Eldoria',
      description: 'Eine mittelalterliche Fantasy-Welt',
      era: 'Mittelalter',
      tone: 'Heroisch',
      territories: [],
      connections: []
    },
    player,
    npcs: [npc],
    inventory: [],
    structuredInventory: {
      armor: {},
      accessories: {},
      weapons: [],
      generalItems: [],
      money: 50,
      currencyLabel: 'Goldmünzen'
    },
    equipmentState: [],
    itemDefinitions: [],
    itemInstances: [],
    statusElements: [],
    chatHistory: [],
    prologue: 'Das Abenteuer beginnt...',
    storyState: {
      storyEntities: [],
      lastUpdatedTime: new Date().toISOString()
    }
  };
}

console.log('=== RUNNING ADVENTUREFORGE EQUIPMENT & BODY CONDITION TEST SUITE ===\n');

// Test 1: Restraint attached to player creates ItemInstance, EquipmentState, and persistent BodyCondition
{
  const adv = createBaseAdventure();
  const res = EquipmentConditionService.attachRestraint(
    adv,
    'player',
    'Schwere Eisenfesseln',
    ['hands', 'arms'],
    { description: 'Magisch verstärkte Eisenfesseln, die Hände und Unterarme binden' }
  );

  const updated = res.updatedAdventure;
  const cond = updated.player.appearance?.activeConditions?.find(c => c.name === 'Schwere Eisenfesseln');
  const equip = updated.equipmentState?.find(e => e.itemName === 'Schwere Eisenfesseln');
  const instance = updated.itemInstances?.find(i => i.name === 'Schwere Eisenfesseln');

  assert(Boolean(cond && cond.isActive && cond.isRestraint), 'Test 1a: BodyCondition created and active on player');
  assert(cond?.bodyAreas?.includes('hands') && cond?.bodyAreas?.includes('arms'), 'Test 1b: BodyAreas include hands and arms');
  assert(Boolean(equip && equip.equipped && equip.isRestraint && equip.ownerId === 'player'), 'Test 1c: EquipmentState registered');
  assert(Boolean(instance && instance.owner === 'player'), 'Test 1d: ItemInstance tracked with player ownership');
}

// Test 2: Persistence across multiple turns: subsequent turns without mentioning shackles do NOT remove them
{
  const adv = createBaseAdventure();
  // Turn 1: Attach shackles
  const turn1Ai = `
Die Wachen überwältigen Kaelen und legen ihm schwere Eisenfesseln an.
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    {
      "item": "Schwere Eisenfesseln",
      "action": "attach",
      "bodyAreas": ["hands", "arms"],
      "description": "Fesseln an den Händen"
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res1 = AIStoryStateProcessor.parseAndProcessAiResponse(turn1Ai, adv);
  let state = res1.updatedAdventure;

  assert(
    (state.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2a: Turn 1 shackles attached'
  );

  // Turn 2: Guard speaks, does NOT mention shackles
  const turn2Ai = `
Der Hauptmann tritt vor dich und verhört dich streng über deine Herkunft.
<STORY_STATE_CHANGES>
{
  "events": [
    {
      "title": "Verhör durch den Hauptmann",
      "description": "Der Hauptmann stellt Fragen."
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res2 = AIStoryStateProcessor.parseAndProcessAiResponse(turn2Ai, state);
  state = res2.updatedAdventure;

  assert(
    (state.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2b: Turn 2 shackles remain persistently active despite not being mentioned'
  );

  // Turn 3: Guard leads player to another cell, does NOT mention shackles
  const turn3Ai = `
Die Zellentür quietscht, als du in den Kerker geführt wirst.
<STORY_STATE_CHANGES>
{
  "locationChange": {
    "locationName": "Burgkerker",
    "roomName": "Dunkle Zelle"
  }
}
</STORY_STATE_CHANGES>
  `;
  const res3 = AIStoryStateProcessor.parseAndProcessAiResponse(turn3Ai, state);
  state = res3.updatedAdventure;

  assert(
    (state.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2c: Turn 3 shackles still persistently active in new location'
  );
}

// Test 3: Explicit detachment cleanly removes condition and updates equipment
{
  const adv = createBaseAdventure();
  const resAttach = EquipmentConditionService.attachRestraint(adv, 'player', 'Kettenfesseln', ['hands']);
  let state = resAttach.updatedAdventure;

  assert((state.player.appearance?.activeConditions || []).length === 1, 'Test 3a: 1 condition active before detach');

  // Turn with explicit detach
  const detachAi = `
Mit einem versteckten Dietrich knackst du das Schloss der Kettenfesseln und streifst sie ab!
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    {
      "item": "Kettenfesseln",
      "action": "detach"
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const resDetach = AIStoryStateProcessor.parseAndProcessAiResponse(detachAi, state);
  state = resDetach.updatedAdventure;

  const remainingCond = (state.player.appearance?.activeConditions || []).find(c => c.name.toLowerCase().includes('kettenfessel'));
  const remainingEquip = (state.equipmentState || []).find(e => e.itemName.toLowerCase().includes('kettenfessel'));

  assert(!remainingCond, 'Test 3b: BodyCondition cleanly removed on detach');
  assert(!remainingEquip, 'Test 3c: EquipmentState cleanly detached');
}

// Test 4: Equipping regular gear updates EquipmentState and structuredInventory
{
  const adv = createBaseAdventure();
  const resHelm = EquipmentConditionService.equipItem(adv, 'player', 'Eisenhelm', 'head');
  let state = resHelm.updatedAdventure;
  const resChest = EquipmentConditionService.equipItem(state, 'player', 'Lederharnisch', 'chest');
  state = resChest.updatedAdventure;
  const resWpn = EquipmentConditionService.equipItem(state, 'player', 'Stahlschwert', 'weapon', ['hands']);
  state = resWpn.updatedAdventure;

  assert(state.structuredInventory?.armor?.head === 'Eisenhelm', 'Test 4a: Head slot synced with Eisenhelm');
  assert(state.structuredInventory?.armor?.chest === 'Lederharnisch', 'Test 4b: Chest slot synced with Lederharnisch');
  assert(state.structuredInventory?.weapons?.includes('Stahlschwert'), 'Test 4c: Weapons array contains Stahlschwert');
  assert((state.equipmentState || []).filter(e => e.ownerId === 'player' && e.equipped).length === 3, 'Test 4d: 3 equipped items in EquipmentState');
}

// Test 5: Unequipping gear clears slot and updates structuredInventory
{
  const adv = createBaseAdventure();
  const equipped = EquipmentConditionService.equipItem(adv, 'player', 'Ritterhelm', 'head').updatedAdventure;
  assert(equipped.structuredInventory?.armor?.head === 'Ritterhelm', 'Test 5a: Helmet equipped');

  const unequipped = EquipmentConditionService.unequipItem(equipped, 'player', 'Ritterhelm').updatedAdventure;
  assert(unequipped.structuredInventory?.armor?.head !== 'Ritterhelm', 'Test 5b: Helmet unequipped from structuredInventory');
  assert(!(unequipped.equipmentState || []).some(e => e.itemName === 'Ritterhelm'), 'Test 5c: EquipmentState removed');
}

// Test 6: Body areas inference works for various item types
{
  assert(EquipmentConditionService.inferBodyAreas('Handschellen').includes('hands'), 'Test 6a: Handschellen -> hands');
  assert(EquipmentConditionService.inferBodyAreas('Armfesseln').includes('arms'), 'Test 6b: Armfesseln -> arms');
  assert(EquipmentConditionService.inferBodyAreas('Beinschellen').includes('legs'), 'Test 6c: Beinschellen -> legs');
  assert(EquipmentConditionService.inferBodyAreas('Lederstiefel').includes('feet'), 'Test 6d: Lederstiefel -> feet');
  assert(EquipmentConditionService.inferBodyAreas('Halsband').includes('neck'), 'Test 6e: Halsband -> neck');
  assert(EquipmentConditionService.inferBodyAreas('Knebel').includes('face') && EquipmentConditionService.inferBodyAreas('Knebel').includes('head'), 'Test 6f: Knebel -> face & head');
  assert(EquipmentConditionService.inferBodyAreas('Plattenpanzer').includes('chest'), 'Test 6g: Plattenpanzer -> chest');
  assert(EquipmentConditionService.inferBodyAreas('Ganzkörperfessel').includes('whole_body'), 'Test 6h: Ganzkörperfessel -> whole_body');
}

// Test 7: NPC support: Restraints and equipment work symmetrically for NPCs
{
  const adv = createBaseAdventure();
  const resNpc = EquipmentConditionService.attachRestraint(adv, 'Lyra', 'Seilfesseln', ['hands', 'arms'], {
    description: 'Lyra wurde an den Händen gefesselt.'
  });
  const state = resNpc.updatedAdventure;
  const lyra = state.npcs.find(n => n.name === 'Lyra');

  assert(Boolean(lyra?.appearance?.activeConditions?.some(c => c.name === 'Seilfesseln' && c.isRestraint)), 'Test 7a: NPC Lyra has active restraint condition');
  assert(Boolean(state.equipmentState?.some(e => e.itemName === 'Seilfesseln' && e.ownerId === 'npc-lyra')), 'Test 7b: EquipmentState correctly references NPC id');
}

// Test 8: Transfer item updates owner and detaches previous active conditions
{
  const adv = createBaseAdventure();
  const attached = EquipmentConditionService.attachRestraint(adv, 'player', 'Magischer Ring', ['hands']).updatedAdventure;
  assert((attached.player.appearance?.activeConditions || []).some(c => c.name === 'Magischer Ring'), 'Test 8a: Ring on player initially');

  const transferred = EquipmentConditionService.transferItem(attached, 'player', 'Lyra', 'Magischer Ring');
  assert(!(transferred.player.appearance?.activeConditions || []).some(c => c.name === 'Magischer Ring'), 'Test 8b: Ring condition detached from player upon transfer');
  const instance = transferred.itemInstances?.find(i => i.name === 'Magischer Ring');
  assert(instance?.owner === 'npc-lyra', 'Test 8c: ItemInstance owner changed to Lyra');
}

// Test 9: Destroy item removes instance, inventory, and clears any active condition
{
  const adv = createBaseAdventure();
  const equipped = EquipmentConditionService.equipItem(adv, 'player', 'Holzstab', 'weapon').updatedAdventure;
  const attached = EquipmentConditionService.attachRestraint(equipped, 'player', 'Zerbrechliche Fessel', ['hands']).updatedAdventure;

  const destroyed = EquipmentConditionService.destroyItem(attached, 'player', 'Zerbrechliche Fessel');
  assert(!(destroyed.player.appearance?.activeConditions || []).some(c => c.name === 'Zerbrechliche Fessel'), 'Test 9a: Destroyed restraint removed from activeConditions');
  assert(!(destroyed.equipmentState || []).some(e => e.itemName === 'Zerbrechliche Fessel'), 'Test 9b: Destroyed item removed from EquipmentState');
  assert(!(destroyed.itemInstances || []).some(i => i.name === 'Zerbrechliche Fessel'), 'Test 9c: Destroyed item removed from ItemInstances');
}

// Test 10: StoryEntity integration: Items and restraints appear in storyEntities under 'Gegenstände'
{
  const adv = createBaseAdventure();
  const aiText = `
Du findest einen alten Schlüssel und wirst mit Ketten gefesselt.
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    {
      "item": "Alter Zellenschlüssel",
      "action": "added"
    },
    {
      "item": "Kerkereisen",
      "action": "attach",
      "bodyAreas": ["hands"]
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res = AIStoryStateProcessor.parseAndProcessAiResponse(aiText, adv);
  const entities = res.updatedAdventure.storyState?.storyEntities || [];

  const keyEntity = entities.find(e => e.title === 'Alter Zellenschlüssel');
  const chainEntity = entities.find(e => e.title === 'Kerkereisen');

  assert(Boolean(keyEntity && keyEntity.category === 'Gegenstände'), 'Test 10a: Alter Zellenschlüssel in storyEntities under Gegenstände');
  assert(Boolean(chainEntity && chainEntity.category === 'Gegenstände'), 'Test 10b: Kerkereisen in storyEntities under Gegenstände');
}

// Test 11: BodyCondition types support: restraints, curses, blessings, injuries, physical conditions
{
  const adv = createBaseAdventure();
  const c1 = EquipmentConditionService.addCondition(adv, 'player', {
    name: 'Blutende Schnittwunde',
    type: 'physical_condition',
    severity: 'mittel',
    bodyAreas: ['arms']
  }).updatedAdventure;

  const c2 = EquipmentConditionService.addCondition(c1, 'player', {
    name: 'Fluch der Schwäche',
    type: 'curse',
    severity: 'stark'
  }).updatedAdventure;

  const c3 = EquipmentConditionService.addCondition(c2, 'player', {
    name: 'Segen des Lichts',
    type: 'blessing',
    severity: 'leicht'
  }).updatedAdventure;

  const conds = c3.player.appearance?.activeConditions || [];
  assert(conds.some(c => c.name === 'Blutende Schnittwunde' && c.type === 'physical_condition'), 'Test 11a: Injury condition added');
  assert(conds.some(c => c.name === 'Fluch der Schwäche' && c.type === 'curse'), 'Test 11b: Curse condition added');
  assert(conds.some(c => c.name === 'Segen des Lichts' && c.type === 'blessing'), 'Test 11c: Blessing condition added');
}

// Test 12: Status tags and severity synchronization
{
  const adv = createBaseAdventure();
  const res = EquipmentConditionService.attachRestraint(adv, 'player', 'Fessel der Verdammnis', ['hands', 'neck'], {
    severity: 'vollständig',
    duration: 'Bis zum Ritual'
  });
  const cond = res.condition;

  assert(cond.statusTag === 'Gefesselt (Fessel der Verdammnis)', 'Test 12a: Status tag generated correctly');
  assert(cond.severity === 'vollständig', 'Test 12b: Severity set to vollständig');
  assert(cond.duration === 'Bis zum Ritual', 'Test 12c: Duration set properly');
}

// Test 13: Combined turn with multiple operations in a single AI response
{
  const adv = createBaseAdventure();
  const combinedAi = `
Der Assassine schlägt dich mit dem Schwertgriff, fesselt deine Hände mit Lederschnüren und nimmt deinen Geldbeutel.
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    {
      "item": "Lederschnüre",
      "action": "attach",
      "bodyAreas": ["hands"]
    },
    {
      "item": "Stahldolch",
      "action": "equip",
      "slot": "weapon"
    }
  ],
  "bodyConditionChanges": [
    {
      "name": "Kopfplatzwunde",
      "action": "added",
      "type": "physical_condition",
      "severity": "mittel",
      "bodyAreas": ["head"]
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res = AIStoryStateProcessor.parseAndProcessAiResponse(combinedAi, adv);
  const finalState = res.updatedAdventure;

  const hasRestraint = (finalState.player.appearance?.activeConditions || []).some(c => c.name === 'Lederschnüre' && c.isRestraint);
  const hasInjury = (finalState.player.appearance?.activeConditions || []).some(c => c.name === 'Kopfplatzwunde');
  const hasWeapon = finalState.structuredInventory?.weapons?.includes('Stahldolch');

  assert(hasRestraint, 'Test 13a: Restraint attached in combined turn');
  assert(hasInjury, 'Test 13b: Injury condition added in combined turn');
  assert(hasWeapon, 'Test 13c: Weapon equipped in combined turn');
}

console.log('\n=== ALL 13 EQUIPMENT & BODY CONDITION TESTS PASSED PERFECTLY! ===');
