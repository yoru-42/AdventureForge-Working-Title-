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
      "description": "Feste Eisenketten an den Handgelenken"
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res1 = AIStoryStateProcessor.parseAndProcessAiResponse(turn1Ai, adv);
  const state1 = res1.updatedAdventure;
  assert(
    (state1.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2a: Turn 1 shackles attached'
  );

  // Turn 2: General storytelling, ZERO mention of shackles
  const turn2Ai = `
Kaelen blickt sich im Kerker um. An der Wand tropft Wasser herab. Eine Ratte huscht vorbei.
<STORY_STATE_CHANGES>
{
  "narrativeLocation": "Kerkerzelle"
}
</STORY_STATE_CHANGES>
  `;
  const res2 = AIStoryStateProcessor.parseAndProcessAiResponse(turn2Ai, state1);
  const state2 = res2.updatedAdventure;
  assert(
    (state2.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2b: Turn 2 shackles remain persistently active despite not being mentioned'
  );

  // Turn 3: Dialogue without mention of shackles
  const turn3Ai = `
Der Wärter grinst hämisch: "Hier kommst du nicht so schnell raus, Abenteurer!"
<STORY_STATE_CHANGES>
{
  "sceneRole": "dialogue"
}
</STORY_STATE_CHANGES>
  `;
  const res3 = AIStoryStateProcessor.parseAndProcessAiResponse(turn3Ai, state2);
  const state3 = res3.updatedAdventure;
  assert(
    (state3.player.appearance?.activeConditions || []).some(c => c.name === 'Schwere Eisenfesseln' && c.isActive),
    'Test 2c: Turn 3 shackles still persistently active in new location'
  );
}

// Test 3: Explicit Detachment removes restraint and clears BodyCondition
{
  const adv = createBaseAdventure();
  const res1 = EquipmentConditionService.attachRestraint(adv, 'player', 'Handfesseln', ['hands']);
  const attachedAdv = res1.updatedAdventure;
  assert((attachedAdv.player.appearance?.activeConditions || []).length === 1, 'Test 3a: 1 condition active before detach');

  const res2 = EquipmentConditionService.detachRestraint(attachedAdv, 'player', 'Handfesseln');
  const detachedAdv = res2.updatedAdventure;

  assert((detachedAdv.player.appearance?.activeConditions || []).length === 0, 'Test 3b: BodyCondition cleanly removed on detach');
  assert((detachedAdv.equipmentState || []).length === 0, 'Test 3c: EquipmentState cleanly detached');
}

// Test 4: Equip items cleanly updates structuredInventory & equipmentState
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.equipItem(adv, 'player', 'Eisenhelm', 'head', ['head']).updatedAdventure;
  current = EquipmentConditionService.equipItem(current, 'player', 'Lederharnisch', 'chest', ['chest']).updatedAdventure;
  current = EquipmentConditionService.equipItem(current, 'player', 'Stahlschwert', 'weapon', ['hands']).updatedAdventure;

  assert(current.structuredInventory?.armor?.head === 'Eisenhelm', 'Test 4a: Head slot synced with Eisenhelm');
  assert(current.structuredInventory?.armor?.chest === 'Lederharnisch', 'Test 4b: Chest slot synced with Lederharnisch');
  assert(current.structuredInventory?.weapons?.includes('Stahlschwert'), 'Test 4c: Weapons array contains Stahlschwert');
  assert((current.equipmentState || []).length === 3, 'Test 4d: 3 equipped items in EquipmentState');
}

// Test 5: Unequip item clears slot and removes from equipmentState
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.equipItem(adv, 'player', 'Ritterhelm', 'head', ['head']).updatedAdventure;
  assert(current.structuredInventory?.armor?.head === 'Ritterhelm', 'Test 5a: Helmet equipped');

  current = EquipmentConditionService.unequipItem(current, 'player', 'head').updatedAdventure;
  assert(current.structuredInventory?.armor?.head === '', 'Test 5b: Helmet unequipped from structuredInventory');
  assert((current.equipmentState || []).length === 0, 'Test 5c: EquipmentState removed');
}

// Test 6: Infer body areas accurately across various German terms
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

// Test 7: NPC Equipment and Body Conditions
{
  const adv = createBaseAdventure();
  const res = EquipmentConditionService.attachRestraint(adv, 'npc-lyra', 'Kettenfessel', ['hands', 'arms']);
  const updated = res.updatedAdventure;
  const lyra = updated.npcs?.find(n => n.id === 'npc-lyra');
  const cond = lyra?.appearance?.activeConditions?.find(c => c.name === 'Kettenfessel');
  const equip = updated.equipmentState?.find(e => e.ownerId === 'npc-lyra' && e.itemName === 'Kettenfessel');

  assert(Boolean(cond && cond.isActive), 'Test 7a: NPC Lyra has active restraint condition');
  assert(equip?.ownerId === 'npc-lyra', 'Test 7b: EquipmentState correctly references NPC id');
}

// Test 8: Transfer Item between Player and NPC
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.attachRestraint(adv, 'player', 'Magischer Ring', ['hands']).updatedAdventure;
  assert((current.player.appearance?.activeConditions || []).length === 1, 'Test 8a: Ring on player initially');

  current = EquipmentConditionService.transferItem(current, 'player', 'npc-lyra', 'Magischer Ring');
  assert((current.player.appearance?.activeConditions || []).length === 0, 'Test 8b: Ring condition detached from player upon transfer');
  const inst = current.itemInstances?.find(i => i.name === 'Magischer Ring');
  assert(inst?.owner === 'npc-lyra', 'Test 8c: ItemInstance owner changed to Lyra');
}

// Test 9: Destroy Item
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.attachRestraint(adv, 'player', 'Morsche Holzfessel', ['hands']).updatedAdventure;
  current = EquipmentConditionService.destroyItem(current, 'player', 'Morsche Holzfessel');

  assert((current.player.appearance?.activeConditions || []).length === 0, 'Test 9a: Destroyed restraint removed from activeConditions');
  assert((current.equipmentState || []).length === 0, 'Test 9b: Destroyed item removed from EquipmentState');
  assert((current.itemInstances || []).length === 0, 'Test 9c: Destroyed item removed from ItemInstances');
}

// Test 10: Discovered Items land in storyEntities under 'Gegenstände'
{
  const adv = createBaseAdventure();
  const aiText = `
In der Ecke liegt ein alter Zellenschlüssel und am Boden rostige Kerkereisen.
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

console.log('\n--- EXTENDED REGRESSION SUITE (TESTS A - I) ---\n');

// Test A: Zwei gleichnamige Fesseln mit unterschiedlichen ItemInstanceIds
{
  const adv = createBaseAdventure();
  // Fessel A an Händen
  let current = EquipmentConditionService.attachRestraint(adv, 'player', 'Fessel', ['hands'], {
    itemInstanceId: 'item-inst-A',
    description: 'Fessel an Händen'
  }).updatedAdventure;

  // Fessel B an Beinen mit selbem Namen
  current = EquipmentConditionService.attachRestraint(current, 'player', 'Fessel', ['legs'], {
    itemInstanceId: 'item-inst-B',
    description: 'Fessel an Beinen'
  }).updatedAdventure;

  assert((current.equipmentState || []).length === 2, 'Test A1: Beide Fesseln in EquipmentState vorhanden');
  assert((current.player.appearance?.activeConditions || []).length === 2, 'Test A2: Beide Conditions aktiv');

  // Entferne gezielt Fessel A über itemInstanceId
  current = EquipmentConditionService.detachRestraint(current, 'player', 'item-inst-A', { itemInstanceId: 'item-inst-A' }).updatedAdventure;

  const equipRemaining = current.equipmentState || [];
  const condsRemaining = current.player.appearance?.activeConditions || [];

  assert(equipRemaining.length === 1 && equipRemaining[0].itemInstanceId === 'item-inst-B', 'Test A3: Nur Fessel A entfernt, Fessel B verbleibt in EquipmentState');
  assert(condsRemaining.length === 1 && condsRemaining[0].sourceItemInstanceId === 'item-inst-B', 'Test A4: Nur Condition von Fessel B bleibt aktiv');
  assert(condsRemaining[0].bodyAreas?.includes('legs'), 'Test A5: Verbleibende Condition betrifft weiterhin Beine');
}

// Test B: Bestehende ItemInstance ausrüsten aktualisiert itemInstances[] und EquipmentState
{
  const adv = createBaseAdventure();
  // Manuell eine ungerüstete ItemInstance anlegen
  adv.itemInstances = [
    {
      id: 'item-inst-sword-1',
      itemDefinitionId: 'item-def-bastardschwert',
      name: 'Bastardschwert',
      condition: 'geschärft',
      owner: 'player',
      location: 'Im Rucksack',
      quantity: 1,
      currentState: 'im Inventar'
    }
  ];

  const res = EquipmentConditionService.equipItem(adv, 'player', 'Bastardschwert', 'weapon', ['hands'], {
    itemInstanceId: 'item-inst-sword-1'
  });

  const updatedAdv = res.updatedAdventure;
  const instance = updatedAdv.itemInstances?.find(i => i.id === 'item-inst-sword-1');
  const equip = updatedAdv.equipmentState?.find(e => e.itemInstanceId === 'item-inst-sword-1');

  assert(Boolean(instance && instance.currentState === 'ausgerüstet' && instance.location === 'Ausgerüstet'), 'Test B1: itemInstances[] enthält aktualisierte Instanz mit currentState=ausgerüstet');
  assert(Boolean(equip && equip.itemInstanceId === 'item-inst-sword-1' && equip.equipped), 'Test B2: EquipmentState verweist auf dieselbe itemInstanceId');
  assert((updatedAdv.itemInstances || []).length === 1, 'Test B3: Keine redundante zweite ItemInstance erzeugt');
}

// Test C: UNEQUIP synchronisiert ItemInstance-Zustand zu 'im Inventar'
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.equipItem(adv, 'player', 'Drachenschild', 'shield', ['hands'], {
    itemInstanceId: 'item-inst-shield-1'
  }).updatedAdventure;

  assert((current.equipmentState || []).length === 1, 'Test C1: Schild ausgerüstet');

  current = EquipmentConditionService.unequipItem(current, 'player', 'item-inst-shield-1', {
    itemInstanceId: 'item-inst-shield-1'
  }).updatedAdventure;

  const instance = current.itemInstances?.find(i => i.id === 'item-inst-shield-1');
  assert((current.equipmentState || []).length === 0, 'Test C2: EquipmentState nach UNEQUIP leer');
  assert(instance?.currentState === 'im Inventar' && instance?.location === 'Inventar', 'Test C3: ItemInstance Zustand zu "im Inventar" synchronisiert');
}

// Test D: StructuredInventory entfernt alten Waffeneintrag nach UNEQUIP vollständig
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.equipItem(adv, 'player', 'Zweihänder', 'weapon', ['hands']).updatedAdventure;
  assert(current.structuredInventory?.weapons?.includes('Zweihänder'), 'Test D1: Zweihänder in structuredInventory.weapons');

  current = EquipmentConditionService.unequipItem(current, 'player', 'Zweihänder').updatedAdventure;
  assert(!current.structuredInventory?.weapons?.includes('Zweihänder'), 'Test D2: Zweihänder nach unequip vollständig aus structuredInventory.weapons entfernt');
  assert((current.structuredInventory?.weapons || []).length === 0, 'Test D3: Keine Geisterwaffen in structuredInventory');
}

// Test E: Zwei unterschiedliche Fesselungen (Hände vs Beine)
{
  const adv = createBaseAdventure();
  let current = EquipmentConditionService.attachRestraint(adv, 'player', 'Handschellen', ['hands'], {
    itemInstanceId: 'inst-hands-1'
  }).updatedAdventure;
  current = EquipmentConditionService.attachRestraint(current, 'player', 'Fußeisen', ['legs', 'feet'], {
    itemInstanceId: 'inst-legs-1'
  }).updatedAdventure;

  // Löse nur die Handschellen
  current = EquipmentConditionService.detachRestraint(current, 'player', 'inst-hands-1', {
    itemInstanceId: 'inst-hands-1'
  }).updatedAdventure;

  const conds = current.player.appearance?.activeConditions || [];
  assert(conds.length === 1, 'Test E1: Genau eine Fesselung verbleibt');
  assert(conds[0].sourceItemInstanceId === 'inst-legs-1', 'Test E2: Fußeisen verbleiben aktiv');
  assert(conds[0].bodyAreas?.includes('legs') && conds[0].bodyAreas?.includes('feet'), 'Test E3: Beine und Füße bleiben gebunden');
}

// Test F: Schweigen der KI über 10 Turns
{
  let state = createBaseAdventure();
  const initAi = `
Du wirst in Ketten gelegt.
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    { "item": "Kerkereisen", "action": "attach", "bodyAreas": ["hands", "arms"] }
  ]
}
</STORY_STATE_CHANGES>
  `;
  state = AIStoryStateProcessor.parseAndProcessAiResponse(initAi, state).updatedAdventure;

  // Simuliere 10 Turns ohne jede Erwähnung der Kerkereisen
  for (let turn = 1; turn <= 10; turn++) {
    const silentTurn = `
Turn ${turn}: Du sitzt stumm im Schatten. Zeit vergeht.
<STORY_STATE_CHANGES>
{
  "narrativeLocation": "Kerker"
}
</STORY_STATE_CHANGES>
    `;
    state = AIStoryStateProcessor.parseAndProcessAiResponse(silentTurn, state).updatedAdventure;
  }

  const cond = state.player.appearance?.activeConditions?.find(c => c.name === 'Kerkereisen');
  const equip = state.equipmentState?.find(e => e.itemName === 'Kerkereisen');

  assert(Boolean(cond && cond.isActive), 'Test F1: Nach 10 stummen Zügen ist BodyCondition immer noch aktiv');
  assert(Boolean(equip && equip.equipped), 'Test F2: Nach 10 stummen Zügen ist EquipmentState immer noch aktiv');
}

// Test G: Explizite Entfernung via itemInstanceId
{
  const adv = createBaseAdventure();
  const attachRes = EquipmentConditionService.attachRestraint(adv, 'player', 'Runenkette', ['neck'], {
    itemInstanceId: 'inst-rune-neck'
  });
  let state = attachRes.updatedAdventure;
  assert((state.equipmentState || []).length === 1, 'Test G1: Runenkette angelegt');

  const detachRes = EquipmentConditionService.detachRestraint(state, 'player', 'inst-rune-neck', {
    itemInstanceId: 'inst-rune-neck'
  });
  state = detachRes.updatedAdventure;

  assert((state.equipmentState || []).length === 0, 'Test G2: Equipment entfernt');
  assert((state.player.appearance?.activeConditions || []).length === 0, 'Test G3: BodyCondition entfernt');
}

// Test H: Vollständiges NPC-Szenario
{
  const adv = createBaseAdventure();
  // Attach restraint to NPC Lyra
  let state = EquipmentConditionService.attachRestraint(adv, 'npc-lyra', 'Sklavenhalsband', ['neck'], {
    itemInstanceId: 'inst-collar-lyra'
  }).updatedAdventure;

  let lyra = state.npcs?.find(n => n.id === 'npc-lyra');
  assert((lyra?.appearance?.activeConditions || []).some(c => c.sourceItemInstanceId === 'inst-collar-lyra'), 'Test H1: NPC Lyra hat aktives Halsband');

  // Detach restraint from NPC Lyra
  state = EquipmentConditionService.detachRestraint(state, 'npc-lyra', 'inst-collar-lyra', {
    itemInstanceId: 'inst-collar-lyra'
  }).updatedAdventure;

  lyra = state.npcs?.find(n => n.id === 'npc-lyra');
  assert((lyra?.appearance?.activeConditions || []).length === 0, 'Test H2: NPC Lyra Condition sauber entfernt');
  assert((state.equipmentState || []).filter(e => e.ownerId === 'npc-lyra').length === 0, 'Test H3: NPC EquipmentState bereinigt');
}

// Test I: Story-Info + ItemInstance + EquipmentState Koexistenz
{
  const adv = createBaseAdventure();
  const aiText = `
Du findest eine mystische Armbrust und rüstest sie sofort aus.
<STORY_STATE_CHANGES>
{
  "inventoryChanges": [
    {
      "item": "Mystische Armbrust",
      "action": "equip",
      "slot": "weapon",
      "bodyAreas": ["hands"]
    }
  ]
}
</STORY_STATE_CHANGES>
  `;
  const res = AIStoryStateProcessor.parseAndProcessAiResponse(aiText, adv);
  const finalState = res.updatedAdventure;

  const storyEntity = finalState.storyState?.storyEntities?.find(e => e.title === 'Mystische Armbrust');
  const itemInst = finalState.itemInstances?.find(i => i.name === 'Mystische Armbrust');
  const equipState = finalState.equipmentState?.find(e => e.itemName === 'Mystische Armbrust');

  assert(Boolean(storyEntity && storyEntity.category === 'Gegenstände'), 'Test I1: StoryEntity in storyState.storyEntities vorhanden');
  assert(Boolean(itemInst && itemInst.currentState === 'ausgerüstet'), 'Test I2: ItemInstance in itemInstances[] vorhanden');
  assert(Boolean(equipState && equipState.equipped && equipState.slot === 'weapon'), 'Test I3: EquipmentState in equipmentState[] vorhanden');
  assert(finalState.structuredInventory?.weapons?.includes('Mystische Armbrust'), 'Test I4: structuredInventory.weapons synchronisiert');
}

console.log('\n=== ALL TESTS (ORIGINAL 13 + REGRESSION A-I) PASSED WITH ZERO FAILURES! ===');
