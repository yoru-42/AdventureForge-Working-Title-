// -*- coding: utf-8 -*-
import React from 'react';
import { WorldSetting, CampaignPowerParameter } from '../types';
import { calculateRpgCharacterStats, CharacterPowerData } from '../services/rpgStatService';

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
  showStatusHeader = false
}) => {
  const { categories, globalSettings, combatProperties, resources } =
    calculateRpgCharacterStats(campaignPowerLevels, world, worldPowerSettings);

  const handleParameterUpdate = (cat: string, field: 'value' | 'potentialMax', val: number) => {
    if (readOnly || !onChangeCampaignPowerLevels) return;

    const sMin = globalSettings[cat]?.scaleMin ?? 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 1000;
    const clampedVal = Math.max(sMin, Math.min(sMax, val));

    const current = campaignPowerLevels[cat] || {
      value: globalSettings[cat]?.min ?? 10,
      potentialMax: globalSettings[cat]?.max ?? 100
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

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [cat]: updated
    });
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        {/* Spalte 1: KAMPFEIGENSCHAFTEN */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            KAMPFEIGENSCHAFTEN
          </div>

          <div className="space-y-1 font-mono text-xs">
            {/* Dynamische Ressourcen (HP, MP etc.) */}
            {resources.map(res => (
              <div
                key={`res-row-${res.id}`}
                className="flex items-center justify-between py-1 px-2 rounded bg-slate-950/60 border border-slate-800/60"
              >
                <span className="text-slate-200 font-bold">{res.name}</span>
                <span className="text-emerald-300 font-bold">
                  {res.value} <span className="text-slate-600 font-normal">/ {res.max}</span>
                </span>
              </div>
            ))}

            {/* Abgeleitete Kampfeigenschaften */}
            {combatProperties.map(prop => (
              <div
                key={`prop-${prop.id}`}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-950/50 transition-colors"
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
        </div>

        {/* Spalte 2: PARAMETER */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            PARAMETER
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => {
              const sMin = globalSettings[cat]?.scaleMin ?? 0;
              const sMax = globalSettings[cat]?.scaleMax ?? 1000;
              const charVal = campaignPowerLevels[cat]?.value ?? globalSettings[cat]?.min ?? 10;
              const charMax = campaignPowerLevels[cat]?.potentialMax ?? globalSettings[cat]?.max ?? 100;

              return (
                <div
                  key={`param-row-${cat}`}
                  className="bg-slate-950/60 p-2 rounded border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">{cat}</span>
                    <span className="text-slate-400 text-[11px]">
                      <span className="text-amber-400 font-bold">{charVal}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-emerald-400 font-bold">{charMax}</span>
                    </span>
                  </div>

                  {!readOnly && onChangeCampaignPowerLevels && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>Wert</span>
                          <input
                            type="number"
                            min={sMin}
                            max={sMax}
                            value={charVal}
                            onChange={e =>
                              handleParameterUpdate(cat, 'value', parseInt(e.target.value) || sMin)
                            }
                            className="w-11 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-amber-300 text-right font-mono font-bold"
                          />
                        </div>
                        <input
                          type="range"
                          min={sMin}
                          max={sMax}
                          value={charVal}
                          onChange={e =>
                            handleParameterUpdate(cat, 'value', parseInt(e.target.value) || sMin)
                          }
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>Max</span>
                          <input
                            type="number"
                            min={sMin}
                            max={sMax}
                            value={charMax}
                            onChange={e =>
                              handleParameterUpdate(cat, 'potentialMax', parseInt(e.target.value) || sMax)
                            }
                            className="w-11 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-emerald-300 text-right font-mono font-bold"
                          />
                        </div>
                        <input
                          type="range"
                          min={sMin}
                          max={sMax}
                          value={charMax}
                          onChange={e =>
                            handleParameterUpdate(cat, 'potentialMax', parseInt(e.target.value) || sMax)
                          }
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  )}
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
