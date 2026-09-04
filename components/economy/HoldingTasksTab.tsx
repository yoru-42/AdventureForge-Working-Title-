import React, { useState } from 'react';
import { EconomyHolding, EconomyTask, EconomyDuty } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingTasksTabProps {
  holding: EconomyHolding;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingTasksTab: React.FC<HoldingTasksTabProps> = ({
  holding,
  onUpdateHolding
}) => {
  const tasks = holding.tasks || [];
  const duties = holding.duties || [];
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Collect responsibilities and duties defined in roles and staff groups
  const roleResponsibilities = (holding.roles || []).flatMap(r =>
    (r.responsibilities || []).map(resp => ({ source: r.name, text: resp, assignee: r.assignedToName }))
  );
  const groupDuties = (holding.staffGroups || []).flatMap(g =>
    (g.duties || []).map(duty => ({ source: g.roleName, text: duty, count: g.count }))
  );
  const totalDefinedInStaff = roleResponsibilities.length + groupDuties.length;

  // Handler to sync staff responsibilities into duties
  const handleSyncDutiesFromStaff = () => {
    const existingTitles = new Set(duties.map(d => d.title.toLowerCase().trim()));
    const newDuties: EconomyDuty[] = [];

    roleResponsibilities.forEach(r => {
      if (!existingTitles.has(r.text.toLowerCase().trim())) {
        existingTitles.add(r.text.toLowerCase().trim());
        newDuties.push({
          id: `duty-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: r.text,
          description: `Rolle: ${r.source}${r.assignee ? ` (${r.assignee})` : ''}`,
          frequency: 'daily',
          isFulfilled: false
        });
      }
    });

    groupDuties.forEach(g => {
      if (!existingTitles.has(g.text.toLowerCase().trim())) {
        existingTitles.add(g.text.toLowerCase().trim());
        newDuties.push({
          id: `duty-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: g.text,
          description: `Gruppe: ${g.source} (${g.count} Personen)`,
          frequency: 'daily',
          isFulfilled: false
        });
      }
    });

    if (newDuties.length > 0) {
      onUpdateHolding(holding.id, { duties: [...duties, ...newDuties] });
    }
  };

  // --- Handlers for Tasks ---
  const handleAddTask = () => {
    const newTask: EconomyTask = {
      id: `task-${Date.now()}`,
      title: 'Neue operative Aufgabe',
      description: '',
      status: 'pending',
      priority: 'medium',
      progress: 0,
      reward: ''
    };
    onUpdateHolding(holding.id, { tasks: [...tasks, newTask] });
  };

  const handleUpdateTask = (id: string, updates: Partial<EconomyTask>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    onUpdateHolding(holding.id, { tasks: updated });
  };

  const handleRemoveTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    onUpdateHolding(holding.id, { tasks: updated });
  };

  // --- Handlers for Duties ---
  const handleAddDuty = () => {
    const newDuty: EconomyDuty = {
      id: `duty-${Date.now()}`,
      title: 'Neue wiederkehrende Pflicht',
      description: '',
      frequency: 'daily',
      isFulfilled: false
    };
    onUpdateHolding(holding.id, { duties: [...duties, newDuty] });
  };

  const handleUpdateDuty = (id: string, updates: Partial<EconomyDuty>) => {
    const updated = duties.map(d => d.id === id ? { ...d, ...updates } : d);
    onUpdateHolding(holding.id, { duties: updated });
  };

  const handleRemoveDuty = (id: string) => {
    const updated = duties.filter(d => d.id !== id);
    onUpdateHolding(holding.id, { duties: updated });
  };

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    return (t.status || 'pending') === taskFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overview & Quick Sync Bar */}
      {totalDefinedInStaff > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-200 block">Personal- und Rollenverknüpfung</span>
            <span className="text-slate-400">
              {totalDefinedInStaff} Aufgaben und Pflichten sind im Personalprofil und den Berufsrollen hinterlegt.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncDutiesFromStaff}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-amber-300 rounded-xl font-bold transition text-xs cursor-pointer shrink-0"
          >
            In wiederkehrende Pflichten übernehmen
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: AUFGABEN */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-3">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Operative Aufgaben ({tasks.length})
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Konkrete Vorhaben und Aufträge</p>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 rounded-xl text-xs font-bold border border-amber-500/30 cursor-pointer"
              >
                Aufgabe hinzufügen
              </button>
            </div>

            {/* Task Filters */}
            <div className="flex items-center gap-1 pt-1">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map(status => {
                const label = status === 'all' ? 'Alle' : status === 'pending' ? 'Offen' : status === 'in_progress' ? 'In Arbeit' : 'Erledigt';
                const count = status === 'all' ? tasks.length : tasks.filter(t => (t.status || 'pending') === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTaskFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      taskFilter === status
                        ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded-2xl">
              {tasks.length === 0 ? 'Keine Aufgaben eingetragen.' : 'Keine Aufgaben mit diesem Status.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div key={task.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <input
                      type="text"
                      value={task.title || ''}
                      onChange={e => handleUpdateTask(task.id, { title: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 outline-none focus:border-amber-500 flex-1"
                      placeholder="Aufgabentitel eingeben..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                      title="Aufgabe entfernen"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  <AutoExpandingTextarea
                    value={task.description || ''}
                    onChange={e => handleUpdateTask(task.id, { description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[45px]"
                    placeholder="Beschreibung der Aufgabe und Arbeitsschritte..."
                  />

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status</label>
                      <select
                        value={task.status || 'pending'}
                        onChange={e => handleUpdateTask(task.id, { status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="pending">Offen</option>
                        <option value="in_progress">In Arbeit</option>
                        <option value="completed">Erledigt</option>
                        <option value="failed">Fehlgeschlagen</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Priorität</label>
                      <select
                        value={task.priority || 'medium'}
                        onChange={e => handleUpdateTask(task.id, { priority: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Frist</label>
                      <input
                        type="text"
                        value={task.deadline || ''}
                        onChange={e => handleUpdateTask(task.id, { deadline: e.target.value })}
                        placeholder="Frist oder Termin"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zuständigkeit</label>
                      <input
                        type="text"
                        value={task.assigneeName || ''}
                        onChange={e => handleUpdateTask(task.id, { assigneeName: e.target.value })}
                        placeholder="Name der Person oder Gruppe"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Benötigte Ressourcen</label>
                      <input
                        type="text"
                        value={task.requiredResources || ''}
                        onChange={e => handleUpdateTask(task.id, { requiredResources: e.target.value })}
                        placeholder="Materialien oder Mittel"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ertrag / Auswirkung</label>
                      <input
                        type="text"
                        value={task.reward || ''}
                        onChange={e => handleUpdateTask(task.id, { reward: e.target.value })}
                        placeholder="Ergebnis oder Vergütung"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-semibold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fortschritt ({task.progress || 0}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={task.progress || 0}
                        onChange={e => handleUpdateTask(task.id, { progress: parseInt(e.target.value) || 0 })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: WIEDERKEHRENDE PFLICHTEN */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Wiederkehrende Pflichten ({duties.length})
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Tägliche, wöchentliche oder ständige Routinen</p>
            </div>
            <button
              type="button"
              onClick={handleAddDuty}
              className="px-3 py-1.5 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 rounded-xl text-xs font-bold border border-indigo-500/30 cursor-pointer"
            >
              Pflicht hinzufügen
            </button>
          </div>

          {duties.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded-2xl">
              Keine Pflichten hinterlegt.
            </div>
          ) : (
            <div className="space-y-3">
              {duties.map(duty => (
                <div key={duty.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={duty.isFulfilled}
                        onChange={() => handleUpdateDuty(duty.id, { isFulfilled: !duty.isFulfilled })}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                        title="Erfüllt?"
                      />
                      <input
                        type="text"
                        value={duty.title || ''}
                        onChange={e => handleUpdateDuty(duty.id, { title: e.target.value })}
                        className={`bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none focus:border-amber-500 flex-1 ${duty.isFulfilled ? 'text-emerald-400 line-through' : 'text-slate-100'}`}
                        placeholder="Titel der Pflicht..."
                      />
                    </div>

                    <select
                      value={duty.frequency || 'daily'}
                      onChange={e => handleUpdateDuty(duty.id, { frequency: e.target.value as any })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-300 outline-none cursor-pointer shrink-0"
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="always">Dauerhaft</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveDuty(duty.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                      title="Pflicht entfernen"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  <AutoExpandingTextarea
                    value={duty.description || ''}
                    onChange={e => handleUpdateDuty(duty.id, { description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[40px]"
                    placeholder="Beschreibung der Abläufe und Zuständigkeiten..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
