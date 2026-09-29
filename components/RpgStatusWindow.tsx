// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { WorldSetting, CampaignPowerParameter, CustomStatAllocation, CostResource, CustomResourceMapping } from '../types';
import {
  EP_DEFAULT_PARAMETERS,
  EP_DEFAULT_STAT_ALLOCATIONS,
  EP_DEFAULT_COST_RESOURCES,
  EP_DEFAULT_CUSTOM_RESOURCE_MAPPINGS,
  EP_DEFAULT_HEALTH_NAMES
} from '../lib/progressionDefaults';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface CharacterPowerData {
  [key: string]: {
    value: number;
    potentialMax: number;
  };
}

interface RpgStatusWindowProps {
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  campaignPowerLevels?: CharacterPowerData;
  onChangeCampaignPowerLevels: (newLevels: CharacterPowerData) => void;
  showRadarToggle?: boolean;
}

export function calculateDerivedCombatProperties(
  campaignPowerLevels: CharacterPowerData = {},
  world?: WorldSetting,
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>
) {
  const settingsSource = worldPowerSettings || world?.campaignPowerSettings || EP_DEFAULT_PARAMETERS;

  // Build list of base parameter categories
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource).forEach(([key, val]) => {
    if (typeof val === 'number') {
      globalSettings[key] = {
        min: Math.floor(val * 0.4),
        max: val,
        levelUpLogic: '',
        scaleMin: 0,
        scaleMax: 100
      };
    } else if (val && typeof val === 'object') {
      globalSettings[key] = {
        min: typeof val.min === 'number' ? val.min : 10,
        max: typeof val.max === 'number' ? val.max : 100,
        levelUpLogic: typeof val.levelUpLogic === 'string' ? val.levelUpLogic : '',
        scaleMin: typeof val.scaleMin === 'number' ? val.scaleMin : 0,
        scaleMax: typeof val.scaleMax === 'number' ? val.scaleMax : 100
      };
    }
  });

  const categories = Object.keys(globalSettings);

  const statAllocations: CustomStatAllocation[] =
    world?.customStatAllocations && world.customStatAllocations.length > 0
      ? world.customStatAllocations
      : EP_DEFAULT_STAT_ALLOCATIONS;

  const costResources: CostResource[] =
    world?.costResources && world.costResources.length > 0
      ? world.costResources
      : EP_DEFAULT_COST_RESOURCES;

  const customResourceMappings: CustomResourceMapping[] =
    world?.customResourceMappings && world.customResourceMappings.length > 0
      ? world.customResourceMappings
      : EP_DEFAULT_CUSTOM_RESOURCE_MAPPINGS;

  const healthPowerNames: string[] =
    world?.healthPowerNames && world.healthPowerNames.length > 0
      ? world.healthPowerNames
      : EP_DEFAULT_HEALTH_NAMES;

  // 1. Calculate Kampfeigenschaften
  const combatProperties = statAllocations.map(alloc => {
    const radarNames = alloc.selectedRadarNames || [];
    let sumValue = 0;
    let sumMax = 0;
    let count = 0;

    radarNames.forEach(rName => {
      const cleanR = rName.trim();
      // Match case-insensitively if needed
      const matchedKey = categories.find(c => c.toLowerCase() === cleanR.toLowerCase()) || cleanR;
      const paramData = campaignPowerLevels[matchedKey] || campaignPowerLevels[cleanR];

      if (paramData) {
        sumValue += paramData.value ?? globalSettings[matchedKey]?.min ?? 10;
        sumMax += paramData.potentialMax ?? globalSettings[matchedKey]?.max ?? 100;
        count++;
      } else if (globalSettings[matchedKey]) {
        sumValue += globalSettings[matchedKey].min;
        sumMax += globalSettings[matchedKey].max;
        count++;
      }
    });

    const divisor = count > 0 ? count : 1;
    const value = Math.round(sumValue / divisor);
    const potentialMax = Math.round(sumMax / divisor);
    const isPercentage = ['CORE_CRIT_RATE', 'CORE_EVASION', 'CORE_COUNTER'].includes(alloc.coreRole || '');

    return {
      id: alloc.id,
      label: alloc.label,
      icon: alloc.icon,
      value,
      potentialMax,
      isPercentage,
      sources: radarNames
    };
  });

  // 2. Calculate Ressourcen (HP, MP, SP etc.)
  const resources: { id: string; name: string; value: number; max: number }[] = [];

  // Gesundheit (HP)
  let healthSum = 0;
  let healthMaxSum = 0;
  let healthCount = 0;
  healthPowerNames.forEach(hpName => {
    const cleanHp = hpName.trim();
    const matchedKey = categories.find(c => c.toLowerCase() === cleanHp.toLowerCase()) || cleanHp;
    const paramData = campaignPowerLevels[matchedKey] || campaignPowerLevels[cleanHp];
    if (paramData) {
      healthSum += paramData.value ?? 10;
      healthMaxSum += paramData.potentialMax ?? 100;
      healthCount++;
    }
  });

  const hpVal = healthCount > 0 ? Math.round((healthSum / healthCount) * 10) : 100;
  const hpMax = healthCount > 0 ? Math.round((healthMaxSum / healthCount) * 10) : 100;

  resources.push({
    id: 'hp',
    name: world?.healthLabel || 'HP (Gesundheit)',
    value: hpVal,
    max: hpMax
  });

  // Cost Resources (MP, SP)
  costResources.forEach(res => {
    let resSum = 0;
    let resMaxSum = 0;
    let resCount = 0;

    (res.sourcePowers || []).forEach(spName => {
      const cleanSp = spName.trim();
      const matchedKey = categories.find(c => c.toLowerCase() === cleanSp.toLowerCase()) || cleanSp;
      const paramData = campaignPowerLevels[matchedKey] || campaignPowerLevels[cleanSp];
      if (paramData) {
        resSum += paramData.value ?? 10;
        resMaxSum += paramData.potentialMax ?? 100;
        resCount++;
      }
    });

    const resVal = resCount > 0 ? Math.round(resSum / resCount) : (res.baseMax || 50);
    const resMax = resCount > 0 ? Math.round(resMaxSum / resCount) : (res.baseMax || 50);

    resources.push({
      id: res.id || `res-${res.name}`,
      name: res.name || 'MP',
      value: resVal,
      max: resMax
    });
  });

  return {
    categories,
    globalSettings,
    combatProperties,
    resources
  };
}

export const RpgStatusWindow: React.FC<RpgStatusWindowProps> = ({
  world,
  worldPowerSettings,
  campaignPowerLevels = {},
  onChangeCampaignPowerLevels,
  showRadarToggle = true
}) => {
  const [showRadar, setShowRadar] = useState<boolean>(false);

  const { categories, globalSettings, combatProperties, resources } =
    calculateDerivedCombatProperties(campaignPowerLevels, world, worldPowerSettings);

  if (categories.length === 0) {
    return null;
  }

  const handleParameterUpdate = (cat: string, field: 'value' | 'potentialMax', val: number) => {
    const sMin = globalSettings[cat]?.scaleMin ?? 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 100;
    const clampedVal = Math.max(sMin, Math.min(sMax, val));

    const current = campaignPowerLevels[cat] || {
      value: globalSettings[cat]?.min ?? 10,
      potentialMax: globalSettings[cat]?.max ?? 100
    };

    let newCurrent = { ...current };
    if (field === 'value') {
      newCurrent.value = clampedVal;
      if (newCurrent.value > newCurrent.potentialMax) {
        newCurrent.potentialMax = newCurrent.value;
      }
    } else {
      newCurrent.potentialMax = clampedVal;
      if (newCurrent.potentialMax < newCurrent.value) {
        newCurrent.value = newCurrent.potentialMax;
      }
    }

    onChangeCampaignPowerLevels({
      ...campaignPowerLevels,
      [cat]: newCurrent
    });
  };

  // Chart data for Radar
  const chartData = categories.map(cat => {
    const sMin = globalSettings[cat]?.scaleMin ?? 0;
    const sMax = globalSettings[cat]?.scaleMax ?? 100;
    const range = sMax - sMin || 100;

    const charVal = campaignPowerLevels[cat]?.value ?? globalSettings[cat]?.min ?? 10;
    const charMax = campaignPowerLevels[cat]?.potentialMax ?? globalSettings[cat]?.max ?? 100;

    const relativeVal = Math.min(100, Math.max(0, Math.round(((charVal - sMin) / range) * 100)));
    const relativeMax = Math.min(100, Math.max(0, Math.round(((charMax - sMin) / range) * 100)));

    return {
      subject: cat,
      Wert: relativeVal,
      Potenzial: relativeMax,
      fullMark: 100,
      actualVal: charVal,
      actualMax: charMax
    };
  });

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs space-y-0.5">
          <p className="font-bold text-slate-200">{data.subject}</p>
          <p className="text-amber-400">Aktuell: <span className="font-mono">{data.actualVal}</span></p>
          <p className="text-emerald-400">Potenzial: <span className="font-mono">{data.actualMax}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl">
      {/* Top Header Bar for JRPG Window */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span>RPG-CHARAKTERSTATUS</span>
        </span>
        {showRadarToggle && categories.length >= 3 && (
          <button
            type="button"
            onClick={() => setShowRadar(!showRadar)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-bold transition-all cursor-pointer"
          >
            {showRadar ? 'Radar ausblenden' : 'Radar-Diagramm anzeigen'}
          </button>
        )}
      </div>

      {/* Main JRPG Status Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Spalte 1: KAMPFEIGENSCHAFTEN & RESSOURCEN */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-4">
          {/* Kampfeigenschaften */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between">
              <span>KAMPFEIGENSCHAFTEN</span>
              <span className="text-slate-500 font-normal">Abgeleitet aus Parametern</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {combatProperties.map(prop => (
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
          </div>

          {/* Ressourcen */}
          {resources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                RESSOURCEN
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {resources.map(res => (
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

        {/* Spalte 2: PARAMETER */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between">
            <span>PARAMETER</span>
            <span className="text-slate-500 font-normal">Editierbare Grundwerte</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => {
              const sMin = globalSettings[cat]?.scaleMin ?? 0;
              const sMax = globalSettings[cat]?.scaleMax ?? 100;
              const charVal = campaignPowerLevels[cat]?.value ?? globalSettings[cat]?.min ?? 10;
              const charMax = campaignPowerLevels[cat]?.potentialMax ?? globalSettings[cat]?.max ?? 100;

              return (
                <div
                  key={`param-row-${cat}`}
                  className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">{cat}</span>
                    <span className="text-slate-400">
                      <span className="text-amber-400 font-bold">{charVal}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-emerald-400 font-bold">{charMax}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>Aktuell</span>
                        <span className="text-amber-400">{charVal}</span>
                      </div>
                      <input
                        type="range"
                        min={sMin}
                        max={sMax}
                        step="1"
                        value={charVal}
                        onChange={e =>
                          handleParameterUpdate(cat, 'value', parseInt(e.target.value) || 0)
                        }
                        className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>Potenzial</span>
                        <span className="text-emerald-400">{charMax}</span>
                      </div>
                      <input
                        type="range"
                        min={sMin}
                        max={sMax}
                        step="1"
                        value={charMax}
                        onChange={e =>
                          handleParameterUpdate(cat, 'potentialMax', parseInt(e.target.value) || 0)
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

      {/* Visuelles Radar-Diagramm (Optional klappbar / unterhalb) */}
      {showRadar && categories.length >= 3 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-200">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            RADAR-VISUALISIERUNG
          </div>
          <div className="h-[240px] sm:h-[280px] bg-slate-950/80 rounded-xl border border-slate-800/80 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Radar
                  name="Aktueller Wert"
                  dataKey="Wert"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Potenzial"
                  dataKey="Potenzial"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RpgStatusWindow;
