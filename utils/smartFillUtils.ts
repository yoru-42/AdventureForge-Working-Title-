import { SmartFillContext, SmartFillSection, RelationshipsSmartFillScope } from '../types';

/**
 * Wandelt unstrukturierte KI-Rückgabewerte in eine sichere Zeichenkette um.
 */
function getSafeString(val: any): string {
  if (typeof val === 'string') return val.trim();
  if (val && typeof val === 'object') return (val.name || val.title || val.callName || val.rufName || '').toString().trim();
  return val !== undefined && val !== null ? String(val).trim() : '';
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
    // Falls targetId angegeben ist und nicht die Charakter-ID ist, prüfen wir,
    // ob targetId zu einem untergeordneten Element gehört (z.B. eine konkrete Beziehungs-ID).
    const isTargetingSubElement = context.section === 'relationships' && 
      Array.isArray(prevCharacter.relationships) && 
      prevCharacter.relationships.some((r: any) => r.id === context.targetId || r.targetCharacter === context.targetId);

    if (!isTargetingSubElement) {
      return prevCharacter;
    }
  }

  const mode = context.mode || 'supplement';
  const section = context.section || 'full_character';

  if (section === 'profile') {
    return applyProfileSmartFillUpdates(prevCharacter, aiData, mode);
  }

  if (section === 'relationships') {
    return applyRelationshipsSmartFillUpdates(prevCharacter, aiData, context);
  }

  if (section === 'full_character') {
    return applyFullCharacterSmartFillUpdates(prevCharacter, aiData, mode);
  }

  // Fallback für zukünftige isolierte Abschnitte
  return prevCharacter;
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

  // Rückgabe mit isoliertem Profil-Update und strikt UNVERÄNDERTEN anderen Sektionen
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
    currentSituation: nextCurrentSituation,

    // GUARANTEED UNTOUCHED SECTIONS:
    relationships: prev.relationships,
    goal: prev.goal,
    motivationCore: prev.motivationCore,
    goals: prev.goals,
    relationship: prev.relationship,
    conduct: prev.conduct,
    skills: prev.skills,
    powerSource: prev.powerSource,
    powerCost: prev.powerCost,
    techniques: prev.techniques,
    abilities: prev.abilities,
    techniqueList: prev.techniqueList,
    campaignPowerLevels: prev.campaignPowerLevels,
    powerSystems: prev.powerSystems,
    powers: prev.powers,
    secondaryProfessions: prev.secondaryProfessions,
    professionField: prev.professionField,
    professionSpecialization: prev.professionSpecialization,
    professionRank: prev.professionRank,
    professionLevel: prev.professionLevel,
    professionDescription: prev.professionDescription,
    craftingSkills: prev.craftingSkills,
    talents: prev.talents,
    everydaySkills: prev.everydaySkills,
    toolsAndEquipment: prev.toolsAndEquipment,
    jobTitle: prev.jobTitle,
    structuredInventory: prev.structuredInventory,
    inventory: prev.inventory,
    weapons: prev.weapons,
    equipment: prev.equipment,
    secretsStage1: prev.secretsStage1,
    secretsStage2: prev.secretsStage2,
    secretsStage3: prev.secretsStage3,
    knowledge: prev.knowledge
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
  const scope = (context.scope as RelationshipsSmartFillScope) || 'relationships_and_motivation_goals';

  const allowRelationships = scope === 'relationships' || scope === 'relationships_and_motivation_goals';
  const allowMotivationGoals = scope === 'motivation_goals' || scope === 'relationships_and_motivation_goals';

  // 1. BEZIEHUNGEN
  let nextRelationships = prev.relationships;
  let nextRelationshipText = prev.relationship;
  let nextConductText = prev.conduct;

  if (allowRelationships) {
    if (context.targetId && prev.relationships && prev.relationships.length > 0) {
      const targetRelIndex = prev.relationships.findIndex(
        (r: any) => r.id === context.targetId || r.targetCharacter === context.targetId
      );

      if (targetRelIndex !== -1) {
        // Zielgerichtetes Update einer einzelnen Beziehung
        const existingRel = prev.relationships[targetRelIndex];
        const matchingAiRel = Array.isArray(aiData.relationships)
          ? aiData.relationships.find((r: any) => r.id === context.targetId || r.targetCharacter === existingRel.targetCharacter) || aiData.relationships[0]
          : aiData;

        const updatedRel = { ...existingRel, ...(matchingAiRel || {}) };

        nextRelationships = [...prev.relationships];
        nextRelationships[targetRelIndex] = updatedRel;
      } else {
        const incomingList = Array.isArray(aiData.relationships)
          ? aiData.relationships
          : (aiData.targetCharacter ? [aiData] : []);
        if (incomingList.length > 0) {
          nextRelationships = mergeRelationshipsList(prev.relationships || [], incomingList, isSupplement);
        }
      }
    } else {
      const incomingList = Array.isArray(aiData.relationships)
        ? aiData.relationships
        : (aiData.targetCharacter ? [aiData] : []);
      if (incomingList.length > 0) {
        nextRelationships = mergeRelationshipsList(prev.relationships || [], incomingList, isSupplement);
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
  }

  // 2. MOTIVATION & ZIELE
  let nextGoal = prev.goal;
  let nextMotivationCore = prev.motivationCore;
  let nextGoals = prev.goals;

  if (allowMotivationGoals) {
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
        nextGoals = aiData.goals;
      } else {
        const existingGoalIds = new Set((prev.goals || []).map((g: any) => g.id || g.title));
        const newGoals = aiData.goals.filter((g: any) => !existingGoalIds.has(g.id || g.title));
        nextGoals = [...(prev.goals || []), ...newGoals];
      }
    } else if (aiData.goal && (!prev.goals || prev.goals.length === 0)) {
      nextGoals = [{ id: 'goal-1', title: aiData.goal, timeframe: 'langfristig', targetType: 'self', targetName: 'Selbst', priority: 'hoch', status: 'aktiv', progress: 0 }];
    }
  }

  return {
    ...prev,

    // Updated strictly based on scope:
    relationships: nextRelationships,
    relationship: nextRelationshipText,
    conduct: nextConductText,
    goal: nextGoal,
    motivationCore: nextMotivationCore,
    goals: nextGoals,

    // GUARANTEED UNTOUCHED OTHER DOMAINS:
    name: prev.name,
    nickname: prev.nickname,
    rufName: prev.rufName,
    role: prev.role,
    profession: prev.profession,
    appearance: prev.appearance,
    personality: prev.personality,
    personalityArchetype: prev.personalityArchetype,
    personalityTraits: prev.personalityTraits,
    bio: prev.bio,
    currentSituation: prev.currentSituation,
    skills: prev.skills,
    powerSource: prev.powerSource,
    powerCost: prev.powerCost,
    techniques: prev.techniques,
    abilities: prev.abilities,
    techniqueList: prev.techniqueList,
    campaignPowerLevels: prev.campaignPowerLevels,
    powerSystems: prev.powerSystems,
    powers: prev.powers,
    secondaryProfessions: prev.secondaryProfessions,
    professionField: prev.professionField,
    professionSpecialization: prev.professionSpecialization,
    professionRank: prev.professionRank,
    professionLevel: prev.professionLevel,
    professionDescription: prev.professionDescription,
    craftingSkills: prev.craftingSkills,
    talents: prev.talents,
    everydaySkills: prev.everydaySkills,
    toolsAndEquipment: prev.toolsAndEquipment,
    jobTitle: prev.jobTitle,
    structuredInventory: prev.structuredInventory,
    inventory: prev.inventory,
    weapons: prev.weapons,
    equipment: prev.equipment,
    secretsStage1: prev.secretsStage1,
    secretsStage2: prev.secretsStage2,
    secretsStage3: prev.secretsStage3,
    knowledge: prev.knowledge
  };
}

function mergeRelationshipsList(existingList: any[], incomingList: any[], isSupplement: boolean) {
  if (!incomingList || incomingList.length === 0) return existingList;
  if (!isSupplement) {
    return incomingList.map((r, i) => ({
      id: r.id || `rel_${Date.now()}_${i}`,
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
    } else if (inc.targetCharacter) {
      merged.push({
        id: inc.id || `rel_${Date.now()}_${i}`,
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
        uniqueId = `rel_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
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
          id: ev.id || `ev_${Date.now()}_${evI}`,
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
    goals: Array.isArray(data.goals) && data.goals.length > 0 ? data.goals : (isSupplement ? prev.goals : (data.goal ? [{ id: 'goal-1', title: data.goal, timeframe: 'langfristig', targetType: 'self', targetName: 'Selbst', priority: 'hoch', status: 'aktiv', progress: 0 }] : [])),
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
    secretsStage1: data.secretsStage1 !== undefined ? data.secretsStage1 : (isSupplement ? prev.secretsStage1 : ''),
    secretsStage2: data.secretsStage2 !== undefined ? data.secretsStage2 : (isSupplement ? prev.secretsStage2 : ''),
    secretsStage3: data.secretsStage3 !== undefined ? data.secretsStage3 : (isSupplement ? prev.secretsStage3 : ''),
    knowledge: data.knowledge !== undefined ? data.knowledge : (isSupplement ? prev.knowledge : ''),
    appearance: newAppearance
  };
}
