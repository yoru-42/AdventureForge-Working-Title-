// -*- coding: utf-8 -*-
import React, { useMemo, useState } from 'react';
import { WorldSetting, CampaignPowerParameter } from '../types';
import { calculateRpgCharacterStats, CharacterPowerData } from '../services/rpgStatService';
import { ProgressionService } from '../services/progressionService';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';

export interface RpgStatusWindowProps {
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  campaignPowerLevels?: CharacterPowerData;
  onChangeCampaignPowerLevels?: (newLevels: CharacterPowerData) => void;
  readOnly?: boolean;
  rank?: string;
  level?: number;
  xp?: number;
  maxXp?: number;
  showStatusHeader?: boolean;
  baseParameters?: Record<string, number>;
  characterPotential?: number;
  developmentPointsPerLevel?: number;
  onDevelopmentPointsPerLevelChange?: (budget: number) => void;
  parameterGrowthPoints?: Record<string, number>;
  onParameterGrowthPointsChange?: (points: Record<string, number>) => void;
  parameterGrowthFactors?: Record<string, number>;
  onParameterGrowthFactorsChange?: (factors: Record<string, number>) => void;
  baseGrowthPerParam?: number;
}

export const RpgStatusWindow: React.FC<RpgStatusWindowProps> = ({
  world,
  worldPowerSettings,
  campaignPowerLevels = {},
  onChangeCampaignPowerLevels,
  readOnly = false,
  rank,
  level,
  xp,
  maxXp,
  showStatusHeader = false,
  baseParameters = {},
  characterPotential,
  developmentPointsPerLevel,
  onDevelopmentPointsPerLevelChange,
  parameterGrowthPoints = {},
  onParameterGrowthPointsChange,
  parameterGrowthFactors = {},
  onParameterGrowthFactorsChange,
  baseGrowthPerParam = 2
}) => {
  const { categories, globalSettings, combatProperties, hpResource, powerSources, resources } =
    calculateRpgCharacterStats(campaignPowerLevels, world, worldPowerSettings);

  const safeBaseGrowth = typeof baseGrowthPerParam === 'number' && !isNaN(baseGrowthPerParam) && baseGrowthPerParam > 0
    ? baseGrowthPerParam
    : 2;

  // Development Budget Calculations
  const defaultBudget = categories.length * safeBaseGrowth;
  const rawBudget = typeof developmentPointsPerLevel === 'number' && !isNaN(developmentPointsPerLevel)
    ? developmentPointsPerLevel
    : defaultBudget;
  const currentBudget = typeof rawBudget === 'number' && !isNaN(rawBudget) && rawBudget >= 0 ? rawBudget : defaultBudget;

  const allocatedPoints: Record<string, number> = useMemo(() => {
    const result: Record<string, number> = {};
    categories.forEach(paramName => {
      const pPoints = parameterGrowthPoints?.[paramName];
      const pFactors = parameterGrowthFactors?.[paramName];
      if (typeof pPoints === 'number' && !isNaN(pPoints)) {
        result[paramName] = Math.max(0, pPoints);
      } else if (typeof pFactors === 'number' && !isNaN(pFactors)) {
        result[paramName] = Math.max(0, Math.round(pFactors * safeBaseGrowth));
      } else {
        result[paramName] = safeBaseGrowth;
      }
    });
    return result;
  }, [categories, parameterGrowthPoints, parameterGrowthFactors, safeBaseGrowth]);

  const totalSpent = useMemo(() => {
    return Object.values(allocatedPoints).reduce((sum, val) => sum + (typeof val === 'number' && !isNaN(val) ? val : 0), 0);
  }, [allocatedPoints]);

  const remainingBudget = currentBudget - totalSpent;

  const handlePointChange = (paramName: string, delta: number) => {
    if (readOnly) return;
    const current = allocatedPoints[paramName] ?? safeBaseGrowth;
    const nextVal = current + delta;
    if (nextVal < 0) return;

    if (delta > 0 && remainingBudget < delta) {
      return;
    }

    const nextPoints = { ...allocatedPoints, [paramName]: nextVal };
    onParameterGrowthPointsChange?.(nextPoints);

    const nextFactors: Record<string, number> = { ...(parameterGrowthFactors || {}) };
    categories.forEach(p => {
      const pts = nextPoints[p] ?? safeBaseGrowth;
      nextFactors[p] = safeBaseGrowth > 0 ? pts / safeBaseGrowth : 1.0;
    });
    onParameterGrowthFactorsChange?.(nextFactors);
  };

  const handleResetToEvenBudget = () => {
    if (readOnly) return;
    const count = categories.length;
    if (count === 0) return;

    const basePerItem = Math.floor(currentBudget / count);
    const remainder = currentBudget % count;

    const nextPoints: Record<string, number> = {};
    const nextFactors: Record<string, number> = {};

    categories.forEach((p, idx) => {
      const pts = basePerItem + (idx < remainder ? 1 : 0);
      nextPoints[p] = pts;
      nextFactors[p] = safeBaseGrowth > 0 ? pts / safeBaseGrowth : 1.0;
    });

    onParameterGrowthPointsChange?.(nextPoints);
    onParameterGrowthFactorsChange?.(nextFactors);
  };

  const handleParameterUpdate = (cat: string, newCharVal?: number, newPotMax?: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const current = campaignPowerLevels[cat];
    const sMin = 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 100000;

    const currentVal = typeof current === 'object' && current !== null && typeof current.value === 'number'
      ? current.value
      : (typeof current === 'number' ? current : 10);

    const currentPot = typeof current === 'object' && current !== null && typeof current.potentialMax === 'number'
      ? current.potentialMax
      : (characterPotential || globalSettings[cat]?.max || 1000);

    const finalVal = newCharVal !== undefined ? Math.max(sMin, Math.min(sMax, isNaN(newCharVal) ? sMin : newCharVal)) : currentVal;
    const finalPot = newPotMax !== undefined ? Math.max(finalVal, isNaN(newPotMax) ? finalVal : newPotMax) : currentPot;

    const updated = typeof current === 'object' && current !== null
      ? { ...current, value: finalVal, potentialMax: finalPot }
      : { value: finalVal, potentialMax: finalPot };

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [cat]: updated
    });
  };

  const handleResourceUpdate = (resId: string, resName: string, newVal: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const targetKey = resId || resName;
    const current = campaignPowerLevels[targetKey] || campaignPowerLevels[resName];
    const safeVal = Math.max(0, newVal);

    const updated = typeof current === 'object' && current !== null
      ? { ...current, value: safeVal }
      : { value: safeVal };

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [targetKey]: updated
    });
  };

  const hasProgressionControls = Boolean(onParameterGrowthPointsChange || onParameterGrowthFactorsChange);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-4 shadow-xl">
      {/* Optional Top Status Header Bar */}
      {showStatusHeader && (
        <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-4">
            {rank && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">RANG</span>
                <span className="font-bold text-amber-400">{rank}</span>
              </div>
            )}
            {level !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">LEVEL</span>
                <span className="font-bold text-slate-200">{level}</span>
              </div>
            )}
          </div>
          {xp !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">EP</span>
              <span className="font-bold text-amber-300">
                {xp} <span className="text-slate-600 font-normal">/ {maxXp || 100}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2 Spalten: KAMPFEIGENSCHAFTEN & PARAMETER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Spalte 1: KAMPFEIGENSCHAFTEN */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>KAMPFEIGENSCHAFTEN</span>
            </span>
          </div>

          <div className="space-y-2">
            {/* Dynamische Kampfeigenschafts-Ressourcen (HP, MP, SP) */}
            {resources.map(res => {
              const resPercent = res.max > 0 ? Math.min(100, Math.max(0, Math.round((res.value / res.max) * 100))) : 100;
              const isHp = res.id.toLowerCase().includes('hp') || res.name.toLowerCase().includes('gesundheit');
              const isMp = res.id.toLowerCase().includes('mp') || res.name.toLowerCase().includes('mana') || res.name.toLowerCase().includes('magie');
              const barColor = isHp
                ? 'from-emerald-600 to-emerald-400'
                : isMp
                ? 'from-cyan-600 to-cyan-400'
                : 'from-amber-600 to-amber-400';

              return (
                <div
                  key={`res-row-${res.id}`}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 font-mono"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{res.name}</span>
                    <div className="flex items-center gap-2">
                      {!readOnly && (
                        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleResourceUpdate(res.id, res.name, res.value - 1)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                            title={`${res.name} verringern (-1)`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResourceUpdate(res.id, res.name, res.value + 1)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                            title={`${res.name} erhöhen (+1)`}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <span className="font-bold text-slate-100">
                        <span className={isHp ? 'text-emerald-300' : isMp ? 'text-cyan-300' : 'text-amber-300'}>
                          {res.value}
                        </span>
                        <span className="text-slate-500 font-normal"> / {res.max}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                    <div
                      className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${resPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Abgeleitete Kampfeigenschaften */}
            <div className="space-y-1 pt-1">
              {combatProperties.map(prop => (
                <div
                  key={`prop-${prop.id}`}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-950/60 transition-colors font-mono text-xs border border-transparent hover:border-slate-800/50"
                >
                  <div className="flex items-center gap-1.5 text-slate-300 truncate pr-2">
                    <span className="truncate">{prop.label}</span>
                    {prop.sources && prop.sources.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-sans truncate">
                        ({prop.sources.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-amber-300 font-bold text-xs shrink-0 flex items-center gap-1">
                    <span>{prop.value}{prop.isPercentage ? '%' : ''}</span>
                    <span className="text-slate-600 font-normal text-[10px]">
                      / {prop.isPercentage ? '100%' : (prop.potentialMax || 1000)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spalte 2: PARAMETER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              PARAMETER
            </span>
            <span className="text-[10px] font-mono text-slate-500">Charakter-Grundwerte</span>
          </div>

          {/* Parameter-Liste: Stärke 42 / 780 ▲ +2,40 */}
          <div className="space-y-1 font-mono text-xs pt-1">
            {categories.map(cat => {
              const baseVal = typeof baseParameters[cat] === 'number' && !isNaN(baseParameters[cat])
                ? baseParameters[cat]
                : (globalSettings[cat]?.min && globalSettings[cat].min > 0 ? globalSettings[cat].min : 10);

              const rawEntry = campaignPowerLevels[cat];
              const rawVal = typeof rawEntry === 'number'
                ? rawEntry
                : (rawEntry && typeof rawEntry === 'object' && typeof rawEntry.value === 'number' ? rawEntry.value : undefined);

              const rawPotMax = typeof rawEntry === 'object' && rawEntry !== null && typeof rawEntry.potentialMax === 'number'
                ? rawEntry.potentialMax
                : undefined;

              const charVal = rawVal !== undefined && !isNaN(rawVal) ? rawVal : baseVal;
              const charPotMax = rawPotMax !== undefined && !isNaN(rawPotMax)
                ? rawPotMax
                : (characterPotential || globalSettings[cat]?.max || 1000);

              const paramSetting = world?.campaignPowerSettings?.[cat];
              const paramGrowthFactor = typeof paramSetting === 'object' && paramSetting !== null && 'growthFactor' in paramSetting && typeof (paramSetting as any).growthFactor === 'number'
                ? (paramSetting as any).growthFactor
                : undefined;

              // Berechne Entwicklungszuwachs pro Level
              const growthPerLevel = ProgressionService.calculateParameterGrowth({
                parameterName: cat,
                currentValue: charVal,
                baseGrowth: safeBaseGrowth,
                parameterGrowthFactors,
                parameterGrowthPoints: allocatedPoints,
                raceGrowthFactors: paramGrowthFactor !== undefined ? { [cat]: paramGrowthFactor } : undefined,
                potential: characterPotential,
                developmentRateMultiplier: 1.0,
                profileMultiplier: 1.0,
                rankGrowthMultiplier: 1.0,
                isRankUp: false,
                usePotentialForGrowth: true
              });

              const growthFormatted = growthPerLevel.toFixed(2).replace('.', ',');

              return (
                <div
                  key={`param-row-${cat}`}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-950/60 transition-colors font-mono text-xs border border-transparent hover:border-slate-800/50"
                >
                  {/* Parameter Name */}
                  <div className="flex-1 min-w-[90px] truncate pr-2">
                    <span className="font-bold text-slate-200 truncate" title={cat}>
                      {cat}
                    </span>
                  </div>

                  {/* Aktueller Wert / Individueller Maximalwert & Pfeilbuttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {!readOnly && (
                      <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleParameterUpdate(cat, charVal - 1)}
                          className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                          title={`${cat} verringern (-1)`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleParameterUpdate(cat, charVal + 1)}
                          className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                          title={`${cat} erhöhen (+1)`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-amber-300 font-bold text-xs shrink-0 flex items-center gap-1 min-w-[55px] justify-end">
                      <span>{charVal}</span>
                      <span className="text-slate-600 font-normal text-[10px]">
                        / {charPotMax}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RpgStatusWindow;
