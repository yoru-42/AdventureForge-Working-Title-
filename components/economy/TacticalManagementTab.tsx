import React, { useState } from 'react';
import { 
  WorldSetting, 
  LoreEntry, 
  EconomyHolding, 
  TacticalEntity, 
  TacticalGroup,
  CombatState
} from '../../types';
import * as LucideIcons from 'lucide-react';

interface TacticalManagementTabProps {
  world: WorldSetting;
  loreDatabase: LoreEntry[];
  holdings: EconomyHolding[];
  combatState?: CombatState;
  onUpdateCombatState: (updates: Partial<CombatState>) => void;
}

export const TacticalManagementTab: React.FC<TacticalManagementTabProps> = ({
  world,
  loreDatabase,
  holdings,
  combatState,
  onUpdateCombatState
}) => {
  const factions = loreDatabase.filter(l => l.category === 'Fraktionen');
  const [selectedFactionId, setSelectedFactionId] = useState<string>(factions[0]?.id || '');
  
  const selectedFaction = factions.find(f => f.id === selectedFactionId);
  const selectedFactionTitle = (selectedFaction?.title || '').trim().toLowerCase();

  const factionHoldings = holdings.filter(h => {
    if (h.ownerFactionId === selectedFactionId || h.controlledByFactionId === selectedFactionId || h.loreEntryId === selectedFactionId) return true;
    if (selectedFactionTitle) {
      const ownerFName = (h.ownerFactionName || '').trim().toLowerCase();
      const ctrlFName = (h.controlledByFactionName || '').trim().toLowerCase();
      const hName = (h.name || '').trim().toLowerCase();
      if (ownerFName === selectedFactionTitle || ctrlFName === selectedFactionTitle) return true;
      if (hName && (hName === selectedFactionTitle || hName.includes(selectedFactionTitle) || selectedFactionTitle.includes(hName))) return true;
    }
    return false;
  });

  const entities = combatState?.tacticalEntities || {};
  const groups = combatState?.tacticalGroups || {};

  const factionEntities = Object.values(entities).filter(e => e.factionId === selectedFactionId);
  const factionGroups = Object.values(groups).filter(g => g.factionId === selectedFactionId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <LucideIcons.Shield className="w-5 h-5 text-emerald-500" /> Taktisches Militär-Management
          </h3>
          <p className="text-xs text-slate-400 mt-1">Verwalte die Streitkräfte und Stützpunkte deiner Fraktionen.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Fraktion:</span>
          <select 
            value={selectedFactionId}
            onChange={e => setSelectedFactionId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold outline-none focus:border-amber-500 cursor-pointer"
          >
            {factions.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LucideIcons.Building2 className="w-3 h-3" /> Militärische Stützpunkte ({factionHoldings.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {factionHoldings.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-800 rounded-2xl text-[10px] text-slate-500 italic">
                  Keine Gebäude mit dieser Fraktion verknüpft.
                </div>
              ) : (
                factionHoldings.map(h => (
                  <div key={h.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg">
                        {(LucideIcons as any)[h.icon] ? React.createElement((LucideIcons as any)[h.icon], { className: "w-4 h-4 text-amber-500" }) : <LucideIcons.Flag className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{h.name}</div>
                        <div className="text-[9px] text-slate-500">{h.locationName || 'Unbekannter Ort'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-emerald-500">Stufe {h.level}</div>
                      <div className="text-[9px] text-slate-500">Garnison: {h.staffCount || 0}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LucideIcons.Swords className="w-3 h-3" /> Truppen-Statistik
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Einheiten</div>
                <div className="text-xl font-bold text-slate-100">{factionEntities.length}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Verbände</div>
                <div className="text-xl font-bold text-slate-100">{factionGroups.length}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Gesamt-Stärke</div>
                <div className="text-xl font-bold text-emerald-500">{factionHoldings.reduce((acc, h) => acc + (h.staffCount || 0), 0)}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Moral</div>
                <div className="text-xl font-bold text-amber-500">Gut</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-950/20 border border-emerald-900/40 rounded-3xl flex items-center justify-center mb-2">
              <LucideIcons.Map className="w-10 h-10 text-emerald-500/50" />
            </div>
            <h4 className="text-lg font-bold text-slate-200">Taktische Lagekarte (Phase 2)</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              In Phase 2 wird hier eine Übersichtskarte aller Fraktionseinheiten und deren Bewegungen auf dem taktischen Gitter angezeigt.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button disabled className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold border border-slate-700 cursor-not-allowed flex items-center gap-2">
                <LucideIcons.Plus className="w-3.5 h-3.5" /> Einheit rekrutieren
              </button>
              <button disabled className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold border border-slate-700 cursor-not-allowed flex items-center gap-2">
                <LucideIcons.Shield className="w-3.5 h-3.5" /> Verband bilden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
