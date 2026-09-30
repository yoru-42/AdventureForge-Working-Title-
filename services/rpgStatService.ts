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

  // 1. Parameter-Definitionen aufbauen
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource).forEach(([key, val]) => {
    if (typeof val === 'number') {
      globalSettings[key] = {
        min: Math.floor(val * 0.4),
        max: val,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 100
      };
    } else if (val && typeof val === 'object') {
      globalSettings[key] = {
        min: typeof val.min === 'number' ? val.min : 10,
        max: typeof val.max === 'number' ? val.max : 100,
        levelUpLogic: typeof val.levelUpLogic === 'string' ? val.levelUpLogic : '',
        scaleMin: typeof val.scaleMin === 'number' ? val.scaleMin : 0,
        scaleMax: typeof val.scaleMax === 'number' ? val.scaleMax : 100
      };
    }
  });

  const categories = Object.keys(globalSettings);

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
    const defaultMin = globalSettings[matchedKey]?.min ?? 10;
    const defaultMax = globalSettings[matchedKey]?.max ?? 100;
    return {
      value: data?.value ?? defaultMin,
      potentialMax: data?.potentialMax ?? defaultMax
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

  // 3. Dynamische Ressourcenberechnung (OHNE künstliche *10 Skalierung)
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
