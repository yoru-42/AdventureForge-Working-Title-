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

    // CampaignPowerLevels: Aktuelle Editor-Werte als Basis behalten (Wert, Potential, Maximum, etc.), nur Runtime-XP leeren
    if (resetPlayer.campaignPowerLevels) {
      const updatedLevels = { ...resetPlayer.campaignPowerLevels };
      Object.keys(updatedLevels).forEach(key => {
        const currentParam = resetPlayer.campaignPowerLevels![key];
        updatedLevels[key] = {
          ...currentParam,
          // Der definierte Editor-Basiswert und alle Parametergrenzen bleiben erhalten
          value: currentParam.value,
          xp: 0
        };
      });
      resetPlayer.campaignPowerLevels = updatedLevels;
    }

    // Attribute: Aktuelle Editor-Attribute aus adventure.player.attributes bleiben erhalten
    if (resetPlayer.attributes) {
      resetPlayer.attributes = deepClone(resetPlayer.attributes);
    }

    // Runtime-Fortschritt (Level, XP, Rang) zurücksetzen
    resetPlayer.level = 1;
    resetPlayer.xp = 0;
    resetPlayer.experience = 0;
    resetPlayer.experiencePoints = 0;
    resetPlayer.rank = 'F';

    // Temporäre Runtime-Zustände leeren
    resetPlayer.physicalChangeHistory = [];
    resetPlayer.emotionState = undefined;
    resetPlayer.temporaryConditions = [];
    (resetPlayer as any).combatState = undefined;

    // Aktive Transformation auf Standard/Start zurücksetzen
    if (resetPlayer.appearance) {
      const startTransId = 'standard';
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
      if (resetPlayer.appearance.chibiForm) {
        resetPlayer.appearance.chibiForm = {
          ...resetPlayer.appearance.chibiForm,
          enabled: false
        };
      }
    }

    // Conditions: dauerhafte Editor-Bedingungen bleiben erhalten, temporäre und Transformations-Bedingungen entfernen
    const baseConditions = resetPlayer.activeConditions || [];
    resetPlayer.activeConditions = baseConditions.filter(
      c => !c.id?.startsWith('temp-') && c.duration !== 'Temporär' && (c as any).type !== 'transformation'
    );
    if (resetPlayer.conditions) {
      resetPlayer.conditions = resetPlayer.conditions.filter(
        c => !c.id?.startsWith('temp-') && c.duration !== 'Temporär' && (c as any).type !== 'transformation'
      );
    }

    // 2. Kanonische Welt behalten, nur Runtime-Felder zurücksetzen
    let resetWorld: WorldSetting = deepClone(adventure.world || { territories: [], connections: [] } as WorldSetting);
    resetWorld.dynamicWorldState = undefined;
    resetWorld.encounterForces = undefined;

    const startLocationId = resetWorld.startLocationId || adventure.world?.startLocationId || resetWorld.currentLocationId || '';
    resetWorld.currentLocationId = startLocationId;

    // Startort anhand seiner ID in den vorhandenen Datenstrukturen der Welt auflösen (Location-ID vs. Name trennen)
    let startLocationName = resetWorld.startLocationName || adventure.world?.startLocationName || '';
    let startTerritoryName = '';
    let startTerritoryId: string | undefined = undefined;

    // 2.1 Suche in resetWorld.locations (WorldLocationReference[])
    if (startLocationId && resetWorld.locations) {
      const locRef = resetWorld.locations.find(l => l.id === startLocationId);
      if (locRef) {
        if (!startLocationName) startLocationName = locRef.name;
        if (locRef.territoryId) {
          startTerritoryId = locRef.territoryId;
          const terr = resetWorld.territories?.find(t => t.id === locRef.territoryId);
          if (terr) {
            startTerritoryName = terr.name;
          }
        }
      }
    }

    // 2.2 Suche in resetWorld.territories (Territory[])
    if (startLocationId && resetWorld.territories) {
      const terrMatch = resetWorld.territories.find(t => t.id === startLocationId);
      if (terrMatch) {
        if (!startLocationName) startLocationName = terrMatch.name;
        if (terrMatch.parentId) {
          const parentTerr = resetWorld.territories.find(t => t.id === terrMatch.parentId);
          if (parentTerr) {
            startTerritoryId = parentTerr.id;
            startTerritoryName = parentTerr.name;
          }
        } else {
          startTerritoryId = terrMatch.id;
          if (!startTerritoryName && (terrMatch.type === 'region' || terrMatch.type === 'land' || terrMatch.type === 'koenigreich')) {
            startTerritoryName = terrMatch.name;
          }
        }
      }
    }

    // 2.3 Suche in resetWorld.placeMarkers (falls vorhanden)
    if (startLocationId && !startLocationName && (resetWorld as any).placeMarkers) {
      const marker = (resetWorld as any).placeMarkers.find((p: any) => p.id === startLocationId);
      if (marker) {
        startLocationName = marker.name;
      }
    }

    // 2.4 Falls startTerritoryId gesetzt ist, aber der Name noch fehlt, aus territories ermitteln
    if (startTerritoryId && !startTerritoryName && resetWorld.territories) {
      const terr = resetWorld.territories.find(t => t.id === startTerritoryId);
      if (terr) {
        startTerritoryName = terr.name;
      }
    }

    // 2.5 Fallback: Falls kein Name gefunden wurde, aber storyState einen echten (nicht-ID) Namen hatte
    if (!startLocationName && adventure.storyState?.currentLocationName && adventure.storyState.currentLocationName !== startLocationId) {
      startLocationName = adventure.storyState.currentLocationName;
    }
    if (!startTerritoryName && adventure.storyState?.currentTerritoryName) {
      startTerritoryName = adventure.storyState.currentTerritoryName;
    }

    resetWorld.currentTerritoryId = startTerritoryId;

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
    // Regel: Aktueller Itembestand aus dem Editor bleibt erhalten.
    // Nur echte Runtime-Loot-Items (dyn-..., loot-..., runtime-...) werden entfernt.
    const isRuntimeLootItem = (item: ItemInstance): boolean => {
      if (!item || !item.id) return false;
      const idLower = item.id.toLowerCase();
      return idLower.startsWith('dyn-') || idLower.startsWith('loot-') || idLower.startsWith('runtime-');
    };

    const resetItemInstances: ItemInstance[] = deepClone(adventure.itemInstances || [])
      .filter(i => !isRuntimeLootItem(i));
    const validItemInstanceIds = new Set(resetItemInstances.map(i => i.id));

    // InventoryEntries: Nur behalten, wenn nicht dyn-/loot- und falls an ItemInstance gebunden, diese noch existiert
    const resetInventoryEntries: InventoryEntry[] | undefined = adventure.inventoryEntries
      ? deepClone(adventure.inventoryEntries).filter(entry => {
          if (entry.id?.toLowerCase().startsWith('dyn-') || entry.id?.toLowerCase().startsWith('loot-')) {
            return false;
          }
          if (entry.itemInstanceId && !validItemInstanceIds.has(entry.itemInstanceId)) {
            return false;
          }
          return true;
        })
      : undefined;

    // EquipmentState: Aktuelle Editor-Ausrüstung behalten, nur gelöschte Runtime-Loot-Referenzen entfernen
    const resetEquipmentState: EquipmentState[] = deepClone(adventure.equipmentState || [])
      .filter(eq => {
        if (eq.itemInstanceId && !validItemInstanceIds.has(eq.itemInstanceId)) {
          return false;
        }
        if (eq.itemInstanceId?.toLowerCase().startsWith('dyn-') || eq.itemInstanceId?.toLowerCase().startsWith('loot-')) {
          return false;
        }
        return true;
      });

    // Inventar: Aktuellen Bestand behalten, außer eindeutig als Runtime-Loot markierte Einträge
    const resetInventory: string[] = deepClone(adventure.inventory || []).filter(itemStr => {
      if (!itemStr) return false;
      const lower = itemStr.toLowerCase();
      if (lower.startsWith('dyn-') || lower.startsWith('loot-')) {
        return false;
      }
      return true;
    });

    // StructuredInventory: Aktuellen Stand behalten, nur gelöschte Runtime-Loot-Referenzen entfernen
    let resetStructuredInventory: StructuredInventory | undefined = adventure.structuredInventory
      ? deepClone(adventure.structuredInventory)
      : undefined;

    if (resetStructuredInventory) {
      if (resetStructuredInventory.weapons) {
        resetStructuredInventory.weapons = resetStructuredInventory.weapons.filter(
          w => !w.toLowerCase().startsWith('dyn-') && !w.toLowerCase().startsWith('loot-')
        );
      }
      if (resetStructuredInventory.armor) {
        const armor = resetStructuredInventory.armor;
        (['head', 'chest', 'hands', 'legs', 'feet'] as const).forEach(slot => {
          const val = armor[slot];
          if (val && (val.toLowerCase().startsWith('dyn-') || val.toLowerCase().startsWith('loot-'))) {
            delete armor[slot];
          }
        });
      }
      if (resetStructuredInventory.customItems) {
        resetStructuredInventory.customItems = resetStructuredInventory.customItems.filter(
          c => !c.id?.toLowerCase().startsWith('dyn-') && !c.id?.toLowerCase().startsWith('loot-')
        );
      }
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
      currentLocationName: startLocationName,
      currentTerritoryName: startTerritoryName,
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
      currentLocation: {
        ...(adventure.initialCurrentLocation ? deepClone(adventure.initialCurrentLocation) : {}),
        locationId: startLocationId || undefined,
        locationName: startLocationName || undefined,
        territoryId: startTerritoryId || undefined,
        territoryName: startTerritoryName || undefined,
        worldName: resetWorld.title || undefined
      },
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
