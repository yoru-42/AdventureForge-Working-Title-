// -*- coding: utf-8 -*-
import React from 'react';
import { CharacterRank, ProgressionConfig, WorldSetting, CampaignPowerParameter } from '../types';
import { STANDARD_RANKS, ProgressionService } from '../services/progressionService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import RpgStatusWindow from './RpgStatusWindow';

export interface IndividualProgressionValues {
  rank?: CharacterRank | string;
  level?: number;
  xp?: number;
  experience?: number;
  experiencePoints?: number;
  experienceText?: string;
  potential?: number | string;
  potentialCap?: number;
  enforcePotentialCap?: boolean;
  developmentProfile?: any;
  rankUpRequirements?: string;
  levelsPerRank?: number;
  resetLevelOnRankUp?: boolean;
  autoRankUp?: boolean;
  minXpForRankUp?: number;
  requiresMaxLevelForRankUp?: boolean;
  developmentRate?: {
    epGainMultiplier?: number;
    epRequirementMultiplier?: number;
    attributeGrowthMultiplier?: number;
  };
  attributeGrowth?: {
    baseGrowthPerLevel?: number;
    minAttributeValue?: number;
    maxAttributeValue?: number;
    enforcePotentialCap?: boolean;
    potentialCap?: number;
  };
  epRequirement?: {
    requirementMode?: any;
    baseRequirement?: number;
    levelGrowth?: number;
    rankGrowth?: number;
    maxRequirement?: number;
  };
  campaignPowerLevels?: Record<string, { value: number; potentialMax: number }>;
  campaignPowerData?: any;
}

interface IndividualProgressionEditorProps {
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static' | string;
  worldProgressionConfig?: ProgressionConfig;
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  campaignPowerLevels?: Record<string, { value: number; potentialMax: number }>;
  onChangeCampaignPowerLevels?: (newLevels: Record<string, { value: number; potentialMax: number }>) => void;
  values: IndividualProgressionValues;
  onChange: (updated: Partial<IndividualProgressionValues>) => void;
  title?: string;
  subtitle?: string;
}

export const IndividualProgressionEditor: React.FC<IndividualProgressionEditorProps> = ({
  progressionLogic = 'ep',
  worldProgressionConfig,
  world,
  worldPowerSettings,
  campaignPowerLevels: explicitPowerLevels,
  onChangeCampaignPowerLevels,
  values,
  onChange
}) => {
  const isEpLogic = progressionLogic === 'ep';

  // Current values
  const currentRank = values.rank || worldProgressionConfig?.rankSystem?.startRank || 'F';
  const currentLevel = values.level !== undefined ? values.level : 1;
  const currentXp =
    values.experiencePoints !== undefined
      ? values.experiencePoints
      : typeof values.experience === 'number'
      ? values.experience
      : values.xp ?? 0;

  // Power / Parameter levels
  const powerLevels =
    explicitPowerLevels ||
    values.campaignPowerLevels ||
    (typeof values.campaignPowerData === 'object' ? values.campaignPowerData : {}) ||
    {};

  // Multipliers & Progression values from ProgressionService
  const epGainMult =
    values.developmentRate?.epGainMultiplier ??
    worldProgressionConfig?.developmentRate?.epGainMultiplier ??
    1.0;
  const attrGrowthMult =
    values.developmentRate?.attributeGrowthMultiplier ??
    worldProgressionConfig?.developmentRate?.attributeGrowthMultiplier ??
    1.0;

  // Ranks & Next Rank
  const ranks = worldProgressionConfig?.rankSystem?.ranks || STANDARD_RANKS;
  const rankIdx = ProgressionService.getRankIndex(currentRank, worldProgressionConfig);
  const nextRank = rankIdx < ranks.length - 1 ? String(ranks[rankIdx + 1]) : undefined;

  // Levels per rank & Max level of current rank
  const currentLevelsPerRank =
    values.levelsPerRank ?? worldProgressionConfig?.levelSystem?.levelsPerRank ?? 10;
  const currentResetLevelOnRankUp =
    values.resetLevelOnRankUp ?? worldProgressionConfig?.levelSystem?.resetLevelOnRankUp ?? true;

  const maxLevelForCurrentRank = currentResetLevelOnRankUp
    ? currentLevelsPerRank
    : (rankIdx + 1) * currentLevelsPerRank;

  // Calculated requirement from global rule via ProgressionService
  const calculatedXpRequirement = ProgressionService.calculateXpRequirement(
    currentLevel,
    currentRank,
    worldProgressionConfig
  );

  const xpPercent =
    calculatedXpRequirement > 0
      ? Math.min(100, Math.max(0, Math.round((currentXp / calculatedXpRequirement) * 100)))
      : 100;

  // Attribute Growth & Base Growth
  const baseAttrGrowth =
    values.attributeGrowth?.baseGrowthPerLevel ??
    worldProgressionConfig?.attributeProgression?.baseGrowthPerLevel ??
    2;
  const effectiveGrowth = Math.round(baseAttrGrowth * attrGrowthMult * 10) / 10;

  const currentAutoRankUp = values.autoRankUp ?? worldProgressionConfig?.rankSystem?.autoRankUp ?? true;
  const currentRankUpReq = values.rankUpRequirements || '';

  const minAttrVal = values.attributeGrowth?.minAttributeValue ?? 0;
  const maxAttrVal = values.attributeGrowth?.maxAttributeValue ?? 1000;

  const enforcePotCap =
    values.enforcePotentialCap ?? values.attributeGrowth?.enforcePotentialCap ?? true;
  const potCapVal =
    values.potentialCap ??
    values.attributeGrowth?.potentialCap ??
    (typeof values.potential === 'number' ? values.potential : 1000);
  const potentialText =
    typeof values.potential === 'string'
      ? values.potential
      : values.potential !== undefined
      ? String(values.potential)
      : 'Rang A (Hoch)';

  // Single EP Sync Input
  const handleXpChange = (newXpVal: number) => {
    const val = Math.max(0, newXpVal);
    onChange({
      experiencePoints: val,
      experience: val,
      xp: val,
      experienceText: `${val} / ${calculatedXpRequirement || 100} EP`
    });
  };

  // Synchronized Multipliers
  const handleEpGainMultChange = (val: number) => {
    const safeVal = Math.max(0.1, val);
    onChange({
      developmentRate: {
        ...values.developmentRate,
        epGainMultiplier: safeVal,
        attributeGrowthMultiplier: attrGrowthMult
      }
    });
  };

  const handleAttrGrowthMultChange = (val: number) => {
    const safeVal = Math.max(0.1, val);
    onChange({
      developmentRate: {
        ...values.developmentRate,
        epGainMultiplier: epGainMult,
        attributeGrowthMultiplier: safeVal
      }
    });
  };

  // Synchronized Potential
  const handlePotentialCapChange = (val: number) => {
    const safeCap = Math.max(1, val);
    onChange({
      potentialCap: safeCap,
      potential: typeof values.potential === 'string' ? values.potential : safeCap,
      attributeGrowth: {
        baseGrowthPerLevel: baseAttrGrowth,
        minAttributeValue: minAttrVal,
        maxAttributeValue: maxAttrVal,
        enforcePotentialCap: enforcePotCap,
        potentialCap: safeCap
      }
    });
  };

  const handlePotentialEnforcementChange = (enforce: boolean) => {
    onChange({
      enforcePotentialCap: enforce,
      attributeGrowth: {
        baseGrowthPerLevel: baseAttrGrowth,
        minAttributeValue: minAttrVal,
        maxAttributeValue: maxAttrVal,
        enforcePotentialCap: enforce,
        potentialCap: potCapVal
      }
    });
  };

  const handlePowerLevelsChange = (newLevels: Record<string, { value: number; potentialMax: number }>) => {
    if (onChangeCampaignPowerLevels) {
      onChangeCampaignPowerLevels(newLevels);
    }
    onChange({
      campaignPowerLevels: newLevels
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 font-mono">
      {/* 1. PROGRESSION (RPG-Status-Hauptanzeige) */}
      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3.5 shadow-xl">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>PROGRESSION</span>
          <span className="text-[10px] text-slate-500 font-normal normal-case">
            Charakter-Status &amp; Entwicklung
          </span>
        </div>

        {/* Core Status Grid: Rang, Level, EP, Nächster Rang */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 text-xs">
          {/* Rang */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Rang
            </span>
            <select
              value={currentRank}
              onChange={e => onChange({ rank: e.target.value as CharacterRank })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {ranks.map(r => (
                <option key={`rank-opt-${r}`} value={r}>
                  Rang {r}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Level
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="number"
                min={1}
                max={9999}
                value={currentLevel}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onChange({ level: val });
                }}
                className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-600 font-normal">/</span>
              <span className="text-slate-200 font-bold">{maxLevelForCurrentRank}</span>
            </div>
          </div>

          {/* EP */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              EP
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="number"
                min={0}
                value={currentXp}
                onChange={e => handleXpChange(parseInt(e.target.value) || 0)}
                className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-600 font-normal">/</span>
              <span className="text-amber-400 font-bold">{calculatedXpRequirement}</span>
            </div>
          </div>

          {/* Nächster Rang */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Nächster Rang
            </span>
            <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-bold text-emerald-400 inline-block mt-0.5">
              {nextRank ? `Rang ${nextRank}` : 'Maximaler Rang'}
            </div>
          </div>
        </div>

        {/* EP-Fortschrittsbalken */}
        {isEpLogic && (
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Fortschritt zum nächsten Level
              </span>
              <span className="text-xs font-bold text-amber-400">
                {currentXp} / {calculatedXpRequirement} EP ({xpPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Stat-Modifikatoren: EP-Gewinn & Wertsteigerung */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
          {/* EP-Gewinn */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              EP-Gewinn
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-300 font-bold">
                ×{epGainMult.toString().replace('.', ',')}
              </span>
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={epGainMult}
                onChange={e => handleEpGainMultChange(parseFloat(e.target.value) || 1.0)}
                className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 font-bold outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Wertsteigerung */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Wertsteigerung
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">
                +{effectiveGrowth.toString().replace('.', ',')}
              </span>
              {attrGrowthMult !== 1.0 && (
                <span className="text-[10px] text-slate-500">
                  (Basis +{baseAttrGrowth} × {attrGrowthMult})
                </span>
              )}
            </div>
          </div>

          {/* Max Level pro Rang */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Max. Level pro Rang
            </span>
            <input
              type="number"
              min={1}
              value={currentLevelsPerRank}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 10);
                onChange({ levelsPerRank: val });
              }}
              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 font-bold outline-none focus:border-amber-500"
            />
          </div>

          {/* Level Reset bei Rangaufstieg */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Aufstieg-Reset
            </span>
            <button
              type="button"
              onClick={() => onChange({ resetLevelOnRankUp: !currentResetLevelOnRankUp })}
              className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                currentResetLevelOnRankUp
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {currentResetLevelOnRankUp ? 'Reset auf 1' : 'Level behalten'}
            </button>
          </div>
        </div>

        {/* Rangbedingungen & Notizen */}
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <span className="block text-[10px] font-bold text-slate-500 uppercase">
            Rangbedingungen / Notizen
          </span>
          <AutoExpandingTextarea
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs font-mono outline-none focus:border-amber-500"
            placeholder="Optionale Prüfungsnotizen oder Aufstiegsbedingungen..."
            value={currentRankUpReq}
            onChange={e => onChange({ rankUpRequirements: e.target.value })}
          />
        </div>
      </div>

      {/* 2. RPG Status-Fenster (Kampfeigenschaften & Parameter) */}
      <RpgStatusWindow
        world={world}
        worldPowerSettings={worldPowerSettings || world?.campaignPowerSettings}
        campaignPowerLevels={powerLevels}
        onChangeCampaignPowerLevels={handlePowerLevelsChange}
      />
    </div>
  );
};

export default IndividualProgressionEditor;
