// -*- coding: utf-8 -*-
import {
  WorldSetting,
  CampaignPowerParameter,
  CustomStatAllocation,
  CostResource,
  CustomResourceMapping
} from '../types';
import {
  EP_DEFAULT_PARAMETERS,
  EP_DEFAULT_STAT_ALLOCATIONS,
  EP_DEFAULT_COST_RESOURCES,
  EP_DEFAULT_CUSTOM_RESOURCE_MAPPINGS,
  EP_DEFAULT_HEALTH_NAMES
} from '../lib/progressionDefaults';

export interface CharacterPowerData {
  [key: string]: {
    value: number;
    potentialMax?: number;
    xp?: number;
  } | number;
}

export const STANDARD_PARAMETERS = [
  'Stärke',
  'Geschicklichkeit',
  'Konstitution',
  'Intelligenz',
  'Willenskraft',
  'Magie'
];

/**
 * Hilfsfunktion zum Prüfen, ob ein Schlüssel eine Ressource (HP, MP, SP etc.) und kein Parameter ist.
 */
export function isResourceKey(key: string, world?: WorldSetting): boolean {
  if (!key) return false;
  const kLower = key.toLowerCase().trim();

  if (kLower.startsWith('_') || kLower === 'freepoints') {
    return true;
  }

  const commonResourceNames = [
    'hp',
    'mp',
    'sp',
    'mana',
    'gesundheit',
    'gesundheit (hp)',
    'ausdauer',
    'stamina',
    'energie'
  ];

  if (commonResourceNames.includes(kLower)) {
    return true;
  }

  if (kLower.startsWith('res-') || kLower.startsWith('cost-') || kLower.startsWith('power-source-')) {
    return true;
  }

  if (world?.healthLabel && kLower === world.healthLabel.toLowerCase().trim()) {
    return true;
  }

  if (world?.healthPowerNames && Array.isArray(world.healthPowerNames)) {
    if (world.healthPowerNames.some(hpName => hpName.toLowerCase().trim() === kLower)) {
      return true;
    }
  }

  if (world?.costResources && Array.isArray(world.costResources)) {
    if (world.costResources.some(res => (res.id && res.id.toLowerCase().trim() === kLower) || (res.name && res.name.toLowerCase().trim() === kLower))) {
      return true;
    }
  }

  return false;
}

export interface DerivedCombatProperty {
  id: string;
  label: string;
  value: number;
  potentialMax: number;
  isPercentage: boolean;
  sources: string[];
}

export interface DerivedResource {
  id: string;
  name: string;
  value: number;
  max: number;
}

export interface DerivedRpgStats {
  categories: string[];
  globalSettings: Record<string, CampaignPowerParameter>;
  combatProperties: DerivedCombatProperty[];
  resources: DerivedResource[];
  hpResource: DerivedResource;
  powerSources: DerivedResource[];
}

/**
 * Zentrale Berechnungslogik für RPG-Statusanzeigen in AdventureForge.
 * Berechnet abgeleitete Kampfeigenschaften und dynamische Ressourcen aus den Grundparametern.
 */
export function calculateRpgCharacterStats(
  campaignPowerLevels: CharacterPowerData = {},
  world?: WorldSetting,
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>
): DerivedRpgStats {
  const settingsSource = worldPowerSettings || world?.campaignPowerSettings || EP_DEFAULT_PARAMETERS;

  // 1. Parameter-Definitionen aufbauen (ohne künstliches 0-100 Limit, ohne Ressourcen)
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource).forEach(([key, val]) => {
    if (isResourceKey(key, world)) return;
    if (typeof val === 'number') {
      const maxVal = Math.max(1000, val);
      globalSettings[key] = {
        min: 10,
        max: maxVal,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: maxVal
      };
    } else if (val && typeof val === 'object') {
      const paramMin = typeof val.min === 'number' && val.min > 0 ? val.min : 10;
      const paramMax = typeof val.max === 'number' && val.max > 0 ? val.max : 1000;
      const sMin = typeof val.scaleMin === 'number' ? val.scaleMin : 0;
      const sMax = typeof val.scaleMax === 'number' ? val.scaleMax : Math.max(1000, paramMax);

      globalSettings[key] = {
        min: paramMin,
        max: paramMax,
        levelUpLogic: typeof val.levelUpLogic === 'string' ? val.levelUpLogic : '',
        scaleMin: sMin,
        scaleMax: sMax,
        category: val.category
      };
    }
  });

  // Ensure the 6 standard parameters are always in globalSettings
  STANDARD_PARAMETERS.forEach(pName => {
    if (!globalSettings[pName]) {
      globalSettings[pName] = {
        min: 10,
        max: 1000,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 1000
      };
    }
  });

  // Also include any extra parameter keys present in campaignPowerLevels (excluding resources)
  Object.keys(campaignPowerLevels).forEach(k => {
    if (!isResourceKey(k, world) && !globalSettings[k]) {
      globalSettings[k] = {
        min: 10,
        max: 1000,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 1000
      };
    }
  });

  // Build categories with STANDARD_PARAMETERS first, followed by remaining keys (filtering out resources)
  const remainingKeys = Object.keys(globalSettings).filter(k => !STANDARD_PARAMETERS.includes(k) && !isResourceKey(k, world));
  const categories = [...STANDARD_PARAMETERS, ...remainingKeys];

  const statAllocations: CustomStatAllocation[] =
    world?.customStatAllocations && world.customStatAllocations.length > 0
      ? world.customStatAllocations
      : EP_DEFAULT_STAT_ALLOCATIONS;

  const costResources: CostResource[] =
    world?.costResources && world.costResources.length > 0
      ? world.costResources
      : EP_DEFAULT_COST_RESOURCES;

  const customResourceMappings: CustomResourceMapping[] =
    world?.customResourceMappings && world.customResourceMappings.length > 0
      ? world.customResourceMappings
      : EP_DEFAULT_CUSTOM_RESOURCE_MAPPINGS;

  const healthPowerNames: string[] =
    world?.healthPowerNames && world.healthPowerNames.length > 0
      ? world.healthPowerNames
      : EP_DEFAULT_HEALTH_NAMES;

  // Hilfsfunktion zum Abrufen von Parameterwerten des Charakters
  const getParamData = (paramName: string) => {
    const cleanP = paramName.trim();
    const matchedKey = categories.find(c => c.toLowerCase() === cleanP.toLowerCase()) || cleanP;
    const data = campaignPowerLevels[matchedKey] || campaignPowerLevels[cleanP];
    const defaultMin = typeof globalSettings[matchedKey]?.min === 'number' && !isNaN(globalSettings[matchedKey]?.min) && globalSettings[matchedKey].min > 0
      ? globalSettings[matchedKey].min
      : 10;
    const defaultMax = typeof globalSettings[matchedKey]?.max === 'number' && !isNaN(globalSettings[matchedKey]?.max) && globalSettings[matchedKey].max > 0
      ? globalSettings[matchedKey].max
      : 1000;

    const rawVal = typeof data === 'number' ? data : (data && typeof data?.value === 'number' ? data.value : undefined);
    const valNum = (typeof rawVal === 'number' && !isNaN(rawVal))
      ? rawVal
      : defaultMin;

    const rawMax = data && typeof data === 'object' && typeof data?.potentialMax === 'number' ? data.potentialMax : undefined;
    const potMaxNum = typeof rawMax === 'number' && !isNaN(rawMax)
      ? rawMax
      : defaultMax;

    return {
      value: valNum,
      potentialMax: potMaxNum
    };
  };

  // 2. Berechnung der Kampfeigenschaften
  const combatProperties: DerivedCombatProperty[] = statAllocations.map(alloc => {
    const radarNames = alloc.selectedRadarNames || [];
    let sumValue = 0;
    let sumMax = 0;
    let count = 0;

    radarNames.forEach(rName => {
      const pData = getParamData(rName);
      sumValue += pData.value;
      sumMax += pData.potentialMax;
      count++;
    });

    const divisor = count > 0 ? count : 1;
    const value = Math.round(sumValue / divisor);
    const potentialMax = Math.round(sumMax / divisor);
    const isPercentage = ['CORE_CRIT_RATE', 'CORE_EVASION', 'CORE_COUNTER'].includes(alloc.coreRole || '');

    return {
      id: alloc.id,
      label: alloc.label,
      value,
      potentialMax,
      isPercentage,
      sources: radarNames
    };
  });

  // 3. Dynamische Ressourcenberechnung (Gesundheit / HP + Kosten-Ressourcen wie MP, SP)
  const costResourcesMap = new Map<string, DerivedResource>();

  // A) Gesundheits-Ressource (HP): Mensch-Basiswert = 30 bei Parameter-Durchschnitt = 10
  let healthSum = 0;
  let healthCount = 0;

  const activeHealthParamNames = healthPowerNames.filter(name => {
    return categories.some(c => c.toLowerCase() === name.toLowerCase()) || name.toLowerCase() === 'konstitution';
  });
  const effectiveHealthParams = activeHealthParamNames.length > 0 ? activeHealthParamNames : ['Konstitution'];

  effectiveHealthParams.forEach(hpName => {
    const pData = getParamData(hpName);
    healthSum += Math.max(1, pData.value);
    healthCount++;
  });

  const avgHealthParam = healthCount > 0 ? (healthSum / healthCount) : 10;
  const computedHpVal = Math.max(1, Math.round(30 * (avgHealthParam / 10)));
  const healthLabel = world?.healthLabel || 'Gesundheit (HP)';

  // Prüfe auf direkte Überschreibung im Charakter-Datenobjekt (z.B. durch Pfeilbuttons)
  const hpOverrideKey = ['hp', healthLabel, 'Gesundheit (HP)'].find(k => campaignPowerLevels[k] !== undefined);
  let customHpVal: number | undefined = undefined;
  if (hpOverrideKey) {
    const entry = campaignPowerLevels[hpOverrideKey];
    const parsed = typeof entry === 'number' ? entry : entry?.value;
    if (typeof parsed === 'number' && !isNaN(parsed) && parsed >= 1) {
      customHpVal = parsed;
    }
  }

  const hpVal = Math.max(1, customHpVal !== undefined ? customHpVal : computedHpVal);
  const hpMax = 9999; // Technische globale Skala für Kampfeigenschaft HP

  const hpResource: DerivedResource = {
    id: 'hp',
    name: healthLabel,
    value: hpVal,
    max: hpMax
  };

  // B) Kosten-Ressourcen (MP, SP etc.) - gehören direkt zu Kampfeigenschaften
  costResources.forEach(res => {
    let resSum = 0;
    let resMaxSum = 0;
    let resCount = 0;

    const sources =
      res.sourcePowers && res.sourcePowers.length > 0
        ? res.sourcePowers
        : res.radarPowerName
        ? [res.radarPowerName]
        : [];

    sources.forEach(spName => {
      const pData = getParamData(spName);
      resSum += Math.max(1, pData.value);
      resMaxSum += Math.max(1, pData.potentialMax);
      resCount++;
    });

    const defaultResVal = resCount > 0 ? Math.max(1, Math.round(resSum / resCount)) : Math.max(1, res.baseMax || 100);
    const defaultResMax = resCount > 0 ? Math.max(1, Math.round(resMaxSum / resCount)) : Math.max(1, res.baseMax || 1000);
    const resId = res.id || `cost-${(res.name || 'mp').toLowerCase()}`;

    // Prüfe auf direkte Überschreibung im Charakter-Datenobjekt
    const resOverrideKey = [resId, res.name].find(k => k && campaignPowerLevels[k] !== undefined);
    let customResVal: number | undefined = undefined;
    if (resOverrideKey) {
      const entry = campaignPowerLevels[resOverrideKey];
      const parsed = typeof entry === 'number' ? entry : entry?.value;
      if (typeof parsed === 'number' && !isNaN(parsed) && parsed >= 1) {
        customResVal = parsed;
      }
    }

    const resVal = Math.max(1, customResVal !== undefined ? customResVal : defaultResVal);

    if (!costResourcesMap.has(resId)) {
      costResourcesMap.set(resId, {
        id: resId,
        name: res.name || 'MP',
        value: resVal,
        max: defaultResMax
      });
    }
  });

  const costResourcesList = Array.from(costResourcesMap.values());

  return {
    categories,
    globalSettings,
    combatProperties,
    resources: [hpResource, ...costResourcesList],
    hpResource,
    powerSources: costResourcesList
  };
}
