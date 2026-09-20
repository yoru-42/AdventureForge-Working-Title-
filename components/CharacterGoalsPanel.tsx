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

const ensureString = (val: any): string => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).filter(Boolean).join(', ');
  if (val !== null && val !== undefined && typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return val ? String(val) : '';
};

export const CharacterGoalsPanel: React.FC<Props> = ({
  goals = [],
  onChange,
  codexCharacters = [],
  codexFactions = [],
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
  // Available characters including player/user if not current character
  const availableCharacterOptions = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    const effectivePlayerName = playerName?.trim();
    const isCurrentCharThePlayer = effectivePlayerName && (
      (characterName && characterName.trim().toLowerCase() === effectivePlayerName.toLowerCase()) ||
      (sourceCharacterName && sourceCharacterName.trim().toLowerCase() === effectivePlayerName.toLowerCase())
    );

    const hasPlayerInList = codexCharacters.some(c => 
      c.id === 'player_user' || 
      c.id === 'player' || 
      (effectivePlayerName && c.title.toLowerCase().includes(effectivePlayerName.toLowerCase()))
    );

    if (!isCurrentCharThePlayer && !hasPlayerInList) {
      list.push({
        id: 'player_user',
        title: effectivePlayerName ? `Spieler: ${effectivePlayerName}` : 'Spieler / Nutzer'
      });
    }

    codexCharacters.forEach(c => {
      const isSelf = (
        (characterName && c.title.trim().toLowerCase() === characterName.trim().toLowerCase()) ||
        (sourceCharacterName && c.title.trim().toLowerCase() === sourceCharacterName.trim().toLowerCase())
      );
      if (!isSelf) {
        list.push(c);
      }
    });

    return list;
  }, [codexCharacters, playerName, characterName, sourceCharacterName]);

  // Filter tab for listing goals
  const [activeFilter, setActiveFilter] = useState<'alle' | GoalDomain>('alle');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  // Creator Form Visibility & Edit Mode
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(true);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form Fields
  const [mainGoal, setMainGoal] = useState<string>('');
  const [domain, setDomain] = useState<GoalDomain>('self');
  const [targetName, setTargetName] = useState<string>('Selbst');
  const [targetId, setTargetId] = useState<string>('');
  const [linkedRelId, setLinkedRelId] = useState<string>('');
  
  const [motivation, setMotivation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [activePlan, setActivePlan] = useState<string>('');

  const [shortTermPlan, setShortTermPlan] = useState<string>('');
  const [mediumTermPlan, setMediumTermPlan] = useState<string>('');
  const [longTermPlan, setLongTermPlan] = useState<string>('');

  const [alternativePlans, setAlternativePlans] = useState<string[]>([]);
  const [obstacles, setObstacles] = useState<string[]>([]);

  const [timeframe, setTimeframe] = useState<GoalTimeframe>('mittelfristig');
  const [priority, setPriority] = useState<GoalPriority>('normal');
  const [status, setStatus] = useState<GoalStatus>('aktiv');
  const [progress, setProgress] = useState<number>(0);

  const toggleGoalExpanded = (id: string) => {
    setExpandedGoalIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const normalizeGoalDomain = (targetType?: GoalTargetType): GoalDomain => {
    if (targetType === 'character') return 'character';
    if (targetType === 'faction') return 'faction';
    return 'self';
  };

  const handleDomainSelect = (newDomain: GoalDomain) => {
    setDomain(newDomain);
    if (newDomain === 'self') {
      setTargetName('Selbst');
      setTargetId('');
    } else if (newDomain === 'character') {
      const defaultChar = availableCharacterOptions[0];
      setTargetName(defaultChar ? defaultChar.title : '');
      setTargetId(defaultChar ? defaultChar.id : '');
    } else if (newDomain === 'faction') {
      const defaultFaction = codexFactions[0];
      setTargetName(defaultFaction ? defaultFaction.title : '');
      setTargetId(defaultFaction ? defaultFaction.id : '');
    }
  };

  const handleTakeFromMotivationCore = () => {
    const safeMainGoal = ensureString(motivationCore?.mainGoal).trim();
    const safeWhyGoal = ensureString(motivationCore?.whyGoal).trim();
    const safeMethods = ensureString(motivationCore?.methodsAndMeans).trim();
    const safeFears = ensureString(motivationCore?.fears).trim();

    if (safeMainGoal) {
      setMainGoal(safeMainGoal);
    }
    if (safeWhyGoal && !motivation.trim()) {
      setMotivation(safeWhyGoal);
    }
    if (safeMethods && !activePlan.trim()) {
      setActivePlan(safeMethods);
    }
    if (safeFears && obstacles.length === 0) {
      setObstacles([safeFears]);
    }
  };

  const handleResetForm = () => {
    setEditingGoalId(null);
    setMainGoal('');
    setDomain('self');
    setTargetName('Selbst');
    setTargetId('');
    setLinkedRelId('');
    setMotivation('');
    setDescription('');
    setActivePlan('');
    setShortTermPlan('');
    setMediumTermPlan('');
    setLongTermPlan('');
    setAlternativePlans([]);
    setObstacles([]);
    setTimeframe('mittelfristig');
    setPriority('normal');
    setStatus('aktiv');
    setProgress(0);
  };

  const handleLoadGoalIntoForm = (goal: CharacterGoal) => {
    setEditingGoalId(goal.id);
    setMainGoal(goal.title || goal.mainGoalTitle || '');
    setDomain(normalizeGoalDomain(goal.targetType));
    setTargetName(goal.targetName || (goal.targetType === 'self' ? 'Selbst' : ''));
    setTargetId(goal.targetId || '');
    setLinkedRelId(goal.linkedRelationshipId || '');
    setMotivation(goal.motivation || '');
    setDescription(goal.description || '');
    setActivePlan(goal.activePlan || '');
    setShortTermPlan(goal.shortTermPlan || '');
    setMediumTermPlan(goal.mediumTermPlan || '');
    setLongTermPlan(goal.longTermPlan || '');
    setAlternativePlans(goal.alternativePlans ? [...goal.alternativePlans] : []);
    setObstacles(goal.obstacles ? [...goal.obstacles] : []);
    setTimeframe(goal.timeframe || 'mittelfristig');
    setPriority((typeof goal.priority === 'string' ? goal.priority : 'normal') as GoalPriority);
    setStatus(goal.status || 'aktiv');
    setProgress(goal.progress ?? 0);

    setIsCreatorOpen(true);
    if (!isOpen) onToggleOpen();
  };

  // Add Alternative Plan
  const handleAddAltPlan = () => {
    setAlternativePlans(prev => [...prev, '']);
  };

  const handleUpdateAltPlan = (idx: number, text: string) => {
    setAlternativePlans(prev => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
  };

  const handleRemoveAltPlan = (idx: number) => {
    setAlternativePlans(prev => prev.filter((_, i) => i !== idx));
  };

  // Add Obstacle
  const handleAddObstacleItem = () => {
    setObstacles(prev => [...prev, '']);
  };

  const handleUpdateObstacleItem = (idx: number, text: string) => {
    setObstacles(prev => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
  };

  const handleRemoveObstacleItem = (idx: number) => {
    setObstacles(prev => prev.filter((_, i) => i !== idx));
  };

  // Save Goal to State
  const handleSaveGoal = () => {
    if (!isOpen) onToggleOpen();

    const titleToSave = mainGoal.trim() || 'Neues Ziel';
    const now = new Date().toISOString();

    const goalData: CharacterGoal = {
      id: editingGoalId || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: titleToSave,
      mainGoalTitle: titleToSave,
      description: description.trim() || undefined,
      timeframe,
      targetType: domain,
      targetName: targetName.trim() || (domain === 'self' ? 'Selbst' : ''),
      targetId: targetId || undefined,
      priority,
      status,
      progress,
      motivation: motivation.trim() || undefined,
      activePlan: activePlan.trim() || undefined,
      shortTermPlan: shortTermPlan.trim() || undefined,
      mediumTermPlan: mediumTermPlan.trim() || undefined,
      longTermPlan: longTermPlan.trim() || undefined,
      alternativePlans: alternativePlans.filter(p => p.trim().length > 0),
      obstacles: obstacles.filter(o => o.trim().length > 0),
      linkedRelationshipId: domain === 'character' && linkedRelId ? linkedRelId : undefined,
      createdAt: now,
      updatedAt: now
    };

    if (editingGoalId) {
      onChange(goals.map(g => (g.id === editingGoalId ? { ...g, ...goalData, createdAt: g.createdAt } : g)));
    } else {
      onChange([...goals, goalData]);
      setExpandedGoalIds(prev => ({ ...prev, [goalData.id]: true }));
    }

    handleResetForm();
    setActiveFilter('alle');
  };

  // Save as 3 Progressive Stage Goals (Kurz, Mittel, Lang)
  const handleSaveAs3TierGoals = () => {
    if (!isOpen) onToggleOpen();

    const baseTitle = mainGoal.trim() || 'Hauptziel';
    const targetN = targetName.trim() || (domain === 'self' ? 'Selbst' : '');
    const now = new Date().toISOString();
    const cleanAlts = alternativePlans.filter(p => p.trim().length > 0);
    const cleanObs = obstacles.filter(o => o.trim().length > 0);

    const shortId = `goal-${Date.now()}-short-${Math.random().toString(36).substring(2, 6)}`;
    const medId = `goal-${Date.now()}-med-${Math.random().toString(36).substring(2, 6)}`;
    const longId = `goal-${Date.now()}-long-${Math.random().toString(36).substring(2, 6)}`;

    const shortGoal: CharacterGoal = {
      id: shortId,
      title: `Kurzfristiges Ziel: Vorbereitung für ${baseTitle}`,
      mainGoalTitle: baseTitle,
      description: description.trim() || undefined,
      timeframe: 'kurzfristig',
      targetType: domain,
      targetName: targetN,
      targetId: targetId || undefined,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: motivation.trim() || `Unmittelbarer Auftakt zur Erreichung von "${baseTitle}".`,
      activePlan: shortTermPlan.trim() || activePlan.trim() || '1. Schritt: Vorbereitung treffen und Informationen sichern',
      shortTermPlan: shortTermPlan.trim() || undefined,
      mediumTermPlan: mediumTermPlan.trim() || undefined,
      longTermPlan: longTermPlan.trim() || undefined,
      alternativePlans: cleanAlts,
      obstacles: cleanObs,
      linkedRelationshipId: domain === 'character' && linkedRelId ? linkedRelId : undefined,
      createdAt: now
    };

    const medGoal: CharacterGoal = {
      id: medId,
      title: `Mittelfristiges Ziel: Meilenstein für ${baseTitle}`,
      mainGoalTitle: baseTitle,
      description: description.trim() || undefined,
      timeframe: 'mittelfristig',
      targetType: domain,
      targetName: targetN,
      targetId: targetId || undefined,
      priority: 'hoch',
      status: 'aktiv',
      progress: 0,
      motivation: motivation.trim() || `Zentrale Zwischenetappe zur Umsetzung von "${baseTitle}".`,
      activePlan: mediumTermPlan.trim() || activePlan.trim() || '1. Schritt: Hauptetappe absolvieren und Position festigen',
      shortTermPlan: shortTermPlan.trim() || undefined,
      mediumTermPlan: mediumTermPlan.trim() || undefined,
      longTermPlan: longTermPlan.trim() || undefined,
      alternativePlans: cleanAlts,
      obstacles: cleanObs,
      linkedRelationshipId: domain === 'character' && linkedRelId ? linkedRelId : undefined,
      createdAt: now
    };

    const longGoal: CharacterGoal = {
      id: longId,
      title: `Langfristiges Ziel: Vollendung von ${baseTitle}`,
      mainGoalTitle: baseTitle,
      description: description.trim() || undefined,
      timeframe: 'langfristig',
      targetType: domain,
      targetName: targetN,
      targetId: targetId || undefined,
      priority: 'kritisch',
      status: 'aktiv',
      progress: 0,
      motivation: motivation.trim() || `Vollständige Erreichung und dauerhafte Sicherung von "${baseTitle}".`,
      activePlan: longTermPlan.trim() || activePlan.trim() || '1. Schritt: Finale Maßnahme durchführen und Ergebnis absichern',
      shortTermPlan: shortTermPlan.trim() || undefined,
      mediumTermPlan: mediumTermPlan.trim() || undefined,
      longTermPlan: longTermPlan.trim() || undefined,
      alternativePlans: cleanAlts,
      obstacles: cleanObs,
      linkedRelationshipId: domain === 'character' && linkedRelId ? linkedRelId : undefined,
      createdAt: now
    };

    onChange([...goals, shortGoal, medGoal, longGoal]);
    setExpandedGoalIds(prev => ({
      ...prev,
      [shortId]: true,
      [medId]: true,
      [longId]: true
    }));

    handleResetForm();
    setActiveFilter('alle');
  };

  // AI Generation for Main Goal
  const handleGenerateAIForCurrent = () => {
    if (!mainGoal.trim()) {
      onGenerateAI();
      return;
    }
    if (!isOpen) onToggleOpen();

    let tName = targetName.trim() || 'Selbst';
    let tId = targetId || undefined;

    if (domain === 'character' && !tId && availableCharacterOptions.length > 0) {
      tId = availableCharacterOptions[0].id;
      tName = availableCharacterOptions[0].title;
    } else if (domain === 'faction' && !tId && codexFactions.length > 0) {
      tId = codexFactions[0].id;
      tName = codexFactions[0].title;
    }

    if (onGenerateMainGoalAI) {
      onGenerateMainGoalAI(mainGoal.trim(), domain, tName, tId);
    } else {
      onGenerateAI();
    }
  };

  // Inline Goal Updates
  const handleUpdateGoal = (id: string, partial: Partial<CharacterGoal>) => {
    const updated = goals.map(g => (g.id === id ? { ...g, ...partial, updatedAt: new Date().toISOString() } : g));
    onChange(updated);
  };

  const handleDeleteGoal = (id: string) => {
    onChange(goals.filter(g => g.id !== id));
    if (editingGoalId === id) {
      handleResetForm();
    }
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

  // Inline Alternative Plans
  const handleAddInlineAltPlan = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const current = goal.alternativePlans || [];
    handleUpdateGoal(goalId, { alternativePlans: [...current, ''] });
  };

  const handleUpdateInlineAltPlan = (goalId: string, index: number, text: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = [...(goal.alternativePlans || [])];
    next[index] = text;
    handleUpdateGoal(goalId, { alternativePlans: next });
  };

  const handleRemoveInlineAltPlan = (goalId: string, index: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = (goal.alternativePlans || []).filter((_, i) => i !== index);
    handleUpdateGoal(goalId, { alternativePlans: next });
  };

  // Inline Obstacles
  const handleAddInlineObstacle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const current = goal.obstacles || [];
    handleUpdateGoal(goalId, { obstacles: [...current, ''] });
  };

  const handleUpdateInlineObstacle = (goalId: string, index: number, text: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = [...(goal.obstacles || [])];
    next[index] = text;
    handleUpdateGoal(goalId, { obstacles: next });
  };

  const handleRemoveInlineObstacle = (goalId: string, index: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const next = (goal.obstacles || []).filter((_, i) => i !== index);
    handleUpdateGoal(goalId, { obstacles: next });
  };

  // Domain Counts
  const counts = useMemo(() => {
    const c = { self: 0, character: 0, faction: 0 };
    goals.forEach(g => {
      const d = normalizeGoalDomain(g.targetType);
      c[d] = (c[d] || 0) + 1;
    });
    return c;
  }, [goals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    if (activeFilter === 'alle') return goals;
    return goals.filter(g => normalizeGoalDomain(g.targetType) === activeFilter);
  }, [goals, activeFilter]);

  const getPriorityInfo = (p?: GoalPriority | number) => {
    switch (p) {
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

  const getStatusInfo = (s?: GoalStatus) => {
    switch (s) {
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

  const getTargetTypeDisplay = (tType?: GoalTargetType, tName?: string) => {
    switch (tType) {
      case 'character':
        return tName?.trim() ? `Charakter: ${tName}` : 'Gegenüber Charakter';
      case 'faction':
        return tName?.trim() ? `Fraktion: ${tName}` : 'Gegenüber Fraktion';
      case 'world':
        return 'Welt & Allgemein';
      case 'self':
      default:
        return 'Persönlich';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Panel Header */}
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
              Persönliche Vorhaben, Vorhaben gegenüber Personen und Fraktionen
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
              handleResetForm();
            }}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Neues Ziel anlegen</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-6">
          {/* HAUPTFORMULAR FÜR ZIELE & PLÄNE */}
          <div className="bg-slate-950/85 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 space-y-5 shadow-lg transition-colors">
            {/* Formular-Kopfzeile */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs shrink-0">
                  <i className="fa-solid fa-bullseye"></i>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{editingGoalId ? 'Ziel bearbeiten' : 'Zielerfassung & Planung'}</span>
                    {editingGoalId && (
                      <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                        Bearbeitungsmodus
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formular zur Strukturierung von Zielen, Motivationen und mehrstufigen Handlungsplänen.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ensureString(motivationCore?.mainGoal).trim() && (
                  <button
                    type="button"
                    onClick={handleTakeFromMotivationCore}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    title={`Aus Motivationskern übernehmen: "${ensureString(motivationCore?.mainGoal)}"`}
                  >
                    Aus Motivationskern übernehmen
                  </button>
                )}

                {(mainGoal || motivation || activePlan || editingGoalId) && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    {editingGoalId ? 'Abbrechen' : 'Zurücksetzen'}
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
                {/* 1. OBEN GUT SICHTBAR: DAS HAUPTZIEL */}
                <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-cyan-900/40 shadow-inner">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-flag-checkered text-cyan-400 text-xs"></i>
                      <span>Hauptziel</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Zentrales übergeordnetes Vorhaben des Charakters
                    </span>
                  </div>
                  <AutoExpandingTextarea
                    value={mainGoal}
                    onChange={e => setMainGoal(e.target.value)}
                    placeholder="Übergeordnetes Hauptziel formulieren (z. B. Herrschaft über Falenas übernehmen, um ein gerechteres Reich zu schaffen)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 font-semibold min-h-[48px]"
                  />
                </div>

                {/* 2. ZIELBEREICH & ADRESSAT */}
                <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Zielbereich
                      </label>
                      <select
                        value={domain}
                        onChange={e => handleDomainSelect(e.target.value as GoalDomain)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      >
                        <option value="self">Persönliche Ziele</option>
                        <option value="character">Ziele gegenüber Charakteren</option>
                        <option value="faction">Ziele gegenüber Fraktionen</option>
                      </select>
                    </div>

                    <div className="md:col-span-8 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Adressat / Konkreter Bezug
                      </label>
                      {domain === 'self' && (
                        <input
                          type="text"
                          value={targetName}
                          onChange={e => setTargetName(e.target.value)}
                          placeholder="Persönlicher Schwerpunkt (z. B. Selbst, Magiemeisterschaft, Überleben, Wohlstand)..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
                        />
                      )}

                      {domain === 'character' && (
                        <select
                          value={targetId}
                          onChange={e => {
                            const selected = availableCharacterOptions.find(c => c.id === e.target.value);
                            setTargetId(e.target.value);
                            if (selected) setTargetName(selected.title);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Charakter / Nutzer wählen --</option>
                          {availableCharacterOptions.map((c, cIdx) => (
                            <option key={`form-char-target-${c.id || 'c'}-${cIdx}`} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      )}

                      {domain === 'faction' && (
                        <select
                          value={targetId}
                          onChange={e => {
                            const selected = codexFactions.find(f => f.id === e.target.value);
                            setTargetId(e.target.value);
                            if (selected) setTargetName(selected.title);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Fraktion aus Codex wählen --</option>
                          {codexFactions.map((f, fIdx) => (
                            <option key={`form-faction-target-${f.id || 'f'}-${fIdx}`} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Verknüpfte Beziehung (optional bei Charakter-Zielen) */}
                  {domain === 'character' && relationships.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Verknüpfte Beziehung (Optional)</span>
                        <span className="text-[9px] text-slate-500">Koppelt das Ziel an eine bestehende Beziehung</span>
                      </label>
                      <select
                        value={linkedRelId}
                        onChange={e => setLinkedRelId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Keine direkte Beziehungsbindung --</option>
                        {relationships.map((rel, rIdx) => (
                          <option key={`form-rel-link-${rel.id || 'r'}-${rIdx}`} value={rel.id}>
                            {rel.targetCharacter || 'Unbenannt'} ({rel.type || 'Beziehung'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. MOTIVATION & KONTEXT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                    <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-heart text-amber-500 text-[10px]"></i>
                      <span>Motivation / Warum dieses Ziel?</span>
                    </label>
                    <AutoExpandingTextarea
                      value={motivation}
                      onChange={e => setMotivation(e.target.value)}
                      placeholder="Persönlicher Antrieb, emotionaler Grund, Verpflichtung oder Schwur..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[56px]"
                    />
                    <span className="text-[9px] text-slate-500">
                      Beschreibt den inneren Antrieb hinter diesem Vorhaben.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                    <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-align-left text-slate-400 text-[10px]"></i>
                      <span>Kontext &amp; Beschreibung</span>
                    </label>
                    <AutoExpandingTextarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ausgangslage, Hintergrundinformationen und angestrebter Endzustand..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[56px]"
                    />
                    <span className="text-[9px] text-slate-500">
                      Rahmenbedingungen und Erfolgskriterien des Ziels.
                    </span>
                  </div>
                </div>

                {/* 4. AKTIVER HANDLUNGSPLAN (Wie soll das Ziel erreicht werden?) & 3-STUFEN ETAPPEN */}
                <div className="bg-slate-900/35 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-list-check text-cyan-400"></i>
                      <span>Aktiver Handlungsplan (Wie soll das Ziel erreicht werden?)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Gesamtstrategie und konkrete Schrittfolgen
                    </span>
                  </div>

                  {/* Übergreifender Handlungsplan */}
                  <AutoExpandingTextarea
                    value={activePlan}
                    onChange={e => setActivePlan(e.target.value)}
                    placeholder="Übergeordnete Vorgehensweise und Handlungsstrategie..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[50px]"
                  />

                  {/* 3 Frist-Felder: Kurzfristig, Mittelfristig, Langfristig */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Etappen zur Erreichung des Hauptziels
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Kurzfristig */}
                      <div className="flex flex-col gap-1 bg-slate-950/70 p-3 rounded-xl border border-teal-900/40">
                        <label className="text-[10px] text-teal-300 font-bold uppercase tracking-wider flex items-center gap-1">
                          <i className="fa-solid fa-forward-step text-[10px]"></i>
                          <span>Kurzfristig (Erste Schritte)</span>
                        </label>
                        <AutoExpandingTextarea
                          value={shortTermPlan}
                          onChange={e => setShortTermPlan(e.target.value)}
                          placeholder="Unmittelbare Vorbereitung, Informationsbeschaffung &amp; Sofortmaßnahmen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-teal-400 min-h-[56px]"
                        />
                      </div>

                      {/* Mittelfristig */}
                      <div className="flex flex-col gap-1 bg-slate-950/70 p-3 rounded-xl border border-cyan-900/40">
                        <label className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                          <i className="fa-solid fa-route text-[10px]"></i>
                          <span>Mittelfristig (Meilensteine)</span>
                        </label>
                        <AutoExpandingTextarea
                          value={mediumTermPlan}
                          onChange={e => setMediumTermPlan(e.target.value)}
                          placeholder="Zentrale Zwischenschritte, Bündnisse, Prüfungen &amp; Durchbrüche..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 min-h-[56px]"
                        />
                      </div>

                      {/* Langfristig */}
                      <div className="flex flex-col gap-1 bg-slate-950/70 p-3 rounded-xl border border-indigo-900/40">
                        <label className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                          <i className="fa-solid fa-trophy text-[10px]"></i>
                          <span>Langfristig (Vollendung)</span>
                        </label>
                        <AutoExpandingTextarea
                          value={longTermPlan}
                          onChange={e => setLongTermPlan(e.target.value)}
                          placeholder="Finale Vollendung, Meisterung &amp; dauerhafte Etablierung des Ziels..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-400 min-h-[56px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. ALTERNATIVPLÄNE & HINDERNISSE / KONFLIKTE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Alternativpläne */}
                  <div className="flex flex-col gap-2 bg-slate-900/30 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <i className="fa-solid fa-shuffle text-slate-400 text-[10px]"></i>
                        <span>Alternativpläne (Plan B, Plan C...)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAltPlan}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        + Alternative
                      </button>
                    </div>

                    {alternativePlans.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic py-1">
                        Keine Alternativpläne eingetragen. Klicke auf &quot;+ Alternative&quot;, um Ausweichpläne hinzuzufügen.
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {alternativePlans.map((plan, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-1.5">
                            <span className="text-[10px] text-slate-500 font-mono mt-2 shrink-0">
                              {String.fromCharCode(66 + pIdx)}:
                            </span>
                            <AutoExpandingTextarea
                              value={plan}
                              onChange={e => handleUpdateAltPlan(pIdx, e.target.value)}
                              placeholder={`Alternativer Plan ${String.fromCharCode(66 + pIdx)}...`}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[38px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAltPlan(pIdx)}
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

                  {/* Hindernisse & Konflikte */}
                  <div className="flex flex-col gap-2 bg-slate-900/30 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <i className="fa-solid fa-triangle-exclamation text-red-500 text-[10px]"></i>
                        <span>Hindernisse &amp; Konflikte</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddObstacleItem}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-red-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        + Hindernis
                      </button>
                    </div>

                    {obstacles.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic py-1">
                        Keine Hindernisse oder Konflikte eingetragen.
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {obstacles.map((obs, oIdx) => (
                          <div key={oIdx} className="flex items-start gap-1.5">
                            <span className="text-[10px] text-red-400/70 font-mono mt-2 shrink-0">
                              •
                            </span>
                            <AutoExpandingTextarea
                              value={obs}
                              onChange={e => handleUpdateObstacleItem(oIdx, e.target.value)}
                              placeholder="Hindernis, Risiko oder Loyalitätskonflikt beschreiben..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-red-500 min-h-[38px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveObstacleItem(oIdx)}
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

                {/* 6. ZIEL-PARAMETER (Entfernt) */}

                {/* 7. FORMULAR-AKTIONEN */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSaveGoal}
                      disabled={!mainGoal.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <i className="fa-solid fa-floppy-disk text-[11px]"></i>
                      <span>{editingGoalId ? 'Ziel aktualisieren' : 'Ziel speichern'}</span>
                    </button>

                    {!editingGoalId && (
                      <button
                        type="button"
                        onClick={handleSaveAs3TierGoals}
                        disabled={!mainGoal.trim()}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        title="Erstellt automatisch 3 verknüpfte Ziele (Kurz-, Mittel- und Langfristig)"
                      >
                        <i className="fa-solid fa-layer-group text-slate-400 text-xs"></i>
                        <span>Als 3 Etappenziele anlegen</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAIForCurrent}
                      disabled={!mainGoal.trim() || isGeneratingAI}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 hover:from-cyan-600/30 hover:to-teal-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="KI generiert passende 3-Stufen-Etappen für das aktuelle Hauptziel"
                    >
                      <i className={`fa-solid fa-wand-magic-sparkles ${isGeneratingAI ? 'animate-spin' : ''} text-xs`}></i>
                      <span>{isGeneratingAI ? 'Generiere...' : '3 Etappen per KI generieren'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FILTER-TABS FÜR DIE ZIEL-LISTE */}
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

              {DOMAIN_OPTIONS.map((dom, domIdx) => {
                const count = counts[dom.id] || 0;
                const isActive = activeFilter === dom.id;
                return (
                  <button
                    key={`filter-domain-btn-${dom.id}-${domIdx}`}
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

          {/* LISTE DER GESPEICHERTEN ZIELE */}
          {filteredGoals.length === 0 ? (
            <div className="text-xs text-slate-400 px-4 py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p>
                {goals.length === 0
                  ? 'Bisher sind keine Ziele für diesen Charakter hinterlegt. Nutze das obige Formular, um persönliche Vorhaben, Vorhaben gegenüber Charakteren oder Fraktionen anzulegen.'
                  : 'Keine Ziele im ausgewählten Filter vorhanden.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map((goal, gIdx) => {
                const isExpanded = !!expandedGoalIds[goal.id];
                const targetDisplay = getTargetTypeDisplay(goal.targetType, goal.targetName);

                return (
                  <div
                    key={`goal-card-${goal.id || 'goal'}-${gIdx}`}
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

                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-cyan-300">
                              {targetDisplay}
                            </span>

                            {goal.mainGoalTitle?.trim() && goal.mainGoalTitle !== goal.title && (
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
                    </div>

                    {/* Detailbereich der Zielkarte (Vollständige Bearbeitung) */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800/80 space-y-4 bg-slate-950/50">
                        {/* 1. Hauptziel & Titel */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                            Hauptziel / Zielbezeichnung
                          </label>
                          <input
                            type="text"
                            value={goal.title}
                            onChange={e => handleUpdateGoal(goal.id, { title: e.target.value, mainGoalTitle: e.target.value })}
                            placeholder="Zielbezeichnung eintragen..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>

                        {/* 2. Zielbereich & Adressat */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-4 flex flex-col gap-1">
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
                                  defaultName = availableCharacterOptions[0]?.title || '';
                                  defaultId = availableCharacterOptions[0]?.id;
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
                              <option value="self">Persönliche Ziele</option>
                              <option value="character">Ziele gegenüber Charakteren</option>
                              <option value="faction">Ziele gegenüber Fraktionen</option>
                            </select>
                          </div>

                          <div className="md:col-span-8 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Adressat / Konkreter Bezug
                            </label>
                            {goal.targetType === 'character' ? (
                              <select
                                value={goal.targetId || ''}
                                onChange={e => {
                                  const selected = availableCharacterOptions.find(c => c.id === e.target.value);
                                  handleUpdateGoal(goal.id, {
                                    targetId: e.target.value,
                                    targetName: selected ? selected.title : goal.targetName
                                  });
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                              >
                                <option value="">-- Charakter / Nutzer wählen --</option>
                                {availableCharacterOptions.map((c, cIdx) => (
                                  <option key={`card-char-target-${c.id || 'c'}-${cIdx}`} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            ) : goal.targetType === 'faction' ? (
                              <select
                                value={goal.targetId || ''}
                                onChange={e => {
                                  const selected = codexFactions.find(f => f.id === e.target.value);
                                  handleUpdateGoal(goal.id, {
                                    targetId: e.target.value,
                                    targetName: selected ? selected.title : goal.targetName
                                  });
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                              >
                                <option value="">-- Fraktion auswählen --</option>
                                {codexFactions.map((f, fIdx) => (
                                  <option key={`card-faction-target-${f.id || 'f'}-${fIdx}`} value={f.id}>
                                    {f.title}
                                  </option>
                                ))}
                              </select>
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
                        </div>

                        {/* 3. Motivation & Kontext */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                              Motivation / Warum dieses Ziel?
                            </label>
                            <AutoExpandingTextarea
                              value={goal.motivation || ''}
                              onChange={e => handleUpdateGoal(goal.id, { motivation: e.target.value })}
                              placeholder="Persönlicher Grund, emotionaler Ansporn oder Verpflichtung..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Kontext &amp; Beschreibung
                            </label>
                            <AutoExpandingTextarea
                              value={goal.description || ''}
                              onChange={e => handleUpdateGoal(goal.id, { description: e.target.value })}
                              placeholder="Hintergrund, zeitlicher Rahmen oder Erfolgskriterien..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[50px]"
                            />
                          </div>
                        </div>

                        {/* 4. Aktiver Handlungsplan (Wie) & Frist-Felder */}
                        <div className="flex flex-col gap-2 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                          <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <i className="fa-solid fa-list-check text-cyan-500"></i>
                            <span>Aktiver Handlungsplan (Wie soll das Ziel erreicht werden?)</span>
                          </label>
                          <AutoExpandingTextarea
                            value={goal.activePlan || ''}
                            onChange={e => handleUpdateGoal(goal.id, { activePlan: e.target.value })}
                            placeholder="Gesamtstrategie und Schrittfolge..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[50px]"
                          />

                          {/* 3 Frist-Felder */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-teal-300 font-bold uppercase tracking-wider">
                                Kurzfristig (Erste Schritte)
                              </label>
                              <AutoExpandingTextarea
                                value={goal.shortTermPlan || ''}
                                onChange={e => handleUpdateGoal(goal.id, { shortTermPlan: e.target.value })}
                                placeholder="Unmittelbare Schritte..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-teal-400 min-h-[44px]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider">
                                Mittelfristig (Meilensteine)
                              </label>
                              <AutoExpandingTextarea
                                value={goal.mediumTermPlan || ''}
                                onChange={e => handleUpdateGoal(goal.id, { mediumTermPlan: e.target.value })}
                                placeholder="Zwischenmeilensteine..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-400 min-h-[44px]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                                Langfristig (Vollendung)
                              </label>
                              <AutoExpandingTextarea
                                value={goal.longTermPlan || ''}
                                onChange={e => handleUpdateGoal(goal.id, { longTermPlan: e.target.value })}
                                placeholder="Finale Absicherung..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-400 min-h-[44px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 5. Alternativpläne & Hindernisse */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Alternativpläne */}
                          <div className="flex flex-col gap-2 bg-slate-900/20 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                                Alternativpläne (Plan B, Plan C...)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddInlineAltPlan(goal.id)}
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
                                      onChange={e => handleUpdateInlineAltPlan(goal.id, pIdx, e.target.value)}
                                      placeholder={`Alternativer Plan ${String.fromCharCode(66 + pIdx)}...`}
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[36px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInlineAltPlan(goal.id, pIdx)}
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
                              <label className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                Hindernisse &amp; Konflikte
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddInlineObstacle(goal.id)}
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
                                      onChange={e => handleUpdateInlineObstacle(goal.id, oIdx, e.target.value)}
                                      placeholder="Hindernis oder Risiko beschreiben..."
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-red-500 min-h-[36px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInlineObstacle(goal.id, oIdx)}
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

                        {/* 6. Parameter & Status (Entfernt) */}

                        {/* Fußzeile der Zielkarte */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex-wrap gap-2">
                          <span className="font-mono">
                            ID: {goal.id}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadGoalIntoForm(goal)}
                              className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/40 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <i className="fa-solid fa-pen text-[10px]"></i>
                              <span>Im Formular bearbeiten</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateGoal(goal)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <i className="fa-solid fa-copy text-[10px]"></i>
                              <span>Duplizieren</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <i className="fa-solid fa-trash text-[10px]"></i>
                              <span>Löschen</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleGoalExpanded(goal.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer transition-colors"
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
