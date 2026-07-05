
import React, { useState, useEffect } from 'react';
import { Adventure, GameViewMode, UserProfile } from './types';
import AdventureEditor from './components/AdventureEditor';
import GameView from './components/GameView';
import UserProfileEditor from './components/UserProfileEditor';

const USER_ID = "local-user-123";

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<GameViewMode>(GameViewMode.HOME);
  const [currentAdventure, setCurrentAdventure] = useState<Adventure | null>(null);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : {
        name: '',
        bio: '',
        preferredRole: '',
        appearance: {
          gender: 'Weiblich',
          age: '20',
          build: 'Schlank',
          hairColor: '',
          eyeColor: '',
          cupSize: '-'
        }
      };
    } catch (e) {
      console.error("Failed to parse user profile", e);
      return {
        name: '',
        bio: '',
        preferredRole: '',
        appearance: {
          gender: 'Weiblich',
          age: '20',
          build: 'Schlank',
          hairColor: '',
          eyeColor: '',
          cupSize: '-'
        }
      };
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adventureToDelete, setAdventureToDelete] = useState<string | null>(null);
  const [activeLogbookTab, setActiveLogbookTab] = useState<'character' | 'stats' | 'abilities' | 'inventory' | 'chronicle'>('character');
  const [statsSubTab, setStatsSubTab] = useState<'resources' | 'radar'>('resources');
  const [newWeaponName, setNewWeaponName] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // Initiales Laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adventures');
      if (saved) {
        setAdventures(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Fehler beim Laden der Abenteuer:", e);
      setError("Gespeicherte Abenteuer konnten nicht geladen werden.");
    }
  }, []);

  // Automatisches Speichern bei Änderungen
  useEffect(() => {
    if (adventures.length > 0) {
      try {
        localStorage.setItem('adventures', JSON.stringify(adventures));
        setError(null);
      } catch (e) {
        if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
          setError("Speicher voll! Bitte lösche alte Abenteuer oder verwende kleinere Bilder.");
          console.error("LocalStorage Quota exceeded");
        } else {
          setError("Ein Fehler beim Speichern ist aufgetreten.");
        }
      }
    }
  }, [adventures]);

  const saveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setViewMode(GameViewMode.HOME);
  };

  const saveAdventure = (adventure: Adventure) => {
    const exists = adventures.find(a => a.id === adventure.id);
    let newAdventures;
    if (exists) {
      newAdventures = adventures.map(a => a.id === adventure.id ? adventure : a);
    } else {
      newAdventures = [adventure, ...adventures];
    }
    
    try {
      localStorage.setItem('adventures_temp', JSON.stringify(newAdventures));
      localStorage.removeItem('adventures_temp');
      setAdventures(newAdventures);
      setCurrentAdventure(adventure);
      setViewMode(GameViewMode.PLAY);
      setError(null);
    } catch (e) {
      setError("Speicherplatz reicht nicht aus für dieses Abenteuer (Bilder zu groß?).");
    }
  };

  const updateAdventure = (updatedAdv: Adventure) => {
    setAdventures(prev => prev.map(a => a.id === updatedAdv.id ? updatedAdv : a));
    setCurrentAdventure(updatedAdv);
  };

  const deleteAdventure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdventureToDelete(id);
  };

  const confirmDelete = () => {
    if (!adventureToDelete) return;
    const filtered = adventures.filter(a => a.id !== adventureToDelete);
    setAdventures(filtered);
    localStorage.setItem('adventures', JSON.stringify(filtered));
    if (currentAdventure?.id === adventureToDelete) setCurrentAdventure(null);
    setAdventureToDelete(null);
    setError(null);
  };

  const handleEditWorld = (adv: Adventure, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAdventure(adv);
    setViewMode(GameViewMode.EDIT_WORLD);
  };

  const handleJoinWithCustomChar = (adv: Adventure) => {
    setCurrentAdventure(adv);
    setViewMode(GameViewMode.JOIN_CUSTOM_CHAR);
  };

  // Filter-Logik für die Suche
  const matchesSearch = (adv: Adventure) => {
    const term = searchTerm.toLowerCase();
    return (
      (adv.world?.title || '').toLowerCase().includes(term) ||
      (adv.world?.description || '').toLowerCase().includes(term) ||
      (adv.world?.era || '').toLowerCase().includes(term) ||
      (adv.player?.name || '').toLowerCase().includes(term)
    );
  };

  const myAdventures = adventures.filter(a => a.authorId === USER_ID && matchesSearch(a));
  const publicLibrary = adventures.filter(a => a.isPublic && a.authorId !== USER_ID && matchesSearch(a));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-slate-950 overflow-x-hidden w-full">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs animate-bounce">
          <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span className="text-xs font-bold">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      )}

      {viewMode === GameViewMode.HOME && (
        <div className="w-full max-w-lg space-y-8 py-10 px-4">
          <header className="text-center space-y-2">
            <h1 className="text-5xl font-fantasy text-amber-500 drop-shadow-lg">AdventureForge</h1>
            <p className="text-slate-400 font-medium italic">Deine Geschichten, deine Helden</p>
          </header>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setCurrentAdventure(null); setViewMode(GameViewMode.CREATE); }}
                className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-2xl group-hover:rotate-12 transition-transform"></i>
                  <span className="block text-sm">Neue Welt</span>
                </div>
              </button>
              
              <button 
                onClick={() => setViewMode(GameViewMode.PROFILE)}
                className="group relative overflow-hidden p-6 rounded-3xl bg-slate-800 text-white font-bold shadow-2xl transition-all hover:scale-[1.02] border border-slate-700"
              >
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
                  <i className="fa-solid fa-user-gear text-2xl text-amber-500"></i>
                  <span className="block text-sm">Mein Profil</span>
                </div>
              </button>
            </div>

            {/* Suchfeld */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <i className={`fa-solid fa-magnifying-glass transition-colors ${searchTerm ? 'text-amber-500' : 'text-slate-500'}`}></i>
              </div>
              <input 
                type="text" 
                placeholder="Suche nach Welten, Helden oder Tags..." 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            {/* Meine Abenteuer */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex justify-between">
                <span>Meine Abenteuer</span>
                <span>{myAdventures.length}</span>
              </h2>
              {myAdventures.length === 0 && (
                <p className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-900 rounded-3xl">
                  {searchTerm ? "Keine Treffer in deinen Abenteuern." : "Noch keine eigenen Welten geschmiedet."}
                </p>
              )}
              {myAdventures.map(adv => (
                <div key={adv.id} onClick={() => { setCurrentAdventure(adv); setViewMode(GameViewMode.PLAY); }} className="group p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20">
                      {adv.player.image ? <img src={adv.player.image} className="w-full h-full object-cover rounded-lg" /> : <i className="fa-solid fa-scroll"></i>}
                    </div>
                    <div>
                      <h3 className="font-fantasy text-slate-200">{adv.world.title}</h3>
                      <div className="flex gap-2 items-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${adv.isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {adv.isPublic ? 'Öffentlich' : 'Privat'}
                        </span>
                        <p className="text-xs text-slate-500">{adv.player.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 relative z-10">
                    <button onClick={(e) => handleEditWorld(adv, e)} className="p-2 text-slate-500 hover:text-amber-500 transition-colors" title="Welt bearbeiten"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={(e) => deleteAdventure(adv.id, e)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Abenteuer löschen"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bibliothek */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Öffentliche Bibliothek</h2>
              {publicLibrary.length === 0 && (
                <p className="text-center py-8 text-slate-600 text-sm italic">
                   {searchTerm ? "Keine Welten gefunden." : "Die Bibliothek ist aktuell leer..."}
                </p>
              )}
              {publicLibrary.map(adv => (
                <div key={adv.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20"><i className="fa-solid fa-earth-europe"></i></div>
                    <div>
                      <h3 className="font-fantasy text-slate-200">{adv.world.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{adv.world.description}</p>
                    </div>
                  </div>
                  <button onClick={() => handleJoinWithCustomChar(adv)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-2">
                    <i className="fa-solid fa-user-plus"></i> Spielen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === GameViewMode.PROFILE && (
        <UserProfileEditor 
          profile={userProfile} 
          onSave={saveProfile} 
          onCancel={() => setViewMode(GameViewMode.HOME)} 
        />
      )}

      {(viewMode === GameViewMode.CREATE || viewMode === GameViewMode.EDIT_WORLD || viewMode === GameViewMode.JOIN_CUSTOM_CHAR) && (
        <AdventureEditor 
          onSave={saveAdventure} 
          onCancel={() => setViewMode(GameViewMode.HOME)}
          initialData={currentAdventure || undefined}
          mode={viewMode}
          userId={USER_ID}
          userProfile={userProfile}
        />
      )}

      {viewMode === GameViewMode.PLAY && currentAdventure && (
        <GameView 
          adventure={currentAdventure} 
          onViewChange={setViewMode} 
          onUpdateAdventure={updateAdventure}
          userProfile={userProfile}
        />
      )}

      {viewMode === GameViewMode.STATUS && currentAdventure && (
        <div className="w-full max-w-lg bg-slate-900 h-screen sm:h-auto sm:rounded-3xl p-6 sm:p-8 border-x sm:border border-slate-800 sm:mt-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-fantasy text-amber-500 flex items-center gap-2">
              <i className="fa-solid fa-book text-2xl text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"></i>
              Logbuch
            </h2>
            <button onClick={() => setViewMode(GameViewMode.PLAY)} className="text-slate-400 hover:text-white p-2 transition-colors duration-150"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>

          {/* RPG Tab Navigation */}
          <div className="grid grid-cols-5 gap-1 mb-6 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveLogbookTab('character')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'character'
                  ? 'bg-gradient-to-b from-amber-500/15 to-amber-600/5 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-user-shield text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Held</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('stats')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'stats'
                  ? 'bg-gradient-to-b from-indigo-500/15 to-indigo-600/5 border-indigo-500/50 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-gem text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Macht</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('abilities')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'abilities'
                  ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-600/5 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-wand-magic-sparkles text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Künste</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('inventory')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'inventory'
                  ? 'bg-gradient-to-b from-sky-500/15 to-sky-600/5 border-sky-500/50 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-briefcase text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Inventar</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('chronicle')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'chronicle'
                  ? 'bg-gradient-to-b from-rose-500/15 to-rose-600/5 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-book-open text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Chronik</span>
            </button>
          </div>

          <div className="space-y-6">
            {activeLogbookTab === 'character' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex gap-4 items-center">
                  {currentAdventure.player.image ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl">
                      <img src={currentAdventure.player.image} alt="Portrait" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-amber-600/20 rounded-2xl flex items-center justify-center text-4xl text-amber-500/50">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-bold text-white">{currentAdventure.player.name}</h4>
                    <p className="text-amber-500">{currentAdventure.player.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs p-5 bg-slate-950 rounded-2xl border border-slate-850">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Alter</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.age || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Statur</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.build || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Geschlecht</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.gender || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Körbchengröße</span>
                    <span className="text-pink-400 font-bold text-sm">{currentAdventure.player.appearance.cupSize || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Haare</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.hairColor || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Augen</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.eyeColor || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Größe</span>
                    <span className="text-slate-200 text-sm">{(currentAdventure.player.appearance as any).height || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Maße</span>
                    <span className="text-slate-200 text-sm">{(currentAdventure.player.appearance as any).measurements || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hintergrund</span>
                  <p className="text-sm text-slate-300 leading-relaxed italic whitespace-pre-line">{currentAdventure.player.bio}</p>
                </div>
              </div>
            )}

            {activeLogbookTab === 'stats' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fa-solid fa-gem text-indigo-400"></i> Macht & Werte (Kampagnen-Skala)
                  </span>
                  
                  {/* Subtab navigation */}
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto">
                    <button
                      onClick={() => setStatsSubTab('resources')}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        statsSubTab === 'resources'
                          ? 'bg-slate-900 border border-slate-700/60 text-indigo-400 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚔️ Ressourcen & Zuordnung
                    </button>
                    <button
                      onClick={() => setStatsSubTab('radar')}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        statsSubTab === 'radar'
                          ? 'bg-slate-900 border border-slate-700/60 text-indigo-400 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📊 Radar-Werte
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const powerLevels = currentAdventure.player.campaignPowerLevels || {};
                    const campaignPowerSettings = currentAdventure.world.campaignPowerSettings || {};
                    
                    // Helper to resolve power values case-insensitively
                    const getPowerLevelData = (name: string) => {
                      const foundEntry = Object.entries(powerLevels).find(
                        ([k]) => k.toLowerCase().trim() === name.toLowerCase().trim()
                      );
                      if (foundEntry) {
                        return {
                          value: foundEntry[1].value ?? 50,
                          potentialMax: foundEntry[1].potentialMax ?? 100,
                          xp: foundEntry[1].xp ?? 0
                        };
                      }
                      
                      const foundSetting = Object.entries(campaignPowerSettings).find(
                        ([k]) => k.toLowerCase().trim() === name.toLowerCase().trim()
                      );
                      if (foundSetting) {
                        const val = foundSetting[1];
                        if (typeof val === 'number') {
                          return { value: Math.floor(val * 0.4), potentialMax: val, xp: 0 };
                        } else if (val && typeof val === 'object') {
                          return { 
                            value: (val as any).min ?? 10, 
                            potentialMax: (val as any).max ?? 100, 
                            xp: 0 
                          };
                        }
                      }
                      return { value: 50, potentialMax: 100, xp: 0 };
                    };

                    if (statsSubTab === 'resources') {
                      // Render Combat Resources & Zuordnungssystem
                      const healthPowerNames = currentAdventure.world.healthPowerNames || [];
                      const healthLabel = currentAdventure.world.healthLabel || 'Gesundheit';
                      
                      let hpValue = 0;
                      let hpMax = 0;
                      
                      if (healthPowerNames.length > 0) {
                        healthPowerNames.forEach(name => {
                          const data = getPowerLevelData(name);
                          hpValue += data.value;
                          hpMax += data.potentialMax;
                        });
                      } else {
                        const isHero = currentAdventure.world.isHeroic !== false;
                        hpMax = isHero ? 150 : 100;
                        if (currentAdventure.world.dramaLevel === 'Hoch') hpMax = 150;
                        else if (currentAdventure.world.dramaLevel === 'Niedrig') hpMax = 75;
                        hpValue = hpMax;
                      }

                      const healthPercentage = Math.min(100, hpMax > 0 ? (hpValue / hpMax) * 100 : 100);

                      // Get other Combat Resources
                      const costResources = currentAdventure.world.costResources || [];
                      const customStatAllocations = currentAdventure.world.customStatAllocations || [];
                      const customResourceMappings = currentAdventure.world.customResourceMappings || [];

                      const getEffectLabel = (effect: string) => {
                        switch (effect) {
                          case 'regen': return '♻️ Regeneration';
                          case 'shield': return '🛡️ Schildbarriere';
                          case 'dmg_buff': return '🔥 Schadens-Verstärkung';
                          case 'cost_reduction': return '📉 Kosten-Reduktion';
                          case 'rage': return '😡 Wut-Multiplikator';
                          case 'evade': return '💨 Ausweich-Bonus';
                          case 'power_source': return '⚡ Alternative Kraftquelle';
                          default: return '✨ Spezialeffekt';
                        }
                      };

                      return (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          {/* Gesundheit Card */}
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="text-red-500 text-sm">❤️</span> {healthLabel} (HP)
                              </span>
                              <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                Kapazität: <span className="text-red-400 font-bold">{hpValue}</span> / {hpMax}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)]" 
                                  style={{ width: `${healthPercentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>Fortschritt zu absolutem Max</span>
                                <span>{Math.round(healthPercentage)}%</span>
                              </div>
                            </div>
                            
                            {healthPowerNames.length > 0 && (
                              <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                <span className="font-semibold text-slate-500">Zugeordnete Parameter:</span> {healthPowerNames.join(' + ')}
                              </div>
                            )}
                          </div>

                          {/* Cost Resources Cards */}
                          {costResources.map(res => {
                            let resValue = res.baseMax ?? 100;
                            let resPotentialMax = res.baseMax ?? 100;

                            const sources: string[] = [];
                            if (res.radarPowerName) {
                              sources.push(res.radarPowerName);
                              const data = getPowerLevelData(res.radarPowerName);
                              resValue += data.value;
                              resPotentialMax += data.potentialMax;
                            }
                            if (res.sourcePowers && res.sourcePowers.length > 0) {
                              res.sourcePowers.forEach(sp => {
                                sources.push(sp);
                                const data = getPowerLevelData(sp);
                                resValue += data.value;
                                resPotentialMax += data.potentialMax;
                              });
                            }

                            const costPercentage = Math.min(100, resPotentialMax > 0 ? (resValue / resPotentialMax) * 100 : 100);

                            return (
                              <div key={res.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="text-cyan-400 text-sm">⚡</span> {res.name}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Kapazität: <span className="text-cyan-400 font-bold">{resValue}</span> / {resPotentialMax}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.3)]" 
                                      style={{ width: `${costPercentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-500">
                                    <span>Skalierung mit Parametern</span>
                                    <span>{Math.round(costPercentage)}%</span>
                                  </div>
                                </div>
                                
                                {sources.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Gespeist durch:</span> {sources.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Custom Resource Mappings Cards (e.g. Qi, Fokus, Wut) */}
                          {customResourceMappings.map(mapping => {
                            let val = mapping.baseMax ?? 100;
                            let max = mapping.baseMax ?? 100;
                            
                            if (mapping.sourcePowers && mapping.sourcePowers.length > 0) {
                              mapping.sourcePowers.forEach(sp => {
                                const data = getPowerLevelData(sp);
                                val += data.value;
                                max += data.potentialMax;
                              });
                            }

                            const percentage = Math.min(100, max > 0 ? (val / max) * 100 : 100);

                            return (
                              <div key={mapping.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-0.5">
                                    <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                      <span className="text-amber-500 text-sm">{mapping.icon || '✨'}</span> {mapping.name}
                                    </span>
                                    <span className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wide block">
                                      {getEffectLabel(mapping.effect)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Kapazität: <span className="text-amber-400 font-bold">{val}</span> / {max}
                                  </span>
                                </div>
                                
                                {mapping.description && (
                                  <p className="text-xs text-slate-400 leading-normal italic">
                                    {mapping.description}
                                  </p>
                                )}
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {mapping.sourcePowers && mapping.sourcePowers.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Speisende Kraftquellen:</span> {mapping.sourcePowers.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Custom Stat Allocations Cards */}
                          {customStatAllocations.map(alloc => {
                            let val = 0;
                            let max = 0;
                            
                            if (alloc.selectedRadarNames && alloc.selectedRadarNames.length > 0) {
                              alloc.selectedRadarNames.forEach(name => {
                                const data = getPowerLevelData(name);
                                val += data.value;
                                max += data.potentialMax;
                              });
                            }

                            const percentage = Math.min(100, max > 0 ? (val / max) * 100 : 100);

                            return (
                              <div key={alloc.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="text-purple-400 text-sm">{alloc.icon || '✊'}</span> {alloc.label}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Wert: <span className="text-purple-400 font-bold">{val}</span> / {max}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(147,51,234,0.3)]" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {alloc.selectedRadarNames && alloc.selectedRadarNames.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Zugeordnete Parameter:</span> {alloc.selectedRadarNames.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {costResources.length === 0 && customResourceMappings.length === 0 && customStatAllocations.length === 0 && (
                            <p className="text-[11px] text-slate-500 italic text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                              Keine weiteren Kampf-Ressourcen oder Zuordnungen definiert. Du kannst sie jederzeit in den Welten-Einstellungen (Schritt 2 von 7) konfigurieren!
                            </p>
                          )}
                        </div>
                      );
                    } else {
                      // Render ONLY configured Radar-Diagramm parameters
                      const keys = Object.keys(powerLevels).filter(key => {
                        return Object.keys(campaignPowerSettings).some(
                          k => k.toLowerCase().trim() === key.toLowerCase().trim()
                        );
                      });

                      if (keys.length === 0) {
                        return (
                          <div className="space-y-3 text-center py-6 bg-slate-950/30 rounded-xl border border-dashed border-slate-850">
                            <p className="text-xs text-slate-500 italic">Keine Kampagnen-Parameter im aktuellen Radar-Diagramm definiert.</p>
                            <p className="text-[10px] text-indigo-400 font-semibold">Tipp: Füge im Welten-Editor (Schritt 2 von 7) Parameter hinzu!</p>
                          </div>
                        );
                      }

                      return keys.map(key => {
                        const item = powerLevels[key];
                        const val = item.value ?? 50;
                        const max = item.potentialMax ?? 100;
                        const xp = item.xp ?? 0;
                        
                        const valuePercentage = Math.min(100, (val / max) * 100);
                        const xpPercentage = Math.min(100, xp);
                        
                        return (
                          <div key={key} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-200">{key}</span>
                              <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                Wert: <span className="text-emerald-400 font-bold">{val}</span> / {max}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Aktuelles Potenzial</span>
                                <span>{Math.round(valuePercentage)}%</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
                                  style={{ width: `${valuePercentage}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-400 items-center">
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-circle-play text-indigo-400 text-[8px]"></i> EP Fortschritt (Erfahrung)
                                </span>
                                <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                  {xp} / 100 EP
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                                  style={{ width: `${xpPercentage}%` }}
                                />
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    const updatedPowerLevels = { ...powerLevels };
                                    const nextXp = (updatedPowerLevels[key].xp ?? 0) + 25;
                                    let nextValue = updatedPowerLevels[key].value ?? 50;
                                    let finalXp = nextXp;
                                    if (finalXp >= 100) {
                                      finalXp = finalXp % 100;
                                      nextValue = Math.min(updatedPowerLevels[key].potentialMax || 100, nextValue + 5);
                                    }
                                    updatedPowerLevels[key] = {
                                      ...updatedPowerLevels[key],
                                      xp: finalXp,
                                      value: nextValue
                                    };
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: {
                                        ...currentAdventure.player,
                                        campaignPowerLevels: updatedPowerLevels
                                      }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-[10px] font-bold text-indigo-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-bolt text-indigo-400"></i> EP sammeln (+25)
                                </button>
                                
                                <button
                                  disabled={xp < 100}
                                  onClick={() => {
                                    const updatedPowerLevels = { ...powerLevels };
                                    const nextValue = Math.min(updatedPowerLevels[key].potentialMax || 100, (updatedPowerLevels[key].value ?? 50) + 5);
                                    updatedPowerLevels[key] = {
                                      ...updatedPowerLevels[key],
                                      xp: Math.max(0, (updatedPowerLevels[key].xp ?? 0) - 100),
                                      value: nextValue
                                    };
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: {
                                        ...currentAdventure.player,
                                        campaignPowerLevels: updatedPowerLevels
                                      }
                                    });
                                  }}
                                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    xp >= 100 
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:brightness-110 border border-emerald-500/30' 
                                      : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  <i className="fa-solid fa-angles-up"></i> Werte steigern (+5)
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </div>
            )}

            {activeLogbookTab === 'abilities' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-500 animate-pulse"></i> Techniken & Fertigkeiten (Progression)
                </span>
                
                <div className="space-y-3">
                  {(() => {
                    const abilities = currentAdventure.player.abilities || [];
                    const techList: any[] = [];
                    abilities.forEach(ability => {
                      if (ability.techniqueList && ability.techniqueList.length > 0) {
                        ability.techniqueList.forEach((t: any) => {
                          techList.push({ ...t, abilityId: ability.id, abilitySource: ability.source });
                        });
                      }
                    });

                    if (techList.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 italic py-4 text-center">Noch keine strukturierten Techniken für diesen Charakter definiert.</p>
                      );
                    }

                    return techList.map((tech, idx) => {
                      const level = tech.level || 1;
                      const maxLevel = tech.maxLevel || 10;
                      const logic = currentAdventure?.world?.techniqueProgressionLogic || tech.progressionLogic || 'ep';
                      
                      return (
                        <div key={tech.id || idx} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3 hover:border-slate-800 transition-all">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">{tech.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">
                                  Lv. {level} / {maxLevel}
                                </span>
                                <button
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, isFavorite: !t.isFavorite } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-amber-400 active:scale-95 transition-all text-xs flex items-center justify-center cursor-pointer"
                                  title={tech.isFavorite ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
                                >
                                  <i className={tech.isFavorite ? "fa-solid fa-star text-amber-400" : "fa-regular fa-star"}></i>
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-400 italic leading-relaxed">{tech.description || 'Keine nähere Beschreibung.'}</p>
                              {tech.abilitySource && (
                                <span className="inline-block text-[9px] text-amber-500/80 font-semibold uppercase tracking-wide">
                                  Quelle: {tech.abilitySource}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-[9.5px] px-2 py-0.5 rounded-full font-extrabold uppercase border bg-slate-900 shrink-0 select-none border-slate-800 text-slate-400">
                              {logic === 'ep' && '⚡ EP'}
                              {logic === 'training' && '🏋️ Training'}
                              {logic === 'milestone' && '🏆 Meilenstein'}
                              {logic === 'static' && '🔒 Statisch'}
                            </span>
                          </div>

                          {logic === 'ep' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>ERFAHRUNGSPUNKTE (XP)</span>
                                <span className="font-mono text-indigo-400">{tech.xp || 0} / {tech.xpNeeded || 100} XP</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.min(100, ((tech.xp || 0) / (tech.xpNeeded || 100)) * 100)}%` }}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const gain = tech.xpGainPerUse || 25;
                                    let nextXp = (tech.xp || 0) + gain;
                                    let nextLvl = level;
                                    const needed = tech.xpNeeded || 100;
                                    if (nextXp >= needed) {
                                      nextXp = nextXp % needed;
                                      nextLvl = Math.min(maxLevel, nextLvl + 1);
                                    }
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, xp: nextXp, level: nextLvl } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-indigo-400 hover:border-indigo-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-bolt"></i> Anwenden & Üben (+{tech.xpGainPerUse || 25} XP)
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'training' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>TRAININGS-EINHEITEN</span>
                                <span className="font-mono text-cyan-400">{tech.trainingProgress || 0} / {tech.trainingRequired || 3} Übungen</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.min(100, ((tech.trainingProgress || 0) / (tech.trainingRequired || 3)) * 100)}%` }}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    let nextProg = (tech.trainingProgress || 0) + 1;
                                    let nextLvl = level;
                                    const req = tech.trainingRequired || 3;
                                    if (nextProg >= req) {
                                      nextProg = 0;
                                      nextLvl = Math.min(maxLevel, nextLvl + 1);
                                    }
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, trainingProgress: nextProg, level: nextLvl } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:border-cyan-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-dumbbell"></i> Aktiv Trainieren (+1 Einheit)
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'milestone' && (
                            <div className="space-y-2 pt-1">
                              <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-slate-300">
                                <span className="font-extrabold text-amber-500 uppercase tracking-wide mr-1 block mb-0.5">🏆 Nächste Bedingung:</span>
                                <span className="italic">"{tech.milestoneRequirement || 'Erreiche den nächsten großen Meilenstein in der Story.'}"</span>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, level: Math.min(maxLevel, level + 1) } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-[10px] font-bold text-amber-500 transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                                >
                                  <i className="fa-solid fa-circle-check"></i> Meilenstein erreicht & Level aufsteigen
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'static' && (
                            <div className="space-y-2 pt-1">
                              {tech.staticCost && (
                                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-slate-300">
                                  <span className="font-extrabold text-indigo-400 uppercase tracking-wide mr-1 block mb-0.5">🔒 Upgrade-Voraussetzung:</span>
                                  <span className="italic">"{tech.staticCost}"</span>
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, level: Math.min(maxLevel, level + 1) } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-[10px] font-bold text-indigo-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-unlock-keyhole"></i> Manuell freischalten / Level aufwerten
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {activeLogbookTab === 'inventory' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-briefcase text-sky-400"></i> Charakter-Inventar & Ausrüstung
                </span>

                {(() => {
                  const structuredInv = currentAdventure.structuredInventory || {};
                  const weapons = structuredInv.weapons || [];
                  const generalItems = structuredInv.generalItems || [];
                  const armor = structuredInv.armor || {};
                  const accessories = structuredInv.accessories || {};
                  const defaultCurrency = currentAdventure.world.title.toLowerCase().includes('one piece') ? 'Berry' : 'Goldstücke';
                  const currencyLabel = structuredInv.currencyLabel ?? defaultCurrency;
                  const moneyValue = structuredInv.money ?? 100;

                  const updateInventoryField = (field: string, value: any) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const newInv = {
                      ...oldInv,
                      [field]: value
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateArmorField = (slot: string, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldArmor = oldInv.armor || {};
                    const newInv = {
                      ...oldInv,
                      armor: {
                        ...oldArmor,
                        [slot]: value
                      }
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateAccessoryField = (slot: string, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldAcc = oldInv.accessories || {};
                    const newInv = {
                      ...oldInv,
                      accessories: {
                        ...oldAcc,
                        [slot]: value
                      }
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const addWeapon = (name: string) => {
                    if (!name.trim()) return;
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = oldInv.weapons || [];
                    const newInv = {
                      ...oldInv,
                      weapons: [...oldWeapons, name.trim()]
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                    setNewWeaponName("");
                  };

                  const removeWeapon = (index: number) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = oldInv.weapons || [];
                    const newInv = {
                      ...oldInv,
                      weapons: oldWeapons.filter((_, i) => i !== index)
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateWeapon = (index: number, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = [...(oldInv.weapons || [])];
                    oldWeapons[index] = value;
                    const newInv = {
                      ...oldInv,
                      weapons: oldWeapons
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const addGeneralItem = (name: string) => {
                    if (!name.trim()) return;
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = oldInv.generalItems || [];
                    const newInv = {
                      ...oldInv,
                      generalItems: [...oldItems, name.trim()]
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                    setNewItemName("");
                  };

                  const removeGeneralItem = (index: number) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = oldInv.generalItems || [];
                    const newInv = {
                      ...oldInv,
                      generalItems: oldItems.filter((_, i) => i !== index)
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateGeneralItem = (index: number, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = [...(oldInv.generalItems || [])];
                    oldItems[index] = value;
                    const newInv = {
                      ...oldInv,
                      generalItems: oldItems
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  return (
                    <div className="space-y-6">
                      {/* Geld & Vermögen Card */}
                      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                            <i className="fa-solid fa-coins text-amber-500"></i> Vermögen & Finanzen
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-sm animate-pulse">
                            {moneyValue} {currencyLabel}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Betrag</label>
                            <input
                              type="number"
                              value={moneyValue}
                              onChange={(e) => updateInventoryField('money', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all font-mono font-bold"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Währung (z.B. Berry, Gold)</label>
                            <input
                              type="text"
                              placeholder="z.B. Berry, Gold"
                              value={currencyLabel}
                              onChange={(e) => updateInventoryField('currencyLabel', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kleidung / Rüstung & Schmuck/Accessoires side-by-side on md, stacked on mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kleidung & Rüstung */}
                        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                          <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <i className="fa-solid fa-shirt"></i> Kleidung & Rüstung
                          </h5>
                          
                          {/* Kopf */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-hat-cowboy text-slate-600"></i> Kopf
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.head || 'Keine'}</span>
                          </div>

                          {/* Brust/Torso */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-vest text-slate-600"></i> Brust / Torso
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.chest || 'Keine'}</span>
                          </div>

                          {/* Hände */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-hand text-slate-600"></i> Hände
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.hands || 'Keine'}</span>
                          </div>

                          {/* Beine */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-socks text-slate-600"></i> Beine
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.legs || 'Keine'}</span>
                          </div>

                          {/* Füße */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-shoe-prints text-slate-600"></i> Füße
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.feet || 'Keine'}</span>
                          </div>
                        </div>

                        {/* Schmuck & Accessoires */}
                        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                          <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <i className="fa-solid fa-gem"></i> Schmuck & Accessoires
                          </h5>
                          
                          {/* Finger */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-ring text-slate-600"></i> Finger
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.finger || 'Keine'}</span>
                          </div>

                          {/* Hals */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-gem text-slate-600"></i> Hals
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.neck || 'Keine'}</span>
                          </div>

                          {/* Handgelenke */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-clock text-slate-600"></i> Handgelenke
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.wrist || 'Keine'}</span>
                          </div>

                          {/* Taille */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-ring text-slate-600"></i> Taille
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.waist || 'Keine'}</span>
                          </div>

                          {/* Rücken */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-shield text-slate-600"></i> Rücken
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.back || 'Keine'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Waffen (Weapons) */}
                      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                        <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <i className="fa-solid fa-hand-fist"></i> Waffen / Bewaffnung
                        </h5>

                        {weapons.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {weapons.map((wpn, idx) => (
                              <span key={`weapon-${idx}`} className="px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                                <i className="fa-solid fa-shield-halved text-sky-500 text-[10px]"></i>
                                {wpn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic py-2 text-center">Keine Waffen ausgerüstet.</p>
                        )}
                      </div>

                      {/* Gegenstände (General Items) */}
                      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                        <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <i className="fa-solid fa-box-open"></i> Sonstige Gegenstände (Tasche)
                        </h5>

                        {generalItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {generalItems.map((itm, idx) => (
                              <span key={`item-${idx}`} className="px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                                <i className="fa-solid fa-briefcase text-emerald-500 text-[10px]"></i>
                                {itm}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic py-2 text-center">Tasche ist leer.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeLogbookTab === 'chronicle' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-feather-pointed text-rose-400"></i> Bisherige Chronik (Dynamische Erinnerung)
                </span>
                {currentAdventure.summaryLog ? (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-5 rounded-2xl border border-slate-850 italic shadow-inner">
                    {currentAdventure.summaryLog}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    Noch keine Chronik aufgezeichnet. Bestreite Abenteuer, damit die KI hier Zusammenfassungen einträgt!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bestätigungsmodal für das Löschen von Abenteuern */}
      {adventureToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 mx-auto mb-2 text-xl">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-white font-fantasy">Abenteuer löschen?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Möchtest du dieses Abenteuer wirklich unwiderruflich löschen? Dein Charakterfortschritt und die gesamte Chronik gehen dabei verloren.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setAdventureToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-bold transition-all text-xs border border-slate-700/60"
              >
                Nein, behalten
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20"
              >
                <i className="fa-solid fa-trash-can"></i> Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
