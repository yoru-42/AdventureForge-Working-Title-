import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { WorldSetting, LoreEntry, Territory } from '../types';
import { 
  Compass, 
  X, 
  Trash2, 
  Plus,
  Mountain,
  Palmtree,
  Waves,
  Move,
  ArrowLeft,
  MapPin,
  Building2,
  Castle,
  Globe,
  Layers
} from 'lucide-react';
import { TacticalCanvasEditor } from './TacticalCanvasEditor';
import { StylizedLocalTownMap } from './worldmap/StylizedLocalTownMap';
import {
  ZoomDetailLevel,
  DETAIL_LEVEL_CONFIG,
  BorderAdaptationMode,
  getTerritoryLineage,
  createOrganicIslandPoints,
  createPuzzleConformedPoints,
  getTerritoryOrganicPoints,
  getAutomaticCoastline,
  getConformedSeaGeometry,
  getConformedTerritoryGeometry,
  getTerritoryPolygonRing,
  getCoastlineContacts,
  resolveDragCollision,
  pointsToSvgPath,
  ringToSvgPath,
  pointsToOpenSvgPath,
  closeDrawnPointsWithNeighbors,
  mergePointsIntoTerritory,
  getIslandBiomeStyle,
  buildTerritoriesFromCodexAndWorld,
  resolveTerritoryCollisions,
  moveTerritoryWithChildren,
  getContainedTerritories,
  getBiomeConfig,
  WORLDMAP_BIOMES,
  isPointInPolygon,
  autoAdjustParentContainerBounds
} from './worldmap/worldMapData';
import { ShiftModal, HierarchyDrawer } from './worldmap/WorldMapModals';
import { WorldMapCreatorModal } from './WorldMapCreatorModal';
import { WorldMapSmartFillModal } from './worldmap/WorldMapSmartFillModal';
import { WorldMapSubdivideModal } from './worldmap/WorldMapSubdivideModal';
import { WorldMapToolbar, PlacementTool, MapLayerMode, DrawZoneType } from './worldmap/WorldMapToolbar';
import { WorldMapInspector } from './worldmap/WorldMapInspector';

const DRAW_ZONE_CONFIGS: Record<DrawZoneType, { type: Territory['type']; defaultColor: string; defaultName: string }> = {
  koenigreich: { type: 'koenigreich', defaultColor: '#15803d', defaultName: 'Landmasse' },
  red_line: { type: 'koenigreich', defaultColor: '#dc2626', defaultName: 'Red Line / Felsbarriere' },
  meer: { type: 'meer', defaultColor: '#0284c7', defaultName: 'Gezeichnetes Meer' },
  calm_belt: { type: 'meer', defaultColor: '#38bdf8', defaultName: 'Calm Belt / Meereszone' },
  insel: { type: 'insel', defaultColor: '#16a34a', defaultName: 'Gezeichnete Insel' },
  region: { type: 'region', defaultColor: '#475569', defaultName: 'Gezeichnete Region' },
  biome_wald: { type: 'biome_wald', defaultColor: '#065f46', defaultName: 'Dichter Wald' },
  biome_gebirge: { type: 'biome_gebirge', defaultColor: '#475569', defaultName: 'Bergmassiv' },
  see: { type: 'see', defaultColor: '#0ea5e9', defaultName: 'Binnensee' },
  fluss: { type: 'fluss', defaultColor: '#38bdf8', defaultName: 'Flusslauf' },
  weg: { type: 'weg', defaultColor: '#d97706', defaultName: 'Straße / Weg' },
  zone: { type: 'zone', defaultColor: '#6366f1', defaultName: 'Territorium' },
};

const SETTLEMENT_CONFIGS: Record<string, { type: Territory['type']; defaultName: string; defaultRadius: number; defaultColor: string }> = {
  dorf_klein: { type: 'dorf', defaultName: 'Weiler', defaultRadius: 1.6, defaultColor: '#10b981' },
  dorf: { type: 'dorf', defaultName: 'Dorf', defaultRadius: 2.2, defaultColor: '#10b981' },
  dorf_gross: { type: 'dorf', defaultName: 'Großdorf', defaultRadius: 2.8, defaultColor: '#10b981' },
  stadt_klein: { type: 'stadt', defaultName: 'Kleinstadt', defaultRadius: 3.2, defaultColor: '#6366f1' },
  stadt: { type: 'stadt', defaultName: 'Stadt', defaultRadius: 4.0, defaultColor: '#6366f1' },
  hafen: { type: 'hafen', defaultName: 'Hafenstadt', defaultRadius: 3.8, defaultColor: '#0ea5e9' },
  metropole: { type: 'stadt', defaultName: 'Metropole / Hauptstadt', defaultRadius: 5.5, defaultColor: '#8b5cf6' },
  aussenposten: { type: 'festung', defaultName: 'Außenposten / Wachturm', defaultRadius: 1.8, defaultColor: '#dc2626' },
  burg: { type: 'festung', defaultName: 'Burg / Feste', defaultRadius: 3.0, defaultColor: '#dc2626' },
  festung: { type: 'festung', defaultName: 'Große Festung / Zitadelle', defaultRadius: 4.5, defaultColor: '#dc2626' },
  tempel: { type: 'ort', defaultName: 'Tempel / Heiligtum', defaultRadius: 2.5, defaultColor: '#f59e0b' },
  mine: { type: 'ort', defaultName: 'Mine / Steinbruch', defaultRadius: 2.0, defaultColor: '#78716c' },
  ruinen: { type: 'ort', defaultName: 'Alte Ruinen', defaultRadius: 2.6, defaultColor: '#a855f7' },
  oase: { type: 'ort', defaultName: 'Oase / Quelle', defaultRadius: 2.2, defaultColor: '#06b6d4' },
};

interface InteractiveWorldMapProps {
  world: WorldSetting;
  onChangeWorld: React.Dispatch<React.SetStateAction<WorldSetting>>;
  loreDatabase: LoreEntry[];
  onUpdateLore?: (updater: LoreEntry[] | ((prev: LoreEntry[]) => LoreEntry[])) => void;
  onSendToChatLog?: (text: string) => void;
  readOnly?: boolean;
}

export const InteractiveWorldMap: React.FC<InteractiveWorldMapProps> = ({
  world,
  onChangeWorld,
  loreDatabase,
  onUpdateLore,
  onSendToChatLog,
  readOnly = false
}) => {
  // Modal states
  const [isSmartFillModalOpen, setIsSmartFillModalOpen] = useState<boolean>(false);
  const [isWorldCreatorModalOpen, setIsWorldCreatorModalOpen] = useState<boolean>(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState<boolean>(false);
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [shiftTargetId, setShiftTargetId] = useState<string | null>(null);
  const [shiftNewFaction, setShiftNewFaction] = useState<string>('');
  const [shiftConflictDescription, setShiftConflictDescription] = useState<string>('');
  const [shiftIsWarZone, setShiftIsWarZone] = useState<boolean>(true);
  const [shiftControlPercentage, setShiftControlPercentage] = useState<number>(80);
  const [isHierarchyTreeOpen, setIsHierarchyTreeOpen] = useState<boolean>(false);
  const [isSubdivideModalOpen, setIsSubdivideModalOpen] = useState<boolean>(false);
  const [subdivideTargetTerritory, setSubdivideTargetTerritory] = useState<Territory | null>(null);

  // Map Layer Filter Mode ('all' | 'geography' | 'territories')
  const [mapLayerMode, setMapLayerMode] = useState<MapLayerMode>('all');

  // Active Placement Tool (e.g. 'meer' | 'kontinent' | 'insel' | 'stadt' | 'festung')
  const [activePlacementTool, setActivePlacementTool] = useState<PlacementTool>(null);

  // Ensure territories exist and preserve exact coordinates
  const territories = useMemo(() => {
    let raw: Territory[] = [];
    if (world.territories !== undefined) {
      raw = world.territories.filter(t => 
        !['terr-1', 'terr-2', 'terr-3', 'terr-20', 'terr-21', 'terr-22', 'terr-23', 'terr-24', 'continent-main', 'continent-west', 'continent-southwest', 'continent-southeast'].includes(t.id) &&
        !['Aethelgard', 'Schatten-Festung Karath', 'Wilde Westlande', 'Valoria'].some(bad => t.name.includes(bad))
      );
    } else {
      raw = buildTerritoriesFromCodexAndWorld(world, loreDatabase);
    }

    const seen = new Set<string>();
    const unique: Territory[] = [];
    for (const t of raw) {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }
    return unique;
  }, [world.territories, loreDatabase, world]);

  // Stable Render Layer Sorting: Sea -> Continents -> Islands -> Biomes -> POIs
  const sortedTerritories = useMemo(() => {
    const getOrder = (t: Territory) => {
      if (t.type === 'meer' || t.type === 'ozean' || t.type === 'wasser') return 1;
      if (t.type === 'kontinent') return 2;
      if (t.type === 'insel') return 3;
      if (t.type.startsWith('biome_')) return 4;
      return 5;
    };
    return [...territories].sort((a, b) => getOrder(a) - getOrder(b));
  }, [territories]);

  // Zoom & Pan state (Center is 120, 70 in 240x140 coordinate system)
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExpandedHeight, setIsExpandedHeight] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [borderAdaptationMode, setBorderAdaptationMode] = useState<BorderAdaptationMode>('all');

  // Selection & Hover State
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(() => {
    return territories.length > 0 ? territories[0].id : null;
  });
  const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);
  const [draggingTerritoryId, setDraggingTerritoryId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // View Mode: Macro World Map vs Micro Town/Village/Local Map
  const [activeViewMode, setActiveViewMode] = useState<'world_map' | 'local_map'>('world_map');
  const [activeLocalTerritoryId, setActiveLocalTerritoryId] = useState<string | null>(null);

  const activeLocalTerritory = useMemo(() => {
    return territories.find(t => t.id === activeLocalTerritoryId) ||
           territories.find(t => t.id === selectedTerritoryId) ||
           territories.find(t => t.type === 'stadt' || t.type === 'dorf' || t.type === 'hafen' || t.type === 'festung') ||
           territories[0] || null;
  }, [territories, activeLocalTerritoryId, selectedTerritoryId]);

  const handleOpenLocalMap = (terr: Territory) => {
    setSelectedTerritoryId(terr.id);
    setActiveLocalTerritoryId(terr.id);
    setActiveViewMode('local_map');
  };

  const handleUpdateLocalTileData = (newTileData: any) => {
    if (!activeLocalTerritory) return;
    const updated = {
      ...activeLocalTerritory,
      tileData: newTileData
    };
    handleUpdateTerritory(updated);
  };

  // Freehand Zone Drawing States
  const [targetDrawType, setTargetDrawType] = useState<DrawZoneType>('koenigreich');
  const [drawColor, setDrawColor] = useState<string>('#dc2626');
  const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawMethod, setDrawMethod] = useState<'freehand' | 'polygon'>('freehand'); // 'freehand' (Pinsel/Ziehen) vs 'polygon' (Linie/Klick-Punkte)
  const [brushThickness, setBrushThickness] = useState<number>(3.0);
  const [currentCursorPos, setCurrentCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingPointerDown, setIsDrawingPointerDown] = useState<boolean>(false);
  const [connectPathStartId, setConnectPathStartId] = useState<string | null>(null);

  // Map History (Undo / Redo Stack)
  interface MapHistorySnapshot {
    territories: Territory[];
    connections?: any[];
    isOnePiece?: boolean;
  }

  const [historyStack, setHistoryStack] = useState<MapHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<MapHistorySnapshot[]>([]);
  const dragStartSnapshotRef = useRef<MapHistorySnapshot | null>(null);

  // Helper to record history before mutating the world map
  const recordHistory = useCallback(() => {
    const currentSnapshot: MapHistorySnapshot = {
      territories: JSON.parse(JSON.stringify(territories)),
      connections: world.connections ? JSON.parse(JSON.stringify(world.connections)) : [],
      isOnePiece: world.isOnePiece
    };
    setHistoryStack(prev => [...prev.slice(-40), currentSnapshot]);
    setRedoStack([]);
  }, [territories, world.connections, world.isOnePiece]);

  // Undo (Schritt zurück)
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    const newHistory = historyStack.slice(0, historyStack.length - 1);

    const currentSnapshot: MapHistorySnapshot = {
      territories: JSON.parse(JSON.stringify(territories)),
      connections: world.connections ? JSON.parse(JSON.stringify(world.connections)) : [],
      isOnePiece: world.isOnePiece
    };

    setRedoStack(prev => [...prev.slice(-40), currentSnapshot]);
    setHistoryStack(newHistory);

    onChangeWorld(prev => ({
      ...prev,
      territories: previousState.territories,
      connections: previousState.connections,
      isOnePiece: previousState.isOnePiece
    }));

    if (selectedTerritoryId && !previousState.territories.some(t => t.id === selectedTerritoryId)) {
      setSelectedTerritoryId(previousState.territories[0]?.id || null);
    }
  }, [historyStack, territories, world.connections, world.isOnePiece, onChangeWorld, selectedTerritoryId]);

  // Redo (Wiederholen)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, redoStack.length - 1);

    const currentSnapshot: MapHistorySnapshot = {
      territories: JSON.parse(JSON.stringify(territories)),
      connections: world.connections ? JSON.parse(JSON.stringify(world.connections)) : [],
      isOnePiece: world.isOnePiece
    };

    setHistoryStack(prev => [...prev.slice(-40), currentSnapshot]);
    setRedoStack(newRedo);

    onChangeWorld(prev => ({
      ...prev,
      territories: nextState.territories,
      connections: nextState.connections,
      isOnePiece: nextState.isOnePiece
    }));
  }, [redoStack, territories, world.connections, world.isOnePiece, onChangeWorld]);

  // Global hotkeys for Undo (Ctrl+Z / Cmd+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Sync default color when targetDrawType changes
  useEffect(() => {
    if (DRAW_ZONE_CONFIGS[targetDrawType]) {
      setDrawColor(DRAW_ZONE_CONFIGS[targetDrawType].defaultColor);
    }
  }, [targetDrawType]);

  useEffect(() => {
    if (activePlacementTool !== 'connect_weg') {
      setConnectPathStartId(null);
    }
  }, [activePlacementTool]);

  // Auto-connect roads logic
  const handleAutoConnectRoads = () => {
    const settlements = territories.filter(t => t.type === 'stadt' || t.type === 'dorf' || t.type === 'festung' || t.type === 'hafen');
    if (settlements.length < 2) return;

    recordHistory();

    // A simple approach: for each settlement, connect to its nearest 1 or 2 neighbors that it isn't already connected to.
    const newRoads: Territory[] = [];
    const connectedPairs = new Set<string>();

    settlements.forEach((s1, i) => {
      // Find distances to all other settlements
      const distances = settlements
        .map((s2, j) => ({ s2, dist: Math.hypot((s1.x ?? 0) - (s2.x ?? 0), (s1.y ?? 0) - (s2.y ?? 0)) }))
        .filter(d => d.s2.id !== s1.id)
        .sort((a, b) => a.dist - b.dist);

      // Connect to the 2 closest (or 1 if only 1 exists)
      const toConnect = distances.slice(0, 2);
      
      toConnect.forEach(target => {
        const s2 = target.s2;
        const pairKey = [s1.id, s2.id].sort().join('-');
        
        if (!connectedPairs.has(pairKey)) {
          connectedPairs.add(pairKey);
          
          const newRoad: Territory = {
            id: `road-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: `Weg (${s1.name} - ${s2.name})`,
            type: 'weg',
            color: '#d97706',
            x: ((s1.x ?? 0) + (s2.x ?? 0)) / 2,
            y: ((s1.y ?? 0) + (s2.y ?? 0)) / 2,
            radius: target.dist / 2,
            description: '',
            parentId: null,
            points: [
              { x: s1.x ?? 0, y: s1.y ?? 0 },
              { x: s2.x ?? 0, y: s2.y ?? 0 }
            ]
          };
          newRoads.push(newRoad);
        }
      });
    });

    if (newRoads.length > 0) {
      onChangeWorld({
        ...world,
        territories: [...territories, ...newRoads]
      });
    }
  };

  const handleConnectRoadClick = (targetId: string) => {
    const target = territories.find(t => t.id === targetId);
    if (!target) return;

    if (!connectPathStartId) {
      setConnectPathStartId(targetId);
    } else {
      if (connectPathStartId === targetId) {
        // Deselect
        setConnectPathStartId(null);
        return;
      }
      const startNode = territories.find(t => t.id === connectPathStartId);
      if (startNode) {
        recordHistory();
        const newRoad: Territory = {
          id: `road-${Date.now()}`,
          name: `Weg (${startNode.name} - ${target.name})`,
          type: 'weg',
          color: '#d97706',
          x: ((startNode.x ?? 0) + (target.x ?? 0)) / 2,
          y: ((startNode.y ?? 0) + (target.y ?? 0)) / 2,
          radius: Math.hypot((startNode.x ?? 0) - (target.x ?? 0), (startNode.y ?? 0) - (target.y ?? 0)) / 2,
          description: '',
          parentId: null,
          points: [
            { x: startNode.x ?? 0, y: startNode.y ?? 0 },
            { x: target.x ?? 0, y: target.y ?? 0 }
          ]
        };
        onChangeWorld({
          ...world,
          territories: [...territories, newRoad]
        });
      }
      // Reset start ID so they can start a new road, or keep it to chain?
      // Chaining is usually better: start -> node A -> node B -> node C
      setConnectPathStartId(targetId);
    }
  };

  // Save hand-drawn zone directly to world with pre-selected type (no intermediate modal!)
  const handleSaveDrawnZoneDirectly = (pointsToSave: { x: number; y: number }[], overrideType?: DrawZoneType) => {
    if (!pointsToSave || pointsToSave.length < 2) return;

    recordHistory();

    const selectedType = overrideType || targetDrawType;
    const config = DRAW_ZONE_CONFIGS[selectedType] || DRAW_ZONE_CONFIGS.koenigreich;
    const isPath = config.type === 'fluss' || config.type === 'weg';

    // Connect endpoints to adjacent neighbor border if started and ended near existing territory
    // Only close if it's not a path!
    let finalPoints = pointsToSave;
    if (!isPath) {
      finalPoints = closeDrawnPointsWithNeighbors(pointsToSave, territories);
    }

    let cx = Math.round((finalPoints.reduce((acc, p) => acc + p.x, 0) / finalPoints.length) * 10) / 10;
    let cy = Math.round((finalPoints.reduce((acc, p) => acc + p.y, 0) / finalPoints.length) * 10) / 10;
    let maxR = Math.max(...finalPoints.map(p => Math.hypot(p.x - cx, p.y - cy)));

    // Auto-scale drawn shape to a healthy minimum size if drawn very small
    if (!isPath && maxR > 0 && maxR < 16) {
      const scaleUp = 16 / maxR;
      finalPoints = finalPoints.map(p => ({
        x: Math.round((cx + (p.x - cx) * scaleUp) * 10) / 10,
        y: Math.round((cy + (p.y - cy) * scaleUp) * 10) / 10
      }));
      maxR = Math.max(...finalPoints.map(p => Math.hypot(p.x - cx, p.y - cy)));
    }

    const finalName = config.defaultName;

    // Auto assign parent if drawn inside a continent or sea
    let autoParentId: string | null = null;
    
    // Check to find the most specific (smallest) parent!
    const possibleParents = territories
      .filter(t => t.type !== 'welt' && t.type !== 'fluss' && t.type !== 'weg')
      .sort((a, b) => (a.radius || 30) - (b.radius || 30));

    for (const p of possibleParents) {
      const dist = Math.hypot((p.x ?? 120) - cx, (p.y ?? 70) - cy);
      if (dist <= (p.radius || 30)) {
        autoParentId = p.id;
        break; // Found the smallest containing territory!
      }
    }

    const newTerritory: Territory = {
      id: `terr-draw-${Date.now()}`,
      name: `${finalName} #${territories.filter(t => t.type === config.type).length + 1}`,
      description: isPath ? 'Verlauf / Pfad auf der Weltkarte.' : 'Gezeichnete Zone auf der Weltkarte.',
      parentId: autoParentId,
      type: config.type,
      x: cx,
      y: cy,
      radius: Math.max(isPath ? 2 : 12, Math.round(maxR)),
      points: finalPoints,
      color: drawColor || config.defaultColor,
      shapeType: 'polygon',
      seed: Math.floor(Math.random() * 1000)
    };

    // Clip & conform against existing territories so new landmasses and seas NEVER overlap
    // Do NOT clip paths!
    if (!isPath) {
      const conformed = getConformedTerritoryGeometry(newTerritory, [...territories, newTerritory]);
      if (conformed.points && conformed.points.length >= 3) {
        newTerritory.points = conformed.points;
      }
    }

    onChangeWorld(prev => ({
      ...prev,
      territories: [...(prev.territories || []), newTerritory]
    }));

    setSelectedTerritoryId(newTerritory.id);
    setDrawnPoints([]);
    setActivePlacementTool(null);

    if (onSendToChatLog) {
      onSendToChatLog(`**Gezeichnet:** *${newTerritory.name}* (${config.type}) mit ${newTerritory.points.length} Punkten.`);
    }
  };

  // Subdivide sea/zone directly using the drawn polygon shape
  const handleSubdivideDrawZoneDirectly = (targetTerritoryId: string) => {
    if (!drawnPoints || drawnPoints.length < 2) return;
    const parent = territories.find(t => t.id === targetTerritoryId);
    if (!parent) return;

    recordHistory();

    const config = DRAW_ZONE_CONFIGS[targetDrawType] || DRAW_ZONE_CONFIGS.meer;
    const closedPoints = closeDrawnPointsWithNeighbors(drawnPoints, territories);

    const cx = Math.round((closedPoints.reduce((acc, p) => acc + p.x, 0) / closedPoints.length) * 10) / 10;
    const cy = Math.round((closedPoints.reduce((acc, p) => acc + p.y, 0) / closedPoints.length) * 10) / 10;
    const maxR = Math.max(...closedPoints.map(p => Math.hypot(p.x - cx, p.y - cy)));

    const subzoneName = `${config.defaultName} (${parent.name})`;

    const newSubzone: Territory = {
      id: `terr-subzone-${Date.now()}`,
      name: subzoneName,
      description: `Unterteilte Zone in ${parent.name}.`,
      parentId: parent.id,
      type: config.type,
      x: cx,
      y: cy,
      radius: Math.max(8, Math.round(maxR)),
      points: closedPoints,
      color: drawColor || config.defaultColor,
      shapeType: 'polygon',
      seed: Math.floor(Math.random() * 1000)
    };

    const conformed = getConformedTerritoryGeometry(newSubzone, [...territories, newSubzone]);
    if (conformed.points && conformed.points.length >= 3) {
      newSubzone.points = conformed.points;
    }

    const updatedTerritories = territories.map(item => {
      if (item.id === parent.id || item.parentId === newSubzone.id) return item;
      if (newSubzone.points && newSubzone.points.length >= 3) {
        if (isPointInPolygon({ x: item.x, y: item.y }, newSubzone.points)) {
          return {
            ...item,
            parentId: newSubzone.id
          };
        }
      }
      return item;
    });

    onChangeWorld(prev => ({
      ...prev,
      territories: [...updatedTerritories, newSubzone]
    }));

    setSelectedTerritoryId(newSubzone.id);
    setDrawnPoints([]);
    setActivePlacementTool(null);

    if (onSendToChatLog) {
      onSendToChatLog(`**Gebiet unterteilt:** *${newSubzone.name}* wurde direkt eingezeichnet und zugewiesen.`);
    }
  };

  // Append hand-drawn zone directly into an existing territory, unifying the polygon shape
  const handleAppendDrawnZoneToTerritory = (targetTerritoryId: string) => {
    if (!drawnPoints || drawnPoints.length < 2) return;
    const target = territories.find(t => t.id === targetTerritoryId);
    if (!target) return;

    recordHistory();

    // Merge points geometrically
    const mergedResult = mergePointsIntoTerritory(target, drawnPoints, territories);

    const updatedTerritories = territories.map(t => {
      if (t.id === targetTerritoryId) {
        return {
          ...t,
          points: mergedResult.mergedPoints,
          x: mergedResult.cx,
          y: mergedResult.cy,
          radius: mergedResult.radius,
          shapeType: 'polygon' as const
        };
      }
      return t;
    });

    onChangeWorld(prev => ({
      ...prev,
      territories: updatedTerritories
    }));

    setSelectedTerritoryId(targetTerritoryId);
    setDrawnPoints([]);
    setActivePlacementTool(null);

    if (onSendToChatLog) {
      onSendToChatLog(`**Zone erweitert:** *${target.name}* wurde nahtlos um die gezeichnete Fläche erweitert.`);
    }
  };

  // Open Subdivide Modal handler
  const handleOpenSubdivideModal = (terr?: Territory) => {
    let target = terr;
    if (!target) {
      if (selectedTerritory && (selectedTerritory.type === 'meer' || selectedTerritory.type === 'kontinent' || selectedTerritory.type === 'wasser' || (selectedTerritory.points && selectedTerritory.points.length >= 3))) {
        target = selectedTerritory;
      } else {
        // Find the first sea or continent
        target = territories.find(t => t.type === 'meer' || t.type === 'kontinent' || t.type === 'wasser') || territories[0];
      }
    }
    if (target) {
      setSubdivideTargetTerritory(target);
      setIsSubdivideModalOpen(true);
    }
  };

  // Apply Subdivided Zones handler
  const handleApplySubdivision = (
    createdZones: Territory[],
    updatedAllTerritories: Territory[],
    updatedParent?: Territory
  ) => {
    recordHistory();

    onChangeWorld(prev => ({
      ...prev,
      territories: updatedAllTerritories
    }));

    if (createdZones.length > 0) {
      setSelectedTerritoryId(createdZones[0].id);
    }

    if (onSendToChatLog) {
      const zoneNames = createdZones.map(z => z.name).join(', ');
      onSendToChatLog(
        `**Zonengliederung angewendet:** "${subdivideTargetTerritory?.name || 'Meer'}" wurde in ${createdZones.length} nahtlose Teilzonen unterteilt (${zoneNames}).`
      );
    }
  };

  // SVG Reference for coordinate calculation
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Delete all territories
  const handleDeleteAllTerritories = () => {
    recordHistory();
    onChangeWorld(prev => ({ ...prev, isOnePiece: false, territories: [] }));
    setIsDeleteAllConfirmOpen(false);
    setSelectedTerritoryId(null);
    if (onSendToChatLog) {
      onSendToChatLog("🧹 Alle Einträge auf der Weltkarte wurden erfolgreich gelöscht.");
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(16.0, Math.round((prev + 0.3) * 10) / 10));
  const handleZoomOut = () => setZoomScale(prev => Math.max(0.4, Math.round((prev - 0.3) * 10) / 10));
  const handleResetView = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Zoom & Center onto a specific territory
  const handleFocusTerritory = (terr: Territory) => {
    setSelectedTerritoryId(terr.id);
    let r = terr.radius || 20;
    if (terr.points && terr.points.length >= 3) {
      const xs = terr.points.map(p => p.x);
      const ys = terr.points.map(p => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      r = Math.max(width, height) / 2;
    }
    const targetZoom = Math.max(2.0, Math.min(8.0, Math.round((65 / Math.max(12, r)) * 10) / 10));
    setZoomScale(targetZoom);
    setPanOffset({
      x: (120 - terr.x) * 2.4 * targetZoom,
      y: (70 - terr.y) * 2.4 * targetZoom
    });
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (activePlacementTool === 'draw_zone' && isDrawingPointerDown) return;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomScale(prev => {
      return Math.max(0.4, Math.min(16.0, Math.round(prev * zoomFactor * 100) / 100));
    });
  };

  // Current Detail Level
  const currentDetailLevel = useMemo<ZoomDetailLevel>(() => {
    if (zoomScale < DETAIL_LEVEL_CONFIG.region.minScale) return 'world';
    if (zoomScale < DETAIL_LEVEL_CONFIG.city.minScale) return 'region';
    if (zoomScale < DETAIL_LEVEL_CONFIG.district.minScale) return 'city';
    if (zoomScale < DETAIL_LEVEL_CONFIG.building.minScale) return 'district';
    return 'building';
  }, [zoomScale]);

  // Selected territory object
  const selectedTerritory = useMemo(() => {
    return territories.find(t => t.id === selectedTerritoryId) || null;
  }, [territories, selectedTerritoryId]);

  // Hovered territory object
  const hoveredTerritory = useMemo(() => {
    return territories.find(t => t.id === hoveredTerritoryId) || null;
  }, [territories, hoveredTerritoryId]);

  // Parent Candidates (Seas, Continents, Worlds)
  const parentCandidates = useMemo(() => {
    return territories.filter(t => 
      t.type === 'welt' || 
      t.type === 'kontinent' || 
      t.type === 'meer' || 
      t.type === 'region' ||
      t.type === 'zone'
    );
  }, [territories]);

  // Mouse pan handlers with requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'button' || (e.target as HTMLElement).closest('button')) return;
    if (activePlacementTool) return; // Don't pan when placing or relocating
    if (draggingTerritoryId) return; // Don't pan when dragging element
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const nextX = e.clientX - panStart.x;
      const nextY = e.clientY - panStart.y;

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }

      animFrameRef.current = requestAnimationFrame(() => {
        setPanOffset({ x: nextX, y: nextY });
      });
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setHoveredTerritoryId(null);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPanning, panStart]);

  // Handle Dragging Territory across SVG Canvas
  useEffect(() => {
    if (!draggingTerritoryId) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      const svgP = pt.matrixTransform(ctm.inverse());
      const rawTargetX = svgP.x + dragOffsetRef.current.dx;
      const rawTargetY = svgP.y + dragOffsetRef.current.dy;
      const x = Math.round(rawTargetX * 10) / 10;
      const y = Math.round(rawTargetY * 10) / 10;

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }

      animFrameRef.current = requestAnimationFrame(() => {
        onChangeWorld(prev => {
          if (!prev.territories) return prev;

          const currentTerr = prev.territories.find(t => t.id === draggingTerritoryId);
          if (!currentTerr) return prev;

          // Strict Puzzle Collision Solver with Magnetic Snapping
          const { x: snapX, y: snapY } = resolveDragCollision(currentTerr, x, y, prev.territories);

          const updated = moveTerritoryWithChildren(draggingTerritoryId, snapX, snapY, prev.territories);
          return { ...prev, territories: updated };
        });
      });
    };

    const handleMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handlePointerUp = () => {
      if (draggingTerritoryId && dragStartSnapshotRef.current) {
        const preDrag = dragStartSnapshotRef.current;
        const oldTerr = preDrag.territories.find(t => t.id === draggingTerritoryId);
        const currTerr = territories.find(t => t.id === draggingTerritoryId);
        if (oldTerr && currTerr && (oldTerr.x !== currTerr.x || oldTerr.y !== currTerr.y)) {
          setHistoryStack(prev => [...prev.slice(-40), preDrag]);
          setRedoStack([]);
        }
      }
      dragStartSnapshotRef.current = null;
      setDraggingTerritoryId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [draggingTerritoryId, onChangeWorld, territories]);

  const handleStartDraggingTerritory = (e: React.MouseEvent | React.TouchEvent, terrId: string) => {
    // Only allow dragging when 'versetzen' tool is explicitly active!
    if (activePlacementTool !== 'versetzen') {
      return;
    }
    e.stopPropagation();
    setSelectedTerritoryId(terrId);
    if (!readOnly) {
      dragStartSnapshotRef.current = {
        territories: JSON.parse(JSON.stringify(territories)),
        connections: world.connections ? JSON.parse(JSON.stringify(world.connections)) : [],
        isOnePiece: world.isOnePiece
      };
      const targetTerr = territories.find(t => t.id === terrId);
      if (targetTerr) {
        const svgCoords = getSvgCoordinates(e);
        dragOffsetRef.current = {
          dx: (targetTerr.x ?? 0) - svgCoords.x,
          dy: (targetTerr.y ?? 0) - svgCoords.y
        };
      } else {
        dragOffsetRef.current = { dx: 0, dy: 0 };
      }
      setDraggingTerritoryId(terrId);
    }
  };

  // Convert client mouse click to SVG (240x140) coordinate
  const getSvgCoordinates = (e: React.MouseEvent<Element> | React.TouchEvent<Element> | { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 120, y: 70 };
    const pt = svgRef.current.createSVGPoint();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && (e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 0) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const svgP = pt.matrixTransform(ctm.inverse());
      return {
        x: Math.round(svgP.x * 10) / 10,
        y: Math.round(svgP.y * 10) / 10
      };
    }
    return { x: 120, y: 70 };
  };

  // Direct Click on Map (Place, Relocate or Deselect)
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;

    // Handle Zone Drawing (Polygon Point-by-Point or Freehand Click)
    if (activePlacementTool === 'draw_zone') {
      const pt = getSvgCoordinates(e);

      // Check if clicking close to start point to close shape
      if (drawnPoints.length >= 3) {
        const startPt = drawnPoints[0];
        const distToStart = Math.hypot(pt.x - startPt.x, pt.y - startPt.y);
        if (distToStart < 12) {
          handleSaveDrawnZoneDirectly(drawnPoints);
          setIsDrawingPointerDown(false);
          return;
        }
      }

      if (drawMethod === 'polygon') {
        setDrawnPoints(prev => [...prev, pt]);
      }
      return;
    }

    if (activePlacementTool === 'versetzen') {
      // In versetzen mode, dragging is the intuitive way to move elements.
      // Clicking empty background should not jump-teleport.
      return;
    }

    if (activePlacementTool) {
      const { x, y } = getSvgCoordinates(e);

      // Handle Biome Drawing Palette Tools (biome_gras, biome_wald, biome_gebirge, biome_wasser, biome_wueste, biome_schnee, biome_sumpf, biome_vulkan)
      if (activePlacementTool.startsWith('biome_')) {
        const biomeType = activePlacementTool.replace('biome_', '');
        const newId = `terr-biome-${biomeType}-${Date.now()}`;

        const biomeConfigs: Record<string, { label: string; color: string; icon: string; radius: number }> = {
          wald: { label: 'Dichter Wald', color: '#065f46', icon: '', radius: 8.0 },
          gebirge: { label: 'Bergmassiv', color: '#475569', icon: '', radius: 9.0 },
          wasser: { label: 'Binnensee & Wasser', color: '#0284c7', icon: '', radius: 8.0 },
          wueste: { label: 'Wüstenfeld', color: '#d97706', icon: '', radius: 8.5 },
          schnee: { label: 'Eis & Schnee', color: '#e2e8f0', icon: '', radius: 8.0 },
          sumpf: { label: 'Sumpfland', color: '#047857', icon: '', radius: 8.0 },
          vulkan: { label: 'Vulkanfeld', color: '#7f1d1d', icon: '', radius: 7.5 },
          gras: { label: 'Grasland', color: '#15803d', icon: '', radius: 8.5 }
        };

        const cfg = biomeConfigs[biomeType] || { label: 'Geländefeld', color: '#15803d', icon: '', radius: 8.0 };
        const existingCount = territories.filter(t => t.type === activePlacementTool || t.biome === biomeType).length + 1;
        const defaultName = `${cfg.label} #${existingCount}`;

        // Auto assign to nearest parent continent/island or sea
        let autoParentId: string | null = null;
        let closestDist = Infinity;
        territories.filter(t => t.type === 'kontinent' || t.type === 'insel' || t.type === 'meer').forEach(macro => {
          const dist = Math.hypot((macro.x ?? 120) - x, (macro.y ?? 70) - y);
          if (dist < closestDist && dist <= (macro.radius || 30)) {
            closestDist = dist;
            autoParentId = macro.id;
          }
        });

        const newTerritory: Territory = {
          id: newId,
          name: defaultName,
          type: activePlacementTool,
          biome: biomeType,
          description: `${cfg.label}-Geländefeld gezeichnet auf Position (${Math.round(x)} / ${Math.round(y)}).`,
          parentId: autoParentId,
          x,
          y,
          radius: cfg.radius,
          shapeType: 'polygon',
          color: cfg.color,
          faction: 'Natur',
          isUnlocked: true,
          seed: Math.floor(Math.random() * 10000),
          coastlineRoughness: 0.6,
          coastOpenDirection: 'none'
        };

        const nextList = [...territories, newTerritory];
        onChangeWorld(prev => ({ ...prev, territories: nextList }));
        setSelectedTerritoryId(newId);
        // Keep activePlacementTool active so user can continuously paint biomes across fields!

        if (onSendToChatLog) {
          onSendToChatLog(`🎨 **Geländefeld gezeichnet:** *${defaultName}* (${cfg.label}) bei (${Math.round(x)} / ${Math.round(y)}).`);
        }
        return;
      }

      const newId = `terr-${activePlacementTool}-${Date.now()}`;
      
      let defaultName = 'Neues Gebiet';
      let defaultRadius = 6.0;
      let defaultColor = '#0284c7';
      let actualType: Territory['type'] = (activePlacementTool as Territory['type']) || 'stadt';

      if (SETTLEMENT_CONFIGS[activePlacementTool]) {
        const sc = SETTLEMENT_CONFIGS[activePlacementTool];
        actualType = sc.type;
        const count = territories.filter(t => t.type === sc.type).length + 1;
        defaultName = `${sc.defaultName} #${count}`;
        defaultRadius = sc.defaultRadius;
        defaultColor = sc.defaultColor;
      } else if (activePlacementTool === 'meer') {
        defaultName = `Meer der Gezeiten #${territories.filter(t => t.type === 'meer').length + 1}`;
        defaultRadius = 40.0;
        defaultColor = '#0284c7';
      } else if (activePlacementTool === 'see') {
        defaultName = `Binnensee #${territories.filter(t => t.type === 'see' || t.biome === 'wasser').length + 1}`;
        defaultRadius = 12.0;
        defaultColor = '#0ea5e9';
      } else if (activePlacementTool === 'kontinent') {
        defaultName = `Kontinent #${territories.filter(t => t.type === 'kontinent').length + 1}`;
        defaultRadius = 35.0;
        defaultColor = '#15803d';
      } else if (activePlacementTool === 'koenigreich') {
        defaultName = `Landmasse #${territories.filter(t => t.type === 'koenigreich').length + 1}`;
        defaultRadius = 28.0;
        defaultColor = '#15803d';
      } else if (activePlacementTool === 'land') {
        defaultName = `Land #${territories.filter(t => t.type === 'land').length + 1}`;
        defaultRadius = 26.0;
        defaultColor = '#059669';
      } else if (activePlacementTool === 'region') {
        defaultName = `Region #${territories.filter(t => t.type === 'region').length + 1}`;
        defaultRadius = 22.0;
        defaultColor = '#475569';
      } else if (activePlacementTool === 'unabhaengiges_gebiet') {
        defaultName = `Unabhängiges Gebiet #${territories.filter(t => t.type === 'unabhaengiges_gebiet').length + 1}`;
        defaultRadius = 20.0;
        defaultColor = '#0d9488';
      } else if (activePlacementTool === 'insel') {
        defaultName = `Insel #${territories.filter(t => t.type === 'insel').length + 1}`;
        defaultRadius = 15.0;
        defaultColor = '#15803d';
      } else if (activePlacementTool === 'stadt') {
        defaultName = `Stadt #${territories.filter(t => t.type === 'stadt').length + 1}`;
        defaultRadius = 4.0;
        defaultColor = '#6366f1';
      } else if (activePlacementTool === 'festung') {
        defaultName = `Festung #${territories.filter(t => t.type === 'festung').length + 1}`;
        defaultRadius = 3.5;
        defaultColor = '#dc2626';
      }

      // Auto assign to nearest parent sea or continent if creating island, see, or settlement/poi
      let autoParentId: string | null = null;
      const isSettlementOrChild = Boolean(SETTLEMENT_CONFIGS[activePlacementTool]) || 
        activePlacementTool === 'insel' || activePlacementTool === 'see' || activePlacementTool === 'stadt' || activePlacementTool === 'festung';

      if (isSettlementOrChild) {
        let closestDist = Infinity;
        territories.filter(t => t.type === 'meer' || t.type === 'kontinent' || t.type === 'koenigreich' || t.type === 'land' || t.type === 'region').forEach(macro => {
          const dist = Math.hypot((macro.x ?? 120) - x, (macro.y ?? 70) - y);
          if (dist < closestDist && dist <= (macro.radius || 30)) {
            closestDist = dist;
            autoParentId = macro.id;
          }
        });
      }

      const newTerritory: Territory = {
        id: newId,
        name: defaultName,
        type: actualType,
        description: `Erfasst auf den Koordinaten (${Math.round(x)} / ${Math.round(y)}).`,
        parentId: autoParentId,
        x,
        y,
        radius: defaultRadius,
        shapeType: 'circle',
        color: defaultColor,
        faction: 'Neutral',
        isUnlocked: true,
        seed: Math.floor(Math.random() * 10000),
        coastlineRoughness: 0.5,
        coastOpenDirection: 'none'
      };

      recordHistory();
      const nextList = [...territories, newTerritory];
      onChangeWorld(prev => ({ ...prev, territories: nextList }));
      setSelectedTerritoryId(newId);
      setActivePlacementTool(null);

      if (onSendToChatLog) {
        onSendToChatLog(`Neues ${actualType.toUpperCase()} platziert: *${defaultName}* bei (${Math.round(x)} / ${Math.round(y)}).`);
      }
    } else {
      // Normal click without tool: deselect if clicking empty water
      // setSelectedTerritoryId(null);
    }
  };

  // Update territory
  const handleUpdateTerritory = (updated: Territory) => {
    recordHistory();
    const old = territories.find(t => t.id === updated.id);
    if (old && (old.x !== updated.x || old.y !== updated.y)) {
      const movedList = moveTerritoryWithChildren(updated.id, updated.x, updated.y, territories);
      const finalList = movedList.map(t => t.id === updated.id ? { ...t, ...updated, points: t.points } : t);
      const adjustedList = autoAdjustParentContainerBounds(updated, finalList);
      onChangeWorld(prev => ({ ...prev, territories: adjustedList }));
      return;
    }
    const nextList = territories.map(t => t.id === updated.id ? updated : t);
    const adjustedList = autoAdjustParentContainerBounds(updated, nextList);
    onChangeWorld(prev => ({ ...prev, territories: adjustedList }));
  };

  // Delete single territory
  const handleDeleteTerritory = (id: string) => {
    recordHistory();
    const nextList = territories.filter(t => t.id !== id);
    onChangeWorld(prev => ({ ...prev, territories: nextList }));
    if (selectedTerritoryId === id) {
      setSelectedTerritoryId(nextList.length > 0 ? nextList[0].id : null);
    }
  };

  // Add child territory inside a parent zone
  const handleAddChildTerritory = (parentId: string, parentType: Territory['type'], parentX: number, parentY: number) => {
    const newId = `terr-child-${Date.now()}`;
    const childType = parentType === 'meer' ? 'insel' : 'stadt';
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = parentType === 'meer' ? 8 + Math.random() * 8 : 4;
    const cx = Math.round((parentX + Math.cos(offsetAngle) * offsetDist) * 10) / 10;
    const cy = Math.round((parentY + Math.sin(offsetAngle) * offsetDist) * 10) / 10;

    const newChild: Territory = {
      id: newId,
      name: `${childType === 'insel' ? 'Insel' : 'Siedlung'} #${territories.length + 1}`,
      type: childType,
      description: `Gehört zum übergeordneten Gebiet.`,
      parentId: parentId,
      x: cx,
      y: cy,
      radius: childType === 'insel' ? 6.0 : 2.2,
      shapeType: 'circle',
      color: childType === 'insel' ? '#059669' : '#6366f1',
      faction: 'Neutral',
      isUnlocked: true
    };

    recordHistory();
    const nextList = [...territories, newChild];
    onChangeWorld(prev => ({ ...prev, territories: nextList }));
    setSelectedTerritoryId(newId);
  };

  // Sync selected location to Codex
  const handleSyncToCodex = () => {
    if (!selectedTerritory || !onUpdateLore) return;
    onUpdateLore(prevLore => {
      const normalizedName = selectedTerritory.name.toLowerCase().trim();
      const exists = prevLore.some(l => 
        l.title.toLowerCase().trim() === normalizedName ||
        (l.id && l.id === selectedTerritory.id)
      );
      if (exists) return prevLore;
      return [
        ...prevLore,
        {
          id: Date.now().toString(),
          category: 'Orte',
          title: selectedTerritory.name,
          description: selectedTerritory.description,
          isUnlocked: true,
          details: {
            role: selectedTerritory.type,
            faction: selectedTerritory.faction,
            ruler: selectedTerritory.ruler,
            population: selectedTerritory.population,
            dangerLevel: selectedTerritory.dangerLevel
          }
        }
      ];
    });
  };

  // Sync from Codex
  const handleSyncFromCodex = () => {
    const updated = buildTerritoriesFromCodexAndWorld(world, loreDatabase);
    recordHistory();
    onChangeWorld(prev => ({
      ...prev,
      territories: updated
    }));

    if (updated.length > 0) {
      setSelectedTerritoryId(updated[0].id);
    } else {
      setSelectedTerritoryId(null);
    }

    if (onSendToChatLog) {
      if (updated.length === 0) {
        onSendToChatLog(`**Codex-Synchronisation (1:1):** Der Codex enthält aktuell keine Orte. Die Weltkarte ist nun komplett leer und bereit für einen Neustart.`);
      } else {
        onSendToChatLog(`**Weltkarte 1:1 mit dem Codex synchronisiert:** ${updated.length} Orte aktiv platziert.`);
      }
    }
  };

  // Execute conquest / shift
  const handleExecuteTerritoryShift = () => {
    if (!shiftTargetId || !shiftNewFaction.trim()) return;

    const targetTerritory = territories.find(t => t.id === shiftTargetId);
    if (!targetTerritory) return;

    const oldFaction = targetTerritory.faction || 'Unbekannt';
    const updatedTerritories = territories.map(t => {
      if (t.id === shiftTargetId) {
        return {
          ...t,
          faction: shiftNewFaction.trim(),
          description: `${t.description} [Besetzt von ${shiftNewFaction.trim()}: ${shiftConflictDescription || 'Machtwechsel'}]`,
          dangerLevel: shiftIsWarZone ? 'Extrem (Kriegsgebiet)' : 'Mittel'
        };
      }
      return t;
    });

    recordHistory();
    onChangeWorld(prev => ({
      ...prev,
      territories: updatedTerritories
    }));

    if (onSendToChatLog) {
      onSendToChatLog(`📜 **Machtwechsel auf der Weltkarte!** **${targetTerritory.name}** wurde von **${shiftNewFaction}** übernommen (zuvor: *${oldFaction}*).`);
    }

    setShowShiftModal(false);
  };

  return (
    <div className={`flex flex-col ${
      isFullscreen
        ? 'fixed inset-0 z-[120] bg-slate-950 w-screen h-screen overflow-y-auto overflow-x-hidden rounded-none'
        : 'w-full'
    } bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl relative select-none font-sans text-slate-100 transition-all duration-300`}>
      
      {/* Top Map Mode Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode('world_map')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'world_map'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Weltkarte (Makroansicht)</span>
          </button>
          
          <button
            onClick={() => {
              if (activeLocalTerritory) {
                handleOpenLocalMap(activeLocalTerritory);
              } else if (territories.length > 0) {
                handleOpenLocalMap(territories[0]);
              }
            }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'local_map'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Stadt- & Dorfkarte (Mikroansicht)</span>
          </button>
        </div>

        {activeViewMode === 'local_map' && activeLocalTerritory && (
          <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Aktiver Ort: {activeLocalTerritory.name} ({activeLocalTerritory.type})</span>
          </div>
        )}
      </div>

      {activeViewMode === 'local_map' && activeLocalTerritory ? (
        <div className="w-full flex flex-col bg-slate-950">
          {/* Local Map Header Bar */}
          <div className="bg-slate-900/95 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveViewMode('world_map')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow cursor-pointer"
                title="Zurück zur Weltkarte wechseln"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück zur Weltkarte</span>
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-black text-white font-fantasy">
                    {activeLocalTerritory.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-extrabold uppercase">
                    {activeLocalTerritory.type === 'stadt' ? 'Stadtplan' :
                     activeLocalTerritory.type === 'dorf' ? 'Dorfplan' :
                     activeLocalTerritory.type === 'hafen' ? 'Hafenplan' :
                     activeLocalTerritory.type === 'festung' ? 'Festungsplan' : 'Ortskarte'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeLocalTerritory.description || 'Zeichne Gebäude, Wege, Docks und Gelände im lokalen Raster.'}
                </p>
              </div>
            </div>

            {/* Quick Location Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Ort wechseln:</span>
              <select
                value={activeLocalTerritory.id}
                onChange={(e) => {
                  const next = territories.find(t => t.id === e.target.value);
                  if (next) {
                    setActiveLocalTerritoryId(next.id);
                    setSelectedTerritoryId(next.id);
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-amber-300 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {territories
                  .filter(t => t.type === 'stadt' || t.type === 'dorf' || t.type === 'hafen' || t.type === 'festung' || t.type === 'ort' || t.type === 'insel' || t.type === 'gebäude')
                  .map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-900 text-amber-300">
                      {loc.name} ({loc.type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Stylized Local Town & Village Map View */}
          <div className="flex-1 w-full min-h-[550px] p-2 bg-slate-950">
            <StylizedLocalTownMap
              territory={activeLocalTerritory}
              worldSetting={world}
              loreDatabase={loreDatabase}
              onChangeMapData={(data) => handleUpdateLocalTileData(data)}
              onUpdateTerritoryFields={(updatedFields) => {
                handleUpdateTerritory({ ...activeLocalTerritory, ...updatedFields });
              }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* 1. TOP TOOLBAR (Clean, uncluttered, with direct placement tools + drawing controls) */}
          <WorldMapToolbar
        zoomScale={zoomScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        isExpandedHeight={isExpandedHeight}
        onToggleExpandedHeight={() => setIsExpandedHeight(!isExpandedHeight)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        currentDetailLevel={currentDetailLevel}
        activePlacementTool={activePlacementTool}
        onSelectPlacementTool={setActivePlacementTool}
        mapLayerMode={mapLayerMode}
        onSelectMapLayerMode={setMapLayerMode}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onOpenSmartFill={() => setIsSmartFillModalOpen(true)}
        onOpenWorldCreator={() => setIsWorldCreatorModalOpen(true)}
        onSyncFromCodex={handleSyncFromCodex}
        onOpenDeleteAll={() => setIsDeleteAllConfirmOpen(true)}
        onAutoConnectRoads={handleAutoConnectRoads}
        onOpenSubdivideModal={() => handleOpenSubdivideModal()}
        hasTerritories={territories.length > 0}
        readOnly={readOnly}
        borderAdaptationMode={borderAdaptationMode}
        onSelectBorderAdaptationMode={setBorderAdaptationMode}
        targetDrawType={targetDrawType}
        onSetTargetDrawType={setTargetDrawType}
        drawMethod={drawMethod}
        onSetDrawMethod={setDrawMethod}
        brushThickness={brushThickness}
        onSetBrushThickness={setBrushThickness}
        drawColor={drawColor}
        onSetDrawColor={setDrawColor}
        drawnPointsCount={drawnPoints.length}
        onScaleDrawnPoints={(factor) => {
          if (!drawnPoints || drawnPoints.length < 2) return;
          const cx = drawnPoints.reduce((sum, p) => sum + p.x, 0) / drawnPoints.length;
          const cy = drawnPoints.reduce((sum, p) => sum + p.y, 0) / drawnPoints.length;
          setDrawnPoints(prev => prev.map(p => ({
            x: Math.round((cx + (p.x - cx) * factor) * 10) / 10,
            y: Math.round((cy + (p.y - cy) * factor) * 10) / 10
          })));
        }}
        onCompleteDrawZone={() => {
          if (drawnPoints.length >= 2) {
            handleSaveDrawnZoneDirectly(drawnPoints);
          }
        }}
        onResetDrawZone={() => setDrawnPoints([])}
        territories={territories}
        selectedTerritoryId={selectedTerritoryId}
        onAppendDrawZone={handleAppendDrawnZoneToTerritory}
        onSubdivideDrawZone={handleSubdivideDrawZoneDirectly}
        onUndo={handleUndo}
        canUndo={historyStack.length > 0}
        onRedo={handleRedo}
        canRedo={redoStack.length > 0}
      />

      {/* 2. MAIN SVG MAP CANVAS (Wide 240 x 140 Nautical Coordinate System) */}
      <div
        onWheel={handleWheel}
        className={`relative overflow-hidden bg-slate-950 w-full shrink-0 flex items-center justify-center border-t border-slate-800 transition-all duration-300 ${
          isFullscreen
            ? 'h-[85vh] min-h-[600px]'
            : isExpandedHeight
              ? 'h-[75vh] min-h-[600px] max-h-[900px]'
              : 'h-[55vh] min-h-[400px] max-h-[600px]'
        } ${
          draggingTerritoryId
            ? 'cursor-grabbing'
            : activePlacementTool === 'versetzen'
              ? 'cursor-move'
              : activePlacementTool
                ? 'cursor-crosshair'
                : 'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={(e) => {
          if (activePlacementTool === 'draw_zone') {
            if (drawMethod === 'freehand') {
              const pt = getSvgCoordinates(e);
              setIsDrawingPointerDown(true);
              setDrawnPoints(prev => [...prev, pt]);
            }
            // Do NOT call handleMouseDown(e) when draw_zone tool is active to prevent map panning/shifting!
          } else {
            handleMouseDown(e);
          }
        }}
        onMouseMove={(e) => {
          if (activePlacementTool === 'draw_zone') {
            const pt = getSvgCoordinates(e);
            setCurrentCursorPos(pt);

            if (isDrawingPointerDown && drawMethod === 'freehand') {
              if (drawnPoints.length > 0) {
                const startPt = drawnPoints[0];
                const distToStart = Math.hypot(pt.x - startPt.x, pt.y - startPt.y);

                // Auto-close loop if dragging back near start point after drawing a curve
                if (drawnPoints.length >= 8 && distToStart < 8) {
                  handleSaveDrawnZoneDirectly(drawnPoints);
                  setIsDrawingPointerDown(false);
                  return;
                }

                const lastPt = drawnPoints[drawnPoints.length - 1];
                if (Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) >= brushThickness) {
                  setDrawnPoints(prev => [...prev, pt]);
                }
              }
            }
          }
        }}
        onMouseUp={() => {
          if (activePlacementTool === 'draw_zone') {
            setIsDrawingPointerDown(false);
          }
        }}
      >
        {/* COMPASS ARTWORK IN TOP RIGHT */}
        <div className="absolute top-3 right-3 pointer-events-none opacity-30 z-10 hidden md:block">
          <div className="relative w-20 h-20 flex items-center justify-center text-amber-500">
            <Compass className="w-full h-full text-amber-500/60" />
            <span className="absolute -top-1 font-black text-[10px] text-amber-400">N</span>
          </div>
        </div>

        {/* SVG MAP VECTOR CANVAS WITH PAN AND ZOOM */}
        <div
          className={`w-full h-full transform-gpu origin-center flex items-center justify-center ${
            isPanning ? 'transition-none cursor-grabbing' : 'transition-transform duration-200 ease-out'
          }`}
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${zoomScale})`,
            willChange: isPanning ? 'transform' : 'auto'
          }}
        >
          <svg
            ref={svgRef}
            viewBox="-120 -70 480 280"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full max-w-full max-h-full overflow-visible"
            onClick={handleMapClick}
          >
            {/* DEFINITIONS FOR GRADIENTS & PATTERNS */}
            <defs>
              <linearGradient id="redLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="50%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#450a0a" />
              </linearGradient>

              <pattern id="warZoneHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="2.0" opacity="0.8" />
              </pattern>

              {/* Deep Ocean Multilayer Gradient */}
              <radialGradient id="deepOceanRadial" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#03487f" />
                <stop offset="45%" stopColor="#023868" />
                <stop offset="75%" stopColor="#02284d" />
                <stop offset="100%" stopColor="#011b35" />
              </radialGradient>

              {/* Micro Wave Texture Pattern */}
              <pattern id="nauticalWavePattern" width="16" height="8" patternUnits="userSpaceOnUse">
                <path
                  d="M 0,4 Q 4,2 8,4 T 16,4"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="0.18"
                  strokeOpacity="0.35"
                />
                <path
                  d="M 4,7 Q 8,5.5 12,7"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="0.12"
                  strokeOpacity="0.25"
                />
              </pattern>
            </defs>

            {/* 2. DYNAMIC TRAVEL ROUTES & CONNECTIONS */}
            {(world.connections || []).map((conn, connIdx) => {
              const fromStr = (conn.fromId || conn.fromPlace || '').toString();
              const toStr = (conn.toId || conn.toPlace || '').toString();
              if (!fromStr || !toStr) return null;

              const t1 = territories.find(t => 
                (t.id && t.id.toLowerCase() === fromStr.toLowerCase()) || 
                (t.name && t.name.toLowerCase() === fromStr.toLowerCase())
              );
              const t2 = territories.find(t => 
                (t.id && t.id.toLowerCase() === toStr.toLowerCase()) || 
                (t.name && t.name.toLowerCase() === toStr.toLowerCase())
              );
              if (!t1 || !t2) return null;

              const midX = (t1.x + t2.x) / 2;
              const midY = (t1.y + t2.y) / 2 - 2.5;
              const pathD = `M ${t1.x} ${t1.y} Q ${midX} ${midY} ${t2.x} ${t2.y}`;
              const isSeaRoute = conn.type === 'sea' || t1.type === 'meer' || t2.type === 'meer';
              const strokeColor = isSeaRoute ? '#38bdf8' : conn.type === 'air' ? '#ec4899' : '#fbbf24';

              return (
                <g key={conn.id || `conn-${connIdx}`} id={`route-${conn.id || connIdx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="0.5"
                    strokeDasharray="1.8,1.0"
                    opacity="0.9"
                    strokeLinecap="round"
                  />
                  <circle cx={t1.x} cy={t1.y} r="0.5" fill={strokeColor} opacity="0.8" />
                  <circle cx={t2.x} cy={t2.y} r="0.5" fill={strokeColor} opacity="0.8" />
                  {(conn.travelTime || conn.label) && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-4.5"
                        y="-1.1"
                        width="9"
                        height="2.2"
                        rx="0.5"
                        fill="#090d16"
                        stroke={strokeColor}
                        strokeWidth="0.25"
                        opacity="0.95"
                      />
                      <text
                        textAnchor="middle"
                        dy="0.5"
                        fontSize="0.75"
                        fill="#f8fafc"
                        fontWeight="bold"
                        className="font-mono select-none pointer-events-none"
                      >
                        {conn.travelTime || conn.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 3. SEA ZONES, LAKES, CONTINENTS, ISLANDS, BIOMES & POIS */}
            {sortedTerritories.map((terr, terrIdx) => {
              const isSelected = selectedTerritoryId === terr.id;
              const isHovered = hoveredTerritoryId === terr.id;

              // RENDER MEER / OZEAN / WATER BODY (Conforms dynamically around overlapping land)
              if (terr.type === 'meer' || terr.type === 'ozean') {
                const seaGeo = getConformedSeaGeometry(terr, territories, selectedTerritoryId, borderAdaptationMode);
                const seaPath = seaGeo.path;

                return (
                  <g
                    key={`sea-${terr.id}-${terrIdx}`}
                    id={`territory-sea-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Oceanic Organic Deep Water Fill */}
                    <path
                      d={seaPath}
                      fill="url(#deepOceanRadial)"
                      fillRule="evenodd"
                    />

                    {/* Oceanic Wave Pattern Overlay */}
                    <path
                      d={seaPath}
                      fill="url(#nauticalWavePattern)"
                      fillRule="evenodd"
                      opacity={isSelected ? 1.0 : isHovered ? 0.8 : 0.6}
                      className="pointer-events-none"
                    />

                    {/* Crisp Water Edge Stroke - Seamless Coastline Connection */}
                    <path
                      d={seaPath}
                      fill={terr.color || '#0284c7'}
                      fillRule="evenodd"
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.18 : 0.10}
                      stroke={isSelected ? '#fbbf24' : 'none'}
                      strokeWidth={isSelected ? 0.8 : 0}
                      strokeLinejoin="round"
                    />

                    {/* Central Nautical Sea Name Tag */}
                    <g transform={`translate(${terr.x}, ${terr.y})`}>
                      <text
                        textAnchor="middle"
                        dy="0.8"
                        fontSize="3.2"
                        fill={isSelected ? '#fbbf24' : '#bae6fd'}
                        fontWeight="black"
                        letterSpacing="0.16em"
                        opacity={isSelected ? 0.95 : 0.8}
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 10px #0284c7' }}
                      >
                        {terr.name}
                      </text>
                    </g>
                  </g>
                );
              }

              // RENDER SEE / INLAND FRESHWATER LAKE
              if (terr.type === 'see') {
                const lakeRadius = terr.radius || 12.0;
                const lakePoints = getTerritoryOrganicPoints(terr, 1.0, territories, selectedTerritoryId, borderAdaptationMode);
                const lakeShorePoints = getTerritoryOrganicPoints(terr, 1.06, territories, selectedTerritoryId, borderAdaptationMode);
                const innerPoints = getTerritoryOrganicPoints(terr, 0.55, territories, selectedTerritoryId, borderAdaptationMode);
                const lakePath = pointsToSvgPath(lakePoints);
                const shorePath = pointsToSvgPath(lakeShorePoints);
                const innerPath = pointsToSvgPath(innerPoints);

                return (
                  <g
                    key={`see-${terr.id}-${terrIdx}`}
                    id={`territory-see-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Pebble Shore Bank */}
                    <path
                      d={shorePath}
                      fill="#0369a1"
                      stroke="#38bdf8"
                      strokeWidth={0.3}
                      strokeLinejoin="round"
                    />
                    {/* Freshwater Lake Core */}
                    <path
                      d={lakePath}
                      fill={terr.color || '#0284c7'}
                      fillOpacity={0.92}
                      stroke={isSelected ? '#fbbf24' : '#7dd3fc'}
                      strokeWidth={isSelected ? 0.8 : 0.35}
                      strokeLinejoin="round"
                    />
                    {/* Deep Lake Center */}
                    <path
                      d={innerPath}
                      fill="#0c4a6e"
                      fillOpacity={0.7}
                      strokeLinejoin="round"
                    />
                    {/* Lake Wave Ripple */}
                    <path
                      d={lakePath}
                      fill="url(#nauticalWavePattern)"
                      opacity={0.5}
                      className="pointer-events-none"
                    />
                    {/* Lake Label */}
                    <g transform={`translate(${terr.x}, ${terr.y})`}>
                      <text
                        textAnchor="middle"
                        dy="0.8"
                        fontSize={Math.max(1.8, Math.min(3.5, lakeRadius * 0.18))}
                        fill={isSelected ? '#fbbf24' : '#e0f2fe'}
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                      >
                        {terr.name}
                      </text>
                    </g>
                  </g>
                );
              }

              // RENDER KONTINENT / LAND / KOENIGREICH / REGION / ZONE (Organic Shape + Automatic Multi-Layer Coastlines + Political Layer)
              const isLandArea = 
                terr.type === 'kontinent' || 
                terr.type === 'koenigreich' || 
                terr.type === 'land' || 
                terr.type === 'region' || 
                terr.type === 'zone' || 
                terr.type === 'unabhaengiges_gebiet' || 
                terr.type === 'unbekanntes_land' || 
                terr.type === 'geografische_flaeche';

              if (isLandArea) {
                const contRadius = terr.radius || (terr.type === 'kontinent' ? 35.0 : 28.0);
                const biome = getIslandBiomeStyle(terr.name, terr.description, terr.faction, terr.type);
                const autoCoast = getAutomaticCoastline(terr, territories, selectedTerritoryId, borderAdaptationMode);
                const innerPoints = getTerritoryOrganicPoints(terr, 0.65, territories, selectedTerritoryId, borderAdaptationMode);
                const innerPath = pointsToSvgPath(innerPoints);

                const coastlineContacts = getCoastlineContacts(terr, territories);
                const textSize = Math.max(2.4, Math.min(6.0, contRadius * 0.12));

                const landFill = (terr.color && terr.color !== '#d97706' && terr.color !== '#b91c1c') ? terr.color : '#15803d';
                const innerFill = biome.innerFill;
                const beachStroke = isSelected ? '#fbbf24' : (biome.beachColor || '#facc15');

                const showPolitical = mapLayerMode !== 'geography';
                const hasFaction = terr.faction && terr.faction !== 'Natur' && terr.faction !== 'Neutral';
                const isWarZone = terr.isWarZone || terr.controlPercentage !== undefined && terr.controlPercentage < 100;

                const areaIcon = '';

                return (
                  <g
                    key={`land-${terr.id}-${terrIdx}`}
                    id={`territory-land-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      if (activePlacementTool && activePlacementTool !== 'versetzen') return;
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleFocusTerritory(terr);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Landmass Core */}
                    <path
                      d={autoCoast.mainCoastPath}
                      fill={landFill}
                      fillOpacity={0.96}
                      stroke={isSelected ? '#d97706' : '#1e293b'}
                      strokeWidth={0.5}
                      strokeLinejoin="round"
                    />

                    {/* Crisp Selection Highlight Ring (Non-obscuring dashed amber outline) */}
                    {isSelected && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={0.7}
                        strokeDasharray="2, 1.5"
                        strokeLinejoin="round"
                        className="pointer-events-none animate-pulse"
                      />
                    )}

                    {/* POLITICAL / TERRITORIAL OVERLAY (Separated Layer) */}
                    {showPolitical && hasFaction && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill={terr.color || '#6366f1'}
                        fillOpacity={0.18}
                        stroke={terr.color || '#6366f1'}
                        strokeWidth={0.8}
                        strokeDasharray="4, 2"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Warzone Hatching Overlay */}
                    {showPolitical && isWarZone && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill="url(#warZoneHatch)"
                        fillOpacity={0.4}
                        className="pointer-events-none animate-pulse"
                      />
                    )}

                    {/* Land Area Name */}
                    <g transform={`translate(${terr.x}, ${terr.y})`}>
                      <text
                        textAnchor="middle"
                        dy="0.8"
                        fontSize={textSize}
                        fill={isSelected ? '#fbbf24' : '#fef08a'}
                        fontWeight="black"
                        letterSpacing="0.12em"
                        style={{ textShadow: '0 2px 5px rgba(0,0,0,0.95)' }}
                      >
                        {terr.name}
                      </text>
                      {showPolitical && terr.faction && terr.faction !== 'Natur' && (
                        <text
                          textAnchor="middle"
                          dy={textSize + 1.2}
                          fontSize={textSize * 0.55}
                          fill="#cbd5e1"
                          fontWeight="bold"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
                        >
                          {terr.faction}
                        </text>
                      )}
                    </g>
                  </g>
                );
              }

              // RENDER INSEL / ISLAND (Automatic Multi-Layer Coastlines + Political Layer)
              if (terr.type === 'insel') {
                const baseRadius = terr.radius || 15.0;
                const biome = getIslandBiomeStyle(terr.name, terr.description, terr.faction, terr.type);
                const autoCoast = getAutomaticCoastline(terr, territories, selectedTerritoryId, borderAdaptationMode);
                const innerPoints = getTerritoryOrganicPoints(terr, 0.45, territories, selectedTerritoryId, borderAdaptationMode);
                const innerPath = pointsToSvgPath(innerPoints);

                const coastlineContacts = getCoastlineContacts(terr, territories);
                const hasCoast = coastlineContacts.length > 0;

                const labelY = baseRadius > 8 ? terr.y : (terr.y + baseRadius * 1.3 + 1.2);
                const islandTextSize = Math.max(1.8, Math.min(5.0, baseRadius * 0.12));
                const landFill = terr.color || '#15803d';

                const showPolitical = mapLayerMode !== 'geography';
                const hasFaction = terr.faction && terr.faction !== 'Natur' && terr.faction !== 'Neutral';
                const isWarZone = terr.isWarZone || terr.controlPercentage !== undefined && terr.controlPercentage < 100;

                return (
                  <g
                    key={`island-${terr.id}-${terrIdx}`}
                    id={`territory-island-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      if (activePlacementTool && activePlacementTool !== 'versetzen') return;
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Land Core */}
                    <path
                      d={autoCoast.mainCoastPath}
                      fill={landFill}
                      stroke={isSelected ? '#fbbf24' : '#1e293b'}
                      strokeWidth={isSelected ? 0.8 : 0.4}
                      strokeLinejoin="round"
                    />

                    {/* POLITICAL / TERRITORIAL OVERLAY */}
                    {showPolitical && hasFaction && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill={terr.color || '#6366f1'}
                        fillOpacity={0.2}
                        stroke={terr.color || '#6366f1'}
                        strokeWidth={0.6}
                        strokeDasharray="3, 1.5"
                        className="pointer-events-none"
                      />
                    )}

                    {showPolitical && isWarZone && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill="url(#warZoneHatch)"
                        fillOpacity={0.4}
                        className="pointer-events-none"
                      />
                    )}

                    {/* Selected Highlight */}
                    {(isSelected || isHovered) && (
                      <path
                        d={autoCoast.mainCoastPath}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={isSelected ? 0.9 : 0.5}
                        strokeDasharray="1.5,0.8"
                      />
                    )}

                    {/* Island Name Label */}
                    <g transform={`translate(${terr.x}, ${labelY})`}>
                      <text
                        textAnchor="middle"
                        dy="0.8"
                        fontSize={islandTextSize}
                        fill={isSelected ? '#fbbf24' : '#e2e8f0'}
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                      >
                        {terr.name}
                      </text>
                    </g>
                  </g>
                );
              }

              // RENDER DRAWN BIOME FIELD / PATCH (All biomes supported)
              if (terr.type.startsWith('biome_')) {
                const patchRadius = terr.radius || 8.0;
                const patchPoints = getTerritoryOrganicPoints(terr, 1.0);
                const innerPoints = getTerritoryOrganicPoints(terr, 0.5);
                const patchPath = pointsToSvgPath(patchPoints);
                const innerPath = pointsToSvgPath(innerPoints);

                const bType = terr.type.replace('biome_', '');
                const biomeConfig = getBiomeConfig(terr.biome || bType);
                const patchColor = terr.color || biomeConfig.color;

                return (
                  <g
                    key={`biome-${terr.id}-${terrIdx}`}
                    id={`territory-biome-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      if (activePlacementTool && activePlacementTool !== 'versetzen') return;
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Outer Biome Patch Contour */}
                    <path
                      d={patchPath}
                      fill={patchColor}
                      fillOpacity={0.88}
                      stroke={isSelected ? '#fbbf24' : biomeConfig.stroke}
                      strokeWidth={isSelected ? 0.9 : 0.35}
                      strokeLinejoin="round"
                    />

                    {/* Label Tag on Hover or Selection */}
                    {(isSelected || isHovered) && (
                      <g transform={`translate(${terr.x}, ${terr.y + patchRadius + 1.2})`}>
                        <text
                          textAnchor="middle"
                          dy="0.8"
                          fontSize="1.6"
                          fill={isSelected ? '#fbbf24' : biomeConfig.labelColor}
                          fontWeight="bold"
                          className="select-none pointer-events-none"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
                        >
                          {terr.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }

              // RENDER PATHS (Fluss, Weg)
              if (terr.type === 'fluss' || terr.type === 'weg') {
                const isRiver = terr.type === 'fluss';
                const pathColor = isRiver ? '#38bdf8' : '#d97706';
                const strokeWidth = isRiver ? 1.2 : 0.8;
                
                // If the path was dragged/relocated, we should rely on its updated `points` array
                const points = terr.points || [{ x: terr.x, y: terr.y }];
                const pathData = pointsToOpenSvgPath(points);

                return (
                  <g
                    key={`path-${terr.id}-${terrIdx}`}
                    id={`territory-path-${terr.id}`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onTouchStart={(e) => {
                      if (activePlacementTool !== 'versetzen') return;
                      handleStartDraggingTerritory(e, terr.id);
                    }}
                    onClick={(e) => {
                      if (activePlacementTool && activePlacementTool !== 'versetzen') return;
                      e.stopPropagation();
                      setSelectedTerritoryId(terr.id);
                    }}
                    onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                    onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible thicker path for easier clicking/hovering */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={5}
                    />
                    
                    {/* Main Path Stroke */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isSelected ? '#fbbf24' : pathColor}
                      strokeWidth={isSelected ? strokeWidth + 0.4 : strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={isRiver ? undefined : "2, 1.5"}
                    />

                    {/* Label Tag on Hover or Selection */}
                    {(isSelected || isHovered) && (
                      <g transform={`translate(${terr.x}, ${terr.y + 2})`}>
                        <text
                          textAnchor="middle"
                          dy="0.8"
                          fontSize="1.6"
                          fill={isSelected ? '#fbbf24' : '#f8fafc'}
                          fontWeight="bold"
                          className="select-none pointer-events-none"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
                        >
                          {terr.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }

              // RENDER SETTLEMENT / CITY / FORTRESS / OTHER MARKERS
              const isSettlement = terr.type === 'stadt' || terr.type === 'dorf' || terr.type === 'hafen' || terr.type === 'festung' || terr.type === 'ort';
              
              const getBadgeIcon = () => {
                return '';
              };

              const badgeIcon = getBadgeIcon();
              const markerRadius = terr.radius && terr.radius <= 6 ? Math.max(0.9, Math.min(1.8, terr.radius * 0.38)) : (isSelected ? 1.5 : 1.1);
              const markerColor = terr.color || (
                terr.type === 'festung' ? '#dc2626' : 
                terr.type === 'dorf' ? '#10b981' : 
                terr.type === 'stadt' ? '#6366f1' : 
                terr.type === 'hafen' ? '#0ea5e9' : '#f59e0b'
              );
              const tagW = Math.max(6, Math.min(18, (terr.name.length + 3) * 0.52));

              return (
                <g
                  key={`marker-${terr.id}-${terrIdx}`}
                  transform={`translate(${terr.x}, ${terr.y})`}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    if (activePlacementTool !== 'versetzen') return;
                    handleStartDraggingTerritory(e, terr.id);
                  }}
                  onTouchStart={(e) => {
                    if (activePlacementTool !== 'versetzen') return;
                    handleStartDraggingTerritory(e, terr.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePlacementTool === 'connect_weg') {
                      handleConnectRoadClick(terr.id);
                      return;
                    }
                    if (activePlacementTool && activePlacementTool !== 'versetzen') return;
                    setSelectedTerritoryId(terr.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleOpenLocalMap(terr);
                  }}
                  onMouseEnter={() => !isPanning && setHoveredTerritoryId(terr.id)}
                  onMouseLeave={() => !isPanning && setHoveredTerritoryId(null)}
                  className="cursor-pointer"
                >
                  {/* Subtle Pin Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isSelected ? markerRadius * 1.3 : markerRadius}
                    fill={markerColor}
                    stroke={isSelected ? '#fbbf24' : '#ffffff'}
                    strokeWidth={isSelected ? "0.5" : "0.25"}
                  />
                  {/* Compact Label Tag */}
                  <g transform="translate(0, 2.2)">
                    <rect
                      x={-tagW / 2}
                      y="-0.9"
                      width={tagW}
                      height="1.8"
                      rx="0.4"
                      fill="#030712"
                      fillOpacity="0.92"
                      stroke={isSelected ? '#fbbf24' : '#64748b'}
                      strokeWidth="0.2"
                    />
                    <text
                      textAnchor="middle"
                      dy="0.45"
                      fontSize="0.8"
                      fill={isSelected ? '#fbbf24' : '#e2e8f0'}
                      fontWeight="bold"
                      className="select-none pointer-events-none"
                    >
                      {badgeIcon} {terr.name}
                    </text>
                  </g>
                </g>
              );
            })}
            
            {/* 3b. CONNECT WEG TEMPORARY LINE */}
            {activePlacementTool === 'connect_weg' && connectPathStartId && currentCursorPos && (() => {
              const startNode = territories.find(t => t.id === connectPathStartId);
              if (!startNode) return null;
              return (
                <g className="pointer-events-none">
                  {/* Highlight start node */}
                  <circle
                    cx={startNode.x}
                    cy={startNode.y}
                    r="4"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    className="animate-ping"
                  />
                  {/* Dashed line to cursor */}
                  <line
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={currentCursorPos.x}
                    y2={currentCursorPos.y}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="2, 2"
                  />
                  <circle
                    cx={currentCursorPos.x}
                    cy={currentCursorPos.y}
                    r="1.5"
                    fill="#f59e0b"
                  />
                </g>
              );
            })()}

            {/* 5. INTERACTIVE DIRECTIONAL BORDER ANCHORS & QUICK ACTION PILL AROUND SELECTED TERRITORY */}
            {selectedTerritory && !readOnly && activePlacementTool !== 'versetzen' && (() => {
              // Get accurate highlight ring for selected territory
              const ring = getTerritoryPolygonRing(selectedTerritory, 1.0, undefined, territories, selectedTerritory.id, 'selected_only');
              const hlPath = ring && ring.length >= 4 
                ? ringToSvgPath(ring, false) 
                : pointsToSvgPath(selectedTerritory.points || []);

              return (
                <g id="selected-territory-directional-controls" className="select-none">
                  {/* Subtle highlight around selected territory */}
                  <path
                    d={hlPath}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    strokeDasharray="1 2"
                    className="pointer-events-none opacity-80"
                  />
                </g>
              );
            })()}
            {/* LIVE FREEHAND / POLYGON DRAWING PREVIEW */}
            {activePlacementTool === 'draw_zone' && drawnPoints.length > 0 && (() => {
              const startPt = drawnPoints[0];
              const isNearStart = drawnPoints.length >= 3 && currentCursorPos && Math.hypot(currentCursorPos.x - startPt.x, currentCursorPos.y - startPt.y) < 12;

              return (
                <g className="pointer-events-none z-30">
                  {/* Rubberband live segment to current cursor in polygon mode */}
                  {drawMethod === 'polygon' && currentCursorPos && (
                    <line
                      x1={drawnPoints[drawnPoints.length - 1].x}
                      y1={drawnPoints[drawnPoints.length - 1].y}
                      x2={currentCursorPos.x}
                      y2={currentCursorPos.y}
                      stroke="#fbbf24"
                      strokeWidth="0.8"
                      strokeDasharray="2, 2"
                    />
                  )}

                  {/* Main Drawn Stroke Line (NO Fill and NO auto-close 'Z' line while drawing) */}
                  <path
                    d={pointsToOpenSvgPath(drawnPoints)}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Start Point Target Indicator */}
                  <g transform={`translate(${startPt.x}, ${startPt.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r={isNearStart ? "3.5" : "2.2"}
                      fill={isNearStart ? "#10b981" : "#f59e0b"}
                      fillOpacity={isNearStart ? "0.4" : "0.2"}
                      className="animate-ping"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r={isNearStart ? "2.2" : "1.4"}
                      fill={isNearStart ? "#10b981" : "#fbbf24"}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                    {isNearStart && (
                      <g transform="translate(0, -4)">
                        <rect
                          x="-8"
                          y="-1.8"
                          width="16"
                          height="3.2"
                          rx="0.8"
                          fill="#064e3b"
                          stroke="#34d399"
                          strokeWidth="0.3"
                        />
                        <text
                          textAnchor="middle"
                          dy="0.4"
                          fontSize="1.1"
                          fill="#a7f3d0"
                          fontWeight="black"
                        >
                          ✓ Form schließen
                        </text>
                      </g>
                    )}
                  </g>

                  {/* Small vertex dots along path */}
                  {drawnPoints.map((p, i) => (
                    i > 0 && <circle key={`draw-pt-${i}`} cx={p.x} cy={p.y} r="0.6" fill="#fbbf24" opacity="0.8" />
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* MAP LEGEND OVERLAY (Toggleable) */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/95 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-2xl max-w-xs text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
              <span>Karten-Symbole & Zonen</span>
              <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
              <div className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-sky-400" /><span>Meer-Zone</span></div>
              <div className="flex items-center gap-1.5"><Mountain className="w-3.5 h-3.5 text-amber-400" /><span>Kontinent</span></div>
              <div className="flex items-center gap-1.5"><Palmtree className="w-3.5 h-3.5 text-emerald-400" /><span>Insel</span></div>
              <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-400" /><span>Stadt / Hafen</span></div>
              <div className="flex items-center gap-1.5"><Castle className="w-3.5 h-3.5 text-rose-400" /><span>Festung</span></div>
              <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-teal-400" /><span>Urwald / Biome</span></div>
            </div>
          </div>
        )}

        {/* CARTOGRAPHIC SCALE BAR (Maßstab) */}
        <div className="absolute bottom-3 right-3 z-20 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none flex items-center gap-2 text-[10px] font-mono text-slate-300 shadow-lg">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Maßstab</span>
          <div className="flex flex-col items-center">
            <div className="h-1.5 w-16 border-b-2 border-l-2 border-r-2 border-amber-400/90 flex justify-between">
              <div className="w-0.5 h-1 bg-amber-400/90"></div>
              <div className="w-0.5 h-1 bg-amber-400/90"></div>
            </div>
            <span className="text-[9px] text-amber-300 font-bold mt-0.5 leading-none">
              {(10 / Math.max(0.1, zoomScale)).toFixed(zoomScale > 2 ? 1 : 0)} km
            </span>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED ZONE INSPECTOR (Opens directly for the selected Sea, Continent, Island, City) */}
      {selectedTerritory && (
        <WorldMapInspector
          selectedTerritory={selectedTerritory}
          territories={territories}
          onUpdateTerritory={handleUpdateTerritory}
          onDeleteTerritory={handleDeleteTerritory}
          onClose={() => setSelectedTerritoryId(null)}
          onFocusTerritory={handleFocusTerritory}
          onOpenLocalMap={handleOpenLocalMap}
          onSelectTerritoryById={setSelectedTerritoryId}
          onOpenShiftModal={(id) => {
            setShiftTargetId(id);
            setShiftNewFaction(selectedTerritory.faction || '');
            setShowShiftModal(true);
          }}
          onOpenSubdivideModal={(terr) => handleOpenSubdivideModal(terr)}
          onSyncToCodex={handleSyncToCodex}
          onSendToChatLog={onSendToChatLog}
          onAddChildTerritory={handleAddChildTerritory}
          onActivateMoveMode={() => setActivePlacementTool('versetzen')}
          readOnly={readOnly}
        />
      )}

      {/* POPUP MODALS */}
      <ShiftModal
        show={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        targetTerritory={territories.find(t => t.id === shiftTargetId) || null}
        shiftNewFaction={shiftNewFaction}
        setShiftNewFaction={setShiftNewFaction}
        shiftConflictDescription={shiftConflictDescription}
        setShiftConflictDescription={setShiftConflictDescription}
        shiftIsWarZone={shiftIsWarZone}
        setShiftIsWarZone={setShiftIsWarZone}
        shiftControlPercentage={shiftControlPercentage}
        setShiftControlPercentage={setShiftControlPercentage}
        onConfirm={handleExecuteTerritoryShift}
      />

      <HierarchyDrawer
        show={isHierarchyTreeOpen}
        onClose={() => setIsHierarchyTreeOpen(false)}
        territories={territories}
        selectedTerritoryId={selectedTerritoryId}
        onSelectTerritory={(id, x, y) => {
          setSelectedTerritoryId(id);
          setPanOffset({
            x: (120 - x) * 5.8 * zoomScale,
            y: (70 - y) * 5.8 * zoomScale
          });
          setIsHierarchyTreeOpen(false);
        }}
      />

      {isSmartFillModalOpen && (
        <WorldMapSmartFillModal
          isOpen={isSmartFillModalOpen}
          onClose={() => setIsSmartFillModalOpen(false)}
          world={world}
          loreDatabase={loreDatabase}
          onSaveWorldMap={(newTerritories, updatedWorld, generatedLore) => {
            onChangeWorld(prev => ({
              ...prev,
              ...updatedWorld,
              territories: newTerritories
            }));
            if (generatedLore && generatedLore.length > 0 && onUpdateLore) {
              onUpdateLore(prevLore => {
                const existingTitles = new Set(prevLore.map(l => l.title.toLowerCase()));
                const nonDuplicates = generatedLore.filter(g => !existingTitles.has(g.title.toLowerCase()));
                return [...prevLore, ...nonDuplicates];
              });
            }
            if (newTerritories.length > 0) {
              setSelectedTerritoryId(newTerritories[0].id);
            }
            setIsSmartFillModalOpen(false);
            if (onSendToChatLog) {
              onSendToChatLog(`**Smart-Fill Karte generiert:** ${newTerritories.length} Elemente mit Flüssen, Bergen, Städten, Dörfern und Meeren platziert.`);
            }
          }}
        />
      )}

      {isWorldCreatorModalOpen && (
        <WorldMapCreatorModal
          isOpen={isWorldCreatorModalOpen}
          onClose={() => setIsWorldCreatorModalOpen(false)}
          world={world}
          loreDatabase={loreDatabase}
          onSaveWorldMap={(newTerritories, updatedWorld, generatedLore) => {
            onChangeWorld(prev => ({
              ...prev,
              ...updatedWorld,
              territories: newTerritories
            }));
            if (generatedLore && generatedLore.length > 0 && onUpdateLore) {
              onUpdateLore(prevLore => {
                const existingTitles = new Set(prevLore.map(l => l.title.toLowerCase()));
                const nonDuplicates = generatedLore.filter(g => !existingTitles.has(g.title.toLowerCase()));
                return [...prevLore, ...nonDuplicates];
              });
            }
            if (newTerritories.length > 0) {
              setSelectedTerritoryId(newTerritories[0].id);
            }
            setIsWorldCreatorModalOpen(false);
            if (onSendToChatLog) {
              onSendToChatLog(`**Neuer Weltkarten-Archetyp generiert:** ${newTerritories.length} Territorien und Zonen platziert.`);
            }
          }}
        />
      )}

      {/* SUBDIVIDE SEA / TERRITORY INTO ZONES MODAL */}
      {isSubdivideModalOpen && subdivideTargetTerritory && (
        <WorldMapSubdivideModal
          show={isSubdivideModalOpen}
          onClose={() => setIsSubdivideModalOpen(false)}
          targetTerritory={subdivideTargetTerritory}
          allTerritories={territories}
          onApplySubdivision={handleApplySubdivision}
          worldContext={{
            title: world.title,
            era: world.era,
            tone: world.tone
          }}
        />
      )}

      {/* DELETE ALL CONFIRMATION MODAL */}
      {isDeleteAllConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-red-900/50 rounded-xl shadow-2xl p-5 max-w-md w-full">
            <h3 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Alle Einträge löschen?
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Möchtest du wirklich alle Einträge (Inseln, Regionen, Ozeane) von der Weltkarte entfernen?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setIsDeleteAllConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAllTerritories}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ja, alle löschen
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
