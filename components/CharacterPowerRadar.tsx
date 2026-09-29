import React, { useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CampaignPowerParameter, WorldSetting, CustomStatAllocation, CostResource, CustomResourceMapping } from '../types';
import {
  EP_DEFAULT_STAT_ALLOCATIONS,
  EP_DEFAULT_COST_RESOURCES,
  EP_DEFAULT_CUSTOM_RESOURCE_MAPPINGS,
  EP_DEFAULT_HEALTH_NAMES
} from '../lib/progressionDefaults';

interface CharacterPowerData {
  [key: string]: {
    value: number;
    potentialMax: number;
  };
}

interface Props {
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  characterData?: CharacterPowerData;
  world?: WorldSetting;
  onChange: (newData: CharacterPowerData) => void;
  title?: string;
}

export const getDependentCombatProperties = (statName: string, world?: WorldSetting) => {
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

  const cleanStat = statName.trim().toLowerCase();

  // Kampfeigenschaften
  const properties = statAllocations
    .filter(alloc =>
      (alloc.selectedRadarNames || []).some(
        r => r.trim().toLowerCase() === cleanStat
      )
    )
    .map(alloc => ({
      id: alloc.id,
      label: alloc.label,
      icon: alloc.icon
    }));

  // Ressourcen
  const resourcesSet = new Set<string>();

  if (healthPowerNames.some(hp => hp.trim().toLowerCase() === cleanStat)) {
    resourcesSet.add(world?.healthLabel || 'HP');
  }

  costResources.forEach(res => {
    const isSource = (res.sourcePowers || []).some(
      sp => sp.trim().toLowerCase() === cleanStat
    );
    const isRadar = res.radarPowerName?.trim().toLowerCase() === cleanStat;
    if (isSource || isRadar) {
      resourcesSet.add(res.name || 'MP');
    }
  });

  customResourceMappings.forEach(res => {
    if ((res.sourcePowers || []).some(sp => sp.trim().toLowerCase() === cleanStat)) {
      resourcesSet.add(res.name);
    }
  });

  return {
    properties,
    resources: Array.from(resourcesSet)
  };
};

const CharacterPowerRadar: React.FC<Props> = ({
  worldPowerSettings,
  characterData = {},
  world,
  onChange,
  title = 'Macht & Werte'
}) => {
  const settingsSource = worldPowerSettings || world?.campaignPowerSettings;

  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(settingsSource || {}).forEach(([key, val]) => {
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

  useEffect(() => {
    if (categories.length > 0) {
      let hasChanges = false;
      const updatedData = { ...characterData };

      categories.forEach(cat => {
        if (!updatedData[cat]) {
          updatedData[cat] = {
            value: globalSettings[cat].min,
            potentialMax: globalSettings[cat].max
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        onChange(updatedData);
      }
    }
  }, [worldPowerSettings, world?.campaignPowerSettings]);

  if (categories.length === 0) {
    return null;
  }

  const chartData = categories.map(cat => {
    const sMin = globalSettings[cat].scaleMin ?? 0;
    const sMax = globalSettings[cat].scaleMax ?? 100;
    const range = sMax - sMin || 100;

    const charVal = characterData[cat]?.value ?? globalSettings[cat].min;
    const charMax = characterData[cat]?.potentialMax ?? globalSettings[cat].max;

    const relativeVal = Math.min(100, Math.max(0, Math.round(((charVal - sMin) / range) * 100)));
    const relativeMax = Math.min(100, Math.max(0, Math.round(((charMax - sMin) / range) * 100)));

    return {
      subject: cat,
      Wert: relativeVal,
      Potenzial: relativeMax,
      fullMark: 100,
      actualVal: charVal,
      actualMax: charMax,
      sMin,
      sMax
    };
  });

  const handleUpdate = (cat: string, field: 'value' | 'potentialMax', val: number) => {
    const sMin = globalSettings[cat].scaleMin ?? 0;
    const sMax = globalSettings[cat].scaleMax ?? 100;
    const clampedVal = Math.max(sMin, Math.min(sMax, val));

    const current = characterData[cat] || {
      value: globalSettings[cat].min,
      potentialMax: globalSettings[cat].max
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

    onChange({
      ...characterData,
      [cat]: newCurrent
    });
  };

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-200">{data.subject}</p>
          <p className="text-amber-400">Aktuell: <span className="font-mono">{data.actualVal}</span></p>
          <p className="text-emerald-400">Potenzial: <span className="font-mono">{data.actualMax}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>{title}</span>
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">
          {categories.length} Dimensionen
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Wertedimensionen mit Kampfeigenschaften & Ressourcen */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
          {categories.map(cat => {
            const sMin = globalSettings[cat].scaleMin ?? 0;
            const sMax = globalSettings[cat].scaleMax ?? 100;
            const charVal = characterData[cat]?.value ?? globalSettings[cat].min;
            const charMax = characterData[cat]?.potentialMax ?? globalSettings[cat].max;

            const depProps = getDependentCombatProperties(cat, world);

            return (
              <div key={`radar-cat-${cat}`} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">{cat}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {charVal} / {charMax} <span className="text-slate-600">({sMin}–{sMax})</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-amber-400 font-semibold">Aktuell</span>
                      <span className="text-amber-300 font-mono">{charVal}</span>
                    </div>
                    <input
                      type="range"
                      min={sMin}
                      max={sMax}
                      step="1"
                      value={charVal}
                      onChange={e => handleUpdate(cat, 'value', parseInt(e.target.value) || 0)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-emerald-400 font-semibold">Potenzial</span>
                      <span className="text-emerald-300 font-mono">{charMax}</span>
                    </div>
                    <input
                      type="range"
                      min={sMin}
                      max={sMax}
                      step="1"
                      value={charMax}
                      onChange={e => handleUpdate(cat, 'potentialMax', parseInt(e.target.value) || 0)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Abhängige Kampfeigenschaften & Ressourcen */}
                {(depProps.properties.length > 0 || depProps.resources.length > 0) && (
                  <div className="pt-2 border-t border-slate-800/60 text-[10px] flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                    {depProps.properties.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-slate-500 font-semibold uppercase text-[9px]">Kampfeigenschaften:</span>
                        {depProps.properties.map(p => (
                          <span
                            key={`dep-prop-${p.id}`}
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium"
                          >
                            {p.icon ? `${p.icon} ` : ''}{p.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {depProps.resources.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-slate-500 font-semibold uppercase text-[9px]">Ressourcen:</span>
                        {depProps.resources.map(r => (
                          <span
                            key={`dep-res-${r}`}
                            className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-medium"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Visualisierung Radar-Chart */}
        <div className="h-[260px] sm:h-[300px] flex items-center justify-center bg-slate-950/80 rounded-xl border border-slate-800 relative">
          {categories.length >= 3 ? (
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
          ) : (
            <div className="text-xs text-slate-500 max-w-[200px] text-center">
              Das Radar-Diagramm benötigt mindestens 3 Parameter in den Macht-Einstellungen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterPowerRadar;
