import { AdventureResetService } from '../services/adventureResetService';
import { EquipmentConditionService } from '../services/equipmentConditionService';
import { AIStoryStateProcessor } from '../services/aiStoryStateProcessor';
import { 
  Adventure, 
  Character, 
  NPC, 
  ItemInstance, 
  EquipmentState, 
  BodyCondition, 
  LoreEntry, 
  LootSource, 
  WorldDropItem, 
  CollectionTask, 
  PendingPickupProposal, 
  PendingItemTransferProposal,
  StoryInfoState,
  CharacterKnowledge
} from '../types';

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`PASS: ${testName}`);
  } else {
    failCount++;
    console.error(`FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

function runTests() {
  console.log('=== STARTING ADVENTURE RESET REGRESSION TESTS ===');

  const baselinePlayer: Character = {
    id: 'char-player',
    name: 'Eldrin',
    gender: 'Männlich',
    role: 'Krieger',
    appearance: {
      hairColor: 'Schwarz',
      eyeColor: 'Blau',
      age: '28',
      build: 'Muskulös',
      gender: 'Männlich'
    },
    campaignPowerLevels: {
      'Stärke': { value: 50, xp: 0 },
      'Ausdauer': { value: 40, xp: 0 }
    },
    conditions: ['Gesund'],
    activeConditions: []
  };

  const baselineItemA: ItemInstance = {
    id: 'item-sword-start',
    definitionId: 'def-iron-sword',
    name: 'Eisenschwert',
    owner: 'player',
    quantity: 1,
    condition: 'ausgezeichnet',
    quality: 'normal',
    weightKg: 3
  };

  const baselineEquipmentA: EquipmentState = {
    id: 'equip-1',
    itemInstanceId: 'item-sword-start',
    characterId: 'player',
    slot: 'main_hand',
    bodyAreas: ['hands']
  };

  const baselineLoreCodex: LoreEntry = {
    id: 'lore-kingdom',
    title: 'Königreich Valoria',
    category: 'Geschichte',
    content: 'Ein uraltes Königreich im Hochland.'
  };

  const baselineNpc: NPC = {
    id: 'npc-aldric',
    name: 'Aldric',
    role: 'Wirt',
    personality: 'Freundlich'
  };

  const sampleAdventure: Adventure = {
    id: 'adv-test-reset',
    authorId: 'user-1',
    isPublic: false,
    prologue: 'Die Reise ins Ungewisse beginnt...',
    firstMessage: 'Du erwachst in einer kühlen Kammer der Taverne.',
    chatHistory: [
      { id: 'prologue-msg', role: 'model', text: 'Die Reise ins Ungewisse beginnt...' },
      { id: 'first-msg', role: 'model', text: 'Du erwachst in einer kühlen Kammer der Taverne.' }
    ],
    player: baselinePlayer,
    world: {
      territories: [
        {
          id: 'terr-1',
          name: 'Tal der Nebel',
          locations: [
            { id: 'loc-tavern', name: 'Alte Taverne', description: 'Ein warmer Zufluchtsort.' },
            { id: 'loc-dungeon', name: 'Finsterer Kerker', description: 'Ein modriger Ort.' }
          ]
        }
      ],
      connections: [],
      startLocationId: 'loc-tavern',
      currentLocationId: 'loc-tavern'
    },
    npcs: [baselineNpc],
    loreDatabase: [baselineLoreCodex],
    inventory: ['Eisenschwert'],
    itemInstances: [baselineItemA],
    equipmentState: [baselineEquipmentA],
    storyState: {
      currentLocationName: 'Alte Taverne',
      currentTerritoryName: 'Tal der Nebel',
      activeSituation: 'Am Kamin sitzen',
      activeGoals: [],
      relationships: [],
      storyEntities: [],
      lastUpdatedTime: '2026-09-23T00:00:00.000Z'
    },
    characterKnowledge: {
      topics: ['Valoria']
    },
    statusElements: [
      { id: 'st-time', label: 'Zeit', value: '08:00' },
      { id: 'st-stam', label: 'Ausdauer', value: '100%' }
    ],
    worldTime: { day: 1, hour: 8, minute: 0 }
  };

  // Ensure initial snapshots
  const adventureWithSnapshots = AdventureResetService.ensureInitialSnapshots(sampleAdventure);

  // ==========================================
  // Test A – Spieler
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.player.name = 'Veränderter Eldrin';
    adv.player.campaignPowerLevels['Stärke'].value = 999;
    adv.player.physicalChangeHistory = [{ id: 'p1', timestamp: 'now', change: 'Verwandelt' }];
    adv.player.emotionState = { mood: 'panisch' };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.player.name === 'Eldrin', 'Test A: Spielername auf Initialwert zurückgesetzt');
    assert(resetAdv.player.campaignPowerLevels?.['Stärke']?.value === 50, 'Test A: Spieler-Stärke auf Initialwert zurückgesetzt');
    assert(resetAdv.player.physicalChangeHistory?.length === 0, 'Test A: Physische Änderungshistorie geleert');
    assert(resetAdv.player.emotionState === undefined, 'Test A: Emotionszustand zurückgesetzt');
  }

  // ==========================================
  // Test B – Welt
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.world.currentLocationId = 'loc-dungeon';
    adv.world.dynamicWorldState = { destroyedBuildings: ['loc-tavern'] };
    adv.dynamicWorldState = { custom: true };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.world.currentLocationId === 'loc-tavern', 'Test B: Startort der Welt wiederhergestellt');
    assert(resetAdv.world.dynamicWorldState === undefined, 'Test B: world.dynamicWorldState geleert');
    assert(resetAdv.dynamicWorldState === undefined, 'Test B: adventure.dynamicWorldState geleert');
  }

  // ==========================================
  // Test C – NPC
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.npcs[0].personality = 'Feindselig';
    adv.npcs.push({ id: 'dyn-npc-bandit', name: 'Räuber', role: 'Gegner' });

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.npcs.length === 1, 'Test C: Dynamischer NPC entfernt');
    assert(resetAdv.npcs[0].name === 'Aldric', 'Test C: Initialer NPC vorhanden');
    assert(resetAdv.npcs[0].personality === 'Freundlich', 'Test C: Initialer NPC-Zustand wiederhergestellt');
  }

  // ==========================================
  // Test D – Lore
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.loreDatabase.push({ id: 'dyn-lore-secret', title: 'Geheimgang', category: 'Orte', content: 'Hinter dem Fass.' });

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.loreDatabase?.length === 1, 'Test D: Dynamischer Lore-Eintrag entfernt');
    assert(resetAdv.loreDatabase?.[0]?.id === 'lore-kingdom', 'Test D: Permanenter Codex-Eintrag erhalten');
  }

  // ==========================================
  // Test E – StoryState
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.storyState.storyEntities = [
      { id: 'entity-1', category: 'Charaktere', title: 'Finsterer Magier', description: 'Gefährlich' }
    ];
    adv.storyState.activeGoals = [{ id: 'goal-1', title: 'Fliehe aus Kerker', status: 'active' }];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.storyState?.storyEntities?.length === 0, 'Test E: Dynamische StoryEntities entfernt');
    assert(resetAdv.storyState?.activeGoals?.length === 0, 'Test E: Dynamische Story-Ziele entfernt');
  }

  // ==========================================
  // Test F – First Message
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const fingerprint = AIStoryStateProcessor.computeMessageFingerprint(adv.firstMessage);
    adv.storyState.processedFirstMessage = true;
    adv.storyState.processedFirstMessageFingerprint = fingerprint;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.storyState?.processedFirstMessage === false, 'Test F: processedFirstMessage auf false zurückgesetzt');
    assert(resetAdv.storyState?.processedFirstMessageFingerprint === '', 'Test F: First-Message-Fingerprint geleert');
  }

  // ==========================================
  // Test G – Character Knowledge
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.characterKnowledge = {
      topics: ['Valoria', 'Geheimes Ritual', 'Drachenhort'],
      discoveredSecrets: ['Verräter im Rat']
    };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(JSON.stringify(resetAdv.characterKnowledge) === JSON.stringify(adv.initialCharacterKnowledge), 'Test G: Character Knowledge auf Initialzustand zurückgesetzt');
  }

  // ==========================================
  // Test H – ItemInstance
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const newItemB: ItemInstance = {
      id: 'dyn-item-potion',
      definitionId: 'def-heal-pot',
      name: 'Heiltrank',
      owner: 'player',
      quantity: 5,
      weightKg: 1
    };
    adv.itemInstances.push(newItemB);

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.itemInstances?.length === 1, 'Test H: Dynamisch erstelltes Item B nicht mehr vorhanden');
    assert(resetAdv.itemInstances?.[0]?.id === 'item-sword-start', 'Test H: Initiales Startitem A vorhanden');
    assert(resetAdv.itemInstances?.[0]?.owner === 'player', 'Test H: Startitem gehört dem Spieler');
  }

  // ==========================================
  // Test I – Equipment
  // ==========================================
  {
    let adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    // Equip another item during gameplay
    const helmet: ItemInstance = {
      id: 'dyn-item-helm',
      name: 'Eisenhelm',
      owner: 'player',
      quantity: 1,
      weightKg: 2
    };
    adv.itemInstances.push(helmet);
    adv.equipmentState.push({
      id: 'equip-helm',
      itemInstanceId: 'dyn-item-helm',
      characterId: 'player',
      slot: 'head',
      bodyAreas: ['head']
    });

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.equipmentState?.length === 1, 'Test I: Equipment auf initiale Ausrüstung zurückgesetzt');
    assert(resetAdv.equipmentState?.[0]?.itemInstanceId === 'item-sword-start', 'Test I: Nur initiales Startschwert angelegt');
  }

  // ==========================================
  // Test J – BodyCondition
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.player.activeConditions = [
      {
        id: 'cond-shackles',
        name: 'Gefesselt',
        type: 'fesselung',
        bodyAreas: ['hands'],
        sourceItemInstanceId: 'item-shackles-101',
        isActive: true
      }
    ];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert((resetAdv.player.activeConditions || []).length === 0, 'Test J: Temporäre Fesselung/BodyCondition nach Reset entfernt');
  }

  // ==========================================
  // Test K – Transfer
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const pendingTransferProposal: PendingItemTransferProposal = {
      id: 'trans-123',
      itemInstanceId: 'item-npc-dagger',
      itemName: 'Dolch',
      quantity: 1,
      fromOwnerId: 'npc-aldric',
      fromOwnerName: 'Aldric',
      toOwnerId: 'player',
      toOwnerName: 'Eldrin',
      status: 'pending'
    };
    adv.pendingTransfer = pendingTransferProposal;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.pendingTransfer === null, 'Test K: pendingTransfer Proposal auf null zurückgesetzt');
  }

  // ==========================================
  // Test L – Pickup
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const pendingPickupProposal: PendingPickupProposal = {
      id: 'pickup-456',
      sourceId: 'loot-chest-1',
      sourceType: 'container',
      itemInstanceId: 'inst-ruby',
      itemName: 'Rubin',
      quantity: 1,
      weightKg: 0.1,
      requiresConfirmation: true,
      reason: 'Wertvoll'
    };
    adv.pendingPickup = pendingPickupProposal;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.pendingPickup === null, 'Test L: pendingPickup Proposal auf null zurückgesetzt');
  }

  // ==========================================
  // Test M – CollectionTask
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const task: CollectionTask = {
      id: 'task-wood',
      resourceType: 'Holz',
      targetQuantity: 10,
      collectedQuantity: 4,
      targetLocationId: 'loc-forest',
      status: 'in_progress'
    };
    adv.collectionTasks = [task];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert((resetAdv.collectionTasks || []).length === 0, 'Test M: Dynamischer CollectionTask nach Reset entfernt');
  }

  // ==========================================
  // Test N – Loot
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const dynLoot: LootSource = {
      id: 'loot-dead-wolf',
      sourceType: 'monster',
      sourceName: 'Erlegter Wolf',
      locationId: 'loc-tavern',
      isExhausted: false,
      isBodyHarvested: false,
      harvestAttemptsLeft: 1
    };
    const dynDrop: WorldDropItem = {
      id: 'drop-gold',
      locationId: 'loc-tavern',
      name: 'Goldmünzen',
      quantity: 20
    };
    adv.lootSources = [dynLoot];
    adv.worldDrops = [dynDrop];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert((resetAdv.lootSources || []).length === 0, 'Test N: Dynamische LootSource nach Reset entfernt');
    assert((resetAdv.worldDrops || []).length === 0, 'Test N: Dynamischer WorldDrop nach Reset entfernt');
  }

  // ==========================================
  // Test O – Weltzeit
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.worldTime = { day: 14, hour: 23, minute: 45 };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.worldTime?.day === 1, 'Test O: Tag auf 1 zurückgesetzt');
    assert(resetAdv.worldTime?.hour === 8, 'Test O: Stunde auf 8 zurückgesetzt');
    assert(resetAdv.worldTime?.minute === 0, 'Test O: Minute auf 0 zurückgesetzt');
  }

  // ==========================================
  // Test P – Persistenz
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.player.name = 'Veränderter Held';
    adv.worldTime = { day: 5, hour: 12, minute: 0 };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    // Simulate JSON storage serialize & reload
    const storedJson = JSON.stringify(resetAdv);
    const reloadedAdv: Adventure = JSON.parse(storedJson);

    assert(reloadedAdv.player.name === 'Eldrin', 'Test P: Nach Serialisierung und Reload bleibt Initialspieler erhalten');
    assert(reloadedAdv.worldTime?.day === 1, 'Test P: Nach Serialisierung und Reload bleibt Initialzeit erhalten');
  }

  // ==========================================
  // Test Q – Initiale Daten bleiben erhalten
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const initialPlayerSnapshot = JSON.stringify(adv.initialPlayer);
    const initialWorldSnapshot = JSON.stringify(adv.initialWorld);

    // Gameplay mutations
    adv.player.campaignPowerLevels['Stärke'].value = 80;
    adv.world.currentLocationId = 'loc-dungeon';

    // Perform reset
    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);

    assert(JSON.stringify(resetAdv.initialPlayer) === initialPlayerSnapshot, 'Test Q: initialPlayer Snapshot wurde nicht versehentlich mutiert');
    assert(JSON.stringify(resetAdv.initialWorld) === initialWorldSnapshot, 'Test Q: initialWorld Snapshot wurde nicht versehentlich mutiert');
  }

  // ==========================================
  // Test R – Codex bleibt erhalten
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    // User manually saved a new codex entry (not dyn-)
    adv.loreDatabase.push({
      id: 'lore-user-codex-entry',
      title: 'Das Buch der Ahnen',
      category: 'Artefakte',
      content: 'Vom Spieler bewusst in den Codex eingetragen.'
    });
    // Ensure this entry is in initial or permanent lore database
    adv.initialLoreDatabase = JSON.parse(JSON.stringify(adv.loreDatabase));

    // Now during gameplay, a dynamic lore entry is added
    adv.loreDatabase.push({
      id: 'dyn-lore-temporary-rumor',
      title: 'Flüchtiges Gerücht',
      category: 'Gerüchte',
      content: 'Jemand hat etwas gesehen.'
    });

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.loreDatabase?.some((l: LoreEntry) => l.id === 'lore-user-codex-entry') === true, 'Test R: Vom Spieler gespeicherter Codex-Eintrag bleibt nach Reset erhalten');
    assert(resetAdv.loreDatabase?.some((l: LoreEntry) => l.id === 'dyn-lore-temporary-rumor') === false, 'Test R: Dynamisches Gerücht wurde entfernt');
  }

  console.log('\n=== TEST RUN COMPLETE ===');
  console.log(`Tests ausgeführt: ${testCount}`);
  console.log(`Bestanden: ${passCount}`);
  console.log(`Fehlgeschlagen: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
