import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Maximize2, 
  Sparkles, 
  Globe, 
  Compass, 
  Trash2, 
  X,
  Waves,
  Mountain,
  Palmtree,
  Building2,
  Castle,
  Layers,
  Move,
  Palette,
  Droplets,
  Pencil,
  Plus,
  Scissors,
  Undo2,
  Redo2,
  RotateCcw,
  Check
} from 'lucide-react';
import { ZoomDetailLevel, DETAIL_LEVEL_CONFIG, BorderAdaptationMode } from './worldMapData';
import { Territory } from '../../types';

export type MapLayerMode = 'all' | 'geography' | 'territories';

export type DrawZoneType = 
  | 'koenigreich' 
  | 'red_line'
  | 'meer' 
  | 'calm_belt'
  | 'insel' 
  | 'region' 
  | 'biome_wald' 
  | 'biome_gebirge' 
  | 'see' 
  | 'fluss' 
  | 'weg'
  | 'zone';

export const OUTSIDE_DRAW_TYPES: { value: DrawZoneType; label: string; icon: string }[] = [
  { value: 'koenigreich', label: 'Landmasse / Kontinent', icon: '' },
  { value: 'red_line', label: 'Felsbarriere / Red Line', icon: '' },
  { value: 'meer', label: 'Meer / Ozean', icon: '' },
  { value: 'calm_belt', label: 'Meereszone / Spezialzone', icon: '' },
  { value: 'insel', label: 'Insel', icon: '' },
  { value: 'region', label: 'Region', icon: '' },
];

export const INSIDE_DRAW_TYPES: { value: DrawZoneType; label: string; icon: string }[] = [
  { value: 'zone', label: 'Territorium / Reich', icon: '' },
  { value: 'biome_wald', label: 'Wald-Gebiet', icon: '' },
  { value: 'biome_gebirge', label: 'Gebirge', icon: '' },
  { value: 'see', label: 'Binnensee', icon: '' },
  { value: 'fluss', label: 'Fluss (Pfad)', icon: '' },
  { value: 'weg', label: 'Weg / Straße', icon: '' },
];

export const DRAW_COLOR_PRESETS = [
  { color: '#dc2626', label: 'Red Line / Blutrot' },
  { color: '#991b1b', label: 'Dunkelrot / Vulkan' },
  { color: '#0284c7', label: 'Tiefsee / Ozean' },
  { color: '#0369a1', label: 'Grand Line / Indigo' },
  { color: '#38bdf8', label: 'Calm Belt / Himmelblau' },
  { color: '#0d9488', label: 'Türkis / Flachwasser' },
  { color: '#15803d', label: 'Wald / Smaragd' },
  { color: '#d97706', label: 'Wüste / Gold / Sand' },
  { color: '#475569', label: 'Gebirge / Schiefer' },
  { color: '#e2e8f0', label: 'Eis / Schnee / Polar' },
  { color: '#7c3aed', label: 'Magie / Schatten / Violett' },
  { color: '#1e293b', label: 'Obsidian / Schwarz' }
];

export interface SettlementPlacementOption {
  value: string;
  label: string;
  category: 'Dörfer & Siedlungen' | 'Städte & Metropolen' | 'Burgen & Festungen' | 'Besondere Orte';
  sizeLabel: string;
  icon: string;
  defaultName: string;
}

export const SETTLEMENT_PLACEMENT_OPTIONS: SettlementPlacementOption[] = [
  // Dörfer & Siedlungen (Klein)
  { value: 'dorf_klein', label: 'Weiler (Sehr klein)', category: 'Dörfer & Siedlungen', sizeLabel: 'Klein', icon: '', defaultName: 'Weiler' },
  { value: 'dorf', label: 'Dorf / Siedlung (Klein)', category: 'Dörfer & Siedlungen', sizeLabel: 'Klein', icon: '', defaultName: 'Dorf' },
  { value: 'dorf_gross', label: 'Großdorf / Markt (Mittel)', category: 'Dörfer & Siedlungen', sizeLabel: 'Mittel', icon: '', defaultName: 'Großdorf' },

  // Städte & Metropolen (Mittel - Groß)
  { value: 'stadt_klein', label: 'Kleinstadt (Mittel)', category: 'Städte & Metropolen', sizeLabel: 'Mittel', icon: '', defaultName: 'Kleinstadt' },
  { value: 'stadt', label: 'Stadt / Handelsstadt (Groß)', category: 'Städte & Metropolen', sizeLabel: 'Groß', icon: '', defaultName: 'Stadt' },
  { value: 'hafen', label: 'Hafenstadt / Seestadt (Groß)', category: 'Städte & Metropolen', sizeLabel: 'Groß', icon: '', defaultName: 'Hafenstadt' },
  { value: 'metropole', label: 'Metropole / Hauptstadt (Sehr groß)', category: 'Städte & Metropolen', sizeLabel: 'Sehr groß', icon: '', defaultName: 'Hauptstadt' },

  // Burgen & Festungen
  { value: 'aussenposten', label: 'Außenposten / Wachturm (Klein)', category: 'Burgen & Festungen', sizeLabel: 'Klein', icon: '', defaultName: 'Außenposten' },
  { value: 'burg', label: 'Burg / Feste (Mittel)', category: 'Burgen & Festungen', sizeLabel: 'Mittel', icon: '', defaultName: 'Burg' },
  { value: 'festung', label: 'Große Festung / Zitadelle (Groß)', category: 'Burgen & Festungen', sizeLabel: 'Groß', icon: '', defaultName: 'Festung' },

  // Besondere Orte
  { value: 'tempel', label: 'Tempel / Kloster (Heiligtum)', category: 'Besondere Orte', sizeLabel: 'Mittel', icon: '', defaultName: 'Heiligtum' },
  { value: 'mine', label: 'Mine / Steinbruch (Ressource)', category: 'Besondere Orte', sizeLabel: 'Klein', icon: '', defaultName: 'Mine' },
  { value: 'ruinen', label: 'Alte Ruinen (Vergessen)', category: 'Besondere Orte', sizeLabel: 'Mittel', icon: '', defaultName: 'Ruine' },
  { value: 'oase', label: 'Oase / Heilquelle (Natur)', category: 'Besondere Orte', sizeLabel: 'Klein', icon: '', defaultName: 'Oase' },
];

export type PlacementTool = 
  | 'draw_zone'
  | 'meer' 
  | 'kontinent' 
  | 'koenigreich'
  | 'land'
  | 'region'
  | 'unabhaengiges_gebiet'
  | 'insel' 
  | 'see'
  | 'stadt' 
  | 'dorf_klein'
  | 'dorf'
  | 'dorf_gross'
  | 'stadt_klein'
  | 'hafen'
  | 'metropole'
  | 'aussenposten'
  | 'burg'
  | 'festung' 
  | 'tempel'
  | 'mine'
  | 'ruinen'
  | 'oase'
  | 'versetzen'
  | 'connect_weg'
  | 'biome_gras'
  | 'biome_wald'
  | 'biome_gebirge'
  | 'biome_wasser'
  | 'biome_wueste'
  | 'biome_schnee'
  | 'biome_sumpf'
  | 'biome_vulkan'
  | null;

interface WorldMapToolbarProps {
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isExpandedHeight: boolean;
  onToggleExpandedHeight: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  currentDetailLevel: ZoomDetailLevel;
  activePlacementTool: PlacementTool;
  onSelectPlacementTool: (tool: PlacementTool) => void;
  mapLayerMode?: MapLayerMode;
  onSelectMapLayerMode?: (mode: MapLayerMode) => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  onOpenSmartFill?: () => void;
  onOpenWorldCreator: () => void;
  onSyncFromCodex: () => void;
  onOpenDeleteAll: () => void;
  onAutoConnectRoads?: () => void;
  onOpenSubdivideModal?: () => void;
  hasTerritories: boolean;
  readOnly?: boolean;
  borderAdaptationMode?: BorderAdaptationMode;
  onSelectBorderAdaptationMode?: (mode: BorderAdaptationMode) => void;
  // Drawing tool controls
  targetDrawType?: DrawZoneType;
  onSetTargetDrawType?: (type: DrawZoneType) => void;
  drawMethod?: 'freehand' | 'polygon';
  onSetDrawMethod?: (method: 'freehand' | 'polygon') => void;
  brushThickness?: number;
  onSetBrushThickness?: (thickness: number) => void;
  drawColor?: string;
  onSetDrawColor?: (color: string) => void;
  drawnPointsCount?: number;
  onScaleDrawnPoints?: (factor: number) => void;
  onCompleteDrawZone?: () => void;
  onResetDrawZone?: () => void;
  territories?: Territory[];
  selectedTerritoryId?: string | null;
  onAppendDrawZone?: (targetTerritoryId: string) => void;
  onSubdivideDrawZone?: (targetTerritoryId: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
}

export const WorldMapToolbar: React.FC<WorldMapToolbarProps> = ({
  zoomScale,
  onZoomIn,
  onZoomOut,
  onResetView,
  isExpandedHeight,
  onToggleExpandedHeight,
  isFullscreen,
  onToggleFullscreen,
  currentDetailLevel,
  activePlacementTool,
  onSelectPlacementTool,
  mapLayerMode = 'all',
  onSelectMapLayerMode,
  showLegend,
  onToggleLegend,
  onOpenSmartFill,
  onOpenWorldCreator,
  onSyncFromCodex,
  onOpenDeleteAll,
  onAutoConnectRoads,
  onOpenSubdivideModal,
  hasTerritories,
  readOnly = false,
  borderAdaptationMode = 'selected_only',
  onSelectBorderAdaptationMode,
  targetDrawType = 'koenigreich',
  onSetTargetDrawType,
  drawMethod = 'freehand',
  onSetDrawMethod,
  brushThickness = 3,
  onSetBrushThickness,
  drawColor = '#dc2626',
  onSetDrawColor,
  drawnPointsCount = 0,
  onScaleDrawnPoints,
  onCompleteDrawZone,
  onResetDrawZone,
  territories = [],
  selectedTerritoryId = null,
  onAppendDrawZone,
  onSubdivideDrawZone,
  onUndo,
  canUndo = false,
  onRedo,
  canRedo = false
}) => {
  const detailCfg = DETAIL_LEVEL_CONFIG[currentDetailLevel];
  const [selectedSettlementType, setSelectedSettlementType] = React.useState<string>('stadt');
  const [isBiomePaletteOpen, setIsBiomePaletteOpen] = React.useState<boolean>(() => {
    return activePlacementTool ? activePlacementTool.startsWith('biome_') : false;
  });

  // Candidate zones for appending drawn points
  const candidateAppendZones = React.useMemo(() => {
    return territories.filter(t => t.type !== 'welt' && t.type !== 'fluss' && t.type !== 'weg');
  }, [territories]);

  // Candidate parent seas/zones for subdividing directly while drawing
  const candidateSubdivideZones = React.useMemo(() => {
    return territories.filter(t => 
      t.type === 'meer' || 
      t.type === 'ozean' || 
      t.type === 'wasser' || 
      t.type === 'kontinent' || 
      t.type === 'koenigreich' || 
      t.type === 'land' || 
      (t.points && t.points.length >= 3)
    );
  }, [territories]);

  const [appendTargetId, setAppendTargetId] = React.useState<string>('');
  const [subdivideTargetId, setSubdivideTargetId] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedTerritoryId && candidateAppendZones.some(t => t.id === selectedTerritoryId)) {
      setAppendTargetId(selectedTerritoryId);
    } else if (candidateAppendZones.length > 0 && !candidateAppendZones.some(t => t.id === appendTargetId)) {
      setAppendTargetId(candidateAppendZones[0].id);
    }

    if (selectedTerritoryId && candidateSubdivideZones.some(t => t.id === selectedTerritoryId)) {
      setSubdivideTargetId(selectedTerritoryId);
    } else if (candidateSubdivideZones.length > 0 && !candidateSubdivideZones.some(t => t.id === subdivideTargetId)) {
      const seaCandidate = candidateSubdivideZones.find(t => t.type === 'meer' || t.type === 'ozean');
      setSubdivideTargetId(seaCandidate ? seaCandidate.id : candidateSubdivideZones[0].id);
    }
  }, [selectedTerritoryId, candidateAppendZones, candidateSubdivideZones]);

  const isSettlementActive = SETTLEMENT_PLACEMENT_OPTIONS.some(opt => opt.value === activePlacementTool);
  const currentSettlementOption = SETTLEMENT_PLACEMENT_OPTIONS.find(opt => 
    isSettlementActive ? opt.value === activePlacementTool : opt.value === selectedSettlementType
  ) || SETTLEMENT_PLACEMENT_OPTIONS[4];

  React.useEffect(() => {
    if (activePlacementTool && activePlacementTool.startsWith('biome_')) {
      setIsBiomePaletteOpen(true);
    }
  }, [activePlacementTool]);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex flex-col gap-1.5 z-20 backdrop-blur-md">
      {/* Top Main Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        
        {/* Title & Status */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-amber-400 tracking-wider uppercase">
                Weltkarte & Zonen-Atlas
              </h3>
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-[9px] font-bold flex items-center gap-1">
                <span>Zoom: {Math.round(zoomScale * 100)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Tools & Zoom */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Map Layer Mode Switcher: Geografie vs. Territorien vs. Alle */}
          {onSelectMapLayerMode && (
            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5 gap-0.5">
              <button
                onClick={() => onSelectMapLayerMode('all')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  mapLayerMode === 'all'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alle Ebenen anzeigen (Geografie + Territorien)"
              >
                Alle Ebenen
              </button>
              <button
                onClick={() => onSelectMapLayerMode('geography')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  mapLayerMode === 'geography'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Nur Physische Geografie (Kontinente, Meere, Inseln, Biome & Küsten)"
              >
                Geografie
              </button>
              <button
                onClick={() => onSelectMapLayerMode('territories')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  mapLayerMode === 'territories'
                    ? 'bg-indigo-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Nur Politische Territorien & Fraktionen (Herrschaftsbereiche & Kriegsgebiete)"
              >
                Territorien
              </button>
            </div>
          )}

          {/* Border Adaptation Mode Toggle */}
          {onSelectBorderAdaptationMode && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-0.5 text-[10px]">
              <span className="text-slate-400 font-bold px-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span className="hidden xl:inline">Grenzen:</span>
              </span>
              <button
                onClick={() => onSelectBorderAdaptationMode('selected_only')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  borderAdaptationMode === 'selected_only'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Nur das aktuell ausgewählte Gebiet passt seine Form an Nachbarn an"
              >
                Nur ausgewählt
              </button>
              <button
                onClick={() => onSelectBorderAdaptationMode('all')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  borderAdaptationMode === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Alle angrenzenden Gebiete passen ihre Grenzen automatisch an"
              >
                Alle
              </button>
              <button
                onClick={() => onSelectBorderAdaptationMode('off')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  borderAdaptationMode === 'off'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Keine automatische Grenzanpassung"
              >
                Aus
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5 gap-0.5">
            <button
              onClick={onZoomOut}
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Herauszoomen"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-amber-400 w-10 text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Hineinzoomen"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetView}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Ansicht zentrieren"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            {onUndo && (
              <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`p-1 rounded-md transition-colors flex items-center gap-1 ${
                    canUndo
                      ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800 cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Letzten Schritt rückgängig machen (Strg+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold hidden md:inline">Zurück</span>
                </button>
                {onRedo && (
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-1 rounded-md transition-colors flex items-center gap-1 ${
                      canRedo
                        ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800 cursor-pointer'
                        : 'text-slate-600 cursor-not-allowed opacity-40'
                    }`}
                    title="Wiederholen (Strg+Y)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onToggleLegend}
              className={`p-1 rounded-lg transition-colors ${
                showLegend ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Legende ein/ausblenden"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleExpandedHeight}
              className={`p-1 rounded-lg transition-colors ${
                isExpandedHeight ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isExpandedHeight ? 'Kartenhöhe komprimieren' : 'Kartenhöhe erweitern'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleFullscreen}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                isFullscreen ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Vollbildmodus"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">{isFullscreen ? 'Beenden' : 'Vollbild'}</span>
            </button>
          </div>

          {/* Sync & Creator Buttons */}
          {!readOnly && (
            <>
              {onOpenSmartFill && (
                <button
                  onClick={onOpenSmartFill}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                  title="Smart Fill: Automatische Karte mit Flüssen, Bergen, Städten & Meeren zeichnen"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-current" />
                  <span>Smart Fill</span>
                </button>
              )}

              <button
                onClick={onSyncFromCodex}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-sm"
                title="Aktualisiert die Weltkarte mit allen Orten aus dem Codex"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Codex-Sync</span>
              </button>

              <button
                onClick={onOpenWorldCreator}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                title="Welten-Schöpfer & Archetyp-Generator öffnen"
              >
                <span>Welten-Schöpfer</span>
              </button>

              {onOpenSubdivideModal && hasTerritories && (
                <button
                  onClick={onOpenSubdivideModal}
                  className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-600/50 text-sky-300 hover:text-sky-100 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Meer oder großes Gebiet in Zonen (z.B. Calm Belts, Grand Line, Sektoren) unterteilen"
                >
                  <Scissors className="w-3 h-3 text-sky-400" />
                  <span>Meer in Zonen teilen</span>
                </button>
              )}

              {hasTerritories && (
                <button
                  onClick={onOpenDeleteAll}
                  className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 hover:text-red-300 text-[10px] transition-all"
                  title="Alle Einträge von der Weltkarte löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* QUICK PLACEMENT & ZONE TOOLBAR (Direktes Platzieren) */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Direkt platzieren:</span>
            </span>

            {/* Schritt zurück / Undo Button */}
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                  canUndo
                    ? 'bg-slate-800/90 border-slate-600 text-amber-300 hover:bg-slate-700 hover:border-amber-400 cursor-pointer shadow-sm active:scale-95'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-40'
                }`}
                title="Letzten Schritt rückgängig machen (Strg+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Zurück</span>
              </button>
            )}

            {/* Zone frei zeichnen */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'draw_zone' ? null : 'draw_zone')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border ${
                activePlacementTool === 'draw_zone'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 scale-105 animate-pulse'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400'
              }`}
              title="Zeichne eine eigene Zonen-Linie frei auf der Leinwand und wähle anschließend den Typ (Meer, Land, Königreich, Insel, See...)"
            >
              <Pencil className="w-4 h-4 text-amber-400" />
              <span>Zone frei zeichnen</span>
            </button>

            {/* Ort / Siedlung platzieren */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (isSettlementActive) {
                    onSelectPlacementTool(null);
                  } else {
                    onSelectPlacementTool(selectedSettlementType as PlacementTool);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  isSettlementActive
                    ? 'bg-indigo-500 text-slate-950 border border-indigo-400 font-black shadow-md scale-105 animate-pulse'
                    : 'bg-indigo-950/40 border border-indigo-700/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
                }`}
                title={`Klicke auf die Karte, um ${currentSettlementOption.label} zu platzieren (oder wähle einen anderen Ort aus dem Menü)`}
              >
                <span>{isSettlementActive ? `+ Platziere ${currentSettlementOption.sizeLabel}` : '+ Ort / Siedlung'}</span>
              </button>

              <select
                value={isSettlementActive ? (activePlacementTool as string) : selectedSettlementType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSettlementType(val);
                  onSelectPlacementTool(val as PlacementTool);
                }}
                className="bg-slate-900 text-amber-300 font-black text-xs px-2 py-1 rounded border border-indigo-500/40 hover:border-indigo-400 focus:outline-none focus:border-indigo-400 cursor-pointer max-w-[210px]"
                title="Wähle die Art und Größe des Ortes (Weiler, Dorf, Kleinstadt, Metropole, Burg, Festung, Tempel...)"
              >
                <optgroup label="Dörfer & Siedlungen">
                  {SETTLEMENT_PLACEMENT_OPTIONS.filter(o => o.category === 'Dörfer & Siedlungen').map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Städte & Metropolen">
                  {SETTLEMENT_PLACEMENT_OPTIONS.filter(o => o.category === 'Städte & Metropolen').map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Burgen & Festungen">
                  {SETTLEMENT_PLACEMENT_OPTIONS.filter(o => o.category === 'Burgen & Festungen').map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Besondere Orte">
                  {SETTLEMENT_PLACEMENT_OPTIONS.filter(o => o.category === 'Besondere Orte').map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {/* Versetzen */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'versetzen' ? null : 'versetzen')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                activePlacementTool === 'versetzen'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg scale-105 ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/80 hover:text-white'
              }`}
              title="Aktiviert den Versetz-Modus: Klicke ein Objekt an oder klicke auf die Karte, um ein gewähltes Gebiet frei zu verschieben"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Versetzen</span>
            </button>

            {/* Biom Palette Toggle */}
            <button
              onClick={() => setIsBiomePaletteOpen(!isBiomePaletteOpen)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                isBiomePaletteOpen || (activePlacementTool && activePlacementTool.startsWith('biome_'))
                  ? 'bg-teal-500 text-slate-950 border-teal-300 font-black shadow-md'
                  : 'bg-teal-950/40 border-teal-700/50 text-teal-300 hover:bg-teal-900/60'
              }`}
              title="Biom-Palette öffnen/schließen, um Landschaftsfelder zu zeichnen"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Biom malen {isBiomePaletteOpen ? '▴' : '▾'}</span>
            </button>
            
            {/* Straßen verbinden */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'connect_weg' ? null : 'connect_weg')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                activePlacementTool === 'connect_weg'
                  ? 'bg-orange-500 text-slate-950 border-orange-400 font-black shadow-md scale-105'
                  : 'bg-orange-950/40 border-orange-700/50 text-orange-300 hover:bg-orange-900/60'
              }`}
              title="Klicke auf zwei Orte (Stadt, Dorf, Festung), um einen Weg zwischen ihnen zu zeichnen"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Orte verbinden</span>
            </button>

            {/* Auto Straßennetz */}
            {onAutoConnectRoads && (
              <button
                onClick={onAutoConnectRoads}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Generiert automatisch ein Straßennetz, das alle Orte auf denselben Landmassen miteinander verbindet"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Auto-Straßennetz</span>
              </button>
            )}
          </div>

          {/* Active Placement Tool Banner Cue */}
          {activePlacementTool && (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-300 animate-pulse shrink-0">
              <span>
                {activePlacementTool === 'versetzen'
                  ? 'Modus: Versetzen'
                  : activePlacementTool.startsWith('biome_')
                    ? `Biom: ${activePlacementTool.replace('biome_', '').toUpperCase()}`
                    : `Platzieren: ${activePlacementTool.toUpperCase()}`}
              </span>
              <button
                onClick={() => onSelectPlacementTool(null)}
                className="p-0.5 hover:bg-amber-500/30 rounded text-amber-200"
                title="Modus beenden"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ZONEN-ZEICHNER DEDICATED TOOLBAR SUB-BAR */}
      {!readOnly && activePlacementTool === 'draw_zone' && (() => {
        const isInside = INSIDE_DRAW_TYPES.some(t => t.value === targetDrawType);
        const currentCategory: 'outside' | 'inside' = isInside ? 'inside' : 'outside';

        return (
          <div className="mt-2 p-2.5 bg-slate-900/95 border border-amber-500/80 rounded-xl flex flex-col gap-2.5 text-white shadow-xl animate-in slide-in-from-top-1 duration-200 w-full max-w-full">
            {/* TOP ROW: Type selection, Points Count, Brush Modes & Thickness */}
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zeichnen:</span>
                </span>

                {/* 1. KATEGORIE-MENÜ: AUßERHALB VS. INNERHALB EINER ZONE */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentCategory !== 'outside' && onSetTargetDrawType) {
                        onSetTargetDrawType('koenigreich');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      currentCategory === 'outside'
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title="Landmassen, Kontinente, Inseln, Red Line und Meere großflächig auf der Weltkarte"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Landmassen & Meere</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentCategory !== 'inside' && onSetTargetDrawType) {
                        onSetTargetDrawType('zone');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      currentCategory === 'inside'
                        ? 'bg-teal-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title="Territorien (Königreiche, Imperien), Wälder, Gebirge, Binnenseen, Flüsse und Pfade innerhalb einer Zone"
                  >
                    <Mountain className="w-3 h-3" />
                    <span>Territorien & Details</span>
                  </button>
                </div>

                {/* 2. SPEZIFISCHES OBJEKT-MENÜ (Passend zur gewählten Kategorie) */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 shrink-0">
                  <select
                    value={targetDrawType}
                    onChange={(e) => onSetTargetDrawType && onSetTargetDrawType(e.target.value as DrawZoneType)}
                    className="bg-slate-900 text-amber-300 font-black text-xs px-2.5 py-1 rounded border border-amber-500/50 hover:border-amber-400 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[160px] truncate"
                    title="Wähle das zu zeichnende Element aus"
                  >
                    {currentCategory === 'outside' ? (
                      OUTSIDE_DRAW_TYPES.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))
                    ) : (
                      INSIDE_DRAW_TYPES.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <span className="text-[11px] text-slate-300 font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 inline-flex items-center gap-1">
                  <span className="text-amber-400 font-black">{drawnPointsCount}</span>
                  <span>{drawnPointsCount === 1 ? 'Punkt' : 'Punkte'}</span>
                </span>
              </div>

              {/* MODE SELECTOR & BRUSH THICKNESS */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-1 shrink-0">
                  <button
                    onClick={() => onSetDrawMethod && onSetDrawMethod('freehand')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      drawMethod === 'freehand' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pinsel
                  </button>
                  <button
                    onClick={() => onSetDrawMethod && onSetDrawMethod('polygon')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      drawMethod === 'polygon' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linie
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] shrink-0">
                  <span className="text-slate-400 font-bold mr-1 hidden sm:inline">Dicke:</span>
                  <button
                    onClick={() => onSetBrushThickness && onSetBrushThickness(3.0)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${brushThickness === 3.0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    title="Feiner Pinsel (3.0)"
                  >
                    Fein
                  </button>
                  <button
                    onClick={() => onSetBrushThickness && onSetBrushThickness(6.0)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${brushThickness === 6.0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    title="Mittlerer Pinsel (6.0)"
                  >
                    Mittel
                  </button>
                  <button
                    onClick={() => onSetBrushThickness && onSetBrushThickness(12.0)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${brushThickness === 12.0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    title="Insel-Pinsel (12.0)"
                  >
                    Insel
                  </button>
                  <button
                    onClick={() => onSetBrushThickness && onSetBrushThickness(24.0)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${brushThickness === 24.0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    title="Riesiger Landmassen-Pinsel (24.0)"
                  >
                    Riesig
                  </button>
                </div>

                {/* Live Shape Rescaling (Before Saving) */}
                {onScaleDrawnPoints && drawnPointsCount >= 2 && (
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                    <span className="text-[10px] font-bold text-amber-400 mr-1">Größe:</span>
                    <button
                      type="button"
                      onClick={() => onScaleDrawnPoints(1.5)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold rounded text-[10px] transition-all"
                      title="Gezeichnete Form um 50% vergrößern"
                    >
                      x1.5
                    </button>
                    <button
                      type="button"
                      onClick={() => onScaleDrawnPoints(2.0)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold rounded text-[10px] transition-all"
                      title="Gezeichnete Form verdoppeln"
                    >
                      x2
                    </button>
                    <button
                      type="button"
                      onClick={() => onScaleDrawnPoints(3.0)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold rounded text-[10px] transition-all"
                      title="Gezeichnete Form verdreifachen"
                    >
                      x3
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECOND ROW: Color Palette & Action Buttons (Clean Wrapping) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 w-full">
              {/* COLOR PALETTE */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg shrink-0">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mr-1">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Farbe:</span>
                </span>
                
                {DRAW_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => onSetDrawColor && onSetDrawColor(preset.color)}
                    className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center ${
                      drawColor.toLowerCase() === preset.color.toLowerCase()
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-125 z-10 shadow-lg'
                        : 'border-slate-700 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.label}
                  />
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center ml-1">
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => onSetDrawColor && onSetDrawColor(e.target.value)}
                    className="w-5 h-5 rounded border border-slate-700 bg-transparent cursor-pointer hover:border-amber-400"
                    title="Eigene Farbe wählen"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS (Direct Save, Subdivide, Append, Reset, Cancel) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 1. Save as new zone */}
                <button
                  onClick={onCompleteDrawZone}
                  disabled={drawnPointsCount < 2}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                    drawnPointsCount >= 2
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md animate-pulse cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Speichert die gezeichneten Punkte als ein neues, eigenständiges Gebiet"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Als neue Zone</span>
                </button>

                {/* 2. Direct Meer / Gebiet in Zonen unterteilen */}
                {onSubdivideDrawZone && candidateSubdivideZones.length > 0 && (
                  <div className="flex items-center bg-indigo-950/80 border border-indigo-500/50 rounded-lg p-0.5 gap-1 shrink-0">
                    <select
                      value={subdivideTargetId}
                      onChange={(e) => setSubdivideTargetId(e.target.value)}
                      className="bg-slate-900 text-indigo-200 text-xs px-2 py-1 rounded border border-indigo-500/40 focus:outline-none w-24 sm:w-32 max-w-[130px] truncate cursor-pointer font-bold"
                      title="Wähle das Meer oder Gebiet aus, das mit deiner Zeichnung unterteilt werden soll"
                    >
                      {candidateSubdivideZones.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name || t.id}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => subdivideTargetId && onSubdivideDrawZone(subdivideTargetId)}
                      disabled={drawnPointsCount < 2 || !subdivideTargetId}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                        drawnPointsCount >= 2 && subdivideTargetId
                          ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-md cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title="Schneidet die gezeichnete Fläche direkt als neue Teilzone aus dem gewählten Meer / Gebiet heraus"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Meer unterteilen</span>
                    </button>
                  </div>
                )}

                {/* 3. Append to existing zone */}
                {onAppendDrawZone && candidateAppendZones.length > 0 && (
                  <div className="flex items-center bg-sky-950/80 border border-sky-500/50 rounded-lg p-0.5 gap-1 shrink-0">
                    <select
                      value={appendTargetId}
                      onChange={(e) => setAppendTargetId(e.target.value)}
                      className="bg-slate-900 text-sky-200 text-xs px-2 py-1 rounded border border-sky-500/40 focus:outline-none w-24 sm:w-28 max-w-[120px] truncate cursor-pointer font-bold"
                      title="Wähle die bestehende Zone aus, an die deine Zeichnung angefügt werden soll"
                    >
                      {candidateAppendZones.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name || t.id}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => appendTargetId && onAppendDrawZone(appendTargetId)}
                      disabled={drawnPointsCount < 2 || !appendTargetId}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                        drawnPointsCount >= 2 && appendTargetId
                          ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 shadow-md cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title="Fügt die gezeichnete Fläche direkt und nahtlos an die ausgewählte Zone an"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>An Zone anfügen</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={onResetDrawZone}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="Gezeichnete Punkte zurücksetzen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zurücksetzen</span>
                </button>

                <button
                  onClick={() => onSelectPlacementTool(null)}
                  className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-900/50 text-red-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="Zeichenmodus beenden"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Abbrechen</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BIOME DRAWING PALETTE (Biom-Palette - Nur sichtbar wenn aktiviert) */}
      {!readOnly && isBiomePaletteOpen && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-800/80 animate-in slide-in-from-top-1 duration-150 w-full max-w-full">
          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <span>Biom wählen:</span>
            </span>

            {/* Grasland */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_gras' ? null : 'biome_gras')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_gras'
                  ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60'
              }`}
              title="Grasland-Feld zeichnen"
            >
              <span>Grasland</span>
            </button>

            {/* Wald */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_wald' ? null : 'biome_wald')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_wald'
                  ? 'bg-emerald-800 text-white border-emerald-400 font-black shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900'
              }`}
              title="Wald-Feld zeichnen"
            >
              <span>Wald</span>
            </button>

            {/* Gebirge */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_gebirge' ? null : 'biome_gebirge')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_gebirge'
                  ? 'bg-slate-700 text-white border-slate-400 font-black shadow-md ring-2 ring-slate-400/50'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Gebirge zeichnen"
            >
              <span>Gebirge</span>
            </button>

            {/* Wasser */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_wasser' ? null : 'biome_wasser')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_wasser'
                  ? 'bg-sky-600 text-white border-sky-400 font-black shadow-md ring-2 ring-sky-400/50'
                  : 'bg-sky-950/60 border-sky-700/60 text-sky-300 hover:bg-sky-900'
              }`}
              title="Wasser-Feld zeichnen"
            >
              <span>Wasser</span>
            </button>

            {/* Wüste */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_wueste' ? null : 'biome_wueste')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_wueste'
                  ? 'bg-amber-600 text-slate-950 border-amber-300 font-black shadow-md ring-2 ring-amber-300/50'
                  : 'bg-amber-950/50 border-amber-800/60 text-amber-300 hover:bg-amber-900'
              }`}
              title="Wüsten-Feld zeichnen"
            >
              <span>Wüste</span>
            </button>

            {/* Schnee */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_schnee' ? null : 'biome_schnee')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_schnee'
                  ? 'bg-slate-200 text-slate-950 border-white font-black shadow-md ring-2 ring-white/50'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
              title="Schnee-Feld zeichnen"
            >
              <span>Schnee</span>
            </button>

            {/* Sumpf */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_sumpf' ? null : 'biome_sumpf')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_sumpf'
                  ? 'bg-teal-700 text-white border-teal-400 font-black shadow-md ring-2 ring-teal-400/50'
                  : 'bg-teal-950/60 border-teal-800/60 text-teal-300 hover:bg-teal-900'
              }`}
              title="Sumpf-Feld zeichnen"
            >
              <span>Sumpf</span>
            </button>

            {/* Vulkan */}
            <button
              onClick={() => onSelectPlacementTool(activePlacementTool === 'biome_vulkan' ? null : 'biome_vulkan')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 border ${
                activePlacementTool === 'biome_vulkan'
                  ? 'bg-red-800 text-white border-red-400 font-black shadow-md ring-2 ring-red-400/50'
                  : 'bg-red-950/60 border-red-800/60 text-red-300 hover:bg-red-900'
              }`}
              title="Vulkan-Feld zeichnen"
            >
              <span>Vulkan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
