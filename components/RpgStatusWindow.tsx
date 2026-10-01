// -*- coding: utf-8 -*-
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { WorldSetting, CampaignPowerParameter } from '../types';
import { calculateRpgCharacterStats, CharacterPowerData } from '../services/rpgStatService';
import { ProgressionService } from '../services/progressionService';
import { RaceService } from '../services/raceService';
import { Shield, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface HoldButtonProps {
  action: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

const HoldButton: React.FC<HoldButtonProps> = ({
  action,
  disabled = false,
  className = '',
  title,
  children
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const actionRef = useRef(action);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  const stop = useCallback(() => {
    isHoldingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    disabledRef.current = disabled;
    if (disabled && isHoldingRef.current) {
      stop();
    }
  }, [disabled, stop]);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    if (disabledRef.current) return;
    e.preventDefault();
    stop();
    isHoldingRef.current = true;
    actionRef.current();

    timeoutRef.current = setTimeout(() => {
      if (!isHoldingRef.current || disabledRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!isHoldingRef.current || disabledRef.current) {
          stop();
          return;
        }
        actionRef.current();
      }, 60);
    }, 240);
  }, [stop]);

  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isHoldingRef.current) {
        stop();
      }
    };
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
      stop();
    };
  }, [stop]);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      onTouchCancel={stop}
      onContextMenu={e => e.preventDefault()}
      className={`select-none ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};

export interface RpgStatusWindowProps {
  race?: string;
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
  race = 'Mensch',
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

  // Development Budget & Rassen-Standardpunkte (Mensch = 5)
  const isHuman = (race || 'Mensch').toLowerCase().includes('mensch') || (race || 'Mensch').toLowerCase().includes('human');
  const currentRaceDef = RaceService.getRaceDefinition(race || 'Mensch');
  const raceDefaultFreePoints = isHuman ? 5 : (currentRaceDef.defaultFreePoints ?? 5);

  const rawFreePoints = (campaignPowerLevels as any)?._freePoints;
  const freePoints = typeof rawFreePoints === 'number' && !isNaN(rawFreePoints) && rawFreePoints >= 0
    ? rawFreePoints
    : raceDefaultFreePoints;

  // Ref-Tracking für verzögerungsfreie Hold-to-Repeat Aktualisierung
  const latestPowerLevelsRef = useRef(campaignPowerLevels);
  useEffect(() => {
    latestPowerLevelsRef.current = campaignPowerLevels;
  }, [campaignPowerLevels]);

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

  const defaultBudget = categories.length * safeBaseGrowth;
  const rawBudget = typeof developmentPointsPerLevel === 'number' && !isNaN(developmentPointsPerLevel)
    ? developmentPointsPerLevel
    : defaultBudget;
  const currentBudget = typeof rawBudget === 'number' && !isNaN(rawBudget) && rawBudget >= 0 ? rawBudget : defaultBudget;
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

  const handleParameterUpdate = useCallback((cat: string, delta: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const currentLevels = latestPowerLevelsRef.current || {};
    const current = currentLevels[cat];
    const sMin = 1; // Minimum is 1, cannot fall to 0!
    const sMax = globalSettings[cat]?.scaleMax ?? 100000;

    const baseVal = typeof baseParameters[cat] === 'number' && !isNaN(baseParameters[cat])
      ? baseParameters[cat]
      : (globalSettings[cat]?.min && globalSettings[cat].min > 0 ? globalSettings[cat].min : 10);

    const currentVal = typeof current === 'object' && current !== null && typeof current.value === 'number'
      ? current.value
      : (typeof current === 'number' ? current : baseVal);

    const currentPot = typeof current === 'object' && current !== null && typeof current.potentialMax === 'number'
      ? current.potentialMax
      : (characterPotential || globalSettings[cat]?.max || 1000);

    const rawCurFree = (currentLevels as any)?._freePoints;
    const currentFreePoints = typeof rawCurFree === 'number' && !isNaN(rawCurFree) && rawCurFree >= 0
      ? rawCurFree
      : raceDefaultFreePoints;

    if (delta > 0 && currentFreePoints <= 0) return;

    const newVal = currentVal + delta;
    if (newVal < sMin || newVal > sMax) return;

    const nextFreePoints = delta > 0 ? Math.max(0, currentFreePoints - 1) : currentFreePoints + 1;

    const updated = typeof current === 'object' && current !== null
      ? { ...current, value: newVal, potentialMax: currentPot }
      : { value: newVal, potentialMax: currentPot };

    const nextLevels = {
      ...currentLevels,
      [cat]: updated,
      _freePoints: nextFreePoints
    };

    latestPowerLevelsRef.current = nextLevels;
    onChangeCampaignPowerLevels(nextLevels);
  }, [readOnly, onChangeCampaignPowerLevels, globalSettings, characterPotential, raceDefaultFreePoints, baseParameters]);

  const handleResourceUpdate = useCallback((resId: string, resName: string, delta: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const currentLevels = latestPowerLevelsRef.current || {};
    const targetKey = resId || resName;
    const current = currentLevels[targetKey] || currentLevels[resName];

    // Verwende den aktuellen abgeleiteten Ressourcen-Wert als sicheren Ausgangspunkt
    const matchedRes = resources.find(r => r.id === resId || r.name === resName);
    const fallbackVal = matchedRes ? matchedRes.value : (resId === 'hp' ? 30 : 10);

    const currentVal = typeof current === 'object' && current !== null && typeof current.value === 'number'
      ? current.value
      : (typeof current === 'number' ? current : fallbackVal);

    const rawCurFree = (currentLevels as any)?._freePoints;
    const currentFreePoints = typeof rawCurFree === 'number' && !isNaN(rawCurFree) && rawCurFree >= 0
      ? rawCurFree
      : raceDefaultFreePoints;

    if (delta > 0 && currentFreePoints <= 0) return;

    const newVal = currentVal + delta;
    if (newVal < 1) return; // Minimum ist 1, darf nicht auf 0 fallen!

    const nextFreePoints = delta > 0 ? Math.max(0, currentFreePoints - 1) : currentFreePoints + 1;

    const updated = typeof current === 'object' && current !== null
      ? { ...current, value: newVal }
      : { value: newVal };

    const nextLevels = {
      ...currentLevels,
      [targetKey]: updated,
      _freePoints: nextFreePoints
    };

    latestPowerLevelsRef.current = nextLevels;
    onChangeCampaignPowerLevels(nextLevels);
  }, [readOnly, onChangeCampaignPowerLevels, raceDefaultFreePoints, resources]);

  const handleResetToOriginalValues = useCallback(() => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const resetLevels: CharacterPowerData = {};
    categories.forEach(cat => {
      const baseVal = typeof baseParameters[cat] === 'number' && !isNaN(baseParameters[cat])
        ? baseParameters[cat]
        : (globalSettings[cat]?.min && globalSettings[cat].min > 0 ? globalSettings[cat].min : 10);
      const pot = characterPotential || globalSettings[cat]?.max || 1000;
      resetLevels[cat] = { value: baseVal, potentialMax: pot };
    });

    resetLevels._freePoints = raceDefaultFreePoints;

    latestPowerLevelsRef.current = resetLevels;
    onChangeCampaignPowerLevels(resetLevels);
  }, [readOnly, onChangeCampaignPowerLevels, categories, baseParameters, globalSettings, characterPotential, raceDefaultFreePoints]);

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
                          <HoldButton
                            disabled={readOnly || res.value <= 1}
                            action={() => handleResourceUpdate(res.id, res.name, -1)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                            title={res.value > 1 ? `${res.name} verringern (-1 Punkt freigeben)` : `${res.name} hat Minimalwert 1 erreicht`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </HoldButton>
                          <HoldButton
                            disabled={readOnly || freePoints <= 0}
                            action={() => handleResourceUpdate(res.id, res.name, 1)}
                            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                            title={freePoints > 0 ? `${res.name} erhöhen (1 Punkt verbrauchen)` : 'Keine Punkte verfügbar'}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </HoldButton>
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
            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleResetToOriginalValues}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="Werte auf ursprüngliche Startwerte zurücksetzen (Basis 10, HP 30, 5 Punkte)"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Zurücksetzen</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <span className="text-[10px] font-mono font-semibold text-slate-300">Verfügbare Punkte:</span>
                <span className="text-xs font-mono font-bold text-amber-300">{freePoints}</span>
              </div>
            </div>
          </div>

          {/* Parameter-Liste */}
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
                        <HoldButton
                          disabled={readOnly || charVal <= 1}
                          action={() => handleParameterUpdate(cat, -1)}
                          className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                          title={charVal > 1 ? `${cat} verringern (-1 Punkt freigeben)` : `${cat} hat Minimalwert 1 erreicht`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </HoldButton>
                        <HoldButton
                          disabled={readOnly || freePoints <= 0}
                          action={() => handleParameterUpdate(cat, 1)}
                          className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                          title={freePoints > 0 ? `${cat} erhöhen (1 Punkt verbrauchen)` : 'Keine Punkte verfügbar'}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </HoldButton>
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
