import React from 'react';
import { EconomyHolding, EconomyResource, EconomyResourceCategory } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingResourcesTabProps {
  holding: EconomyHolding;
  currencyIcon: string;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

const RESOURCE_CATEGORIES: { category: EconomyResourceCategory; label: string; icon: string }[] = [
  { category: 'raw_material', label: 'Rohstoffe & Materialien', icon: 'Box' },
  { category: 'food_drink', label: 'Lebensmittel & Getränke', icon: 'Soup' },
  { category: 'goods', label: 'Handelswaren & Produkte', icon: 'Package' },
  { category: 'equipment', label: 'Ausrüstung & Werkzeuge', icon: 'Hammer' },
  { category: 'inventory', label: 'Inventar & Vorräte', icon: 'Archive' },
  { category: 'animals', label: 'Tiere & Vieh', icon: 'Beef' },
  { category: 'vehicles', label: 'Fahrzeuge & Karren', icon: 'Truck' },
  { category: 'money', label: 'Geld & Devisen', icon: 'Coins' },
  { category: 'special', label: 'Besonderes & Spezialgüter', icon: 'Star' }
];

export const HoldingResourcesTab: React.FC<HoldingResourcesTabProps> = ({
  holding,
  currencyIcon,
  onUpdateHolding
}) => {
  const resources = holding.resources || [];

  const handleAddResource = () => {
    const newRes: EconomyResource = {
      id: `res-${Date.now()}`,
      name: 'Neues Gut / Rohstoff',
      category: 'raw_material',
      amount: 10,
      maxCapacity: 100,
      unit: 'Einheiten',
      pricePerUnit: 5,
      condition: 'gut'
    };
    onUpdateHolding(holding.id, { resources: [...resources, newRes] });
  };

  const handleUpdateResource = (id: string, updates: Partial<EconomyResource>) => {
    const updated = resources.map(r => r.id === id ? { ...r, ...updates } : r);
    onUpdateHolding(holding.id, { resources: updated });
  };

  const handleRemoveResource = (id: string) => {
    const updated = resources.filter(r => r.id !== id);
    onUpdateHolding(holding.id, { resources: updated });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-boxes-stacked text-amber-500"></i> Lagerbestände & Rohstoffe ({resources.length})
          </h5>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verwalte Vorräte, Erzeugnisse, Werkzeuge, Rohstoffe und Verkaufspreise.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddResource}
          className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus"></i> Ware / Rohstoff anlegen
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
          <p>Noch keine Ressourcen oder Lagergüter erfasst.</p>
          <button
            type="button"
            onClick={handleAddResource}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 rounded-xl text-xs font-bold"
          >
            + Erste Ressource hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(res => {
            const fillPct = Math.min(100, Math.max(0, (res.amount / (res.maxCapacity || 1)) * 100));

            return (
              <div key={res.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="text"
                    value={res.name || ''}
                    onChange={e => handleUpdateResource(res.id, { name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-500 flex-1"
                    placeholder="Name der Ressource"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(res.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Kategorie</label>
                    <select
                      value={res.category || 'raw_material'}
                      onChange={e => handleUpdateResource(res.id, { category: e.target.value as EconomyResourceCategory })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      {RESOURCE_CATEGORIES.map(rc => (
                        <option key={rc.category} value={rc.category}>{rc.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zustand</label>
                    <select
                      value={res.condition || 'gut'}
                      onChange={e => handleUpdateResource(res.id, { condition: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="exzellent">Exzellent</option>
                      <option value="gut">Gut / Frisch</option>
                      <option value="knapp">Knapp / Fast aufgebraucht</option>
                      <option value="verdorben">Verdorben / Abgelaufen</option>
                      <option value="beschaedigt">Beschädigt / Mangelhaft</option>
                      <option value="leer">Leer</option>
                    </select>
                  </div>
                </div>

                {/* Amount, Max Capacity, Unit, Price */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Menge</label>
                    <input
                      type="number"
                      value={res.amount ?? 0}
                      onChange={e => handleUpdateResource(res.id, { amount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Max. Kapazität</label>
                    <input
                      type="number"
                      value={res.maxCapacity ?? 100}
                      onChange={e => handleUpdateResource(res.id, { maxCapacity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Einheit</label>
                    <input
                      type="text"
                      value={res.unit || ''}
                      onChange={e => handleUpdateResource(res.id, { unit: e.target.value })}
                      placeholder="z.B. Fässer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Preis / Einh.</label>
                    <input
                      type="number"
                      value={res.pricePerUnit ?? 0}
                      onChange={e => handleUpdateResource(res.id, { pricePerUnit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold font-mono text-center outline-none"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Auslastung: {Math.round(fillPct)}%</span>
                    <span>{res.amount} / {res.maxCapacity} {res.unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${fillPct < 20 ? 'bg-red-500' : fillPct < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${fillPct}%` }}
                    ></div>
                  </div>
                </div>

                <AutoExpandingTextarea
                  value={res.notes || ''}
                  onChange={e => handleUpdateResource(res.id, { notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[35px]"
                  placeholder="Notizen zu Herkunft oder Verwendungszweck..."
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
