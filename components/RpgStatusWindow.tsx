// -*- coding: utf-8 -*-
import React, { useMemo, useState } from 'react';
import { WorldSetting, CampaignPowerParameter } from '../types';
import { calculateRpgCharacterStats, CharacterPowerData } from '../services/rpgStatService';
import { Plus, Minus, RotateCcw, Sliders, Shield, Zap, X } from 'lucide-react';

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
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

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

  const handleParameterUpdate = (cat: string, val: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const current = campaignPowerLevels[cat];
    const sMin = 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 100000;
    const clampedVal = Math.max(sMin, Math.min(sMax, isNaN(val) ? sMin : val));

    const updated = typeof current === 'object' && current !== null
      ? { ...current, value: clampedVal }
      : { value: clampedVal };

    delete (updated as any).potentialMax;

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [cat]: updated
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Spalte 1: KAMPFEIGENSCHAFTEN */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
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

        {/* Spalte 2: PARAMETER (Klare Zahlen ohne Skala-Maximum) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              PARAMETER
            </span>
            <span className="text-[10px] font-mono text-slate-500">Charakter-Grundwerte</span>
          </div>

          {/* Parameter-Liste: Stärke 10 */}
          <div className="space-y-1.5 font-mono text-xs">
            {categories.map(cat => {
              const baseVal = typeof baseParameters[cat] === 'number' && !isNaN(baseParameters[cat])
                ? baseParameters[cat]
                : (globalSettings[cat]?.min && globalSettings[cat].min > 0 ? globalSettings[cat].min : 10);

              const rawEntry = campaignPowerLevels[cat];
              const rawVal = typeof rawEntry === 'number'
                ? rawEntry
                : (rawEntry && typeof rawEntry === 'object' && typeof rawEntry.value === 'number' ? rawEntry.value : undefined);

              const charVal = rawVal !== undefined && !isNaN(rawVal)
                ? rawVal
                : baseVal;

              return (
                <div
                  key={`param-row-${cat}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  {/* Parameter Name */}
                  <div className="flex-1 min-w-[110px]">
                    <span className="font-bold text-slate-200 block truncate" title={cat}>
                      {cat}
                    </span>
                  </div>

                  {/* Aktueller Wert als feste Zahl */}
                  <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                    {!readOnly && onChangeCampaignPowerLevels ? (
                      <input
                        type="number"
                        min={0}
                        value={charVal}
                        onChange={e => handleParameterUpdate(cat, parseInt(e.target.value) || 0)}
                        title="Aktueller Wert"
                        className="w-16 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded px-2 py-0.5 text-center font-bold text-amber-300 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-amber-300 text-xs px-2">{charVal}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Separater Button für Entwicklungspunkte */}
          {hasProgressionControls && !readOnly && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsPointModalOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-lg py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-amber-500/10"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Punkte verteilen</span>
                <span className="bg-slate-950 text-slate-300 font-normal px-2 py-0.5 rounded text-[10px] ml-1">
                  ({totalSpent}/{currentBudget})
                </span>
              </button>
            </div>
          )}
        </div>
      </div>



      {/* COMPACT DIALOG / MODAL FOR ENTWICKLUNGSPUNKTE VERTEILEN */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Entwicklung pro Level verteilen</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between">
              <span className="text-slate-400">Entwicklung pro Level:</span>
              <span className="font-bold text-amber-300 text-sm">{currentBudget} Punkte</span>
            </div>

            {/* Parameter Punkt-Verteilung mit + / - */}
            <div className="space-y-2 font-mono text-xs max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {categories.map(cat => {
                const allocated = allocatedPoints[cat] ?? safeBaseGrowth;
                return (
                  <div
                    key={`modal-param-${cat}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                  >
                    <span className="font-bold text-slate-200">{cat}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={allocated <= 0}
                        onClick={() => handlePointChange(cat, -1)}
                        className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                        title="Punkt entfernen"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-amber-300 text-sm">
                        {allocated}
                      </span>
                      <button
                        type="button"
                        disabled={remainingBudget <= 0}
                        onClick={() => handlePointChange(cat, 1)}
                        className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                        title="Punkt hinzufügen"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Vergeben:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  remainingBudget === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : remainingBudget > 0
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {totalSpent} / {currentBudget}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToEvenBudget}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Gleichmäßig verteilen"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Gleich</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RpgStatusWindow;
