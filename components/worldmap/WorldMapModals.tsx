import React from 'react';
import { Territory } from '../../types';
import { Swords, Plus, X, Search, Check, FolderTree, ChevronRight, Waves, Globe, MapPin, Building, Castle, LandPlot } from 'lucide-react';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

// =========================================================================
// 1. TERRITORY SHIFT / CONQUEST MODAL
// =========================================================================
interface ShiftModalProps {
  show: boolean;
  onClose: () => void;
  targetTerritory: Territory | null;
  shiftNewFaction: string;
  setShiftNewFaction: (v: string) => void;
  shiftConflictDescription: string;
  setShiftConflictDescription: (v: string) => void;
  shiftIsWarZone: boolean;
  setShiftIsWarZone: (v: boolean) => void;
  shiftControlPercentage: number;
  setShiftControlPercentage: (v: number) => void;
  onConfirm: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  show,
  onClose,
  targetTerritory,
  shiftNewFaction,
  setShiftNewFaction,
  shiftConflictDescription,
  setShiftConflictDescription,
  shiftIsWarZone,
  setShiftIsWarZone,
  shiftControlPercentage,
  setShiftControlPercentage,
  onConfirm
}) => {
  if (!show || !targetTerritory) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm">
              Machtwechsel / Eroberung: {targetTerritory.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Neue herrschende Fraktion:
            </label>
            <input
              type="text"
              value={shiftNewFaction}
              onChange={(e) => setShiftNewFaction(e.target.value)}
              placeholder="z.B. Strohhut-Piraten, Marine, Kaiser-Allianz"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Kontrollgrad / Dominanz ({shiftControlPercentage}%):
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={shiftControlPercentage}
              onChange={(e) => setShiftControlPercentage(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Ereignis / Konfliktbeschreibung:
            </label>
            <AutoExpandingTextarea
              value={shiftConflictDescription}
              onChange={(e) => setShiftConflictDescription(e.target.value)}
              placeholder="Beschreibe kurz die Schlacht, Belagerung oder den diplomatischen Putsch..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 min-h-[60px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shiftWarZoneCheck"
              checked={shiftIsWarZone}
              onChange={(e) => setShiftIsWarZone(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="shiftWarZoneCheck" className="text-slate-300 font-bold cursor-pointer">
              Als aktives Kriegsgebiet markieren (Schraffur & Warn-Puls)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg"
          >
            Machtwechsel besiegeln & eintragen
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. ADD CUSTOM TERRITORY MODAL
// =========================================================================
interface AddTerritoryModalProps {
  show: boolean;
  onClose: () => void;
  form: {
    name: string;
    type: Territory['type'];
    faction: string;
    description: string;
    x: number;
    y: number;
    radius: number;
    parentId: string | null;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    name: string;
    type: Territory['type'];
    faction: string;
    description: string;
    x: number;
    y: number;
    radius: number;
    parentId: string | null;
  }>>;
  parentCandidates: Territory[];
  onConfirm: () => void;
}

export const AddTerritoryModal: React.FC<AddTerritoryModalProps> = ({
  show,
  onClose,
  form,
  setForm,
  parentCandidates,
  onConfirm
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-100 text-sm">Neues Gebiet auf der Weltkarte erfassen</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Name des Ortes / Gebiets:</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Whiskeys Peak, Marineford, Loguetown"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Gebietstyp:</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="insel">Insel / Archipel</option>
                <option value="stadt">Stadt / Metropole</option>
                <option value="hafen">Hafen / Hafenstadt</option>
                <option value="festung">Festung / Bastion</option>
                <option value="dorf">Dorf / Siedlung</option>
                <option value="gebäude">Gebäude / Monument</option>
                <option value="region">Region / Provinz</option>
                <option value="zone">Zone / Sektor</option>
                <option value="meer">Meer / Ozean</option>
                <option value="bucht">Bucht / Lagune</option>
                <option value="see">See / Binnensee</option>
                <option value="fluss">Fluss</option>
                <option value="kontinent">Kontinent</option>
                <option value="biome_gebirge">Gebirge</option>
                <option value="biome_wald">Wald</option>
                <option value="ort">Besonderer Ort</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Übergeordnetes Meer / Region:</label>
              <select
                value={form.parentId || ''}
                onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value || null }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="">Keines (Direkt auf Weltkarte)</option>
                {parentCandidates.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Fraktion / Herrscher:</label>
            <input
              type="text"
              value={form.faction}
              onChange={(e) => setForm(prev => ({ ...prev, faction: e.target.value }))}
              placeholder="z.B. Weltregierung, Strohhut-Allianz, Neutral"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Beschreibung:</label>
            <AutoExpandingTextarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Atmosphäre, Besonderheiten..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 min-h-[50px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg"
          >
            Gebiet anlegen
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. HIERARCHY TREE DRAWER
// =========================================================================
interface HierarchyDrawerProps {
  show: boolean;
  onClose: () => void;
  territories: Territory[];
  selectedTerritoryId: string | null;
  onSelectTerritory: (id: string, x: number, y: number) => void;
}

export const HierarchyDrawer: React.FC<HierarchyDrawerProps> = ({
  show,
  onClose,
  territories,
  selectedTerritoryId,
  onSelectTerritory
}) => {
  if (!show) return null;

  const renderTreeNodes = (parentId: string | null = null, depth: number = 0): React.ReactNode => {
    const nodes = territories.filter(t => t.parentId === parentId);
    if (nodes.length === 0) return null;

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-3 pl-2 border-l border-slate-800' : ''}`}>
        {nodes.map(node => {
          const isSelected = node.id === selectedTerritoryId;
          const childCount = territories.filter(c => c.parentId === node.id).length;

          return (
            <div key={node.id} className="space-y-1">
              <button
                onClick={() => onSelectTerritory(node.id, node.x, node.y)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-md'
                    : 'bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-400">
                    {node.type === 'welt' ? <Globe className="w-3.5 h-3.5" /> : (node.type === 'meer' || node.type === 'ozean' || node.type === 'bucht' || node.type === 'see' || node.type === 'fluss') ? <Waves className="w-3.5 h-3.5" /> : (node.type === 'insel' || node.type === 'kontinent') ? <LandPlot className="w-3.5 h-3.5" /> : (node.type === 'stadt' || node.type === 'dorf') ? <Building className="w-3.5 h-3.5" /> : node.type === 'festung' ? <Castle className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  </span>
                  <span className="truncate">{node.name}</span>
                </div>
                {childCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-full font-mono shrink-0 ml-1">
                    {childCount}
                  </span>
                )}
              </button>
              {renderTreeNodes(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-end p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md h-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm">Geografischer Hierarchie-Baum</h3>
              <p className="text-[11px] text-slate-400">Meere › Inseln › Städte › Distrikte › POIs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {renderTreeNodes(null, 0)}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">Insgesamt {territories.length} Gebiete</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
