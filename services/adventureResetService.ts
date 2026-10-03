import { 
  Adventure, 
  Character, 
  ChatMessage, 
  EquipmentState, 
  InventoryEntry, 
  ItemInstance, 
  LoreEntry, 
  NPC, 
  StatusElement, 
  StoryInfoState, 
  StructuredInventory, 
  WorldSetting, 
  WorldTime,
  CollectionTask
} from '../types';
import { EquipmentConditionService } from './equipmentConditionService';
import { WorldSimulationService } from './worldSimulationService';

/**
 * Safe deep-clone helper avoiding reference sharing and circular issues.
 */
function deepClone<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export class AdventureResetService {
  /**
   * Checks whether an adventure is in a fresh/unplayed initial state.
   * An adventure is fresh if no user chat messages exist and total messages <= 2 (prologue/firstMessage only).
   */
  public static isFreshAdventure(adventure: Adventure): boolean {
    if (!adventure) return false;
    const history = adventure.chatHistory || [];
    const userMessages = history.filter(m => m.role === 'user');
    return userMessages.length === 0 && history.length <= 2;
  }

  /**
   * Populates initial snapshot fields (initialPlayer, initialWorld, initialItemInstances, etc.)
   * for fresh adventures or creation contexts.
   * 
   * For already-progressed legacy adventures (lacking initial snapshots), this does NOT
   * silently declare the current mutated player/world state as the pristine initial snapshot.
   */
  public static ensureInitialSnapshots(adventure: Adventure, forceCreationContext = false): Adventure {
    if (!adventure) return adventure;

    const cloned = { ...adventure };
    const canSnapshotFromCurrent = forceCreationContext || this.isFreshAdventure(cloned);

    if (canSnapshotFromCurrent) {
      if (!cloned.initialPlayer && cloned.player) {
        cloned.initialPlayer = deepClone(cloned.player);
      }
      if (!cloned.initialWorld && cloned.world) {
        cloned.initialWorld = deepClone(cloned.world);
      }
      if (!cloned.initialLoreDatabase && cloned.loreDatabase) {
        cloned.initialLoreDatabase = deepClone(cloned.loreDatabase);
      }
      if (!cloned.initialNpcs && cloned.npcs) {
        cloned.initialNpcs = deepClone(cloned.npcs);
      }
      if (!cloned.initialInventory && cloned.inventory) {
        cloned.initialInventory = deepClone(cloned.inventory);
      }
      if (!cloned.initialItemInstances && cloned.itemInstances) {
        cloned.initialItemInstances = deepClone(cloned.itemInstances);
      }
      if (!cloned.initialInventoryEntries && cloned.inventoryEntries) {
        cloned.initialInventoryEntries = deepClone(cloned.inventoryEntries);
      }
      if (!cloned.initialEquipmentState && cloned.equipmentState) {
        cloned.initialEquipmentState = deepClone(cloned.equipmentState);
      }
      if (!cloned.initialStructuredInventory && cloned.structuredInventory) {
        cloned.initialStructuredInventory = deepClone(cloned.structuredInventory);
      }
      if (!cloned.initialStoryState && cloned.storyState) {
        cloned.initialStoryState = deepClone(cloned.storyState);
      }
      if (!cloned.initialCharacterKnowledge && cloned.characterKnowledge) {
        cloned.initialCharacterKnowledge = deepClone(cloned.characterKnowledge);
      }
      if (!cloned.initialCurrentLocation && cloned.currentLocation) {
        cloned.initialCurrentLocation = deepClone(cloned.currentLocation);
      }
      if (!cloned.initialLootSources && cloned.lootSources) {
        cloned.initialLootSources = deepClone(cloned.lootSources);
      }
      if (!cloned.initialWorldDrops && cloned.worldDrops) {
        cloned.initialWorldDrops = deepClone(cloned.worldDrops);
      }
      if (!cloned.initialStatusElements && cloned.statusElements) {
        cloned.initialStatusElements = deepClone(cloned.statusElements);
      }
      if (!cloned.initialWorldTime && cloned.worldTime) {
        cloned.initialWorldTime = deepClone(cloned.worldTime);
      } else if (!cloned.initialWorldTime) {
        cloned.initialWorldTime = { day: 1, hour: 8, minute: 0 };
      }
      if (!cloned.initialActiveTimeEvents && (cloned.activeTimeEvents || cloned.world?.activeTimeEvents)) {
        cloned.initialActiveTimeEvents = deepClone(cloned.activeTimeEvents || cloned.world?.activeTimeEvents || []);
      }
    }

    return cloned;
  }

  /**
   * Resets an active adventure back to its pristine starting runtime state,
   * while strictly preserving all canonical editor data, additions and chat history.
   * 
   * Canonical / Editor data preserved:
   * - adventure.npcs (all new NPCs, edited NPCs, traits, roles)
   * - adventure.loreDatabase (all entries, Story & Quests, codex entries, world history)
   * - adventure.worldStory & adventure.worldStoryMarkers
   * - adventure.world (new territories, locations, connections, buildings, boundary settings)
   * - adventure.player (permanent profile: name, gender, race, appearance, profession, abilities, potential, parameters)
   * - adventure.chatHistory (completely preserved, no messages deleted)
   * 
   * Runtime data reset:
   * - combatState = undefined
   * - encounterForces = []
   * - dynamicWorldState = undefined
   * - pendingPickup = null
   * - pendingTransfer = null
   * - emotionState = undefined
   * - physicalChangeHistory = []
   * - collectionTasks = []
   * - temporaryConditions = []
   * - runtime storyState (activeSituation, activeGoals, runtime discoveries, processedFirstMessage = false)
   * - player runtime level, xp, power values reset to baseline/start
   * - worldTime & activeTimeEvents reset to start baseline
   */
  public static resetAdventureToInitialState(adventure: Adventure): Adventure {
    if (!adventure) return adventure;

    // 1. Kanon / Editor-Daten des Spielers behalten, nur Runtime-Fortschritt & temporäre Zustände zurücksetzen
    let resetPlayer: Character = deepClone(adventure.player || {} as Character);

    // Runtime Power Levels & Attribute auf Startwerte/Minima zurücksetzen, während Definitionen erhalten bleiben
    if (resetPlayer.campaignPowerLevels) {
      const updatedLevels = { ...resetPlayer.campaignPowerLevels };
      Object.keys(updatedLevels).forEach(key => {
        const initialVal = adventure.initialPlayer?.campaignPowerLevels?.[key]?.value;
        const worldSetting = adventure.world?.campaignPowerSettings?.[key];
        const minVal = typeof worldSetting === 'number'
          ? worldSetting
          : (worldSetting?.min ?? (initialVal !== undefined ? initialVal : 10));

        const baseVal = initialVal !== undefined ? initialVal : minVal;
        updatedLevels[key] = {
          ...updatedLevels[key],
          value: baseVal,
          xp: 0
        };
      });
      resetPlayer.campaignPowerLevels = updatedLevels;
    }

    if (resetPlayer.attributes) {
      resetPlayer.attributes = resetPlayer.attributes.map(attr => {
        const initAttr = adventure.initialPlayer?.attributes?.find(a => a.name === attr.name);
        return {
          ...attr,
          value: initAttr !== undefined ? initAttr.value : attr.value
        };
      });
    }

    // Runtime-Fortschritt (Level, XP, Rang) zurücksetzen
    resetPlayer.level = adventure.initialPlayer?.level || 1;
    resetPlayer.xp = adventure.initialPlayer?.xp || 0;
    resetPlayer.experience = 0;
    resetPlayer.experiencePoints = 0;
    resetPlayer.rank = adventure.initialPlayer?.rank || 'F';

    // Temporäre Runtime-Zustände leeren
    resetPlayer.physicalChangeHistory = [];
    resetPlayer.emotionState = undefined;
    resetPlayer.temporaryConditions = [];
    (resetPlayer as any).combatState = undefined;

    // Aktive Transformation auf Standard/Start zurücksetzen
    if (resetPlayer.appearance) {
      const startTransId = adventure.initialPlayer?.appearance?.activeTransformationId || 'standard';
      resetPlayer.appearance = {
        ...resetPlayer.appearance,
        activeTransformationId: startTransId
      };
      if (resetPlayer.appearance.transformationState) {
        resetPlayer.appearance.transformationState = {
          ...resetPlayer.appearance.transformationState,
          activeTransformationId: startTransId,
          currentIntensity: 0,
          metamorphosisProgress: 0,
          powerUsage: 0
        };
      }
      if (resetPlayer.appearance.chibiForm && !adventure.initialPlayer?.appearance?.chibiForm?.enabled) {
        resetPlayer.appearance.chibiForm = {
          ...resetPlayer.appearance.chibiForm,
          enabled: false
        };
      }
    }

    // Conditions: temporäre entfernen, persistente Startbedingungen wiederherstellen
    const baseConditions = adventure.initialPlayer?.activeConditions
      ? deepClone(adventure.initialPlayer.activeConditions)
      : (resetPlayer.activeConditions || []);

    resetPlayer.activeConditions = baseConditions.filter(
      c => !c.id?.startsWith('temp-') && c.duration !== 'Temporär' && (c as any).type !== 'transformation'
    );
    if (adventure.initialPlayer?.conditions) {
      resetPlayer.conditions = deepClone(adventure.initialPlayer.conditions);
    }

    // 2. Kanonische Welt behalten, nur Runtime-Felder zurücksetzen
    let resetWorld: WorldSetting = deepClone(adventure.world || { territories: [], connections: [] } as WorldSetting);
    resetWorld.dynamicWorldState = undefined;
    resetWorld.encounterForces = undefined;
    resetWorld.currentLocationId = resetWorld.startLocationId || adventure.world?.startLocationId || resetWorld.currentLocationId;
    resetWorld.currentTerritoryId = undefined;

    // Weltzeit auf Startzustand zurücksetzen
    const resetWorldTime: WorldTime = adventure.initialWorldTime
      ? deepClone(adventure.initialWorldTime)
      : { day: 1, hour: 8, minute: 0, totalMinutes: 480 };
    resetWorldTime.totalMinutes = WorldSimulationService.toTotalMinutes(resetWorldTime);
    resetWorld.worldTime = resetWorldTime;

    // Laufzeit-Ereignisse zurücksetzen
    const resetActiveTimeEvents = adventure.initialActiveTimeEvents
      ? deepClone(adventure.initialActiveTimeEvents)
      : [];
    resetWorld.activeTimeEvents = resetActiveTimeEvents;

    // Status-Elemente mit Weltzeit synchronisieren
    let resetStatusElements = adventure.statusElements
      ? deepClone(adventure.statusElements).map(el => {
          if (el.label === 'Zeit' || el.label === 'Uhrzeit') return { ...el, value: '08:00' };
          if (el.label === 'Datum' || el.label === 'Tag') return { ...el, value: 'Tag 1' };
          if (el.label === 'Ausdauer') return { ...el, value: '100%' };
          return deepClone(el);
        })
      : (adventure.initialStatusElements ? deepClone(adventure.initialStatusElements) : []);

    resetStatusElements = WorldSimulationService.syncStatusElementsWithWorldTime(
      resetStatusElements,
      resetWorldTime
    );

    // 3. Kanonische NPCs behalten: Aktuelle adventure.npcs-Liste ist der kanonische Bestand
    const resetNpcs: NPC[] = deepClone(adventure.npcs || []).map((n: NPC) => {
      // Nur echte temporäre Runtime-Zustände zurücksetzen
      if (n.temporaryConditions) n.temporaryConditions = [];
      if (n.emotionState) n.emotionState = undefined;
      if ((n as any).combatState) (n as any).combatState = undefined;
      return n;
    });

    // 4. Kanonische Lore & Codex & STORY & QUESTS behalten
    const resetLoreDatabase: LoreEntry[] = deepClone(adventure.loreDatabase || []).map((e: LoreEntry) => {
      // Event-Schritte auf 'pending' zurücksetzen, wenn vorhanden
      if (e.details?.eventSteps) {
        e.details.eventSteps = e.details.eventSteps.map((s: any) => ({
          ...s,
          status: 'pending'
        }));
      }
      return e;
    });

    // 5. Kanonische Item-Instanzen, Inventar & Ausrüstung
    let resetItemInstances: ItemInstance[];
    if (adventure.initialItemInstances) {
      const initialIds = new Set(adventure.initialItemInstances.map(i => i.id));
      const editorAddedItems = (adventure.itemInstances || []).filter(
        i => !initialIds.has(i.id) && !i.id?.startsWith('dyn-') && !i.id?.startsWith('loot-')
      );
      resetItemInstances = [
        ...adventure.initialItemInstances.map(i => deepClone(i)),
        ...editorAddedItems.map(i => deepClone(i))
      ];
    } else if (adventure.itemInstances) {
      resetItemInstances = adventure.itemInstances
        .filter(i => !i.id?.startsWith('dyn-item-') && !i.id?.startsWith('loot-'))
        .map(i => deepClone(i));
    } else {
      resetItemInstances = [];
    }

    let resetInventoryEntries: InventoryEntry[] | undefined;
    if (adventure.initialInventoryEntries) {
      resetInventoryEntries = deepClone(adventure.initialInventoryEntries);
    } else {
      resetInventoryEntries = adventure.inventoryEntries ? deepClone(adventure.inventoryEntries) : undefined;
    }

    let resetEquipmentState: EquipmentState[];
    if (adventure.initialEquipmentState) {
      resetEquipmentState = deepClone(adventure.initialEquipmentState);
    } else {
      resetEquipmentState = adventure.equipmentState ? deepClone(adventure.equipmentState) : [];
    }

    let resetInventory: string[];
    if (adventure.initialInventory) {
      resetInventory = deepClone(adventure.initialInventory);
    } else {
      resetInventory = adventure.inventory ? deepClone(adventure.inventory) : [];
    }

    let resetStructuredInventory: StructuredInventory | undefined;
    if (adventure.initialStructuredInventory) {
      resetStructuredInventory = deepClone(adventure.initialStructuredInventory);
    } else {
      resetStructuredInventory = adventure.structuredInventory ? deepClone(adventure.structuredInventory) : undefined;
    }

    // 6. Story-State: Dauerhafte Definitionen trennen von Runtime-Zuständen
    const currentStoryState = adventure.storyState || {} as StoryInfoState;
    const initialStoryState = adventure.initialStoryState || {} as StoryInfoState;

    const initialEntityIds = new Set((initialStoryState.storyEntities || []).map(e => e.id));
    const preservedStoryEntities = (currentStoryState.storyEntities || []).filter(e => {
      // Immer behalten, wenn in Initial-Snapshot vorhanden
      if (initialEntityIds.has(e.id)) return true;
      // Laufzeit-Entdeckungen aus Chat-Nachrichten oder temporäre Story-Schritte entfernen
      if (e.sourceStoryMessageId) return false;
      if (e.isNewInStory) return false;
      if (e.id?.startsWith('dyn-') || e.id?.startsWith('runtime-')) return false;
      if (e.category === 'Ziele') return false;
      // Vom Benutzer angelegte/gespeicherte Story-Entities bleiben erhalten
      return true;
    });

    const resetStoryState: StoryInfoState = {
      ...deepClone(currentStoryState),
      currentLocationName: resetWorld.startLocationId || adventure.world?.startLocationId || '',
      currentTerritoryName: '',
      activeSituation: initialStoryState.activeSituation || '',
      activeGoals: initialStoryState.activeGoals ? deepClone(initialStoryState.activeGoals) : [],
      storyEntities: preservedStoryEntities.map(e => deepClone(e)),
      relationships: currentStoryState.relationships ? deepClone(currentStoryState.relationships) : [],
      characterKnowledge: adventure.initialCharacterKnowledge
        ? deepClone(adventure.initialCharacterKnowledge)
        : deepClone(adventure.characterKnowledge || {}),
      processedFirstMessage: false,
      processedFirstMessageFingerprint: '',
      activeTargetLocationId: undefined,
      activeTargetLocationName: undefined,
      lastUpdatedTime: new Date().toISOString()
    };

    // 7. CHAT VOLLSTÄNDIG ERHALTEN: Der Chat bleibt beim normalen Reset komplett erhalten!
    const resetChatHistory: ChatMessage[] = deepClone(adventure.chatHistory || []);

    // 8. Loot, Drops & Tasks zurücksetzen
    const resetLootSources = adventure.initialLootSources 
      ? deepClone(adventure.initialLootSources) 
      : [];
    const resetWorldDrops = adventure.initialWorldDrops 
      ? deepClone(adventure.initialWorldDrops) 
      : [];
    const resetCollectionTasks: CollectionTask[] = [];

    // 9. Reset Adventure zusammensetzen
    let resetAdventure: Adventure = {
      ...deepClone(adventure),
      chatHistory: resetChatHistory,
      player: resetPlayer,
      world: resetWorld,
      worldStory: adventure.worldStory ? deepClone(adventure.worldStory) : undefined,
      worldStoryMarkers: adventure.worldStoryMarkers ? deepClone(adventure.worldStoryMarkers) : undefined,
      npcs: resetNpcs,
      loreDatabase: resetLoreDatabase,
      inventory: resetInventory,
      structuredInventory: resetStructuredInventory,
      itemInstances: resetItemInstances,
      inventoryEntries: resetInventoryEntries,
      equipmentState: resetEquipmentState,
      storyState: resetStoryState,
      characterKnowledge: resetStoryState.characterKnowledge,
      currentLocation: adventure.initialCurrentLocation ? deepClone(adventure.initialCurrentLocation) : undefined,
      lootSources: resetLootSources,
      worldDrops: resetWorldDrops,
      collectionTasks: resetCollectionTasks,
      activeTimeEvents: resetActiveTimeEvents,
      statusElements: resetStatusElements,
      worldTime: resetWorldTime,

      // Runtime states strictly cleared:
      combatState: undefined,
      encounterForces: [],
      dynamicWorldState: undefined,
      pendingPickup: null,
      pendingTransfer: null,
      emotionState: undefined,
      physicalChangeHistory: [],
      npcAppearanceMemory: {},
      summaryLog: '',
      updatedAt: new Date().toISOString(),
      lastSaved: new Date().toISOString()
    };

    // 10. Synchronisiere strukturiertes Inventar
    resetAdventure = EquipmentConditionService.syncStructuredInventory(resetAdventure);

    return resetAdventure;
  }
}
