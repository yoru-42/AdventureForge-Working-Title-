import {
  Adventure,
  Character,
  TechniqueItem,
  ProfessionCompetency,
  BaseAbility,
  EffectiveTechniqueItem
} from '../types';
import { resolveEffectiveMoveset } from './movesetResolver';
import { normalizeAbilityHierarchy } from './abilityHierarchy';
import {
  parseEverydaySkills,
  serializeEverydaySkills,
  getSkillLabel,
  EverydaySkillItem
} from '../components/EverydaySkillsSelect';
import {
  getCentralSkill,
  getSkillDescription
} from '../components/everydaySkillPresets';
import { calculateCompetencyProgress } from '../services/professionCompetencyService';

export type CapabilityCategory =
  | 'passive'
  | 'technique'
  | 'ultimate'
  | 'weapon'
  | 'competence'
  | 'profession';

export type CapabilitySourceType =
  | 'technique'
  | 'passive'
  | 'weapon'
  | 'everyday'
  | 'profession';

/**
 * Einheitliches View-Modell für die zentrale Darstellung aller 6 Fähigkeiten- & Kompetenzbereiche.
 * Dieses Interface ist ein reines Adapter-/Anzeigemodell und erzeugt keine neuen parallelen Speicherdaten.
 */
export interface CharacterCapabilityEntry {
  id: string;
  name: string;
  category: CapabilityCategory;
  categoryLabel: string;
  categoryBadge: string;
  description?: string;
  level?: number;
  maxLevel?: number;
  progress?: number; // 0 - 100
  xp?: number;
  xpNeeded?: number;
  trainingUnits?: number;
  trainingRequired?: number;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  cost?: string;
  type?: string;
  subtype?: string;
  isFavorite: boolean;
  canTrain: boolean;
  canUse: boolean;
  sourceType: CapabilitySourceType;
  sourceId: string;
  // Transformation metadata falls vorhanden
  isTransformedVariant?: boolean;
  originalTechniqueId?: string;
  originalTechniqueName?: string;
}

/**
 * Gibt neutrale Bezeichnungen für UI und Badges zurück.
 */
export function getCategoryLabels(cat: CapabilityCategory): { label: string; badge: string } {
  switch (cat) {
    case 'passive':
      return { label: 'Passive Fähigkeiten', badge: 'Passiv' };
    case 'technique':
      return { label: 'Techniken', badge: 'Technik' };
    case 'ultimate':
      return { label: 'Ultimative Techniken', badge: 'Ultimativ' };
    case 'weapon':
      return { label: 'Waffenbeherrschung', badge: 'Waffe' };
    case 'competence':
      return { label: 'Alltagskompetenzen', badge: 'Alltag' };
    case 'profession':
      return { label: 'Berufe', badge: 'Beruf' };
  }
}

/**
 * Einheitliche Styling-Klassen für die 6 Kategorien (ohne Emojis).
 */
export function getCategoryStyles(cat: CapabilityCategory): {
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
} {
  switch (cat) {
    case 'passive':
      return {
        badgeBg: 'bg-blue-950/80',
        badgeBorder: 'border-blue-500/40',
        badgeText: 'text-blue-300',
        icon: 'fa-shield-halved'
      };
    case 'technique':
      return {
        badgeBg: 'bg-indigo-950/80',
        badgeBorder: 'border-indigo-500/40',
        badgeText: 'text-indigo-300',
        icon: 'fa-bolt'
      };
    case 'ultimate':
      return {
        badgeBg: 'bg-amber-950/80',
        badgeBorder: 'border-amber-500/40',
        badgeText: 'text-amber-300',
        icon: 'fa-crown'
      };
    case 'weapon':
      return {
        badgeBg: 'bg-red-950/80',
        badgeBorder: 'border-red-500/40',
        badgeText: 'text-red-300',
        icon: 'fa-swords'
      };
    case 'competence':
      return {
        badgeBg: 'bg-emerald-950/80',
        badgeBorder: 'border-emerald-500/40',
        badgeText: 'text-emerald-300',
        icon: 'fa-tree'
      };
    case 'profession':
      return {
        badgeBg: 'bg-amber-950/80',
        badgeBorder: 'border-amber-600/40',
        badgeText: 'text-amber-200',
        icon: 'fa-hammer'
      };
  }
}

/**
 * Liest die kanonischen Daten des Charakters aus und erzeugt eine deduplizierte,
 * strukturierte Liste aller Fähigkeiten über alle sechs Entwicklungsbereiche.
 */
export function getCharacterCapabilities(
  character?: Character,
  activeTransIdOverride?: string
): CharacterCapabilityEntry[] {
  if (!character) return [];

  const list: CharacterCapabilityEntry[] = [];
  const seenIds = new Set<string>();
  const seenCategoryName = new Set<string>();

  const canAdd = (
    id: string | undefined,
    category: CapabilityCategory,
    name: string,
    originalTechId?: string,
    originalTechName?: string
  ): boolean => {
    if (!name || !name.trim()) return false;
    const trimmedName = name.trim().toLowerCase();
    const catNameKey = `${category}::${trimmedName}`;

    // 1. Primär nach stabiler ID deduplizieren
    if (id && seenIds.has(id)) return false;
    if (originalTechId && seenIds.has(originalTechId)) return false;

    // 2. Fallback: Kategorie + normalisierter Name
    // (Nicht rein nach Name, damit gleichnamige Einträge in unterschiedlichen Kategorien nicht verschwinden)
    if (seenCategoryName.has(catNameKey)) return false;
    if (originalTechName && originalTechName.trim()) {
      const origCatKey = `${category}::${originalTechName.trim().toLowerCase()}`;
      if (seenCategoryName.has(origCatKey)) return false;
    }

    if (id) seenIds.add(id);
    if (originalTechId) seenIds.add(originalTechId);
    seenCategoryName.add(catNameKey);
    if (originalTechName && originalTechName.trim()) {
      seenCategoryName.add(`${category}::${originalTechName.trim().toLowerCase()}`);
    }
    return true;
  };

  const activeTransId = activeTransIdOverride !== undefined
    ? activeTransIdOverride
    : (character.appearance?.activeTransformationId || 'standard');

  // 1. Effektives Moveset (berücksichtigt Transformationen, Modifikatoren und Freischaltungen)
  const effectiveMoveset: EffectiveTechniqueItem[] = resolveEffectiveMoveset(character, activeTransId, {
    includeDisabled: false
  });

  const registerTechniqueItem = (tech: TechniqueItem | EffectiveTechniqueItem, isEffective = false) => {
    const name = (tech.name || (tech as any).title || '').trim();
    if (!name) return;

    // Ermittle die Kategorie
    let category: CapabilityCategory = 'technique';
    const rawCat = (tech.category || '').toLowerCase();
    const rawType = (tech.type || '').toLowerCase();

    if (
      (tech as any).isUltimate ||
      rawCat.includes('ultimat') ||
      rawType.includes('ultimat') ||
      tech.tier === 'Tier 4'
    ) {
      category = 'ultimate';
    } else if (
      rawCat.includes('passiv') ||
      rawType === 'passiv' ||
      rawType.includes('passiv')
    ) {
      category = 'passive';
    } else if (
      rawCat.includes('waffe') ||
      rawCat.includes('talent') ||
      !!tech.weaponType ||
      !!tech.weaponCategory ||
      !!tech.weaponManeuver
    ) {
      category = 'weapon';
    }

    const { label, badge } = getCategoryLabels(category);
    const effItem = tech as EffectiveTechniqueItem;
    const isTransVariant = isEffective && (!!effItem.isModifiedByTransformation || !!effItem.isUnlockedByTransformation || !!(effItem as any).isTransformedVariant);
    const originalTechId = effItem.originalTechniqueId;
    const originalTechName = effItem.originalTechniqueName;

    const id = tech.id || (originalTechId ? originalTechId : `tech-${category}-${name.toLowerCase().replace(/\s+/g, '-')}`);

    if (!canAdd(id, category, name, originalTechId, originalTechName)) return;

    const level = tech.level !== undefined ? tech.level : 1;
    const maxLevel = tech.maxLevel || 10;
    const progressionLogic = tech.progressionLogic || 'ep';
    const xp = tech.xp !== undefined ? tech.xp : 0;
    const xpNeeded = tech.xpNeeded || 100;
    const trainingUnits = tech.trainingUnits !== undefined ? tech.trainingUnits : (tech.trainingProgress || 0);
    const trainingRequired = tech.trainingRequired || 3;

    let progress = 0;
    if (progressionLogic === 'training') {
      progress = Math.min(100, Math.round((trainingUnits / (trainingRequired || 3)) * 100));
    } else if (progressionLogic === 'ep') {
      progress = Math.min(100, Math.round((xp / (xpNeeded || 100)) * 100));
    }

    // Favoritenstatus prüfen
    const isFav = !!(tech.isFavorite || (tech as any).favorite);

    list.push({
      id,
      name,
      category,
      categoryLabel: label,
      categoryBadge: badge,
      description: tech.description || '',
      level,
      maxLevel,
      progress,
      xp,
      xpNeeded,
      trainingUnits,
      trainingRequired,
      progressionLogic,
      cost: tech.cost || '',
      type: tech.type || (category === 'passive' ? 'Passiv' : 'Aktiv'),
      subtype: tech.subtype || tech.weaponType || '',
      isFavorite: isFav,
      canTrain: level < maxLevel,
      canUse: category !== 'passive', // Passive Fähigkeiten sind dauerhaft aktiv, kein manuelles "Einsetzen"
      sourceType: category === 'passive' ? 'passive' : category === 'weapon' ? 'weapon' : 'technique',
      sourceId: originalTechId || id,
      isTransformedVariant: isTransVariant,
      originalTechniqueId: originalTechId,
      originalTechniqueName: originalTechName
    });
  };

  // 1a. Techniken aus effectiveMoveset eintragen
  effectiveMoveset.forEach(eff => registerTechniqueItem(eff, true));

  // 1b. Alle weiteren Basistechniken aus techniqueList oder normalizeAbilityHierarchy
  const hierarchy = normalizeAbilityHierarchy(character);
  const allHierarchyTechs = hierarchy.techniques;
  allHierarchyTechs.forEach(t => registerTechniqueItem(t, false));

  if (Array.isArray(character.techniqueList)) {
    character.techniqueList.forEach(t => registerTechniqueItem(t, false));
  }

  // 2. Alltagskompetenzen (Source: character.everydaySkills als strukturierte Liste geparst)
  if (character.everydaySkills) {
    const everydayItems: EverydaySkillItem[] = parseEverydaySkills(character.everydaySkills);
    const { label, badge } = getCategoryLabels('competence');

    everydayItems.forEach((es, idx) => {
      const name = es.name.trim();
      if (!name) return;

      const id = es.id || `comp-everyday-${idx}-${name.toLowerCase().replace(/\s+/g, '-')}`;
      if (!canAdd(id, 'competence', name)) return;

      const central = getCentralSkill(name);
      const desc = central?.description || getSkillDescription(name) || es.note || `Alltagskompetenz: ${name}`;

      // Level ableiten (1 bis 5 basierend auf Score 0-100)
      const score = es.score || 0;
      const level = Math.max(1, Math.min(5, Math.ceil((score || 1) / 20)));
      const maxLevel = 5;

      list.push({
        id,
        name,
        category: 'competence',
        categoryLabel: label,
        categoryBadge: badge,
        description: desc,
        level,
        maxLevel,
        progress: score,
        xp: es.xp || 0,
        xpNeeded: 100,
        trainingUnits: es.trainingUnits || 0,
        trainingRequired: 4,
        progressionLogic: 'training',
        type: 'Alltagskompetenz',
        subtype: central?.category || 'Alltag',
        isFavorite: false,
        canTrain: score < 100,
        canUse: true,
        sourceType: 'everyday',
        sourceId: name
      });
    });
  }

  // 3. Berufe & Handwerk (Source: character.professionCompetencies & character.profession)
  const { label: profLabel, badge: profBadge } = getCategoryLabels('profession');

  if (Array.isArray(character.professionCompetencies) && character.professionCompetencies.length > 0) {
    character.professionCompetencies.forEach((pc: ProfessionCompetency, idx) => {
      const name = (pc.name || '').trim();
      if (!name) return;

      const id = pc.id || `comp-profession-${idx}-${name.toLowerCase().replace(/\s+/g, '-')}`;
      if (!canAdd(id, 'profession', name)) return;

      const profScore = Math.max(0, Math.min(100, pc.proficiency || 0));
      const level = Math.max(1, Math.min(10, Math.ceil((profScore || 1) / 10)));

      list.push({
        id,
        name,
        category: 'profession',
        categoryLabel: profLabel,
        categoryBadge: profBadge,
        description: pc.description || `Berufskompetenz: ${name}`,
        level,
        maxLevel: 10,
        progress: profScore,
        xp: pc.experiencePoints || 0,
        xpNeeded: 100,
        progressionLogic: 'ep',
        type: 'Berufskompetenz',
        subtype: pc.category || character.profession || 'Handwerk',
        isFavorite: !!(pc as any).isFavorite,
        canTrain: profScore < 100,
        canUse: true,
        sourceType: 'profession',
        sourceId: pc.id
      });
    });
  } else if (character.profession && character.profession.trim()) {
    // Primärberuf als Kompetenz darstellen, falls keine Einzelkompetenzen vorhanden sind
    const profName = character.profession.trim();
    const id = `comp-profession-main-${profName.toLowerCase().replace(/\s+/g, '-')}`;
    if (canAdd(id, 'profession', profName)) {
      const profScore = Math.max(0, Math.min(100, character.professionProficiencyScore || 15));
      const level = Math.max(1, Math.min(10, Math.ceil((profScore || 1) / 10)));

      list.push({
        id,
        name: profName,
        category: 'profession',
        categoryLabel: profLabel,
        categoryBadge: profBadge,
        description: character.professionDescription || `Berufliche Praxis und Fachwissen im Bereich ${profName}.`,
        level,
        maxLevel: 10,
        progress: profScore,
        xp: character.professionExperiencePoints || 0,
        xpNeeded: 100,
        progressionLogic: 'ep',
        type: 'Hauptberuf',
        subtype: character.professionField || 'Beruf',
        isFavorite: false,
        canTrain: profScore < 100,
        canUse: true,
        sourceType: 'profession',
        sourceId: 'main_profession'
      });
    }
  }

  return list;
}

/**
 * Erzeugt die semantisch korrekte Rollenspiel-Aktionsphrase für "Einsetzen / Anwenden".
 */
export function getCapabilityActionText(capability: CharacterCapabilityEntry): string {
  switch (capability.category) {
    case 'passive':
      return `*nutzt das passive Talent '${capability.name}'*`;
    case 'technique':
      return `*setzt ${capability.name} ein*`;
    case 'ultimate':
      return `*entfesselt die ultimative Technik: ${capability.name}!*`;
    case 'weapon':
      return `*führt ein Manöver mit ${capability.name} aus*`;
    case 'competence':
      return `*wendet die Alltagskompetenz '${capability.name}' an*`;
    case 'profession':
      return `*arbeitet mit der Berufskompetenz '${capability.name}'*`;
  }
}

/**
 * Führt ein Training auf der kanonischen Datenstruktur des Charakters aus.
 * Verwendet die bestehende Progressionslogik (techniqueProgressionRate, professionCompetencyService, EverydaySkillsSelect).
 */
export function trainCharacterCapability(
  adventure: Adventure,
  capability: CharacterCapabilityEntry
): {
  updatedAdventure: Adventure;
  notificationTitle: string;
  roleplayText: string;
  levelUp: boolean;
  newLevel?: number;
  newProgress?: number;
} {
  const player = adventure.player;
  if (!player) {
    return {
      updatedAdventure: adventure,
      notificationTitle: 'Training nicht möglich: Kein Charakter gefunden',
      roleplayText: `*versucht '${capability.name}' zu trainieren*`,
      levelUp: false
    };
  }

  // 1. Techniken, Passive Fähigkeiten, Ultimative Techniken & Waffenbeherrschung
  if (
    capability.sourceType === 'technique' ||
    capability.sourceType === 'passive' ||
    capability.sourceType === 'weapon'
  ) {
    const rate = adventure.world?.techniqueProgressionRate || 'normal';
    let multiplier = 1.0;
    if (rate === 'slow') multiplier = 0.5;
    else if (rate === 'fast') multiplier = 1.5;
    else if (rate === 'extreme') multiplier = 2.5;

    let levelUp = false;
    let newLevel = capability.level || 1;
    let newProgress = capability.progress || 0;

    const targetTechId = capability.originalTechniqueId || capability.sourceId || capability.id;
    const targetNameLower = (capability.originalTechniqueName || capability.name).trim().toLowerCase();

    // Funktion zur Fortschrittsanwendung auf ein einzelnes TechniqueItem
    const applyTechniqueProgress = (t: TechniqueItem): TechniqueItem => {
      const logic = adventure.world?.techniqueProgressionLogic || t.progressionLogic || 'ep';
      const currentLevel = t.level ?? 1;
      const maxLvl = t.maxLevel ?? 10;

      if (currentLevel >= maxLvl) return t;

      if (logic === 'ep') {
        const currentXP = t.xp ?? 0;
        const rawGain = t.xpGainPerUse ?? 30;
        const gain = Math.round(rawGain * multiplier);
        const xpNeeded = t.xpNeeded ?? 100;

        let nextXP = currentXP + gain;
        let nextLevel = currentLevel;

        if (nextXP >= xpNeeded) {
          const numLevels = Math.floor(nextXP / xpNeeded);
          nextXP = nextXP % xpNeeded;
          nextLevel = Math.min(maxLvl, nextLevel + numLevels);
          levelUp = true;
        }

        newLevel = nextLevel;
        newProgress = Math.min(100, Math.round((nextXP / xpNeeded) * 100));

        return {
          ...t,
          level: nextLevel,
          xp: nextXP,
          xpNeeded,
          maxLevel: maxLvl
        };
      } else {
        // 'training' oder Fallback
        const req = t.trainingRequired ?? 3;
        let stepsToGive = 1;
        if (rate === 'fast') stepsToGive = 2;
        else if (rate === 'extreme') stepsToGive = 3;

        let nextProg = (t.trainingProgress ?? t.trainingUnits ?? 0) + stepsToGive;
        let nextLevel = currentLevel;

        if (nextProg >= req) {
          nextProg = 0;
          nextLevel = Math.min(maxLvl, nextLevel + 1);
          levelUp = true;
        }

        newLevel = nextLevel;
        newProgress = Math.min(100, Math.round((nextProg / req) * 100));

        return {
          ...t,
          level: nextLevel,
          trainingProgress: nextProg,
          trainingUnits: nextProg,
          trainingRequired: req,
          maxLevel: maxLvl
        };
      }
    };

    let updatedTechList = Array.isArray(player.techniqueList)
      ? player.techniqueList.map(t => {
          if (
            (t.id && (t.id === targetTechId || t.id === capability.id)) ||
            (t.name && t.name.trim().toLowerCase() === targetNameLower)
          ) {
            return applyTechniqueProgress(t);
          }
          return t;
        })
      : [];

    let updatedAbilities = Array.isArray(player.abilities)
      ? player.abilities.map((ability: any) => {
          if (!Array.isArray(ability.techniqueList)) return ability;
          const nextList = ability.techniqueList.map((t: any) => {
            if (
              (t.id && (t.id === targetTechId || t.id === capability.id)) ||
              (t.name && t.name.trim().toLowerCase() === targetNameLower)
            ) {
              return applyTechniqueProgress(t);
            }
            return t;
          });
          return { ...ability, techniqueList: nextList };
        })
      : player.abilities;

    const roleplayText = levelUp
      ? `*trainiert die Fertigkeit '${capability.name}' erfolgreich und erreicht Stufe ${newLevel}!*`
      : `*trainiert die Fertigkeit '${capability.name}' intensiv*`;

    const notificationTitle = levelUp
      ? `Stufenaufstieg: ${capability.name} ist nun Stufe ${newLevel}!`
      : `Training absolviert: ${capability.name}`;

    return {
      updatedAdventure: {
        ...adventure,
        player: {
          ...player,
          techniqueList: updatedTechList,
          abilities: updatedAbilities
        }
      },
      notificationTitle,
      roleplayText,
      levelUp,
      newLevel,
      newProgress
    };
  }

  // 2. Alltagskompetenzen (Source: player.everydaySkills via parseEverydaySkills & serializeEverydaySkills)
  if (capability.sourceType === 'everyday') {
    const rawSkills = player.everydaySkills || '';
    const parsed = parseEverydaySkills(rawSkills);
    const targetNameLower = capability.name.trim().toLowerCase();

    let levelUp = false;
    let newScore = capability.progress || 0;
    let label = '';

    const updatedItems = parsed.map(item => {
      if (item.name.trim().toLowerCase() === targetNameLower) {
        const curScore = item.score || 0;
        const curUnits = (item.trainingUnits || 0) + 1;
        let score = curScore;

        if (curUnits >= 4) {
          score = Math.min(100, curScore + 15);
          levelUp = true;
          item.trainingUnits = 0;
        } else {
          item.trainingUnits = curUnits;
        }

        item.score = score;
        item.label = getSkillLabel(score);
        newScore = score;
        label = item.label;
      }
      return item;
    });

    const serialized = serializeEverydaySkills(updatedItems);

    const roleplayText = levelUp
      ? `*übt die Alltagskompetenz '${capability.name}' und verbessert ihre Beherrschung auf ${newScore}% (${label})!*`
      : `*übt die Alltagskompetenz '${capability.name}' in der Praxis (+1 Übungseinheit)*`;

    const notificationTitle = levelUp
      ? `Kompetenz erweitert: ${capability.name} (${newScore}%)`
      : `Alltagskompetenz geübt: ${capability.name}`;

    return {
      updatedAdventure: {
        ...adventure,
        player: {
          ...player,
          everydaySkills: serialized
        }
      },
      notificationTitle,
      roleplayText,
      levelUp,
      newProgress: newScore
    };
  }

  // 3. Berufe (Source: player.professionCompetencies mit calculateCompetencyProgress)
  if (capability.sourceType === 'profession') {
    const comps = Array.isArray(player.professionCompetencies) ? [...player.professionCompetencies] : [];
    const targetComp = comps.find(
      c => c.id === capability.sourceId || c.name.trim().toLowerCase() === capability.name.trim().toLowerCase()
    );

    let levelUp = false;
    let newProf = capability.progress || 0;
    let effectiveXp = 0;

    if (targetComp) {
      const progressResult = calculateCompetencyProgress(targetComp, 30);
      effectiveXp = progressResult.effectiveXp;
      const updatedComp = progressResult.updatedCompetency;

      if (progressResult.proficiencyGain > 0) {
        levelUp = true;
      }
      newProf = updatedComp.proficiency;

      const updatedComps = comps.map(c => (c.id === targetComp.id ? updatedComp : c));

      // Profession progress aktualisieren
      const existingProg = player.professionProgress || {
        professionName: player.profession || 'Beruf',
        overallProficiency: 10,
        experiencePoints: 0
      };
      const updatedProg = {
        ...existingProg,
        experiencePoints: (existingProg.experiencePoints || 0) + Math.round(effectiveXp * 0.25),
        overallProficiency: Math.min(100, (existingProg.overallProficiency || 10) + (progressResult.proficiencyGain > 0 ? 1 : 0))
      };

      const roleplayText = levelUp
        ? `*vertieft die berufliche Fertigkeit '${capability.name}' erfolgreich (+${progressResult.proficiencyGain}% auf ${newProf}%)!*`
        : `*arbeitet an der beruflichen Fertigkeit '${capability.name}' und sammelt Erfahrungspunkte*`;

      return {
        updatedAdventure: {
          ...adventure,
          player: {
            ...player,
            professionCompetencies: updatedComps,
            professionProgress: updatedProg
          }
        },
        notificationTitle: `Berufsfähigkeit trainiert: ${capability.name} (${newProf}%)`,
        roleplayText,
        levelUp,
        newProgress: newProf
      };
    } else {
      // Hauptberuf-Fallback
      const curProf = player.professionProficiencyScore || 15;
      const newOverallProf = Math.min(100, curProf + 5);
      const roleplayText = `*übt praktische Arbeiten im Beruf '${player.profession || capability.name}' aus*`;

      return {
        updatedAdventure: {
          ...adventure,
          player: {
            ...player,
            professionProficiencyScore: newOverallProf,
            professionExperiencePoints: (player.professionExperiencePoints || 0) + 25
          }
        },
        notificationTitle: `Berufserfahrung gesammelt: ${player.profession || capability.name}`,
        roleplayText,
        levelUp: false,
        newProgress: newOverallProf
      };
    }
  }

  return {
    updatedAdventure: adventure,
    notificationTitle: 'Training durchgeführt',
    roleplayText: `*trainiert '${capability.name}'*`,
    levelUp: false
  };
}

/**
 * Schaltet den Favoritenstatus auf der kanonischen Datenstruktur um.
 */
export function toggleFavoriteCapability(
  adventure: Adventure,
  capability: CharacterCapabilityEntry
): Adventure {
  const player = adventure.player;
  if (!player) return adventure;

  const nextFavState = !capability.isFavorite;

  // Techniken, Passive Fähigkeiten, Ultimative Techniken & Waffenbeherrschung
  if (
    capability.sourceType === 'technique' ||
    capability.sourceType === 'passive' ||
    capability.sourceType === 'weapon'
  ) {
    const targetTechId = capability.originalTechniqueId || capability.sourceId || capability.id;
    const targetNameLower = (capability.originalTechniqueName || capability.name).trim().toLowerCase();

    const updatedTechList = Array.isArray(player.techniqueList)
      ? player.techniqueList.map(t => {
          if (
            (t.id && (t.id === targetTechId || t.id === capability.id)) ||
            (t.name && t.name.trim().toLowerCase() === targetNameLower)
          ) {
            return { ...t, isFavorite: nextFavState, favorite: nextFavState };
          }
          return t;
        })
      : [];

    const updatedAbilities = Array.isArray(player.abilities)
      ? player.abilities.map((ability: any) => {
          let modified = false;
          let nextList = ability.techniqueList;

          if (Array.isArray(ability.techniqueList)) {
            nextList = ability.techniqueList.map((t: any) => {
              if (
                (t.id && (t.id === targetTechId || t.id === capability.id)) ||
                (t.name && t.name.trim().toLowerCase() === targetNameLower)
              ) {
                modified = true;
                return { ...t, isFavorite: nextFavState, favorite: nextFavState };
              }
              return t;
            });
          }

          if (
            (ability.id && (ability.id === targetTechId || ability.id === capability.id)) ||
            (ability.name && ability.name.trim().toLowerCase() === targetNameLower)
          ) {
            return {
              ...ability,
              isFavorite: nextFavState,
              favorite: nextFavState,
              techniqueList: nextList
            };
          }

          return modified ? { ...ability, techniqueList: nextList } : ability;
        })
      : player.abilities;

    return {
      ...adventure,
      player: {
        ...player,
        techniqueList: updatedTechList,
        abilities: updatedAbilities
      }
    };
  }

  // Berufe
  if (capability.sourceType === 'profession' && Array.isArray(player.professionCompetencies)) {
    const updatedComps = player.professionCompetencies.map(c => {
      if (c.id === capability.sourceId || c.name.trim().toLowerCase() === capability.name.trim().toLowerCase()) {
        return { ...c, isFavorite: nextFavState };
      }
      return c;
    });

    return {
      ...adventure,
      player: {
        ...player,
        professionCompetencies: updatedComps
      }
    };
  }

  return adventure;
}
