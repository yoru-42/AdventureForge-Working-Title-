import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Coins,
  Shield,
  Hammer,
  Home,
  Sparkles,
  Wheat,
  Anchor,
  Building2,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  BUILDING_CATALOG,
  CATEGORY_GROUPS,
  BuildingCategoryGroup,
  LocalBuildingCategory,
  BuildingTypeDefinition
} from './townBuildingCatalog';
import { TownBuildingGraphic } from './TownBuildingGraphic';

interface TownBuildingCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuildingType: (category: LocalBuildingCategory) => void;
  selectedCategory: LocalBuildingCategory;
}

export const TownBuildingCatalogModal: React.FC<TownBuildingCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectBuildingType,
  selectedCategory
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BuildingCategoryGroup | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const catalogList = useMemo(() => {
    return Object.values(BUILDING_CATALOG);
  }, []);

  const filteredBuildings = useMemo(() => {
    return catalogList.filter(bld => {
      const matchesGroup = selectedGroup === 'all' || bld.group === selectedGroup;
      const matchesSearch =
        !searchTerm.trim() ||
        bld.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bld.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [catalogList, selectedGroup, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-300">Gebäudekatalog & Bauwerke</h2>
              <p className="text-xs text-slate-400">
                Wähle ein Bauwerk mit wirtschaftlichen Erträgen, Stufenausbau und Zustand für deine Siedlung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & CATEGORY TABS */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-col gap-2.5">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Gebäude, Funktion oder Gewerbe suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* CATEGORY GROUPS FILTER */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                selectedGroup === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Alle ({catalogList.length})
            </button>

            {(Object.keys(CATEGORY_GROUPS) as BuildingCategoryGroup[]).map(groupKey => {
              const groupConf = CATEGORY_GROUPS[groupKey];
              const IconComp = groupConf.icon;
              const isSelected = selectedGroup === groupKey;
              return (
                <button
                  key={groupKey}
                  onClick={() => setSelectedGroup(groupKey)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{groupConf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUILDING CARDS GRID */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBuildings.map(bld => {
            const isCurrentlySelected = selectedCategory === bld.category;
            const lvl1 = bld.levels[0];
            const maxLvl = bld.levels[4];

            return (
              <div
                key={bld.category}
                onClick={() => {
                  onSelectBuildingType(bld.category);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isCurrentlySelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  {/* CARD TOP: ICON & TITLE */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-700/80 shadow-inner"
                        style={{ backgroundColor: `${bld.color}33` }}
                      >
                        <svg viewBox="-15 -15 30 30" className="w-8 h-8">
                          <TownBuildingGraphic
                            building={{
                              id: 'preview',
                              name: bld.name,
                              category: bld.category,
                              x: 0,
                              y: 0,
                              level: 1,
                              status: 'aktiv'
                            }}
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                          {bld.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {CATEGORY_GROUPS[bld.group]?.label}
                        </span>
                      </div>
                    </div>

                    {isCurrentlySelected && (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md shrink-0">
                        Aktiv
                      </span>
                    )}
                  </div>

                  {/* SHORT DESCRIPTION */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {bld.shortDesc}
                  </p>

                  {/* ECONOMIC STATS PILLS (Level 1) */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 mb-3 text-[10px]">
                    {lvl1.stats.income > 0 && (
                      <div className="flex items-center gap-1 text-amber-400 font-bold" title="Gold-Einkommen">
                        <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>+{lvl1.stats.income} G</span>
                      </div>
                    )}
                    {lvl1.stats.production > 0 && (
                      <div className="flex items-center gap-1 text-slate-300 font-bold" title="Produktionswert">
                        <Hammer className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>+{lvl1.stats.production} Prod</span>
                      </div>
                    )}
                    {lvl1.stats.defense > 0 && (
                      <div className="flex items-center gap-1 text-rose-400 font-bold" title="Verteidigungswert">
                        <Shield className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>+{lvl1.stats.defense} Def</span>
                      </div>
                    )}
                    {lvl1.stats.population > 0 && (
                      <div className="flex items-center gap-1 text-orange-300 font-bold" title="Wohnraum / Bevölkerung">
                        <Home className="w-3 h-3 text-orange-400 shrink-0" />
                        <span>+{lvl1.stats.population} Einw.</span>
                      </div>
                    )}
                    {lvl1.stats.morale > 0 && (
                      <div className="flex items-center gap-1 text-cyan-300 font-bold" title="Moral & Zufriedenheit">
                        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>+{lvl1.stats.morale} Wohlst.</span>
                      </div>
                    )}
                    {lvl1.stats.upkeep > 0 && (
                      <div className="flex items-center gap-1 text-slate-400" title="Unterhalt">
                        <span>-{lvl1.stats.upkeep} Unt.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD FOOTER: UPGRADE CAPACITY & ACTION */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-400 font-medium">
                    Stufen: <strong className="text-amber-400 font-bold">1 bis 5</strong> (bis {maxLvl.title})
                  </span>
                  <button
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm group-hover:scale-105"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Auswählen</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER NOTE */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Klicke auf ein Gebäude, um es auf der Karte zu platzieren. Stufe und Zustand (z.B. Im Bau oder Ruine) können direkt angepasst werden.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
