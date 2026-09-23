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
  CharacterKnowledge,
  WorldSetting,
  Territory
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
    role: 'Krieger',
    personality: 'Mutig',
    bio: 'Ein erfahrener Abenteurer.',
    appearance: {
      hairColor: 'Schwarz',
      eyeColor: 'Blau',
      age: '28',
      build: 'Muskulös',
      gender: 'Männlich'
    },
    attributes: [
      { name: 'Stärke', value: 50, max: 100 },
      { name: 'Ausdauer', value: 40, max: 100 }
    ],
    campaignPowerLevels: {
      'Stärke': { value: 50, potentialMax: 100, xp: 0 },
      'Ausdauer': { value: 40, potentialMax: 100, xp: 0 }
    },
    activeConditions: []
  };

  const baselineItemA: ItemInstance = {
    id: 'item-sword-start',
    itemDefinitionId: 'def-iron-sword',
    name: 'Eisenschwert',
    owner: 'player',
    quantity: 1,
    condition: 'ausgezeichnet',
    quality: 'normal',
    weightKg: 3
  };

  const baselineEquipmentA: EquipmentState = {
    itemInstanceId: 'item-sword-start',
    itemDefinitionId: 'def-iron-sword',
    itemName: 'Eisenschwert',
    ownerId: 'player',
    equipped: true,
    slot: 'weapon',
    bodyAreas: ['hands']
  };

  const baselineLoreCodex: LoreEntry = {
    id: 'lore-kingdom',
    title: 'Königreich Valoria',
    category: 'Weltregeln',
    description: 'Ein uraltes Königreich im Hochland.',
    isUnlocked: true
  };

  const baselineNpc: NPC = {
    id: 'npc-aldric',
    name: 'Aldric',
    role: 'Wirt',
    personality: 'Freundlich',
    bio: 'Der Wirt der alten Taverne.',
    appearance: {
      hairColor: 'Grau',
      eyeColor: 'Braun',
      age: '55',
      build: 'Kräftig',
      gender: 'Männlich'
    },
    attributes: [],
    isHostile: false
  };

  const baselineTerritory: Territory = {
    id: 'terr-1',
    name: 'Tal der Nebel',
    description: 'Ein nebliges Tal voller Geheimnisse.',
    type: 'region',
    parentId: 'terr-root',
    x: 0,
    y: 0
  };

  const baselineWorld: WorldSetting = {
    title: 'Die Vergessenen Reiche',
    description: 'Eine weitläufige Fantasy-Welt.',
    era: 'Mittelalter',
    tone: 'Heroisch',
    territories: [baselineTerritory],
    connections: [],
    startLocationId: 'loc-tavern',
    currentLocationId: 'loc-tavern',
    campaignPowerSettings: {
      'Stärke': { min: 10, max: 100, levelUpLogic: 'xp_threshold' },
      'Ausdauer': { min: 10, max: 100, levelUpLogic: 'xp_threshold' }
    }
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
    world: baselineWorld,
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
      knownCharacters: ['npc-aldric'],
      knownLocations: ['loc-tavern']
    },
    statusElements: [
      { id: 'st-time', label: 'Zeit', value: '08:00' },
      { id: 'st-stam', label: 'Ausdauer', value: '100%' }
    ],
    worldTime: { day: 1, hour: 8, minute: 0 }
  };

  // Ensure initial snapshots
  const adventureWithSnapshots = AdventureResetService.ensureInitialSnapshots(sampleAdventure, true);

  // ==========================================
  // Test A – Spieler
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.player.name = 'Veränderter Eldrin';
    adv.player.campaignPowerLevels['Stärke'].value = 999;
    adv.player.physicalChangeHistory = [{ id: 'p1', timestamp: 'now', stageName: 'Metamorphose', changes: [], summary: 'Verwandelt', transformationIntensity: 50 }];
    adv.player.emotionState = { emotion: 'panisch', intensity: 'stark' };

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
    adv.npcs.push({
      id: 'dyn-npc-bandit',
      name: 'Räuber',
      role: 'Gegner',
      personality: 'Aggressiv',
      bio: 'Ein Bandit.',
      appearance: { hairColor: 'Braun', eyeColor: 'Braun', age: '30', build: 'Mittel', gender: 'Männlich' },
      attributes: [],
      isHostile: true
    });

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
    adv.loreDatabase.push({
      id: 'dyn-lore-secret',
      title: 'Geheimgang',
      category: 'Orte',
      description: 'Hinter dem Fass.',
      isUnlocked: true
    });

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
      knownCharacters: ['npc-aldric', 'npc-unknown-mage'],
      knownLocations: ['loc-tavern', 'loc-secret-dungeon']
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
      itemDefinitionId: 'def-heal-pot',
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
      itemDefinitionId: 'def-helm',
      name: 'Eisenhelm',
      owner: 'player',
      quantity: 1,
      weightKg: 2
    };
    adv.itemInstances.push(helmet);
    adv.equipmentState.push({
      itemInstanceId: 'dyn-item-helm',
      itemDefinitionId: 'def-helm',
      itemName: 'Eisenhelm',
      ownerId: 'player',
      equipped: true,
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
        type: 'restraint',
        bodyAreas: ['hands'],
        sourceItemInstanceId: 'item-shackles-101',
        description: 'Schwere Fesseln',
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
      createdAt: Date.now()
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
      sourceTitle: 'Schatztruhe',
      sourceType: 'chest',
      items: [
        {
          id: 'inst-ruby',
          itemDefinitionId: 'def-ruby',
          name: 'Rubin',
          quantity: 1,
          weightKg: 0.1
        }
      ],
      requiresExplicitConfirmation: true
    };
    adv.pendingPickup = pendingPickupProposal;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.pendingPickup === null, 'Test L: pendingPickup Proposal auf null zurückgesetzt');
  }

  // ==========================================
  // Test M – CollectionTask (Single)
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const task: CollectionTask = {
      id: 'task-wood',
      title: 'Holzsammeln',
      targetQuantity: 10,
      collectedQuantity: 4,
      status: 'active'
    };
    adv.collectionTasks = [task];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test M: Einzelner CollectionTask nach Reset entfernt (collectionTasks === [])');
  }

  // ==========================================
  // Test M2 – Mehrere CollectionTasks
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const taskA: CollectionTask = {
      id: 'task-a',
      title: 'Kräuter sammeln',
      targetQuantity: 5,
      collectedQuantity: 2,
      status: 'active'
    };
    const taskB: CollectionTask = {
      id: 'task-b',
      title: 'Erz abbauen',
      targetQuantity: 3,
      collectedQuantity: 3,
      status: 'completed'
    };
    const taskC: CollectionTask = {
      id: 'task-c',
      title: 'Wasser holen',
      targetQuantity: 1,
      collectedQuantity: 0,
      status: 'active'
    };
    adv.collectionTasks = [taskA, taskB, taskC];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test M2: Mehrere CollectionTasks (A, B, C) nach Reset komplett geleert');
  }

  // ==========================================
  // Test N – Loot
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const dynLoot: LootSource = {
      id: 'loot-dead-wolf',
      type: 'monster_body',
      title: 'Erlegter Wolf',
      items: []
    };
    const dynDrop: WorldDropItem = {
      id: 'drop-gold',
      itemInstance: {
        id: 'inst-gold-coins',
        itemDefinitionId: 'def-gold',
        name: 'Goldmünzen',
        quantity: 20
      }
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
      category: 'Gegenstände',
      description: 'Vom Spieler bewusst in den Codex eingetragen.',
      isUnlocked: true
    });
    // Ensure this entry is in initial or permanent lore database
    adv.initialLoreDatabase = JSON.parse(JSON.stringify(adv.loreDatabase));

    // Now during gameplay, a dynamic lore entry is added
    adv.loreDatabase.push({
      id: 'dyn-lore-temporary-rumor',
      title: 'Flüchtiges Gerücht',
      category: 'Weltregeln',
      description: 'Jemand hat etwas gesehen.',
      isUnlocked: true
    });

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.loreDatabase?.some((l: LoreEntry) => l.id === 'lore-user-codex-entry') === true, 'Test R: Vom Spieler gespeicherter Codex-Eintrag bleibt nach Reset erhalten');
    assert(resetAdv.loreDatabase?.some((l: LoreEntry) => l.id === 'dyn-lore-temporary-rumor') === false, 'Test R: Dynamisches Gerücht wurde entfernt');
  }

  // ==========================================
  // Test S – Legacy Snapshot Protection
  // ==========================================
  {
    // A legacy adventure that has been played (contains user turns) and has no initialPlayer snapshot
    const playedLegacyAdventure: Adventure = {
      id: 'adv-legacy-played',
      authorId: 'user-1',
      isPublic: false,
      prologue: 'Alte Geschichte...',
      statusElements: [],
      chatHistory: [
        { id: '1', role: 'model', text: 'Prolog...' },
        { id: '2', role: 'user', text: 'Ich greife den Drachen an und trainiere hart.' },
        { id: '3', role: 'model', text: 'Du bist jetzt Level 10 mit 999 Stärke geworden.' }
      ],
      player: {
        id: 'char-legacy',
        name: 'Alter Held',
        role: 'Kämpfer',
        personality: 'Zäh',
        bio: 'Ein Veteran.',
        appearance: { hairColor: 'Grau', eyeColor: 'Braun', age: '45', build: 'Breit', gender: 'Männlich' },
        attributes: [],
        campaignPowerLevels: {
          'Stärke': { value: 999, potentialMax: 1000, xp: 5000 },
          'Ausdauer': { value: 850, potentialMax: 1000, xp: 4000 }
        }
      },
      world: {
        title: 'Alte Welt',
        description: 'Ein vergessenes Land.',
        era: 'Klassisch',
        tone: 'Dunkel',
        territories: [],
        connections: [],
        campaignPowerSettings: {
          'Stärke': { min: 10, max: 100, levelUpLogic: 'xp_threshold' },
          'Ausdauer': { min: 15, max: 100, levelUpLogic: 'xp_threshold' }
        }
      },
      npcs: [],
      loreDatabase: [],
      inventory: []
    };

    // 1. ensureInitialSnapshots should NOT blindly declare current level 999 state as initialPlayer
    const snapshotted = AdventureResetService.ensureInitialSnapshots(playedLegacyAdventure, false);
    assert(snapshotted.initialPlayer === undefined, 'Test S1: ensureInitialSnapshots deklariert veränderten Legacy-Zustand NICHT blind als initialPlayer');

    // 2. resetAdventureToInitialState safely reconstructs player baseline to configured minimums (min=10, min=15)
    const resetLegacy = AdventureResetService.resetAdventureToInitialState(playedLegacyAdventure);
    assert(resetLegacy.player.campaignPowerLevels?.['Stärke']?.value === 10, 'Test S2: Legacy-Spieler Stärke wird sicher auf Minimum (10) zurückgesetzt');
    assert(resetLegacy.player.campaignPowerLevels?.['Ausdauer']?.value === 15, 'Test S3: Legacy-Spieler Ausdauer wird sicher auf Minimum (15) zurückgesetzt');
  }

  // ==========================================
  // Test T – Vollständiger Integrationstest (Multi-State-Reset & Persistence Flow)
  // ==========================================
  {
    const initialAdv = JSON.parse(JSON.stringify(adventureWithSnapshots));

    // Heavy mutations across all game systems during a session:
    initialAdv.player.name = 'Mutierter Spieler';
    initialAdv.player.campaignPowerLevels['Stärke'].value = 350;
    initialAdv.world.currentLocationId = 'loc-dungeon';
    initialAdv.itemInstances.push({
      id: 'dyn-item-dragon-gem',
      itemDefinitionId: 'def-gem',
      name: 'Drachenjuwel',
      owner: 'player',
      quantity: 1,
      weightKg: 0.5
    });
    initialAdv.equipmentState.push({
      itemInstanceId: 'dyn-item-dragon-gem',
      itemDefinitionId: 'def-gem',
      itemName: 'Drachenjuwel',
      ownerId: 'player',
      equipped: true,
      slot: 'ring_1',
      bodyAreas: ['hands']
    });
    initialAdv.storyState.storyEntities.push({
      id: 'entity-boss',
      title: 'Drache',
      category: 'Gegner',
      description: 'Mächtiges Monster'
    });
    initialAdv.characterKnowledge.knownLocations = ['loc-tavern', 'loc-secret-boss'];
    initialAdv.pendingPickup = {
      id: 'pick-1',
      sourceTitle: 'Schatztruhe',
      sourceType: 'chest',
      items: [
        {
          id: 'gem',
          itemDefinitionId: 'def-gem',
          name: 'Juwel',
          quantity: 1,
          weightKg: 0.1
        }
      ],
      requiresExplicitConfirmation: true
    };
    initialAdv.pendingTransfer = {
      id: 'trans-1',
      itemInstanceId: 'gem',
      itemName: 'Juwel',
      quantity: 1,
      fromOwnerId: 'npc-aldric',
      fromOwnerName: 'Aldric',
      toOwnerId: 'player',
      toOwnerName: 'Spieler',
      createdAt: Date.now()
    };
    initialAdv.collectionTasks = [
      { id: 'col-1', title: 'Holz', targetQuantity: 10, collectedQuantity: 5, status: 'active' }
    ];
    initialAdv.worldTime = { day: 12, hour: 18, minute: 30 };

    // Execute centralized reset
    const resetAdv = AdventureResetService.resetAdventureToInitialState(initialAdv);

    // Simulate saving to persistence and reloading
    const persistedString = JSON.stringify(resetAdv);
    const reloaded: Adventure = JSON.parse(persistedString);

    // Verify all baseline restorations
    assert(reloaded.player.name === 'Eldrin', 'Test T1: Spielername nach Reset & Reload baseline');
    assert(reloaded.player.campaignPowerLevels?.['Stärke']?.value === 50, 'Test T2: Spielerwerte nach Reset & Reload baseline');
    assert(reloaded.world.currentLocationId === 'loc-tavern', 'Test T3: Weltort nach Reset & Reload baseline');
    assert(reloaded.itemInstances?.length === 1 && reloaded.itemInstances[0].id === 'item-sword-start', 'Test T4: ItemInstances nach Reset & Reload baseline');
    assert(reloaded.equipmentState?.length === 1 && reloaded.equipmentState[0].itemInstanceId === 'item-sword-start', 'Test T5: EquipmentState nach Reset & Reload baseline');
    assert(reloaded.storyState?.storyEntities?.length === 0, 'Test T6: StoryEntities nach Reset & Reload geleert');
    assert(JSON.stringify(reloaded.characterKnowledge) === JSON.stringify(adventureWithSnapshots.initialCharacterKnowledge), 'Test T7: CharacterKnowledge nach Reset & Reload baseline');
    assert(reloaded.pendingPickup === null, 'Test T8: pendingPickup nach Reset & Reload null');
    assert(reloaded.pendingTransfer === null, 'Test T9: pendingTransfer nach Reset & Reload null');
    assert(reloaded.collectionTasks?.length === 0, 'Test T10: collectionTasks nach Reset & Reload leer');
    assert(reloaded.worldTime?.day === 1 && reloaded.worldTime?.hour === 8, 'Test T11: worldTime nach Reset & Reload baseline');
  }

  // ==========================================
  // Test U – First Message Flow Absicherung
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const firstMsgText = adv.firstMessage;
    const fp = AIStoryStateProcessor.computeMessageFingerprint(firstMsgText);

    // Durchlauf 1: First Message verarbeitet
    adv.storyState.processedFirstMessage = true;
    adv.storyState.processedFirstMessageFingerprint = fp;

    // Reset ausführen
    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.storyState?.processedFirstMessage === false, 'Test U1: Reset setzt processedFirstMessage auf false');
    assert(resetAdv.storyState?.processedFirstMessageFingerprint === '', 'Test U2: Reset leert processedFirstMessageFingerprint');

    // Durchlauf 2: First Message wird erneut sauber verarbeitet
    const parseResult = AIStoryStateProcessor.parseAndProcessAiResponse(
      firstMsgText,
      resetAdv
    );
    const reprocessedAdv = parseResult.updatedAdventure;
    const reprocessedFp = AIStoryStateProcessor.computeMessageFingerprint(firstMsgText);
    reprocessedAdv.storyState!.processedFirstMessage = true;
    reprocessedAdv.storyState!.processedFirstMessageFingerprint = reprocessedFp;

    assert(reprocessedAdv.storyState?.processedFirstMessage === true, 'Test U3: Durchlauf 2 markiert processedFirstMessage erfolgreich');
    assert(reprocessedAdv.storyState?.processedFirstMessageFingerprint === fp, 'Test U4: Fingerprint stimmt deterministisch überein');
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
