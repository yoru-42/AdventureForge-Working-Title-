import React, { useState } from 'react';
import { WorldSetting } from '../types';
import { GeminiService } from '../services/geminiService';

interface CivilizationManagerProps {
  world: WorldSetting;
  onChangeWorld: (updated: WorldSetting) => void;
  tags: string[];
  isNsfw?: boolean;
}

export const CivilizationManager: React.FC<CivilizationManagerProps> = ({
  world,
  onChangeWorld,
  tags,
  isNsfw = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom navigation: 'general_text' (Original summaries), 'cultural_systems' (Rassen, Religionen...), 'countries_list' (Länder)
  const [subSection, setSubSection] = useState<'general_text' | 'cultural_systems' | 'countries_list'>('general_text');
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'countries' | 'factions' | 'infrastructure' | 'settlements'>('analysis');
  const [generationStep, setGenerationStep] = useState<string>('');

  // Manual marker adding states
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'Dorf',
    name: '',
    description: '',
    x: 50,
    y: 50,
    associatedFaction: ''
  });

  // Country adding states
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountry, setNewCountry] = useState({
    name: '',
    capital: '',
    borders: '',
    population: '',
    ruler: '',
    flag: '',
    culture: ''
  });

  const handleGenerateCivilization = async () => {
    setIsGenerating(true);
    setError(null);
    
    const steps = [
      'Analysiere physische Geographie...',
      'Bodenressourcen und Flusssysteme kartieren...',
      'Kulturen und Siedlungsgebiete simulieren...',
      'Grenzverläufe und Reiche definieren...',
      'Handelsstraßen und Häfen verknüpfen...',
      'Schreibe Chroniken der Zivilisation...'
    ];

    let currentStep = 0;
    setGenerationStep(steps[currentStep]);
    
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setGenerationStep(steps[currentStep]);
      }
    }, 1800);

    try {
      const result = await GeminiService.generateCivilization(
        world.title,
        world.description,
        tags,
        world.physicalGeography,
        world.terrains || [],
        isNsfw
      );

      if (result && result.civilization && result.civilizationMarkers) {
        // Prefill default structured properties from generated civilization texts or defaults
        const racesPrefill = "Menschen, Elfen, Zwerge, Orks";
        const culturesPrefill = "Eldorische Ritterorden, Wüstenclans von Shur, Fluss-Nomaden";
        const religionsPrefill = "Der Sonnenkult von Solas, Die Ahnengeister der Urwälder";
        const governmentsPrefill = "Feudalmonarchie, Freie Handelsrepublik, Theokratie";
        const economyPrefill = "Ackerbau, Erzabbau in den Bergen, Hochseehandel";
        const languagesPrefill = "Gemeinsprache, Elbisch, Zwergisches Runenwort";
        const currenciesPrefill = "Goldtaler, Silberkronen, Kupferscherben";

        const generatedCountries = [
          {
            name: "Kaiserreich Eldoria",
            capital: "Eldorstolz",
            borders: "Fluss Sirona im Osten, Nebelberge im Norden",
            population: "ca. 1.200.000",
            ruler: "Kaiser Aldus IV.",
            flag: "Goldener Falke auf purpurnem Grund",
            culture: "Stolz, ritterlich, feudal geprägt"
          }
        ];

        onChangeWorld({
          ...world,
          civilization: {
            ...result.civilization,
            races: world.civilization?.races || racesPrefill,
            cultures: world.civilization?.cultures || culturesPrefill,
            religions: world.civilization?.religions || religionsPrefill,
            governments: world.civilization?.governments || governmentsPrefill,
            economy: world.civilization?.economy || economyPrefill,
            languages: world.civilization?.languages || languagesPrefill,
            currencies: world.civilization?.currencies || currenciesPrefill,
            countriesList: world.civilization?.countriesList || generatedCountries
          },
          civilizationMarkers: result.civilizationMarkers
        });
      } else {
        throw new Error('Ungültiges Antwortformat von der KI erhalten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler bei der Generierung der Zivilisation.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleDeleteMarker = (idx: number) => {
    const updated = [...(world.civilizationMarkers || [])];
    updated.splice(idx, 1);
    onChangeWorld({
      ...world,
      civilizationMarkers: updated
    });
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.name.trim()) return;

    const updated = [...(world.civilizationMarkers || []), { ...newMarker }];
    onChangeWorld({
      ...world,
      civilizationMarkers: updated
    });

    setNewMarker({
      type: 'Dorf',
      name: '',
      description: '',
      x: 50,
      y: 50,
      associatedFaction: ''
    });
    setShowAddMarker(false);
  };

  const handleAddCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.name.trim()) return;

    const currentList = world.civilization?.countriesList || [];
    const updated = [...currentList, { ...newCountry }];

    onChangeWorld({
      ...world,
      civilization: {
        ...(world.civilization || {}),
        countriesList: updated
      }
    });

    setNewCountry({
      name: '',
      capital: '',
      borders: '',
      population: '',
      ruler: '',
      flag: '',
      culture: ''
    });
    setShowAddCountry(false);
  };

  const handleDeleteCountry = (idx: number) => {
    const currentList = [...(world.civilization?.countriesList || [])];
    currentList.splice(idx, 1);
    onChangeWorld({
      ...world,
      civilization: {
        ...(world.civilization || {}),
        countriesList: currentList
      }
    });
  };

  const handleUpdateCountry = (idx: number, key: string, value: string) => {
    const currentList = [...(world.civilization?.countriesList || [])];
    if (currentList[idx]) {
      currentList[idx] = {
        ...currentList[idx],
        [key]: value
      };
      onChangeWorld({
        ...world,
        civilization: {
          ...(world.civilization || {}),
          countriesList: currentList
        }
      });
    }
  };

  const updateCivilizationField = (key: string, value: string) => {
    onChangeWorld({
      ...world,
      civilization: {
        ...(world.civilization || {}),
        [key]: value
      }
    });
  };

  const hasCivData = !!world.civilization;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="civilization-tab-container">
      {/* Upper Status / Control Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 animate-pulse">
            <i className="fa-solid fa-crown text-purple-400"></i> Phase 2 – Zivilisation &amp; Kulturen
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Erschaffe die intelligenten Völker deiner Welt. Definiere Rassen, Kulturen, Fraktionen, Regierungen, Wirtschaft und verwalte die souveränen Länder mit ihren jeweiligen Herrschern, Hauptstädten, Flaggen und Grenzen.
          </p>
        </div>

        <button
          onClick={handleGenerateCivilization}
          disabled={isGenerating}
          className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border border-purple-500/30"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner animate-spin text-purple-300"></i>
              <span>{generationStep}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-purple-300"></i>
              <span>{hasCivData ? 'Zivilisation neu generieren' : 'Zivilisation & Kulturen generieren'}</span>
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

      {/* Sub-Section Navigation bar inside Civilization Manager */}
      <div className="flex border-b border-slate-800 gap-1.5 pb-2">
        <button
          type="button"
          onClick={() => setSubSection('general_text')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'general_text'
              ? 'bg-purple-950/40 border-purple-800 text-purple-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Berichte &amp; Zusammenfassungen</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('cultural_systems')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'cultural_systems'
              ? 'bg-purple-950/40 border-purple-800 text-purple-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-scale-balanced"></i>
          <span>Kulturen &amp; Systeme (Eingabefelder)</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('countries_list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'countries_list'
              ? 'bg-purple-950/40 border-purple-800 text-purple-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-flag"></i>
          <span>Länder &amp; Herrscher ({world.civilization?.countriesList?.length || 0})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sub-tab contents */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Sub-tab 1: Original text fields (Berichte & Zusammenfassungen) */}
          {subSection === 'general_text' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: 'analysis', label: 'Analyse', icon: 'fa-magnifying-glass-chart' },
                  { id: 'countries', label: 'Reiche & Länder', icon: 'fa-landmark' },
                  { id: 'factions', label: 'Fraktionen', icon: 'fa-users-viewfinder' },
                  { id: 'infrastructure', label: 'Grenzen & Wege', icon: 'fa-route' },
                  { id: 'settlements', label: 'Siedlungen', icon: 'fa-tree-city' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
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
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Geopolitische Lageanalyse</label>
                    <textarea
                      value={world.civilization?.civilizationAnalysis || ''}
                      onChange={e => updateCivilizationField('civilizationAnalysis', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Analysiere, warum Zivilisationen an strategischen Punkten wie Flüssen, Pässen oder Inseln entstanden sind..."
                    />
                  </div>
                )}

                {activeTab === 'countries' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Länder, Nationen &amp; Territorien</label>
                      <textarea
                        value={world.civilization?.countries || ''}
                        onChange={e => updateCivilizationField('countries', e.target.value)}
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Beschreibe die souveränen Länder, Territorien und die Geopolitik..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Herrschaftsformen &amp; Königreiche</label>
                      <textarea
                        value={world.civilization?.kingdoms || ''}
                        onChange={e => updateCivilizationField('kingdoms', e.target.value)}
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Beschreibe Dynastien, Herrscherfamilien, Kaiserhöfe oder Regierungsformen..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'factions' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Einflussreiche Fraktionen, Gilden &amp; Bündnisse</label>
                    <textarea
                      value={world.civilization?.factions || ''}
                      onChange={e => updateCivilizationField('factions', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe mächtige Orden, Diebesgilden, Piratenbündnisse oder Magierakademien..."
                    />
                  </div>
                )}

                {activeTab === 'infrastructure' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Grenzen &amp; Barrieren</label>
                      <textarea
                        value={world.civilization?.borders || ''}
                        onChange={e => updateCivilizationField('borders', e.target.value)}
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Erkläre natürliche Barrieren (Flüsse, Gräben, Gebirge) und Befestigungslinien..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Handelsstraßen &amp; Transitkorridore</label>
                      <textarea
                        value={world.civilization?.tradeRoutes || ''}
                        onChange={e => updateCivilizationField('tradeRoutes', e.target.value)}
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Karawanenwege, schiffbare Flusspfade, Seekorridore oder Magieportale..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'settlements' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Machtzentren &amp; Hauptstädte</label>
                      <textarea
                        value={world.civilization?.capitals || ''}
                        onChange={e => updateCivilizationField('capitals', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Sagenhafte Hauptstädte..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Hafenhauptstädte</label>
                      <textarea
                        value={world.civilization?.ports || ''}
                        onChange={e => updateCivilizationField('ports', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Umschlagplätze, Werften und Küstenhäfen..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ländliche Siedlungen &amp; Dörfer</label>
                      <textarea
                        value={world.civilization?.villages || ''}
                        onChange={e => updateCivilizationField('villages', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                        placeholder="Kleinere Bergdörfer, Grenzposten, Abbaukolonien..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Cultural Systems Inputs (Kulturen & Systeme) */}
          {subSection === 'cultural_systems' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-100">
              <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-list-check text-purple-400"></i> Eingabefelder für Völker, Kulturen &amp; Systeme
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Rassen</label>
                  <textarea
                    value={world.civilization?.races || ''}
                    onChange={e => updateCivilizationField('races', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="Menschen, Elfen, Zwerge, Dunkelelfen, Orks, Echsenmenschen..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Hauptkulturen</label>
                  <textarea
                    value={world.civilization?.cultures || ''}
                    onChange={e => updateCivilizationField('cultures', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="z.B. Nomaden der flüsternden Wüste, Die seefahrenden Nordmänner..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Religionen &amp; Kulte</label>
                  <textarea
                    value={world.civilization?.religions || ''}
                    onChange={e => updateCivilizationField('religions', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="Heiliger Orden des Sol, Die fünf Elementargötter, Schattenanbeter..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Regierungsformen</label>
                  <textarea
                    value={world.civilization?.governments || ''}
                    onChange={e => updateCivilizationField('governments', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="Absolutistische Monarchie, Oligarchisches Syndikat, Magokratie..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Wirtschaft &amp; Handel</label>
                  <textarea
                    value={world.civilization?.economy || ''}
                    onChange={e => updateCivilizationField('economy', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="Agrikultur, Manufakturen, Gewürzhandel, Sklavenhandel..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Sprachen</label>
                  <textarea
                    value={world.civilization?.languages || ''}
                    onChange={e => updateCivilizationField('languages', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="Gemeinsprache, Hohelbisch, Tiefe Zwergenrunen, Kehliges Orkisch..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Währungen</label>
                  <textarea
                    value={world.civilization?.currencies || ''}
                    onChange={e => updateCivilizationField('currencies', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-purple-500 transition-all"
                    placeholder="z.B. Goldkronen, Silberlinge, Kupfersplitter, Manakristalle..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Countries List Manager */}
          {subSection === 'countries_list' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-flag text-purple-400"></i> Herrschaftsgebiete &amp; Länder ({world.civilization?.countriesList?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCountry(!showAddCountry)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Staat gründen
                </button>
              </div>

              {showAddCountry && (
                <form onSubmit={handleAddCountry} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-purple-400 uppercase">Neues Reich eintragen</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ländername</label>
                      <input
                        type="text"
                        placeholder="Z.B. Herzogtum Westwall"
                        value={newCountry.name}
                        onChange={e => setNewCountry({ ...newCountry, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Hauptstadt</label>
                      <input
                        type="text"
                        placeholder="Z.B. Westwall-Feste"
                        value={newCountry.capital}
                        onChange={e => setNewCountry({ ...newCountry, capital: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Grenzen</label>
                      <input
                        type="text"
                        placeholder="z.B. Drachenschlucht im Norden"
                        value={newCountry.borders}
                        onChange={e => setNewCountry({ ...newCountry, borders: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Einwohnerzahl</label>
                      <input
                        type="text"
                        placeholder="z.B. ca. 450.000 Seelen"
                        value={newCountry.population}
                        onChange={e => setNewCountry({ ...newCountry, population: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Herrscher</label>
                      <input
                        type="text"
                        placeholder="z.B. Herzog Gerald der Kahle"
                        value={newCountry.ruler}
                        onChange={e => setNewCountry({ ...newCountry, ruler: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Flagge &amp; Banner</label>
                      <input
                        type="text"
                        placeholder="z.B. Silbernes Schwert auf grünem Schild"
                        value={newCountry.flag}
                        onChange={e => setNewCountry({ ...newCountry, flag: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Kultur &amp; Bräuche</label>
                    <textarea
                      placeholder="Traditionell, rachsüchtig, schätzen Handwerkskunst..."
                      value={newCountry.culture}
                      onChange={e => setNewCountry({ ...newCountry, culture: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-purple-500 outline-none h-14"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCountry(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                    >
                      Staat gründen
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(!world.civilization?.countriesList || world.civilization.countriesList.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">Keine Länder eingetragen. Trage manuell welche ein oder generiere sie.</div>
                ) : (
                  world.civilization.countriesList.map((country, idx) => (
                    <div key={`country-${idx}`} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleDeleteCountry(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <i className="fa-solid fa-trash-can mr-1"></i> Löschen
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Land</label>
                          <input
                            type="text"
                            value={country.name}
                            onChange={e => handleUpdateCountry(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 font-extrabold text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Hauptstadt</label>
                          <input
                            type="text"
                            value={country.capital}
                            onChange={e => handleUpdateCountry(idx, 'capital', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Einwohner</label>
                          <input
                            type="text"
                            value={country.population}
                            onChange={e => handleUpdateCountry(idx, 'population', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Herrscher</label>
                          <input
                            type="text"
                            value={country.ruler}
                            onChange={e => handleUpdateCountry(idx, 'ruler', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wappen / Banner</label>
                          <input
                            type="text"
                            value={country.flag}
                            onChange={e => handleUpdateCountry(idx, 'flag', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Grenzen</label>
                          <input
                            type="text"
                            value={country.borders}
                            onChange={e => handleUpdateCountry(idx, 'borders', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>
                      <div className="space-y-0.5 pt-1">
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Kultur</label>
                        <input
                          type="text"
                          value={country.culture}
                          onChange={e => handleUpdateCountry(idx, 'culture', e.target.value)}
                          className="bg-transparent border-b border-slate-800 focus:border-purple-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive List of Civilization Markers on the Map */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-rose-500"></i> Platzierte Orte ({world.civilizationMarkers?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMarker(!showAddMarker)}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                <i className="fa-solid fa-plus mr-1"></i> Ort hinzufügen
              </button>
            </div>

            {showAddMarker && (
              <form onSubmit={handleAddMarker} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-purple-400 uppercase">Neuen Zivilisationspunkt setzen</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Typ</label>
                    <select
                      value={newMarker.type}
                      onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                    >
                      <option value="Hauptstadt">👑 Hauptstadt</option>
                      <option value="Hafen">⚓ Hafen</option>
                      <option value="Dorf">🌲 Dorf</option>
                      <option value="Grenzposten">🛡️ Grenzposten</option>
                      <option value="Handelsstützpunkt">⚖️ Handelsstützpunkt</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Name</label>
                    <input
                      type="text"
                      placeholder="Z.B. Hafentor"
                      value={newMarker.name}
                      onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
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
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
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
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Besitzer / Zugehöriges Reich</label>
                  <input
                    type="text"
                    placeholder="Z.B. Kaiserreich Eldoria"
                    value={newMarker.associatedFaction}
                    onChange={(e) => setNewMarker({ ...newMarker, associatedFaction: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Beschreibung</label>
                  <textarea
                    placeholder="Warum existiert dieser Ort hier?"
                    value={newMarker.description}
                    onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none h-12 resize-none"
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
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 select-none">
              {(!world.civilizationMarkers || world.civilizationMarkers.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">Keine markierten Punkte platziert.</div>
              ) : (
                world.civilizationMarkers.map((marker, idx) => {
                  let badgeColor = 'bg-purple-950/40 text-purple-400 border-purple-800/40';
                  let icon = 'fa-solid fa-city';
                  if (marker.type === 'Hauptstadt') {
                    badgeColor = 'bg-rose-950/40 text-rose-400 border-rose-800/40';
                    icon = 'fa-solid fa-crown';
                  } else if (marker.type === 'Hafen') {
                    badgeColor = 'bg-sky-950/40 text-sky-400 border-sky-800/40';
                    icon = 'fa-solid fa-anchor';
                  } else if (marker.type === 'Dorf') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    icon = 'fa-solid fa-house';
                  } else if (marker.type === 'Grenzposten') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    icon = 'fa-solid fa-shield-halved';
                  } else if (marker.type === 'Handelsstützpunkt') {
                    badgeColor = 'bg-orange-950/40 text-orange-400 border-orange-800/40';
                    icon = 'fa-solid fa-scale-balanced';
                  }

                  return (
                    <div 
                      key={`list-civ-marker-${idx}`}
                      className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                          <i className={`${icon} text-[10px] text-slate-400 group-hover:text-purple-400 transition-colors`}></i>
                          {marker.name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wide uppercase ${badgeColor}`}>
                          {marker.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span>Karte: [X:{marker.x}, Y:{marker.y}]</span>
                        {marker.associatedFaction && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400 font-semibold">{marker.associatedFaction}</span>
                          </>
                        )}
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
