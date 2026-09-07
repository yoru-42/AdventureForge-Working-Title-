import { 
  WorldSetting, 
  Territory, 
  LoreEntry, 
  Character, 
  EconomyHolding, 
  WorldFact, 
  WorldFactConflict, 
  WorldFactChangeLogEntry, 
  FactSourceType, 
  FactStatus, 
  KnowledgeType,
  RelevantWorldContextParams,
  RelevantWorldContextResult
} from '../types';

export const SOURCE_PRIORITY: Record<FactSourceType, number> = {
  author: 4,
  user: 3,
  established_story: 2,
  ai_inference: 1,
  calculated: 0,
};

export const CANON_PROTECTION_DIRECTIVE = `
### KANON-SCHUTZ & FAKTEN-KONSISTENZ (QUEST 4 KONSISTENZSCHICHT):
1. BEREITS BESTÄTIGTE FAKTEN SIND VERBINDLICHER KANON: Widersprich bestehenden Fakten der Spielwelt unter keinen Umständen.
2. KI-INFERENZEN SIND KEIN KANON: Neue Vermutungen, Ableitungen oder Plausibilitätsannahmen sind NIEMALS automatisch gesicherte Tatsachen. Formuliere sie im Erzählfluss als Annahmen, Gerüchte oder Beobachtungen.
3. QUELLEN-TREUE:
   - Fakten (Autor/Nutzer/Etabliert): Unumstößliche Realität.
   - Gerüchte (Rumors): Unbestätigte Erzählungen aus Tavernen oder Reisenden. Können falsch, übertrieben oder wahr sein.
   - Überzeugungen (Beliefs): Subjektive Sichtweisen von NPCs oder Fraktionen.
   - Berechnete Geometrie (Calculated): Mathematische Distanzen und Richtungen aus Koordinaten sind abgeleitete Daten und kein starrer Autor-Kanon.
4. UNBEKANNT BLEIBT UNBEKANNT: Regionen oder Zusammenhänge, die noch nicht erforscht oder definiert sind, dürfen nicht eigenmächtig als fester Kanon zementiert werden.
`;

export const GROUNDED_WORLD_AND_CHARACTER_DIRECTIVE = `
### KI-REGEL: GLAUBWÜRDIGKEIT, ALLTÄGLICHKEIT & BODENSTÄNDIGKEIT:

1. HARTER GRUNDSATZ FÜR DYNAMISCHE WELTEN:
   AdventureForge soll keine Welt voller Hauptcharaktere erzeugen. Die meisten Bewohner dürfen vollkommen gewöhnliche Menschen mit gewöhnlichen Problemen, Berufen, Beziehungen und Lebensgeschichten sein. Außergewöhnlichkeit muss begründet sein. Sie darf nicht als Standard verwendet werden, um einen Charakter interessanter wirken zu lassen.

2. PRIORITÄTSKETTE ("GEWÖHNLICH VOR AUSSERGEWÖHNLICH"):
   Bei der Beschreibung, Erstellung und Führung von Charakteren gilt folgende strikte Rangfolge:
   Bestehender Kontext
          ↓
   Welt / Ort / Beruf / Rolle
          ↓
   Beziehungen
          ↓
   Motivation
          ↓
   bisherige Ereignisse
          ↓
   Bedeutung des Charakters
          ↓
   erst danach außergewöhnliche Elemente

3. OPTIONALE GEHEIMNISSE:
   Ein Geheimnis ist vollkommen OPTIONAL. Wenn aus Welt, Charakter, Beziehungen, Fraktion oder bisherigen Ereignissen kein sinnvolles Geheimnis hervorgeht, darf keines erzeugt oder erfunden werden. Stufen-Geheimnisse bleiben erhalten, werden aber nur genutzt, wenn tatsächlich ein begründetes Geheimnis existiert.

4. HINTERGRUND-NPCS & SCHRITTWEISE VERTIEFUNG:
   Nicht jeder NPC muss sofort vollständig mit tiefer Geschichte generiert werden. Eine einfache, bodenständige Beschreibung (z. B. "Ein älterer Mann sitzt am Ecktisch und trinkt Bier") genügt vollkommen, solange die Figur im Hintergrund bleibt. Erst wenn der Spieler interagiert, der NPC storyrelevant wird oder ein Ereignis auslöst, entfaltet sich die Figur weiter.

5. PRÜFUNG DER CHARAKTER-BEDEUTUNG:
   Bevor einem NPC außergewöhnliche Eigenschaften, geheimnisvolle Mächte oder dramatische Geheimnisse gegeben werden, muss geprüft werden, ob der Charakter eine der folgenden Rollen einnimmt:
   - zentrale Storyfigur
   - wichtige Fraktionsfigur / Anführer / Herrscher
   - bedeutender Gegner oder Schlüssel-Questgeber
   - starke Verbindung zu einem aktiven Weltkonflikt
   - explizite Vorgabe des Nutzers
   Trifft keines dieser Kriterien zu, ist zwingend ein gewöhnlicher, glaubwürdiger Charakter zu wählen.

6. GESCHICHTEN ENTSTEHEN AUS EREIGNISSEN:
   Echte Geschichten entwickeln sich aus der Welt und aktuellen Ereignissen (z. B. Engpässe, Handelskrisen, Routineaufgaben), nicht aus gekünstelten, melodramatischen Vorgeschichten.
`;

export const WORLD_INTEGRATION_DIRECTIVE = `
### WORLDBUILDING-INTEGRATION & SITUATIONS-LOGIK:
1. WORLDBUILDING ALS EIGENER KONTEXT (HIERARCHISCHE EINBETTUNG):
   Charaktere existieren innerhalb einer Welt, nicht innerhalb einer isolierten Questliste. Berücksichtige die Hierarchie:
   Welt ➔ Region ➔ Stadt ➔ Bezirk ➔ Gebäude ➔ Beruf ➔ soziale Stellung ➔ Familie ➔ Beziehungen ➔ Wirtschaft ➔ Fraktionen ➔ lokale Ereignisse ➔ Gerüchte.
   Eine Tavernenbesitzerin interagiert mit Lieferanten, Gästen, Nachbarn, Wachen und Familie – ohne dass jeder von ihnen eine Quest hat.

2. VERBINDUNG STATT ISOLIERTE GENERIERUNG:
   Wenn Gruppen, Truppen, Feinde oder Ereignisse auftreten, verknüpfe sie logisch mit den existierenden Fraktionen, Rassen, Gegner-Definitionen, Charakteren und Weltkarten-Regionen des Codex.
   Ein Angriff von Fußsoldaten greift auf bestehende Fakten der Welt zurück.

3. NORMALITÄT & BODENSTÄNDIGE MOTIVATIONEN:
   Bevorzuge nachvollziehbare, alltägliche Ursachen (z.B. Nahrungskrise, Beutezug, Grenzstreit, Verteidigung, Routinepatrouille), statt automatisch dramatische Weltuntergangs-Szenarien oder uralte Kulte zu erfinden.

4. GEHEIMNISSE & INFERENZ-TREUE:
   Formuliere unbestätigte Phänomene als Beobachtung ("Sie wirken ungewöhnlich koordiniert"), nicht als vorzeitige Enthüllung geheimer Herrscher.
   Der Spieler erfährt nur, was in der Szene wahrnehmbar ist.

5. NAMENLOSE GRUPPEN:
   Erstelle für Masseneinheiten keine Dutzenden von Einzel-Charakteren, sondern beziehe dich auf die gemeinsame Gegner- und Fraktionsdefinition.
`;

export const ACTION_AND_TIMESKIP_DIRECTIVE = `
### VORRANG VON HANDLUNG VOR UMGEBUNGSBESCHREIBUNGEN & ZEITSPRÜNGE BEI RUHE/OHNMACHT:
1. MEHR HANDLUNG, WENIGER REINE UMGEBUNGSBESCHREIBUNG:
   - Der absolute Schwerpunkt deiner Erzählung MUSS auf aktiven Ereignissen, Handlungen, Entscheidungen, Reaktionen von NPCs und spürbarem Plot-Fortschritt liegen.
   - Vermeide ausschweifende, passive oder statische Beschreibungen von Räumen, Wänden, Böden, Möbeln, Lichtstimmungen oder Stille.
   - Maximal 1-2 kurze, wirkungsvolle Sätze zur Szenerie genügen völlig. Der gesamte Rest deiner Antwort muss aus lebendiger Handlung, Interaktion und Vorfällen bestehen!

2. SCHLAFEN, RASTEN, OHNMACHT & BEWUSSTLOSIGKEIT (AUTOMATISCHER ZEITSPRUNG & DIREKTE HANDLUNGSVORBEREITUNG):
   - Wenn der Spieler sich schlafen legt, schlafen geht, zur Ruhe begibt, rastet oder ohnmächtig/bewusstlos wird (z. B. "*legt sich schlafen*", "*schläft ein*", "*wird ohnmächtig*", "*bricht zusammen*"):
     * Bleibe NIEMALS in der Ruheszene stehen und verfalle nicht in Schilderungen von Stille, Dämmerlicht oder ruhigem Atmen.
     * Schildere das Einschlafen oder das Schwinden der Sinne in maximal 1-2 knappen Sätzen.
     * Mache ZWINGEND sofort einen automatischen ZEITSPRUNG bis zu dem Moment, an dem der Charakter wieder aufwacht (z. B. am nächsten Morgen oder nach einigen Stunden)!
     * Aktualisiere die Uhrzeit im [[STATUS: Zeit=HH:MM]] entsprechend weit nach vorne (+6 bis +8 Stunden für Nachtruhe, z. B. auf 07:00 Uhr am Morgen, bzw. +1 bis +3 Stunden bei Ohnmacht) und regeneriere HP/MP/Ausdauer.
     * BEREITE BEIM ERWACHEN SOFORT DIE NÄCHSTE HANDLUNG VOR (AKTIVER SZENENAUFHÄNGER):
       Der Spieler muss beim Aufwachen unmittelbar mit einem neuen Ereignis, einer Aktion oder einer Situation konfrontiert werden, worauf er in seiner nächsten Nachricht sofort reagieren und handeln kann!
       Beispiele: Ein lautes Pochen an der Zimmertür; eilige Schritte oder Stimmen im Flur; ein NPC betritt den Raum mit einer dringenden Botschaft oder einem Befehl; Sonnenlicht fällt durch die Fenster und draußen ertönt Lärm/Alarm; ein neuer Tag bricht an mit einer konkreten Dringlichkeit oder Aufgabe.
       Der Charakter darf nach dem Erwachen nicht im Stillstand verharren, sondern die nächste Handlung beginnt sofort!

3. AKTIVER SZENENAUFHÄNGER AM ANTWORT-ENDE (HANDLUNGSANGEBOT STATT PASSIVEM AUSKLINGEN):
   - Beende deine Antworten NIEMALS mit passivem Ausklingen in Leere, Stille oder Ticken einer Wanduhr.
   - Jede Antwort soll in einem aktiven Handlungsmoment gipfeln (eine Aktion eines NPCs, ein unerwartetes Geräusch, ein Eintreffen oder eine veränderte Lage), worauf der Spieler direkt mit seiner nächsten Nachricht reagieren kann (ohne billige Floskel-Fragen wie "Was tust du?").
`;

export class WorldKnowledgeService {
  /**
   * Evaluates if sourceNew has higher or equal priority over sourceOld
   */
  static canOverrideSource(sourceNew: FactSourceType, sourceOld: FactSourceType): boolean {
    return SOURCE_PRIORITY[sourceNew] >= SOURCE_PRIORITY[sourceOld];
  }

  /**
   * Generates a unique stable ID for a fact
   */
  static generateFactId(subjectId: string, predicate: string, objectIdOrValue?: any): string {
    const objPart = objectIdOrValue !== undefined ? `_${String(objectIdOrValue).slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}` : '';
    return `fact_${subjectId}_${predicate}${objPart}_${Date.now().toString(36)}`;
  }

  /**
   * Computes spatial geometry facts between territories based on actual coordinates.
   * Calculated spatial data is strictly separated from canonical author facts (sourceType: 'calculated', status: 'implied', knowledgeType: 'inference').
   */
  static deriveSpatialFacts(territories: Territory[], kmPerCoordUnit = 10): WorldFact[] {
    const facts: WorldFact[] = [];
    if (!territories || territories.length === 0) return facts;

    for (let i = 0; i < territories.length; i++) {
      const tA = territories[i];
      if (!tA.id || tA.x === undefined || tA.y === undefined) continue;

      // Fact: Parent container / located_in (calculated/implied unless explicit)
      if (tA.parentId) {
        const parentTerr = territories.find(p => p.id === tA.parentId);
        facts.push({
          id: `fact_${tA.id}_located_in_${tA.parentId}`,
          subjectId: tA.id,
          subjectName: tA.name,
          predicate: 'located_in',
          objectId: tA.parentId,
          objectName: parentTerr?.name || tA.parentId,
          sourceType: tA.sourceType || 'calculated',
          status: tA.sourceType ? 'known' : 'implied',
          knowledgeType: tA.sourceType ? 'fact' : 'inference',
          confidence: tA.sourceType ? 100 : 85,
          isCurrent: true,
          createdAt: Date.now()
        });
      }

      // Fact: Political control by faction
      if (tA.controlledByFactionId || tA.faction) {
        facts.push({
          id: `fact_${tA.id}_controls_${tA.controlledByFactionId || tA.faction}`,
          subjectId: tA.controlledByFactionId || tA.faction || 'unknown_faction',
          subjectName: tA.faction || 'Fraktion',
          predicate: 'controls',
          objectId: tA.id,
          objectName: tA.name,
          sourceType: tA.sourceType || 'calculated',
          status: tA.sourceType ? 'known' : 'implied',
          knowledgeType: tA.sourceType ? 'fact' : 'inference',
          confidence: tA.sourceType ? 100 : 85,
          isCurrent: true,
          createdAt: Date.now()
        });
      }

      // Derive spatial relations to other territories (distance & direction)
      for (let j = i + 1; j < territories.length; j++) {
        const tB = territories[j];
        if (!tB.id || tB.x === undefined || tB.y === undefined) continue;

        const dx = tB.x - tA.x;
        const dy = tB.y - tA.y;
        const distUnits = Math.sqrt(dx * dx + dy * dy);
        const distKm = Math.round(distUnits * kmPerCoordUnit);

        // Cardinal direction
        let relAtoB = 'east_of';
        let relBtoA = 'west_of';

        if (Math.abs(dy) > Math.abs(dx)) {
          if (dy > 0) {
            relAtoB = 'south_of'; // tB is south of tA in screen coords (y grows downward)
            relBtoA = 'north_of';
          } else {
            relAtoB = 'north_of';
            relBtoA = 'south_of';
          }
        } else {
          if (dx > 0) {
            relAtoB = 'east_of';
            relBtoA = 'west_of';
          } else {
            relAtoB = 'west_of';
            relBtoA = 'east_of';
          }
        }

        // Distance fact (calculated)
        facts.push({
          id: `fact_${tA.id}_distance_${tB.id}`,
          subjectId: tA.id,
          subjectName: tA.name,
          predicate: 'distance_from',
          objectId: tB.id,
          objectName: tB.name,
          value: { distKm, distUnits: Math.round(distUnits) },
          sourceType: 'calculated',
          status: 'implied',
          knowledgeType: 'inference',
          confidence: 90,
          isCurrent: true,
          createdAt: Date.now()
        });

        // Direction fact (calculated)
        facts.push({
          id: `fact_${tB.id}_dir_${tA.id}`,
          subjectId: tB.id,
          subjectName: tB.name,
          predicate: relAtoB,
          objectId: tA.id,
          objectName: tA.name,
          sourceType: 'calculated',
          status: 'implied',
          knowledgeType: 'inference',
          confidence: 85,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
    }

    return facts;
  }

  /**
   * Extracts facts from economy holdings
   */
  static extractHoldingFacts(holdings: EconomyHolding[]): WorldFact[] {
    const facts: WorldFact[] = [];
    if (!holdings) return facts;

    holdings.forEach(h => {
      // Ownership
      const ownerId = h.ownerType === 'character' ? (h.ownerCharacterId || h.assignedCharacterName || 'character')
        : h.ownerType === 'faction' ? (h.ownerFactionId || h.ownerFaction || 'faction')
        : 'player_group';
      const ownerName = h.assignedCharacterName || (h.ownerType === 'user' ? 'Spieler / Reisegruppe' : h.ownerFaction || 'Fraktion');

      facts.push({
        id: `fact_holding_${h.id}_owns_${ownerId}`,
        subjectId: ownerId,
        subjectName: ownerName,
        predicate: 'owns',
        objectId: h.id,
        objectName: h.name,
        sourceType: h.sourceType || 'established_story',
        status: h.factStatus || 'known',
        knowledgeType: 'fact',
        confidence: 100,
        isCurrent: true,
        validFrom: 'Spielstart',
        createdAt: Date.now()
      });

      // Location
      if (h.territoryId || h.locationName) {
        facts.push({
          id: `fact_holding_${h.id}_located_in_${h.territoryId || h.locationName}`,
          subjectId: h.id,
          subjectName: h.name,
          predicate: 'located_in',
          objectId: h.territoryId || undefined,
          objectName: h.locationName || 'Unbekanntes Gebiet',
          sourceType: h.sourceType || 'established_story',
          status: h.factStatus || 'known',
          knowledgeType: 'fact',
          confidence: 100,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
    });

    return facts;
  }

  /**
   * Extracts facts from codex lore database and characters
   */
  static extractCodexAndCharacterFacts(loreDatabase: LoreEntry[], characters: Character[]): WorldFact[] {
    const facts: WorldFact[] = [];

    (loreDatabase || []).forEach(l => {
      // Faction members or leadership
      if (l.category === 'Fraktionen') {
        if (l.details?.leader) {
          facts.push({
            id: `fact_faction_${l.id}_leads_${l.details.leader.replace(/\s+/g, '_')}`,
            subjectId: l.details.leader,
            subjectName: l.details.leader,
            predicate: 'leads',
            objectId: l.id,
            objectName: l.title,
            sourceType: l.sourceType || 'established_story',
            status: l.factStatus || 'known',
            knowledgeType: l.knowledgeType || 'fact',
            confidence: 95,
            isCurrent: true,
            createdAt: Date.now()
          });
        }
      }

      // Rumors / Secrets
      if (l.secretsStage2) {
        facts.push({
          id: `fact_rumor_${l.id}_stage2`,
          subjectId: l.id,
          subjectName: l.title,
          predicate: 'rumor_about',
          value: l.secretsStage2,
          sourceType: 'established_story',
          status: 'implied',
          knowledgeType: 'rumor',
          confidence: 60,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
    });

    (characters || []).forEach(c => {
      const cId = (c as any).id || c.name;
      const cFaction = (c as any).faction || c.appearance?.faction;
      if (cFaction) {
        facts.push({
          id: `fact_char_${cId}_member_of_${cFaction.replace(/\s+/g, '_')}`,
          subjectId: cId,
          subjectName: c.name,
          predicate: 'member_of',
          objectName: cFaction,
          sourceType: (c as any).sourceType || 'established_story',
          status: 'known',
          knowledgeType: 'fact',
          confidence: 100,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
      if (c.role) {
        facts.push({
          id: `fact_char_${cId}_role_${c.role.replace(/\s+/g, '_')}`,
          subjectId: cId,
          subjectName: c.name,
          predicate: 'profession_is',
          value: c.role,
          sourceType: (c as any).sourceType || 'established_story',
          status: 'known',
          knowledgeType: 'fact',
          confidence: 100,
          isCurrent: true,
          createdAt: Date.now()
        });
      }
    });

    return facts;
  }

  /**
   * Compiles the full unified registry of canon facts
   */
  static getAllWorldFacts(world: WorldSetting, loreDatabase: LoreEntry[] = [], characters: Character[] = []): WorldFact[] {
    const existingStored = world.facts || [];
    const derivedSpatial = this.deriveSpatialFacts(world.territories || [], world.mapConfig?.kmPerCoordinateUnit || 10);
    const holdingFacts = this.extractHoldingFacts(world.economyConfig?.holdings || world.economy?.holdings || []);
    const codexFacts = this.extractCodexAndCharacterFacts(loreDatabase, characters);

    // Merge by ID avoiding duplicates
    const factMap = new Map<string, WorldFact>();
    [...derivedSpatial, ...holdingFacts, ...codexFacts, ...existingStored].forEach(f => {
      const key = `${f.subjectId}__${f.predicate}__${f.objectId || f.value || ''}`;
      if (!factMap.has(key)) {
        factMap.set(key, f);
      } else {
        const prev = factMap.get(key)!;
        // higher source priority wins
        if (SOURCE_PRIORITY[f.sourceType] >= SOURCE_PRIORITY[prev.sourceType]) {
          factMap.set(key, f);
        }
      }
    });

    return Array.from(factMap.values());
  }

  /**
   * Checks if a proposed fact conflicts with any established fact
   */
  static checkFactConflict(existingFacts: WorldFact[], proposed: WorldFact): WorldFactConflict | null {
    // Inverse spatial predicates
    const spatialOpposites: Record<string, string> = {
      north_of: 'south_of',
      south_of: 'north_of',
      east_of: 'west_of',
      west_of: 'east_of',
    };

    for (const existing of existingFacts) {
      if (!existing.isCurrent) continue;

      // Check direct spatial contradiction (e.g. A is south_of B, but proposed says A is north_of B)
      if (
        existing.subjectId === proposed.subjectId &&
        existing.objectId === proposed.objectId &&
        spatialOpposites[existing.predicate] === proposed.predicate
      ) {
        return {
          id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          existingFact: existing,
          proposedFact: proposed,
          reason: `Räumlicher Widerspruch: "${existing.subjectName || existing.subjectId}" ist laut etabliertem Kanon ${existing.predicate} von "${existing.objectName || existing.objectId}", neue Angabe behauptet jedoch ${proposed.predicate}.`,
          severity: 'critical',
          detectedAt: Date.now(),
          resolved: false
        };
      }

      // Check single-value exclusivity (e.g. located_in, owns, controls, profession_is)
      const singleValuePredicates = ['located_in', 'controls', 'profession_is'];
      if (
        singleValuePredicates.includes(existing.predicate) &&
        existing.subjectId === proposed.subjectId &&
        existing.predicate === proposed.predicate
      ) {
        const existingVal = existing.objectId || existing.value;
        const proposedVal = proposed.objectId || proposed.value;

        if (existingVal && proposedVal && String(existingVal).toLowerCase() !== String(proposedVal).toLowerCase()) {
          // If proposed has lower priority, flag conflict
          if (!this.canOverrideSource(proposed.sourceType, existing.sourceType)) {
            return {
              id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
              existingFact: existing,
              proposedFact: proposed,
              reason: `Widerspruch bei ${existing.predicate}: Bestätigter Wert ist "${existing.objectName || existingVal}" (Quelle: ${existing.sourceType}), KI-Vorschlag war "${proposed.objectName || proposedVal}" (Quelle: ${proposed.sourceType}).`,
              severity: 'warning',
              detectedAt: Date.now(),
              resolved: false
            };
          }
        }
      }

      // Check holding ownership conflict
      if (
        existing.predicate === 'owns' &&
        proposed.predicate === 'owns' &&
        existing.objectId === proposed.objectId &&
        existing.subjectId !== proposed.subjectId
      ) {
        if (!this.canOverrideSource(proposed.sourceType, existing.sourceType)) {
          return {
            id: `conflict_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            existingFact: existing,
            proposedFact: proposed,
            reason: `Besitzkonflikt: "${existing.objectName || existing.objectId}" gehört laut Kanon "${existing.subjectName || existing.subjectId}", nicht "${proposed.subjectName || proposed.subjectId}".`,
            severity: 'critical',
            detectedAt: Date.now(),
            resolved: false
          };
        }
      }
    }

    return null;
  }

  /**
   * Consistency Pipeline: Validates a batch of proposed facts and applies them safely
   */
  static applyConsistencyPipeline(
    world: WorldSetting,
    proposedFacts: WorldFact[],
    source: FactSourceType,
    reason: string = 'KI Smart-Fill oder automatische Aktualisierung'
  ): {
    updatedWorld: WorldSetting;
    acceptedFacts: WorldFact[];
    newConflicts: WorldFactConflict[];
    changeLogs: WorldFactChangeLogEntry[];
  } {
    const currentFacts = [...(world.facts || [])];
    const conflicts: WorldFactConflict[] = [...(world.conflicts || [])];
    const changeLogs: WorldFactChangeLogEntry[] = [...(world.changeLog || [])];
    const acceptedFacts: WorldFact[] = [];
    const newConflicts: WorldFactConflict[] = [];

    proposedFacts.forEach(prop => {
      // Ensure source is tagged
      prop.sourceType = prop.sourceType || source;
      prop.createdAt = prop.createdAt || Date.now();

      // Check against existing facts
      const conflict = this.checkFactConflict(currentFacts, prop);

      if (conflict) {
        // Lower-priority inference never overwrites confirmed facts!
        if (!this.canOverrideSource(prop.sourceType, conflict.existingFact.sourceType)) {
          conflicts.push(conflict);
          newConflicts.push(conflict);
          // If proposed is an inference, store as 'proposal' or 'rumor' without breaking canon
          if (prop.knowledgeType === 'fact') {
            prop.knowledgeType = 'proposal';
            prop.status = 'implied';
          }
          return;
        } else {
          // Author/User override: Archive existing fact into historical state
          conflict.existingFact.isCurrent = false;
          conflict.existingFact.validTo = new Date().toISOString().split('T')[0];
          
          changeLogs.push({
            id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            entityId: prop.subjectId,
            entityName: prop.subjectName,
            entityType: 'fact',
            whatChanged: `${prop.predicate}: "${conflict.existingFact.objectName || conflict.existingFact.value}" -> "${prop.objectName || prop.value}"`,
            oldValue: conflict.existingFact.objectId || conflict.existingFact.value,
            newValue: prop.objectId || prop.value,
            source: prop.sourceType,
            reason,
            timestamp: Date.now()
          });
        }
      }

      currentFacts.push(prop);
      acceptedFacts.push(prop);
    });

    const updatedWorld: WorldSetting = {
      ...world,
      facts: currentFacts,
      conflicts,
      changeLog: changeLogs
    };

    return {
      updatedWorld,
      acceptedFacts,
      newConflicts,
      changeLogs
    };
  }

  /**
   * Resolves an open fact conflict explicitly
   */
  static resolveConflict(
    world: WorldSetting,
    conflictId: string,
    resolution: 'keep_existing' | 'accept_proposed' | 'convert_to_rumor' | 'custom',
    note?: string
  ): WorldSetting {
    const conflicts = (world.conflicts || []).map(c => {
      if (c.id !== conflictId) return c;
      return {
        ...c,
        resolved: true,
        resolvedBy: resolution,
        resolutionNote: note || `Konflikt aufgelöst: ${resolution}`
      };
    });

    const targetConflict = (world.conflicts || []).find(c => c.id === conflictId);
    if (!targetConflict) return { ...world, conflicts };

    let facts = [...(world.facts || [])];
    const changeLogs = [...(world.changeLog || [])];

    if (resolution === 'accept_proposed') {
      // Overwrite existing
      facts = facts.map(f => {
        if (f.id === targetConflict.existingFact.id) {
          return { ...f, isCurrent: false, validTo: new Date().toISOString().split('T')[0] };
        }
        return f;
      });
      facts.push({
        ...targetConflict.proposedFact,
        sourceType: 'user', // Author confirmed
        status: 'known',
        knowledgeType: 'fact',
        isCurrent: true
      });

      changeLogs.push({
        id: `log_resolve_${Date.now().toString(36)}`,
        entityId: targetConflict.proposedFact.subjectId,
        entityName: targetConflict.proposedFact.subjectName,
        entityType: 'fact',
        whatChanged: `Konfliktauflösung: Übernahme von ${targetConflict.proposedFact.predicate}`,
        oldValue: targetConflict.existingFact.objectId || targetConflict.existingFact.value,
        newValue: targetConflict.proposedFact.objectId || targetConflict.proposedFact.value,
        source: 'user',
        reason: note || 'Manuelle Konfliktauflösung durch Autor/Nutzer',
        timestamp: Date.now()
      });
    } else if (resolution === 'convert_to_rumor') {
      // Keep existing as truth, store proposed as rumor
      facts.push({
        ...targetConflict.proposedFact,
        knowledgeType: 'rumor',
        status: 'implied',
        confidence: 40,
        isCurrent: true,
        note: `Gerücht/Legende: ${targetConflict.reason}`
      });
    }

    return {
      ...world,
      facts,
      conflicts,
      changeLog: changeLogs
    };
  }

  /**
   * Recalculates spatial dependencies (e.g. distances, travel times) after a territory coordinate edit
   */
  static recalculateSpatialDependencies(
    changedTerritory: Territory,
    allTerritories: Territory[],
    connections: any[] = [],
    kmPerCoordUnit = 10
  ): {
    updatedConnections: any[];
    updatedFacts: WorldFact[];
  } {
    const updatedConnections = (connections || []).map(conn => {
      if (conn.fromId === changedTerritory.id || conn.toId === changedTerritory.id) {
        const otherId = conn.fromId === changedTerritory.id ? conn.toId : conn.fromId;
        const other = allTerritories.find(t => t.id === otherId);
        if (other && other.x !== undefined && other.y !== undefined) {
          const dx = other.x - changedTerritory.x;
          const dy = other.y - changedTerritory.y;
          const distUnits = Math.sqrt(dx * dx + dy * dy);
          const distKm = Math.round(distUnits * kmPerCoordUnit);
          const travelDays = Math.max(1, Math.round(distKm / 35));

          return {
            ...conn,
            distance: `${distKm} km`,
            travelTime: `${travelDays} Tag(e)`
          };
        }
      }
      return conn;
    });

    const updatedFacts = this.deriveSpatialFacts(
      allTerritories.map(t => t.id === changedTerritory.id ? changedTerritory : t),
      kmPerCoordUnit
    );

    return {
      updatedConnections,
      updatedFacts
    };
  }

  /**
   * Selective World Context Retrieval:
   * Instead of dumping the entire world, delivers only relevant, nearby, and topic-matched facts.
   */
  static getRelevantWorldContext(
    params: RelevantWorldContextParams,
    world: WorldSetting,
    loreDatabase: LoreEntry[] = [],
    characters: Character[] = []
  ): RelevantWorldContextResult {
    const territories = world.territories || [];
    const holdings = world.economyConfig?.holdings || world.economy?.holdings || [];
    const allFacts = this.getAllWorldFacts(world, loreDatabase, characters);
    const radius = params.radius || 35; // default coordinate distance

    // 1. Determine Current Location
    let currentLocation: Territory | null = null;
    if (params.locationId) {
      currentLocation = territories.find(t => t.id === params.locationId) || null;
    }
    if (!currentLocation && params.locationName) {
      currentLocation = territories.find(t => t.name.toLowerCase() === params.locationName!.toLowerCase()) || null;
    }
    if (!currentLocation && world.startLocationId) {
      currentLocation = territories.find(t => t.id === world.startLocationId) || null;
    }
    if (!currentLocation && territories.length > 0) {
      currentLocation = territories[0];
    }

    // 2. Nearby Territories
    const nearbyTerritories: Territory[] = [];
    if (currentLocation && currentLocation.x !== undefined && currentLocation.y !== undefined) {
      territories.forEach(t => {
        if (t.id === currentLocation!.id) return;
        if (t.x !== undefined && t.y !== undefined) {
          const dist = Math.sqrt(Math.pow(t.x - currentLocation!.x, 2) + Math.pow(t.y - currentLocation!.y, 2));
          if (dist <= radius) {
            nearbyTerritories.push(t);
          }
        }
      });
    }

    // 3. Relevant Holdings in Location & Nearby
    const targetLocIds = new Set<string>();
    if (currentLocation) {
      targetLocIds.add(currentLocation.id);
      targetLocIds.add(currentLocation.name.toLowerCase());
    }
    nearbyTerritories.forEach(t => {
      targetLocIds.add(t.id);
      targetLocIds.add(t.name.toLowerCase());
    });

    const relevantHoldings = holdings.filter(h => {
      if (h.territoryId && targetLocIds.has(h.territoryId)) return true;
      if (h.locationName && targetLocIds.has(h.locationName.toLowerCase())) return true;
      return false;
    });

    // 4. Relevant Characters
    const relevantCharacters: Character[] = [];
    const charIdSet = new Set(params.characterIds || []);
    characters.forEach(c => {
      const cId = (c as any).id || c.name;
      if (charIdSet.has(cId)) {
        relevantCharacters.push(c);
        return;
      }
      // Check if character is holding manager or matches topic
      if (relevantHoldings.some(h => h.assignedCharacterName === c.name || h.assignedCharacterId === cId)) {
        relevantCharacters.push(c);
        return;
      }
      if (params.topic && c.name.toLowerCase().includes(params.topic.toLowerCase())) {
        relevantCharacters.push(c);
      }
    });

    // 5. Relevant Codex Entries
    const topicKeywords = (params.topic || '').toLowerCase().split(/\s+/).filter(Boolean);
    const relevantCodexEntries = (loreDatabase || []).filter(l => {
      if (currentLocation && l.title.toLowerCase().includes(currentLocation.name.toLowerCase())) return true;
      if (topicKeywords.some(kw => l.title.toLowerCase().includes(kw) || l.description.toLowerCase().includes(kw))) return true;
      if (relevantHoldings.some(h => h.loreEntryId === l.id || h.name.toLowerCase() === l.title.toLowerCase())) return true;
      return false;
    }).slice(0, 10);

    // 6. Relevant Connections
    const relevantConnections = (world.connections || []).filter(c => {
      if (!currentLocation) return true;
      return c.fromId === currentLocation.id || c.toId === currentLocation.id ||
             (c.fromPlace && c.fromPlace.toLowerCase() === currentLocation.name.toLowerCase()) ||
             (c.toPlace && c.toPlace.toLowerCase() === currentLocation.name.toLowerCase());
    });

    // 7. Relevant Facts & Rumors
    const relevantFacts: WorldFact[] = [];
    const activeRumors: WorldFact[] = [];

    allFacts.forEach(f => {
      const isTargetSubject = currentLocation && (f.subjectId === currentLocation.id || f.objectId === currentLocation.id);
      const isNearbySubject = nearbyTerritories.some(n => f.subjectId === n.id || f.objectId === n.id);
      const isCharSubject = relevantCharacters.some(c => f.subjectId === ((c as any).id || c.name) || f.subjectId === c.name);

      if (isTargetSubject || isNearbySubject || isCharSubject) {
        if (f.knowledgeType === 'rumor') {
          activeRumors.push(f);
        } else {
          relevantFacts.push(f);
        }
      }
    });

    // 8. Unresolved Conflicts (filtered by relevance to location, characters, holdings or topic)
    const unresolvedConflicts = (world.conflicts || []).filter(c => {
      if (c.resolved) return false;
      const f1 = c.existingFact;
      const f2 = c.proposedFact;
      const entityIds = new Set<string>();
      if (currentLocation) {
        entityIds.add(currentLocation.id.toLowerCase());
        entityIds.add(currentLocation.name.toLowerCase());
      }
      nearbyTerritories.forEach(t => {
        entityIds.add(t.id.toLowerCase());
        entityIds.add(t.name.toLowerCase());
      });
      relevantCharacters.forEach(rc => {
        entityIds.add(((rc as any).id || rc.name).toLowerCase());
        entityIds.add(rc.name.toLowerCase());
      });
      relevantHoldings.forEach(h => {
        entityIds.add(h.id.toLowerCase());
        entityIds.add(h.name.toLowerCase());
      });

      const matchEntity = (fact: WorldFact) => {
        const sId = (fact.subjectId || '').toLowerCase();
        const sName = (fact.subjectName || '').toLowerCase();
        const oId = (fact.objectId || '').toLowerCase();
        const oName = (fact.objectName || '').toLowerCase();
        return entityIds.has(sId) || entityIds.has(sName) || entityIds.has(oId) || entityIds.has(oName);
      };

      if (matchEntity(f1) || matchEntity(f2)) return true;

      if (params.topic) {
        const tLower = params.topic.toLowerCase();
        if (c.reason.toLowerCase().includes(tLower) || f1.subjectName?.toLowerCase().includes(tLower) || f2.subjectName?.toLowerCase().includes(tLower)) {
          return true;
        }
      }

      return false;
    });

    // 9. Build Context Summary Text
    const summaryLines: string[] = [];
    summaryLines.push(`### LOKALER WELT-KONTEXT (${currentLocation ? currentLocation.name : 'Unbekannter Standort'}):`);
    
    if (currentLocation) {
      summaryLines.push(`- Aktueller Ort: "${currentLocation.name}" [${currentLocation.type}] (${currentLocation.climate || 'Gemäßigt'}, Herrschaft: ${currentLocation.faction || 'Neutral'})`);
      if (currentLocation.description) {
        summaryLines.push(`  Beschreibung: ${currentLocation.description.slice(0, 250)}`);
      }
    }

    if (nearbyTerritories.length > 0) {
      summaryLines.push(`- Benachbarte Gebiete (in Reichweite): ${nearbyTerritories.map(t => `"${t.name}" (${t.type})`).join(', ')}`);
    }

    if (relevantHoldings.length > 0) {
      summaryLines.push(`- Lokale Betriebe & Einrichtungen:`);
      relevantHoldings.forEach(h => {
        summaryLines.push(`  * ${h.name} (${h.type}, Stufe ${h.level}) - Betreiber: ${h.assignedCharacterName || 'Nutzer/NPC'}`);
      });
    }

    if (relevantConnections.length > 0) {
      summaryLines.push(`- Bekannte Routen & Reisewege:`);
      relevantConnections.forEach(c => {
        summaryLines.push(`  * Nach "${c.toPlace || c.label || 'Ziel'}" (Distanz: ${c.distance || 'k.A.'}, Dauer: ${c.travelTime || 'k.A.'})`);
      });
    }

    if (activeRumors.length > 0) {
      summaryLines.push(`- Lokale Gerüchte & Legenden (UNBESTÄTIGT):`);
      activeRumors.slice(0, 3).forEach(r => {
        summaryLines.push(`  * [Gerücht] ${r.subjectName}: ${r.value || r.note || 'Unklare Erzählungen'}`);
      });
    }

    return {
      currentLocation,
      nearbyTerritories,
      relevantHoldings,
      relevantCodexEntries,
      relevantCharacters,
      relevantFacts,
      relevantConnections,
      activeRumors,
      unresolvedConflicts,
      contextSummaryText: summaryLines.join('\n')
    };
  }
}
