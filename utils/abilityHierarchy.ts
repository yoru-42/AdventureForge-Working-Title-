// -*- coding: utf-8 -*-
import {
  BaseAbility,
  AbilityType,
  TechniqueItem,
  CharacterPowerSource,
  Character,
  PowerAbility,
  PowerSystem,
  CharacterPower,
  CharacterAbility,
  CharacterTechnique,
  CharacterPowerForm,
  ProgressionState
} from '../types';

/**
 * Zentrales Verzeichnis aller 19 AdventureForge-Elemente / Aspekte.
 * Diese Liste bleibt kanonisch und wird von Smart Fill, Editoren und Kampfmodulen geteilt.
 */
export const ADVENTURE_FORGE_ELEMENTS: readonly string[] = [
  'Neutral',
  'Feuer',
  'Eis',
  'Blitz',
  'Erde',
  'Wind',
  'Wasser',
  'Licht',
  'Dunkelheit',
  'Kristall',
  'Blut',
  'Leere',
  'Zeit',
  'Raum',
  'Spirit',
  'Chaos',
  'Sonne',
  'Gravitation',
  'Natur'
] as const;

/**
 * Fähigkeitsarten: Bestimmt, was mit dem Element/Aspekt gemacht werden kann.
 */
export const ABILITY_TYPES: readonly { id: AbilityType; label: string; description: string }[] = [
  {
    id: 'creation',
    label: 'Erschaffung',
    description: 'Das Element / der Aspekt kann aus eigener Kraft erzeugt bzw. erschaffen werden.'
  },
  {
    id: 'manipulation',
    label: 'Manipulation',
    description: 'Bereits vorhandenes Element / vorhandener Aspekt kann kontrolliert, bewegt oder verändert werden.'
  },
  {
    id: 'creation_manipulation',
    label: 'Erschaffung + Manipulation',
    description: 'Das Element / der Aspekt kann sowohl erschaffen als auch anschließend manipuliert und geformt werden.'
  }
] as const;

/**
 * Standardmäßige Kinese-Bezeichnungen für die 19 AdventureForge-Elemente.
 */
const ELEMENT_KINESIS_MAP: Record<string, string> = {
  'Feuer': 'Pyrokinese',
  'Eis': 'Kryokinese',
  'Wasser': 'Hydrokinese',
  'Blitz': 'Elektrokinese',
  'Erde': 'Geokinese',
  'Wind': 'Aerokinese',
  'Licht': 'Photokinese',
  'Dunkelheit': 'Umbrakinese',
  'Kristall': 'Kristallokinese',
  'Blut': 'Hämatokinese',
  'Leere': 'Kenokinese',
  'Zeit': 'Chronokinese',
  'Raum': 'Spatiokinese',
  'Spirit': 'Psychokinese',
  'Chaos': 'Chaokinese',
  'Sonne': 'Heliokinese',
  'Gravitation': 'Gyrokinese',
  'Natur': 'Phytokinese',
  'Neutral': 'Kinetik'
};

/**
 * Ermittelt oder generiert den passenden Anzeigenamen für eine Grundfähigkeit aus Element und Fähigkeitsart.
 */
export function resolveKinesisName(element: string, abilityType?: string): string {
  const normElement = (element || '').trim();
  const matchedKey = Object.keys(ELEMENT_KINESIS_MAP).find(
    k => k.toLowerCase() === normElement.toLowerCase()
  );
  if (matchedKey && ELEMENT_KINESIS_MAP[matchedKey]) {
    return ELEMENT_KINESIS_MAP[matchedKey];
  }
  if (!normElement) return 'Grundfähigkeit';
  // Fallback für benutzerdefinierte Elemente
  return `${normElement}-Fähigkeit`;
}

/**
 * Formatiert die Fähigkeitsart für die Anzeige.
 */
export function formatAbilityTypeLabel(type?: string): string {
  if (!type) return 'Erschaffung + Manipulation';
  const norm = type.toLowerCase().trim();
  if (norm === 'creation' || norm === 'erschaffung') return 'Erschaffung';
  if (norm === 'manipulation') return 'Manipulation';
  if (norm === 'creation_manipulation' || norm === 'erschaffung_manipulation' || norm === 'erschaffung + manipulation') {
    return 'Erschaffung + Manipulation';
  }
  return type;
}

/**
 * Formatiert den Fähigkeitstyp als Code-Identifier.
 */
export function normalizeAbilityTypeId(type?: string): AbilityType {
  if (!type) return 'creation_manipulation';
  const norm = type.toLowerCase().trim();
  if (norm === 'creation' || norm === 'erschaffung') return 'creation';
  if (norm === 'manipulation') return 'manipulation';
  return 'creation_manipulation';
}

/**
 * Extrahiert und normalisiert die 3-Ebenen-Hierarchie (Kraftquelle -> Grundfähigkeit -> Technik)
 * aus einem Charakterobjekt, wobei strikte Deduplizierung und vollständige Rückwärtskompatibilität garantiert wird.
 */
export function normalizeAbilityHierarchy(char: any): {
  powerSources: CharacterPowerSource[];
  baseAbilities: BaseAbility[];
  techniques: TechniqueItem[];
} {
  if (!char) {
    return { powerSources: [], baseAbilities: [], techniques: [] };
  }

  // 1. Kraftquellen extrahieren & deduplizieren
  const powerSourcesMap = new Map<string, CharacterPowerSource>();
  const rawSources: any[] = Array.isArray(char.powerSources) && char.powerSources.length > 0
    ? char.powerSources
    : (char.powerSource || char.powerName ? [{
        id: 'ps_default',
        source: char.powerSource || char.powerName,
        powerName: char.powerName || char.powerSource,
        cost: char.powerCost || '',
        powerDescription: char.powerDescription || ''
      }] : [{
        id: 'ps_default',
        source: '',
        powerName: '',
        cost: '',
        powerDescription: ''
      }]);

  rawSources.forEach((ps, idx) => {
    if (!ps) return;
    const pName = (ps.powerName || ps.source || '').trim();
    const id = ps.id || `ps_${idx + 1}`;
    const existing = Array.from(powerSourcesMap.values()).find(
      p => p.id === id || (pName && p.powerName.toLowerCase() === pName.toLowerCase())
    );
    if (!existing) {
      powerSourcesMap.set(id, {
        id,
        source: ps.source || pName || '',
        powerName: pName,
        cost: ps.cost || '',
        powerDescription: ps.powerDescription || ''
      });
    }
  });

  if (powerSourcesMap.size === 0) {
    powerSourcesMap.set('ps_default', {
      id: 'ps_default',
      source: '',
      powerName: '',
      cost: '',
      powerDescription: ''
    });
  }

  const powerSources = Array.from(powerSourcesMap.values());
  const defaultPsId = powerSources[0].id;

  // 2. Grundfähigkeiten deduplizieren
  const baseAbilitiesList: BaseAbility[] = [];
  const baIdAliasMap = new Map<string, string>();

  const registerBaseAbility = (candidate: Partial<BaseAbility> & { id?: string; name?: string }): string => {
    const psId = candidate.powerSourceId && powerSourcesMap.has(candidate.powerSourceId)
      ? candidate.powerSourceId
      : defaultPsId;
    const ps = powerSourcesMap.get(psId);

    const element = candidate.element || 'Neutral';
    const abilityType = normalizeAbilityTypeId(candidate.abilityType);
    const displayName = (candidate.displayName || candidate.name || resolveKinesisName(element, abilityType)).trim();
    const normKey = `${psId}::${displayName.toLowerCase()}`;

    const existing = baseAbilitiesList.find(b => {
      if (candidate.id && b.id === candidate.id) return true;
      const bNormKey = `${b.powerSourceId}::${(b.displayName || b.name || '').trim().toLowerCase()}`;
      return bNormKey === normKey;
    });

    if (existing) {
      if (candidate.id && candidate.id !== existing.id) {
        baIdAliasMap.set(candidate.id, existing.id);
      }
      return existing.id;
    }

    const canonicalId = candidate.id || slugifyPowerId(`${psId}_${displayName}`, 'ba');
    const newBa: BaseAbility = {
      id: canonicalId,
      powerSourceId: psId,
      powerSourceName: ps?.powerName || ps?.source,
      name: candidate.name || displayName,
      displayName,
      element,
      abilityType,
      description: candidate.description || `Erschaffung und Manipulation von ${element}.`,
      level: candidate.level !== undefined ? candidate.level : 1,
      maxLevel: candidate.maxLevel || 10,
      xp: candidate.xp !== undefined ? candidate.xp : 0,
      xpNeeded: candidate.xpNeeded || 100,
      progressionLogic: candidate.progressionLogic || 'ep',
      cost: candidate.cost || '',
      costValue: candidate.costValue,
      costResourceName: candidate.costResourceName || ps?.cost || '',
      baseValue: candidate.baseValue,
      effectValue: candidate.effectValue,
      score: candidate.score,
      trainingProgress: candidate.trainingProgress,
      trainingUnits: candidate.trainingUnits,
      milestoneNote: candidate.milestoneNote,
      points: candidate.points,
      techniqueIds: candidate.techniqueIds || []
    };

    baseAbilitiesList.push(newBa);
    if (candidate.id) {
      baIdAliasMap.set(candidate.id, canonicalId);
    }
    return canonicalId;
  };

  // 2a. Aus char.baseAbilities laden
  if (Array.isArray(char.baseAbilities)) {
    char.baseAbilities.forEach(ba => {
      if (ba) registerBaseAbility(ba);
    });
  }

  // 2b. Aus char.abilities laden (NUR explizit als Grundfähigkeit gekennzeichnete Elemente)
  if (Array.isArray(char.abilities)) {
    char.abilities.forEach(ability => {
      if (!ability) return;
      const isExplicitBaseAbility = ability.category === 'Grundfähigkeiten' || 
        ability.category === 'Grundfähigkeit' || 
        ability.category === 'BaseAbility' || 
        (ability as any).isBaseAbility === true || 
        ability.type === 'Grundfähigkeit';

    if (isExplicitBaseAbility) {
      registerBaseAbility({
        ...ability,
        displayName: ability.displayName || ability.name
      });
    }
  });
}

// 2c. Aus char.standardAbilities laden (falls vorhanden)
if (Array.isArray(char.standardAbilities)) {
  char.standardAbilities.forEach(ability => {
    if (!ability) return;
    const isExplicitBaseAbility = ability.category === 'Grundfähigkeiten' || 
      ability.category === 'Grundfähigkeit' || 
      ability.category === 'BaseAbility' || 
      (ability as any).isBaseAbility === true || 
      ability.type === 'Grundfähigkeit';

    if (isExplicitBaseAbility) {
      registerBaseAbility({
        ...ability,
        displayName: ability.displayName || ability.name
      });
    }
  });
}

  // 3. Techniken sammeln und deduplizieren
  const techniquesMap = new Map<string, TechniqueItem>();

  const registerTechnique = (tech: any, sourceCategory?: string, fallbackBaId?: string) => {
    if (!tech || (!tech.name && !tech.title)) return;
    const techName = (tech.name || tech.title || '').trim();
    if (!techName) return;

    const category = tech.category || sourceCategory || (tech.type === 'Transformation' ? 'Transformationen' : 'Techniken');
    const psId = tech.powerSourceId && powerSourcesMap.has(tech.powerSourceId)
      ? tech.powerSourceId
      : defaultPsId;
    const ps = powerSourcesMap.get(psId);

    const rawBaIds: string[] = Array.isArray(tech.baseAbilityIds) && tech.baseAbilityIds.length > 0
      ? tech.baseAbilityIds
      : (fallbackBaId ? [fallbackBaId] : []);

    const mappedBaIds = Array.from(new Set(
      rawBaIds.map(id => baIdAliasMap.get(id) || id)
    )).filter(id => baseAbilitiesList.some(b => b.id === id));

    const finalBaIds = mappedBaIds;

    const finalBaNames = finalBaIds.map(id => {
      const ba = baseAbilitiesList.find(b => b.id === id);
      return ba ? (ba.displayName || ba.name || 'Grundfähigkeit') : 'Grundfähigkeit';
    });

    const techKey = `${psId}::${category}::${techName.toLowerCase()}`;

    const existing = techniquesMap.get(techKey);
    if (existing) {
      const mergedBaIds = Array.from(new Set([...(existing.baseAbilityIds || []), ...finalBaIds]));
      existing.baseAbilityIds = mergedBaIds;
      existing.baseAbilityNames = mergedBaIds.map(id => {
        const ba = baseAbilitiesList.find(b => b.id === id);
        return ba ? (ba.displayName || ba.name || 'Grundfähigkeit') : 'Grundfähigkeit';
      });
      if (!existing.description && tech.description) existing.description = tech.description;
      if (!existing.mode && tech.mode) existing.mode = tech.mode;
      if (tech.costValue !== undefined && existing.costValue === undefined) existing.costValue = tech.costValue;
      if (tech.summonCount !== undefined && existing.summonCount === undefined) existing.summonCount = tech.summonCount;
      if (tech.summonCostValue !== undefined && existing.summonCostValue === undefined) existing.summonCostValue = tech.summonCostValue;
      if (tech.trainingProgress !== undefined) existing.trainingProgress = tech.trainingProgress;
      if (tech.trainingUnits !== undefined) existing.trainingUnits = tech.trainingUnits;
      if (tech.milestoneNote !== undefined) existing.milestoneNote = tech.milestoneNote;
      if (tech.points !== undefined) existing.points = tech.points;
      if (tech.score !== undefined) existing.score = tech.score;
      if (tech.xp !== undefined) existing.xp = tech.xp;
      if (tech.level !== undefined) existing.level = tech.level;
      if (tech.tier) existing.tier = tech.tier;
      if (tech.masteryLevel) existing.masteryLevel = tech.masteryLevel;
      if (tech.weaponType) existing.weaponType = tech.weaponType;
      if (tech.weaponCategory) existing.weaponCategory = tech.weaponCategory;
      if (tech.wieldingStyle) existing.wieldingStyle = tech.wieldingStyle;
      if (tech.weaponManeuver) existing.weaponManeuver = tech.weaponManeuver;
      if (tech.progressionLogic) existing.progressionLogic = tech.progressionLogic;
      if (tech.transformationModifiers) existing.transformationModifiers = tech.transformationModifiers;
      if (tech.unlockedByTransformationId) existing.unlockedByTransformationId = tech.unlockedByTransformationId;
      if (tech.unlockedByTransformationIds) existing.unlockedByTransformationIds = tech.unlockedByTransformationIds;
      if (tech.isTransformationOnly !== undefined) existing.isTransformationOnly = tech.isTransformationOnly;
      if (tech.isFavorite || tech.favorite) {
        existing.isFavorite = true;
        existing.favorite = true;
      }
      return;
    }

    const techId = tech.id || slugifyPowerId(`${psId}_${category}_${techName}`, 'tech');
    const costResource = tech.costResourceName || ps?.cost || 'Mana';
    const costVal = tech.costValue !== undefined ? tech.costValue : (category === 'Passive Fähigkeiten' ? 0 : 10);
    const costStr = tech.cost || (category === 'Passive Fähigkeiten' ? 'Passiv' : `${costVal} ${costResource}`);
    const isFav = !!(tech.isFavorite || tech.favorite);

    const newTech: TechniqueItem = {
      ...tech,
      id: techId,
      name: techName,
      description: tech.description || '',
      category: (category === 'Talente' ? 'Waffenbeherrschung' : category),
      type: tech.type || (category === 'Transformationen' ? 'Transformation' : (category === 'Passive Fähigkeiten' ? 'Support' : (category === 'Waffenbeherrschung' || category === 'Talente' ? 'Spezial' : 'Angriff'))),
      subtype: tech.subtype || '',
      mode: tech.mode || 'Normal',
      tier: tech.tier || (category === 'Ultimative Techniken' ? 'Tier 4' : 'Tier 1'),
      baseAbilityIds: finalBaIds,
      baseAbilityNames: finalBaNames,
      powerSourceId: psId,
      powerSourceName: ps?.powerName || ps?.source,
      element: tech.element || baseAbilitiesList.find(b => b.id === finalBaIds[0])?.element || 'Neutral',
      abilityType: tech.abilityType || baseAbilitiesList.find(b => b.id === finalBaIds[0])?.abilityType || 'creation_manipulation',
      targetType: tech.targetType || 'Selbst / Verbündete / Feinde',
      effects: tech.effects || (tech.applications ? tech.applications : []),
      costResourceName: costResource,
      costValue: costVal,
      costFormula: tech.costFormula || 'absolut',
      cost: costStr,
      range: tech.range || 'Nahkampf / Mittlere Distanz',
      duration: tech.duration || 'Sofort',
      summonCount: tech.summonCount,
      summonCostValue: tech.summonCostValue,
      summonCostFormula: tech.summonCostFormula,
      activationCondition: tech.activationCondition,
      transformName: tech.transformName,
      level: tech.level !== undefined ? tech.level : 1,
      maxLevel: tech.maxLevel || 10,
      xp: tech.xp !== undefined ? tech.xp : 0,
      xpNeeded: tech.xpNeeded || 100,
      trainingProgress: tech.trainingProgress !== undefined ? tech.trainingProgress : (tech.score !== undefined ? tech.score : 0),
      trainingUnits: tech.trainingUnits !== undefined ? tech.trainingUnits : 0,
      score: tech.score !== undefined ? tech.score : (tech.trainingProgress !== undefined ? tech.trainingProgress : 0),
      milestoneNote: tech.milestoneNote,
      points: tech.points,
      weaponType: tech.weaponType,
      weaponCategory: tech.weaponCategory,
      masteryLevel: tech.masteryLevel,
      wieldingStyle: tech.wieldingStyle,
      weaponManeuver: tech.weaponManeuver,
      progressionLogic: tech.progressionLogic,
      xpGainPerUse: tech.xpGainPerUse,
      trainingRequired: tech.trainingRequired,
      milestoneRequirement: tech.milestoneRequirement,
      staticCost: tech.staticCost,
      metamorphosisInfluence: tech.metamorphosisInfluence,
      scaling: tech.scaling,
      parentTransformationId: tech.parentTransformationId,
      transformationModifiers: tech.transformationModifiers,
      unlockedByTransformationId: tech.unlockedByTransformationId,
      unlockedByTransformationIds: tech.unlockedByTransformationIds,
      isTransformationOnly: tech.isTransformationOnly,
      chibiForm: tech.chibiForm,
      chibiOnPowerOverload: tech.chibiOnPowerOverload,
      isFavorite: isFav,
      favorite: isFav
    };

    techniquesMap.set(techKey, newTech);
  };

  // 3a. Aus char.techniqueList oder char.techniques (falls Array)
  if (Array.isArray(char.techniqueList)) {
    char.techniqueList.forEach(t => registerTechnique(t));
  }
  if (Array.isArray(char.techniques)) {
    char.techniques.forEach(t => registerTechnique(t));
  }

  // 3b. Aus char.abilities
  if (Array.isArray(char.abilities)) {
    char.abilities.forEach(ability => {
      if (!ability) return;
      const canonicalBaId = baIdAliasMap.get(ability.id) || ability.id;
      const isExplicitBa = ability.category === 'Grundfähigkeiten' || 
        ability.category === 'Grundfähigkeit' || 
        ability.category === 'BaseAbility' || 
        (ability as any).isBaseAbility === true || 
        ability.type === 'Grundfähigkeit';
      const isTransformation = ability.category === 'Transformationen' || ability.type === 'Transformation';
      const isRegisteredBa = baseAbilitiesList.some(b => b.id === canonicalBaId);

      // Eine Fähigkeit, die KEINE Grundfähigkeit ist, wird als eigenständige Technik/Passiv/Transformation registriert.
      // WICHTIG: Niemals canonicalBaId als fallbackBaId für die Fähigkeit selbst übergeben!
      // Eine Technik gehört nur zu einer Grundfähigkeit, wenn explizit baseAbilityIds vorhanden sind.
      if (!isExplicitBa && !isRegisteredBa) {
        registerTechnique(ability, ability.category);
      }

      // Verarbeite eingebettete Techniken (Legacy-Format)
      if (Array.isArray(ability.techniqueList)) {
        ability.techniqueList.forEach(t => {
          if (isTransformation) {
            registerTechnique({
              ...t,
              unlockedByTransformationId: t.unlockedByTransformationId || ability.id,
              parentTransformationId: t.parentTransformationId || ability.id,
              isTransformationOnly: t.isTransformationOnly !== undefined ? t.isTransformationOnly : true
            }, t.category || (t.type === 'Support' ? 'Passive Fähigkeiten' : (t.tier === 'Tier 4' ? 'Ultimative Techniken' : 'Techniken')));
          } else {
            // Nur wenn ability tatsächlich eine registrierte Grundfähigkeit war, ist canonicalBaId der Fallback für Kind-Techniken
            registerTechnique(t, undefined, isRegisteredBa ? canonicalBaId : undefined);
          }
        });
      } else if (typeof ability.techniques === 'string' && ability.techniques.trim().length > 0) {
        const tNames = ability.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean);
        tNames.forEach((tName: string) => {
          if (isTransformation) {
            registerTechnique({
              name: tName,
              unlockedByTransformationId: ability.id,
              parentTransformationId: ability.id,
              isTransformationOnly: true
            }, 'Techniken');
          } else {
            registerTechnique({ name: tName }, undefined, isRegisteredBa ? canonicalBaId : undefined);
          }
        });
      }
    });
  }

  // 3c. Aus char.standardAbilities (Techniken / Passive / etc., die keine Grundfähigkeiten sind)
  if (Array.isArray(char.standardAbilities)) {
    char.standardAbilities.forEach(ability => {
      if (!ability) return;
      const isExplicitBa = ability.category === 'Grundfähigkeiten' || 
        ability.category === 'Grundfähigkeit' || 
        ability.category === 'BaseAbility' || 
        (ability as any).isBaseAbility === true || 
        ability.type === 'Grundfähigkeit';
      if (!isExplicitBa) {
        registerTechnique(ability, ability.category);
      }
    });
  }

  // 3d. Aus char.transformations
  if (Array.isArray(char.transformations)) {
    char.transformations.forEach(tr => {
      if (!tr) return;
      registerTechnique(tr, 'Transformationen');
      if (Array.isArray(tr.techniqueList)) {
        tr.techniqueList.forEach((t: any) => {
          registerTechnique({
            ...t,
            unlockedByTransformationId: t.unlockedByTransformationId || tr.id,
            parentTransformationId: t.parentTransformationId || tr.id,
            isTransformationOnly: t.isTransformationOnly !== undefined ? t.isTransformationOnly : true
          }, t.category || (t.type === 'Support' ? 'Passive Fähigkeiten' : (t.tier === 'Tier 4' ? 'Ultimative Techniken' : 'Techniken')));
        });
      }
    });
  }

  const techniquesList = Array.from(techniquesMap.values());

  // 4. techniqueIds in baseAbilities verknüpfen
  baseAbilitiesList.forEach(ba => {
    ba.techniqueIds = techniquesList
      .filter(t => t.baseAbilityIds?.includes(ba.id))
      .map(t => t.id);
  });

  return {
    powerSources,
    baseAbilities: baseAbilitiesList,
    techniques: techniquesList
  };
}

/**
 * Synchronisiert die hierarchische Struktur zurück in das Character-Objekt,
 * inklusive der legacy-Felder `abilities` und `techniques` für lückenlose Kompatibilität.
 */
export function syncCharacterAbilityTree(
  originalChar: any,
  powerSources: CharacterPowerSource[],
  baseAbilities: BaseAbility[],
  techniques: TechniqueItem[]
): any {
  // Baue das legacy abilities Array synchronisiert auf
  const legacyAbilities: PowerAbility[] = baseAbilities.map(ba => {
    const ps = powerSources.find(p => p.id === ba.powerSourceId) || powerSources[0];
    const techForBa = techniques.filter(t => t.baseAbilityIds?.includes(ba.id));

    return {
      id: ba.id,
      name: ba.displayName || ba.name,
      displayName: ba.displayName,
      category: 'Grundfähigkeiten',
      source: ps?.powerName || ps?.source || 'Kraftquelle',
      cost: ba.cost || ps?.cost || 'Mana',
      description: ba.description || '',
      techniques: techForBa.map(t => t.name).join(', '),
      powerSourceId: ba.powerSourceId,
      element: ba.element,
      abilityType: ba.abilityType,
      baseAbilityIds: [ba.id],
      techniqueList: techForBa,
      level: ba.level,
      xp: ba.xp,
      maxLevel: ba.maxLevel,
      progressionLogic: ba.progressionLogic,
      costValue: ba.costValue,
      costResourceName: ba.costResourceName
    };
  });

  // Ergänze Einträge aus anderen Kategorien (Passive Fähigkeiten, Ultimative Techniken, Transformationen, Waffenbeherrschung, Talente)
  const additionalLegacyAbilities: PowerAbility[] = techniques
    .filter(t => t.category && t.category !== 'Techniken')
    .map(t => {
      const ps = powerSources.find(p => p.id === t.powerSourceId) || powerSources[0];
      return {
        id: t.id,
        name: t.name,
        displayName: t.name,
        category: t.category,
        source: t.powerSourceName || ps?.powerName || ps?.source || 'Kraftquelle',
        cost: t.cost || (t.category === 'Passive Fähigkeiten' ? 'Passiv' : '0 Mana'),
        description: t.description || '',
        techniques: t.name,
        powerSourceId: t.powerSourceId || ps?.id,
        element: t.element,
        abilityType: t.abilityType as any,
        baseAbilityIds: t.baseAbilityIds || [],
        techniqueList: [t],
        transformName: t.transformName,
        parentTransformationId: t.parentTransformationId,
        metamorphosisInfluence: t.metamorphosisInfluence,
        activationCondition: t.activationCondition,
        transformationModifiers: t.transformationModifiers,
        unlockedByTransformationId: t.unlockedByTransformationId,
        unlockedByTransformationIds: t.unlockedByTransformationIds,
        isTransformationOnly: t.isTransformationOnly,
        chibiForm: t.chibiForm,
        chibiOnPowerOverload: t.chibiOnPowerOverload
      };
    });

  const allTechNames = techniques.map(t => t.name).filter(Boolean).join(', ');

  return {
    ...originalChar,
    powerSources,
    baseAbilities,
    techniqueList: techniques,
    abilities: [...legacyAbilities, ...additionalLegacyAbilities],
    techniques: allTechNames
  };
}

/**
 * Hierarchischer Knoten für den Fähigkeitsbaum.
 */
export interface AbilityTreeNode {
  powerSource: CharacterPowerSource;
  baseAbilities: {
    baseAbility: BaseAbility;
    techniques: TechniqueItem[];
  }[];
}

/**
 * Gruppiert Kraftquellen, Grundfähigkeiten und Techniken in eine Baumstruktur.
 */
export function buildTechniqueTree(
  powerSources: CharacterPowerSource[],
  baseAbilities: BaseAbility[],
  techniques: TechniqueItem[]
): AbilityTreeNode[] {
  return powerSources.map(ps => {
    const matchingBaseAbilities = baseAbilities.filter(
      ba => ba.powerSourceId === ps.id || (!ba.powerSourceId && ps.id === powerSources[0]?.id)
    );

    const baseAbilityNodes = matchingBaseAbilities.map(ba => {
      const matchingTechs = techniques.filter(
        t => Boolean(t.baseAbilityIds?.includes(ba.id))
      );
      return {
        baseAbility: ba,
        techniques: matchingTechs
      };
    });

    return {
      powerSource: ps,
      baseAbilities: baseAbilityNodes
    };
  });
}

// ============================================================================
// MIGRATION & MAPPING UTILITIES: POWER - ABILITY - TECHNIQUE - FORM ARCHITECTURE
// ============================================================================

/**
 * Extrahiert den gemeinsamen ProgressionState aus einem beliebigen Objekt.
 */
export function extractProgressionState(item: any): ProgressionState | undefined {
  if (!item || typeof item !== 'object') return undefined;
  if (item.progression && typeof item.progression === 'object') {
    return { ...item.progression };
  }

  const hasProgression =
    item.level !== undefined ||
    item.xp !== undefined ||
    item.maxLevel !== undefined ||
    item.xpNeeded !== undefined ||
    item.progressionLogic !== undefined ||
    item.xpGainPerUse !== undefined ||
    item.trainingRequired !== undefined ||
    item.trainingUnits !== undefined ||
    item.trainingProgress !== undefined ||
    item.score !== undefined ||
    item.milestoneRequirement !== undefined ||
    item.milestoneNote !== undefined ||
    item.points !== undefined ||
    item.isUnlocked !== undefined ||
    item.isLearnable !== undefined;

  if (!hasProgression) return undefined;

  return {
    level: item.level,
    xp: item.xp,
    maxLevel: item.maxLevel,
    xpNeeded: item.xpNeeded,
    progressionLogic: item.progressionLogic,
    xpGainPerUse: item.xpGainPerUse,
    trainingRequired: item.trainingRequired,
    trainingUnits: item.trainingUnits,
    trainingProgress: item.trainingProgress,
    score: item.score,
    milestoneRequirement: item.milestoneRequirement,
    milestoneNote: item.milestoneNote,
    points: item.points,
    isUnlocked: item.isUnlocked,
    isLearnable: item.isLearnable
  };
}

/**
 * Erzeugt einen stabilen, deterministischen Slug-Bezeichner für IDs ohne Zufalls- oder Zeitstempelwerte.
 */
export function slugifyPowerId(text: string, prefix: string): string {
  const slug = (text || '')
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug ? `${prefix}_${slug}` : `${prefix}_default`;
}

/**
 * Erzeugt eine eindeutige deterministische ID basierend auf Prefix, Name und bestehenden IDs.
 */
export function generateUniqueSlugId(prefix: string, baseName: string, existingIds?: string[] | Set<string>): string {
  const cleanPrefix = prefix.replace(/_+$/, '');
  const cleanBase = slugifyPowerId(baseName || 'neu', cleanPrefix);
  let candidate = cleanBase.startsWith(`${cleanPrefix}_`) ? cleanBase : `${cleanPrefix}_${cleanBase}`;
  if (!existingIds) return candidate;
  const set = existingIds instanceof Set ? existingIds : new Set(existingIds);
  if (!set.has(candidate)) return candidate;
  let counter = 2;
  while (set.has(`${candidate}_${counter}`)) {
    counter++;
  }
  return `${candidate}_${counter}`;
}

export function generatePowerSystemId(name: string, existingIds?: string[] | Set<string>): string {
  return generateUniqueSlugId('sys', name || 'system', existingIds);
}

export function generateCharacterPowerId(powerSystemId: string, name: string, existingIds?: string[] | Set<string>): string {
  const cleanSys = (powerSystemId || 'sys').replace(/^sys_/, '');
  return generateUniqueSlugId(`power_${cleanSys}`, name || 'kraft', existingIds);
}

export function generateCharacterAbilityId(powerId: string, name: string, existingIds?: string[] | Set<string>): string {
  const cleanPow = (powerId || 'power').replace(/^power_/, '');
  return generateUniqueSlugId(`ab_${cleanPow}`, name || 'faehigkeit', existingIds);
}

export function generateCharacterTechniqueId(abilityOrPowerId: string, name: string, existingIds?: string[] | Set<string>): string {
  const cleanParent = (abilityOrPowerId || 'parent').replace(/^(ab|power|form)_/, '');
  return generateUniqueSlugId(`tech_${cleanParent}`, name || 'technik', existingIds);
}

export function generateCharacterPowerFormId(powerId: string, name: string, existingIds?: string[] | Set<string>): string {
  const cleanPow = (powerId || 'power').replace(/^power_/, '');
  return generateUniqueSlugId(`form_${cleanPow}`, name || 'gestalt', existingIds);
}

/**
 * Wandelt eine Legacy-Kraftquelle in ein PowerSystem um.
 */
export function powerSourceToPowerSystem(source: CharacterPowerSource, powerIds?: string[]): PowerSystem {
  const rawSystemName = (source.source || source.powerName || 'Unbekanntes Kraftsystem').trim();
  const sysSlug = slugifyPowerId(rawSystemName, 'sys');
  const sysId = source.id && source.id.startsWith('sys_') 
    ? source.id 
    : (source.id ? `sys_${source.id.replace(/^ps_/, '')}` : sysSlug);

  const rawPowerName = (source.powerName || source.source || 'Konkrete Kraft').trim();
  const powerSlug = slugifyPowerId(rawPowerName, 'power');
  const defaultPowerId = source.id && source.id.startsWith('power_') 
    ? source.id 
    : (source.id ? (source.id.startsWith('ps_') ? `power_${source.id.replace(/^ps_/, '')}` : `power_${source.id}`) : powerSlug);

  const resolvedPowerIds = powerIds && powerIds.length > 0 ? powerIds : [defaultPowerId];

  return {
    id: sysId,
    name: rawSystemName,
    description: source.powerDescription || undefined,
    systemType: source.source || 'Magie',
    origin: undefined,
    resourceName: source.cost || undefined,
    powerIds: resolvedPowerIds
  };
}

/**
 * Wandelt eine Legacy-Kraftquelle in eine konkrete CharacterPower um.
 */
export function powerSourceToCharacterPower(
  source: CharacterPowerSource,
  systemId?: string,
  abilityIds?: string[],
  formIds?: string[]
): CharacterPower {
  const rawPowerName = (source.powerName || source.source || 'Konkrete Kraft').trim();
  const rawSystemName = (source.source || source.powerName || 'Unbekanntes Kraftsystem').trim();
  
  const powerId = source.id && source.id.startsWith('power_') 
    ? source.id 
    : (source.id ? (source.id.startsWith('ps_') ? `power_${source.id.replace(/^ps_/, '')}` : (source.id.startsWith('sys_') ? slugifyPowerId(rawPowerName, 'power') : source.id)) : slugifyPowerId(rawPowerName, 'power'));

  const resolvedSysId = systemId || (source.id && source.id.startsWith('sys_') 
    ? source.id 
    : (source.id ? `sys_${source.id.replace(/^ps_/, '')}` : slugifyPowerId(rawSystemName, 'sys')));

  const resolvedAbilityIds = abilityIds || (Array.isArray(source.baseAbilities) ? source.baseAbilities.map(ba => ba.id).filter(Boolean) : []);

  return {
    id: powerId,
    powerSystemId: resolvedSysId,
    name: rawPowerName,
    description: source.powerDescription || undefined,
    resourceName: source.cost || undefined,
    abilityIds: resolvedAbilityIds,
    formIds: formIds || [],
    progression: extractProgressionState(source)
  };
}

/**
 * Wandelt eine Legacy-BaseAbility in eine CharacterAbility um.
 */
export function baseAbilityToCharacterAbility(
  baseAbility: BaseAbility,
  powerId?: string,
  techniqueIds?: string[]
): CharacterAbility {
  const abId = baseAbility.id || slugifyPowerId(baseAbility.displayName || baseAbility.name || 'ability', 'ab');
  const resolvedPowerId = powerId || (baseAbility.powerSourceId ? (baseAbility.powerSourceId.startsWith('power_') ? baseAbility.powerSourceId : (baseAbility.powerSourceId.startsWith('ps_') ? `power_${baseAbility.powerSourceId.replace(/^ps_/, '')}` : baseAbility.powerSourceId)) : 'power_default');
  const resolvedTechIds = techniqueIds || baseAbility.techniqueIds || [];

  return {
    id: abId,
    powerId: resolvedPowerId,
    name: (baseAbility.displayName || baseAbility.name || resolveKinesisName(baseAbility.element || 'Neutral', baseAbility.abilityType)).trim(),
    description: baseAbility.description,
    abilityType: formatAbilityTypeLabel(baseAbility.abilityType),
    element: baseAbility.element || 'Neutral',
    techniqueIds: resolvedTechIds,
    progression: extractProgressionState(baseAbility)
  };
}

/**
 * Wandelt ein Legacy-TechniqueItem in eine CharacterTechnique um.
 */
export function techniqueItemToCharacterTechnique(
  tech: TechniqueItem,
  abilityId?: string,
  powerId?: string
): CharacterTechnique {
  const techId = tech.id || slugifyPowerId(tech.name || 'technique', 'tech');
  const rawBaId = Array.isArray(tech.baseAbilityIds) && tech.baseAbilityIds.length > 0 ? tech.baseAbilityIds[0] : undefined;
  const resolvedAbilityId = abilityId || rawBaId;
  const resolvedPowerId = powerId || (tech.powerSourceId ? (tech.powerSourceId.startsWith('power_') ? tech.powerSourceId : (tech.powerSourceId.startsWith('ps_') ? `power_${tech.powerSourceId.replace(/^ps_/, '')}` : tech.powerSourceId)) : undefined);

  return {
    id: techId,
    abilityId: resolvedAbilityId,
    powerId: resolvedPowerId,
    name: (tech.name || '').trim(),
    description: tech.description,
    techniqueType: tech.type || (tech.category === 'Passive Fähigkeiten' ? 'Passiv' : (tech.category === 'Ultimative Techniken' ? 'Ultimativ' : 'Angriff')),
    mode: tech.mode,
    element: tech.element,
    targetType: tech.targetType,
    effects: tech.effects || (tech.applications ? tech.applications : undefined),
    range: tech.range,
    duration: tech.duration,
    cost: tech.cost,
    costValue: tech.costValue,
    costFormula: tech.costFormula,
    costResourceName: tech.costResourceName,
    progression: extractProgressionState(tech)
  };
}

/**
 * Wandelt ein Transformations-TechniqueItem in eine CharacterPowerForm um.
 */
export function techniqueItemToCharacterPowerForm(
  tech: TechniqueItem,
  powerId?: string
): CharacterPowerForm {
  const formId = tech.id || slugifyPowerId(tech.transformName || tech.name || 'form', 'form');
  const resolvedPowerId = powerId || (tech.powerSourceId ? (tech.powerSourceId.startsWith('power_') ? tech.powerSourceId : (tech.powerSourceId.startsWith('ps_') ? `power_${tech.powerSourceId.replace(/^ps_/, '')}` : tech.powerSourceId)) : undefined);
  const modifiers: Record<string, number | string> = {};

  if (Array.isArray(tech.transformationModifiers)) {
    tech.transformationModifiers.forEach((mod: any, idx: number) => {
      if (mod.targetStat) {
        modifiers[mod.targetStat] = mod.value ?? mod.targetStat;
      } else if (mod.overrideName) {
        modifiers[`override_name_${mod.transformationId || idx}`] = mod.overrideName;
      } else if (mod.notes) {
        modifiers[`notes_${idx}`] = mod.notes;
      } else if (mod.description) {
        modifiers[`modifier_${idx}`] = mod.description;
      }
    });
  }

  return {
    id: formId,
    powerId: resolvedPowerId,
    name: (tech.transformName || tech.name || 'Transformation').trim(),
    description: tech.description,
    formType: tech.subtype || 'Transformation',
    abilityIds: tech.baseAbilityIds || [],
    techniqueIds: [],
    modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
    progression: extractProgressionState(tech)
  };
}

/**
 * Konvertiert eine CharacterPower zurück in eine Legacy-CharacterPowerSource.
 */
export function characterPowerToLegacyPower(
  power: CharacterPower,
  system?: PowerSystem,
  baseAbilities?: BaseAbility[]
): CharacterPowerSource {
  return {
    id: power.id,
    source: system?.systemType || system?.name || power.name,
    powerName: power.name,
    powerDescription: power.description,
    cost: power.resourceName || system?.resourceName || 'Mana',
    baseAbilities: baseAbilities
  };
}

/**
 * Konvertiert eine CharacterAbility zurück in eine Legacy-BaseAbility.
 */
export function characterAbilityToLegacyBaseAbility(
  ability: CharacterAbility,
  power?: CharacterPower
): BaseAbility {
  const element = ability.element || 'Neutral';
  const abilityType = normalizeAbilityTypeId(ability.abilityType);

  return {
    id: ability.id,
    powerSourceId: ability.powerId || power?.id || 'ps_default',
    powerSourceName: power?.name,
    name: ability.name,
    displayName: ability.name,
    element,
    abilityType,
    description: ability.description,
    techniqueIds: ability.techniqueIds || [],
    level: ability.progression?.level,
    xp: ability.progression?.xp,
    maxLevel: ability.progression?.maxLevel,
    xpNeeded: ability.progression?.xpNeeded,
    progressionLogic: ability.progression?.progressionLogic,
    xpGainPerUse: ability.progression?.xpGainPerUse,
    trainingRequired: ability.progression?.trainingRequired,
    trainingUnits: ability.progression?.trainingUnits,
    trainingProgress: ability.progression?.trainingProgress,
    score: ability.progression?.score,
    milestoneRequirement: ability.progression?.milestoneRequirement,
    milestoneNote: ability.progression?.milestoneNote,
    points: ability.progression?.points,
    costResourceName: power?.resourceName
  };
}

/**
 * Konvertiert eine CharacterTechnique zurück in ein Legacy-TechniqueItem.
 */
export function characterTechniqueToLegacyTechnique(
  tech: CharacterTechnique,
  ability?: CharacterAbility,
  power?: CharacterPower
): TechniqueItem {
  const isPassive = tech.techniqueType === 'Passiv' || (tech.effects && tech.effects.includes('Passiv'));
  const isUlt = tech.techniqueType === 'Ultimativ';
  const category = isPassive ? 'Passive Fähigkeiten' : (isUlt ? 'Ultimative Techniken' : 'Techniken');

  return {
    id: tech.id,
    name: tech.name,
    description: tech.description,
    type: tech.techniqueType || (isPassive ? 'Support' : 'Angriff'),
    mode: tech.mode || 'Normal',
    category,
    tier: isUlt ? 'Tier 4' : 'Tier 1',
    baseAbilityIds: tech.abilityId ? [tech.abilityId] : (ability ? [ability.id] : []),
    baseAbilityNames: ability ? [ability.name] : [],
    powerSourceId: tech.powerId || power?.id || ability?.powerId,
    powerSourceName: power?.name,
    element: tech.element || ability?.element || 'Neutral',
    targetType: tech.targetType,
    effects: tech.effects,
    range: tech.range,
    duration: tech.duration,
    cost: tech.cost,
    costValue: tech.costValue,
    costFormula: tech.costFormula as any,
    costResourceName: tech.costResourceName || power?.resourceName,
    level: tech.progression?.level,
    xp: tech.progression?.xp,
    maxLevel: tech.progression?.maxLevel,
    xpNeeded: tech.progression?.xpNeeded,
    progressionLogic: tech.progression?.progressionLogic as any,
    xpGainPerUse: tech.progression?.xpGainPerUse,
    trainingRequired: tech.progression?.trainingRequired,
    trainingUnits: tech.progression?.trainingUnits,
    trainingProgress: tech.progression?.trainingProgress,
    score: tech.progression?.score,
    milestoneRequirement: tech.progression?.milestoneRequirement,
    milestoneNote: tech.progression?.milestoneNote,
    points: tech.progression?.points,
    isLearnable: tech.progression?.isLearnable
  };
}

/**
 * Konvertiert eine CharacterPowerForm zurück in ein Transformations-TechniqueItem.
 */
export function characterPowerFormToLegacyTransformation(
  form: CharacterPowerForm,
  power?: CharacterPower
): TechniqueItem {
  return {
    id: form.id,
    name: form.name,
    transformName: form.name,
    description: form.description,
    type: 'Transformation',
    category: 'Transformationen',
    powerSourceId: form.powerId || power?.id,
    powerSourceName: power?.name,
    baseAbilityIds: form.abilityIds || [],
    level: form.progression?.level,
    xp: form.progression?.xp,
    maxLevel: form.progression?.maxLevel,
    xpNeeded: form.progression?.xpNeeded,
    progressionLogic: form.progression?.progressionLogic as any
  };
}

/**
 * Überführt die Legacy-Fähigkeitenstruktur eines Charakters vollständig in das neue
 * hierarchische Modell (PowerSystem -> CharacterPower -> CharacterAbility -> CharacterTechnique / CharacterPowerForm).
 */
export function convertLegacyToPowerHierarchy(char: any): {
  powerSystems: PowerSystem[];
  powers: CharacterPower[];
  abilities: CharacterAbility[];
  techniques: CharacterTechnique[];
  forms: CharacterPowerForm[];
} {
  const normalized = normalizeAbilityHierarchy(char);
  const powerSystemsMap = new Map<string, PowerSystem>();
  const powers: CharacterPower[] = [];
  const abilities: CharacterAbility[] = [];
  const techniques: CharacterTechnique[] = [];
  const forms: CharacterPowerForm[] = [];

  const legacyPsToPowerIdMap = new Map<string, { powerId: string; sysId: string }>();

  normalized.powerSources.forEach(ps => {
    const power = powerSourceToCharacterPower(ps);
    const system = powerSourceToPowerSystem(ps, [power.id]);

    legacyPsToPowerIdMap.set(ps.id, { powerId: power.id, sysId: system.id });

    if (powerSystemsMap.has(system.id)) {
      const existingSys = powerSystemsMap.get(system.id)!;
      if (!existingSys.powerIds?.includes(power.id)) {
        existingSys.powerIds = [...(existingSys.powerIds || []), power.id];
      }
    } else {
      powerSystemsMap.set(system.id, system);
    }
    powers.push(power);
  });

  normalized.baseAbilities.forEach(ba => {
    const mapped = ba.powerSourceId ? legacyPsToPowerIdMap.get(ba.powerSourceId) : undefined;
    const powerId = mapped?.powerId || (powers[0]?.id || 'power_default');
    const ability = baseAbilityToCharacterAbility(ba, powerId);
    abilities.push(ability);
  });

  normalized.techniques.forEach(t => {
    // Waffenbeherrschung, Berufe und Alltagskompetenzen NICHT in CharacterTechnique pressen!
    if (
      t.category === 'Waffenbeherrschung' || 
      t.category === 'Berufe' || 
      t.category === 'Alltagskompetenzen' || 
      t.category === 'Talente'
    ) {
      return;
    }

    const mapped = t.powerSourceId ? legacyPsToPowerIdMap.get(t.powerSourceId) : undefined;
    const powerId = mapped?.powerId || (powers[0]?.id || 'power_default');

    if (t.category === 'Transformationen' || t.type === 'Transformation') {
      const form = techniqueItemToCharacterPowerForm(t, powerId);
      forms.push(form);
    } else {
      const tech = techniqueItemToCharacterTechnique(t, undefined, powerId);
      techniques.push(tech);
    }
  });

  const powerSystems = Array.from(powerSystemsMap.values());

  const validPowerIds = new Set(powers.map(p => p.id));
  const validAbilityIds = new Set(abilities.map(a => a.id));
  const validTechIds = new Set(techniques.map(t => t.id));
  const validFormIds = new Set(forms.map(f => f.id));

  // Verknüpfungen konsistent halten & Phantom-IDs ausschließen
  powerSystems.forEach(sys => {
    const existing = (sys.powerIds || []).filter(id => validPowerIds.has(id));
    const linked = powers.filter(p => p.powerSystemId === sys.id).map(p => p.id);
    sys.powerIds = Array.from(new Set([...existing, ...linked]));
  });

  powers.forEach(p => {
    const matchingAbilities = abilities.filter(a => a.powerId === p.id).map(a => a.id);
    const matchingForms = forms.filter(f => f.powerId === p.id).map(f => f.id);
    p.abilityIds = Array.from(new Set([...(p.abilityIds || []).filter(id => validAbilityIds.has(id)), ...matchingAbilities]));
    p.formIds = Array.from(new Set([...(p.formIds || []).filter(id => validFormIds.has(id)), ...matchingForms]));
  });

  abilities.forEach(a => {
    const matchingTechs = techniques.filter(t => t.abilityId === a.id).map(t => t.id);
    a.techniqueIds = Array.from(new Set([...(a.techniqueIds || []).filter(id => validTechIds.has(id)), ...matchingTechs]));
  });

  forms.forEach(f => {
    const matchingTechs = normalized.techniques
      .filter(t => t.unlockedByTransformationId === f.id || t.parentTransformationId === f.id)
      .map(t => t.id)
      .filter(id => validTechIds.has(id));
    f.techniqueIds = Array.from(new Set([...(f.techniqueIds || []).filter(id => validTechIds.has(id)), ...matchingTechs]));
    f.abilityIds = Array.from(new Set((f.abilityIds || []).filter(id => validAbilityIds.has(id))));
  });

  return {
    powerSystems,
    powers,
    abilities,
    techniques,
    forms
  };
}

/**
 * Hauptfunktion zum Aufbau der neuen Power-Hierarchie aus einem Charakter-Objekt.
 * Priorisiert bereits vorhandene neue Daten (char.powers / char.powerSystems / char.characterAbilities / char.characterTechniques / char.powerForms) und
 * greift nur bei vollständigem Fehlen auf die verlustfreie Legacy-Migration zurück.
 */
export function buildCharacterPowerHierarchy(char: any): {
  powerSystems: PowerSystem[];
  powers: CharacterPower[];
  abilities: CharacterAbility[];
  techniques: CharacterTechnique[];
  forms: CharacterPowerForm[];
} {
  if (!char) {
    return {
      powerSystems: [],
      powers: [],
      abilities: [],
      techniques: [],
      forms: []
    };
  }

  // 1. Prüfen, ob mindestens eines der 5 neuen hierarchischen Arrays vorhanden ist
  const hasNewHierarchyData =
    (Array.isArray(char.powerSystems) && char.powerSystems.length > 0) ||
    (Array.isArray(char.powers) && char.powers.length > 0) ||
    (Array.isArray(char.characterAbilities) && char.characterAbilities.length > 0) ||
    (Array.isArray(char.characterTechniques) && char.characterTechniques.length > 0) ||
    (Array.isArray(char.powerForms) && char.powerForms.length > 0);

  if (hasNewHierarchyData) {
    const powerSystems: PowerSystem[] = Array.isArray(char.powerSystems) 
      ? char.powerSystems.map((s: PowerSystem) => ({ ...s, powerIds: s.powerIds ? [...s.powerIds] : [] })) 
      : [];
    const powers: CharacterPower[] = Array.isArray(char.powers) 
      ? char.powers.map((p: CharacterPower) => ({ ...p, abilityIds: p.abilityIds ? [...p.abilityIds] : [], formIds: p.formIds ? [...p.formIds] : [] })) 
      : [];
    const abilities: CharacterAbility[] = Array.isArray(char.characterAbilities) 
      ? char.characterAbilities.map((a: CharacterAbility) => ({ ...a, techniqueIds: a.techniqueIds ? [...a.techniqueIds] : [] })) 
      : [];
    const techniques: CharacterTechnique[] = Array.isArray(char.characterTechniques) 
      ? char.characterTechniques.map((t: CharacterTechnique) => ({ ...t })) 
      : [];
    const forms: CharacterPowerForm[] = Array.isArray(char.powerForms) 
      ? char.powerForms.map((f: CharacterPowerForm) => ({ ...f, abilityIds: f.abilityIds ? [...f.abilityIds] : [], techniqueIds: f.techniqueIds ? [...f.techniqueIds] : [] })) 
      : [];

    // Fall A: Keine powers vorhanden, aber untergeordnete Elemente existieren
    if (powers.length === 0) {
      const defaultPowerId = slugifyPowerId(powerSystems[0]?.name || 'power_main', 'power');
      const defaultPower: CharacterPower = {
        id: defaultPowerId,
        powerSystemId: powerSystems[0]?.id || slugifyPowerId(powerSystems[0]?.name || 'sys_main', 'sys'),
        name: powerSystems[0]?.name || 'Konkrete Kraft',
        abilityIds: abilities.map(a => a.id),
        formIds: forms.map(f => f.id)
      };
      powers.push(defaultPower);
    }

    // Fall B: Keine powerSystems vorhanden, aber powers existieren
    if (powerSystems.length === 0) {
      powers.forEach(p => {
        const sysId = p.powerSystemId || slugifyPowerId(p.subtype || p.name || 'sys_main', 'sys');
        p.powerSystemId = sysId;
        let existingSys = powerSystems.find(s => s.id === sysId);
        if (!existingSys) {
          existingSys = {
            id: sysId,
            name: p.subtype || p.name || 'Kraftsystem',
            systemType: p.subtype || 'Magie',
            resourceName: p.resourceName,
            powerIds: []
          };
          powerSystems.push(existingSys);
        }
      });
    }

    // Schritt A: Jede Power braucht ein gültiges PowerSystem
    const validSystemIds = new Set(powerSystems.map(s => s.id));
    powers.forEach(p => {
      if (!p.powerSystemId || !validSystemIds.has(p.powerSystemId)) {
        // 1. Zuordnung über ein System versuchen, das diese Power in powerIds gelistet hat
        const referencingSys = powerSystems.find(s => s.powerIds?.includes(p.id));
        if (referencingSys) {
          p.powerSystemId = referencingSys.id;
        } else if (powerSystems.length > 0) {
          // 2. Zuordnung zu erstem vorhandenen System
          p.powerSystemId = powerSystems[0].id;
        } else {
          // 3. System deterministisch erzeugen falls gar keins da war
          const newSysId = slugifyPowerId(p.subtype || p.name || 'sys_main', 'sys');
          p.powerSystemId = newSysId;
          powerSystems.push({
            id: newSysId,
            name: p.subtype || p.name || 'Kraftsystem',
            systemType: p.subtype || 'Magie',
            resourceName: p.resourceName,
            powerIds: [p.id]
          });
          validSystemIds.add(newSysId);
        }
      }
    });

    // Schritt B: System-Referenzen komplett neu aus den Powers aufbauen
    powerSystems.forEach(system => {
      system.powerIds = Array.from(new Set(
        powers.filter(power => power.powerSystemId === system.id).map(power => power.id)
      ));
    });

    // Validierte ID-Sets (gegen Phantom-IDs!)
    const validPowerIds = new Set(powers.map(p => p.id));
    const validAbilityIds = new Set(abilities.map(a => a.id));
    const validTechIds = new Set(techniques.map(t => t.id));
    const validFormIds = new Set(forms.map(f => f.id));

    // 2. CharacterPowers konsolidieren (nur valide Ability- & Form-IDs & dedupliziert)
    powers.forEach(p => {
      const existingValidAbilityIds = (p.abilityIds || []).filter(id => validAbilityIds.has(id));
      const linkedAbilities = abilities.filter(a => a.powerId === p.id).map(a => a.id);
      p.abilityIds = Array.from(new Set([...existingValidAbilityIds, ...linkedAbilities]));

      const existingValidFormIds = (p.formIds || []).filter(id => validFormIds.has(id));
      const linkedForms = forms.filter(f => f.powerId === p.id).map(f => f.id);
      p.formIds = Array.from(new Set([...existingValidFormIds, ...linkedForms]));
    });

    // 3. CharacterAbilities konsolidieren
    abilities.forEach(a => {
      if (!a.powerId || !validPowerIds.has(a.powerId)) {
        const referencingPower = powers.find(p => p.abilityIds?.includes(a.id));
        a.powerId = referencingPower?.id || powers[0]?.id || 'power_default';
      }

      const existingValidTechIds = (a.techniqueIds || []).filter(id => validTechIds.has(id));
      const linkedTechniques = techniques.filter(t => t.abilityId === a.id).map(t => t.id);
      a.techniqueIds = Array.from(new Set([...existingValidTechIds, ...linkedTechniques]));
    });

    // 4. CharacterTechniques konsolidieren (keine Phantom-AbilityIds!)
    techniques.forEach(t => {
      if (t.abilityId && !validAbilityIds.has(t.abilityId)) {
        const referencingAbility = abilities.find(a => a.techniqueIds?.includes(t.id));
        t.abilityId = referencingAbility?.id;
      }
      if (!t.powerId || !validPowerIds.has(t.powerId)) {
        const parentAbility = abilities.find(a => a.id === t.abilityId);
        t.powerId = parentAbility?.powerId || powers[0]?.id;
      }
    });

    // 5. CharacterPowerForms konsolidieren
    forms.forEach(f => {
      if (!f.powerId || !validPowerIds.has(f.powerId)) {
        const referencingPower = powers.find(p => p.formIds?.includes(f.id));
        f.powerId = referencingPower?.id || powers[0]?.id;
      }
      f.abilityIds = Array.from(new Set((f.abilityIds || []).filter(id => validAbilityIds.has(id))));
      f.techniqueIds = Array.from(new Set((f.techniqueIds || []).filter(id => validTechIds.has(id))));
    });

    return {
      powerSystems,
      powers,
      abilities,
      techniques,
      forms
    };
  }

  // 2. Fallback: Aus Legacy-Daten migrieren
  return convertLegacyToPowerHierarchy(char);
}

/**
 * Konvertiert ein neues hierarchisches Datenmodell zurück in die Legacy-Formate.
 */
export function convertPowerHierarchyToLegacy(hierarchy: {
  powerSystems?: PowerSystem[];
  powers?: CharacterPower[];
  abilities?: CharacterAbility[];
  techniques?: CharacterTechnique[];
  forms?: CharacterPowerForm[];
}): {
  powerSources: CharacterPowerSource[];
  baseAbilities: BaseAbility[];
  techniques: TechniqueItem[];
} {
  const powerSources: CharacterPowerSource[] = [];
  const baseAbilities: BaseAbility[] = [];
  const techniques: TechniqueItem[] = [];

  const powers = hierarchy.powers || [];
  const systems = hierarchy.powerSystems || [];
  const rawAbilities = hierarchy.abilities || [];
  const rawTechniques = hierarchy.techniques || [];
  const forms = hierarchy.forms || [];

  powers.forEach(p => {
    const sys = systems.find(s => s.id === p.powerSystemId);
    powerSources.push(characterPowerToLegacyPower(p, sys));
  });

  if (powerSources.length === 0 && systems.length > 0) {
    systems.forEach(s => {
      powerSources.push({
        id: s.id,
        source: s.name,
        powerName: s.name,
        cost: s.resourceName || 'Mana'
      });
    });
  }

  rawAbilities.forEach(a => {
    const p = powers.find(pow => pow.id === a.powerId);
    baseAbilities.push(characterAbilityToLegacyBaseAbility(a, p));
  });

  rawTechniques.forEach(t => {
    const a = rawAbilities.find(ab => ab.id === t.abilityId);
    const p = powers.find(pow => pow.id === t.powerId || pow.id === a?.powerId);
    techniques.push(characterTechniqueToLegacyTechnique(t, a, p));
  });

  forms.forEach(f => {
    const p = powers.find(pow => pow.id === f.powerId);
    techniques.push(characterPowerFormToLegacyTransformation(f, p));
  });

  return {
    powerSources,
    baseAbilities,
    techniques
  };
}
