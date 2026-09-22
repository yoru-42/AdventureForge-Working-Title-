import React, { useState } from 'react';
import { Adventure, LootSource } from '../types';
import { InventoryLootService } from '../services/inventoryLootService';

interface PostCombatPanelProps {
  adventure: Adventure;
  onUpdateAdventure: (adventure: Adventure) => void;
  onOpenLootSource: (lootSource: LootSource) => void;
  onOpenCollectionTasks: () => void;
  onContinue: () => void;
  defeatedOpponents?: { id: string; name: string; isMonster?: boolean }[];
}

export const PostCombatPanel: React.FC<PostCombatPanelProps> = ({
  adventure,
  onUpdateAdventure,
  onOpenLootSource,
  onOpenCollectionTasks,
  onContinue,
  defeatedOpponents = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'loot_sources'>('overview');

  const locationLootSources = (adventure.lootSources || []).filter(ls => !ls.isSearched || (ls.items && ls.items.length > 0));

  const handleExamineBattlefield = () => {
    // Generate a battlefield loot source if none exists yet
    if (locationLootSources.length === 0) {
      const enemyNames = defeatedOpponents.map(o => o.name).join(', ') || 'Besiegte Widersacher';
      const newLoot = InventoryLootService.registerLootSource(adventure, {
        type: 'battlefield',
        title: `Schlachtfeld: ${enemyNames}`,
        description: `Die Gefallenen und zurückgelassene Ausrüstung des Gefechts liegen auf dem Boden.`,
        items: defeatedOpponents.map((o, idx) => ({
          id: `inst-loot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          itemDefinitionId: `def-weap-drop-${idx}`,
          name: `Waffe von ${o.name}`,
          category: 'Waffen',
          condition: 'gebraucht / schartig',
          quality: 'Gewöhnlich',
          quantity: 1,
          weightKg: 2.5,
          currentState: 'am Boden'
        }))
      });
      onUpdateAdventure(newLoot.updatedAdventure);
      onOpenLootSource(newLoot.lootSource);
    } else {
      setActiveTab('loot_sources');
    }
  };

  const handleHarvestMonsterCorpse = (opponentName: string) => {
    const loot = InventoryLootService.registerLootSource(adventure, {
      type: 'monster_body',
      title: `Monsterkadaver: ${opponentName}`,
      description: `Der erlegte Körper von ${opponentName}. Enthält wertvolle Kristalle, Leder und Ressourcen.`,
      harvestOptions: {
        allowExamine: true,
        allowHarvestCrystals: true,
        allowButcher: true,
        allowTakeBody: true,
        crystalYield: [{ name: `Monsterkristall (${opponentName})`, quantity: 1, weightKg: 0.2, category: 'Rohstoffe' }],
        butcherYield: [
          { name: `Bestienleder (${opponentName})`, quantity: 2, weightKg: 1.5, category: 'Rohstoffe' },
          { name: `Monsterfleisch (${opponentName})`, quantity: 3, weightKg: 2.0, category: 'Nahrung' }
        ]
      },
      items: []
    });
    onUpdateAdventure(loot.updatedAdventure);
    onOpenLootSource(loot.lootSource);
  };

  const handleCreateSalvageTask = () => {
    const taskRes = InventoryLootService.createCollectionTask(adventure, {
      title: `Bergung nach Gefecht: Ausrüstung & Wertgegenstände`,
      targetQuantity: 10,
      unit: 'Stück',
      itemKeywords: ['Waffe', 'Rüstung', 'Leder', 'Kristall', 'Gold'],
      assignedToCharacterId: 'player'
    });
    onUpdateAdventure(taskRes.updatedAdventure);
    onOpenCollectionTasks();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl space-y-4 text-slate-100 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Nachkampfphase & Sicherung des Ortes
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Das Gefecht ist beendet. Wählen Sie Ihre Handlungen vor dem Aufbruch:
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          Weitergehen
        </button>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={handleExamineBattlefield}
          className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors"
        >
          <div className="text-xs font-bold text-slate-200">
            Schlachtfeld untersuchen
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-snug">
            Ort absuchen, Gefallene und zurückgelassene Ausrüstung durchsuchen
          </div>
        </button>

        {defeatedOpponents.length > 0 && (
          <button
            type="button"
            onClick={() => handleHarvestMonsterCorpse(defeatedOpponents[0].name)}
            className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors"
          >
            <div className="text-xs font-bold text-emerald-300">
              Monsterkörper verwerten
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              Kristalle bergen, Bestien zerlegen oder Kadaver sichern
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={handleCreateSalvageTask}
          className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors"
        >
          <div className="text-xs font-bold text-sky-300">
            Sammelauftrag erteilen
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-snug">
            Systematische Bergung anordnen oder an Begleiter übertragen
          </div>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="p-3 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/50 hover:border-amber-800 rounded-lg text-left transition-colors"
        >
          <div className="text-xs font-bold text-amber-300">
            Schauplatz verlassen
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-snug">
            Ohne weitere Bergung zur Reise oder nächsten Handlung zurückkehren
          </div>
        </button>
      </div>

      {/* Available Loot Sources List */}
      {locationLootSources.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60 space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Vorhandene Beute- und Fundstellen am Ort:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {locationLootSources.map(ls => (
              <div
                key={ls.id}
                onClick={() => onOpenLootSource(ls)}
                className="p-2.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{ls.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {ls.items?.length || 0} Gegenstände | Typ: {ls.type}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                >
                  Durchsuchen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
