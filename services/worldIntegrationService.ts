import {
  WorldSetting,
  Territory,
  LoreEntry,
  Character,
  NPC,
  WorldFact,
  WorldFactChangeLogEntry,
  WorldEntityReference,
  WorldEntityType,
  EncounterForce,
  FactionWorldState,
  DynamicWorldState,
  CombatResultFeedback,
  CombatState,
  TacticalGroup,
  TacticalEntity,
  TacticalFormation,
  TacticalDirection,
  TacticalSpawnSource
} from '../types';
import { spawnTacticalGroup } from '../utils/tacticalEngine';
import { WorldKnowledgeService } from './worldKnowledgeService';

export interface ResolveWorldContextParams {
  idOrName?: string;
  world: WorldSetting;
  loreDatabase?: LoreEntry[];
  characters?: Character[];
  npcs?: NPC[];
}

export interface ResolvedConnectedWorldData {
  factionEntry: LoreEntry | null;
  factionId: string | null;
  factionName: string | null;

  enemyTypeEntry: LoreEntry | null;
  enemyTypeId: string | null;
  enemyTypeName: string | null;

  raceEntry: LoreEntry | null;
  raceId: string | null;
  raceName: string | null;

  leaderCharacter: Character | NPC | null;
  leaderLoreEntry: LoreEntry | null;
  leaderId: string | null;
  leaderName: string | null;

  originTerritory: Territory | null;
  originId: string | null;
  originName: string | null;

  targetTerritory: Territory | null;
  targetId: string | null;
  targetName: string | null;

  connectedFacts: WorldFact[];
  warnings: string[];
}

export interface CreateEncounterForceParams {
  name?: string;
  factionIdOrName?: string;
  enemyTypeIdOrName?: string;
  raceIdOrName?: string;
  leaderIdOrName?: string;
  originIdOrName?: string;
  targetIdOrName?: string;
  count: number;
  objective?: string;
  context?: string;
  hostility?: 'neutral' | 'suspicious' | 'hostile';
  escalation?: 'local' | 'regional' | 'major' | 'unknown';
  world: WorldSetting;
  loreDatabase?: LoreEntry[];
  characters?: Character[];
  npcs?: NPC[];
}

export class WorldIntegrationService {
  // -------------------------------------------------------------
  // 1. Stable String Matching & Helpers
  // -------------------------------------------------------------
  private static normalizeStr(str: string): string {
    return (str || '')
      .toLowerCase()
      .trim()
      .replace(/^(der|die|das|ein|eine|eines|stamm\s+der|orden\s+der|clan\s+der)\s+/i, '')
      .replace(/[^a-z0-9äöüß]/gi, '');
  }

  // -------------------------------------------------------------
  // 2. Entity Resolvers (Single Source of Truth)
  // -------------------------------------------------------------

  /**
   * Resolves a generic LoreEntry by ID or Title/Alias
   */
  static resolveLoreEntry(
    loreDatabase: LoreEntry[] = [],
    idOrName: string,
    category?: string
  ): LoreEntry | null {
    if (!idOrName || !loreDatabase) return null;
    const trimmed = idOrName.trim();
    const normalized = this.normalizeStr(trimmed);

    // 1. Exact ID match
    const byId = loreDatabase.find(e => e.id === trimmed);
    if (byId && (!category || byId.category === category)) return byId;

    // 2. Exact Title match
    const byTitle = loreDatabase.find(e => {
      if (category && e.category !== category) return false;
      return e.title.trim().toLowerCase() === trimmed.toLowerCase();
    });
    if (byTitle) return byTitle;

    // 3. Normalized Title or Details Name match
    const byNorm = loreDatabase.find(e => {
      if (category && e.category !== category) return false;
      if (this.normalizeStr(e.title) === normalized) return true;
      if (e.details?.name && this.normalizeStr(e.details.name) === normalized) return true;
      if (e.details?.nickname && this.normalizeStr(e.details.nickname) === normalized) return true;
      return false;
    });
    if (byNorm) return byNorm;

    // 4. Fuzzy Substring match if name is long enough (>3 chars)
    if (normalized.length >= 3) {
      const bySub = loreDatabase.find(e => {
        if (category && e.category !== category) return false;
        const normTitle = this.normalizeStr(e.title);
        return normTitle.includes(normalized) || normalized.includes(normTitle);
      });
      if (bySub) return bySub;
    }

    return null;
  }

  /**
   * Resolves a Faction from Codex / LoreDatabase
   */
  static resolveFaction(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    return this.resolveLoreEntry(loreDatabase, idOrName, 'Fraktionen');
  }

  /**
   * Resolves an Enemy Definition from Codex / LoreDatabase
   */
  static resolveEnemyType(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    return this.resolveLoreEntry(loreDatabase, idOrName, 'Gegner');
  }

  /**
   * Resolves a Race / Species from Codex / LoreDatabase
   */
  static resolveRace(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    const raceEntry = this.resolveLoreEntry(loreDatabase, idOrName, 'Rassen');
    if (raceEntry) return raceEntry;
    // Fallback: check Weltregeln or other lore if category not strictly 'Rassen'
    return this.resolveLoreEntry(loreDatabase, idOrName);
  }

  /**
   * Resolves a Character or NPC from existing Character lists and Codex
   */
  static resolveCharacter(
    characters: Character[] = [],
    npcs: NPC[] = [],
    loreDatabase: LoreEntry[] = [],
    idOrName: string
  ): { character?: Character | NPC; loreEntry?: LoreEntry } | null {
    if (!idOrName) return null;
    const trimmed = idOrName.trim();
    const normalized = this.normalizeStr(trimmed);

    // 1. Check characters array (Player / Companions)
    const charById = characters.find(c => (c as any).id === trimmed);
    if (charById) return { character: charById };

    const charByName = characters.find(
      c => c.name.toLowerCase() === trimmed.toLowerCase() || this.normalizeStr(c.name) === normalized
    );
    if (charByName) return { character: charByName };

    // 2. Check npcs array
    const npcById = npcs.find(n => (n as any).id === trimmed);
    if (npcById) return { character: npcById as any };

    const npcByName = npcs.find(
      n => n.name.toLowerCase() === trimmed.toLowerCase() || this.normalizeStr(n.name) === normalized
    );
    if (npcByName) return { character: npcByName as any };

    // 3. Check Codex LoreDatabase under 'Charaktere'
    const loreChar = this.resolveLoreEntry(loreDatabase, idOrName, 'Charaktere');
    if (loreChar) return { loreEntry: loreChar };

    return null;
  }

  /**
   * Resolves a Territory or Place from world territories
   */
  static resolveTerritory(territories: Territory[] = [], idOrName: string): Territory | null {
    if (!idOrName || !territories) return null;
    const trimmed = idOrName.trim();
    const normalized = this.normalizeStr(trimmed);

    // 1. Exact ID
    const byId = territories.find(t => t.id === trimmed);
    if (byId) return byId;

    // 2. Exact Name
    const byName = territories.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (byName) return byName;

    // 3. Normalized Name
    const byNorm = territories.find(t => this.normalizeStr(t.name) === normalized);
    if (byNorm) return byNorm;

    // 4. Substring if length >= 3
    if (normalized.length >= 3) {
      const bySub = territories.find(t => {
        const normName = this.normalizeStr(t.name);
        return normName.includes(normalized) || normalized.includes(normName);
      });
      if (bySub) return bySub;
    }

    return null;
  }

  /**
   * Resolves a generic World Entity Reference
   */
  static resolveEntityReference(params: {
    idOrName: string;
    world: WorldSetting;
    loreDatabase?: LoreEntry[];
    characters?: Character[];
    npcs?: NPC[];
  }): WorldEntityReference | null {
    const { idOrName, world, loreDatabase = [], characters = [], npcs = [] } = params;
    if (!idOrName) return null;

    // 1. Territory
    const terr = this.resolveTerritory(world.territories || [], idOrName);
    if (terr) {
      return {
        entityId: terr.id,
        entityType: terr.type === 'Stadt' || terr.type === 'Dorf' || terr.type === 'Siedlung' ? 'place' : 'territory',
        displayName: terr.name
      };
    }

    // 2. Faction
    const faction = this.resolveFaction(loreDatabase, idOrName);
    if (faction) {
      return {
        entityId: faction.id,
        entityType: 'faction',
        displayName: faction.title
      };
    }

    // 3. Enemy
    const enemy = this.resolveEnemyType(loreDatabase, idOrName);
    if (enemy) {
      return {
        entityId: enemy.id,
        entityType: 'enemy',
        displayName: enemy.title
      };
    }

    // 4. Race
    const race = this.resolveRace(loreDatabase, idOrName);
    if (race) {
      return {
        entityId: race.id,
        entityType: 'race',
        displayName: race.title
      };
    }

    // 5. Character / NPC
    const charRes = this.resolveCharacter(characters, npcs, loreDatabase, idOrName);
    if (charRes) {
      const charObj = charRes.character;
      const loreObj = charRes.loreEntry;
      return {
        entityId: (charObj as any)?.id || loreObj?.id || idOrName,
        entityType: charObj ? 'character' : 'npc',
        displayName: charObj?.name || loreObj?.title || idOrName
      };
    }

    // 6. Generic Lore Entry
    const genericLore = this.resolveLoreEntry(loreDatabase, idOrName);
    if (genericLore) {
      return {
        entityId: genericLore.id,
        entityType: 'lore',
        displayName: genericLore.title,
        category: genericLore.category
      };
    }

    return null;
  }

  // -------------------------------------------------------------
  // 3. Context & Relation Extraction Layer
  // -------------------------------------------------------------

  /**
   * Connects all components of a situation (Faction -> Leader -> Race -> Enemy -> Location -> WorldFacts)
   */
  static extractConnectedWorldData(params: {
    factionIdOrName?: string;
    enemyTypeIdOrName?: string;
    raceIdOrName?: string;
    leaderIdOrName?: string;
    originIdOrName?: string;
    targetIdOrName?: string;
    world: WorldSetting;
    loreDatabase?: LoreEntry[];
    characters?: Character[];
    npcs?: NPC[];
  }): ResolvedConnectedWorldData {
    const {
      factionIdOrName,
      enemyTypeIdOrName,
      raceIdOrName,
      leaderIdOrName,
      originIdOrName,
      targetIdOrName,
      world,
      loreDatabase = world.loreDatabase || [],
      characters = [],
      npcs = []
    } = params;

    const warnings: string[] = [];
    const allFacts = WorldKnowledgeService.getAllWorldFacts(world, loreDatabase, characters);

    // 1. Resolve Faction
    let factionEntry: LoreEntry | null = null;
    if (factionIdOrName) {
      factionEntry = this.resolveFaction(loreDatabase, factionIdOrName);
      if (!factionEntry) {
        warnings.push(`Faction "${factionIdOrName}" could not be resolved in Codex.`);
      }
    }

    // 2. Resolve Enemy Type
    let enemyTypeEntry: LoreEntry | null = null;
    if (enemyTypeIdOrName) {
      enemyTypeEntry = this.resolveEnemyType(loreDatabase, enemyTypeIdOrName);
      if (!enemyTypeEntry) {
        warnings.push(`EnemyType "${enemyTypeIdOrName}" could not be resolved in Codex.`);
      }
    }

    // 3. Resolve Race
    let raceEntry: LoreEntry | null = null;
    const raceCandidate = raceIdOrName || (enemyTypeEntry?.details as any)?.species;
    if (raceCandidate) {
      raceEntry = this.resolveRace(loreDatabase, raceCandidate);
    }

    // 4. Resolve Leader
    let leaderCharacter: Character | NPC | null = null;
    let leaderLoreEntry: LoreEntry | null = null;
    const leaderCandidate = leaderIdOrName || (factionEntry?.details as any)?.leader;
    if (leaderCandidate) {
      const charRes = this.resolveCharacter(characters, npcs, loreDatabase, leaderCandidate);
      if (charRes) {
        leaderCharacter = charRes.character || null;
        leaderLoreEntry = charRes.loreEntry || null;
      } else if (leaderIdOrName) {
        warnings.push(`Leader "${leaderIdOrName}" could not be resolved in Character lists or Codex.`);
      }
    }

    // 5. Resolve Origin & Target
    let originTerritory: Territory | null = null;
    if (originIdOrName) {
      originTerritory = this.resolveTerritory(world.territories || [], originIdOrName);
      if (!originTerritory) {
        warnings.push(`Origin "${originIdOrName}" could not be resolved on World Map.`);
      }
    }

    let targetTerritory: Territory | null = null;
    if (targetIdOrName) {
      targetTerritory = this.resolveTerritory(world.territories || [], targetIdOrName);
      if (!targetTerritory) {
        warnings.push(`Target "${targetIdOrName}" could not be resolved on World Map.`);
      }
    }

    // 6. Filter connected WorldFacts
    const subjectIds = new Set<string>();
    if (factionEntry) subjectIds.add(factionEntry.id);
    if (enemyTypeEntry) subjectIds.add(enemyTypeEntry.id);
    if (raceEntry) subjectIds.add(raceEntry.id);
    if (leaderCharacter) subjectIds.add((leaderCharacter as any).id || leaderCharacter.name);
    if (leaderLoreEntry) subjectIds.add(leaderLoreEntry.id);
    if (originTerritory) subjectIds.add(originTerritory.id);
    if (targetTerritory) subjectIds.add(targetTerritory.id);

    const connectedFacts = allFacts.filter(
      f => subjectIds.has(f.subjectId) || (f.objectId && subjectIds.has(f.objectId))
    );

    return {
      factionEntry,
      factionId: factionEntry?.id || null,
      factionName: factionEntry?.title || factionIdOrName || null,

      enemyTypeEntry,
      enemyTypeId: enemyTypeEntry?.id || null,
      enemyTypeName: enemyTypeEntry?.title || enemyTypeIdOrName || null,

      raceEntry,
      raceId: raceEntry?.id || null,
      raceName: raceEntry?.title || raceCandidate || null,

      leaderCharacter,
      leaderLoreEntry,
      leaderId: (leaderCharacter as any)?.id || leaderLoreEntry?.id || null,
      leaderName: leaderCharacter?.name || leaderLoreEntry?.title || leaderCandidate || null,

      originTerritory,
      originId: originTerritory?.id || null,
      originName: originTerritory?.name || originIdOrName || null,

      targetTerritory,
      targetId: targetTerritory?.id || null,
      targetName: targetTerritory?.name || targetIdOrName || null,

      connectedFacts,
      warnings
    };
  }

  // -------------------------------------------------------------
  // 4. Encounter Force Management
  // -------------------------------------------------------------

  /**
   * Creates an EncounterForce without duplicating enemy or faction definitions.
   * Generates accompanying observation/situation facts safely.
   */
  static createEncounterForce(params: CreateEncounterForceParams): {
    encounterForce: EncounterForce;
    worldFacts: WorldFact[];
    validationWarnings: string[];
  } {
    const {
      name,
      factionIdOrName,
      enemyTypeIdOrName,
      raceIdOrName,
      leaderIdOrName,
      originIdOrName,
      targetIdOrName,
      count,
      objective = 'raid',
      context = 'Normale Patrouille / Truppenbewegung',
      hostility = 'hostile',
      escalation = 'local',
      world,
      loreDatabase = world.loreDatabase || [],
      characters = [],
      npcs = []
    } = params;

    const resolved = this.extractConnectedWorldData({
      factionIdOrName,
      enemyTypeIdOrName,
      raceIdOrName,
      leaderIdOrName,
      originIdOrName,
      targetIdOrName,
      world,
      loreDatabase,
      characters,
      npcs
    });

    const forceId = `force_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    const forceName =
      name ||
      `${count}x ${resolved.enemyTypeName || resolved.raceName || 'Einheiten'}${
        resolved.factionName ? ` (${resolved.factionName})` : ''
      }`;

    const encounterForce: EncounterForce = {
      id: forceId,
      name: forceName,
      factionId: resolved.factionId || undefined,
      factionName: resolved.factionName || undefined,
      raceId: resolved.raceId || undefined,
      raceName: resolved.raceName || undefined,
      enemyTypeId: resolved.enemyTypeId || undefined,
      enemyTypeName: resolved.enemyTypeName || undefined,
      leaderCharacterId: resolved.leaderId || undefined,
      leaderCharacterName: resolved.leaderName || undefined,
      originId: resolved.originId || undefined,
      originName: resolved.originName || undefined,
      targetId: resolved.targetId || undefined,
      targetName: resolved.targetName || undefined,
      count: Math.max(1, count),
      objective,
      context,
      hostility,
      escalation,
      status: 'detected',
      isTacticalSpawned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Construct grounded WorldFacts (inference/observation, NOT false canonical dogma)
    const generatedFacts: WorldFact[] = [];

    // Fact 1: Active force detected
    generatedFacts.push({
      id: `fact_${forceId}_detected`,
      subjectId: forceId,
      subjectName: forceName,
      predicate: 'has_trait',
      value: `Streitmacht von ${count} ${resolved.enemyTypeName || 'Einheiten'} aktiv`,
      sourceType: 'ai_inference',
      status: 'known',
      knowledgeType: 'fact',
      confidence: 90,
      isCurrent: true,
      createdAt: Date.now()
    });

    // Fact 2: Origin -> Target movement
    if (resolved.originId && resolved.targetId) {
      generatedFacts.push({
        id: `fact_${forceId}_movement`,
        subjectId: forceId,
        subjectName: forceName,
        predicate: 'connected_to',
        objectId: resolved.targetId,
        objectName: resolved.targetName || resolved.targetId,
        value: { originId: resolved.originId, objective },
        sourceType: 'ai_inference',
        status: 'known',
        knowledgeType: 'fact',
        confidence: 85,
        isCurrent: true,
        createdAt: Date.now()
      });
    }

    return {
      encounterForce,
      worldFacts: generatedFacts,
      validationWarnings: resolved.warnings
    };
  }

  // -------------------------------------------------------------
  // 5. Tactical Spawn Bridge
  // -------------------------------------------------------------

  /**
   * Spawns an EncounterForce into the Tactical Combat Engine.
   * Ensures 1 TacticalGroup + N lightweight TacticalEntities (with leader reference if present).
   */
  static spawnEncounterForceToTactical(params: {
    encounterForce: EncounterForce;
    combatState: CombatState;
    formation?: TacticalFormation;
    direction?: TacticalDirection;
    spawnSource?: TacticalSpawnSource | string;
    sourcePosition?: { x: number; y: number };
    baseHp?: number;
    behavior?: string;
  }): {
    group: TacticalGroup;
    entities: TacticalEntity[];
    updatedCombatState: CombatState;
    updatedEncounterForce: EncounterForce;
  } {
    const {
      encounterForce,
      combatState,
      formation = 'wedge',
      direction = 'south',
      spawnSource = 'forest_edge',
      sourcePosition,
      baseHp = 30,
      behavior = 'aggressive'
    } = params;

    // If leader exists, set it as index 0 existingCharacterId
    const existingCharacterIds: string[] = [];
    if (encounterForce.leaderCharacterId) {
      existingCharacterIds.push(encounterForce.leaderCharacterId);
    }

    // Spawn via existing TacticalEngine
    const spawnResult = spawnTacticalGroup({
      combatState,
      groupName: encounterForce.name,
      count: encounterForce.count,
      unitDisplayName: encounterForce.enemyTypeName || encounterForce.raceName || encounterForce.name,
      factionId: encounterForce.factionId,
      unitType: encounterForce.enemyTypeId || 'infantry',
      formation,
      direction,
      spawnSource,
      sourcePosition,
      existingCharacterIds,
      baseHp,
      behavior
    });

    // Tag the TacticalGroup and Entities with EncounterForce references
    const updatedGroup: TacticalGroup = {
      ...spawnResult.group,
      encounterForceId: encounterForce.id,
      enemyTypeId: encounterForce.enemyTypeId,
      raceId: encounterForce.raceId
    };

    const updatedEntities = spawnResult.entities.map((e, idx) => {
      const isLeader = idx === 0 && Boolean(encounterForce.leaderCharacterId);
      return {
        ...e,
        encounterForceId: encounterForce.id,
        enemyTypeId: encounterForce.enemyTypeId,
        raceId: encounterForce.raceId,
        isLeader,
        displayName: isLeader && encounterForce.leaderCharacterName
          ? encounterForce.leaderCharacterName
          : e.displayName
      };
    });

    // Update group and entities in combatState
    const nextEntities = { ...(spawnResult.updatedCombatState.tacticalEntities || {}) };
    updatedEntities.forEach(e => {
      nextEntities[e.id] = e;
    });

    const nextGroups = { ...(spawnResult.updatedCombatState.tacticalGroups || {}) };
    nextGroups[updatedGroup.id] = updatedGroup;

    const updatedCombatState: CombatState = {
      ...spawnResult.updatedCombatState,
      tacticalEntities: nextEntities,
      tacticalGroups: nextGroups
    };

    const updatedEncounterForce: EncounterForce = {
      ...encounterForce,
      tacticalGroupId: updatedGroup.id,
      isTacticalSpawned: true,
      status: 'engaged',
      updatedAt: Date.now()
    };

    return {
      group: updatedGroup,
      entities: updatedEntities,
      updatedCombatState,
      updatedEncounterForce
    };
  }

  // -------------------------------------------------------------
  // 6. Combat Result Feedback -> World State
  // -------------------------------------------------------------

  /**
   * Applies the outcome of tactical combat back to DynamicWorldState and WorldFacts
   */
  static applyCombatResultToWorldState(params: {
    feedback: CombatResultFeedback;
    world: WorldSetting;
    dynamicWorldState?: DynamicWorldState;
  }): {
    updatedWorld: WorldSetting;
    updatedWorldState: DynamicWorldState;
    changeLogs: WorldFactChangeLogEntry[];
    newFacts: WorldFact[];
  } {
    const { feedback, world, dynamicWorldState = world.dynamicWorldState || {} } = params;

    const changeLogs: WorldFactChangeLogEntry[] = [...(world.changeLog || [])];
    const newFacts: WorldFact[] = [];
    const factionsState = { ...(dynamicWorldState.factions || {}) };
    const encounterForces = { ...(dynamicWorldState.encounterForces || {}) };
    const recentOutcomes = [...(dynamicWorldState.recentCombatOutcomes || [])];

    recentOutcomes.unshift({
      ...feedback,
      timestamp: feedback.timestamp || Date.now()
    });

    // 1. Update EncounterForce if present
    if (feedback.forceId && encounterForces[feedback.forceId]) {
      const ef = encounterForces[feedback.forceId];
      const newStatus =
        feedback.outcome === 'victory'
          ? 'defeated'
          : feedback.outcome === 'defeat'
          ? 'engaged'
          : feedback.outcome === 'retreat'
          ? 'retreated'
          : ef.status;

      encounterForces[feedback.forceId] = {
        ...ef,
        count: feedback.survivors !== undefined ? feedback.survivors : ef.count,
        status: newStatus,
        updatedAt: Date.now()
      };
    }

    // 2. Update Faction World State if factionId present
    if (feedback.factionId) {
      const fId = feedback.factionId;
      const prevFState = factionsState[fId] || {
        factionId: fId,
        availableForce: 100,
        mobilizedForce: feedback.initialCount || 50,
        casualtyCount: 0,
        morale: 100
      };

      const casualties = feedback.casualties || 0;
      const survivors = feedback.survivors !== undefined ? feedback.survivors : Math.max(0, (prevFState.mobilizedForce || 0) - casualties);
      const newCasualtiesTotal = (prevFState.casualtyCount || 0) + casualties;

      let moraleDelta = 0;
      if (feedback.outcome === 'victory') moraleDelta = -25; // Enemy faction defeated
      else if (feedback.outcome === 'defeat') moraleDelta = +10;
      else if (feedback.outcome === 'retreat') moraleDelta = -15;

      const newMorale = Math.max(0, Math.min(100, (prevFState.morale ?? 100) + moraleDelta));
      const isWeakened = casualties > 30 || newMorale < 40 || feedback.leaderStatus === 'fallen';

      factionsState[fId] = {
        ...prevFState,
        mobilizedForce: survivors,
        casualtyCount: newCasualtiesTotal,
        morale: newMorale,
        isWeakened,
        lastUpdated: Date.now()
      };

      // ChangeLog Entry
      const changeLogEntry: WorldFactChangeLogEntry = {
        id: `log_combat_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        entityId: fId,
        entityType: 'faction',
        whatChanged: `Kampfergebnis: ${casualties} Gefallene, ${survivors} Überlebende. Moral=${newMorale}%.`,
        oldValue: prevFState,
        newValue: factionsState[fId],
        source: 'established_story',
        reason: feedback.details || 'Taktisches Gefecht abgeschlossen',
        timestamp: Date.now()
      };
      changeLogs.push(changeLogEntry);

      // Add grounded Fact about the faction's condition
      if (isWeakened) {
        newFacts.push({
          id: `fact_faction_${fId}_weakened_${Date.now().toString(36)}`,
          subjectId: fId,
          subjectName: prevFState.factionName || fId,
          predicate: 'has_trait',
          value: 'Geschwächt durch erlittene Verluste im letzten Gefecht',
          sourceType: 'established_story',
          status: 'known',
          knowledgeType: 'fact',
          confidence: 100,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
    }

    const updatedWorldState: DynamicWorldState = {
      ...dynamicWorldState,
      factions: factionsState,
      encounterForces,
      recentCombatOutcomes: recentOutcomes.slice(0, 20),
      lastUpdated: Date.now()
    };

    const updatedWorld: WorldSetting = {
      ...world,
      dynamicWorldState: updatedWorldState,
      changeLog: changeLogs,
      facts: [...(world.facts || []), ...newFacts]
    };

    return {
      updatedWorld,
      updatedWorldState,
      changeLogs,
      newFacts
    };
  }

  // -------------------------------------------------------------
  // 7. Grounding & Hypothesis Guard (Inference vs Canon)
  // -------------------------------------------------------------

  /**
   * Creates an observation or suspicion fact without cementing it as unalterable dogma.
   */
  static recordObservationOrInference(params: {
    subjectId: string;
    subjectName?: string;
    predicate: string;
    value: string;
    objectId?: string;
    objectName?: string;
    confidence?: number;
    isRumor?: boolean;
    note?: string;
  }): WorldFact {
    const {
      subjectId,
      subjectName,
      predicate,
      value,
      objectId,
      objectName,
      confidence = 60,
      isRumor = false,
      note
    } = params;

    return {
      id: `fact_inf_${subjectId}_${predicate}_${Date.now().toString(36)}`,
      subjectId,
      subjectName,
      predicate,
      objectId,
      objectName,
      value,
      sourceType: 'ai_inference',
      status: 'implied',
      knowledgeType: isRumor ? 'rumor' : 'inference',
      confidence,
      isCurrent: true,
      note: note || 'Beobachtung oder Verdacht (kein unumstößlicher Kanon)',
      createdAt: Date.now()
    };
  }
}
