import React from 'react';
import { EconomyHolding, EconomyOrder } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingOrdersTabProps {
  holding: EconomyHolding;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingOrdersTab: React.FC<HoldingOrdersTabProps> = ({
  holding,
  onUpdateHolding
}) => {
  const orders = holding.orders || [];

  const handleAddOrder = () => {
    const newOrder: EconomyOrder = {
      id: `ord-${Date.now()}`,
      title: 'Neuer Auftrag / Weisung',
      issuerName: 'Betriebsleitung',
      recipientName: 'Personal',
      targetGoal: 'Zielvorgabe erfüllen',
      priority: 'normal',
      progress: 0,
      status: 'offen'
    };
    onUpdateHolding(holding.id, { orders: [...orders, newOrder] });
  };

  const handleUpdateOrder = (id: string, updates: Partial<EconomyOrder>) => {
    const updated = orders.map(o => o.id === id ? { ...o, ...updates } : o);
    onUpdateHolding(holding.id, { orders: updated });
  };

  const handleRemoveOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    onUpdateHolding(holding.id, { orders: updated });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-scroll text-amber-500"></i> Aufträge & Direktiven ({orders.length})
          </h5>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Formelle Arbeitsaufträge, Kundenbestellungen oder Sonderweisungen mit Zielvorgaben und Delegation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddOrder}
          className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus"></i> Auftrag anlegen
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
          <p>Keine formellen Aufträge oder Weisungen aktiv.</p>
          <button
            type="button"
            onClick={handleAddOrder}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 rounded-xl text-xs font-bold"
          >
            + Ersten Auftrag anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <input
                  type="text"
                  value={order.title || ''}
                  onChange={e => handleUpdateOrder(order.id, { title: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-500 flex-1"
                  placeholder="Auftragstitel"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOrder(order.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Auftraggeber</label>
                  <input
                    type="text"
                    value={order.issuerName || ''}
                    onChange={e => handleUpdateOrder(order.id, { issuerName: e.target.value })}
                    placeholder="z.B. Stadtrat, Händlergilde"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Auftragnehmer / Empfänger</label>
                  <input
                    type="text"
                    value={order.recipientName || ''}
                    onChange={e => handleUpdateOrder(order.id, { recipientName: e.target.value })}
                    placeholder="z.B. Schmiedemeister, Mägde"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zielvorgabe & Details</label>
                <AutoExpandingTextarea
                  value={order.targetGoal || ''}
                  onChange={e => handleUpdateOrder(order.id, { targetGoal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                  placeholder="Genaue Zielvorgabe..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status</label>
                  <select
                    value={order.status || 'offen'}
                    onChange={e => handleUpdateOrder(order.id, { status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="offen">⏳ Offen</option>
                    <option value="in_bearbeitung">⚙️ In Arbeit</option>
                    <option value="abgeschlossen">✓ Erledigt</option>
                    <option value="abgebrochen">❌ Abgebrochen</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Priorität</label>
                  <select
                    value={order.priority || 'normal'}
                    onChange={e => handleUpdateOrder(order.id, { priority: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="niedrig">Niedrig</option>
                    <option value="normal">Normal</option>
                    <option value="hoch">Hoch</option>
                    <option value="kritisch">Kritisch</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Frist</label>
                  <input
                    type="text"
                    value={order.deadline || ''}
                    onChange={e => handleUpdateOrder(order.id, { deadline: e.target.value })}
                    placeholder="z.B. Monatsende"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Belohnung / Erlös</label>
                  <input
                    type="text"
                    value={order.reward || ''}
                    onChange={e => handleUpdateOrder(order.id, { reward: e.target.value })}
                    placeholder="z.B. 150 Gold"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fortschritt ({order.progress || 0}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={order.progress || 0}
                    onChange={e => handleUpdateOrder(order.id, { progress: parseInt(e.target.value) || 0 })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
