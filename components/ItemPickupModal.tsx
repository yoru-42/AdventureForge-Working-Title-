import React, { useState } from 'react';
import {
  Adventure,
  ItemInstance,
  LootSource,
  PendingPickupProposal
} from '../types';
import { InventoryLootService } from '../services/inventoryLootService';

interface ItemPickupModalProps {
  adventure: Adventure;
  onUpdateAdventure: (adventure: Adventure) => void;
  onClose: () => void;
  proposal?: PendingPickupProposal | null;
  lootSource?: LootSource | null;
}

export const ItemPickupModal: React.FC<ItemPickupModalProps> = ({
  adventure,
  onUpdateAdventure,
  onClose,
  proposal,
  lootSource
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    if (proposal) return proposal.items.map(i => i.id);
    if (lootSource) return (lootSource.items || []).map(i => i.id);
    return [];
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const capacity = InventoryLootService.getCarryCapacity(adventure, 'player');

  const itemsList: ItemInstance[] = proposal
    ? proposal.items
    : lootSource
    ? (lootSource.items || [])
    : [];

  const title = proposal
    ? `Gegenstand gefunden: ${proposal.sourceTitle}`
    : lootSource
    ? `Fundstelle: ${lootSource.title}`
    : 'Gegenstände aufnehmen';

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleTakeAll = () => {
    const itemsToTake = itemsList.map(item => ({
      itemInstanceId: item.id,
      item,
      quantity: item.quantity || 1
    }));

    const result = InventoryLootService.pickupItems(adventure, 'player', itemsToTake, {
      sourceId: lootSource?.id,
      allowPartial: true
    });

    if (result.rejectedItems.length > 0) {
      setFeedbackMessage(
        `${result.acceptedItems.length} Gegenstände aufgenommen. ${result.rejectedItems.length} Gegenstände konnten wegen voller Traglast nicht mitgenommen werden.`
      );
    } else {
      setFeedbackMessage(`${result.acceptedItems.length} Gegenstände in das Inventar übernommen.`);
    }

    onUpdateAdventure(result.updatedAdventure);
    if (result.rejectedItems.length === 0) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleTakeSelected = () => {
    const selectedItems = itemsList.filter(i => selectedItemIds.includes(i.id));
    if (selectedItems.length === 0) {
      setFeedbackMessage('Keine Gegenstände ausgewählt.');
      return;
    }

    const itemsToTake = selectedItems.map(item => ({
      itemInstanceId: item.id,
      item,
      quantity: item.quantity || 1
    }));

    const result = InventoryLootService.pickupItems(adventure, 'player', itemsToTake, {
      sourceId: lootSource?.id,
      allowPartial: true
    });

    if (result.rejectedItems.length > 0) {
      setFeedbackMessage(
        `${result.acceptedItems.length} Gegenstände aufgenommen. ${result.rejectedItems.length} Gegenstände überschreiten die Traglast.`
      );
    } else {
      setFeedbackMessage(`${result.acceptedItems.length} Gegenstände aufgenommen.`);
    }

    onUpdateAdventure(result.updatedAdventure);
    if (result.rejectedItems.length === 0) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleHarvestAction = (action: 'examine' | 'crystals' | 'butcher' | 'take_body') => {
    if (!lootSource) return;

    const result = InventoryLootService.harvestMonster(adventure, lootSource.id, action, 'player');
    setFeedbackMessage(result.resultMessage);
    onUpdateAdventure(result.updatedAdventure);
  };

  const isMonsterOrCorpse = lootSource?.type === 'monster_body' || lootSource?.type === 'animal_body' || lootSource?.type === 'corpse';
  const harvestOptions = lootSource?.harvestOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-wide text-amber-400">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Entscheidung zur Gegenstandsaufnahme und Verwahrung
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Schließen
          </button>
        </div>

        {/* Carry Capacity Bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Aktuelle Traglast des Charakters:</span>
              <span className={capacity.isOverencumbered ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {capacity.currentWeightKg.toFixed(1)} / {capacity.maxWeightKg.toFixed(1)} kg
                {capacity.isOverencumbered && ' (Überlastet)'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  capacity.isOverencumbered
                    ? 'bg-rose-500'
                    : capacity.currentWeightKg / capacity.maxWeightKg > 0.85
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
                style={{
                  width: `${Math.min(100, (capacity.currentWeightKg / capacity.maxWeightKg) * 100)}%`
                }}
              />
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
            Frei: <span className="text-emerald-400 font-semibold">{capacity.remainingCapacityKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            {feedbackMessage}
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {lootSource?.description && (
            <div className="text-xs text-slate-300 bg-slate-950/30 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {lootSource.description}
            </div>
          )}

          {/* Monster / Animal Specific Harvesting Actions */}
          {isMonsterOrCorpse && (
            <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/60 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Verwertungs- und Ernteoptionen:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleHarvestAction('examine')}
                  className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 text-left"
                >
                  Untersuchen
                  <span className="block text-[10px] text-slate-400 font-normal">Kadaver auf Schwachstellen und Besonderheiten prüfen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHarvestAction('crystals')}
                  disabled={harvestOptions?.isCrystalsHarvested}
                  className={`px-3 py-2 rounded border text-xs font-medium text-left ${
                    harvestOptions?.isCrystalsHarvested
                      ? 'bg-slate-800/30 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-900/30 hover:bg-indigo-900/50 border-indigo-700 text-indigo-200'
                  }`}
                >
                  Kristalle sammeln
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {harvestOptions?.isCrystalsHarvested ? 'Bereits geborgen' : 'Monsterkristalle / magische Kerne bergen (~0.2 kg)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHarvestAction('butcher')}
                  disabled={harvestOptions?.isBodyHarvested}
                  className={`px-3 py-2 rounded border text-xs font-medium text-left ${
                    harvestOptions?.isBodyHarvested
                      ? 'bg-slate-800/30 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-700 text-emerald-200'
                  }`}
                >
                  Zerlegen
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {harvestOptions?.isBodyHarvested ? 'Bereits zerlegt' : 'Häuten & Fleisch/Leder/Zähne gewinnen'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHarvestAction('take_body')}
                  disabled={harvestOptions?.isBodyHarvested}
                  className={`px-3 py-2 rounded border text-xs font-medium text-left ${
                    harvestOptions?.isBodyHarvested
                      ? 'bg-slate-800/30 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-900/30 hover:bg-amber-900/50 border-amber-700 text-amber-200'
                  }`}
                >
                  Monsterkörper mitnehmen
                  <span className="block text-[10px] text-slate-400 font-normal">
                    Gesamten Kadaver mitnehmen (Hohes Gewicht)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex justify-between">
              <span>Gefundene Gegenstände ({itemsList.length}):</span>
              <span className="text-slate-400 text-[11px] font-normal">Wählen Sie aufzunehmende Objekte aus</span>
            </div>

            {itemsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/20 rounded-lg border border-slate-800">
                Keine weiteren losen Gegenstände vorhanden.
              </div>
            ) : (
              <div className="space-y-2">
                {itemsList.map(item => {
                  const itemWeight = InventoryLootService.getItemWeightKg(item);
                  const isSelected = selectedItemIds.includes(item.id);
                  const fitsCapacity = capacity.remainingCapacityKg >= itemWeight;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-800 border-sky-500/60'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container onClick
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-600 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            <span>{item.name || 'Gegenstand'}</span>
                            {item.quantity && item.quantity > 1 && (
                              <span className="text-[11px] font-semibold text-amber-400">
                                x{item.quantity}
                              </span>
                            )}
                            {item.quality && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                                {item.quality}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Kategorie: {item.category || 'Gegenstand'} | Zustand: {item.condition || 'gut'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-medium text-slate-300">
                          {itemWeight.toFixed(1)} kg
                        </div>
                        {!fitsCapacity && (
                          <div className="text-[10px] text-rose-400 font-medium">
                            Zu schwer
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Liegen lassen / Schließen
          </button>

          <div className="flex items-center gap-2">
            {itemsList.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleTakeSelected}
                  disabled={selectedItemIds.length === 0}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  Ausgewählte aufnehmen
                </button>
                <button
                  type="button"
                  onClick={handleTakeAll}
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-md"
                >
                  Alles aufnehmen
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
