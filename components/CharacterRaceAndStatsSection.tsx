// -*- coding: utf-8 -*-
import React, { useMemo, useEffect } from 'react';
import { CampaignPowerParameter, WorldSetting, ProgressionConfig, DevelopmentProfileType } from '../types';
import { STANDARD_RANKS, ProgressionService, DEFAULT_PROGRESSION_CONFIG } from '../services/progressionService';
import { DEFAULT_RACES, RaceService, RaceDefinition, HUMAN_BASE_PARAMETERS } from '../services/raceService';
import { AutoExpandingTextarea } from './AutoExpandingTextarea';
import { Dna, BarChart3, Layers, Sliders, Sparkles, Plus, Minus, RotateCcw } from 'lucide-react';

export interface CharacterRaceAndStatsSectionProps {
  race: string;
  onRaceChange: (val: string) => void;
  customRaces?: RaceDefinition[];
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
  xp?: number;
  onXpChange?: (xp: number) => void;
  developmentProfile?: DevelopmentProfileType;
  onDevelopmentProfileChange?: (profile: DevelopmentProfileType) => void;
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
}

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
  potential = 1000,
  onPotentialChange,
  xp = 0,
  onXpChange,
  developmentProfile = 'normal',
  onDevelopmentProfileChange,
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
  levelsPerRank
}) => {
  const currentRace = race || 'Mensch';
  const availableRaces = customRaces && customRaces.length > 0
    ? Array.from(new Map([...DEFAULT_RACES, ...customRaces].map(r => [r.name.toLowerCase(), r])).values())
    : DEFAULT_RACES;

  const currentRaceDef = RaceService.getRaceDefinition(currentRace, availableRaces);
  const baseParams = currentRaceDef.baseParameters || HUMAN_BASE_PARAMETERS;

  const effectiveConfig = progressionConfig || world?.progressionConfig || DEFAULT_PROGRESSION_CONFIG;
  const currentLevelsPerRank = levelsPerRank ?? effectiveConfig.levelSystem?.levelsPerRank ?? 10;

  // Progression calculations
  const activeProfileKey = developmentProfile || 'normal';
  const xpNeeded = ProgressionService.calculateXpRequirement(level, rank, effectiveConfig, activeProfileKey);
  const progressPercent = xpNeeded > 0 ? Math.min(100, Math.max(0, Math.round((xp / xpNeeded) * 100))) : 100;

  const potNum = typeof potential === 'number' && !isNaN(potential)
    ? potential
    : typeof potential === 'string'
    ? parseFloat(potential) || 1000
    : 1000;

  // Percentage values for Entwicklungsrate & Rangbonus
  const devRatePercent = Math.round((typeof developmentRate === 'number' ? developmentRate : 1.0) * 100);
  const rankBonusValue = typeof rankGrowthBonus === 'number' ? rankGrowthBonus : 25;

  // Level bis Rangaufstieg calculation (e.g. Level 1 with 10 levels per rank -> 9 remaining)
  const levelsUntilRankUp = Math.max(0, currentLevelsPerRank - (((level - 1) % currentLevelsPerRank) + 1));

  // Parameter List
  const parameterList = useMemo(() => {
    const keys = new Set<string>();
    if (worldPowerSettings && typeof worldPowerSettings === 'object') {
      Object.keys(worldPowerSettings).forEach(k => keys.add(k));
    }
    if (characterPowerData && typeof characterPowerData === 'object') {
      Object.keys(characterPowerData).forEach(k => keys.add(k));
    }
    if (keys.size === 0) {
      STANDARD_PARAMETERS.forEach(k => keys.add(k));
    }
    return Array.from(keys);
  }, [worldPowerSettings, characterPowerData]);

  // Base growth per parameter from config
  const baseGrowthPerParam = effectiveConfig.attributeProgression?.baseGrowthPerLevel ?? 2;

  // Total Budget pro Level (freely adjustable, fallback to parameter count * base growth)
  const defaultBudget = parameterList.length * baseGrowthPerParam;
  const currentBudget = typeof developmentPointsPerLevel === 'number' && developmentPointsPerLevel > 0
    ? developmentPointsPerLevel
    : defaultBudget;

  // Allocated points per parameter
  const allocatedPoints: Record<string, number> = useMemo(() => {
    const result: Record<string, number> = {};
    parameterList.forEach(paramName => {
      if (typeof parameterGrowthPoints?.[paramName] === 'number') {
        result[paramName] = parameterGrowthPoints[paramName];
      } else if (typeof parameterGrowthFactors?.[paramName] === 'number') {
        result[paramName] = Math.max(0, Math.round(parameterGrowthFactors[paramName] * baseGrowthPerParam));
      } else {
        result[paramName] = baseGrowthPerParam;
      }
    });
    return result;
  }, [parameterList, parameterGrowthPoints, parameterGrowthFactors, baseGrowthPerParam]);

  const totalSpent = useMemo(() => {
    return Object.values(allocatedPoints).reduce((sum, val) => sum + val, 0);
  }, [allocatedPoints]);

  const remainingBudget = currentBudget - totalSpent;

  // Initialize fresh character Level 1 base parameters if not yet present
  useEffect(() => {
    if (!characterPowerData || Object.keys(characterPowerData).length === 0) {
      const initialPowerData: Record<string, { value: number; potentialMax: number }> = {};
      parameterList.forEach(paramName => {
        const startVal = baseParams[paramName] ?? 10;
        initialPowerData[paramName] = { value: startVal, potentialMax: 1000 };
      });
      onCharacterPowerDataChange(initialPowerData);
    }
  }, [characterPowerData, parameterList, baseParams, onCharacterPowerDataChange]);

  // Point adjustment handlers
  const handlePointChange = (paramName: string, delta: number) => {
    const current = allocatedPoints[paramName] ?? baseGrowthPerParam;
    const nextVal = current + delta;
    if (nextVal < 0) return;

    if (delta > 0 && remainingBudget < delta) {
      return;
    }

    const nextPoints = { ...allocatedPoints, [paramName]: nextVal };
    onParameterGrowthPointsChange?.(nextPoints);

    // Keep factors in sync for central calculation
    const nextFactors: Record<string, number> = { ...(parameterGrowthFactors || {}) };
    parameterList.forEach(p => {
      const pts = nextPoints[p] ?? baseGrowthPerParam;
      nextFactors[p] = baseGrowthPerParam > 0 ? pts / baseGrowthPerParam : 1.0;
    });
    onParameterGrowthFactorsChange?.(nextFactors);
  };

  const handlePointDirectInput = (paramName: string, value: number) => {
    const validVal = Math.max(0, value);
    const nextPoints = { ...allocatedPoints, [paramName]: validVal };
    onParameterGrowthPointsChange?.(nextPoints);

    const nextFactors: Record<string, number> = { ...(parameterGrowthFactors || {}) };
    parameterList.forEach(p => {
      const pts = nextPoints[p] ?? baseGrowthPerParam;
      nextFactors[p] = baseGrowthPerParam > 0 ? pts / baseGrowthPerParam : 1.0;
    });
    onParameterGrowthFactorsChange?.(nextFactors);
  };

  const handleResetToEvenBudget = () => {
    const count = parameterList.length;
    if (count === 0) return;

    const basePerItem = Math.floor(currentBudget / count);
    const remainder = currentBudget % count;

    const nextPoints: Record<string, number> = {};
    const nextFactors: Record<string, number> = {};

    parameterList.forEach((p, idx) => {
      const pts = basePerItem + (idx < remainder ? 1 : 0);
      nextPoints[p] = pts;
      nextFactors[p] = baseGrowthPerParam > 0 ? pts / baseGrowthPerParam : 1.0;
    });

    onParameterGrowthPointsChange?.(nextPoints);
    onParameterGrowthFactorsChange?.(nextFactors);
  };

  const handleCurrentValueChange = (paramName: string, newVal: number) => {
    const currentEntry = characterPowerData?.[paramName];
    const potMax = typeof currentEntry === 'object' && currentEntry !== null && typeof currentEntry.potentialMax === 'number'
      ? currentEntry.potentialMax
      : 1000;

    const updated = {
      ...characterPowerData,
      [paramName]: {
        value: Math.max(0, newVal),
        potentialMax: potMax
      }
    };
    onCharacterPowerDataChange(updated);
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
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

      {/* 2. PROGRESSION */}
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
              value={level}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                onLevelChange?.(val);
              }}
              placeholder="1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Stufe {level}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              EP
            </label>
            <input
              type="number"
              min={0}
              value={xp}
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
            <input
              type="number"
              min={1}
              value={potNum}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1000);
                onPotentialChange?.(val);
              }}
              placeholder="1000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              Wachstumstempo
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Level bis Rangaufstieg
            </label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 font-mono font-bold flex items-center justify-between">
              <span>{levelsUntilRankUp}</span>
              <span className="text-[10px] font-normal text-slate-500">
                ({currentLevelsPerRank}/Rang)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Verbleibende Stufen
            </span>
          </div>
        </div>

        {/* EP-Fortschrittsbalken */}
        <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Fortschritt zur nächsten Stufe</span>
            <span className="font-bold text-amber-300 text-xs">
              {xp} <span className="text-slate-500 font-normal">/ {xpNeeded} EP</span>
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
            <span>Aktuelle Stufe: {level}</span>
            <span>
              {xpNeeded > xp ? `Noch ${xpNeeded - xp} EP bis Stufe ${level + 1}` : 'Stufe aufstiegsbereit'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ENTWICKLUNG & BUDGET */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Entwicklung
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Entwicklungsprofil
            </label>
            <select
              value={activeProfileKey}
              onChange={e => onDevelopmentProfileChange?.(e.target.value as DevelopmentProfileType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {PROFILE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Entwicklungsrate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={5}
                min={10}
                max={500}
                value={devRatePercent}
                onChange={e => {
                  const val = parseInt(e.target.value) || 100;
                  onDevelopmentRateChange?.(val / 100);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
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
                step={5}
                min={0}
                max={500}
                value={rankBonusValue}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onRankGrowthBonusChange?.(val);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">+{rankBonusValue} %</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Entwicklungspunkte pro Level
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={500}
                value={currentBudget}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onDevelopmentPointsPerLevelChange?.(val);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleResetToEvenBudget}
                title="Gleichmäßig verteilen"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
              <span className="text-slate-400">Verteilt:</span>
              <span className={`font-bold ${
                remainingBudget === 0
                  ? 'text-emerald-400'
                  : remainingBudget > 0
                  ? 'text-blue-400'
                  : 'text-rose-400'
              }`}>
                {totalSpent} / {currentBudget}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PARAMETER & WERTENTWICKLUNG */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Parameter
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Budget:</span>
              <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {currentBudget} Punkte pro Level
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                remainingBudget === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : remainingBudget > 0
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {totalSpent} / {currentBudget} verteilt
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetToEvenBudget}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Gleichmäßig</span>
            </button>
          </div>
        </div>

        {/* Clean Parameter Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3 text-center">Basiswert (Rasse)</th>
                <th className="py-2.5 px-3 text-center">Aktuell</th>
                <th className="py-2.5 px-3 text-right">Pro Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {parameterList.map(paramName => {
                const baseVal = baseParams[paramName] ?? 10;
                const rawParamData = characterPowerData?.[paramName];
                const currentVal = typeof rawParamData === 'number'
                  ? rawParamData
                  : typeof rawParamData?.value === 'number'
                  ? rawParamData.value
                  : baseVal;

                const allocated = allocatedPoints[paramName] ?? baseGrowthPerParam;

                return (
                  <tr
                    key={`param-row-${paramName}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {paramName}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {baseVal}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        value={currentVal}
                        onChange={e => handleCurrentValueChange(paramName, parseInt(e.target.value) || 0)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={allocated <= 0}
                          onClick={() => handlePointChange(paramName, -1)}
                          className="w-6 h-6 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={allocated}
                          onChange={e => handlePointDirectInput(paramName, parseInt(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 text-xs"
                        />
                        <button
                          type="button"
                          disabled={remainingBudget <= 0}
                          onClick={() => handlePointChange(paramName, 1)}
                          className="w-6 h-6 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CharacterRaceAndStatsSection;
