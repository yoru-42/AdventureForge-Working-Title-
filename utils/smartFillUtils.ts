import { SmartFillContext, SmartFillSection, RelationshipsSmartFillScope, AbilitiesSmartFillScope } from '../types';
import {
  generatePowerSystemId,
  generateCharacterPowerId,
  generateCharacterAbilityId,
  generateCharacterTechniqueId,
  generateCharacterPowerFormId
} from './abilityHierarchy';

/**
 * Wandelt unstrukturierte KI-Rückgabewerte in eine sichere Zeichenkette um.
 */
function getSafeString(val: any): string {
  if (typeof val === 'string') return val.trim();
  if (val && typeof val === 'object') return (val.name || val.title || val.callName || val.rufName || '').toString().trim();
  return val !== undefined && val !== null ? String(val).trim() : '';
}

/**
 * Erzeugt eine deterministische, stabile ID für Beziehungen ohne Date.now() oder Math.random().
 */
export function generateDeterministicRelationshipId(ownerId: string, targetCharacterName: string, index: number = 0): string {
  const cleanOwner = (ownerId || 'char').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTarget = (targetCharacterName || 'target').toLowerCase().replace(/[^a-z0-9]/g, '');
  const slug = `rel_${cleanOwner}_${cleanTarget}`;
  return index > 0 ? `${slug}_${index}` : slug;
}

/**
 * Erzeugt eine deterministische, stabile ID für Ziele ohne Date.now() oder Math.random().
 */
export function generateDeterministicGoalId(ownerId: string, title: string, index: number = 0): string {
  const cleanOwner = (ownerId || 'char').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = (title || 'goal').toLowerCase().replace(/[^a-z0-9]/g, '');
  const slug = `goal_${cleanOwner}_${cleanTitle}`;
  return index > 0 ? `${slug}_${index}` : slug;
}

/**
 * Wendet Smart-Fill-Ergebnisse streng innerhalb der durch `context.section` und `context.scope` definierten Update-Grenze an.
 * 
 * Bereichs-Zuständigkeiten:
 * - 'profile': Name, Rufname, Spitzname, Rolle/Beruf, Aussehen/Körpermerkmale, Persönlichkeit, Biografie, Aktuelle Situation.
 * - 'relationships': Beziehungen, Motivation & Ziele (gezielte Teilbereiche durch context.scope).
 * - 'full_character': Vollständiges Charakter-Update (Legacy/Globaler Modus).
 */
export function applySmartFillUpdates<T extends Record<string, any>>(
  prevCharacter: T,
  aiData: any,
  context: SmartFillContext
): T {
  if (!prevCharacter) return prevCharacter;
  if (!aiData) return prevCharacter;

  // 1. Target ID Überprüfung
  if (context.targetId && prevCharacter.id && context.targetId !== prevCharacter.id) {
    const targetRelId = context.targetRelationshipId || context.targetId;
    const isTargetingRel = context.section === 'relationships' && 
      Array.isArray(prevCharacter.relationships) && 
      prevCharacter.relationships.some((r: any) => r.id === targetRelId || (r.targetCharacter && r.targetCharacter.toLowerCase().trim() === targetRelId.toLowerCase().trim()));

    const subId = context.targetPowerId || context.targetAbilityId || context.targetTechniqueId || context.targetFormId || context.targetId;
    const isTargetingAbility = context.section === 'abilities' && (
      (Array.isArray(prevCharacter.powers) && prevCharacter.powers.some((p: any) => p.id === subId)) ||
      (Array.isArray(prevCharacter.characterAbilities || prevCharacter.abilities) && (prevCharacter.characterAbilities || prevCharacter.abilities).some((a: any) => a.id === subId)) ||
      (Array.isArray(prevCharacter.characterTechniques || prevCharacter.techniqueList) && (prevCharacter.characterTechniques || prevCharacter.techniqueList).some((t: any) => t.id === subId)) ||
      (Array.isArray(prevCharacter.powerForms || prevCharacter.forms) && (prevCharacter.powerForms || prevCharacter.forms).some((f: any) => f.id === subId))
    );

    if (!isTargetingRel && !isTargetingAbility) {
      return prevCharacter;
    }
  }

  const mode = context.mode || 'supplement';
  const section = context.section || 'full_character';

  if (section === 'race_stats') {
    return applyRaceStatsSmartFillUpdates(prevCharacter, aiData, mode);
  }

  if (section === 'profile') {
    return applyProfileSmartFillUpdates(prevCharacter, aiData, mode);
  }

  if (section === 'relationships') {
    return applyRelationshipsSmartFillUpdates(prevCharacter, aiData, context);
  }

  if (section === 'abilities') {
    return applyAbilitiesSmartFillUpdates(prevCharacter, aiData, context);
  }

  if (section === 'full_character') {
    return applyFullCharacterSmartFillUpdates(prevCharacter, aiData, mode);
  }

  // Fallback für zukünftige isolierte Abschnitte
  return prevCharacter;
}

/**
 * Aktualisiert ausschließlich die Rasse- & Werte-/Progressionsdaten eines Charakters.
 * Alle anderen Abschnitte (Beziehungen, Fähigkeiten, Berufe, Inventar, etc.) bleiben strikt unverändert.
 */
export function applyRaceStatsSmartFillUpdates<T extends Record<string, any>>(
  prev: T,
  aiData: any,
  mode: 'supplement' | 'replace'
): T {
  const isSupplement = mode === 'supplement';
  const prevApp = prev.appearance || {};
  const aiApp = aiData.appearance || {};

  const nextRace = getSafeString(aiData.race) || getSafeString(aiApp.race) || (isSupplement ? (getSafeString(prev.race) || getSafeString(prevApp.race) || 'Mensch') : 'Mensch');
  const nextRaceFeatures = getSafeString(aiData.raceFeatures) || getSafeString(aiApp.raceFeatures) || (isSupplement ? (getSafeString(prev.raceFeatures) || getSafeString(prevApp.raceFeatures) || '') : '');

  const nextRank = aiData.rank !== undefined ? aiData.rank : (isSupplement ? (prev.rank || 'F') : 'F');
  const nextLevel = typeof aiData.level === 'number' ? aiData.level : (isSupplement ? (prev.level ?? 1) : 1);
  const nextXp = typeof aiData.xp === 'number' ? aiData.xp : (typeof aiData.experiencePoints === 'number' ? aiData.experiencePoints : (isSupplement ? (prev.xp ?? 0) : 0));
  const nextPotential = typeof aiData.potential === 'number' ? aiData.potential : (isSupplement ? (prev.potential ?? 100) : 100);
  const nextDevProfile = aiData.developmentProfile || (isSupplement ? (prev.developmentProfile || 'normal') : 'normal');

  const incomingPowerLevels = aiData.campaignPowerLevels || aiData.campaignPowerData;
  const nextPowerLevels = isSupplement
    ? { ...(prev.campaignPowerLevels || prev.campaignPowerData || {}), ...(incomingPowerLevels || {}) }
    : (incomingPowerLevels || prev.campaignPowerLevels || prev.campaignPowerData || {});

  const updatedAppearance = {
    ...prevApp,
    race: nextRace,
    raceFeatures: nextRaceFeatures
  };

  return {
    ...prev,
    race: nextRace,
    raceFeatures: nextRaceFeatures,
    rank: nextRank,
    level: nextLevel,
    xp: nextXp,
    potential: nextPotential,
    developmentProfile: nextDevProfile,
    campaignPowerLevels: nextPowerLevels,
    campaignPowerData: nextPowerLevels,
    appearance: updatedAppearance
  };
}

/**
 * Aktualisiert ausschließlich die Profil- & Aussehensdaten eines Charakters.
 * Alle anderen Abschnitte (Beziehungen, Fähigkeiten, Berufe, Inventar, etc.) bleiben strikt unverändert.
 */
export function applyProfileSmartFillUpdates<T extends Record<string, any>>(
  prev: T,
  aiData: any,
  mode: 'supplement' | 'replace'
): T {
  const isSupplement = mode === 'supplement';

  const generatedName = getSafeString(aiData.name) || getSafeString(aiData.callName) || getSafeString(aiData.rufName);

  // 1. Name & Bezeichnungen
  let nextName = prev.name;
  if (!isSupplement) {
    nextName = generatedName || prev.name || 'Neuer Charakter';
  } else {
    nextName = prev.name || generatedName || 'Neuer Charakter';
  }

  const nextNickname = isSupplement
    ? (aiData.nickname || prev.nickname || '')
    : (aiData.nickname ?? prev.nickname ?? '');

  const nextRufName = isSupplement
    ? (prev.rufName || aiData.rufName || aiData.nickname || generatedName || '')
    : (aiData.rufName ?? aiData.nickname ?? generatedName ?? prev.rufName ?? '');

  // 2. Grundrolle / Grundberuf im Profil
  const aiRole = getSafeString(aiData.role) || getSafeString(aiData.profession);
  const nextRole = isSupplement
    ? (aiRole || prev.role || '')
    : (aiRole || prev.role || '');

  // 3. Aussehen & Erscheinungsbild
  const prevApp = prev.appearance || {};
  const aiApp = aiData.appearance || {};

  const getProp = (key: string, defaultVal: string = '') => {
    const aiVal = getSafeString(aiApp[key]);
    const prevVal = getSafeString(prevApp[key]);
    return aiVal || prevVal || defaultVal;
  };

  const finalArchetype = aiData.personalityArchetype || (isSupplement ? (aiApp.personalityArchetype || prevApp.personalityArchetype || prev.personalityArchetype) : (aiApp.personalityArchetype || prevApp.personalityArchetype));

  const updatedAppearance = {
    ...prevApp,
    gender: getProp('gender', 'Unbekannt'),
    age: getProp('age'),
    build: getProp('build'),
    hairColor: getProp('hairColor'),
    eyeColor: getProp('eyeColor'),
    cupSize: getProp('cupSize', '-'),
    outfit: getProp('outfit'),
    looks: getProp('looks'),
    height: getProp('height'),
    measurements: getProp('measurements'),
    origin: getProp('origin'),
    family: getProp('family'),
    faction: getProp('faction'),
    race: getProp('race', 'Mensch'),
    raceFeatures: getProp('raceFeatures', 'keine'),
    personalityArchetype: finalArchetype,
  };

  // 4. Persönlichkeit & Archetyp
  let nextPersonality = prev.personality || '';
  if (!isSupplement) {
    nextPersonality = aiData.personality ?? prev.personality ?? '';
  } else if (aiData.personality) {
    if (!prev.personality) {
      nextPersonality = aiData.personality;
    } else if (!prev.personality.includes(aiData.personality)) {
      nextPersonality = `${prev.personality}\n\n${aiData.personality}`;
    }
  }

  const nextTraits = aiData.personalityTraits || (isSupplement ? prev.personalityTraits : undefined);

  // 5. Biografie & Hintergründe
  let nextBio = prev.bio || '';
  if (!isSupplement) {
    nextBio = aiData.bio ?? prev.bio ?? '';
  } else if (aiData.bio) {
    if (!prev.bio) {
      nextBio = aiData.bio;
    } else if (!prev.bio.includes(aiData.bio)) {
      nextBio = `${prev.bio}\n\n${aiData.bio}`;
    }
  }

  // 6. Aktuelle Situation
  const nextCurrentSituation = isSupplement
    ? (aiData.currentSituation || prev.currentSituation || '')
    : (aiData.currentSituation ?? prev.currentSituation ?? '');

  // Return updated profile fields, keeping prev as base
  return {
    ...prev,
    name: nextName,
    nickname: nextNickname,
    rufName: nextRufName,
    role: nextRole,
    appearance: updatedAppearance,
    personality: nextPersonality,
    personalityArchetype: finalArchetype || prev.personalityArchetype,
    personalityTraits: nextTraits,
    bio: nextBio,
    currentSituation: nextCurrentSituation
  };
}

/**
 * Aktualisiert isoliert den Bereich 'relationships' (Beziehungen, Motivation & Ziele) gemäß context.scope.
 */
export function applyRelationshipsSmartFillUpdates<T extends Record<string, any>>(
  prev: T,
  aiData: any,
  context: SmartFillContext
): T {
  const mode = context.mode || 'supplement';
  const isSupplement = mode === 'supplement';
  const scope: RelationshipsSmartFillScope = (context.scope as RelationshipsSmartFillScope) || 'relationships_and_motivation_goals';

  const allowRelationships = scope === 'relationships' || scope === 'relationships_and_motivation_goals';
  const allowMotivationGoals = scope === 'motivation_goals' || scope === 'relationships_and_motivation_goals';

  const ownerId = prev.id || 'char';

  // Determine if a specific single relationship is targeted
  const targetRelId = context.targetRelationshipId || 
    (context.targetId && prev.id && context.targetId !== prev.id ? context.targetId : undefined);

  const updates: Record<string, any> = {};

  // 1. BEZIEHUNGEN
  if (allowRelationships) {
    let nextRelationships = prev.relationships;
    let nextRelationshipText = prev.relationship;
    let nextConductText = prev.conduct;

    if (targetRelId && Array.isArray(prev.relationships) && prev.relationships.length > 0) {
      const targetRelIndex = prev.relationships.findIndex(
        (r: any) => r.id === targetRelId || (r.targetCharacter && r.targetCharacter.toLowerCase().trim() === targetRelId.toLowerCase().trim())
      );

      if (targetRelIndex !== -1) {
        // Zielgerichtetes Update einer EINZELNEN Beziehung
        const existingRel = prev.relationships[targetRelIndex];
        const matchingAiRel = Array.isArray(aiData.relationships)
          ? (aiData.relationships.find((r: any) => r.id === targetRelId || (r.targetCharacter && r.targetCharacter.toLowerCase().trim() === existingRel.targetCharacter.toLowerCase().trim())) || aiData.relationships[0])
          : aiData;

        const updatedRel = isSupplement
          ? { ...existingRel, ...(matchingAiRel || {}) }
          : { id: existingRel.id, targetCharacter: existingRel.targetCharacter, ...(matchingAiRel || {}) };

        nextRelationships = [...prev.relationships];
        nextRelationships[targetRelIndex] = updatedRel;
      } else {
        const incomingList = Array.isArray(aiData.relationships)
          ? aiData.relationships
          : (aiData.targetCharacter ? [aiData] : []);
        if (incomingList.length > 0) {
          nextRelationships = mergeRelationshipsList(ownerId, prev.relationships || [], incomingList, isSupplement);
        }
      }
    } else {
      const incomingList = Array.isArray(aiData.relationships)
        ? aiData.relationships
        : (aiData.targetCharacter ? [aiData] : []);

      if (!isSupplement) {
        // Mode 'replace' for entire relationships scope: replace all relationships
        nextRelationships = mergeRelationshipsList(ownerId, [], incomingList, false);
      } else {
        // Mode 'supplement' for entire relationships scope: merge new relationships
        nextRelationships = mergeRelationshipsList(ownerId, prev.relationships || [], incomingList, true);
      }
    }

    if (aiData.relationship !== undefined) {
      nextRelationshipText = !isSupplement
        ? (aiData.relationship || '')
        : (prev.relationship ? (aiData.relationship ? `${prev.relationship}\n\n${aiData.relationship}` : prev.relationship) : (aiData.relationship || ''));
    }
    if (aiData.conduct !== undefined) {
      nextConductText = !isSupplement
        ? (aiData.conduct || '')
        : (prev.conduct ? (aiData.conduct ? `${prev.conduct}\n\n${aiData.conduct}` : prev.conduct) : (aiData.conduct || ''));
    }

    updates.relationships = nextRelationships;
    updates.relationship = nextRelationshipText;
    updates.conduct = nextConductText;
  }

  // 2. MOTIVATION & ZIELE
  if (allowMotivationGoals) {
    let nextGoal = prev.goal;
    let nextMotivationCore = prev.motivationCore;
    let nextGoals = prev.goals;

    if (aiData.goal !== undefined) {
      nextGoal = !isSupplement ? (aiData.goal || '') : (prev.goal || aiData.goal || '');
    }

    if (aiData.motivationCore !== undefined) {
      nextMotivationCore = !isSupplement
        ? (aiData.motivationCore || (aiData.goal ? { mainGoal: aiData.goal } : undefined))
        : (prev.motivationCore ? { ...prev.motivationCore, ...(aiData.motivationCore || {}) } : (aiData.motivationCore || (aiData.goal ? { mainGoal: aiData.goal } : undefined)));
    }

    if (Array.isArray(aiData.goals) && aiData.goals.length > 0) {
      if (!isSupplement) {
        // Replace mode: replace goals cleanly with stable IDs
        nextGoals = aiData.goals.map((g: any, i: number) => ({
          ...g,
          id: g.id || generateDeterministicGoalId(ownerId, g.title || 'goal', i)
        }));
      } else {
        // Supplement mode: keep existing goals, append new non-duplicates with stable IDs
        const existingGoalIds = new Set<string>();
        const existingGoalTitles = new Set<string>();
        (prev.goals || []).forEach((g: any) => {
          if (g.id) existingGoalIds.add(g.id.toLowerCase().trim());
          if (g.title) existingGoalTitles.add(g.title.toLowerCase().trim());
        });

        const newGoals = aiData.goals
          .filter((g: any) => {
            const idKey = g.id ? g.id.toLowerCase().trim() : '';
            const titleKey = g.title ? g.title.toLowerCase().trim() : '';
            if (idKey && existingGoalIds.has(idKey)) return false;
            if (titleKey && existingGoalTitles.has(titleKey)) return false;
            return true;
          })
          .map((g: any, i: number) => ({
            ...g,
            id: g.id || generateDeterministicGoalId(ownerId, g.title || 'goal', (prev.goals || []).length + i)
          }));

        nextGoals = [...(prev.goals || []), ...newGoals];
      }
    } else if (!isSupplement) {
      if (aiData.goal) {
        nextGoals = [{ id: generateDeterministicGoalId(ownerId, aiData.goal, 0), title: aiData.goal, timeframe: 'langfristig', targetType: 'self', targetName: 'Selbst', priority: 'hoch', status: 'aktiv', progress: 0 }];
      } else {
        nextGoals = [];
      }
    } else if (aiData.goal && (!prev.goals || prev.goals.length === 0)) {
      nextGoals = [{ id: generateDeterministicGoalId(ownerId, aiData.goal, 0), title: aiData.goal, timeframe: 'langfristig', targetType: 'self', targetName: 'Selbst', priority: 'hoch', status: 'aktiv', progress: 0 }];
    }

    updates.goal = nextGoal;
    updates.motivationCore = nextMotivationCore;
    updates.goals = nextGoals;
  }

  return {
    ...prev,
    ...updates
  };
}

function mergeRelationshipsList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    return incomingList.map((r, i) => ({
      id: r.id || generateDeterministicRelationshipId(ownerId, r.targetCharacter || `target`, i),
      ...r
    }));
  }

  const existingMap = new Map<string, any>();
  existingList.forEach(r => {
    const key = (r.targetCharacter || r.id || '').toLowerCase().trim();
    if (key) existingMap.set(key, r);
  });

  const merged = [...existingList];
  incomingList.forEach((inc, i) => {
    const key = (inc.targetCharacter || inc.id || '').toLowerCase().trim();
    if (key && existingMap.has(key)) {
      const idx = merged.findIndex(r => (r.targetCharacter || r.id || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        merged[idx] = { ...merged[idx], ...inc };
      }
    } else if (inc.targetCharacter || inc.id) {
      merged.push({
        id: inc.id || generateDeterministicRelationshipId(ownerId, inc.targetCharacter || `target`, i),
        ...inc
      });
    }
  });

  return merged;
}

/**
 * Führt ein vollständiges Charakter-Smart-Fill über alle Sektionen durch.
 */
function applyFullCharacterSmartFillUpdates<T extends Record<string, any>>(
  prev: T,
  data: any,
  mode: 'supplement' | 'replace'
): T {
  const isSupplement = mode === 'supplement';
  const ownerId = prev.id || 'char';

  const getSafeStr = (val: any): string => {
    if (typeof val === 'string') return val.trim();
    if (val && typeof val === 'object') return (val.name || val.title || val.callName || '').toString().trim();
    return val ? String(val).trim() : '';
  };

  const generatedPlayerName = getSafeStr(data.name) || getSafeStr(data.callName) || getSafeStr(data.rufName);
  const finalRole = data.role || data.profession || (isSupplement ? (prev.role || prev.profession || '') : '');
  const finalProfession = data.profession || data.role || (isSupplement ? (prev.profession || prev.role || '') : '');

  const finalBio = isSupplement && prev.bio ? (data.bio ? `${prev.bio}\n\n${data.bio}` : prev.bio) : (data.bio || '');
  const finalPersonality = isSupplement && prev.personality ? (data.personality ? `${prev.personality}\n\n${data.personality}` : prev.personality) : (data.personality || '');
  const finalArchetype = data.personalityArchetype || (isSupplement ? prev.personalityArchetype : '');
  const finalTraits = data.personalityTraits || (isSupplement ? prev.personalityTraits : undefined);
  const finalOutfit = data.appearance?.outfit || (isSupplement ? prev.appearance?.outfit : '') || '';

  const newAppearance = isSupplement ? {
    ...prev.appearance,
    gender: data.appearance?.gender || prev.appearance?.gender || 'Unbekannt',
    age: data.appearance?.age || prev.appearance?.age || '',
    build: data.appearance?.build || prev.appearance?.build || '',
    hairColor: data.appearance?.hairColor || prev.appearance?.hairColor || '',
    eyeColor: data.appearance?.eyeColor || prev.appearance?.eyeColor || '',
    cupSize: data.appearance?.cupSize || prev.appearance?.cupSize || '-',
    outfit: finalOutfit,
    looks: data.appearance?.looks || prev.appearance?.looks || '',
    height: data.appearance?.height || prev.appearance?.height || '',
    measurements: data.appearance?.measurements || prev.appearance?.measurements || '',
    origin: data.appearance?.origin || prev.appearance?.origin || '',
    family: data.appearance?.family || prev.appearance?.family || '',
    faction: data.appearance?.faction || prev.appearance?.faction || '',
    race: data.appearance?.race || prev.appearance?.race || 'Mensch',
    raceFeatures: data.appearance?.raceFeatures || prev.appearance?.raceFeatures || 'keine',
    personalityArchetype: finalArchetype,
  } : {
    gender: data.appearance?.gender || 'Unbekannt',
    age: data.appearance?.age || '',
    build: data.appearance?.build || '',
    hairColor: data.appearance?.hairColor || '',
    eyeColor: data.appearance?.eyeColor || '',
    cupSize: data.appearance?.cupSize || '-',
    outfit: finalOutfit,
    looks: data.appearance?.looks || '',
    height: data.appearance?.height || '',
    measurements: data.appearance?.measurements || '',
    origin: data.appearance?.origin || '',
    family: data.appearance?.family || '',
    faction: data.appearance?.faction || '',
    race: data.appearance?.race || 'Mensch',
    raceFeatures: data.appearance?.raceFeatures || 'keine',
    personalityArchetype: finalArchetype,
  };

  let mergedRelationships = isSupplement ? (prev.relationships || []) : [];
  if (data.relationships && Array.isArray(data.relationships)) {
    const seenRelIds = new Set(mergedRelationships.map((r: any) => r.id).filter(Boolean));
    const incoming = data.relationships.map((r: any, index: number) => {
      let uniqueId = r.id;
      if (!uniqueId || seenRelIds.has(uniqueId)) {
        uniqueId = generateDeterministicRelationshipId(ownerId, r.targetCharacter || `target`, index);
      }
      seenRelIds.add(uniqueId);
      return {
        id: uniqueId,
        targetCharacter: r.targetCharacter || '',
        type: r.type || '',
        relationshipStatus: r.relationshipStatus || '',
        addressFromSelfToTarget: r.addressFromSelfToTarget || '',
        addressFromTargetToSelf: r.addressFromTargetToSelf || '',
        behavior: r.behavior || '',
        aiDirectives: r.aiDirectives || '',
        perceptionSelfToTarget: r.perceptionSelfToTarget || '',
        perceptionTargetToSelf: r.perceptionTargetToSelf || '',
        secretsAndMotives: r.secretsAndMotives || '',
        boundariesAndTaboos: r.boundariesAndTaboos || '',
        sharedPast: r.sharedPast || '',
        keyMemories: r.keyMemories || '',
        valuesSelfToTarget: r.valuesSelfToTarget || {
          affection: 0, trust: 50, respect: 50, loyalty: 50, familiarity: 30, fear: 0, bond: 30, hostility: 0
        },
        valuesTargetToSelf: r.valuesTargetToSelf || {
          affection: 0, trust: 50, respect: 50, loyalty: 50, familiarity: 30, fear: 0, bond: 30, hostility: 0
        },
        keyEvents: Array.isArray(r.keyEvents) ? r.keyEvents.map((ev: any, evI: number) => ({
          id: ev.id || `ev_${ownerId}_${evI}`,
          title: ev.title || 'Schlüsselereignis',
          description: ev.description || '',
          dateOrChapter: ev.dateOrChapter || '',
          impact: ev.impact || ''
        })) : [],
        _isCustom: r._isCustom || false
      };
    });
    if (isSupplement) {
      const existingTargets = new Set(mergedRelationships.map((r: any) => (r.targetCharacter || '').toLowerCase().trim()));
      const newFiltered = incoming.filter((r: any) => r.targetCharacter && !existingTargets.has(r.targetCharacter.toLowerCase().trim()));
      mergedRelationships = [...mergedRelationships, ...newFiltered];
    } else {
      mergedRelationships = incoming;
    }
  }

  let mergedAbilities = prev.abilities || [];
  if (data.abilities && Array.isArray(data.abilities)) {
    if (isSupplement && prev.abilities && prev.abilities.length > 0) {
      const existingNames = new Set(prev.abilities.map((a: any) => (a.name || '').toLowerCase().trim()));
      const nonDuplicates = data.abilities.filter((a: any) => !existingNames.has((a.name || '').toLowerCase().trim()));
      mergedAbilities = [...prev.abilities, ...nonDuplicates];
    } else {
      mergedAbilities = data.abilities;
    }
  }

  return {
    ...prev,
    name: isSupplement && prev.name ? prev.name : (generatedPlayerName || prev.name || 'Neuer Charakter'),
    nickname: data.nickname || (isSupplement ? prev.nickname : ''),
    rufName: data.rufName || data.nickname || generatedPlayerName || (isSupplement ? prev.rufName : ''),
    role: finalRole,
    profession: finalProfession || finalRole,
    professionField: data.professionField || (isSupplement ? prev.professionField : ''),
    professionSpecialization: data.professionSpecialization || (isSupplement ? prev.professionSpecialization : ''),
    professionRank: data.professionRank || data.professionLevel || (isSupplement ? prev.professionRank : ''),
    professionLevel: data.professionLevel || (isSupplement ? prev.professionLevel : ''),
    secondaryProfessions: data.secondaryProfessions || (isSupplement ? prev.secondaryProfessions : []),
    jobTitle: data.jobTitle || (isSupplement ? prev.jobTitle : ''),
    professionDescription: data.professionDescription || (isSupplement ? prev.professionDescription : ''),
    craftingSkills: data.craftingSkills || (isSupplement ? prev.craftingSkills : ''),
    talents: data.talents || (isSupplement ? prev.talents : ''),
    everydaySkills: data.everydaySkills || (isSupplement ? prev.everydaySkills : ''),
    toolsAndEquipment: data.toolsAndEquipment || (isSupplement ? prev.toolsAndEquipment : ''),
    personality: finalPersonality,
    personalityArchetype: finalArchetype,
    personalityTraits: finalTraits,
    bio: finalBio,
    currentSituation: data.currentSituation || (isSupplement ? prev.currentSituation : ''),
    goal: data.goal || (isSupplement ? prev.goal : ''),
    motivationCore: data.motivationCore || (isSupplement ? prev.motivationCore : (data.goal ? { mainGoal: data.goal } : undefined)),
    goals: Array.isArray(data.goals) && data.goals.length > 0 ? data.goals : (isSupplement ? prev.goals : (data.goal ? [{ id: generateDeterministicGoalId(ownerId, data.goal, 0), title: data.goal, timeframe: 'langfristig', targetType: 'self', targetName: 'Selbst', priority: 'hoch', status: 'aktiv', progress: 0 }] : [])),
    relationship: data.relationship || (isSupplement ? prev.relationship : ''),
    conduct: data.conduct || (isSupplement ? prev.conduct : ''),
    relationships: mergedRelationships,
    skills: data.skills || (isSupplement ? prev.skills : ''),
    powerSource: data.powerSource || (isSupplement ? prev.powerSource : ''),
    powerCost: data.powerCost || (isSupplement ? prev.powerCost : ''),
    techniques: data.techniques || (isSupplement ? prev.techniques : ''),
    abilities: mergedAbilities,
    techniqueList: Array.isArray(data.techniqueList) ? data.techniqueList : (isSupplement ? prev.techniqueList : []),
    campaignPowerLevels: data.campaignPowerLevels || (isSupplement ? prev.campaignPowerLevels : {}),
    rank: data.rank || (isSupplement ? prev.rank : undefined),
    progression: data.progression || (isSupplement ? prev.progression : undefined),
    developmentProfile: data.developmentProfile || (isSupplement ? prev.developmentProfile : undefined),
    potential: data.potential !== undefined ? data.potential : (isSupplement ? prev.potential : undefined),
    secretsStage1: data.secretsStage1 !== undefined ? data.secretsStage1 : (isSupplement ? prev.secretsStage1 : ''),
    secretsStage2: data.secretsStage2 !== undefined ? data.secretsStage2 : (isSupplement ? prev.secretsStage2 : ''),
    secretsStage3: data.secretsStage3 !== undefined ? data.secretsStage3 : (isSupplement ? prev.secretsStage3 : ''),
    knowledge: data.knowledge !== undefined ? data.knowledge : (isSupplement ? prev.knowledge : ''),
    appearance: newAppearance
  };
}

/**
 * Aktualisiert isoliert den Bereich 'abilities' (Kräfte & Fähigkeiten) gemäß context.scope.
 */
export function applyAbilitiesSmartFillUpdates<T extends Record<string, any>>(
  prev: T,
  aiData: any,
  context: SmartFillContext
): T {
  const mode = context.mode || 'supplement';
  const isSupplement = mode === 'supplement';
  const scope: AbilitiesSmartFillScope = (context.scope as AbilitiesSmartFillScope) || 'powers_abilities_techniques_forms';

  const allowPowersAbilities = scope === 'powers_abilities' || scope === 'powers_abilities_techniques_forms';
  const allowTechniques = scope === 'techniques' || scope === 'powers_abilities_techniques_forms';
  const allowForms = scope === 'forms_transformations' || scope === 'powers_abilities_techniques_forms';

  const ownerId = prev.id || 'char';

  // Sub-target IDs
  const targetPowerId = context.targetPowerId;
  const targetAbilityId = context.targetAbilityId;
  const targetTechniqueId = context.targetTechniqueId;
  const targetFormId = context.targetFormId;
  const genericSubTargetId = (context.targetId && prev.id && context.targetId !== prev.id) ? context.targetId : undefined;

  const updates: Record<string, any> = {};

  // 1. KRAFT-SYSTEME, KRÄFTE & GRUNDFÄHIGKEITEN
  if (allowPowersAbilities) {
    let nextPowerSystems = prev.powerSystems || [];
    let nextPowers = prev.powers || [];
    let nextCharacterAbilities = prev.characterAbilities || prev.abilities || [];
    let nextPowerSource = prev.powerSource;
    let nextPowerCost = prev.powerCost;
    let nextSkills = prev.skills;
    let nextCampaignPowerLevels = prev.campaignPowerLevels;

    if (aiData.powerSystems && Array.isArray(aiData.powerSystems)) {
      nextPowerSystems = mergePowerSystemsList(ownerId, prev.powerSystems || [], aiData.powerSystems, isSupplement);
    } else if (aiData.powerSystem) {
      nextPowerSystems = mergePowerSystemsList(ownerId, prev.powerSystems || [], [aiData.powerSystem], isSupplement);
    }

    const specPowerId = targetPowerId || (genericSubTargetId && (prev.powers || []).some((p: any) => p.id === genericSubTargetId) ? genericSubTargetId : undefined);
    if (specPowerId && Array.isArray(prev.powers) && prev.powers.length > 0) {
      const idx = prev.powers.findIndex((p: any) => p.id === specPowerId);
      if (idx !== -1) {
        const existingP = prev.powers[idx];
        const incomingP = Array.isArray(aiData.powers) ? aiData.powers.find((p: any) => p.id === specPowerId) || aiData.powers[0] : (aiData.power || aiData);
        const updatedP = isSupplement ? { ...existingP, ...(incomingP || {}) } : { id: existingP.id, ...incomingP };
        nextPowers = [...prev.powers];
        nextPowers[idx] = updatedP;
      } else {
        const incomingP = Array.isArray(aiData.powers) ? aiData.powers : (aiData.power ? [aiData.power] : []);
        nextPowers = mergePowersList(ownerId, prev.powers || [], incomingP, isSupplement);
      }
    } else if (aiData.powers && Array.isArray(aiData.powers)) {
      nextPowers = mergePowersList(ownerId, prev.powers || [], aiData.powers, isSupplement);
    } else if (aiData.power) {
      nextPowers = mergePowersList(ownerId, prev.powers || [], [aiData.power], isSupplement);
    }

    const existingAbList = prev.characterAbilities || prev.abilities || [];
    const specAbId = targetAbilityId || (genericSubTargetId && existingAbList.some((a: any) => a.id === genericSubTargetId) ? genericSubTargetId : undefined);
    if (specAbId && Array.isArray(existingAbList) && existingAbList.length > 0) {
      const idx = existingAbList.findIndex((a: any) => a.id === specAbId);
      if (idx !== -1) {
        const existingA = existingAbList[idx];
        const incomingA = Array.isArray(aiData.abilities) ? aiData.abilities.find((a: any) => a.id === specAbId) || aiData.abilities[0] : (aiData.ability || aiData);
        const updatedA = isSupplement ? { ...existingA, ...(incomingA || {}) } : { id: existingA.id, ...incomingA };
        nextCharacterAbilities = [...existingAbList];
        nextCharacterAbilities[idx] = updatedA;
      } else {
        const incomingA = Array.isArray(aiData.abilities) ? aiData.abilities : (aiData.ability ? [aiData.ability] : []);
        nextCharacterAbilities = mergeAbilitiesList(ownerId, existingAbList, incomingA, isSupplement);
      }
    } else if (aiData.abilities && Array.isArray(aiData.abilities)) {
      const filteredAiAbilities = allowForms ? aiData.abilities : aiData.abilities.filter((a: any) => a.category !== 'Transformationen');
      nextCharacterAbilities = mergeAbilitiesList(ownerId, existingAbList, filteredAiAbilities, isSupplement);
    } else if (aiData.ability) {
      nextCharacterAbilities = mergeAbilitiesList(ownerId, existingAbList, [aiData.ability], isSupplement);
    }

    if (aiData.powerSource !== undefined) {
      nextPowerSource = !isSupplement ? (aiData.powerSource || '') : (prev.powerSource || aiData.powerSource || '');
    }
    if (aiData.powerCost !== undefined) {
      nextPowerCost = !isSupplement ? (aiData.powerCost || '') : (prev.powerCost || aiData.powerCost || '');
    }
    if (aiData.skills !== undefined) {
      nextSkills = !isSupplement ? (aiData.skills || '') : (prev.skills || aiData.skills || '');
    }
    if (aiData.campaignPowerLevels !== undefined) {
      nextCampaignPowerLevels = !isSupplement
        ? (aiData.campaignPowerLevels || {})
        : { ...(prev.campaignPowerLevels || {}), ...(aiData.campaignPowerLevels || {}) };
    }

    updates.powerSystems = nextPowerSystems;
    updates.powers = nextPowers;
    updates.characterAbilities = nextCharacterAbilities;
    updates.abilities = nextCharacterAbilities;
    updates.powerSource = nextPowerSource;
    updates.powerCost = nextPowerCost;
    updates.skills = nextSkills;
    updates.campaignPowerLevels = nextCampaignPowerLevels;
  }

  // 2. TECHNIKEN
  if (allowTechniques) {
    let nextCharacterTechniques = prev.characterTechniques || prev.techniqueList || [];
    let nextTechniquesText = prev.techniques;

    const existingTechList = prev.characterTechniques || prev.techniqueList || [];
    const specTechId = targetTechniqueId || (genericSubTargetId && existingTechList.some((t: any) => t.id === genericSubTargetId) ? genericSubTargetId : undefined);

    if (specTechId && Array.isArray(existingTechList) && existingTechList.length > 0) {
      const idx = existingTechList.findIndex((t: any) => t.id === specTechId);
      if (idx !== -1) {
        const existingT = existingTechList[idx];
        const incomingT = Array.isArray(aiData.techniqueList) ? aiData.techniqueList.find((t: any) => t.id === specTechId) || aiData.techniqueList[0]
          : (Array.isArray(aiData.techniques) ? aiData.techniques.find((t: any) => t.id === specTechId) || aiData.techniques[0] : (aiData.technique || aiData));
        const updatedT = isSupplement ? { ...existingT, ...(incomingT || {}) } : { id: existingT.id, ...incomingT };
        nextCharacterTechniques = [...existingTechList];
        nextCharacterTechniques[idx] = updatedT;
      } else {
        const incomingT = Array.isArray(aiData.techniqueList) ? aiData.techniqueList : (Array.isArray(aiData.techniques) ? aiData.techniques : (aiData.technique ? [aiData.technique] : []));
        nextCharacterTechniques = mergeTechniquesList(ownerId, existingTechList, incomingT, isSupplement);
      }
    } else {
      const incomingT = Array.isArray(aiData.techniqueList) ? aiData.techniqueList : (Array.isArray(aiData.techniques) && typeof aiData.techniques !== 'string' ? aiData.techniques : (aiData.technique ? [aiData.technique] : []));
      if (!isSupplement) {
        nextCharacterTechniques = mergeTechniquesList(ownerId, [], incomingT, false);
      } else {
        nextCharacterTechniques = mergeTechniquesList(ownerId, existingTechList, incomingT, true);
      }
    }

    if (typeof aiData.techniques === 'string') {
      nextTechniquesText = !isSupplement ? (aiData.techniques || '') : (prev.techniques ? (aiData.techniques ? `${prev.techniques}\n\n${aiData.techniques}` : prev.techniques) : (aiData.techniques || ''));
    }

    updates.characterTechniques = nextCharacterTechniques;
    updates.techniqueList = nextCharacterTechniques;
    updates.techniques = nextTechniquesText;
  }

  // 3. GESTALTEN / TRANSFORMATIONEN
  if (allowForms) {
    let nextPowerForms = prev.powerForms || prev.forms || [];

    const existingFormsList = prev.powerForms || prev.forms || [];
    const specFormId = targetFormId || (genericSubTargetId && existingFormsList.some((f: any) => f.id === genericSubTargetId) ? genericSubTargetId : undefined);

    if (specFormId && Array.isArray(existingFormsList) && existingFormsList.length > 0) {
      const idx = existingFormsList.findIndex((f: any) => f.id === specFormId);
      if (idx !== -1) {
        const existingF = existingFormsList[idx];
        const incomingF = Array.isArray(aiData.powerForms) ? aiData.powerForms.find((f: any) => f.id === specFormId) || aiData.powerForms[0]
          : (Array.isArray(aiData.forms) ? aiData.forms.find((f: any) => f.id === specFormId) || aiData.forms[0] : (aiData.form || aiData));
        const updatedF = isSupplement ? { ...existingF, ...(incomingF || {}) } : { id: existingF.id, ...incomingF };
        nextPowerForms = [...existingFormsList];
        nextPowerForms[idx] = updatedF;
      } else {
        const incomingF = Array.isArray(aiData.powerForms) ? aiData.powerForms : (Array.isArray(aiData.forms) ? aiData.forms : (aiData.form ? [aiData.form] : []));
        nextPowerForms = mergeFormsList(ownerId, existingFormsList, incomingF, isSupplement);
      }
    } else {
      const incomingF: any[] = Array.isArray(aiData.powerForms) ? [...aiData.powerForms] : (Array.isArray(aiData.forms) ? [...aiData.forms] : (aiData.form ? [aiData.form] : []));
      if (Array.isArray(aiData.abilities)) {
        const transformAbilities = aiData.abilities.filter((a: any) => a.category === 'Transformationen');
        transformAbilities.forEach((ab: any) => {
          if (!incomingF.some((f: any) => (f.name || '').toLowerCase().trim() === (ab.name || '').toLowerCase().trim())) {
            incomingF.push({
              name: ab.name,
              description: ab.description,
              formType: 'Transformation',
              transformationModifiers: ab.transformationModifiers
            });
          }
        });
      }

      if (!isSupplement) {
        nextPowerForms = mergeFormsList(ownerId, [], incomingF, false);
      } else {
        nextPowerForms = mergeFormsList(ownerId, existingFormsList, incomingF, true);
      }
    }

    updates.powerForms = nextPowerForms;
    updates.forms = nextPowerForms;
  }

  return {
    ...prev,
    ...updates
  };
}

function mergePowerSystemsList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    const ids = new Set<string>();
    return incomingList.map(s => {
      const id = s.id || generatePowerSystemId(s.name || s.systemName || 'system', ids);
      ids.add(id);
      return { ...s, id };
    });
  }

  const existingIds = new Set(existingList.map(s => s.id).filter(Boolean));
  const existingNames = new Set(existingList.map(s => (s.name || s.systemName || '').toLowerCase().trim()));
  const merged = [...existingList];

  incomingList.forEach(inc => {
    const key = (inc.name || inc.systemName || '').toLowerCase().trim();
    if (key && existingNames.has(key)) {
      const idx = merged.findIndex(s => (s.name || s.systemName || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        const prog = merged[idx].progression || inc.progression;
        merged[idx] = { ...merged[idx], ...inc, progression: prog };
      }
    } else {
      const id = inc.id || generatePowerSystemId(inc.name || inc.systemName || 'system', existingIds);
      existingIds.add(id);
      merged.push({ ...inc, id });
    }
  });

  return merged;
}

function mergePowersList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    const ids = new Set<string>();
    return incomingList.map(p => {
      const id = p.id || generateCharacterPowerId(p.powerSystemId || 'ps', p.name || 'power', ids);
      ids.add(id);
      return { ...p, id };
    });
  }

  const existingIds = new Set(existingList.map(p => p.id).filter(Boolean));
  const existingNames = new Set(existingList.map(p => (p.name || '').toLowerCase().trim()));
  const merged = [...existingList];

  incomingList.forEach(inc => {
    const key = (inc.name || '').toLowerCase().trim();
    if (key && existingNames.has(key)) {
      const idx = merged.findIndex(p => (p.name || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        const prog = merged[idx].progression || inc.progression;
        merged[idx] = { ...merged[idx], ...inc, progression: prog };
      }
    } else {
      const id = inc.id || generateCharacterPowerId(inc.powerSystemId || 'ps', inc.name || 'power', existingIds);
      existingIds.add(id);
      merged.push({ ...inc, id });
    }
  });

  return merged;
}

function mergeAbilitiesList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    const ids = new Set<string>();
    return incomingList.map(a => {
      const id = a.id || generateCharacterAbilityId(a.powerId || 'pow', a.name || 'ability', ids);
      ids.add(id);
      return { ...a, id };
    });
  }

  const existingIds = new Set(existingList.map(a => a.id).filter(Boolean));
  const existingNames = new Set(existingList.map(a => (a.name || '').toLowerCase().trim()));
  const merged = [...existingList];

  incomingList.forEach(inc => {
    const key = (inc.name || '').toLowerCase().trim();
    if (key && existingNames.has(key)) {
      const idx = merged.findIndex(a => (a.name || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        const prog = merged[idx].progression || inc.progression;
        merged[idx] = { ...merged[idx], ...inc, progression: prog };
      }
    } else {
      const id = inc.id || generateCharacterAbilityId(inc.powerId || 'pow', inc.name || 'ability', existingIds);
      existingIds.add(id);
      merged.push({ ...inc, id });
    }
  });

  return merged;
}

function mergeTechniquesList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    const ids = new Set<string>();
    return incomingList.map(t => {
      const id = t.id || generateCharacterTechniqueId(t.abilityId || t.powerId || 'parent', t.name || 'technique', ids);
      ids.add(id);
      return { ...t, id };
    });
  }

  const existingIds = new Set(existingList.map(t => t.id).filter(Boolean));
  const existingNames = new Set(existingList.map(t => (t.name || '').toLowerCase().trim()));
  const merged = [...existingList];

  incomingList.forEach(inc => {
    const key = (inc.name || '').toLowerCase().trim();
    if (key && existingNames.has(key)) {
      const idx = merged.findIndex(t => (t.name || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        const prog = merged[idx].progression || inc.progression;
        merged[idx] = { ...merged[idx], ...inc, progression: prog };
      }
    } else {
      const id = inc.id || generateCharacterTechniqueId(inc.abilityId || inc.powerId || 'parent', inc.name || 'technique', existingIds);
      existingIds.add(id);
      merged.push({ ...inc, id });
    }
  });

  return merged;
}

function mergeFormsList(ownerId: string, existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    const ids = new Set<string>();
    return incomingList.map(f => {
      const id = f.id || generateCharacterPowerFormId(f.powerId || 'pow', f.name || 'form', ids);
      ids.add(id);
      return { ...f, id };
    });
  }

  const existingIds = new Set(existingList.map(f => f.id).filter(Boolean));
  const existingNames = new Set(existingList.map(f => (f.name || '').toLowerCase().trim()));
  const merged = [...existingList];

  incomingList.forEach(inc => {
    const key = (inc.name || '').toLowerCase().trim();
    if (key && existingNames.has(key)) {
      const idx = merged.findIndex(f => (f.name || '').toLowerCase().trim() === key);
      if (idx !== -1) {
        const prog = merged[idx].progression || inc.progression;
        merged[idx] = { ...merged[idx], ...inc, progression: prog };
      }
    } else {
      const id = inc.id || generateCharacterPowerFormId(inc.powerId || 'pow', inc.name || 'form', existingIds);
      existingIds.add(id);
      merged.push({ ...inc, id });
    }
  });

  return merged;
}
