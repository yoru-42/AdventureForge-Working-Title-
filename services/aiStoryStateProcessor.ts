import {
  Adventure,
  AIEntityDiscovery,
  AILocationChange,
  AIPresenceChange,
  AIKnowledgeUpdate,
  AIStoryEvent,
  AIInventoryChange,
  AIBodyConditionChange,
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
import { EquipmentConditionService } from './equipmentConditionService';

export interface EnsureStoryEntityOptions {
  id?: string;
  category: StoryEntityItem['category'];
  title: string;
  description?: string;
  details?: Record<string, any>;
  createdAt?: string;
  isNewInStory?: boolean;
  promotedToCodex?: boolean;
}

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
  "bodyConditionChanges": [],
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
6. INVENTAR, AUSRÜSTUNG & KÖRPERLICHE ZUSTÄNDE:
   - Wenn Charaktere gefesselt, gebunden, verletzt oder ausgerüstet werden, nutze 'inventoryChanges' (mit action 'attach', 'detach', 'equip', 'unequip', 'added', 'removed') oder 'bodyConditionChanges' (mit action 'added', 'removed', 'updated').
   - WICHTIG: 'Nicht erwähnt bedeutet nicht entfernt!' Aktive Fesseln, Ausrüstungen und körperliche Zustände bleiben dauerhaft bestehen, bis sie explizit mit 'detach', 'unequip' oder 'removed' beendet werden.
`;

export class AIStoryStateProcessor {
  /**
   * Completely strips out any <STORY_STATE_CHANGES>, [[STORY_STATE_CHANGES]], [STORY_STATE_CHANGES]
   * tags and their associated JSON payloads or leftover tags from display text.
   */
  public static stripStoryStateMarkup(rawText: string | undefined): string {
    if (!rawText) return '';
    let cleaned = rawText;

    // 1. Remove closed or open tag blocks containing STORY_STATE_CHANGES
    cleaned = cleaned.replace(/(?:<|\[\[?)STORY_STATE_CHANGES(?:>|\]\]?)[\s\S]*?(?:(?:<|\[\[?)\/STORY_STATE_CHANGES(?:>|\]\]?)|$)/gi, '');

    // 2. Remove standalone tags like [[STORY_STATE_CHANGES]], <STORY_STATE_CHANGES>, [STORY_STATE_CHANGES], STORY_STATE_CHANGES:
    cleaned = cleaned.replace(/(?:<|\[\[?)STORY_STATE_CHANGES(?:>|\]\]?):?/gi, '');

    // 3. Remove JSON markdown blocks containing story state keys
    cleaned = cleaned.replace(/```(?:json[^\n]*)?\s*\{[\s\S]*?(?:discoveredEntities|locationChange|presenceChanges|events|inventoryChanges|knowledgeUpdates|bodyConditionChanges)[\s\S]*?\}\s*```/gi, '');

    // 4. Remove standalone JSON objects containing story state keys
    cleaned = cleaned.replace(/\{[\s\S]*?"(?:discoveredEntities|locationChange|presenceChanges|events|inventoryChanges|knowledgeUpdates|bodyConditionChanges)"[\s\S]*?\}/gi, '');

    // 5. Clean remaining internal brackets / system tags
    cleaned = cleaned
      .replace(/\[\[LORE_ADD:[^\]]+\]\]/gi, '')
      .replace(/\[\[LORE_UPDATE:[^\]]+\]\]/gi, '')
      .replace(/\[\[STATUS:[^\]]+\]\]/gi, '')
      .replace(/\[\[KNOWLEDGE_ADD:[^\]]+\]\]/gi, '')
      .replace(/\[\[INVENTORY_SET:[^\]]+\]\]/gi, '')
      .replace(/\[\[EVENT_STEP_SET:[^\]]+\]\]/gi, '')
      .replace(/\[\[TERRITORY_ADD:[^\]]+\]\]/gi, '')
      .replace(/\[\[LORE_UNLOCK:[^\]]+\]\]/gi, '');

    return cleaned.trim();
  }

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
        const name = e.name || e.title;
        if (typeof name !== 'string' || !name.trim()) return false;
        return true;
      }).map((e: any) => {
        const rawType = String(e.type || e.category || 'lore').toLowerCase();
        let normType: any = 'event';
        if (rawType.includes('char') || rawType.includes('person') || rawType.includes('npc')) normType = 'character';
        else if (rawType.includes('gegner') || rawType.includes('feind') || rawType.includes('monster') || rawType.includes('creature') || rawType.includes('enemy')) normType = 'creature';
        else if (rawType.includes('gebäud') || rawType.includes('building')) normType = 'building';
        else if (rawType.includes('raum') || rawType.includes('räume') || rawType.includes('room')) normType = 'room';
        else if (rawType.includes('ort') || rawType.includes('location')) normType = 'location';
        else if (rawType.includes('territor') || rawType.includes('weltkarte')) normType = 'territory';
        else if (rawType.includes('gegen') || rawType.includes('item') || rawType.includes('waff')) normType = 'item';
        else if (rawType.includes('frakt') || rawType.includes('org') || rawType.includes('gild')) normType = 'organization';
        else if (rawType.includes('event') || rawType.includes('quest') || rawType.includes('ereignis')) normType = 'event';

        return {
          type: normType,
          id: typeof e.id === 'string' && e.id.trim() ? e.id.trim() : undefined,
          name: String(e.name || e.title).trim(),
          role: typeof e.role === 'string' ? e.role : undefined,
          description: typeof e.description === 'string' ? e.description : undefined,
          locationContext: e.locationContext && typeof e.locationContext === 'object' ? {
            locationName: typeof e.locationContext.locationName === 'string' ? e.locationContext.locationName : undefined,
            buildingName: typeof e.locationContext.buildingName === 'string' ? e.locationContext.buildingName : undefined,
            roomName: typeof e.locationContext.roomName === 'string' ? e.locationContext.roomName : undefined
          } : undefined,
          details: e.details && typeof e.details === 'object' ? e.details : undefined
        };
      });
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

    // 6. Validate inventoryChanges
    if (Array.isArray(raw.inventoryChanges)) {
      const allowedActions = ['added', 'removed', 'updated', 'equip', 'unequip', 'attach', 'detach', 'transfer'];
      validated.inventoryChanges = raw.inventoryChanges.filter((inv: any) => {
        if (!inv || typeof inv !== 'object') return false;
        if (typeof inv.item !== 'string' || !inv.item.trim()) return false;
        return true;
      }).map((inv: any) => ({
        item: String(inv.item).trim(),
        action: allowedActions.includes(inv.action) ? inv.action : 'added',
        quantity: typeof inv.quantity === 'number' ? inv.quantity : 1,
        ownerId: typeof inv.ownerId === 'string' ? inv.ownerId : undefined,
        ownerName: typeof inv.ownerName === 'string' ? inv.ownerName : undefined,
        toOwnerId: typeof inv.toOwnerId === 'string' ? inv.toOwnerId : (typeof inv.targetCharacterId === 'string' ? inv.targetCharacterId : undefined),
        toOwnerName: typeof inv.toOwnerName === 'string' ? inv.toOwnerName : undefined,
        slot: typeof inv.slot === 'string' ? inv.slot : undefined,
        bodyAreas: Array.isArray(inv.bodyAreas) ? inv.bodyAreas.map((a: any) => String(a)) : undefined,
        isRestraint: Boolean(inv.isRestraint || inv.action === 'attach'),
        condition: typeof inv.condition === 'string' ? inv.condition : undefined,
        itemInstanceId: typeof inv.itemInstanceId === 'string' ? inv.itemInstanceId : undefined,
        itemDefinitionId: typeof inv.itemDefinitionId === 'string' ? inv.itemDefinitionId : undefined,
        description: typeof inv.description === 'string' ? inv.description : undefined
      }));
    }

    // 7. Validate bodyConditionChanges
    if (Array.isArray(raw.bodyConditionChanges)) {
      const allowedActions = ['added', 'removed', 'updated'];
      validated.bodyConditionChanges = raw.bodyConditionChanges.filter((bc: any) => {
        if (!bc || typeof bc !== 'object') return false;
        if (typeof bc.name !== 'string' || !bc.name.trim()) return false;
        return true;
      }).map((bc: any) => ({
        name: String(bc.name).trim(),
        action: allowedActions.includes(bc.action) ? bc.action : 'added',
        type: typeof bc.type === 'string' ? bc.type as any : undefined,
        characterId: typeof bc.characterId === 'string' ? bc.characterId : undefined,
        characterName: typeof bc.characterName === 'string' ? bc.characterName : undefined,
        bodyAreas: Array.isArray(bc.bodyAreas) ? bc.bodyAreas.map((a: any) => String(a)) : undefined,
        sourceItemInstanceId: typeof bc.sourceItemInstanceId === 'string' ? bc.sourceItemInstanceId : undefined,
        isRestraint: Boolean(bc.isRestraint || bc.type === 'restraint'),
        description: typeof bc.description === 'string' ? bc.description : undefined,
        duration: typeof bc.duration === 'string' ? bc.duration : undefined,
        severity: typeof bc.severity === 'string' ? bc.severity as any : undefined,
        isActive: bc.isActive !== undefined ? Boolean(bc.isActive) : true
      }));
    }

    // 8. Validate relationshipChanges
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

    // 9. Validate worldChanges
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

    // 1. Look for explicit tag block: <STORY_STATE_CHANGES>..., [[STORY_STATE_CHANGES]]..., [STORY_STATE_CHANGES]...
    const tagBlockMatch = rawText.match(/(?:<|\[\[?)STORY_STATE_CHANGES(?:>|\]\]?)([\s\S]*?)(?:(?:<|\[\[?)\/STORY_STATE_CHANGES(?:>|\]\]?)|$)/i);
    let jsonString = '';

    if (tagBlockMatch) {
      const insideTag = tagBlockMatch[1].trim();
      const innerCodeBlock = insideTag.match(/```(?:json[^\n]*)?\s*([\s\S]*?)\s*```/i);
      if (innerCodeBlock) {
        jsonString = innerCodeBlock[1].trim();
      } else {
        const jsonObjectInTag = insideTag.match(/(\{[\s\S]*\})/);
        jsonString = jsonObjectInTag ? jsonObjectInTag[1].trim() : insideTag;
      }
      cleanedNarrativeText = cleanedNarrativeText.replace(tagBlockMatch[0], '');
    }

    if (!jsonString) {
      // 2. Fallback: check if json code block or standalone JSON object with state keys exists
      const codeBlockMatch = rawText.match(/```(?:json[^\n]*)?\s*(\{[\s\S]*?(?:discoveredEntities|locationChange|presenceChanges|events|inventoryChanges|knowledgeUpdates|bodyConditionChanges)[\s\S]*?\})\s*```/i);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        cleanedNarrativeText = cleanedNarrativeText.replace(codeBlockMatch[0], '');
      } else {
        const rawJsonMatch = rawText.match(/(\{[\s\S]*?"(?:discoveredEntities|locationChange|presenceChanges|events|inventoryChanges|knowledgeUpdates|bodyConditionChanges)"[\s\S]*?\})/i);
        if (rawJsonMatch) {
          jsonString = rawJsonMatch[1].trim();
          cleanedNarrativeText = cleanedNarrativeText.replace(rawJsonMatch[0], '');
        }
      }
    }

    // Completely strip any remaining story state markup or JSON blocks
    cleanedNarrativeText = this.stripStoryStateMarkup(cleanedNarrativeText);

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
      state = this.processDiscoveredEntities(state, changes.discoveredEntities, notifications, changes.presenceChanges);
    }

    // 2. Process Location Change
    if (changes.locationChange) {
      state = this.processLocationChange(state, changes.locationChange, notifications);
    }

    // 3. Process Presence Changes
    if (Array.isArray(changes.presenceChanges) && changes.presenceChanges.length > 0) {
      state = this.processPresenceChanges(state, changes.presenceChanges, notifications);
    }

    // 4. Process Knowledge Updates
    if (Array.isArray(changes.knowledgeUpdates) && changes.knowledgeUpdates.length > 0) {
      state = this.processKnowledgeUpdates(state, changes.knowledgeUpdates);
    }

    // 5. Process Events & Tasks
    if (Array.isArray(changes.events) && changes.events.length > 0) {
      state = this.processEvents(state, changes.events, notifications);
    }

    // 6. Process Inventory & Equipment & Body Condition Changes
    if ((Array.isArray(changes.inventoryChanges) && changes.inventoryChanges.length > 0) ||
        (Array.isArray(changes.bodyConditionChanges) && changes.bodyConditionChanges.length > 0)) {
      state = this.processInventoryChanges(state, changes.inventoryChanges || [], changes.bodyConditionChanges || [], notifications);
    }

    // 7. Process Relationships
    if (Array.isArray(changes.relationshipChanges) && changes.relationshipChanges.length > 0) {
      state = this.processRelationshipChanges(state, changes.relationshipChanges);
    }

    // 8. Process World Changes
    if (Array.isArray(changes.worldChanges) && changes.worldChanges.length > 0) {
      state = this.processWorldChanges(state, changes.worldChanges);
    }

    return state;
  }

  /**
   * Central helper to create, update, or deduplicate a StoryEntityItem in storyState.storyEntities.
   * Priority:
   * 1. Stable ID
   * 2. Stable linked npcId in details
   * 3. Exact title match within compatible category
   * Never uses loose includes() for identity matching.
   */
  public static ensureStoryEntity(
    storyEntities: StoryEntityItem[],
    options: EnsureStoryEntityOptions,
    loreDatabase: LoreEntry[] = []
  ): { updatedList: StoryEntityItem[]; entity: StoryEntityItem; isNew: boolean } {
    const list = [...storyEntities];
    const cleanTitle = (options.title || '').trim();
    if (!cleanTitle) {
      return { updatedList: list, entity: null as any, isNew: false };
    }

    const cleanLowerTitle = cleanTitle.toLowerCase();
    const targetId = options.id?.trim();
    const linkedNpcId = options.details?.npcId?.trim();

    // 1. Check existing in storyEntities
    let existingIndex = -1;
    if (targetId) {
      existingIndex = list.findIndex(e => e.id === targetId);
    }
    if (existingIndex === -1 && linkedNpcId) {
      existingIndex = list.findIndex(e => e.details?.npcId === linkedNpcId || e.id === linkedNpcId);
    }
    if (existingIndex === -1) {
      existingIndex = list.findIndex(e =>
        e.category === options.category && e.title.trim().toLowerCase() === cleanLowerTitle
      );
    }

    // 2. Check existing in permanent loreDatabase
    const existingLore = loreDatabase.find(l =>
      (targetId && l.id === targetId) ||
      (linkedNpcId && l.id === linkedNpcId) ||
      (l.category === options.category && l.title.trim().toLowerCase() === cleanLowerTitle)
    );

    const now = options.createdAt || new Date().toISOString();

    if (existingIndex !== -1) {
      // Existing entry in storyEntities: update without creating duplicate
      const current = list[existingIndex];
      const mergedDetails = { ...(current.details || {}), ...(options.details || {}) };
      if (linkedNpcId && !mergedDetails.npcId) {
        mergedDetails.npcId = linkedNpcId;
      }
      const updatedEntity: StoryEntityItem = {
        ...current,
        description: options.description && options.description.trim() ? options.description.trim() : current.description,
        details: mergedDetails,
        promotedToCodex: current.promotedToCodex || (options.promotedToCodex ?? false)
      };
      list[existingIndex] = updatedEntity;
      return { updatedList: list, entity: updatedEntity, isNew: false };
    }

    // If already in Codex and not explicitly forced as newInStory:
    // Do NOT push a redundant promotedToCodex: true item into storyEntities!
    const isAlreadyInCodex = Boolean(existingLore);
    if (isAlreadyInCodex && !options.isNewInStory) {
      return {
        updatedList: list,
        entity: {
          id: existingLore!.id,
          category: options.category,
          title: existingLore!.title,
          description: existingLore!.description,
          details: existingLore!.details,
          createdAt: now,
          isNewInStory: false,
          promotedToCodex: true
        },
        isNew: false
      };
    }

    const entityId = targetId || linkedNpcId || `story-ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const finalDetails = { ...(options.details || {}) };
    if (linkedNpcId && !finalDetails.npcId) {
      finalDetails.npcId = linkedNpcId;
    }

    const newEntity: StoryEntityItem = {
      id: entityId,
      category: options.category,
      title: cleanTitle,
      description: options.description || `Neuer Story-Eintrag (${cleanTitle}).`,
      details: finalDetails,
      createdAt: now,
      isNewInStory: options.isNewInStory !== undefined ? options.isNewInStory : true,
      promotedToCodex: options.promotedToCodex !== undefined ? options.promotedToCodex : false
    };

    list.push(newEntity);
    return { updatedList: list, entity: newEntity, isNew: true };
  }

  /**
   * Generates a deterministic fingerprint for initial story message / prologue content.
   */
  public static computeMessageFingerprint(text: string): string {
    if (!text || !text.trim()) return '';
    const clean = text.trim();
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `fp-${clean.length}-${hash}`;
  }

  /**
   * Processes discovered entities (Characters, Locations, Buildings, Rooms, Items, etc.)
   * Enforces strict deduplication: Stable ID first -> Exact Name -> Controlled Normalization.
   * New entities are added as temporary Story Entities (Story-Info), NOT directly promoted to Codex without review.
   * When discovering new characters/creatures, creates NPC and Story-Info atomically with identical IDs.
   */
  private static processDiscoveredEntities(
    adventure: Adventure,
    entities: AIEntityDiscovery[],
    notifications: any[] = [],
    presenceChanges: AIPresenceChange[] = []
  ): Adventure {
    const updatedNpcs = [...(adventure.npcs || [])];
    const loreDb = [...(adventure.loreDatabase || [])];
    let storyEntities = [...(adventure.storyState?.storyEntities || [])];
    const playerName = (adventure.player?.name || 'Spieler').trim().toLowerCase();

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

    entities.forEach(discovery => {
      if (!discovery || !discovery.name) return;
      const cleanName = discovery.name.trim();
      if (!cleanName || cleanName.toLowerCase() === playerName) return;

      const category = categoryMap[discovery.type] || 'Story & Quests';

      // Check existing NPC
      const existingNpc = LocationContextService.resolveCharacter(updatedNpcs, {
        id: discovery.id,
        name: cleanName
      });

      if (existingNpc && discovery.description) {
        existingNpc.currentSituation = discovery.description;
      }

      const entityId = discovery.id || existingNpc?.id || `story-ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const details: Record<string, any> = {
        role: discovery.role,
        locationContext: discovery.locationContext,
        ...(discovery.details || {})
      };
      if (discovery.type === 'character' || discovery.type === 'creature') {
        details.npcId = existingNpc ? existingNpc.id : entityId;
      }

      const ensured = this.ensureStoryEntity(storyEntities, {
        id: existingNpc ? existingNpc.id : entityId,
        category,
        title: cleanName,
        description: discovery.description || `Entdecktes Element (${cleanName}).`,
        details
      }, loreDb);

      storyEntities = ensured.updatedList;

      // If character or creature, add to dynamic NPCs list with resolved locationContext and presenceState
      if (discovery.type === 'character' || discovery.type === 'creature') {
        if (!existingNpc) {
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

          // Rule 5: Discovered ≠ Present! Default to 'absent' unless explicitly marked present
          const isExplicitlyPresent = discovery.details?.isExplicitlyPresent === true ||
            (presenceChanges && presenceChanges.some(p =>
              (p.characterId && p.characterId === ensured.entity.id) ||
              (p.characterName && p.characterName.trim().toLowerCase() === cleanName.toLowerCase())
            ) && presenceChanges.find(p =>
              (p.characterId && p.characterId === ensured.entity.id) ||
              (p.characterName && p.characterName.trim().toLowerCase() === cleanName.toLowerCase())
            )?.state !== 'mentioned_only' && presenceChanges.find(p =>
              (p.characterId && p.characterId === ensured.entity.id) ||
              (p.characterName && p.characterName.trim().toLowerCase() === cleanName.toLowerCase())
            )?.state !== 'absent');

          updatedNpcs.push({
            id: ensured.entity.id,
            name: cleanName,
            role: discovery.role || (discovery.type === 'creature' ? 'Gegner' : 'Bewohner'),
            bio: discovery.description || 'In der Geschichte erwähnter Charakter.',
            personality: 'Unbekannt',
            relationship: 'Neu entdeckt',
            conduct: 'Neutral',
            currentSituation: isExplicitlyPresent ? 'Neu entdeckt (am Ort anwesend)' : 'Neu entdeckt (nicht anwesend)',
            currentLocationContext: initialLocContext,
            presenceState: {
              state: isExplicitlyPresent ? 'present' : 'absent',
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
      }

      if (ensured.isNew) {
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title: `${cleanName} (${category})`,
          category: 'Story-Info'
        });
      }
    });

    return {
      ...adventure,
      npcs: updatedNpcs,
      storyState: {
        ...(adventure.storyState || {
          currentLocationName: '',
          currentTerritoryName: '',
          activeSituation: '',
          activeGoals: [],
          relationships: [],
          storyEntities: [],
          lastUpdatedTime: new Date().toISOString()
        }),
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
   * Location change ≠ Discovery (does not generate unprompted Story-Info entries).
   */
  private static processLocationChange(
    adventure: Adventure,
    locChange: AILocationChange,
    notifications: any[] = []
  ): Adventure {
    const existingContext = LocationContextService.resolveCurrentLocation(adventure);

    const newContext: CurrentLocationContext = {
      locationName: locChange.locationName || existingContext.locationName,
      buildingId: locChange.buildingId || existingContext.buildingId,
      buildingName: locChange.buildingName || existingContext.buildingName,
      roomId: locChange.roomId || existingContext.roomId,
      roomName: locChange.roomName || existingContext.roomName,
      territoryName: locChange.territoryName || existingContext.territoryName,
      regionName: locChange.regionName || existingContext.regionName,
      sceneId: locChange.sceneId || existingContext.sceneId
    };

    let updatedAdventure = LocationContextService.updateCurrentLocation(adventure, newContext);

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
   * If a character is marked present or scene_participant and does not exist yet, creates NPC & Story-Info entry.
   */
  private static processPresenceChanges(
    adventure: Adventure,
    presenceChanges: AIPresenceChange[],
    notifications: any[] = []
  ): Adventure {
    const npcs = [...(adventure.npcs || [])];
    let storyEntities = [...(adventure.storyState?.storyEntities || [])];
    const loreDb = adventure.loreDatabase || [];
    const currentLoc = LocationContextService.resolveCurrentLocation(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const playerName = (adventure.player?.name || 'Spieler').trim().toLowerCase();

    presenceChanges.forEach(p => {
      if (!p || (!p.characterName && !p.characterId)) return;

      const npc = LocationContextService.resolveCharacter(npcs, {
        id: p.characterId,
        name: p.characterName
      });

      const now = new Date().toISOString();

      if (npc) {
        if (p.state === 'mentioned_only') {
          // Mentioned only: record mention timestamp & situation without modifying presenceState, sceneId, or location
          npc.lastMentionedAt = now;
          npc.currentSituation = 'In Gedanken/Gesprächen erwähnt';
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

          const targetSceneId = currentLoc.sceneId;
          const finalState: 'absent' | 'present' | 'scene_participant' = (p.state === 'scene_participant' && (!targetSceneId || targetSceneId.trim() === '')) ? 'present' : p.state;

          npc.presenceState = {
            state: finalState,
            sceneId: finalState === 'scene_participant' ? targetSceneId : undefined,
            locationContext: targetLoc,
            updatedAt: now
          };
          npc.currentLocationContext = targetLoc;
          npc.currentSituation = finalState === 'scene_participant' ? 'Nimmt aktiv an der Szene teil' : 'Am Ort anwesend';
        }
      } else if (p.state === 'present' || p.state === 'scene_participant') {
        // Character not found in existing npcs, but has physical presence or scene participation!
        const isPlayer = p.characterName && (
          p.characterName.trim().toLowerCase() === playerName ||
          (adventure.player?.name && p.characterName.trim().toLowerCase() === adventure.player.name.trim().toLowerCase())
        );
        if (!isPlayer && p.characterName && p.characterName.trim()) {
          const cleanName = p.characterName.trim();
          const existingLore = loreDb.find(l =>
            (p.characterId && l.id === p.characterId) ||
            l.title.trim().toLowerCase() === cleanName.toLowerCase()
          );
          const existingStoryEnt = storyEntities.find(e =>
            (p.characterId && e.id === p.characterId) ||
            e.title.trim().toLowerCase() === cleanName.toLowerCase()
          );

          const entityId = p.characterId || existingStoryEnt?.id || existingLore?.id || `npc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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

          const targetSceneId = currentLoc.sceneId;
          const finalState: 'absent' | 'present' | 'scene_participant' = (p.state === 'scene_participant' && (!targetSceneId || targetSceneId.trim() === '')) ? 'present' : p.state;

          npcs.push({
            id: entityId,
            name: cleanName,
            role: 'Anwesender Charakter',
            bio: 'In der Geschichte anwesender Charakter.',
            personality: 'Unbekannt',
            relationship: 'Neu anwesend',
            conduct: 'Neutral',
            currentSituation: finalState === 'scene_participant' ? 'Nimmt aktiv an der Szene teil' : 'Am Ort anwesend',
            currentLocationContext: targetLoc,
            presenceState: {
              state: finalState,
              sceneId: finalState === 'scene_participant' ? targetSceneId : undefined,
              locationContext: targetLoc,
              updatedAt: now
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
            isHostile: false
          });

          const ensured = this.ensureStoryEntity(storyEntities, {
            id: entityId,
            category: 'Charaktere',
            title: cleanName,
            description: `In der Geschichte anwesender Charakter (${cleanName}).`,
            details: {
              npcId: entityId,
              role: 'Charakter'
            }
          }, loreDb);
          storyEntities = ensured.updatedList;
          if (ensured.isNew) {
            notifications.push({
              id: Math.random().toString(),
              type: 'add',
              title: `${cleanName} (Charaktere)`,
              category: 'Story-Info'
            });
          }
        }
      }
    });

    return {
      ...adventure,
      npcs,
      storyState: {
        ...(adventure.storyState || {
          currentLocationName: '',
          currentTerritoryName: '',
          activeSituation: '',
          activeGoals: [],
          relationships: [],
          storyEntities: [],
          lastUpdatedTime: new Date().toISOString()
        }),
        storyEntities,
        lastUpdatedTime: new Date().toISOString()
      } as StoryInfoState
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
   * Also ensures new events land in temporary Story Entities.
   */
  private static processEvents(
    adventure: Adventure,
    events: AIStoryEvent[],
    notifications: any[]
  ): Adventure {
    const storyState = adventure.storyState ? {
      ...adventure.storyState,
      activeGoals: [...(adventure.storyState.activeGoals || [])],
      storyEntities: [...(adventure.storyState.storyEntities || [])]
    } : {
      currentLocationName: '',
      currentTerritoryName: '',
      activeSituation: '',
      activeGoals: [],
      relationships: [],
      storyEntities: [],
      lastUpdatedTime: new Date().toISOString()
    };

    let storyEntities = storyState.storyEntities;
    const loreDb = adventure.loreDatabase || [];

    events.forEach(e => {
      if (!e || !e.title) return;
      const cleanTitle = e.title.trim();
      if (!cleanTitle) return;

      const lower = cleanTitle.toLowerCase();
      const ensured = this.ensureStoryEntity(storyEntities, {
        category: 'Story & Quests',
        title: cleanTitle,
        description: e.description || `Ereignis / Quest: ${cleanTitle}`,
        details: {
          type: e.type,
          isPlayerTask: e.isPlayerTask
        }
      }, loreDb);
      storyEntities = ensured.updatedList;

      if (ensured.isNew) {
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title: `${cleanTitle} (Story & Quests)`,
          category: 'Story-Info'
        });
      }

      if (e.isPlayerTask) {
        const goalExists = storyState.activeGoals.some(g => g.toLowerCase() === lower);
        if (!goalExists) {
          storyState.activeGoals.push(cleanTitle);
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `Aufgabe: ${cleanTitle}`,
            category: 'Story & Quests'
          });
        }
      } else if (e.description && !storyState.activeSituation) {
        storyState.activeSituation = e.description;
      }
    });

    return {
      ...adventure,
      storyState: {
        ...storyState,
        storyEntities
      } as StoryInfoState
    };
  }

  /**
   * Processes Inventory, Equipment, Restraint & Body Condition Changes.
   * New items land in temporary Story Entities and are added to inventory / equipment.
   */
  private static processInventoryChanges(
    adventure: Adventure,
    inventoryChanges: AIInventoryChange[],
    bodyConditionChanges: AIBodyConditionChange[],
    notifications: any[]
  ): Adventure {
    // 1. First process canonical item & equipment & condition state through service
    let updatedAdventure = EquipmentConditionService.processAiStateChanges(
      adventure,
      inventoryChanges,
      bodyConditionChanges,
      notifications
    );

    let storyEntities = [...(updatedAdventure.storyState?.storyEntities || [])];
    const loreDb = updatedAdventure.loreDatabase || [];

    inventoryChanges.forEach(inv => {
      if (!inv || !inv.item) return;
      const cleanItem = inv.item.trim();
      if (!cleanItem) return;

      if (inv.action === 'added' || inv.action === 'attach' || inv.action === 'equip') {
        const isRestraint = inv.action === 'attach' || inv.isRestraint;
        const ensured = this.ensureStoryEntity(storyEntities, {
          category: 'Gegenstände',
          title: cleanItem,
          description: isRestraint
            ? `Im Laufe der Geschichte angelegte Fesselung / Fixierung (${cleanItem}).`
            : `Im Laufe der Geschichte gefundener / erhaltener Gegenstand (${cleanItem}).`,
          details: {
            action: inv.action,
            quantity: inv.quantity || 1,
            isRestraint,
            bodyAreas: inv.bodyAreas,
            ownerId: inv.ownerId || inv.ownerName || 'player'
          }
        }, loreDb);
        storyEntities = ensured.updatedList;

        if (ensured.isNew && inv.action === 'added') {
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `${cleanItem} (Gegenstände)`,
            category: 'Story-Info'
          });
        }
      }
    });

    return {
      ...updatedAdventure,
      storyState: {
        ...(updatedAdventure.storyState || {
          currentLocationName: '',
          currentTerritoryName: '',
          activeSituation: '',
          activeGoals: [],
          relationships: [],
          storyEntities: [],
          lastUpdatedTime: new Date().toISOString()
        }),
        storyEntities,
        lastUpdatedTime: new Date().toISOString()
      } as StoryInfoState
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
