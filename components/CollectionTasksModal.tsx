import React, { useState } from 'react';
import { Adventure, CollectionTask } from '../types';
import { InventoryLootService } from '../services/inventoryLootService';

interface CollectionTasksModalProps {
  adventure: Adventure;
  onUpdateAdventure: (adventure: Adventure) => void;
  onClose: () => void;
}

export const CollectionTasksModal: React.FC<CollectionTasksModalProps> = ({
  adventure,
  onUpdateAdventure,
  onClose
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newTargetQty, setNewTargetQty] = useState(10);
  const [newKeywords, setNewKeywords] = useState('');
  const [newAssignee, setNewAssignee] = useState('player');
  const [newStorage, setNewStorage] = useState('player');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const tasks: CollectionTask[] = adventure.collectionTasks || [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTargetQty <= 0) return;

    const keywords = newKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const result = InventoryLootService.createCollectionTask(adventure, {
      title: newTitle.trim(),
      targetQuantity: newTargetQty,
      itemKeywords: keywords,
      assignedToCharacterId: newAssignee,
      targetStorage: newStorage
    });

    onUpdateAdventure(result.updatedAdventure);
    setNewTitle('');
    setNewKeywords('');
    setShowCreateForm(false);
  };

  const handleDelegate = (taskId: string, assigneeId: string, storage: string) => {
    const updatedAdv = InventoryLootService.delegateCollectionTask(adventure, taskId, assigneeId, storage);
    onUpdateAdventure(updatedAdv);
  };

  const companions = (adventure.npcs || []).filter(n => !n.isHostile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-amber-400 uppercase">
              Sammelaufträge & Bergungslogistik
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Übersicht und Delegation laufender Bergungs- und Sammelaufgaben
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Schließen
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-300 font-medium">
            Aktive Aufträge: {tasks.filter(t => t.status === 'active').length}
          </span>
          <button
            type="button"
            onClick={() => setShowCreateForm(prev => !prev)}
            className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold transition-colors"
          >
            {showCreateForm ? 'Formular ausblenden' : '+ Neuer Sammelauftrag'}
          </button>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateTask} className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Neuen Sammel- oder Bergungsauftrag anlegen:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bezeichnung des Auftrags</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="z.B. Heilkräuter im Wald sammeln"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Zielmenge</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newTargetQty}
                  onChange={e => setNewTargetQty(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Schlüsselbegriffe (Kommagetrennt)</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={e => setNewKeywords(e.target.value)}
                  placeholder="z.B. Kraut, Pflanze, Wurzel"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Zuständigkeit & Delegation</label>
                <select
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="player">Selbst durchführen (Spieler)</option>
                  <option value="party">Gesamte Gruppe / Begleiter</option>
                  {companions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || (c as any).rufName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
              >
                Auftrag speichern
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/30 rounded-lg border border-slate-800">
              Derzeit sind keine aktiven Sammel- oder Bergungsaufträge angelegt.
            </div>
          ) : (
            tasks.map(task => {
              const progressPct = Math.min(100, Math.round((task.collectedQuantity / task.targetQuantity) * 100));
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border transition-colors ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-900/60'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{task.title}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isCompleted
                              ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                              : 'bg-sky-900/40 text-sky-300 border border-sky-700/50'
                          }`}
                        >
                          {isCompleted ? 'Abgeschlossen' : 'In Bearbeitung'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Zuständig: <span className="text-slate-200">{task.assignedToCharacterName || task.assignedToCharacterId}</span> | Zielort: {task.sourceLocation || 'Aktuelle Region'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-200">
                        {task.collectedQuantity} / {task.targetQuantity} {task.unit || 'Stück'}
                      </div>
                      <div className="text-[10px] text-slate-400">{progressPct}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Delegation Options */}
                  {!isCompleted && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                      <span>Auftrag umdelegieren:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelegate(task.id, 'player', 'player')}
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            task.assignedToCharacterId === 'player'
                              ? 'bg-sky-700 text-white font-semibold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Spieler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelegate(task.id, 'party', 'party')}
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            task.assignedToCharacterId === 'party'
                              ? 'bg-sky-700 text-white font-semibold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Gruppe
                        </button>
                        {companions.slice(0, 3).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleDelegate(task.id, c.id, 'party')}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              task.assignedToCharacterId === c.id
                                ? 'bg-sky-700 text-white font-semibold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {c.name || (c as any).rufName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
