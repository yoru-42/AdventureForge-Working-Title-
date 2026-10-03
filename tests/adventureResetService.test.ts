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
  Territory,
  ChatMessage
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
  console.log('=== STARTING ADVENTURE RESET TESTS: KANON BEHALTEN, RUNTIME ZURÜCKSETZEN ===');

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

  const baselineNpcA: NPC = {
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
    worldStory: {
      mainStory: 'Story A: Der König wurde vor 20 Jahren ermordet.',
      era: 'Heroisch'
    },
    npcs: [baselineNpcA],
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

  // =========================================================================
  // ABSCHNITT 12: HAUPT-SPEZIFIKATIONSTESTS (Test A bis Test G + 13. Persistenz)
  // =========================================================================

  // -------------------------------------------------------------------------
  // Test A – Neuer NPC bleibt
  // Initial: A
  // Editor: A, B
  // Reset -> Erwartung: A, B
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    const npcB: NPC = {
      id: 'npc-mira',
      name: 'Mira',
      role: 'Alchemistin',
      personality: 'Klug',
      bio: 'Eine reisende Alchemistin.',
      appearance: { hairColor: 'Kastanienbraun', eyeColor: 'Grün', age: '24', build: 'Schlank', gender: 'Weiblich' },
      attributes: [],
      isHostile: false
    };
    adv.npcs.push(npcB);

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.npcs.length === 2, 'Test A: Gesamtzahl NPCs nach Reset beträgt 2');
    assert(resetAdv.npcs.some(n => n.name === 'Aldric'), 'Test A: Initialer NPC A (Aldric) bleibt vorhanden');
    assert(resetAdv.npcs.some(n => n.name === 'Mira'), 'Test A: Neuer NPC B (Mira) bleibt nach Reset vorhanden');
  }

  // -------------------------------------------------------------------------
  // Test B – NPC-Änderung bleibt
  // Initial: Aldric – Beruf Wirt
  // Editor: Aldric – Beruf Händler
  // Reset -> Erwartung: Aldric – Beruf Händler
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    const aldric = adv.npcs.find(n => n.name === 'Aldric')!;
    aldric.role = 'Händler';
    aldric.bio = 'Ein wohlhabender Händler.';

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    const resetAldric = resetAdv.npcs.find(n => n.name === 'Aldric');
    assert(resetAldric !== undefined, 'Test B: Aldric nach Reset vorhanden');
    assert(resetAldric?.role === 'Händler', 'Test B: NPC-Rolle bleibt Händler (nicht auf Wirt zurückgesetzt)');
    assert(resetAldric?.bio === 'Ein wohlhabender Händler.', 'Test B: NPC-Bio-Änderung bleibt erhalten');
  }

  // -------------------------------------------------------------------------
  // Test C – Story & Quests bleibt
  // Initial: Story A
  // Editor: Story B
  // Reset -> Erwartung: Story B
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.worldStory = {
      mainStory: 'Story B: Der König wurde vor 15 Jahren ermordet.',
      era: 'Düster'
    };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(
      resetAdv.worldStory?.mainStory === 'Story B: Der König wurde vor 15 Jahren ermordet.',
      'Test C: worldStory bleibt Story B (Änderung bleibt erhalten)'
    );
  }

  // -------------------------------------------------------------------------
  // Test D – Neuer Story-&-Quests-Eintrag bleibt
  // Initial: Quest A
  // Editor: Quest A, Quest B
  // Reset -> Erwartung: Quest A, Quest B
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    const questA: LoreEntry = {
      id: 'quest-a',
      title: 'Quest A: Finde das Amulett',
      category: 'Story & Quests',
      description: 'Ein uraltes Amulett soll in der Taverne verborgen sein.',
      isUnlocked: true
    };
    adv.loreDatabase = [questA];

    // Editor adds Quest B
    const questB: LoreEntry = {
      id: 'quest-b',
      title: 'Quest B: Rette das Dorf',
      category: 'Story & Quests',
      description: 'Banditen bedrohen die Vororte.',
      isUnlocked: true
    };
    adv.loreDatabase.push(questB);

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.loreDatabase?.length === 2, 'Test D: loreDatabase enthält nach Reset 2 Einträge');
    assert(resetAdv.loreDatabase?.some(e => e.title === 'Quest A: Finde das Amulett'), 'Test D: Quest A bleibt erhalten');
    assert(resetAdv.loreDatabase?.some(e => e.title === 'Quest B: Rette das Dorf'), 'Test D: Neuer Story-&-Quests-Eintrag Quest B bleibt nach Reset erhalten');
  }

  // -------------------------------------------------------------------------
  // Test E – Chat bleibt vollständig
  // Erstelle:
  // Prolog, User 1, Model 1, User 2, Model 2, User 3, Model 3
  // Reset ausführen.
  // Erwartung:
  // resetAdv.chatHistory.length === 7
  // und jede Message muss dieselbe ID, Rolle, Nachricht, Reihenfolge haben.
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.chatHistory = [
      { id: 'msg-0-prologue', role: 'model', text: 'Prolog: Die Reise beginnt.' },
      { id: 'msg-1-user', role: 'user', text: 'User 1: Ich sehe mich in der Taverne um.' },
      { id: 'msg-2-model', role: 'model', text: 'Model 1: Der Raum ist warm erleuchtet.' },
      { id: 'msg-3-user', role: 'user', text: 'User 2: Ich spreche mit dem Wirt.' },
      { id: 'msg-4-model', role: 'model', text: 'Model 2: Aldric nickt dir freundlich zu.' },
      { id: 'msg-5-user', role: 'user', text: 'User 3: Ich bestelle ein Bier.' },
      { id: 'msg-6-model', role: 'model', text: 'Model 3: Er zapft dir ein frisches Ale.' }
    ];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.chatHistory.length === 7, 'Test E: Chatverlauf hat nach Reset exakt 7 Nachrichten');
    
    let allMessagesIdentical = true;
    for (let i = 0; i < adv.chatHistory.length; i++) {
      const orig = adv.chatHistory[i];
      const reset = resetAdv.chatHistory[i];
      if (!reset || reset.id !== orig.id || reset.role !== orig.role || reset.text !== orig.text) {
        allMessagesIdentical = false;
        break;
      }
    }
    assert(allMessagesIdentical, 'Test E: Jede Nachricht hat dieselbe ID, Rolle, Text und Reihenfolge (keine Nachrichten gelöscht)');
  }

  // -------------------------------------------------------------------------
  // Test F – Runtime wird trotzdem zurückgesetzt
  // Vor Reset:
  // combatState vorhanden
  // pendingPickup vorhanden
  // collectionTasks vorhanden
  // emotionState vorhanden
  // physicalChangeHistory vorhanden
  // Nach Reset:
  // combatState === undefined
  // pendingPickup === null
  // collectionTasks === []
  // emotionState === undefined
  // physicalChangeHistory === []
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.combatState = {
      round: 3,
      enemies: [{ id: 'goblin-1', name: 'Goblin', hp: 10, maxHp: 20 }]
    } as any;
    adv.pendingPickup = {
      id: 'pickup-test',
      sourceTitle: 'Truhe',
      sourceType: 'chest',
      items: [{ id: 'item-gold', itemDefinitionId: 'def-gold', name: 'Gold', quantity: 50 }],
      requiresExplicitConfirmation: true
    };
    adv.collectionTasks = [
      { id: 'task-herbs', title: 'Kräutersammeln', targetQuantity: 5, collectedQuantity: 2, status: 'active' }
    ];
    adv.player.emotionState = { emotion: 'panisch', intensity: 'stark' } as any;
    adv.player.physicalChangeHistory = [
      { id: 'change-1', timestamp: '2026-10-02T12:00:00Z', stageName: 'Mutation', changes: [], summary: 'Arm mutiert', transformationIntensity: 20 }
    ];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.combatState === undefined, 'Test F: combatState ist undefined');
    assert(resetAdv.pendingPickup === null, 'Test F: pendingPickup ist null');
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test F: collectionTasks ist []');
    assert(resetAdv.player.emotionState === undefined, 'Test F: emotionState ist undefined');
    assert(Array.isArray(resetAdv.player.physicalChangeHistory) && resetAdv.player.physicalChangeHistory.length === 0, 'Test F: physicalChangeHistory ist []');
  }

  // -------------------------------------------------------------------------
  // Test G – Kanon + Runtime gleichzeitig (Zentraler Integrationstest)
  // Vor Reset:
  // NPC B hinzugefügt
  // Story B gespeichert
  // combatState aktiv
  // collectionTask aktiv
  // Chat mit 10 Nachrichten
  // Reset:
  // NPC B          → bleibt
  // Story B        → bleibt
  // Chat 10 msgs   → bleibt
  // combatState    → weg
  // collectionTask → weg
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);

    // Kanon additions
    const npcB: NPC = {
      id: 'npc-b',
      name: 'NPC B',
      role: 'Wächter',
      personality: 'Streng',
      bio: 'Wacht am Tor.',
      appearance: { hairColor: 'Blond', eyeColor: 'Blau', age: '35', build: 'Kräftig', gender: 'Männlich' },
      attributes: [],
      isHostile: false
    };
    adv.npcs.push(npcB);

    adv.worldStory = {
      mainStory: 'Story B: Das Königreich steht am Abgrund.',
      era: 'Episch'
    };

    // Chat with 10 messages
    const tenMessages: ChatMessage[] = [];
    for (let i = 1; i <= 10; i++) {
      tenMessages.push({
        id: `chat-${i}`,
        role: i % 2 === 1 ? 'user' : 'model',
        text: `Nachricht ${i}`
      });
    }
    adv.chatHistory = tenMessages;

    // Runtime additions
    adv.combatState = {
      round: 5,
      activeFighterId: 'char-player'
    } as any;
    adv.collectionTasks = [
      { id: 'task-active', title: 'Sammelaufgabe', targetQuantity: 10, collectedQuantity: 3, status: 'active' }
    ];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);

    // Kanon assertions
    assert(resetAdv.npcs.some(n => n.name === 'NPC B'), 'Test G: NPC B bleibt erhalten');
    assert(resetAdv.worldStory?.mainStory === 'Story B: Das Königreich steht am Abgrund.', 'Test G: Story B bleibt gespeichert');
    assert(resetAdv.chatHistory.length === 10, 'Test G: Chat mit 10 Nachrichten bleibt vollständig erhalten');

    // Runtime assertions
    assert(resetAdv.combatState === undefined, 'Test G: combatState ist weg (undefined)');
    assert(Array.isArray(resetAdv.collectionTasks) && resetAdv.collectionTasks.length === 0, 'Test G: collectionTask ist weg ([])');
  }

  // -------------------------------------------------------------------------
  // 13. Persistence-Test
  // Danach:
  // const stored = JSON.stringify(resetAdventure);
  // const loaded = JSON.parse(stored);
  // prüfen:
  // NPC bleibt
  // Story bleibt
  // Chat bleibt
  // Runtime bleibt gelöscht
  // -------------------------------------------------------------------------
  {
    const adv = deepClone(adventureWithSnapshots);
    // Setup kanon
    adv.npcs.push({
      id: 'npc-persistent',
      name: 'Gareth',
      role: 'Schmied',
      personality: 'Fleißig',
      bio: 'Schmiedet feine Klingen.',
      appearance: { hairColor: 'Braun', eyeColor: 'Braun', age: '40', build: 'Breit', gender: 'Männlich' },
      attributes: [],
      isHostile: false
    });
    adv.worldStory = {
      mainStory: 'Dauerhafte Weltgeschichte',
      era: 'Mittelalter'
    };
    adv.chatHistory = [
      { id: 'p1', role: 'model', text: 'Prolog' },
      { id: 'u1', role: 'user', text: 'Hallo Welt' },
      { id: 'm1', role: 'model', text: 'Willkommen!' }
    ];

    // Setup runtime
    adv.combatState = { round: 2 } as any;
    adv.collectionTasks = [{ id: 'task-p', title: 'Erz', targetQuantity: 4, collectedQuantity: 1, status: 'active' }];
    adv.pendingPickup = { id: 'p-1', sourceTitle: 'Kiste', sourceType: 'chest', items: [], requiresExplicitConfirmation: true };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);

    // Serialize and reload
    const stored = JSON.stringify(resetAdv);
    const loaded: Adventure = JSON.parse(stored);

    assert(loaded.npcs.some(n => n.name === 'Gareth'), '13. Persistence-Test: NPC bleibt nach Speichern/Laden erhalten');
    assert(loaded.worldStory?.mainStory === 'Dauerhafte Weltgeschichte', '13. Persistence-Test: Story bleibt nach Speichern/Laden erhalten');
    assert(loaded.chatHistory.length === 3, '13. Persistence-Test: Chat bleibt nach Speichern/Laden vollständig erhalten');
    assert(loaded.combatState === undefined, '13. Persistence-Test: Runtime combatState bleibt nach Speichern/Laden gelöscht');
    assert(loaded.collectionTasks?.length === 0, '13. Persistence-Test: Runtime collectionTasks bleibt nach Speichern/Laden leer');
    assert(loaded.pendingPickup === null, '13. Persistence-Test: Runtime pendingPickup bleibt nach Speichern/Laden null');
  }

  // =========================================================================
  // ABSCHNITT 2: REGRESSIONS- & SYSTEMTESTS
  // =========================================================================

  // Test R1 – Spieler: Editordaten bleiben, Runtimelevel & temporäre Zustände werden zurückgesetzt
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.player.name = 'Veränderter Eldrin';
    adv.player.campaignPowerLevels['Stärke'].value = 999;
    adv.player.physicalChangeHistory = [{ id: 'p1', timestamp: 'now', stageName: 'Metamorphose', changes: [], summary: 'Verwandelt', transformationIntensity: 50 }];
    adv.player.emotionState = { emotion: 'panisch', intensity: 'stark' } as any;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.player.name === 'Veränderter Eldrin', 'Test R1: Spielername bleibt bei Editor-Änderung erhalten');
    assert(resetAdv.player.campaignPowerLevels?.['Stärke']?.value === 50, 'Test R1: Spieler-Stärke auf Initialwert zurückgesetzt');
    assert(resetAdv.player.physicalChangeHistory?.length === 0, 'Test R1: Physische Änderungshistorie geleert');
    assert(resetAdv.player.emotionState === undefined, 'Test R1: Emotionszustand zurückgesetzt');
  }

  // Test R2 – Welt: Neue Orte/Territorien bleiben, Runtimezustand wird zurückgesetzt
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.world.currentLocationId = 'loc-dungeon';
    adv.world.dynamicWorldState = { activeThreats: ['loc-tavern-threat'] } as any;
    adv.dynamicWorldState = { activeThreats: ['global-threat'] } as any;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.world.currentLocationId === 'loc-tavern', 'Test R2: Startort der Welt wiederhergestellt');
    assert(resetAdv.world.dynamicWorldState === undefined, 'Test R2: world.dynamicWorldState geleert');
    assert(resetAdv.dynamicWorldState === undefined, 'Test R2: adventure.dynamicWorldState geleert');
  }

  // Test R3 – First Message Flow: processedFirstMessage wird zurückgesetzt, Chat bleibt erhalten
  {
    const adv = deepClone(adventureWithSnapshots);
    const fingerprint = AIStoryStateProcessor.computeMessageFingerprint(adv.firstMessage);
    adv.storyState.processedFirstMessage = true;
    adv.storyState.processedFirstMessageFingerprint = fingerprint;

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.storyState?.processedFirstMessage === false, 'Test R3: processedFirstMessage auf false zurückgesetzt');
    assert(resetAdv.storyState?.processedFirstMessageFingerprint === '', 'Test R3: First-Message-Fingerprint geleert');
    assert(resetAdv.chatHistory.length === 2, 'Test R3: Chat-History bleibt unberührt');
  }

  // Test R4 – ItemInstances & Equipment: Dynamischer Loot/Drops entfernt, Initialbestand/Editorbestand bleibt
  {
    const adv = deepClone(adventureWithSnapshots);
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
    assert(resetAdv.itemInstances?.length === 1, 'Test R4: Dynamisch erstelltes Item nicht mehr vorhanden');
    assert(resetAdv.itemInstances?.[0]?.id === 'item-sword-start', 'Test R4: Initiales Startitem vorhanden');
  }

  // Test R5 – BodyCondition: Temporäre Conditions entfernt
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.player.activeConditions = [
      {
        id: 'cond-shackles',
        name: 'Gefesselt',
        type: 'restraint',
        bodyAreas: ['hands'],
        sourceItemInstanceId: 'item-shackles-101',
        description: 'Schwere Fesseln',
        isActive: true,
        duration: 'Temporär'
      }
    ];

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert((resetAdv.player.activeConditions || []).length === 0, 'Test R5: Temporäre Fesselung/BodyCondition nach Reset entfernt');
  }

  // Test R6 – Proposals (Pending Transfer & Pickup)
  {
    const adv = deepClone(adventureWithSnapshots);
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
    adv.pendingPickup = {
      id: 'pickup-456',
      sourceTitle: 'Schatztruhe',
      sourceType: 'chest',
      items: [{ id: 'inst-ruby', itemDefinitionId: 'def-ruby', name: 'Rubin', quantity: 1, weightKg: 0.1 }],
      requiresExplicitConfirmation: true
    };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.pendingTransfer === null, 'Test R6: pendingTransfer auf null zurückgesetzt');
    assert(resetAdv.pendingPickup === null, 'Test R6: pendingPickup auf null zurückgesetzt');
  }

  // Test R7 – StatusElements & Weltzeit
  {
    const adv = deepClone(adventureWithSnapshots);
    adv.worldTime = { day: 14, hour: 23, minute: 45 };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.worldTime?.day === 1, 'Test R7: Tag auf 1 zurückgesetzt');
    assert(resetAdv.worldTime?.hour === 8, 'Test R7: Stunde auf 8 zurückgesetzt');
    assert(resetAdv.worldTime?.minute === 0, 'Test R7: Minute auf 0 zurückgesetzt');
    const timeEl = resetAdv.statusElements?.find(e => e.label === 'Zeit');
    assert(timeEl?.value === '08:00', 'Test R7: StatusElement Zeit auf 08:00 synchronisiert');
  }

  // Test R8 – Snapshot Immutability: initialPlayer und initialWorld werden durch Reset nicht mutiert
  {
    const adv = deepClone(adventureWithSnapshots);
    const initialPlayerSnapshot = JSON.stringify(adv.initialPlayer);
    const initialWorldSnapshot = JSON.stringify(adv.initialWorld);

    adv.player.campaignPowerLevels['Stärke'].value = 80;
    adv.world.currentLocationId = 'loc-dungeon';

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(JSON.stringify(resetAdv.initialPlayer) === initialPlayerSnapshot, 'Test R8: initialPlayer Snapshot bleibt unverändert');
    assert(JSON.stringify(resetAdv.initialWorld) === initialWorldSnapshot, 'Test R8: initialWorld Snapshot bleibt unverändert');
  }

  // Test R9 – Legacy Adventure Protection: Bereits gespielte Abenteuer überschreiben Snapshots nicht versehentlich
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
      npcs: [],
      inventory: [],
      loreDatabase: []
    };

    const snapshotted = AdventureResetService.ensureInitialSnapshots(playedLegacyAdventure, false);
    assert(snapshotted.initialPlayer === undefined, 'Test R9: ensureInitialSnapshots erzeugt keinen versehentlichen initialPlayer für gespielte Abenteuer');
    
    const resetLegacy = AdventureResetService.resetAdventureToInitialState(playedLegacyAdventure);
    assert(resetLegacy.player.campaignPowerLevels?.['Stärke']?.value === 10, 'Test R9: Fallback-Reset setzt Stärke sicher auf Minimum (10)');
  }

  // Test R10 – Transformation Reset: activeTransformationId wird zurückgesetzt, Aussehen bleibt kanonisch
  {
    const playerWithTrans: Character = {
      id: 'char-trans',
      name: 'Held',
      role: 'Krieger',
      bio: '',
      personality: 'Ruhig',
      appearance: {
        hairColor: 'Schwarz',
        eyeColor: 'Blau',
        age: '20',
        build: 'Normal',
        gender: 'Männlich',
        activeTransformationId: 'trans-dragon-form',
        transformationState: {
          activeTransformationId: 'trans-dragon-form',
          currentIntensity: 80,
          metamorphosisProgress: 50,
          powerUsage: 100
        } as any
      },
      attributes: [],
      activeConditions: [
        { id: 'cond-trans', name: 'Drachenform', description: 'Drachenform', type: 'magical_mutation', duration: 'Temporär', isActive: true }
      ]
    };

    const adv: Adventure = {
      ...deepClone(adventureWithSnapshots),
      player: playerWithTrans,
      initialPlayer: {
        ...deepClone(playerWithTrans),
        appearance: {
          ...deepClone(playerWithTrans.appearance!),
          activeTransformationId: 'standard',
          transformationState: undefined
        }
      }
    };

    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    assert(resetAdv.player.appearance?.activeTransformationId === 'standard', 'Test R10: activeTransformationId wird auf standard zurückgesetzt');
    assert(resetAdv.player.appearance?.transformationState?.currentIntensity === 0, 'Test R10: transformationState Intensität auf 0 zurückgesetzt');
    assert((resetAdv.player.activeConditions || []).length === 0, 'Test R10: Temporäre Transformations-Condition entfernt');
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
