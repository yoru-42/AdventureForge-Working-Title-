import React, { useState, useRef, useMemo, useEffect } from 'react';
import { WorldSetting, LoreEntry, Territory } from '../types';
import { getOnePieceTerritories } from '../utils/onePiecePreset';
import { generateOrganicShape } from '../utils/mapUtils';
import { NauticalMapBackground } from './NauticalMapBackground';
import { TacticalCanvasEditor } from './TacticalCanvasEditor';
import { GeminiService } from '../services/geminiService';
import { WorldMapCreatorModal } from './WorldMapCreatorModal';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { 
  CheckCircle2, ChevronDown, ChevronRight, Info, Layers, Map as MapIcon, 
  Maximize, MousePointer2, Plus, Trash2, X, Move, PlusCircle, Paintbrush, 
  ZoomIn, ZoomOut, Save, BoxSelect, TreePine, MapPin, Building, Waves,
  Globe2, Castle, LandPlot, Eraser, PaintBucket, Sparkles, Compass, HelpCircle, BookOpen, Scaling,
  Search, Anchor, Shield, Sun, Wind, ArrowLeft, Ruler, Store, Coins, Users
} from 'lucide-react';

interface WorldMapEditorProps {
  world: WorldSetting;
  onChangeWorld: React.Dispatch<React.SetStateAction<WorldSetting>>;
  loreDatabase: LoreEntry[];
  onUpdateLore: React.Dispatch<React.SetStateAction<LoreEntry[]>>;
  isGenerating: boolean;
  onGenerate: (prompt?: string) => Promise<void>;
  selectedTags?: string[];
}

const TERRITORY_CATEGORIES = [
  {
    key: 'geography',
    label: 'Geografische Flächen & Gewässer',
    types: ['welt', 'meer', 'bucht', 'see', 'fluss', 'kontinent', 'insel', 'region', 'zone']
  },
  {
    key: 'settlement',
    label: 'Siedlungen & Zivilisation',
    types: ['stadt', 'dorf', 'hafen']
  },
  {
    key: 'poi',
    label: 'Landmarken, POIs & Bauten',
    types: ['ort', 'festung', 'gebäude']
  },
  {
    key: 'biome',
    label: 'Biom- & Landschaftszonen',
    types: ['biome_wald', 'biome_gras', 'biome_gebirge', 'biome_wueste', 'biome_sumpf', 'biome_schnee', 'biome_vulkan', 'biome_dungeon']
  }
];

const SETTLEMENT_TYPES: { value: string; label: string }[] = [
  { value: 'hauptstadt', label: 'Hauptstadt' },
  { value: 'grossstadt', label: 'Großstadt' },
  { value: 'stadt', label: 'Stadt' },
  { value: 'kleinstadt', label: 'Kleinstadt' },
  { value: 'dorf', label: 'Dorf / Siedlung' },
  { value: 'hafenstadt', label: 'Hafenstadt' }
];

const POI_TYPES: { value: string; label: string }[] = [
  { value: 'festung', label: 'Festung / Zitadelle' },
  { value: 'burg', label: 'Burg / Schloss' },
  { value: 'ruine', label: 'Antike Ruine' },
  { value: 'turm', label: 'Magierturm / Wachturm' },
  { value: 'tempel', label: 'Tempel / Heiligtum' },
  { value: 'hoehle', label: 'Höhle / Grotte' },
  { value: 'leuchtturm', label: 'Leuchtturm' },
  { value: 'bruecke', label: 'Brücke / Übergang' },
  { value: 'tor', label: 'Stadttor / Grenzposten' },
  { value: 'mine', label: 'Mine / Steinbruch' },
  { value: 'ort', label: 'Besonderer Ort' },
  { value: 'gebaeude', label: 'Bauwerk / Gebäude' }
];

const TERRITORY_TYPES = [
  'welt', 'meer', 'bucht', 'see', 'fluss', 'kontinent', 'insel', 'region', 'zone',
  'biome_gebirge', 'biome_vulkan', 'biome_wald', 'biome_gras', 'biome_wueste', 'biome_sumpf', 'biome_schnee', 'biome_dungeon',
  'ort', 'stadt', 'dorf', 'hafen', 'festung', 'gebäude'
] as const;
type TerritoryType = typeof TERRITORY_TYPES[number];

const TYPE_COLORS: Record<string, string> = {
  welt: '#0f172a',
  meer: '#0284c7',
  bucht: '#0ea5e9',
  see: '#38bdf8',
  fluss: '#06b6d4',
  kontinent: '#22c55e',
  insel: '#84cc16',
  region: '#eab308',
  zone: '#f97316',
  biome_gebirge: '#78716c',
  biome_vulkan: '#dc2626',
  biome_wald: '#15803d',
  biome_gras: '#65a30d',
  biome_wueste: '#d97706',
  biome_sumpf: '#4d7c0f',
  biome_schnee: '#e0f2fe',
  biome_dungeon: '#581c87',
  ort: '#ef4444',
  stadt: '#a855f7',
  dorf: '#10b981',
  hafen: '#06b6d4',
  festung: '#f43f5e',
  gebäude: '#64748b'
};

const TYPE_LABELS: Record<string, string> = {
  welt: 'Weltkarte',
  meer: 'Meer / Ozean',
  bucht: 'Bucht / Lagune',
  see: 'See / Binnensee',
  fluss: 'Fluss',
  kontinent: 'Kontinent',
  insel: 'Insel',
  region: 'Region',
  zone: 'Zone / Sektor',
  biome_gebirge: 'Gebirge',
  biome_vulkan: 'Vulkan',
  biome_wald: 'Wald',
  biome_gras: 'Ebene',
  biome_wueste: 'Wüste',
  biome_sumpf: 'Sumpf',
  biome_schnee: 'Eis / Tundra',
  biome_dungeon: 'Dungeon / Höhle',
  ort: 'Besonderer Ort',
  stadt: 'Stadt',
  dorf: 'Dorf',
  hafen: 'Hafen',
  festung: 'Festung',
  gebäude: 'Gebäude'
};

const renderTerritoryTypeIcon = (type?: string, className = "w-3.5 h-3.5") => {
  const t = (type || '').toLowerCase();
  if (t === 'welt') return <Globe2 className={className} />;
  if (t === 'meer' || t === 'ozean' || t === 'see' || t === 'bucht' || t === 'fluss' || t === 'wasser' || t === 'biome_wasser') return <Waves className={className} />;
  if (t === 'insel') return <LandPlot className={className} />;
  if (t === 'kontinent') return <MapIcon className={className} />;
  if (t === 'stadt' || t === 'dorf') return <Building className={className} />;
  if (t === 'hafen') return <Anchor className={className} />;
  if (t === 'festung') return <Castle className={className} />;
  if (t === 'gebäude') return <Building className={className} />;
  if (t === 'ort') return <MapPin className={className} />;
  if (t.startsWith('biome_wald') || t === 'zone') return <TreePine className={className} />;
  if (t.startsWith('biome_gebirge') || t.startsWith('biome_vulkan')) return <LandPlot className={className} />;
  return <MapPin className={className} />;
};

const PALETTES = [
  {
    name: 'Ozeane & Gewässer',
    type: 'meer' as TerritoryType,
    shape: 'rectangle' as const,
    color: '#0284c7', // sky-600
    desc: 'Buchten, Ströme, tiefe Meere oder Meerengen malen.'
  },
  {
    name: 'Kontinente & Platten',
    type: 'kontinent' as TerritoryType,
    shape: 'rectangle' as const,
    color: '#22c55e', // green-500
    desc: 'Große Landmassen, Hauptkontinente oder Gebirgszüge.'
  },
  {
    name: 'Inselwelten & Archipele',
    type: 'insel' as TerritoryType,
    shape: 'circle' as const,
    color: '#84cc16', // lime-500
    desc: 'Einsame Eilande, Schatzinseln oder weitläufige Inselketten.'
  },
  {
    name: 'Königreiche / Gebiete',
    type: 'region' as TerritoryType,
    shape: 'rectangle' as const,
    color: '#eab308', // yellow-500
    desc: 'Grenzen von Imperien, wilde Steppen, Wüsten oder Hoheitsgebiete.'
  },
  {
    name: 'Wilde Naturzonen',
    type: 'zone' as TerritoryType,
    shape: 'rectangle' as const,
    color: '#f97316', // orange-500
    desc: 'Uralte Wälder, Dschungel, Sümpfe, Schluchten oder magische Täler.'
  },
  {
    name: 'Zivilisation & Städte',
    type: 'stadt' as TerritoryType,
    shape: 'circle' as const,
    color: '#a855f7', // purple-500
    desc: 'Königshauptstädte, Piratenhäfen, Festungen oder Marktflecken.'
  },
  {
    name: 'Abenteuerorte & Landmarken',
    type: 'ort' as TerritoryType,
    shape: 'circle' as const,
    color: '#ef4444', // red-500
    desc: 'Höhleneingänge, Tempelruinen, Schiffsfriedhöfe oder Verstecke.'
  },
  {
    name: 'Geheimbauten & Festen',
    type: 'gebäude' as TerritoryType,
    shape: 'rectangle' as const,
    color: '#64748b', // slate-500
    desc: 'Lagerhäuser, Magiertürme, Außenposten oder Wachtürme.'
  }
];

export const WorldMapEditor: React.FC<WorldMapEditorProps> = ({
  world,
  onChangeWorld,
  loreDatabase,
  onUpdateLore,
  isGenerating,
  onGenerate,
  selectedTags = []
}) => {
  const territories = useMemo(() => {
    const raw = world.territories || [];
    const seen = new Set<string>();
    const unique: Territory[] = [];
    for (const t of raw) {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }
    return unique;
  }, [world.territories]);
  
  // Tabs for the Left Sidebar: hierarchy tree vs tools
  const [leftSidebarTab, setLeftSidebarTab] = useState<'hierarchy' | 'tools'>('hierarchy');

  // Tree Hierarchical states
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // View/Explore Mode vs Edit/Creative Mode
  const [viewMode, setViewMode] = useState<'edit' | 'explore'>('edit');
  const [mapCanvasMode, setMapCanvasMode] = useState<'tilegrid' | 'overview'>('tilegrid');
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  // Designer Tool State
  const [activeTool, setActiveTool] = useState<'none' | 'draw' | 'paint' | 'fill' | 'scale' | 'eraser'>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditingProperties, setIsEditingProperties] = useState<boolean>(false);

  // Automatically switch tab when in explore/anzeige mode
  useEffect(() => {
    if (viewMode === 'explore') {
      setLeftSidebarTab('hierarchy');
    }
  }, [viewMode]);
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const [sailing, setSailing] = useState<{
    active: boolean;
    startId: string | null;
    endId: string | null;
    progress: number;
    coords: { x: number; y: number };
  }>({
    active: false,
    startId: null,
    endId: null,
    progress: 0,
    coords: { x: 0, y: 0 }
  });
  
  // Brush Configuration
  const [brushType, setBrushType] = useState<TerritoryType>('insel');
  const [brushShape, setBrushShape] = useState<'circle' | 'rectangle'>('circle');
  const [brushSize, setBrushSize] = useState<number>(40);
  const [brushColor, setBrushColor] = useState<string>('#84cc16');
  const [brushFaction, setBrushFaction] = useState<string>('');
  const [brushClimate, setBrushClimate] = useState<string>('');
  const [brushTerrain, setBrushTerrain] = useState<string>('');

  // Canvas Viewport transform
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [zoom, setZoom] = useState(0.8);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Operation specific dragging & drawing trackers
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [draggingTerritoryId, setDraggingTerritoryId] = useState<string | null>(null);
  const [territoryDragStart, setTerritoryDragStart] = useState({ x: 0, y: 0 });
  const [drawingTerritoryId, setDrawingTerritoryId] = useState<string | null>(null);
  const [drawingStartCoords, setDrawingStartCoords] = useState({ x: 0, y: 0 });

  const [scalingTerritoryId, setScalingTerritoryId] = useState<string | null>(null);
  const [scalingStartSize, setScalingStartSize] = useState<number>(40);
  const [scalingStartCoords, setScalingStartCoords] = useState({ x: 0, y: 0 });

  const [lastPaintedCoords, setLastPaintedCoords] = useState<{ x: number, y: number } | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number, y: number } | null>(null);

  // Drag tracking refs to prevent accidental node selection when panning
  const mouseDownScreenPosRef = useRef<{ x: number, y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  // Active selected territory object
  const selectedTerritory = useMemo(() => {
    return territories.find(t => t.id === selectedId) || territories.find(t => t.parentId === null) || territories[0] || null;
  }, [territories, selectedId]);

  // Active territory tile data for RPG-Maker style tile grid
  const activeTerritoryTileData = useMemo(() => {
    if (selectedTerritory?.tileData) {
      return selectedTerritory.tileData;
    }
    return {
      customEnemyName: 'Gegner',
      opponents: [],
      playerHp: 100,
      playerMaxHp: 100,
      playerMp: 50,
      playerMaxMp: 50,
      enemyHp: 100,
      enemyMaxHp: 100,
      combatSubMenu: 'start',
      positions: { 'Spieler': { x: 3, y: 10 } },
      tiles: {},
      placedObjects: [],
      gridWidth: 30,
      gridHeight: 30
    };
  }, [selectedTerritory]);

  const handleUpdateActiveTerritoryTileData = (newCombatState: any) => {
    if (!selectedTerritory) return;

    onChangeWorld(prev => ({
      ...prev,
      territories: (prev.territories || []).map(t => {
        if (t.id === selectedTerritory.id) {
          return {
            ...t,
            tileData: newCombatState
          };
        }
        return t;
      })
    }));
  };

  // Generate a static organic shape for the brush preview so it doesn't flicker
  const brushOrganicPoints = useMemo(() => {
    return generateOrganicShape('insel', brushTerrain, 'brush-preview');
  }, [brushTerrain]);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // KI Smart-Fill State (Schritt 4: Gebiet, Untergebiete & Codex)
  const [isSmartFillModalOpen, setIsSmartFillModalOpen] = useState<boolean>(false);
  const [smartFillPrompt, setSmartFillPrompt] = useState<string>('');
  const [smartFillTargetId, setSmartFillTargetId] = useState<string | null>(null);
  const [isSmartFilling, setIsSmartFilling] = useState<boolean>(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);

  const handleOpenSmartFillModal = (targetId?: string | null) => {
    const tid = targetId || selectedId || (territories[0]?.id ?? null);
    setSmartFillTargetId(tid);
    setSmartFillError(null);
    setIsSmartFillModalOpen(true);
  };

  const handleExecuteSmartFill = async () => {
    setIsSmartFilling(true);
    setSmartFillError(null);
    try {
      const promptToUse = smartFillPrompt.trim() || 'Automatisch alle Untergebiete, Städte, Dörfer, Häfen, Landmarken und Codex-Einträge harmonisch ausgestalten und befüllen.';
      const result = await GeminiService.generateLinkedWorldEntities({
        userPrompt: promptToUse,
        world,
        loreDatabase,
        isNsfw: false,
        targetTerritoryId: smartFillTargetId,
        source: 'worldmap'
      });

      onChangeWorld(result.updatedWorld);
      onUpdateLore(result.updatedLoreDatabase);

      const target = (result.updatedWorld.territories || []).find((t: any) => t.id === (smartFillTargetId || selectedId));
      const nameStr = target ? target.name : 'Das Gebiet';
      setSuccessMessage(`Erfolg: ${nameStr}, all seine Untergebiete und die Codex-Einträge wurden perfekt synchronisiert!`);
      setIsSmartFillModalOpen(false);
      setSmartFillPrompt('');
    } catch (err: any) {
      console.error("Fehler beim Smart-Fill:", err);
      setSmartFillError(err.message || "Fehler beim Erstellen des Gebiets & Codex.");
    } finally {
      setIsSmartFilling(false);
    }
  };

  // In-line iframe-safe confirmation states
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isConfirmingPreset, setIsConfirmingPreset] = useState<boolean>(false);
  const [isWorldCreatorModalOpen, setIsWorldCreatorModalOpen] = useState<boolean>(false);

  const handleSaveFromWorldCreator = (
    newTerritories: Territory[],
    updatedWorldPartial: Partial<WorldSetting>,
    generatedLore?: LoreEntry[]
  ) => {
    onChangeWorld(prev => ({
      ...prev,
      ...updatedWorldPartial,
      territories: newTerritories
    }));

    if (generatedLore && generatedLore.length > 0) {
      onUpdateLore(prevLore => {
        const existingTitles = new Set(prevLore.map(l => l.title.trim().toLowerCase()));
        const existingDescriptions = new Set(prevLore.map(l => (l.description || '').trim().toLowerCase()));
        const uniqueNew = generatedLore.filter(l => {
          const titleLower = l.title.trim().toLowerCase();
          const descLower = (l.description || '').trim().toLowerCase();
          if (existingTitles.has(titleLower)) return false;
          if (descLower.length > 15 && existingDescriptions.has(descLower)) return false;
          return true;
        });
        return [...prevLore, ...uniqueNew];
      });
    }

    setSuccessMessage(`Weltkarte "${updatedWorldPartial.title || world.title || 'Welt'}" mit ${newTerritories.length} Gebieten erfolgreich generiert und synchronisiert!`);
  };

  // Reset confirmation state when selected node changes
  useEffect(() => {
    setConfirmingDeleteId(null);
  }, [selectedId]);

  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    'welt': true,
    'meer': true,
    'bucht': true,
    'see': true,
    'fluss': true,
    'kontinent': true,
    'insel': true,
    'region': true,
    'zone': true,
    'biome_gebirge': true,
    'biome_vulkan': true,
    'biome_wald': true,
    'biome_gras': true,
    'biome_wueste': true,
    'biome_sumpf': true,
    'biome_schnee': true,
    'biome_dungeon': true,
    'ort': true,
    'stadt': true,
    'dorf': true,
    'hafen': true,
    'festung': true,
    'gebäude': true,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Setup initial world container centered at (500, 500) if explicitly null or undefined
  useEffect(() => {
    if (world.territories === undefined) {
      const weltId = 'welt-root';
      const welt: Territory = {
        id: weltId,
        name: world.title || 'Die Welt',
        type: 'welt',
        description: 'Die unendlichen Meere und Entdeckungen deiner eigenen Welt.',
        parentId: null,
        x: 500,
        y: 500,
        width: 1000,
        height: 1000,
        shapeType: 'rectangle',
        color: '#070a13'
      };
      onChangeWorld(prev => ({ ...prev, territories: [welt] }));
      setSelectedId(weltId);
    }
  }, [world.territories, world.title, onChangeWorld]);

  // Handle keyboard hotkeys for standard tools & territory deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const selTerr = territories.find(t => t.id === selectedId);
        if (selTerr && selTerr.type !== 'welt') {
          e.preventDefault();
          deleteTerritory(selectedId);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('none');
          break;
        case 'b':
          setActiveTool(prev => prev === 'draw' ? 'none' : 'draw');
          break;
        case 'p':
          setActiveTool(prev => prev === 'paint' ? 'none' : 'paint');
          break;
        case 'g':
          setActiveTool(prev => prev === 'fill' ? 'none' : 'fill');
          break;
        case 's':
          setActiveTool(prev => prev === 'scale' ? 'none' : 'scale');
          break;
        case 'e':
          setActiveTool(prev => prev === 'eraser' ? 'none' : 'eraser');
          break;
        case 'h':
          setActiveTool('none');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, territories]);

  // Build full tree hierarchy mapping for the tree sidebar
  const hierarchyMap = useMemo(() => {
    const parentToChildren: Record<string, Territory[]> = {};
    const roots: Territory[] = [];

    territories.forEach(t => {
      if (t.parentId === null) {
        roots.push(t);
      } else {
        if (!parentToChildren[t.parentId]) {
          parentToChildren[t.parentId] = [];
        }
        parentToChildren[t.parentId].push(t);
      }
    });

    // Sort children by name
    Object.keys(parentToChildren).forEach(key => {
      parentToChildren[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    roots.sort((a, b) => a.name.localeCompare(b.name));

    return { roots, parentToChildren };
  }, [territories]);

  // Count children for badge indicators
  const getChildrenCount = (id: string): number => {
    return territories.filter(t => t.parentId === id).length;
  };

  // Check if a node has any children at all
  const hasChildren = (id: string): boolean => {
    return territories.some(t => t.parentId === id);
  };

  // Convert raw client mouse positions into inner canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const outerX = clientX - rect.left;
    const outerY = clientY - rect.top;
    const innerX = (outerX - pan.x) / zoom;
    const innerY = (outerY - pan.y) / zoom;
    return { x: Math.round(innerX), y: Math.round(innerY) };
  };

  // Check if a given inner canvas coordinate falls inside a territory shape
  const isPointInTerritory = (px: number, py: number, t: Territory): boolean => {
    if (t.shapeType === 'polygon' && t.points && t.points.length > 0) {
      const scaleX = t.width ? t.width / 2 : (t.radius || 20);
      const scaleY = t.height ? t.height / 2 : (t.radius || 20);
      let inside = false;
      for (let i = 0, j = t.points.length - 1; i < t.points.length; j = i++) {
        const xi = t.x + t.points[i].x * scaleX;
        const yi = t.y + t.points[i].y * scaleY;
        const xj = t.x + t.points[j].x * scaleX;
        const yj = t.y + t.points[j].y * scaleY;

        const intersect = ((yi > py) !== (yj > py))
            && (px < (xj - xi) * (py - yi) / ((yj - yi) || 1) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    } else if (t.shapeType === 'rectangle') {
      const w = t.width || 40;
      const h = t.height || 40;
      return px >= t.x - w/2 && px <= t.x + w/2 && py >= t.y - h/2 && py <= t.y + h/2;
    } else {
      const r = t.radius || (t.width ? t.width/2 : 15);
      const dx = px - t.x;
      const dy = py - t.y;
      return dx * dx + dy * dy <= r * r;
    }
  };

  // Find topmost (smallest area) territory under the given coordinate
  const findTerritoryAt = (px: number, py: number): Territory | null => {
    const matches = territories.filter(t => isPointInTerritory(px, py, t) && visibleLayers[t.type as TerritoryType]);
    if (matches.length === 0) return null;
    
    // Sort matches by area size ascending, so smaller structures nested inside larger continents/seas are selected first!
    matches.sort((a, b) => {
      const areaA = a.shapeType === 'rectangle' ? (a.width || 40) * (a.height || 40) : Math.PI * (a.radius || 10) ** 2;
      const areaB = b.shapeType === 'rectangle' ? (b.width || 40) * (b.height || 40) : Math.PI * (b.radius || 10) ** 2;
      return areaA - areaB;
    });

    return matches[0];
  };

  // Center pan & zoom on a specific territory
  const centerOnNode = (node: Territory, preserveZoom = false) => {
    if (!node) return;
    const svg = svgRef.current;
    const containerWidth = svg ? svg.clientWidth : 700;
    const containerHeight = svg ? svg.clientHeight : 500;
    
    // Choose appropriate zoom level based on type
    const targetZoom = preserveZoom ? zoom : (node.type === 'welt' ? 0.6 : ['meer', 'kontinent', 'region'].includes(node.type) ? 0.95 : 1.45);
    
    const targetX = containerWidth / 2 - node.x * targetZoom;
    const targetY = containerHeight / 2 - node.y * targetZoom;
    
    if (!preserveZoom) {
      setZoom(targetZoom);
    }
    setPan({ x: targetX, y: targetY });
  };

  // Select territory and auto-expand hierarchy tree
  const handleSelectNode = (id: string | null, preserveZoom = false) => {
    if (id) {
      setPrevSelectedId(selectedId);
      setIsEditingProperties(true); // Automatically open area edit menu ("Gebiet bearbeiten") on selection
    } else {
      setIsEditingProperties(false);
    }
    setSelectedId(id);
    if (!id) return;
    const node = territories.find(t => t.id === id);
    if (node) {
      centerOnNode(node, preserveZoom);
      
      // Auto expand tree path to this node
      const newExpanded = { ...treeExpanded };
      let currentId = node.parentId;
      let safeguard = 0;
      while (currentId && safeguard < 10) {
        newExpanded[currentId] = true;
        const parent = territories.find(t => t.id === currentId);
        currentId = parent ? parent.parentId : null;
        safeguard++;
      }
      setTreeExpanded(newExpanded);
    }
  };

  // Voyage Sailing simulation trigger
  const triggerVoyageSimulation = () => {
    const selectedTerritory = territories.find(t => t.id === selectedId);
    if (!selectedTerritory) return;
    
    // Find starting point: if we have a prevSelectedId that exists, use that.
    // Otherwise, pick any other node on the map to act as a starting harbor!
    let startNode = territories.find(t => t.id === prevSelectedId);
    if (!startNode || startNode.id === selectedTerritory.id) {
      // Fallback: pick any other island/territory
      const siblings = territories.filter(t => t.id !== selectedTerritory.id && t.type !== 'welt');
      if (siblings.length > 0) {
        startNode = siblings[Math.floor(Math.random() * siblings.length)];
      }
    }

    if (!startNode) {
      alert("Erstelle oder wähle zuerst ein anderes Gebiet aus, um eine Segel-Route dorthin zu simulieren!");
      return;
    }

    // Initialize voyage sailing
    setSailing({
      active: true,
      startId: startNode.id,
      endId: selectedTerritory.id,
      progress: 0,
      coords: { x: startNode.x, y: startNode.y }
    });
  };

  // Animation Loop for Sailing Voyage
  useEffect(() => {
    if (!sailing.active || !sailing.startId || !sailing.endId) return;

    const startNode = territories.find(t => t.id === sailing.startId);
    const endNode = territories.find(t => t.id === sailing.endId);

    if (!startNode || !endNode) {
      setSailing(prev => ({ ...prev, active: false }));
      return;
    }

    const duration = 2000; // 2 seconds
    const fps = 60;
    const interval = 1000 / fps;
    const stepIncrement = 1 / (duration / interval);

    const timer = setInterval(() => {
      setSailing(prev => {
        const nextProgress = prev.progress + stepIncrement;
        if (nextProgress >= 1) {
          clearInterval(timer);
          return {
            active: false,
            startId: null,
            endId: null,
            progress: 1,
            coords: { x: endNode.x, y: endNode.y }
          };
        }

        // Linear interpolation
        const x = startNode.x + (endNode.x - startNode.x) * nextProgress;
        const y = startNode.y + (endNode.y - startNode.y) * nextProgress;

        return {
          ...prev,
          progress: nextProgress,
          coords: { x, y }
        };
      });
    }, interval);

    return () => clearInterval(timer);
  }, [sailing.active, sailing.startId, sailing.endId, territories]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    mouseDownScreenPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    // Right-click or middle-click always triggers canvas panning
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only process left-clicks

    setIsMouseDown(true);
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const target = findTerritoryAt(x, y);

    if (activeTool === 'eraser') {
      eraseAt(x, y);
    } 
    else if (activeTool === 'fill') {
      const id = Math.random().toString(36).substring(2, 10);
      const generatedPoints = generateOrganicShape(brushType, brushTerrain);
      const newTerr: Territory = {
        id,
        name: `Großes ${brushType.charAt(0).toUpperCase() + brushType.slice(1)}`,
        type: brushType,
        description: 'Ein mächtiges, durch ein Flutungswerkzeug ausgebreitetes Areal.',
        parentId: selectedId,
        x,
        y,
        radius: brushSize * 3.5,
        shapeType: 'polygon',
        points: generatedPoints,
        color: brushColor,
        climate: brushClimate,
        terrain: brushTerrain,
        faction: brushFaction
      };
      onChangeWorld(prev => ({
        ...prev,
        territories: [...(prev.territories || []), newTerr]
      }));
      setSelectedId(id);
      setIsEditingProperties(true);
    } 
    else if (activeTool === 'draw') {
      // Place new territory and enter draw resizing state
      const id = Math.random().toString(36).substring(2, 10);
      const generatedPoints = generateOrganicShape(brushType, brushTerrain);
      const newTerr: Territory = {
        id,
        name: `Gezeichnetes Gebiet (${brushType})`,
        type: brushType,
        description: '',
        parentId: selectedId,
        x,
        y,
        radius: brushSize,
        shapeType: 'polygon',
        points: generatedPoints,
        color: brushColor,
        climate: brushClimate,
        terrain: brushTerrain,
        faction: brushFaction
      };
      onChangeWorld(prev => ({
        ...prev,
        territories: [...(prev.territories || []), newTerr]
      }));
      setSelectedId(id);
      setIsEditingProperties(true);
      setDrawingTerritoryId(id);
      setDrawingStartCoords({ x, y });
    } 
    else if (activeTool === 'paint') {
      const id = Math.random().toString(36).substring(2, 10);
      const generatedPoints = generateOrganicShape(brushType, brushTerrain);
      const newTerr: Territory = {
        id,
        name: `Gezeichnetes Gebiet (${brushType})`,
        type: brushType,
        description: '',
        parentId: selectedId,
        x,
        y,
        radius: brushSize,
        shapeType: 'polygon',
        points: generatedPoints,
        color: brushColor,
        climate: brushClimate,
        terrain: brushTerrain,
        faction: brushFaction
      };
      onChangeWorld(prev => ({
        ...prev,
        territories: [...(prev.territories || []), newTerr]
      }));
      setSelectedId(id);
      setIsEditingProperties(true);
      setLastPaintedCoords({ x, y });
    } 
    else if (activeTool === 'scale') {
      if (target) {
        setSelectedId(target.id);
        setIsEditingProperties(true);
        setScalingTerritoryId(target.id);
        setScalingStartSize(target.radius || target.width || 40);
        setScalingStartCoords({ x, y });
      }
    } 
    else {
      // Default tool / Select mode: drag target territory if clicked, otherwise pan canvas
      if (target) {
        setDraggingTerritoryId(target.id);
        setTerritoryDragStart({ x: target.x, y: target.y });
        setDragStart({ x, y });
      } else {
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Check if mouse moved enough to be considered a drag/pan action
    if (mouseDownScreenPosRef.current) {
      const dx = e.clientX - mouseDownScreenPosRef.current.x;
      const dy = e.clientY - mouseDownScreenPosRef.current.y;
      if (Math.hypot(dx, dy) > 5) {
        hasDraggedRef.current = true;
      }
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    setHoverCoords({ x, y });

    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (!isMouseDown) return;

    if (activeTool === 'eraser') {
      eraseAt(x, y);
    } 
    else if (activeTool === 'paint') {
      if (lastPaintedCoords) {
        const dx = x - lastPaintedCoords.x;
        const dy = y - lastPaintedCoords.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spacing = brushSize * 0.75; // 75% brush overlap spacing

        if (dist > spacing) {
          const id = Math.random().toString(36).substring(2, 10);
          const jitterX = (Math.random() - 0.5) * (brushSize * 0.15); // Organic placement
          const jitterY = (Math.random() - 0.5) * (brushSize * 0.15);
          const generatedPoints = generateOrganicShape(brushType, brushTerrain);

          const newTerr: Territory = {
            id,
            name: `Gezeichnetes Gebiet (${brushType})`,
            type: brushType,
            description: '',
            parentId: selectedId,
            x: x + jitterX,
            y: y + jitterY,
            radius: brushSize,
            shapeType: 'polygon',
            points: generatedPoints,
            color: brushColor,
            climate: brushClimate,
            terrain: brushTerrain,
            faction: brushFaction
          };
          onChangeWorld(prev => ({
            ...prev,
            territories: [...(prev.territories || []), newTerr]
          }));
          setLastPaintedCoords({ x, y });
        }
      }
    } 
    else if (drawingTerritoryId && activeTool === 'draw') {
      const dx = x - drawingStartCoords.x;
      const dy = y - drawingStartCoords.y;
      const dist = Math.max(10, Math.round(Math.sqrt(dx * dx + dy * dy)));

      onChangeWorld(prev => ({
        ...prev,
        territories: (prev.territories || []).map(t => 
          t.id === drawingTerritoryId
            ? { 
                ...t, 
                radius: t.shapeType === 'circle' ? dist : undefined,
                width: t.shapeType === 'rectangle' ? dist * 2 : undefined,
                height: t.shapeType === 'rectangle' ? dist * 2 : undefined
              }
            : t
        )
      }));
    } 
    else if (scalingTerritoryId && activeTool === 'scale') {
      const dx = x - scalingStartCoords.x;
      const newSize = Math.max(5, Math.round(scalingStartSize + dx));

      onChangeWorld(prev => ({
        ...prev,
        territories: (prev.territories || []).map(t => 
          t.id === scalingTerritoryId
            ? { 
                ...t, 
                radius: t.shapeType === 'circle' ? newSize : undefined,
                width: t.shapeType === 'rectangle' ? newSize * 2 : undefined,
                height: t.shapeType === 'rectangle' ? newSize * 2 : undefined
              }
            : t
        )
      }));
    } 
    else if (draggingTerritoryId) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      onChangeWorld(prev => ({
        ...prev,
        territories: (prev.territories || []).map(t => 
          t.id === draggingTerritoryId 
            ? { ...t, x: territoryDragStart.x + dx, y: territoryDragStart.y + dy } 
            : t
        )
      }));
    }
  };

  const handleCanvasMouseUp = (e?: React.MouseEvent) => {
    // If we were dragging a territory, automatically update its parentId based on new coordinates
    if (draggingTerritoryId) {
      onChangeWorld(prev => {
        const list = prev.territories || [];
        const dragged = list.find(t => t.id === draggingTerritoryId);
        if (!dragged) return prev;

        const childIndex = TERRITORY_TYPES.indexOf(dragged.type as TerritoryType);
        let newParentId = dragged.parentId;

        if (childIndex > 0) {
          // Find all candidates in `list`
          const candidates = list.filter(t => {
            if (t.id === draggingTerritoryId) return false;
            const parentIndex = TERRITORY_TYPES.indexOf(t.type as TerritoryType);
            if (parentIndex >= childIndex) return false;
            return isPointInTerritory(dragged.x, dragged.y, t);
          });

          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              const idxA = TERRITORY_TYPES.indexOf(a.type as TerritoryType);
              const idxB = TERRITORY_TYPES.indexOf(b.type as TerritoryType);
              if (idxA !== idxB) {
                return idxB - idxA;
              }
              const areaA = a.shapeType === 'rectangle' ? (a.width || 40) * (a.height || 40) : Math.PI * (a.radius || 10) ** 2;
              const areaB = b.shapeType === 'rectangle' ? (b.width || 40) * (b.height || 40) : Math.PI * (b.radius || 10) ** 2;
              return areaA - areaB;
            });
            newParentId = candidates[0].id;
          } else {
            const root = list.find(t => t.type === 'welt');
            newParentId = root ? root.id : null;
          }
        }

        if (newParentId !== dragged.parentId) {
          return {
            ...prev,
            territories: list.map(t => 
              t.id === draggingTerritoryId ? { ...t, parentId: newParentId } : t
            )
          };
        }
        return prev;
      });
    }

    // If click occurred without dragging, select target node under cursor
    if (!hasDraggedRef.current && mouseDownScreenPosRef.current) {
      const clientX = e ? e.clientX : mouseDownScreenPosRef.current.x;
      const clientY = e ? e.clientY : mouseDownScreenPosRef.current.y;
      const { x, y } = getCanvasCoords(clientX, clientY);
      const target = findTerritoryAt(x, y);
      if (target) {
        handleSelectNode(target.id, true);
      }
    }

    setIsMouseDown(false);
    setIsDraggingCanvas(false);
    setDraggingTerritoryId(null);
    setDrawingTerritoryId(null);
    setScalingTerritoryId(null);
    setLastPaintedCoords(null);
    mouseDownScreenPosRef.current = null;
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    setZoom(z => Math.min(Math.max(0.15, z + delta), 4));
  };

  const eraseAt = (px: number, py: number) => {
    const target = findTerritoryAt(px, py);
    // Protect the global world baseline layer from immediate deletes
    if (target && target.type !== 'welt') {
      deleteTerritory(target.id);
    }
  };

  const handleRepairOnePieceLayout = () => {
    onChangeWorld(prev => {
      const canonicalTerritories = getOnePieceTerritories(prev.title || 'One Piece');
      const canonMap = new Map(canonicalTerritories.map(ct => [ct.id, ct]));

      const territories = prev.territories || [];
      const existingIds = new Set(territories.map(t => t.id));

      const repaired = territories.map(t => {
        const canon = canonMap.get(t.id);
        if (canon) {
          return {
            ...t,
            x: canon.x,
            y: canon.y,
            width: canon.width,
            height: canon.height,
            radius: canon.radius,
            shapeType: canon.shapeType || t.shapeType,
            parentId: canon.parentId,
            points: canon.points || t.points,
            color: canon.color || t.color
          };
        }
        return t;
      });

      // Add any missing canonical territories
      canonicalTerritories.forEach(ct => {
        if (!existingIds.has(ct.id)) {
          repaired.push(ct);
        }
      });

      return {
        ...prev,
        isOnePiece: true,
        territories: repaired,
        mapConfig: {
          ...(prev.mapConfig || {}),
          mapWidth: 1000,
          mapHeight: 1000
        }
      };
    });
  };

  const updateTerritory = (id: string, updates: Partial<Territory>) => {
    onChangeWorld(prev => {
      const territories = prev.territories || [];
      const target = territories.find(t => t.id === id);

      if (!target) return prev;

      const updatedTerritories = territories.map(t => {
        if (t.id === id) {
          return { ...t, ...updates };
        }
        return t;
      });

      let updatedMapConfig = prev.mapConfig;
      if (target.type === 'welt') {
        const newW = updates.width ?? updates.radius ?? target.width ?? 1000;
        const newH = updates.height ?? updates.radius ?? target.height ?? 1000;
        updatedMapConfig = {
          ...(prev.mapConfig || {}),
          mapWidth: newW,
          mapHeight: newH
        };
      }

      return {
        ...prev,
        territories: updatedTerritories,
        mapConfig: updatedMapConfig
      };
    });
  };

  const deleteTerritory = (id: string) => {
    onChangeWorld(prev => {
      let toDelete = new Set<string>([id]);
      let changed = true;
      const allTerritories = prev.territories || [];
      
      while (changed) {
        changed = false;
        for (const t of allTerritories) {
          if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
            toDelete.add(t.id);
            changed = true;
          }
        }
      }
      return {
        ...prev,
        territories: allTerritories.filter(t => !toDelete.has(t.id))
      };
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleSelectPalette = (palette: typeof PALETTES[number]) => {
    setBrushType(palette.type);
    setBrushShape(palette.shape);
    setBrushColor(palette.color);
    
    // Auto shift tool to Draw/Paint so they can start sculpting immediately
    if (activeTool === 'none' || activeTool === 'eraser') {
      setActiveTool('draw');
    }
  };

  const loadPresetOnePiece = (force = false) => {
    if (!force && !isConfirmingPreset) {
      setIsConfirmingPreset(true);
      return;
    }
    const opTerritories = getOnePieceTerritories(world.title || 'One Piece');
    onChangeWorld(prev => ({
      ...prev,
      isOnePiece: true,
      territories: opTerritories
    }));
    setSelectedId('op-welt-root');
    setPan({ x: 50, y: 50 });
    setZoom(0.7);
    setIsConfirmingPreset(false);

    // Auto-expand main root & sea branches in tree view
    setTreeExpanded({
      'op-welt-root': true,
      'op-eastblue': true,
      'op-northblue': true,
      'op-westblue': true,
      'op-southblue': true,
      'op-grandline-paradise': true,
      'op-grandline-newworld': true,
    });
  };

  const handleInvokeAiForge = async () => {
    try {
      setSuccessMessage(null);
      await onGenerate(aiPrompt);
      setSuccessMessage("Die Geographie deiner Welt wurde erfolgreich durch die KI geschmiedet! Nutze nun den Auswählen-Zeiger, um die Regionen anzupassen.");
    } catch (err: any) {
      console.error(err);
    }
  };

  // Breadcrumbs calculation (from active parent up to the absolute root)
  const breadcrumbs = useMemo(() => {
    if (!selectedId) return [];
    const crumbs: Territory[] = [];
    let currentId: string | null = selectedId;
    let safeguard = 0;

    while (currentId && safeguard < 20) {
      const node = territories.find(t => t.id === currentId);
      if (node) {
        crumbs.unshift(node);
        currentId = node.parentId;
      } else {
        break;
      }
      safeguard++;
    }
    return crumbs;
  }, [territories, selectedId]);

  // Search filter matches for Tree
  const filteredSearchNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return territories.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.climate && t.climate.toLowerCase().includes(q)) ||
      (t.terrain && t.terrain.toLowerCase().includes(q)) ||
      (t.faction && t.faction.toLowerCase().includes(q)) ||
      t.type.toLowerCase().includes(q)
    ).slice(0, 30); // Cap results to keep search fast
  }, [territories, searchQuery]);

  // Find linked lore items from the Codex
  const linkedLoreEntries = useMemo(() => {
    if (!selectedTerritory) return [];
    const nameLower = selectedTerritory.name.toLowerCase();
    return loreDatabase.filter(entry => {
      const matchInTitle = entry.title.toLowerCase().includes(nameLower);
      const matchInDesc = entry.description && entry.description.toLowerCase().includes(nameLower);
      return matchInTitle || matchInDesc;
    });
  }, [selectedTerritory, loreDatabase]);

  // Formatted world config for nautical background
  const formattedWorldBackground = useMemo(() => ({
    ...world,
    mapConfig: {
      ...(world?.mapConfig || {}),
      mapWidth: world?.mapConfig?.mapWidth || 1000,
      mapHeight: world?.mapConfig?.mapHeight || 1000,
      mapStyle: world?.mapConfig?.mapStyle || 'fantasy_saturated'
    }
  }), [world]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: Territory, depth = 0) => {
    const children = hierarchyMap.parentToChildren[node.id] || [];
    const isExpanded = !!treeExpanded[node.id];
    const isSelected = selectedId === node.id;
    const hasSubNodes = children.length > 0;

    return (
      <div key={node.id} className="select-none" id={`tree-node-${node.id}`}>
        <div 
          onClick={() => handleSelectNode(node.id)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg cursor-pointer transition-all ${
            isSelected 
              ? 'bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-sm' 
              : 'hover:bg-slate-900/60 text-slate-400 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
        >
          <div className="flex items-center gap-0.5">
            {hasSubNodes ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setTreeExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
                }}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-3" />
            )}
            <span className="text-[11px] shrink-0 text-slate-400">
              {renderTerritoryTypeIcon(node.type, "w-3 h-3 text-slate-400")}
            </span>
          </div>

          <span className="text-[10.5px] font-medium truncate flex-1 leading-none pt-0.5">
            {node.name}
          </span>

          {hasSubNodes && (
            <span className="text-[8px] px-1 rounded-full bg-slate-950/60 border border-slate-800 text-slate-500 font-bold shrink-0">
              {getChildrenCount(node.id)}
            </span>
          )}
        </div>

        {hasSubNodes && isExpanded && (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-800/80 ml-3.5 pl-0.5">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-row flex-wrap ${mapCanvasMode === 'tilegrid' ? 'h-auto pb-4' : 'h-[1100px]'} bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative font-sans select-none`} id="creative-world-map-editor">
      
      {/* COLUMN 1: Combined Toolbox & Hierarchy (Left Sidebar) */}
      <div className={`h-[500px] border-r border-slate-900 bg-slate-950 flex flex-col shrink-0 z-20 overflow-hidden order-2 ${viewMode === 'explore' ? 'w-full' : 'w-1/2'}`} id="map-toolbox-sidebar">
        
        {/* Editor Brand Label */}
        <div className="p-3 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest leading-none pt-0.5">Kreative Welt</h3>
              <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Hierarchie & Editor vereint</span>
            </div>
          </div>
          
          {isConfirmingPreset ? (
            <div className="flex gap-1 animate-in zoom-in-95 duration-150">
              <button
                onClick={() => loadPresetOnePiece(true)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[8px] font-extrabold rounded-lg uppercase tracking-wider transition-all"
                title="Sicher das Preset laden und Entwürfe überschreiben?"
              >
                Sicher laden?
              </button>
              <button
                onClick={() => setIsConfirmingPreset(false)}
                className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-extrabold rounded-lg uppercase tracking-wider transition-all"
                title="Abbrechen"
              >
                X
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setIsWorldCreatorModalOpen(true)}
                className="px-2 py-1 bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[8.5px] font-black rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                title="Öffne den interaktiven Welten-Schöpfer & Generator mit Archetypen, Ozeanen, Kontinenten und Inseln"
              >
                <Globe2 className="w-3 h-3 text-amber-400 animate-spin-very-slow" />
                <span>🌐 Welten-Generator</span>
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('onepiece_world_template', JSON.stringify(territories));
                    alert("Weltkarte erfolgreich als One Piece Vorlage gespeichert!");
                  } catch (e) {
                    alert("Fehler beim Speichern der Vorlage. Möglicherweise ist der Speicher voll.");
                  }
                }}
                className="px-1.5 py-1 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 text-[8.5px] font-bold rounded-lg uppercase tracking-wider transition-all"
                title="Speichere die aktuelle Weltkarte als wiederverwendbare Vorlage für neue Abenteuer"
              >
                💾 Vorlage
              </button>
              <button
                onClick={() => loadPresetOnePiece(false)}
                className="px-1.5 py-1 bg-sky-950/40 hover:bg-sky-900 border border-sky-900/60 text-sky-400 text-[8.5px] font-bold rounded-lg uppercase tracking-wider transition-all"
                title="Sichere One Piece Vorlage mit Inselarchipel laden"
              >
                🏴‍☠️ Preset
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Mode Toggle Tabs */}
        {viewMode !== 'explore' ? (
          <div className="flex border-b border-slate-900 p-1 bg-slate-950">
            <button
              onClick={() => setLeftSidebarTab('hierarchy')}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                leftSidebarTab === 'hierarchy'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🌳 Welt-Struktur</span>
            </button>
            <button
              onClick={() => setLeftSidebarTab('tools')}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                leftSidebarTab === 'tools'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>🖌️ Malwerkzeuge</span>
            </button>
          </div>
        ) : (
          <div className="border-b border-slate-900 py-2.5 px-3 bg-amber-500/5 flex items-center justify-between text-[10.5px]">
            <span className="font-extrabold text-amber-500 flex items-center gap-1.5">
              <Compass className="w-4 h-4 animate-spin-very-slow text-amber-500" />
              <span>Anzeige-Modus aktiv</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Erkunden & Reisen</span>
          </div>
        )}

        {/* Tab Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {leftSidebarTab === 'hierarchy' ? (
            /* TAB 1: World Structure / Tree Hierarchy View */
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              
              {/* Search hierarchy */}
              <div className="p-3 border-b border-slate-900">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Insel oder Region suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none transition-all placeholder-slate-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Search result dropdown inside tree container if active */}
                {searchQuery && (
                  <div className="mt-1.5 bg-slate-900 border border-slate-800 rounded-lg p-2 max-h-36 overflow-y-auto custom-scrollbar">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Suchergebnisse ({filteredSearchNodes.length})
                    </span>
                    {filteredSearchNodes.length === 0 ? (
                      <span className="text-[9px] text-slate-500 p-1 block">Nichts gefunden</span>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredSearchNodes.map(node => (
                          <button
                            key={node.id}
                            onClick={() => {
                              handleSelectNode(node.id);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-950 flex items-center justify-between text-[10.5px] text-slate-300 hover:text-amber-400 transition-colors"
                          >
                            <span className="truncate flex items-center gap-1.5">{renderTerritoryTypeIcon(node.type, "w-3 h-3 text-slate-400")} {node.name}</span>
                            <span className="text-[7.5px] uppercase font-bold text-slate-500">{node.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tree Header controls */}
              <div className="px-3 py-1.5 bg-slate-900/20 border-b border-slate-900/60 flex items-center justify-between">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Verschachtelte Gebiete ({territories.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadPresetOnePiece(true)}
                    className="text-[8.5px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1"
                    title="250+ One Piece Gebiete in Baumstruktur laden"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Preset (Re)load</span>
                  </button>
                  <button
                    onClick={() => {
                      const expandedAll: Record<string, boolean> = {};
                      territories.forEach(t => {
                        if (hasChildren(t.id)) expandedAll[t.id] = true;
                      });
                      setTreeExpanded(expandedAll);
                    }}
                    className="text-[8.5px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider"
                  >
                    Alles öffnen
                  </button>
                </div>
              </div>

              {/* Quick Preset Import Callout Banner if only 1 territory exists */}
              {territories.length <= 1 && (
                <div className="p-3 bg-gradient-to-br from-amber-500/10 via-sky-500/10 to-slate-900/40 border border-amber-500/30 rounded-xl m-2 space-y-2 text-center shadow-lg animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
                    <span>🏴‍☠️</span>
                    <span>250+ One Piece Gebiete importieren</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Füge über 250 verschachtelte kanonische Inseln, Meere, Stützpunkte und Regionen der One Piece Weltkarte zu deiner Struktur hinzu.
                  </p>
                  <button
                    onClick={() => loadPresetOnePiece(true)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>250+ Gebiete in Welt-Struktur laden</span>
                  </button>
                </div>
              )}

              {/* Recursive tree list */}
              <div className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar bg-slate-950/40 min-h-0">
                {hierarchyMap.roots.length === 0 ? (
                  <div className="text-center p-4 text-slate-500 text-[11px]">
                    Keine Gebiete vorhanden.
                  </div>
                ) : (
                  hierarchyMap.roots.map(root => renderTreeNode(root, 0))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Creative Design Paintbrush Tools */
            <div className="p-3 space-y-4">
              
              {/* Toolbox Grid */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Kreativ-Werkzeuge</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setActiveTool(activeTool === 'draw' ? 'none' : 'draw')}
                    className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all group ${
                      activeTool === 'draw'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                    title="Zeichnen: Klick zum Platzieren, Halten & Ziehen zum Skalieren [B]"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-500/80 group-hover:scale-105 transition-transform" />
                    <span className="text-[9.5px] font-bold">1. Zeichnen</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'paint' ? 'none' : 'paint')}
                    className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all group ${
                      activeTool === 'paint'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                    title="Drag & Paint: Maus gedrückt halten & über die Karte ziehen [P]"
                  >
                    <Paintbrush className="w-4 h-4 text-amber-500/80 group-hover:scale-105 transition-transform" />
                    <span className="text-[9.5px] font-bold">2. Malpinsel</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'fill' ? 'none' : 'fill')}
                    className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all group ${
                      activeTool === 'fill'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                    title="Füllen: Große Meere oder Landmassen fluten [G]"
                  >
                    <PaintBucket className="w-4 h-4 text-amber-500/80 group-hover:scale-105 transition-transform" />
                    <span className="text-[9.5px] font-bold">Füllen</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'scale' ? 'none' : 'scale')}
                    className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all group ${
                      activeTool === 'scale'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                    title="Skalieren: Gebiet anklicken und nach rechts/links ziehen zum Skalieren [S]"
                  >
                    <Scaling className="w-4 h-4 text-amber-500/80 group-hover:scale-105 transition-transform" />
                    <span className="text-[9.5px] font-bold">Skalieren</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
                    className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all group ${
                      activeTool === 'eraser'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                    title="Radierer: Entferne gezeichnete Elemente durch Überfahren [E]"
                  >
                    <Eraser className="w-4 h-4 text-amber-500/80 group-hover:scale-105 transition-transform" />
                    <span className="text-[9.5px] font-bold">Radierer</span>
                  </button>
                </div>
              </div>

              {/* Brush configuration parameters */}
              <div className="space-y-3.5 bg-slate-900/20 border border-slate-900 p-2.5 rounded-xl">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Pinsel-Einstellungen</span>

                {/* Brush size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Pinselgröße</label>
                    <span className="text-[9.5px] font-mono text-amber-500 font-bold">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Brush shape */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Pinselform</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 border border-slate-900 rounded-lg">
                    <button
                      onClick={() => setBrushShape('circle')}
                      className={`py-1 rounded text-[10px] font-bold transition-all ${
                        brushShape === 'circle' ? 'bg-slate-900 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Kreis
                    </button>
                    <button
                      onClick={() => setBrushShape('rectangle')}
                      className={`py-1 rounded text-[10px] font-bold transition-all ${
                        brushShape === 'rectangle' ? 'bg-slate-900 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Rechteck
                    </button>
                  </div>
                </div>
              </div>

              {/* Geländepalette list */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Geländepalette & Pinsel</span>
                <div className="space-y-1 pr-0.5">
                  {PALETTES.map((palette) => {
                    const isSelected = brushType === palette.type && brushShape === palette.shape && brushColor === palette.color;
                    return (
                      <button
                        key={palette.name}
                        onClick={() => handleSelectPalette(palette)}
                        className={`w-full text-left p-1.5 rounded-lg border flex items-center gap-2.5 transition-all group ${
                          isSelected
                            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-inner'
                            : 'bg-slate-950 border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                        }`}
                        title={palette.desc}
                      >
                        <div 
                          className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-slate-200 shadow-md shrink-0"
                          style={{ backgroundColor: palette.color + '20', border: `1px solid ${palette.color}40` }}
                        >
                          {renderTerritoryTypeIcon(palette.type, "w-3.5 h-3.5")}
                        </div>
                        <div className="truncate flex-1">
                          <div className="text-[10px] font-bold flex items-center gap-1.5 leading-tight">
                            <span className="truncate">{palette.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* COLUMN 2: Canvas Visual Editor (Center Column) */}
      <div className={`w-full ${mapCanvasMode === 'tilegrid' ? 'h-auto pb-4' : 'h-[600px] overflow-hidden'} shrink-0 border-b border-slate-900 bg-[#090b10] relative flex flex-col min-w-0 order-1`} id="map-visual-canvas">
        
        {/* Breadcrumb Trail at the top pointer-events auto */}
        <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 border-b border-slate-900 flex items-center justify-between z-10 shrink-0 text-[10.5px]">
          <div className="flex flex-wrap items-center gap-1 text-slate-400 py-0.5 pr-2">
            <button 
              onClick={() => {
                const root = territories.find(t => t.parentId === null);
                handleSelectNode(root ? root.id : null);
              }}
              className="hover:text-amber-400 transition-colors flex items-center gap-1 text-slate-500 shrink-0"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-500/80" />
              <span>Welt</span>
            </button>
            
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    onClick={() => handleSelectNode(crumb.id)}
                    className={`transition-colors shrink-0 font-medium ${isLast ? 'text-amber-400 font-semibold cursor-default' : 'hover:text-slate-200'}`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {/* KI Smart-Fill Action Button */}
            <button
              onClick={() => handleOpenSmartFillModal(selectedId)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-lg shrink-0 text-[9px] font-extrabold uppercase tracking-wider shadow-md transition-all active:scale-95 border border-amber-400/40"
              title="Erstelle oder überarbeite Orte & Dörfer mit KI-Smart-Fill und synchronisiere den Codex"
            >
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>KI Smart-Fill (Schritt 4)</span>
            </button>

            {/* Canvas System Status Indicator: Always locked on Tactical Battlefield & Grid Designer */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/30 px-2.5 py-1 rounded-lg shrink-0 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
              <span>🖌️ Taktisches Schlachtfeld & Kachel-Grid</span>
            </div>

            {/* Mode Toggle Selector: Kreativ vs Anzeige */}
            <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg mr-2 shrink-0">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                  viewMode === 'edit'
                    ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Kreativ-Modus: Gebiete zeichnen, malen und Eigenschaften bearbeiten"
              >
                <Paintbrush className="w-2.5 h-2.5" />
                <span>Kreativ</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('explore');
                  setIsEditingProperties(false);
                }}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                  viewMode === 'explore'
                    ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Anzeige-Modus: Hierarchische Struktur direkt per Klick erkunden und reisen"
              >
                <Compass className="w-2.5 h-2.5" />
                <span>Anzeige-Modus</span>
              </button>
            </div>

                        {/* Layers Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all border ${
                  isLayersMenuOpen
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title="Sichtbare Ebenen"
              >
                <Layers className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Ebenen</span>
              </button>
              
              {isLayersMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl p-2 z-50 pointer-events-auto">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">
                    Sichtbare Ebenen
                  </span>
                  <div className="space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-0.5">
                    {TERRITORY_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setVisibleLayers(prev => ({ ...prev, [type]: !prev[type] }))}
                        className={`w-full text-left px-1.5 py-1 rounded text-[8.5px] font-bold uppercase transition-all flex items-center justify-between ${
                          visibleLayers[type] ? 'text-slate-200 hover:bg-slate-900' : 'text-slate-600 line-through opacity-50'
                        }`}
                      >
                        <span className="truncate">{TYPE_LABELS[type] || type}</span>
                        <span className="text-slate-400">{renderTerritoryTypeIcon(type, "w-3 h-3 text-slate-400")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setZoom(z => Math.max(0.15, z / 1.25))}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
              title="Herauszoomen"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[8.5px] font-mono px-1 text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(4, z * 1.25))}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
              title="Hineinzoomen"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const centerNode = selectedTerritory || territories.find(t => t.parentId === null);
                if (centerNode) centerOnNode(centerNode);
                else { setPan({ x: 100, y: 100 }); setZoom(0.8); }
              }}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
              title="Kamera zentrieren"
            >
              <Maximize className="w-3 h-3" />
            </button>
          </div>
        </div>



        {/* Floating Tool Status Indicator Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-900 rounded-xl px-2.5 py-1 z-10 shadow-2xl pointer-events-none backdrop-blur-md flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {activeTool === 'none' && 'Navigieren: Klicken & Ziehen'}
            {activeTool === 'draw' && 'Zeichnen: Klick & Drag'}
            {activeTool === 'paint' && 'Malpinsel: Ziehen'}
            {activeTool === 'fill' && 'Fluten: Füllwerkzeug'}
            {activeTool === 'scale' && 'Skalieren: Ziehen'}
            {activeTool === 'eraser' && 'Radierer'}
          </span>
        </div>

        {/* Background compass watermark */}
        <div className="absolute bottom-6 right-6 pointer-events-none opacity-[0.02] w-48 h-48 text-slate-300">
          <Compass className="w-full h-full animate-spin-very-slow" />
        </div>

        {/* AI Loading spell effect overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              <div className="absolute inset-0 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            </div>
            <h3 className="text-xs font-fantasy text-amber-400 uppercase tracking-widest font-black">KI-Kartenschmiede ist aktiv...</h3>
            <p className="text-[10px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              Die Geographie, Regionen und Geopolitik deiner One Piece Welt werden basierend auf deinen Wünschen kreiert.
            </p>
          </div>
        )}

        {/* Main Canvas Area: Tile Grid vs Vector Overview */}
        {mapCanvasMode === 'tilegrid' ? (
          <div className="flex-1 w-full p-3 bg-slate-950 flex flex-col gap-3">
            {/* Active Territory Banner & Nested Area Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400">
                  {renderTerritoryTypeIcon(selectedTerritory?.type, "w-5 h-5 text-amber-400")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-fantasy">{selectedTerritory?.name || 'Unbenanntes Gebiet'}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-bold uppercase">
                      {selectedTerritory?.type || 'Gebiet'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {selectedTerritory?.description || 'Zeichne und erstelle Kacheln für dieses Gebiet in der Hierarchie.'}
                  </p>
                </div>
              </div>

              {/* Quick Area Transition Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedTerritory?.parentId && (
                  <button
                    onClick={() => handleSelectNode(selectedTerritory.parentId)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                    title="Zurück zum übergeordneten Gebiet"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ebene höher</span>
                  </button>
                )}

                {territories.filter(t => t.parentId === selectedTerritory?.id).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Untergebiete:</span>
                    <div className="flex flex-wrap gap-1">
                      {territories.filter(t => t.parentId === selectedTerritory?.id).map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleSelectNode(child.id)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <span>{renderTerritoryTypeIcon(child.type, "w-3 h-3 text-amber-300")}</span>
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical RPG Canvas Grid Editor for Active Territory */}
            <div className="flex-1 min-h-[500px]">
              <TacticalCanvasEditor
                player={{ name: 'Abenteurer' }}
                combatState={activeTerritoryTileData}
                onChangeCombatState={handleUpdateActiveTerritoryTileData}
                territory={selectedTerritory}
                worldSetting={world}
                loreDatabase={loreDatabase}
                onUpdateTerritoryFields={(updatedFields) => {
                  if (selectedTerritory) {
                    updateTerritory(selectedTerritory.id, updatedFields);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          /* SVG Vector Overview Area */
          <div 
            className="flex-1 w-full h-full relative outline-none"
            onContextMenu={(e) => e.preventDefault()}
          >
          {/* Grid pattern coordinates */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
               style={{ 
                 backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                 backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
                 backgroundPosition: `${pan.x}px ${pan.y}px`
               }} 
          />

          <svg
            ref={svgRef}
            className={`w-full h-full transition-shadow ${
              activeTool === 'none' ? (isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab') : 
              activeTool === 'eraser' ? 'cursor-none' : 
              activeTool === 'draw' || activeTool === 'paint' || activeTool === 'fill' ? 'cursor-none' : 'cursor-default'
            }`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => { handleCanvasMouseUp(); setHoverCoords(null); }}
            onWheel={handleCanvasWheel}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Beautiful, authentic world map/ocean background */}
              <g className="pointer-events-none select-none">
                <NauticalMapBackground
                  lore={loreDatabase}
                  mapZoomLevel="meso"
                  suppressTerritoryLandmasses={true}
                  world={formattedWorldBackground}
                  zoomScale={zoom}
                />
              </g>

              {/* Draw territories in sorted layer stacking order */}
              {territories
                .filter(t => visibleLayers[t.type as TerritoryType])
                .sort((a, b) => {
                  const drawOrder = ['welt', 'meer', 'kontinent', 'region', 'zone', 'insel', 'stadt', 'ort', 'gebäude'];
                  return drawOrder.indexOf(a.type) - drawOrder.indexOf(b.type);
                })
                .map((t) => {
                  const isSelected = selectedId === t.id;
                  const radius = t.radius || (t.width ? t.width/2 : 15);

                  // Macro structural regions / oceans (NO solid color box overlays!)
                  const isMacroRegion = ['welt', 'meer', 'kontinent', 'region', 'zone'].includes(t.type);
                  // Island landmasses
                  const isIsland = t.type === 'insel';

                  return (
                    <g 
                      key={t.id}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        mouseDownScreenPosRef.current = { x: e.clientX, y: e.clientY };
                        hasDraggedRef.current = false;
                        setIsMouseDown(true);

                        const { x, y } = getCanvasCoords(e.clientX, e.clientY);
                        
                        if (isMacroRegion) {
                          // Macro regions (Oceans, Calm Belts, Red Line): selecting region pans canvas unless dragging center handle
                          setIsDraggingCanvas(true);
                          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                        } else {
                          // Islands & Places: drag directly
                          setDraggingTerritoryId(t.id);
                          setTerritoryDragStart({ x: t.x, y: t.y });
                          setDragStart({ x, y });
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasDraggedRef.current) {
                          handleSelectNode(t.id, true);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (!hasDraggedRef.current) {
                          centerOnNode(t);
                        }
                      }}
                      className="group cursor-pointer hover:brightness-110"
                    >
                      {/* --- 1. MACRO REGIONS / OCEANS / STRUCTURAL BOUNDARIES --- */}
                      {isMacroRegion ? (
                        <g>
                          {/* Subtle interactive pointer target and selection outline */}
                          {t.shapeType === 'rectangle' ? (
                            <rect
                              x={t.x - (t.width || 40)/2}
                              y={t.y - (t.height || 40)/2}
                              width={t.width || 40}
                              height={t.height || 40}
                              fill={isSelected ? `${t.color || '#0ea5e9'}25` : "rgba(0,0,0,0.001)"}
                              stroke={isSelected ? '#fbbf24' : (activeTool !== 'none' ? '#0ea5e9' : 'none')}
                              strokeWidth={(isSelected ? 2 : 1) / zoom}
                              strokeDasharray="4,4"
                              opacity={isSelected ? 0.95 : 0.4}
                              rx={4 / zoom}
                            />
                          ) : t.shapeType === 'polygon' ? (
                            (() => {
                              const pts = (t.points && t.points.length >= 3)
                                ? t.points
                                : generateOrganicShape(t.type, t.terrain, t.name || t.id, t.id);
                              const scaleX = t.width ? t.width / 2 : (t.radius || 30);
                              const scaleY = t.height ? t.height / 2 : (t.radius || 30);
                              const polyPts = pts.map(p => `${t.x + p.x * scaleX},${t.y + p.y * scaleY}`).join(' ');
                              return (
                                <polygon
                                  points={polyPts}
                                  fill={isSelected ? `${t.color || '#0ea5e9'}25` : "rgba(0,0,0,0.001)"}
                                  stroke={isSelected ? '#fbbf24' : (activeTool !== 'none' ? '#0ea5e9' : 'none')}
                                  strokeWidth={(isSelected ? 2 : 1) / zoom}
                                  strokeDasharray="4,4"
                                  opacity={isSelected ? 0.95 : 0.4}
                                />
                              );
                            })()
                          ) : (
                            <circle
                              cx={t.x}
                              cy={t.y}
                              r={radius}
                              fill={isSelected ? `${t.color || '#0ea5e9'}25` : "rgba(0,0,0,0.001)"}
                              stroke={isSelected ? '#fbbf24' : (activeTool !== 'none' ? '#0ea5e9' : 'none')}
                              strokeWidth={(isSelected ? 2 : 1) / zoom}
                              strokeDasharray="4,4"
                              opacity={isSelected ? 0.95 : 0.4}
                            />
                          )}

                          {/* Watermark Label for Macro Regions */}
                          {(isSelected || (zoom > 0.5 && t.type !== 'welt')) && (
                            <text
                              x={t.x}
                              y={t.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? '#fbbf24' : '#94a3b8'}
                              fontSize={Math.max(6, (t.type === 'kontinent' ? 12 : 9) / zoom)}
                              fontFamily="Georgia, serif"
                              fontWeight="bold"
                              letterSpacing="0.08em"
                              opacity={isSelected ? 0.95 : 0.65}
                              className="pointer-events-none select-none"
                            >
                              {t.name}
                            </text>
                          )}

                          {/* Center movement handle for selected macro region */}
                          {isSelected && (
                            <g 
                              className="cursor-move"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const { x, y } = getCanvasCoords(e.clientX, e.clientY);
                                setDraggingTerritoryId(t.id);
                                setTerritoryDragStart({ x: t.x, y: t.y });
                                setDragStart({ x, y });
                              }}
                            >
                              <circle cx={t.x} cy={t.y + 16 / zoom} r={10 / zoom} fill="#3b82f6" stroke="#ffffff" strokeWidth={1.5 / zoom} className="shadow-md" />
                              <path 
                                d={`M ${t.x - 4/zoom} ${t.y + 16/zoom} L ${t.x + 4/zoom} ${t.y + 16/zoom} M ${t.x} ${t.y + 12/zoom} L ${t.x} ${t.y + 20/zoom}`}
                                stroke="#ffffff" 
                                strokeWidth={1.5 / zoom} 
                                strokeLinecap="round"
                              />
                            </g>
                          )}
                        </g>
                      ) : isIsland ? (
                        /* --- 2. TOPOGRAPHICAL NATURAL ISLAND LANDMASSES --- */
                        <g>
                          {(() => {
                            // Organic island shape points (deterministic using t.id seed)
                            const pts = (t.points && t.points.length >= 3) 
                              ? t.points 
                              : generateOrganicShape('insel', t.terrain, t.name || t.id, t.id);

                            // Determine natural terrain color scheme
                            const textCtx = (t.terrain || t.description || t.name || '').toLowerCase();
                            let landFill = '#15803d'; // Emerald green
                            let coastFill = '#eab308'; // Beach sand
                            let topoLine = '#a3e635'; // Topo highlight

                            if (textCtx.includes('vulkan') || textCtx.includes('volcano') || textCtx.includes('feuer') || textCtx.includes('punk hazard')) {
                              landFill = '#334155'; // Basalt slate
                              coastFill = '#ca8a04';
                              topoLine = '#ef4444'; // Lava highlight
                            } else if (textCtx.includes('schnee') || textCtx.includes('eis') || textCtx.includes('drum') || textCtx.includes('yukiryu') || textCtx.includes('frost')) {
                              landFill = '#cbd5e1'; // Snow
                              coastFill = '#94a3b8';
                              topoLine = '#ffffff';
                            } else if (textCtx.includes('wüste') || textCtx.includes('desert') || textCtx.includes('alabasta') || textCtx.includes('sand')) {
                              landFill = '#d97706'; // Desert sand
                              coastFill = '#fef08a';
                              topoLine = '#b45309';
                            } else if (textCtx.includes('dschungel') || textCtx.includes('jungle') || textCtx.includes('wald') || textCtx.includes('green bit')) {
                              landFill = '#14532d'; // Deep jungle
                              coastFill = '#ca8a04';
                              topoLine = '#22c55e';
                            } else if (textCtx.includes('süß') || textCtx.includes('kuchen') || textCtx.includes('whole cake') || textCtx.includes('totto')) {
                              landFill = '#9d174d'; // Sweet pink
                              coastFill = '#fbcfe8';
                              topoLine = '#f472b6';
                            }

                            const scaleX = t.width ? t.width / 2 : (t.radius || 15);
                            const scaleY = t.height ? t.height / 2 : (t.radius || 15);

                            const outerPtsStr = pts.map(p => `${t.x + p.x * scaleX},${t.y + p.y * scaleY}`).join(' ');
                            const landPtsStr = pts.map(p => `${t.x + p.x * (scaleX * 0.82)},${t.y + p.y * (scaleY * 0.82)}`).join(' ');
                            const topoPtsStr = pts.map(p => `${t.x + p.x * (scaleX * 0.48)},${t.y + p.y * (scaleY * 0.48)}`).join(' ');

                            return (
                              <g>
                                {/* Selection Highlight Halo */}
                                {isSelected && (
                                  <polygon
                                    points={pts.map(p => `${t.x + p.x * (radius + 4 / zoom)},${t.y + p.y * (radius + 4 / zoom)}`).join(' ')}
                                    fill="none"
                                    stroke="#fbbf24"
                                    strokeWidth={2 / zoom}
                                    strokeDasharray="4,4"
                                    className="animate-pulse"
                                  />
                                )}

                                {/* Shallow sea shelf aura */}
                                <polygon
                                  points={pts.map(p => `${t.x + p.x * (radius + 2 / zoom)},${t.y + p.y * (radius + 2 / zoom)}`).join(' ')}
                                  fill="#38bdf8"
                                  fillOpacity={0.25}
                                  stroke="#38bdf8"
                                  strokeOpacity={0.4}
                                  strokeWidth={1.5 / zoom}
                                />

                                {/* Sandy Beach Shoreline */}
                                <polygon
                                  points={outerPtsStr}
                                  fill={coastFill}
                                  fillOpacity={0.9}
                                  stroke="#a16207"
                                  strokeWidth={0.8 / zoom}
                                  className="transition-all duration-300"
                                />

                                {/* Land Interior */}
                                <polygon
                                  points={landPtsStr}
                                  fill={landFill}
                                  fillOpacity={0.95}
                                  stroke="#14532d"
                                  strokeWidth={0.8 / zoom}
                                  className="transition-all duration-300"
                                />

                                {/* Topographical Elevation Contour Line */}
                                <polygon
                                  points={topoPtsStr}
                                  fill="none"
                                  stroke={topoLine}
                                  strokeWidth={1 / zoom}
                                  strokeDasharray="2,2"
                                  opacity={0.65}
                                />

                                {/* Island Label */}
                                {(zoom > 0.4 || isSelected) && (
                                  <text
                                    x={t.x}
                                    y={t.y + radius + (10 / zoom)}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={isSelected ? '#fbbf24' : '#f8fafc'}
                                    fontSize={Math.max(4, 9 / zoom)}
                                    fontWeight="800"
                                    letterSpacing="0.04em"
                                    className="pointer-events-none drop-shadow-md select-none font-sans"
                                    style={{ textShadow: '0px 1.5px 2px rgba(0,0,0,0.95)' }}
                                  >
                                    {t.name}
                                  </text>
                                )}
                              </g>
                            );
                          })()}
                        </g>
                      ) : (
                        /* --- 3. POINTS OF INTEREST / CITIES / TOWNS / PORTS / LANDMARKS --- */
                        <g>
                          {/* Selection pulse halo */}
                          {isSelected && (
                            <circle
                              cx={t.x}
                              cy={t.y}
                              r={10 / zoom}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth={2 / zoom}
                              strokeDasharray="3,3"
                              className="animate-pulse"
                            />
                          )}

                          {/* Icon marker */}
                          {(t.type as string) === 'hafen' || t.name.toLowerCase().includes('hafen') || t.name.toLowerCase().includes('port') ? (
                            <g>
                              {/* Port Anchor Pin */}
                              <circle cx={t.x} cy={t.y} r={4.5 / zoom} fill="#0ea5e9" stroke="#ffffff" strokeWidth={1.2 / zoom} className="drop-shadow-sm transition-transform group-hover:scale-125" />
                              <circle cx={t.x} cy={t.y} r={2 / zoom} fill="#ffffff" />
                            </g>
                          ) : (t.type as string) === 'burg' || t.type === 'gebäude' || t.name.toLowerCase().includes('festung') || t.name.toLowerCase().includes('palast') || t.name.toLowerCase().includes('g-') ? (
                            <g>
                              {/* Castle / Fortress Diamond */}
                              <polygon
                                points={`${t.x},${t.y - 5.5 / zoom} ${t.x + 5.5 / zoom},${t.y} ${t.x},${t.y + 5.5 / zoom} ${t.x - 5.5 / zoom},${t.y}`}
                                fill="#334155"
                                stroke="#fbbf24"
                                strokeWidth={1.2 / zoom}
                                className="drop-shadow-sm transition-transform group-hover:scale-125"
                              />
                              <circle cx={t.x} cy={t.y} r={1.5 / zoom} fill="#fbbf24" />
                            </g>
                          ) : (
                            <g>
                              {/* Town / City Dot */}
                              <circle cx={t.x} cy={t.y} r={4.5 / zoom} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.2 / zoom} className="drop-shadow-sm transition-transform group-hover:scale-125" />
                              <circle cx={t.x} cy={t.y} r={2 / zoom} fill="#ffffff" />
                            </g>
                          )}

                          {/* POI Name Label */}
                          {(zoom > 0.4 || isSelected) && (
                            <text
                              x={t.x}
                              y={t.y + (10 / zoom)}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? '#fbbf24' : '#f8fafc'}
                              fontSize={Math.max(4, 8.5 / zoom)}
                              fontWeight="700"
                              letterSpacing="0.03em"
                              className="pointer-events-none drop-shadow-md select-none font-sans"
                              style={{ textShadow: '0px 1.5px 2px rgba(0,0,0,0.95)' }}
                            >
                              {t.name}
                            </text>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}

              {/* Hierarchical Connections on Map in Explore Mode */}
              {viewMode === 'explore' && selectedTerritory && (
                <g className="pointer-events-none">
                  {territories
                    .filter(t => t.parentId === selectedId && visibleLayers[t.type as TerritoryType])
                    .map(child => (
                      <g key={`explore-link-${child.id}`}>
                        {/* Shadow path line */}
                        <line
                          x1={selectedTerritory.x}
                          y1={selectedTerritory.y}
                          x2={child.x}
                          y2={child.y}
                          stroke="#020617"
                          strokeWidth={2.5 / zoom}
                          opacity={0.6}
                        />
                        {/* Visual route connector line */}
                        <line
                          x1={selectedTerritory.x}
                          y1={selectedTerritory.y}
                          x2={child.x}
                          y2={child.y}
                          stroke="#fbbf24"
                          strokeWidth={1.5 / zoom}
                          strokeDasharray={`${6 / zoom},${4 / zoom}`}
                          className="animate-pulse"
                          opacity={0.8}
                        />
                        {/* Glowing node point on child */}
                        <circle
                          cx={child.x}
                          cy={child.y}
                          r={4.5 / zoom}
                          fill="#fbbf24"
                          stroke="#78350f"
                          strokeWidth={1 / zoom}
                          className="animate-pulse"
                        />
                      </g>
                    ))
                  }
                </g>
              )}

              {/* Cursor Drawing Brush Outline Preview */}
              {hoverCoords && (activeTool === 'draw' || activeTool === 'paint' || activeTool === 'fill' || activeTool === 'eraser') && (
                <g className="pointer-events-none">
                  {activeTool === 'eraser' ? (
                    <circle
                      cx={hoverCoords.x}
                      cy={hoverCoords.y}
                      r={24}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={1.5 / zoom}
                      strokeDasharray="3,3"
                      opacity="0.8"
                    />
                  ) : (
                    <>
                      {/* Active Preview shape outline */}
                      {brushShape === 'rectangle' ? (
                        <rect
                          x={hoverCoords.x - (activeTool === 'fill' ? brushSize * 3.5 : brushSize)}
                          y={hoverCoords.y - (activeTool === 'fill' ? brushSize * 3.5 : brushSize)}
                          width={activeTool === 'fill' ? brushSize * 7 : brushSize * 2}
                          height={activeTool === 'fill' ? brushSize * 7 : brushSize * 2}
                          fill={brushColor}
                          fillOpacity="0.15"
                          stroke={brushColor}
                          strokeWidth={1.5 / zoom}
                          strokeDasharray="4,4"
                        />
                      ) : (
                        <polygon
                          points={brushOrganicPoints.map(p => {
                            const r = activeTool === 'fill' ? brushSize * 3.5 : brushSize;
                            return `${hoverCoords.x! + p.x * r},${hoverCoords.y! + p.y * r}`;
                          }).join(' ')}
                          fill={brushColor}
                          fillOpacity="0.15"
                          stroke={brushColor}
                          strokeWidth={1.5 / zoom}
                          strokeDasharray="4,4"
                        />
                      )}
                      
                      {/* Little center pin indicator */}
                      <circle
                        cx={hoverCoords.x}
                        cy={hoverCoords.y}
                        r={3 / zoom}
                        fill="#ffffff"
                        stroke="#000000"
                        strokeWidth={1 / zoom}
                      />
                    </>
                  )}
                </g>
              )}

              {/* Voyage Route Current Layer (renders sailing ship moving) */}
              {sailing.active && (
                <g className="pointer-events-none">
                  {(() => {
                    const sNode = territories.find(t => t.id === sailing.startId);
                    const eNode = territories.find(t => t.id === sailing.endId);
                    if (sNode && eNode) {
                      return (
                        <line
                          x1={sNode.x}
                          y1={sNode.y}
                          x2={eNode.x}
                          y2={eNode.y}
                          stroke="#fbbf24"
                          strokeWidth={2 / zoom}
                          strokeDasharray="4,4"
                          opacity="0.85"
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Little Pirate Ship Icon Sailing */}
                  <g transform={`translate(${sailing.coords.x}, ${sailing.coords.y})`}>
                    <circle r={14 / zoom} fill="#f59e0b" className="animate-ping opacity-25" />
                    <circle r={9 / zoom} fill="#d97706" stroke="#ffffff" strokeWidth={1.2 / zoom} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={11 / zoom}
                      y={0.5 / zoom}
                    >
                      ⛵
                    </text>
                  </g>
                </g>
              )}

            </g>
          </svg>
        </div>
        )}

        {/* Floating Exploration HUD in Anzeige-Modus (View/Explore Mode) */}
        {viewMode === 'explore' && selectedTerritory && (
          <div className="absolute bottom-4 left-4 z-20 w-80 bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-md p-4 animate-in slide-in-from-bottom duration-300 flex flex-col gap-3 max-h-[420px] overflow-hidden">
            {/* HUD Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {renderTerritoryTypeIcon(selectedTerritory.type, "w-5 h-5 text-amber-400")}
                </span>
                <div>
                  <h4 className="text-xs font-serif font-black text-amber-100 tracking-wide line-clamp-1">{selectedTerritory.name}</h4>
                  <span className="text-[8px] text-amber-500/80 font-black uppercase tracking-wider block">{TYPE_LABELS[selectedTerritory.type] || selectedTerritory.type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition-colors"
                title="Auswahl aufheben"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content area: Lore & Hierarchical Substructures */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 min-h-0 text-[10.5px]">
              
              {/* Lore / Description */}
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Beschreibung & Legenden</span>
                <p className="p-2.5 bg-slate-900/40 border border-slate-900/60 rounded-xl text-slate-300 leading-relaxed whitespace-pre-line shadow-inner text-[10px]">
                  {selectedTerritory.description || <span className="text-slate-600 italic">Keine Überlieferungen vorhanden.</span>}
                </p>
              </div>

              {/* Climate & Terrain & Faction Badges */}
              <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                {selectedTerritory.climate && (
                  <div className="px-2 py-1 bg-slate-900/40 border border-slate-900 rounded-lg text-slate-300 truncate">
                    <span className="text-[7px] font-bold text-slate-500 uppercase block leading-none mb-0.5">Klima</span>
                    <span className="font-semibold">{selectedTerritory.climate}</span>
                  </div>
                )}
                {selectedTerritory.terrain && (
                  <div className="px-2 py-1 bg-slate-900/40 border border-slate-900 rounded-lg text-slate-300 truncate">
                    <span className="text-[7px] font-bold text-slate-500 uppercase block leading-none mb-0.5">Gelände</span>
                    <span className="font-semibold">{selectedTerritory.terrain}</span>
                  </div>
                )}
                {selectedTerritory.faction && (
                  <div className="col-span-2 px-2 py-1 bg-slate-900/40 border border-slate-900 rounded-lg text-slate-300 truncate" style={{ borderColor: selectedTerritory.color ? `${selectedTerritory.color}40` : undefined }}>
                    <span className="text-[7px] font-bold text-slate-500 uppercase block leading-none mb-0.5">Herrschaft</span>
                    <span className="font-bold" style={{ color: selectedTerritory.color || undefined }}>{selectedTerritory.faction}</span>
                  </div>
                )}
              </div>

              {/* Hierarchical Navigation Context */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-900/60">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                  Hierarchie erkunden
                </span>
                
                {/* Parent Row */}
                {selectedTerritory.parentId && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] text-slate-500">Übergeordnet:</span>
                    <button
                      onClick={() => handleSelectNode(selectedTerritory.parentId)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-slate-300 border border-slate-800 rounded-md text-[9px] font-bold transition-all truncate max-w-[160px] flex items-center gap-1"
                    >
                      <ArrowLeft className="w-2.5 h-2.5 text-slate-500" />
                      <span>{territories.find(t => t.id === selectedTerritory.parentId)?.name || 'Parent'}</span>
                    </button>
                  </div>
                )}

                {/* Sub-areas / Children list inside the selected territory */}
                {territories.some(t => t.parentId === selectedId) ? (
                  <div className="space-y-1">
                    <span className="text-[8px] text-amber-500/70 font-bold uppercase tracking-wide block">Untergebiete per Klick bereisen ({territories.filter(t => t.parentId === selectedId).length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {territories
                        .filter(t => t.parentId === selectedId)
                        .map(child => (
                          <button
                            key={child.id}
                            onClick={() => handleSelectNode(child.id)}
                            className="px-2 py-1 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/15 hover:border-amber-500/30 text-amber-300 hover:text-amber-200 text-[9.5px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>{renderTerritoryTypeIcon(child.type, "w-3 h-3 text-amber-300")}</span>
                            <span>{child.name}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-600 italic block">Keine weiteren verschachtelten Untergebiete auf tieferen Ebenen.</span>
                )}
              </div>

            </div>

            {/* HUD Footer Actions */}
            <div className="pt-2 border-t border-slate-900 flex gap-2 shrink-0">
              <button
                onClick={() => centerOnNode(selectedTerritory)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                title="Kamera auf dieses Gebiet zentrieren"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Fokussieren</span>
              </button>
              <button
                onClick={triggerVoyageSimulation}
                className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-amber-500/20 transition-colors"
                title="Segelroute von der vorherigen Position hierher zeichnen"
              >
                <span>Reise starten</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* COLUMN 3: Right Sidebar - Selected Territory Properties OR Onboarding Help / Logbuch-Eintrag */}
      {viewMode !== 'explore' && (
        <div className="w-1/2 h-[500px] bg-slate-950 flex flex-col shrink-0 z-20 overflow-y-auto custom-scrollbar order-3" id="map-properties-sidebar">
        
        {selectedTerritory ? (
          // RENDER PROPERTIES ONLY IF A TERRITORY IS SELECTED
          <div className="flex flex-col flex-1 animate-in slide-in-from-right-2 duration-200">
            <div className="p-3.5 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-amber-400">
                  {renderTerritoryTypeIcon(selectedTerritory.type, "w-4 h-4 text-amber-400")}
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                    {isEditingProperties ? 'Gebiet bearbeiten' : 'Logbuch-Eintrag'}
                  </h3>
                  <span className="text-[9px] text-amber-500 font-bold block">
                    {TYPE_LABELS[selectedTerritory.type] || selectedTerritory.type} - {selectedTerritory.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenSmartFillModal(selectedTerritory.id)}
                  className="px-2 py-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1"
                  title="Dieses Gebiet per KI Smart-Fill ausfüllen & Codex synchronisieren"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span>Smart-Fill</span>
                </button>

                <button
                  onClick={() => setIsEditingProperties(!isEditingProperties)}
                  className="px-2 py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1"
                  title={isEditingProperties ? "Zum Logbuch wechseln" : "Bearbeiten-Menü öffnen"}
                >
                  {isEditingProperties ? '📖 Logbuch' : '✏️ Bearbeiten'}
                </button>

                {selectedTerritory.type !== 'welt' && (
                  <button
                    onClick={() => setConfirmingDeleteId(selectedTerritory.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 rounded-lg transition-colors"
                    title="Dieses Gebiet löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button 
                  onClick={() => setSelectedId(null)} 
                  className="text-slate-500 hover:text-slate-300 hover:bg-slate-900 p-1 rounded-lg transition-colors"
                  title="Auswahl aufheben"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isEditingProperties ? (
              /* READ-ONLY DISPLAY MODE (NAUTICAL LOGBOOK STYLE) */
              <div className="p-4 space-y-4 flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                  
                  {/* Decorative Title Card */}
                  <div className="text-center py-4 px-2 bg-amber-500/[0.03] border border-amber-500/15 rounded-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/[0.02] rounded-full border border-dashed border-amber-500/10 pointer-events-none" />
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mx-auto mb-2 text-amber-400">
                      {renderTerritoryTypeIcon(selectedTerritory.type, "w-6 h-6 text-amber-400")}
                    </div>
                    <h2 className="text-lg font-black text-amber-100 tracking-wide font-serif leading-snug">{selectedTerritory.name}</h2>
                    <span className="text-[8.5px] uppercase font-black text-amber-500/80 tracking-widest block mt-1">
                      {TYPE_LABELS[selectedTerritory.type] || selectedTerritory.type}
                    </span>
                    
                    {/* Path breadcrumb */}
                    {selectedTerritory.parentId && (
                      <div className="text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <span className="text-slate-600">In:</span>
                        <button
                          onClick={() => handleSelectNode(selectedTerritory.parentId)}
                          className="font-bold text-amber-500/90 hover:text-amber-400 underline transition-all text-left truncate max-w-[160px]"
                        >
                          {territories.find(t => t.id === selectedTerritory.parentId)?.name || 'Übergeordnetem Gebiet'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation / Actions Toolbar inside sidebar */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => centerOnNode(selectedTerritory)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                      title="Kamera auf dieses Gebiet zentrieren"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>Fokussieren</span>
                    </button>
                    <button
                      onClick={triggerVoyageSimulation}
                      className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-amber-500/20 transition-colors animate-pulse"
                      title="Schnittige Segelroute von der vorherigen Insel hierher zeichnen"
                    >
                      <span>⛵</span>
                      <span>Segelreise</span>
                    </button>
                  </div>

                  {/* Description Box (Paper Logbook Entry style) */}
                  <div className="space-y-1.5">
                    <span className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Beschreibung & Mythologie</span>
                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl leading-relaxed text-[11px] text-slate-300 whitespace-pre-line shadow-inner">
                      {selectedTerritory.description || (
                        <span className="text-slate-600 italic">Noch kein Logbucheintrag vorhanden. Klicke unten auf "Eigenschaften bearbeiten", um etwas hinzuzufügen.</span>
                      )}
                    </div>
                  </div>

                  {/* Climate, Terrain, Faction Info Badges */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {/* Climate */}
                    <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Klima</span>
                        <span className="text-[10.5px] font-bold text-slate-300 truncate block">
                          {selectedTerritory.climate || <span className="text-slate-600 font-normal italic">Unbekannt / Magisch</span>}
                        </span>
                      </div>
                    </div>

                    {/* Terrain */}
                    <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Wind className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Gelände</span>
                        <span className="text-[10.5px] font-bold text-slate-300 truncate block">
                          {selectedTerritory.terrain || <span className="text-slate-600 font-normal italic">Unbekannt</span>}
                        </span>
                      </div>
                    </div>

                    {/* Faction */}
                    <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0" style={{ backgroundColor: selectedTerritory.color ? `${selectedTerritory.color}15` : undefined }}>
                        <Shield className="w-4 h-4" style={{ color: selectedTerritory.color || '#38bdf8' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Vorherrschende Macht</span>
                        <span className="text-[10.5px] font-bold text-slate-300 truncate block" style={{ color: selectedTerritory.color || undefined }}>
                          {selectedTerritory.faction || <span className="text-slate-600 font-normal italic">Keine Fraktion</span>}
                        </span>
                      </div>
                    </div>

                    {/* Geografie Größe / Maßstab */}
                    <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Geografie Größe & Maßstab</span>
                        <span className="text-[10.5px] font-bold text-amber-300 truncate block">
                          {selectedTerritory.size || <span className="text-slate-600 font-normal italic">Standard-Maßstab</span>}
                        </span>
                      </div>
                    </div>

                    {/* Ruler & Culture */}
                    {(selectedTerritory.ruler || selectedTerritory.culture || selectedTerritory.biome) && (
                      <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                        {selectedTerritory.biome && (
                          <div className="text-[10px] text-slate-300"><span className="text-slate-500 font-bold">Biom:</span> {selectedTerritory.biome}</div>
                        )}
                        {selectedTerritory.ruler && (
                          <div className="text-[10px] text-slate-300"><span className="text-slate-500 font-bold">Herrscher:</span> {selectedTerritory.ruler}</div>
                        )}
                        {selectedTerritory.culture && (
                          <div className="text-[10px] text-slate-300"><span className="text-slate-500 font-bold">Kultur & Völker:</span> {selectedTerritory.culture}</div>
                        )}
                      </div>
                    )}

                    {/* Wirtschaft & Militär */}
                    {(selectedTerritory.trade || selectedTerritory.resources || selectedTerritory.militaryStrength || selectedTerritory.defense || selectedTerritory.dangerLevel) && (
                      <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1.5 text-[10px]">
                        {(selectedTerritory.trade || selectedTerritory.resources) && (
                          <div className="space-y-0.5">
                            <span className="text-[8.5px] font-black text-amber-500/80 uppercase tracking-widest block">Wirtschaft & Handel</span>
                            {selectedTerritory.trade && (
                              <div className="text-slate-300"><span className="text-slate-500 font-bold">Handel:</span> {selectedTerritory.trade}</div>
                            )}
                            {selectedTerritory.resources && (
                              <div className="text-slate-300"><span className="text-slate-500 font-bold">Ressourcen:</span> {selectedTerritory.resources}</div>
                            )}
                            {(selectedTerritory.exports || selectedTerritory.imports) && (
                              <div className="text-slate-400 pl-2 text-[9.5px]">
                                {selectedTerritory.exports && <div>Exporte: {selectedTerritory.exports}</div>}
                                {selectedTerritory.imports && <div>Importe: {selectedTerritory.imports}</div>}
                              </div>
                            )}
                          </div>
                        )}

                        {(selectedTerritory.militaryStrength || selectedTerritory.defense || selectedTerritory.dangerLevel) && (
                          <div className="space-y-0.5 pt-1 border-t border-slate-800/40">
                            <span className="text-[8.5px] font-black text-rose-500/80 uppercase tracking-widest block">Militär & Verteidigung</span>
                            {selectedTerritory.militaryStrength && (
                              <div className="text-slate-300"><span className="text-slate-500 font-bold">Militär:</span> {selectedTerritory.militaryStrength}</div>
                            )}
                            {selectedTerritory.defense && (
                              <div className="text-slate-300"><span className="text-slate-500 font-bold">Befestigung:</span> {selectedTerritory.defense}</div>
                            )}
                            {selectedTerritory.dangerLevel && (
                              <div className="text-slate-300 flex items-center gap-1">
                                <span className="text-slate-500 font-bold">Bedrohung:</span>
                                <span className={`px-1 rounded text-[9px] ${
                                  selectedTerritory.dangerLevel.toLowerCase().includes('extrem') || selectedTerritory.dangerLevel.toLowerCase().includes('hoch')
                                    ? 'bg-rose-500/20 text-rose-400 font-black'
                                    : selectedTerritory.dangerLevel.toLowerCase().includes('mittel')
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>{selectedTerritory.dangerLevel}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Linked Codex Items */}
                  {linkedLoreEntries.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 space-y-1.5">
                      <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-600" /> Verknüpfte Legenden & Codex-Einträge
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {linkedLoreEntries.map(entry => (
                          <div key={entry.id} className="p-2 rounded bg-slate-900/50 border border-slate-900">
                            <span className="text-[7.5px] font-bold text-amber-500/80 uppercase block">{entry.category}</span>
                            <h4 className="text-[10px] font-bold text-slate-300 mt-0.5">{entry.title}</h4>
                            <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">{entry.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Primary Buttons for Logbook Mode */}
                <div className="pt-4 border-t border-slate-900 space-y-2">
                  <button
                    onClick={() => setIsEditingProperties(true)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Eigenschaften bearbeiten</span>
                  </button>

                  {selectedTerritory.type !== 'welt' && (
                    confirmingDeleteId === selectedTerritory.id ? (
                      <div className="bg-red-950/50 border border-red-900/60 p-2.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <p className="text-[11px] font-bold text-red-300 text-center">
                          "{selectedTerritory.name}" und alle Untergebiete löschen?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              deleteTerritory(selectedTerritory.id);
                              setConfirmingDeleteId(null);
                            }}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Ja, löschen</span>
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(selectedTerritory.id)}
                        className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Gebiet löschen</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              /* COMPACT EDITING FORM MODE */
              <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between min-h-0 overflow-y-auto custom-scrollbar">
                <div className="space-y-3.5">
                  
                  {/* Delete Confirmation Alert Banner at top of form */}
                  {selectedTerritory.type !== 'welt' && confirmingDeleteId === selectedTerritory.id && (
                    <div className="bg-red-950/70 border border-red-900/80 p-3 rounded-xl space-y-2 animate-in fade-in duration-200 shadow-xl">
                      <p className="text-xs font-bold text-red-200 text-center leading-snug">
                        "{selectedTerritory.name}" und alle Untergebiete löschen?
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteTerritory(selectedTerritory.id);
                            setConfirmingDeleteId(null);
                          }}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Ja, löschen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Name des Gebiets</label>
                    <input
                      type="text"
                      value={selectedTerritory.name}
                      onChange={(e) => updateTerritory(selectedId!, { name: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none transition-all font-bold"
                    />
                  </div>

                  {/* Type Option with Clean Categorization */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Gebietskategorie & Typ</label>
                    <select
                      value={selectedTerritory.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        const generatedPoints = generateOrganicShape(newType, selectedTerritory.terrain, selectedTerritory.name, selectedTerritory.id);
                        updateTerritory(selectedId!, { 
                          type: newType,
                          shapeType: 'polygon',
                          points: generatedPoints,
                          radius: selectedTerritory.radius || 20
                        });
                      }}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none cursor-pointer"
                    >
                      {TERRITORY_CATEGORIES.map(cat => (
                        <optgroup key={cat.key} label={cat.label}>
                          {cat.types.map(t => (
                            <option key={t} value={t}>{TYPE_LABELS[t] || (t.charAt(0).toUpperCase() + t.slice(1))}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Settlement Sub-Type (Conditional for stadt, dorf, hafen) */}
                  {['stadt', 'dorf', 'hafen'].includes(selectedTerritory.type) && (
                    <div className="space-y-1 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="w-3 h-3" /> Siedlungstyp
                      </label>
                      <select
                        value={selectedTerritory.settlementType || (selectedTerritory.type === 'hafen' ? 'hafenstadt' : selectedTerritory.type === 'dorf' ? 'dorf' : 'stadt')}
                        onChange={(e) => updateTerritory(selectedId!, { settlementType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs focus:border-amber-500 outline-none cursor-pointer font-medium"
                      >
                        {SETTLEMENT_TYPES.map(st => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* POI Sub-Type (Conditional for ort, festung, gebäude) */}
                  {['ort', 'festung', 'gebäude'].includes(selectedTerritory.type) && (
                    <div className="space-y-1 p-2 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                      <label className="text-[9px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Castle className="w-3 h-3" /> Landmarken- / POI-Klassifizierung
                      </label>
                      <select
                        value={selectedTerritory.poiType || (selectedTerritory.type === 'festung' ? 'festung' : 'ort')}
                        onChange={(e) => updateTerritory(selectedId!, { poiType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs focus:border-rose-500 outline-none cursor-pointer font-medium"
                      >
                        {POI_TYPES.map(pt => (
                          <option key={pt.value} value={pt.value}>{pt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Parent territory hierarchical nesting choice (Geographical container) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Geografisch übergeordnet</label>
                      <span className="text-[8px] text-slate-500">Physische Lage</span>
                    </div>
                    <select
                      value={selectedTerritory.parentId || ''}
                      onChange={(e) => updateTerritory(selectedId!, { parentId: e.target.value || null })}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none cursor-pointer text-slate-300"
                    >
                      <option value="">(Keines - Welt-Ebene)</option>
                      {territories
                        .filter(t => t.id !== selectedId && !['ort', 'stadt', 'dorf', 'hafen', 'festung', 'gebäude'].includes(t.type))
                        .map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({TYPE_LABELS[t.type] || t.type})</option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Political Control & Faction */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Politische Herrschaft (Fraktion)</label>
                      <span className="text-[8px] text-slate-500">Herrschaft & Macht</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedTerritory.controlledByFactionId || ''}
                        onChange={(e) => {
                          const fId = e.target.value;
                          const foundFaction = (loreDatabase || []).find(l => l.id === fId && l.category === 'Fraktionen');
                          updateTerritory(selectedId!, { 
                            controlledByFactionId: fId || undefined,
                            faction: foundFaction ? foundFaction.title : selectedTerritory.faction
                          });
                        }}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none cursor-pointer"
                      >
                        <option value="">(Fraktion wählen...)</option>
                        {(loreDatabase || [])
                          .filter(l => l.category === 'Fraktionen')
                          .map(f => (
                            <option key={f.id} value={f.id}>{f.title}</option>
                          ))
                        }
                      </select>
                      <input
                        type="text"
                        value={selectedTerritory.faction || ''}
                        onChange={(e) => updateTerritory(selectedId!, { faction: e.target.value })}
                        placeholder="oder Freitext..."
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Description & Lore */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Beschreibung & Lore (Logbuch)</label>
                    <AutoExpandingTextarea
                      value={selectedTerritory.description || ''}
                      onChange={(e) => updateTerritory(selectedId!, { description: e.target.value })}
                      placeholder="Atmosphäre, Landmarken, Gerüchte oder Legenden..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none min-h-[64px] leading-relaxed"
                    />
                  </div>

                  {/* Climate & Terrain */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Klima</label>
                      <input
                        type="text"
                        value={selectedTerritory.climate || ''}
                        onChange={(e) => updateTerritory(selectedId!, { climate: e.target.value })}
                        placeholder="z.B. Winterlich"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Gelände</label>
                      <input
                        type="text"
                        value={selectedTerritory.terrain || ''}
                        onChange={(e) => updateTerritory(selectedId!, { terrain: e.target.value })}
                        placeholder="z.B. Sandwüste"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Faction & Color */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vorherrschende Macht</label>
                      <input
                        type="text"
                        value={selectedTerritory.faction || ''}
                        onChange={(e) => updateTerritory(selectedId!, { faction: e.target.value })}
                        placeholder="z.B. Piraten-Allianz"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kartenfarbe</label>
                      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-1">
                        <input
                          type="color"
                          value={selectedTerritory.color || '#334155'}
                          onChange={(e) => updateTerritory(selectedId!, { color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-[9px] text-slate-400 font-mono uppercase">{selectedTerritory.color || '#334155'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Geografie Größe & Biom */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Geografie Größe / Maßstab</label>
                      <input
                        type="text"
                        value={selectedTerritory.size || ''}
                        onChange={(e) => updateTerritory(selectedId!, { size: e.target.value })}
                        placeholder="z.B. 15.000 km² / 1 Kachel = 100m"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-amber-300 font-medium text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Biom</label>
                      <input
                        type="text"
                        value={selectedTerritory.biome || ''}
                        onChange={(e) => updateTerritory(selectedId!, { biome: e.target.value })}
                        placeholder="z.B. Boreal-Wald, Tropen..."
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Herrscher & Kultur */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Herrscher / Anführer</label>
                      <input
                        type="text"
                        value={selectedTerritory.ruler || ''}
                        onChange={(e) => updateTerritory(selectedId!, { ruler: e.target.value })}
                        placeholder="z.B. Lord Vane"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kultur / Völker</label>
                      <input
                        type="text"
                        value={selectedTerritory.culture || ''}
                        onChange={(e) => updateTerritory(selectedId!, { culture: e.target.value })}
                        placeholder="z.B. Seefahrer & Waldelfen"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Einwohnerzahl & Bedrohungsstufe */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Einwohnerzahl</label>
                      <input
                        type="text"
                        value={selectedTerritory.population || ''}
                        onChange={(e) => updateTerritory(selectedId!, { population: e.target.value })}
                        placeholder="z.B. 12.000 Einwohner"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bedrohungsstufe</label>
                      <select
                        value={selectedTerritory.dangerLevel || 'Sicher'}
                        onChange={(e) => updateTerritory(selectedId!, { dangerLevel: e.target.value })}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      >
                        <option value="Sicher">Sicher</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Hoch">Hoch</option>
                        <option value="Extrem gefährlich">Extrem gefährlich</option>
                        <option value="Unbekannt">Unbekannt</option>
                      </select>
                    </div>
                  </div>

                  {/* Wirtschaft & Ressourcen */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Handel / Wirtschaft</label>
                      <input
                        type="text"
                        value={selectedTerritory.trade || ''}
                        onChange={(e) => updateTerritory(selectedId!, { trade: e.target.value })}
                        placeholder="z.B. Florierend / Kaum Handel"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ressourcen</label>
                      <input
                        type="text"
                        value={selectedTerritory.resources || ''}
                        onChange={(e) => updateTerritory(selectedId!, { resources: e.target.value })}
                        placeholder="z.B. Holz, Kohle, Eisenerz"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Exporte & Importe */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Exporte</label>
                      <input
                        type="text"
                        value={selectedTerritory.exports || ''}
                        onChange={(e) => updateTerritory(selectedId!, { exports: e.target.value })}
                        placeholder="z.B. Fisch, Getreide"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Importe</label>
                      <input
                        type="text"
                        value={selectedTerritory.imports || ''}
                        onChange={(e) => updateTerritory(selectedId!, { imports: e.target.value })}
                        placeholder="z.B. Wein, Salz, Gewürze"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Militärstärke & Verteidigung */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Militärische Stärke</label>
                      <input
                        type="text"
                        value={selectedTerritory.militaryStrength || ''}
                        onChange={(e) => updateTerritory(selectedId!, { militaryStrength: e.target.value })}
                        placeholder="z.B. Miliz / Starke Garnison"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Verteidigungsanlagen</label>
                      <input
                        type="text"
                        value={selectedTerritory.defense || ''}
                        onChange={(e) => updateTerritory(selectedId!, { defense: e.target.value })}
                        placeholder="z.B. Holzpalisade / Stadtmauern"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Shape & Geometry Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Form & Geometrie</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => updateTerritory(selectedId!, { shapeType: 'rectangle' })}
                        className={`py-1.5 rounded text-center transition-all ${
                          (selectedTerritory.shapeType || 'rectangle') === 'rectangle'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Rechteck
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPts = generateOrganicShape(selectedTerritory.type, selectedTerritory.terrain, selectedTerritory.name, `${selectedTerritory.id}-${Date.now()}`);
                          updateTerritory(selectedId!, { shapeType: 'polygon', points: newPts });
                        }}
                        className={`py-1.5 rounded text-center transition-all ${
                          selectedTerritory.shapeType === 'polygon'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Organisch
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTerritory(selectedId!, { shapeType: 'circle' })}
                        className={`py-1.5 rounded text-center transition-all ${
                          selectedTerritory.shapeType === 'circle'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Kreis
                      </button>
                    </div>
                  </div>

                  {/* Independent Width Slider */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Breite (X-Achse)</label>
                      <span className="text-[9.5px] font-bold text-amber-500">{selectedTerritory.width || selectedTerritory.radius || 40}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max={selectedTerritory.type === 'welt' ? 2000 : 1200}
                      step="5"
                      value={selectedTerritory.width || selectedTerritory.radius || 40}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        updateTerritory(selectedId!, { width: v });
                      }}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Independent Height Slider */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Höhe (Y-Achse)</label>
                      <span className="text-[9.5px] font-bold text-amber-500">{selectedTerritory.height || selectedTerritory.radius || 40}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max={selectedTerritory.type === 'welt' ? 2000 : 1200}
                      step="5"
                      value={selectedTerritory.height || selectedTerritory.radius || 40}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        updateTerritory(selectedId!, { height: v });
                      }}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Radius / Circular Scale Slider */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Radius / Machtbereich</label>
                      <span className="text-[9.5px] font-bold text-amber-500">{selectedTerritory.radius || Math.round((selectedTerritory.width || 40)/2)}px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max={selectedTerritory.type === 'welt' ? 1000 : 600}
                      step="5"
                      value={selectedTerritory.radius || Math.round((selectedTerritory.width || 40)/2)}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        updateTerritory(selectedId!, { radius: v });
                      }}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Regenerate Organic Form if Polygon */}
                  {selectedTerritory.shapeType === 'polygon' && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPts = generateOrganicShape(selectedTerritory.type, selectedTerritory.terrain, selectedTerritory.name, `${selectedTerritory.id}-${Date.now()}`);
                        updateTerritory(selectedId!, { points: newPts });
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Organische Form neu generieren</span>
                    </button>
                  )}

                  {/* Connected Economic Holdings */}
                  {(() => {
                    const holdings = (world.economyConfig?.holdings || world.economy?.holdings || []).filter(
                      h => h.territoryId === selectedTerritory.id || (h.locationName && selectedTerritory.name && h.locationName.toLowerCase() === selectedTerritory.name.toLowerCase())
                    );
                    if (holdings.length === 0) return null;
                    return (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Store className="w-3 h-3 text-amber-400" /> Ansässige Betriebe ({holdings.length})
                          </label>
                        </div>
                        <div className="space-y-1">
                          {holdings.map(h => (
                            <div key={h.id} className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-slate-200">{h.name}</div>
                                <div className="text-[9.5px] text-slate-400">
                                  {h.type} • Stufe {h.level} {h.ownerType === 'faction' && h.ownerFactionName ? `• Besitzer: ${h.ownerFactionName}` : h.assignedCharacterName ? `• Betreiber: ${h.assignedCharacterName}` : ''}
                                </div>
                              </div>
                              <div className="text-right text-[10px] font-mono text-emerald-400">
                                +{h.incomePerInterval - h.upkeepPerInterval} G
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Connected Codex Lore Entries */}
                  {(() => {
                    const relatedLore = (loreDatabase || []).filter(
                      l => l.details?.territoryId === selectedTerritory.id || (l.details?.parentPlaceId && selectedTerritory.name && l.details.parentPlaceId.toLowerCase() === selectedTerritory.name.toLowerCase())
                    );
                    if (relatedLore.length === 0) return null;
                    return (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-sky-400" /> Verknüpfte Codex-Einträge ({relatedLore.length})
                          </label>
                        </div>
                        <div className="space-y-1">
                          {relatedLore.map(l => (
                            <div key={l.id} className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-300 truncate">{l.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded uppercase font-bold">{l.category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Repair / Restore Canonical Map Boundaries */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleRepairOnePieceLayout}
                      className="w-full py-2 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 text-sky-300 hover:text-sky-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>🔄 Weltkarte, Meere & Inseln synchronisieren</span>
                    </button>
                  </div>

                </div>

                {/* Footer Controls for Editing Mode */}
                <div className="pt-4 border-t border-slate-900 space-y-2">
                  <button
                    onClick={() => setIsEditingProperties(false)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Zurück zum Logbuch</span>
                  </button>

                  {selectedTerritory.type !== 'welt' && (
                    confirmingDeleteId === selectedTerritory.id ? (
                      <div className="bg-red-950/50 border border-red-900/60 p-2.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <p className="text-[11px] font-bold text-red-300 text-center">
                          "{selectedTerritory.name}" und alle Untergebiete löschen?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              deleteTerritory(selectedTerritory.id);
                              setConfirmingDeleteId(null);
                            }}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Ja, löschen</span>
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(selectedTerritory.id)}
                        className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Gebiet löschen</span>
                      </button>
                    )
                  )}
                </div>

              </div>
            )}
          </div>
        ) : (
          // ONBOARDING PANEL (SHOWED BY DEFAULT TO ENCOURAGE QUICK DRAW -> SELECT -> EDIT WORKFLOW)
          <div className="p-4 space-y-5 flex flex-col justify-between flex-1 animate-in fade-in duration-300">
            
            <div className="space-y-4">
              
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Kreativer Ablauf
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Erstelle deine Kontinente, Meere und Inseln schnell, intuitiv und spielerisch in drei Schritten:
                </p>
              </div>

              {/* 3 Step visual tutorial flow */}
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-bold text-slate-300 leading-snug">Gebiet auf Karte zeichnen</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">
                      Wähle links eine Geländekategorie (z.B. Insel oder Stadt). Nutze das **Zeichnen** oder **Malpinsel** Werkzeug, um das Areal direkt auf der Karte zu malen.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-bold text-slate-300 leading-snug">Gebiet auswählen</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">
                      Wechsle auf das **Auswählen-Zeiger** Werkzeug und klicke auf dein gezeichnetes Element auf der Karte, oder wähle es direkt aus der **🌳 Welt-Struktur** aus.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-bold text-slate-300 leading-snug">Eigenschaften bearbeiten</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">
                      Sobald du ein Gebiet ausgewählt hast, erscheint an dieser Stelle sein Eigenschaftenblatt (Logbuch), um Name, Klima, Fraktion und Lore einzutragen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard Hotkeys List */}
              <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl space-y-1.5">
                <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Schnelltasten (Hotkeys)</span>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[8.5px] text-slate-400 font-medium">
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Auswählen:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">V</kbd></div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Zeichnen:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">B</kbd></div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Malpinsel:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">P</kbd></div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Radierer:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">E</kbd></div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Füllen:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">G</kbd></div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-0.5"><span className="text-slate-500">Kamera:</span> <kbd className="bg-slate-950 px-1 rounded text-amber-500">H</kbd></div>
                </div>
              </div>

            </div>

            {/* KI Welten-Schmiede section */}
            <div className="border-t border-slate-900 pt-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block pt-0.5">KI Welten-Schmiede</span>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal">
                Modelliere die Geographie deiner gesamten Welt automatisch über eine Textbeschreibung:
              </p>
              
              <div className="space-y-1.5">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Beschreibe z.B. 'Ein großes Vulkanarchipel im Westen, getrennt von zwei eisigen Kontinenten im Norden'..."
                  rows={2}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-[9.5px] text-slate-200 focus:border-amber-500 outline-none resize-none leading-relaxed"
                />
                <button
                  onClick={handleInvokeAiForge}
                  disabled={isGenerating}
                  className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Geographie erschaffen</span>
                </button>

                <button
                  onClick={() => handleOpenSmartFillModal(selectedId)}
                  className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 border border-amber-400/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Smart-Fill (Ort, Dörfer & Codex)</span>
                </button>
              </div>

              {successMessage && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] text-emerald-400 leading-normal animate-in zoom-in-95 duration-200">
                  {successMessage}
                </div>
              )}
            </div>

          </div>
        )}

        </div>
      )}

      {/* KI SMART-FILL MODAL DIALOG (SCHRITT 4) */}
      {isSmartFillModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-5 relative text-slate-100">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 flex items-center justify-center border border-amber-500/30 text-amber-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                    KI Smart-Fill (Schritt 4: Ort & Codex gestalten)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generiere & synchronisiere Städte, Dörfer, Häfen und Landmarken inklusive Codex-Einträgen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSmartFillModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target territory selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ziel-Gebiet für den Smart-Fill
              </label>
              <select
                value={smartFillTargetId || ''}
                onChange={(e) => setSmartFillTargetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-amber-400 outline-none focus:border-amber-500"
              >
                {territories.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({TYPE_LABELS[t.type] || t.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Deine Anweisung (Einwohner, Städte, Dörfer, Häfen & Merkmale)
              </label>
              <textarea
                value={smartFillPrompt}
                onChange={(e) => setSmartFillPrompt(e.target.value)}
                placeholder="z.B. '12.000 Einwohner verteilt in 1 große Haupt-Stadt und 3 kleine Dörfer plus 1 Hafen, 1 erloschener Vulkan im Norden...'"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 leading-relaxed resize-none"
              />

              {/* Quick Presets */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Schnell-Vorschläge (Klick zum Ausfüllen):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "12.000 Einwohner: 1 große Haupt-Stadt, 3 kleine Dörfer, 1 Marine-Hafen & 1 Vulkan im Norden",
                    "Piratenarchipel mit 1 Hauptfestung, 2 Fischerdörfern & 1 Schiffsfriedhof in einer Bucht",
                    "Handelsinsel mit 1 großen Festungsstadt, 2 Nomadendörfern & 1 antiken Magieturm-Ruine",
                    "Schmiedeinsel mit 5.000 Einwohnern, 1 Bergdorf, 1 Großschmiede & 1 geschützten Tiefseehafen"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSmartFillPrompt(preset)}
                      className="text-[9.5px] font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700/60 px-2.5 py-1 rounded-lg transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation notice */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[10.5px] text-indigo-300 space-y-1 leading-relaxed">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Automatische Codex- & Karten-Synchronisierung</span>
              </div>
              <p>
                Die KI generiert das ausgewählte Gebiet neu, platziert alle gewünschten Untergebiete und Straßen logisch auf der Karte und <strong>bereinigt veraltete Codex-Einträge</strong> (wie z.B. gelöschte Vulkane), damit Weltkarte und Lore-Datenbank 100% einheitlich sind.
              </p>
            </div>

            {smartFillError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/50 text-[11px] text-red-300">
                {smartFillError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSmartFillModalOpen(false)}
                disabled={isSmartFilling}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleExecuteSmartFill}
                disabled={isSmartFilling}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                {isSmartFilling ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                    <span>Generiere & Harmonisiere Codex...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Smart-Fill ausführen</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* World Map Creator Modal */}
      {isWorldCreatorModalOpen && (
        <WorldMapCreatorModal
          isOpen={isWorldCreatorModalOpen}
          onClose={() => setIsWorldCreatorModalOpen(false)}
          world={world}
          onSaveWorldMap={handleSaveFromWorldCreator}
          loreDatabase={loreDatabase}
          selectedTags={selectedTags}
        />
      )}

    </div>
  );
};
