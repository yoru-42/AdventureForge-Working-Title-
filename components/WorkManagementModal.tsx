import React, { useState, useMemo } from 'react';
import { 
  Adventure, 
  EconomyHolding, 
  EconomyTask, 
  EconomyDuty, 
  EconomyOrder, 
  EconomyRole, 
  EconomyStaffGroup, 
  TemporaryAuthority, 
  WorkWorkflowTemplate 
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { 
  suggestOperationalTasks, 
  generateSubtasksForOrder, 
  generateTaskFromDuty 
} from '../services/geminiService';
import { STANDARD_AUTHORITIES } from './economy/EconomyPresets';

interface WorkManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
}

type TabType = 'tasks' | 'duties' | 'staff' | 'orders' | 'authorities' | 'workflows';

const DEFAULT_WORKFLOW_TEMPLATES: WorkWorkflowTemplate[] = [
  {
    id: 'tmpl-service',
    title: 'Abendservice & Gästebetreuung',
    category: 'Gastronomie & Taverne',
    description: 'Vollständiger Ablauf von der Vorbereitung bis zum Abschluss des Service.',
    steps: [
      { title: 'Vorratskammer & Frischeprüfung', description: 'Bestände kontrollieren und fehlende Zutaten bereitstellen.', suggestedRole: 'Lehrling' },
      { title: 'Zutaten schneiden & vorbereiten', description: 'Gemüse, Fleisch und Beilagen für den Abendservice mise-en-place herrichten.', suggestedRole: 'Küchenhilfen' },
      { title: 'Hauptgerichte & Eintöpfe zubereiten', description: 'Kochen der Hauptspeisen nach Rezeptur und Qualitätsstandard.', suggestedRole: 'Koch' },
      { title: 'Gäste bewirten & Anrichten', description: 'Speisen zügig anrichten und im Schankraum servieren.', suggestedRole: 'Mägde' },
      { title: 'Küche reinigen & Kassenabschluss', description: 'Arbeitsflächen säubern, Reste verwahren und Einnahmen prüfen.', suggestedRole: 'Küchenhilfen' }
    ]
  },
  {
    id: 'tmpl-inventory',
    title: 'Vorratsprüfung & Wareneingang',
    category: 'Logistik & Verwaltung',
    description: 'Prüfung von Lieferungen, Qualitätskontrolle und Einlagerung.',
    steps: [
      { title: 'Lieferschein mit Bestellung abgleichen', description: 'Mengen und Artikelbezeichnungen sorgfältig vergleichen.', suggestedRole: 'Verwalter' },
      { title: 'Qualitätskontrolle der Rohstoffe', description: 'Sichtprüfung auf Frische, Mängel oder Transportschäden.', suggestedRole: 'Geselle' },
      { title: 'Einlagerung im Vorratsbereich', description: 'Fachgerechtes Verstauen und Kennzeichnen der Bestände.', suggestedRole: 'Hilfsarbeiter' }
    ]
  },
  {
    id: 'tmpl-security',
    title: 'Sicherheitsrunde & Wachwechsel',
    category: 'Sicherheit & Wehr',
    description: 'Kontrolle der Zugänge, Wachablösung und Lagebericht.',
    steps: [
      { title: 'Tore & Fensterriegel prüfen', description: 'Sämtliche Außenzugänge und Schlösser kontrollieren.', suggestedRole: 'Wachen' },
      { title: 'Wachwechsel durchführen', description: 'Übergabe des Postens und Mitteilung besonderer Vorkommnisse.', suggestedRole: 'Hauptmann der Wache' },
      { title: 'Nachtpatrouille durchführen', description: 'Regelmäßige Runde um das Gelände zur Abschreckung.', suggestedRole: 'Wachen' }
    ]
  }
];

export const WorkManagementModal: React.FC<WorkManagementModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');

  // Creation dialogs / forms
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<EconomyTask['priority']>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskResources, setNewTaskResources] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Delegation dialog
  const [delegatingTaskId, setDelegatingTaskId] = useState<string | null>(null);

  // Loading states for AI
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // New Duty form
  const [showCreateDuty, setShowCreateDuty] = useState(false);
  const [newDutyTitle, setNewDutyTitle] = useState('');
  const [newDutyDescription, setNewDutyDescription] = useState('');
  const [newDutyFrequency, setNewDutyFrequency] = useState<EconomyDuty['frequency']>('daily');
  const [newDutyRole, setNewDutyRole] = useState('');

  // New Temporary Authority form
  const [showCreateAuthority, setShowCreateAuthority] = useState(false);
  const [newAuthName, setNewAuthName] = useState(STANDARD_AUTHORITIES[0]);
  const [newAuthTargetName, setNewAuthTargetName] = useState('');
  const [newAuthReason, setNewAuthReason] = useState('');
  const [newAuthValidUntil, setNewAuthValidUntil] = useState('');

  // All holdings in world
  const holdings = adventure.world?.economyConfig?.holdings || [];

  // Determine active holding based on priority rules (Section 39)
  const activeHolding = useMemo(() => {
    if (holdings.length === 0) return null;
    if (selectedHoldingId) {
      const found = holdings.find(h => h.id === selectedHoldingId);
      if (found) return found;
    }

    const playerName = adventure.player?.name?.toLowerCase() || '';

    // 1. Holding where player works directly
    const directWorkHolding = holdings.find(h => 
      h.userRoleName || 
      h.roles?.some(r => r.isUserPosition || r.assignedToName?.toLowerCase().includes(playerName))
    );
    if (directWorkHolding) return directWorkHolding;

    // 2. Holding matching player's current position / profession
    const playerProf = (adventure.player?.profession || '').toLowerCase();
    if (playerProf) {
      const profHolding = holdings.find(h => 
        h.type.toLowerCase().includes(playerProf) || 
        h.roles?.some(r => r.name.toLowerCase().includes(playerProf))
      );
      if (profHolding) return profHolding;
    }

    // 3. Holding at player's current location
    const currentLocName = (adventure.world?.startLocationName || '').toLowerCase();
    if (currentLocName) {
      const locHolding = holdings.find(h => (h.locationName || '').toLowerCase().includes(currentLocName));
      if (locHolding) return locHolding;
    }

    // 4. Holding owned/managed by player
    const ownedHolding = holdings.find(h => h.ownerType === 'user' || h.assignedManagerId === adventure.player?.id);
    if (ownedHolding) return ownedHolding;

    // 5. Fallback: First holding
    return holdings[0];
  }, [holdings, selectedHoldingId, adventure.player, adventure.world]);

  if (!isOpen) return null;

  // Helper to update active holding
  const updateCurrentHolding = (updates: Partial<EconomyHolding>) => {
    if (!activeHolding) return;
    const currentHoldings = adventure.world?.economyConfig?.holdings || [];
    const updatedHoldings = currentHoldings.map(h => 
      h.id === activeHolding.id ? { ...h, ...updates } : h
    );

    onUpdateAdventure({
      ...adventure,
      world: {
        ...adventure.world,
        economyConfig: {
          currencyName: adventure.world?.economyConfig?.currencyName || 'Goldmünzen',
          currencyIcon: adventure.world?.economyConfig?.currencyIcon || 'Münzen',
          payoutInterval: adventure.world?.economyConfig?.payoutInterval || 'weekly',
          allowPassiveIncome: adventure.world?.economyConfig?.allowPassiveIncome ?? true,
          enableRandomEvents: adventure.world?.economyConfig?.enableRandomEvents ?? true,
          holdings: updatedHoldings
        }
      }
    });
  };

  // Helper to determine player role in active holding
  const playerRoleTitle = useMemo(() => {
    if (!activeHolding) return adventure.player?.profession || 'Mitarbeiter';
    if (activeHolding.userRoleName) return activeHolding.userRoleName;
    const userRole = activeHolding.roles?.find(r => 
      r.isUserPosition || 
      (adventure.player?.name && r.assignedToName?.toLowerCase().includes(adventure.player.name.toLowerCase()))
    );
    if (userRole) return userRole.name;
    if (activeHolding.ownerType === 'user') return 'Eigentümer / Verwalter';
    return adventure.player?.profession || 'Mitarbeiter';
  }, [activeHolding, adventure.player]);

  // Tasks of the active holding
  const tasks = activeHolding?.tasks || [];
  const duties = activeHolding?.duties || [];
  const orders = activeHolding?.orders || [];
  const roles = activeHolding?.roles || [];
  const staffGroups = activeHolding?.staffGroups || [];
  const temporaryAuthorities = activeHolding?.temporaryAuthorities || [];
  const workflowTemplates = [...DEFAULT_WORKFLOW_TEMPLATES, ...(activeHolding?.workTemplates || [])];

  const pendingTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const unfulfilledDutiesCount = duties.filter(d => !d.isFulfilled).length;

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'pending') return task.status === 'pending' || task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed' || task.status === 'failed';
    return true;
  });

  // --- Handlers: Tasks ---
  const handleSaveNewTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: EconomyTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: 'pending',
      priority: newTaskPriority,
      deadline: newTaskDeadline.trim() || undefined,
      requiredResources: newTaskResources.trim() || undefined,
      reward: '',
      assigneeName: newTaskAssignee.trim() || undefined,
      createdByName: adventure.player?.name || 'Spieler',
      taskType: 'manual',
      canDelegate: true
    };

    updateCurrentHolding({ tasks: [task, ...tasks] });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDeadline('');
    setNewTaskResources('');
    setNewTaskAssignee('');
    setShowCreateTask(false);
  };

  const handleUpdateTaskStatus = (taskId: string, status: EconomyTask['status']) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status, 
          progress: status === 'completed' ? 100 : t.progress 
        };
      }
      return t;
    });
    updateCurrentHolding({ tasks: updated });

    if (status === 'completed') {
      const task = tasks.find(t => t.id === taskId);
      if (task && onSendChatMessage) {
        // Optional subtle chat notification
        // onSendChatMessage(`[Aufgabe abgeschlossen: "${task.title}"]`);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    updateCurrentHolding({ tasks: tasks.filter(t => t.id !== taskId) });
  };

  const handleClaimTaskMyself = (taskId: string) => {
    const playerName = adventure.player?.name || 'Spieler';
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigneeName: playerName,
          assigneeId: adventure.player?.id || 'player',
          assigneeGroupName: undefined,
          assigneeGroupId: undefined
        };
      }
      return t;
    });
    updateCurrentHolding({ tasks: updated });
  };

  const handleAssignTask = (
    taskId: string, 
    target: { name: string; id?: string; isGroup?: boolean; groupCount?: number }
  ) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigneeName: target.name,
          assigneeId: target.isGroup ? undefined : target.id,
          assigneeGroupName: target.isGroup ? target.name : undefined,
          assigneeGroupId: target.isGroup ? target.id : undefined,
          taskType: 'delegated' as const
        };
      }
      return t;
    });
    updateCurrentHolding({ tasks: updated });
    setDelegatingTaskId(null);

    // Record in activity log
    const task = tasks.find(t => t.id === taskId);
    if (task && activeHolding) {
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Gerade eben',
        actorName: adventure.player?.name || 'Leitung',
        actorRole: playerRoleTitle,
        type: 'staff_action' as const,
        message: `Aufgabe "${task.title}" wurde an ${target.name} delegiert.`,
        severity: 'info' as const
      };
      updateCurrentHolding({
        activityLogs: [newLog, ...(activeHolding.activityLogs || [])]
      });
    }
  };

  // --- Handlers: AI Generation ---
  const handleAiSuggestTasks = async () => {
    if (!activeHolding) return;
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const suggested = await suggestOperationalTasks(
        activeHolding,
        adventure.player,
        adventure.world
      );
      if (suggested && suggested.length > 0) {
        updateCurrentHolding({ tasks: [...suggested, ...tasks] });
        setAiNotice(`${suggested.length} operative Aufgaben wurden vorgeschlagen und hinzugefügt.`);
      } else {
        setAiNotice('Keine weiteren Aufgaben generiert.');
      }
    } catch (err: any) {
      setAiNotice('Fehler beim Generieren von Aufgaben.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateTaskFromDuty = async (duty: EconomyDuty) => {
    if (!activeHolding) return;
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const concreteTask = await generateTaskFromDuty(
        duty,
        activeHolding,
        adventure.player,
        adventure.world
      );
      updateCurrentHolding({ tasks: [concreteTask, ...tasks] });
      setAiNotice(`Aufgabe aus Pflicht "${duty.title}" erzeugt.`);
      setActiveTab('tasks');
    } catch (err: any) {
      // Fallback manual instantiation
      const fallbackTask: EconomyTask = {
        id: `task-duty-${Date.now()}`,
        title: duty.title,
        description: duty.description,
        status: 'pending',
        priority: 'medium',
        deadline: 'Heute',
        reward: '',
        taskType: 'routine',
        canDelegate: true,
        assigneeName: duty.assignedRoleName || undefined
      };
      updateCurrentHolding({ tasks: [fallbackTask, ...tasks] });
      setAiNotice(`Aufgabe aus Pflicht "${duty.title}" übernommen.`);
      setActiveTab('tasks');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateSubtasksForOrder = async (order: EconomyOrder) => {
    if (!activeHolding) return;
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const subtasks = await generateSubtasksForOrder(
        order,
        activeHolding,
        adventure.player,
        adventure.world
      );
      if (subtasks && subtasks.length > 0) {
        updateCurrentHolding({ tasks: [...subtasks, ...tasks] });
        setAiNotice(`${subtasks.length} Teilaufgaben für Auftrag "${order.title}" abgeleitet.`);
        setActiveTab('tasks');
      } else {
        setAiNotice('Keine Teilaufgaben erzeugt.');
      }
    } catch (err: any) {
      setAiNotice('Fehler beim Ableiten von Teilaufgaben.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Handlers: Duties ---
  const handleSaveNewDuty = () => {
    if (!newDutyTitle.trim()) return;
    const duty: EconomyDuty = {
      id: `duty-${Date.now()}`,
      title: newDutyTitle.trim(),
      description: newDutyDescription.trim(),
      frequency: newDutyFrequency,
      assignedRoleName: newDutyRole.trim() || undefined,
      isFulfilled: false
    };
    updateCurrentHolding({ duties: [...duties, duty] });
    setNewDutyTitle('');
    setNewDutyDescription('');
    setNewDutyRole('');
    setShowCreateDuty(false);
  };

  const handleToggleDutyStatus = (dutyId: string) => {
    const updated = duties.map(d => d.id === dutyId ? { ...d, isFulfilled: !d.isFulfilled } : d);
    updateCurrentHolding({ duties: updated });
  };

  const handleDeleteDuty = (dutyId: string) => {
    updateCurrentHolding({ duties: duties.filter(d => d.id !== dutyId) });
  };

  // --- Handlers: Temporary Authorities ---
  const handleSaveNewAuthority = () => {
    if (!newAuthName.trim() || !newAuthTargetName.trim()) return;
    const newAuth: TemporaryAuthority = {
      id: `auth-temp-${Date.now()}`,
      authority: newAuthName.trim(),
      grantedToName: newAuthTargetName.trim(),
      grantedByName: adventure.player?.name || 'Leitung',
      reason: newAuthReason.trim() || undefined,
      validUntil: newAuthValidUntil.trim() || undefined,
      active: true
    };
    updateCurrentHolding({ temporaryAuthorities: [...temporaryAuthorities, newAuth] });
    setNewAuthTargetName('');
    setNewAuthReason('');
    setNewAuthValidUntil('');
    setShowCreateAuthority(false);
  };

  const handleRevokeAuthority = (authId: string) => {
    updateCurrentHolding({
      temporaryAuthorities: temporaryAuthorities.filter(a => a.id !== authId)
    });
  };

  // --- Handlers: Workflows ---
  const handleApplyWorkflow = (template: WorkWorkflowTemplate) => {
    const createdTasks: EconomyTask[] = template.steps.map((step, idx) => ({
      id: `task-wf-${Date.now()}-${idx}`,
      title: step.title,
      description: step.description || '',
      status: 'pending',
      priority: 'medium',
      deadline: 'Aktuelle Schicht',
      reward: '',
      taskType: 'routine',
      canDelegate: true,
      assigneeName: step.suggestedRole || undefined,
      generatedReason: `Aus Vorlage: ${template.title}`
    }));

    updateCurrentHolding({ tasks: [...createdTasks, ...tasks] });
    setAiNotice(`Ablauf "${template.title}" mit ${createdTasks.length} Schritten aktiviert.`);
    setActiveTab('tasks');
  };

  // Delegation target choices
  const delegatingTask = tasks.find(t => t.id === delegatingTaskId);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <i className="fa-solid fa-list-check text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wide">
                  Aufgaben & Verantwortung
                </h3>
                {activeHolding && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    Stufe {activeHolding.level || 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-amber-400">{playerRoleTitle}</span>
                <span className="text-slate-600">·</span>
                <span>{activeHolding?.name || 'Persönlicher Bereich'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {holdings.length > 1 && (
              <select
                value={activeHolding?.id || ''}
                onChange={e => setSelectedHoldingId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                title="Betrieb auswählen"
              >
                {holdings.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Schließen"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {aiNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <span>{aiNotice}</span>
            <button
              type="button"
              onClick={() => setAiNotice(null)}
              className="text-amber-400 hover:text-white font-bold ml-2"
            >
              Schließen
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/30 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Aufgaben</span>
            {pendingTasksCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duties')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'duties'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pflichten</span>
            {unfulfilledDutiesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {unfulfilledDutiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'staff'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Personal</span>
            <span className="text-[10px] font-mono text-slate-500">
              ({roles.length + staffGroups.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Aufträge</span>
            {orders.length > 0 && (
              <span className="text-[10px] font-mono text-slate-500">
                ({orders.length})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('authorities')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'authorities'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Befugnisse & Sonderrechte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workflows')}
            className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'workflows'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Arbeitsvorlagen</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20">
          
          {/* TAB 1: AUFGABEN */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1 font-semibold">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('pending')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      taskFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Offen ({pendingTasksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('completed')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      taskFilter === 'completed'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Erledigt ({tasks.filter(t => t.status === 'completed').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      taskFilter === 'all'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Alle ({tasks.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isAiLoading || !activeHolding}
                    onClick={handleAiSuggestTasks}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    title="KI schlägt operative Tagesaufgaben passend zu Betrieb und Rolle vor"
                  >
                    <i className={`fa-solid ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-amber-400`}></i>
                    <span>Aufgaben mit KI vorschlagen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateTask(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Aufgabe erstellen</span>
                  </button>
                </div>
              </div>

              {/* Create Task Form */}
              {showCreateTask && (
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Neue operative Aufgabe anlegen
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowCreateTask(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Abbrechen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Titel der Aufgabe</label>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Kurzer, präziser Titel der Handlung..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Beschreibung & Details</label>
                      <AutoExpandingTextarea
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        placeholder="Genaue Handlungsanweisung, Arbeitsschritte oder Bedingungen..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Priorität</label>
                      <select
                        value={newTaskPriority || 'medium'}
                        onChange={e => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      >
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Frist / Zeitfenster</label>
                      <input
                        type="text"
                        value={newTaskDeadline}
                        onChange={e => setNewTaskDeadline(e.target.value)}
                        placeholder="z.B. Heute 20:00, In 2 Stunden, Schichtende"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Benötigte Ressourcen</label>
                      <input
                        type="text"
                        value={newTaskResources}
                        onChange={e => setNewTaskResources(e.target.value)}
                        placeholder="z.B. 10 kg Fleisch, 5 Eisenbarren"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Zuweisen an (Optional)</label>
                      <input
                        type="text"
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        placeholder="z.B. Lehrling Tom, Küchenhilfen, oder leer lassen"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateTask(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewTask}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                    >
                      Aufgabe anlegen
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">Keine Aufgaben vorhanden.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Erstelle eine neue Aufgabe, leite Schritte aus Pflichten oder Aufträgen ab oder nutze den KI-Vorschlag.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map(task => {
                    const isPending = task.status === 'pending' || task.status === 'in_progress';
                    const isCompleted = task.status === 'completed';
                    const isAssignedToMe = task.assigneeName === adventure.player?.name || task.assigneeId === adventure.player?.id;

                    return (
                      <div
                        key={task.id}
                        className={`bg-slate-900 border rounded-2xl p-3.5 transition-all space-y-2 ${
                          isCompleted
                            ? 'border-slate-800/60 opacity-70 bg-slate-950/40'
                            : task.priority === 'urgent'
                            ? 'border-red-500/40 bg-red-950/10'
                            : task.priority === 'high'
                            ? 'border-amber-500/30'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, isCompleted ? 'pending' : 'completed')}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                  : 'border-slate-700 bg-slate-950 text-transparent hover:border-amber-500'
                              }`}
                              title={isCompleted ? 'Als offen markieren' : 'Als erledigt markieren'}
                            >
                              <i className="fa-solid fa-check text-[10px]"></i>
                            </button>

                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                  {task.title}
                                </h4>

                                {task.priority && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    task.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    task.priority === 'low' ? 'bg-slate-800 text-slate-400' :
                                    'bg-slate-800 text-slate-300'
                                  }`}>
                                    {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'low' ? 'Niedrig' : 'Mittel'}
                                  </span>
                                )}

                                {task.generatedReason && (
                                  <span className="text-[9px] text-slate-500 italic">
                                    ({task.generatedReason})
                                  </span>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1">
                                {task.deadline && (
                                  <span className="flex items-center gap-1">
                                    <i className="fa-regular fa-clock text-slate-500"></i>
                                    <span>Frist: {task.deadline}</span>
                                  </span>
                                )}

                                {task.requiredResources && (
                                  <span className="flex items-center gap-1">
                                    <i className="fa-solid fa-boxes-stacked text-slate-500"></i>
                                    <span>Ressourcen: {task.requiredResources}</span>
                                  </span>
                                )}

                                <span className="flex items-center gap-1 font-semibold">
                                  <i className="fa-solid fa-user text-slate-500"></i>
                                  {task.assigneeName ? (
                                    <span className={isAssignedToMe ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                      {task.assigneeName} {isAssignedToMe && '(Ich)'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 italic">Nicht zugewiesen</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Task Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
                            {isPending && !isAssignedToMe && (
                              <button
                                type="button"
                                onClick={() => handleClaimTaskMyself(task.id)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                title="Aufgabe selbst übernehmen"
                              >
                                Selbst übernehmen
                              </button>
                            )}

                            {isPending && (
                              <button
                                type="button"
                                onClick={() => setDelegatingTaskId(task.id)}
                                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                title="An Mitarbeiter oder Gruppe delegieren"
                              >
                                Zuweisen
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition"
                              title="Aufgabe löschen"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>

                        {/* Delegation Popover */}
                        {delegatingTaskId === task.id && (
                          <div className="mt-2 p-3 bg-slate-950 border border-amber-500/40 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                                Mitarbeiter oder Gruppe auswählen
                              </span>
                              <button
                                type="button"
                                onClick={() => setDelegatingTaskId(null)}
                                className="text-[10px] text-slate-400 hover:text-white"
                              >
                                Schließen
                              </button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {/* Option: Self */}
                              <div className="text-[10px] text-slate-500 font-bold uppercase">Verantwortlicher</div>
                              <button
                                type="button"
                                onClick={() => handleAssignTask(task.id, { name: adventure.player?.name || 'Spieler', id: adventure.player?.id })}
                                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition cursor-pointer"
                              >
                                <span className="text-xs font-bold text-amber-300">
                                  Ich ({adventure.player?.name || 'Spieler'})
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{playerRoleTitle}</span>
                              </button>

                              {/* Option: Namentliche Rollen */}
                              {roles.length > 0 && (
                                <>
                                  <div className="text-[10px] text-slate-500 font-bold uppercase pt-1">Namentliches Personal</div>
                                  <div className="space-y-1">
                                    {roles.map((r, idx) => (
                                      <button
                                        key={r.id || idx}
                                        type="button"
                                        onClick={() => handleAssignTask(task.id, { name: `${r.assignedToName} (${r.name})`, id: r.id })}
                                        className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between transition cursor-pointer"
                                      >
                                        <span className="text-xs text-slate-200 font-semibold">{r.assignedToName}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{r.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}

                              {/* Option: Personalgruppen */}
                              {staffGroups.length > 0 && (
                                <>
                                  <div className="text-[10px] text-slate-500 font-bold uppercase pt-1">Personalgruppen</div>
                                  <div className="space-y-1">
                                    {staffGroups.map((sg, idx) => (
                                      <button
                                        key={sg.id || idx}
                                        type="button"
                                        onClick={() => handleAssignTask(task.id, { name: sg.roleName, id: sg.id, isGroup: true, groupCount: sg.count })}
                                        className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between transition cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-200 font-semibold">{sg.roleName}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                            {sg.count} Personen
                                          </span>
                                        </div>
                                        <span className={`text-[10px] font-mono ${
                                          sg.status === 'überlastet' ? 'text-red-400' :
                                          sg.status === 'unterbesetzt' ? 'text-amber-400' :
                                          'text-emerald-400'
                                        }`}>
                                          Status: {sg.status}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
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

          {/* TAB 2: PFLICHTEN */}
          {activeTab === 'duties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Wiederkehrende Pflichten & Routinen
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Regelmäßige Aufgaben für den reibungslosen Betriebsablauf
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateDuty(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Pflicht hinzufügen</span>
                </button>
              </div>

              {/* Create Duty Form */}
              {showCreateDuty && (
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Neue wiederkehrende Pflicht definieren
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowCreateDuty(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Abbrechen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Bezeichnung der Pflicht</label>
                      <input
                        type="text"
                        value={newDutyTitle}
                        onChange={e => setNewDutyTitle(e.target.value)}
                        placeholder="z.B. Vorratskontrolle am Morgen, Esse anheizen, Kassensturz..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Beschreibung & Prüfkriterien</label>
                      <AutoExpandingTextarea
                        value={newDutyDescription}
                        onChange={e => setNewDutyDescription(e.target.value)}
                        placeholder="Was muss genau getan werden? Welche Konsequenzen drohen bei Vernachlässigung?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Wiederholungs-Frequenz</label>
                      <select
                        value={newDutyFrequency}
                        onChange={e => setNewDutyFrequency(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      >
                        <option value="daily">Täglich</option>
                        <option value="shift">Pro Schicht</option>
                        <option value="weekly">Wöchentlich</option>
                        <option value="monthly">Monatlich</option>
                        <option value="always">Dauerhaft fortlaufend</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Zuständige Rolle / Person</label>
                      <input
                        type="text"
                        value={newDutyRole}
                        onChange={e => setNewDutyRole(e.target.value)}
                        placeholder="z.B. Chefkoch, Geselle, Wache..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateDuty(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewDuty}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                    >
                      Pflicht anlegen
                    </button>
                  </div>
                </div>
              )}

              {/* Duties List */}
              {duties.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">Keine Pflichten hinterlegt.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Trage regelmäßige Pflichten ein, um daraus bei Bedarf konkrete Tagesaufgaben abzuleiten.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {duties.map(duty => (
                    <div
                      key={duty.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleDutyStatus(duty.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                duty.isFulfilled
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-950 text-transparent hover:border-amber-500'
                              }`}
                              title={duty.isFulfilled ? 'Als offen markieren' : 'Heute als erfüllt markieren'}
                            >
                              <i className="fa-solid fa-check text-[10px]"></i>
                            </button>
                            <h4 className={`text-xs font-bold ${duty.isFulfilled ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                              {duty.title}
                            </h4>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                            {duty.frequency === 'daily' ? 'Täglich' : duty.frequency === 'weekly' ? 'Wöchentlich' : duty.frequency === 'shift' ? 'Schicht' : 'Dauerhaft'}
                          </span>
                        </div>

                        {duty.description && (
                          <p className="text-[11px] text-slate-300 leading-relaxed pl-7">
                            {duty.description}
                          </p>
                        )}

                        {duty.assignedRoleName && (
                          <div className="pl-7 text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <span className="text-slate-500">Zuständig:</span>
                            <span className="text-amber-400">{duty.assignedRoleName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 pl-7">
                        <button
                          type="button"
                          disabled={isAiLoading}
                          onClick={() => handleGenerateTaskFromDuty(duty)}
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Erzeugt eine konkrete Aufgabe für heute aus dieser Pflicht"
                        >
                          <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                          <span>Aufgabe für heute erzeugen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDuty(duty.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Pflicht entfernen"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* SECTION 1: NAMENTLICHE ROLLEN */}
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Namentliche Führungskräfte & Spezialisten ({roles.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Konkrete Funktionsträger mit definierten Befugnissen
                    </p>
                  </div>
                </div>

                {roles.length === 0 ? (
                  <div className="p-4 text-center bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-400">
                    Keine namentlichen Positionen hinterlegt.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roles.map((role, idx) => (
                      <div
                        key={role.id || idx}
                        className={`bg-slate-900 border rounded-2xl p-4 space-y-2.5 ${
                          role.isUserPosition ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-100">{role.assignedToName}</h5>
                              {role.isUserPosition && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                                  Meine Position
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-amber-400 font-mono mt-0.5">{role.name}</p>
                          </div>

                          {role.salary !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Lohn: {role.salary} Münzen
                            </span>
                          )}
                        </div>

                        {role.superiorRole && (
                          <p className="text-[10px] text-slate-400">
                            Vorgesetzter: <span className="text-slate-300 font-semibold">{role.superiorRole}</span>
                          </p>
                        )}

                        {role.authorities && role.authorities.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                              Befugnisse
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {role.authorities.map((auth, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                                >
                                  {auth}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: NAMENLOSE PERSONALGRUPPEN */}
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Personalgruppen & Belegschaft ({staffGroups.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Namenlose Arbeitsgruppen zur Bewältigung des Tagesgeschäfts
                  </p>
                </div>

                {staffGroups.length === 0 ? (
                  <div className="p-4 text-center bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-400">
                    Keine Personalgruppen eingeteilt.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {staffGroups.map((sg, idx) => (
                      <div
                        key={sg.id || idx}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-100">{sg.roleName}</h5>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 border border-slate-700 font-mono text-slate-300 font-bold">
                                {sg.count} Personen
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Bereich: {sg.workplaceArea}</p>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            sg.status === 'überlastet' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            sg.status === 'unterbesetzt' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {sg.status}
                          </span>
                        </div>

                        {sg.duties && sg.duties.length > 0 && (
                          <div className="text-[10px] text-slate-300 space-y-0.5">
                            <span className="text-slate-500 font-bold">Aufgabenbereiche:</span>
                            <p className="leading-relaxed">{sg.duties.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AUFTRÄGE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Übergeordnete Aufträge & Direktiven ({orders.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Weisungen von Vorgesetzten, Besitzern oder Kunden, die in operative Teilaufgaben zerlegt werden
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">Keine übergeordneten Aufträge aktiv.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sobald im Chat oder vom Vorgesetzten ein Auftrag erteilt wird, erscheint er hier.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => {
                    const childTasks = tasks.filter(t => t.parentOrderId === order.id);
                    const completedChildTasks = childTasks.filter(t => t.status === 'completed');
                    const progressPercent = childTasks.length > 0
                      ? Math.round((completedChildTasks.length / childTasks.length) * 100)
                      : order.progress || 0;

                    return (
                      <div
                        key={order.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-100">{order.title}</h5>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-slate-800 text-slate-300">
                                {order.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              {order.targetGoal}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Auftraggeber: <span className="text-slate-200 font-semibold">{order.issuerName}</span> · Empfänger: <span className="text-slate-200 font-semibold">{order.recipientName}</span>
                              {order.deadline && <span> · Frist: {order.deadline}</span>}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isAiLoading}
                              onClick={() => handleGenerateSubtasksForOrder(order)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
                              title="KI leitet 3-6 operative Teilaufgaben für das Personal ab"
                            >
                              <i className={`fa-solid ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-network-wired'} text-xs`}></i>
                              <span>Teilaufgaben mit KI ableiten</span>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Fortschritt ({progressPercent}%)</span>
                            <span>{completedChildTasks.length} von {childTasks.length} Teilaufgaben erledigt</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-amber-500 transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Child Tasks List */}
                        {childTasks.length > 0 && (
                          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Zugeordnete Teilaufgaben ({childTasks.length})
                            </span>
                            <div className="space-y-1">
                              {childTasks.map(ct => (
                                <div
                                  key={ct.id}
                                  className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={ct.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}>
                                      <i className={`fa-solid ${ct.status === 'completed' ? 'fa-circle-check' : 'fa-circle-dot'} text-[10px]`}></i>
                                    </span>
                                    <span className={ct.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200 font-semibold'}>
                                      {ct.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    {ct.assigneeName && <span>Zugewiesen: {ct.assigneeName}</span>}
                                    <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                                      {ct.status === 'completed' ? 'Erledigt' : 'Offen'}
                                    </span>
                                  </div>
                                </div>
                              ))}
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

          {/* TAB 5: BEFUGNISSE & SONDERRECHTE */}
          {activeTab === 'authorities' && (
            <div className="space-y-6">
              {/* Permanent authorities */}
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Meine Befugnisse & Handlungsrechte
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Befugnisse deiner Position ({playerRoleTitle}) im Betrieb
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {STANDARD_AUTHORITIES.map((auth, idx) => {
                    const isGranted = activeHolding?.roles?.some(r => 
                      r.isUserPosition && r.authorities?.includes(auth)
                    ) || activeHolding?.ownerType === 'user' || idx < 4; // Owners/leaders have baseline authorities

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isGranted
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold'
                            : 'bg-slate-900/30 border-slate-800/80 text-slate-500'
                        }`}
                      >
                        <span>{auth}</span>
                        {isGranted ? (
                          <span className="text-[10px] text-amber-400 font-mono">Aktiv</span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Nicht erteilt</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Temporary authorities / Sonderrechte */}
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Vergebene Sonderrechte & Temporäre Befugnisse ({temporaryAuthorities.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Zeitlich oder situationsbezogen erteilte Sonderrechte
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateAuthority(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Sonderrecht vergeben</span>
                  </button>
                </div>

                {/* Create Temporary Authority Form */}
                {showCreateAuthority && (
                  <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                        Sonderrecht befristet vergeben
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowCreateAuthority(false)}
                        className="text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Abbrechen
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Befugnis auswählen</label>
                        <select
                          value={newAuthName}
                          onChange={e => setNewAuthName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        >
                          {STANDARD_AUTHORITIES.map((sa, idx) => (
                            <option key={idx} value={sa}>{sa}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Empfänger (Mitarbeiter / Name)</label>
                        <input
                          type="text"
                          value={newAuthTargetName}
                          onChange={e => setNewAuthTargetName(e.target.value)}
                          placeholder="z.B. Lehrling Tom, Geselle Anton..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Grund / Anlass</label>
                        <input
                          type="text"
                          value={newAuthReason}
                          onChange={e => setNewAuthReason(e.target.value)}
                          placeholder="z.B. Vertretung während des Markttags"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Befristung / Gültig bis</label>
                        <input
                          type="text"
                          value={newAuthValidUntil}
                          onChange={e => setNewAuthValidUntil(e.target.value)}
                          placeholder="z.B. Heute 22:00, Bis Schichtende"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowCreateAuthority(false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNewAuthority}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                      >
                        Sonderrecht erteilen
                      </button>
                    </div>
                  </div>
                )}

                {temporaryAuthorities.length === 0 ? (
                  <div className="p-4 text-center bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-400">
                    Keine Sonderrechte vergeben.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {temporaryAuthorities.map(auth => (
                      <div
                        key={auth.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-xs font-bold text-slate-100">{auth.authority}</h5>
                            <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                              Vergeben an: {auth.grantedToName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeAuthority(auth.id)}
                            className="text-xs text-slate-500 hover:text-red-400 font-bold"
                            title="Sonderrecht widerrufen"
                          >
                            Widerrufen
                          </button>
                        </div>

                        {auth.reason && (
                          <p className="text-[10px] text-slate-300 italic">Grund: {auth.reason}</p>
                        )}
                        {auth.validUntil && (
                          <p className="text-[10px] text-slate-400 font-mono">Gültig bis: {auth.validUntil}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ARBEITSVORLAGEN */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Arbeitsvorlagen & Betriebsabläufe ({workflowTemplates.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Vordefinierte Handlungsketten, die mit einem Klick in operative Aufgaben umgewandelt werden
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {workflowTemplates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                          {tmpl.category || 'Betriebsablauf'}
                        </span>
                        <h5 className="text-xs font-bold text-slate-100 mt-1.5">{tmpl.title}</h5>
                        {tmpl.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {tmpl.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Schritte ({tmpl.steps.length})
                        </span>
                        <div className="space-y-1">
                          {tmpl.steps.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              className="text-[11px] p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{sIdx + 1}. {s.title}</span>
                                {s.suggestedRole && (
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {s.suggestedRole}
                                  </span>
                                )}
                              </div>
                              {s.description && (
                                <p className="text-[10px] text-slate-400">{s.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyWorkflow(tmpl)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow mt-2"
                    >
                      <i className="fa-solid fa-play text-xs"></i>
                      <span>Als Aufgaben aktivieren</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Betriebsbereit · {activeHolding?.name || 'Persönlicher Bereich'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
