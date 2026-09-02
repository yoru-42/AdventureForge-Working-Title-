import React, { useState, useMemo } from 'react';
import { Territory } from '../../types';
import { 
  X, 
  Sparkles, 
  Scissors, 
  Waves, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Compass, 
  Sliders, 
  AlertTriangle,
  Loader2,
  Maximize2
} from 'lucide-react';
import { 
  ZonePartitionMode, 
  ZonePartitionItemConfig, 
  SUBDIVIDE_PRESETS, 
  subdivideTerritoryIntoZones,
  calculateTerritoryArea
} from './worldMapData';
import { GeminiService } from '../../services/geminiService';

interface WorldMapSubdivideModalProps {
  show: boolean;
  onClose: () => void;
  targetTerritory: Territory | null;
  allTerritories: Territory[];
  onApplySubdivision: (
    createdZones: Territory[], 
    updatedAllTerritories: Territory[],
    updatedParent?: Territory
  ) => void;
  worldContext?: {
    title?: string;
    era?: string;
    tone?: string;
  };
}

const COLOR_SWATCHES = [
  { name: 'Tiefblau (Grand Line / Hochsee)', color: '#0369a1' },
  { name: 'Ozeanblau (Standard)', color: '#0284c7' },
  { name: 'Himmelblau (Calm Belt / Ruhig)', color: '#0ea5e9' },
  { name: 'Türkis / Azur (Korallenriff / Südsee)', color: '#06b6d4' },
  { name: 'Smaragd / Küste (Lagune / Bucht)', color: '#059669' },
  { name: 'Düster / Tiefseegraben', color: '#1e293b' },
  { name: 'Purpur / Magisch', color: '#7e22ce' },
  { name: 'Feindlich / Blutmeer', color: '#991b1b' },
  { name: 'Bernstein / Landmasse', color: '#d97706' }
];

export const WorldMapSubdivideModal: React.FC<WorldMapSubdivideModalProps> = ({
  show,
  onClose,
  targetTerritory,
  allTerritories,
  onApplySubdivision,
  worldContext
}) => {
  if (!show || !targetTerritory) return null;

  // Selected partition mode
  const [mode, setMode] = useState<ZonePartitionMode>('one_piece_belts');

  // Zones configuration list
  const [zones, setZones] = useState<ZonePartitionItemConfig[]>(() => {
    return SUBDIVIDE_PRESETS.one_piece_belts.defaultZones.map(z => ({ ...z }));
  });

  // Options
  const [keepParentAsContainer, setKeepParentAsContainer] = useState<boolean>(true);
  const [reassignInnerPlaces, setReassignInnerPlaces] = useState<boolean>(true);

  // AI Prompt & State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiZoneCount, setAiZoneCount] = useState<number>(3);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Handle Preset Switching
  const handleSelectPreset = (newMode: ZonePartitionMode) => {
    setMode(newMode);
    if (newMode !== 'custom') {
      const preset = SUBDIVIDE_PRESETS[newMode];
      if (preset) {
        setZones(preset.defaultZones.map(z => ({ ...z })));
      }
    }
  };

  // Add a zone row
  const handleAddZone = () => {
    const nextIdx = zones.length + 1;
    setZones(prev => [
      ...prev,
      {
        name: `Meereszone ${nextIdx}`,
        type: 'meer',
        color: COLOR_SWATCHES[nextIdx % COLOR_SWATCHES.length].color,
        description: `Neu unterteilter Meeresabschnitt in ${targetTerritory.name}`,
        dangerLevel: 'Moderat',
        weight: 1
      }
    ]);
  };

  // Update a zone row
  const handleUpdateZone = (index: number, updates: Partial<ZonePartitionItemConfig>) => {
    setZones(prev => prev.map((z, idx) => idx === index ? { ...z, ...updates } : z));
  };

  // Remove a zone row
  const handleRemoveZone = (index: number) => {
    if (zones.length <= 2) return; // Keep at least 2 zones
    setZones(prev => prev.filter((_, idx) => idx !== index));
  };

  // AI Generation Handler
  const handleGenerateWithAI = async () => {
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const res = await GeminiService.generateSubdivideZonesWithAI(
        targetTerritory.name,
        targetTerritory.type,
        aiPrompt,
        aiZoneCount,
        worldContext
      );

      if (res && res.zones && res.zones.length > 0) {
        setZones(res.zones.map(z => ({
          name: z.name,
          type: (z.type as any) || 'meer',
          color: z.color || '#0284c7',
          description: z.description,
          dangerLevel: z.dangerLevel || 'Mittel',
          weight: z.weight || 1,
          tags: z.tags || ['KI-Zone'],
          climate: z.climate
        })));
        setMode('custom');
      } else {
        setAiError('Die KI konnte keine Zonen generieren. Bitte versuche es erneut.');
      }
    } catch (err: any) {
      console.error('Error generating sub-zones:', err);
      setAiError(err?.message || 'Fehler bei der KI-Zonengenerierung.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Compute stats
  const areaRaw = calculateTerritoryArea(targetTerritory, allTerritories);
  const totalWeight = zones.reduce((sum, z) => sum + (z.weight || 1), 0);

  // Apply Action
  const handleApply = () => {
    if (zones.length < 2) return;

    const result = subdivideTerritoryIntoZones(
      targetTerritory,
      {
        mode,
        zones,
        keepParentAsContainer,
        reassignInnerPlaces
      },
      allTerritories
    );

    onApplySubdivision(
      result.createdTerritories,
      result.updatedAllTerritories,
      result.updatedParentTerritory
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-100 text-sm sm:text-base">
                  Meer in Zonen unterteilen
                </h3>
                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full text-[10px] font-bold">
                  {targetTerritory.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Teilt diese große Wasserfläche lückenlos in zusammenhängende Meeresgürtel, Sektoren oder Hoheitszonen auf.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* 1. PRESET SELECTION GRID */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              1. Wähle eine Zonengliederung oder Vorlage:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(SUBDIVIDE_PRESETS) as ZonePartitionMode[]).map((presetKey) => {
                const p = SUBDIVIDE_PRESETS[presetKey];
                const isSelected = mode === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handleSelectPreset(presetKey)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-400 text-sky-200 shadow-md shadow-sky-950/40 ring-1 ring-sky-400'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{p.icon}</span>
                        <span className={isSelected ? 'text-sky-300' : 'text-slate-200'}>{p.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. AI GENERATOR ACCORDION / BOX */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>KI-Zonen-Generator (Thematische Meeresbereiche)</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Anzahl Zonen:</span>
                <select
                  value={aiZoneCount}
                  onChange={(e) => setAiZoneCount(Number(e.target.value))}
                  className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none"
                >
                  <option value={2}>2 Zonen</option>
                  <option value={3}>3 Zonen</option>
                  <option value={4}>4 Zonen</option>
                  <option value={5}>5 Zonen</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="z.B. Calm Belt (Seekönige), Neue Welt (Kaiser-Gewässer) und Südmeer (Handel)..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isAiGenerating}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mit KI vorschlagen</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* 3. CONFIGURE ZONE ITEMS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>2. Zonen bearbeiten ({zones.length} Zonen entstehen):</span>
              </label>
              <button
                type="button"
                onClick={handleAddZone}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-sky-400" />
                <span>Zone hinzufügen</span>
              </button>
            </div>

            <div className="space-y-2">
              {zones.map((zone, idx) => {
                const zonePct = totalWeight > 0 ? Math.round(((zone.weight || 1) / totalWeight) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => handleUpdateZone(idx, { name: e.target.value })}
                          placeholder="Zonenname..."
                          className="font-bold text-slate-100 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-lg px-2.5 py-1 text-xs flex-1 min-w-[120px] focus:outline-none"
                        />

                        {/* Color Picker Swatch */}
                        <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-700 shrink-0">
                          <input
                            type="color"
                            value={zone.color || '#0284c7'}
                            onChange={(e) => handleUpdateZone(idx, { color: e.target.value })}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                            title="Zonenfarbe wählen"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Relative Weight / Proportion */}
                        <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
                          <span className="text-slate-400">Anteil:</span>
                          <span className="text-sky-300 font-mono font-bold">{zonePct}%</span>
                          <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.05"
                            value={zone.weight || 1}
                            onChange={(e) => handleUpdateZone(idx, { weight: parseFloat(e.target.value) })}
                            className="w-16 sm:w-20 accent-sky-400 cursor-pointer"
                            title="Relative Breite/Höhe dieses Abschnitts anpassen"
                          />
                        </div>

                        {zones.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveZone(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                            title="Diese Zone entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <input
                        type="text"
                        value={zone.description || ''}
                        onChange={(e) => handleUpdateZone(idx, { description: e.target.value })}
                        placeholder="Kurzbeschreibung (z.B. Gefahren, Wetter, Seekönige)..."
                        className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg focus:outline-none focus:border-slate-600"
                      />
                      <input
                        type="text"
                        value={zone.dangerLevel || ''}
                        onChange={(e) => handleUpdateZone(idx, { dangerLevel: e.target.value })}
                        placeholder="Gefahrenstufe (z.B. Extrem gefährlich, Stürmisch)..."
                        className="bg-slate-900 border border-slate-800 text-amber-300 px-2.5 py-1 rounded-lg focus:outline-none focus:border-slate-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. HIERARCHY & OPTIONS */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              3. Strukturoptionen:
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepParentAsContainer}
                  onChange={(e) => setKeepParentAsContainer(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
                />
                <span className="text-slate-300 font-semibold">
                  Übergeordnetes Meer *{targetTerritory.name}* als Master-Becken beibehalten
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reassignInnerPlaces}
                  onChange={(e) => setReassignInnerPlaces(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
                />
                <span className="text-slate-300 font-semibold">
                  Inseln & Häfen automatisch neuen Teilzonen zuordnen
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={zones.length < 2}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Scissors className="w-4 h-4" />
            <span>Zonengliederung jetzt anwenden ({zones.length} Zonen)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
