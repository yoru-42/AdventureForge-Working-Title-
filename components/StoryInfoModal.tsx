import React, { useState, useMemo } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Heart, 
  Target, 
  Swords, 
  Package, 
  Sparkles, 
  Shield, 
  Zap, 
  Scroll, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  BookmarkPlus, 
  Trash2, 
  CheckSquare, 
  Square,
  Building,
  Users,
  Compass,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Adventure, StoryEntityItem, StoryInfoState, LoreEntry } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface StoryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onPromoteEntityToCodex: (entity: StoryEntityItem) => void;
  onPromoteMultipleToCodex: (entities: StoryEntityItem[]) => void;
  onDismissEntity: (entityId: string) => void;
  onUpdateNotes?: (notes: string) => void;
}

export const StoryInfoModal: React.FC<StoryInfoModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onPromoteEntityToCodex,
  onPromoteMultipleToCodex,
  onDismissEntity,
  onUpdateNotes
}) => {
  const [expandedEntityIds, setExpandedEntityIds] = useState<Record<string, boolean>>({});
  const [selectedEntityIds, setSelectedEntityIds] = useState<Record<string, boolean>>({});
  const [showPromotedHistory, setShowPromotedHistory] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'temporary' | 'promoted'>('overview');
  const [storyNotes, setStoryNotes] = useState<string>(
    adventure.summaryLog || ''
  );

  if (!isOpen) return null;

  const player = adventure.player;
  const world = adventure.world;
  const storyState = adventure.storyState;

  // Derive current location
  const currentLocationName = storyState?.currentLocationName || 
    world.startLocationName || 
    (world.locations && world.locations.length > 0 ? world.locations[0].name : 'Unbekannter Ort');
  
  const currentTerritoryName = storyState?.currentTerritoryName || 
    (world.territories && world.territories.length > 0 ? world.territories[0].name : 'Unbekanntes Gebiet');

  // Filter pending vs promoted entities
  const allStoryEntities = storyState?.storyEntities || [];
  const pendingEntities = useMemo(() => {
    return allStoryEntities.filter(e => !e.promotedToCodex);
  }, [allStoryEntities]);

  const promotedEntities = useMemo(() => {
    return allStoryEntities.filter(e => e.promotedToCodex);
  }, [allStoryEntities]);

  const toggleExpand = (id: string) => {
    setExpandedEntityIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectEntity = (id: string) => {
    setSelectedEntityIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const allSelected = pendingEntities.every(e => selectedEntityIds[e.id]);
    const nextState: Record<string, boolean> = {};
    if (!allSelected) {
      pendingEntities.forEach(e => {
        nextState[e.id] = true;
      });
    }
    setSelectedEntityIds(nextState);
  };

  const handlePromoteSelected = () => {
    const selectedList = pendingEntities.filter(e => selectedEntityIds[e.id]);
    if (selectedList.length === 0) return;
    onPromoteMultipleToCodex(selectedList);
    setSelectedEntityIds({});
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStoryNotes(e.target.value);
    if (onUpdateNotes) {
      onUpdateNotes(e.target.value);
    }
  };

  const getCategoryIcon = (category: string) => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('char') || catLower.includes('person')) return <User className="w-4 h-4 text-sky-400" />;
    if (catLower.includes('gegner') || catLower.includes('feind') || catLower.includes('monster')) return <Swords className="w-4 h-4 text-rose-400" />;
    if (catLower.includes('ort') || catLower.includes('gebiet') || catLower.includes('weltkarte')) return <MapPin className="w-4 h-4 text-emerald-400" />;
    if (catLower.includes('frakt') || catLower.includes('gild')) return <Shield className="w-4 h-4 text-amber-400" />;
    if (catLower.includes('gegenst') || catLower.includes('waff') || catLower.includes('item')) return <Package className="w-4 h-4 text-purple-400" />;
    if (catLower.includes('fähig') || catLower.includes('kraft') || catLower.includes('techn')) return <Zap className="w-4 h-4 text-cyan-400" />;
    if (catLower.includes('quest') || catLower.includes('story') || catLower.includes('ereignis')) return <Scroll className="w-4 h-4 text-yellow-400" />;
    if (catLower.includes('bezieh')) return <Heart className="w-4 h-4 text-pink-400" />;
    if (catLower.includes('ziel')) return <Target className="w-4 h-4 text-indigo-400" />;
    return <Sparkles className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Story-Info & Temporäre Story-Daten
              </h2>
              <p className="text-xs text-slate-400">
                Aktueller Stand der laufenden Geschichte. Nichts wird ohne Ihre Bestätigung in den Codex geschrieben.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            Aktuelle Übersicht
          </button>

          <button
            onClick={() => setActiveTab('temporary')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'temporary'
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Neue Story-Inhalte
            {pendingEntities.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingEntities.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('promoted')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'promoted'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            Codex-Übernahmen
            {promotedEntities.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {promotedEntities.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Grid: Protagonist & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Protagonist Box */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-sky-400 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                    <User className="w-4 h-4" />
                    <span>Protagonist & Zustand</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{player.name || 'Unbenannter Held'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {player.role || player.jobTitle || 'Abenteurer'}
                    </p>
                  </div>
                  {player.bio && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 line-clamp-3">
                      {player.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                      Rolle: {player.role || 'Abenteurer'}
                    </span>
                    {(player.appearance as any)?.condition && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-300 border border-amber-800/40">
                        Zustand: {(player.appearance as any).condition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Box */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                    <MapPin className="w-4 h-4" />
                    <span>Aktueller Aufenthaltsort</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{currentLocationName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gebiet / Territorium: <span className="text-emerald-300 font-medium">{currentTerritoryName}</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                    <p><span className="text-slate-400">Welt:</span> {world.title || 'Hauptwelt'}</p>
                    <p><span className="text-slate-400">Epoche:</span> {world.era || 'Standard'}</p>
                  </div>
                </div>

              </div>

              {/* Goals & Situation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active Goals */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-indigo-400 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                    <Target className="w-4 h-4" />
                    <span>Aktuelle Ziele & Quests</span>
                  </div>
                  {storyState?.activeGoals && storyState.activeGoals.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-200">
                      {storyState.activeGoals.map((goal, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Keine expliziten Ziele in der laufenden Geschichte erfasst.</p>
                  )}
                </div>

                {/* Situation */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-400 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                    <Swords className="w-4 h-4" />
                    <span>Aktuelle Situation / Lage</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 min-h-[70px]">
                    {storyState?.activeSituation || 'Die Szene verläuft ruhig. Keine unmittelbaren Bedrohungen gemeldet.'}
                  </p>
                </div>

              </div>

              {/* Relationships */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-pink-400 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                  <Heart className="w-4 h-4" />
                  <span>Relevante Beziehungen der Geschichte</span>
                </div>
                {storyState?.relationships && storyState.relationships.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {storyState.relationships.map((rel, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200">{rel.fromName}</span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span className="font-semibold text-slate-200">{rel.toName}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-pink-950/40 text-pink-300 border border-pink-800/30">
                          {rel.relationType}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Keine gesonderten Beziehungsänderungen im Story-State verzeichnet.</p>
                )}
              </div>

              {/* Story Notes Scratchpad */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-slate-300 font-medium text-xs border-b border-slate-800/80 pb-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Temporäre Story-Notizen</span>
                </div>
                <AutoExpandingTextarea
                  value={storyNotes}
                  onChange={handleNotesChange}
                  placeholder="Hier können Sie temporäre Notizen zur Geschichte festhalten..."
                  className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg p-3 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

            </div>
          )}

          {/* TAB 2: TEMPORARY STORY ENTITIES */}
          {activeTab === 'temporary' && (
            <div className="space-y-5">
              
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>{pendingEntities.length}</strong> temporäre KI-Erzeugung(en) in dieser Geschichte
                  </span>
                </div>

                {pendingEntities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      {pendingEntities.every(e => selectedEntityIds[e.id]) ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          Keine auswählen
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                          Alle auswählen
                        </>
                      )}
                    </button>

                    <button
                      onClick={handlePromoteSelected}
                      disabled={!Object.values(selectedEntityIds).some(Boolean)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      Auswahl in Codex übernehmen
                    </button>
                  </div>
                )}
              </div>

              {pendingEntities.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                  <p className="text-sm text-slate-300 font-medium">Keine ausstehenden temporären Story-Inhalte</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Alle in dieser Geschichte entstandenen KI-Einträge wurden bereits geprüft, verarbeitet oder in den permanenten Codex übernommen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingEntities.map((entity, idx) => {
                    const isExpanded = expandedEntityIds[entity.id] || false;
                    const isSelected = selectedEntityIds[entity.id] || false;

                    return (
                      <div
                        key={entity.id ? `pending-ent-${entity.id}-${idx}` : `pending-ent-${idx}`}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md' 
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Left: Checkbox + Icon + Title */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => toggleSelectEntity(entity.id)}
                              className="mt-0.5 text-slate-400 hover:text-indigo-300 transition-colors shrink-0"
                              title="Für Mehrfach-Übernahme auswählen"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </button>

                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                              {getCategoryIcon(entity.category)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-slate-100">{entity.title}</h4>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Neu
                                </span>
                                <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                                  {entity.category}
                                </span>
                              </div>

                              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                                {entity.description}
                              </p>

                              {/* Toggle Expander for Details */}
                              <button
                                onClick={() => toggleExpand(entity.id)}
                                className="mt-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    Weniger Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    Weitere Details...
                                  </>
                                )}
                              </button>

                              {/* Expanded Raw Details */}
                              {isExpanded && entity.details && (
                                <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                                  {Object.entries(entity.details).map(([key, val], dIdx) => (
                                    <div key={`${key}-${dIdx}`} className="flex justify-between border-b border-slate-800/60 pb-1 last:border-0 last:pb-0">
                                      <span className="text-slate-400 font-medium">{key}:</span>
                                      <span className="text-slate-200">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Action Buttons */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                            <button
                              onClick={() => onPromoteEntityToCodex(entity)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                              title="Permanent in den Codex eintragen"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              In Codex übernehmen
                            </button>

                            <button
                              onClick={() => onDismissEntity(entity.id)}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:border-rose-800/50 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition-colors flex items-center gap-1"
                              title="Verwerfen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Verwerfen
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PROMOTED HISTORY */}
          {activeTab === 'promoted' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                <span>
                  Bereits in dieser Geschichte bestätigte und in den permanenten Codex eingetragene Inhalte:
                </span>
              </div>

              {promotedEntities.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-400 italic">Noch keine Story-Inhalte in den Codex übernommen.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promotedEntities.map((entity, idx) => (
                    <div key={entity.id ? `promoted-ent-${entity.id}-${idx}` : `promoted-ent-${idx}`} className="p-3 rounded-lg bg-slate-950/60 border border-emerald-500/20 flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                        {getCategoryIcon(entity.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold text-slate-100 truncate">{entity.title}</h5>
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Im Codex
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{entity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Story-State aktiv: Alle Eingaben bleiben geschützt</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};

export default StoryInfoModal;
