import React from 'react';
import { EconomyHolding, WorldSetting, LoreEntry } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import { HOLDING_TYPES } from './EconomyPresets';

interface HoldingDetailsTabProps {
  holding: EconomyHolding;
  world: WorldSetting;
  loreDatabase: LoreEntry[];
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
  onLinkCodexEntry?: (holdingId: string, loreEntryId: string) => void;
}

export const HoldingDetailsTab: React.FC<HoldingDetailsTabProps> = ({
  holding,
  world,
  loreDatabase,
  onUpdateHolding,
  onLinkCodexEntry
}) => {
  const formatStringOrArray = (val: string | string[] | undefined): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    return val;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Basic Meta fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Betriebstyp</label>
          <select
            value={holding.type}
            onChange={e => onUpdateHolding(holding.id, { type: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-semibold cursor-pointer"
          >
            {HOLDING_TYPES.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Stufe / Ausbaustufe</label>
          <input
            type="number"
            min={1}
            max={5}
            value={holding.level || 1}
            onChange={e => onUpdateHolding(holding.id, { level: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono text-center font-bold outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Eigentümer / Besitzer</label>
          <select
            value={holding.ownerFactionId || holding.ownerCharacterId || (holding.ownerType === 'user' ? 'user' : '')}
            onChange={e => {
              const val = e.target.value;
              if (val === 'user') {
                onUpdateHolding(holding.id, { 
                  ownerType: 'user', 
                  ownerFactionId: undefined, 
                  ownerFactionName: undefined,
                  ownerCharacterId: undefined, 
                  assignedCharacterName: 'Spieler' 
                });
              } else if (val) {
                const faction = loreDatabase.find(l => l.id === val && l.category === 'Fraktionen');
                const char = loreDatabase.find(l => l.id === val && l.category === 'Charaktere');
                if (faction) {
                  onUpdateHolding(holding.id, { 
                    ownerType: 'faction', 
                    ownerFactionId: val, 
                    ownerFactionName: faction.title,
                    ownerCharacterId: undefined, 
                    assignedCharacterName: faction.title,
                    loreEntryId: faction.id
                  });
                } else if (char) {
                  // Check if character is member or leader of a Faction in loreDatabase
                  const linkedFaction = loreDatabase.find(f => f.category === 'Fraktionen' && (
                    f.details?.members?.some((m: any) => m.characterId === char.id || m.name?.trim().toLowerCase() === char.title?.trim().toLowerCase()) ||
                    f.details?.leader?.trim().toLowerCase() === char.title?.trim().toLowerCase()
                  ));

                  onUpdateHolding(holding.id, { 
                    ownerType: 'character', 
                    ownerCharacterId: val, 
                    assignedCharacterName: char.title,
                    assignedCharacterId: val,
                    ownerFactionId: linkedFaction ? linkedFaction.id : holding.ownerFactionId,
                    ownerFactionName: linkedFaction ? linkedFaction.title : holding.ownerFactionName
                  });
                }
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 outline-none focus:border-amber-500 font-semibold cursor-pointer"
          >
            <option value="user">Spieler (Eigener Besitz)</option>
            <optgroup label="Fraktionen">
              {loreDatabase.filter(l => l.category === 'Fraktionen').map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </optgroup>
            <optgroup label="Charaktere">
               {loreDatabase.filter(l => l.category === 'Charaktere').map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Kontrolle / Verwaltung durch</label>
          <select
            value={holding.controlledByFactionId || ''}
            onChange={e => {
              const val = e.target.value;
              const faction = loreDatabase.find(l => l.id === val);
              onUpdateHolding(holding.id, { 
                controlledByFactionId: val || undefined,
                controlledByFactionName: faction ? faction.title : undefined
              });
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-semibold cursor-pointer"
          >
            <option value="">(Keine spezielle Kontrolle)</option>
            {loreDatabase.filter(l => l.category === 'Fraktionen').map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* World Map & Location Linking */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-amber-400 block flex items-center gap-1.5">
          <i className="fa-solid fa-map-location-dot"></i> Standort & Weltkarten-Verknüpfung
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kartengebiet</label>
            <select
              value={holding.territoryId || ''}
              onChange={e => {
                const tId = e.target.value;
                const terr = (world.territories || []).find(t => t.id === tId);
                onUpdateHolding(holding.id, {
                  territoryId: tId || undefined,
                  locationName: terr ? terr.name : holding.locationName
                });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">(Kein Gebiet zugewiesen)</option>
              {(world.territories || []).map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Genauer Ort / Adresse</label>
            <input
              type="text"
              value={holding.locationName || ''}
              onChange={e => onUpdateHolding(holding.id, { locationName: e.target.value })}
              placeholder="z.B. Hafenviertel, Marktring 4"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Codex-Eintrag verknüpfen</label>
            <div className="flex gap-1.5">
              <select
                value={holding.loreEntryId || ''}
                onChange={e => onUpdateHolding(holding.id, { loreEntryId: e.target.value || undefined })}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">(Keine Codex-Verknüpfung)</option>
                {loreDatabase.filter(l => ['Orte', 'Fraktionen', 'Gebäude', 'Völker', 'Kultur'].includes(l.category)).map(l => (
                  <option key={l.id} value={l.id}>{l.title} ({l.category})</option>
                ))}
              </select>
              {holding.loreEntryId && (
                <div className="flex items-center justify-center px-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-500" title="Verknüpft">
                  <i className="fa-solid fa-link text-[10px]"></i>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Physische Gebäude-Eigenschaften */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <label className="text-xs font-bold text-indigo-400 block flex items-center gap-1.5">
          <i className="fa-solid fa-building"></i> Physischer Gebäudezustand & Dimensionen
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Größe</label>
            <select
              value={holding.physicalSize || 'Mittel'}
              onChange={e => onUpdateHolding(holding.id, { physicalSize: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Klein">Klein (Hütte, Stand, Boot)</option>
              <option value="Mittel">Mittel (Taverne, Anwesen)</option>
              <option value="Groß">Groß (Schloss, Mine, Werft)</option>
              <option value="Monumental">Monumental (Gilde, Imperium)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Zustand</label>
            <select
              value={holding.physicalCondition || 'Gut'}
              onChange={e => onUpdateHolding(holding.id, { physicalCondition: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Hervorragend">Hervorragend / Prunkvoll</option>
              <option value="Gut">Gut / Intakt</option>
              <option value="Reparaturbedürftig">Renovierungsbedürftig</option>
              <option value="Ruine">Ruine / Schwer beschädigt</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nutzung / Zweck</label>
            <input
              type="text"
              value={holding.physicalUsage || ''}
              onChange={e => onUpdateHolding(holding.id, { physicalUsage: e.target.value })}
              placeholder="z.B. Gastronomie & Quartier"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kapazität</label>
            <input
              type="text"
              value={holding.physicalCapacity || ''}
              onChange={e => onUpdateHolding(holding.id, { physicalCapacity: e.target.value })}
              placeholder="z.B. 60 Gäste, 10 Betten"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-900">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Räume / Bereiche</label>
            <input
              type="text"
              value={formatStringOrArray(holding.roomsOrAreas)}
              onChange={e => onUpdateHolding(holding.id, { roomsOrAreas: e.target.value })}
              placeholder="z.B. Schankraum, Weinkeller"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Schäden / Mängel</label>
            <input
              type="text"
              value={formatStringOrArray(holding.damages)}
              onChange={e => onUpdateHolding(holding.id, { damages: e.target.value })}
              placeholder="z.B. Undichtes Dach"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Zugänglichkeit</label>
            <input
              type="text"
              value={holding.accessibility || ''}
              onChange={e => onUpdateHolding(holding.id, { accessibility: e.target.value })}
              placeholder="z.B. Öffentlich, Geheim"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bewohner / Gäste</label>
            <input
              type="text"
              value={holding.residentsOrVisitors || ''}
              onChange={e => onUpdateHolding(holding.id, { residentsOrVisitors: e.target.value })}
              placeholder="z.B. Seeleute, Händler"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Beschreibung & Lore-Kontext</label>
        <AutoExpandingTextarea
          value={holding.description || ''}
          onChange={e => onUpdateHolding(holding.id, { description: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[80px]"
          placeholder="Beschreibe die Geschichte, den Zustand oder den Zweck dieses Betriebs..."
        />
      </div>

      {/* Module Toggles for this Holding */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
          <i className="fa-solid fa-sliders text-amber-500"></i> Aktive Management-Module für dieses Objekt
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { key: 'useResourcesModule', label: 'Lager & Rohstoffe' },
            { key: 'useStaffModule', label: 'Personal & Gruppen' },
            { key: 'useManagementModule', label: 'Aufgaben & Pflichten' },
            { key: 'useOrdersModule', label: 'Aufträge & Weisungen' },
            { key: 'useDecisionsModule', label: 'Entscheidungen' },
            { key: 'useLogsModule', label: 'Hintergrund-Log' }
          ].map(mod => {
            const isChecked = holding[mod.key as keyof EconomyHolding] !== false;
            return (
              <label
                key={mod.key}
                className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  isChecked ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={e => onUpdateHolding(holding.id, { [mod.key]: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span className="truncate">{mod.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
