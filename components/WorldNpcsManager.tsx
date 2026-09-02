import React, { useState } from 'react';
import { WorldSetting } from '../types';
import { GeminiService } from '../services/geminiService';

interface WorldNpcsManagerProps {
  world: WorldSetting;
  onChangeWorld: (updated: WorldSetting) => void;
  tags: string[];
  isNsfw?: boolean;
}

export const WorldNpcsManager: React.FC<WorldNpcsManagerProps> = ({
  world,
  onChangeWorld,
  tags,
  isNsfw = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom navigation: 'general_text' (Original summaries), 'npcs_list' (Interactive NPCs), 'monsters_list' (Bestiarium)
  const [subSection, setSubSection] = useState<'general_text' | 'npcs_list' | 'monsters_list'>('general_text');

  const [activeTab, setActiveTab] = useState<'analysis' | 'citizens' | 'merchants' | 'monsters' | 'factions' | 'armies'>('analysis');
  const [generationStep, setGenerationStep] = useState<string>('');

  // Manual marker adding states
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'Einwohner',
    name: '',
    description: '',
    x: 50,
    y: 50,
    dangerLevel: 'Friedlich',
    sizeOrPower: 'Kleine Gruppe'
  });

  // Interactive NPC adding states
  const [showAddNpc, setShowAddNpc] = useState(false);
  const [newNpc, setNewNpc] = useState({
    name: '',
    age: '32',
    gender: 'Männlich',
    race: 'Mensch',
    job: 'Hufschmied',
    personality: 'Gutmütig, schweigsam, treu',
    goals: 'Möchte seine eigene Schmiede vergrößern',
    relationships: 'Befreundet mit dem Wirt Gunter',
    location: 'Eldorstolz, Hauptstraße',
    inventory: 'Schmiedehammer, 5 Silbermünzen, Glücks-Amulett',
    skills: 'Meisterhafte Metallverarbeitung, Zähigkeit',
    faction: 'Keine',
    reputation: 'Beliebt'
  });

  // Interactive Monster adding states
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [newMonster, setNewMonster] = useState({
    name: '',
    spawnArea: 'Tiefen des Nordwalds',
    behavior: 'Lauert Wanderern im Dickicht auf, lichtscheu',
    aggressiveness: 'Hoch',
    packSize: 'Einzelgänger'
  });

  const handleGenerateNpcs = async () => {
    setIsGenerating(true);
    setError(null);

    const steps = [
      'Scanne soziale Milieus & Bevölkerungsdichte...',
      'Entwerfe Bräuche, Kleidung & Lebensalltag (Einwohner)...',
      'Etabliere Handelsgilden, Waren & Märkte (Händler)...',
      'Säe wilde Kreaturen & uralte Plagen (Monster)...',
      'Gründe Bündnisse, Geheimbünde & Religionen (Fraktionen)...',
      'Stelle Truppen & Kriegsheere auf (Armeen)...',
      'Verfasse die soziopolitische Machtanalyse...'
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
      const result = await GeminiService.generateWorldNpcs(
        world.title,
        world.description,
        tags,
        world.civilization || {},
        world.places || {},
        isNsfw
      );

      if (result && result.worldNpcs && result.worldNpcMarkers) {
        const defaultNpcsList = [
          {
            name: "Meisterschmied Baldur",
            age: "52",
            gender: "Männlich",
            race: "Zwerg",
            job: "Waffenschmied",
            personality: "Mürrisch, aber ehrenhaft und präzise",
            goals: "Möchte die perfekte Runenklinge schmieden",
            relationships: "Liefert Schwerter an Hauptmann Karr",
            location: "Waffenschmiede Eldorstolz",
            inventory: "Großer runenverzierter Vorschlaghammer, zwergischer Schnaps",
            skills: "Rüstungsbau, Metallurgische Magie",
            faction: "Gilde der Eisenschmiede",
            reputation: "Weitbekannt für unzerstörbaren Stahl"
          }
        ];

        const defaultMonstersList = [
          {
            name: "Frostwolf",
            spawnArea: "Frostküste & Höhen des Nebelgebirges",
            behavior: "Jagen koordiniert im Rudel, nutzen eisigen Atem",
            aggressiveness: "Sehr Hoch",
            packSize: "Rudel (5-12 Tiere)"
          },
          {
            name: "Steintroll",
            spawnArea: "Schluchten des Nebelgebirges",
            behavior: "Schläft tagsüber als Fels getarnt, jagt nachts",
            aggressiveness: "Mittel-Hoch",
            packSize: "Einzelgänger oder Paar"
          }
        ];

        onChangeWorld({
          ...world,
          worldNpcs: {
            ...result.worldNpcs,
            npcsList: world.worldNpcs?.npcsList || defaultNpcsList,
            monstersList: world.worldNpcs?.monstersList || defaultMonstersList
          },
          worldNpcMarkers: result.worldNpcMarkers
        });
      } else {
        throw new Error('Ungültiges Antwortformat von der KI erhalten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler bei der Generierung der Welt-NPCs.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleDeleteMarker = (idx: number) => {
    const updated = [...(world.worldNpcMarkers || [])];
    updated.splice(idx, 1);
    onChangeWorld({
      ...world,
      worldNpcMarkers: updated
    });
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarker.name.trim()) return;

    const updated = [...(world.worldNpcMarkers || []), { ...newMarker }];
    onChangeWorld({
      ...world,
      worldNpcMarkers: updated
    });

    setNewMarker({
      type: 'Einwohner',
      name: '',
      description: '',
      x: 50,
      y: 50,
      dangerLevel: 'Friedlich',
      sizeOrPower: 'Kleine Gruppe'
    });
    setShowAddMarker(false);
  };

  const handleAddNpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNpc.name.trim()) return;

    const currentList = world.worldNpcs?.npcsList || [];
    const updated = [...currentList, { ...newNpc }];

    onChangeWorld({
      ...world,
      worldNpcs: {
        ...(world.worldNpcs || {}),
        npcsList: updated
      }
    });

    setNewNpc({
      name: '',
      age: '',
      gender: 'Männlich',
      race: 'Mensch',
      job: '',
      personality: '',
      goals: '',
      relationships: '',
      location: '',
      inventory: '',
      skills: '',
      faction: '',
      reputation: ''
    });
    setShowAddNpc(false);
  };

  const handleDeleteNpc = (idx: number) => {
    const currentList = [...(world.worldNpcs?.npcsList || [])];
    currentList.splice(idx, 1);
    onChangeWorld({
      ...world,
      worldNpcs: {
        ...(world.worldNpcs || {}),
        npcsList: currentList
      }
    });
  };

  const handleUpdateNpc = (idx: number, key: string, value: string) => {
    const currentList = [...(world.worldNpcs?.npcsList || [])];
    if (currentList[idx]) {
      currentList[idx] = {
        ...currentList[idx],
        [key]: value
      };
      onChangeWorld({
        ...world,
        worldNpcs: {
          ...(world.worldNpcs || {}),
          npcsList: currentList
        }
      });
    }
  };

  const handleAddMonster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonster.name.trim()) return;

    const currentList = world.worldNpcs?.monstersList || [];
    const updated = [...currentList, { ...newMonster }];

    onChangeWorld({
      ...world,
      worldNpcs: {
        ...(world.worldNpcs || {}),
        monstersList: updated
      }
    });

    setNewMonster({
      name: '',
      spawnArea: '',
      behavior: '',
      aggressiveness: 'Hoch',
      packSize: 'Einzelgänger'
    });
    setShowAddMonster(false);
  };

  const handleDeleteMonster = (idx: number) => {
    const currentList = [...(world.worldNpcs?.monstersList || [])];
    currentList.splice(idx, 1);
    onChangeWorld({
      ...world,
      worldNpcs: {
        ...(world.worldNpcs || {}),
        monstersList: currentList
      }
    });
  };

  const handleUpdateMonster = (idx: number, key: string, value: string) => {
    const currentList = [...(world.worldNpcs?.monstersList || [])];
    if (currentList[idx]) {
      currentList[idx] = {
        ...currentList[idx],
        [key]: value
      };
      onChangeWorld({
        ...world,
        worldNpcs: {
          ...(world.worldNpcs || {}),
          monstersList: currentList
        }
      });
    }
  };

  const updateNpcField = (key: string, value: string) => {
    onChangeWorld({
      ...world,
      worldNpcs: {
        ...(world.worldNpcs || {}),
        [key]: value
      }
    });
  };

  const hasNpcData = !!world.worldNpcs;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="world-npcs-tab-container">
      {/* Upper Status / Control Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 animate-pulse">
            <i className="fa-solid fa-users text-violet-400"></i> Phase 5 – NPCs &amp; Monster-Kreaturen
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hauche deiner Spielwelt echtes Leben ein. Erstelle Charaktere mit Alter, Geschlecht, Rasse, Zielen, Inventar und Fraktionen sowie bösartige Bestien mit speziellem Verhalten, Rudelgröße und Aggressivität.
          </p>
        </div>

        <button
          onClick={handleGenerateNpcs}
          disabled={isGenerating}
          className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border border-violet-500/30"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner animate-spin text-violet-300"></i>
              <span>{generationStep}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-violet-300"></i>
              <span>{hasNpcData ? 'NPCs neu generieren' : 'Einwohner, Monster & Fraktionen generieren'}</span>
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
              ? 'bg-violet-950/40 border-violet-800 text-violet-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Akteure-Übersicht &amp; Berichte</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('npcs_list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'npcs_list'
              ? 'bg-violet-950/40 border-violet-800 text-violet-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-user-gear"></i>
          <span>Personenliste &amp; NPCs ({world.worldNpcs?.npcsList?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubSection('monsters_list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            subSection === 'monsters_list'
              ? 'bg-violet-950/40 border-violet-800 text-violet-400'
              : 'bg-slate-950/20 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-spider"></i>
          <span>Bestiarium (Monster) ({world.worldNpcs?.monstersList?.length || 0})</span>
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
                  { id: 'citizens', label: 'Einwohner', icon: 'fa-user-group' },
                  { id: 'merchants', label: 'Händler', icon: 'fa-scale-balanced' },
                  { id: 'monsters', label: 'Monster/Fauna', icon: 'fa-dragon' },
                  { id: 'factions', label: 'Fraktionen', icon: 'fa-users-line' },
                  { id: 'armies', label: 'Kriegsheere', icon: 'fa-shield-halved' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-violet-600 text-white'
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
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Machtpolitische Gesellschaftsstruktur-Analyse</label>
                    <textarea
                      value={world.worldNpcs?.npcsAnalysis || ''}
                      onChange={e => updateNpcField('npcsAnalysis', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibe gesellschaftliche Machtstrukturen, Kastenwesen, Klassenunterschiede..."
                    />
                  </div>
                )}

                {activeTab === 'citizens' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Kultur &amp; Alltag der Bürger</label>
                    <textarea
                      value={world.worldNpcs?.citizens || ''}
                      onChange={e => updateNpcField('citizens', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Kleidung, typische Namen, Mentalität, Handwerk der Bevölkerung..."
                    />
                  </div>
                )}

                {activeTab === 'merchants' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Handel, Märkte &amp; Warenströme</label>
                    <textarea
                      value={world.worldNpcs?.merchants || ''}
                      onChange={e => updateNpcField('merchants', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Bedeutende Handelsgilden, Importwaren, Zölle..."
                    />
                  </div>
                )}

                {activeTab === 'monsters' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Gefährliche Kreaturen &amp; Raubtiere</label>
                    <textarea
                      value={world.worldNpcs?.monsters || ''}
                      onChange={e => updateNpcField('monsters', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Beschreibung wilder Monster, Bestien, Plagen oder Drachenvorkommen..."
                    />
                  </div>
                )}

                {activeTab === 'factions' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Religiöse Gruppen, Kulte &amp; Bündnisse</label>
                    <textarea
                      value={world.worldNpcs?.factions || ''}
                      onChange={e => updateNpcField('factions', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Glaubensgemeinschaften, fanatische Kulte, Geheimbünde..."
                    />
                  </div>
                )}

                {activeTab === 'armies' && (
                  <div className="space-y-2 animate-in fade-in duration-100">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Militärische Streitkräfte &amp; Söldnerheerlager</label>
                    <textarea
                      value={world.worldNpcs?.armies || ''}
                      onChange={e => updateNpcField('armies', e.target.value)}
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-slate-200 text-xs outline-none focus:border-violet-500 transition-all custom-scrollbar resize-y font-medium leading-relaxed"
                      placeholder="Heeresgrößen, Ausrüstung, Eliteeinheiten, Festungswachen..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Interactive NPCs List */}
          {subSection === 'npcs_list' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-user-group text-violet-400"></i> Schlüsselpersonen &amp; NPCs ({world.worldNpcs?.npcsList?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddNpc(!showAddNpc)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> NPC hinzufügen
                </button>
              </div>

              {showAddNpc && (
                <form onSubmit={handleAddNpc} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-violet-400 uppercase">Neuen Charakter erschaffen</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Charaktername</label>
                      <input
                        type="text"
                        placeholder="Z.B. Meister Alistair"
                        value={newNpc.name}
                        onChange={e => setNewNpc({ ...newNpc, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Alter</label>
                      <input
                        type="text"
                        placeholder="z.B. 44"
                        value={newNpc.age}
                        onChange={e => setNewNpc({ ...newNpc, age: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Geschlecht</label>
                      <input
                        type="text"
                        placeholder="z.B. Weiblich, Divers"
                        value={newNpc.gender}
                        onChange={e => setNewNpc({ ...newNpc, gender: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Rasse</label>
                      <input
                        type="text"
                        placeholder="z.B. Hochelf, Gnom"
                        value={newNpc.race}
                        onChange={e => setNewNpc({ ...newNpc, race: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Beruf</label>
                      <input
                        type="text"
                        placeholder="z.B. Erzmagier der Gilde"
                        value={newNpc.job}
                        onChange={e => setNewNpc({ ...newNpc, job: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ruf / Bekanntheit</label>
                      <input
                        type="text"
                        placeholder="z.B. Gefürchtet, Ehrenhaft"
                        value={newNpc.reputation}
                        onChange={e => setNewNpc({ ...newNpc, reputation: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Aufenthaltsort</label>
                      <input
                        type="text"
                        placeholder="z.B. Hoher Magierturm"
                        value={newNpc.location}
                        onChange={e => setNewNpc({ ...newNpc, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Zugehörige Fraktion</label>
                      <input
                        type="text"
                        placeholder="z.B. Magischer Zirkel"
                        value={newNpc.faction}
                        onChange={e => setNewNpc({ ...newNpc, faction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Persönlichkeit &amp; Charakterzüge</label>
                      <input
                        type="text"
                        placeholder="Kalt, arrogant, hochmütig, schätzt Wein..."
                        value={newNpc.personality}
                        onChange={e => setNewNpc({ ...newNpc, personality: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Hauptziele</label>
                      <input
                        type="text"
                        placeholder="Will verbotene Zauberbücher bergen..."
                        value={newNpc.goals}
                        onChange={e => setNewNpc({ ...newNpc, goals: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Fähigkeiten &amp; Ränge</label>
                      <input
                        type="text"
                        placeholder="Feuermagie (Meister), Verhandlung (Profi)..."
                        value={newNpc.skills}
                        onChange={e => setNewNpc({ ...newNpc, skills: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Inventar</label>
                      <input
                        type="text"
                        placeholder="z.B. Phönix-Federstab, Manatränke"
                        value={newNpc.inventory}
                        onChange={e => setNewNpc({ ...newNpc, inventory: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Beziehungen zu anderen</label>
                    <textarea
                      placeholder="Verhasst mit Alchemist Zarek, untergebener Diener des Kaisers..."
                      value={newNpc.relationships}
                      onChange={e => setNewNpc({ ...newNpc, relationships: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-violet-500 outline-none h-14"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNpc(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl"
                    >
                      Erschaffen
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(!world.worldNpcs?.npcsList || world.worldNpcs.npcsList.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">Keine NPCs erfasst. Trage manuell NPCs ein oder generiere sie oben.</div>
                ) : (
                  world.worldNpcs.npcsList.map((npc, idx) => (
                    <div key={`npc-item-${idx}`} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleDeleteNpc(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <i className="fa-solid fa-trash-can mr-1"></i> Löschen
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">NPC-Name</label>
                          <input
                            type="text"
                            value={npc.name}
                            onChange={e => handleUpdateNpc(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-200 font-extrabold text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Rasse</label>
                          <input
                            type="text"
                            value={npc.race || ''}
                            onChange={e => handleUpdateNpc(idx, 'race', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Geschlecht</label>
                          <input
                            type="text"
                            value={npc.gender || ''}
                            onChange={e => handleUpdateNpc(idx, 'gender', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Beruf</label>
                          <input
                            type="text"
                            value={npc.job || ''}
                            onChange={e => handleUpdateNpc(idx, 'job', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/40">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Ziele</label>
                          <input
                            type="text"
                            value={npc.goals || ''}
                            onChange={e => handleUpdateNpc(idx, 'goals', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Fähigkeiten</label>
                          <input
                            type="text"
                            value={npc.skills || ''}
                            onChange={e => handleUpdateNpc(idx, 'skills', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Inventar</label>
                          <input
                            type="text"
                            value={npc.inventory || ''}
                            onChange={e => handleUpdateNpc(idx, 'inventory', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Aufenthaltsort</label>
                          <input
                            type="text"
                            value={npc.location || ''}
                            onChange={e => handleUpdateNpc(idx, 'location', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Ruf / Status</label>
                          <input
                            type="text"
                            value={npc.reputation || ''}
                            onChange={e => handleUpdateNpc(idx, 'reputation', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Fraktion</label>
                          <input
                            type="text"
                            value={npc.faction || ''}
                            onChange={e => handleUpdateNpc(idx, 'faction', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5 pt-1.5 border-t border-slate-800/20">
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Beziehungen</label>
                        <input
                          type="text"
                          value={npc.relationships || ''}
                          onChange={e => handleUpdateNpc(idx, 'relationships', e.target.value)}
                          className="bg-transparent border-b border-slate-800 focus:border-violet-500 text-slate-300 text-xs outline-none w-full pb-0.5 font-medium"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 3: Bestiarium */}
          {subSection === 'monsters_list' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-spider text-red-400"></i> Bestiarium &amp; Wilde Bedrohungen ({world.worldNpcs?.monstersList?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddMonster(!showAddMonster)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Biest registrieren
                </button>
              </div>

              {showAddMonster && (
                <form onSubmit={handleAddMonster} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-red-400 uppercase">Gefährliches Raubtier erfassen</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Monstername</label>
                      <input
                        type="text"
                        placeholder="Z.B. Schatten-Basilisk"
                        value={newMonster.name}
                        onChange={e => setNewMonster({ ...newMonster, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-red-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Haupt-Spawngebiet</label>
                      <input
                        type="text"
                        placeholder="Z.B. Finsterwald, Sumpfland"
                        value={newMonster.spawnArea}
                        onChange={e => setNewMonster({ ...newMonster, spawnArea: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Rudelgröße</label>
                      <input
                        type="text"
                        placeholder="Z.B. Einzelgänger, Rudel (2-5 Tiere)"
                        value={newMonster.packSize}
                        onChange={e => setNewMonster({ ...newMonster, packSize: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Aggressivität</label>
                      <select
                        value={newMonster.aggressiveness}
                        onChange={e => setNewMonster({ ...newMonster, aggressiveness: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-red-500 outline-none"
                      >
                        <option value="Friedlich">🟢 Friedlich / Fliehend</option>
                        <option value="Defensiv">🟡 Defensiv (Greift nur bei Bedrohung an)</option>
                        <option value="Hoch">🟠 Hoch (Territorial)</option>
                        <option value="Sehr Hoch">🔴 Extrem Aggressiv / Jagend</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Verhalten &amp; Kampfeigenschaften</label>
                    <textarea
                      placeholder="Versteinert Beute mit Blicken, weicht Feuer aus..."
                      value={newMonster.behavior}
                      onChange={e => setNewMonster({ ...newMonster, behavior: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-red-500 outline-none h-14"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMonster(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                    >
                      Biest speichern
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(!world.worldNpcs?.monstersList || world.worldNpcs.monstersList.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">Keine Monster erfasst. Trage manuell Ungetüme ein oder generiere sie oben.</div>
                ) : (
                  world.worldNpcs.monstersList.map((monster, idx) => (
                    <div key={`monster-item-${idx}`} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleDeleteMonster(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <i className="fa-solid fa-trash-can mr-1"></i> Löschen
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Monster</label>
                          <input
                            type="text"
                            value={monster.name || ''}
                            onChange={e => handleUpdateMonster(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-red-500 text-red-400 font-extrabold text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Spawngebiet</label>
                          <input
                            type="text"
                            value={monster.spawnArea || ''}
                            onChange={e => handleUpdateMonster(idx, 'spawnArea', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-red-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Rudelgröße</label>
                          <input
                            type="text"
                            value={monster.packSize || ''}
                            onChange={e => handleUpdateMonster(idx, 'packSize', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-red-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Aggressivität</label>
                          <input
                            type="text"
                            value={monster.aggressiveness || ''}
                            onChange={e => handleUpdateMonster(idx, 'aggressiveness', e.target.value)}
                            className="bg-transparent border-b border-slate-800 focus:border-red-500 text-slate-200 text-xs outline-none w-full pb-0.5"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5 pt-1.5 border-t border-slate-800/20">
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Verhalten &amp; Kampfverhalten</label>
                        <input
                          type="text"
                          value={monster.behavior || ''}
                          onChange={e => handleUpdateMonster(idx, 'behavior', e.target.value)}
                          className="bg-transparent border-b border-slate-800 focus:border-red-500 text-slate-300 text-xs outline-none w-full pb-0.5 font-medium"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Place NPC Markers */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-users-line text-violet-400"></i> Akteure auf der Karte ({world.worldNpcMarkers?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMarker(!showAddMarker)}
                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                <i className="fa-solid fa-plus mr-1"></i> NPC platzieren
              </button>
            </div>

            {showAddMarker && (
              <form onSubmit={handleAddMarker} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-violet-400 uppercase">Gruppe / Akteur verankern</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Typ</label>
                    <select
                      value={newMarker.type || 'Einwohner'}
                      onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                    >
                      <option value="Einwohner">👤 Einwohner / Bürger</option>
                      <option value="Händler">⚖️ Händler / Gilde</option>
                      <option value="Monster">🐉 Monster-Bedrohung</option>
                      <option value="Fraktion">🛡️ Fraktionsbündnis</option>
                      <option value="Armee">⚔️ Truppenlager / Armee</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Name</label>
                    <input
                      type="text"
                      placeholder="Z.B. Die Rote Kohorte"
                      value={newMarker.name || ''}
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
                      value={newMarker.x ?? 50}
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
                      value={newMarker.y ?? 50}
                      onChange={(e) => setNewMarker({ ...newMarker, y: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Gefahr</label>
                    <select
                      value={newMarker.dangerLevel || 'Friedlich'}
                      onChange={(e) => setNewMarker({ ...newMarker, dangerLevel: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                    >
                      <option value="Friedlich">🟢 Friedlich</option>
                      <option value="Vorsichtig">🟡 Vorsichtig</option>
                      <option value="Feindlich">🔴 Aggressiv</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">Heeres-/Gruppengröße</label>
                    <input
                      type="text"
                      placeholder="z.B. ca. 150 Mann"
                      value={newMarker.sizeOrPower || ''}
                      onChange={(e) => setNewMarker({ ...newMarker, sizeOrPower: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 rounded p-1.5 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">Beschreibung</label>
                  <textarea
                    placeholder="Warum agiert diese Truppe / Bedrohung hier?"
                    value={newMarker.description || ''}
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
                    className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 select-none">
              {(!world.worldNpcMarkers || world.worldNpcMarkers.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">Keine platzierten Akteure auf der Karte vorhanden.</div>
              ) : (
                world.worldNpcMarkers.map((marker, idx) => {
                  let badgeColor = 'bg-slate-950/40 text-slate-400 border-slate-850';
                  let icon = 'fa-solid fa-user';
                  if (marker.type === 'Einwohner') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    icon = 'fa-solid fa-user-group';
                  } else if (marker.type === 'Händler') {
                    badgeColor = 'bg-sky-950/40 text-sky-400 border-sky-800/40';
                    icon = 'fa-solid fa-scale-balanced';
                  } else if (marker.type === 'Monster') {
                    badgeColor = 'bg-red-950/40 text-red-400 border-red-800/40';
                    icon = 'fa-solid fa-dragon';
                  } else if (marker.type === 'Fraktion') {
                    badgeColor = 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40';
                    icon = 'fa-solid fa-users-line';
                  } else if (marker.type === 'Armee') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    icon = 'fa-solid fa-shield-halved';
                  }

                  let dangerColor = 'text-green-400';
                  if (marker.dangerLevel === 'Feindlich') {
                    dangerColor = 'text-red-400 font-extrabold';
                  } else if (marker.dangerLevel === 'Vorsichtig') {
                    dangerColor = 'text-amber-400';
                  }

                  return (
                    <div 
                      key={`list-npc-marker-${idx}`}
                      className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 hover:border-slate-850 transition-all space-y-1.5 group"
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

                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Karte: [X:{marker.x}, Y:{marker.y}]</span>
                        <span>Gesinnung: <span className={dangerColor}>{marker.dangerLevel}</span></span>
                      </div>

                      {marker.sizeOrPower && (
                        <div className="text-[9px] text-slate-500 font-semibold">Größe: {marker.sizeOrPower}</div>
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
