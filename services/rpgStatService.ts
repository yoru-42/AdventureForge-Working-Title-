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
import { RaceService, RaceDefinition, HUMAN_BASE_PARAMETERS } from './raceService';

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
 * Optionen für die zentrale Berechnung des individuellen Parameter-Maximums.
 */
export interface IndividualMaxCalculationOptions {
  paramName: string;
  race?: string | RaceDefinition;
  customRaces?: RaceDefinition[];
  body?: {
    gender?: string;
    stature?: string;
    build?: string;
    statureFactors?: Record<string, number>;
    genderFactors?: Record<string, number>;
  };
  gender?: string;
  stature?: string;
  build?: string;
  potentialPercent?: number;
  parameterPotentialPercentages?: Record<string, number>;
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  baseParameters?: Record<string, number>;
}

/**
 * Zentrale Berechnungsfunktion für das individuelle Maximum eines RPG-Parameters.
 *
 * Formel:
 * Race Base Maximum × Race Growth Factor × Body/Stature Modifier × Gender Modifier × Potential Modifier
 * = Individuelles Maximum
 */
export function calculateIndividualParameterMax(options: IndividualMaxCalculationOptions): number {
  const {
    paramName,
    race = 'Mensch',
    customRaces,
    body,
    gender,
    stature,
    build,
    potentialPercent,
    parameterPotentialPercentages,
    world,
    worldPowerSettings,
    baseParameters
  } = options;

  // 1. Rassendefinition & Basisparameter
  const raceDef = typeof race === 'object' && race !== null
    ? race
    : RaceService.getRaceDefinition(race, customRaces);

  const effectiveBaseParams = baseParameters || raceDef.baseParameters || HUMAN_BASE_PARAMETERS;
  const rawBaseParam = effectiveBaseParams[paramName];
  const baseParamVal = typeof rawBaseParam === 'number' && !isNaN(rawBaseParam) && rawBaseParam > 0
    ? rawBaseParam
    : 10;

  // 2. Base Maximum der Skala für diesen Parameter (Standard: 100)
  const settingsSource = worldPowerSettings || world?.campaignPowerSettings || EP_DEFAULT_PARAMETERS;
  const paramSetting = settingsSource[paramName];
  const rawSettingMax = typeof paramSetting === 'number'
    ? paramSetting
    : (paramSetting && typeof paramSetting === 'object' && typeof paramSetting.max === 'number' && paramSetting.max > 0 ? paramSetting.max : undefined);

  // Basis-Maximum: Standard 100 für die AdventureForge-Skala
  const baseMax = rawSettingMax && rawSettingMax !== 1000 && rawSettingMax !== 100000
    ? rawSettingMax
    : 100;

  // 3. Rassen-Wachstumsfaktor (z. B. 1.0 für Mensch)
  const growthFactors = raceDef.growthFactors || {};
  let raceGrowthFactor = 1.0;
  if (typeof growthFactors[paramName] === 'number') {
    raceGrowthFactor = growthFactors[paramName];
  } else {
    const lowerKey = paramName.toLowerCase();
    const found = Object.keys(growthFactors).find(k => k.toLowerCase() === lowerKey);
    if (found && typeof growthFactors[found] === 'number') {
      raceGrowthFactor = growthFactors[found];
    }
  }

  // 4. Körper-/Staturfaktor (erweiterbar, default 1.0 = neutral)
  const effectiveStature = stature || build || body?.stature || body?.build;
  let statureModifier = 1.0;
  if (body?.statureFactors && typeof body.statureFactors[paramName] === 'number') {
    statureModifier = body.statureFactors[paramName];
  } else if (world && (world as any).statureFactors && effectiveStature && (world as any).statureFactors[effectiveStature]?.[paramName]) {
    statureModifier = (world as any).statureFactors[effectiveStature][paramName];
  }

  // 5. Optionaler Geschlechtsfaktor (erweiterbar, default 1.0 = neutral)
  const effectiveGender = gender || body?.gender;
  let genderModifier = 1.0;
  if (body?.genderFactors && typeof body.genderFactors[paramName] === 'number') {
    genderModifier = body.genderFactors[paramName];
  } else if (world && (world as any).genderFactors && effectiveGender && (world as any).genderFactors[effectiveGender]?.[paramName]) {
    genderModifier = (world as any).genderFactors[effectiveGender][paramName];
  }

  // 6. Individuelles Potential (0–200%, Standard: 100%)
  let rawPotential = 100;
  if (parameterPotentialPercentages && typeof parameterPotentialPercentages[paramName] === 'number') {
    rawPotential = parameterPotentialPercentages[paramName];
  } else if (typeof potentialPercent === 'number' && !isNaN(potentialPercent)) {
    rawPotential = potentialPercent;
  }

  // Normalisiere Potential (falls alte >200 Werte wie 1000 übergeben wurden)
  const cleanPotentialPercent = rawPotential > 200
    ? Math.max(1, Math.round(rawPotential / 10))
    : Math.max(1, rawPotential);
  const potentialModifier = cleanPotentialPercent / 100;

  // 7. Formel: Base Maximum * (BaseParam / 10) * Race Growth Factor * Stature Modifier * Gender Modifier * Potential Modifier
  const calculatedMax = Math.round(
    baseMax * (baseParamVal / 10) * raceGrowthFactor * statureModifier * genderModifier * potentialModifier
  );

  // Stelle sicher, dass das Maximum mindestens dem Basiswert entspricht und >= 1 ist
  return Math.max(1, baseParamVal, calculatedMax);
}

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
 * Berechnet abgeleitete Kampfeigenschaften und dynamische Ressourcen aus den Grundparametern
 * unter Berücksichtigung des individuellen Charakterpotentials und der Rassen-/Körpereigenschaften.
 */
export function calculateRpgCharacterStats(
  campaignPowerLevels: CharacterPowerData = {},
  world?: WorldSetting,
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>,
  race?: string | RaceDefinition,
  customRaces?: RaceDefinition[],
  options?: {
    body?: {
      gender?: string;
      stature?: string;
      build?: string;
      statureFactors?: Record<string, number>;
      genderFactors?: Record<string, number>;
    };
    gender?: string;
    stature?: string;
    build?: string;
    potential?: number | string;
    parameterPotentialPercentages?: Record<string, number>;
    baseParameters?: Record<string, number>;
  }
): DerivedRpgStats {
  const settingsSource = worldPowerSettings || world?.campaignPowerSettings || EP_DEFAULT_PARAMETERS;

  // 1. Parameter-Definitionen aufbauen (ohne künstliches 0-100 Limit, ohne Ressourcen)
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource).forEach(([key, val]) => {
    if (isResourceKey(key, world)) return;
    if (typeof val === 'number') {
      const maxVal = Math.max(100, val);
      globalSettings[key] = {
        min: 10,
        max: maxVal,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 100000
      };
    } else if (val && typeof val === 'object') {
      const paramMin = typeof val.min === 'number' && val.min > 0 ? val.min : 10;
      const paramMax = typeof val.max === 'number' && val.max > 0 ? val.max : 100;
      const sMin = typeof val.scaleMin === 'number' ? val.scaleMin : 0;
      const sMax = typeof val.scaleMax === 'number' ? val.scaleMax : 100000;

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
        max: 100,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 100000
      };
    }
  });

  // Also include any extra parameter keys present in campaignPowerLevels (excluding resources)
  Object.keys(campaignPowerLevels).forEach(k => {
    if (!isResourceKey(k, world) && !globalSettings[k]) {
      globalSettings[k] = {
        min: 10,
        max: 100,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 100000
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

  const healthPowerNames: string[] =
    world?.healthPowerNames && world.healthPowerNames.length > 0
      ? world.healthPowerNames
      : EP_DEFAULT_HEALTH_NAMES;

  // Hilfsfunktion zum Abrufen von Parameterwerten des Charakters inklusive berechnetem individuellem Maximum
  const getParamData = (paramName: string) => {
    const cleanP = paramName.trim();
    const matchedKey = categories.find(c => c.toLowerCase() === cleanP.toLowerCase()) || cleanP;
    const data = campaignPowerLevels[matchedKey] || campaignPowerLevels[cleanP];
    const defaultMin = typeof globalSettings[matchedKey]?.min === 'number' && !isNaN(globalSettings[matchedKey]?.min) && globalSettings[matchedKey].min > 0
      ? globalSettings[matchedKey].min
      : 10;

    const rawVal = typeof data === 'number' ? data : (data && typeof data?.value === 'number' ? data.value : undefined);
    const valNum = (typeof rawVal === 'number' && !isNaN(rawVal))
      ? rawVal
      : defaultMin;

    // Berechne das individuelle Maximum für diesen Parameter
    const calculatedIndividualMax = calculateIndividualParameterMax({
      paramName: matchedKey,
      race,
      customRaces,
      body: options?.body,
      gender: options?.gender,
      stature: options?.stature,
      build: options?.build,
      potentialPercent: typeof options?.potential === 'number' ? options.potential : (typeof options?.potential === 'string' ? parseFloat(options.potential) || 100 : 100),
      parameterPotentialPercentages: options?.parameterPotentialPercentages,
      world,
      worldPowerSettings,
      baseParameters: options?.baseParameters
    });

    const rawMax = data && typeof data === 'object' && typeof data?.potentialMax === 'number' ? data.potentialMax : undefined;
    // Wenn rawMax ein alter Standard-Fallback ist (1000, 9999, 100000) oder fehlt, nutze das berechnete Maximum
    const potMaxNum = (typeof rawMax === 'number' && !isNaN(rawMax) && rawMax !== 1000 && rawMax !== 9999 && rawMax !== 100000 && rawMax > 0)
      ? rawMax
      : calculatedIndividualMax;

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
  let healthMaxSum = 0;
  let healthCount = 0;

  const activeHealthParamNames = healthPowerNames.filter(name => {
    return categories.some(c => c.toLowerCase() === name.toLowerCase()) || name.toLowerCase() === 'konstitution';
  });
  const effectiveHealthParams = activeHealthParamNames.length > 0 ? activeHealthParamNames : ['Konstitution'];

  effectiveHealthParams.forEach(hpName => {
    const pData = getParamData(hpName);
    healthSum += Math.max(1, pData.value);
    healthMaxSum += Math.max(1, pData.potentialMax);
    healthCount++;
  });

  const avgHealthParam = healthCount > 0 ? (healthSum / healthCount) : 10;
  const avgHealthParamMax = healthCount > 0 ? (healthMaxSum / healthCount) : 100;
  const computedHpVal = Math.max(1, Math.round(30 * (avgHealthParam / 10)));
  const computedHpMax = Math.max(computedHpVal, Math.max(1, Math.round(30 * (avgHealthParamMax / 10))));
  const healthLabel = world?.healthLabel || 'Gesundheit (HP)';

  // Prüfe auf direkte Überschreibung im Charakter-Datenobjekt (z.B. durch Pfeilbuttons)
  const hpOverrideKey = ['hp', healthLabel, 'Gesundheit (HP)'].find(k => campaignPowerLevels[k] !== undefined);
  let customHpVal: number | undefined = undefined;
  let customHpMax: number | undefined = undefined;
  if (hpOverrideKey) {
    const entry = campaignPowerLevels[hpOverrideKey];
    const parsedVal = typeof entry === 'number' ? entry : entry?.value;
    if (typeof parsedVal === 'number' && !isNaN(parsedVal) && parsedVal >= 1) {
      customHpVal = parsedVal;
    }
    const parsedMax = typeof entry === 'object' ? entry?.potentialMax : undefined;
    if (typeof parsedMax === 'number' && !isNaN(parsedMax) && parsedMax !== 9999 && parsedMax !== 1000 && parsedMax >= 1) {
      customHpMax = parsedMax;
    }
  }

  const hpVal = Math.max(1, customHpVal !== undefined ? customHpVal : computedHpVal);
  const hpMax = Math.max(hpVal, customHpMax !== undefined ? customHpMax : computedHpMax);

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
    const defaultResMax = resCount > 0 ? Math.max(defaultResVal, Math.round(resMaxSum / resCount)) : Math.max(1, res.baseMax || 100);
    const resId = res.id || `cost-${(res.name || 'mp').toLowerCase()}`;

    // Prüfe auf direkte Überschreibung im Charakter-Datenobjekt
    const resOverrideKey = [resId, res.name].find(k => k && campaignPowerLevels[k] !== undefined);
    let customResVal: number | undefined = undefined;
    let customResMax: number | undefined = undefined;
    if (resOverrideKey) {
      const entry = campaignPowerLevels[resOverrideKey];
      const parsedVal = typeof entry === 'number' ? entry : entry?.value;
      if (typeof parsedVal === 'number' && !isNaN(parsedVal) && parsedVal >= 1) {
        customResVal = parsedVal;
      }
      const parsedMax = typeof entry === 'object' ? entry?.potentialMax : undefined;
      if (typeof parsedMax === 'number' && !isNaN(parsedMax) && parsedMax !== 1000 && parsedMax !== 9999 && parsedMax >= 1) {
        customResMax = parsedMax;
      }
    }

    const resVal = Math.max(1, customResVal !== undefined ? customResVal : defaultResVal);
    const resMax = Math.max(resVal, customResMax !== undefined ? customResMax : defaultResMax);

    if (!costResourcesMap.has(resId)) {
      costResourcesMap.set(resId, {
        id: resId,
        name: res.name || 'MP',
        value: resVal,
        max: resMax
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
