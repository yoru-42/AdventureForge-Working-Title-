import React, { useState } from 'react';
import { CharacterGoal, GoalTimeframe, GoalTargetType, GoalPriority, GoalStatus, CharacterRelationship } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface Props {
  goals?: CharacterGoal[];
  onChange: (updatedGoals: CharacterGoal[]) => void;
  codexCharacters: { id: string; title: string }[];
  codexFactions: { id: string; title: string }[];
  relationships?: CharacterRelationship[];
  playerName?: string;
  sourceCharacterName?: string;
  characterName?: string;
  motivationCore?: any;
  onGenerateAI: () => void;
  isGeneratingAI: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CharacterGoalsPanel: React.FC<Props> = ({
  goals = [],
  onChange,
  codexCharacters,
  codexFactions,
  relationships = [],
  playerName = 'Spieler',
  sourceCharacterName,
  characterName,
  motivationCore,
  onGenerateAI,
  isGeneratingAI,
  isOpen,
  onToggleOpen
}) => {
  const activeCharName = characterName || sourceCharacterName || 'Charakter';
  const [filterTimeframe, setFilterTimeframe] = useState<'alle' | GoalTimeframe>('alle');
  const [filterTarget, setFilterTarget] = useState<'alle' | GoalTargetType>('alle');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  const toggleGoalExpanded = (id: string) => {
    setExpandedGoalIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddGoal = () => {
    const newId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newGoal: CharacterGoal = {
      id: newId,
      title: '',
      description: '',
      timeframe: 'mittelfristig',
      targetType: 'self',
      targetName: 'Selbst',
      priority: 'normal',
      status: 'aktiv',
      progress: 0,
      activePlan: '',
      alternativePlans: [],
      obstacles: [],
      createdAt: new Date().toISOString()
    };
    onChange([...goals, newGoal]);
    setExpandedGoalIds(prev => ({ ...prev, [newId]: true }));
  };

  const handleUpdateGoal = (id: string, partial: Partial<CharacterGoal>) => {
    const updated = goals.map(g => (g.id === id ? { ...g, ...partial, updatedAt: new Date().toISOString() } : g));
    onChange(updated);
  };

  const handleDeleteGoal = (id: string) => {
    onChange(goals.filter(g => g.id !== id));
  };

  const handleDuplicateGoal = (goal: CharacterGoal) => {
    const newId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duplicated: CharacterGoal = {
      ...goal,
      id: newId,
      title: `${goal.title} (Kopie)`,
      createdAt: new Date().toISOString()
    };
    onChange([...goals, duplicated]);
    setExpandedGoalIds(prev => ({ ...prev, [newId]: true }));
  };

  // Add alternative plan
  const handleAddAlternativePlan = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const current = goal.alternativePlans || [];
    handleUpdateGoal(goalId, { alternativePlans: [...current, ''] });
  };

  const handleUpdateAlternativePlan = (goalId: string, index: number, text: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = [...(goal.alternativePlans || [])];
    next[index] = text;
    handleUpdateGoal(goalId, { alternativePlans: next });
  };

  const handleRemoveAlternativePlan = (goalId: string, index: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = (goal.alternativePlans || []).filter((_, i) => i !== index);
    handleUpdateGoal(goalId, { alternativePlans: next });
  };

  // Add obstacle
  const handleAddObstacle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const current = goal.obstacles || [];
    handleUpdateGoal(goalId, { obstacles: [...current, ''] });
  };

  const handleUpdateObstacle = (goalId: string, index: number, text: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = [...(goal.obstacles || [])];
    next[index] = text;
    handleUpdateGoal(goalId, { obstacles: next });
  };

  const handleRemoveObstacle = (goalId: string, index: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = (goal.obstacles || []).filter((_, i) => i !== index);
    handleUpdateGoal(goalId, { obstacles: next });
  };

  // Filtered goals
  const filteredGoals = goals.filter(g => {
    if (filterTimeframe !== 'alle' && g.timeframe !== filterTimeframe) return false;
    if (filterTarget !== 'alle') {
      const type = g.targetType || 'self';
      if (type !== filterTarget) return false;
    }
    return true;
  });

  const getPriorityLabel = (priority?: GoalPriority | number) => {
    switch (priority) {
      case 'kritisch':
        return { label: 'Kritisch', badgeClass: 'bg-red-950/60 border-red-800/60 text-red-300' };
      case 'hoch':
        return { label: 'Hoch', badgeClass: 'bg-amber-950/60 border-amber-800/60 text-amber-300' };
      case 'niedrig':
        return { label: 'Niedrig', badgeClass: 'bg-slate-900 border-slate-700 text-slate-400' };
      case 'normal':
      default:
        return { label: 'Normal', badgeClass: 'bg-slate-900/90 border-slate-700 text-slate-300' };
    }
  };

  const getStatusLabel = (status?: GoalStatus) => {
    switch (status) {
      case 'pausiert':
        return { label: 'Pausiert', badgeClass: 'bg-amber-950/40 border-amber-700/50 text-amber-300' };
      case 'erreicht':
        return { label: 'Erreicht', badgeClass: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' };
      case 'gescheitert':
        return { label: 'Gescheitert', badgeClass: 'bg-red-950/40 border-red-700/50 text-red-300' };
      case 'aufgegeben':
        return { label: 'Aufgegeben', badgeClass: 'bg-slate-900 border-slate-700 text-slate-400' };
      case 'aktiv':
      default:
        return { label: 'Aktiv', badgeClass: 'bg-cyan-950/40 border-cyan-700/50 text-cyan-300' };
    }
  };

  const getTimeframeLabel = (timeframe: GoalTimeframe) => {
    switch (timeframe) {
      case 'langfristig':
        return 'Langfristig';
      case 'mittelfristig':
        return 'Mittelfristig';
      case 'kurzfristig':
        return 'Kurzfristig';
      default:
        return 'Mittelfristig';
    }
  };

  const getTargetTypeLabel = (targetType?: GoalTargetType, targetName?: string) => {
    switch (targetType) {
      case 'character':
        return `Person: ${targetName || 'Unbekannt'}`;
      case 'faction':
        return `Fraktion: ${targetName || 'Unbekannt'}`;
      case 'user':
        return `Gegenüber Spieler (${playerName})`;
      case 'world':
        return 'Welt & Allgemein';
      case 'self':
      default:
        return 'Persönlich';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Header (einklappbar) */}
      <div className="p-4 flex items-center justify-between gap-3 bg-slate-950/40 border-b border-slate-800/80 flex-wrap">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 text-left flex-1 cursor-pointer group min-w-[200px]"
        >
          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs transition-transform group-hover:scale-105">
            <i className={`fa-solid ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'} text-[11px]`}></i>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-200 font-bold uppercase tracking-wider">
                Ziele &amp; Pläne
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30">
                {goals.length} {goals.length === 1 ? 'Ziel' : 'Ziele'}
              </span>
            </div>
            <span className="text-xs text-slate-400 block mt-0.5">
              Konkrete Vorhaben, Stufen, Zielpersonen, Fraktionen, Pläne und Hindernisse
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onGenerateAI}
            disabled={isGeneratingAI}
            className="px-3 py-1.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Ziele auf Basis von Motivationskern, Rolle, Biografie und Beziehungen per KI erzeugen oder ergänzen"
          >
            <i className={`fa-solid fa-wand-magic-sparkles ${isGeneratingAI ? 'animate-spin' : ''}`}></i>
            <span>{isGeneratingAI ? 'Wird generiert...' : 'Ziele per KI vorschlagen'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddGoal}
            className="px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-600/30 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Ziel hinzufügen</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-4 animate-in fade-in duration-200">
          {/* Filterleiste */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Zeithorizont:
              </span>
              {(['alle', 'langfristig', 'mittelfristig', 'kurzfristig'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setFilterTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterTimeframe === tf
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tf === 'alle' ? 'Alle Fristen' : getTimeframeLabel(tf)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Zielobjekt:
              </span>
              {(['alle', 'self', 'character', 'faction', 'user'] as const).map(target => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setFilterTarget(target)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterTarget === target
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {target === 'alle' && 'Alle Objekte'}
                  {target === 'self' && 'Persönlich'}
                  {target === 'character' && 'Charaktere'}
                  {target === 'faction' && 'Fraktionen'}
                  {target === 'user' && 'Spieler'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste der Ziele */}
          {filteredGoals.length === 0 ? (
            <div className="text-xs text-slate-400 italic px-4 py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-2">
              <p>
                {goals.length === 0
                  ? 'Bisher keine strukturierten Ziele definiert. Klicke auf „+ Ziel hinzufügen“ oder lasse dir passende Vorhaben per KI vorschlagen.'
                  : 'Keine Ziele entsprechen den ausgewählten Filtern.'}
              </p>
              {goals.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold hover:bg-cyan-600/30 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>Erstes Ziel anlegen</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map((goal, index) => {
                const isExpanded = !!expandedGoalIds[goal.id];
                const priorityInfo = getPriorityLabel(goal.priority);
                const statusInfo = getStatusLabel(goal.status);
                const timeframeText = getTimeframeLabel(goal.timeframe);
                const targetText = getTargetTypeLabel(goal.targetType, goal.targetName);

                return (
                  <div
                    key={goal.id || `goal-${index}`}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700"
                  >
                    {/* Kompakte Zeile / Kartenkopf */}
                    <div
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none flex-wrap bg-slate-900/30 hover:bg-slate-900/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                        <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-200">
                              {goal.title?.trim() ? goal.title : 'Unbenanntes Ziel'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              {timeframeText}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-cyan-300">
                              {targetText}
                            </span>
                          </div>

                          {goal.description && !isExpanded && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Priorität Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityInfo.badgeClass}`}>
                          {priorityInfo.label}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>

                        {/* Fortschritt */}
                        {typeof goal.progress === 'number' && (
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block border border-slate-700">
                            <div
                              className="bg-cyan-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ausgeklappter Detailbereich */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                        {/* Zeile 1: Titel & Zeithorizont & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Titel des Ziels
                            </label>
                            <input
                              type="text"
                              value={goal.title}
                              onChange={e => handleUpdateGoal(goal.id, { title: e.target.value })}
                              placeholder="z. B. Eigene Schmiede eröffnen, Annas Vertrauen gewinnen..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                            />
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Zeithorizont
                            </label>
                            <select
                              value={goal.timeframe}
                              onChange={e => handleUpdateGoal(goal.id, { timeframe: e.target.value as GoalTimeframe })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="langfristig">Langfristig</option>
                              <option value="mittelfristig">Mittelfristig</option>
                              <option value="kurzfristig">Kurzfristig</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Status
                            </label>
                            <select
                              value={goal.status || 'aktiv'}
                              onChange={e => handleUpdateGoal(goal.id, { status: e.target.value as GoalStatus })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="aktiv">Aktiv</option>
                              <option value="pausiert">Pausiert</option>
                              <option value="erreicht">Erreicht</option>
                              <option value="gescheitert">Gescheitert</option>
                              <option value="aufgegeben">Aufgegeben</option>
                            </select>
                          </div>
                        </div>

                        {/* Zeile 2: Zielobjekt & Zielauswahl & Priorität & Fortschritt */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Zieltyp
                            </label>
                            <select
                              value={goal.targetType || 'self'}
                              onChange={e => {
                                const newType = e.target.value as GoalTargetType;
                                let defaultName = 'Selbst';
                                if (newType === 'user') defaultName = playerName || 'Spieler / Nutzer';
                                if (newType === 'world') defaultName = 'Welt';
                                if (newType === 'character') defaultName = codexCharacters[0]?.title || '';
                                if (newType === 'faction') defaultName = codexFactions[0]?.title || '';
                                handleUpdateGoal(goal.id, {
                                  targetType: newType,
                                  targetName: defaultName,
                                  targetId: newType === 'character' ? codexCharacters[0]?.id : (newType === 'faction' ? codexFactions[0]?.id : undefined)
                                });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="self">Persönlich (Selbst)</option>
                              <option value="character">Gegenüber Charakter / NSC</option>
                              <option value="faction">Gegenüber Fraktion</option>
                              <option value="user">Gegenüber Spieler / Nutzer</option>
                              <option value="world">Welt / Allgemein</option>
                            </select>
                          </div>

                          <div className="md:col-span-4 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Zielobjekt / Name
                            </label>
                            {goal.targetType === 'character' ? (
                              <div className="flex gap-2">
                                <select
                                  value={goal.targetId || ''}
                                  onChange={e => {
                                    const selected = codexCharacters.find(c => c.id === e.target.value);
                                    handleUpdateGoal(goal.id, {
                                      targetId: e.target.value,
                                      targetName: selected ? selected.title : goal.targetName
                                    });
                                  }}
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                                >
                                  <option value="">-- Charakter auswählen --</option>
                                  {codexCharacters.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.title}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="oder freier Name..."
                                  value={goal.targetName || ''}
                                  onChange={e => handleUpdateGoal(goal.id, { targetName: e.target.value })}
                                  className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                                />
                              </div>
                            ) : goal.targetType === 'faction' ? (
                              <div className="flex gap-2">
                                <select
                                  value={goal.targetId || ''}
                                  onChange={e => {
                                    const selected = codexFactions.find(f => f.id === e.target.value);
                                    handleUpdateGoal(goal.id, {
                                      targetId: e.target.value,
                                      targetName: selected ? selected.title : goal.targetName
                                    });
                                  }}
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                                >
                                  <option value="">-- Fraktion auswählen --</option>
                                  {codexFactions.map(f => (
                                    <option key={f.id} value={f.id}>
                                      {f.title}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="oder freier Name..."
                                  value={goal.targetName || ''}
                                  onChange={e => handleUpdateGoal(goal.id, { targetName: e.target.value })}
                                  className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={goal.targetName || ''}
                                readOnly={goal.targetType === 'user' || goal.targetType === 'self'}
                                onChange={e => handleUpdateGoal(goal.id, { targetName: e.target.value })}
                                placeholder="Name des Zielobjekts..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
                              />
                            )}
                          </div>

                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Priorität
                            </label>
                            <select
                              value={typeof goal.priority === 'string' ? goal.priority : 'normal'}
                              onChange={e => handleUpdateGoal(goal.id, { priority: e.target.value as GoalPriority })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="kritisch">★ Kritisch</option>
                              <option value="hoch">↑ Hoch</option>
                              <option value="normal">• Normal</option>
                              <option value="niedrig">↓ Niedrig</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Fortschritt
                              </label>
                              <span className="text-[10px] text-cyan-400 font-mono">
                                {goal.progress ?? 0}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={goal.progress ?? 0}
                              onChange={e => handleUpdateGoal(goal.id, { progress: parseInt(e.target.value, 10) })}
                              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2"
                            />
                          </div>
                        </div>

                        {/* Zeile 2b: Verknüpfung mit bestehender Beziehung (optional) */}
                        {relationships.length > 0 && (
                          <div className="flex flex-col gap-1 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                              <span>Verknüpfte Beziehung (Beziehung &rarr; Motivation &rarr; Ziel)</span>
                              <span className="text-[9px] text-slate-500 normal-case">Optional</span>
                            </label>
                            <select
                              value={goal.linkedRelationshipId || ''}
                              onChange={e => handleUpdateGoal(goal.id, { linkedRelationshipId: e.target.value || undefined })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                            >
                              <option value="">-- Keine direkte Beziehungsbindung --</option>
                              {relationships.map(rel => (
                                <option key={rel.id} value={rel.id}>
                                  {rel.targetCharacter || 'Unbenannt'} ({rel.type || 'Beziehung'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Zeile 3: Motivation (Warum) & Beschreibung */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                              Motivation / Warum dieses Ziel?
                            </label>
                            <AutoExpandingTextarea
                              value={goal.motivation || ''}
                              onChange={e => handleUpdateGoal(goal.id, { motivation: e.target.value })}
                              placeholder="Persönlicher Grund, emotionaler Ansporn oder Verpflichtung..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                            />
                            <span className="text-[9px] text-slate-500">
                              Verbindet den Motivationskern mit diesem konkreten Vorhaben.
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Kontext &amp; Beschreibung
                            </label>
                            <AutoExpandingTextarea
                              value={goal.description || ''}
                              onChange={e => handleUpdateGoal(goal.id, { description: e.target.value })}
                              placeholder="Hintergrund, zeitlicher Rahmen oder Erfolgskriterien..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[60px]"
                            />
                            <span className="text-[9px] text-slate-500">
                              Was genau bedeutet das Erreichen dieses Ziels?
                            </span>
                          </div>
                        </div>

                        {/* Zeile 4: Aktiver Plan (WAS vs. WIE) */}
                        <div className="flex flex-col gap-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <i className="fa-solid fa-list-check text-cyan-500"></i>
                              <span>Aktiver Plan (Wie will der Charakter das Ziel erreichen?)</span>
                            </label>
                            <span className="text-[9px] text-slate-500">
                              Schrittfolge für Handlungen &amp; Spielleiter
                            </span>
                          </div>
                          <AutoExpandingTextarea
                            value={goal.activePlan || ''}
                            onChange={e => handleUpdateGoal(goal.id, { activePlan: e.target.value })}
                            placeholder="1. Kontakt herstellen&#10;2. Vertrauen erlangen durch Erledigung eines Gefallens&#10;3. Vorhaben unterbreiten..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[70px]"
                          />
                        </div>

                        {/* Zeile 5: Alternativpläne & Hindernisse */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Alternativpläne */}
                          <div className="flex flex-col gap-2 bg-slate-900/20 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                                Alternativpläne (Plan B, Plan C...)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddAlternativePlan(goal.id)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
                              >
                                + Alternative
                              </button>
                            </div>

                            {(!goal.alternativePlans || goal.alternativePlans.length === 0) ? (
                              <span className="text-[11px] text-slate-500 italic py-1">
                                Keine Alternativpläne eingetragen.
                              </span>
                            ) : (
                              <div className="space-y-2">
                                {goal.alternativePlans.map((plan, pIdx) => (
                                  <div key={pIdx} className="flex items-start gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-mono mt-2 shrink-0">
                                      {String.fromCharCode(66 + pIdx)}:
                                    </span>
                                    <AutoExpandingTextarea
                                      value={plan}
                                      onChange={e => handleUpdateAlternativePlan(goal.id, pIdx, e.target.value)}
                                      placeholder={`Alternativer Plan ${String.fromCharCode(66 + pIdx)}...`}
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[40px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAlternativePlan(goal.id, pIdx)}
                                      className="text-slate-500 hover:text-red-400 p-1.5 text-xs cursor-pointer mt-1"
                                      title="Alternative entfernen"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Hindernisse / Konflikte */}
                          <div className="flex flex-col gap-2 bg-slate-900/20 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-red-400/90 font-bold uppercase tracking-wider">
                                Hindernisse &amp; Konflikte
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddObstacle(goal.id)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-red-300 rounded text-[10px] font-bold cursor-pointer"
                              >
                                + Hindernis
                              </button>
                            </div>

                            {(!goal.obstacles || goal.obstacles.length === 0) ? (
                              <span className="text-[11px] text-slate-500 italic py-1">
                                Keine Hindernisse oder Konflikte eingetragen.
                              </span>
                            ) : (
                              <div className="space-y-2">
                                {goal.obstacles.map((obs, oIdx) => (
                                  <div key={oIdx} className="flex items-start gap-1.5">
                                    <span className="text-[10px] text-red-400/70 font-mono mt-2 shrink-0">
                                      •
                                    </span>
                                    <AutoExpandingTextarea
                                      value={obs}
                                      onChange={e => handleUpdateObstacle(goal.id, oIdx, e.target.value)}
                                      placeholder="z. B. Geldmangel, rivalisierende Gilde, Gesetze..."
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-red-500 min-h-[40px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveObstacle(goal.id, oIdx)}
                                      className="text-slate-500 hover:text-red-400 p-1.5 text-xs cursor-pointer mt-1"
                                      title="Hindernis entfernen"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Fußzeile mit Aktionen & Referenz-ID */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex-wrap gap-2">
                          <span className="font-mono">
                            Referenz-ID: {goal.id}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicateGoal(goal)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <i className="fa-solid fa-copy text-[10px]"></i>
                              <span>Duplizieren</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <i className="fa-solid fa-trash text-[10px]"></i>
                              <span>Löschen</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleGoalExpanded(goal.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                            >
                              Zuklappen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterGoalsPanel;
