import React, { useState } from 'react';
import { WorldSetting } from '../types';
import { GeminiService } from '../services/geminiService';

interface PlacesManagerProps {
  world: WorldSetting;
  onChangeWorld: (updated: WorldSetting) => void;
  tags: string[];
  isNsfw?: boolean;
}

export const PlacesManager: React.FC<PlacesManagerProps> = ({
  world,
  onChangeWorld,
  tags,
  isNsfw = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom navigation: 'general_text' (Original summaries), 'places_list' (Interactive Places)
  const [subSection, setSubSection] = useState<'general_text' | 'places_list'>('general_text');

  const [activeTab, setActiveTab] = useState<'analysis' | 'cities' | 'houses' | 'taverns' | 'castles' | 'mines' | 'farms'>('analysis');
  const [generationStep, setGenerationStep] = useState<string>('');

  // Manual marker adding states
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'Stadt',
    name: '',
    description: '',
    x: 50,
    y: 50,
    associatedFaction: '',
    inhabitantCount: ''
  });

  // Interactive Place adding states
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '',
    type: 'Stadt',
    population: 'ca. 15.000 Einwohner',
    economy: 'Metallschmieden, Gewürzmarkt',
    merchants: 'Waffenschmied Baldur, Alchemist Zarek',
    guards: '70 Stadtwachen unter Hauptmann Karr',
    faction: 'Königshaus Eldoria',
    prosperity: 'Reich',
    crime: 'Niedrig',
    buildings: [] as Array<{name: string, type: string, owner: string, function: string}>
  });

  // State to add a building to a selected place index
  const [selectedPlaceIdx, setSelectedPlaceIdx] = useState<number | null>(null);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [newBuilding, setNewBuilding] = useState({
    name: 'Zum tänzelnden Einhorn',
    type: 'Taverne',
    owner: 'Gunter der Wirt',
    function: 'Ausschank, Gerüchtebörse, Gästezimmer'
  });

  const handleGeneratePlaces = async () => {
    setIsGenerating(true);
    setError(null);

    const steps = [
      'Scanne Topologie & Zivilisationsgrenzen...',
      'Entwerfe pulsierende Handelsmetropolen & Städte...',
      'Erbauer abgelegene Magiertürme & Hütten (Häuser)...',
      'Errichte gemütliche Wirtshäuser & Tavernen...',
      'Konstruiere herrschaftliche Sitze & trutzige Burgen...',
      'Grabe tiefe Stollen & Edelsteinminen...',
      'Säe fruchtbares Ackerland & Bauernhöfe...',
      'Verfasse die soziokulturellen Berichte...'
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
      const result = await GeminiService.generatePlaces(
        world.title,
        world.description,
        tags,
        world.physicalGeography,
        world.terrains || [],
        world.civilization || {},
        world.regions || {},
        isNsfw
      );

      if (result && result.places && result.placeMarkers) {
        const defaultPlacesList = [
          {
            name: "Eldorstolz",
            type: "Stadt",
            population: "ca. 25.000 Seelen",
            economy: "Haupthandelspunkt für Rüstungen, Gewürze und Tuchwaren",
            merchants: "Händlergilde von Solas, Gnomischer Geldwechsler Barnaby",
            guards: "Eldorische Garde (200 schwere Fußsoldaten)",
            faction: "Kaiserreich Eldoria",
            prosperity: "Sehr hoch",
            crime: "Moderat",
            buildings: [
              {
                name: "Goldener Falke",
                type: "Gasthaus / Taverne",
                owner: "Inke die Witwe",
                function: "Unterkunft für Adlige und Boten"
              },
              {
                name: "Eisenkammer",
                type: "Waffenschmiede",
                owner: "Meisterschmied Baldur",
                function: "Liefert Rüstungen an die Garde"
              }
            ]
          }
        ];

        onChangeWorld({
          ...world,
          places: {
            ...result.places,
            placesList: world.places?.placesList || defaultPlacesList
          },
          placeMarkers: result.placeMarkers
        });
      } else {
        throw new Error('Ungültiges Antwortformat von der KI erhalten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler bei der Generierung der Orte.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleDeleteMarker = (idx: number) => {
    const updated = [...(world.placeMarkers || [])];
    updated.splice(idx, 1);
    onChangeWorld({
      ...world,
      placeMarkers: updated
    });
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.name.trim()) return;

    const updated = [...(world.placeMarkers || []), { ...newMarker }];
    onChangeWorld({
      ...world,
      placeMarkers: updated
    });

    setNewMarker({
      type: 'Stadt',
      name: '',
      description: '',
      x: 50,
      y: 50,
      associatedFaction: '',
      inhabitantCount: ''
    });
    setShowAddMarker(false);
  };

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlace.name.trim()) return;

    const currentList = world.places?.placesList || [];
    const updated = [...currentList, { ...newPlace }];

    onChangeWorld({
      ...world,
      places: {
        ...(world.places || {}),
        placesList: updated
      }
    });

    setNewPlace({
      name: '',
      type: 'Stadt',
      population: '',
      economy: '',
      merchants: '',
      guards: '',
      faction: '',
      prosperity: 'Mittel',
      crime: 'Niedrig',
      buildings: []
    });
    setShowAddPlace(false);
  };

  const handleDeletePlace = (idx: number) => {
    const currentList = [...(world.places?.placesList || [])];
    currentList.splice(idx, 1);
    onChangeWorld({
      ...world,
      places: {
        ...(world.places || {}),
        placesList: currentList
      }
    });
    if (selectedPlaceIdx === idx) {
      setSelectedPlaceIdx(null);
    }
  };

  const handleUpdatePlace = (idx: number, key: string, value: any) => {
    const currentList = [...(world.places?.placesList || [])];
    if (currentList[idx]) {
      currentList[idx] = {
        ...currentList[idx],
        [key]: value
      };
      onChangeWorld({
        ...world,
        places: {
          ...(world.places || {}),
          placesList: currentList
        }
      });
    }
  };

  const handleAddBuildingToPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlaceIdx === null) return;

    const currentList = [...(world.places?.placesList || [])];
    const targetPlace = currentList[selectedPlaceIdx];
    if (targetPlace) {
      const bList = targetPlace.buildings || [];
      const updatedBuildings = [...bList, { ...newBuilding }];
      
      currentList[selectedPlaceIdx] = {
        ...targetPlace,
        buildings: updatedBuildings
      };

      onChangeWorld({
        ...world,
        places: {
          ...(world.places || {}),
          placesList: currentList
        }
      });

      setNewBuilding({
        name: '',
        type: 'Laden',
        owner: '',
        function: ''
      });
      setShowAddBuilding(false);
    }
  };

  const handleDeleteBuilding = (pIdx: number, bIdx: number) => {
    const currentList = [...(world.places?.placesList || [])];
    const targetPlace = currentList[pIdx];
    if (targetPlace && targetPlace.buildings) {
      const bList = [...targetPlace.buildings];
      bList.splice(bIdx, 1);
      
      currentList[pIdx] = {
        ...targetPlace,
        buildings: bList
      };

      onChangeWorld({
        ...world,
        places: {
          ...(world.places || {}),
          placesList: currentList
        }
      });
    }
  };

  const updatePlaceField = (key: string, value: string) => {
    onChangeWorld({
      ...world,
      places: {
        ...(world.places || {}),
        [key]: value
      }
    });
  };

  const hasPlaceData = !!world.places;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="places-tab-container">
      {/* Upper Status / Control Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 animate-pulse">
            <i className="fa-solid fa-hotel text-emerald-400"></i> Phase 4 – Städte, Orte &amp; Gebäude
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Siedle intelligente Zivilisationskerne an. Verwalte konkrete Städte, Wirtshäuser, Burgen, Hütten, Minen und Bauernhöfe. Bestimme deren Wirtschaft, Kriminalitätsrate, Schutzwachen und zeichne die darin befindlichen Gebäude mitsamt Eigentümern und Funktionen.
          </p>
        </div>

        <button
          onClick={handleGeneratePlaces}
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
              <span>{hasPlaceData ? 'Orte neu generieren' : 'Orte & Siedlungen generieren'}</span>
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

      {/* Sub-Section Navigation */}
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
          <span>Siedlungsarten &amp; Berichte</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('places_list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'places_list'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-tree-city"></i>
          <span>Orte- &amp; Gebäudeliste ({world.places?.placesList?.length || 0})</span>
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
                  { id: 'cities', label: 'Städte', icon: 'fa-city' },
                  { id: 'houses', label: 'Häuser/Hütten', icon: 'fa-house' },
                  { id: 'taverns', label: 'Wirtshäuser', icon: 'fa-beer-mug-empty' },
                  { id: 'castles', label: 'Burgen', icon: 'fa-chess-rook' },
                  { id: 'mines', label: 'Minen', icon: 'fa-hammer' },
                  { id: 'farms', label: 'Bauernhöfe', icon: 'fa-wheat-awn' }
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
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Soziokulturelle Urbanisierungs-Analyse</label>
                    <textarea
                      value={world.places?.placesAnalysis || ''}
                      onChange={e => updatePlaceField('placesAnalysis', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe, wie Siedlungen strukturiert sind und sich über das Land verteilen..."
                    />
                  </div>
                )}

                {activeTab === 'cities' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Metropolen &amp; Städte</label>
                    <textarea
                      value={world.places?.cities || ''}
                      onChange={e => updatePlaceField('cities', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe gigantische Handelsstädte, Mauern, Gildenviertel..."
                    />
                  </div>
                )}

                {activeTab === 'houses' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Besondere Einzelhäuser &amp; Geheime Magiertürme</label>
                    <textarea
                      value={world.places?.houses || ''}
                      onChange={e => updatePlaceField('houses', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Magierakademien, Einsiedlerhütten, Hexenhäuschen..."
                    />
                  </div>
                )}

                {activeTab === 'taverns' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Bekannte Tavernen, Gasthöfe &amp; Spelunken</label>
                    <textarea
                      value={world.places?.taverns || ''}
                      onChange={e => updatePlaceField('taverns', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Wichtige soziale Treffpunkte, in denen Quests starten..."
                    />
                  </div>
                )}

                {activeTab === 'castles' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Mächtige Trutzburgen &amp; Festungssitze</label>
                    <textarea
                      value={world.places?.castles || ''}
                      onChange={e => updatePlaceField('castles', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Verteidigungsanlagen, fürstliche Residenzen..."
                    />
                  </div>
                )}

                {activeTab === 'mines' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ertragreiche Minen &amp; Fördergebiete</label>
                    <textarea
                      value={world.places?.mines || ''}
                      onChange={e => updatePlaceField('mines', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Gold-, Erz-, Mana- oder Salzkristallförderungsstätten..."
                    />
                  </div>
                )}

                {activeTab === 'farms' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ländliche Bauernhöfe &amp; Mühlen</label>
                    <textarea
                      value={world.places?.farms || ''}
                      onChange={e => updatePlaceField('farms', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-emerald-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Ackerbauhöfe, Weinberge, Viehzuchten..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Interactive Places- & Building List */}
          {subSection === 'places_list' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-city text-emerald-400"></i> Eingetragene Orte &amp; Stützpunkte ({world.places?.placesList?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddPlace(!showAddPlace)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Ort hinzufügen
                </button>
              </div>

              {showAddPlace && (
                <form onSubmit={handleAddPlace} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Neuen Ort eintragen</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ortsname</label>
                      <input
                        type="text"
                        placeholder="Z.B. Taverne zum Keiler"
                        value={newPlace.name}
                        onChange={e => setNewPlace({ ...newPlace, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ortstyp</label>
                      <select
                        value={newPlace.type}
                        onChange={e => setNewPlace({ ...newPlace, type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      >
                        <option value="Stadt">Stadt</option>
                        <option value="Dorf">Dorf</option>
                        <option value="Taverne">Taverne</option>
                        <option value="Burg">Burg</option>
                        <option value="Mine">Mine</option>
                        <option value="Bauernhof">Bauernhof</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Einwohnerzahl</label>
                      <input
                        type="text"
                        placeholder="z.B. ca. 85 Seelen"
                        value={newPlace.population}
                        onChange={e => setNewPlace({ ...newPlace, population: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Wirtschaft</label>
                      <input
                        type="text"
                        placeholder="z.B. Schnapsbrennerei, Handel"
                        value={newPlace.economy}
                        onChange={e => setNewPlace({ ...newPlace, economy: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Wichtige Händler</label>
                      <input
                        type="text"
                        placeholder="z.B. Wirt Barny, Alchemistin Mara"
                        value={newPlace.merchants}
                        onChange={e => setNewPlace({ ...newPlace, merchants: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Stadtwachen / Schutz</label>
                      <input
                        type="text"
                        placeholder="z.B. 2 Milizionäre mit Heugabeln"
                        value={newPlace.guards}
                        onChange={e => setNewPlace({ ...newPlace, guards: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Fraktion / Einfluss</label>
                      <input
                        type="text"
                        placeholder="z.B. Diebesgilde"
                        value={newPlace.faction}
                        onChange={e => setNewPlace({ ...newPlace, faction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Wohlstand</label>
                      <select
                        value={newPlace.prosperity}
                        onChange={e => setNewPlace({ ...newPlace, prosperity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      >
                        <option value="Bettelsauer">💀 Bettelarm</option>
                        <option value="Arm">Arm</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Wohlhabend">Wohlhabend</option>
                        <option value="Reich">Sehr Reich</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Kriminalität</label>
                      <select
                        value={newPlace.crime}
                        onChange={e => setNewPlace({ ...newPlace, crime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                      >
                        <option value="Keine">🟢 Absolut Sicher</option>
                        <option value="Niedrig">🟡 Niedrig</option>
                        <option value="Moderat">🟠 Moderat</option>
                        <option value="Hoch">🔴 Hoch (Gesetzlos)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPlace(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {(!world.places?.placesList || world.places.placesList.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">Keine Orte erfasst. Platziere manuell Orte oder generiere sie oben.</div>
                ) : (
                  world.places.placesList.map((place, idx) => (
                    <div key={`place-item-${idx}`} className={`bg-slate-950/40 p-4 rounded-xl border transition-all space-y-3 relative group ${selectedPlaceIdx === idx ? 'border-emerald-500/60' : 'border-slate-850'}`}>
                      <button
                        type="button"
                        onClick={() => handleDeletePlace(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <i className="fa-solid fa-trash-can mr-1"></i> Löschen
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Ortsname</label>
                          <input
                            type="text"
                            value={place.name}
                            onChange={e => handleUpdatePlace(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 font-extrabold text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Ortstyp</label>
                          <input
                            type="text"
                            value={place.type}
                            onChange={e => handleUpdatePlace(idx, 'type', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Einwohnerzahl</label>
                          <input
                            type="text"
                            value={place.population}
                            onChange={e => handleUpdatePlace(idx, 'population', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wirtschaft</label>
                          <input
                            type="text"
                            value={place.economy}
                            onChange={e => handleUpdatePlace(idx, 'economy', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wichtige Händler</label>
                          <input
                            type="text"
                            value={place.merchants}
                            onChange={e => handleUpdatePlace(idx, 'merchants', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Schutz / Wachen</label>
                          <input
                            type="text"
                            value={place.guards}
                            onChange={e => handleUpdatePlace(idx, 'guards', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Fraktion</label>
                          <input
                            type="text"
                            value={place.faction}
                            onChange={e => handleUpdatePlace(idx, 'faction', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wohlstand</label>
                          <input
                            type="text"
                            value={place.prosperity}
                            onChange={e => handleUpdatePlace(idx, 'prosperity', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Kriminalität</label>
                          <input
                            type="text"
                            value={place.crime}
                            onChange={e => handleUpdatePlace(idx, 'crime', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>

                      {/* Nested Buildings Editor inside each Place */}
                      <div className="pt-3 border-t border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-hotel"></i> Gebäude im Ort ({place.buildings?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlaceIdx(idx);
                              setShowAddBuilding(true);
                            }}
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            <i className="fa-solid fa-plus mr-1"></i> Gebäude eintragen
                          </button>
                        </div>

                        {/* Inline building adder form */}
                        {showAddBuilding && selectedPlaceIdx === idx && (
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-3 animate-in slide-in-from-top-1">
                            <div className="text-[9px] font-bold text-amber-400 uppercase">Gebäude planen</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Gebäudename (z.B. Zum blutigen Dolch)"
                                value={newBuilding.name}
                                onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Gebäudetyp (z.B. Taverne, Magierturm)"
                                value={newBuilding.type}
                                onChange={e => setNewBuilding({ ...newBuilding, type: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Besitzer (z.B. Gunter der Schmied)"
                                value={newBuilding.owner}
                                onChange={e => setNewBuilding({ ...newBuilding, owner: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Funktion (z.B. Waffenreparatur, Questgeber)"
                                value={newBuilding.function}
                                onChange={e => setNewBuilding({ ...newBuilding, function: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddBuilding(false);
                                  setSelectedPlaceIdx(null);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                              >
                                Abbrechen
                              </button>
                              <button
                                type="button"
                                onClick={handleAddBuildingToPlace}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                              >
                                Speichern
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(!place.buildings || place.buildings.length === 0) ? (
                            <div className="text-[10px] text-slate-600 italic">Noch keine markanten Gebäude erfasst.</div>
                          ) : (
                            place.buildings.map((bld, bIdx) => (
                              <div key={`bld-${idx}-${bIdx}`} className="bg-slate-900 p-2 rounded-lg border border-slate-850/60 relative group/bld">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBuilding(idx, bIdx)}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-400 opacity-0 group-hover/bld:opacity-100 transition-opacity text-[10px]"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                                <div className="text-xs font-bold text-slate-200">{bld.name}</div>
                                <div className="text-[10px] text-amber-500">{bld.type} • Besitzer: <span className="text-slate-300 font-semibold">{bld.owner || 'Unbekannt'}</span></div>
                                <p className="text-[10px] text-slate-400 leading-normal mt-1">{bld.function}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Place Markers on the Map */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-location-arrow text-emerald-400"></i> Stadt- &amp; Ortsmarker ({world.placeMarkers?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMarker(!showAddMarker)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                <i className="fa-solid fa-plus mr-1"></i> Marker setzen
              </button>
            </div>

            {showAddMarker && (
              <form onSubmit={handleAddMarker} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Neuen Marker eintragen</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Typ</label>
                    <select
                      value={newMarker.type}
                      onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-emerald-500 outline-none"
                    >
                      <option value="Stadt">Stadt</option>
                      <option value="Haus">Haus/Hütte</option>
                      <option value="Taverne">Taverne</option>
                      <option value="Burg">Burg</option>
                      <option value="Mine">Mine</option>
                      <option value="Bauernhof">Bauernhof</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Name</label>
                    <input
                      type="text"
                      placeholder="Z.B. Drachenhort-Feste"
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
                  <label className="text-[9px] text-slate-400">Zugehöriges Volk/Gilde</label>
                  <input
                    type="text"
                    placeholder="Z.B. Kaiserreich"
                    value={newMarker.associatedFaction}
                    onChange={(e) => setNewMarker({ ...newMarker, associatedFaction: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Beschreibung</label>
                  <textarea
                    placeholder="Erzähle die Legende dieses Ortes..."
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
              {(!world.placeMarkers || world.placeMarkers.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">Keine markierten Siedlungspunkte platziert.</div>
              ) : (
                world.placeMarkers.map((marker, idx) => {
                  let badgeColor = 'bg-slate-950/40 text-slate-400 border-slate-850';
                  let icon = 'fa-solid fa-map-pin';
                  if (marker.type === 'Stadt') {
                    badgeColor = 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40';
                    icon = 'fa-solid fa-city';
                  } else if (marker.type === 'Haus') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    icon = 'fa-solid fa-house';
                  } else if (marker.type === 'Taverne') {
                    badgeColor = 'bg-orange-950/40 text-orange-400 border-orange-800/40';
                    icon = 'fa-solid fa-beer-mug-empty';
                  } else if (marker.type === 'Burg') {
                    badgeColor = 'bg-rose-950/40 text-rose-400 border-rose-800/40';
                    icon = 'fa-solid fa-chess-rook';
                  } else if (marker.type === 'Mine') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    icon = 'fa-solid fa-hammer';
                  } else if (marker.type === 'Bauernhof') {
                    badgeColor = 'bg-lime-950/40 text-lime-400 border-lime-800/40';
                    icon = 'fa-solid fa-wheat-awn';
                  }

                  return (
                    <div 
                      key={`list-plc-marker-${idx}`}
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

                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span>Karte: [X:{marker.x}, Y:{marker.y}]</span>
                        {marker.associatedFaction && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{marker.associatedFaction}</span>
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
