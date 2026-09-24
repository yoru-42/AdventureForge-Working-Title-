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

function deepClone<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
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
  // Test A – StatusElements (Legacy Protection & Baseline Reset)
  // ==========================================
  {
    const playedLegacyAdventure: Adventure = {
      id: 'adv-legacy-status',
      authorId: 'user-1',
      isPublic: false,
      prologue: 'Prolog...',
      chatHistory: [
        { id: '1', role: 'model', text: 'Prolog...' },
        { id: '2', role: 'user', text: 'Ich bin erschöpft nach dem Kampf.' }
      ],
      player: deepClone(baselinePlayer),
      world: deepClone(baselineWorld),
      npcs: [],
      inventory: [],
      loreDatabase: [],
      statusElements: [
        { id: 'st-time', label: 'Zeit', value: '23:45' },
        { id: 'st-stam', label: 'Ausdauer', value: '12%' }
      ],
      worldTime: { day: 10, hour: 23, minute: 45 }
    };

    const snapshotted = AdventureResetService.ensureInitialSnapshots(playedLegacyAdventure, false);
    assert(snapshotted.initialStatusElements === undefined, 'Test A1: ensureInitialSnapshots deklariert veränderten statusElements-Zustand eines Legacy-Abenteuers NICHT als initialStatusElements');

    const resetAdv = AdventureResetService.resetAdventureToInitialState(playedLegacyAdventure);
    const timeEl = resetAdv.statusElements?.find(e => e.label === 'Zeit');
    const stamEl = resetAdv.statusElements?.find(e => e.label === 'Ausdauer');
    assert(timeEl?.value === '08:00', 'Test A2: StatusElement Zeit wird beim Reset sicher auf 08:00 zurückgesetzt');
    assert(stamEl?.value === '100%', 'Test A3: StatusElement Ausdauer wird beim Reset sicher auf 100% zurückgesetzt');
  }

  // ==========================================
  // Test B – WorldTime (Legacy Protection & Fallback Reset)
  // ==========================================
  {
    const playedLegacyAdventure: Adventure = {
      id: 'adv-legacy-time',
      authorId: 'user-1',
      isPublic: false,
      prologue: 'Prolog...',
      chatHistory: [
        { id: '1', role: 'model', text: 'Prolog...' },
        { id: '2', role: 'user', text: 'Es vergehen viele Tage.' }
      ],
      player: deepClone(baselinePlayer),
      world: deepClone(baselineWorld),
      npcs: [],
      inventory: [],
      loreDatabase: [],
      statusElements: [],
      worldTime: { day: 15, hour: 22, minute: 30 }
    };

    const snapshotted = AdventureResetService.ensureInitialSnapshots(playedLegacyAdventure, false);
    assert(snapshotted.initialWorldTime === undefined, 'Test B1: ensureInitialSnapshots deklariert veränderte Weltzeit eines Legacy-Abenteuers NICHT als initialWorldTime');

    const resetAdv = AdventureResetService.resetAdventureToInitialState(playedLegacyAdventure);
    assert(resetAdv.worldTime?.day === 1, 'Test B2: Fallback-Weltzeit Tag wird sicher auf 1 zurückgesetzt');
    assert(resetAdv.worldTime?.hour === 8, 'Test B3: Fallback-Weltzeit Stunde wird sicher auf 8 zurückgesetzt');
    assert(resetAdv.worldTime?.minute === 0, 'Test B4: Fallback-Weltzeit Minute wird sicher auf 0 zurückgesetzt');
  }

  // ==========================================
  // Test C – CollectionTasks (Single Task)
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
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test C: 1 CollectionTask nach Reset entfernt (collectionTasks === [])');
  }

  // ==========================================
  // Test D – mehrere CollectionTasks
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
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test D: Mehrere CollectionTasks nach Reset komplett geleert (collectionTasks === [])');
  }

  // ==========================================
  // Test E – Legacy Snapshot Protection
  // ==========================================
  {
    const playedLegacyAdventure: Adventure = {
      id: 'adv-legacy-played',
      authorId: 'user-1',
      isPublic: false,
      prologue: 'Alte Geschichte...',
      statusElements: [{ id: 'st-1', label: 'Ausdauer', value: '15%' }],
      worldTime: { day: 25, hour: 19, minute: 40 },
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
      npcs: [{ id: 'dyn-npc-1', name: 'Zufalls-NPC', role: 'Wanderer', personality: 'Ruhig', bio: '', appearance: { hairColor: '', eyeColor: '', age: '30', build: '', gender: '' }, attributes: [], isHostile: false }],
      loreDatabase: [{ id: 'dyn-lore-1', title: 'Altes Gerücht', category: 'Weltregeln', description: '', isUnlocked: true }],
      inventory: ['Altes Schwert'],
      itemInstances: [{ id: 'dyn-item-1', itemDefinitionId: 'def-1', name: 'Schwert', owner: 'player', quantity: 1, weightKg: 2 }],
      inventoryEntries: [{ id: 'entry-1', itemDefinitionId: 'def-1', itemInstanceId: 'dyn-item-1' }],
      equipmentState: [{ itemInstanceId: 'dyn-item-1', itemDefinitionId: 'def-1', itemName: 'Schwert', ownerId: 'player', equipped: true, slot: 'weapon', bodyAreas: ['hands'] }],
      structuredInventory: { weapons: [], customItems: [] },
      storyState: { currentLocationName: 'Alte Höhle', currentTerritoryName: '', activeSituation: '', activeGoals: [], relationships: [], storyEntities: [], lastUpdatedTime: '' },
      characterKnowledge: { knownCharacters: ['npc-1'], knownLocations: ['loc-1'] },
      currentLocation: { locationId: 'loc-cave' },
      lootSources: [{ id: 'loot-1', type: 'monster_body', title: 'Beute', items: [] }],
      worldDrops: [{ id: 'drop-1', itemInstance: { id: 'inst-1', itemDefinitionId: 'def-1', name: 'Gold', quantity: 10 } }]
    };

    const snapshotted = AdventureResetService.ensureInitialSnapshots(playedLegacyAdventure, false);
    assert(snapshotted.initialPlayer === undefined, 'Test E1: initialPlayer bleibt undefined');
    assert(snapshotted.initialWorld === undefined, 'Test E2: initialWorld bleibt undefined');
    assert(snapshotted.initialLoreDatabase === undefined, 'Test E3: initialLoreDatabase bleibt undefined');
    assert(snapshotted.initialNpcs === undefined, 'Test E4: initialNpcs bleibt undefined');
    assert(snapshotted.initialInventory === undefined, 'Test E5: initialInventory bleibt undefined');
    assert(snapshotted.initialItemInstances === undefined, 'Test E6: initialItemInstances bleibt undefined');
    assert(snapshotted.initialInventoryEntries === undefined, 'Test E7: initialInventoryEntries bleibt undefined');
    assert(snapshotted.initialEquipmentState === undefined, 'Test E8: initialEquipmentState bleibt undefined');
    assert(snapshotted.initialStructuredInventory === undefined, 'Test E9: initialStructuredInventory bleibt undefined');
    assert(snapshotted.initialStoryState === undefined, 'Test E10: initialStoryState bleibt undefined');
    assert(snapshotted.initialCharacterKnowledge === undefined, 'Test E11: initialCharacterKnowledge bleibt undefined');
    assert(snapshotted.initialCurrentLocation === undefined, 'Test E12: initialCurrentLocation bleibt undefined');
    assert(snapshotted.initialLootSources === undefined, 'Test E13: initialLootSources bleibt undefined');
    assert(snapshotted.initialWorldDrops === undefined, 'Test E14: initialWorldDrops bleibt undefined');
    assert(snapshotted.initialStatusElements === undefined, 'Test E15: initialStatusElements bleibt undefined');
    assert(snapshotted.initialWorldTime === undefined, 'Test E16: initialWorldTime bleibt undefined');

    // Safe fallback reset
    const resetLegacy = AdventureResetService.resetAdventureToInitialState(playedLegacyAdventure);
    assert(resetLegacy.player.campaignPowerLevels?.['Stärke']?.value === 10, 'Test E17: Legacy-Spieler Stärke wird sicher auf Minimum (10) zurückgesetzt');
    assert(resetLegacy.player.campaignPowerLevels?.['Ausdauer']?.value === 15, 'Test E18: Legacy-Spieler Ausdauer wird sicher auf Minimum (15) zurückgesetzt');
  }

  // ==========================================
  // Test F – Vollständiger Reset (Multi-System Synchronisation)
  // ==========================================
  {
    const initialAdv = JSON.parse(JSON.stringify(adventureWithSnapshots));

    // Dynamic mutations across all game systems:
    initialAdv.player.name = 'Mutierter Spieler';
    initialAdv.player.campaignPowerLevels['Stärke'].value = 350;
    initialAdv.player.physicalChangeHistory = [{ id: 'p1', timestamp: 'now', stageName: 'Metamorphose', changes: [], summary: 'Verwandelt', transformationIntensity: 50 }];
    initialAdv.player.emotionState = { emotion: 'panisch', intensity: 'stark' };
    initialAdv.player.activeConditions = [{ id: 'cond-1', name: 'Gefesselt', type: 'restraint', bodyAreas: ['hands'], sourceItemInstanceId: 'inst-shackles', description: 'Fesseln', isActive: true }];
    initialAdv.world.currentLocationId = 'loc-dungeon';
    initialAdv.world.dynamicWorldState = { destroyedBuildings: ['loc-tavern'] };
    initialAdv.dynamicWorldState = { custom: true };
    initialAdv.npcs.push({ id: 'dyn-npc-bandit', name: 'Räuber', role: 'Gegner', personality: 'Aggressiv', bio: '', appearance: { hairColor: '', eyeColor: '', age: '30', build: '', gender: '' }, attributes: [] });
    initialAdv.loreDatabase.push({ id: 'dyn-lore-secret', title: 'Geheimgang', category: 'Orte', description: '', isUnlocked: true });
    initialAdv.itemInstances.push({ id: 'dyn-item-dragon-gem', itemDefinitionId: 'def-gem', name: 'Drachenjuwel', owner: 'player', quantity: 1, weightKg: 0.5 });
    initialAdv.equipmentState.push({ itemInstanceId: 'dyn-item-dragon-gem', itemDefinitionId: 'def-gem', itemName: 'Drachenjuwel', ownerId: 'player', equipped: true, slot: 'ring_1', bodyAreas: ['hands'] });
    initialAdv.storyState.storyEntities.push({ id: 'entity-boss', title: 'Drache', category: 'Gegner', description: 'Mächtiges Monster' });
    initialAdv.storyState.activeGoals.push({ id: 'goal-1', title: 'Fliehe aus Kerker', status: 'active' });
    initialAdv.characterKnowledge.knownLocations = ['loc-tavern', 'loc-secret-boss'];
    initialAdv.pendingPickup = { id: 'pick-1', sourceTitle: 'Schatztruhe', sourceType: 'chest', items: [{ id: 'gem', itemDefinitionId: 'def-gem', name: 'Juwel', quantity: 1, weightKg: 0.1 }], requiresExplicitConfirmation: true };
    initialAdv.pendingTransfer = { id: 'trans-1', itemInstanceId: 'gem', itemName: 'Juwel', quantity: 1, fromOwnerId: 'npc-aldric', fromOwnerName: 'Aldric', toOwnerId: 'player', toOwnerName: 'Spieler', createdAt: Date.now() };
    initialAdv.lootSources = [{ id: 'loot-dead-wolf', type: 'monster_body', title: 'Erlegter Wolf', items: [] }];
    initialAdv.worldDrops = [{ id: 'drop-gold', itemInstance: { id: 'inst-gold-coins', itemDefinitionId: 'def-gold', name: 'Goldmünzen', quantity: 20 } }];
    initialAdv.collectionTasks = [{ id: 'col-1', title: 'Holz', targetQuantity: 10, collectedQuantity: 5, status: 'active' }];
    initialAdv.worldTime = { day: 12, hour: 18, minute: 30 };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(initialAdv);

    assert(resetAdv.player.name === 'Eldrin', 'Test F1: Spielername zurückgesetzt');
    assert(resetAdv.player.campaignPowerLevels?.['Stärke']?.value === 50, 'Test F2: Spieler-Stärke zurückgesetzt');
    assert((resetAdv.player.activeConditions || []).length === 0, 'Test F3: Spieler ActiveConditions zurückgesetzt');
    assert(resetAdv.player.physicalChangeHistory?.length === 0, 'Test F4: Physische Änderungshistorie geleert');
    assert(resetAdv.player.emotionState === undefined, 'Test F5: Emotionszustand zurückgesetzt');
    assert(resetAdv.world.currentLocationId === 'loc-tavern', 'Test F6: Weltort zurückgesetzt');
    assert(resetAdv.world.dynamicWorldState === undefined, 'Test F7: world.dynamicWorldState geleert');
    assert(resetAdv.npcs.length === 1 && resetAdv.npcs[0].name === 'Aldric', 'Test F8: NPCs auf initiale Liste zurückgesetzt');
    assert(resetAdv.loreDatabase?.length === 1 && resetAdv.loreDatabase[0].id === 'lore-kingdom', 'Test F9: LoreDatabase auf initialen Stand zurückgesetzt');
    assert(resetAdv.itemInstances?.length === 1 && resetAdv.itemInstances[0].id === 'item-sword-start', 'Test F10: ItemInstances auf Initialbestand zurückgesetzt');
    assert(resetAdv.equipmentState?.length === 1 && resetAdv.equipmentState[0].itemInstanceId === 'item-sword-start', 'Test F11: EquipmentState auf Initialausrüstung zurückgesetzt');
    assert(resetAdv.storyState?.storyEntities?.length === 0, 'Test F12: StoryEntities geleert');
    assert(resetAdv.storyState?.activeGoals?.length === 0, 'Test F13: ActiveGoals geleert');
    assert(JSON.stringify(resetAdv.characterKnowledge) === JSON.stringify(adventureWithSnapshots.initialCharacterKnowledge), 'Test F14: CharacterKnowledge zurückgesetzt');
    assert(resetAdv.pendingPickup === null, 'Test F15: pendingPickup ist null');
    assert(resetAdv.pendingTransfer === null, 'Test F16: pendingTransfer ist null');
    assert(resetAdv.lootSources?.length === 0, 'Test F17: lootSources geleert');
    assert(resetAdv.worldDrops?.length === 0, 'Test F18: worldDrops geleert');
    assert(resetAdv.collectionTasks?.length === 0, 'Test F19: collectionTasks geleert');
    assert(resetAdv.worldTime?.day === 1 && resetAdv.worldTime?.hour === 8 && resetAdv.worldTime?.minute === 0, 'Test F20: worldTime zurückgesetzt');
  }

  // ==========================================
  // Test G – Persistence (Reset -> Stringify -> Parse -> Verify)
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    adv.player.name = 'Veränderter Held';
    adv.worldTime = { day: 5, hour: 12, minute: 0 };
    adv.collectionTasks = [{ id: 'col-pers', title: 'Pflanzen', targetQuantity: 3, collectedQuantity: 1, status: 'active' }];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    const storedJson = JSON.stringify(resetAdv);
    const reloadedAdv: Adventure = JSON.parse(storedJson);

    assert(reloadedAdv.player.name === 'Eldrin', 'Test G1: Nach Serialisierung und Reload bleibt Initialspieler erhalten');
    assert(reloadedAdv.worldTime?.day === 1 && reloadedAdv.worldTime?.hour === 8, 'Test G2: Nach Serialisierung und Reload bleibt Initialzeit erhalten');
    assert(reloadedAdv.collectionTasks?.length === 0, 'Test G3: Nach Serialisierung und Reload bleibt collectionTasks leer');
    assert(reloadedAdv.itemInstances?.length === 1 && reloadedAdv.itemInstances[0].id === 'item-sword-start', 'Test G4: Nach Reload bleibt ItemInstances-Zustand korrekt');
  }

  // ==========================================
  // Test H – First Message Flow (Single Execution & Reset Re-run)
  // ==========================================
  {
    const adv = JSON.parse(JSON.stringify(adventureWithSnapshots));
    const firstMsgText = adv.firstMessage;
    const fp = AIStoryStateProcessor.computeMessageFingerprint(firstMsgText);

    // Run 1: First message processed
    adv.storyState.processedFirstMessage = true;
    adv.storyState.processedFirstMessageFingerprint = fp;

    // Reset occurs
    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.storyState?.processedFirstMessage === false, 'Test H1: Reset setzt processedFirstMessage auf false');
    assert(resetAdv.storyState?.processedFirstMessageFingerprint === '', 'Test H2: Reset leert processedFirstMessageFingerprint');

    // Run 2: First message can be processed again
    const parseResult = AIStoryStateProcessor.parseAndProcessAiResponse(
      firstMsgText,
      resetAdv
    );
    const reprocessedAdv = parseResult.updatedAdventure;
    const reprocessedFp = AIStoryStateProcessor.computeMessageFingerprint(firstMsgText);
    reprocessedAdv.storyState!.processedFirstMessage = true;
    reprocessedAdv.storyState!.processedFirstMessageFingerprint = reprocessedFp;

    assert(reprocessedAdv.storyState?.processedFirstMessage === true, 'Test H3: Nach Reset kann First Message erneut verarbeitet werden');
    assert(reprocessedAdv.storyState?.processedFirstMessageFingerprint === fp, 'Test H4: Fingerprint stimmt deterministisch überein');

    // Secondary reset clears it again
    const secondResetAdv = AdventureResetService.resetAdventureToInitialState(reprocessedAdv);
    assert(secondResetAdv.storyState?.processedFirstMessage === false, 'Test H5: Zweiter Reset setzt processedFirstMessage wieder auf false');
    assert(secondResetAdv.storyState?.processedFirstMessageFingerprint === '', 'Test H6: Zweiter Reset leert processedFirstMessageFingerprint erneut');
  }

  // ==========================================
  // Section: Initial Snapshot Immutability Lifecycle Tests (A - G)
  // ==========================================

  // Test A – Neues Adventure: Baseline A -> current edits B -> initial bleibt A, current ist B
  {
    const startPlayerA: Character = {
      id: 'char-a',
      name: 'Player A',
      role: 'Krieger',
      bio: 'Startcharakter A',
      appearance: { hairColor: 'Blond', eyeColor: 'Blau', gender: 'Männlich' },
      attributes: [{ name: 'Stärke', value: 10, max: 100 }],
      activeConditions: []
    };
    const startWorldA: WorldSetting = {
      title: 'Welt A',
      description: 'Startwelt A',
      era: 'Antike',
      tone: 'Heroisch',
      isHeroic: true,
      dramaLevel: 'Niedrig',
      regionMarkers: [],
      civilizationMarkers: [],
      placeMarkers: [],
      terrains: [],
      borders: []
    };
    const startInventoryA = ['Starter-Schwert', 'Brot'];

    const newAdv: Adventure = {
      id: 'adv-lifecycle-new',
      authorId: 'user-1',
      isPublic: false,
      world: deepClone(startWorldA),
      player: deepClone(startPlayerA),
      npcs: [],
      loreDatabase: [],
      inventory: deepClone(startInventoryA),
      initialPlayer: deepClone(startPlayerA),
      initialWorld: deepClone(startWorldA),
      initialInventory: deepClone(startInventoryA)
    };

    // User modifies adventure
    newAdv.player.name = 'Player B';
    newAdv.player.appearance.hairColor = 'Rot';
    newAdv.world.title = 'Welt B';
    newAdv.inventory = ['Dunkelklinge', 'Drachenblut'];

    // Simulated Auto-Save payload (preserving initial snapshots)
    const autoSavedAdv = {
      ...newAdv,
      initialPlayer: deepClone(startPlayerA),
      initialWorld: deepClone(startWorldA),
      initialInventory: deepClone(startInventoryA)
    };

    assert(autoSavedAdv.initialPlayer.name === 'Player A', 'Test A1: initialPlayer bleibt A');
    assert(autoSavedAdv.initialPlayer.appearance.hairColor === 'Blond', 'Test A2: initialPlayer Aussehen bleibt A');
    assert(autoSavedAdv.initialWorld.title === 'Welt A', 'Test A3: initialWorld bleibt A');
    assert(autoSavedAdv.initialInventory[0] === 'Starter-Schwert', 'Test A4: initialInventory bleibt A');
    assert(autoSavedAdv.player.name === 'Player B', 'Test A5: aktueller Player ist B');
    assert(autoSavedAdv.world.title === 'Welt B', 'Test A6: aktuelle World ist B');
    assert(autoSavedAdv.inventory[0] === 'Dunkelklinge', 'Test A7: aktuelles Inventory ist B');
  }

  // Test B – Mehrere Änderungen vor dem ersten Auto-Save
  {
    const startPlayerA: Character = {
      id: 'char-a',
      name: 'Start A',
      role: 'Magier',
      appearance: { hairColor: 'Silber', eyeColor: 'Grün', gender: 'Weiblich' },
      attributes: [{ name: 'Intelligenz', value: 20, max: 100 }],
      activeConditions: []
    };

    const initialSnapshotA = deepClone(startPlayerA);

    // Edit step 1: B
    let runningPlayer = deepClone(startPlayerA);
    runningPlayer.name = 'Bearbeitung B';
    runningPlayer.attributes[0].value = 30;

    // Edit step 2: C
    runningPlayer.name = 'Bearbeitung C';
    runningPlayer.attributes[0].value = 40;

    // Auto-Save arrives with frozen initial snapshot
    const saved = {
      player: runningPlayer,
      initialPlayer: initialSnapshotA
    };

    assert(saved.initialPlayer.name === 'Start A', 'Test B1: Snapshot entspricht trotz mehrerer Edits Start A');
    assert(saved.initialPlayer.attributes[0].value === 20, 'Test B2: Snapshot-Attribute bleiben 20');
    assert(saved.player.name === 'Bearbeitung C', 'Test B3: Aktueller Zustand ist C');
  }

  // Test C – Mehrfaches Auto-Save (Start A -> B -> Save -> C -> Save -> D -> Save)
  {
    const startPlayerA: Character = {
      id: 'char-a',
      name: 'Start A',
      role: 'Schurke',
      appearance: { hairColor: 'Braun', eyeColor: 'Braun', gender: 'Männlich' },
      attributes: [],
      activeConditions: []
    };
    const immutableSnapshot = deepClone(startPlayerA);

    let state = { player: deepClone(startPlayerA), initialPlayer: immutableSnapshot };

    // Change B & Save
    state.player.name = 'Zustand B';
    let save1 = { ...state, player: deepClone(state.player), initialPlayer: immutableSnapshot };
    assert(save1.initialPlayer.name === 'Start A' && save1.player.name === 'Zustand B', 'Test C1: Nach Save 1 ist initial A und current B');

    // Change C & Save
    state.player.name = 'Zustand C';
    let save2 = { ...state, player: deepClone(state.player), initialPlayer: immutableSnapshot };
    assert(save2.initialPlayer.name === 'Start A' && save2.player.name === 'Zustand C', 'Test C2: Nach Save 2 ist initial A und current C');

    // Change D & Save
    state.player.name = 'Zustand D';
    let save3 = { ...state, player: deepClone(state.player), initialPlayer: immutableSnapshot };
    assert(save3.initialPlayer.name === 'Start A' && save3.player.name === 'Zustand D', 'Test C3: Nach Save 3 ist initial A und current D');
  }

  // Test D – Bestehendes Adventure (initial = A, current = B -> Speichern -> initial = A, current = B)
  {
    const existingAdv: Adventure = {
      id: 'adv-existing',
      authorId: 'user-1',
      isPublic: false,
      world: { title: 'Welt B', description: '', era: '', tone: '', isHeroic: true, dramaLevel: 'Mittel', regionMarkers: [], civilizationMarkers: [], placeMarkers: [], terrains: [], borders: [] },
      player: { id: 'p1', name: 'Spieler B', role: '', appearance: { hairColor: '', eyeColor: '', gender: '' }, attributes: [], activeConditions: [] },
      npcs: [],
      initialPlayer: { id: 'p1', name: 'Spieler A (Initial)', role: '', appearance: { hairColor: '', eyeColor: '', gender: '' }, attributes: [], activeConditions: [] },
      initialWorld: { title: 'Welt A (Initial)', description: '', era: '', tone: '', isHeroic: true, dramaLevel: 'Mittel', regionMarkers: [], civilizationMarkers: [], placeMarkers: [], terrains: [], borders: [] }
    };

    const validated = AdventureResetService.ensureInitialSnapshots(existingAdv, false);
    assert(validated.initialPlayer?.name === 'Spieler A (Initial)', 'Test D1: Bestehender initialPlayer bleibt erhalten');
    assert(validated.initialWorld?.title === 'Welt A (Initial)', 'Test D2: Bestehende initialWorld bleibt erhalten');
    assert(validated.player.name === 'Spieler B', 'Test D3: Aktueller Spieler bleibt B');
  }

  // Test E – handleFinish() mit Vorab-Änderungen (Start = A, Edits = B, C -> Finish -> initial = A, current = C)
  {
    const startPlayerA: Character = {
      id: 'char-finish',
      name: 'Start A',
      role: 'Paladin',
      appearance: { hairColor: 'Gold', eyeColor: 'Blau', gender: 'Divers' },
      attributes: [{ name: 'Heiligkraft', value: 100, max: 100 }],
      activeConditions: []
    };
    const initialSnapshotRef = deepClone(startPlayerA);

    // Edit B
    let workingPlayer = { ...startPlayerA, name: 'Edit B' };
    // Edit C
    workingPlayer = { ...workingPlayer, name: 'Final C' };

    // Simulated handleFinish using initialSnapshotsRef
    const finalAdv: Adventure = {
      id: 'adv-finish-test',
      authorId: 'user-1',
      isPublic: true,
      world: { title: 'Welt', description: '', era: '', tone: '', isHeroic: true, dramaLevel: 'Mittel', regionMarkers: [], civilizationMarkers: [], placeMarkers: [], terrains: [], borders: [] },
      player: workingPlayer,
      npcs: [],
      initialPlayer: deepClone(initialSnapshotRef)
    };

    assert(finalAdv.initialPlayer?.name === 'Start A', 'Test E1: initialPlayer nach Finish entspricht Start A');
    assert(finalAdv.player.name === 'Final C', 'Test E2: player nach Finish entspricht Final C');
  }

  // Test F – Reset stellt ursprünglichen Zustand A aus Zustand D wieder her
  {
    const startPlayerA: Character = {
      id: 'char-reset-f',
      name: 'Held A',
      role: 'Barde',
      appearance: { hairColor: 'Kastanienbraun', eyeColor: 'Haselnuss', gender: 'Männlich' },
      attributes: [{ name: 'Charisma', value: 80, max: 100 }],
      activeConditions: []
    };

    const adv: Adventure = {
      id: 'adv-reset-flow',
      authorId: 'user-1',
      isPublic: false,
      world: { title: 'Startort', description: '', era: '', tone: '', isHeroic: true, dramaLevel: 'Mittel', regionMarkers: [], civilizationMarkers: [], placeMarkers: [], terrains: [], borders: [] },
      player: {
        id: 'char-reset-f',
        name: 'Transformierter Zustand D',
        role: 'Schattenfürst',
        appearance: { hairColor: 'Pechschwarz', eyeColor: 'Glühend Rot', gender: 'Männlich' },
        attributes: [{ name: 'Charisma', value: 10, max: 100 }],
        activeConditions: [{ id: 'cond-shadow', label: 'Schattengestalt', type: 'transformation', intensity: 'extrem' } as any]
      },
      npcs: [],
      initialPlayer: deepClone(startPlayerA)
    };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.player.name === 'Held A', 'Test F1: Reset stellt Namen Held A wieder her');
    assert(resetAdv.player.role === 'Barde', 'Test F2: Reset stellt Rolle Barde wieder her');
    assert(resetAdv.player.appearance.hairColor === 'Kastanienbraun', 'Test F3: Reset stellt Haarfarbe wieder her');
    assert((resetAdv.player.activeConditions || []).length === 0, 'Test F4: Reset entfernt temporäre Transformation');
  }

  // Test G – Transformation verlässt Normalform, wird gespeichert, Reset bringt Normalform zurück
  {
    const normalPlayer: Character = {
      id: 'char-trans-g',
      name: 'Normaler Mensch',
      role: 'Novize',
      appearance: { hairColor: 'Schwarz', eyeColor: 'Blau', gender: 'Weiblich', activeTransformationId: 'standard' },
      attributes: [{ name: 'Psi', value: 0, max: 100 }],
      activeConditions: []
    };

    const transAdv: Adventure = {
      id: 'adv-trans-g',
      authorId: 'user-1',
      isPublic: true,
      world: { title: 'Psi-Akademie', description: '', era: '', tone: '', isHeroic: true, dramaLevel: 'Mittel', regionMarkers: [], civilizationMarkers: [], placeMarkers: [], terrains: [], borders: [] },
      player: {
        ...deepClone(normalPlayer),
        appearance: {
          ...normalPlayer.appearance,
          activeTransformationId: 'trans-esper-awakened',
          hairColor: 'Leuchtendes Violett',
          eyeColor: 'Silber'
        },
        activeConditions: [
          { id: 'trans-esper', label: 'Erwachte Esper', type: 'transformation', intensity: 'hoch' } as any
        ]
      },
      npcs: [],
      initialPlayer: deepClone(normalPlayer)
    };

    // Auto-save / persistence check
    const saved = JSON.parse(JSON.stringify(transAdv));
    assert(saved.initialPlayer.appearance.activeTransformationId === 'standard', 'Test G1: Im Speicherstand bleibt initialPlayer auf standard');
    assert(saved.player.appearance.activeTransformationId === 'trans-esper-awakened', 'Test G2: Im Speicherstand ist player aktuell auf trans-esper-awakened');

    // Reset back to baseline
    const reverted = AdventureResetService.resetAdventureToInitialState(saved);
    assert(reverted.player.name === 'Normaler Mensch', 'Test G3: Nach Reset ist Spieler wieder Normaler Mensch');
    assert(reverted.player.appearance.activeTransformationId === 'standard', 'Test G4: Nach Reset ist activeTransformationId standard');
    assert(reverted.player.appearance.hairColor === 'Schwarz', 'Test G5: Nach Reset ist Haarfarbe Schwarz');
    assert((reverted.player.activeConditions || []).length === 0, 'Test G6: Nach Reset sind aktive Bedingungen geleert');
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
