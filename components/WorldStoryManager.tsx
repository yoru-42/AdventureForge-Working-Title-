import React, { useState } from 'react';
import { WorldSetting } from '../types';
import { GeminiService } from '../services/geminiService';

interface WorldStoryManagerProps {
  world: WorldSetting;
  onChangeWorld: (updated: WorldSetting) => void;
  tags: string[];
  isNsfw?: boolean;
}

export const WorldStoryManager: React.FC<WorldStoryManagerProps> = ({
  world,
  onChangeWorld,
  tags,
  isNsfw = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom navigation: 'general_text' (Original summaries), 'chronicles' (Zeitalter, Geschichte, Mythen)
  const [subSection, setSubSection] = useState<'general_text' | 'chronicles'>('general_text');

  const [activeTab, setActiveTab] = useState<'analysis' | 'quests' | 'events' | 'mainStory' | 'sideQuests'>('analysis');
  const [generationStep, setGenerationStep] = useState<string>('');

  // Manual marker adding states
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'Quest',
    name: '',
    description: '',
    x: 50,
    y: 50,
    difficulty: 'Mittel',
    rewards: ''
  });

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    setError(null);

    const steps = [
      'Analysiere Machtgefüge, Fraktionen & Orte...',
      'Entwirfe dramatische Wendepunkte der Hauptstory...',
      'Säe lokale Gerüchte, Quests & Aufgaben...',
      'Schreibe geschichtsträchtige & aktuelle Ereignisse...',
      'Erstelle abwechslungsreiche Nebenquests & Abenteuer...',
      'Erstelle das erzählerische Gesamt-Szenario...'
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
      const result = await GeminiService.generateWorldStory(
        world.title,
        world.description,
        tags,
        world.civilization || {},
        world.places || {},
        world.worldNpcs || {},
        isNsfw
      );

      if (result && result.worldStory && result.worldStoryMarkers) {
        const eraDefault = "Das Dritte Zeitalter des Lichts (Post-Katastrophe)";
        const historyDefault = "Vor 500 Jahren zerriss das Weltenbeben die Landmassen, wodurch Meere neu entstanden und uralte Imperien versanken.";
        const warsDefault = "Der 100-jährige Grenzkrieg um die fruchtbaren Ebenen des Flusses Sirona zwischen Eldoria und den Clans.";
        const disastersDefault = "Das große Beben und der Ausbruch des Schicksalsvulkans Ignis, der den Himmel für ein Jahr verdunkelte.";
        const legendsDefault = "Die Sage von Sir Galahad, der den ersten Frostwurm des Nebelgebirges mit einer Klinge aus flüssigem Sternenlicht bezwang.";
        const heroesDefault = "Lyranna die Flinke, eine rebellische Elfen-Bogenschützin, die die Sklaven der Minen befreite.";
        const ancientEmpiresDefault = "Das versunkene Reich von Valyria, berühmt für hochentwickelte magische Konstrukte.";
        const mythsDefault = "Der Mythos der Welten-Schildkröte, auf deren Panzer die Ozeane ruhen.";
        const timelineDefault = "Jahr 0: Das Weltenbeben • Jahr 120: Gründung Eldorias • Jahr 480: Ausbruch der Kraken-Plage an der Frostküste • Heute: Euer Abenteuer beginnt.";

        onChangeWorld({
          ...world,
          worldStory: {
            ...result.worldStory,
            era: world.worldStory?.era || eraDefault,
            history: world.worldStory?.history || historyDefault,
            wars: world.worldStory?.wars || warsDefault,
            disasters: world.worldStory?.disasters || disastersDefault,
            legends: world.worldStory?.legends || legendsDefault,
            heroes: world.worldStory?.heroes || heroesDefault,
            ancientEmpires: world.worldStory?.ancientEmpires || ancientEmpiresDefault,
            religions: world.worldStory?.religions || world.civilization?.religions || "",
            myths: world.worldStory?.myths || mythsDefault,
            timeline: world.worldStory?.timeline || timelineDefault
          },
          worldStoryMarkers: result.worldStoryMarkers
        });
      } else {
        throw new Error('Ungültiges Antwortformat von der KI erhalten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler bei der Generierung der Geschichten.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleDeleteMarker = (idx: number) => {
    const updated = [...(world.worldStoryMarkers || [])];
    updated.splice(idx, 1);
    onChangeWorld({
      ...world,
      worldStoryMarkers: updated
    });
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.name.trim()) return;

    const updated = [...(world.worldStoryMarkers || []), { ...newMarker }];
    onChangeWorld({
      ...world,
      worldStoryMarkers: updated
    });

    setNewMarker({
      type: 'Quest',
      name: '',
      description: '',
      x: 50,
      y: 50,
      difficulty: 'Mittel',
      rewards: ''
    });
    setShowAddMarker(false);
  };

  const updateStoryField = (key: string, value: string) => {
    onChangeWorld({
      ...world,
      worldStory: {
        ...(world.worldStory || {}),
        [key]: value
      }
    });
  };

  const hasStoryData = !!world.worldStory;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="world-story-tab-container">
      {/* Upper Status / Control Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 animate-pulse">
            <i className="fa-solid fa-book-open text-amber-500"></i> Phase 6 – Weltgeschichte, Quests &amp; Storys
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Erschaffe die historische Tiefe deiner Kampagne. Verwalte Zeitalter, Kriege, historische Katastrophen, Mythen, epische Helden, eine Zeitlinie sowie die konkrete Hauptstory und lokale Nebenquests.
          </p>
        </div>

        <button
          onClick={handleGenerateStory}
          disabled={isGenerating}
          className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border border-amber-500/30"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner animate-spin text-amber-300"></i>
              <span>{generationStep}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
              <span>{hasStoryData ? 'Storys neu generieren' : 'Storys, Quests & Ereignisse generieren'}</span>
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
              ? 'bg-amber-950/40 border-amber-800 text-amber-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Kampagnen-Erzählung &amp; Quests</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('chronicles')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'chronicles'
              ? 'bg-amber-950/40 border-amber-800 text-amber-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-hourglass-half"></i>
          <span>Zeitalter &amp; Chroniken (Eingabefelder)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          
          {subSection === 'general_text' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: 'analysis', label: 'Erzählerischer Fokus', icon: 'fa-magnifying-glass-chart' },
                  { id: 'mainStory', label: 'Hauptstory', icon: 'fa-book' },
                  { id: 'quests', label: 'Quests', icon: 'fa-scroll' },
                  { id: 'sideQuests', label: 'Nebenquests', icon: 'fa-map-signs' },
                  { id: 'events', label: 'Aktuelle Vorfälle', icon: 'fa-bolt' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-amber-600 text-white shadow'
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
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Erzählerische Ausrichtung &amp; Atmosphäre</label>
                    <textarea
                      value={world.worldStory?.storyAnalysis || ''}
                      onChange={e => updateStoryField('storyAnalysis', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Umfassende narratologische Einordnung der Weltstimmung..."
                    />
                  </div>
                )}

                {activeTab === 'mainStory' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Der Rote Faden / Hauptstory</label>
                    <textarea
                      value={world.worldStory?.mainStory || ''}
                      onChange={e => updateStoryField('mainStory', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe den zentralen Konflikt und die Meilensteine deiner Kampagne..."
                    />
                  </div>
                )}

                {activeTab === 'quests' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Quests &amp; Missionen</label>
                    <textarea
                      value={world.worldStory?.quests || ''}
                      onChange={e => updateStoryField('quests', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Wichtige Meilenstein-Quests..."
                    />
                  </div>
                )}

                {activeTab === 'sideQuests' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Nebenquests &amp; Gerüchte</label>
                    <textarea
                      value={world.worldStory?.sideQuests || ''}
                      onChange={e => updateStoryField('sideQuests', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Kleine Aufträge, Schwarze Bretter, Belohnungsgesuche..."
                    />
                  </div>
                )}

                {activeTab === 'events' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Aktuelle Ereignisse &amp; Vorfälle</label>
                    <textarea
                      value={world.worldStory?.events || ''}
                      onChange={e => updateStoryField('events', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Naturkatastrophen, Gildenmorde, Kometen am Himmel..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Chronicles (Zeitalter & Mythen Eingabefelder) */}
          {subSection === 'chronicles' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-100">
              <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-hourglass-half text-amber-500"></i> Zeitalter &amp; Chroniken der Weltgeschichte
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Aktuelles Zeitalter / Epoche</label>
                  <textarea
                    value={world.worldStory?.era || ''}
                    onChange={e => updateStoryField('era', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="z.B. Das Zeitalter des Erwachens, Epoche des Aschensegens..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Weltgeschichte (Kurzform)</label>
                  <textarea
                    value={world.worldStory?.history || ''}
                    onChange={e => updateStoryField('history', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Wichtige historische Etappen, Aufstieg und Zerfall von Kulturen..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Große Kriege &amp; Grenzkonflikte</label>
                  <textarea
                    value={world.worldStory?.wars || ''}
                    onChange={e => updateStoryField('wars', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Der Bruderkrieg, Schlachten um das Goldene Tor..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Katastrophen &amp; Plagen</label>
                  <textarea
                    value={world.worldStory?.disasters || ''}
                    onChange={e => updateStoryField('disasters', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Der große Ascheregen, Ausbruch der blauen Pest, Riss der Leere..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Sagen &amp; Legenden</label>
                  <textarea
                    value={world.worldStory?.legends || ''}
                    onChange={e => updateStoryField('legends', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Vom Jäger, der die Sonne stahl; Der verfluchte Waldläufer..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Große Helden &amp; Schurken</label>
                  <textarea
                    value={world.worldStory?.heroes || ''}
                    onChange={e => updateStoryField('heroes', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="König Aldur, Der Seelenfresser Gargaroth..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Antike Reiche / Versunkene Reiche</label>
                  <textarea
                    value={world.worldStory?.ancientEmpires || ''}
                    onChange={e => updateStoryField('ancientEmpires', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Das Elfenkaiserreich von Valyria, Die verschollene Stadt Atlantis..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Mythen &amp; Glaubenslehren</label>
                  <textarea
                    value={world.worldStory?.myths || ''}
                    onChange={e => updateStoryField('myths', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="Wie die Götter die Magie schufen, Die fünf magischen Mondsteine..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Zeitlinie der Welt (Timeline)</label>
                  <textarea
                    value={world.worldStory?.timeline || ''}
                    onChange={e => updateStoryField('timeline', e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-amber-500 transition-all"
                    placeholder="z.B. vor 1000 Jahren: Erschaffung des Weltensteins • vor 500 Jahren: Das Große Weltenbeben • vor 20 Jahren: Der Sirona-Grenzkrieg..."
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Story Markers */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-scroll text-amber-500"></i> Quest- &amp; Storyknoten ({world.worldStoryMarkers?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMarker(!showAddMarker)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-550 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                <i className="fa-solid fa-plus mr-1"></i> Knoten setzen
              </button>
            </div>

            {showAddMarker && (
              <form onSubmit={handleAddMarker} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Erzählanker platzieren</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Typ</label>
                    <select
                      value={newMarker.type}
                      onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
                    >
                      <option value="Quest">📜 Hauptquest</option>
                      <option value="Nebenquest">🧭 Nebenquest / Event</option>
                      <option value="Geheimnis">🔮 Altes Geheimnis / Lore</option>
                      <option value="Gefahr">⚠️ Unwetter / Weltereignis</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Name</label>
                    <input
                      type="text"
                      placeholder="Z.B. Die gestohlene Krone"
                      value={newMarker.name}
                      onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
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
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
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
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Schwierigkeit</label>
                    <select
                      value={newMarker.difficulty}
                      onChange={(e) => setNewMarker({ ...newMarker, difficulty: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
                    >
                      <option value="Leicht">🟢 Leicht</option>
                      <option value="Mittel">🟡 Mittel</option>
                      <option value="Schwer">🟠 Schwer</option>
                      <option value="Episch">🔴 Episch / Legendär</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Belohnungen</label>
                    <input
                      type="text"
                      placeholder="z.B. Runenklinge, 100g"
                      value={newMarker.rewards}
                      onChange={(e) => setNewMarker({ ...newMarker, rewards: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Beschreibung / Inhalt</label>
                  <textarea
                    placeholder="Wie läuft die Mission ab? Wer gibt den Auftrag?"
                    value={newMarker.description}
                    onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-amber-500 outline-none h-12 resize-none"
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
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-550 text-white text-[10px] font-bold rounded"
                  >
                    Verankern
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 select-none">
              {(!world.worldStoryMarkers || world.worldStoryMarkers.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">Keine Questknoten platziert.</div>
              ) : (
                world.worldStoryMarkers.map((marker, idx) => {
                  let badgeColor = 'bg-slate-950/40 text-slate-400 border-slate-850';
                  let icon = 'fa-solid fa-scroll';
                  if (marker.type === 'Quest') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    icon = 'fa-solid fa-scroll';
                  } else if (marker.type === 'Nebenquest') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    icon = 'fa-solid fa-map-signs';
                  } else if (marker.type === 'Geheimnis') {
                    badgeColor = 'bg-purple-950/40 text-purple-400 border-purple-800/40';
                    icon = 'fa-solid fa-magnifying-glass-sparkles';
                  } else if (marker.type === 'Gefahr') {
                    badgeColor = 'bg-red-950/40 text-red-400 border-red-800/40';
                    icon = 'fa-solid fa-bolt';
                  }

                  let diffColor = 'text-green-400';
                  if (marker.difficulty === 'Episch' || marker.difficulty === 'Schwer') {
                    diffColor = 'text-red-400 font-extrabold';
                  } else if (marker.difficulty === 'Mittel') {
                    diffColor = 'text-amber-400';
                  }

                  return (
                    <div 
                      key={`list-sty-marker-${idx}`}
                      className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 hover:border-slate-850 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                          <i className={`${icon} text-[10px] text-slate-400 group-hover:text-amber-400 transition-colors`}></i>
                          {marker.name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wide uppercase ${badgeColor}`}>
                          {marker.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Karte: [X:{marker.x}, Y:{marker.y}]</span>
                        <span>Stufe: <span className={diffColor}>{marker.difficulty}</span></span>
                      </div>

                      {marker.rewards && (
                        <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-gift"></i> Belohnung: {marker.rewards}
                        </div>
                      )}

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
