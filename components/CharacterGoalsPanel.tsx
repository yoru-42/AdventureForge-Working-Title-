import React, { useState, useMemo } from 'react';
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
  onGenerateMainGoalAI?: (mainGoal: string, targetType: GoalTargetType, targetName?: string, targetId?: string) => void;
  isGeneratingAI: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export type GoalDomain = 'self' | 'character' | 'faction';

interface DomainOption {
  id: GoalDomain;
  label: string;
  targetType: GoalTargetType;
  description: string;
  icon: string;
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'self',
    label: 'Persönliche Ziele',
    targetType: 'self',
    description: 'Eigene Entwicklung, Meisterschaft, Überleben, Wohlstand oder Lebenswerk.',
    icon: 'fa-user'
  },
  {
    id: 'character',
    label: 'Ziele gegenüber Charakteren',
    targetType: 'character',
    description: 'Absichten, Vorhaben, Rivalitäten, Loyalitäten oder Schutzabsichten bezüglich konkreter Personen.',
    icon: 'fa-user-group'
  },
  {
    id: 'faction',
    label: 'Ziele gegenüber Fraktionen',
    targetType: 'faction',
    description: 'Aufstieg, Einflussnahme, Mitgliedschaft, Opposition oder Bündnisse mit Gilden und Organisationen.',
    icon: 'fa-shield-halved'
  }
];

const TIMEFRAME_LABELS: Record<GoalTimeframe, { title: string; badgeClass: string }> = {
  langfristig: {
    title: 'Langfristig',
    badgeClass: 'bg-indigo-950/50 border-indigo-700/50 text-indigo-300'
  },
  mittelfristig: {
    title: 'Mittelfristig',
    badgeClass: 'bg-cyan-950/50 border-cyan-700/50 text-cyan-300'
  },
  kurzfristig: {
    title: 'Kurzfristig',
    badgeClass: 'bg-teal-950/50 border-teal-700/50 text-teal-300'
  }
};

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
  onGenerateMainGoalAI,
  isGeneratingAI,
  isOpen,
  onToggleOpen
}) => {
  // Filter tab for listing goals
  const [activeFilter, setActiveFilter] = useState<'alle' | GoalDomain>('alle');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  // Unified Goal Creator Form State
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(true);
  const [creatorMode, setCreatorMode] = useState<'tier3' | 'single'>('tier3');
  const [creatorDomain, setCreatorDomain] = useState<GoalDomain>('self');
  const [creatorTargetId, setCreatorTargetId] = useState<string>('');
  const [creatorTargetName, setCreatorTargetName] = useState<string>('Selbst');

  // Fields for 3-Tier Main Goal Creation
  const [mainGoalText, setMainGoalText] = useState<string>('');

  // Fields for Single Goal Creation
  const [singleTitle, setSingleTitle] = useState<string>('');
  const [singleTimeframe, setSingleTimeframe] = useState<GoalTimeframe>('mittelfristig');
  const [singlePriority, setSinglePriority] = useState<GoalPriority>('normal');
  const [singleMotivation, setSingleMotivation] = useState<string>('');
  const [singlePlan, setSinglePlan] = useState<string>('');
  const [singleParentGoal, setSingleParentGoal] = useState<string>('');

  const toggleGoalExpanded = (id: string) => {
    setExpandedGoalIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const normalizeGoalDomain = (targetType?: GoalTargetType): GoalDomain => {
    if (targetType === 'character') return 'character';
    if (targetType === 'faction') return 'faction';
    return 'self';
  };

  const handleDomainChange = (domain: GoalDomain) => {
    setCreatorDomain(domain);
    if (domain === 'self') {
      setCreatorTargetName('Selbst');
      setCreatorTargetId('');
    } else if (domain === 'character') {
      const defaultChar = codexCharacters[0];
      setCreatorTargetName(defaultChar ? defaultChar.title : '');
      setCreatorTargetId(defaultChar ? defaultChar.id : '');
    } else if (domain === 'faction') {
      const defaultFaction = codexFactions[0];
      setCreatorTargetName(defaultFaction ? defaultFaction.title : '');
      setCreatorTargetId(defaultFaction ? defaultFaction.id : '');
    }
  };

  const handleTakeFromMotivationCore = () => {
    if (motivationCore?.mainGoal?.trim()) {
      setMainGoalText(motivationCore.mainGoal.trim());
      if (!singleTitle) {
        setSingleTitle(motivationCore.mainGoal.trim());
      }
    }
  };

  // Create 3 Progressive Stages (Kurz-, Mittel-, Langfristig) per AI
  const handleGenerate3TierAI = () => {
    if (!mainGoalText.trim()) return;
    if (!isOpen) onToggleOpen();

    let targetName = creatorTargetName || 'Selbst';
    let targetId = creatorTargetId || undefined;

    if (creatorDomain === 'character' && !targetId && codexCharacters.length > 0) {
      targetId = codexCharacters[0].id;
      targetName = codexCharacters[0].title;
    } else if (creatorDomain === 'faction' && !targetId && codexFactions.length > 0) {
      targetId = codexFactions[0].id;
      targetName = codexFactions[0].title;
    }

    if (onGenerateMainGoalAI) {
      onGenerateMainGoalAI(mainGoalText.trim(), creatorDomain, targetName, targetId);
    } else {
      onGenerateAI();
    }
  };

  // Create 3 Progressive Stages manually
  const handleCreate3TierManual = () => {
    if (!isOpen) onToggleOpen();
    const title = mainGoalText.trim() || 'Hauptziel';
    let targetName = creatorTargetName || 'Selbst';
    let targetId = creatorTargetId || undefined;

    if (creatorDomain === 'character' && !targetId && codexCharacters.length > 0) {
      targetId = codexCharacters[0].id;
      targetName = codexCharacters[0].title;
    } else if (creatorDomain === 'faction' && !targetId && codexFactions.length > 0) {
      targetId = codexFactions[0].id;
      targetName = codexFactions[0].title;
    }

    const now = new Date().toISOString();
    const shortId = `goal-${Date.now()}-short-${Math.random().toString(36).substring(2, 6)}`;
    const mediumId = `goal-${Date.now()}-med-${Math.random().toString(36).substring(2, 6)}`;
    const longId = `goal-${Date.now()}-long-${Math.random().toString(36).substring(2, 6)}`;

    const shortGoal: CharacterGoal = {
      id: shortId,
      title: `Kurzfristiges Ziel: Vorbereitung für ${title}`,
      mainGoalTitle: title,
      timeframe: 'kurzfristig',
      targetType: creatorDomain,
      targetName,
      targetId,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: `Erster notwendiger Schritt zur Erreichung des Hauptziels "${title}".`,
      activePlan: `1. Schritt: Vorbereitungen treffen und Informationen sammeln\n2. Schritt: Erste Kontakte knüpfen und Ressourcen sichern`,
      alternativePlans: [],
      obstacles: [],
      createdAt: now
    };

    const mediumGoal: CharacterGoal = {
      id: mediumId,
      title: `Mittelfristiges Ziel: Meilenstein für ${title}`,
      mainGoalTitle: title,
      timeframe: 'mittelfristig',
      targetType: creatorDomain,
      targetName,
      targetId,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: `Zentrale Zwischenetappe zur Umsetzung des Hauptziels "${title}".`,
      activePlan: `1. Schritt: Hauptprüfung oder Zwischenziel absolvieren\n2. Schritt: Position festigen und nächste Phase einleiten`,
      alternativePlans: [],
      obstacles: [],
      createdAt: now
    };

    const longGoal: CharacterGoal = {
      id: longId,
      title: `Langfristiges Ziel: Vollendung von ${title}`,
      mainGoalTitle: title,
      timeframe: 'langfristig',
      targetType: creatorDomain,
      targetName,
      targetId,
      priority: 'kritisch',
      status: 'aktiv',
      progress: 0,
      motivation: `Vollständige Erreichung und dauerhafte Sicherung des Hauptziels "${title}".`,
      activePlan: `1. Schritt: Finale Maßnahme umsetzen\n2. Schritt: Erreichten Status dauerhaft absichern`,
      alternativePlans: [],
      obstacles: [],
      createdAt: now
    };

    onChange([...goals, shortGoal, mediumGoal, longGoal]);
    setExpandedGoalIds(prev => ({
      ...prev,
      [shortId]: true,
      [mediumId]: true,
      [longId]: true
    }));
    setActiveFilter('alle');
  };

  // Create single goal manually
  const handleCreateSingleGoal = () => {
    if (!isOpen) onToggleOpen();
    const newId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let targetName = creatorTargetName || 'Selbst';
    let targetId = creatorTargetId || undefined;

    if (creatorDomain === 'character' && !targetId && codexCharacters.length > 0) {
      targetId = codexCharacters[0].id;
      targetName = codexCharacters[0].title;
    } else if (creatorDomain === 'faction' && !targetId && codexFactions.length > 0) {
      targetId = codexFactions[0].id;
      targetName = codexFactions[0].title;
    }

    const newGoal: CharacterGoal = {
      id: newId,
      title: singleTitle.trim() || 'Neues Ziel',
      mainGoalTitle: singleParentGoal.trim() || undefined,
      description: '',
      timeframe: singleTimeframe,
      targetType: creatorDomain,
      targetName,
      targetId,
      priority: singlePriority,
      status: 'aktiv',
      progress: 0,
      motivation: singleMotivation.trim() || undefined,
      activePlan: singlePlan.trim() || undefined,
      alternativePlans: [],
      obstacles: [],
      createdAt: new Date().toISOString()
    };

    onChange([...goals, newGoal]);
    setExpandedGoalIds(prev => ({ ...prev, [newId]: true }));
    setSingleTitle('');
    setSingleMotivation('');
    setSinglePlan('');
    setSingleParentGoal('');
    setActiveFilter('alle');
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
      title: goal.title ? `${goal.title} (Kopie)` : 'Kopie eines Ziels',
      createdAt: new Date().toISOString()
    };
    onChange([...goals, duplicated]);
    setExpandedGoalIds(prev => ({ ...prev, [newId]: true }));
  };

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

  // Counts per domain
  const counts = useMemo(() => {
    const c = { self: 0, character: 0, faction: 0 };
    goals.forEach(g => {
      const d = normalizeGoalDomain(g.targetType);
      c[d] = (c[d] || 0) + 1;
    });
    return c;
  }, [goals]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (activeFilter === 'alle') return goals;
    return goals.filter(g => normalizeGoalDomain(g.targetType) === activeFilter);
  }, [goals, activeFilter]);

  const getPriorityInfo = (priority?: GoalPriority | number) => {
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

  const getStatusInfo = (status?: GoalStatus) => {
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

  const getTargetTypeDisplay = (targetType?: GoalTargetType, targetName?: string) => {
    switch (targetType) {
      case 'character':
        return targetName?.trim() ? `Charakter: ${targetName}` : 'Gegenüber Charakter';
      case 'faction':
        return targetName?.trim() ? `Fraktion: ${targetName}` : 'Gegenüber Fraktion';
      case 'world':
        return 'Welt & Allgemein';
      case 'self':
      default:
        return 'Persönlich';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3 bg-slate-950/40 border-b border-slate-800/80 flex-wrap">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 text-left cursor-pointer group min-w-[200px]"
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
              Persönliche Ziele, Ziele gegenüber Charakteren und Fraktionen
            </span>
          </div>
        </button>

        {/* Schnellaktionen */}
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
            onClick={() => {
              if (!isOpen) onToggleOpen();
              setIsCreatorOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Neues Ziel anlegen</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-6 animate-in fade-in duration-200">
          {/* EINES VEREINTES FORMULAR ZUR ZIELERSTELLUNG */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 space-y-4 shadow-md transition-colors">
            {/* Kopfbereich des Erstellungsformulars */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs shrink-0">
                  <i className="fa-solid fa-bullseye"></i>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Zielverwaltung &amp; Planung</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Erstelle persönliche Vorhaben, Pläne gegenüber Personen oder Vorhaben bezüglich Fraktionen als 3-Stufen-Etappen oder Einzelziel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {motivationCore?.mainGoal?.trim() && (
                  <button
                    type="button"
                    onClick={handleTakeFromMotivationCore}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    title={`Aus Motivationskern übernehmen: "${motivationCore.mainGoal}"`}
                  >
                    Aus Motivationskern übernehmen
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(prev => !prev)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                  title={isCreatorOpen ? 'Formular einklappen' : 'Formular ausklappen'}
                >
                  <i className={`fa-solid ${isCreatorOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </button>
              </div>
            </div>

            {isCreatorOpen && (
              <div className="space-y-4 pt-1">
                {/* 1. ZIELBEREICH AUSWAHL (Persönlich / Charakter / Fraktion) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    1. Zielbereich auswählen
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {DOMAIN_OPTIONS.map(opt => {
                      const isSelected = creatorDomain === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleDomainChange(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-950/30 border-cyan-500/60 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${isSelected ? 'text-cyan-300 bg-cyan-900/40' : 'text-slate-400 bg-slate-800'}`}>
                              <i className={`fa-solid ${opt.icon}`}></i>
                            </span>
                            <span className={`text-xs font-bold ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
                              {opt.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-snug">
                            {opt.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ADRESSAT / ZIELOBJEKT */}
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-850 space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    2. Adressat / Konkreter Bezug
                  </label>

                  {creatorDomain === 'self' && (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={creatorTargetName}
                        onChange={e => setCreatorTargetName(e.target.value)}
                        placeholder="Persönlicher Schwerpunkt oder Thema (z. B. Selbst, Magiemeisterschaft, Überleben, Wohlstand)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                  )}

                  {creatorDomain === 'character' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-6">
                        <select
                          value={creatorTargetId}
                          onChange={e => {
                            const selected = codexCharacters.find(c => c.id === e.target.value);
                            setCreatorTargetId(e.target.value);
                            if (selected) setCreatorTargetName(selected.title);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Charakter aus Codex wählen --</option>
                          {codexCharacters.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="oder freier Name der Zielperson..."
                          value={creatorTargetName}
                          onChange={e => setCreatorTargetName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}

                  {creatorDomain === 'faction' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-6">
                        <select
                          value={creatorTargetId}
                          onChange={e => {
                            const selected = codexFactions.find(f => f.id === e.target.value);
                            setCreatorTargetId(e.target.value);
                            if (selected) setCreatorTargetName(selected.title);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Fraktion aus Codex wählen --</option>
                          {codexFactions.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="oder freier Name der Organisation / Fraktion..."
                          value={creatorTargetName}
                          onChange={e => setCreatorTargetName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ERSTELLUNGSMODUS (Hauptziel mit 3 Stufen ODER Einzelziel) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      3. Erstellungsmodus
                    </label>
                    <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCreatorMode('tier3')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          creatorMode === 'tier3'
                            ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Hauptziel mit 3-Stufen-Etappen
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreatorMode('single')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          creatorMode === 'single'
                            ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Einzelziel
                      </button>
                    </div>
                  </div>

                  {/* MODUS A: 3-STUFEN HAUPTZIEL */}
                  {creatorMode === 'tier3' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>Übergeordnetes Hauptziel formulieren</span>
                          <span className="text-[10px] text-cyan-400 font-normal">
                            Erzeugt: 1x Kurzfristig &bull; 1x Mittelfristig &bull; 1x Langfristig
                          </span>
                        </label>
                        <AutoExpandingTextarea
                          value={mainGoalText}
                          onChange={e => setMainGoalText(e.target.value)}
                          placeholder="Übergeordnetes Vorhaben beschreiben (z. B. Aufnahme in den Ältestenrat, Rache am Mörder der Familie, Erwerb des Meistertitels)..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 min-h-[50px] font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={handleGenerate3TierAI}
                          disabled={!mainGoalText.trim() || isGeneratingAI}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                        >
                          <i className={`fa-solid fa-wand-magic-sparkles ${isGeneratingAI ? 'animate-spin' : ''}`}></i>
                          <span>
                            {isGeneratingAI
                              ? 'Generiere 3-Stufen-Ziele...'
                              : '3 Etappenziele per KI generieren'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCreate3TierManual}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-layer-group text-slate-400"></i>
                          <span>3 Etappen manuell anlegen</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODUS B: EINZELZIEL */}
                  {creatorMode === 'single' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Titel des Ziels
                          </label>
                          <input
                            type="text"
                            value={singleTitle}
                            onChange={e => setSingleTitle(e.target.value)}
                            placeholder="Titel des Ziels..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>

                        <div className="md:col-span-3 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Zeithorizont / Frist
                          </label>
                          <select
                            value={singleTimeframe}
                            onChange={e => setSingleTimeframe(e.target.value as GoalTimeframe)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          >
                            <option value="kurzfristig">Kurzfristig</option>
                            <option value="mittelfristig">Mittelfristig</option>
                            <option value="langfristig">Langfristig</option>
                          </select>
                        </div>

                        <div className="md:col-span-3 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Priorität
                          </label>
                          <select
                            value={singlePriority}
                            onChange={e => setSinglePriority(e.target.value as GoalPriority)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          >
                            <option value="kritisch">Kritisch</option>
                            <option value="hoch">Hoch</option>
                            <option value="normal">Normal</option>
                            <option value="niedrig">Niedrig</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Motivation (Warum)
                          </label>
                          <AutoExpandingTextarea
                            value={singleMotivation}
                            onChange={e => setSingleMotivation(e.target.value)}
                            placeholder="Persönlicher Grund oder Antrieb..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[40px]"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Aktiver Handlungsplan (Wie)
                          </label>
                          <AutoExpandingTextarea
                            value={singlePlan}
                            onChange={e => setSinglePlan(e.target.value)}
                            placeholder="Schritte zur Umsetzung..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[40px]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleCreateSingleGoal}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                          <span>Einzelziel hinzufügen</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FILTER-TABS FÜR GESPEICHERTE ZIELE */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">
                Filter:
              </span>

              <button
                type="button"
                onClick={() => setActiveFilter('alle')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'alle'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span>Alle Zielbereiche</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                  {goals.length}
                </span>
              </button>

              {DOMAIN_OPTIONS.map(dom => {
                const count = counts[dom.id] || 0;
                const isActive = activeFilter === dom.id;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => setActiveFilter(dom.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <i className={`fa-solid ${dom.icon} text-[10px]`}></i>
                    <span>{dom.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 px-2">
              {filteredGoals.length} {filteredGoals.length === 1 ? 'Eintrag' : 'Einträge'}
            </div>
          </div>

          {/* LISTE DER ZIELE */}
          {filteredGoals.length === 0 ? (
            <div className="text-xs text-slate-400 px-4 py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p>
                {goals.length === 0
                  ? 'Bisher sind keine Ziele für diesen Charakter hinterlegt. Nutze das obige Formular, um persönliche Ziele, Ziele gegenüber Charakteren oder Fraktionen zu erstellen.'
                  : 'Keine Ziele im ausgewählten Filter vorhanden.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map(goal => {
                const isExpanded = !!expandedGoalIds[goal.id];
                const priorityInfo = getPriorityInfo(goal.priority);
                const statusInfo = getStatusInfo(goal.status);
                const targetDisplay = getTargetTypeDisplay(goal.targetType, goal.targetName);
                const timeframeInfo = TIMEFRAME_LABELS[goal.timeframe] || TIMEFRAME_LABELS.mittelfristig;

                return (
                  <div
                    key={goal.id}
                    className="bg-slate-950/80 border border-slate-800/90 rounded-xl overflow-hidden transition-all hover:border-slate-700"
                  >
                    {/* Kopfzeile der Zielkarte */}
                    <div
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none flex-wrap bg-slate-900/40 hover:bg-slate-900/70 transition-colors"
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

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${timeframeInfo.badgeClass}`}>
                              {timeframeInfo.title}
                            </span>

                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-cyan-300">
                              {targetDisplay}
                            </span>

                            {goal.mainGoalTitle?.trim() && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-700/40 text-indigo-300">
                                Hauptziel: {goal.mainGoalTitle}
                              </span>
                            )}
                          </div>

                          {goal.description && !isExpanded && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityInfo.badgeClass}`}>
                          {priorityInfo.label}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>

                        {typeof goal.progress === 'number' && (
                          <div className="flex items-center gap-1.5 hidden sm:flex">
                            <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                              <div
                                className="bg-cyan-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                              ></div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono w-7 text-right">
                              {goal.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailbereich der Zielkarte */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800/80 space-y-4 bg-slate-950/50">
                        {/* Zeile 1: Titel, Zeithorizont & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Titel des Ziels
                            </label>
                            <input
                              type="text"
                              value={goal.title}
                              onChange={e => handleUpdateGoal(goal.id, { title: e.target.value })}
                              placeholder="Zielbezeichnung eintragen..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                            />
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Gliederung / Frist
                            </label>
                            <select
                              value={goal.timeframe}
                              onChange={e => handleUpdateGoal(goal.id, { timeframe: e.target.value as GoalTimeframe })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="kurzfristig">Kurzfristig</option>
                              <option value="mittelfristig">Mittelfristig</option>
                              <option value="langfristig">Langfristig</option>
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

                        {/* Zeile 1b: Übergeordnetes Hauptziel */}
                        <div className="flex flex-col gap-1 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Zugehöriges übergeordnetes Hauptziel (Optional)</span>
                            <span className="text-[9px] text-slate-500 normal-case">Ordnungsrahmen für Etappenziele</span>
                          </label>
                          <input
                            type="text"
                            value={goal.mainGoalTitle || ''}
                            onChange={e => handleUpdateGoal(goal.id, { mainGoalTitle: e.target.value })}
                            placeholder="Titel des übergeordneten Hauptziels eintragen..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Zeile 2: Zielbereich, Zielobjekt, Priorität & Fortschritt */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Zielbereich
                            </label>
                            <select
                              value={normalizeGoalDomain(goal.targetType)}
                              onChange={e => {
                                const newDomain = e.target.value as GoalDomain;
                                let defaultName = 'Selbst';
                                let defaultId: string | undefined = undefined;

                                if (newDomain === 'character') {
                                  defaultName = codexCharacters[0]?.title || '';
                                  defaultId = codexCharacters[0]?.id;
                                } else if (newDomain === 'faction') {
                                  defaultName = codexFactions[0]?.title || '';
                                  defaultId = codexFactions[0]?.id;
                                }

                                handleUpdateGoal(goal.id, {
                                  targetType: newDomain,
                                  targetName: defaultName,
                                  targetId: defaultId
                                });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                            >
                              <option value="self">Persönliches Ziel</option>
                              <option value="character">Ziel gegenüber Charakter</option>
                              <option value="faction">Ziel gegenüber Fraktion</option>
                            </select>
                          </div>

                          <div className="md:col-span-4 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Adressat / Zielobjekt
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
                                value={goal.targetName || 'Selbst'}
                                onChange={e => handleUpdateGoal(goal.id, { targetName: e.target.value })}
                                placeholder="Persönlicher Bereich oder Thema..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
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
                              <option value="kritisch">Kritisch</option>
                              <option value="hoch">Hoch</option>
                              <option value="normal">Normal</option>
                              <option value="niedrig">Niedrig</option>
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

                        {/* Zeile 2b: Verknüpfung mit Beziehung */}
                        {relationships.length > 0 && goal.targetType === 'character' && (
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
                              Verbindet den inneren Antrieb mit diesem Vorhaben.
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
                              Beschreibung der Ausgangslage und des angestrebten Zustands.
                            </span>
                          </div>
                        </div>

                        {/* Zeile 4: Aktiver Handlungsplan (WIE) */}
                        <div className="flex flex-col gap-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <i className="fa-solid fa-list-check text-cyan-500"></i>
                              <span>Aktiver Handlungsplan (Wie soll das Ziel erreicht werden?)</span>
                            </label>
                            <span className="text-[9px] text-slate-500">
                              Konkrete Schrittfolge für Handlungen und Spielleiter
                            </span>
                          </div>
                          <AutoExpandingTextarea
                            value={goal.activePlan || ''}
                            onChange={e => handleUpdateGoal(goal.id, { activePlan: e.target.value })}
                            placeholder="1. Schritt: Erste Maßnahme&#10;2. Schritt: Vorbereitung oder Bündnis&#10;3. Schritt: Umsetzung..."
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
                                      placeholder="Hindernis oder Risiko beschreiben..."
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

                        {/* Fußzeile der Zielkarte */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex-wrap gap-2">
                          <span className="font-mono">
                            ID: {goal.id}
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
