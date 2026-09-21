import React, { useState, useMemo } from 'react';
import { 
  Adventure, 
  Character,
  EconomyHolding, 
  EconomyTask, 
  EconomyDuty,
  TradeContract,
  EconomyResource,
  NPC,
  HoldingRoom
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { CharacterKnowledgeService } from '../services/characterKnowledgeService';
import {
  calculateHoldingRoomStats,
  normalizeHoldingRoom,
  generateRoomsSummaryString,
  generateRoomCapacityString,
  ROOM_TYPE_METADATA,
  ROOM_CATEGORIES,
  OCCUPANCY_MODE_OPTIONS
} from '../lib/roomUtils';
import { 
  Building2, 
  MapPin, 
  User, 
  Users, 
  Package, 
  FileText, 
  CheckSquare, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Shield, 
  Clock, 
  X, 
  ChevronRight, 
  Briefcase,
  Layers,
  Send,
  Edit3,
  DoorOpen,
  BedDouble
} from 'lucide-react';

interface WorkManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
}

type TabType = 'overview' | 'tasks' | 'duties' | 'staff' | 'contracts' | 'rooms';

export const WorkManagementModal: React.FC<WorkManagementModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage,
  onSetInputText
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');

  // Quick Task Creation State
  const [showQuickCreateTask, setShowQuickCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');

  // Quick Duty Creation State
  const [showQuickCreateDuty, setShowQuickCreateDuty] = useState(false);
  const [newDutyTitle, setNewDutyTitle] = useState('');
  const [newDutyDescription, setNewDutyDescription] = useState('');
  const [newDutyFrequency, setNewDutyFrequency] = useState<'daily' | 'weekly' | 'shift'>('daily');

  // Direct Action Formulator State
  const [activeActionTask, setActiveActionTask] = useState<EconomyTask | null>(null);
  const [activeActionDuty, setActiveActionDuty] = useState<EconomyDuty | null>(null);
  const [userActionText, setUserActionText] = useState('');
  const [markAsCompletedOnExecute, setMarkAsCompletedOnExecute] = useState(true);

  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // All holdings in current world state
  // All holdings in current world state
  const holdings = useMemo<EconomyHolding[]>(() => {
    return adventure.world?.economyConfig?.holdings || [];
  }, [adventure.world?.economyConfig?.holdings]);

  // Derive character knowledge
  const effectiveKnowledge = useMemo(() => {
    return CharacterKnowledgeService.getEffectiveKnowledge(adventure);
  }, [adventure]);

  // Holdings available / known to player
  const availableHoldings = useMemo<EconomyHolding[]>(() => {
    return holdings.filter(h => 
      CharacterKnowledgeService.isHoldingOwnerOrMaster(adventure.player, h) ||
      adventure.player?.workplaceId === h.id ||
      CharacterKnowledgeService.isHoldingKnown(h, effectiveKnowledge, adventure.player)
    );
  }, [holdings, effectiveKnowledge, adventure.player]);

  // Current active holding
  const activeHolding = useMemo<EconomyHolding | null>(() => {
    if (availableHoldings.length === 0) return null;

    if (selectedHoldingId) {
      const found = availableHoldings.find(h => h.id === selectedHoldingId);
      if (found) return found;
    }

    // Try finding by player workplace
    if (adventure.player?.workplaceId) {
      const wp = availableHoldings.find(h => h.id === adventure.player?.workplaceId);
      if (wp) return wp;
    }

    // Try finding by player profession
    const playerProf = (adventure.player?.profession || adventure.player?.role || '').toLowerCase();
    if (playerProf) {
      const profHolding = availableHoldings.find(h => 
        h.type.toLowerCase().includes(playerProf) || 
        h.name.toLowerCase().includes(playerProf) ||
        h.roles?.some(r => r.name.toLowerCase().includes(playerProf))
      );
      if (profHolding) return profHolding;
    }

    // Try finding owned holding
    const owned = availableHoldings.find(h => h.ownerType === 'user' || h.ownerCharacterId === adventure.player?.id);
    if (owned) return owned;

    return availableHoldings[0];
  }, [availableHoldings, selectedHoldingId, adventure.player]);

  // Location details for active holding
  const holdingLocationName = useMemo<string>(() => {
    if (!activeHolding) return adventure.storyState?.currentLocationName || adventure.world?.startLocationName || 'Unbekannter Standort';
    if (activeHolding.locationName) return activeHolding.locationName;
    if (activeHolding.locationId) {
      const terr = adventure.world?.territories?.find(t => t.id === activeHolding.locationId);
      if (terr) return terr.name;
    }
    return adventure.storyState?.currentLocationName || adventure.world?.startLocationName || 'Unbekannter Standort';
  }, [activeHolding, adventure.storyState?.currentLocationName, adventure.world?.startLocationName, adventure.world?.territories]);

  // Owner details for active holding
  const holdingOwnerName = useMemo<string>(() => {
    if (!activeHolding) return adventure.player?.name || 'Unbekannt';
    if (activeHolding.ownerType === 'user') return `${adventure.player?.name || 'Spieler'} (Besitzer)`;
    if (activeHolding.assignedCharacterName) return activeHolding.assignedCharacterName;
    if (activeHolding.ownerCharacterId) {
      const npc = adventure.npcs?.find(n => n.id === activeHolding.ownerCharacterId);
      if (npc) return npc.name;
    }
    return 'Freier Betrieb / Gilde';
  }, [activeHolding, adventure.player?.name, adventure.npcs]);

  // Employee NPCs for active holding
  const holdingEmployees = useMemo<NPC[]>(() => {
    if (!activeHolding) return [];
    const empIds = activeHolding.employeeIds || [];
    const empList: NPC[] = [];
    
    empIds.forEach(id => {
      const found = adventure.npcs?.find(n => n.id === id);
      if (found) empList.push(found);
    });

    // Also include NPCs matching location if staff list is sparse
    if (empList.length === 0 && adventure.npcs) {
      adventure.npcs.forEach(n => {
        if (n.workplaceId === activeHolding.id || n.residenceId === activeHolding.locationId) {
          if (!empList.some(e => e.id === n.id)) empList.push(n);
        }
      });
    }

    return empList;
  }, [activeHolding, adventure.npcs]);

  // Live tasks filtered strictly by character knowledge
  const tasks = useMemo<EconomyTask[]>(() => {
    const rawHoldingTasks = activeHolding?.tasks || [];
    const rawPlayerTasks = adventure.player?.tasks || [];
    const map = new Map<string, EconomyTask>();
    rawHoldingTasks.forEach(t => map.set(t.id, t));
    rawPlayerTasks.forEach(t => map.set(t.id, t));
    
    return Array.from(map.values()).filter(task => 
      CharacterKnowledgeService.isTaskKnown(task, activeHolding, effectiveKnowledge, adventure.player)
    );
  }, [activeHolding, adventure.player, effectiveKnowledge]);

  // Live duties filtered strictly by character knowledge
  const duties = useMemo<EconomyDuty[]>(() => {
    const rawHoldingDuties = activeHolding?.duties || [];
    const rawPlayerDuties = adventure.player?.duties || [];
    const map = new Map<string, EconomyDuty>();
    rawHoldingDuties.forEach(d => map.set(d.id, d));
    rawPlayerDuties.forEach(d => map.set(d.id, d));

    return Array.from(map.values()).filter(duty => 
      CharacterKnowledgeService.isDutyKnown(duty, activeHolding, effectiveKnowledge, adventure.player)
    );
  }, [activeHolding, adventure.player, effectiveKnowledge]);

  // Live resources (Lager) - only visible if character has access/knowledge or works there/owns it
  const resources = useMemo<EconomyResource[]>(() => {
    if (!activeHolding) return [];
    const isMaster = CharacterKnowledgeService.isHoldingOwnerOrMaster(adventure.player, activeHolding);
    const isEmployee = adventure.player?.workplaceId === activeHolding.id;
    if (!isMaster && !isEmployee) {
      const hasKnowledge = effectiveKnowledge.facts.some(f => 
        f.entityId === activeHolding.id || f.title?.toLowerCase().includes(activeHolding.name.toLowerCase())
      );
      if (!hasKnowledge) return [];
    }
    return activeHolding.resources || [];
  }, [activeHolding, adventure.player, effectiveKnowledge]);

  // Live contracts (Verträge) filtered strictly by character knowledge
  const contracts = useMemo<TradeContract[]>(() => {
    return CharacterKnowledgeService.getKnownContracts(adventure, activeHolding);
  }, [adventure, activeHolding]);

  // Holding rooms normalized
  const holdingRooms = useMemo<HoldingRoom[]>(() => {
    if (!activeHolding) return [];
    const raw = activeHolding.buildingRooms || [];
    return raw.map(r => normalizeHoldingRoom(r));
  }, [activeHolding]);

  const holdingRoomStats = useMemo(() => {
    return calculateHoldingRoomStats(holdingRooms);
  }, [holdingRooms]);

  if (!isOpen) return null;

  // Helper to persist updated tasks/duties/holding state back into Adventure
  const persistChanges = (updatedTasks: EconomyTask[], updatedDuties: EconomyDuty[], updatedHoldingOverwrites?: Partial<EconomyHolding>) => {
    let updatedHoldings = adventure.world?.economyConfig?.holdings || [];
    
    if (activeHolding) {
      updatedHoldings = updatedHoldings.map(h => {
        if (h.id === activeHolding.id) {
          return {
            ...h,
            tasks: updatedTasks,
            duties: updatedDuties,
            ...updatedHoldingOverwrites
          };
        }
        return h;
      });
    }

    onUpdateAdventure({
      ...adventure,
      player: {
        ...adventure.player,
        tasks: updatedTasks,
        duties: updatedDuties
      },
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

  const handleUpdateHoldingRooms = (updatedRooms: HoldingRoom[]) => {
    if (!activeHolding) return;
    const norm = updatedRooms.map(r => normalizeHoldingRoom(r));
    const summaryStr = generateRoomsSummaryString(norm);
    const capStr = generateRoomCapacityString(norm, activeHolding.physicalCapacity);
    persistChanges(tasks, duties, {
      buildingRooms: norm,
      roomsOrAreas: summaryStr || activeHolding.roomsOrAreas,
      physicalCapacity: capStr || activeHolding.physicalCapacity
    });
  };

  const handleRoomFieldChange = (idx: number, field: keyof HoldingRoom, val: any) => {
    const next = [...holdingRooms];
    const item = { ...next[idx], [field]: val };
    if (field === 'roomType') {
      const meta = ROOM_TYPE_METADATA[val as any];
      if (meta && meta.defaultBeds !== undefined && (!item.bedsPerRoom || item.bedsPerRoom === 0)) {
        item.bedsPerRoom = meta.defaultBeds;
      }
    }
    next[idx] = normalizeHoldingRoom(item);
    handleUpdateHoldingRooms(next);
  };

  const handleRoomCountChange = (idx: number, delta: number) => {
    const next = [...holdingRooms];
    const newCount = Math.max(1, (next[idx].count || 1) + delta);
    next[idx] = normalizeHoldingRoom({ ...next[idx], count: newCount });
    handleUpdateHoldingRooms(next);
  };

  const handleAddHoldingRoom = () => {
    const newRoom: HoldingRoom = normalizeHoldingRoom({
      id: `room-${Date.now()}`,
      name: 'Neuer Raum',
      count: 1,
      roomType: 'other',
      purpose: 'Nutzung & Betriebszweck'
    });
    handleUpdateHoldingRooms([...holdingRooms, newRoom]);
  };

  const handleRemoveHoldingRoom = (idx: number) => {
    const next = holdingRooms.filter((_, i) => i !== idx);
    handleUpdateHoldingRooms(next);
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
    persistChanges(updated, duties);
    setStatusNotice('Aufgabenstatus wurde aktualisiert.');
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    persistChanges(updated, duties);
    setStatusNotice('Aufgabe wurde entfernt.');
  };

  const handleSaveNewTask = () => {
    if (!newTaskTitle.trim()) return;
    
    let assigneeName = adventure.player?.name || 'Spieler';
    if (newTaskAssigneeId) {
      const foundNpc = adventure.npcs?.find(n => n.id === newTaskAssigneeId);
      if (foundNpc) assigneeName = foundNpc.name;
    }

    const task: EconomyTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: 'pending',
      priority: newTaskPriority,
      deadline: newTaskDeadline.trim() || undefined,
      reward: '',
      assigneeName,
      assigneeId: newTaskAssigneeId || undefined,
      createdByName: adventure.player?.name || 'Spieler',
      taskType: 'manual',
      canDelegate: true
    };

    persistChanges([task, ...tasks], duties);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDeadline('');
    setNewTaskAssigneeId('');
    setShowQuickCreateTask(false);
    setStatusNotice('Neue Aufgabe wurde angelegt.');
  };

  const handleSaveNewDuty = () => {
    if (!newDutyTitle.trim()) return;

    const duty: EconomyDuty = {
      id: `duty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newDutyTitle.trim(),
      description: newDutyDescription.trim(),
      frequency: newDutyFrequency,
      isFulfilled: false,
      assignedRoleName: adventure.player?.profession || adventure.player?.role || 'Verantwortlicher'
    };

    persistChanges(tasks, [duty, ...duties]);
    setNewDutyTitle('');
    setNewDutyDescription('');
    setShowQuickCreateDuty(false);
    setStatusNotice('Neue laufende Pflicht wurde hinzugefügt.');
  };

  const handleToggleDutyFulfilled = (dutyId: string) => {
    const updated = duties.map(d => {
      if (d.id === dutyId) {
        return { ...d, isFulfilled: !d.isFulfilled };
      }
      return d;
    });
    persistChanges(tasks, updated);
  };

  const handleStartTaskAction = (task: EconomyTask) => {
    setActiveActionTask(task);
    setActiveActionDuty(null);
    setUserActionText(`*kümmert sich um die Aufgabe "${task.title}" und führt die notwendigen Schritte durch*`);
    setMarkAsCompletedOnExecute(true);
  };

  const handleStartDutyAction = (duty: EconomyDuty) => {
    setActiveActionDuty(duty);
    setActiveActionTask(null);
    setUserActionText(`*nimmt die laufende Pflicht "${duty.title}" wahr und sorgt für Ordnung am Standort*`);
  };

  const handleExecuteActionIntoChat = () => {
    if (!userActionText.trim()) return;

    let targetTitle = '';
    let updatedTasks = [...tasks];
    let updatedDuties = [...duties];

    if (activeActionTask) {
      targetTitle = activeActionTask.title;
      if (markAsCompletedOnExecute) {
        updatedTasks = updatedTasks.map(t => 
          t.id === activeActionTask.id ? { ...t, status: 'completed', progress: 100 } : t
        );
      } else {
        updatedTasks = updatedTasks.map(t => 
          t.id === activeActionTask.id ? { ...t, status: 'in_progress' } : t
        );
      }
    } else if (activeActionDuty) {
      targetTitle = activeActionDuty.title;
      updatedDuties = updatedDuties.map(d => 
        d.id === activeActionDuty.id ? { ...d, isFulfilled: true } : d
      );
    }

    persistChanges(updatedTasks, updatedDuties);

    const cleanAction = userActionText.trim();
    const chatPayload = targetTitle 
      ? `[${activeActionTask ? 'Aufgabe' : 'Pflicht'}: ${targetTitle}] ${cleanAction}`
      : cleanAction;

    if (onSendChatMessage) {
      onSendChatMessage(chatPayload);
    } else if (onSetInputText) {
      onSetInputText(chatPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Aufgaben & Verantwortung
              </h2>
              <p className="text-xs text-slate-400">
                Live-Verknüpfung von Charakteren, Betrieben, Orten, Pflichten und Lagerständen
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live World Selector & Location Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Aktiver Betrieb:
            </span>
            {availableHoldings.length > 0 ? (
              <select
                value={activeHolding?.id || ''}
                onChange={e => setSelectedHoldingId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl text-xs px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {availableHoldings.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400 italic">Keine bekannten Betriebe vorhanden</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">{holdingLocationName}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200">{holdingOwnerName}</span>
            </div>
          </div>
        </div>

        {/* Status Notice */}
        {statusNotice && (
          <div className="px-6 py-2 bg-indigo-950/40 border-b border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
            <span>{statusNotice}</span>
            <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Welt-Verknüpfung & Lager
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Aufgaben ({tasks.filter(t => t.status !== 'completed').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duties')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'duties'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            Laufende Pflichten ({duties.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Personal & Mitarbeiter ({holdingEmployees.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Zugehörige Verträge ({contracts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            Räume & Belegung ({holdingRoomStats.totalRooms})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 1: OVERVIEW & HIERARCHY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Hierarchy Visualizer Box */}
              {activeHolding ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">{activeHolding.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-semibold">
                        {activeHolding.type}
                      </span>
                    </div>
                    {activeHolding.description && (
                      <span className="text-xs text-slate-400 max-w-md text-right">
                        {activeHolding.description}
                      </span>
                    )}
                  </div>

                  {/* Hierarchical Live Tree */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Location Node */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        Standort
                      </div>
                      <div className="font-bold text-slate-200 text-sm">{holdingLocationName}</div>
                      <div className="text-[11px] text-slate-400">Geografischer Bezugsort im Codex</div>
                    </div>

                    {/* Owner Node */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        Besitzer & Eigentum
                      </div>
                      <div className="font-bold text-slate-200 text-sm">{holdingOwnerName}</div>
                      <div className="text-[11px] text-slate-400">Verantwortliche Person / Fraktion</div>
                    </div>

                    {/* Staff Node */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        Mitarbeiter & Belegschaft
                      </div>
                      <div className="font-bold text-slate-200 text-sm">
                        {holdingEmployees.length} angemeldete Kräfte
                      </div>
                      <div className="text-[11px] text-slate-400">Inklusive Wachen, Gehilfen & Handwerker</div>
                    </div>
                  </div>

                  {/* Storage / Lager Stand */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-400" />
                      Lagerbestand & Vorräte ({resources.length} Typen)
                    </h4>
                    
                    {resources.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {resources.map(res => (
                          <div key={res.id} className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">{res.name}</span>
                            <span className="font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                              {res.amount} {res.unit || 'Stk.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                        Kein spezifizierter Lagerbestand verzeichnet. Waren können im Handelsmenü hinzugefügt oder aufgestockt werden.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  Kein Betrieb ausgewählt. Bitte wählen Sie oben einen Betrieb aus oder legen Sie in der Weltansicht einen neuen an.
                </div>
              )}

              {/* Quick Action Formulation Box */}
              {(activeActionTask || activeActionDuty) && (
                <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-400" />
                      Aktion formulieren: {activeActionTask ? activeActionTask.title : activeActionDuty?.title}
                    </h3>
                    <button 
                      onClick={() => { setActiveActionTask(null); setActiveActionDuty(null); }}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <AutoExpandingTextarea
                    value={userActionText}
                    onChange={e => setUserActionText(e.target.value)}
                    placeholder="Beschreiben Sie die genaue Handlung für das Rollenspiel im Chat..."
                    className="w-full bg-slate-900 border border-indigo-500/30 text-slate-100 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-400"
                    minRows={3}
                  />

                  {activeActionTask && (
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={markAsCompletedOnExecute} 
                        onChange={e => setMarkAsCompletedOnExecute(e.target.checked)} 
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>Aufgabe nach Ausführen im Chat als erledigt markieren</span>
                    </label>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExecuteActionIntoChat}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Direkt im Spiel-Chat ausführen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  Aktuelle Aufgaben ({tasks.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuickCreateTask(!showQuickCreateTask)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Neue Aufgabe anlegen
                </button>
              </div>

              {/* Task Creation Form */}
              {showQuickCreateTask && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neue Aufgabe erfassen</h4>
                  
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Titel der Aufgabe (z.B. Eisenbarren im Dorf ordern)"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />

                  <AutoExpandingTextarea
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    placeholder="Detaillierte Aufgabenbeschreibung und besondere Anforderungen..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                    minRows={2}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Priorität</label>
                      <select
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Frist / Zeitlimit</label>
                      <input
                        type="text"
                        value={newTaskDeadline}
                        onChange={e => setNewTaskDeadline(e.target.value)}
                        placeholder="z.B. Bis Sonnenuntergang"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Zuweisen an</label>
                      <select
                        value={newTaskAssigneeId}
                        onChange={e => setNewTaskAssigneeId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="">Eigenes Zeichen (Spieler)</option>
                        {holdingEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickCreateTask(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewTask}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Aufgabe Speichern
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-2.5">
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        task.status === 'completed'
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                              {task.title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              task.priority === 'urgent' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                              task.priority === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {task.priority || 'normal'}
                            </span>
                            {task.assigneeName && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-sky-400" />
                                {task.assigneeName}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleStartTaskAction(task)}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Aktion im Chat formulieren"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Ausführen
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              task.status === 'completed'
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60'
                            }`}
                          >
                            {task.status === 'completed' ? 'Reaktivieren' : 'Erledigt'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                    Keine aktiven Aufgaben für diesen Betrieb verzeichnet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DUTIES */}
          {activeTab === 'duties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Laufende Pflichten & Verantwortung ({duties.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuickCreateDuty(!showQuickCreateDuty)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Pflicht hinzufügen
                </button>
              </div>

              {/* Duty Creation Form */}
              {showQuickCreateDuty && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Laufende Pflicht definieren</h4>
                  
                  <input
                    type="text"
                    value={newDutyTitle}
                    onChange={e => setNewDutyTitle(e.target.value)}
                    placeholder="Titel der Pflicht (z.B. Morgendliche Vorratskontrolle)"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />

                  <AutoExpandingTextarea
                    value={newDutyDescription}
                    onChange={e => setNewDutyDescription(e.target.value)}
                    placeholder="Beschreibung der wiederkehrenden Verantwortung..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                    minRows={2}
                  />

                  <div className="w-48">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Turnus / Frequenz</label>
                    <select
                      value={newDutyFrequency}
                      onChange={e => setNewDutyFrequency(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="daily">Täglich</option>
                      <option value="shift">Pro Schicht</option>
                      <option value="weekly">Wöchentlich</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickCreateDuty(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewDuty}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Pflicht Speichern
                    </button>
                  </div>
                </div>
              )}

              {/* Duties List */}
              <div className="space-y-2.5">
                {duties.length > 0 ? (
                  duties.map(duty => (
                    <div 
                      key={duty.id} 
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{duty.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase">
                            {duty.frequency === 'daily' ? 'Täglich' : duty.frequency === 'shift' ? 'Schicht' : 'Wöchentlich'}
                          </span>
                        </div>
                        {duty.description && (
                          <p className="text-xs text-slate-400">{duty.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartDutyAction(duty)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Pflicht Erfüllen
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDutyFulfilled(duty.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            duty.isFulfilled 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {duty.isFulfilled ? 'Wahrgenommen' : 'Offen'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                    Keine ständigen Pflichten für diese Rolle oder diesen Betrieb definiert.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STAFF */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Mitarbeiter & Belegschaft ({holdingEmployees.length})
              </h3>

              {holdingEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {holdingEmployees.map(emp => (
                    <div key={emp.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200 text-sm">{emp.name}</div>
                        <div className="text-xs text-slate-400">
                          {emp.profession || emp.role || 'Mitarbeiter'} • {emp.residenceName || 'Wohnhaft vor Ort'}
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Aktiv
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                  Keine verknüpften Mitarbeiter für diesen Betrieb verzeichnet.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CONTRACTS */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Zugehörige Handels- & Lieferverträge ({contracts.length})
              </h3>

              {contracts.length > 0 ? (
                <div className="space-y-2.5">
                  {contracts.map(contract => (
                    <div key={contract.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{contract.contractType}</span>
                          <span className="text-xs text-slate-400">mit {contract.partnerName}</span>
                        </div>
                        {contract.terms && (
                          <p className="text-xs text-slate-400">{contract.terms}</p>
                        )}
                        {contract.pricePerInterval && (
                          <div className="text-[11px] text-amber-400 font-semibold">
                            Konditionen: {contract.pricePerInterval} Münzen ({contract.interval || 'wöchentlich'})
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                        contract.status === 'aktiv' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                  Keine aktiven Verträge für diesen Betrieb verzeichnet. Verträge können im Handelsmenü abgeschlossen werden.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ROOMS & OCCUPANCY */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* Header & Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-indigo-400" />
                    Räume, Betten und Belegung ({holdingRoomStats.totalRooms})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Strukturierte Erfassung von Räumen, Bettenkapazitäten und Bewohnerbelegung
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddHoldingRoom}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Neuen Raum anlegen
                </button>
              </div>

              {/* KPI Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Räume gesamt
                  </span>
                  <div className="text-base font-bold text-white">
                    {holdingRoomStats.totalRooms}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      in {holdingRooms.length} Raumarten
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Betten gesamt
                  </span>
                  <div className="text-base font-bold text-amber-300">
                    {holdingRoomStats.totalBeds}{' '}
                    <span className="text-xs font-normal text-slate-300">
                      ({holdingRoomStats.occupiedBeds} belegt · {holdingRoomStats.freeBeds} frei)
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Gästebetten
                  </span>
                  <div className="text-sm font-semibold text-slate-200">
                    {holdingRoomStats.guestBeds.total}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({holdingRoomStats.guestBeds.occupied} belegt · {holdingRoomStats.guestBeds.free} frei)
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Personal & Familie
                  </span>
                  <div className="text-sm font-semibold text-slate-200">
                    {holdingRoomStats.staffBeds.total + holdingRoomStats.familyBeds.total}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      (Pers: {holdingRoomStats.staffBeds.occupied}/{holdingRoomStats.staffBeds.total} · Fam: {holdingRoomStats.familyBeds.occupied}/{holdingRoomStats.familyBeds.total})
                    </span>
                  </div>
                </div>
              </div>

              {/* Room Cards List */}
              {holdingRooms.length > 0 ? (
                <div className="space-y-3">
                  {holdingRooms.map((room, idx) => {
                    const meta = ROOM_TYPE_METADATA[room.roomType || 'other'];
                    const isSleeping = meta?.hasBeds || meta?.isSleepingRoom || (room.bedsPerRoom !== undefined && room.bedsPerRoom > 0);

                    return (
                      <div
                        key={room.id || `room-${idx}`}
                        className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border border-slate-800/80 transition-all space-y-2.5"
                      >
                        {/* Upper row: Count, Name, Type, Floor, and Delete */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Count counter */}
                          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleRoomCountChange(idx, -1)}
                              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                              title="Anzahl verringern"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={room.count || 1}
                              onChange={e => handleRoomFieldChange(idx, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-9 bg-transparent text-center text-xs font-bold text-white outline-none"
                              title="Anzahl baugleicher Räume"
                            />
                            <button
                              type="button"
                              onClick={() => handleRoomCountChange(idx, 1)}
                              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                              title="Anzahl erhöhen"
                            >
                              +
                            </button>
                          </div>

                          {/* Room Name */}
                          <div className="flex-1 min-w-[140px]">
                            <input
                              type="text"
                              value={room.name}
                              onChange={e => handleRoomFieldChange(idx, 'name', e.target.value)}
                              placeholder="Raumbezeichnung (z.B. Gästezimmer, Küche)"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Room Type Selector */}
                          <div className="w-44 min-w-[140px]">
                            <select
                              value={room.roomType || 'other'}
                              onChange={e => handleRoomFieldChange(idx, 'roomType', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                              title="Nutzungsart des Raumes"
                            >
                              {ROOM_CATEGORIES.map(category => (
                                <optgroup key={category.id} label={category.label}>
                                  {category.roomTypes.map(t => {
                                    const tMeta = ROOM_TYPE_METADATA[t];
                                    return (
                                      <option key={t} value={t}>
                                        {tMeta?.label || t}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* Floor / Level */}
                          <div className="w-28">
                            <input
                              type="text"
                              value={room.floor || ''}
                              onChange={e => handleRoomFieldChange(idx, 'floor', e.target.value)}
                              placeholder="Ebene / Etage"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                              title="Lage im Gebäude (z.B. Erdgeschoss, 1. OG)"
                            />
                          </div>

                          {/* Status pill */}
                          <div className="hidden md:flex items-center text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 font-mono whitespace-nowrap">
                            {isSleeping ? (
                              <span>
                                {room.totalBeds || 0} Betten | {room.occupiedBeds || 0} belegt | {room.freeBeds || 0} frei
                              </span>
                            ) : room.capacity ? (
                              <span>Kapazität: {room.capacity}</span>
                            ) : (
                              <span className="text-slate-500">Nutzraum</span>
                            )}
                          </div>

                          {/* Delete room */}
                          <button
                            type="button"
                            onClick={() => handleRemoveHoldingRoom(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-auto cursor-pointer"
                            title="Diesen Raum entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Middle row: Beds, Occupancy Mode, and Purpose */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-800/50 items-start">
                          {isSleeping ? (
                            <div className="sm:col-span-6 flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Betten/Raum:</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={room.bedsPerRoom || 0}
                                  onChange={e => handleRoomFieldChange(idx, 'bedsPerRoom', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-bold text-amber-300 outline-none focus:border-indigo-500"
                                  title="Betten in jedem einzelnen dieser Räume"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Belegt:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={room.totalBeds || 999}
                                  value={room.occupiedBeds || 0}
                                  onChange={e => handleRoomFieldChange(idx, 'occupiedBeds', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-bold text-white outline-none focus:border-indigo-500"
                                  title="Aktuell belegte Betten"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Art:</span>
                                <select
                                  value={room.occupancyMode || 'guest'}
                                  onChange={e => handleRoomFieldChange(idx, 'occupancyMode', e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                                  title="Belegungsart"
                                >
                                  {OCCUPANCY_MODE_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="sm:col-span-4 flex items-center gap-2 text-xs">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Personenkapazität:</span>
                              <input
                                type="number"
                                min={0}
                                value={room.capacity || ''}
                                onChange={e => handleRoomFieldChange(idx, 'capacity', e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : undefined)}
                                placeholder="z.B. 40"
                                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-white outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {/* Purpose / Duty description */}
                          <div className={isSleeping ? 'sm:col-span-6' : 'sm:col-span-8'}>
                            <AutoExpandingTextarea
                              value={room.purpose || ''}
                              onChange={e => handleRoomFieldChange(idx, 'purpose', e.target.value)}
                              placeholder="Nutzung, Besonderheiten oder betriebliche Aufgaben des Raumes"
                              minRows={1}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                            />
                          </div>

                          {/* Lower row: Occupants / Assigned Role */}
                          <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/40 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                                Bewohner / Gäste / Personal (Namen):
                              </span>
                              <input
                                type="text"
                                value={Array.isArray(room.occupantNames) ? room.occupantNames.join(', ') : (room.occupantNames || '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  const arr = val.split(',').map(s => s.trim()).filter(Boolean);
                                  handleRoomFieldChange(idx, 'occupantNames', arr);
                                }}
                                placeholder="z.B. Wirt Alwin, Magd Elspeth oder Reisende"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                                Zuständiges Personal / Arbeitsbereich:
                              </span>
                              <input
                                type="text"
                                value={room.assignedRoleName || ''}
                                onChange={e => handleRoomFieldChange(idx, 'assignedRoleName', e.target.value)}
                                placeholder="z.B. Schankkellner, Koch, Nachtwache"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs space-y-2">
                  <p>Keine individuellen Räume definiert.</p>
                  <p className="text-slate-600">
                    Klicken Sie auf 'Neuen Raum anlegen', um Zimmer, Schlafräume oder Arbeitsbereiche für diesen Betrieb zu erfassen.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
