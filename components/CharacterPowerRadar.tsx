import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CampaignPowerParameter } from '../types';

interface CharacterPowerData {
  [key: string]: {
    value: number;
    potentialMax: number;
  };
}

interface Props {
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  characterData?: CharacterPowerData;
  onChange: (newData: CharacterPowerData) => void;
}

const CharacterPowerRadar: React.FC<Props> = ({ worldPowerSettings, characterData = {}, onChange }) => {
  // Baue aus worldPowerSettings eine nutzbare Liste
  const globalSettings: Record<string, CampaignPowerParameter> = {};
  Object.entries(worldPowerSettings || {}).forEach(([key, val]) => {
    if (typeof val === 'number') {
      globalSettings[key] = {
        min: Math.floor(val * 0.4),
        max: val,
        levelUpLogic: "",
        scaleMin: 0,
        scaleMax: 100
      };
    } else if (val && typeof val === 'object') {
      globalSettings[key] = {
        min: typeof val.min === 'number' ? val.min : 10,
        max: typeof val.max === 'number' ? val.max : 100,
        levelUpLogic: typeof val.levelUpLogic === 'string' ? val.levelUpLogic : "",
        scaleMin: typeof val.scaleMin === 'number' ? val.scaleMin : 0,
        scaleMax: typeof val.scaleMax === 'number' ? val.scaleMax : 100
      };
    }
  });

  const categories = Object.keys(globalSettings);

  // Initialisiere fehlende Kategorien im characterData basierend auf den Standardwerten (min/max)
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
  }, [worldPowerSettings]);

  if (categories.length === 0) {
    return null; // Zeige nichts an, wenn keine Kampagnen-Parameter definiert sind.
  }

  // Diagramm-Daten für Recharts bauen
  const chartData = categories.map(cat => {
    const sMin = globalSettings[cat].scaleMin ?? 0;
    const sMax = globalSettings[cat].scaleMax ?? 100;
    const range = sMax - sMin || 100;

    const charVal = characterData[cat]?.value ?? globalSettings[cat].min;
    const charMax = characterData[cat]?.potentialMax ?? globalSettings[cat].max;

    // Normalisiere Werte auf die relative 0-100 Skala für das Radar-Diagramm
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

    const current = characterData[cat] || { value: globalSettings[cat].min, potentialMax: globalSettings[cat].max };
    
    let newCurrent = { ...current };
    if (field === 'value') {
      newCurrent.value = clampedVal;
      // Der aktuelle Wert sollte nicht größer als das Potenzial sein
      if (newCurrent.value > newCurrent.potentialMax) {
        newCurrent.potentialMax = newCurrent.value;
      }
    } else {
      newCurrent.potentialMax = clampedVal;
      // Das Potenzial sollte nicht kleiner als der aktuelle Wert sein
      if (newCurrent.potentialMax < newCurrent.value) {
        newCurrent.value = newCurrent.potentialMax;
      }
    }

    onChange({
      ...characterData,
      [cat]: newCurrent
    });
  };

  // Custom Tooltip für korrekte absolute Werte anstatt der gerenderten 0-100 relativen Werte
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
          <p className="font-bold text-slate-200 mb-1">{data.subject}</p>
          <p className="text-amber-500">Aktuell: <span className="font-mono">{data.actualVal}</span></p>
          <p className="text-emerald-500">Potenzial: <span className="font-mono">{data.actualMax}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 mt-2">
      <h3 className="text-sm font-bold text-amber-400 mb-1">
        <i className="fa-solid fa-chart-radar mr-2"></i>
        Macht & Werte (Kampagnen-Skala)
      </h3>
      <p className="text-[10px] text-slate-400 mb-4">
        Lege fest, wie stark dieser Charakter in den definierten Macht-Dimensionen deiner Welt ist.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.map(cat => {
            const sMin = globalSettings[cat].scaleMin ?? 0;
            const sMax = globalSettings[cat].scaleMax ?? 100;
            const charVal = characterData[cat]?.value ?? globalSettings[cat].min;
            const charMax = characterData[cat]?.potentialMax ?? globalSettings[cat].max;

            return (
              <div key={cat} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300">{cat}</span>
                  <span className="text-[9px] text-slate-500 font-mono">Skala: {sMin} bis {sMax}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-amber-500 font-semibold">Aktueller Wert</span>
                      <span className="text-amber-400 font-mono">{charVal}</span>
                    </div>
                    <input 
                      type="range" 
                      min={sMin}
                      max={sMax}
                      step="1"
                      value={charVal}
                      onChange={e => handleUpdate(cat, 'value', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-emerald-500 font-semibold">Max. Potenzial</span>
                      <span className="text-emerald-400 font-mono">{charMax}</span>
                    </div>
                    <input 
                      type="range" 
                      min={sMin}
                      max={sMax}
                      step="1"
                      value={charMax}
                      onChange={e => handleUpdate(cat, 'potentialMax', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-[250px] sm:h-[300px] flex items-center justify-center bg-slate-950/80 rounded-xl border border-slate-800 relative">
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
                  name="Potenzial (Max)"
                  dataKey="Potenzial"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
             <div className="text-xs text-slate-500 max-w-[200px] text-center">
               Das Radar-Diagramm benötigt mindestens 3 Parameter in den Kampagnen-Einstellungen.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterPowerRadar;
