import React, { useState, useMemo } from 'react';
import { 
  WorldSetting, 
  LoreEntry, 
  Character, 
  WorldFact, 
  WorldFactConflict, 
  FactSourceType, 
  FactStatus, 
  KnowledgeType,
  RelevantWorldContextResult
} from '../types';
import { WorldKnowledgeService, SOURCE_PRIORITY } from '../services/worldKnowledgeService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { 
  Shield, 
  AlertTriangle, 
  BookOpen, 
  Compass, 
  Search, 
  Filter, 
  History, 
  Check, 
  X, 
  Plus, 
  MapPin, 
  Building2, 
  User, 
  Users, 
  HelpCircle, 
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface WorldKnowledgeManagerProps {
  world: WorldSetting;
  loreDatabase?: LoreEntry[];
  characters?: Character[];
  onUpdateWorld: (updatedWorld: WorldSetting) => void;
}

export const WorldKnowledgeManager: React.FC<WorldKnowledgeManagerProps> = ({
  world,
  loreDatabase = [],
  characters = [],
  onUpdateWorld
}) => {
  const [activeTab, setActiveTab] = useState<'facts' | 'conflicts' | 'context' | 'history'>('facts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPredicate, setFilterPredicate] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Manual Fact Creation State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newPredicate, setNewPredicate] = useState('located_in');
  const [newObjectName, setNewObjectName] = useState('');
  const [newSourceType, setNewSourceType] = useState<FactSourceType>('author');
  const [newKnowledgeType, setNewKnowledgeType] = useState<KnowledgeType>('fact');
  const [newFactStatus, setNewFactStatus] = useState<FactStatus>('known');
  const [newFactConfidence, setNewFactConfidence] = useState<number>(100);
  const [newFactNote, setNewFactNote] = useState('');

  // Context Simulator State
  const [simLocationId, setSimLocationId] = useState<string>(world.startLocationId || world.territories?.[0]?.id || '');
  const [simRadius, setSimRadius] = useState<number>(35);
  const [simTopic, setSimTopic] = useState<string>('');

  // Compiled full fact list
  const allFacts = useMemo(() => {
    return WorldKnowledgeService.getAllWorldFacts(world, loreDatabase, characters);
  }, [world, loreDatabase, characters]);

  // Conflicts list
  const conflicts = useMemo(() => {
    return world.conflicts || [];
  }, [world.conflicts]);

  const unresolvedConflicts = useMemo(() => {
    return conflicts.filter(c => !c.resolved);
  }, [conflicts]);

  // Filtered facts
  const filteredFacts = useMemo(() => {
    return allFacts.filter(f => {
      if (filterPredicate !== 'all' && f.predicate !== filterPredicate) return false;
      if (filterSource !== 'all' && f.sourceType !== filterSource) return false;
      if (filterType !== 'all' && f.knowledgeType !== filterType) return false;
      if (filterStatus !== 'all' && f.status !== filterStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const sName = (f.subjectName || f.subjectId || '').toLowerCase();
        const oName = (f.objectName || f.objectId || String(f.value || '')).toLowerCase();
        const note = (f.note || '').toLowerCase();
        const pred = (f.predicate || '').toLowerCase();
        return sName.includes(q) || oName.includes(q) || note.includes(q) || pred.includes(q);
      }
      return true;
    });
  }, [allFacts, filterPredicate, filterSource, filterType, filterStatus, searchTerm]);

  // Context Simulator Result
  const contextSimulation: RelevantWorldContextResult = useMemo(() => {
    return WorldKnowledgeService.getRelevantWorldContext(
      {
        locationId: simLocationId,
        radius: simRadius,
        topic: simTopic
      },
      world,
      loreDatabase,
      characters
    );
  }, [simLocationId, simRadius, simTopic, world, loreDatabase, characters]);

  // Handlers
  const handleRunFullConsistencyScan = () => {
    const currentFacts = [...(world.facts || [])];
    const newConflicts: WorldFactConflict[] = [];

    // Derive facts and test each against stored facts
    const fullFacts = WorldKnowledgeService.getAllWorldFacts(world, loreDatabase, characters);
    for (let i = 0; i < fullFacts.length; i++) {
      for (let j = i + 1; j < fullFacts.length; j++) {
        const conf = WorldKnowledgeService.checkFactConflict([fullFacts[i]], fullFacts[j]);
        if (conf && !conflicts.some(existing => existing.reason === conf.reason)) {
          newConflicts.push(conf);
        }
      }
    }

    if (newConflicts.length > 0) {
      onUpdateWorld({
        ...world,
        conflicts: [...(world.conflicts || []), ...newConflicts]
      });
      setActiveTab('conflicts');
    }
  };

  const handleResolveConflict = (conflictId: string, resolution: 'keep_existing' | 'accept_proposed' | 'convert_to_rumor') => {
    const updated = WorldKnowledgeService.resolveConflict(world, conflictId, resolution);
    onUpdateWorld(updated);
  };

  const handleSaveManualFact = () => {
    if (!newSubjectName.trim() || !newObjectName.trim()) return;

    const newFact: WorldFact = {
      id: WorldKnowledgeService.generateFactId(newSubjectName.trim(), newPredicate, newObjectName.trim()),
      subjectId: newSubjectName.trim().toLowerCase().replace(/\s+/g, '_'),
      subjectName: newSubjectName.trim(),
      predicate: newPredicate,
      objectId: newObjectName.trim().toLowerCase().replace(/\s+/g, '_'),
      objectName: newObjectName.trim(),
      sourceType: newSourceType,
      status: newFactStatus,
      knowledgeType: newKnowledgeType,
      confidence: newFactConfidence,
      note: newFactNote.trim() || undefined,
      isCurrent: true,
      validFrom: 'Manuell erfasst',
      createdAt: Date.now()
    };

    const res = WorldKnowledgeService.applyConsistencyPipeline(
      world, 
      [newFact], 
      newSourceType, 
      'Manuelle Erfassung durch Autor'
    );

    onUpdateWorld(res.updatedWorld);
    setShowAddModal(false);
    setNewSubjectName('');
    setNewObjectName('');
    setNewFactNote('');
  };

  const handlePromoteToCanon = (fact: WorldFact) => {
    const promoted: WorldFact = {
      ...fact,
      sourceType: 'author',
      status: 'known',
      knowledgeType: 'fact',
      confidence: 100,
      updatedAt: Date.now()
    };

    const res = WorldKnowledgeService.applyConsistencyPipeline(
      world,
      [promoted],
      'author',
      'Fakt als verbindlicher Kanon bestätigt'
    );
    onUpdateWorld(res.updatedWorld);
  };

  const renderSourceBadge = (source: FactSourceType) => {
    switch (source) {
      case 'author':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 rounded border border-amber-700/60">Autor</span>;
      case 'user':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 rounded border border-emerald-700/60">Nutzer</span>;
      case 'established_story':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-950 text-sky-300 rounded border border-sky-700/60">Story-Kanon</span>;
      case 'ai_inference':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-950 text-purple-300 rounded border border-purple-700/60">KI-Inferenz</span>;
      default:
        return null;
    }
  };

  const renderTypeBadge = (kType: KnowledgeType) => {
    switch (kType) {
      case 'fact':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-200 rounded border border-slate-700">Fakt</span>;
      case 'rumor':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-300 rounded border border-rose-800">Gerücht</span>;
      case 'belief':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-950 text-indigo-300 rounded border border-indigo-800">Glaube/Meinung</span>;
      case 'inference':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-950 text-violet-300 rounded border border-violet-800">Inferenz</span>;
      case 'proposal':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 rounded border border-cyan-800">Vorschlag</span>;
      default:
        return null;
    }
  };

  const renderStatusBadge = (status: FactStatus) => {
    switch (status) {
      case 'known':
        return <span className="text-[10px] font-bold text-emerald-400">Bestätigt (Known)</span>;
      case 'implied':
        return <span className="text-[10px] font-bold text-amber-400">Angedeutet (Implied)</span>;
      case 'unknown':
        return <span className="text-[10px] font-bold text-slate-400">Unbekannt (Unknown)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">Kanon- & Fakten-Konsistenz</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Verwaltet gesicherte Fakten, räumliche Geometrie, Besitzverhältnisse und Gerüchte. Etablierter Kanon wird vor stillen KI-Überschreibungen geschützt.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunFullConsistencyScan}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Konsistenz-Scan</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Fakt erfassen</span>
            </button>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Kanon-Fakten</span>
            <span className="text-xl font-bold text-slate-100 mt-0.5 block">{allFacts.filter(f => f.knowledgeType === 'fact').length}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Gerüchte & Vermutungen</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{allFacts.filter(f => f.knowledgeType === 'rumor' || f.knowledgeType === 'inference').length}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Offene Konflikte</span>
            <span className={`text-xl font-bold mt-0.5 block ${unresolvedConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {unresolvedConflicts.length}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Änderungs-Einträge</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{(world.changeLog || []).length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('facts')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'facts' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Fakten & Relationen ({allFacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors relative ${
            activeTab === 'conflicts' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Konflikte & Widersprüche</span>
          {unresolvedConflicts.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold">
              {unresolvedConflicts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'context' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Relevanz- & Kontext-Vorschau</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Änderungsverlauf ({(world.changeLog || []).length})</span>
        </button>
      </div>

      {/* TAB 1: Structured Facts */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Fakten durchsuchen (Subjekt, Prädikat, Wert)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterPredicate}
              onChange={e => setFilterPredicate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="all">Alle Relationen (Prädikate)</option>
              <option value="located_in">located_in (Liegt in)</option>
              <option value="north_of">north_of (Nördlich von)</option>
              <option value="south_of">south_of (Südlich von)</option>
              <option value="east_of">east_of (Östlich von)</option>
              <option value="west_of">west_of (Westlich von)</option>
              <option value="distance_from">distance_from (Distanz)</option>
              <option value="owns">owns (Besitzt Betrieb/Ort)</option>
              <option value="controls">controls (Beherrscht)</option>
              <option value="member_of">member_of (Mitglied von)</option>
              <option value="profession_is">profession_is (Beruf)</option>
              <option value="rumor_about">rumor_about (Gerücht über)</option>
            </select>

            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="all">Alle Quellen</option>
              <option value="author">Autor</option>
              <option value="user">Nutzer</option>
              <option value="established_story">Story-Kanon</option>
              <option value="ai_inference">KI-Inferenz</option>
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="all">Alle Wissensarten</option>
              <option value="fact">Fakt (Bestätigt)</option>
              <option value="rumor">Gerücht (Rumor)</option>
              <option value="belief">Glaube/Meinung (Belief)</option>
              <option value="inference">KI-Inferenz</option>
              <option value="proposal">Vorschlag</option>
            </select>
          </div>

          {/* Facts List */}
          {filteredFacts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">Keine passenden Fakten gefunden</p>
              <p className="text-xs text-slate-500 mt-1">Passe die Filter an oder erfasse einen neuen Fakt manuell.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFacts.map(fact => (
                <div
                  key={fact.id}
                  className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {renderSourceBadge(fact.sourceType)}
                      {renderTypeBadge(fact.knowledgeType)}
                      <span className="text-[10px] text-slate-500 font-mono">Vertrauen: {fact.confidence || 100}%</span>
                    </div>
                    {renderStatusBadge(fact.status)}
                  </div>

                  {/* Subject -> Predicate -> Object statement */}
                  <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400 truncate">
                      <span>{fact.subjectName || fact.subjectId}</span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 shrink-0">
                      {fact.predicate}
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400 truncate text-right">
                      <span>
                        {fact.objectName || fact.objectId || (typeof fact.value === 'object' ? `${fact.value.distKm} km` : String(fact.value || ''))}
                      </span>
                    </div>
                  </div>

                  {fact.note && (
                    <p className="text-[11px] text-slate-400 leading-normal italic">
                      "{fact.note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <span>Gültig: {fact.validFrom || 'Spielstart'}{fact.validTo ? ` bis ${fact.validTo}` : ''}</span>
                    {fact.knowledgeType !== 'fact' && (
                      <button
                        onClick={() => handlePromoteToCanon(fact)}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Als Kanon bestätigen</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Conflicts */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          {conflicts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Keine Fakten-Konflikte erkannt</p>
              <p className="text-xs text-slate-500 mt-1">Die Spielwelt ist konsistent. Etablierte Fakten stimmen mit allen Geometrie- und Lore-Angaben überein.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map(conf => (
                <div 
                  key={conf.id} 
                  className={`border rounded-xl p-4 transition-all ${
                    conf.resolved 
                      ? 'bg-slate-900/40 border-slate-800 opacity-60' 
                      : 'bg-slate-900 border-rose-800/60 shadow-lg shadow-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${conf.resolved ? 'text-slate-500' : 'text-rose-400'}`} />
                      <span className="text-xs font-bold text-slate-200">
                        {conf.resolved ? 'Konflikt behoben' : 'Widerspruch erkannt'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(conf.detectedAt).toLocaleString('de-DE')}
                    </span>
                  </div>

                  <p className="text-xs text-rose-200 mt-2 font-medium">
                    {conf.reason}
                  </p>

                  {/* Side by side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
                    {/* Existing Canon */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Etablierter Kanon (Bestätigt)
                      </span>
                      <p className="text-xs font-bold text-slate-200">
                        "{conf.existingFact.subjectName}" {conf.existingFact.predicate} "{conf.existingFact.objectName || conf.existingFact.objectId || String(conf.existingFact.value || '')}"
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>Quelle: {conf.existingFact.sourceType}</span>
                        <span>•</span>
                        <span>Vertrauen: {conf.existingFact.confidence}%</span>
                      </div>
                    </div>

                    {/* Proposed AI Inference */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Widersprüchliche Angabe / KI-Inferenz
                      </span>
                      <p className="text-xs font-bold text-slate-200">
                        "{conf.proposedFact.subjectName}" {conf.proposedFact.predicate} "{conf.proposedFact.objectName || conf.proposedFact.objectId || String(conf.proposedFact.value || '')}"
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>Quelle: {conf.proposedFact.sourceType}</span>
                        <span>•</span>
                        <span>Typ: {conf.proposedFact.knowledgeType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Actions */}
                  {!conf.resolved && (
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handleResolveConflict(conf.id, 'keep_existing')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>Kanon behalten (Inferenz verwerfen)</span>
                      </button>

                      <button
                        onClick={() => handleResolveConflict(conf.id, 'convert_to_rumor')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>Als Gerücht/Legende einstufen</span>
                      </button>

                      <button
                        onClick={() => handleResolveConflict(conf.id, 'accept_proposed')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Autor-Korrektur übernehmen</span>
                      </button>
                    </div>
                  )}

                  {conf.resolved && conf.resolutionNote && (
                    <div className="mt-2 text-[10px] text-slate-500 italic">
                      Hinweis: {conf.resolutionNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Relevance & Context Simulator */}
      {activeTab === 'context' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Selektiver Kontext-Filter (Simulator)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Testet die Funktion <code className="text-amber-400">getRelevantWorldContext</code>. Die KI erhält für Story-Antworten nicht die gesamte Welt, sondern nur relevante Orte, benachbarte Zonen, lokale Betriebe und aktive Gerüchte.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Standort wählen</label>
                <select
                  value={simLocationId}
                  onChange={e => setSimLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  {(world.territories || []).map(t => (
                    <option key={t.id} value={t.id}>{t.name} [{t.type}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Radius (Distanz-Einheiten)</label>
                <input
                  type="number"
                  min="5"
                  max="150"
                  value={simRadius}
                  onChange={e => setSimRadius(Number(e.target.value) || 35)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Aktuelles Thema / Stichwort</label>
                <input
                  type="text"
                  placeholder="z. B. Piraten, Hafen, Taverne..."
                  value={simTopic}
                  onChange={e => setSimTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Context Result Output */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500 block">
              Generierter Kontext für das System-Prompt
            </span>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {contextSimulation.contextSummaryText}
            </div>

            {/* Inspect filtered items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Nahe Gebiete im Radius:</span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  {contextSimulation.nearbyTerritories.length} Gebiet(e)
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Lokale Wirtschaftsbetriebe:</span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  {contextSimulation.relevantHoldings.length} Betrieb(e)
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Aktive lokale Gerüchte:</span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  {contextSimulation.activeRumors.length} Gerücht(e)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit & Change History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {(world.changeLog || []).length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">Noch keine protokollierten Änderungen</p>
              <p className="text-xs text-slate-500 mt-1">Automatische oder manuelle Faktenkorrekturen werden hier chronologisch aufgeführt.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(world.changeLog || []).map(entry => (
                <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {renderSourceBadge(entry.source)}
                      <span className="text-xs font-bold text-slate-200">{entry.whatChanged}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(entry.timestamp).toLocaleString('de-DE')}
                    </span>
                  </div>

                  {entry.reason && (
                    <p className="text-[11px] text-slate-400">
                      Grund: {entry.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Fact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Neuen Weltfakt erfassen</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Subjekt (Ort, Person, Fraktion)</label>
                <input
                  type="text"
                  placeholder="z. B. Silberhafen oder Karin"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Prädikat (Relation)</label>
                <select
                  value={newPredicate}
                  onChange={e => setNewPredicate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="located_in">located_in (Liegt in)</option>
                  <option value="north_of">north_of (Liegt nördlich von)</option>
                  <option value="south_of">south_of (Liegt südlich von)</option>
                  <option value="east_of">east_of (Liegt östlich von)</option>
                  <option value="west_of">west_of (Liegt westlich von)</option>
                  <option value="owns">owns (Besitzt Betrieb)</option>
                  <option value="controls">controls (Beherrscht Gebiet)</option>
                  <option value="member_of">member_of (Ist Mitglied bei)</option>
                  <option value="profession_is">profession_is (Hat den Beruf)</option>
                  <option value="rumor_about">rumor_about (Gerücht über)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Objekt / Zielwert</label>
                <input
                  type="text"
                  placeholder="z. B. Hauptstadt, Taverne Zum Anker, Wirtin"
                  value={newObjectName}
                  onChange={e => setNewObjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Quelle</label>
                  <select
                    value={newSourceType}
                    onChange={e => setNewSourceType(e.target.value as FactSourceType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="author">Autor (Höchste Prio)</option>
                    <option value="user">Nutzer</option>
                    <option value="established_story">Etablierte Story</option>
                    <option value="ai_inference">KI-Inferenz</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Wissensart</label>
                  <select
                    value={newKnowledgeType}
                    onChange={e => setNewKnowledgeType(e.target.value as KnowledgeType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="fact">Fakt</option>
                    <option value="rumor">Gerücht</option>
                    <option value="belief">Glaube/Meinung</option>
                    <option value="inference">Inferenz</option>
                    <option value="proposal">Vorschlag</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Zusätzliche Notiz</label>
                <AutoExpandingTextarea
                  placeholder="Optionale Begründung oder Kontext..."
                  value={newFactNote}
                  onChange={e => setNewFactNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveManualFact}
                disabled={!newSubjectName.trim() || !newObjectName.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Fakt speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WorldKnowledgeManager;
