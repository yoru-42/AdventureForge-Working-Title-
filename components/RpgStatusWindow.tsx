// -*- coding: utf-8 -*-
import React, { useMemo } from 'react';
import { WorldSetting, CampaignPowerParameter } from '../types';
import { calculateRpgCharacterStats, CharacterPowerData } from '../services/rpgStatService';
import { Plus, Minus, RotateCcw } from 'lucide-react';

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
  developmentPointsPerLevel,
  onDevelopmentPointsPerLevelChange,
  parameterGrowthPoints = {},
  onParameterGrowthPointsChange,
  parameterGrowthFactors = {},
  onParameterGrowthFactorsChange,
  baseGrowthPerParam = 2
}) => {
  const { categories, globalSettings, combatProperties, resources } =
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

  const handlePointDirectInput = (paramName: string, value: number) => {
    if (readOnly) return;
    const validVal = isNaN(value) ? 0 : Math.max(0, value);
    const nextPoints = { ...allocatedPoints, [paramName]: validVal };
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

  const handleParameterUpdate = (cat: string, field: 'value' | 'potentialMax', val: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const sMin = globalSettings[cat]?.scaleMin ?? 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 10000;
    const clampedVal = Math.max(sMin, Math.min(sMax, isNaN(val) ? sMin : val));

    const current = campaignPowerLevels[cat] || {
      value: baseParameters[cat] ?? globalSettings[cat]?.min ?? 10,
      potentialMax: globalSettings[cat]?.max ?? 1000
    };

    let updated = { ...current };
    if (field === 'value') {
      updated.value = clampedVal;
      if (updated.value > updated.potentialMax) {
        updated.potentialMax = updated.value;
      }
    } else {
      updated.potentialMax = clampedVal;
    }

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [cat]: updated
    });
  };

  const hasProgressionControls = Boolean(onParameterGrowthPointsChange || onParameterGrowthFactorsChange);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-xl">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Spalte 1: KAMPFEIGENSCHAFTEN */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>KAMPFEIGENSCHAFTEN</span>
          </div>

          <div className="space-y-2">
            {/* Dynamische Ressourcen (HP, MP etc.) */}
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
                  className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 space-y-1.5 font-mono"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{res.name}</span>
                    <span className="font-bold text-slate-100">
                      <span className={isHp ? 'text-emerald-300' : isMp ? 'text-cyan-300' : 'text-amber-300'}>
                        {res.value}
                      </span>
                      <span className="text-slate-500 font-normal"> / {res.max}</span>
                    </span>
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
                  <div className="text-amber-300 font-bold text-xs shrink-0">
                    {prop.value}
                    {prop.isPercentage ? '%' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spalte 2: PARAMETER (RPG-Charakterstatus-Layout) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          {/* Header mit RPG-Status & Budget */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              PARAMETER
            </span>
            {hasProgressionControls && !readOnly && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-amber-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {currentBudget} Pkt.
                </span>
                <span className={`px-1.5 py-0.5 rounded font-bold border ${
                  remainingBudget === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : remainingBudget > 0
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {totalSpent}/{currentBudget}
                </span>
                <button
                  type="button"
                  onClick={handleResetToEvenBudget}
                  title="Gleichmäßig verteilen"
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline text-[9px]">Gleich</span>
                </button>
              </div>
            )}
          </div>

          {/* Parameter-Liste als RPG-Status */}
          <div className="space-y-1.5 font-mono text-xs max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => {
              const baseVal = typeof baseParameters[cat] === 'number' && !isNaN(baseParameters[cat])
                ? baseParameters[cat]
                : (globalSettings[cat]?.min ?? 10);
              const charVal = typeof campaignPowerLevels[cat]?.value === 'number' && !isNaN(campaignPowerLevels[cat].value)
                ? campaignPowerLevels[cat].value
                : baseVal;
              const charMax = typeof campaignPowerLevels[cat]?.potentialMax === 'number' && !isNaN(campaignPowerLevels[cat].potentialMax)
                ? campaignPowerLevels[cat].potentialMax
                : (globalSettings[cat]?.max ?? 1000);

              const allocated = allocatedPoints[cat] ?? safeBaseGrowth;
              const ratioPercent = charMax > 0 ? Math.min(100, Math.max(0, Math.round((charVal / charMax) * 100))) : 0;

              return (
                <div
                  key={`param-row-${cat}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  {/* Parameter Name & Mini Fortschrittsbalken */}
                  <div className="flex-1 min-w-[100px] space-y-1">
                    <span className="font-bold text-slate-200 block truncate" title={cat}>
                      {cat}
                    </span>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${ratioPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Aktueller Wert & Persönliches Potenzial */}
                  <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                    {!readOnly && onChangeCampaignPowerLevels ? (
                      <input
                        type="number"
                        min={0}
                        value={charVal}
                        onChange={e => handleParameterUpdate(cat, 'value', parseInt(e.target.value) || 0)}
                        title="Aktueller Wert"
                        className="w-12 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded px-1 py-0.5 text-center font-bold text-amber-300 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-amber-300 text-xs px-1">{charVal}</span>
                    )}

                    <span className="text-slate-600 font-bold">/</span>

                    {!readOnly && onChangeCampaignPowerLevels ? (
                      <input
                        type="number"
                        min={0}
                        value={charMax}
                        onChange={e => handleParameterUpdate(cat, 'potentialMax', parseInt(e.target.value) || 0)}
                        title="Persönliches Potenzial / Maximum"
                        className="w-14 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded px-1 py-0.5 text-center text-slate-400 hover:text-slate-200 text-xs"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs px-1">{charMax}</span>
                    )}
                  </div>

                  {/* Geplante Entwicklung pro Level mit Stepper */}
                  <div className="flex items-center justify-end shrink-0 pl-1">
                    {hasProgressionControls && !readOnly ? (
                      <div className="inline-flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-md p-0.5">
                        <button
                          type="button"
                          disabled={allocated <= 0}
                          onClick={() => handlePointChange(cat, -1)}
                          title="Punkt verringern"
                          className="w-4 h-5 rounded bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <div className="flex items-center px-1 font-mono font-bold text-amber-400 text-[11px]">
                          <span className="text-amber-500/80 mr-0.5 text-[10px]">▲</span>
                          <span>+{allocated}</span>
                        </div>
                        <button
                          type="button"
                          disabled={remainingBudget <= 0}
                          onClick={() => handlePointChange(cat, 1)}
                          title="Punkt erhöhen"
                          className="w-4 h-5 rounded bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-bold text-xs font-mono px-1">
                        ▲ +{allocated}
                      </span>
                    )}
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
