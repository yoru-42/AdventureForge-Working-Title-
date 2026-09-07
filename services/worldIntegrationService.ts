import {
  WorldSetting,
  Territory,
  WorldLocationReference,
  BattleInstance,
  PlacedCombatObject,
  WorldTime,
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
  TacticalSpawnSource,
  ResolutionResult,
  WorldEventIntent
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
  status?: EncounterForce['status'];
  world: WorldSetting;
  loreDatabase?: LoreEntry[];
  characters?: Character[];
  npcs?: NPC[];
}

export interface ProcessWorldEventResult {
  intent: WorldEventIntent;
  resolvedContext: ResolvedConnectedWorldData;
  encounterForce: EncounterForce | null;
  tacticalSpawnNeeded: boolean;
  tacticalResult?: {
    group: TacticalGroup;
    entities: TacticalEntity[];
    updatedCombatState: CombatState;
    updatedEncounterForce: EncounterForce;
  };
  validationWarnings: string[];
  generatedFacts: WorldFact[];
  status: 'info_only' | 'force_created' | 'force_updated' | 'tactical_spawned' | 'unresolved';
}

export class WorldIntegrationService {
  // -------------------------------------------------------------
  // 1. Stable String Matching & Normalization Helpers
  // -------------------------------------------------------------
  private static normalizeStr(str: string): string {
    return (str || '')
      .toLowerCase()
      .trim()
      .replace(/^(der|die|das|ein|eine|eines|stamm\s+der|orden\s+der|clan\s+der|haus\s+der|stamm|clan|orden|haus)\s+/i, '')
      .replace(/[^a-z0-9äöüß]/gi, '');
  }

  // -------------------------------------------------------------
  // 2. Hardened Entity Resolvers with Priority & Ambiguity Handling
  // Priority: 1. Exact ID -> 2. Exact Title -> 3. Explicit Alias -> 4. Normalized -> 5. Controlled Fuzzy -> Ambiguous -> Unresolved
  // -------------------------------------------------------------

  /**
   * Resolves a generic LoreEntry with full ResolutionResult metadata.
   * Guarantees that generic names (e.g. "Goblin") NEVER fuzzy-match to specific compounds (e.g. "Goblin-Krieger").
   */
  static resolveLoreEntryDetailed(
    loreDatabase: LoreEntry[] = [],
    idOrName: string,
    category?: string
  ): ResolutionResult<LoreEntry> {
    if (!idOrName || typeof idOrName !== 'string' || !loreDatabase || loreDatabase.length === 0) {
      return {
        value: null,
        status: 'unresolved',
        confidence: 0,
        reason: 'Kein Suchbegriff oder leere Lore-Datenbank'
      };
    }

    const trimmed = idOrName.trim();
    if (!trimmed) {
      return {
        value: null,
        status: 'unresolved',
        confidence: 0,
        reason: 'Leerer Suchbegriff'
      };
    }

    const normalized = this.normalizeStr(trimmed);

    // Candidates in scope (filtered by category if specified)
    const pool = category ? loreDatabase.filter(e => e.category === category) : loreDatabase;
    if (pool.length === 0) {
      return {
        value: null,
        status: 'unresolved',
        confidence: 0,
        reason: category ? `Keine Einträge in Kategorie "${category}" gefunden` : 'Keine Einträge vorhanden'
      };
    }

    // 1. Priority 1: Exact ID Match
    const byId = pool.find(e => e.id === trimmed);
    if (byId) {
      return {
        value: byId,
        status: 'resolved',
        confidence: 100,
        source: 'id'
      };
    }

    // 2. Priority 2: Exact Name/Title Match (Case-Insensitive)
    const byExactTitle = pool.filter(e => e.title.trim().toLowerCase() === trimmed.toLowerCase());
    if (byExactTitle.length === 1) {
      return {
        value: byExactTitle[0],
        status: 'resolved',
        confidence: 100,
        source: 'exact_name'
      };
    } else if (byExactTitle.length > 1) {
      return {
        value: null,
        status: 'ambiguous',
        confidence: 60,
        candidates: byExactTitle,
        reason: `Mehrere Einträge mit identischem Titel "${trimmed}" gefunden`
      };
    }

    // 3. Priority 3: Explicit Alias / Nickname Match
    const byAlias = pool.filter(e => {
      const d = e.details as any;
      if (!d) return false;
      const lower = trimmed.toLowerCase();
      if (typeof d.alias === 'string' && d.alias.trim().toLowerCase() === lower) return true;
      if (typeof d.nickname === 'string' && d.nickname.trim().toLowerCase() === lower) return true;
      if (Array.isArray(d.aliases) && d.aliases.some((a: string) => typeof a === 'string' && a.trim().toLowerCase() === lower)) return true;
      return false;
    });

    if (byAlias.length === 1) {
      return {
        value: byAlias[0],
        status: 'resolved',
        confidence: 95,
        source: 'alias'
      };
    } else if (byAlias.length > 1) {
      return {
        value: null,
        status: 'ambiguous',
        confidence: 60,
        candidates: byAlias,
        reason: `Mehrere Einträge mit dem Alias "${trimmed}" gefunden`
      };
    }

    // 4. Priority 4: Normalized Exact Match
    if (normalized.length >= 2) {
      const byNorm = pool.filter(e => {
        if (this.normalizeStr(e.title) === normalized) return true;
        const d = e.details as any;
        if (d?.name && this.normalizeStr(d.name) === normalized) return true;
        if (d?.nickname && this.normalizeStr(d.nickname) === normalized) return true;
        return false;
      });

      if (byNorm.length === 1) {
        return {
          value: byNorm[0],
          status: 'resolved',
          confidence: 90,
          source: 'normalized'
        };
      } else if (byNorm.length > 1) {
        return {
          value: null,
          status: 'ambiguous',
          confidence: 50,
          candidates: byNorm,
          reason: `Mehrere Einträge mit normalisierter Übereinstimmung für "${trimmed}"`
        };
      }
    }

    // 5. Priority 5: Controlled Modifier & Plural Matching
    // Hard Rule: NEVER match a base word as a substring of a more specific compound entry!
    // Example: Searching "Goblin" must NOT match "Goblin-Krieger", and searching "Goblin-Krieger" must NOT match "Goblin"!
    if (normalized.length >= 3) {
      const allowedPluralSuffixes = ['s', 'en', 'n', 'e'];
      const allowedModifierPrefixes = ['wilder', 'wilde', 'alter', 'alte', 'junger', 'junge', 'grosser', 'grosse', 'kleiner', 'kleine', 'einfacher', 'einfache', 'gemeiner', 'gemeine'];

      const fuzzyCandidates = pool.filter(e => {
        const normTitle = this.normalizeStr(e.title);
        if (!normTitle) return false;

        // Plural check: e.g. "goblins" -> "goblin"
        for (const suffix of allowedPluralSuffixes) {
          if (normalized === normTitle + suffix) return true;
        }

        // Modifier prefix check: e.g. "wildergoblin" -> "goblin"
        for (const pref of allowedModifierPrefixes) {
          if (normalized === pref + normTitle) return true;
        }

        return false;
      });

      if (fuzzyCandidates.length === 1) {
        return {
          value: fuzzyCandidates[0],
          status: 'resolved',
          confidence: 80,
          source: 'fuzzy'
        };
      } else if (fuzzyCandidates.length > 1) {
        return {
          value: null,
          status: 'ambiguous',
          confidence: 40,
          candidates: fuzzyCandidates,
          reason: `Mehrere unscharfe Kandidaten für "${trimmed}" gefunden`
        };
      }
    }

    // 6. No Match -> Unresolved
    return {
      value: null,
      status: 'unresolved',
      confidence: 0,
      reason: `Kein passender Eintrag für "${trimmed}" gefunden`
    };
  }

  /**
   * Resolves a generic LoreEntry by ID or Title/Alias (Compatibility wrapper)
   */
  static resolveLoreEntry(
    loreDatabase: LoreEntry[] = [],
    idOrName: string,
    category?: string
  ): LoreEntry | null {
    return this.resolveLoreEntryDetailed(loreDatabase, idOrName, category).value;
  }

  /**
   * Resolves a Faction with strict category 'Fraktionen'
   */
  static resolveFactionDetailed(loreDatabase: LoreEntry[] = [], idOrName: string): ResolutionResult<LoreEntry> {
    return this.resolveLoreEntryDetailed(loreDatabase, idOrName, 'Fraktionen');
  }

  static resolveFaction(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    return this.resolveFactionDetailed(loreDatabase, idOrName).value;
  }

  /**
   * Resolves an Enemy Definition with strict category 'Gegner'
   */
  static resolveEnemyTypeDetailed(loreDatabase: LoreEntry[] = [], idOrName: string): ResolutionResult<LoreEntry> {
    return this.resolveLoreEntryDetailed(loreDatabase, idOrName, 'Gegner');
  }

  static resolveEnemyType(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    return this.resolveEnemyTypeDetailed(loreDatabase, idOrName).value;
  }

  /**
   * Resolves a Race / Species strictly from category 'Rassen'.
   * STRICT: NO fallback to other categories (Weltregeln, etc.).
   */
  static resolveRaceDetailed(loreDatabase: LoreEntry[] = [], idOrName: string): ResolutionResult<LoreEntry> {
    return this.resolveLoreEntryDetailed(loreDatabase, idOrName, 'Rassen');
  }

  static resolveRace(loreDatabase: LoreEntry[] = [], idOrName: string): LoreEntry | null {
    return this.resolveRaceDetailed(loreDatabase, idOrName).value;
  }

  /**
   * Resolves a Character or NPC strictly from character lists or Codex category 'Charaktere'
   */
  static resolveCharacterDetailed(
    characters: Character[] = [],
    npcs: NPC[] = [],
    loreDatabase: LoreEntry[] = [],
    idOrName: string
  ): ResolutionResult<{ character?: Character | NPC; loreEntry?: LoreEntry }> {
    if (!idOrName || typeof idOrName !== 'string') {
      return { value: null, status: 'unresolved', confidence: 0, reason: 'Leerer Suchbegriff' };
    }

    const trimmed = idOrName.trim();
    if (!trimmed) return { value: null, status: 'unresolved', confidence: 0, reason: 'Leerer Suchbegriff' };
    const normalized = this.normalizeStr(trimmed);

    // 1. Check characters array by ID
    const charById = characters.find(c => (c as any).id === trimmed);
    if (charById) {
      return { value: { character: charById }, status: 'resolved', confidence: 100, source: 'id' };
    }

    // 2. Check npcs array by ID
    const npcById = npcs.find(n => (n as any).id === trimmed);
    if (npcById) {
      return { value: { character: npcById as any }, status: 'resolved', confidence: 100, source: 'id' };
    }

    // 3. Check exact name match in characters / npcs
    const exactChars = characters.filter(c => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    const exactNpcs = npcs.filter(n => n.name.trim().toLowerCase() === trimmed.toLowerCase());

    if (exactChars.length + exactNpcs.length === 1) {
      const match = exactChars[0] || exactNpcs[0];
      return { value: { character: match as any }, status: 'resolved', confidence: 100, source: 'exact_name' };
    } else if (exactChars.length + exactNpcs.length > 1) {
      return {
        value: null,
        status: 'ambiguous',
        confidence: 60,
        reason: `Mehrere Charaktere/NPCs mit dem Namen "${trimmed}" gefunden`
      };
    }

    // 4. Check Codex under category 'Charaktere'
    const loreRes = this.resolveLoreEntryDetailed(loreDatabase, idOrName, 'Charaktere');
    if (loreRes.status === 'resolved' && loreRes.value) {
      return {
        value: { loreEntry: loreRes.value },
        status: 'resolved',
        confidence: loreRes.confidence,
        source: loreRes.source
      };
    } else if (loreRes.status === 'ambiguous') {
      return {
        value: null,
        status: 'ambiguous',
        confidence: loreRes.confidence,
        reason: loreRes.reason
      };
    }

    // 5. Normalized match in characters / npcs
    const normChars = characters.filter(c => this.normalizeStr(c.name) === normalized);
    const normNpcs = npcs.filter(n => this.normalizeStr(n.name) === normalized);
    if (normChars.length + normNpcs.length === 1) {
      const match = normChars[0] || normNpcs[0];
      return { value: { character: match as any }, status: 'resolved', confidence: 90, source: 'normalized' };
    }

    return { value: null, status: 'unresolved', confidence: 0, reason: `Charakter "${trimmed}" nicht gefunden` };
  }

  static resolveCharacter(
    characters: Character[] = [],
    npcs: NPC[] = [],
    loreDatabase: LoreEntry[] = [],
    idOrName: string
  ): { character?: Character | NPC; loreEntry?: LoreEntry } | null {
    return this.resolveCharacterDetailed(characters, npcs, loreDatabase, idOrName).value;
  }

  /**
   * Resolves a Territory or Place from world territories
   */
  static resolveTerritoryDetailed(territories: Territory[] = [], idOrName: string): ResolutionResult<Territory> {
    if (!idOrName || typeof idOrName !== 'string' || !territories || territories.length === 0) {
      return { value: null, status: 'unresolved', confidence: 0, reason: 'Leerer Suchbegriff' };
    }

    const trimmed = idOrName.trim();
    if (!trimmed) return { value: null, status: 'unresolved', confidence: 0, reason: 'Leerer Suchbegriff' };
    const normalized = this.normalizeStr(trimmed);

    // 1. Exact ID
    const byId = territories.find(t => t.id === trimmed);
    if (byId) return { value: byId, status: 'resolved', confidence: 100, source: 'id' };

    // 2. Exact Name
    const byExact = territories.filter(t => t.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (byExact.length === 1) {
      return { value: byExact[0], status: 'resolved', confidence: 100, source: 'exact_name' };
    } else if (byExact.length > 1) {
      return {
        value: null,
        status: 'ambiguous',
        confidence: 60,
        candidates: byExact,
        reason: `Mehrere Territorien mit Namen "${trimmed}" gefunden`
      };
    }

    // 3. Normalized Name
    const byNorm = territories.filter(t => this.normalizeStr(t.name) === normalized);
    if (byNorm.length === 1) {
      return { value: byNorm[0], status: 'resolved', confidence: 90, source: 'normalized' };
    } else if (byNorm.length > 1) {
      return {
        value: null,
        status: 'ambiguous',
        confidence: 50,
        candidates: byNorm,
        reason: `Mehrere Territorien mit normalisiertem Namen "${trimmed}"`
      };
    }

    // 4. Controlled Substring
    if (normalized.length >= 4) {
      const bySub = territories.filter(t => {
        const normName = this.normalizeStr(t.name);
        return normalized.startsWith(normName);
      });
      if (bySub.length === 1) {
        return { value: bySub[0], status: 'resolved', confidence: 75, source: 'fuzzy' };
      }
    }

    return { value: null, status: 'unresolved', confidence: 0, reason: `Territorium "${trimmed}" nicht gefunden` };
  }

  static resolveTerritory(territories: Territory[] = [], idOrName: string): Territory | null {
    return this.resolveTerritoryDetailed(territories, idOrName).value;
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
    const { idOrName, world, loreDatabase = world.loreDatabase || [], characters = [], npcs = [] } = params;
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
  // 3. Bounded World-Fact Graph Traversal
  // Traversing grounded relationships with depth limit, cycle protection & confidence weighting
  // -------------------------------------------------------------

  /**
   * Performs a bounded BFS graph traversal through WorldFacts to discover grounded relationships.
   * Max depth: 2 to 4 steps. Cycle protection via visited Set.
   */
  static traverseFactGraphForRelation(params: {
    startEntityId: string;
    targetCategory?: 'Fraktionen' | 'Charaktere' | 'Gegner' | 'Rassen' | 'Territory';
    maxDepth?: number;
    facts: WorldFact[];
    loreDatabase?: LoreEntry[];
    territories?: Territory[];
    characters?: Character[];
    npcs?: NPC[];
  }): {
    entityId: string;
    loreEntry?: LoreEntry;
    territory?: Territory;
    character?: Character | NPC;
    path: WorldFact[];
    confidence: number;
  } | null {
    const {
      startEntityId,
      targetCategory,
      maxDepth = 3,
      facts = [],
      loreDatabase = [],
      territories = [],
      characters = [],
      npcs = []
    } = params;

    if (!startEntityId || facts.length === 0) return null;

    const visited = new Set<string>([startEntityId]);
    type QueueItem = {
      currId: string;
      depth: number;
      path: WorldFact[];
      cumConfidence: number;
    };

    const queue: QueueItem[] = [{ currId: startEntityId, depth: 0, path: [], cumConfidence: 100 }];

    while (queue.length > 0) {
      const { currId, depth, path, cumConfidence } = queue.shift()!;
      if (depth >= maxDepth) continue;

      // Find all valid WorldFacts where currId is subject or object
      const relevantFacts = facts.filter(f => {
        if (f.isCurrent === false || (f.status as string) === 'refuted') return false;
        return f.subjectId === currId || (f.objectId && f.objectId === currId);
      });

      for (const fact of relevantFacts) {
        const neighborId = fact.subjectId === currId ? fact.objectId : fact.subjectId;
        if (!neighborId || visited.has(neighborId)) continue;
        visited.add(neighborId);

        const factConf = fact.confidence ?? 80;
        const nextConf = Math.min(cumConfidence, factConf) * 0.95;
        const nextPath = [...path, fact];

        // Check if neighbor matches target category
        if (targetCategory === 'Fraktionen') {
          const faction = loreDatabase.find(e => e.id === neighborId && e.category === 'Fraktionen');
          if (faction) {
            return {
              entityId: neighborId,
              loreEntry: faction,
              path: nextPath,
              confidence: Math.round(nextConf)
            };
          }
        } else if (targetCategory === 'Gegner') {
          const enemy = loreDatabase.find(e => e.id === neighborId && e.category === 'Gegner');
          if (enemy) {
            return {
              entityId: neighborId,
              loreEntry: enemy,
              path: nextPath,
              confidence: Math.round(nextConf)
            };
          }
        } else if (targetCategory === 'Rassen') {
          const race = loreDatabase.find(e => e.id === neighborId && e.category === 'Rassen');
          if (race) {
            return {
              entityId: neighborId,
              loreEntry: race,
              path: nextPath,
              confidence: Math.round(nextConf)
            };
          }
        } else if (targetCategory === 'Charaktere') {
          const charObj = characters.find(c => (c as any).id === neighborId || c.name === neighborId);
          const npcObj = npcs.find(n => (n as any).id === neighborId || n.name === neighborId);
          const loreChar = loreDatabase.find(e => e.id === neighborId && e.category === 'Charaktere');
          if (charObj || npcObj || loreChar) {
            return {
              entityId: neighborId,
              character: (charObj || npcObj) as any,
              loreEntry: loreChar,
              path: nextPath,
              confidence: Math.round(nextConf)
            };
          }
        } else if (targetCategory === 'Territory') {
          const terr = territories.find(t => t.id === neighborId || t.name === neighborId);
          if (terr) {
            return {
              entityId: terr.id,
              territory: terr,
              path: nextPath,
              confidence: Math.round(nextConf)
            };
          }
        }

        queue.push({
          currId: neighborId,
          depth: depth + 1,
          path: nextPath,
          cumConfidence: nextConf
        });
      }
    }

    return null;
  }

  // -------------------------------------------------------------
  // 4. Context & Relation Extraction Layer
  // -------------------------------------------------------------

  /**
   * Connects all components of a situation (Faction -> Leader -> Race -> Enemy -> Location -> WorldFacts)
   * Grounded in strict resolution and bounded graph relations.
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

    // 1. Resolve Enemy Type strictly (Category 'Gegner')
    let enemyTypeEntry: LoreEntry | null = null;
    if (enemyTypeIdOrName) {
      const res = this.resolveEnemyTypeDetailed(loreDatabase, enemyTypeIdOrName);
      if (res.status === 'resolved' && res.value) {
        enemyTypeEntry = res.value;
      } else if (res.status === 'ambiguous') {
        warnings.push(`Gegnerart "${enemyTypeIdOrName}" ist mehrdeutig (${res.candidates?.map(c => c.title).join(', ')}).`);
      } else {
        warnings.push(`Gegnerart "${enemyTypeIdOrName}" existiert nicht im Codex.`);
      }
    }

    // 2. Resolve Race strictly (Category 'Rassen')
    let raceEntry: LoreEntry | null = null;
    const raceCandidate = raceIdOrName || (enemyTypeEntry?.details as any)?.species;
    if (raceCandidate) {
      const res = this.resolveRaceDetailed(loreDatabase, raceCandidate);
      if (res.status === 'resolved' && res.value) {
        raceEntry = res.value;
      } else if (res.status === 'ambiguous') {
        warnings.push(`Rasse "${raceCandidate}" ist mehrdeutig.`);
      } else if (raceIdOrName) {
        warnings.push(`Rasse "${raceIdOrName}" existiert nicht im Codex.`);
      }
    }

    // 3. Resolve Faction strictly (Category 'Fraktionen')
    // STRICT RULE: Never assume enemyType or race is a faction!
    let factionEntry: LoreEntry | null = null;
    if (factionIdOrName) {
      const res = this.resolveFactionDetailed(loreDatabase, factionIdOrName);
      if (res.status === 'resolved' && res.value) {
        factionEntry = res.value;
      } else if (res.status === 'ambiguous') {
        warnings.push(`Fraktion "${factionIdOrName}" ist mehrdeutig (${res.candidates?.map(c => c.title).join(', ')}).`);
      } else {
        warnings.push(`Fraktion "${factionIdOrName}" existiert nicht im Codex.`);
      }
    }

    // If Faction was NOT explicitly specified by the caller, attempt grounded Fact-Graph resolution from EnemyType
    if (!factionIdOrName && !factionEntry && enemyTypeEntry) {
      // Check explicit enemyType.details.faction
      const detailFactionName = (enemyTypeEntry.details as any)?.faction;
      if (detailFactionName) {
        factionEntry = this.resolveFaction(loreDatabase, detailFactionName);
      }

      // If still not found, traverse World-Fact graph
      if (!factionEntry) {
        const graphResult = this.traverseFactGraphForRelation({
          startEntityId: enemyTypeEntry.id,
          targetCategory: 'Fraktionen',
          facts: allFacts,
          loreDatabase
        });
        if (graphResult?.loreEntry) {
          factionEntry = graphResult.loreEntry;
        }
      }
    }

    // 4. Resolve Leader strictly
    let leaderCharacter: Character | NPC | null = null;
    let leaderLoreEntry: LoreEntry | null = null;
    const leaderCandidate = leaderIdOrName || (factionEntry?.details as any)?.leader;

    if (leaderCandidate) {
      const charRes = this.resolveCharacterDetailed(characters, npcs, loreDatabase, leaderCandidate);
      if (charRes.status === 'resolved' && charRes.value) {
        leaderCharacter = charRes.value.character || null;
        leaderLoreEntry = charRes.value.loreEntry || null;
      } else if (leaderIdOrName) {
        warnings.push(`Anführer "${leaderIdOrName}" konnte in Charakteren oder Codex nicht gefunden werden.`);
      }
    }

    // If no leader candidate but faction exists, check World-Fact graph for leader
    if (!leaderCharacter && !leaderLoreEntry && factionEntry) {
      const leaderGraphResult = this.traverseFactGraphForRelation({
        startEntityId: factionEntry.id,
        targetCategory: 'Charaktere',
        facts: allFacts,
        loreDatabase,
        characters,
        npcs
      });
      if (leaderGraphResult) {
        leaderCharacter = leaderGraphResult.character || null;
        leaderLoreEntry = leaderGraphResult.loreEntry || null;
      }
    }

    // 5. Resolve Origin & Target Territories strictly
    let originTerritory: Territory | null = null;
    if (originIdOrName) {
      const res = this.resolveTerritoryDetailed(world.territories || [], originIdOrName);
      if (res.status === 'resolved' && res.value) {
        originTerritory = res.value;
      } else {
        warnings.push(`Herkunftsort "${originIdOrName}" existiert nicht auf der Weltkarte.`);
      }
    }

    let targetTerritory: Territory | null = null;
    if (targetIdOrName) {
      const res = this.resolveTerritoryDetailed(world.territories || [], targetIdOrName);
      if (res.status === 'resolved' && res.value) {
        targetTerritory = res.value;
      } else {
        warnings.push(`Zielort "${targetIdOrName}" existiert nicht auf der Weltkarte.`);
      }
    }

    // 6. Connect relevant WorldFacts for the situation
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
      factionName: factionEntry?.title || null,

      enemyTypeEntry,
      enemyTypeId: enemyTypeEntry?.id || null,
      enemyTypeName: enemyTypeEntry?.title || null,

      raceEntry,
      raceId: raceEntry?.id || null,
      raceName: raceEntry?.title || null,

      leaderCharacter,
      leaderLoreEntry,
      leaderId: (leaderCharacter as any)?.id || leaderLoreEntry?.id || null,
      leaderName: leaderCharacter?.name || leaderLoreEntry?.title || null,

      originTerritory,
      originId: originTerritory?.id || null,
      originName: originTerritory?.name || null,

      targetTerritory,
      targetId: targetTerritory?.id || null,
      targetName: targetTerritory?.name || null,

      connectedFacts,
      warnings
    };
  }

  // -------------------------------------------------------------
  // 5. Encounter Force Management & Duplicate Prevention
  // -------------------------------------------------------------

  /**
   * Creates or updates an EncounterForce without duplicating enemy or faction definitions.
   * Prevents uncontrolled duplicate forces when AI re-parses narratives.
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
      status = 'detected',
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

    const safeCount = Math.max(1, count);

    // Check for existing active matching EncounterForce (Duplicate Prevention)
    const existingForces = [
      ...(world.encounterForces || []),
      ...Object.values(world.dynamicWorldState?.encounterForces || {})
    ];

    const duplicateCandidate = existingForces.find(f => {
      if (f.status === 'defeated' || f.status === 'resolved' || f.status === 'dispersed') return false;
      // Match enemy type or race
      const matchesEnemy = resolved.enemyTypeId ? f.enemyTypeId === resolved.enemyTypeId : true;
      const matchesRace = resolved.raceId ? f.raceId === resolved.raceId : true;
      const matchesFaction = resolved.factionId ? f.factionId === resolved.factionId : (!f.factionId);
      const matchesOrigin = resolved.originId ? f.originId === resolved.originId : true;
      const matchesTarget = resolved.targetId ? f.targetId === resolved.targetId : true;
      const matchesObjective = f.objective === objective;

      return matchesEnemy && matchesRace && matchesFaction && (matchesOrigin || matchesTarget) && matchesObjective;
    });

    if (duplicateCandidate) {
      // Merge / update existing force instead of creating an unneeded duplicate
      const updatedForce: EncounterForce = {
        ...duplicateCandidate,
        count: safeCount,
        hostility,
        status: status || duplicateCandidate.status,
        updatedAt: Date.now()
      };

      return {
        encounterForce: updatedForce,
        worldFacts: [],
        validationWarnings: resolved.warnings
      };
    }

    const forceId = `force_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    const forceName =
      name ||
      `${safeCount}x ${resolved.enemyTypeName || resolved.raceName || 'Einheiten'}${
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
      count: safeCount,
      objective,
      context,
      hostility,
      escalation,
      status,
      isTacticalSpawned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Construct grounded WorldFacts (observation/situation facts, NOT dogma)
    const generatedFacts: WorldFact[] = [];

    // Fact 1: Active force detected
    generatedFacts.push({
      id: `fact_${forceId}_detected`,
      subjectId: forceId,
      subjectName: forceName,
      predicate: 'has_trait',
      value: `Streitmacht von ${safeCount} ${resolved.enemyTypeName || resolved.raceName || 'Einheiten'} aktiv`,
      sourceType: 'ai_inference',
      status: 'known',
      knowledgeType: 'fact',
      confidence: 85,
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
  // 6. Structured World Event Pipeline
  // Clean pipeline: AI/Narrative -> Intent -> Validation -> World State -> Optional Tactical Spawn
  // -------------------------------------------------------------

  /**
   * Processes a structured WorldEventIntent through full validation, context resolution, and tactical gating.
   */
  static processWorldEventIntent(params: {
    intent: WorldEventIntent;
    world: WorldSetting;
    combatState?: CombatState;
    loreDatabase?: LoreEntry[];
    characters?: Character[];
    npcs?: NPC[];
    allowTacticalSpawn?: boolean;
  }): ProcessWorldEventResult {
    const {
      intent,
      world,
      combatState,
      loreDatabase = world.loreDatabase || [],
      characters = [],
      npcs = [],
      allowTacticalSpawn = true
    } = params;

    const resolved = this.extractConnectedWorldData({
      factionIdOrName: intent.faction,
      enemyTypeIdOrName: intent.enemyType || intent.subject,
      raceIdOrName: intent.race,
      leaderIdOrName: intent.leader,
      originIdOrName: intent.origin,
      targetIdOrName: intent.target,
      world,
      loreDatabase,
      characters,
      npcs
    });

    const isInformationOnly =
      intent.type === 'info' ||
      intent.type === 'observation' ||
      (!intent.attack && !intent.movement && !intent.discoveredByPlayer && !intent.tacticalRelevant);

    // Fall A: Pure information / observation
    if (isInformationOnly) {
      const obsFact = this.recordObservationOrInference({
        subjectId: resolved.enemyTypeId || resolved.factionId || resolved.raceId || 'info_event',
        subjectName: resolved.enemyTypeName || resolved.factionName || resolved.raceName || intent.subject || 'Ereignis',
        predicate: 'located_in',
        value: `Präsenz von ${intent.count || 'Gruppen'} in ${resolved.originName || intent.origin || 'der Region'} bekannt`,
        objectId: resolved.originId || undefined,
        objectName: resolved.originName || intent.origin || undefined,
        confidence: intent.confidence || 75
      });

      return {
        intent,
        resolvedContext: resolved,
        encounterForce: null,
        tacticalSpawnNeeded: false,
        validationWarnings: resolved.warnings,
        generatedFacts: [obsFact],
        status: 'info_only'
      };
    }

    // Fall B / C / D: Active Encounter
    const isAttack = Boolean(intent.attack || intent.objective === 'raid' || intent.objective === 'assault');
    const isMovement = Boolean(intent.movement && !isAttack);

    const initialStatus: EncounterForce['status'] = isAttack ? 'engaged' : isMovement ? 'moving' : 'detected';

    const encounterRes = this.createEncounterForce({
      name: intent.subject ? `${intent.count || ''} ${intent.subject}`.trim() : undefined,
      factionIdOrName: intent.faction,
      enemyTypeIdOrName: intent.enemyType || intent.subject,
      raceIdOrName: intent.race,
      leaderIdOrName: intent.leader,
      originIdOrName: intent.origin,
      targetIdOrName: intent.target,
      count: intent.count || 1,
      objective: intent.objective || (isAttack ? 'raid' : isMovement ? 'patrol' : 'scout'),
      hostility: intent.hostility || (isAttack ? 'hostile' : 'suspicious'),
      status: initialStatus,
      world,
      loreDatabase,
      characters,
      npcs
    });

    const tacticalNeeded = Boolean(isAttack && allowTacticalSpawn && combatState);
    let tacticalResult: ProcessWorldEventResult['tacticalResult'];

    if (tacticalNeeded && combatState) {
      const spawnRes = this.spawnEncounterForceToTactical({
        encounterForce: encounterRes.encounterForce,
        combatState,
        spawnSource: resolved.originName || 'forest_edge'
      });
      tacticalResult = spawnRes;
    }

    return {
      intent,
      resolvedContext: resolved,
      encounterForce: tacticalResult?.updatedEncounterForce || encounterRes.encounterForce,
      tacticalSpawnNeeded: tacticalNeeded,
      tacticalResult,
      validationWarnings: encounterRes.validationWarnings,
      generatedFacts: encounterRes.worldFacts,
      status: tacticalNeeded ? 'tactical_spawned' : 'force_created'
    };
  }

  // -------------------------------------------------------------
  // 7. Tactical Spawn Bridge
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

    // Tag the TacticalGroup and Entities with EncounterForce references and World Source Tracking
    const updatedGroup: TacticalGroup = {
      ...spawnResult.group,
      encounterForceId: encounterForce.id,
      enemyTypeId: encounterForce.enemyTypeId,
      raceId: encounterForce.raceId,
      factionId: encounterForce.factionId,
      sourceType: 'encounter_force',
      sourceId: encounterForce.id
    };

    const updatedEntities = spawnResult.entities.map((e, idx) => {
      const isLeader = idx === 0 && Boolean(encounterForce.leaderCharacterId);
      return {
        ...e,
        encounterForceId: encounterForce.id,
        enemyTypeId: encounterForce.enemyTypeId,
        raceId: encounterForce.raceId,
        factionId: encounterForce.factionId,
        sourceType: 'encounter_force',
        sourceId: encounterForce.id,
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
  // 8. Combat Result Feedback -> World State
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
  // 9. Grounding & Hypothesis Guard (Inference vs Canon)
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

  // -------------------------------------------------------------
  // 10. World State & Map Architecture Methods
  // -------------------------------------------------------------

  /**
   * Resolves a location / POI reference inside a given Territory or WorldSetting.
   * Maintains stable ID references (Location ID != name).
   */
  static resolveLocationReference(params: {
    idOrName?: string;
    territoryId?: string;
    world: WorldSetting;
    loreDatabase?: LoreEntry[];
  }): ResolutionResult<WorldLocationReference> {
    const { idOrName, territoryId, world, loreDatabase = world.loreDatabase || [] } = params;
    if (!idOrName) {
      return { value: null, status: 'unresolved', confidence: 0, reason: 'Keine Ortsbezeichnung angegeben' };
    }

    const trimmed = idOrName.trim();
    if (!trimmed) {
      return { value: null, status: 'unresolved', confidence: 0, reason: 'Leere Ortsbezeichnung' };
    }

    const normalized = this.normalizeStr(trimmed);

    // 1. Look in world.locations / dynamicWorldState.locations
    const existingLocs: WorldLocationReference[] = [
      ...(world.locations || []),
      ...Object.values(world.dynamicWorldState?.locations || {})
    ];

    // Exact ID match
    const idMatch = existingLocs.find(l => l.id === trimmed);
    if (idMatch) return { value: idMatch, status: 'resolved', confidence: 100, source: 'id' };

    // Exact Name match
    const nameMatch = existingLocs.find(l => l.name.toLowerCase() === trimmed.toLowerCase() && (!territoryId || l.territoryId === territoryId));
    if (nameMatch) return { value: nameMatch, status: 'resolved', confidence: 95, source: 'exact_name' };

    // Normalized Match
    const normMatch = existingLocs.find(l => this.normalizeStr(l.name) === normalized && (!territoryId || l.territoryId === territoryId));
    if (normMatch) return { value: normMatch, status: 'resolved', confidence: 90, source: 'normalized' };

    // 2. Search inside Territory markers, places, and POIs
    if (territoryId || world.territories) {
      const territoriesToSearch = territoryId ? world.territories?.filter(t => t.id === territoryId) : world.territories;
      if (territoriesToSearch && territoriesToSearch.length > 0) {
        for (const terr of territoriesToSearch) {
          // Search placeMarkers
          if (terr.placeMarkers) {
            const pm = terr.placeMarkers.find(m => m.id === trimmed || m.name.toLowerCase() === trimmed.toLowerCase() || this.normalizeStr(m.name) === normalized);
            if (pm) {
              const locRef: WorldLocationReference = {
                id: pm.id || `loc_${terr.id}_${this.normalizeStr(pm.name)}`,
                territoryId: terr.id,
                name: pm.name,
                type: pm.type || 'ort',
                x: pm.x,
                y: pm.y,
                description: pm.description,
                controlledByFactionId: terr.controlledByFactionId,
                ownerFactionId: terr.ownerFactionId
              };
              return { value: locRef, status: 'resolved', confidence: 85, source: 'fact' };
            }
          }
          // Search regionMarkers
          if (terr.regionMarkers) {
            const rm = terr.regionMarkers.find(m => m.id === trimmed || m.name.toLowerCase() === trimmed.toLowerCase() || this.normalizeStr(m.name) === normalized);
            if (rm) {
              const locRef: WorldLocationReference = {
                id: rm.id || `loc_${terr.id}_${this.normalizeStr(rm.name)}`,
                territoryId: terr.id,
                name: rm.name,
                type: rm.type || 'region',
                x: rm.x,
                y: rm.y,
                description: rm.description,
                controlledByFactionId: terr.controlledByFactionId
              };
              return { value: locRef, status: 'resolved', confidence: 85, source: 'fact' };
            }
          }
          // Match territory itself if requested
          if (terr.id === trimmed || terr.name.toLowerCase() === trimmed.toLowerCase() || this.normalizeStr(terr.name) === normalized) {
            const locRef: WorldLocationReference = {
              id: `loc_${terr.id}`,
              territoryId: terr.id,
              name: terr.name,
              type: terr.type || 'gebiet',
              x: terr.x,
              y: terr.y,
              description: terr.description,
              controlledByFactionId: terr.controlledByFactionId,
              ownerFactionId: terr.ownerFactionId,
              tileData: terr.tileData
            };
            return { value: locRef, status: 'resolved', confidence: 80, source: 'normalized' };
          }
        }
      }
    }

    // 3. Search LoreDatabase category 'Orte'
    const loreLoc = this.resolveLoreEntryDetailed(loreDatabase, trimmed, 'Orte');
    if (loreLoc.status === 'resolved' && loreLoc.value) {
      const terrId = territoryId || world.territories?.[0]?.id || 'territory_default';
      const locRef: WorldLocationReference = {
        id: `loc_${loreLoc.value.id}`,
        territoryId: terrId,
        name: loreLoc.value.title,
        type: 'ort',
        description: loreLoc.value.description,
        loreEntryId: loreLoc.value.id
      };
      return { value: locRef, status: 'resolved', confidence: loreLoc.confidence, source: loreLoc.source };
    }

    // Fallback: construct lightweight WorldLocationReference with stable ID
    const defaultTerrId = territoryId || world.territories?.[0]?.id || 'territory_default';
    const fallbackLoc: WorldLocationReference = {
      id: `loc_${defaultTerrId}_${normalized}`,
      territoryId: defaultTerrId,
      name: trimmed,
      type: 'ort',
      description: `Ort ${trimmed}`
    };

    return { value: fallbackLoc, status: 'resolved', confidence: 50, reason: 'Ort neu abgeleitet', source: 'fuzzy' };
  }

  /**
   * Derives tactical battle map parameters directly from location & territory data.
   * Priority: Location terrain/type -> Territory biome/terrain -> defaults.
   */
  static deriveBattleMapFromLocation(params: {
    territory?: Territory | null;
    location?: WorldLocationReference | null;
    gridWidth?: number;
    gridHeight?: number;
  }): {
    terrainType: string;
    biome: string;
    gridWidth: number;
    gridHeight: number;
    blockedCells: Record<string, boolean>;
    terrainCells: Record<string, string>;
    placedObjects: PlacedCombatObject[];
  } {
    const { territory, location, gridWidth = 30, gridHeight = 20 } = params;

    const terrainType = location?.terrainType || location?.type || territory?.terrain || territory?.biome || 'gras';
    const biome = territory?.biome || territory?.type || 'grasland';
    const placedObjects: PlacedCombatObject[] = [...(location?.placedObjects || [])];

    const blockedCells: Record<string, boolean> = {};
    const terrainCells: Record<string, string> = {};

    const tileData = location?.tileData || territory?.tileData;
    if (tileData && tileData.tiles) {
      Object.entries(tileData.tiles).forEach(([k, v]) => {
        terrainCells[k] = String(v);
        if (
          String(v).includes('water') ||
          String(v).includes('wall') ||
          String(v).includes('mountain') ||
          String(v).includes('blocked')
        ) {
          blockedCells[k] = true;
        }
      });
    }

    if (tileData && Array.isArray(tileData.placedObjects)) {
      tileData.placedObjects.forEach((obj: any, idx: number) => {
        if (obj && !placedObjects.some(p => p.id === obj.id)) {
          placedObjects.push({
            id: obj.id || `placed_obj_${idx}`,
            name: obj.name || 'Gebäude/Objekt',
            icon: obj.icon || 'building',
            x: obj.x || 0,
            y: obj.y || 0,
            category: obj.category || 'gebaeude',
            description: obj.description || 'Struktur vor Ort',
            condition: obj.condition || 'intact'
          });
        }
      });
    }

    return {
      terrainType,
      biome,
      gridWidth,
      gridHeight,
      blockedCells,
      terrainCells,
      placedObjects
    };
  }

  /**
   * Creates a BattleInstance anchoring a tactical battle to a specific Territory and Location.
   * Captures a terrain & object snapshot at battle start.
   */
  static createBattleInstance(params: {
    territoryId: string;
    locationIdOrName?: string;
    world: WorldSetting;
    loreDatabase?: LoreEntry[];
    participatingFactionIds?: string[];
    participatingCharacterIds?: string[];
    participatingEncounterForceIds?: string[];
    startedAtWorldTime?: WorldTime;
    gridWidth?: number;
    gridHeight?: number;
  }): {
    battleInstance: BattleInstance;
    location: WorldLocationReference | null;
    updatedWorld: WorldSetting;
    updatedCombatState: Partial<CombatState>;
  } {
    const {
      territoryId,
      locationIdOrName,
      world,
      loreDatabase = world.loreDatabase || [],
      participatingFactionIds = [],
      participatingCharacterIds = [],
      participatingEncounterForceIds = [],
      startedAtWorldTime = world.worldTime,
      gridWidth = 30,
      gridHeight = 20
    } = params;

    const terr = world.territories?.find(t => t.id === territoryId) || null;
    const locRes = locationIdOrName
      ? this.resolveLocationReference({ idOrName: locationIdOrName, territoryId, world, loreDatabase })
      : { value: null, status: 'unresolved' as const, confidence: 0 };

    const location = locRes.value;
    const derivedMap = this.deriveBattleMapFromLocation({ territory: terr, location, gridWidth, gridHeight });

    const battleId = `battle_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const battleInstance: BattleInstance = {
      id: battleId,
      territoryId,
      locationId: location?.id,
      locationName: location?.name || (terr ? terr.name : 'Unbekannter Schauplatz'),
      startedAtWorldTime,
      status: 'active',
      participatingFactionIds,
      participatingCharacterIds,
      participatingEncounterForceIds,
      tacticalGroupIds: [],
      terrainSnapshot: {
        terrainType: derivedMap.terrainType,
        biome: derivedMap.biome,
        gridWidth: derivedMap.gridWidth,
        gridHeight: derivedMap.gridHeight,
        blockedCells: derivedMap.blockedCells,
        terrainCells: derivedMap.terrainCells
      },
      objectSnapshot: {
        placedObjects: derivedMap.placedObjects
      },
      createdAt: Date.now()
    };

    const existingBattleInstances = { ...(world.dynamicWorldState?.battleInstances || {}) };
    existingBattleInstances[battleId] = battleInstance;

    const existingLocations = { ...(world.dynamicWorldState?.locations || {}) };
    if (location) {
      existingLocations[location.id] = location;
    }

    const updatedWorldState: DynamicWorldState = {
      ...(world.dynamicWorldState || {}),
      battleInstances: existingBattleInstances,
      locations: existingLocations,
      lastUpdated: Date.now()
    };

    const updatedWorldLocations = [...(world.locations || [])];
    if (location && !updatedWorldLocations.some(l => l.id === location.id)) {
      updatedWorldLocations.push(location);
    }

    const updatedWorld: WorldSetting = {
      ...world,
      dynamicWorldState: updatedWorldState,
      locations: updatedWorldLocations,
      battleInstances: [...(world.battleInstances || []), battleInstance]
    };

    const updatedCombatState: Partial<CombatState> = {
      battleInstanceId: battleId,
      territoryId,
      locationId: location?.id,
      locationName: battleInstance.locationName,
      gridWidth: derivedMap.gridWidth,
      gridHeight: derivedMap.gridHeight,
      placedObjects: derivedMap.placedObjects
    };

    return {
      battleInstance,
      location,
      updatedWorld,
      updatedCombatState
    };
  }

  /**
   * Concludes a BattleInstance and writes back changes to Territory control, Location damages, and EconomyHoldings.
   */
  static completeBattleInstance(params: {
    battleInstanceId?: string;
    combatResult: CombatResultFeedback;
    world: WorldSetting;
  }): {
    updatedWorld: WorldSetting;
    updatedBattleInstance: BattleInstance | null;
    changeLogs: WorldFactChangeLogEntry[];
    newFacts: WorldFact[];
  } {
    const { battleInstanceId, combatResult, world } = params;

    const bId = battleInstanceId || combatResult.battleInstanceId;
    const battleInstancesMap = { ...(world.dynamicWorldState?.battleInstances || {}) };
    const targetBattle = bId ? battleInstancesMap[bId] : null;

    // Idempotency check: if battle is already completed/retreated/aborted, return world without reapplying side effects
    if (targetBattle && targetBattle.status !== 'active' && targetBattle.status !== undefined) {
      return {
        updatedWorld: world,
        updatedBattleInstance: targetBattle,
        changeLogs: [],
        newFacts: []
      };
    }

    const baseResult = this.applyCombatResultToWorldState({ feedback: combatResult, world });
    let currentWorld = baseResult.updatedWorld;
    const changeLogs = [...baseResult.changeLogs];
    const newFacts = [...baseResult.newFacts];

    let updatedBattleInstance: BattleInstance | null = null;

    if (targetBattle) {
      const isCompleted = combatResult.outcome === 'victory' || combatResult.outcome === 'defeat';
      const status: BattleInstance['status'] = isCompleted
        ? 'completed'
        : combatResult.outcome === 'retreat'
        ? 'retreated'
        : 'aborted';

      updatedBattleInstance = {
        ...targetBattle,
        status,
        completedAt: Date.now(),
        result: {
          winnerFactionId: combatResult.outcome === 'victory' ? combatResult.factionId : undefined,
          casualties: { [combatResult.factionId || 'opponents']: combatResult.casualties || 0 },
          destroyedObjects: combatResult.destroyedObjectIds || [],
          damagedObjects: combatResult.damagedObjectIds || [],
          territoryChanges:
            combatResult.conqueredTerritoryId && combatResult.newControllingFactionId
              ? {
                  territoryId: combatResult.conqueredTerritoryId,
                  newFactionId: combatResult.newControllingFactionId
                }
              : undefined,
          locationChanges: combatResult.damageToTargetLocation
            ? {
                locationId: targetBattle.locationId,
                damageDescription: combatResult.damageToTargetLocation
              }
            : undefined,
          details: combatResult.details
        }
      };

      battleInstancesMap[targetBattle.id] = updatedBattleInstance;

      // 1. If territory conquered, update Territory.controlledByFactionId
      if (combatResult.conqueredTerritoryId && combatResult.newControllingFactionId && currentWorld.territories) {
        const updatedTerritories = currentWorld.territories.map(t => {
          if (t.id === combatResult.conqueredTerritoryId) {
            return { ...t, controlledByFactionId: combatResult.newControllingFactionId };
          }
          return t;
        });
        currentWorld = { ...currentWorld, territories: updatedTerritories };
      }

      // 2. Propagate economic impacts to EconomyHoldings
      const targetHoldingTerritoryId = targetBattle.territoryId;
      const configToUse = currentWorld.economyConfig || currentWorld.economy;

      if (configToUse && configToUse.holdings) {
        const updatedHoldings = configToUse.holdings.map(h => {
          const matchesTerritory = h.territoryId === targetHoldingTerritoryId;
          const matchesLocation =
            h.locationName &&
            targetBattle.locationName &&
            h.locationName.toLowerCase().includes(targetBattle.locationName.toLowerCase());

          if (matchesTerritory || matchesLocation) {
            const newStatus: typeof h.status = combatResult.conqueredTerritoryId
              ? 'under_siege'
              : combatResult.damagedObjectIds?.length || combatResult.damageToTargetLocation
              ? 'damaged'
              : h.status;

            const logEntry = {
              id: `econ_log_combat_${Date.now().toString(36)}`,
              timestamp: new Date().toISOString(),
              type: 'incident' as const,
              message: `Gefechtsfolgen an Standort: ${
                combatResult.damageToTargetLocation || 'Schäden oder Kontrollwechsel verzeichnet.'
              }`,
              severity: 'urgent' as const
            };

            return {
              ...h,
              status: newStatus,
              controlledByFactionId: combatResult.newControllingFactionId || h.controlledByFactionId,
              controlledByFactionName: combatResult.newControllingFactionId || h.controlledByFactionName,
              activityLogs: [logEntry, ...(h.activityLogs || [])]
            };
          }
          return h;
        });

        if (currentWorld.economyConfig) {
          currentWorld = {
            ...currentWorld,
            economyConfig: { ...currentWorld.economyConfig, holdings: updatedHoldings }
          };
        }
        if (currentWorld.economy) {
          currentWorld = {
            ...currentWorld,
            economy: { ...currentWorld.economy, holdings: updatedHoldings }
          };
        }
      }
    }

    const updatedWorldState: DynamicWorldState = {
      ...(currentWorld.dynamicWorldState || {}),
      battleInstances: battleInstancesMap,
      lastUpdated: Date.now()
    };

    const updatedWorld: WorldSetting = {
      ...currentWorld,
      dynamicWorldState: updatedWorldState,
      battleInstances:
        currentWorld.battleInstances?.map(b => (b.id === updatedBattleInstance?.id ? updatedBattleInstance : b)) || []
    };

    return {
      updatedWorld,
      updatedBattleInstance,
      changeLogs,
      newFacts
    };
  }
}
