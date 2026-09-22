import React, { useState } from 'react';
import { Adventure, ItemInstance } from '../types';
import { InventoryLootService } from '../services/inventoryLootService';

interface CombatInventoryModalProps {
  adventure: Adventure;
  onUpdateAdventure: (adventure: Adventure) => void;
  onClose: () => void;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  onUseItem?: (item: ItemInstance, resultMessage: string) => void;
}

export const CombatInventoryModal: React.FC<CombatInventoryModalProps> = ({
  adventure,
  onUpdateAdventure,
  onClose,
  playerHp,
  playerMaxHp,
  playerMp,
  playerMaxMp,
  onUseItem
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const combatItems = InventoryLootService.getCombatUsableItems(adventure, 'player');
  const capacity = InventoryLootService.getCarryCapacity(adventure, 'player');

  const handleUse = (item: ItemInstance) => {
    const result = InventoryLootService.useItem(adventure, 'player', item.id);
    setFeedback(result.resultMessage);
    onUpdateAdventure(result.updatedAdventure);
    if (onUseItem) {
      onUseItem(item, result.resultMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-amber-400 uppercase">
              Kampfinventar & Schnellzugriff
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direkt einsetzbare Kampfmittel und Tränke
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Zurück zum Kampf
          </button>
        </div>

        {/* Combat Status Bar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">LP: </span>
              <span className="font-bold text-emerald-400">{playerHp} / {playerMaxHp}</span>
            </div>
            <div>
              <span className="text-slate-400">MP: </span>
              <span className="font-bold text-sky-400">{playerMp} / {playerMaxMp}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Traglast: {capacity.currentWeightKg.toFixed(1)} / {capacity.maxWeightKg.toFixed(1)} kg
          </div>
        </div>

        {/* Notice for Combat Mode */}
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/40 text-[11px] text-amber-300">
          Hinweis: Zeitaufwendige Aktionen wie Zerlegen, Leichen durchsuchen und Rüstungswechsel sind im laufenden Gefecht deaktiviert.
        </div>

        {feedback && (
          <div className="mx-4 mt-3 p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {feedback}
          </div>
        )}

        {/* Item List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {combatItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/30 rounded-lg border border-slate-800">
              Keine unmittelbar im Kampf einsetzbaren Gegenstände im Inventar vorhanden.
            </div>
          ) : (
            combatItems.map(item => {
              const weight = InventoryLootService.getItemWeightKg(item);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>{item.name || 'Gegenstand'}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-amber-400 text-[11px]">x{item.quantity}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Gewicht: {weight.toFixed(1)} kg | {item.category || 'Verbrauchsgut'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUse(item)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    Benutzen
                  </button>
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
