import React from 'react';
import { EconomyHolding, EconomyDecision } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingDecisionsTabProps {
  holding: EconomyHolding;
  currencyIcon: string;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingDecisionsTab: React.FC<HoldingDecisionsTabProps> = ({
  holding,
  currencyIcon,
  onUpdateHolding
}) => {
  const decisions = holding.decisions || [];

  const handleAddDecision = () => {
    const newDec: EconomyDecision = {
      id: `dec-${Date.now()}`,
      title: 'Neues Managementproblem / Ereignis',
      description: '',
      category: 'gebaeude',
      urgency: 'mittel',
      requiredAuthority: 'Budget & Finanzen freigeben',
      options: [
        { id: 'opt-1', label: 'Option A: Sofortmaßnahmen finanzieren', outcomeDescription: 'Kosten entstehen, Problem gelöst.', cost: 25 },
        { id: 'opt-2', label: 'Option B: Problem aussitzen / verschieben', outcomeDescription: 'Keine Kosten, Risiko von Folgeschäden.' }
      ],
      status: 'offen'
    };
    onUpdateHolding(holding.id, { decisions: [...decisions, newDec] });
  };

  const handleUpdateDecision = (id: string, updates: Partial<EconomyDecision>) => {
    const updated = decisions.map(d => d.id === id ? { ...d, ...updates } : d);
    onUpdateHolding(holding.id, { decisions: updated });
  };

  const handleRemoveDecision = (id: string) => {
    const updated = decisions.filter(d => d.id !== id);
    onUpdateHolding(holding.id, { decisions: updated });
  };

  const handleChooseOption = (decisionId: string, optionId: string) => {
    const decision = decisions.find(d => d.id === decisionId);
    if (!decision) return;
    const option = decision.options.find(o => o.id === optionId);
    if (!option) return;

    // Apply cost to budget if cost exists
    let updatedBudget = holding.budget;
    if (option.cost && holding.budget !== undefined) {
      updatedBudget = Math.max(0, holding.budget - option.cost);
    }

    // Add log entry
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Vor Kurzem',
      actorName: 'Betriebsleitung',
      type: 'incident' as const,
      message: `Entscheidung '${decision.title}' getroffen: ${option.label}. (${option.outcomeDescription})`,
      severity: (option.reputationChange && option.reputationChange < 0) ? 'warning' as const : 'positive' as const
    };

    const updatedDecisions: EconomyDecision[] = decisions.map(d => 
      d.id === decisionId ? { ...d, status: 'entschieden' as const, selectedOptionId: optionId } : d
    );

    onUpdateHolding(holding.id, {
      decisions: updatedDecisions,
      budget: updatedBudget,
      activityLogs: [newLog, ...(holding.activityLogs || [])]
    });
  };

  const handleEscalateDecision = (decisionId: string) => {
    const updatedDecisions: EconomyDecision[] = decisions.map(d => 
      d.id === decisionId ? { ...d, status: 'eskaliert' as const } : d
    );
    onUpdateHolding(holding.id, { decisions: updatedDecisions });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-gavel text-amber-500"></i> Management-Entscheidungen & Vorfälle ({decisions.length})
          </h5>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dringende betriebliche Fragen, Rohstoffengpässe, Beschwerden oder Verhandlungen.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddDecision}
          className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus"></i> Entscheidung anlegen
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
          <p>Keine offenen Entscheidungen oder Vorfälle anhängig. Alles läuft nach Plan.</p>
          <button
            type="button"
            onClick={handleAddDecision}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 rounded-xl text-xs font-bold"
          >
            + Problemfall / Entscheidung anlegen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map(dec => (
            <div key={dec.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      dec.urgency === 'hoch' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      dec.urgency === 'mittel' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {dec.urgency}
                    </span>
                    <input
                      type="text"
                      value={dec.title || ''}
                      onChange={e => handleUpdateDecision(dec.id, { title: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-500 flex-1"
                      placeholder="Titel der Entscheidung"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                    dec.status === 'entschieden' ? 'bg-emerald-500/20 text-emerald-300' :
                    dec.status === 'eskaliert' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {dec.status === 'entschieden' ? '✓ Entschieden' : dec.status === 'eskaliert' ? '↗ Eskaliert' : '⏳ Offen'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDecision(dec.id)}
                    className="p-2 text-red-400 hover:text-red-300 bg-slate-900 rounded-xl text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              <AutoExpandingTextarea
                value={dec.description || ''}
                onChange={e => handleUpdateDecision(dec.id, { description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                placeholder="Hintergrund und Kontext des Problems..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Erforderliche Befugnis</label>
                  <input
                    type="text"
                    value={dec.requiredAuthority || ''}
                    onChange={e => handleUpdateDecision(dec.id, { requiredAuthority: e.target.value })}
                    placeholder="z.B. Budget & Finanzen freigeben"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Kategorie</label>
                  <select
                    value={dec.category || 'gebaeude'}
                    onChange={e => handleUpdateDecision(dec.id, { category: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="finanzen">Finanzen & Preise</option>
                    <option value="personal">Personal & Disziplin</option>
                    <option value="gebaeude">Gebäude & Reparaturen</option>
                    <option value="kunden">Kunden & Verträge</option>
                    <option value="sicherheit">Sicherheit & Schutz</option>
                    <option value="fraktion">Fraktion & Politik</option>
                    <option value="produktion">Produktion & Gewerbe</option>
                  </select>
                </div>
              </div>

              {/* Decision Options */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verfügbare Handlungsoptionen:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dec.options.map((opt, oIdx) => (
                    <div
                      key={opt.id || oIdx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        dec.selectedOptionId === opt.id
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <strong className="text-xs text-white block">{opt.label}</strong>
                        {opt.cost ? (
                          <span className="text-[10px] font-bold font-mono text-red-400">
                            -{opt.cost} {currencyIcon}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-300 mb-3">{opt.outcomeDescription}</p>

                      {dec.status === 'offen' && (
                        <button
                          type="button"
                          onClick={() => handleChooseOption(dec.id, opt.id)}
                          className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-check"></i> Diese Option wählen
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {dec.status === 'offen' && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleEscalateDecision(dec.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> Keine Befugnis? An Vorgesetzten / Eigentümer eskalieren
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
