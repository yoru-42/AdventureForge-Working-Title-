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
   * Resets an active adventure back to its initial starting state.
   * Discards all runtime alterations, dynamic additions, active proposals, tasks, and combat states.
   * Preserves permanent definitions, codex entries, and initial configuration snapshots.
   */
  public static resetAdventureToInitialState(adventure: Adventure): Adventure {
    if (!adventure) return adventure;

    // 1. Restore Player to Initial Snapshot (or safe baseline reconstruction for legacy adventures)
    let resetPlayer: Character;
    let isLegacyReconstructed = false;

    if (adventure.initialPlayer) {
      resetPlayer = deepClone(adventure.initialPlayer);
    } else {
      // Legacy fallback: reconstruct player baseline by resetting power levels to configured minimums
      isLegacyReconstructed = true;
      resetPlayer = deepClone(adventure.player) || {} as Character;
      if (resetPlayer.campaignPowerLevels) {
        const updatedLevels = { ...resetPlayer.campaignPowerLevels };
        Object.keys(updatedLevels).forEach(key => {
          const setting = adventure.world?.campaignPowerSettings?.[key];
          const minVal = typeof setting === 'number' ? setting : (setting?.min ?? 10);
          updatedLevels[key] = {
            ...updatedLevels[key],
            value: minVal,
            xp: 0
          };
        });
        resetPlayer.campaignPowerLevels = updatedLevels;
      }
    }

    // Clean dynamic runtime states from player
    resetPlayer.physicalChangeHistory = [];
    resetPlayer.emotionState = undefined;
    resetPlayer.temporaryConditions = [];
    if (adventure.initialPlayer?.conditions) {
      resetPlayer.conditions = deepClone(adventure.initialPlayer.conditions);
    }
    if (adventure.initialPlayer?.activeConditions) {
      resetPlayer.activeConditions = deepClone(adventure.initialPlayer.activeConditions);
    } else {
      resetPlayer.activeConditions = [];
    }

    // 2. Restore World to Initial Snapshot
    let resetWorld: WorldSetting;
    if (adventure.initialWorld) {
      resetWorld = deepClone(adventure.initialWorld);
    } else {
      resetWorld = deepClone(adventure.world) || { territories: [], connections: [] } as WorldSetting;
    }
    resetWorld.dynamicWorldState = undefined;
    resetWorld.encounterForces = undefined;
    resetWorld.currentLocationId = resetWorld.startLocationId || adventure.world?.startLocationId || resetWorld.currentLocationId;
    resetWorld.currentTerritoryId = undefined;

    // 3. Restore NPCs to Initial Snapshot (filter out dynamically created NPCs)
    let resetNpcs: NPC[];
    if (adventure.initialNpcs) {
      resetNpcs = deepClone(adventure.initialNpcs);
    } else {
      resetNpcs = (adventure.npcs || [])
        .filter((n: NPC) => !n.id?.startsWith('dyn-'))
        .map(n => deepClone(n));
    }

    // 4. Restore Lore / Codex (Preserve user-saved Codex entries, remove dynamic ones, reset event steps to pending)
    let resetLoreDatabase: LoreEntry[];
    if (adventure.initialLoreDatabase) {
      resetLoreDatabase = deepClone(adventure.initialLoreDatabase);
    } else {
      resetLoreDatabase = (adventure.loreDatabase || [])
        .filter((e: LoreEntry) => !e.id?.startsWith('dyn-'))
        .map((e: LoreEntry) => {
          const clone = deepClone(e);
          if (clone.details?.eventSteps) {
            clone.details.eventSteps = clone.details.eventSteps.map((s: any) => ({
              ...s,
              status: 'pending'
            }));
          }
          return clone;
        });
    }

    // 5. Restore Canonical Item Instances, Inventory Entries & Equipment State
    let resetItemInstances: ItemInstance[];
    if (adventure.initialItemInstances) {
      resetItemInstances = deepClone(adventure.initialItemInstances);
    } else if (adventure.itemInstances) {
      // Fallback: keep non-dynamic item instances whose owner is player or initial NPCs
      const validOwnerIds = new Set(['player', ...resetNpcs.map(n => n.id), ...resetNpcs.map(n => n.name)]);
      resetItemInstances = adventure.itemInstances
        .filter(i => !i.id?.startsWith('dyn-item-') && validOwnerIds.has(i.owner))
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
      resetEquipmentState = [];
    }

    // 6. Restore Legacy and Structured Inventories
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

    // 7. Reset Story State (Story-Info, Discovered Entities, First-Message Marker & Fingerprint)
    let resetStoryState: StoryInfoState;
    if (adventure.initialStoryState) {
      resetStoryState = deepClone(adventure.initialStoryState);
    } else {
      resetStoryState = {
        currentLocationName: resetWorld.startLocationId || '',
        currentTerritoryName: '',
        activeSituation: '',
        activeGoals: [],
        relationships: [],
        storyEntities: [],
        lastUpdatedTime: new Date().toISOString()
      };
    }
    // CRITICAL: Clear processedFirstMessage & fingerprint so prologue / firstMessage can be reprocessed
    resetStoryState.processedFirstMessage = false;
    resetStoryState.processedFirstMessageFingerprint = '';

    // 8. Restore / Reset Character Knowledge
    let resetCharacterKnowledge: any;
    if (adventure.initialCharacterKnowledge) {
      resetCharacterKnowledge = deepClone(adventure.initialCharacterKnowledge);
    } else {
      resetCharacterKnowledge = {};
    }

    // 9. Reset Loot, Drops & Collection Tasks (CollectionTasks are strictly runtime and always reset to [])
    const resetLootSources = adventure.initialLootSources 
      ? deepClone(adventure.initialLootSources) 
      : [];
    const resetWorldDrops = adventure.initialWorldDrops 
      ? deepClone(adventure.initialWorldDrops) 
      : [];
    const resetCollectionTasks: CollectionTask[] = [];

    // 10. Restore Status Elements & World Time
    const resetStatusElements = adventure.initialStatusElements
      ? deepClone(adventure.initialStatusElements)
      : (adventure.statusElements || []).map(el => {
          if (el.label === 'Zeit') return { ...el, value: '08:00' };
          if (el.label === 'Ausdauer') return { ...el, value: '100%' };
          return deepClone(el);
        });

    const resetWorldTime: WorldTime = adventure.initialWorldTime
      ? deepClone(adventure.initialWorldTime)
      : { day: 1, hour: 8, minute: 0 };

    const resetActiveTimeEvents = adventure.initialActiveTimeEvents
      ? deepClone(adventure.initialActiveTimeEvents)
      : [];
    if (resetWorld) {
      resetWorld.activeTimeEvents = resetActiveTimeEvents;
    }

    // 11. Reset Chat History to Baseline Messages
    const resetMsgs: ChatMessage[] = [
      {
        id: 'prologue-msg',
        role: 'model',
        text: adventure.prologue || 'Die Reise beginnt...'
      }
    ];
    if (adventure.firstMessage) {
      resetMsgs.push({
        id: 'first-msg',
        role: 'model',
        text: adventure.firstMessage
      });
    }

    // 12. Assemble the Completely Reset Adventure Object
    let resetAdventure: Adventure = {
      ...adventure,
      chatHistory: resetMsgs,
      player: resetPlayer,
      world: resetWorld,
      npcs: resetNpcs,
      loreDatabase: resetLoreDatabase,
      inventory: resetInventory,
      structuredInventory: resetStructuredInventory,
      itemInstances: resetItemInstances,
      inventoryEntries: resetInventoryEntries,
      equipmentState: resetEquipmentState,
      storyState: resetStoryState,
      characterKnowledge: resetCharacterKnowledge,
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

    // 13. Synchronize canonical structured inventory from reset itemInstances & equipmentState
    resetAdventure = EquipmentConditionService.syncStructuredInventory(resetAdventure);

    return resetAdventure;
  }
}
