import React, { useState, useRef, useMemo } from 'react';
import {
  Building2,
  Home,
  Castle,
  Anchor,
  Hammer,
  ShoppingBag,
  Compass,
  Plus,
  Trash2,
  Move,
  Pencil,
  Info,
  Check,
  RefreshCw,
  Coins,
  Shield,
  Sparkles,
  Wheat,
  BookOpen,
  Wrench,
  Construction,
  AlertTriangle,
  Skull,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import { Territory, WorldSetting, LoreEntry } from '../../types';
import {
  LocalBuildingCategory,
  LocalBuildingSymbol,
  BuildingStatus,
  BuildingCategoryGroup,
  BUILDING_CATALOG,
  CATEGORY_GROUPS,
  getBuildingStats,
  calculateTownEconomy,
  TownEconomySummary
} from './townBuildingCatalog';
import { TownBuildingGraphic } from './TownBuildingGraphic';

export interface LocalRoadPath {
  id: string;
  type: 'pflaster' | 'feldweg' | 'wasserlauf' | 'mauer' | 'steg';
  points: { x: number; y: number }[];
}

export interface LocalTownMapData {
  buildings: LocalBuildingSymbol[];
  roads: LocalRoadPath[];
  hasWaterCoast?: boolean;
  hasRiver?: boolean;
  hasCityWall?: boolean;
  townType?: string;
}

interface StylizedLocalTownMapProps {
  territory: Territory;
  worldSetting?: WorldSetting;
  loreDatabase?: LoreEntry[];
  onChangeMapData?: (data: LocalTownMapData) => void;
  onUpdateTerritoryFields?: (updatedFields: Partial<Territory>) => void;
}

export const StylizedLocalTownMap: React.FC<StylizedLocalTownMapProps> = ({
  territory,
  onChangeMapData,
  onUpdateTerritoryFields
}) => {
  // Extract or initialize town map data
  const mapData: LocalTownMapData = useMemo(() => {
    if (territory.tileData && Array.isArray((territory.tileData as any).buildings)) {
      return territory.tileData as unknown as LocalTownMapData;
    }
    return generateDefaultTownLayout(territory);
  }, [territory]);

  const [buildings, setBuildings] = useState<LocalBuildingSymbol[]>(mapData.buildings || []);
  const [roads, setRoads] = useState<LocalRoadPath[]>(mapData.roads || []);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Tool states
  const [activeTool, setActiveTool] = useState<'select' | 'add_building' | 'draw_road'>('add_building');
  const [selectedAddCategory, setSelectedAddCategory] = useState<LocalBuildingCategory>('wohnen_einfach');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<BuildingCategoryGroup | 'all'>('all');
  const [buildingSearchTerm, setBuildingSearchTerm] = useState<string>('');
  const [selectedRoadType, setSelectedRoadType] = useState<LocalRoadPath['type']>('pflaster');

  // Road drawing temp points
  const [tempRoadPoints, setTempRoadPoints] = useState<{ x: number; y: number }[]>([]);

  // Dragging state for buildings
  const [draggingBuildingId, setDraggingBuildingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Settlement Economy summary
  const economy = useMemo<TownEconomySummary>(() => {
    return calculateTownEconomy(buildings);
  }, [buildings]);

  // Filtered building catalog list for direct inline selection
  const catalogList = useMemo(() => {
    return Object.values(BUILDING_CATALOG);
  }, []);

  const filteredBuildings = useMemo(() => {
    return catalogList.filter(bld => {
      const matchesGroup = selectedGroupFilter === 'all' || bld.group === selectedGroupFilter;
      const matchesSearch =
        !buildingSearchTerm.trim() ||
        bld.name.toLowerCase().includes(buildingSearchTerm.toLowerCase()) ||
        bld.shortDesc.toLowerCase().includes(buildingSearchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [catalogList, selectedGroupFilter, buildingSearchTerm]);

  // Sync back to parent when buildings/roads change
  const saveState = (newBuildings: LocalBuildingSymbol[], newRoads: LocalRoadPath[]) => {
    const updatedData: LocalTownMapData = {
      ...mapData,
      buildings: newBuildings,
      roads: newRoads
    };
    if (onChangeMapData) {
      onChangeMapData(updatedData);
    }
  };

  const selectedBuilding = useMemo(() => {
    return buildings.find(b => b.id === selectedBuildingId) || null;
  }, [buildings, selectedBuildingId]);

  const selectedBuildingDef = useMemo(() => {
    if (!selectedBuilding) return null;
    return BUILDING_CATALOG[selectedBuilding.category] || BUILDING_CATALOG.wohnen_einfach;
  }, [selectedBuilding]);

  const selectedBuildingStats = useMemo(() => {
    if (!selectedBuilding) return null;
    return getBuildingStats(selectedBuilding);
  }, [selectedBuilding]);

  // Handle building drag
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'draw_road') {
      const coords = getSvgCoordinates(e);
      setTempRoadPoints(prev => [...prev, coords]);
      return;
    }

    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'town-bg') {
      if (activeTool === 'add_building') {
        const coords = getSvgCoordinates(e);
        const def = BUILDING_CATALOG[selectedAddCategory] || BUILDING_CATALOG.wohnen_einfach;
        const newBuilding: LocalBuildingSymbol = {
          id: `bld-${Date.now()}`,
          name: `${def.name} ${buildings.length + 1}`,
          category: selectedAddCategory,
          x: Math.round(coords.x * 10) / 10,
          y: Math.round(coords.y * 10) / 10,
          rotation: 0,
          scale: 1,
          level: 1,
          status: 'aktiv'
        };
        const updated = [...buildings, newBuilding];
        setBuildings(updated);
        setSelectedBuildingId(newBuilding.id);
        saveState(updated, roads);
      } else {
        setSelectedBuildingId(null);
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingBuildingId) {
      const coords = getSvgCoordinates(e);
      const updated = buildings.map(b => {
        if (b.id === draggingBuildingId) {
          return {
            ...b,
            x: Math.round((coords.x - dragOffset.x) * 10) / 10,
            y: Math.round((coords.y - dragOffset.y) * 10) / 10
          };
        }
        return b;
      });
      setBuildings(updated);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleSvgMouseUp = () => {
    if (draggingBuildingId) {
      setDraggingBuildingId(null);
      saveState(buildings, roads);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleStartBuildingDrag = (e: React.MouseEvent, building: LocalBuildingSymbol) => {
    e.stopPropagation();
    if (activeTool === 'draw_road') return;

    setSelectedBuildingId(building.id);
    const coords = getSvgCoordinates(e);
    setDraggingBuildingId(building.id);
    setDragOffset({
      x: coords.x - building.x,
      y: coords.y - building.y
    });
  };

  const getSvgCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.max(10, Math.min(390, transformed.x)),
      y: Math.max(10, Math.min(290, transformed.y))
    };
  };

  const handleRotateBuilding = (buildingId: string, delta: number) => {
    const updated = buildings.map(b => {
      if (b.id === buildingId) {
        const currentRot = b.rotation || 0;
        return { ...b, rotation: (currentRot + delta + 360) % 360 };
      }
      return b;
    });
    setBuildings(updated);
    saveState(updated, roads);
  };

  const handleSetBuildingLevel = (buildingId: string, level: number) => {
    const updated = buildings.map(b => {
      if (b.id === buildingId) {
        return { ...b, level: Math.max(1, Math.min(5, level)) };
      }
      return b;
    });
    setBuildings(updated);
    saveState(updated, roads);
  };

  const handleSetBuildingStatus = (buildingId: string, status: BuildingStatus) => {
    const updated = buildings.map(b => {
      if (b.id === buildingId) {
        return {
          ...b,
          status,
          constructionProgress: status === 'im_bau' ? (b.constructionProgress || 30) : undefined
        };
      }
      return b;
    });
    setBuildings(updated);
    saveState(updated, roads);
  };

  const handleUpdateSelectedBuilding = (key: keyof LocalBuildingSymbol, value: any) => {
    if (!selectedBuildingId) return;
    const updated = buildings.map(b => {
      if (b.id === selectedBuildingId) {
        return { ...b, [key]: value };
      }
      return b;
    });
    setBuildings(updated);
    saveState(updated, roads);
  };

  const handleDeleteBuilding = (buildingId: string) => {
    const updated = buildings.filter(b => b.id !== buildingId);
    setBuildings(updated);
    setSelectedBuildingId(null);
    saveState(updated, roads);
  };

  const handleFinishRoad = () => {
    if (tempRoadPoints.length < 2) {
      setTempRoadPoints([]);
      return;
    }
    const newRoad: LocalRoadPath = {
      id: `road-${Date.now()}`,
      type: selectedRoadType,
      points: tempRoadPoints
    };
    const updatedRoads = [...roads, newRoad];
    setRoads(updatedRoads);
    setTempRoadPoints([]);
    saveState(buildings, updatedRoads);
  };

  const handleRegenerateLayout = () => {
    const defaultData = generateDefaultTownLayout(territory);
    setBuildings(defaultData.buildings);
    setRoads(defaultData.roads);
    setSelectedBuildingId(null);
    saveState(defaultData.buildings, defaultData.roads);
  };

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-950 rounded-2xl border border-slate-800 p-2 relative overflow-hidden select-none">
      {/* TOP EDITOR TOOLBAR */}
      <div className="w-full flex flex-col gap-2 bg-slate-900/95 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 shadow-md">
        {/* HEADER & MAIN TOOL SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-black text-amber-300 uppercase tracking-wider text-xs">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Karteneditor</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {territory.name} ({territory.type || 'Siedlung'})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* TOOL SELECTION BUTTONS */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTool('add_building')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTool === 'add_building'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gebäude platzieren</span>
              </button>

              <button
                onClick={() => setActiveTool('select')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTool === 'select'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Auswählen & Verschieben</span>
              </button>

              <button
                onClick={() => setActiveTool('draw_road')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTool === 'draw_road'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Wege zeichnen</span>
              </button>
            </div>

            <button
              onClick={handleRegenerateLayout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Ortskarte neu entwerfen"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Neu erzeugen</span>
            </button>
          </div>
        </div>

        {/* SETTLEMENT ECONOMY BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1 font-bold text-amber-300 shrink-0" title="Netto-Einkommen (Einnahmen abzüglich Unterhalt)">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Netto: {economy.netIncome >= 0 ? `+${economy.netIncome}` : economy.netIncome} Gold</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-orange-300 shrink-0" title="Gesamtbevölkerung / Wohnkapazität">
              <Home className="w-3.5 h-3.5 text-orange-400" />
              <span>{economy.totalPopulation} Bürger</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-slate-300 shrink-0" title="Gesamte Produktionsleistung">
              <Hammer className="w-3.5 h-3.5 text-slate-400" />
              <span>{economy.totalProduction} Prod</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-rose-300 shrink-0" title="Verteidigungswert">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>{economy.totalDefense} Schutz</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-cyan-300 shrink-0" title="Wohlstand & Moral">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{economy.totalMorale} Wohlstand</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{economy.counts.active} Aktiv</span>
            {economy.counts.underConstruction > 0 && (
              <span className="text-amber-400 font-bold">| {economy.counts.underConstruction} Im Bau</span>
            )}
            {economy.counts.damaged > 0 && (
              <span className="text-orange-400 font-bold">| {economy.counts.damaged} Beschädigt</span>
            )}
            {economy.counts.destroyed > 0 && (
              <span className="text-rose-400 font-bold">| {economy.counts.destroyed} Ruinen</span>
            )}
          </div>
        </div>

        {/* DIRECT INLINE BUILDING SELECTION RIBBON (NO EXTRA POPUP MODAL) */}
        {activeTool === 'add_building' && (
          <div className="flex flex-col gap-2 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
            {/* CATEGORY TABS & SEARCH */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full text-xs">
                <button
                  onClick={() => setSelectedGroupFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 text-xs ${
                    selectedGroupFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Alle ({catalogList.length})
                </button>

                {(Object.keys(CATEGORY_GROUPS) as BuildingCategoryGroup[]).map(groupKey => {
                  const groupConf = CATEGORY_GROUPS[groupKey];
                  const IconComp = groupConf.icon;
                  const isSelected = selectedGroupFilter === groupKey;
                  return (
                    <button
                      key={groupKey}
                      onClick={() => setSelectedGroupFilter(groupKey)}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{groupConf.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SEARCH FIELD */}
              <div className="relative w-48 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Gebäude filtern..."
                  value={buildingSearchTerm}
                  onChange={(e) => setBuildingSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* DIRECT HORIZONTAL SCROLLABLE LIST OF ALL MATCHING BUILDINGS */}
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1 max-w-full">
              {filteredBuildings.map(bld => {
                const isSelected = selectedAddCategory === bld.category;
                const lvl1 = bld.levels[0];

                return (
                  <button
                    key={bld.category}
                    onClick={() => setSelectedAddCategory(bld.category)}
                    className={`p-2 rounded-xl border text-left transition-all shrink-0 w-44 flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-slate-700 shadow-sm"
                        style={{ backgroundColor: `${bld.color}33` }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-sm"
                          style={{ backgroundColor: bld.color }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-slate-100 truncate group-hover:text-amber-300">
                          {bld.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {CATEGORY_GROUPS[bld.group]?.label}
                        </div>
                      </div>
                    </div>

                    {/* MINI STAT PILLS */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[9px] bg-slate-950/70 p-1 rounded-lg border border-slate-800/80 font-bold">
                      {lvl1.stats.income > 0 && (
                        <span className="text-amber-400">+{lvl1.stats.income} G</span>
                      )}
                      {lvl1.stats.production > 0 && (
                        <span className="text-slate-300">+{lvl1.stats.production} Pr</span>
                      )}
                      {lvl1.stats.defense > 0 && (
                        <span className="text-rose-300">+{lvl1.stats.defense} Def</span>
                      )}
                      {lvl1.stats.population > 0 && (
                        <span className="text-orange-300">+{lvl1.stats.population} Einw</span>
                      )}
                      {lvl1.stats.morale > 0 && (
                        <span className="text-cyan-300">+{lvl1.stats.morale} Wohl</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>
                Gewählt: <strong className="text-amber-300">{BUILDING_CATALOG[selectedAddCategory]?.name}</strong>
              </span>
              <span className="italic">
                Klicke auf die Karte unten, um das Gebäude an der gewünschten Position zu platzieren.
              </span>
            </div>
          </div>
        )}

        {/* DRAW ROAD PANEL RIBBON */}
        {activeTool === 'draw_road' && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider shrink-0">
              Weg-Typ:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { type: 'pflaster', label: 'Pflasterstraße' },
                { type: 'feldweg', label: 'Feldweg / Pfad' },
                { type: 'wasserlauf', label: 'Kanal / Fluss' },
                { type: 'mauer', label: 'Stadtmauer' }
              ].map(r => (
                <button
                  key={r.type}
                  onClick={() => setSelectedRoadType(r.type as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedRoadType === r.type
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {tempRoadPoints.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleFinishRoad}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Fertigstellen ({tempRoadPoints.length} Pkt.)</span>
                </button>
                <button
                  onClick={() => setTempRoadPoints([])}
                  className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 italic ml-auto hidden lg:inline">
              Klicke nacheinander Punkte auf der Karte an, um den Verlauf zu zeichnen.
            </span>
          </div>
        )}

        {/* INSPECTOR PANEL FOR SELECTED BUILDING */}
        {selectedBuilding && selectedBuildingDef && (
          <div className="flex flex-col gap-2 bg-slate-950 p-2.5 rounded-xl border border-amber-500/50">
            {/* ROW 1: TITLE, CATEGORY, LEVEL SELECTOR & STATUS SWITCHER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-300 text-xs">
                  {selectedBuilding.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({selectedBuildingDef.levels[(selectedBuilding.level || 1) - 1]?.title || selectedBuildingDef.name})
                </span>
              </div>

              {/* LEVEL / STUFENAUSBAU BUTTONS (1 to 5) */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 mr-1">Stufe:</span>
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => handleSetBuildingLevel(selectedBuilding.id, lvl)}
                    className={`w-5 h-5 rounded text-[11px] font-black transition-all cursor-pointer flex items-center justify-center ${
                      (selectedBuilding.level || 1) === lvl
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={`Auf Stufe ${lvl} setzen`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* STATUS SWITCHER (Aktiv, Im Bau, Beschädigt, Zerstört) */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'aktiv')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    (selectedBuilding.status || 'aktiv') === 'aktiv'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Aktiv
                </button>
                <button
                  onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'im_bau')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedBuilding.status === 'im_bau'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Construction className="w-3 h-3" />
                  <span>Im Bau</span>
                </button>
                <button
                  onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'beschaedigt')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedBuilding.status === 'beschaedigt'
                      ? 'bg-orange-600 text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Beschädigt</span>
                </button>
                <button
                  onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'zerstoert')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedBuilding.status === 'zerstoert'
                      ? 'bg-rose-700 text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Skull className="w-3 h-3" />
                  <span>Ruine</span>
                </button>
              </div>

              <button
                onClick={() => handleDeleteBuilding(selectedBuilding.id)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
                title="Gebäude von Karte entfernen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ROW 2: LIVE ECONOMIC STATS FOR THIS BUILDING */}
            {selectedBuildingStats && (
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400 font-bold">Wirtschaftsertrag:</span>
                <span className="text-amber-400 font-bold">
                  Einkommen: +{selectedBuildingStats.income} G (Unterhalt: -{selectedBuildingStats.upkeep} G)
                </span>
                <span className="text-slate-300 font-bold">
                  Produktion: +{selectedBuildingStats.production}
                </span>
                <span className="text-rose-300 font-bold">
                  Verteidigung: +{selectedBuildingStats.defense}
                </span>
                <span className="text-orange-300 font-bold">
                  Wohnraum: +{selectedBuildingStats.population}
                </span>
                <span className="text-cyan-300 font-bold">
                  Wohlstand: {selectedBuildingStats.morale >= 0 ? `+${selectedBuildingStats.morale}` : selectedBuildingStats.morale}
                </span>

                {/* Quick Action button for repairs / upgrades */}
                {selectedBuilding.status === 'im_bau' && (
                  <button
                    onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'aktiv')}
                    className="ml-auto px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                  >
                    Bau fertigstellen
                  </button>
                )}
                {selectedBuilding.status === 'beschaedigt' && (
                  <button
                    onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'aktiv')}
                    className="ml-auto px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black cursor-pointer"
                  >
                    Reparieren (Aktivieren)
                  </button>
                )}
                {selectedBuilding.status === 'zerstoert' && (
                  <button
                    onClick={() => handleSetBuildingStatus(selectedBuilding.id, 'im_bau')}
                    className="ml-auto px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black cursor-pointer"
                  >
                    Wiederaufbau starten
                  </button>
                )}
              </div>
            )}

            {/* ROW 3: INPUT FIELDS (NAME, OWNER, ROTATION, NOTES) */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-bold text-slate-400">Name:</label>
                <input
                  type="text"
                  value={selectedBuilding.name}
                  onChange={(e) => handleUpdateSelectedBuilding('name', e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 w-36"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="text-[10px] font-bold text-slate-400">Drehung:</label>
                <button
                  onClick={() => handleRotateBuilding(selectedBuilding.id, -45)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold cursor-pointer"
                >
                  -45°
                </button>
                <button
                  onClick={() => handleRotateBuilding(selectedBuilding.id, 45)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold cursor-pointer"
                >
                  +45°
                </button>
              </div>

              <div className="flex items-center gap-1">
                <label className="text-[10px] font-bold text-slate-400">Inhaber:</label>
                <input
                  type="text"
                  value={selectedBuilding.npcOwner || ''}
                  placeholder="z.B. Meister Balthasar"
                  onChange={(e) => handleUpdateSelectedBuilding('npcOwner', e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 w-32"
                />
              </div>

              <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                <label className="text-[10px] font-bold text-slate-400">Notiz:</label>
                <input
                  type="text"
                  value={selectedBuilding.description || ''}
                  placeholder="Besonderheiten..."
                  onChange={(e) => handleUpdateSelectedBuilding('description', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM STYLIZED FANTASY LOCAL SVG MAP CANVAS (FULL WIDTH) */}
      <div className="w-full h-[650px] min-h-[500px] relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* COMPASS ROSE ARTWORK */}
        <div className="absolute top-3 right-3 pointer-events-none opacity-25 z-10">
          <div className="relative w-16 h-16 flex items-center justify-center text-amber-500">
            <Compass className="w-full h-full text-amber-500/70" />
            <span className="absolute -top-1 font-black text-[9px] text-amber-400">N</span>
          </div>
        </div>

        {/* MAP SCALE / LEGEND INFO */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-amber-300/80 font-mono pointer-events-none z-10 flex items-center gap-2">
          <span>Maßstab ~ 1:500</span>
          <span className="text-slate-600">|</span>
          <span>{territory.name} ({buildings.length} Bauwerke)</span>
        </div>

        {/* MAIN SVG CANVAS */}
        <svg
          ref={svgRef}
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid meet"
          className={`w-full h-full max-w-full max-h-full cursor-crosshair select-none ${
            isPanning ? 'cursor-grabbing' : ''
          }`}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          id="town-bg"
        >
          <defs>
            <radialGradient id="parchmentVignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <filter id="cartoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* PARCHMENT LANDMASS BASE */}
          <rect x="0" y="0" width="400" height="300" fill="url(#parchmentVignette)" />

          {/* WATER / COASTLINE (if Harbor or River town) */}
          {mapData.hasWaterCoast && (
            <path
              d="M 0 220 Q 120 200, 240 240 T 400 230 L 400 300 L 0 300 Z"
              fill="url(#waterFlow)"
              stroke="#0ea5e9"
              strokeWidth="1.5"
              opacity="0.85"
            />
          )}

          {mapData.hasRiver && (
            <path
              d="M 0 80 Q 150 140, 250 110 T 400 160"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}

          {/* GREEN PARKS & WOODLAND PATCHES */}
          <path
            d="M 20 20 Q 60 10, 80 40 T 30 80 Z"
            fill="#15803d"
            opacity="0.25"
            stroke="#166534"
            strokeWidth="1"
          />
          <path
            d="M 310 30 Q 370 20, 380 70 T 320 90 Z"
            fill="#15803d"
            opacity="0.2"
            stroke="#166534"
            strokeWidth="1"
          />

          {/* DRAW ROADS & PATHS */}
          {roads.map(road => (
            <path
              key={road.id}
              d={road.points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
              fill="none"
              stroke={
                road.type === 'pflaster' ? '#475569' :
                road.type === 'feldweg' ? '#78350f' :
                road.type === 'wasserlauf' ? '#0ea5e9' : '#1e293b'
              }
              strokeWidth={road.type === 'pflaster' ? '4' : road.type === 'wasserlauf' ? '6' : '3'}
              strokeDasharray={road.type === 'feldweg' ? '4 2' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
          ))}

          {/* TEMP ROAD DRAWING PREVIEW */}
          {tempRoadPoints.length > 0 && (
            <polyline
              points={tempRoadPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* DRAW STYLIZED BUILDING MAP SYMBOLS WITH LEVEL & STATUS SUPPORT */}
          {buildings.map(b => {
            const isSelected = selectedBuildingId === b.id;
            const rot = b.rotation || 0;

            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${rot})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBuildingId(b.id);
                }}
                onMouseDown={(e) => handleStartBuildingDrag(e, b)}
                className="cursor-pointer group"
                filter="url(#cartoShadow)"
              >
                {/* RENDER DEDICATED VECTOR GRAPHIC WITH LEVEL & STATUS */}
                <TownBuildingGraphic building={b} isSelected={isSelected} />

                {/* BUILDING NAME / LABEL ON HOVER OR SELECTION */}
                <text
                  y={18}
                  textAnchor="middle"
                  fill={
                    b.status === 'zerstoert'
                      ? '#94a3b8'
                      : b.status === 'im_bau'
                      ? '#fde047'
                      : isSelected
                      ? '#fde047'
                      : '#cbd5e1'
                  }
                  fontSize="6.5"
                  fontWeight="bold"
                  className="pointer-events-none select-none font-sans"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                  {b.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * Generates an initial stylized town map layout matching the settlement's character.
 */
function generateDefaultTownLayout(territory: Territory): LocalTownMapData {
  const type = (territory.type || '').toLowerCase();
  const name = territory.name || 'Siedlung';

  const isHarbor = type === 'hafen' || name.toLowerCase().includes('hafen') || name.toLowerCase().includes('port');
  const isCity = type === 'stadt' || type === 'metropole';
  const isFortress = type === 'festung' || type === 'bastion';

  const buildings: LocalBuildingSymbol[] = [];
  const roads: LocalRoadPath[] = [];

  // Main central road
  roads.push({
    id: 'road-main',
    type: 'pflaster',
    points: [
      { x: 50, y: 150 },
      { x: 200, y: 150 },
      { x: 350, y: 150 }
    ]
  });

  // Cross road
  roads.push({
    id: 'road-cross',
    type: 'feldweg',
    points: [
      { x: 200, y: 50 },
      { x: 200, y: 250 }
    ]
  });

  // Town Hall or Manor in the center
  buildings.push({
    id: 'bld-center',
    name: isFortress ? 'Kommandantur' : isCity ? 'Rathaus' : 'Dorfplatz & Vorsteherhaus',
    category: isFortress ? 'turm' : isCity ? 'rathaus' : 'herrenhaus',
    x: 200,
    y: 110,
    rotation: 0,
    scale: 1.2,
    level: isCity ? 3 : 2,
    status: 'aktiv'
  });

  // Market Square
  buildings.push({
    id: 'bld-market',
    name: 'Marktplatz',
    category: 'markt',
    x: 200,
    y: 180,
    rotation: 0,
    scale: 1.3,
    level: 2,
    status: 'aktiv'
  });

  // Tavern
  buildings.push({
    id: 'bld-tavern',
    name: `Taverne Zum ${name}`,
    category: 'taverne',
    x: 140,
    y: 130,
    rotation: 0,
    scale: 1,
    level: 1,
    status: 'aktiv'
  });

  // Blacksmith / Forge
  buildings.push({
    id: 'bld-forge',
    name: 'Waffenschmiede',
    category: 'schmiede',
    x: 260,
    y: 130,
    rotation: 0,
    scale: 1,
    level: 1,
    status: 'aktiv'
  });

  // Temple
  buildings.push({
    id: 'bld-temple',
    name: 'Tempel des Lichts',
    category: 'tempel',
    x: 130,
    y: 80,
    rotation: 0,
    scale: 1,
    level: 2,
    status: 'aktiv'
  });

  // Harbor Pier if coastal
  if (isHarbor) {
    roads.push({
      id: 'road-pier',
      type: 'steg',
      points: [
        { x: 200, y: 230 },
        { x: 200, y: 280 }
      ]
    });

    buildings.push({
      id: 'bld-dock-1',
      name: 'Hauptkai & Docks',
      category: 'hafen',
      x: 160,
      y: 245,
      rotation: 0,
      scale: 1.2,
      level: 2,
      status: 'aktiv'
    });

    buildings.push({
      id: 'bld-dock-2',
      name: 'Handelsspeicher',
      category: 'speicher',
      x: 240,
      y: 245,
      rotation: 0,
      scale: 1.2,
      level: 1,
      status: 'aktiv'
    });
  }

  // Surrounding residential houses
  const residentialCoords = [
    { x: 90, y: 130 },
    { x: 90, y: 170 },
    { x: 140, y: 180 },
    { x: 260, y: 180 },
    { x: 310, y: 130 },
    { x: 310, y: 170 },
    { x: 260, y: 80 },
    { x: 310, y: 80 }
  ];

  residentialCoords.forEach((pt, idx) => {
    buildings.push({
      id: `bld-res-${idx}`,
      name: `Wohnhaus ${idx + 1}`,
      category: idx % 2 === 0 ? 'wohnen_einfach' : 'wohnen_fachwerk',
      x: pt.x,
      y: pt.y,
      rotation: (idx * 45) % 180,
      scale: 0.9,
      level: 1,
      status: 'aktiv'
    });
  });

  return {
    buildings,
    roads,
    hasWaterCoast: isHarbor,
    hasRiver: !isHarbor && (isCity || name.length % 2 === 0),
    hasCityWall: isCity || isFortress
  };
}
