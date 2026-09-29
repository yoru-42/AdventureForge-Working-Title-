// -*- coding: utf-8 -*-
import React from 'react';
import { CharacterRank, ProgressionConfig, WorldSetting, CampaignPowerParameter } from '../types';
import { STANDARD_RANKS, ProgressionService } from '../services/progressionService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { calculateDerivedCombatProperties } from './RpgStatusWindow';

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
    values.campaignPowerData ||
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

  // Derived Combat Properties & Parameters
  const derivedData = calculateDerivedCombatProperties(powerLevels, world, worldPowerSettings);

  const handleParameterChange = (cat: string, field: 'value' | 'potentialMax', val: number) => {
    const sMin = derivedData.globalSettings[cat]?.scaleMin ?? 0;
    const sMax = derivedData.globalSettings[cat]?.scaleMax ?? 1000;
    const clampedVal = Math.max(sMin, Math.min(sMax, val));

    const current = powerLevels[cat] || {
      value: derivedData.globalSettings[cat]?.min ?? 10,
      potentialMax: derivedData.globalSettings[cat]?.max ?? 100
    };

    let updated = { ...current };
    if (field === 'value') {
      updated.value = clampedVal;
      if (updated.value > updated.potentialMax) {
        updated.potentialMax = updated.value;
      }
    } else {
      updated.potentialMax = clampedVal;
      if (updated.potentialMax < updated.value) {
        updated.value = updated.potentialMax;
      }
    }

    const newPowerLevels = {
      ...powerLevels,
      [cat]: updated
    };

    if (onChangeCampaignPowerLevels) {
      onChangeCampaignPowerLevels(newPowerLevels);
    }
    onChange({
      campaignPowerLevels: newPowerLevels
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Kompakte Entwicklungs-Statuszeile (bei EP-Logik) */}
      {isEpLogic && (
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Rang
              </label>
              <select
                value={currentRank}
                onChange={e => onChange({ rank: e.target.value as CharacterRank })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
              >
                {STANDARD_RANKS.map(r => (
                  <option key={`rank-opt-${r}`} value={r}>
                    Rang {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Level
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={currentLevel}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onChange({ level: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Aktuelle EP
              </label>
              <input
                type="number"
                min={0}
                value={currentXp}
                onChange={e => handleXpChange(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 shadow-inner font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Nächster Level
              </label>
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold shadow-inner flex items-center justify-between">
                <span>{calculatedXpRequirement || 100} EP</span>
                <span className="text-[9px] text-slate-500 font-normal">Welt-Regel</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RPG-Statusanzeige: Kampfeigenschaften & Parameter */}
      {derivedData.categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Spalte 1: Kampfeigenschaften */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between">
              <span>Kampfeigenschaften</span>
              <span className="text-slate-500 font-normal">Abgeleitet aus Parametern</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {derivedData.combatProperties.map(prop => (
                <div
                  key={`prop-${prop.id}`}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-950/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-slate-300 truncate pr-2">
                    <span className="truncate">{prop.label}</span>
                    {prop.sources && prop.sources.length > 0 && (
                      <span className="text-[9px] text-slate-500 font-sans truncate">
                        ({prop.sources.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-amber-300 font-bold text-xs shrink-0">
                    {prop.value}
                    {prop.isPercentage ? '%' : ''}
                    <span className="text-slate-600 text-[10px] font-normal ml-1">
                      / {prop.potentialMax}{prop.isPercentage ? '%' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ressourcen (HP, MP etc.) */}
            {derivedData.resources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  Ressourcen
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  {derivedData.resources.map(res => (
                    <div
                      key={`res-row-${res.id}`}
                      className="flex items-center justify-between py-1 px-2 rounded bg-slate-950/50 border border-slate-800/50"
                    >
                      <span className="text-slate-200 font-bold">{res.name}</span>
                      <div className="text-emerald-300 font-bold">
                        {res.value} <span className="text-slate-500 font-normal">/ {res.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spalte 2: Parameter */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between">
              <span>Parameter</span>
              <span className="text-slate-500 font-normal">Editierbare Grundwerte</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {derivedData.categories.map(cat => {
                const sMin = derivedData.globalSettings[cat]?.scaleMin ?? 0;
                const sMax = derivedData.globalSettings[cat]?.scaleMax ?? 1000;
                const charVal = powerLevels[cat]?.value ?? derivedData.globalSettings[cat]?.min ?? 10;
                const charMax = powerLevels[cat]?.potentialMax ?? derivedData.globalSettings[cat]?.max ?? 100;

                return (
                  <div
                    key={`param-row-${cat}`}
                    className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">{cat}</span>
                      <span className="text-slate-400 text-[11px]">
                        <span className="text-amber-400 font-bold">{charVal}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-emerald-400 font-bold">{charMax}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>Aktuell</span>
                          <input
                            type="number"
                            min={sMin}
                            max={sMax}
                            value={charVal}
                            onChange={e =>
                              handleParameterChange(cat, 'value', parseInt(e.target.value) || sMin)
                            }
                            className="w-12 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-amber-300 text-right font-mono font-bold"
                          />
                        </div>
                        <input
                          type="range"
                          min={sMin}
                          max={sMax}
                          value={charVal}
                          onChange={e =>
                            handleParameterChange(cat, 'value', parseInt(e.target.value) || sMin)
                          }
                          className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>Potenzial</span>
                          <input
                            type="number"
                            min={sMin}
                            max={sMax}
                            value={charMax}
                            onChange={e =>
                              handleParameterChange(cat, 'potentialMax', parseInt(e.target.value) || sMax)
                            }
                            className="w-12 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-emerald-300 text-right font-mono font-bold"
                          />
                        </div>
                        <input
                          type="range"
                          min={sMin}
                          max={sMax}
                          value={charMax}
                          onChange={e =>
                            handleParameterChange(cat, 'potentialMax', parseInt(e.target.value) || sMax)
                          }
                          className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Persönliche Entwicklung */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Persönliche Entwicklung
          </h4>
        </div>

        {/* EP-Gewinn (NUR bei EP-Logik) */}
        {isEpLogic && (
          <div className="space-y-2 pb-3 border-b border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">
                EP-Gewinn-Multiplikator
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0.5, 1.0, 1.25, 1.5, 2.0].map(mult => {
                  const isMatch = Math.abs(epGainMult - mult) < 0.01;
                  return (
                    <button
                      key={`ep-mult-${mult}`}
                      type="button"
                      onClick={() => handleEpGainMultChange(mult)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mult.toFixed(2)}×
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="max-w-xs">
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={epGainMult}
                onChange={e => handleEpGainMultChange(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Werte-/Attributsteigerung */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Werte-/Attributsteigerung
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Basissteigerung / Level
              </span>
              <input
                type="number"
                min={0}
                value={baseAttrGrowth}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: val,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Wachstums-Multiplikator
              </span>
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={attrGrowthMult}
                onChange={e => handleAttrGrowthMultChange(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Minimaler Wert
              </span>
              <input
                type="number"
                min={0}
                value={minAttrVal}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: val,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Maximaler Wert
              </span>
              <input
                type="number"
                min={1}
                value={maxAttrVal}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1000);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: val,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Potenzial */}
        <div className="pt-3 border-t border-slate-800/60 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Potenzial
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Potenzialgrenze
              </span>
              <input
                type="number"
                min={1}
                value={potCapVal}
                onChange={e => handlePotentialCapChange(parseInt(e.target.value) || 1000)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Potenzial begrenzt Werte
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePotentialEnforcementChange(true)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    enforcePotCap
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => handlePotentialEnforcementChange(false)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    !enforcePotCap
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nein
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Einstufung / Beschreibung
              </span>
              <input
                type="text"
                value={potentialText}
                onChange={e => onChange({ potential: e.target.value })}
                placeholder="z.B. Rang A (Hoch)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Rangentwicklung (NUR bei EP-basierten Regeln) */}
      {isEpLogic && (
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Rangentwicklung
            </h4>
          </div>

          {/* Rangfolge Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
            {STANDARD_RANKS.map((r, idx) => {
              const isCharRank = String(currentRank).toUpperCase() === r;
              return (
                <React.Fragment key={`char-rank-bar-${r}`}>
                  <button
                    type="button"
                    onClick={() => onChange({ rank: r })}
                    className={`w-7 h-7 rounded border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isCharRank
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    {r}
                  </button>
                  {idx < STANDARD_RANKS.length - 1 && (
                    <span className="text-slate-600 text-[10px] font-bold select-none">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Level pro Rang
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={currentLevelsPerRank}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 10);
                  onChange({ levelsPerRank: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Auto-Aufstieg
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ autoRankUp: true })}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    currentAutoRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ autoRankUp: false })}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    !currentAutoRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nein
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Mindest-EP
              </span>
              <input
                type="number"
                min={0}
                value={currentMinXpForRankUp}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onChange({ minXpForRankUp: val });
                }}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-medium mb-1">
                Level bei Aufstieg
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ resetLevelOnRankUp: true })}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    currentResetLevelOnRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ resetLevelOnRankUp: false })}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    !currentResetLevelOnRankUp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Halten
                </button>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentRequiresMaxLevel}
                onChange={e => onChange({ requiresMaxLevelForRankUp: e.target.checked })}
                className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">
                Voraussetzung: Maximales Level des Rangs erforderlich ({currentLevelsPerRank})
              </span>
            </label>
          </div>

          <div>
            <span className="block text-[10px] text-slate-400 font-medium mb-1">
              Rangbedingungen / Prüfungsnotizen
            </span>
            <AutoExpandingTextarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 shadow-inner"
              placeholder="z.B. Erreichen von Level 10 + Bestehen der Abenteurer-Prüfung in der Hauptstadt..."
              value={currentRankUpReq}
              onChange={e => onChange({ rankUpRequirements: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualProgressionEditor;
