// -*- coding: utf-8 -*-
import React, { useMemo, useEffect } from 'react';
import { CampaignPowerParameter, WorldSetting, ProgressionConfig, DevelopmentProfileType } from '../types';
import { STANDARD_RANKS, ProgressionService, DEFAULT_PROGRESSION_CONFIG } from '../services/progressionService';
import { DEFAULT_RACES, RaceService, RaceDefinition, HUMAN_BASE_PARAMETERS } from '../services/raceService';
import { AutoExpandingTextarea } from './AutoExpandingTextarea';
import RpgStatusWindow from './RpgStatusWindow';
import { Dna, Layers, Sliders, Shield } from 'lucide-react';

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
  const rawLevelsPerRank = levelsPerRank ?? effectiveConfig.levelSystem?.levelsPerRank ?? 10;
  const currentLevelsPerRank = typeof rawLevelsPerRank === 'number' && !isNaN(rawLevelsPerRank) && rawLevelsPerRank > 0
    ? rawLevelsPerRank
    : 10;

  // Safe numerical progression values
  const safeLevel = typeof level === 'number' && !isNaN(level) && level >= 1 ? Math.floor(level) : 1;
  const safeXp = typeof xp === 'number' && !isNaN(xp) && xp >= 0 ? Math.floor(xp) : 0;

  const activeProfileKey = developmentProfile || 'normal';
  const rawXpNeeded = ProgressionService.calculateXpRequirement(safeLevel, rank, effectiveConfig, activeProfileKey);
  const xpNeeded = typeof rawXpNeeded === 'number' && !isNaN(rawXpNeeded) && rawXpNeeded > 0 ? rawXpNeeded : 100;
  const rawProgressPercent = xpNeeded > 0 ? Math.round((safeXp / xpNeeded) * 100) : 100;
  const progressPercent = typeof rawProgressPercent === 'number' && !isNaN(rawProgressPercent)
    ? Math.min(100, Math.max(0, rawProgressPercent))
    : 0;

  const potNum = typeof potential === 'number' && !isNaN(potential)
    ? potential
    : typeof potential === 'string'
    ? (parseFloat(potential) || 1000)
    : 1000;
  const safePotNum = typeof potNum === 'number' && !isNaN(potNum) ? potNum : 1000;

  // Percentage values for Entwicklungsrate & Rangbonus
  const rawDevRate = typeof developmentRate === 'number' && !isNaN(developmentRate)
    ? developmentRate
    : (typeof developmentRate === 'string' ? parseFloat(developmentRate) || 1.0 : 1.0);
  const devRatePercent = Math.round((!isNaN(rawDevRate) ? rawDevRate : 1.0) * 100);

  const rawRankBonus = typeof rankGrowthBonus === 'number' && !isNaN(rankGrowthBonus)
    ? rankGrowthBonus
    : (typeof rankGrowthBonus === 'string' ? parseFloat(rankGrowthBonus) || 25 : 25);
  const rankBonusValue = !isNaN(rawRankBonus) ? rawRankBonus : 25;

  // Level bis Rangaufstieg calculation
  const levelsUntilRankUp = Math.max(0, currentLevelsPerRank - (((safeLevel - 1) % currentLevelsPerRank) + 1));

  // Parameter List: Standard parameters are always included, plus any custom parameters
  const parameterList = useMemo(() => {
    const keys = new Set<string>(STANDARD_PARAMETERS);
    if (worldPowerSettings && typeof worldPowerSettings === 'object') {
      Object.keys(worldPowerSettings).forEach(k => keys.add(k));
    }
    if (characterPowerData && typeof characterPowerData === 'object') {
      Object.keys(characterPowerData).forEach(k => keys.add(k));
    }
    return Array.from(keys);
  }, [worldPowerSettings, characterPowerData]);

  // Base growth per parameter from config
  const rawBaseGrowth = effectiveConfig.attributeProgression?.baseGrowthPerLevel;
  const baseGrowthPerParam = typeof rawBaseGrowth === 'number' && !isNaN(rawBaseGrowth) && rawBaseGrowth > 0
    ? rawBaseGrowth
    : 2;

  // Total Budget pro Level
  const defaultBudget = parameterList.length * baseGrowthPerParam;
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
    const updatedPowerData: Record<string, { value: number; potentialMax: number }> = {};

    parameterList.forEach(paramName => {
      const existing = currentData[paramName];
      if (existing !== undefined && existing !== null) {
        if (typeof existing === 'number') {
          updatedPowerData[paramName] = {
            value: !isNaN(existing) ? existing : (baseParams[paramName] ?? 10),
            potentialMax: 1000
          };
          needsUpdate = true;
        } else if (typeof existing === 'object') {
          const val = typeof existing.value === 'number' && !isNaN(existing.value)
            ? existing.value
            : (baseParams[paramName] ?? 10);
          const pMax = typeof existing.potentialMax === 'number' && !isNaN(existing.potentialMax)
            ? existing.potentialMax
            : 1000;
          updatedPowerData[paramName] = { value: val, potentialMax: pMax };
        }
      } else {
        const startVal = typeof baseParams[paramName] === 'number' && !isNaN(baseParams[paramName])
          ? baseParams[paramName]
          : 10;
        updatedPowerData[paramName] = { value: startVal, potentialMax: 1000 };
        needsUpdate = true;
      }
    });

    if (needsUpdate || Object.keys(currentData).length === 0) {
      onCharacterPowerDataChange(updatedPowerData);
    }
  }, [characterPowerData, parameterList, baseParams, onCharacterPowerDataChange]);

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
            <input
              type="number"
              min={1}
              value={safePotNum}
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

        {/* Entwicklungsprofil, Entwicklungsrate & Rangbonus */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Entwicklungsprofil</span>
            </label>
            <select
              value={activeProfileKey}
              onChange={e => onDevelopmentProfileChange?.(e.target.value as DevelopmentProfileType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
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
                step={5}
                min={0}
                max={500}
                value={rankBonusValue}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onRankGrowthBonusChange?.(val);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-300 font-mono font-bold shrink-0">+{rankBonusValue} %</span>
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
            <span>
              {xpNeeded > safeXp ? `Noch ${xpNeeded - safeXp} EP bis Stufe ${safeLevel + 1}` : 'Stufe aufstiegsbereit'}
            </span>
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
          developmentPointsPerLevel={currentBudget}
          onDevelopmentPointsPerLevelChange={onDevelopmentPointsPerLevelChange}
          parameterGrowthPoints={parameterGrowthPoints}
          onParameterGrowthPointsChange={onParameterGrowthPointsChange}
          parameterGrowthFactors={parameterGrowthFactors}
          onParameterGrowthFactorsChange={onParameterGrowthFactorsChange}
          baseGrowthPerParam={baseGrowthPerParam}
        />
      </div>
    </div>
  );
};

export default CharacterRaceAndStatsSection;
