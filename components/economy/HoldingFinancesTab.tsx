import React from 'react';
import { EconomyHolding, EconomyUpgrade } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingFinancesTabProps {
  holding: EconomyHolding;
  currencyIcon: string;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingFinancesTab: React.FC<HoldingFinancesTabProps> = ({
  holding,
  currencyIcon,
  onUpdateHolding
}) => {
  const upgrades = holding.upgrades || [];
  const net = (holding.incomePerInterval || 0) - (holding.upkeepPerInterval || 0);

  const handleAddUpgrade = () => {
    const newUpg: EconomyUpgrade = {
      id: `upg-${Date.now()}`,
      name: 'Neuer Ausbau / Erweiterung',
      cost: 100,
      levelRequired: 1,
      unlocked: false,
      description: 'Erhöht Kapazität oder Einnahmen.'
    };
    onUpdateHolding(holding.id, { upgrades: [...upgrades, newUpg] });
  };

  const handleUpdateUpgrade = (id: string, updates: Partial<EconomyUpgrade>) => {
    const updated = upgrades.map(u => u.id === id ? { ...u, ...updates } : u);
    onUpdateHolding(holding.id, { upgrades: updated });
  };

  const handleRemoveUpgrade = (id: string) => {
    const updated = upgrades.filter(u => u.id !== id);
    onUpdateHolding(holding.id, { upgrades: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Erträge pro Intervall</span>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <input
              type="number"
              value={holding.incomePerInterval || 0}
              onChange={e => onUpdateHolding(holding.id, { incomePerInterval: parseInt(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-base text-emerald-400 font-extrabold outline-none focus:border-emerald-500 w-28 text-center font-mono"
            />
            <span className="text-sm font-bold text-amber-400">{currencyIcon}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Unterhalt pro Intervall</span>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <input
              type="number"
              value={holding.upkeepPerInterval || 0}
              onChange={e => onUpdateHolding(holding.id, { upkeepPerInterval: parseInt(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-base text-red-400 font-extrabold outline-none focus:border-red-500 w-28 text-center font-mono"
            />
            <span className="text-sm font-bold text-amber-400">{currencyIcon}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Netto-Saldo</span>
          <div className={`text-base font-extrabold font-mono mt-3 ${net >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
            {net >= 0 ? '+' : ''}{net} {currencyIcon}
          </div>
        </div>
      </div>

      {/* Budget & Storage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block">Betriebskasse / Schatzkiste ({currencyIcon})</label>
          <input
            type="number"
            value={holding.budget || 0}
            onChange={e => onUpdateHolding(holding.id, { budget: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-bold font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block">Lagerkapazität (Einheiten)</label>
          <input
            type="number"
            value={holding.storageCapacity || 100}
            onChange={e => onUpdateHolding(holding.id, { storageCapacity: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Upgrades Section */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-arrow-up-from-ground-water"></i> Ausbauten & Upgrades ({upgrades.length})
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">Erweiterungen, Werkbänke, Befestigungen und neue Räume</p>
          </div>
          <button
            type="button"
            onClick={handleAddUpgrade}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <i className="fa-solid fa-plus"></i> Upgrade hinzufügen
          </button>
        </div>

        {upgrades.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-800 text-xs text-slate-400 italic rounded-2xl">
            Bislang keine Ausbauten oder Upgrades konfiguriert.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upgrades.map(upg => (
              <div key={upg.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={upg.unlocked}
                      onChange={() => handleUpdateUpgrade(upg.id, { unlocked: !upg.unlocked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                      title="Bereits gebaut/freigeschaltet?"
                    />
                    <input
                      type="text"
                      value={upg.name || ''}
                      onChange={e => handleUpdateUpgrade(upg.id, { name: e.target.value })}
                      className={`bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none focus:border-amber-500 flex-1 ${upg.unlocked ? 'text-emerald-400 line-through' : 'text-slate-100'}`}
                      placeholder="Name des Upgrades"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveUpgrade(upg.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Kosten ({currencyIcon})</label>
                    <input
                      type="number"
                      value={upg.cost ?? 0}
                      onChange={e => handleUpdateUpgrade(upg.id, { cost: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono font-bold text-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Erforderliche Stufe</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={upg.levelRequired || 1}
                      onChange={e => handleUpdateUpgrade(upg.id, { levelRequired: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono text-center text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <AutoExpandingTextarea
                  value={upg.description || ''}
                  onChange={e => handleUpdateUpgrade(upg.id, { description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[40px]"
                  placeholder="Effektbeschreibung..."
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
