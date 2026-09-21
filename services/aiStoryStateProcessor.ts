import {
  Adventure,
  AIEntityDiscovery,
  AILocationChange,
  AIPresenceChange,
  AIKnowledgeUpdate,
  AIStoryEvent,
  AIInventoryChange,
  AIRelationshipChange,
  AIWorldChange,
  AIStoryStateChanges,
  AIServiceResponse,
  ChatMessage,
  CurrentLocationContext,
  LoreEntry,
  NPC,
  StoryEntityItem,
  StoryInfoState,
  WorldSetting
} from '../types';
import { jsonrepair } from 'jsonrepair';
import { LocationContextService } from './locationContextService';
import { CharacterKnowledgeService } from './characterKnowledgeService';

export const STRUCTURED_STORY_STATE_DIRECTIVE = `
### ANWEISUNG FÜR STRUKTURIERTE STORY- UND ZUSTANDS-DATEN:
Zusätzlich zu deiner narrativen Antwort MUSST du am Ende deiner Ausgabe zwingend einen strukturierten JSON-Block im folgenden Format anfügen:

<STORY_STATE_CHANGES>
{
  "discoveredEntities": [
    {
      "type": "character",
      "id": "optional_bestehende_id",
      "name": "Name des Elements",
      "role": "Rolle oder Beruf",
      "description": "Kurze Beschreibung",
      "locationContext": {
        "locationName": "Ort",
        "buildingName": "Gebäude",
        "roomName": "Raum"
      }
    }
  ],
  "locationChange": {
    "locationName": "Aktueller Ort",
    "buildingId": "optional_building_id",
    "buildingName": "Gebäude",
    "roomId": "optional_room_id",
    "roomName": "Raum",
    "territoryName": "Gebiet/Territorium",
    "regionName": "Region"
  },
  "presenceChanges": [
    {
      "characterId": "optional_id",
      "characterName": "Charaktername",
      "state": "scene_participant",
      "locationContext": {
        "locationName": "Ort",
        "buildingName": "Gebäude",
        "roomName": "Raum"
      }
    }
  ],
  "knowledgeUpdates": [
    {
      "subject": "Thema",
      "information": "Die konkret vermittelte Information",
      "source": "Quelle (z.B. Wirt Aldric, Dokument, Beobachtung)",
      "learnedByPlayer": true
    }
  ],
  "events": [
    {
      "title": "Titel des Ereignisses oder der Aufgabe",
      "description": "Beschreibung",
      "type": "situation",
      "isPlayerTask": false
    }
  ],
  "inventoryChanges": [],
  "relationshipChanges": [],
  "worldChanges": []
}
</STORY_STATE_CHANGES>

STRIKTE REGELN FÜR DEN STRUKTURIERTEN ZUSTAND:
1. DISCOVERED ENTITIES: Melde nur wirklich neu eingeführte oder entdeckte Elemente. Wenn ein Charakter oder Ort bereits existiert, nutze seine bestehende ID oder seinen exakten Namen. Erzeuge KEINE Duplikate.
2. LOCATION CHANGE: Gib 'locationChange' NUR an, wenn der Spieler seinen Aufenthaltsort in dieser Aktion physisch verändert hat.
3. PRESENCE & SZENENTEILNAHME:
   - 'mentioned_only': Der Charakter wird bloß im Text oder Gespräch erwähnt. Er ist NICHT anwesend!
   - 'present': Der Charakter befindet sich am Ort, nimmt aber nicht aktiv teil.
   - 'scene_participant': Der Charakter spricht oder agiert DIREKT in der aktuellen Szene.
   - Grundregel: Bekannt ≠ Anwesend ≠ Szenenteilnehmer. Eine reine Erwähnung ist NIEMALS physische Anwesenheit!
4. KNOWLEDGE UPDATES:
   - Weltwissen ≠ Character Knowledge.
   - Wähle 'learnedByPlayer': true NUR dann, wenn die Information dem Spieler in der Szene explizit mitgeteilt wurde.
5. AUFGABEN & EVENTS:
   - Ein Problem in der Welt erzeugt NICHT automatisch eine aktive Spieleraufgabe. Setze 'isPlayerTask': true NUR wenn die Aufgabe dem Spieler plausibel erteilt wurde.
`;

export class AIStoryStateProcessor {
  /**
   * Primary entry point to parse raw AI text containing narrative + optional <STORY_STATE_CHANGES> block.
   */
  public static parseAndProcessAiResponse(
    rawText: string,
    adventure: Adventure,
    worldOverride?: WorldSetting
  ): {
    cleanedNarrativeText: string;
    updatedAdventure: Adventure;
    storyChanges?: AIStoryStateChanges;
    hasStructuredData: boolean;
    notifications: any[];
  } {
    const notifications: any[] = [];
    const extraction = this.extractStoryStateChangesJson(rawText);
    const cleanedNarrativeText = extraction.cleanedNarrativeText;
    const storyChanges = extraction.storyChanges;
    const hasStructuredData = extraction.hasStructuredData;

    let updatedAdventure: Adventure = {
      ...adventure,
      world: worldOverride ? JSON.parse(JSON.stringify(worldOverride)) : (adventure.world ? JSON.parse(JSON.stringify(adventure.world)) : { territories: [], connections: [] }),
      player: {
        ...adventure.player,
        appearance: {
          hairColor: 'Unbekannt',
          eyeColor: 'Unbekannt',
          age: 'Unbekannt',
          build: 'Unbekannt',
          gender: 'Unbekannt',
          ...(adventure.player?.appearance || {})
        },
        campaignPowerLevels: { ...(adventure.player?.campaignPowerLevels || {}) }
      },
      npcs: [...(adventure.npcs || [])],
      loreDatabase: [...(adventure.loreDatabase || [])],
      storyState: adventure.storyState ? {
        ...adventure.storyState,
        storyEntities: [...(adventure.storyState.storyEntities || [])],
        activeGoals: [...(adventure.storyState.activeGoals || [])],
        relationships: [...(adventure.storyState.relationships || [])]
      } : {
        currentLocationName: '',
        currentTerritoryName: '',
        activeSituation: '',
        activeGoals: [],
        relationships: [],
        storyEntities: [],
        lastUpdatedTime: new Date().toISOString()
      }
    };

    if (hasStructuredData && storyChanges) {
      updatedAdventure = this.applyStructuredStateChanges(updatedAdventure, storyChanges, notifications);
    }

    return {
      cleanedNarrativeText,
      updatedAdventure,
      storyChanges,
      hasStructuredData,
      notifications
    };
  }

  /**
   * Validates raw AIStoryStateChanges object from AI response to ensure schema integrity.
   * Invalid sub-blocks or malformed items are safely discarded without breaking valid blocks.
   */
  public static validateStoryStateChanges(raw: any): AIStoryStateChanges {
    if (!raw || typeof raw !== 'object') {
      return {};
    }

    const validated: AIStoryStateChanges = {};

    // 1. Validate discoveredEntities
    if (Array.isArray(raw.discoveredEntities)) {
      validated.discoveredEntities = raw.discoveredEntities.filter((e: any) => {
        if (!e || typeof e !== 'object') return false;
        if (typeof e.name !== 'string' || !e.name.trim()) return false;
        const validTypes = ['character', 'building', 'room', 'location', 'territory', 'item', 'creature', 'organization', 'event'];
        if (typeof e.type !== 'string' || !validTypes.includes(e.type.toLowerCase())) return false;
        return true;
      }).map((e: any) => ({
        type: e.type.toLowerCase() as any,
        id: typeof e.id === 'string' && e.id.trim() ? e.id.trim() : undefined,
        name: String(e.name).trim(),
        role: typeof e.role === 'string' ? e.role : undefined,
        description: typeof e.description === 'string' ? e.description : undefined,
        locationContext: e.locationContext && typeof e.locationContext === 'object' ? {
          locationName: typeof e.locationContext.locationName === 'string' ? e.locationContext.locationName : undefined,
          buildingName: typeof e.locationContext.buildingName === 'string' ? e.locationContext.buildingName : undefined,
          roomName: typeof e.locationContext.roomName === 'string' ? e.locationContext.roomName : undefined
        } : undefined,
        details: e.details && typeof e.details === 'object' ? e.details : undefined
      }));
    }

    // 2. Validate locationChange
    if (raw.locationChange && typeof raw.locationChange === 'object') {
      const lc = raw.locationChange;
      validated.locationChange = {
        locationName: typeof lc.locationName === 'string' ? lc.locationName : undefined,
        buildingId: typeof lc.buildingId === 'string' ? lc.buildingId : undefined,
        buildingName: typeof lc.buildingName === 'string' ? lc.buildingName : undefined,
        roomId: typeof lc.roomId === 'string' ? lc.roomId : undefined,
        roomName: typeof lc.roomName === 'string' ? lc.roomName : undefined,
        territoryName: typeof lc.territoryName === 'string' ? lc.territoryName : undefined,
        regionName: typeof lc.regionName === 'string' ? lc.regionName : undefined
      };
    }

    // 3. Validate presenceChanges
    if (Array.isArray(raw.presenceChanges)) {
      validated.presenceChanges = raw.presenceChanges.filter((p: any) => {
        if (!p || typeof p !== 'object') return false;
        if (typeof p.characterName !== 'string' || !p.characterName.trim()) return false;
        const validStates = ['present', 'scene_participant', 'mentioned_only', 'absent'];
        if (typeof p.state !== 'string' || !validStates.includes(p.state.toLowerCase())) return false;
        return true;
      }).map((p: any) => ({
        characterId: typeof p.characterId === 'string' ? p.characterId : undefined,
        characterName: String(p.characterName).trim(),
        state: p.state.toLowerCase() as any,
        locationContext: p.locationContext && typeof p.locationContext === 'object' ? {
          locationName: typeof p.locationContext.locationName === 'string' ? p.locationContext.locationName : undefined,
          buildingName: typeof p.locationContext.buildingName === 'string' ? p.locationContext.buildingName : undefined,
          roomName: typeof p.locationContext.roomName === 'string' ? p.locationContext.roomName : undefined
        } : undefined
      }));
    }

    // 4. Validate knowledgeUpdates
    if (Array.isArray(raw.knowledgeUpdates)) {
      validated.knowledgeUpdates = raw.knowledgeUpdates.filter((k: any) => {
        if (!k || typeof k !== 'object') return false;
        if (typeof k.information !== 'string' || !k.information.trim()) return false;
        return true;
      }).map((k: any) => ({
        subject: typeof k.subject === 'string' ? k.subject : 'Wissen',
        information: String(k.information).trim(),
        source: typeof k.source === 'string' ? k.source : undefined,
        learnedByPlayer: Boolean(k.learnedByPlayer),
        topic: typeof k.topic === 'string' ? k.topic : undefined
      }));
    }

    // 5. Validate events
    if (Array.isArray(raw.events)) {
      validated.events = raw.events.filter((ev: any) => {
        if (!ev || typeof ev !== 'object') return false;
        if (typeof ev.title !== 'string' || !ev.title.trim()) return false;
        return true;
      }).map((ev: any) => ({
        title: String(ev.title).trim(),
        description: typeof ev.description === 'string' ? ev.description : '',
        type: typeof ev.type === 'string' ? ev.type as any : undefined,
        isPlayerTask: Boolean(ev.isPlayerTask)
      }));
    }

    // 6. Validate relationshipChanges
    if (Array.isArray(raw.relationshipChanges)) {
      validated.relationshipChanges = raw.relationshipChanges.filter((r: any) => {
        if (!r || typeof r !== 'object') return false;
        if (typeof r.characterName !== 'string' || !r.characterName.trim()) return false;
        return true;
      }).map((r: any) => ({
        characterName: String(r.characterName).trim(),
        characterId: typeof r.characterId === 'string' ? r.characterId : undefined,
        changeDescription: typeof r.changeDescription === 'string' ? r.changeDescription : '',
        relationshipLevel: typeof r.relationshipLevel === 'string' ? r.relationshipLevel : undefined
      }));
    }

    // 7. Validate worldChanges
    if (Array.isArray(raw.worldChanges)) {
      validated.worldChanges = raw.worldChanges.filter((w: any) => {
        if (!w || typeof w !== 'object') return false;
        if (typeof w.description !== 'string' || !w.description.trim()) return false;
        return true;
      }).map((w: any) => ({
        description: String(w.description).trim(),
        scope: typeof w.scope === 'string' ? w.scope as any : undefined
      }));
    }

    return validated;
  }

  /**
   * Safely extracts and strips <STORY_STATE_CHANGES> from raw AI text, returning clean narrative text and structured JSON.
   */
  public static extractStoryStateChangesJson(rawText: string): {
    cleanedNarrativeText: string;
    storyChanges?: AIStoryStateChanges;
    hasStructuredData: boolean;
  } {
    if (!rawText) {
      return { cleanedNarrativeText: '', hasStructuredData: false };
    }

    let cleanedNarrativeText = rawText;
    let storyChanges: AIStoryStateChanges | undefined = undefined;
    let hasStructuredData = false;

    // 1. Look for explicit <STORY_STATE_CHANGES>...</STORY_STATE_CHANGES> block
    const blockMatch = rawText.match(/<STORY_STATE_CHANGES>([\s\S]*?)<\/STORY_STATE_CHANGES>/i);
    let jsonString = '';

    if (blockMatch) {
      jsonString = blockMatch[1].trim();
      cleanedNarrativeText = cleanedNarrativeText.replace(blockMatch[0], '');
    } else {
      // Fallback: check if trailing json code block exists at the end of text
      const codeBlockMatch = rawText.match(/```(?:json)?\s*(\{\s*"discoveredEntities"[\s\S]*?\})\s*```/i);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        cleanedNarrativeText = cleanedNarrativeText.replace(codeBlockMatch[0], '');
      }
    }

    // Clean remaining internal tags from narrative text
    cleanedNarrativeText = cleanedNarrativeText
      .replace(/\[\[LORE_ADD:[^\]]+\]\]/gi, '')
      .replace(/\[\[LORE_UPDATE:[^\]]+\]\]/gi, '')
      .replace(/\[\[STATUS:[^\]]+\]\]/gi, '')
      .replace(/\[\[KNOWLEDGE_ADD:[^\]]+\]\]/gi, '')
      .replace(/<STORY_STATE_CHANGES>[\s\S]*?<\/STORY_STATE_CHANGES>/gi, '')
      .trim();

    if (jsonString) {
      try {
        let repaired = jsonString;
        try {
          repaired = jsonrepair(jsonString);
        } catch (_) {}
        const parsed = JSON.parse(repaired);
        if (typeof parsed === 'object' && parsed !== null) {
          const validated = this.validateStoryStateChanges(parsed);
          hasStructuredData = Object.keys(validated).some(k =>
            Array.isArray((validated as any)[k]) ? (validated as any)[k].length > 0 : !!(validated as any)[k]
          );
          if (hasStructuredData) {
            storyChanges = validated;
          }
        }
      } catch (err) {
        console.warn("[AIStoryStateProcessor] Failed to parse structured JSON state:", err);
      }
    }

    return {
      cleanedNarrativeText,
      storyChanges,
      hasStructuredData
    };
  }

  /**
   * Applies validated AIStoryStateChanges to the Adventure state.
   */
  public static applyStructuredStateChanges(
    adventure: Adventure,
    changes: AIStoryStateChanges,
    notifications: any[]
  ): Adventure {
    let state = { ...adventure };

    // 1. Process Discovered Entities
    if (Array.isArray(changes.discoveredEntities) && changes.discoveredEntities.length > 0) {
      state = this.processDiscoveredEntities(state, changes.discoveredEntities, notifications);
    }

    // 2. Process Location Change
    if (changes.locationChange) {
      state = this.processLocationChange(state, changes.locationChange, notifications);
    }

    // 3. Process Presence Changes
    if (Array.isArray(changes.presenceChanges) && changes.presenceChanges.length > 0) {
      state = this.processPresenceChanges(state, changes.presenceChanges);
    }

    // 4. Process Knowledge Updates
    if (Array.isArray(changes.knowledgeUpdates) && changes.knowledgeUpdates.length > 0) {
      state = this.processKnowledgeUpdates(state, changes.knowledgeUpdates);
    }

    // 5. Process Events & Tasks
    if (Array.isArray(changes.events) && changes.events.length > 0) {
      state = this.processEvents(state, changes.events, notifications);
    }

    // 6. Process Relationships
    if (Array.isArray(changes.relationshipChanges) && changes.relationshipChanges.length > 0) {
      state = this.processRelationshipChanges(state, changes.relationshipChanges);
    }

    // 7. Process World Changes
    if (Array.isArray(changes.worldChanges) && changes.worldChanges.length > 0) {
      state = this.processWorldChanges(state, changes.worldChanges);
    }

    return state;
  }

  /**
   * Processes discovered entities (Characters, Locations, Buildings, Rooms, Items, etc.)
   * Enforces strict deduplication: Stable ID first -> Exact Name -> Controlled Normalization.
   * New entities are added as temporary Story Entities (Story-Info), NOT directly promoted to Codex without review.
   */
  private static processDiscoveredEntities(
    adventure: Adventure,
    entities: AIEntityDiscovery[],
    notifications: any[] = []
  ): Adventure {
    const updatedNpcs = [...(adventure.npcs || [])];
    const loreDb = [...(adventure.loreDatabase || [])];
    const storyEntities = [...(adventure.storyState?.storyEntities || [])];
    const playerName = (adventure.player?.name || 'Spieler').trim().toLowerCase();

    entities.forEach(discovery => {
      if (!discovery || !discovery.name) return;
      const cleanName = discovery.name.trim();
      if (!cleanName || cleanName.toLowerCase() === playerName) return;

      // Deduplication check across NPCs, Lore, and Story Entities
      const existingNpc = LocationContextService.resolveCharacter(updatedNpcs, {
        id: discovery.id,
        name: cleanName
      });

      const existingLore = loreDb.find(l =>
        (discovery.id && l.id === discovery.id) ||
        l.title.trim().toLowerCase() === cleanName.toLowerCase()
      );

      const existingStoryEnt = storyEntities.find(e =>
        (discovery.id && e.id === discovery.id) ||
        e.title.trim().toLowerCase() === cleanName.toLowerCase()
      );

      // If entity already exists, do NOT create a duplicate
      if (existingNpc || existingLore || existingStoryEnt) {
        // Update situation or role if provided, but keep existing ID
        if (existingNpc && discovery.description) {
          existingNpc.currentSituation = discovery.description;
        }
        return;
      }

      // Entity is truly new -> Create temporary Story Entity
      const categoryMap: Record<string, StoryEntityItem['category']> = {
        character: 'Charaktere',
        creature: 'Gegner',
        building: 'Gebäude',
        room: 'Räume',
        location: 'Orte',
        territory: 'Weltkarte',
        item: 'Gegenstände',
        organization: 'Fraktionen',
        event: 'Story & Quests'
      };

      const category = categoryMap[discovery.type] || 'Story & Quests';
      const entityId = discovery.id || `story-ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newStoryEntity: StoryEntityItem = {
        id: entityId,
        category,
        title: cleanName,
        description: discovery.description || `Entdecktes Element (${cleanName}).`,
        details: {
          role: discovery.role,
          locationContext: discovery.locationContext,
          ...(discovery.details || {})
        },
        createdAt: new Date().toISOString(),
        isNewInStory: true,
        promotedToCodex: false
      };

      storyEntities.push(newStoryEntity);

      // If character or creature, add to dynamic NPCs list with resolved locationContext and presenceState
      if (discovery.type === 'character' || discovery.type === 'creature') {
        const currentLoc = LocationContextService.resolveCurrentLocation(adventure);
        const holdings = adventure.world?.economyConfig?.holdings || [];

        let initialLocContext: CurrentLocationContext = currentLoc;
        if (discovery.locationContext && (discovery.locationContext.locationName || discovery.locationContext.buildingName || discovery.locationContext.roomName)) {
          const matchedBuilding = discovery.locationContext.buildingName
            ? LocationContextService.resolveBuilding(holdings, discovery.locationContext.buildingName, discovery.locationContext.locationName || currentLoc.locationName)
            : undefined;
          const matchedRoom = LocationContextService.resolveRoom(matchedBuilding, discovery.locationContext.roomName);

          initialLocContext = {
            locationName: discovery.locationContext.locationName || currentLoc.locationName,
            buildingId: matchedBuilding?.id,
            buildingName: matchedBuilding?.name || discovery.locationContext.buildingName,
            roomId: matchedRoom.roomId,
            roomName: matchedRoom.roomName,
            territoryName: currentLoc.territoryName,
            regionName: currentLoc.regionName
          };
        }

        updatedNpcs.push({
          id: entityId,
          name: cleanName,
          role: discovery.role || (discovery.type === 'creature' ? 'Gegner' : 'Bewohner'),
          bio: discovery.description || 'In der Geschichte anwesender Charakter.',
          personality: 'Unbekannt',
          relationship: 'Neu entdeckt',
          conduct: 'Neutral',
          currentSituation: 'Neu entdeckt',
          currentLocationContext: initialLocContext,
          presenceState: {
            state: 'present',
            locationContext: initialLocContext,
            updatedAt: new Date().toISOString()
          },
          appearance: {
            hairColor: 'Unbekannt',
            eyeColor: 'Unbekannt',
            age: 'Unbekannt',
            build: 'Unbekannt',
            gender: 'Unbekannt'
          },
          campaignPowerLevels: {},
          attributes: [],
          isHostile: discovery.type === 'creature'
        });
      }

      notifications.push({
        id: Math.random().toString(),
        type: 'add',
        title: `${cleanName} (${category})`,
        category: 'Story-Info'
      });
    });

    return {
      ...adventure,
      npcs: updatedNpcs,
      storyState: {
        ...adventure.storyState,
        storyEntities,
        lastUpdatedTime: new Date().toISOString()
      } as StoryInfoState
    };
  }

  /**
   * Processes structured Location Change.
   * Hierarchical priority: Room > Building > Location > Territory > Region.
   * Updates Adventure.currentLocation canonical context.
   * Does NOT alter global world currentLocationId or overwrite world settings.
   */
  private static processLocationChange(
    adventure: Adventure,
    locChange: AILocationChange,
    notifications: any[]
  ): Adventure {
    const existingContext = LocationContextService.resolveCurrentLocation(adventure);

    const newContext: CurrentLocationContext = {
      locationName: locChange.locationName || existingContext.locationName,
      buildingId: locChange.buildingId || existingContext.buildingId,
      buildingName: locChange.buildingName || existingContext.buildingName,
      roomId: locChange.roomId || existingContext.roomId,
      roomName: locChange.roomName || existingContext.roomName,
      territoryName: locChange.territoryName || existingContext.territoryName,
      regionName: locChange.regionName || existingContext.regionName
    };

    const updatedAdventure = LocationContextService.updateCurrentLocation(adventure, newContext);

    const locLabel = newContext.roomName
      ? `${newContext.roomName} (${newContext.buildingName || newContext.locationName})`
      : (newContext.buildingName || newContext.locationName);

    notifications.push({
      id: Math.random().toString(),
      type: 'update',
      title: `Standort: ${locLabel}`,
      category: 'Weltkarte'
    });

    return updatedAdventure;
  }

  /**
   * Processes structured Presence Changes.
   * Enforces rule: Known ≠ Present ≠ Scene Participant ≠ Combat Participant.
   * 'mentioned_only' does NOT grant physical presence or scene participation.
   */
  private static processPresenceChanges(
    adventure: Adventure,
    presenceChanges: AIPresenceChange[]
  ): Adventure {
    const npcs = [...(adventure.npcs || [])];
    const currentLoc = LocationContextService.resolveCurrentLocation(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];

    presenceChanges.forEach(p => {
      if (!p || (!p.characterName && !p.characterId)) return;

      const npc = LocationContextService.resolveCharacter(npcs, {
        id: p.characterId,
        name: p.characterName
      });

      if (npc) {
        const now = new Date().toISOString();

        if (p.state === 'mentioned_only') {
          // Mentioned only: record mention timestamp & situation without wiping physical location or setting absent
          npc.lastMentionedAt = now;
          npc.currentSituation = 'In Gedanken/Gesprächen erwähnt';
          if (npc.presenceState?.state === 'scene_participant') {
            npc.presenceState = {
              state: 'present',
              locationContext: npc.presenceState.locationContext || npc.currentLocationContext,
              updatedAt: now
            };
          }
        } else if (p.state === 'absent') {
          npc.presenceState = {
            state: 'absent',
            locationContext: npc.presenceState?.locationContext || npc.currentLocationContext,
            updatedAt: now
          };
          npc.currentSituation = 'Abwesend';
        } else if (p.state === 'present' || p.state === 'scene_participant') {
          let targetLoc: CurrentLocationContext = currentLoc;
          if (p.locationContext && (p.locationContext.locationName || p.locationContext.buildingName || p.locationContext.roomName)) {
            const matchedBuilding = p.locationContext.buildingName
              ? LocationContextService.resolveBuilding(holdings, p.locationContext.buildingName, p.locationContext.locationName || currentLoc.locationName)
              : undefined;
            const matchedRoom = LocationContextService.resolveRoom(matchedBuilding, p.locationContext.roomName);

            targetLoc = {
              locationName: p.locationContext.locationName || currentLoc.locationName,
              buildingId: matchedBuilding?.id,
              buildingName: matchedBuilding?.name || p.locationContext.buildingName,
              roomId: matchedRoom.roomId,
              roomName: matchedRoom.roomName,
              territoryName: currentLoc.territoryName,
              regionName: currentLoc.regionName,
              sceneId: currentLoc.sceneId
            };
          }

          npc.presenceState = {
            state: p.state,
            sceneId: currentLoc.sceneId,
            locationContext: targetLoc,
            updatedAt: now
          };
          npc.currentLocationContext = targetLoc;
          npc.currentSituation = p.state === 'scene_participant' ? 'Nimmt aktiv an der Szene teil' : 'Am Ort anwesend';
        }
      }
    });

    return {
      ...adventure,
      npcs
    };
  }

  /**
   * Processes structured Knowledge Updates.
   * Enforces rule: World State ≠ Character Knowledge ≠ HUD.
   * Only facts with learnedByPlayer === true are added to CharacterKnowledge for the player.
   */
  private static processKnowledgeUpdates(
    adventure: Adventure,
    updates: AIKnowledgeUpdate[]
  ): Adventure {
    let state = { ...adventure };

    updates.forEach(u => {
      if (!u || !u.information) return;
      if (u.learnedByPlayer) {
        state = CharacterKnowledgeService.addKnowledgeEntry(state, {
          category: 'lore',
          entityId: `knowledge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          entityName: u.subject || 'Weltwissen',
          summary: u.information,
          description: u.information,
          sourceType: 'conversation',
          sourceCharacterName: u.source || 'Beobachtung / Gespräch'
        });
      }
    });

    return state;
  }

  /**
   * Processes Events & Tasks.
   * Problems in the world do NOT automatically become assigned player tasks.
   * Only entries with isPlayerTask === true are added to active goals.
   */
  private static processEvents(
    adventure: Adventure,
    events: AIStoryEvent[],
    notifications: any[]
  ): Adventure {
    const storyState = adventure.storyState ? {
      ...adventure.storyState,
      activeGoals: [...(adventure.storyState.activeGoals || [])]
    } : {
      currentLocationName: '',
      currentTerritoryName: '',
      activeSituation: '',
      activeGoals: [],
      relationships: [],
      storyEntities: [],
      lastUpdatedTime: new Date().toISOString()
    };

    events.forEach(e => {
      if (!e || !e.title) return;
      if (e.isPlayerTask && e.title) {
        const goalExists = storyState.activeGoals.some(g => g.toLowerCase() === e.title.toLowerCase());
        if (!goalExists) {
          storyState.activeGoals.push(e.title);
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `Aufgabe: ${e.title}`,
            category: 'Story & Quests'
          });
        }
      } else if (e.description && !storyState.activeSituation) {
        storyState.activeSituation = e.description;
      }
    });

    return {
      ...adventure,
      storyState: storyState as StoryInfoState
    };
  }

  /**
   * Processes Relationship changes.
   */
  private static processRelationshipChanges(
    adventure: Adventure,
    relChanges: AIRelationshipChange[]
  ): Adventure {
    const storyState = adventure.storyState ? {
      ...adventure.storyState,
      relationships: [...(adventure.storyState.relationships || [])]
    } : {
      currentLocationName: '',
      currentTerritoryName: '',
      activeSituation: '',
      activeGoals: [],
      relationships: [],
      storyEntities: [],
      lastUpdatedTime: new Date().toISOString()
    };

    const playerName = (adventure.player?.name || 'Spieler').trim();

    relChanges.forEach(r => {
      if (!r || !r.characterName) return;
      const cleanName = r.characterName.trim();
      const existingRel = storyState.relationships.find(rel =>
        rel.fromName.toLowerCase() === cleanName.toLowerCase() ||
        rel.toName.toLowerCase() === cleanName.toLowerCase()
      );

      if (existingRel) {
        existingRel.description = r.changeDescription;
        if (r.relationshipLevel) existingRel.relationType = r.relationshipLevel;
      } else {
        storyState.relationships.push({
          fromName: cleanName,
          toName: playerName,
          relationType: r.relationshipLevel || 'Begegnung',
          description: r.changeDescription
        });
      }
    });

    return {
      ...adventure,
      storyState: storyState as StoryInfoState
    };
  }

  /**
   * Processes World Changes.
   */
  private static processWorldChanges(
    adventure: Adventure,
    worldChanges: AIWorldChange[]
  ): Adventure {
    // World changes record high-level events into situation or story state
    if (worldChanges.length === 0) return adventure;
    const latestChange = worldChanges[worldChanges.length - 1];
    if (latestChange && latestChange.description && adventure.storyState) {
      return {
        ...adventure,
        storyState: {
          ...adventure.storyState,
          activeSituation: latestChange.description
        }
      };
    }
    return adventure;
  }
}
