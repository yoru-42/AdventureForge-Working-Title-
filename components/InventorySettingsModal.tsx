import React, { useState } from 'react';
import { Adventure, InventorySettings } from '../types';
import { InventoryLootService } from '../services/inventoryLootService';

interface InventorySettingsModalProps {
  adventure: Adventure;
  onUpdateAdventure: (adventure: Adventure) => void;
  onClose: () => void;
}

export const InventorySettingsModal: React.FC<InventorySettingsModalProps> = ({
  adventure,
  onUpdateAdventure,
  onClose
}) => {
  const currentSettings: InventorySettings = adventure.inventorySettings || {
    pickupConfirmationMode: 'always_confirm',
    maxCarryCapacityKg: 25.0
  };

  const [mode, setMode] = useState<'always_confirm' | 'auto_small' | 'auto_all'>(
    currentSettings.pickupConfirmationMode || 'always_confirm'
  );
  const [maxWeight, setMaxWeight] = useState<number>(
    currentSettings.maxCarryCapacityKg || 25.0
  );

  const capacity = InventoryLootService.getCarryCapacity(adventure, 'player');

  const handleSave = () => {
    const updatedSettings: InventorySettings = {
      pickupConfirmationMode: mode,
      maxCarryCapacityKg: Math.max(5, maxWeight)
    };

    onUpdateAdventure({
      ...adventure,
      inventorySettings: updatedSettings
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-amber-400 uppercase">
              Inventar- & Aufnahmeeinstellungen
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Regeln für Gegenstandsaufnahme, Traglast und Bestätigungen
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Schließen
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Section: Mode */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Aufnahme-Bestätigung bei Fundstücken:
            </label>

            <div className="space-y-2">
              <label
                onClick={() => setMode('always_confirm')}
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                  mode === 'always_confirm'
                    ? 'bg-slate-800 border-sky-500'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="pickupMode"
                  checked={mode === 'always_confirm'}
                  onChange={() => setMode('always_confirm')}
                  className="mt-0.5 text-sky-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Immer manuell bestätigen (Standard)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Jedes gefundene Objekt öffnet ein Bestätigungs-Popup. Volle Kontrolle über das Inventar und die Traglast.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setMode('auto_small')}
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                  mode === 'auto_small'
                    ? 'bg-slate-800 border-sky-500'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="pickupMode"
                  checked={mode === 'auto_small'}
                  onChange={() => setMode('auto_small')}
                  className="mt-0.5 text-sky-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Kleine & unwichtige Gegenstände automatisch aufnehmen
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Leichte Objekte (&lt; 1.5 kg wie Kräuter, Münzen, Tränke) werden sofort aufgenommen, sofern Traglast vorhanden ist.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setMode('auto_all')}
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                  mode === 'auto_all'
                    ? 'bg-slate-800 border-sky-500'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="pickupMode"
                  checked={mode === 'auto_all'}
                  onChange={() => setMode('auto_all')}
                  className="mt-0.5 text-sky-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Automatische Aufnahme (mit Sicherheitsschutz)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Nimmt gewöhnliche Gegenstände bis 5.0 kg automatisch auf. Monsterkadaver, schwere Lasten und fremder Besitz bleiben weiterhin geschützt.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section: Carrying Capacity Limit */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Traglast-Grenze (kg):
              </label>
              <span className="text-xs text-slate-300 font-medium">
                Aktuell belegt: {capacity.currentWeightKg.toFixed(1)} kg
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="10"
                max="200"
                step="1"
                value={maxWeight}
                onChange={e => setMaxWeight(parseFloat(e.target.value) || 25.0)}
                className="w-32 px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <span className="text-xs text-slate-400">
                (Standard: 25.0 kg Grundtraglast)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
