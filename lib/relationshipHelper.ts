import { Character, CharacterRelationship, LoreEntry, MotivationCore, NPC } from '../types';

/**
 * Formats a character's motivation core into a clean, structured string for the Story AI.
 */
export function formatMotivationCoreForAI(core?: MotivationCore): string {
  if (!core) return '';
  const parts: string[] = [];
  if (core.mainGoal) parts.push(`Hauptziel: ${core.mainGoal}`);
  if (core.whyGoal) parts.push(`Warum dieses Ziel?: ${core.whyGoal}`);
  if (core.currentPriorities) parts.push(`Aktuelle Prioritäten: ${core.currentPriorities}`);
  if (core.needs) parts.push(`Bedürfnisse: ${core.needs}`);
  if (core.fears) parts.push(`Ängste: ${core.fears}`);
  if (core.valuesPrinciples) parts.push(`Werte/Prinzipien: ${core.valuesPrinciples}`);
  if (core.methodsAndMeans) parts.push(`Methoden/Mittel: ${core.methodsAndMeans}`);
  if (core.changeTriggers) parts.push(`Veränderungsauslöser: ${core.changeTriggers}`);

  if (parts.length === 0) return '';
  return `Motivationskern:\n    - ${parts.join('\n    - ')}`;
}

/**
 * Formats a character relationship into a strict, binding directive for the Story AI.
 */
export function formatRelationshipForAI(rel: CharacterRelationship, sourceCharName: string): string {
  const parts: string[] = [];

  const selfName = sourceCharName || 'Charakter A';
  const targetName = rel.targetCharacter || 'Zielcharakter';

  // 1. Grundbeziehung & Phase
  let header = `Beziehung (${selfName} ↔ ${targetName}): ${rel.type || 'Verbunden'}`;
  if (rel.relationshipStatus) {
    header += ` [Aktuelle Beziehungsphase: ${rel.relationshipStatus}]`;
  }
  parts.push(header);

  // 2. Anreden & Spitznamen (STRENG BINDEND)
  if (rel.addressFromSelfToTarget || rel.addressFromTargetToSelf) {
    const selfToTarget = rel.addressFromSelfToTarget ? `'${rel.addressFromSelfToTarget}'` : 'Standard-Anrede';
    const targetToSelf = rel.addressFromTargetToSelf ? `'${rel.addressFromTargetToSelf}'` : 'Standard-Anrede';
    parts.push(`[VERBINDLICHE ANREDE-REGEL: ${selfName} nennt ${targetName}: ${selfToTarget} | ${targetName} nennt ${selfName}: ${targetToSelf}]`);
  }

  // 3. Verhalten & Verhaltensdynamik
  if (rel.behavior) {
    parts.push(`[VERHALTENSDYNAMIK: ${rel.behavior}]`);
  }

  // 4. KI-Regieanweisung
  if (rel.aiDirectives) {
    parts.push(`[REGIEANWEISUNG STORY-KI: ${rel.aiDirectives}]`);
  }

  // 5. Wahrnehmung & Grenzen
  if (rel.perceptionSelfToTarget) {
    parts.push(`[WAHRNEHMUNG ${selfName} ➔ ${targetName}: ${rel.perceptionSelfToTarget}]`);
  }
  if (rel.perceptionTargetToSelf) {
    parts.push(`[WAHRNEHMUNG ${targetName} ➔ ${selfName}: ${rel.perceptionTargetToSelf}]`);
  }
  if (rel.boundariesAndTaboos) {
    parts.push(`[GRENZEN & TABUS (Unverrückbar): ${rel.boundariesAndTaboos}]`);
  }
  if (rel.secretsAndMotives) {
    parts.push(`[GEHEIMNISSE & ABSICHTEN: ${rel.secretsAndMotives}]`);
  }

  // 6. Vergangenheit & Erinnerungen (Unveränderliche Fakten)
  if (rel.sharedPast) {
    parts.push(`[GEMEINSAME VERGANGENHEIT (Faktum - Unveränderlich): ${rel.sharedPast}]`);
  }
  if (rel.keyMemories) {
    parts.push(`[WICHTIGE ERINNERUNGEN: ${rel.keyMemories}]`);
  }

  // 7. Direktionale Beziehungswerte (Dynamisch durch In-Game Ereignisse)
  if (rel.valuesSelfToTarget) {
    const v = rel.valuesSelfToTarget;
    parts.push(
      `[DYNAMISCHE HALTUNG ${selfName} ➔ ${targetName}: Zuneigung=${v.affection ?? 0}, Vertrauen=${v.trust ?? 50}%, Respekt=${v.respect ?? 50}%, Loyalität=${v.loyalty ?? 50}%, Vertrautheit=${v.familiarity ?? 30}%, Angst=${v.fear ?? 0}%, Bindung=${v.bond ?? 30}%, Feindseligkeit=${v.hostility ?? 0}%]`
    );
  }

  if (rel.valuesTargetToSelf) {
    const v = rel.valuesTargetToSelf;
    parts.push(
      `[DYNAMISCHE HALTUNG ${targetName} ➔ ${selfName}: Zuneigung=${v.affection ?? 0}, Vertrauen=${v.trust ?? 50}%, Respekt=${v.respect ?? 50}%, Loyalität=${v.loyalty ?? 50}%, Vertrautheit=${v.familiarity ?? 30}%, Angst=${v.fear ?? 0}%, Bindung=${v.bond ?? 30}%, Feindseligkeit=${v.hostility ?? 0}%]`
    );
  }

  // 8. Schlüsselereignisse
  if (rel.keyEvents && rel.keyEvents.length > 0) {
    const eventsStr = rel.keyEvents.map(e => `${e.title}${e.dateOrChapter ? ` (${e.dateOrChapter})` : ''}: ${e.description}${e.impact ? ` [Auswirkung: ${e.impact}]` : ''}`).join('; ');
    parts.push(`[BEZIEHUNGS-EREIGNISSE (Historischer Kanon): ${eventsStr}]`);
  }

  parts.push(`[BEZIEHUNGS-TRENNUNG: Verwandtschaft, historische Fakten und Vergangenheit stehen fest. Nur Vertrauen, Respekt, Angst, Bindung und Haltung entwickeln sich dynamisch durch echte Ereignisse.]`);

  return parts.join(' ');
}

/**
 * Formats an NPC object for the Story AI prompt context.
 */
export function formatNPCForAIPrompt(n: NPC): string {
  const motivationStr = formatMotivationCoreForAI(n.motivationCore);
  const relsStr = (n.relationships && n.relationships.length > 0)
    ? n.relationships.map(r => formatRelationshipForAI(r, n.name)).join('\n        * ')
    : (n.relationship ? `Beziehung: ${n.relationship}` : 'Keine spezifischen Beziehungs-Einträge');

  return `
      NPC: ${n.name} (${n.role})
      - NAMENS-FELDER (ABSOLUTE PRIORITÄT): Name des Charakters: "${n.name}" | Rufname (Kampfanzeige): "${n.rufName || n.name}" | Spitzname/Alias: "${n.nickname || 'Keiner'}"
      - [MANDATORISCHE NAMENSREGEL: Für diesen NPC dürfen AUSSCHLIESSLICH die oben genannten Namensfelder verwendet werden. Alle abweichenden Namen sind strengstens verboten!]
      - Portrait: ${n.image ? 'Vorhanden' : 'Keins'}
      - Aussehen: ${n.appearance.gender}, ${n.appearance.age}J, ${n.appearance.build}, Haare: ${n.appearance.hairColor}, Kleidung: ${n.appearance.outfit || 'Standard'}${n.appearance.gender === 'Weiblich' && n.appearance.cupSize && n.appearance.cupSize !== '-' ? `, Körbchen: ${n.appearance.cupSize}` : ''}${n.appearance.currentLocation ? `, Aktueller Standort: ${n.appearance.currentLocation}` : ''}
      - Vergangenheit: ${n.bio}
      - Aktuelle Situation: ${n.currentSituation || 'Wartet auf Interaktion'}
      - Ziel: ${n.goal || 'Unbekannt'}
      ${motivationStr ? `- ${motivationStr}\n      ` : ''}- Detaillierte Beziehungen:
        * ${relsStr}
      - Fähigkeiten/Jutsus: ${n.skills || 'Unbekannt'}
      - Gesinnung: ${n.isHostile ? 'Feindselig' : 'Freundlich'}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${n.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${n.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${n.secretsStage3 || 'Keine'}
        * Verhüllung & Geteiltes Wissen (Wer weiß was?): ${n.knowledge || 'Keine Angabe (NPCs wissen standardmäßig nur das, was sie im Laufe der Geschichte direkt miterlebt oder erzählt bekommen haben)'}`;
}

/**
 * Formats the Player object for the Story AI prompt context.
 */
export function formatPlayerForAIPrompt(player: Character, physicalStatusSummary: string, abilitiesFormat: string, powerInstruction: string, inventorySummary: string): string {
  const motivationStr = formatMotivationCoreForAI(player.motivationCore);
  const relsStr = (player.relationships && player.relationships.length > 0)
    ? player.relationships.map(r => formatRelationshipForAI(r, player.name)).join('\n        * ')
    : 'Keine spezifischen Beziehungs-Einträge';

  const activeTransId = player.appearance?.activeTransformationId || 'standard';
  const activeTrans = activeTransId !== 'standard'
    ? (player.abilities || []).find(a => a.id === activeTransId && a.category === 'Transformationen')
    : null;

  let transFieldsStr = '';
  if (activeTrans) {
    const tName = activeTrans.transformName && activeTrans.transformName.trim()
      ? `"${activeTrans.transformName.trim()}"`
      : 'LEER (NOCH UNBENANNTE FORM - Der Nutzer oder NPCs können dieser Verwandlung im Spielverlauf einen Namen/Titel geben!)';
    const tRufName = activeTrans.transformRufName && activeTrans.transformRufName.trim()
      ? `"${activeTrans.transformRufName.trim()}"`
      : 'LEER (Kein Rufname)';
    transFieldsStr = `
        * AKTIVE TRANSFORMATION ("${activeTrans.name}"):
          - Name der Transformation: ${tName}
          - Rufname (Kampfanzeige) in dieser Form: ${tRufName}`;
  }

  return `
      SPIELER-CHARAKTER:
      - NAMENS-FELDER (ABSOLUTE PRIORITÄT):
        * Name des Charakters: "${player.name}"
        * Rufname (Kampfanzeige): "${player.rufName || player.name}"
        * Spitzname / Titel / Alias: "${player.nickname || 'Keiner'}"${transFieldsStr}
      - [MANDATORISCHE NAMENS- & ANREDEPRIORITÄT: Für die Benennung und Anrede des Spielers/Charakters gelten AUSSCHLIESSLICH diese festgelegten Felder (Name, Rufname, Spitzname/Alias, Transformation). Es ist der KI und allen NPCs ABSOLUT VERBOTEN, abweichende oder fremde Namen zu verwenden! Wenn ein Transformationsname LEER ist, gilt die Gestalt als unbenannt und kann im Spielverlauf vom Spieler oder NPCs benannt werden!]
      ${player.name} (${player.role}). 
      - Aussehen & Physischer Status: ${physicalStatusSummary}
      - Bio: ${player.bio}
      - Aktuelle Lage: ${player.currentSituation}
      - Ziel: ${player.goal}
      ${motivationStr ? `- ${motivationStr}\n      ` : ''}- Kräfte & Fähigkeiten: ${abilitiesFormat}${powerInstruction}
      - Aktuelle Ausrüstung & Inventar:
        - ${inventorySummary}
      - Detaillierte Beziehungen des Spielers:
        * ${relsStr}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${player.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${player.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${player.secretsStage3 || 'Keine'}
        * Verhüllung & Geteiltes Wissen (Wer weiß was?): ${player.knowledge || 'Keine Angabe (andere Charaktere wissen standardmäßig nur das, was sie im Laufe der Geschichte direkt miterlebt oder erzählt bekommen haben)'}`;
}

/**
 * Erzeugt oder aktualisiert das spiegelbildliche Gegenstück einer Beziehung für den Zielcharakter.
 * Tauscht dabei logisch die Perspektiven:
 * - valuesSelfToTarget <-> valuesTargetToSelf
 * - addressFromSelfToTarget <-> addressFromTargetToSelf
 * - perceptionSelfToTarget <-> perceptionTargetToSelf
 */
export function createCounterpartRelationship(
  sourceCharName: string,
  rel: CharacterRelationship,
  existingCounterpartId?: string
): CharacterRelationship {
  return {
    id: existingCounterpartId || `${Date.now()}-counterpart-${Math.random().toString(36).substr(2, 5)}`,
    targetCharacter: sourceCharName,
    type: rel.type || '',
    relationshipStatus: rel.relationshipStatus || '',
    // Perspektiven tauschen
    addressFromSelfToTarget: rel.addressFromTargetToSelf || '',
    addressFromTargetToSelf: rel.addressFromSelfToTarget || '',
    behavior: rel.behavior || '',
    aiDirectives: rel.aiDirectives || '',
    // Wahrnehmung tauschen
    perceptionSelfToTarget: rel.perceptionTargetToSelf || '',
    perceptionTargetToSelf: rel.perceptionSelfToTarget || '',
    secretsAndMotives: rel.secretsAndMotives || '',
    boundariesAndTaboos: rel.boundariesAndTaboos || '',
    sharedPast: rel.sharedPast || '',
    keyMemories: rel.keyMemories || '',
    // Direktionale Werte exakt spiegeln/tauschen
    valuesSelfToTarget: rel.valuesTargetToSelf ? { ...rel.valuesTargetToSelf } : undefined,
    valuesTargetToSelf: rel.valuesSelfToTarget ? { ...rel.valuesSelfToTarget } : undefined,
    keyEvents: Array.isArray(rel.keyEvents) ? rel.keyEvents.map(e => ({ ...e })) : [],
    _isCustom: rel._isCustom || false
  };
}

/**
 * Synchronisiert alle Beziehungen eines Quellcharakters wechselseitig mit den Zielcharakteren im Codex.
 */
export function syncLoreWithReciprocalRelationships(
  loreList: LoreEntry[],
  sourceEntryTitle: string,
  sourceRelationships: CharacterRelationship[]
): LoreEntry[] {
  if (!sourceEntryTitle || !Array.isArray(loreList) || loreList.length === 0) {
    return loreList;
  }

  const cleanSourceTitle = sourceEntryTitle.trim().toLowerCase();
  let updatedLore = [...loreList];

  // 1. Quell-Eintrag selbst im Codex aktualisieren, falls vorhanden
  const sourceIdx = updatedLore.findIndex(entry => {
    const matchTitle = entry.title?.trim().toLowerCase() === cleanSourceTitle;
    const matchRufName = entry.details?.rufName?.trim().toLowerCase() === cleanSourceTitle;
    return matchTitle || matchRufName;
  });

  if (sourceIdx >= 0) {
    updatedLore[sourceIdx] = {
      ...updatedLore[sourceIdx],
      details: {
        ...(updatedLore[sourceIdx].details || {}),
        relationships: sourceRelationships
      }
    };
  }

  // 2. Wechselseitige Gegenbeziehungen bei allen Zielcharakteren aktualisieren
  (sourceRelationships || []).forEach(rel => {
    const targetName = rel.targetCharacter?.trim();
    if (!targetName) return;

    const cleanTargetName = targetName.toLowerCase();
    if (cleanTargetName === cleanSourceTitle) return; // Nicht mit sich selbst verknüpfen

    // Finde den Zielcharakter im Codex
    const targetIdx = updatedLore.findIndex(entry => {
      const matchTitle = entry.title?.trim().toLowerCase() === cleanTargetName;
      const matchRufName = entry.details?.rufName?.trim().toLowerCase() === cleanTargetName;
      return matchTitle || matchRufName;
    });

    if (targetIdx >= 0) {
      const targetEntry = updatedLore[targetIdx];
      const existingRels: CharacterRelationship[] = [
        ...(targetEntry.details?.relationships || [])
      ];

      // Suche nach einer bestehenden Beziehung zum Quellcharakter
      const existingRelIdx = existingRels.findIndex(r => {
        const rTarget = r.targetCharacter?.trim().toLowerCase();
        return rTarget === cleanSourceTitle;
      });

      const existingCounterpartId = existingRelIdx >= 0 ? existingRels[existingRelIdx].id : undefined;
      const counterpartRel = createCounterpartRelationship(sourceEntryTitle, rel, existingCounterpartId);

      if (existingRelIdx >= 0) {
        existingRels[existingRelIdx] = counterpartRel;
      } else {
        existingRels.push(counterpartRel);
      }

      updatedLore[targetIdx] = {
        ...targetEntry,
        details: {
          ...(targetEntry.details || {}),
          relationships: existingRels
        }
      };
    }
  });

  return updatedLore;
}

/**
 * Entfernt die Gegenbeziehung aus dem Zielcharakter im Codex, falls eine Beziehung gelöscht wird.
 */
export function removeCounterpartRelationshipFromLore(
  loreList: LoreEntry[],
  sourceCharName: string,
  targetCharName: string
): LoreEntry[] {
  if (!sourceCharName || !targetCharName || !Array.isArray(loreList)) return loreList;

  const cleanSource = sourceCharName.trim().toLowerCase();
  const cleanTarget = targetCharName.trim().toLowerCase();

  return loreList.map(entry => {
    const isTarget = entry.title?.trim().toLowerCase() === cleanTarget ||
                     entry.details?.rufName?.trim().toLowerCase() === cleanTarget;
    if (!isTarget) return entry;

    const currentRels: CharacterRelationship[] = entry.details?.relationships || [];
    const filteredRels = currentRels.filter(r => r.targetCharacter?.trim().toLowerCase() !== cleanSource);

    return {
      ...entry,
      details: {
        ...(entry.details || {}),
        relationships: filteredRels
      }
    };
  });
}

