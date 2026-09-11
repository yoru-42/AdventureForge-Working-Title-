// -*- coding: utf-8 -*-
import { BaseAbility, AbilityType, TechniqueItem, CharacterPowerSource, Character, PowerAbility } from '../types';

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
        cost: char.powerCost || 'Mana',
        powerDescription: char.powerDescription || ''
      }] : [{
        id: 'ps_default',
        source: 'Standard-Kraftquelle',
        powerName: 'Standard-Kraftquelle',
        cost: 'Mana',
        powerDescription: ''
      }]);

  rawSources.forEach((ps, idx) => {
    if (!ps) return;
    const pName = (ps.powerName || ps.source || 'Standard-Kraftquelle').trim();
    const id = ps.id || `ps_${idx + 1}`;
    const existing = Array.from(powerSourcesMap.values()).find(
      p => p.id === id || p.powerName.toLowerCase() === pName.toLowerCase()
    );
    if (!existing) {
      powerSourcesMap.set(id, {
        id,
        source: ps.source || pName,
        powerName: pName,
        cost: ps.cost || 'Mana',
        powerDescription: ps.powerDescription || ''
      });
    }
  });

  if (powerSourcesMap.size === 0) {
    powerSourcesMap.set('ps_default', {
      id: 'ps_default',
      source: 'Standard-Kraftquelle',
      powerName: 'Standard-Kraftquelle',
      cost: 'Mana',
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

    const canonicalId = candidate.id || `ba_${baseAbilitiesList.length + 1}_${Date.now()}`;
    const newBa: BaseAbility = {
      id: canonicalId,
      powerSourceId: psId,
      powerSourceName: ps?.powerName || ps?.source,
      name: candidate.name || displayName,
      displayName,
      element,
      abilityType,
      description: candidate.description || `Erschaffung und Manipulation von ${element}.`,
      techniqueIds: []
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

  // 2b. Aus char.abilities laden
  if (Array.isArray(char.abilities)) {
    char.abilities.forEach(ability => {
      if (!ability) return;
      const isOtherCategory = ability.category && ['Passive Fähigkeiten', 'Ultimative Techniken', 'Transformationen', 'Talente'].includes(ability.category);
      if (!isOtherCategory) {
        registerBaseAbility({
          id: ability.id,
          powerSourceId: ability.powerSourceId,
          name: ability.name,
          displayName: ability.displayName || ability.name,
          element: ability.element,
          abilityType: ability.abilityType,
          description: ability.description
        });
      }
    });
  }

  // Standard-Grundfähigkeit falls leer
  if (baseAbilitiesList.length === 0) {
    registerBaseAbility({
      id: 'ba_default_1',
      powerSourceId: defaultPsId,
      element: 'Neutral',
      abilityType: 'creation_manipulation',
      displayName: 'Kinetik',
      name: 'Kinetik'
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
      : (fallbackBaId ? [fallbackBaId] : [baseAbilitiesList.find(b => b.powerSourceId === psId)?.id || baseAbilitiesList[0].id]);

    const mappedBaIds = Array.from(new Set(
      rawBaIds.map(id => baIdAliasMap.get(id) || id)
    )).filter(id => baseAbilitiesList.some(b => b.id === id));

    const finalBaIds = mappedBaIds.length > 0
      ? mappedBaIds
      : [baseAbilitiesList.find(b => b.powerSourceId === psId)?.id || baseAbilitiesList[0].id];

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
      return;
    }

    const techId = tech.id || `tech_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const costResource = tech.costResourceName || ps?.cost || 'Mana';
    const costVal = tech.costValue !== undefined ? tech.costValue : (category === 'Passive Fähigkeiten' ? 0 : 10);
    const costStr = tech.cost || (category === 'Passive Fähigkeiten' ? 'Passiv' : `${costVal} ${costResource}`);

    const newTech: TechniqueItem = {
      id: techId,
      name: techName,
      description: tech.description || '',
      category,
      type: tech.type || (category === 'Transformationen' ? 'Transformation' : (category === 'Passive Fähigkeiten' ? 'Support' : (category === 'Talente' ? 'Spezial' : 'Angriff'))),
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
      level: tech.level || 1,
      maxLevel: tech.maxLevel || 10,
      xp: tech.xp || 0,
      xpNeeded: tech.xpNeeded || 100
    };

    techniquesMap.set(techKey, newTech);
  };

  // 3a. Aus char.techniqueList
  if (Array.isArray(char.techniqueList)) {
    char.techniqueList.forEach(t => registerTechnique(t));
  }

  // 3b. Aus char.abilities
  if (Array.isArray(char.abilities)) {
    char.abilities.forEach(ability => {
      if (!ability) return;
      const canonicalBaId = baIdAliasMap.get(ability.id) || ability.id;
      const isOtherCategory = ability.category && ['Passive Fähigkeiten', 'Ultimative Techniken', 'Transformationen', 'Talente'].includes(ability.category);

      if (isOtherCategory) {
        registerTechnique(ability, ability.category, canonicalBaId);
      }

      if (Array.isArray(ability.techniqueList)) {
        ability.techniqueList.forEach(t => registerTechnique(t, undefined, canonicalBaId));
      } else if (typeof ability.techniques === 'string' && ability.techniques.trim().length > 0) {
        const tNames = ability.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean);
        tNames.forEach((tName: string) => {
          registerTechnique({ name: tName }, undefined, canonicalBaId);
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
      category: 'Techniken',
      source: ps?.powerName || ps?.source || 'Kraftquelle',
      cost: ps?.cost || 'Mana',
      description: ba.description || '',
      techniques: techForBa.map(t => t.name).join(', '),
      powerSourceId: ba.powerSourceId,
      element: ba.element,
      abilityType: ba.abilityType,
      baseAbilityIds: [ba.id],
      techniqueList: techForBa
    };
  });

  // Ergänze Einträge aus anderen Kategorien (Passive Fähigkeiten, Ultimative Techniken, Transformationen, Talente)
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
        techniqueList: [t]
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
        t => t.baseAbilityIds?.includes(ba.id) || (!t.baseAbilityIds?.length && t.powerSourceId === ps.id)
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
