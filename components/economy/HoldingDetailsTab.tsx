import React, { useState } from 'react';
import { EconomyHolding, WorldSetting, LoreEntry, HoldingRoom } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import { HOLDING_TYPES, getDefaultRoomsForHolding, getDefaultJobPositionsForHoldingType } from './EconomyPresets';
import { 
  Building2, 
  DoorOpen, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Users, 
  Check, 
  Shield, 
  Activity, 
  Info,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';

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
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const formatStringOrArray = (val: string | string[] | undefined): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    return val;
  };

  const typePreset = HOLDING_TYPES.find(t => t.type === holding.type);
  const currentSize = holding.physicalSize || 'Mittel';

  // Obtain active rooms or fallback to presets for this holding type and size
  const rooms: HoldingRoom[] = (holding.buildingRooms && holding.buildingRooms.length > 0)
    ? holding.buildingRooms
    : getDefaultRoomsForHolding(holding.type, currentSize);

  const totalRoomCount = rooms.reduce((sum, r) => sum + (Math.max(1, Number(r.count) || 1)), 0);
  const suggestedJobs = getDefaultJobPositionsForHoldingType(holding.type, currentSize);

  const updateRooms = (newRooms: HoldingRoom[]) => {
    const summaryStr = newRooms.map(r => `${r.count || 1}x ${r.name}`).join(', ');
    onUpdateHolding(holding.id, {
      buildingRooms: newRooms,
      roomsOrAreas: summaryStr
    });
  };

  const handleRoomCountChange = (idx: number, delta: number) => {
    const updated = [...rooms];
    const newCount = Math.max(1, (updated[idx].count || 1) + delta);
    updated[idx] = { ...updated[idx], count: newCount };
    updateRooms(updated);
  };

  const handleRoomFieldChange = (idx: number, field: keyof HoldingRoom, val: any) => {
    const updated = [...rooms];
    updated[idx] = { ...updated[idx], [field]: val };
    updateRooms(updated);
  };

  const handleAddRoom = () => {
    const newRoom: HoldingRoom = {
      id: `room-${Date.now()}`,
      name: 'Neuer Raum',
      count: 1,
      purpose: 'Nutzung & Betriebszweck'
    };
    updateRooms([...rooms, newRoom]);
  };

  const handleRemoveRoom = (idx: number) => {
    const updated = rooms.filter((_, i) => i !== idx);
    updateRooms(updated);
  };

  const handleResetRoomsToDefault = (sizeToUse: string = currentSize) => {
    const defaultRooms = getDefaultRoomsForHolding(holding.type, sizeToUse);
    updateRooms(defaultRooms);
    setSyncNotice(`Räume wurden auf die Standard-Vorgabe für ${holding.type} (${sizeToUse}) zurückgesetzt.`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleApplyJobsForSize = () => {
    const newJobs = getDefaultJobPositionsForHoldingType(holding.type, currentSize);
    const newRoles = newJobs.map((j, idx) => ({
      id: `role-size-${Date.now()}-${idx}`,
      name: j.name,
      assignedToName: '',
      authorities: j.authorities || ['Tagesgeschäft leiten'],
      responsibilities: j.responsibilities || [],
      salary: j.salary || 15,
      workplaceArea: j.workplaceArea || 'Betrieb'
    }));

    onUpdateHolding(holding.id, {
      roles: newRoles,
      staffCount: newRoles.length
    });
    setSyncNotice(`${newRoles.length} Stellen & Berufe wurden passend zur Größe '${currentSize}' eingerichtet.`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleSizeChange = (newSize: string) => {
    const newRooms = getDefaultRoomsForHolding(holding.type, newSize);
    const summaryStr = newRooms.map(r => `${r.count || 1}x ${r.name}`).join(', ');
    
    // Auto-adapt capacity estimate based on size
    let autoCapacity = holding.physicalCapacity;
    if (newSize === 'Klein') autoCapacity = 'ca. 15-20 Personen / Gäste';
    else if (newSize === 'Mittel') autoCapacity = 'ca. 40-50 Personen / Gäste';
    else if (newSize === 'Groß') autoCapacity = 'ca. 80-120 Personen / Gäste';
    else if (newSize === 'Monumental') autoCapacity = 'ca. 200+ Personen / Gäste';

    onUpdateHolding(holding.id, {
      physicalSize: newSize,
      buildingRooms: newRooms,
      roomsOrAreas: summaryStr,
      physicalCapacity: autoCapacity
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info Bar: Typ & Kategorie bereits festgelegt (keine doppelten Auswahllisten) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
            {typePreset?.label || holding.type}
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            {holding.category ? (holding.category.charAt(0).toUpperCase() + holding.category.slice(1).replace('_', ' ')) : 'Betrieb'}
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 text-xs font-semibold">
            Größe: {currentSize}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Typ & Kategorie wurden bei der Erstellung fest gewählt
        </div>
      </div>

      {/* Basic Meta fields: Ausbaustufe, Status, Eigentümer, Verwaltung */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
          <label className="text-xs font-bold text-slate-300 block mb-1">Betriebsstatus</label>
          <select
            value={holding.status || 'active'}
            onChange={e => onUpdateHolding(holding.id, { status: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-semibold cursor-pointer"
          >
            <option value="active">Aktiv / In Betrieb</option>
            <option value="paused">Pausiert / Ruhend</option>
            <option value="damaged">Beschädigt / Reparaturbedarf</option>
            <option value="abandoned">Verlassen / Stillgelegt</option>
          </select>
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
              } else if (!val) {
                onUpdateHolding(holding.id, { 
                  ownerType: 'character', 
                  ownerFactionId: undefined, 
                  ownerFactionName: undefined,
                  ownerCharacterId: undefined, 
                  assignedCharacterId: undefined,
                  assignedCharacterName: '',
                  loreEntryId: undefined
                });
              } else {
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
            <option value="">No-Name-Charakter (Unbekannt / NPC)</option>
            <option value="user">Spieler (Eigener Besitz)</option>
            <optgroup label="Fraktionen">
              {loreDatabase.filter(l => l.category === 'Fraktionen').map((f, fIdx) => (
                <option key={`frac-owner-${f.id || 'f'}-${fIdx}`} value={f.id}>{f.title}</option>
              ))}
            </optgroup>
            <optgroup label="Charaktere">
               {loreDatabase.filter(l => l.category === 'Charaktere').map((c, cIdx) => (
                <option key={`char-owner-${c.id || 'c'}-${cIdx}`} value={c.id}>{c.title}</option>
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
            {loreDatabase.filter(l => l.category === 'Fraktionen').map((f, fIdx) => (
              <option key={`frac-ctrl-${f.id || 'f'}-${fIdx}`} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* World Map & Location Linking */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-amber-400 block flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Standort & Weltkarten-Verknüpfung
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ort / Siedlung (Territorium)</label>
            <select
              value={holding.locationId || holding.territoryId || ''}
              onChange={e => {
                const tId = e.target.value;
                const terr = (world.territories || []).find(t => t.id === tId);
                onUpdateHolding(holding.id, {
                  locationId: tId || undefined,
                  territoryId: tId || undefined,
                  locationName: terr ? terr.name : holding.locationName
                });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">(Kein Gebiet zugewiesen)</option>
              {(Array.isArray(world?.territories) ? world.territories : []).map((t, tIdx) => (
                <option key={`terr-opt-${t.id || 't'}-${tIdx}`} value={t.id}>{t.name} ({t.type})</option>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gebäude / Anwesen (Übergeordnet)</label>
            <input
              type="text"
              value={holding.buildingName || ''}
              onChange={e => onUpdateHolding(holding.id, { buildingName: e.target.value })}
              placeholder="z.B. Burg Falkenstein, Gutshof"
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
                {loreDatabase.filter(l => ['Orte', 'Fraktionen', 'Gebäude', 'Völker', 'Kultur'].includes(l.category)).map((l, lIdx) => (
                  <option key={`lore-link-${l.id || 'l'}-${lIdx}`} value={l.id}>{l.title} ({l.category})</option>
                ))}
              </select>
              {holding.loreEntryId && (
                <div className="flex items-center justify-center px-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-500" title="Verknüpft">
                  <LinkIcon className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Physischer Gebäudezustand & Dimensionen (Dynamisch & strukturiert) */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <label className="text-sm font-bold text-indigo-400 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Physischer Gebäudezustand & Dimensionen
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleResetRoomsToDefault(currentSize)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Setzt die Räume auf die Standardvorgabe für diesen Betriebstyp und die gewählte Größe zurück"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Standardräume für {currentSize} laden
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* 4 Hauptdimensionen: Größe, Zustand, Nutzung, Kapazität */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Gebäudegröße
            </label>
            <select
              value={currentSize}
              onChange={e => handleSizeChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Klein">Klein (Kompakt, 2-3 Räume, 2-3 Stellen)</option>
              <option value="Mittel">Mittel (Standard, 5-6 Räume, 5-6 Stellen)</option>
              <option value="Groß">Groß (Erweitert, 7-8 Räume, 9-12 Stellen)</option>
              <option value="Monumental">Monumental (Großanlage, 8-10 Räume, 14-18 Stellen)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Bauzustand
            </label>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Nutzung / Zweck
            </label>
            <input
              type="text"
              value={holding.physicalUsage || ''}
              onChange={e => onUpdateHolding(holding.id, { physicalUsage: e.target.value })}
              placeholder="z.B. Gastronomie & Beherbergung"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Kapazität & Besucher
            </label>
            <input
              type="text"
              value={holding.physicalCapacity || ''}
              onChange={e => onUpdateHolding(holding.id, { physicalCapacity: e.target.value })}
              placeholder="z.B. 40 Gäste, 5 Gästezimmer, 3 Personalzimmer"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Verknüpfung: Benötigte Stellen & Berufe anpassen */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Passend zur Größe <strong className="text-amber-300">{currentSize}</strong> werden{' '}
              <strong className="text-white">{suggestedJobs.length} Berufe</strong> für diesen Betrieb empfohlen.
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplyJobsForSize}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Personalstellen auf '{currentSize}' ({suggestedJobs.length} Stellen) anpassen
          </button>
        </div>

        {/* Vorgegebene Raumaufteilung & Zimmer */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
                Vorgegebene Raumaufteilung & Zimmer
              </label>
              <span className="text-[11px] text-slate-400">
                Klare Vorgabe der Räume nach Betriebstyp ({totalRoomCount} Räume insgesamt)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddRoom}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Raum hinzufügen
            </button>
          </div>

          <div className="space-y-2">
            {rooms.map((room, idx) => (
              <div 
                key={room.id || `room-${idx}`} 
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 items-center"
              >
                {/* Anzahl Steuerung */}
                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Anzahl:</span>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(idx, -1)}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors"
                      title="Anzahl verringern"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={room.count || 1}
                      onChange={e => handleRoomFieldChange(idx, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 bg-transparent text-center text-xs font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(idx, 1)}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors"
                      title="Anzahl erhöhen"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Raumname */}
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={room.name}
                    onChange={e => handleRoomFieldChange(idx, 'name', e.target.value)}
                    placeholder="z.B. Küche, Schlafzimmer für Gäste"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-semibold text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Raumzweck / Funktion */}
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={room.purpose || ''}
                    onChange={e => handleRoomFieldChange(idx, 'purpose', e.target.value)}
                    placeholder="Zweck, z.B. Gästeunterkunft, Speisenzubereitung"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Löschen */}
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Diesen Raum entfernen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ergänzende Gebäude-Eigenschaften */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-900">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Schäden / Mängel
            </label>
            <input
              type="text"
              value={formatStringOrArray(holding.damages)}
              onChange={e => onUpdateHolding(holding.id, { damages: e.target.value })}
              placeholder="z.B. Undichtes Dach, Rußschaden"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Zugänglichkeit
            </label>
            <input
              type="text"
              value={holding.accessibility || ''}
              onChange={e => onUpdateHolding(holding.id, { accessibility: e.target.value })}
              placeholder="z.B. Öffentlich, Geheim, Nur Gildenmitglieder"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Bewohner / Gäste
            </label>
            <input
              type="text"
              value={holding.residentsOrVisitors || ''}
              onChange={e => onUpdateHolding(holding.id, { residentsOrVisitors: e.target.value })}
              placeholder="z.B. Reisende, Seeleute, Stammgäste"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Description & Lore-Kontext */}
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
          <Activity className="w-4 h-4 text-amber-500" /> Aktive Management-Module für dieses Objekt
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { key: 'useResourcesModule', label: 'Lager & Rohstoffe' },
            { key: 'useStaffModule', label: 'Personal & Gruppen' },
            { key: 'useManagementModule', label: 'Aufgaben & Pflichten' },
            { key: 'useOrdersModule', label: 'Aufträge & Weisungen' },
            { key: 'useDecisionsModule', label: 'Entscheidungen' },
            { key: 'useLogsModule', label: 'Hintergrund-Log' }
          ].map((mod, mIdx) => {
            const isChecked = holding[mod.key as keyof EconomyHolding] !== false;
            return (
              <label
                key={`mod-opt-${mod.key}-${mIdx}`}
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
