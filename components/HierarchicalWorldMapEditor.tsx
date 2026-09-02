import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WorldSetting, LoreEntry, Territory } from '../types';
import { getOnePieceTerritories } from '../utils/onePiecePreset';
import { generateOrganicShape, calculateTerritoryDistances } from '../utils/mapUtils';
import { 
  Compass, 
  Anchor, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  MapPin, 
  Globe, 
  Globe2,
  Waves,
  Mountain,
  Palmtree,
  Trees,
  Building2,
  Castle,
  Ship,
  Footprints,
  Sword,
  Info, 
  X, 
  Maximize, 
  Wind, 
  Sun, 
  Shield, 
  ArrowLeft,
  Navigation,
  HelpCircle,
  BookOpen,
  Map,
  Sparkles,
  Layers,
  ChevronUp,
  Trash2
} from 'lucide-react';

interface HierarchicalWorldMapViewerProps {
  world: WorldSetting;
  onChangeWorld: React.Dispatch<React.SetStateAction<WorldSetting>>;
  loreDatabase: LoreEntry[];
  onUpdateLore?: React.Dispatch<React.SetStateAction<LoreEntry[]>>;
}

const renderTerritoryIcon = (type?: string, className = "w-3.5 h-3.5") => {
  const t = (type || '').toLowerCase();
  if (t === 'welt') return <Globe2 className={className} />;
  if (t === 'meer' || t === 'ozean' || t === 'see' || t === 'bucht' || t === 'fluss' || t === 'wasser') return <Waves className={className} />;
  if (t === 'kontinent' || t === 'biome_gebirge') return <Mountain className={className} />;
  if (t === 'insel') return <Palmtree className={className} />;
  if (t === 'region' || t === 'zone' || t === 'biome_wald') return <Trees className={className} />;
  if (t === 'stadt' || t === 'dorf' || t === 'hafen') return <Building2 className={className} />;
  if (t === 'gebäude' || t === 'festung') return <Castle className={className} />;
  return <MapPin className={className} />;
};

// Map territory type to tailwind colors
const TYPE_COLORS: Record<string, string> = {
  'welt': 'border-slate-800 text-slate-400 bg-slate-950/20',
  'meer': 'border-sky-800 text-sky-400 bg-sky-950/20',
  'kontinent': 'border-amber-800 text-amber-500 bg-amber-950/20',
  'insel': 'border-emerald-800 text-emerald-400 bg-emerald-950/20',
  'region': 'border-indigo-800 text-indigo-400 bg-indigo-950/20',
  'zone': 'border-teal-800 text-teal-400 bg-teal-950/20',
  'ort': 'border-orange-800 text-orange-400 bg-orange-950/20',
  'stadt': 'border-violet-800 text-violet-400 bg-violet-950/20',
  'gebäude': 'border-rose-800 text-rose-400 bg-rose-950/20'
};

export const HierarchicalWorldMapViewer: React.FC<HierarchicalWorldMapViewerProps> = ({
  world,
  onChangeWorld,
  loreDatabase,
  onUpdateLore
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

  // View state
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({});
  
  // Voyage/Sailing animation state
  const [sailing, setSailing] = useState<{
    active: boolean;
    startId: string | null;
    endId: string | null;
    progress: number; // 0..1
    coords: { x: number; y: number };
  }>({
    active: false,
    startId: null,
    endId: null,
    progress: 0,
    coords: { x: 0, y: 0 }
  });

  // Track the previous selected node to enable route simulation between any two clicked nodes
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Safely delete territory and all child sub-territories
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

  // Auto-set the activeParentId to the root node if it exists
  const rootNode = useMemo(() => {
    return territories.find(t => t.parentId === null && t.type === 'welt') || 
           territories.find(t => t.parentId === null);
  }, [territories]);

  useEffect(() => {
    if (rootNode && activeParentId === null) {
      setActiveParentId(rootNode.id);
    }
  }, [rootNode, activeParentId]);

  // Populate One Piece preset
  const handleLoadPreset = () => {
    const opTerritories = getOnePieceTerritories(world.title || 'One Piece');
    onChangeWorld(prev => ({
      ...prev,
      isOnePiece: true,
      territories: opTerritories
    }));
    const root = opTerritories.find(t => t.parentId === null);
    if (root) {
      setActiveParentId(root.id);
      setSelectedId(root.id);
    }
  };

  // Find a node by ID
  const selectedTerritory = useMemo(() => {
    return territories.find(t => t.id === selectedId) || null;
  }, [territories, selectedId]);

  const activeParentTerritory = useMemo(() => {
    return territories.find(t => t.id === activeParentId) || null;
  }, [territories, activeParentId]);

  // Breadcrumbs calculation (from active parent up to the absolute root)
  const breadcrumbs = useMemo(() => {
    const crumbs: Territory[] = [];
    let currentId = activeParentId;
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
  }, [territories, activeParentId]);

  // Compute active children in the current viewport/drill-down level
  const visibleTerritories = useMemo(() => {
    if (!activeParentId) return territories.filter(t => t.parentId === null);
    return territories.filter(t => t.parentId === activeParentId);
  }, [territories, activeParentId]);

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

  // Auto-expand parents in the tree when searching or selecting
  const forceExpandToNode = (targetId: string) => {
    const newExpanded = { ...treeExpanded };
    let currentId = targetId;
    let safeguard = 0;

    while (currentId && safeguard < 10) {
      const node = territories.find(t => t.id === currentId);
      if (node && node.parentId) {
        newExpanded[node.parentId] = true;
        currentId = node.parentId;
      } else {
        break;
      }
      safeguard++;
    }
    setTreeExpanded(newExpanded);
  };

  // Drill down into a node
  const handleDrillDown = (id: string) => {
    if (hasChildren(id)) {
      setActiveParentId(id);
      setSelectedId(id);
      forceExpandToNode(id);
    }
  };

  // Double click on a node on the map
  const handleMapNodeDoubleClick = (t: Territory) => {
    if (hasChildren(t.id)) {
      handleDrillDown(t.id);
    }
  };

  // Select a node from map or tree
  const handleSelectNode = (id: string) => {
    setPrevSelectedId(selectedId);
    setSelectedId(id);
    forceExpandToNode(id);

    // If the node we selected is NOT a child of our current active parent, we should update our activeParentId
    // to match its parentId so we can see it on the map!
    const targetNode = territories.find(t => t.id === id);
    if (targetNode && targetNode.parentId !== activeParentId && targetNode.id !== activeParentId) {
      // If the node itself is a parent (has children), and is of type meer/kontinent, let's drill into it directly
      if (hasChildren(targetNode.id) && ['meer', 'kontinent'].includes(targetNode.type)) {
        setActiveParentId(targetNode.id);
      } else if (targetNode.parentId) {
        setActiveParentId(targetNode.parentId);
      } else {
        setActiveParentId(rootNode?.id || null);
      }
    }
  };

  // Navigate back to parent of current level
  const handleGoUp = () => {
    if (activeParentTerritory && activeParentTerritory.parentId) {
      setActiveParentId(activeParentTerritory.parentId);
      setSelectedId(activeParentTerritory.parentId);
    } else if (activeParentId && rootNode && activeParentId !== rootNode.id) {
      setActiveParentId(rootNode.id);
      setSelectedId(rootNode.id);
    }
  };

  // Search filter matches
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

  // Handle Search Result Selection
  const handleSelectSearchResult = (t: Territory) => {
    handleSelectNode(t.id);
    setSearchQuery('');
  };

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

  // Dynamic Viewbox calculations for the vector zoom effect
  const svgViewBox = useMemo(() => {
    const defaultViewBox = "0 0 1000 1000";
    if (!activeParentTerritory) return defaultViewBox;

    const t = activeParentTerritory;
    const padding = 40;

    if (t.type === 'welt') {
      return `0 0 ${t.width || 1000} ${t.height || 1000}`;
    }

    if (t.shapeType === 'rectangle' && t.width && t.height) {
      // Zoom into rectangle bounds
      const minX = t.x - t.width / 2 - padding;
      const minY = t.y - t.height / 2 - padding;
      const w = t.width + padding * 2;
      const h = t.height + padding * 2;
      return `${minX} ${minY} ${w} ${h}`;
    } else {
      // Zoom into circle/point bounds with a beautiful close-up frame (e.g. 180x180 width)
      const frameSize = 180;
      const minX = t.x - frameSize / 2;
      const minY = t.y - frameSize / 2;
      return `${minX} ${minY} ${frameSize} ${frameSize}`;
    }
  }, [activeParentTerritory]);

  // Sailing Route simulation effect
  const triggerVoyageSimulation = () => {
    if (!selectedTerritory) return;
    
    // Find starting point: if we have a prevSelectedId on the same level, use that.
    // Otherwise, find a random other node on the same level to act as a starting harbor!
    let startNode = territories.find(t => t.id === prevSelectedId);
    if (!startNode || startNode.parentId !== selectedTerritory.parentId || startNode.id === selectedTerritory.id) {
      // Fallback: pick any other sibling island
      const siblings = visibleTerritories.filter(t => t.id !== selectedTerritory.id);
      if (siblings.length > 0) {
        startNode = siblings[Math.floor(Math.random() * siblings.length)];
      }
    }

    if (!startNode) {
      alert("Wähle zuerst eine andere Insel aus, um eine Route von dort aus zu simulieren!");
      return;
    }

    // Initialize voyage
    setSailing({
      active: true,
      startId: startNode.id,
      endId: selectedTerritory.id,
      progress: 0,
      coords: { x: startNode.x, y: startNode.y }
    });
  };

  // Handle voyage animation frame ticks
  useEffect(() => {
    if (!sailing.active || !sailing.startId || !sailing.endId) return;

    const startNode = territories.find(t => t.id === sailing.startId);
    const endNode = territories.find(t => t.id === sailing.endId);

    if (!startNode || !endNode) {
      setSailing(prev => ({ ...prev, active: false }));
      return;
    }

    const duration = 1500; // ms
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

        // Linear interpolation for coordinates
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

  // Toggle node expansion in tree
  const toggleTreeExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Recursive render function for the tree layout
  const renderTreeNode = (node: Territory, depth = 0) => {
    const children = hierarchyMap.parentToChildren[node.id] || [];
    const isExpanded = !!treeExpanded[node.id];
    const isSelected = selectedId === node.id;
    const isActiveParent = activeParentId === node.id;
    const hasSubNodes = children.length > 0;

    return (
      <div key={node.id} className="select-none" id={`tree-node-${node.id}`}>
        <div 
          onClick={() => handleSelectNode(node.id)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all ${
            isSelected 
              ? 'bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-sm' 
              : isActiveParent 
                ? 'bg-slate-800/80 border border-slate-700/60 text-slate-200' 
                : 'hover:bg-slate-900/60 text-slate-400 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1">
            {hasSubNodes ? (
              <button 
                onClick={(e) => toggleTreeExpand(node.id, e)}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <span className="text-slate-400 shrink-0" title={node.type}>
              {renderTerritoryIcon(node.type, "w-3.5 h-3.5")}
            </span>
          </div>

          <span className="text-[11px] font-medium truncate flex-1 leading-none pt-0.5">
            {node.name}
          </span>

          {hasSubNodes && (
            <span className="text-[9px] px-1 rounded-full bg-slate-950/60 border border-slate-800 text-slate-500 font-bold shrink-0">
              {getChildrenCount(node.id)}
            </span>
          )}
        </div>

        {hasSubNodes && isExpanded && (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-800/80 ml-4.5 pl-0.5">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden h-[640px] shadow-2xl relative" id="hierarchical-map-viewer-root">
      
      {/* Header Bar */}
      <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 z-10" id="hmv-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Compass className="w-5 h-5 animate-spin-slow text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-fantasy text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              Nautischer Welten-Navigator
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest leading-none pt-1">
                Aktiv
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Interaktive, verschachtelte Karten-Übersicht für dein Abenteuer</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64" id="hmv-search-box">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Insel oder Region suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all placeholder-slate-600 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-800"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Search Dropdown Panel */}
          {searchQuery && (
            <div className="absolute right-0 top-full mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-2 z-50 max-h-56 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-150">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 mb-1 border-b border-slate-800">
                Suchergebnisse ({filteredSearchNodes.length})
              </h4>
              {filteredSearchNodes.length === 0 ? (
                <p className="text-[10px] text-slate-500 p-3 text-center">Kein Gebiet gefunden.</p>
              ) : (
                <div className="space-y-0.5">
                  {filteredSearchNodes.map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectSearchResult(node)}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-950 flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400">{renderTerritoryIcon(node.type, "w-3 h-3")}</span>
                        <span className="text-slate-200 group-hover:text-amber-400 font-medium truncate">{node.name}</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold px-1 rounded border border-slate-800 bg-slate-950 text-slate-400">
                        {node.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div className="bg-slate-950 px-5 py-2 border-b border-slate-900 flex items-center justify-between shrink-0 text-[11px] font-medium" id="hmv-breadcrumbs">
        <div className="flex flex-wrap items-center gap-1 text-slate-400 py-0.5 pr-2">
          <button 
            onClick={() => {
              if (rootNode) {
                setActiveParentId(rootNode.id);
                setSelectedId(rootNode.id);
              } else {
                setActiveParentId(null);
                setSelectedId(null);
              }
            }}
            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-slate-500 shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Welt</span>
          </button>
          
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <button
                  onClick={() => handleSelectNode(crumb.id)}
                  disabled={isLast && crumb.id === activeParentId}
                  className={`transition-colors shrink-0 ${isLast && crumb.id === activeParentId ? 'text-amber-400 font-semibold cursor-default' : 'hover:text-slate-200'}`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {activeParentTerritory && activeParentTerritory.parentId && (
          <button
            onClick={handleGoUp}
            className="flex items-center gap-1.5 text-[10px] text-amber-500/80 hover:text-amber-400 transition-colors bg-amber-500/5 hover:bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 shadow-sm shrink-0 uppercase tracking-wider font-bold"
            title="Eine Hierarchie-Stufe nach oben navigieren"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Zurück</span>
          </button>
        )}
      </div>

      {/* Main Body Grid */}
      {territories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/60 relative" id="hmv-empty">
          {/* Subtle grid background */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-xl">
            <Map className="w-8 h-8 text-slate-500" />
          </div>
          <h4 className="text-slate-200 font-bold mb-2">Keine Karten-Gebiete vorhanden</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            Deine Welt besitzt noch keine eingetragenen Regionen oder Territorien. Lade das One Piece Preset, um die hierarchische Welt zu erforschen!
          </p>
          <button
            onClick={handleLoadPreset}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-600/10"
          >
            <Compass className="w-4 h-4" />
            <span>Preset-Weltkarte laden</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative" id="hmv-body">
          
          {/* COLUMN 1: Tree Hierarchy Sidebar */}
          <div className="w-64 border-r border-slate-900 flex flex-col shrink-0 bg-slate-950 z-10" id="hmv-col-tree">
            <div className="p-3 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Gebiets-Hierarchie
              </span>
              <button
                onClick={() => {
                  const expandedAll: Record<string, boolean> = {};
                  territories.forEach(t => {
                    if (hasChildren(t.id)) expandedAll[t.id] = true;
                  });
                  setTreeExpanded(expandedAll);
                }}
                className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider"
                title="Alle Knoten im Baum öffnen"
              >
                Alles öffnen
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar bg-slate-950/40">
              {hierarchyMap.roots.map(root => renderTreeNode(root, 0))}
            </div>
          </div>

          {/* COLUMN 2: Visual SVG Map Canvas */}
          <div className="flex-1 bg-[#090b10] relative overflow-hidden flex flex-col" id="hmv-col-map">
            
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15]"
                 style={{ 
                   backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                   backgroundSize: '24px 24px'
                 }} 
            />

            {/* Nautical Compass Rose Background Accent */}
            <div className="absolute bottom-6 right-6 pointer-events-none opacity-[0.04] w-48 h-48 text-slate-400">
              <Compass className="w-full h-full animate-spin-very-slow" />
            </div>

            {/* Current Active parent info block floating in corner */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2 z-10 max-w-xs backdrop-blur-md shadow-lg pointer-events-none">
              <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider block">Aktueller Quadrant</span>
              <h4 className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <span className="text-amber-400">{renderTerritoryIcon(activeParentTerritory?.type || 'welt', "w-3.5 h-3.5")}</span>
                <span>{activeParentTerritory?.name || 'Globale Ansicht'}</span>
              </h4>
              {activeParentTerritory?.description && (
                <p className="text-[9px] text-slate-400 mt-1 leading-normal line-clamp-2">
                  {activeParentTerritory.description}
                </p>
              )}
            </div>

            {/* Map Action Controls */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
              <button
                onClick={() => {
                  if (rootNode) {
                    setActiveParentId(rootNode.id);
                    setSelectedId(rootNode.id);
                  }
                }}
                className="p-2 bg-slate-900/90 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-400 rounded-lg shadow-lg flex items-center justify-center"
                title="Kamera auf globale Weltkarte zurücksetzen"
              >
                <Maximize className="w-4 h-4" />
              </button>
              <div className="text-[9px] text-slate-500 font-semibold bg-slate-900/90 border border-slate-800 px-2 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
                Doppelklick zum Hineinzoomen in Gebiete
              </div>
            </div>

            {/* Main Interactive Map Canvas SVG */}
            <svg
              className="w-full h-full cursor-default select-none flex-1"
              viewBox={svgViewBox}
              style={{ transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)' }}
            >
              {/* Oceanic Background Fill (only inside zoomed quadrants) */}
              {activeParentId && activeParentTerritory?.type !== 'welt' && (
                <rect
                  x="-2000"
                  y="-2000"
                  width="5000"
                  height="5000"
                  fill="#030712"
                  fillOpacity="0.8"
                />
              )}

              {/* Draw current level territories */}
              {visibleTerritories.map((t) => {
                const isSelected = selectedId === t.id;
                const isHoveredTarget = false; // can expand state if needed
                const color = t.color || '#334155';
                const radius = t.radius || (t.width ? t.width/2 : 12);
                const hasSublocations = hasChildren(t.id);

                return (
                  <g 
                    key={t.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectNode(t.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleMapNodeDoubleClick(t);
                    }}
                    className="cursor-pointer transition-all group"
                  >
                    {/* Pulsing selection/hover glow ring */}
                    {isSelected && (
                      t.shapeType === 'polygon' && t.points && t.points.length > 0 ? (
                        <polygon
                          points={t.points.map(p => `${t.x + p.x * (t.radius || 20)},${t.y + p.y * (t.radius || 20)}`).join(' ')}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="3,3"
                          className="opacity-90 animate-pulse"
                        />
                      ) : (
                        <circle
                          cx={t.x}
                          cy={t.y}
                          r={t.shapeType === 'rectangle' ? (t.width || 40) / 1.3 : radius + 8}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                          className="animate-spin-slow opacity-90"
                        />
                      )
                    )}

                    {/* Main Node Shapes */}
                    {t.shapeType === 'polygon' && t.points && t.points.length > 0 ? (
                      <polygon
                        points={t.points.map(p => `${t.x + p.x * (t.radius || 20)},${t.y + p.y * (t.radius || 20)}`).join(' ')}
                        fill={color}
                        fillOpacity={isSelected ? 0.15 : 0}
                        style={{ fill: isSelected ? color : 'transparent' }}
                        stroke={isSelected ? '#ffffff' : color}
                        strokeOpacity={isSelected ? 1 : (t.type === 'meer' || t.type === 'kontinent' || t.type === 'welt' || t.type === 'insel') ? 0 : 0.6}
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeDasharray={t.type === 'region' || t.type === 'zone' || t.type === 'meer' || t.type === 'kontinent' ? '3,3' : 'none'}
                        className="transition-all duration-300 group-hover:stroke-opacity-100"
                      />
                    ) : t.shapeType === 'rectangle' ? (
                      <rect
                        x={t.x - (t.width || 40) / 2}
                        y={t.y - (t.height || 40) / 2}
                        width={t.width || 40}
                        height={t.height || 40}
                        fill={color}
                        fillOpacity={isSelected ? 0.15 : 0}
                        style={{ fill: isSelected ? color : 'transparent' }}
                        stroke={isSelected ? '#fbbf24' : color}
                        strokeOpacity={isSelected ? 1 : (t.type === 'meer' || t.type === 'kontinent' || t.type === 'welt') ? 0.15 : 0.6}
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeDasharray={t.type === 'region' || t.type === 'zone' || t.type === 'meer' || t.type === 'kontinent' ? '3,3' : 'none'}
                        rx={6}
                        className="transition-all duration-300 group-hover:stroke-opacity-100"
                      />
                    ) : (
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={radius}
                        fill={color}
                        fillOpacity={isSelected ? 0.15 : 0}
                        style={{ fill: isSelected ? color : 'transparent' }}
                        stroke={isSelected ? '#ffffff' : color}
                        strokeOpacity={isSelected ? 1 : (t.type === 'meer' || t.type === 'kontinent' || t.type === 'welt' || t.type === 'insel') ? 0 : 0.6}
                        strokeWidth={isSelected ? 2.5 : 1}
                        className="transition-all duration-300 group-hover:scale-105 group-hover:stroke-opacity-100"
                      />
                    )}

                    {/* Dot in center of rectangle regions for visual marking */}
                    {t.shapeType === 'rectangle' && t.type !== 'meer' && (
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={2.5}
                        fill="#f59e0b"
                        opacity={0.6}
                      />
                    )}

                    {/* Subtle Badge Icon for sublocations */}
                    {hasSublocations && t.shapeType !== 'rectangle' && (
                      <circle
                        cx={t.x + radius * 0.7}
                        cy={t.y - radius * 0.7}
                        r={4.5}
                        fill="#fbbf24"
                        stroke="#090b10"
                        strokeWidth="1"
                      />
                    )}

                    {/* Label */}
                    <text
                      x={t.x}
                      y={t.y + (t.shapeType === 'rectangle' ? 0 : radius + 11)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? '#fbbf24' : t.type === 'meer' ? '#38bdf8' : '#e2e8f0'}
                      fontSize={t.type === 'meer' ? '12' : t.type === 'kontinent' ? '14' : '9.5'}
                      fontWeight={isSelected || t.type === 'kontinent' ? '800' : '600'}
                      letterSpacing="0.03em"
                      className="pointer-events-none font-fantasy filter drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]"
                    >
                      {t.name}
                    </text>
                  </g>
                );
              })}

              {/* Voyage Route Current Layer (renders sailing ship moving) */}
              {sailing.active && (
                <g className="pointer-events-none">
                  {/* Dotted path line */}
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
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          opacity="0.8"
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Little Vessel Indicator Sailing */}
                  <g transform={`translate(${sailing.coords.x}, ${sailing.coords.y})`}>
                    <circle r="11" fill="#f59e0b" className="animate-ping opacity-25" />
                    <circle r="8" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
                    <path
                      d="M -3 2 L 3 2 L 2 4 L -2 4 Z M 0 -3 L 0 2 M -2 0 L 0 -3 L 2 0"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* COLUMN 3: Selected Location Detail Card & Lore Connector */}
          <div className="w-80 border-l border-slate-900 flex flex-col shrink-0 bg-slate-950/95 backdrop-blur-sm z-10" id="hmv-col-details">
            <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-amber-500" /> Logbuch-Eintrag
              </span>
              {selectedTerritory && (
                <button 
                  onClick={() => setSelectedId(null)}
                  className="text-slate-500 hover:text-slate-300 hover:bg-slate-900 p-1 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedTerritory ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* Header Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {renderTerritoryIcon(selectedTerritory.type, "w-5 h-5")}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-200 leading-tight font-fantasy">
                        {selectedTerritory.name}
                      </h4>
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-amber-500/90">
                        {selectedTerritory.type}
                      </span>
                    </div>
                  </div>

                  {selectedTerritory.description && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-900 shadow-inner">
                      {selectedTerritory.description}
                    </p>
                  )}
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-900 p-2.5 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                      <Sun className="w-2.5 h-2.5 text-amber-500" /> Klima
                    </span>
                    <p className="text-xs font-semibold text-slate-300 truncate">
                      {selectedTerritory.climate || 'Unbekannt'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5 text-sky-400" /> Gelände
                    </span>
                    <p className="text-xs font-semibold text-slate-300 truncate">
                      {selectedTerritory.terrain || 'Nautisch'}
                    </p>
                  </div>
                  <div className="space-y-0.5 mt-2 col-span-2">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-emerald-400" /> Vorherrschende Fraktion
                    </span>
                    <p className="text-xs font-bold text-amber-500 truncate flex items-center gap-1.5 mt-0.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{selectedTerritory.faction || 'Neutrale Gewässer'}</span>
                    </p>
                  </div>
                </div>

                {/* Live Distance & Travel Calculator */}
                {(() => {
                  const distances = calculateTerritoryDistances(selectedTerritory, territories, world.mapConfig?.kmPerCoordinateUnit);
                  if (distances.length === 0) return null;
                  return (
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-1"><Compass className="w-3 h-3 text-amber-400 animate-spin-slow" /> Entfernungen & Reisedauer</span>
                        <span className="text-[8px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-800">
                          {distances.length} Orte
                        </span>
                      </span>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {distances.slice(0, 6).map(d => (
                          <div key={d.targetId} className="bg-slate-950/80 border border-slate-900 p-2 rounded-xl text-xs space-y-1 hover:border-indigo-500/40 transition-colors">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-amber-400 text-[11px] truncate">{d.targetName}</span>
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800/60 shrink-0">
                                {d.directionName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                              <span><strong className="text-emerald-400">{d.distanceKm} km</strong></span>
                              <span className="text-[9px] text-slate-500 italic">
                                {d.relationType === 'child' ? 'Untergebiet' : d.relationType === 'parent' ? 'Übergeordnet' : 'Nachbar'}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 flex flex-col gap-0.5 border-t border-slate-900/80 pt-1">
                              <span>Zu Fuß: {d.travelFoot}</span>
                              <span>Zu Pferd: {d.travelHorse}</span>
                              {d.travelShip && <span className="text-sky-300">Mit dem Schiff: {d.travelShip}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Map Navigation Quick-Actions */}
                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Aktionen</span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Drill-down if children exist */}
                    {hasChildren(selectedTerritory.id) ? (
                      <button
                        onClick={() => handleDrillDown(selectedTerritory.id)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Gebiet betreten / Zoomen</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-500 text-center bg-slate-900/20 py-1.5 rounded-lg border border-slate-900 border-dashed">
                        Dieses Gebiet ist die tiefste Ebene (Keine Subgebiete)
                      </div>
                    )}

                    {/* Simulate Sailing Route button */}
                    <button
                      onClick={triggerVoyageSimulation}
                      disabled={sailing.active}
                      className="w-full py-2 bg-sky-950/50 hover:bg-sky-900 border border-sky-800/50 hover:border-sky-700 disabled:opacity-40 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-inner"
                    >
                      <Ship className="w-3.5 h-3.5" />
                      <span>Reise dorthin simulieren</span>
                    </button>

                    {/* Delete Territory Button with iframe-safe inline confirmation */}
                    {selectedTerritory.type !== 'welt' && (
                      confirmingDeleteId === selectedTerritory.id ? (
                        <div className="bg-red-950/50 border border-red-900/60 p-2.5 rounded-xl space-y-2 animate-in fade-in duration-200 mt-1">
                          <p className="text-[11px] font-bold text-red-300 text-center">
                            "{selectedTerritory.name}" wirklich löschen?
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
                          className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gebiet löschen</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Lore Database Integration */}
                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block flex items-center justify-between">
                    <span>Gekoppelte Lore & Legenden</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold">
                      {linkedLoreEntries.length}
                    </span>
                  </span>

                  {linkedLoreEntries.length === 0 ? (
                    <div className="text-[10px] text-slate-600 bg-slate-900/10 p-3 rounded-lg border border-slate-900 text-center leading-normal">
                      Keine Lore-Einträge im Codex verweisen aktuell namentlich auf dieses Gebiet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedLoreEntries.map(entry => (
                        <div key={entry.id} className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl space-y-1 hover:border-slate-700 transition-colors">
                          <h5 className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-500" />
                            {entry.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 line-clamp-3 leading-normal">
                            {entry.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <HelpCircle className="w-10 h-10 text-slate-700 mb-3" />
                <h5 className="text-xs font-bold text-slate-400 mb-1">Kein Gebiet ausgewählt</h5>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                  Klicke auf ein Gebiet auf der Karte oder wähle eines in der Liste aus, um die detaillierte Lore und Logbuch-Einträge anzuzeigen.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
