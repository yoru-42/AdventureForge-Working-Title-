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
    potentialMax: number;
  };
}

export const STANDARD_PARAMETERS = [
  'Stärke',
  'Geschicklichkeit',
  'Konstitution',
  'Intelligenz',
  'Willenskraft',
  'Magie'
];

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

  // 1. Parameter-Definitionen aufbauen (ohne künstliches 0-100 Limit)
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource).forEach(([key, val]) => {
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

  // Also include any extra keys present in campaignPowerLevels
  Object.keys(campaignPowerLevels).forEach(k => {
    if (!globalSettings[k]) {
      globalSettings[k] = {
        min: 10,
        max: 1000,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 1000
      };
    }
  });

  // Build categories with STANDARD_PARAMETERS first, followed by remaining keys
  const remainingKeys = Object.keys(globalSettings).filter(k => !STANDARD_PARAMETERS.includes(k));
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

    const rawVal = typeof data === 'number' ? data : (typeof data?.value === 'number' ? data.value : undefined);
    const valNum = typeof rawVal === 'number' && !isNaN(rawVal) && rawVal > 0
      ? rawVal
      : defaultMin;

    const rawMax = typeof data?.potentialMax === 'number' ? data.potentialMax : undefined;
    const potMaxNum = typeof rawMax === 'number' && !isNaN(rawMax) && rawMax > 0
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

  // 3. Dynamische Ressourcenberechnung (ohne künstliche *10 Skalierung)
  const resourceMap = new Map<string, DerivedResource>();

  // A) Gesundheits-Ressource (HP)
  let healthSum = 0;
  let healthMaxSum = 0;
  let healthCount = 0;

  healthPowerNames.forEach(hpName => {
    const pData = getParamData(hpName);
    healthSum += pData.value;
    healthMaxSum += pData.potentialMax;
    healthCount++;
  });

  const hpVal = healthCount > 0 ? Math.round(healthSum / healthCount) : 100;
  const hpMax = healthCount > 0 ? Math.round(healthMaxSum / healthCount) : 100;
  const healthLabel = world?.healthLabel || 'HP';

  resourceMap.set('hp', {
    id: 'hp',
    name: healthLabel,
    value: hpVal,
    max: hpMax
  });

  // B) Kosten-Ressourcen (MP, SP etc.)
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
      resSum += pData.value;
      resMaxSum += pData.potentialMax;
      resCount++;
    });

    const resVal = resCount > 0 ? Math.round(resSum / resCount) : res.baseMax || 100;
    const resMax = resCount > 0 ? Math.round(resMaxSum / resCount) : res.baseMax || 100;
    const resId = res.id || `cost-${(res.name || 'mp').toLowerCase()}`;

    if (!resourceMap.has(resId)) {
      resourceMap.set(resId, {
        id: resId,
        name: res.name || 'MP',
        value: resVal,
        max: resMax
      });
    }
  });

  // C) Benutzerdefinierte Ressourcen-Zuordnungen (customResourceMappings)
  customResourceMappings.forEach(res => {
    let resSum = 0;
    let resMaxSum = 0;
    let resCount = 0;

    (res.sourcePowers || []).forEach(spName => {
      const pData = getParamData(spName);
      resSum += pData.value;
      resMaxSum += pData.potentialMax;
      resCount++;
    });

    const resVal = resCount > 0 ? Math.round(resSum / resCount) : res.baseMax || 100;
    const resMax = resCount > 0 ? Math.round(resMaxSum / resCount) : res.baseMax || 100;
    const resId = res.id || `custom-${res.name.toLowerCase()}`;

    const exists = Array.from(resourceMap.values()).some(
      r => r.name.toLowerCase() === res.name.toLowerCase()
    );

    if (!exists) {
      resourceMap.set(resId, {
        id: resId,
        name: res.name,
        value: resVal,
        max: resMax
      });
    }
  });

  return {
    categories,
    globalSettings,
    combatProperties,
    resources: Array.from(resourceMap.values())
  };
}
