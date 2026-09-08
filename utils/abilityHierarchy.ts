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
 * aus einem Charakterobjekt, wobei vollständige Rückwärtskompatibilität zu älteren Daten garantiert wird.
 */
export function normalizeAbilityHierarchy(char: any): {
  powerSources: CharacterPowerSource[];
  baseAbilities: BaseAbility[];
  techniques: TechniqueItem[];
} {
  if (!char) {
    return { powerSources: [], baseAbilities: [], techniques: [] };
  }
  // 1. Kraftquellen extrahieren
  let powerSources: CharacterPowerSource[] = [];
  if (char.powerSources && Array.isArray(char.powerSources) && char.powerSources.length > 0) {
    powerSources = char.powerSources.map((ps, idx) => ({
      id: ps.id || `ps_${idx + 1}`,
      source: ps.source || ps.powerName || 'Standard-Kraftquelle',
      cost: ps.cost || 'Mana',
      powerName: ps.powerName || ps.source || 'Standard-Kraftquelle',
      powerDescription: ps.powerDescription || ''
    }));
  } else if (char.powerSource || char.powerName) {
    powerSources = [{
      id: 'ps_default',
      source: char.powerSource || char.powerName || 'Standard-Kraftquelle',
      cost: char.powerCost || 'Mana',
      powerName: char.powerName || char.powerSource || 'Standard-Kraftquelle',
      powerDescription: char.powerDescription || ''
    }];
  } else {
    powerSources = [{
      id: 'ps_default',
      source: 'Standard-Kraftquelle',
      cost: 'Mana',
      powerName: 'Standard-Kraftquelle',
      powerDescription: ''
    }];
  }

  const defaultPowerSourceId = powerSources[0]?.id || 'ps_default';

  // 2. Grundfähigkeiten & Techniken sammeln
  const baseAbilitiesMap = new Map<string, BaseAbility>();
  const techniquesList: TechniqueItem[] = [];

  // 2a. Falls explizite baseAbilities auf dem Charakter existieren
  if (char.baseAbilities && Array.isArray(char.baseAbilities)) {
    char.baseAbilities.forEach(ba => {
      if (ba && ba.id) {
        const displayName = ba.displayName || ba.name || resolveKinesisName(ba.element, ba.abilityType);
        baseAbilitiesMap.set(ba.id, {
          id: ba.id,
          powerSourceId: ba.powerSourceId || defaultPowerSourceId,
          powerSourceName: ba.powerSourceName || powerSources.find(p => p.id === ba.powerSourceId)?.powerName,
          name: ba.name || displayName,
          displayName,
          element: ba.element || 'Neutral',
          abilityType: normalizeAbilityTypeId(ba.abilityType),
          description: ba.description || '',
          techniqueIds: ba.techniqueIds || []
        });
      }
    });
  }

  // 2b. Aus char.abilities (PowerAbility[]) extrahieren
  if (char.abilities && Array.isArray(char.abilities)) {
    char.abilities.forEach((ability, aIdx) => {
      const psId = ability.powerSourceId || defaultPowerSourceId;
      const ps = powerSources.find(p => p.id === psId) || powerSources[0];

      // Ermittle oder leite Grundfähigkeit ab
      let baseAbilityId = ability.id || `ba_${aIdx + 1}`;
      let element = ability.element || 'Neutral';
      let abilityType: AbilityType = normalizeAbilityTypeId(ability.abilityType);
      let displayName = ability.displayName || ability.name || resolveKinesisName(element, abilityType);

      // Falls die Fähigkeit nach einem Element riecht, passe Element an
      if (!ability.element) {
        const foundElement = ADVENTURE_FORGE_ELEMENTS.find(
          el => el !== 'Neutral' && (
            (ability.name || '').toLowerCase().includes(el.toLowerCase()) ||
            (ability.description || '').toLowerCase().includes(el.toLowerCase()) ||
            (ability.displayName || '').toLowerCase().includes(el.toLowerCase())
          )
        );
        if (foundElement) {
          element = foundElement;
          displayName = resolveKinesisName(element, abilityType);
        }
      }

      if (!baseAbilitiesMap.has(baseAbilityId)) {
        baseAbilitiesMap.set(baseAbilityId, {
          id: baseAbilityId,
          powerSourceId: psId,
          powerSourceName: ps?.powerName || ps?.source,
          name: ability.name || displayName,
          displayName,
          element,
          abilityType,
          description: ability.description || '',
          techniqueIds: []
        });
      }

      // Techniken aus dieser Ability
      if (ability.techniqueList && Array.isArray(ability.techniqueList)) {
        ability.techniqueList.forEach((tech, tIdx) => {
          if (!tech || !tech.name) return;
          const techId = tech.id || `tech_${baseAbilityId}_${tIdx + 1}`;
          const baseAbilityIds = tech.baseAbilityIds && tech.baseAbilityIds.length > 0 
            ? tech.baseAbilityIds 
            : [baseAbilityId];
          const baseAbilityNames = tech.baseAbilityNames && tech.baseAbilityNames.length > 0
            ? tech.baseAbilityNames
            : [displayName];

          techniquesList.push({
            ...tech,
            id: techId,
            name: tech.name,
            baseAbilityIds,
            baseAbilityNames,
            powerSourceId: tech.powerSourceId || psId,
            powerSourceName: tech.powerSourceName || ps?.powerName,
            element: tech.element || element,
            abilityType: tech.abilityType || abilityType,
            description: tech.description || '',
            targetType: tech.targetType || 'Selbst / Verbündete / Feinde',
            effects: tech.effects || (tech.applications ? tech.applications : []),
            costResourceName: tech.costResourceName || ps?.cost || 'Mana',
            costValue: tech.costValue !== undefined ? tech.costValue : 10,
            cost: tech.cost || `${tech.costValue || 10} ${tech.costResourceName || ps?.cost || 'Mana'}`
          });
        });
      } else if (ability.techniques && typeof ability.techniques === 'string' && ability.techniques.trim().length > 0) {
        // Fallback: Techniken aus kommagetrenntem String
        const techNames = ability.techniques.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
        techNames.forEach((tName, tIdx) => {
          const techId = `tech_${baseAbilityId}_legacy_${tIdx + 1}`;
          techniquesList.push({
            id: techId,
            name: tName,
            baseAbilityIds: [baseAbilityId],
            baseAbilityNames: [displayName],
            powerSourceId: psId,
            powerSourceName: ps?.powerName,
            element,
            abilityType,
            description: `Technik der ${displayName}.`,
            targetType: 'Selbst / Verbündete / Feinde',
            effects: [],
            costResourceName: ps?.cost || 'Mana',
            costValue: 10,
            cost: `10 ${ps?.cost || 'Mana'}`
          });
        });
      }
    });
  }

  // 2c. Falls direkte char.techniqueList existiert
  if (char.techniqueList && Array.isArray(char.techniqueList)) {
    char.techniqueList.forEach(tech => {
      if (!tech || !tech.name) return;
      const existingIdx = techniquesList.findIndex(t => t.id === tech.id || t.name.toLowerCase() === tech.name.toLowerCase());
      if (existingIdx >= 0) {
        techniquesList[existingIdx] = { ...techniquesList[existingIdx], ...tech };
      } else {
        techniquesList.push(tech);
      }
    });
  }

  // Falls gar keine Grundfähigkeiten existieren, lege eine Basis an
  if (baseAbilitiesMap.size === 0) {
    const defaultBaId = 'ba_default_1';
    const defElement = 'Neutral';
    const defType: AbilityType = 'creation_manipulation';
    baseAbilitiesMap.set(defaultBaId, {
      id: defaultBaId,
      powerSourceId: defaultPowerSourceId,
      powerSourceName: powerSources[0]?.powerName,
      name: resolveKinesisName(defElement, defType),
      displayName: resolveKinesisName(defElement, defType),
      element: defElement,
      abilityType: defType,
      description: 'Grundlegende Fähigkeiten und Techniken.',
      techniqueIds: []
    });
  }

  const baseAbilities = Array.from(baseAbilitiesMap.values());

  // Verknüpfe techniqueIds zurück in die Grundfähigkeiten
  baseAbilities.forEach(ba => {
    ba.techniqueIds = techniquesList
      .filter(t => t.baseAbilityIds?.includes(ba.id))
      .map(t => t.id);
  });

  return {
    powerSources,
    baseAbilities,
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

  const allTechNames = techniques.map(t => t.name).filter(Boolean).join(', ');

  return {
    ...originalChar,
    powerSources,
    baseAbilities,
    techniqueList: techniques,
    abilities: legacyAbilities,
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
