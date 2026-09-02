import React, { useState } from 'react';
import { EconomyHolding, WorldSetting } from '../../types';
import { generateHoldingActivityLog } from '../../services/geminiService';

interface HoldingLogsTabProps {
  holding: EconomyHolding;
  world: WorldSetting;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingLogsTab: React.FC<HoldingLogsTabProps> = ({
  holding,
  world,
  onUpdateHolding
}) => {
  const logs = holding.activityLogs || [];
  const [filter, setFilter] = useState<'all' | 'staff_action' | 'incident' | 'issue_report'>('all');
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredLogs = logs.filter(l => filter === 'all' || l.type === filter);

  const handleSimulateActivities = async () => {
    setIsSimulating(true);
    try {
      const newEntries = await generateHoldingActivityLog(world, holding, 4);
      onUpdateHolding(holding.id, {
        activityLogs: [...newEntries, ...logs]
      });
    } catch (err) {
      console.error('Failed to simulate background logs:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearLogs = () => {
    onUpdateHolding(holding.id, { activityLogs: [] });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-indigo-400"></i> Hintergrundaktivität & Betriebs-Logbuch ({logs.length})
          </h5>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Automatische und simulierte Aktivitäten des Personals, Meldungen von Mägden, Wachen, Köchen und Vorkommnisse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateActivities}
            disabled={isSimulating}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i> Simuliere Ereignisse...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i> KI-Hintergrundaktivität simulieren
              </>
            )}
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="p-2 text-slate-500 hover:text-red-400 bg-slate-900 rounded-xl text-xs cursor-pointer"
              title="Logbuch leeren"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'Alle Einträge' },
          { id: 'staff_action', label: 'Personalaktionen' },
          { id: 'incident', label: 'Ereignisse & Vorfälle' },
          { id: 'issue_report', label: 'Mängel & Warnungen' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
          <p>Noch keine Logbucheinträge vorhanden.</p>
          <button
            type="button"
            onClick={handleSimulateActivities}
            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 rounded-xl text-xs font-bold"
          >
            Aktivitäten jetzt simulieren
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                log.severity === 'urgent' ? 'bg-red-950/20 border-red-500/30' :
                log.severity === 'warning' ? 'bg-amber-950/20 border-amber-500/30' :
                log.severity === 'positive' ? 'bg-emerald-950/20 border-emerald-500/30' :
                'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0 mt-0.5">
                {log.type === 'staff_action' ? '🧑‍🍳' :
                 log.type === 'incident' ? '⚡' :
                 log.type === 'issue_report' ? '⚠️' : '🪙'}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-200">
                    {log.actorName} {log.actorRole ? `(${log.actorRole})` : ''}
                  </span>
                  <span className="text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
