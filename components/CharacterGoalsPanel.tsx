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

interface DomainConfig {
  id: GoalDomain;
  title: string;
  createTitle: string;
  shortTitle: string;
  description: string;
  icon: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  targetType: GoalTargetType;
}

const DOMAINS: DomainConfig[] = [
  {
    id: 'self',
    title: 'Persönliche Ziele',
    createTitle: 'Persönliches Ziel',
    shortTitle: 'Persönlich',
    description: 'Eigene Entwicklung, Meisterschaft, Überleben, Wohlstand, Lebenswerk oder innere Wandlung.',
    icon: 'fa-user',
    accentColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-950/20',
    targetType: 'self'
  },
  {
    id: 'character',
    title: 'Ziele gegenüber Charakteren',
    createTitle: 'Ziel gegenüber Charakter',
    shortTitle: 'Charaktere',
    description: 'Absichten, Vorhaben, Rivalitäten, Loyalitäten oder Schutzabsichten bezüglich konkreter Personen.',
    icon: 'fa-user-group',
    accentColor: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-950/20',
    targetType: 'character'
  },
  {
    id: 'faction',
    title: 'Ziele gegenüber Fraktionen',
    createTitle: 'Ziel gegenüber Fraktion',
    shortTitle: 'Fraktionen',
    description: 'Aufstieg, Einflussnahme, Mitgliedschaft, Opposition oder Bündnisse mit Gilden und Organisationen.',
    icon: 'fa-shield-halved',
    accentColor: 'text-purple-300',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-950/20',
    targetType: 'faction'
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
  const [activeDomainTab, setActiveDomainTab] = useState<'alle' | GoalDomain>('alle');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  // State für Hauptziel-3-Stufen-Erstellung
  const [mainGoalInput, setMainGoalInput] = useState<string>('');
  const [mainGoalDomain, setMainGoalDomain] = useState<GoalDomain>('self');
  const [mainGoalTargetId, setMainGoalTargetId] = useState<string>('');
  const [mainGoalTargetName, setMainGoalTargetName] = useState<string>('Selbst');
  const [isMainGoalBoxOpen, setIsMainGoalBoxOpen] = useState<boolean>(true);

  const toggleGoalExpanded = (id: string) => {
    setExpandedGoalIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const normalizeGoalDomain = (targetType?: GoalTargetType): GoalDomain => {
    if (targetType === 'character') return 'character';
    if (targetType === 'faction') return 'faction';
    return 'self'; // 'self' or 'world' or undefined
  };

  const handleAddGoal = (defaultDomain?: GoalDomain, defaultTimeframe: GoalTimeframe = 'mittelfristig') => {
    if (!isOpen) {
      onToggleOpen();
    }
    const domain = defaultDomain || (activeDomainTab !== 'alle' ? activeDomainTab : 'self');
    const newId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    let defaultTargetName = 'Selbst';
    let defaultTargetId: string | undefined = undefined;

    if (domain === 'character') {
      defaultTargetName = codexCharacters[0]?.title || '';
      defaultTargetId = codexCharacters[0]?.id;
    } else if (domain === 'faction') {
      defaultTargetName = codexFactions[0]?.title || '';
      defaultTargetId = codexFactions[0]?.id;
    }

    const newGoal: CharacterGoal = {
      id: newId,
      title: '',
      description: '',
      timeframe: defaultTimeframe,
      targetType: domain,
      targetName: defaultTargetName,
      targetId: defaultTargetId,
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
    setActiveDomainTab(domain);
  };

  const handleCreate3TierGoalsManually = () => {
    if (!isOpen) {
      onToggleOpen();
    }
    const mainGoalTitle = mainGoalInput.trim() || 'Hauptziel';
    let targetName = mainGoalTargetName || 'Selbst';
    let targetId = mainGoalTargetId || undefined;

    if (mainGoalDomain === 'character' && !targetId && codexCharacters.length > 0) {
      targetId = codexCharacters[0].id;
      targetName = codexCharacters[0].title;
    } else if (mainGoalDomain === 'faction' && !targetId && codexFactions.length > 0) {
      targetId = codexFactions[0].id;
      targetName = codexFactions[0].title;
    }

    const now = new Date().toISOString();
    const shortId = `goal-${Date.now()}-short-${Math.random().toString(36).substring(2, 6)}`;
    const mediumId = `goal-${Date.now()}-med-${Math.random().toString(36).substring(2, 6)}`;
    const longId = `goal-${Date.now()}-long-${Math.random().toString(36).substring(2, 6)}`;

    const shortGoal: CharacterGoal = {
      id: shortId,
      title: `Kurzfristiges Ziel: Vorbereitung für ${mainGoalTitle}`,
      mainGoalTitle: mainGoalTitle,
      timeframe: 'kurzfristig',
      targetType: mainGoalDomain,
      targetName,
      targetId,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: `Erster notwendiger Schritt zur Erreichung des Hauptziels "${mainGoalTitle}".`,
      activePlan: `1. Schritt: Vorbereitungen treffen und Informationen sammeln\n2. Schritt: Erste Kontakte knüpfen und Ressourcen sichern`,
      alternativePlans: [],
      obstacles: [],
      createdAt: now
    };

    const mediumGoal: CharacterGoal = {
      id: mediumId,
      title: `Mittelfristiges Ziel: Meilenstein für ${mainGoalTitle}`,
      mainGoalTitle: mainGoalTitle,
      timeframe: 'mittelfristig',
      targetType: mainGoalDomain,
      targetName,
      targetId,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: `Zentrale Zwischenetappe zur Umsetzung des Hauptziels "${mainGoalTitle}".`,
      activePlan: `1. Schritt: Hauptprüfung oder Zwischenziel absolvieren\n2. Schritt: Position festigen und nächste Phase einleiten`,
      alternativePlans: [],
      obstacles: [],
      createdAt: now
    };

    const longGoal: CharacterGoal = {
      id: longId,
      title: `Langfristiges Ziel: Vollendung von ${mainGoalTitle}`,
      mainGoalTitle: mainGoalTitle,
      timeframe: 'langfristig',
      targetType: mainGoalDomain,
      targetName,
      targetId,
      priority: 'kritisch',
      status: 'aktiv',
      progress: 0,
      motivation: `Vollständige Erreichung und dauerhafte Sicherung des Hauptziels "${mainGoalTitle}".`,
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
    setActiveDomainTab(mainGoalDomain);
  };

  const handleGenerateMainGoalWithAI = () => {
    if (!mainGoalInput.trim()) return;
    if (!isOpen) {
      onToggleOpen();
    }
    let targetName = mainGoalTargetName || 'Selbst';
    let targetId = mainGoalTargetId || undefined;

    if (mainGoalDomain === 'character' && !targetId && codexCharacters.length > 0) {
      targetId = codexCharacters[0].id;
      targetName = codexCharacters[0].title;
    } else if (mainGoalDomain === 'faction' && !targetId && codexFactions.length > 0) {
      targetId = codexFactions[0].id;
      targetName = codexFactions[0].title;
    }

    if (onGenerateMainGoalAI) {
      onGenerateMainGoalAI(mainGoalInput.trim(), mainGoalDomain, targetName, targetId);
    } else {
      onGenerateAI();
    }
  };

  const handleTakeFromMotivationCore = () => {
    if (motivationCore?.mainGoal?.trim()) {
      setMainGoalInput(motivationCore.mainGoal.trim());
    }
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

  // Goal counts per domain
  const domainCounts = useMemo(() => {
    const counts: Record<GoalDomain, number> = {
      self: 0,
      character: 0,
      faction: 0
    };
    goals.forEach(g => {
      const d = normalizeGoalDomain(g.targetType);
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [goals]);

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

  // Render individual goal card
  const renderGoalCard = (goal: CharacterGoal) => {
    const isExpanded = !!expandedGoalIds[goal.id];
    const priorityInfo = getPriorityLabel(goal.priority);
    const statusInfo = getStatusLabel(goal.status);
    const targetDisplay = getTargetTypeDisplay(goal.targetType, goal.targetName);
    const timeframeInfo = TIMEFRAME_LABELS[goal.timeframe] || TIMEFRAME_LABELS.mittelfristig;

    return (
      <div
        key={goal.id}
        className="bg-slate-950/80 border border-slate-800/90 rounded-xl overflow-hidden transition-all hover:border-slate-700"
      >
        {/* Header-Zeile der Karte */}
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

        {/* Ausgeklappter Detailbereich */}
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

            {/* Zeile 1b: Übergeordnetes Hauptziel (Verknüpfung) */}
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

            {/* Zeile 2b: Verknüpfung mit bestehender Beziehung (optional) */}
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

            {/* Zeile 4: Aktiver Plan (WIE) */}
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

            {/* Fußzeile mit Aktionen */}
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
  };

  // Render a specific domain section
  const renderDomainSection = (domainConfig: DomainConfig) => {
    const domainGoals = goals.filter(g => normalizeGoalDomain(g.targetType) === domainConfig.id);

    return (
      <div
        key={domainConfig.id}
        className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-4"
      >
        {/* Domain-Kopfzeile */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-lg ${domainConfig.bgColor} border ${domainConfig.borderColor} flex items-center justify-center ${domainConfig.accentColor} text-xs shrink-0`}>
              <i className={`fa-solid ${domainConfig.icon}`}></i>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-200 font-bold">
                  {domainConfig.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {domainGoals.length} {domainGoals.length === 1 ? 'Ziel' : 'Ziele'}
                </span>
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">
                {domainConfig.description}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddGoal(domainConfig.id, 'mittelfristig')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>+ {domainConfig.createTitle} anlegen</span>
          </button>
        </div>

        {/* Zielliste */}
        {domainGoals.length === 0 ? (
          <div className="px-4 py-6 bg-slate-950/40 rounded-xl border border-slate-800/40 text-xs text-slate-500 text-center space-y-2">
            <p>Keine {domainConfig.title.toLowerCase()} eingetragen.</p>
            <button
              type="button"
              onClick={() => handleAddGoal(domainConfig.id, 'mittelfristig')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>+ {domainConfig.createTitle} anlegen</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {domainGoals.map(goal => renderGoalCard(goal))}
          </div>
        )}
      </div>
    );
  };

  const displayedDomains = activeDomainTab === 'alle' 
    ? DOMAINS.filter(d => (domainCounts[d.id] || 0) > 0)
    : DOMAINS.filter(d => d.id === activeDomainTab);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Header (einklappbar mit direkten Aktionen zum Erstellen) */}
      <div className="p-4 flex items-center justify-between gap-3 bg-slate-950/40 border-b border-slate-800/80 flex-wrap">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 text-left cursor-pointer group min-w-[180px]"
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
              Hauptziele mit kurz-, mittel- und langfristigen Etappen
            </span>
          </div>
        </button>

        {/* Direkte Erstellungs-Tags & KI-Vorschlag */}
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
            onClick={() => handleAddGoal('self')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Neues einzelnes persönliches Ziel anlegen"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <i className="fa-solid fa-user text-[10px] opacity-70"></i>
            <span>Persönliches Ziel</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddGoal('character')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Neues einzelnes Ziel gegenüber einem Charakter anlegen"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <i className="fa-solid fa-user-group text-[10px] opacity-70"></i>
            <span>Ziel gegenüber Charakter</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddGoal('faction')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-purple-500/40 hover:border-purple-400 text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Neues einzelnes Ziel gegenüber einer Fraktion anlegen"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <i className="fa-solid fa-shield-halved text-[10px] opacity-70"></i>
            <span>Ziel gegenüber Fraktion</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5 animate-in fade-in duration-200">
          {/* NEUER BEREICH: Hauptziel vorgeben & 3-Stufen-Ziele (Kurz-, Mittel- und Langfristig) in einem erstellen */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4.5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs shrink-0">
                  <i className="fa-solid fa-bullseye"></i>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Hauptziel mit 3-Stufen-Etappen erstellen</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-normal">
                      Kurzfristig &rarr; Mittelfristig &rarr; Langfristig
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gib ein Hauptziel vor. Es werden automatisch die kurz-, mittel- und langfristigen Ziele erzeugt, die beschreiben, wie dieses Hauptziel schrittweise erreicht werden kann.
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
                  onClick={() => setIsMainGoalBoxOpen(prev => !prev)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  <i className={`fa-solid ${isMainGoalBoxOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </button>
              </div>
            </div>

            {isMainGoalBoxOpen && (
              <div className="space-y-3.5">
                {/* Hauptziel Eingabe */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    Übergeordnetes Hauptziel
                  </label>
                  <AutoExpandingTextarea
                    value={mainGoalInput}
                    onChange={e => setMainGoalInput(e.target.value)}
                    placeholder="Übergeordnetes Hauptziel formulieren (z. B. Aufnahme in die Magier-Akademie, Rache an den Schattenfürsten, Reichtum durch Handel)..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 min-h-[50px] font-medium"
                  />
                </div>

                {/* Zielbereich & Zielobjekt für das Hauptziel */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Zielbereich des Hauptziels
                    </label>
                    <select
                      value={mainGoalDomain}
                      onChange={e => {
                        const d = e.target.value as GoalDomain;
                        setMainGoalDomain(d);
                        if (d === 'self') {
                          setMainGoalTargetName('Selbst');
                          setMainGoalTargetId('');
                        } else if (d === 'character') {
                          setMainGoalTargetName(codexCharacters[0]?.title || '');
                          setMainGoalTargetId(codexCharacters[0]?.id || '');
                        } else if (d === 'faction') {
                          setMainGoalTargetName(codexFactions[0]?.title || '');
                          setMainGoalTargetId(codexFactions[0]?.id || '');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    >
                      <option value="self">Persönliches Ziel</option>
                      <option value="character">Ziel gegenüber Charakter</option>
                      <option value="faction">Ziel gegenüber Fraktion</option>
                    </select>
                  </div>

                  {mainGoalDomain === 'character' && (
                    <div className="md:col-span-8 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Ziel-Charakter
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={mainGoalTargetId}
                          onChange={e => {
                            const selected = codexCharacters.find(c => c.id === e.target.value);
                            setMainGoalTargetId(e.target.value);
                            if (selected) setMainGoalTargetName(selected.title);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Charakter aus Codex wählen --</option>
                          {codexCharacters.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="oder freier Name..."
                          value={mainGoalTargetName}
                          onChange={e => setMainGoalTargetName(e.target.value)}
                          className="w-40 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}

                  {mainGoalDomain === 'faction' && (
                    <div className="md:col-span-8 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Ziel-Fraktion
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={mainGoalTargetId}
                          onChange={e => {
                            const selected = codexFactions.find(f => f.id === e.target.value);
                            setMainGoalTargetId(e.target.value);
                            if (selected) setMainGoalTargetName(selected.title);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Fraktion aus Codex wählen --</option>
                          {codexFactions.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="oder freier Name..."
                          value={mainGoalTargetName}
                          onChange={e => setMainGoalTargetName(e.target.value)}
                          className="w-40 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}

                  {mainGoalDomain === 'self' && (
                    <div className="md:col-span-8 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Persönlicher Schwerpunkt
                      </label>
                      <input
                        type="text"
                        value={mainGoalTargetName}
                        onChange={e => setMainGoalTargetName(e.target.value)}
                        placeholder="Persönlicher Bereich (z. B. Magiemeisterschaft, Überleben, Wohlstand)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>

                {/* Aktionen zum Erstellen der 3 Ziele */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateMainGoalWithAI}
                    disabled={!mainGoalInput.trim() || isGeneratingAI}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <i className={`fa-solid fa-wand-magic-sparkles ${isGeneratingAI ? 'animate-spin' : ''}`}></i>
                    <span>
                      {isGeneratingAI
                        ? 'Generiere 3-Stufen-Ziele...'
                        : 'Kurz-, mittel- und langfristiges Ziel per KI generieren'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreate3TierGoalsManually}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-layer-group text-slate-400"></i>
                    <span>3 Etappen manuell anlegen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter-Tabs für Zielbereiche (nur wenn Ziele vorhanden sind) */}
          {goals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1">
                Filter:
              </span>
              
              <button
                type="button"
                onClick={() => setActiveDomainTab('alle')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDomainTab === 'alle'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span>Alle Zielbereiche</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                  {goals.length}
                </span>
              </button>

              {DOMAINS.map(domain => {
                const count = domainCounts[domain.id] || 0;
                const isActive = activeDomainTab === domain.id;

                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => setActiveDomainTab(domain.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <i className={`fa-solid ${domain.icon} text-[10px]`}></i>
                    <span>{domain.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bereichsliste */}
          {goals.length === 0 ? (
            <div className="text-xs text-slate-400 px-4 py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p>
                Bisher sind keine Ziele für diesen Charakter hinterlegt. Gib oben ein Hauptziel ein, um automatisch die kurz-, mittel- und langfristigen Etappen zu erstellen, oder lege einzelne Ziele über die Schaltflächen an.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedDomains.map(domain => renderDomainSection(domain))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterGoalsPanel;
