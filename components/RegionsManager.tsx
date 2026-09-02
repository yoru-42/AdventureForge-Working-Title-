import React, { useState } from 'react';
import { WorldSetting } from '../types';
import { GeminiService } from '../services/geminiService';

interface RegionsManagerProps {
  world: WorldSetting;
  onChangeWorld: (updated: WorldSetting) => void;
  tags: string[];
  isNsfw?: boolean;
}

export const RegionsManager: React.FC<RegionsManagerProps> = ({
  world,
  onChangeWorld,
  tags,
  isNsfw = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom navigation: 'general_text' (Original summaries), 'regions_list' (Interactive Regions)
  const [subSection, setSubSection] = useState<'general_text' | 'regions_list'>('general_text');

  const [activeTab, setActiveTab] = useState<'analysis' | 'forests' | 'mountainPasses' | 'archipelagos' | 'ruins' | 'temples' | 'dungeons'>('analysis');
  const [generationStep, setGenerationStep] = useState<string>('');

  // Manual marker adding states
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'Ruine',
    name: '',
    description: '',
    x: 50,
    y: 50,
    hazardLevel: 'Mittel'
  });

  // Region adding states
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegion, setNewRegion] = useState({
    name: '',
    type: 'Nordwald',
    biome: 'Mischwald',
    climate: 'Kühl gemäßigt',
    features: 'Ewiger Nebel, uralte Runensteine',
    threats: 'Riesenspinnen, Irrlichter',
    resources: 'Eisenholz, Heilkräuter',
    population: 'Gering (einzelne Holzfäller)'
  });

  const handleGenerateRegions = async () => {
    setIsGenerating(true);
    setError(null);

    const steps = [
      'Scanne physische Geographie...',
      'Identifiziere dichte Waldgebiete und Dschungel...',
      'Suche nach strategischen Gebirgspässen...',
      'Kartiere vorgelagerte Inselgruppen...',
      'Suche nach Relikten untergegangener Imperien (Ruinen)...',
      'Platziere spirituelle Kraftorte und Tempel...',
      'Grabe tiefe Verliese und geheimnisvolle Dungeons...',
      'Verfasse die geografischen Chroniken...'
    ];

    let currentStep = 0;
    setGenerationStep(steps[currentStep]);

    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setGenerationStep(steps[currentStep]);
      }
    }, 1500);

    try {
      const result = await GeminiService.generateRegions(
        world.title,
        world.description,
        tags,
        world.physicalGeography,
        world.terrains || [],
        isNsfw
      );

      if (result && result.regions && result.regionMarkers) {
        const generatedRegions = [
          {
            name: "Nordwald",
            type: "Uralter Wald",
            biome: "Dichter Nadelwald",
            climate: "Arktisch kühl",
            features: "Geheimnisvolle Runensteine der Eisriesen",
            threats: "Frostwölfe, Schneeleoparden",
            resources: "Edelholz, Frostpilze",
            population: "Einsiedler und Jäger"
          },
          {
            name: "Nebelgebirge",
            type: "Hochgebirge",
            biome: "Fels und Eis",
            climate: "Extrem kalt, stürmisch",
            features: "Schneebedeckte Gipfel, tiefe Gletscherspalten",
            threats: "Harpyien, Steintrolle",
            resources: "Mithril-Erz, Bergkristalle",
            population: "Zwergen-Grenzposten"
          },
          {
            name: "Blutmoor",
            type: "Sumpfland",
            biome: "Feuchtgebiet / Moor",
            climate: "Schwül und neblig",
            features: "Tückischer Treibsand, rote Algenblüte",
            threats: "Sumpfschrecken, giftige Moskitos",
            resources: "Blutegel, Torf, Moos",
            population: "Sumpfhexen und Einsame Fischer"
          },
          {
            name: "Frostküste",
            type: "Küstenstreifen",
            biome: "Tundra",
            climate: "Windig, eisig",
            features: "Schroffe Fjorde, treibende Eisberge",
            threats: "Eisbären, Seeungeheuer",
            resources: "Fisch, Waltran, Bernstein",
            population: "Küstennahe Wikingerdörfer"
          }
        ];

        onChangeWorld({
          ...world,
          regions: {
            ...result.regions,
            regionsList: world.regions?.regionsList || generatedRegions
          },
          regionMarkers: result.regionMarkers
        });
      } else {
        throw new Error('Ungültiges Antwortformat von der KI erhalten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler bei der Generierung der Regionen.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleDeleteMarker = (idx: number) => {
    const updated = [...(world.regionMarkers || [])];
    updated.splice(idx, 1);
    onChangeWorld({
      ...world,
      regionMarkers: updated
    });
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.name.trim()) return;

    const updated = [...(world.regionMarkers || []), { ...newMarker }];
    onChangeWorld({
      ...world,
      regionMarkers: updated
    });

    setNewMarker({
      type: 'Ruine',
      name: '',
      description: '',
      x: 50,
      y: 50,
      hazardLevel: 'Mittel'
    });
    setShowAddMarker(false);
  };

  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegion.name.trim()) return;

    const currentList = world.regions?.regionsList || [];
    const updated = [...currentList, { ...newRegion }];

    onChangeWorld({
      ...world,
      regions: {
        ...(world.regions || {}),
        regionsList: updated
      }
    });

    setNewRegion({
      name: '',
      type: 'Nordwald',
      biome: 'Mischwald',
      climate: 'Kühl gemäßigt',
      features: '',
      threats: '',
      resources: '',
      population: ''
    });
    setShowAddRegion(false);
  };

  const handleDeleteRegion = (idx: number) => {
    const currentList = [...(world.regions?.regionsList || [])];
    currentList.splice(idx, 1);
    onChangeWorld({
      ...world,
      regions: {
        ...(world.regions || {}),
        regionsList: currentList
      }
    });
  };

  const handleUpdateRegion = (idx: number, key: string, value: string) => {
    const currentList = [...(world.regions?.regionsList || [])];
    if (currentList[idx]) {
      currentList[idx] = {
        ...currentList[idx],
        [key]: value
      };
      onChangeWorld({
        ...world,
        regions: {
          ...(world.regions || {}),
          regionsList: currentList
        }
      });
    }
  };

  const updateRegionField = (key: string, value: string) => {
    onChangeWorld({
      ...world,
      regions: {
        ...(world.regions || {}),
        [key]: value
      }
    });
  };

  const hasRegionData = !!world.regions;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="regions-tab-container">
      {/* Upper Status / Control Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 animate-pulse">
            <i className="fa-solid fa-map-location-dot text-emerald-400"></i> Phase 3 – Regionen &amp; Biome
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Teile deine Länder in Regionen ein und beschreibe detailliert die Wildnis. Verwalte Regionen wie den Nordwald, das Nebelgebirge, das Blutmoor oder die Frostküste mit ihren jeweiligen Klimazonen, Ressourcen, Gefahren und Besonderheiten.
          </p>
        </div>

        <button
          onClick={handleGenerateRegions}
          disabled={isGenerating}
          className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border border-emerald-500/30"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner animate-spin text-emerald-300"></i>
              <span>{generationStep}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-emerald-300"></i>
              <span>{hasRegionData ? 'Regionen neu generieren' : 'Regionen & POIs generieren'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/35 border border-red-900/50 p-4 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Sub-Section Navigation bar */}
      <div className="flex border-b border-slate-800 gap-1.5 pb-2">
        <button
          type="button"
          onClick={() => setSubSection('general_text')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'general_text'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Wildnis-Berichte &amp; POIs</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('regions_list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'regions_list'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-map-location-dot"></i>
          <span>Regionen-Liste ({world.regions?.regionsList?.length || 0})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          
          {subSection === 'general_text' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: 'analysis', label: 'Analyse', icon: 'fa-magnifying-glass-chart' },
                  { id: 'forests', label: 'Wälder', icon: 'fa-tree' },
                  { id: 'mountainPasses', label: 'Gebirgspässe', icon: 'fa-mountain' },
                  { id: 'archipelagos', label: 'Inselgruppen', icon: 'fa-water' },
                  { id: 'ruins', label: 'Ruinen', icon: 'fa-gavel' },
                  { id: 'temples', label: 'Tempel', icon: 'fa-place-of-worship' },
                  { id: 'dungeons', label: 'Dungeons', icon: 'fa-dungeon' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} mr-1`}></i> {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[350px] space-y-4">
                {activeTab === 'analysis' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Verteilung von Wildnis &amp; Zivilisations-Rändern</label>
                    <textarea
                      value={world.regions?.regionsAnalysis || ''}
                      onChange={e => updateRegionField('regionsAnalysis', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Führe eine zusammenfassende geografische Analyse durch..."
                    />
                  </div>
                )}

                {activeTab === 'forests' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Bedeutende Wälder &amp; Urwälder</label>
                    <textarea
                      value={world.regions?.forests || ''}
                      onChange={e => updateRegionField('forests', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe dichte, magische oder urzeitliche Forstlandschaften..."
                    />
                  </div>
                )}

                {activeTab === 'mountainPasses' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Strategische Gebirgspässe &amp; Schluchten</label>
                    <textarea
                      value={world.regions?.mountainPasses || ''}
                      onChange={e => updateRegionField('mountainPasses', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Pässe, Klüfte, Hochplateaus..."
                    />
                  </div>
                )}

                {activeTab === 'archipelagos' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Inselgruppen &amp; Atolle</label>
                    <textarea
                      value={world.regions?.archipelagos || ''}
                      onChange={e => updateRegionField('archipelagos', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Sagenumwobene Meeresarchipele und Atolle..."
                    />
                  </div>
                )}

                {activeTab === 'ruins' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Verlassene Ruinen &amp; Zerfallene Festungen</label>
                    <textarea
                      value={world.regions?.ruins || ''}
                      onChange={e => updateRegionField('ruins', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Stumme Zeugen untergegangener Zivilisationen..."
                    />
                  </div>
                )}

                {activeTab === 'temples' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Heilige Tempelanlagen &amp; Kultstätten</label>
                    <textarea
                      value={world.regions?.temples || ''}
                      onChange={e => updateRegionField('temples', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Heiligtümer, Kathedralen, Monolithe..."
                    />
                  </div>
                )}

                {activeTab === 'dungeons' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Verliese, Katakomben &amp; Tiefe Höhlen</label>
                    <textarea
                      value={world.regions?.dungeons || ''}
                      onChange={e => updateRegionField('dungeons', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Gefährliche unterirdische Labyrinthe..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Regions List (Eingabefelder) */}
          {subSection === 'regions_list' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-map-location-dot text-emerald-400"></i> Regionen &amp; Gebietsunterteilung ({world.regions?.regionsList?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddRegion(!showAddRegion)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Region hinzufügen
                </button>
              </div>

              {showAddRegion && (
                <form onSubmit={handleAddRegion} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Neue Region anlegen</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Regionenname</label>
                      <input
                        type="text"
                        placeholder="Z.B. Nordwald, Nebelgebirge, Blutmoor..."
                        value={newRegion.name}
                        onChange={e => setNewRegion({ ...newRegion, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Regionstyp</label>
                      <input
                        type="text"
                        placeholder="Z.B. Nebelgebirge, Urwald, Düstersee"
                        value={newRegion.type}
                        onChange={e => setNewRegion({ ...newRegion, type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Biom</label>
                      <input
                        type="text"
                        placeholder="Z.B. Taiga, Wüste, Marschland"
                        value={newRegion.biome}
                        onChange={e => setNewRegion({ ...newRegion, biome: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Klima</label>
                      <input
                        type="text"
                        placeholder="Z.B. Ewiger Frost, Tropisch"
                        value={newRegion.climate}
                        onChange={e => setNewRegion({ ...newRegion, climate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Besonderheiten</label>
                      <input
                        type="text"
                        placeholder="Z.B. Schwebende Steine, Flüsternde Winde"
                        value={newRegion.features}
                        onChange={e => setNewRegion({ ...newRegion, features: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Gefahren</label>
                      <input
                        type="text"
                        placeholder="Z.B. Banditen, Frostwürmer"
                        value={newRegion.threats}
                        onChange={e => setNewRegion({ ...newRegion, threats: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ressourcen</label>
                      <input
                        type="text"
                        placeholder="Z.B. Heilkräuter, Drachenerz"
                        value={newRegion.resources}
                        onChange={e => setNewRegion({ ...newRegion, resources: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Bevölkerung</label>
                      <input
                        type="text"
                        placeholder="Z.B. Unbewohnt, Sumpfstämme"
                        value={newRegion.population}
                        onChange={e => setNewRegion({ ...newRegion, population: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRegion(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(!world.regions?.regionsList || world.regions.regionsList.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">Keine Regionen angelegt. Trage manuell welche ein oder generiere sie.</div>
                ) : (
                  world.regions.regionsList.map((region, idx) => (
                    <div key={`region-${idx}`} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleDeleteRegion(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <i className="fa-solid fa-trash-can mr-1"></i> Löschen
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Region</label>
                          <input
                            type="text"
                            value={region.name}
                            onChange={e => handleUpdateRegion(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 font-extrabold text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Typ / Art</label>
                          <input
                            type="text"
                            value={region.type}
                            onChange={e => handleUpdateRegion(idx, 'type', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Biom</label>
                          <input
                            type="text"
                            value={region.biome}
                            onChange={e => handleUpdateRegion(idx, 'biome', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Klima</label>
                          <input
                            type="text"
                            value={region.climate}
                            onChange={e => handleUpdateRegion(idx, 'climate', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/40">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Besonderheiten</label>
                          <input
                            type="text"
                            value={region.features}
                            onChange={e => handleUpdateRegion(idx, 'features', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Gefahren</label>
                          <input
                            type="text"
                            value={region.threats}
                            onChange={e => handleUpdateRegion(idx, 'threats', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Ressourcen</label>
                          <input
                            type="text"
                            value={region.resources}
                            onChange={e => handleUpdateRegion(idx, 'resources', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Bevölkerung</label>
                          <input
                            type="text"
                            value={region.population}
                            onChange={e => handleUpdateRegion(idx, 'population', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Markers */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-compass text-emerald-400"></i> Regionale POIs ({world.regionMarkers?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMarker(!showAddMarker)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                <i className="fa-solid fa-plus mr-1"></i> POI hinzufügen
              </button>
            </div>

            {showAddMarker && (
              <form onSubmit={handleAddMarker} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Neuen Erkundungspunkt setzen</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Typ</label>
                    <select
                      value={newMarker.type}
                      onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                    >
                      <option value="Wald">🌲 Wald</option>
                      <option value="Gebirgspass">🏔️ Gebirgspass</option>
                      <option value="Inselgruppe">🏝️ Inselgruppe</option>
                      <option value="Ruine">🏛️ Ruine</option>
                      <option value="Tempel">🕍 Tempel</option>
                      <option value="Dungeon">💀 Dungeon</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Name</label>
                    <input
                      type="text"
                      placeholder="Z.B. Finsterforst"
                      value={newMarker.name}
                      onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">X-Koordinate (10-90)</label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={newMarker.x}
                      onChange={(e) => setNewMarker({ ...newMarker, x: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Y-Koordinate (10-90)</label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={newMarker.y}
                      onChange={(e) => setNewMarker({ ...newMarker, y: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Gefahrenstufe</label>
                  <select
                    value={newMarker.hazardLevel}
                    onChange={(e) => setNewMarker({ ...newMarker, hazardLevel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                  >
                    <option value="Sicher">🟢 Sicher</option>
                    <option value="Niedrig">🟡 Niedrig</option>
                    <option value="Mittel">🟠 Mittel</option>
                    <option value="Gefährlich">🔴 Gefährlich</option>
                    <option value="Tödlich">💀 Tödlich</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Beschreibung</label>
                  <textarea
                    placeholder="Welche Mythen oder Ungeheuer hausen hier?"
                    value={newMarker.description}
                    onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none h-12 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddMarker(false)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 select-none">
              {(!world.regionMarkers || world.regionMarkers.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">Keine markierten Erkundungspunkte platziert.</div>
              ) : (
                world.regionMarkers.map((marker, idx) => {
                  let badgeColor = 'bg-slate-950/40 text-slate-400 border-slate-850';
                  let icon = 'fa-solid fa-map-pin';
                  if (marker.type === 'Wald') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    icon = 'fa-solid fa-tree';
                  } else if (marker.type === 'Gebirgspass') {
                    badgeColor = 'bg-slate-950/40 text-slate-200 border-slate-800/40';
                    icon = 'fa-solid fa-mountain';
                  } else if (marker.type === 'Inselgruppe') {
                    badgeColor = 'bg-sky-950/40 text-sky-400 border-sky-800/40';
                    icon = 'fa-solid fa-water';
                  } else if (marker.type === 'Ruine') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    icon = 'fa-solid fa-gavel';
                  } else if (marker.type === 'Tempel') {
                    badgeColor = 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40';
                    icon = 'fa-solid fa-place-of-worship';
                  } else if (marker.type === 'Dungeon') {
                    badgeColor = 'bg-red-950/40 text-red-400 border-red-800/40';
                    icon = 'fa-solid fa-dungeon';
                  }

                  let hazardColor = 'text-green-400';
                  if (marker.hazardLevel === 'Gefährlich' || marker.hazardLevel === 'Tödlich') {
                    hazardColor = 'text-red-400 font-extrabold';
                  } else if (marker.hazardLevel === 'Mittel' || marker.hazardLevel === 'Hoch') {
                    hazardColor = 'text-amber-400';
                  }

                  return (
                    <div 
                      key={`list-reg-marker-${idx}`}
                      className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 hover:border-slate-850 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                          <i className={`${icon} text-[10px] text-slate-400 group-hover:text-emerald-400 transition-colors`}></i>
                          {marker.name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wide uppercase ${badgeColor}`}>
                          {marker.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Karte: [X:{marker.x}, Y:{marker.y}]</span>
                        <span>Gefahr: <span className={hazardColor}>{marker.hazardLevel || 'Mittel'}</span></span>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">
                        {marker.description}
                      </p>

                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleDeleteMarker(idx)}
                          className="text-red-500 hover:text-red-400 text-[10px] flex items-center gap-1"
                        >
                          <i className="fa-solid fa-trash-can text-[9px]"></i> Löschen
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
