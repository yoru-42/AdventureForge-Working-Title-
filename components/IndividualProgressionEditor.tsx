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
  const currentRank = values.rank || 'F';
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

  // Multipliers
  const epGainMult = values.developmentRate?.epGainMultiplier ?? 1.0;
  const attrGrowthMult = values.developmentRate?.attributeGrowthMultiplier ?? 1.0;

  // Calculated requirement from global rule
  const calculatedXpRequirement = ProgressionService.calculateXpRequirement(
    currentLevel,
    currentRank,
    worldProgressionConfig
  );

  // Rank & Level settings
  const currentLevelsPerRank = values.levelsPerRank ?? 10;
  const currentResetLevelOnRankUp = values.resetLevelOnRankUp ?? true;
  const currentAutoRankUp = values.autoRankUp ?? true;
  const currentMinXpForRankUp = values.minXpForRankUp ?? 0;
  const currentRequiresMaxLevel = values.requiresMaxLevelForRankUp ?? true;
  const currentRankUpReq = values.rankUpRequirements || '';

  // Attribute Growth & Potential
  const baseAttrGrowth = values.attributeGrowth?.baseGrowthPerLevel ?? 2;
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
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* 1. Kompaktes RPG Status-Feld Oben (RANG / LEVEL / EP) */}
      {isEpLogic && (
        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center font-mono">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                RANG
              </span>
              <select
                value={currentRank}
                onChange={e => onChange({ rank: e.target.value as CharacterRank })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
              >
                {STANDARD_RANKS.map(r => (
                  <option key={`rank-opt-${r}`} value={r}>
                    Rang {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                LEVEL
              </span>
              <input
                type="number"
                min={1}
                max={999}
                value={currentLevel}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onChange({ level: val });
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                EP
              </span>
              <input
                type="number"
                min={0}
                value={currentXp}
                onChange={e => handleXpChange(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                NÄCHSTER LEVEL
              </span>
              <div className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-bold">
                {calculatedXpRequirement || 100} EP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RPG Status-Fenster (Wiederverwendbare zentralisierte Komponente) */}
      <RpgStatusWindow
        world={world}
        worldPowerSettings={worldPowerSettings || world?.campaignPowerSettings}
        campaignPowerLevels={powerLevels}
        onChangeCampaignPowerLevels={handlePowerLevelsChange}
      />

      {/* 3. PROGRESSION (Kompakte persönliche Entwicklung) */}
      <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1">
          PROGRESSION
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* EP-Gewinn */}
          {isEpLogic && (
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400 font-medium">EP-Gewinn</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={10.0}
                  value={epGainMult}
                  onChange={e => handleEpGainMultChange(parseFloat(e.target.value) || 1.0)}
                  className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-bold outline-none focus:border-amber-500"
                />
                <div className="flex gap-0.5">
                  {[0.5, 1.0, 1.5, 2.0].map(mult => (
                    <button
                      key={`mult-${mult}`}
                      type="button"
                      onClick={() => handleEpGainMultChange(mult)}
                      className={`px-1.5 py-1 text-[9px] font-bold rounded border transition-all ${
                        Math.abs(epGainMult - mult) < 0.01
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mult}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wertsteigerung */}
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-medium">Wertsteigerung</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={attrGrowthMult}
                onChange={e => handleAttrGrowthMultChange(parseFloat(e.target.value) || 1.0)}
                className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-bold outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">Multiplikator</span>
            </div>
          </div>

          {/* Potenzial */}
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-medium">Potenzial-Cap</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                value={potCapVal}
                onChange={e => handlePotentialCapChange(parseInt(e.target.value) || 1000)}
                className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-bold outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handlePotentialEnforcementChange(!enforcePotCap)}
                className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                  enforcePotCap
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {enforcePotCap ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
          </div>

          {/* Einstufung */}
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-medium">Potenzial-Einstufung</span>
            <input
              type="text"
              value={potentialText}
              onChange={e => onChange({ potential: e.target.value })}
              placeholder="z.B. Rang A"
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Rangaufstieg (bei EP-Logik) */}
        {isEpLogic && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Auto-Aufstieg:</span>
                <button
                  type="button"
                  onClick={() => onChange({ autoRankUp: !currentAutoRankUp })}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                    currentAutoRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {currentAutoRankUp ? 'Automatisch' : 'Manuell'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Level bei Aufstieg:</span>
                <button
                  type="button"
                  onClick={() => onChange({ resetLevelOnRankUp: !currentResetLevelOnRankUp })}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                    currentResetLevelOnRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {currentResetLevelOnRankUp ? 'Reset auf 1' : 'Level behalten'}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Rangbedingungen
              </span>
              <AutoExpandingTextarea
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs outline-none focus:border-amber-500"
                placeholder="Optionale Prüfungsnotizen oder Aufstiegsbedingungen..."
                value={currentRankUpReq}
                onChange={e => onChange({ rankUpRequirements: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualProgressionEditor;
