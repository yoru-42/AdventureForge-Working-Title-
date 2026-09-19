import React, { useState, useMemo } from 'react';
import { EconomyHolding, EconomyResource, EconomyResourceCategory, LoreEntry } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import { ITEM_BUILDER_TYPES } from '../../lib/itemCategoriesData';
import { createStandardLoreEntries } from '../../lib/standardItemsData';

interface HoldingResourcesTabProps {
  holding: EconomyHolding;
  currencyIcon: string;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
  loreDatabase?: LoreEntry[];
}

const GEGENSTANDSART_FILTERS = [
  'Alle Arten',
  'Rohstoffe',
  'Materialien',
  'Baustoffe',
  'Bergbau & Erze',
  'Landwirtschaft',
  'Saatgut & Pflanzen',
  'Nahrung',
  'Medizin & Alchemie',
  'Tränke & Elixiere',
  'Werkzeuge',
  'Waffen',
  'Rüstungen',
  'Kleidung',
  'Militärbedarf',
  'Tiere',
  'Transportmittel',
  'Nautik & Seefahrt',
  'Alltag',
  'Handelswaren',
  'Schmuck',
  'Kunst & Antiquitäten',
  'Bücher & Schriften',
  'Gifte & Fallen',
  'Ritual & Kult',
  'Magie',
  'Monster-Beute',
  'Dungeon-Funde',
  'Quest & Story'
];

const RESOURCE_CATEGORIES: { category: EconomyResourceCategory; label: string }[] = [
  { category: 'raw_material', label: 'Rohstoffe & Materialien' },
  { category: 'food_drink', label: 'Lebensmittel & Getränke' },
  { category: 'goods', label: 'Handelswaren & Produkte' },
  { category: 'equipment', label: 'Ausrüstung & Werkzeuge' },
  { category: 'inventory', label: 'Inventar & Vorräte' },
  { category: 'animals', label: 'Tiere & Vieh' },
  { category: 'vehicles', label: 'Fahrzeuge & Karren' },
  { category: 'money', label: 'Geld & Devisen' },
  { category: 'special', label: 'Besonderes & Spezialgüter' }
];

export const HoldingResourcesTab: React.FC<HoldingResourcesTabProps> = ({
  holding,
  currencyIcon,
  onUpdateHolding,
  loreDatabase = []
}) => {
  const resources = Array.isArray(holding.resources) ? holding.resources : [];
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('Alle Arten');
  const [showCodexPickerModal, setShowCodexPickerModal] = useState<boolean>(false);
  const [targetResourceId, setTargetResourceId] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalTypeFilter, setModalTypeFilter] = useState<string>('Alle Arten');

  // Unified list of codex & standard items
  const allLoreItems = useMemo(() => {
    const stdEntries = createStandardLoreEntries();
    const customEntries = (loreDatabase || []).filter(e => e.category === 'Gegenstände' || e.details?.builderType);

    const idSet = new Set<string>();
    const list: LoreEntry[] = [];

    for (const item of customEntries) {
      if (item.id) {
        idSet.add(item.id);
        list.push(item);
      }
    }
    for (const item of stdEntries) {
      if (item.id && !idSet.has(item.id)) {
        idSet.add(item.id);
        list.push(item);
      }
    }
    return list;
  }, [loreDatabase]);

  // Filter resources based on active Gegenstandsart filter
  const filteredResources = useMemo(() => {
    if (activeTypeFilter === 'Alle Arten') return resources;
    const filterLower = activeTypeFilter.toLowerCase();

    return resources.filter(res => {
      const bType = (res.builderType || '').toLowerCase();
      const sCat = (res.subCategory || '').toLowerCase();
      const rCat = (res.category || '').toLowerCase();
      const rName = (res.name || '').toLowerCase();

      if (bType && (bType.includes(filterLower) || filterLower.includes(bType))) return true;
      if (sCat && (sCat.includes(filterLower) || filterLower.includes(sCat))) return true;
      if (rName && rName.includes(filterLower)) return true;

      // Soft category matching
      if (filterLower.includes('nahrung') || filterLower.includes('tränke')) {
        return rCat === 'food_drink' || bType.includes('nahrung') || bType.includes('medizin');
      }
      if (filterLower.includes('waffen') || filterLower.includes('rüstungen') || filterLower.includes('werkzeuge')) {
        return rCat === 'equipment' || bType.includes('waffe') || bType.includes('rüstung') || bType.includes('werkzeug');
      }
      if (filterLower.includes('rohstoffe') || filterLower.includes('materialien') || filterLower.includes('baustoffe')) {
        return rCat === 'raw_material' || bType.includes('rohstoff') || bType.includes('material') || bType.includes('baustoff');
      }

      return false;
    });
  }, [resources, activeTypeFilter]);

  // Filter items for the codex picker modal
  const modalLoreItems = useMemo(() => {
    return allLoreItems.filter(item => {
      const bType = (item.details?.builderType || item.details?.mainCategory || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const subCat = (item.details?.subCategory || '').toLowerCase();

      // Modal type filter
      if (modalTypeFilter !== 'Alle Arten') {
        const mTypeLower = modalTypeFilter.toLowerCase();
        const matchType = bType.includes(mTypeLower) || mTypeLower.includes(bType) || subCat.includes(mTypeLower) || title.includes(mTypeLower);
        if (!matchType) return false;
      }

      // Modal search
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase().trim();
        return title.includes(q) || desc.includes(q) || bType.includes(q) || subCat.includes(q);
      }

      return true;
    });
  }, [allLoreItems, modalTypeFilter, modalSearch]);

  const handleAddResource = () => {
    const newRes: EconomyResource = {
      id: `res-${Date.now()}`,
      name: 'Neuer Lagerbestand',
      builderType: 'Rohstoff',
      category: 'raw_material',
      amount: 10,
      maxCapacity: 100,
      unit: 'Stück',
      pricePerUnit: 5,
      condition: 'gut'
    };
    onUpdateHolding(holding.id, { resources: [...resources, newRes] });
  };

  const handleSelectLoreItemForResource = (item: LoreEntry, targetId?: string | null) => {
    const details = item.details || {};
    const bType = details.builderType || details.mainCategory || 'Rohstoff';
    const subCat = details.subCategory || '';
    const unit = details.unit || 'Stück';
    const price = typeof details.pricePerUnit === 'number' ? details.pricePerUnit : details.defaultPrice || 10;

    let resCategory: EconomyResourceCategory = 'goods';
    const bTypeLower = bType.toLowerCase();
    if (bTypeLower.includes('nahrung') || bTypeLower.includes('getränk')) resCategory = 'food_drink';
    else if (bTypeLower.includes('rohstoff') || bTypeLower.includes('material') || bTypeLower.includes('baustoff')) resCategory = 'raw_material';
    else if (bTypeLower.includes('waffe') || bTypeLower.includes('rüstung') || bTypeLower.includes('werkzeug')) resCategory = 'equipment';
    else if (bTypeLower.includes('tier')) resCategory = 'animals';
    else if (bTypeLower.includes('transport')) resCategory = 'vehicles';

    if (targetId) {
      // Update existing resource card
      const updated = resources.map(r => {
        if (r.id === targetId) {
          return {
            ...r,
            name: item.title,
            builderType: bType,
            subCategory: subCat,
            loreItemId: item.id,
            unit: unit,
            pricePerUnit: price,
            category: resCategory,
            notes: item.description || r.notes
          };
        }
        return r;
      });
      onUpdateHolding(holding.id, { resources: updated });
    } else {
      // Create new resource from lore item
      const newRes: EconomyResource = {
        id: `res-${Date.now()}`,
        name: item.title,
        builderType: bType,
        subCategory: subCat,
        loreItemId: item.id,
        category: resCategory,
        amount: 10,
        maxCapacity: 100,
        unit: unit,
        pricePerUnit: price,
        condition: 'gut',
        notes: item.description || ''
      };
      onUpdateHolding(holding.id, { resources: [...resources, newRes] });
    }

    setShowCodexPickerModal(false);
    setTargetResourceId(null);
  };

  const handleUpdateResource = (id: string, updates: Partial<EconomyResource>) => {
    const updated = resources.map(r => r.id === id ? { ...r, ...updates } : r);
    onUpdateHolding(holding.id, { resources: updated });
  };

  const handleRemoveResource = (id: string) => {
    const updated = resources.filter(r => r.id !== id);
    onUpdateHolding(holding.id, { resources: updated });
  };

  const getSubcategoriesForBuilderType = (type?: string): string[] => {
    if (!type) return [];
    const meta = ITEM_BUILDER_TYPES.find(b => b.type.toLowerCase() === type.toLowerCase() || b.label.toLowerCase() === type.toLowerCase());
    return meta?.subcategories || [];
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Main Actions */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            Lagerbestände, Rohstoffe & Gesamte Ressourcenübersicht ({resources.length})
          </h5>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verwalte alle Vorräte, Erzeugnisse, Werkzeuge und Rohstoffe deines Betriebs – direkt verknüpft mit den Gegenstandsarten aus der Lore-Datenbank.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTargetResourceId(null);
              setShowCodexPickerModal(true);
            }}
            className="px-3 py-1.5 bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            Aus Codex / Lore-Datenbank übernehmen
          </button>

          <button
            type="button"
            onClick={handleAddResource}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            Ware / Rohstoff anlegen
          </button>
        </div>
      </div>

      {/* Gegenstandsart Filter Buttons (Directly matching Image 2 style) */}
      <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
          <span>Gegenstandsart Filter:</span>
          {activeTypeFilter !== 'Alle Arten' && (
            <button
              type="button"
              onClick={() => setActiveTypeFilter('Alle Arten')}
              className="text-amber-400 hover:text-amber-300 text-[10px] underline cursor-pointer"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GEGENSTANDSART_FILTERS.map(filterName => {
            const isActive = activeTypeFilter === filterName;
            return (
              <button
                key={`filter-${filterName}`}
                type="button"
                onClick={() => setActiveTypeFilter(filterName)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {filterName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-3">
          <p>
            {activeTypeFilter === 'Alle Arten'
              ? 'Noch keine Lagerbestände oder Ressourcen erfasst.'
              : `Keine Lagerbestände für die Gegenstandsart "${activeTypeFilter}" vorhanden.`}
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleAddResource}
              className="px-3 py-1.5 bg-amber-600/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 cursor-pointer"
            >
              Ressource anlegen
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTypeFilter(activeTypeFilter);
                setTargetResourceId(null);
                setShowCodexPickerModal(true);
              }}
              className="px-3 py-1.5 bg-slate-900 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
            >
              Aus Codex wählen
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res, resIdx) => {
            const fillPct = Math.min(100, Math.max(0, (res.amount / (res.maxCapacity || 1)) * 100));
            const subcats = getSubcategoriesForBuilderType(res.builderType);
            const linkedCodexItem = res.loreItemId ? allLoreItems.find(i => i.id === res.loreItemId) : null;

            // Matching codex items for dropdown picker on card
            const matchingCodexItems = allLoreItems.filter(i => {
              if (!res.builderType) return true;
              const bLower = res.builderType.toLowerCase();
              const itemType = (i.details?.builderType || i.details?.mainCategory || '').toLowerCase();
              return itemType.includes(bLower) || bLower.includes(itemType);
            });

            return (
              <div key={`res-${res.id || 'res'}-${resIdx}`} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                {/* Linked Codex Item Indicator */}
                {linkedCodexItem && (
                  <div className="flex items-center justify-between text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
                    <span>Verknüpft mit Codex: <strong>{linkedCodexItem.title}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleUpdateResource(res.id, { loreItemId: undefined })}
                      className="text-slate-400 hover:text-red-300 cursor-pointer ml-2"
                      title="Verknüpfung auflösen"
                    >
                      Lösen
                    </button>
                  </div>
                )}

                {/* Resource Title & Action Buttons */}
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="text"
                    value={res.name || ''}
                    onChange={e => handleUpdateResource(res.id, { name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-500 flex-1"
                    placeholder="Name der Ressource"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setTargetResourceId(res.id);
                      setModalTypeFilter(res.builderType || 'Alle Arten');
                      setShowCodexPickerModal(true);
                    }}
                    className="px-2 py-1.5 bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer shrink-0"
                    title="Gegenstand aus der Lore-Datenbank wählen"
                  >
                    Codex
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveResource(res.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg text-xs cursor-pointer shrink-0 border border-slate-800"
                    title="Lagerbestand löschen"
                  >
                    Löschen
                  </button>
                </div>

                {/* Gegenstandsart & Unterkategorie Connection */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Gegenstandsart</label>
                    <select
                      value={res.builderType || 'Rohstoff'}
                      onChange={e => {
                        const newType = e.target.value;
                        const meta = ITEM_BUILDER_TYPES.find(b => b.type === newType);
                        handleUpdateResource(res.id, {
                          builderType: newType,
                          subCategory: meta?.subcategories?.[0] || '',
                          unit: meta?.defaultUnit || res.unit,
                          pricePerUnit: meta?.defaultPrice || res.pricePerUnit
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      {ITEM_BUILDER_TYPES.map(b => (
                        <option key={`bt-${b.type}`} value={b.type}>{b.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Unterkategorie</label>
                    <select
                      value={res.subCategory || ''}
                      onChange={e => handleUpdateResource(res.id, { subCategory: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="">Allgemein</option>
                      {subcats.map((sc, scIdx) => (
                        <option key={`sc-${scIdx}`} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Item Selection from Codex Dropdown */}
                {matchingCodexItems.length > 0 && (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Schnellauswahl aus Codex ({res.builderType || 'Alle'}):</label>
                    <select
                      value={res.loreItemId || ''}
                      onChange={e => {
                        const selectedItem = allLoreItems.find(i => i.id === e.target.value);
                        if (selectedItem) {
                          handleSelectLoreItemForResource(selectedItem, res.id);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-200 outline-none cursor-pointer"
                    >
                      <option value="">Eintrag wählen...</option>
                      {matchingCodexItems.slice(0, 100).map(item => (
                        <option key={`opt-${item.id}`} value={item.id}>
                          {item.title} ({item.details?.subCategory || item.details?.builderType || 'Gegenstand'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Main Category & Condition */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Lager-Kategorie</label>
                    <select
                      value={res.category || 'raw_material'}
                      onChange={e => handleUpdateResource(res.id, { category: e.target.value as EconomyResourceCategory })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      {RESOURCE_CATEGORIES.map(rc => (
                        <option key={`rc-cat-${rc.category}`} value={rc.category}>{rc.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zustand</label>
                    <select
                      value={res.condition || 'gut'}
                      onChange={e => handleUpdateResource(res.id, { condition: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="exzellent">Exzellent</option>
                      <option value="gut">Gut / Frisch</option>
                      <option value="knapp">Knapp / Fast aufgebraucht</option>
                      <option value="verdorben">Verdorben / Abgelaufen</option>
                      <option value="beschaedigt">Beschädigt / Mangelhaft</option>
                      <option value="leer">Leer</option>
                    </select>
                  </div>
                </div>

                {/* Amount, Max Capacity, Unit, Price */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Menge</label>
                    <input
                      type="number"
                      value={res.amount ?? 0}
                      onChange={e => handleUpdateResource(res.id, { amount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Max. Kapazität</label>
                    <input
                      type="number"
                      value={res.maxCapacity ?? 100}
                      onChange={e => handleUpdateResource(res.id, { maxCapacity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Einheit</label>
                    <input
                      type="text"
                      value={res.unit || ''}
                      onChange={e => handleUpdateResource(res.id, { unit: e.target.value })}
                      placeholder="z.B. Fässer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Preis / Einh.</label>
                    <input
                      type="number"
                      value={res.pricePerUnit ?? 0}
                      onChange={e => handleUpdateResource(res.id, { pricePerUnit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold font-mono text-center outline-none"
                    />
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Auslastung: {Math.round(fillPct)}%</span>
                    <span>{res.amount} / {res.maxCapacity} {res.unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${fillPct < 20 ? 'bg-red-500' : fillPct < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${fillPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Notes (Auto-Expanding) */}
                <AutoExpandingTextarea
                  value={res.notes || ''}
                  onChange={e => handleUpdateResource(res.id, { notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-amber-500 min-h-[38px]"
                  placeholder="Notizen zu Herkunft oder Verwendungszweck..."
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Codex / Lore Database Selection Modal */}
      {showCodexPickerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Gegenstand aus Codex / Lore-Datenbank wählen
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wähle einen existierenden Gegenstand oder Rohstoff aus dem Welten-Codex, um ihn im Betriebslager zu erfassen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCodexPickerModal(false)}
                className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Schließen
              </button>
            </div>

            {/* Modal Filters & Search */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3">
              <input
                type="text"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Suche nach Gegenstandsname, Typ oder Beschreibung..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />

              {/* Gegenstandsart Filter Buttons in Modal */}
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                {GEGENSTANDSART_FILTERS.map(fName => {
                  const isActive = modalTypeFilter === fName;
                  return (
                    <button
                      key={`modal-f-${fName}`}
                      type="button"
                      onClick={() => setModalTypeFilter(fName)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {fName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {modalLoreItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Keine passenden Gegenstände in der Datenbank gefunden.
                </div>
              ) : (
                modalLoreItems.map(item => {
                  const details = item.details || {};
                  const bType = details.builderType || details.mainCategory || 'Gegenstand';
                  const subCat = details.subCategory || '';
                  const unit = details.unit || 'Stück';
                  const price = typeof details.pricePerUnit === 'number' ? details.pricePerUnit : details.defaultPrice || 10;

                  return (
                    <div
                      key={`picker-item-${item.id}`}
                      className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[10px] font-medium">
                            {bType}
                          </span>
                          {subCat && (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px]">
                              {subCat}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="text-[10px] text-slate-500 flex gap-3 pt-0.5">
                          <span>Einheit: <strong>{unit}</strong></span>
                          <span>Richtpreis: <strong>{price} {currencyIcon}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectLoreItemForResource(item, targetResourceId)}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 self-start sm:self-center"
                      >
                        In Lager übernehmen
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
