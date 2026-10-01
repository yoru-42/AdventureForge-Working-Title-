// -*- coding: utf-8 -*-
import React, { useMemo, useEffect } from 'react';
import { CampaignPowerParameter, WorldSetting, ProgressionConfig, DevelopmentProfileType } from '../types';
import { STANDARD_RANKS, ProgressionService, DEFAULT_PROGRESSION_CONFIG } from '../services/progressionService';
import { DEFAULT_RACES, RaceService, RaceDefinition, HUMAN_BASE_PARAMETERS } from '../services/raceService';
import { isResourceKey, calculateIndividualParameterMax, calculateRpgCharacterStats } from '../services/rpgStatService';
import { AutoExpandingTextarea } from './AutoExpandingTextarea';
import RpgStatusWindow from './RpgStatusWindow';
import { Dna, Layers, Sliders, Shield, Zap } from 'lucide-react';

export interface CharacterRaceAndStatsSectionProps {
  race: string;
  onRaceChange: (val: string) => void;
  customRaces?: RaceDefinition[];
  gender?: string;
  onGenderChange?: (val: string) => void;
  build?: string;
  onBuildChange?: (val: string) => void;
  stature?: string;
  onStatureChange?: (val: string) => void;
  raceFeatures?: string;
  onRaceFeaturesChange?: (val: string) => void;
  origin?: string;
  onOriginChange?: (val: string) => void;
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  characterPowerData?: any;
  onCharacterPowerDataChange: (newData: any) => void;
  level?: number;
  onLevelChange?: (lvl: number) => void;
  rank?: string;
  onRankChange?: (rank: string) => void;
  potential?: number | string;
  onPotentialChange?: (pot: number) => void;
  parameterPotentialPercentages?: Record<string, number>;
  onParameterPotentialPercentagesChange?: (percentages: Record<string, number>) => void;
  xp?: number;
  onXpChange?: (xp: number) => void;
  developmentProfile?: DevelopmentProfileType;
  onDevelopmentProfileChange?: (profile: DevelopmentProfileType) => void;
  epGainRate?: number;
  onEpGainRateChange?: (rate: number) => void;
  developmentRate?: number;
  onDevelopmentRateChange?: (rate: number) => void;
  rankGrowthBonus?: number;
  onRankGrowthBonusChange?: (bonus: number) => void;
  developmentPointsPerLevel?: number;
  onDevelopmentPointsPerLevelChange?: (budget: number) => void;
  parameterGrowthPoints?: Record<string, number>;
  onParameterGrowthPointsChange?: (points: Record<string, number>) => void;
  parameterGrowthFactors?: Record<string, number>;
  onParameterGrowthFactorsChange?: (factors: Record<string, number>) => void;
  progressionConfig?: ProgressionConfig;
  levelsPerRank?: number;
  onLevelsPerRankChange?: (val: number) => void;
  baseGrowthPerLevel?: number;
  onBaseGrowthPerLevelChange?: (val: number) => void;
}

export const CHARACTER_GENDER_OPTIONS = ['Männlich', 'Weiblich', 'Geschlechtslos', 'Futanari'];
export const CHARACTER_BUILD_OPTIONS = ['Schlank', 'Sportlich', 'Muskulös', 'Kräftig', 'Zierlich', 'Drahtig', 'Kurvig', 'Stämmig', 'Hager', 'Unbekannt'];

const PROFILE_OPTIONS: { value: DevelopmentProfileType; label: string; desc: string }[] = [
  { value: 'normal', label: 'Normal (1.0× EP / 1.0× Werte)', desc: 'Standardmäßiges, ausgewogenes Entwicklungstempo.' },
  { value: 'fast', label: 'Schnell (1.5× EP / 1.25× Werte)', desc: 'Beschleunigte Progression für rasche Spielentwicklung.' },
  { value: 'veryFast', label: 'Sehr schnell (2.5× EP / 1.5× Werte)', desc: 'Rasanter Fortschritt mit hohem EP-Gewinn.' },
  { value: 'slow', label: 'Langsam (0.75× EP / 0.75× Werte)', desc: 'Gemächlicher Fortschritt mit leicht erhöhtem EP-Bedarf.' },
  { value: 'verySlow', label: 'Sehr langsam (0.5× EP / 0.5× Werte)', desc: 'Deutlich verzögerter Fortschritt für anspruchsvolle Kampagnen.' },
  { value: 'balanced', label: 'Ausgewogen (1.0× EP / 1.0× Werte)', desc: 'Gleichmäßiges Entwicklungstempo.' },
  { value: 'focused', label: 'Fokussiert / Spezialist (1.25× Werte)', desc: 'Gezielte, konzentrierte Werteentwicklung.' },
  { value: 'late_bloomer', label: 'Spätentwickler (1.5× Endgame-Werte)', desc: 'Langsamerer Anfang mit starkem Endgame-Potenzial.' },
  { value: 'slow_growth', label: 'Langsames Wachstum (0.8× Werte)', desc: 'Gleichmäßiges, anspruchsvolles Entwicklungstempo.' },
  { value: 'custom', label: 'Individuell', desc: 'Frei definierte Multiplikatoren.' }
];

const STANDARD_PARAMETERS = ['Stärke', 'Geschicklichkeit', 'Konstitution', 'Intelligenz', 'Willenskraft', 'Magie'];

export const CharacterRaceAndStatsSection: React.FC<CharacterRaceAndStatsSectionProps> = ({
  race,
  onRaceChange,
  customRaces,
  gender = 'Männlich',
  onGenderChange,
  build = 'Schlank',
  onBuildChange,
  stature,
  onStatureChange,
  raceFeatures = '',
  onRaceFeaturesChange,
  origin = '',
  onOriginChange,
  world,
  worldPowerSettings = {},
  characterPowerData = {},
  onCharacterPowerDataChange,
  level = 1,
  onLevelChange,
  rank = 'F',
  onRankChange,
  potential = 100,
  onPotentialChange,
  parameterPotentialPercentages,
  onParameterPotentialPercentagesChange,
  xp = 0,
  onXpChange,
  developmentProfile = 'normal',
  onDevelopmentProfileChange,
  epGainRate,
  onEpGainRateChange,
  developmentRate = 1.0,
  onDevelopmentRateChange,
  rankGrowthBonus = 25,
  onRankGrowthBonusChange,
  developmentPointsPerLevel,
  onDevelopmentPointsPerLevelChange,
  parameterGrowthPoints = {},
  onParameterGrowthPointsChange,
  parameterGrowthFactors = {},
  onParameterGrowthFactorsChange,
  progressionConfig,
  levelsPerRank,
  onLevelsPerRankChange,
  baseGrowthPerLevel,
  onBaseGrowthPerLevelChange
}) => {
  const currentRace = race || 'Mensch';
  const effectiveStature = stature || build || 'Schlank';
  const effectiveBuild = build || stature || 'Schlank';
  const availableRaces = customRaces && customRaces.length > 0
    ? Array.from(new Map([...DEFAULT_RACES, ...customRaces].map(r => [r.name.toLowerCase(), r])).values())
    : DEFAULT_RACES;

  const currentRaceDef = RaceService.getRaceDefinition(currentRace, availableRaces);
  const baseParams = currentRaceDef.baseParameters || HUMAN_BASE_PARAMETERS;

  const effectiveConfig = progressionConfig || world?.progressionConfig || DEFAULT_PROGRESSION_CONFIG;
  const [localLevelsPerRank, setLocalLevelsPerRank] = React.useState<number | undefined>(levelsPerRank);
  React.useEffect(() => {
    if (levelsPerRank !== undefined) {
      setLocalLevelsPerRank(levelsPerRank);
    }
  }, [levelsPerRank]);

  const effectiveLevelsPerRank = levelsPerRank ?? localLevelsPerRank ?? effectiveConfig.levelSystem?.levelsPerRank ?? 10;
  const currentLevelsPerRank = typeof effectiveLevelsPerRank === 'number' && !isNaN(effectiveLevelsPerRank) && effectiveLevelsPerRank > 0
    ? effectiveLevelsPerRank
    : 10;

  const handleLevelsPerRankChange = (val: number) => {
    const safeVal = Math.max(1, Math.min(500, val));
    setLocalLevelsPerRank(safeVal);
    onLevelsPerRankChange?.(safeVal);
  };

  // Safe numerical progression values
  const safeLevel = typeof level === 'number' && !isNaN(level) && level >= 1 ? Math.floor(level) : 1;
  const safeXp = typeof xp === 'number' && !isNaN(xp) && xp >= 0 ? Math.floor(xp) : 0;

  const activeProfileKey = developmentProfile || 'normal';
  const profileEpMult = ProgressionService.getDevelopmentProfile(activeProfileKey, effectiveConfig).epGainMultiplier ?? 1.0;
  const rawEpGain = typeof epGainRate === 'number' && !isNaN(epGainRate)
    ? epGainRate
    : (typeof epGainRate === 'string' ? parseFloat(epGainRate) || profileEpMult : profileEpMult);
  const epGainPercent = Math.round(rawEpGain * 100);

  const [localEpGainStr, setLocalEpGainStr] = React.useState<string>(() => String(epGainPercent));
  React.useEffect(() => {
    if (localEpGainStr !== '' && !isNaN(parseInt(localEpGainStr, 10))) {
      if (parseInt(localEpGainStr, 10) !== epGainPercent) {
        setLocalEpGainStr(String(epGainPercent));
      }
    } else if (localEpGainStr === '') {
      // Keep empty while user is typing
    } else {
      setLocalEpGainStr(String(epGainPercent));
    }
  }, [epGainPercent]);

  const rawXpNeeded = ProgressionService.calculateXpRequirement(safeLevel, rank, effectiveConfig, activeProfileKey);
  const xpNeeded = typeof rawXpNeeded === 'number' && !isNaN(rawXpNeeded) && rawXpNeeded > 0 ? rawXpNeeded : 100;
  const rawProgressPercent = xpNeeded > 0 ? Math.round((safeXp / xpNeeded) * 100) : 100;
  const progressPercent = typeof rawProgressPercent === 'number' && !isNaN(rawProgressPercent)
    ? Math.min(100, Math.max(0, rawProgressPercent))
    : 0;

  const rawPot = typeof potential === 'number' && !isNaN(potential)
    ? potential
    : typeof potential === 'string'
    ? (parseFloat(potential) || 100)
    : 100;
  const safePotPercent = rawPot > 200
    ? Math.min(200, Math.max(1, Math.round(rawPot / 10)))
    : Math.min(200, Math.max(1, Math.round(rawPot)));

  const [localPotentialStr, setLocalPotentialStr] = React.useState<string>(() => String(safePotPercent));
  React.useEffect(() => {
    if (localPotentialStr !== '' && !isNaN(parseInt(localPotentialStr, 10))) {
      if (parseInt(localPotentialStr, 10) !== safePotPercent) {
        setLocalPotentialStr(String(safePotPercent));
      }
    } else if (localPotentialStr === '') {
      // Keep empty while user is typing
    } else {
      setLocalPotentialStr(String(safePotPercent));
    }
  }, [safePotPercent]);

  // Percentage values for Entwicklungsrate & Rangbonus
  const rawDevRate = typeof developmentRate === 'number' && !isNaN(developmentRate)
    ? developmentRate
    : (typeof developmentRate === 'string' ? parseFloat(developmentRate) || 1.0 : 1.0);
  const devRatePercent = Math.round((!isNaN(rawDevRate) ? rawDevRate : 1.0) * 100);

  const [localDevRateStr, setLocalDevRateStr] = React.useState<string>(() => String(devRatePercent));
  React.useEffect(() => {
    if (localDevRateStr !== '' && !isNaN(parseInt(localDevRateStr, 10))) {
      if (parseInt(localDevRateStr, 10) !== devRatePercent) {
        setLocalDevRateStr(String(devRatePercent));
      }
    } else if (localDevRateStr === '') {
      // Keep empty while user is typing
    } else {
      setLocalDevRateStr(String(devRatePercent));
    }
  }, [devRatePercent]);

  const rawRankBonus = typeof rankGrowthBonus === 'number' && !isNaN(rankGrowthBonus)
    ? rankGrowthBonus
    : (typeof rankGrowthBonus === 'string' ? parseFloat(rankGrowthBonus) || 25 : 25);
  const rankBonusValue = !isNaN(rawRankBonus) ? rawRankBonus : 25;

  const [localRankBonusStr, setLocalRankBonusStr] = React.useState<string>(() => String(rankBonusValue));
  React.useEffect(() => {
    if (localRankBonusStr !== '' && !isNaN(parseInt(localRankBonusStr, 10))) {
      if (parseInt(localRankBonusStr, 10) !== rankBonusValue) {
        setLocalRankBonusStr(String(rankBonusValue));
      }
    } else if (localRankBonusStr === '') {
      // Keep empty while user is typing
    } else {
      setLocalRankBonusStr(String(rankBonusValue));
    }
  }, [rankBonusValue]);

  // Base growth per parameter from prop or config
  const rawBaseGrowth = typeof baseGrowthPerLevel === 'number' && !isNaN(baseGrowthPerLevel) && baseGrowthPerLevel >= 0
    ? baseGrowthPerLevel
    : effectiveConfig.attributeProgression?.baseGrowthPerLevel;
  const baseGrowthPerParam = typeof rawBaseGrowth === 'number' && !isNaN(rawBaseGrowth) && rawBaseGrowth >= 0
    ? rawBaseGrowth
    : 2;

  const [localBaseGrowthStr, setLocalBaseGrowthStr] = React.useState<string>(() => String(baseGrowthPerParam));
  React.useEffect(() => {
    if (localBaseGrowthStr !== '' && !isNaN(parseInt(localBaseGrowthStr, 10))) {
      if (parseInt(localBaseGrowthStr, 10) !== baseGrowthPerParam) {
        setLocalBaseGrowthStr(String(baseGrowthPerParam));
      }
    } else if (localBaseGrowthStr === '') {
      // Keep empty while user is typing
    } else {
      setLocalBaseGrowthStr(String(baseGrowthPerParam));
    }
  }, [baseGrowthPerParam]);

  // Level bis Rangaufstieg calculation
  const levelsUntilRankUp = Math.max(0, currentLevelsPerRank - (((safeLevel - 1) % currentLevelsPerRank) + 1));

  // Parameter List: Standard parameters are always included, plus any custom parameters (excluding resources)
  const parameterList = useMemo(() => {
    const keys = new Set<string>(STANDARD_PARAMETERS);
    if (worldPowerSettings && typeof worldPowerSettings === 'object') {
      Object.keys(worldPowerSettings).forEach(k => {
        if (!isResourceKey(k, world)) keys.add(k);
      });
    }
    if (characterPowerData && typeof characterPowerData === 'object') {
      Object.keys(characterPowerData).forEach(k => {
        if (!isResourceKey(k, world)) keys.add(k);
      });
    }
    return Array.from(keys);
  }, [worldPowerSettings, characterPowerData, world]);

  // Total Budget pro Level (Mensch = 5)
  const isHuman = currentRace.toLowerCase().includes('mensch') || currentRace.toLowerCase().includes('human');
  const defaultBudget = isHuman ? 5 : (currentRaceDef.defaultFreePoints ?? 5);
  const rawDevPoints = typeof developmentPointsPerLevel === 'number' && !isNaN(developmentPointsPerLevel)
    ? developmentPointsPerLevel
    : (typeof developmentPointsPerLevel === 'string' ? parseFloat(developmentPointsPerLevel) || defaultBudget : defaultBudget);
  const currentBudget = typeof rawDevPoints === 'number' && !isNaN(rawDevPoints) && rawDevPoints >= 0
    ? rawDevPoints
    : defaultBudget;

  // Initialize and ensure all standard parameters exist without overwriting existing character data
  useEffect(() => {
    const currentData = characterPowerData || {};
    let needsUpdate = false;
    const updatedPowerData: Record<string, { value: number; potentialMax?: number; xp?: number }> = {};

    // Check for broken Level 1 zeroed or all-1 datasets caused by previous point reset bug
    const isLegacyBrokenDataset = (
      safeLevel === 1 &&
      safeXp === 0 &&
      (currentData as any)?._freePoints === 0 &&
      STANDARD_PARAMETERS.every(pName => {
        const entry = currentData[pName];
        if (entry === undefined || entry === null) return true;
        const v = typeof entry === 'number' ? entry : entry.value;
        return v === 0 || v === 1;
      })
    );

    parameterList.forEach(paramName => {
      const existing = currentData[paramName];
      const raceBaseVal = typeof baseParams[paramName] === 'number' && !isNaN(baseParams[paramName])
        ? Math.max(1, baseParams[paramName])
        : 10;

      const indMax = calculateIndividualParameterMax({
        paramName,
        race: currentRace,
        customRaces,
        gender,
        stature: effectiveStature,
        build: effectiveBuild,
        potentialPercent: parameterPotentialPercentages?.[paramName] ?? safePotPercent,
        parameterPotentialPercentages,
        world,
        worldPowerSettings,
        baseParameters: baseParams,
        rank: rank || 'F',
        rankGrowthBonus: rankBonusValue
      });

      // REGEL 3: Berechne den aktuellen Parameterwert aus Level, EP, Rasse und Progressionsregeln
      const baselineProgressionVal = ProgressionService.calculateParameterValueForLevel({
        parameterName: paramName,
        baseValue: raceBaseVal,
        level: safeLevel,
        rank: rank || 'F',
        xp: safeXp,
        config: effectiveConfig,
        profileType: activeProfileKey,
        race: currentRace,
        customRaces,
        potential: safePotPercent,
        parameterPotentialPercentages,
        parameterGrowthPoints,
        parameterGrowthFactors,
        developmentRateMultiplier: rawDevRate,
        rankGrowthBonus: rankBonusValue,
        levelsPerRank: currentLevelsPerRank,
        baseGrowthPerLevel: baseGrowthPerParam,
        potentialMax: indMax,
        minValue: 1,
        manualDelta: 0
      });

      if (isLegacyBrokenDataset && STANDARD_PARAMETERS.includes(paramName)) {
        updatedPowerData[paramName] = { value: baselineProgressionVal, potentialMax: indMax };
        needsUpdate = true;
      } else if (existing !== undefined && existing !== null) {
        let manualBonus = 0;
        const manualObj = (currentData as any)?._manualPoints;
        if (manualObj && typeof manualObj[paramName] === 'number' && !isNaN(manualObj[paramName])) {
          manualBonus = manualObj[paramName];
        } else {
          const rawExisting = typeof existing === 'number' ? existing : existing.value;
          if (typeof rawExisting === 'number' && !isNaN(rawExisting) && rawExisting > baselineProgressionVal) {
            manualBonus = rawExisting - baselineProgressionVal;
          }
        }

        let val = baselineProgressionVal + manualBonus;
        // Regel 1 & 4: potentialMax ist ein berechneter Wert aus der aktuellen Charakterkonfiguration!
        val = Math.min(val, indMax);

        const existingXp = typeof existing === 'object' ? existing.xp : undefined;
        const rawVal = typeof existing === 'object' ? existing.value : (typeof existing === 'number' ? existing : undefined);
        const existingPotMax = typeof existing === 'object' ? existing.potentialMax : undefined;

        if (val !== rawVal || existingPotMax !== indMax) {
          needsUpdate = true;
        }

        updatedPowerData[paramName] = {
          value: val,
          potentialMax: indMax,
          ...(existingXp !== undefined ? { xp: existingXp } : {})
        };
      } else {
        updatedPowerData[paramName] = { value: baselineProgressionVal, potentialMax: indMax };
        needsUpdate = true;
      }
    });

    // Behalte alle bestehenden Nicht-Parameter-Einträge bei
    Object.keys(currentData).forEach(k => {
      if (!parameterList.includes(k) && currentData[k] !== undefined) {
        if (isLegacyBrokenDataset && (k === 'hp' || k === 'res-mp' || k === 'res-sp' || k === 'cost-mp' || k === 'cost-sp')) {
          // In broken dataset, reset custom resource overrides so they derive cleanly
          needsUpdate = true;
        } else {
          updatedPowerData[k] = currentData[k];
        }
      }
    });

    // Create a clean copy of parameters for resource calculation by removing resource overrides
    const paramsOnlyData: Record<string, any> = {};
    Object.keys(updatedPowerData).forEach(k => {
      if (!isResourceKey(k, world)) {
        paramsOnlyData[k] = updatedPowerData[k];
      }
    });

    // Berechne die dynamischen Kampfressourcen (HP, MP, SP) basierend auf den neuen Parameter-Zuwächsen neu
    const derivedStats = calculateRpgCharacterStats(paramsOnlyData, world, worldPowerSettings, currentRace, customRaces, {
      gender,
      stature: effectiveStature,
      build: effectiveBuild,
      potential: safePotPercent,
      parameterPotentialPercentages,
      level: safeLevel,
      rank: rank || 'F',
      progressionConfig: effectiveConfig,
      parameterGrowthFactors,
      parameterGrowthPoints,
      developmentRate: rawDevRate,
      rankGrowthBonus: rankBonusValue,
      levelsPerRank: currentLevelsPerRank,
      baseGrowthPerLevel: baseGrowthPerParam
    });

    derivedStats.resources.forEach(res => {
      const activeKey = [res.id, res.name].find(k => k && currentData[k] !== undefined) || res.name;
      const defaultVal = res.unscaledValue ?? res.value;
      const defaultMax = res.unscaledMax ?? res.max;
      
      const existing = updatedPowerData[activeKey];
      const existingVal = typeof existing === 'object' ? existing?.value : (typeof existing === 'number' ? existing : undefined);
      const existingMax = typeof existing === 'object' ? existing?.potentialMax : undefined;

      if (existingVal !== defaultVal || existingMax !== defaultMax) {
        needsUpdate = true;
      }

      updatedPowerData[activeKey] = {
        value: defaultVal,
        potentialMax: defaultMax
      };
    });

    const currentFree = (currentData as any)?._freePoints;
    if (currentFree === undefined || isLegacyBrokenDataset) {
      (updatedPowerData as any)._freePoints = isHuman ? 5 : currentBudget;
      needsUpdate = true;
    } else {
      (updatedPowerData as any)._freePoints = currentFree;
    }

    const currentManualPoints = (currentData as any)?._manualPoints;
    if (currentManualPoints && !isLegacyBrokenDataset) {
      (updatedPowerData as any)._manualPoints = currentManualPoints;
    }

    if (needsUpdate) {
      onCharacterPowerDataChange(updatedPowerData);
    }
  }, [
    characterPowerData,
    parameterList,
    baseParams,
    level,
    safeLevel,
    xp,
    safeXp,
    onCharacterPowerDataChange,
    race,
    currentRace,
    customRaces,
    gender,
    build,
    effectiveBuild,
    stature,
    effectiveStature,
    potential,
    safePotPercent,
    parameterPotentialPercentages,
    world,
    worldPowerSettings,
    isHuman,
    currentBudget,
    rank,
    effectiveConfig,
    activeProfileKey,
    parameterGrowthPoints,
    parameterGrowthFactors,
    rawDevRate,
    rankBonusValue,
    currentLevelsPerRank,
    baseGrowthPerParam
  ]);

  return (
    <div className="space-y-6">
      {/* 1. RASSE & EIGENSCHAFTEN */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Dna className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Rasse &amp; Eigenschaften
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rasse / Spezies
            </label>
            <select
              value={currentRace}
              onChange={e => onRaceChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {availableRaces.map(r => (
                <option key={r.id || r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
              {currentRaceDef.description || 'Biologische Spezies'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Geschlecht
            </label>
            <select
              value={CHARACTER_GENDER_OPTIONS.includes(gender || '') ? gender : (gender === 'Divers' || gender === 'Nicht-Binär' || gender === 'Androgyn' || gender === 'Unbekannt' ? 'Geschlechtslos' : (gender || 'Weiblich'))}
              onChange={e => onGenderChange?.(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {CHARACTER_GENDER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Biologisches oder phänotypisches Geschlecht
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Statur
            </label>
            <select
              value={effectiveStature}
              onChange={e => {
                const val = e.target.value;
                onBuildChange?.(val);
                onStatureChange?.(val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {CHARACTER_BUILD_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Körperbau und Statur
            </span>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rassenmerkmale
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={raceFeatures}
              onChange={e => onRaceFeaturesChange?.(e.target.value)}
              placeholder="z. B. Spitze Ohren, Dämmersicht, Hornansatz"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Anatomische oder visuelle Eigenheiten
            </span>
          </div>

          <div className="sm:col-span-2 md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Herkunft / Volk
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={origin}
              onChange={e => onOriginChange?.(e.target.value)}
              placeholder="z. B. Eisiges Nordland, Hochgebirge"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Heimatland oder Kulturkreis
            </span>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSION & ENTWICKLUNG */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Progression
          </h3>
        </div>

        {/* Top Grid: Rang, Level, EP, Potenzial, Level bis Rangaufstieg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rang
            </label>
            <select
              value={rank || 'F'}
              onChange={e => onRankChange?.(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold cursor-pointer"
            >
              {STANDARD_RANKS.map(r => (
                <option key={`char-rank-${r}`} value={r}>
                  Rang {r}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Einstufung
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Level
            </label>
            <input
              type="number"
              min={1}
              value={safeLevel}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                onLevelChange?.(val);
              }}
              placeholder="1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Stufe {safeLevel}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              EP
            </label>
            <input
              type="number"
              min={0}
              value={safeXp}
              onChange={e => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                onXpChange?.(val);
              }}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Erfahrung
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Potenzial
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={200}
                value={localPotentialStr}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalPotentialStr(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    const clamped = Math.min(200, Math.max(1, parsed));
                    onPotentialChange?.(clamped);
                  }
                }}
                onBlur={() => {
                  if (localPotentialStr === '' || isNaN(parseInt(localPotentialStr, 10))) {
                    setLocalPotentialStr('100');
                    onPotentialChange?.(100);
                  } else {
                    const parsed = parseInt(localPotentialStr, 10);
                    const clamped = Math.min(200, Math.max(1, parsed));
                    setLocalPotentialStr(String(clamped));
                    onPotentialChange?.(clamped);
                  }
                }}
                placeholder="100"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              Wachstumstempo (1–200%)
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1" title="Wie viele Level erreicht werden müssen, um einen neuen Rang aufzusteigen">
              Level bis Rangaufstieg
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={currentLevelsPerRank}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                handleLevelsPerRankChange(val);
              }}
              placeholder="10"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate" title={`Noch ${levelsUntilRankUp} Stufe(n) bis zum nächsten Rang`}>
              Noch {levelsUntilRankUp} {levelsUntilRankUp === 1 ? 'Stufe' : 'Stufen'} verbleibend
            </span>
          </div>
        </div>

        {/* EP-Gewinn, Entwicklungsrate & Rangbonus */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>EP-Gewinn</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={1000}
                value={localEpGainStr}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalEpGainStr(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    const clamped = Math.max(10, Math.min(1000, parsed));
                    onEpGainRateChange?.(clamped / 100);
                    if (clamped === 100) onDevelopmentProfileChange?.('normal');
                    else if (clamped === 150) onDevelopmentProfileChange?.('fast');
                    else if (clamped === 250) onDevelopmentProfileChange?.('veryFast');
                    else if (clamped === 75) onDevelopmentProfileChange?.('slow');
                    else if (clamped === 50) onDevelopmentProfileChange?.('verySlow');
                    else onDevelopmentProfileChange?.('custom');
                  }
                }}
                onBlur={() => {
                  if (localEpGainStr === '' || isNaN(parseInt(localEpGainStr, 10))) {
                    setLocalEpGainStr('100');
                    onEpGainRateChange?.(1.0);
                    onDevelopmentProfileChange?.('normal');
                  } else {
                    const parsed = parseInt(localEpGainStr, 10);
                    const clamped = Math.max(10, Math.min(1000, parsed));
                    setLocalEpGainStr(String(clamped));
                    onEpGainRateChange?.(clamped / 100);
                  }
                }}
                placeholder="100"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Entwicklungsrate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={500}
                value={localDevRateStr}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalDevRateStr(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    const clamped = Math.max(10, Math.min(500, parsed));
                    onDevelopmentRateChange?.(clamped / 100);
                  }
                }}
                onBlur={() => {
                  if (localDevRateStr === '' || isNaN(parseInt(localDevRateStr, 10))) {
                    setLocalDevRateStr('100');
                    onDevelopmentRateChange?.(1.0);
                  } else {
                    const parsed = parseInt(localDevRateStr, 10);
                    const clamped = Math.max(10, Math.min(500, parsed));
                    setLocalDevRateStr(String(clamped));
                    onDevelopmentRateChange?.(clamped / 100);
                  }
                }}
                placeholder="100"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rangaufstiegs-Bonus
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={500}
                value={localRankBonusStr}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalRankBonusStr(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    const clamped = Math.max(0, Math.min(500, parsed));
                    onRankGrowthBonusChange?.(clamped);
                  }
                }}
                onBlur={() => {
                  if (localRankBonusStr === '' || isNaN(parseInt(localRankBonusStr, 10))) {
                    setLocalRankBonusStr('25');
                    onRankGrowthBonusChange?.(25);
                  } else {
                    const parsed = parseInt(localRankBonusStr, 10);
                    const clamped = Math.max(0, Math.min(500, parsed));
                    setLocalRankBonusStr(String(clamped));
                    onRankGrowthBonusChange?.(clamped);
                  }
                }}
                placeholder="25"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">+{rankBonusValue} %</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Basis-Wachstum pro Level
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                value={localBaseGrowthStr}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalBaseGrowthStr(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    const clamped = Math.max(0, Math.min(50, parsed));
                    onBaseGrowthPerLevelChange?.(clamped);
                  }
                }}
                onBlur={() => {
                  if (localBaseGrowthStr === '' || isNaN(parseInt(localBaseGrowthStr, 10))) {
                    setLocalBaseGrowthStr(String(baseGrowthPerParam));
                    onBaseGrowthPerLevelChange?.(baseGrowthPerParam);
                  } else {
                    const parsed = parseInt(localBaseGrowthStr, 10);
                    const clamped = Math.max(0, Math.min(50, parsed));
                    setLocalBaseGrowthStr(String(clamped));
                    onBaseGrowthPerLevelChange?.(clamped);
                  }
                }}
                placeholder="2"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-400 font-mono font-bold shrink-0">Pkt.</span>
            </div>
          </div>
        </div>

        {/* EP-Fortschrittsbalken */}
        <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Fortschritt zur nächsten Stufe</span>
            <span className="font-bold text-amber-300 text-xs">
              {safeXp} <span className="text-slate-500 font-normal">/ {xpNeeded} EP</span>
              <span className="ml-2 text-slate-400 font-normal text-[10px]">({progressPercent}%)</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Aktuelle Stufe: {safeLevel}</span>
            <div className="flex items-center gap-2">
              <span>
                {xpNeeded > safeXp ? `Noch ${xpNeeded - safeXp} EP bis Stufe ${safeLevel + 1}` : 'Stufe aufstiegsbereit'}
              </span>
              {safeXp >= xpNeeded && (
                <button
                  type="button"
                  onClick={() => {
                    const nextXp = Math.max(0, safeXp - xpNeeded);
                    onXpChange?.(nextXp);
                    onLevelChange?.(safeLevel + 1);
                  }}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-colors shadow-sm cursor-pointer"
                >
                  Stufe aufsteigen (+1 Level)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. KAMPFEIGENSCHAFTEN & STATUS (mit integrierter Parameter-Entwicklung) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 px-1">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Kampfeigenschaften &amp; Status
          </h3>
        </div>

        <RpgStatusWindow
          race={currentRace}
          customRaces={availableRaces}
          gender={gender}
          build={effectiveBuild}
          stature={effectiveStature}
          world={world}
          worldPowerSettings={worldPowerSettings}
          campaignPowerLevels={characterPowerData}
          onChangeCampaignPowerLevels={onCharacterPowerDataChange}
          rank={rank}
          level={safeLevel}
          xp={safeXp}
          maxXp={xpNeeded}
          showStatusHeader={false}
          baseParameters={baseParams}
          characterPotential={safePotPercent}
          parameterPotentialPercentages={parameterPotentialPercentages}
          onParameterPotentialPercentagesChange={onParameterPotentialPercentagesChange}
          developmentPointsPerLevel={currentBudget}
          onDevelopmentPointsPerLevelChange={onDevelopmentPointsPerLevelChange}
          parameterGrowthPoints={parameterGrowthPoints}
          onParameterGrowthPointsChange={onParameterGrowthPointsChange}
          parameterGrowthFactors={parameterGrowthFactors}
          onParameterGrowthFactorsChange={onParameterGrowthFactorsChange}
          baseGrowthPerParam={baseGrowthPerParam}
          progressionConfig={effectiveConfig}
          developmentProfile={activeProfileKey}
          developmentRate={rawDevRate}
          rankGrowthBonus={rankBonusValue}
          levelsPerRank={currentLevelsPerRank}
        />
      </div>
    </div>
  );
};

export default CharacterRaceAndStatsSection;
