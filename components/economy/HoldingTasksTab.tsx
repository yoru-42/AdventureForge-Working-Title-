import React from 'react';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
      {/* SECTION 1: AUFGABEN */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-list-check"></i> Operative Aufgaben ({tasks.length})
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">Konkrete einmalige Vorhaben & Handlungen</p>
          </div>
          <button
            type="button"
            onClick={handleAddTask}
            className="px-2.5 py-1 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 rounded-xl text-xs font-bold border border-amber-500/30 cursor-pointer flex items-center gap-1"
          >
            <i className="fa-solid fa-plus"></i> Aufgabe
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-800 text-xs text-slate-400 italic rounded-2xl">
            Keine Aufgaben eingetragen.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="text"
                    value={task.title || ''}
                    onChange={e => handleUpdateTask(task.id, { title: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 outline-none focus:border-amber-500 flex-1"
                    placeholder="Aufgabentitel"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                <AutoExpandingTextarea
                  value={task.description || ''}
                  onChange={e => handleUpdateTask(task.id, { description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[45px]"
                  placeholder="Details der Aufgabe..."
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
                      placeholder="z.B. 3 Tage"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zuständigkeit (Person / Gruppe)</label>
                    <input
                      type="text"
                      value={task.assigneeName || ''}
                      onChange={e => handleUpdateTask(task.id, { assigneeName: e.target.value })}
                      placeholder="z.B. Anton oder Küchenhilfen"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Benötigte Ressourcen</label>
                    <input
                      type="text"
                      value={task.requiredResources || ''}
                      onChange={e => handleUpdateTask(task.id, { requiredResources: e.target.value })}
                      placeholder="z.B. 10 Holz, 2 Eisen"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Belohnung / Auswirkung</label>
                    <input
                      type="text"
                      value={task.reward || ''}
                      onChange={e => handleUpdateTask(task.id, { reward: e.target.value })}
                      placeholder="z.B. +100 Gold"
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
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-clock-rotate-left"></i> Wiederkehrende Pflichten ({duties.length})
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">Tägliche, wöchentliche oder ständige Routinen</p>
          </div>
          <button
            type="button"
            onClick={handleAddDuty}
            className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 rounded-xl text-xs font-bold border border-indigo-500/30 cursor-pointer flex items-center gap-1"
          >
            <i className="fa-solid fa-plus"></i> Pflicht
          </button>
        </div>

        {duties.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-800 text-xs text-slate-400 italic rounded-2xl">
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
                      placeholder="Pflichttitel"
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
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                <AutoExpandingTextarea
                  value={duty.description || ''}
                  onChange={e => handleUpdateDuty(duty.id, { description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[40px]"
                  placeholder="Beschreibung der Pflicht..."
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
