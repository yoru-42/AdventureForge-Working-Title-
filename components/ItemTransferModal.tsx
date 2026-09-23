import React, { useState } from 'react';
import { Adventure, PendingItemTransferProposal } from '../types';
import { EquipmentConditionService } from '../services/equipmentConditionService';
import { InventoryLootService } from '../services/inventoryLootService';

interface ItemTransferModalProps {
  adventure: Adventure;
  proposal: PendingItemTransferProposal;
  onUpdateAdventure: (adventure: Adventure) => void;
  onClose: () => void;
}

export const ItemTransferModal: React.FC<ItemTransferModalProps> = ({
  adventure,
  proposal,
  onUpdateAdventure,
  onClose
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const capacity = InventoryLootService.getCarryCapacity(adventure, 'player');
  const targetInstance = (adventure.itemInstances || []).find(i => i.id === proposal.itemInstanceId);
  const itemWeight = targetInstance?.weightKg || InventoryLootService.inferWeightFromText(proposal.itemName, proposal.description);
  const totalWeight = itemWeight * (proposal.quantity || 1);
  const wouldOverburden = (capacity.currentWeightKg + totalWeight) > capacity.maxCapacityKg;

  const handleAccept = () => {
    setIsProcessing(true);
    const result = EquipmentConditionService.confirmItemTransfer(adventure, proposal);
    if (!result.success) {
      setFeedbackMessage(result.error || 'Die Übergabe konnte nicht durchgeführt werden.');
      setIsProcessing(false);
      return;
    }

    setFeedbackMessage(`Gegenstand "${proposal.itemName}" angenommen und im Inventar verstaut.`);
    onUpdateAdventure(result.updatedAdventure);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleReject = () => {
    setIsProcessing(true);
    const result = EquipmentConditionService.rejectItemTransfer(adventure);
    setFeedbackMessage('Übergabe abgelehnt.');
    onUpdateAdventure(result.updatedAdventure);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h3 className="font-bold text-white text-base">Gegenstandsübergabe</h3>
          </div>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 transition-colors"
            title="Schließen"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Transfer Participants Card */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Absender:</span>
              <span className="text-amber-400 font-bold">{proposal.fromOwnerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Empfänger:</span>
              <span className="text-slate-200 font-bold">{proposal.toOwnerName || 'Spieler'}</span>
            </div>
          </div>

          {/* Item Details Card */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Angebotener Gegenstand</span>
                <h4 className="text-base font-bold text-slate-100">{proposal.itemName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Menge</span>
                <span className="text-sm font-bold text-amber-400 font-mono">x{proposal.quantity || 1}</span>
              </div>
            </div>

            {proposal.description && (
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60 whitespace-pre-wrap">
                {proposal.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Gewicht:</span>
                <span className="text-slate-200 font-mono">{totalWeight.toFixed(2)} kg</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Zustand:</span>
                <span className="text-slate-200">{targetInstance?.condition || 'gut'}</span>
              </div>
            </div>
          </div>

          {/* Carry Capacity Indicator */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Traglast-Prüfung:</span>
              <span className={`font-mono font-bold ${wouldOverburden ? 'text-red-400' : 'text-slate-300'}`}>
                {(capacity.currentWeightKg + totalWeight).toFixed(1)} / {capacity.maxCapacityKg} kg
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${wouldOverburden ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{
                  width: `${Math.min(100, ((capacity.currentWeightKg + totalWeight) / capacity.maxCapacityKg) * 100)}%`
                }}
              />
            </div>
            {wouldOverburden && (
              <p className="text-[11px] text-red-400">
                Hinweis: Die Annahme dieses Gegenstands überschreitet deine reguläre maximale Traglast.
              </p>
            )}
          </div>

          {feedbackMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-center font-medium">
              {feedbackMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700/60"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-amber-900/30 flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-check text-xs"></i>
            Annehmen
          </button>
        </div>
      </div>
    </div>
  );
};
