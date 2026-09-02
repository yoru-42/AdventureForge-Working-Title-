import { CharacterRelationship, LoreEntry } from '../types';

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

  // 6. Vergangenheit & Erinnerungen
  if (rel.sharedPast) {
    parts.push(`[GEMEINSAME VERGANGENHEIT: ${rel.sharedPast}]`);
  }
  if (rel.keyMemories) {
    parts.push(`[WICHTIGE ERINNERUNGEN: ${rel.keyMemories}]`);
  }

  // 7. Direktionale Beziehungswerte
  if (rel.valuesSelfToTarget) {
    const v = rel.valuesSelfToTarget;
    parts.push(
      `[WERTE ${selfName} ➔ ${targetName}: Zuneigung=${v.affection ?? 0}, Vertrauen=${v.trust ?? 50}%, Respekt=${v.respect ?? 50}%, Loyalität=${v.loyalty ?? 50}%, Vertrautheit=${v.familiarity ?? 30}%, Angst=${v.fear ?? 0}%, Bindung=${v.bond ?? 30}%, Feindseligkeit=${v.hostility ?? 0}%]`
    );
  }

  if (rel.valuesTargetToSelf) {
    const v = rel.valuesTargetToSelf;
    parts.push(
      `[WERTE ${targetName} ➔ ${selfName}: Zuneigung=${v.affection ?? 0}, Vertrauen=${v.trust ?? 50}%, Respekt=${v.respect ?? 50}%, Loyalität=${v.loyalty ?? 50}%, Vertrautheit=${v.familiarity ?? 30}%, Angst=${v.fear ?? 0}%, Bindung=${v.bond ?? 30}%, Feindseligkeit=${v.hostility ?? 0}%]`
    );
  }

  // 8. Schlüsselereignisse
  if (rel.keyEvents && rel.keyEvents.length > 0) {
    const eventsStr = rel.keyEvents.map(e => `${e.title}${e.dateOrChapter ? ` (${e.dateOrChapter})` : ''}: ${e.description}${e.impact ? ` [Auswirkung: ${e.impact}]` : ''}`).join('; ');
    parts.push(`[SCHLÜSSELERSEIGNISSE: ${eventsStr}]`);
  }

  return parts.join(' ');
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

