import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LoreEntry, LoreCategory, CharacterPowerSource, Territory, FactionMember } from '../types';
import { GeminiService } from '../services/geminiService';
import { autoCalculateAppearance } from '../utils/appearance';
import CharacterPowerRadar from './CharacterPowerRadar';
import { LocationSelector } from './LocationSelector';
import { CampaignPowerParameter } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { NauticalMapBackground } from './NauticalMapBackground';
import { CharacterLoreForm } from './CharacterLoreForm';
import TerritorySpecificFields from './TerritorySpecificFields';
import WorldKnowledgeManager from './WorldKnowledgeManager';
import { syncEconomyWithWorld } from '../lib/economySync';

interface Props {
  lore: LoreEntry[];
  onUpdateLore: (lore: LoreEntry[]) => void;
  onClose: () => void;
  worldTitle?: string;
  isNsfw?: boolean;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  playerName?: string;
  playerRole?: string;
  playerFaction?: string;
  player?: any;
  world?: any;
  excludedCategories?: string[];
  hideMap?: boolean;
  onUpdateWorld?: (world: any) => void;
  playerAttributes?: any[];
}

const CATEGORIES: (LoreCategory | 'Verhüllung')[] = ['Charaktere', 'Verhüllung', 'Fraktionen', 'Gegenstände', 'Verbotenes Wissen', 'Story & Quests', 'Weltregeln', 'Gegner', 'Zeitlinie'];

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Nicht-Binär", "Androgyn", "Unbekannt"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Drahtig", "Kurvig", "Stämmig", "Hager", "Unbekannt"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const ITEM_TYPE_OPTIONS = [
  "Verbrauchsgüter",
  "Waffen",
  "Rüstung / Kleidung",
  "Artefakte / Zubehör",
  "Werkzeuge & Alltags-Gegenstände",
  "Questgegenstände / Story-Objekte"
];

export interface TerrainPreset {
  id: string;
  name: string;
  colorClass: string;
  textColor: string;
  icon: string;
  badgeColorClass: string;
  glowColor: string;
  description: string;
}

export const TERRAIN_PRESETS: TerrainPreset[] = [
  {
    id: 'flüssigkeit',
    name: 'Flüssigkeit (Wasser / Meer / Ozean)',
    colorClass: 'bg-blue-600 border-blue-400 text-white shadow-blue-500/40',
    textColor: 'text-blue-400',
    icon: 'fa-solid fa-droplet',
    badgeColorClass: 'bg-blue-950 border-blue-800 text-blue-200',
    glowColor: 'bg-blue-500',
    description: 'Wasserflächen, Flüsse, Seen, Meere und Ozeane'
  },
  {
    id: 'hitze',
    name: 'Hitze & Energie (Magma / Feuer / Lava)',
    colorClass: 'bg-red-600 border-orange-500 text-white shadow-red-500/40',
    textColor: 'text-red-500',
    icon: 'fa-solid fa-fire',
    badgeColorClass: 'bg-red-950 border-red-800 text-red-200',
    glowColor: 'bg-red-500',
    description: 'Lavaflüsse, Vulkane, Brandgebiete und magische Feuerherde'
  },
  {
    id: 'kälte',
    name: 'Kälte (Eis / Schnee / Frost)',
    colorClass: 'bg-cyan-200 border-white text-slate-950 shadow-cyan-300/40',
    textColor: 'text-cyan-300',
    icon: 'fa-solid fa-snowflake',
    badgeColorClass: 'bg-cyan-950 border-cyan-800 text-cyan-200',
    glowColor: 'bg-cyan-300',
    description: 'Schneebedeckte Gipfel, Gletscher, Frostfelder und Eispaläste'
  },
  {
    id: 'natur_dicht',
    name: 'Natur-Dicht (Wald / Dschungel / Mangroven)',
    colorClass: 'bg-emerald-800 border-emerald-500 text-white shadow-emerald-700/40',
    textColor: 'text-emerald-500',
    icon: 'fa-solid fa-tree',
    badgeColorClass: 'bg-emerald-950 border-emerald-800 text-emerald-200',
    glowColor: 'bg-emerald-500',
    description: 'Urwälder, dichter Dschungel, alte Wälder und Mangrovensümpfe'
  },
  {
    id: 'natur_offen',
    name: 'Natur-Offen (Gras / Wiese / Ebene)',
    colorClass: 'bg-green-500 border-lime-400 text-slate-950 shadow-green-500/40',
    textColor: 'text-green-400',
    icon: 'fa-solid fa-seedling',
    badgeColorClass: 'bg-green-950 border-green-850 text-green-200',
    glowColor: 'bg-green-500',
    description: 'Grüne Weiden, Blumenwiesen, weite Graslandschaften und Savannen'
  },
  {
    id: 'trockenheit',
    name: 'Trockenheit (Erde / Sand / Wüste)',
    colorClass: 'bg-amber-600 border-yellow-500 text-slate-950 shadow-amber-500/40',
    textColor: 'text-amber-500',
    icon: 'fa-solid fa-sun-plant-wilt',
    badgeColorClass: 'bg-amber-950 border-amber-800 text-amber-200',
    glowColor: 'bg-amber-500',
    description: 'Sandwüsten, ausgetrocknete Steppen, Ödländer und rissige Erde'
  },
  {
    id: 'fels',
    name: 'Fels & Barriere (Wände / Klippen / Berge)',
    colorClass: 'bg-slate-600 border-slate-400 text-white shadow-slate-500/40',
    textColor: 'text-slate-400',
    icon: 'fa-solid fa-mountain',
    badgeColorClass: 'bg-slate-900 border-slate-700 text-slate-300',
    glowColor: 'bg-slate-400',
    description: 'Steile Klippen, hohe Gebirgsketten, Steinmauern und unwegsamer Fels'
  },
  {
    id: 'struktur',
    name: 'Struktur & Urban (Boden / Holzdeck / Asphalt)',
    colorClass: 'bg-stone-700 border-stone-500 text-white shadow-stone-600/40',
    textColor: 'text-stone-400',
    icon: 'fa-solid fa-city',
    badgeColorClass: 'bg-stone-900 border-stone-800 text-stone-300',
    glowColor: 'bg-stone-500',
    description: 'Gepflasterte Straßen, Holzbrücken, Tavernenböden, Asphalt und Marktplätze'
  },
  {
    id: 'untergrund',
    name: 'Untergrund (Tunnel / Höhle / Korridor)',
    colorClass: 'bg-purple-900 border-purple-600 text-white shadow-purple-900/40',
    textColor: 'text-purple-400',
    icon: 'fa-solid fa-dungeon',
    badgeColorClass: 'bg-purple-950 border-purple-800 text-purple-200',
    glowColor: 'bg-purple-500',
    description: 'Unterirdische Verliese, dunkle Höhlen, Tunnelgänge und geheime Gewölbe'
  },
  {
    id: 'ungewissheit',
    name: 'Ungewissheit (Nebel / Rauch / Smog)',
    colorClass: 'bg-zinc-500 border-zinc-300 text-slate-950 shadow-zinc-400/40',
    textColor: 'text-zinc-400',
    icon: 'fa-solid fa-smog',
    badgeColorClass: 'bg-zinc-900 border-zinc-800 text-zinc-300',
    glowColor: 'bg-zinc-400',
    description: 'Dichter Bodennebel, Rauchschwaden, Giftgase und unkartierte Gebiete'
  }
];

export const WORLD_MAP_CLASSES = [
  {
    id: 'deckung',
    label: 'Deckung',
    icon: 'fa-solid fa-shield-halved',
    description: 'Hindernisse und Barrikaden',
    items: [
      { name: 'Felswand', icon: 'fa-solid fa-cube', description: 'Massive Felswand, bietet Deckung.' },
      { name: 'Baumstamm', icon: 'fa-solid fa-tree', description: 'Umgestürzter Baumstamm.' },
      { name: 'Sandsäcke', icon: 'fa-solid fa-boxes-stacked', description: 'Sandsack-Barrikade.' }
    ]
  },
  {
    id: 'durchgaenge',
    label: 'Durchgänge',
    icon: 'fa-solid fa-door-open',
    description: 'Tore, Türen und Durchgänge',
    items: [
      { name: 'Eisentür', icon: 'fa-solid fa-door-closed', description: 'Schwere verschlossene Eisentür.' },
      { name: 'Spinnennetz', icon: 'fa-solid fa-spider', description: 'Dichtes klebriges Spinnennetz.' },
      { name: 'Fallgatter', icon: 'fa-solid fa-bars', description: 'Ein herabgelassenes Eisengatter.' }
    ]
  },
  {
    id: 'gefahren',
    label: 'Gefahren',
    icon: 'fa-solid fa-triangle-exclamation',
    description: 'Fallen und Umweltgefahren',
    items: [
      { name: 'Lavariß', icon: 'fa-solid fa-fire', description: 'Magma- oder Hitzeriss.' },
      { name: 'Speer-Falle', icon: 'fa-solid fa-circle-exclamation', description: 'Versteckte Fallgrube.' },
      { name: 'Säurepfütze', icon: 'fa-solid fa-vial', description: 'Ätzende Flüssigkeit am Boden.' }
    ]
  },
  {
    id: 'schaetze',
    label: 'Schätze',
    icon: 'fa-solid fa-gem',
    description: 'Behälter, Truhen und Schätze',
    items: [
      { name: 'Schatztruhe', icon: 'fa-solid fa-box-archive', description: 'Verschlossene Truhe mit Wertgegenständen.' },
      { name: 'Antike Urne', icon: 'fa-solid fa-jar', description: 'Tonurne mit alten Artefakten.' },
      { name: 'Waffenkiste', icon: 'fa-solid fa-box', description: 'Behälter mit Ausrüstung.' }
    ]
  },
  {
    id: 'konsolen',
    label: 'Konsolen',
    icon: 'fa-solid fa-sliders',
    description: 'Hebel, Konsolen und Terminals',
    items: [
      { name: 'Hebel', icon: 'fa-solid fa-gear', description: 'Mechanischer Hebel.' },
      { name: 'Steuerkonsole', icon: 'fa-solid fa-desktop', description: 'Terminal zur Systemsteuerung.' },
      { name: 'Runenplatte', icon: 'fa-solid fa-circle-nodes', description: 'Bodenplatte mit Symbolen.' }
    ]
  },
  {
    id: 'fahrzeuge',
    label: 'Fahrzeuge',
    icon: 'fa-solid fa-truck',
    description: 'Fahrzeuge und Transportmittel',
    items: [
      { name: 'Holzkarren', icon: 'fa-solid fa-cart-shopping', description: 'Ein einfacher Wagen.' },
      { name: 'Ruderboot', icon: 'fa-solid fa-sailboat', description: 'Einfaches Holzboot.' },
      { name: 'Gleitfahrzeug', icon: 'fa-solid fa-plane', description: 'Schnelles Fortbewegungsmittel.' }
    ]
  },
  {
    id: 'alltagsobjekte',
    label: 'Alltagsobjekte',
    icon: 'fa-solid fa-cube',
    description: 'Alltagsgegenstände und Mobiliar',
    items: [
      { name: 'Eichentisch', icon: 'fa-solid fa-table', description: 'Ein schlichter Tisch.' },
      { name: 'Straßenlaterne', icon: 'fa-solid fa-lightbulb', description: 'Laterne für Beleuchtung.' },
      { name: 'Staubiges Regal', icon: 'fa-solid fa-book', description: 'Regal voller Bücher und Schriftrollen.' }
    ]
  }
];

export const TRANSPORTS = [
  { id: 'fuss', name: 'Zu Fuß', icon: 'fa-solid fa-person-walking', speedKmh: 5, speedMs: 1.39, description: 'Normales Gehtempo.' },
  { id: 'pferd', name: 'Reittier', icon: 'fa-solid fa-horse', speedKmh: 18, speedMs: 5.0, description: 'Schnelles Reisen über Land.' },
  { id: 'kutsche', name: 'Kutsche / Karren', icon: 'fa-solid fa-caravan', speedKmh: 10, speedMs: 2.78, description: 'Reisen mit Gepäck.' },
  { id: 'auto', name: 'Gleitfahrzeug', icon: 'fa-solid fa-truck-fast', speedKmh: 46, speedMs: 12.78, description: 'Schneller Gleiter.' },
  { id: 'pirate_ship', name: 'Segelschiff', icon: 'fa-solid fa-ship', speedKmh: 18, speedMs: 5.0, description: 'Klassisches Hochseeschiff.' },
  { id: 'marine_ship', name: 'Kriegsschiff', icon: 'fa-solid fa-anchor', speedKmh: 33, speedMs: 9.17, description: 'Gepanzerte Schiffsausführung.' },
  { id: 'submarine', name: 'Tauchboot / U-Boot', icon: 'fa-solid fa-water', speedKmh: 28, speedMs: 7.78, description: 'Unterwasser-Fortbewegungsmittel.' },
  { id: 'seaking_ship', name: 'Gezogenes Schiff', icon: 'fa-solid fa-compass', speedKmh: 55, speedMs: 15.28, description: 'Schneller Schiffszug.' },
  { id: 'schiff', name: 'Handelsschiff', icon: 'fa-solid fa-sailboat', speedKmh: 15, speedMs: 4.17, description: 'Standardmäßiges Handelsschiff.' },
  { id: 'luftschiff', name: 'Luftschiff', icon: 'fa-solid fa-plane-departure', speedKmh: 150, speedMs: 41.67, description: 'Fliegendes Transportmittel.' },
  { id: 'raumschiff', name: 'Raumschiff', icon: 'fa-solid fa-rocket', speedKmh: 12000, speedMs: 3333.33, description: 'Extrem hohe Reisegeschwindigkeit.' },
  { id: 'portal', name: 'Teleportation / Portal', icon: 'fa-solid fa-circle-notch', speedKmh: 9999999, speedMs: 9999999, description: 'Sofortige Übertragung zum Zielort.' }
];

const LoreDatabaseView: React.FC<Props> = ({ 
  lore: rawLore, 
  onUpdateLore, 
  onClose, 
  worldTitle = '', 
  isNsfw = false, 
  worldPowerSettings, 
  playerName = '', 
  playerRole = '',
  playerFaction = '',
  player,
  world, 
  excludedCategories = [], 
  hideMap = false, 
  onUpdateWorld, 
  playerAttributes = [] 
}) => {
  const lore = useMemo(() => (rawLore || []).filter(l => l.category !== 'Orte' && (l.category as string) !== 'Weltkarte'), [rawLore]);
  const [removedCategories, setRemovedCategories] = useState<string[]>([]);
  const [selectedHoldingToAssign, setSelectedHoldingToAssign] = useState<string>('');

  // Auto-migrate any residual 'Orte' or 'Weltkarte' entries in rawLore into world.territories and purge them from rawLore
  useEffect(() => {
    const residualOrte = (rawLore || []).filter(l => l.category === 'Orte' || (l.category as string) === 'Weltkarte');
    if (residualOrte.length > 0) {
      if (onUpdateWorld && world) {
        const existingTerritories = [...(world.territories || [])];
        let territoriesChanged = false;
        residualOrte.forEach(entry => {
          const alreadyExists = existingTerritories.some(t => 
            (entry.id && t.id === entry.id) || 
            (entry.id && t.loreEntryId === entry.id) ||
            t.name.trim().toLowerCase() === entry.title.trim().toLowerCase()
          );
          if (!alreadyExists) {
            const d = entry.details || {};
            const newTerritory: Territory = {
              id: entry.id || `terr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: entry.title || 'Unbenannter Ort',
              type: d.type || d.terrainType || 'ort',
              description: entry.description || '',
              parentId: d.parentId ?? null,
              x: d.x ?? (d.center?.x ?? 50),
              y: d.y ?? (d.center?.y ?? 50),
              radius: 12.0,
              shapeType: 'circle',
              color: '#3b82f6',
              faction: d.faction || 'Neutral',
              dangerLevel: 'Normal',
              isUnlocked: true,
              ownerFactionId: d.ownerFactionId || d.faction,
              ownerCharacterId: d.ownerCharacterId,
              controlledByFactionId: d.controlledByFactionId,
              loreEntryId: entry.id
            };
            existingTerritories.push(newTerritory);
            territoriesChanged = true;
          }
        });
        if (territoriesChanged) {
          onUpdateWorld({
            ...world,
            territories: existingTerritories
          });
        }
      }

      const cleanedLore = (rawLore || []).filter(l => l.category !== 'Orte' && (l.category as string) !== 'Weltkarte');
      onUpdateLore(cleanedLore);
    }
  }, [rawLore, world, onUpdateWorld, onUpdateLore]);

  const visibleCategories = useMemo(() => {
    const raw = [
      'Omni-Smart-Fill',
      ...CATEGORIES.filter(c => !excludedCategories.includes(c)),
      'Weltkarte',
      'Kanon & Konsistenz'
    ].filter(c => !removedCategories.includes(c));
    return Array.from(new Set(raw)) as (LoreCategory | 'Verhüllung' | 'Weltkarte' | 'Omni-Smart-Fill' | 'Kanon & Konsistenz')[];
  }, [excludedCategories, removedCategories]);

  const [activeCategory, setActiveCategory] = useState<LoreCategory | 'Verhüllung' | 'Weltkarte' | 'Omni-Smart-Fill' | 'Kanon & Konsistenz'>(() => {
    return (visibleCategories.find(c => c !== 'Omni-Smart-Fill') || 'Charaktere') as any;
  });

  const handleDeleteCategoryAndEntries = (categoryToDelete: string) => {
    if (categoryToDelete === 'Weltkarte') {
      if (onUpdateWorld) {
        onUpdateWorld({
          ...world,
          territories: [],
          placeMarkers: [],
          civilizationMarkers: [],
          regionMarkers: [],
          terrains: []
        });
      }
      onUpdateLore(lore.filter(l => l.category !== 'Orte' && (l.category as string) !== 'Weltkarte'));
    } else {
      onUpdateLore(lore.filter(l => l.category !== categoryToDelete));
    }

    const updatedRemoved = Array.from(new Set([...removedCategories, categoryToDelete]));
    setRemovedCategories(updatedRemoved);

    const remaining = visibleCategories.filter(c => c !== categoryToDelete && c !== 'Omni-Smart-Fill');
    if (remaining.length > 0) {
      setActiveCategory(remaining[0]);
    } else {
      setActiveCategory('Charaktere');
    }
  };

  // Weltkarte Tab states
  const [weltkarteSearch, setWeltkarteSearch] = useState('');
  const [weltkarteTypeFilter, setWeltkarteTypeFilter] = useState<string>('all');
  const [weltkarteParentFilter, setWeltkarteParentFilter] = useState<string>('all');
  const [weltkarteSortBy, setWeltkarteSortBy] = useState<string>('name-asc');

  const filteredAndSortedTerritories = useMemo(() => {
    let list = [...(world?.territories || [])];

    // Search term
    if (weltkarteSearch.trim()) {
      const q = weltkarteSearch.toLowerCase();
      list = list.filter(t => 
        t.name?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (weltkarteTypeFilter !== 'all') {
      list = list.filter(t => t.type === weltkarteTypeFilter);
    }

    // Parent filter
    if (weltkarteParentFilter !== 'all') {
      list = list.filter(t => t.parentId === weltkarteParentFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (weltkarteSortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (weltkarteSortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (weltkarteSortBy === 'type') {
        return (a.type || '').localeCompare(b.type || '');
      }
      if (weltkarteSortBy === 'pos-x') {
        return (a.x || 0) - (b.x || 0);
      }
      if (weltkarteSortBy === 'pos-y') {
        return (a.y || 0) - (b.y || 0);
      }
      return 0;
    });

    return list;
  }, [world?.territories, weltkarteSearch, weltkarteTypeFilter, weltkarteParentFilter, weltkarteSortBy]);

  const parentOptions = useMemo(() => {
    const list = world?.territories || [];
    const parentIds = new Set(list.map(t => t.parentId).filter(Boolean));
    return list.filter(t => parentIds.has(t.id));
  }, [world?.territories]);

  const [selectedActorId, setSelectedActorId] = useState<string>('__player_knowledge__');
  const [loreSmartFill, setLoreSmartFill] = useState<string>('');
  const [isSmartFillingLore, setIsSmartFillingLore] = useState(false);
  const [keepExistingLoreDetails, setKeepExistingLoreDetails] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoreEntry>>({ category: 'Charaktere' });
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [generatingExpression, setGeneratingExpression] = useState<string | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Faction Unified Harmonization States
  const [isHarmonizingFaction, setIsHarmonizingFaction] = useState<boolean>(false);
  const [factionHarmonizePrompt, setFactionHarmonizePrompt] = useState<string>('');
  const [harmonizeSuccessMessage, setHarmonizeSuccessMessage] = useState<string | null>(null);

  // Omni Multi-Smart-Fill States
  const [omniSmartFillPrompt, setOmniSmartFillPrompt] = useState('');
  const [isOmniGenerating, setIsOmniGenerating] = useState(false);
  const [proposedEntries, setProposedEntries] = useState<any[]>([]);
  const [selectedProposedIds, setSelectedProposedIds] = useState<Set<string>>(new Set());
  const [omniSuccessMessage, setOmniSuccessMessage] = useState<string | null>(null);

  // Interaktive Node-Map States
  const [mapZoomLevel, setMapZoomLevel] = useState<'macro' | 'meso' | 'micro' | 'building'>('macro');
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [selectedMesoId, setSelectedMesoId] = useState<string | null>(null);
  const [selectedMicroId, setSelectedMicroId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'map' | 'list'>('map');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sub-Tabs, Folder Tree & Effects States
  const [orteSubTab, setOrteSubTab] = useState<'map' | 'configurator'>('map');
  const [activeAbilityTab, setActiveAbilityTab] = useState<string>('Techniken');
  const [activePowerSourceIdx, setActivePowerSourceIdx] = useState<number>(0);
  const [openApplicationsDropdown, setOpenApplicationsDropdown] = useState<string | null>(null);
  const [quickAbilityName, setQuickAbilityName] = useState('');

  // Weltkarte Editor States
  const [isEditingTerritory, setIsEditingTerritory] = useState<string | null>(null);
  const [territoryForm, setTerritoryForm] = useState<Partial<Territory>>({
    name: '',
    type: 'stadt',
    description: '',
    parentId: null,
    population: '',
    ruler: '',
    climate: '',
    culture: '',
    terrain: '',
    faction: '',
    x: 50,
    y: 50
  });
  const [weltkarteSmartFill, setWeltkarteSmartFill] = useState('');
  const [isSmartFillingTerritory, setIsSmartFillingTerritory] = useState(false);
  const [isSmartFillComplementMode, setIsSmartFillComplementMode] = useState(true);
  const [isCustomFactionInput, setIsCustomFactionInput] = useState(false);

  const lorePowerSourcesList: CharacterPowerSource[] = editForm.details?.powerSources && editForm.details?.powerSources.length > 0
    ? editForm.details.powerSources
    : [
        {
          id: 'default',
          source: editForm.details?.powerSource || '',
          cost: editForm.details?.powerCost || '',
          powerName: editForm.details?.powerName || '',
          powerDescription: editForm.details?.powerDescription || ''
        }
      ];

  const currentLorePowerSourceIdx = Math.min(activePowerSourceIdx, lorePowerSourcesList.length - 1);
  const activeLorePowerSource = (lorePowerSourcesList[currentLorePowerSourceIdx] || lorePowerSourcesList[0] || {}) as CharacterPowerSource;

  const [newTerrainType, setNewTerrainType] = useState<'Gebirge' | 'Wald' | 'Fluss' | 'See'>('Gebirge');
  const [newTerrainName, setNewTerrainName] = useState('');
  const [newTerrainDesc, setNewTerrainDesc] = useState('');
  const [newTerrainX, setNewTerrainX] = useState(50);
  const [newTerrainY, setNewTerrainY] = useState(50);
  
  const [newConnFrom, setNewConnFrom] = useState('');
  const [newConnTo, setNewConnTo] = useState('');
  const [newConnType, setNewConnType] = useState('fuss');
  const [newConnDuration, setNewConnDuration] = useState('1 Tag');
  
  const [aiWorldDescription, setAiWorldDescription] = useState('');
  const [isGeneratingAiWorld, setIsGeneratingAiWorld] = useState(false);

  const [orteFormTab, setOrteFormTab] = useState<'setting' | 'ebenen'>('setting');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ '__unassigned__': true });
  const [combatEffects, setCombatEffects] = useState<any[]>([
    { id: '1', type: 'magma', x: 45, y: 50, radius: 12, intensity: 4, description: 'Magma-Eruption' },
    { id: '2', type: 'eis', x: 55, y: 50, radius: 12, intensity: 4, description: 'Eisiger Froststurm' }
  ]);
  const [activePlacingEffect, setActivePlacingEffect] = useState<string | null>(null);
  const [isCombatDropdownOpen, setIsCombatDropdownOpen] = useState<boolean>(false);

  // RPG Maker style custom grid dimensions
  const [isCustomizingGrid, setIsCustomizingGrid] = useState<boolean>(false);
  const [isShowingJSONConnections, setIsShowingJSONConnections] = useState<boolean>(false);
  const [isMapLevelDropdownOpen, setIsMapLevelDropdownOpen] = useState<boolean>(false);
  const [isStamperDropdownOpen, setIsStamperDropdownOpen] = useState<boolean>(false);
  const [orteViewMode, setOrteViewMode] = useState<'list' | 'tree'>('tree');
  const [mapGridSizes, setMapGridSizes] = useState<{
    macro: { width: number; height: number };
    meso: { width: number; height: number };
    micro: { width: number; height: number };
    building: { width: number; height: number };
  }>(() => {
    const saved = localStorage.getItem('adventureforge_map_grid_sizes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      macro: { width: 20, height: 20 },
      meso: { width: 12, height: 12 },
      micro: { width: 8, height: 8 },
      building: { width: 6, height: 6 }
    };
  });

  // Map zoom and panning states
  const [mapScale, setMapScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 7 universal classes stamping states
  const [activePlacingClassAsset, setActivePlacingClassAsset] = useState<{ name: string; icon: string; className: string } | null>(null);
  const [keepClassPlacingMode, setKeepClassPlacingMode] = useState<boolean>(false);

  // Mapped tactile elements clash detection
  const getTacticalClashes = () => {
    const cellEffects = combatEffects.map(eff => {
      const colIdx = Math.floor(eff.x / 10);
      const rowIdx = Math.floor(eff.y / 10);
      const colName = String.fromCharCode(65 + Math.max(0, Math.min(9, colIdx)));
      const rowName = String.fromCharCode(49 + Math.max(0, Math.min(9, rowIdx)));
      return {
        ...eff,
        col: Math.max(0, Math.min(9, colIdx)),
        row: Math.max(0, Math.min(9, rowIdx)),
        cell: `${colName}${rowName}`
      };
    });

    const clashes: { cell: string; col: number; row: number; type: 'steam' | 'electric' | 'explosion'; label: string; desc: string; icon: string }[] = [];

    for (let i = 0; i < cellEffects.length; i++) {
      for (let j = i + 1; j < cellEffects.length; j++) {
        const a = cellEffects[i];
        const b = cellEffects[j];
        const isAdj = Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1;
        if (isAdj) {
          const hasMagma = a.type === 'magma' || b.type === 'magma';
          const hasEis = a.type === 'eis' || b.type === 'eis';
          const hasLightning = a.type === 'lightning' || b.type === 'lightning' || a.type === 'blitz' || b.type === 'blitz';
          const hasPoison = a.type === 'poison' || b.type === 'poison' || a.type === 'gift' || b.type === 'gift';
          const hasFire = a.type === 'magma' || a.type === 'fire' || b.type === 'magma' || b.type === 'fire';

          if (hasMagma && hasEis) {
            const cellStr = a.cell === b.cell ? a.cell : `${a.cell}/${b.cell}`;
            if (!clashes.some(c => c.cell === cellStr)) {
              clashes.push({
                cell: cellStr,
                col: Math.round((a.col + b.col) / 2),
                row: Math.round((a.row + b.row) / 2),
                type: 'steam',
                label: 'Dampfexplosion',
                desc: 'Magma und Eis treffen aufeinander: Heißer Wasserdampf schränkt Sicht und Bewegung ein.',
                icon: 'fa-solid fa-wind'
              });
            }
          } else if (hasFire && hasPoison) {
            const cellStr = a.cell === b.cell ? a.cell : `${a.cell}/${b.cell}`;
            if (!clashes.some(c => c.cell === cellStr)) {
              clashes.push({
                cell: cellStr,
                col: Math.round((a.col + b.col) / 2),
                row: Math.round((a.row + b.row) / 2),
                type: 'explosion',
                label: 'Explosive Verpuffung',
                desc: 'Gase entzünden sich: Druckwelle und Hitzestrahlung im Umkreis.',
                icon: 'fa-solid fa-burst'
              });
            }
          }
        }
      }
    }
    return clashes;
  };

  // Combat Simulator States
  const [simSpell, setSimSpell] = useState<'magma' | 'eis' | 'lightning' | 'poison'>('magma');
  const [simCol, setSimCol] = useState<number>(4);
  const [simRow, setSimRow] = useState<number>(4);

  // Nested Coordinates System & Travel Duration States
  const [selectedTransportId, setSelectedTransportId] = useState<string>('fuss');
  const [travelStartNodeId, setTravelStartNodeId] = useState<string | null>(null);
  const [travelEndNodeId, setTravelEndNodeId] = useState<string | null>(null);
  const [manualX1, setManualX1] = useState<number>(20);
  const [manualY1, setManualY1] = useState<number>(20);
  const [manualX2, setManualX2] = useState<number>(80);
  const [manualY2, setManualY2] = useState<number>(80);

  // --- PROCEDURAL RPG-MAKER BACKGROUND GRID GENERATION ---
  interface BackgroundTile {
    col: number;
    row: number;
    terrainId: string;
  }

  const seededRandom = (seedStr: string) => {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    }
    return () => {
      let t = h += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const getTileColor = (terrainId: string): string => {
    switch (terrainId) {
      case 'flüssigkeit': return '#0a304e';
      case 'hitze': return '#3e0a0a';
      case 'kälte': return '#0f3544';
      case 'natur_dicht': return '#053225';
      case 'natur_offen': return '#0f3a1e';
      case 'trockenheit': return '#3a200a';
      case 'fels': return '#242c38';
      case 'struktur': return '#2d2b28';
      case 'untergrund': return '#2b0e40';
      case 'ungewissheit': return '#202023';
      default: return '#10151f';
    }
  };

  const { tiles: backgroundTiles, gridWidth: backgroundGridWidth, gridHeight: backgroundGridHeight } = useMemo(() => {
    const gridWidth = mapGridSizes[mapZoomLevel]?.width || 10;
    const gridHeight = mapGridSizes[mapZoomLevel]?.height || 10;
    
    const titleLower = (world?.title || worldTitle || '').toLowerCase();
    const descLower = (world?.description || '').toLowerCase();
    const tagsStr = (world?.tags || []).join(' ').toLowerCase();
    const fullText = `${titleLower} ${descLower} ${tagsStr}`;
    
    let defaultBaseTerrain = 'natur_offen';
    if (fullText.includes('one piece') || fullText.includes('meer') || fullText.includes('ozean') || fullText.includes('pirat') || fullText.includes('insel') || fullText.includes('ocean') || fullText.includes('sea') || fullText.includes('island')) {
      defaultBaseTerrain = 'flüssigkeit';
    } else if (fullText.includes('wüste') || fullText.includes('desert') || fullText.includes('düne') || fullText.includes('sand') || fullText.includes('steppe')) {
      defaultBaseTerrain = 'trockenheit';
    } else if (fullText.includes('eis') || fullText.includes('schnee') || fullText.includes('frost') || fullText.includes('gletscher') || fullText.includes('kalt') || fullText.includes('ice') || fullText.includes('snow')) {
      defaultBaseTerrain = 'kälte';
    } else if (fullText.includes('höhle') || fullText.includes('cave') || fullText.includes('untergrund') || fullText.includes('dungeon') || fullText.includes('mine') || fullText.includes('katakombe')) {
      defaultBaseTerrain = 'untergrund';
    } else if (fullText.includes('wald') || fullText.includes('forest') || fullText.includes('dschungel') || fullText.includes('jungle') || fullText.includes('sumpf')) {
      defaultBaseTerrain = 'natur_dicht';
    }

    const currentNodes = lore.filter(l => {
      if (l.category !== 'Orte') return false;
      const lvl = l.details?.mapLevel || 'meso';
      if (mapZoomLevel === 'macro') return lvl === 'macro';
      if (mapZoomLevel === 'meso') {
        return lvl === 'meso' && (selectedMacroId ? l.details?.parentPlaceId === selectedMacroId : true);
      }
      if (mapZoomLevel === 'micro') {
        return lvl === 'micro' && (selectedMesoId ? l.details?.parentPlaceId === selectedMesoId : true);
      }
      if (mapZoomLevel === 'building') {
        return lvl === 'building' && (selectedMicroId ? l.details?.parentPlaceId === selectedMicroId : true);
      }
      return false;
    });

    const activeNode = currentNodes.find(n => n.details?.isActiveTarget) || currentNodes.find(n => n.id === selectedNodeId);
    
    let overrideBaseTerrain = '';
    let specialTheme = '';
    
    if (activeNode && (mapZoomLevel === 'micro' || mapZoomLevel === 'building')) {
      const nodeTitle = (activeNode.title || '').toLowerCase();
      const nodeDesc = (activeNode.description || '').toLowerCase();
      const nodeText = `${nodeTitle} ${nodeDesc}`;
      
      if (nodeText.includes('schmiede') || nodeText.includes('forge') || nodeText.includes('vulkan') || nodeText.includes('schmelze') || nodeText.includes('lava') || nodeText.includes('werkstatt')) {
        specialTheme = 'schmiede';
        overrideBaseTerrain = 'hitze';
      } else if (nodeText.includes('taverne') || nodeText.includes('gasthaus') || nodeText.includes('wirtshaus') || nodeText.includes('gilde') || nodeText.includes('schänke') || nodeText.includes('tavern') || nodeText.includes('inn') || nodeText.includes('shop')) {
        specialTheme = 'taverne';
        overrideBaseTerrain = 'struktur';
      } else if (nodeText.includes('höhle') || nodeText.includes('cave') || nodeText.includes('tunnel') || nodeText.includes('mine') || nodeText.includes('katakomben') || nodeText.includes('verlies') || nodeText.includes('dungeon')) {
        specialTheme = 'höhle';
        overrideBaseTerrain = 'untergrund';
      } else if (nodeText.includes('wald') || nodeText.includes('forest') || nodeText.includes('dschungel') || nodeText.includes('jungle') || nodeText.includes('sumpf') || nodeText.includes('hügel')) {
        specialTheme = 'wald';
        overrideBaseTerrain = 'natur_dicht';
      } else if (activeNode.details?.terrainTile) {
        overrideBaseTerrain = activeNode.details.terrainTile;
      }
    }

    const baseTerrain = overrideBaseTerrain || defaultBaseTerrain;
    
    let seedStr = '';
    if (mapZoomLevel === 'macro') {
      seedStr = `${titleLower}-macro-global`;
    } else if (mapZoomLevel === 'meso') {
      seedStr = `${titleLower}-meso-${selectedMacroId || 'global'}`;
    } else if (mapZoomLevel === 'micro') {
      seedStr = `${titleLower}-micro-${selectedMesoId || activeNode?.id || 'none'}`;
    } else {
      seedStr = `${titleLower}-building-${selectedMicroId || activeNode?.id || 'none'}`;
    }
    
    const rng = seededRandom(seedStr);
    const tiles: BackgroundTile[] = [];

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const cx = gridWidth > 1 ? (c / (gridWidth - 1)) * 100 : 50;
        const cy = gridHeight > 1 ? (r / (gridHeight - 1)) * 100 : 50;
        let chosenTerrain = baseTerrain;

        if (specialTheme === 'schmiede') {
          const val = rng();
          if (val < 0.25) {
            chosenTerrain = 'hitze';
          } else if (val < 0.70) {
            chosenTerrain = 'struktur';
          } else {
            chosenTerrain = 'fels';
          }
        } else if (specialTheme === 'taverne') {
          const val = rng();
          const innerLeft = Math.floor(gridWidth * 0.2);
          const innerRight = Math.floor(gridWidth * 0.7);
          const innerTop = Math.floor(gridHeight * 0.2);
          const innerBottom = Math.floor(gridHeight * 0.7);
          if (c >= innerLeft && c <= innerRight && r >= innerTop && r <= innerBottom) {
            if (val < 0.8) {
              chosenTerrain = 'struktur';
            } else {
              chosenTerrain = 'untergrund';
            }
          } else {
            if (val < 0.6) {
              chosenTerrain = 'natur_offen';
            } else if (val < 0.8) {
              chosenTerrain = 'natur_dicht';
            } else {
              chosenTerrain = 'struktur';
            }
          }
        } else if (specialTheme === 'höhle') {
          const val = rng();
          if (val < 0.50) {
            chosenTerrain = 'untergrund';
          } else if (val < 0.80) {
            chosenTerrain = 'fels';
          } else if (val < 0.90) {
            chosenTerrain = 'ungewissheit';
          } else {
            chosenTerrain = 'flüssigkeit';
          }
        } else if (specialTheme === 'wald') {
          const val = rng();
          if (val < 0.45) {
            chosenTerrain = 'natur_dicht';
          } else if (val < 0.85) {
            chosenTerrain = 'natur_offen';
          } else if (val < 0.95) {
            chosenTerrain = 'flüssigkeit';
          } else {
            chosenTerrain = 'fels';
          }
        } else {
          let closestNode: any = null;
          let minDistance = 999999;

          currentNodes.forEach(node => {
            if (node.details?.coordinates) {
              const nx = node.details.coordinates.x;
              const ny = node.details.coordinates.y;
              const dist = Math.sqrt((cx - nx) ** 2 + (cy - ny) ** 2);
              if (dist < minDistance) {
                minDistance = dist;
                closestNode = node;
              }
            }
          });

          if (closestNode && minDistance < 32) {
            const nodeTile = closestNode.details?.terrainTile;
            if (nodeTile) {
              const influenceChance = 0.85 * (1 - minDistance / 32);
              if (rng() < influenceChance) {
                chosenTerrain = nodeTile;
              } else {
                const roll = rng();
                if (nodeTile === 'flüssigkeit') {
                  chosenTerrain = roll < 0.3 ? 'natur_offen' : 'flüssigkeit';
                } else if (nodeTile === 'struktur') {
                  chosenTerrain = roll < 0.4 ? 'natur_offen' : 'struktur';
                } else if (nodeTile === 'fels') {
                  chosenTerrain = roll < 0.5 ? 'natur_dicht' : 'fels';
                } else if (nodeTile === 'hitze') {
                  chosenTerrain = roll < 0.4 ? 'fels' : 'hitze';
                } else {
                  chosenTerrain = baseTerrain;
                }
              }
            }
          } else {
            const roll = rng();
            if (baseTerrain === 'flüssigkeit') {
              if (roll < 0.08) {
                chosenTerrain = 'natur_offen';
              } else if (roll < 0.12) {
                chosenTerrain = 'trockenheit';
              } else if (roll < 0.15) {
                chosenTerrain = 'fels';
              } else {
                chosenTerrain = 'flüssigkeit';
              }
            } else if (baseTerrain === 'trockenheit') {
              if (roll < 0.05) {
                chosenTerrain = 'flüssigkeit';
              } else if (roll < 0.15) {
                chosenTerrain = 'natur_offen';
              } else if (roll < 0.30) {
                chosenTerrain = 'fels';
              } else {
                chosenTerrain = 'trockenheit';
              }
            } else if (baseTerrain === 'natur_offen') {
              if (roll < 0.25) {
                chosenTerrain = 'natur_dicht';
              } else if (roll < 0.35) {
                chosenTerrain = 'fels';
              } else if (roll < 0.42) {
                chosenTerrain = 'flüssigkeit';
              } else if (roll < 0.45) {
                chosenTerrain = 'struktur';
              } else {
                chosenTerrain = 'natur_offen';
              }
            }
          }
        }

        tiles.push({
          col: c,
          row: r,
          terrainId: chosenTerrain
        });
      }
    }

    return { tiles, gridWidth, gridHeight };
  }, [lore, mapZoomLevel, world, worldTitle, selectedNodeId, selectedMacroId, selectedMesoId, selectedMicroId, mapGridSizes]);

  const hierarchicalConnectionsJSON = useMemo(() => {
    const locations = lore.filter(l => l.category === 'Orte');
    const worlds = locations.filter(l => l.details?.mapLevel === 'macro');
    const regions = locations.filter(l => l.details?.mapLevel === 'meso');
    const places = locations.filter(l => l.details?.mapLevel === 'micro' || (!l.details?.mapLevel && !l.details?.parentPlaceId));
    const buildings = locations.filter(l => l.details?.mapLevel === 'building');

    const tree = worlds.map(w => {
      const childRegions = regions
        .filter(r => r.details?.parentPlaceId?.trim().toLowerCase() === w.title.trim().toLowerCase())
        .map(r => {
          const childPlaces = places
            .filter(p => p.details?.parentPlaceId?.trim().toLowerCase() === r.title.trim().toLowerCase())
            .map(p => {
              const childBuildings = buildings
                .filter(b => b.details?.parentPlaceId?.trim().toLowerCase() === p.title.trim().toLowerCase())
                .map(b => b.title);

              return {
                ort: p.title,
                typ: p.details?.type || 'Ort',
                ...(childBuildings.length > 0 ? { gebäude: childBuildings } : {})
              };
            });

          return {
            region: r.title,
            typ: r.details?.type || 'Region',
            ...(childPlaces.length > 0 ? { orte: childPlaces } : {})
          };
        });

      return {
        welt: w.title,
        typ: w.details?.type || 'Welt',
        ...(childRegions.length > 0 ? { regionen: childRegions } : {})
      };
    });

    return JSON.stringify(tree, null, 2);
  }, [lore]);

  const handleMapBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-node]') || target.closest('button') || target.closest('input') || target.closest('select')) return;

    if (activePlacingEffect && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const mapWidth = world?.mapConfig?.mapWidth || 100;
      const mapHeight = world?.mapConfig?.mapHeight || 100;
      const x = Math.max(0, Math.min(mapWidth, Math.round(((e.clientX - rect.left - panOffset.x) / mapScale / rect.width) * mapWidth)));
      const y = Math.max(0, Math.min(mapHeight, Math.round(((e.clientY - rect.top - panOffset.y) / mapScale / rect.height) * mapHeight)));
      
      const newEffect = {
        id: Date.now().toString(),
        type: activePlacingEffect,
        x,
        y,
        radius: 12,
        intensity: 4,
        description: `${activePlacingEffect === 'magma' ? 'Magma' : activePlacingEffect === 'eis' ? 'Eis' : activePlacingEffect === 'feuer' ? 'Feuer' : activePlacingEffect === 'blitze' ? 'Blitz' : activePlacingEffect === 'nebel' ? 'Nebel' : 'Gift'}-Aura`
      };
      setCombatEffects(prev => [...prev, newEffect]);
      setActivePlacingEffect(null);
      return;
    }

    if (activePlacingClassAsset && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const mapWidth = world?.mapConfig?.mapWidth || 100;
      const mapHeight = world?.mapConfig?.mapHeight || 100;
      const x = Math.max(0, Math.min(mapWidth, Math.round(((e.clientX - rect.left - panOffset.x) / mapScale / rect.width) * mapWidth)));
      const y = Math.max(0, Math.min(mapHeight, Math.round(((e.clientY - rect.top - panOffset.y) / mapScale / rect.height) * mapHeight)));
      
      const defaultWidth = mapZoomLevel === 'macro' ? 500 : mapZoomLevel === 'meso' ? 2 : mapZoomLevel === 'micro' ? 3 : 1;
      const defaultHeight = mapZoomLevel === 'macro' ? 500 : mapZoomLevel === 'meso' ? 2 : mapZoomLevel === 'micro' ? 3 : 1;
      const newId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4);
      const newPlace: LoreEntry = {
        id: newId,
        category: 'Orte' as LoreCategory,
        title: activePlacingClassAsset.name,
        description: `Ein platziertes Objekt (${activePlacingClassAsset.name}) auf der Karte.`,
        isUnlocked: true,
        details: {
          description: `Ein platziertes Objekt (${activePlacingClassAsset.name}) auf der Karte.`,
          mapLevel: mapZoomLevel,
          coordinates: { x, y },
          parentPlaceId: mapZoomLevel === 'meso' ? (selectedMacroId || '') : mapZoomLevel === 'micro' ? (selectedMesoId || '') : mapZoomLevel === 'building' ? (selectedMicroId || '') : '',
          isActiveTarget: false,
          icon: activePlacingClassAsset.icon,
          objectClass: activePlacingClassAsset.className,
          physicalWidth: defaultWidth,
          physicalHeight: defaultHeight
        }
      };

      onUpdateLore([...lore, newPlace]);
      
      if (!keepClassPlacingMode) {
        setActivePlacingClassAsset(null);
      }
      return;
    }

    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  const handleMapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggedNodeId && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const mapWidth = world?.mapConfig?.mapWidth || 100;
      const mapHeight = world?.mapConfig?.mapHeight || 100;
      
      const adjustedX = (e.clientX - rect.left - panOffset.x) / mapScale;
      const adjustedY = (e.clientY - rect.top - panOffset.y) / mapScale;

      const x = Math.max(0, Math.min(mapWidth, Math.round(((adjustedX / rect.width) * mapWidth) * 10) / 10));
      const y = Math.max(0, Math.min(mapHeight, Math.round(((adjustedY / rect.height) * mapHeight) * 10) / 10));
      
      onUpdateLore(lore.map(l => l.id === draggedNodeId ? {
        ...l,
        details: {
          ...l.details,
          coordinates: {
            x,
            y
          }
        }
      } : l));
    } else if (isPanning && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      let dx = e.clientX - panStart.x;
      let dy = e.clientY - panStart.y;

      if (mapScale > 1) {
        const minX = containerWidth * (1 - mapScale);
        const maxX = 0;
        const minY = containerHeight * (1 - mapScale);
        const maxY = 0;

        dx = Math.max(minX, Math.min(maxX, dx));
        dy = Math.max(minY, Math.min(maxY, dy));
      } else {
        dx = (containerWidth * (1 - mapScale)) / 2;
        dy = (containerHeight * (1 - mapScale)) / 2;
      }

      setPanOffset({ x: dx, y: dy });
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDraggedNodeId(null);
      setIsPanning(false);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, []);

  const handleMapPointerUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const [newEventStepText, setNewEventStepText] = useState('');
  const [newEventStepTitle, setNewEventStepTitle] = useState('');
  const [newEventStepBranch, setNewEventStepBranch] = useState<'main' | 'side'>('main');
  const [newEventStepType, setNewEventStepType] = useState<'story' | 'quest'>('story');
  const [newEventQuestOutcome, setNewEventQuestOutcome] = useState<'success' | 'failure' | 'open'>('open');
  const [newEventStepConditions, setNewEventStepConditions] = useState('');
  const [newEventStepChatInstruction, setNewEventStepChatInstruction] = useState('');
  const [newEventStepTravelPath, setNewEventStepTravelPath] = useState('');
  const [newEventStepTravelDurationDays, setNewEventStepTravelDurationDays] = useState<number | ''>('');
  const [newEventStepTimeOfDay, setNewEventStepTimeOfDay] = useState('');
  const [newEventStepRevealedKnowledge, setNewEventStepRevealedKnowledge] = useState('');
  const [newEventStepTrigger, setNewEventStepTrigger] = useState('');
  const [newEventStepCast, setNewEventStepCast] = useState('');
  const [newEventStepSetting, setNewEventStepSetting] = useState('');
  const [newEventStepConflict, setNewEventStepConflict] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [isSyncingMap, setIsSyncingMap] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<'story' | 'quest'>('story');

  const [listSearchTerm, setListSearchTerm] = useState('');
  const [listLevelFilter, setListLevelFilter] = useState<'all' | 'macro' | 'meso' | 'micro'>('all');
  const [listTypeFilter, setListTypeFilter] = useState<'all' | 'story' | 'checkpoint'>('all');

  const syncMapFromEvents = async (steps: any[], currentLore: LoreEntry[]) => {
    if (!steps || steps.length === 0) return;
    setIsSyncingMap(true);
    try {
      const response = await GeminiService.generatePlacesFromEvents(
        steps,
        currentLore.filter(l => l.category === 'Orte'),
        world || { title: worldTitle, description: '' }
      );
      
      if (response && Array.isArray(response.places)) {
        let updatedLore = [...currentLore];
        
        response.places.forEach((newPlace: any) => {
          const existingIdx = updatedLore.findIndex(
            l => l.category === 'Orte' && (l.id === newPlace.id || l.title.toLowerCase() === newPlace.title.toLowerCase())
          );
          
          const formattedPlace: LoreEntry = {
            id: newPlace.id || Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
            category: 'Orte',
            title: newPlace.title,
            description: newPlace.description,
            isUnlocked: newPlace.isUnlocked !== false,
            details: {
              ...newPlace.details,
              parentPlaceId: newPlace.details?.parentPlaceId || '',
              associatedEventStepId: newPlace.details?.associatedEventStepId || ''
            },
            secretsStage1: newPlace.secretsStage1 || '',
            secretsStage2: newPlace.secretsStage2 || '',
            secretsStage3: newPlace.secretsStage3 || ''
          };
          
          if (existingIdx >= 0) {
            const existing = updatedLore[existingIdx];
            updatedLore[existingIdx] = {
              ...existing,
              title: formattedPlace.title,
              description: formattedPlace.description || existing.description,
              details: {
                ...existing.details,
                ...formattedPlace.details,
                coordinates: existing.details?.coordinates || formattedPlace.details?.coordinates
              }
            };
          } else {
            updatedLore.push(formattedPlace);
          }
        });
        
        onUpdateLore(updatedLore);
      }
    } catch (err) {
      console.error("Fehler bei der Karten-Synchronisierung:", err);
    } finally {
      setIsSyncingMap(false);
    }
  };

  const handleAddManualStep = () => {
    if (!newEventStepText.trim()) return;
    const steps = [...(editForm.details?.eventSteps || [])];
    
    if (editingStepId) {
      const updatedSteps = steps.map(s => s.id === editingStepId ? {
        ...s,
        title: newEventStepTitle.trim() || s.title || `Station #${steps.indexOf(s) + 1}`,
        description: newEventStepText.trim(),
        branch: newEventStepBranch,
        stepType: newEventStepType,
        questOutcome: newEventStepType === 'quest' ? newEventQuestOutcome : undefined,
        unlockConditions: newEventStepConditions.trim() || 'Keine',
        chatInstruction: newEventStepChatInstruction.trim(),
        travelPath: newEventStepTravelPath.trim(),
        travelDurationDays: newEventStepTravelDurationDays !== '' ? Number(newEventStepTravelDurationDays) : undefined,
        timeOfDay: newEventStepTimeOfDay.trim(),
        revealedKnowledge: newEventStepRevealedKnowledge.trim() || undefined,
        trigger: newEventStepTrigger.trim() || undefined,
        cast: newEventStepCast.trim() || undefined,
        setting: newEventStepSetting.trim() || undefined,
        conflict: newEventStepConflict.trim() || undefined
      } : s);
      updateAndSyncSteps(updatedSteps);
      setEditingStepId(null);
    } else {
      const newStep = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        title: newEventStepTitle.trim() || `Station #${steps.length + 1}`,
        description: newEventStepText.trim(),
        status: 'planned' as const,
        branch: newEventStepBranch,
        stepType: newEventStepType,
        questOutcome: newEventStepType === 'quest' ? newEventQuestOutcome : undefined,
        unlockConditions: newEventStepConditions.trim() || 'Keine',
        chatInstruction: newEventStepChatInstruction.trim(),
        travelPath: newEventStepTravelPath.trim(),
        travelDurationDays: newEventStepTravelDurationDays !== '' ? Number(newEventStepTravelDurationDays) : undefined,
        timeOfDay: newEventStepTimeOfDay.trim(),
        revealedKnowledge: newEventStepRevealedKnowledge.trim() || undefined,
        trigger: newEventStepTrigger.trim() || undefined,
        cast: newEventStepCast.trim() || undefined,
        setting: newEventStepSetting.trim() || undefined,
        conflict: newEventStepConflict.trim() || undefined
      };
      const updatedSteps = [...steps, newStep];
      updateAndSyncSteps(updatedSteps);
    }
    
    setNewEventStepText('');
    setNewEventStepTitle('');
    setNewEventStepBranch('main');
    setNewEventStepType('story');
    setNewEventQuestOutcome('open');
    setNewEventStepConditions('');
    setNewEventStepChatInstruction('');
    setNewEventStepTravelPath('');
    setNewEventStepTravelDurationDays('');
    setNewEventStepTimeOfDay('');
    setNewEventStepRevealedKnowledge('');
    setNewEventStepTrigger('');
    setNewEventStepCast('');
    setNewEventStepSetting('');
    setNewEventStepConflict('');
  };

  const handleStartEditStep = (step: any) => {
    setEditingStepId(step.id);
    setNewEventStepTitle(step.title || '');
    setNewEventStepText(step.description || '');
    setNewEventStepBranch(step.branch || 'main');
    setNewEventStepType(step.stepType || 'story');
    setNewEventQuestOutcome(step.questOutcome || 'open');
    setNewEventStepConditions(step.unlockConditions || '');
    setNewEventStepChatInstruction(step.chatInstruction || '');
    setNewEventStepTravelPath(step.travelPath || '');
    setNewEventStepTravelDurationDays(step.travelDurationDays !== undefined ? step.travelDurationDays : '');
    setNewEventStepTimeOfDay(step.timeOfDay || '');
    setNewEventStepRevealedKnowledge(step.revealedKnowledge || '');
    setNewEventStepTrigger(step.trigger || '');
    setNewEventStepCast(step.cast || '');
    setNewEventStepSetting(step.setting || '');
    setNewEventStepConflict(step.conflict || '');
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setNewEventStepText('');
    setNewEventStepTitle('');
    setNewEventStepBranch('main');
    setNewEventStepType('story');
    setNewEventQuestOutcome('open');
    setNewEventStepConditions('');
    setNewEventStepChatInstruction('');
    setNewEventStepTravelPath('');
    setNewEventStepTravelDurationDays('');
    setNewEventStepTimeOfDay('');
    setNewEventStepRevealedKnowledge('');
    setNewEventStepTrigger('');
    setNewEventStepCast('');
    setNewEventStepSetting('');
    setNewEventStepConflict('');
  };

  const updateAndSyncSteps = (updatedSteps: any[]) => {
    const prev = editForm;
    const details = { ...(prev.details || {}), eventSteps: updatedSteps };
    const description = updatedSteps.map((s, idx) => `${idx + 1}. [${s.title}] ${s.description}`).join('\n');
    const title = prev.title && prev.title !== 'Ereignis-Timeline' ? prev.title : (updatedSteps[0] ? `Ereignis-Timeline (${updatedSteps[0].description.slice(0, 20)}...)` : 'Ereignis-Timeline');
    const updatedEntry = {
      ...prev,
      title,
      description,
      details
    } as LoreEntry;

    setEditForm(updatedEntry);

    if (prev.id) {
      const nextLore = lore.map(l => l.id === prev.id ? updatedEntry : l);
      onUpdateLore(nextLore);
      syncMapFromEvents(updatedSteps, nextLore);
    }
  };

  const handleUpdateStepText = (id: string, text: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updated = steps.map(s => s.id === id ? { ...s, description: text } : s);
    updateAndSyncSteps(updated);
  };

  const handleToggleStepStatus = (id: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updated = steps.map(s => s.id === id ? { ...s, status: s.status === 'happened' ? 'planned' : 'happened' } : s);
    updateAndSyncSteps(updated);
  };

  const handleMoveStep = (fromIdx: number, toIdx: number) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    if (toIdx < 0 || toIdx >= steps.length) return;
    const temp = steps[fromIdx];
    steps[fromIdx] = steps[toIdx];
    steps[toIdx] = temp;
    
    const resortedSteps = steps.map((s, idx) => ({ 
      ...s, 
      title: s.title && !s.title.startsWith('Station #') ? s.title : `Station #${idx + 1}` 
    }));
    updateAndSyncSteps(resortedSteps);
  };

  const handleDeleteStep = (id: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updatedBeforeResort = steps.filter(s => s.id !== id);
    const updated = updatedBeforeResort.map((s, idx) => ({ 
      ...s, 
      title: s.title && !s.title.startsWith('Station #') ? s.title : `Station #${idx + 1}` 
    }));
    updateAndSyncSteps(updated);
    if (editingStepId === id) {
      handleCancelEditStep();
    }
  };

  const mapScaleRef = useRef(mapScale);
  useEffect(() => {
    mapScaleRef.current = mapScale;
  }, [mapScale]);

  useEffect(() => {
    const handleResize = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const currentScale = mapScaleRef.current;
        if (containerWidth > 0 && containerHeight > 0) {
          setPanOffset(prev => {
            if (currentScale > 1) {
              const minX = containerWidth * (1 - currentScale);
              const maxX = 0;
              const minY = containerHeight * (1 - currentScale);
              const maxY = 0;
              return {
                x: Math.max(minX, Math.min(maxX, prev.x)),
                y: Math.max(minY, Math.min(maxY, prev.y))
              };
            } else {
              return {
                x: (containerWidth * (1 - currentScale)) / 2,
                y: (containerHeight * (1 - currentScale)) / 2
              };
            }
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hasEvents = lore.some(l => (l.category as string) === 'Events');
    if (hasEvents) {
      const migrated = lore.map(l => {
        if ((l.category as string) === 'Events') {
          return { ...l, category: 'Story & Quests' as LoreCategory };
        }
        return l;
      });
      onUpdateLore(migrated);
    }
  }, [lore, onUpdateLore]);

  const handleZoom = (newScale: number) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      const logicalX = (centerX - panOffset.x) / mapScale;
      const logicalY = (centerY - panOffset.y) / mapScale;
      
      let newPanX = centerX - logicalX * newScale;
      let newPanY = centerY - logicalY * newScale;
      
      if (newScale > 1) {
        const minX = containerWidth * (1 - newScale);
        const minY = containerHeight * (1 - newScale);
        newPanX = Math.max(minX, Math.min(0, newPanX));
        newPanY = Math.max(minY, Math.min(0, newPanY));
      } else {
        newPanX = (containerWidth * (1 - newScale)) / 2;
        newPanY = (containerHeight * (1 - newScale)) / 2;
      }
      
      setPanOffset({ x: newPanX, y: newPanY });
    }
    setMapScale(newScale);
  };

  useEffect(() => {
    if (activeCategory === 'Story & Quests') {
      const eventEntry = lore.find(l => l.category === 'Story & Quests' || (l.category as string) === 'Events');
      if (eventEntry) {
        const migratedEntry = { ...eventEntry, category: 'Story & Quests' as LoreCategory };
        setIsEditing(migratedEntry.id);
        setEditForm(migratedEntry);
      } else {
        const newEventEntry: LoreEntry = {
          id: 'single-story-events-timeline',
          category: 'Story & Quests',
          title: 'Ereignis-Timeline',
          description: 'Chronologischer Ablauf der Geschichte',
          isUnlocked: true,
          details: {
            eventSteps: []
          }
        };
        onUpdateLore([...lore, newEventEntry]);
        setIsEditing(newEventEntry.id);
        setEditForm(newEventEntry);
      }
    } else {
      const safeCategory = (activeCategory === 'Verhüllung' ? 'Charaktere' : activeCategory === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory;
      if (isEditing && (lore.find(l => l.id === isEditing)?.category === 'Story & Quests' || (lore.find(l => l.id === isEditing)?.category as string) === 'Events')) {
        setIsEditing(null);
        setEditForm({ category: safeCategory });
      } else if (!isEditing) {
        setEditForm({ category: safeCategory });
      }
    }
  }, [activeCategory]);

  const handleSetActiveDestination = (nodeId: string) => {
    const updated = lore.map(item => {
      if (item.category === 'Orte') {
        return {
          ...item,
          details: {
            ...item.details,
            isActiveTarget: item.id === nodeId
          }
        };
      }
      return item;
    });
    onUpdateLore(updated);
  };

  useEffect(() => {
    if (activeCategory === 'Orte') {
      let changed = false;
      const updatedLore = lore.map((entry) => {
        if (entry.category === 'Orte') {
          const details = entry.details || {};
          let needsUpdate = false;
          let mapLevel = details.mapLevel;
          let coordinates = details.coordinates;
          let parentPlaceId = details.parentPlaceId || '';

          if (!mapLevel) {
            needsUpdate = true;
            const combined = (entry.title + ' ' + entry.description).toLowerCase();
            if (/gilde|taverne|haus|höhle|shop|laden|markt|zimmer|poi|bar|herberge|schrein|ruine|tempel|palast|platz|arena|zuhause|kerker/i.test(combined)) {
              mapLevel = 'micro';
            } else if (/kontinent|welt|reich|königreich|ozean|meer|insel/i.test(combined)) {
              mapLevel = 'macro';
            } else {
              mapLevel = 'meso';
            }
          }

          if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
            needsUpdate = true;
            let hash = 0;
            for (let i = 0; i < entry.title.length; i++) {
              hash = entry.title.charCodeAt(i) + ((hash << 5) - hash);
            }
            const x = Math.abs((hash * 13) % 70) + 15;
            const y = Math.abs((hash * 37) % 70) + 15;
            coordinates = { x, y };
          }

          if (needsUpdate) {
            changed = true;
            return {
              ...entry,
              details: {
                ...details,
                mapLevel,
                coordinates,
                parentPlaceId
              }
            };
          }
        }
        return entry;
      });

      if (changed) {
        onUpdateLore(updatedLore);
      }
    }
  }, [activeCategory, lore, onUpdateLore]);

  const handleSave = () => {
    if (!editForm.title || !editForm.description) return;
    
    const safeCategory = (activeCategory === 'Verhüllung' ? 'Charaktere' : activeCategory === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory;
    const targetCategory = editForm.category || safeCategory;

    let finalForm = { ...editForm };
    if (targetCategory === 'Fraktionen') {
      const cleanMembers: FactionMember[] = effectiveMembers.map(m => {
        const { isAutoDetected, codexEntry, ...cleanMember } = m;
        return cleanMember;
      });
      finalForm = {
        ...finalForm,
        details: {
          ...(finalForm.details || {}),
          members: cleanMembers
        }
      };
    }

    let newLore;
    if (isEditing) {
      newLore = lore.map(l => l.id === isEditing ? { ...l, ...finalForm } as LoreEntry : l);
    } else {
      newLore = [...lore, { 
        ...finalForm, 
        id: Date.now().toString(), 
        category: targetCategory,
        isUnlocked: finalForm.isUnlocked !== false 
      } as LoreEntry];
    }
    
    onUpdateLore(newLore);
    if (onUpdateWorld && world) {
      const currentEconomy = world.economyConfig || {
        currencyName: 'Goldmünzen',
        currencyIcon: '🪙',
        payoutInterval: 'weekly',
        allowPassiveIncome: true,
        enableRandomEvents: true,
        holdings: []
      };
      const { updatedEconomy } = syncEconomyWithWorld(currentEconomy, newLore, world.territories || []);
      onUpdateWorld({
        ...world,
        economyConfig: updatedEconomy
      });
    }
    setIsEditing(null);
    setEditForm({ category: safeCategory });
  };

  const handleDelete = (id: string) => {
    const safeCategory = (activeCategory === 'Verhüllung' ? 'Charaktere' : activeCategory === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory;
    const updatedLore = lore.filter(l => l.id !== id);
    onUpdateLore(updatedLore);
    if (onUpdateWorld && world) {
      const currentEconomy = world.economyConfig || {
        currencyName: 'Goldmünzen',
        currencyIcon: '🪙',
        payoutInterval: 'weekly',
        allowPassiveIncome: true,
        enableRandomEvents: true,
        holdings: []
      };
      const { updatedEconomy } = syncEconomyWithWorld(currentEconomy, updatedLore, world.territories || []);
      onUpdateWorld({
        ...world,
        economyConfig: updatedEconomy
      });
    }
    if (isEditing === id) {
      setIsEditing(null);
      setEditForm({ category: safeCategory });
    }
  };

  const handleSaveTerritory = () => {
    if (!territoryForm.name || !territoryForm.description) return;
    
    const territories = world?.territories || [];
    let updatedTerritories: Territory[] = [];
    
    if (isEditingTerritory) {
      updatedTerritories = territories.map(t => t.id === isEditingTerritory ? {
        ...t,
        ...territoryForm,
        id: isEditingTerritory
      } as Territory : t);
    } else {
      const newTerritory: Territory = {
        id: `territory-${Date.now()}`,
        ...territoryForm,
        x: territoryForm.x !== undefined ? Number(territoryForm.x) : 50,
        y: territoryForm.y !== undefined ? Number(territoryForm.y) : 50,
        isUnlocked: true
      } as Territory;
      updatedTerritories = [...territories, newTerritory];
    }
    
    if (onUpdateWorld) {
      const currentEconomy = world?.economyConfig || {
        currencyName: 'Goldmünzen',
        currencyIcon: '🪙',
        payoutInterval: 'weekly',
        allowPassiveIncome: true,
        enableRandomEvents: true,
        holdings: []
      };
      const { updatedEconomy } = syncEconomyWithWorld(currentEconomy, rawLore, updatedTerritories);

      onUpdateWorld({
        ...world,
        territories: updatedTerritories,
        economyConfig: updatedEconomy
      });
    }
    
    setIsEditingTerritory(null);
    setIsCustomFactionInput(false);
    setTerritoryForm({
      name: '',
      type: 'stadt',
      description: '',
      parentId: null,
      population: '',
      ruler: '',
      climate: '',
      culture: '',
      terrain: '',
      faction: '',
      x: 50,
      y: 50,
      biome: '',
      size: '',
      borders: '',
      waters: '',
      mountains: '',
      forests: '',
      races: '',
      language: '',
      religion: '',
      livingStandard: '',
      allies: '',
      enemies: '',
      government: '',
      resources: '',
      trade: '',
      currency: '',
      exports: '',
      imports: '',
      dangerLevel: '',
      militaryStrength: '',
      defense: '',
      landmarks: '',
      pointsOfInterest: '',
      dungeons: '',
      magicPlaces: '',
      naturalWonders: ''
    });
    setWeltkarteSmartFill('');
  };

  const handleDeleteTerritory = (id: string) => {
    const territories = world?.territories || [];
    const updatedTerritories = territories.filter(t => t.id !== id);
    if (onUpdateWorld) {
      onUpdateWorld({
        ...world,
        territories: updatedTerritories
      });
    }
    if (isEditingTerritory === id) {
      setIsEditingTerritory(null);
      setTerritoryForm({
        name: '',
        type: 'stadt',
        description: '',
        parentId: null,
        population: '',
        ruler: '',
        climate: '',
        culture: '',
        terrain: '',
        faction: '',
        x: 50,
        y: 50,
        biome: '',
        size: '',
        borders: '',
        waters: '',
        mountains: '',
        forests: '',
        races: '',
        language: '',
        religion: '',
        livingStandard: '',
        allies: '',
        enemies: '',
        government: '',
        resources: '',
        trade: '',
        currency: '',
        exports: '',
        imports: '',
        dangerLevel: '',
        militaryStrength: '',
        defense: '',
        landmarks: '',
        pointsOfInterest: '',
        dungeons: '',
        magicPlaces: '',
        naturalWonders: ''
      });
    }
  };

  const handleDeleteRegionMarker = (id: string) => {
    const markers = world?.regionMarkers || [];
    const updatedMarkers = markers.filter((m: any) => {
      const markerId = m.id || `marker-${m.name}`;
      return markerId !== id && m.name !== id;
    });
    if (onUpdateWorld) {
      onUpdateWorld({
        ...world,
        regionMarkers: updatedMarkers
      });
    }
  };

  const handleDeleteAllRegionMarkers = () => {
    if (confirm("Möchtest du wirklich alle regionalen POIs, Wegpunkte und Meereszonen unwiderruflich löschen?")) {
      if (onUpdateWorld) {
        onUpdateWorld({
          ...world,
          regionMarkers: []
        });
      }
    }
  };

  const handleTerritorySmartFill = async () => {
    if (!weltkarteSmartFill.trim()) return;
    setIsSmartFillingTerritory(true);
    try {
      const data = await GeminiService.autofillTerritory(
        weltkarteSmartFill,
        territoryForm.type || 'stadt',
        world,
        world?.territories,
        isSmartFillComplementMode ? territoryForm : { name: territoryForm.name, type: territoryForm.type }
      );
      
      setTerritoryForm(prev => {
        if (isSmartFillComplementMode) {
          return {
            ...prev,
            name: data.name || prev.name,
            type: data.type || prev.type,
            description: data.description || prev.description,
            population: data.population || prev.population,
            ruler: data.ruler || prev.ruler,
            climate: data.climate || prev.climate,
            culture: data.culture || prev.culture,
            terrain: data.terrain || prev.terrain,
            faction: data.faction || prev.faction,
            x: data.x !== undefined ? Number(data.x) : prev.x,
            y: data.y !== undefined ? Number(data.y) : prev.y,
            biome: data.biome || prev.biome,
            size: data.size || prev.size,
            borders: data.borders || prev.borders,
            waters: data.waters || prev.waters,
            mountains: data.mountains || prev.mountains,
            forests: data.forests || prev.forests,
            races: data.races || prev.races,
            language: data.language || prev.language,
            religion: data.religion || prev.religion,
            livingStandard: data.livingStandard || prev.livingStandard,
            allies: data.allies || prev.allies,
            enemies: data.enemies || prev.enemies,
            government: data.government || prev.government,
            resources: data.resources || prev.resources,
            trade: data.trade || prev.trade,
            currency: data.currency || prev.currency,
            exports: data.exports || prev.exports,
            imports: data.imports || prev.imports,
            dangerLevel: data.dangerLevel || prev.dangerLevel,
            militaryStrength: data.militaryStrength || prev.militaryStrength,
            defense: data.defense || prev.defense,
            landmarks: data.landmarks || prev.landmarks,
            pointsOfInterest: data.pointsOfInterest || prev.pointsOfInterest,
            dungeons: data.dungeons || prev.dungeons,
            magicPlaces: data.magicPlaces || prev.magicPlaces,
            naturalWonders: data.naturalWonders || prev.naturalWonders
          };
        } else {
          return {
            id: prev.id,
            name: data.name || weltkarteSmartFill,
            type: data.type || prev.type || 'stadt',
            description: data.description || '',
            population: data.population || '',
            ruler: data.ruler || '',
            climate: data.climate || '',
            culture: data.culture || '',
            terrain: data.terrain || '',
            faction: data.faction || '',
            x: data.x !== undefined ? Number(data.x) : (prev.x ?? 50),
            y: data.y !== undefined ? Number(data.y) : (prev.y ?? 50),
            biome: data.biome || '',
            size: data.size || '',
            borders: data.borders || '',
            waters: data.waters || '',
            mountains: data.mountains || '',
            forests: data.forests || '',
            races: data.races || '',
            language: data.language || '',
            religion: data.religion || '',
            livingStandard: data.livingStandard || '',
            allies: data.allies || '',
            enemies: data.enemies || '',
            government: data.government || '',
            resources: data.resources || '',
            trade: data.trade || '',
            currency: data.currency || '',
            exports: data.exports || '',
            imports: data.imports || '',
            dangerLevel: data.dangerLevel || '',
            militaryStrength: data.militaryStrength || '',
            defense: data.defense || '',
            landmarks: data.landmarks || '',
            pointsOfInterest: data.pointsOfInterest || '',
            dungeons: data.dungeons || '',
            magicPlaces: data.magicPlaces || '',
            naturalWonders: data.naturalWonders || ''
          };
        }
      });
    } catch (error) {
      console.error("Fehler beim automatischen Ausfüllen des Gebiets:", error);
    } finally {
      setIsSmartFillingTerritory(false);
    }
  };

  const handleLoreSmartFill = async () => {
    if (!loreSmartFill.trim()) return;
    setIsSmartFillingLore(true);
    try {
      const safeCategory = (activeCategory === 'Verhüllung' ? 'Charaktere' : activeCategory === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory;
      const cat = editForm.category || safeCategory;
      const existingCharacterNames: string[] = [];
      lore.filter(l => l.category === 'Charaktere' || l.category === 'Gegner').forEach(l => {
        if (l.title) existingCharacterNames.push(l.title);
        if (l.details?.nickname) existingCharacterNames.push(l.details.nickname);
      });
      const existingFactions = lore
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const data = await GeminiService.autofillLoreEntry(
        loreSmartFill, 
        cat, 
        worldPowerSettings, 
        playerName, 
        existingCharacterNames,
        keepExistingLoreDetails ? editForm : { title: editForm.title, category: editForm.category },
        world,
        existingFactions,
        lore
      );
      const prev = editForm;
      let generatedAbilities = prev.details?.abilities;
      if ((cat === 'Charaktere' || cat === 'Gegner') && (data.details?.skills || data.details?.powerSource)) {
        const newAbil = {
          id: Date.now().toString(),
          source: data.details.powerSource || '',
          cost: data.details.powerCost || '',
          description: data.details.skills || '',
          techniques: data.details.techniques || '',
          techniqueList: (data.details.techniqueList && Array.isArray(data.details.techniqueList))
            ? data.details.techniqueList.filter((t: any) => t && t.name).map((t: any, index: number) => ({ 
                id: `${Date.now()}-${index}`, 
                name: t.name.trim(), 
                description: t.description ? t.description.trim() : '',
                type: t.type || 'Angriff',
                subtype: t.subtype || 'Einzelschuss',
                level: t.level || 1,
                maxLevel: t.maxLevel || 10,
                xp: t.xp || 0,
                xpNeeded: t.xpNeeded || 100
              }))
            : (data.details.techniques 
                ? data.details.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean).map((name: string, index: number) => ({ 
                    id: `${Date.now()}-${index}`, 
                    name, 
                    description: '',
                    type: 'Angriff',
                    subtype: 'Einzelschuss',
                    level: 1,
                    maxLevel: 10,
                    xp: 0,
                    xpNeeded: 100
                  }))
                : []
              )
        };
        if (keepExistingLoreDetails && prev.details?.abilities && prev.details.abilities.length > 0) {
          generatedAbilities = [...prev.details.abilities, newAbil];
        } else {
          generatedAbilities = [newAbil];
        }
      }
      let processedDetails = { ...data.details };
      if (cat === 'Charaktere' || cat === 'Gegner') {
        if (processedDetails.gender) {
          const g = processedDetails.gender.trim().toLowerCase();
          if (g === 'male' || g.startsWith('männ')) processedDetails.gender = 'Männlich';
          else if (g === 'female' || g.startsWith('weib')) processedDetails.gender = 'Weiblich';
          else if (g === 'divers') processedDetails.gender = 'Divers';
          else if (g.includes('nicht') || g.includes('non') || g.includes('binär')) processedDetails.gender = 'Nicht-Binär';
          else if (g.startsWith('andro')) processedDetails.gender = 'Androgyn';
          else processedDetails.gender = 'Unbekannt';
        } else {
          processedDetails.gender = 'Unbekannt';
        }

        if (processedDetails.build) {
          const b = processedDetails.build.trim().toLowerCase();
          if (b.startsWith('schlan')) processedDetails.build = 'Schlank';
          else if (b.startsWith('sport')) processedDetails.build = 'Sportlich';
          else if (b.startsWith('musk')) processedDetails.build = 'Muskulös';
          else if (b.startsWith('kräf')) processedDetails.build = 'Kräftig';
          else if (b.startsWith('zier')) processedDetails.build = 'Zierlich';
          else if (b.startsWith('drah')) processedDetails.build = 'Drahtig';
          else if (b.startsWith('kurv')) processedDetails.build = 'Kurvig';
          else if (b.startsWith('stämm')) processedDetails.build = 'Stämmig';
          else if (b.startsWith('hage')) processedDetails.build = 'Hager';
          else processedDetails.build = 'Unbekannt';
        } else {
          processedDetails.build = 'Unbekannt';
        }

        if (processedDetails.cupSize) {
          const c = processedDetails.cupSize.trim().toUpperCase();
          if (["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].includes(c)) {
            processedDetails.cupSize = c;
          } else {
            processedDetails.cupSize = '-';
          }
        }

        processedDetails = autoCalculateAppearance(processedDetails, 'build', false);
      }
      
      if (cat === 'Orte') {
        const currentLvl = processedDetails.mapLevel || prev.details?.mapLevel || mapZoomLevel;
        const width = processedDetails.physicalWidth !== undefined ? Number(processedDetails.physicalWidth) : undefined;
        const height = processedDetails.physicalHeight !== undefined ? Number(processedDetails.physicalHeight) : undefined;
        
        const defaultWidth = currentLvl === 'macro' ? 500 : currentLvl === 'meso' ? 2 : 3;
        const defaultHeight = currentLvl === 'macro' ? 500 : currentLvl === 'meso' ? 2 : 3;
        
        processedDetails.physicalWidth = (width && width > 0) ? width : defaultWidth;
        processedDetails.physicalHeight = (height && height > 0) ? height : defaultHeight;
      }
      
      let mergedRelationships = (processedDetails.relationships || []).map((rel: any, idx: number) => ({
        id: rel.id || `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        targetCharacter: rel.targetCharacter || '',
        type: rel.type || '',
        behavior: rel.behavior || '',
        sharedPast: rel.sharedPast || '',
        _isCustom: rel._isCustom || false
      }));
      if (keepExistingLoreDetails && prev.details?.relationships && prev.details.relationships.length > 0) {
        const currentRels = [...prev.details.relationships];
        if (Array.isArray(mergedRelationships)) {
          mergedRelationships.forEach((newRel: any) => {
            const existingIdx = currentRels.findIndex((r: any) => r.targetCharacter?.toLowerCase() === newRel.targetCharacter?.toLowerCase());
            if (existingIdx >= 0) {
              currentRels[existingIdx] = { ...currentRels[existingIdx], ...newRel };
            } else {
              currentRels.push(newRel);
            }
          });
        }
        mergedRelationships = currentRels;
      }

      let finalTitle = data.title || (keepExistingLoreDetails ? prev.title : loreSmartFill);
      let finalDescription = data.description || (keepExistingLoreDetails ? prev.description : '');
      
      if (cat === 'Story & Quests' || (cat as string) === 'Events') {
        if (processedDetails.eventSteps) {
          processedDetails.eventSteps = processedDetails.eventSteps.map((step: any, idx: number) => ({
            ...step,
            id: step.id || `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            title: step.title || `Station #${idx + 1}`,
            status: step.status || 'planned',
            branch: step.branch || 'main',
            unlockConditions: step.unlockConditions || 'Keine',
            chatInstruction: step.chatInstruction || '',
            travelPath: step.travelPath || '',
            travelDurationDays: step.travelDurationDays !== undefined ? Number(step.travelDurationDays) : undefined,
            timeOfDay: step.timeOfDay || '',
            trigger: step.trigger || '',
            cast: step.cast || '',
            setting: step.setting || '',
            conflict: step.conflict || '',
            revealedKnowledge: step.revealedKnowledge || ''
          }));
          finalDescription = processedDetails.eventSteps.map((s: any, idx: number) => `${idx + 1}. [${s.title}] ${s.description || ''}`).join('\n');
          if (!finalTitle || finalTitle === 'Events' || finalTitle === 'Event' || finalTitle === 'Story & Quests') {
            finalTitle = processedDetails.eventSteps[0]?.title || 'Ereignis-Timeline';
          }
        } else {
          processedDetails.eventSteps = [];
        }
      }

      if (cat === 'Fraktionen') {
        let parsedMembers: FactionMember[] = [];
        if (processedDetails.members && Array.isArray(processedDetails.members)) {
          parsedMembers = processedDetails.members.map((m: any, idx: number) => ({
            id: m.id || `fm-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            name: m.name || 'Unbenanntes Mitglied',
            characterId: m.characterId || '',
            job: m.job || 'Mitglied',
            tasks: m.tasks || 'Aufgaben für das Wirtschafts- & Managementsystem',
            joinedDate: m.joinedDate || 'Unbekannt',
            status: m.status || 'Aktiv'
          }));
        }
        if (keepExistingLoreDetails && prev.details?.members && Array.isArray(prev.details.members)) {
          processedDetails.members = [...prev.details.members, ...parsedMembers];
        } else {
          processedDetails.members = parsedMembers;
        }
      }

      const nextSecrets1 = data.secretsStage1 !== undefined ? data.secretsStage1 : (keepExistingLoreDetails ? prev.secretsStage1 : '');
      const nextSecrets2 = data.secretsStage2 !== undefined ? data.secretsStage2 : (keepExistingLoreDetails ? prev.secretsStage2 : '');
      const nextSecrets3 = data.secretsStage3 !== undefined ? data.secretsStage3 : (keepExistingLoreDetails ? prev.secretsStage3 : '');
      const nextKnowledge = data.knowledge !== undefined ? data.knowledge : (keepExistingLoreDetails ? prev.knowledge : '');

      const updatedEntry = {
        ...prev,
        title: finalTitle,
        description: finalDescription,
        secretsStage1: nextSecrets1,
        secretsStage2: nextSecrets2,
        secretsStage3: nextSecrets3,
        knowledge: nextKnowledge,
        details: keepExistingLoreDetails ? {
          ...prev.details,
          ...processedDetails,
          relationships: mergedRelationships,
          abilities: generatedAbilities,
          campaignPowerLevels: data.details?.campaignPowerLevels || prev.details?.campaignPowerLevels
        } : {
          ...processedDetails,
          relationships: mergedRelationships,
          abilities: generatedAbilities,
          campaignPowerLevels: data.details?.campaignPowerLevels || {}
        }
      } as LoreEntry;

      setEditForm(updatedEntry);

      if ((cat === 'Story & Quests' || (cat as string) === 'Events') && prev.id) {
        const nextLore = lore.map(l => l.id === prev.id ? updatedEntry : l);
        onUpdateLore(nextLore);
        if (processedDetails.eventSteps && processedDetails.eventSteps.length > 0) {
          syncMapFromEvents(processedDetails.eventSteps, nextLore);
        }
      }
      setLoreSmartFill('');
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim automatischen Ausfüllen des Eintrags.");
    } finally {
      setIsSmartFillingLore(false);
    }
  };

  const handleOmniGenerate = async () => {
    if (!omniSmartFillPrompt.trim()) return;
    setIsOmniGenerating(true);
    setOmniSuccessMessage(null);
    try {
      const results = await GeminiService.autofillMultipleLoreEntries(
        omniSmartFillPrompt,
        world,
        lore,
        worldPowerSettings,
        playerName,
        isNsfw
      );

      const mappedResults = results.map((entry: any, index: number) => {
        const tempId = `omni-temp-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
        const details = entry.details || {};
        
        let abilities = details.abilities || [];
        if ((entry.category === 'Charaktere' || entry.category === 'Gegner') && (details.skills || details.powerSource)) {
          abilities = [{
            id: `abil-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
            source: details.powerSource || '',
            cost: details.powerCost || '',
            description: details.skills || '',
            techniques: details.techniques || '',
            techniqueList: (details.techniqueList && Array.isArray(details.techniqueList))
              ? details.techniqueList.map((t: any, idx: number) => ({
                  id: `tech-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                  name: t.name || '',
                  description: t.description || '',
                  type: t.type || 'Angriff',
                  subtype: t.subtype || 'Einzelschuss',
                  level: t.level || 1,
                  maxLevel: t.maxLevel || 10,
                  xp: t.xp || 0,
                  xpNeeded: t.xpNeeded || 100
                }))
              : []
          }];
        }

        return {
          ...entry,
          tempId,
          details: {
            ...details,
            abilities
          }
        };
      });

      setProposedEntries(mappedResults);
      setSelectedProposedIds(new Set(mappedResults.map(r => r.tempId)));
    } catch (err) {
      console.error(err);
      alert("Fehler bei der Generierung der Multieinträge.");
    } finally {
      setIsOmniGenerating(false);
    }
  };

  const handleSaveSelectedOmniEntries = () => {
    const entriesToSave = proposedEntries.filter(entry => selectedProposedIds.has(entry.tempId));
    if (entriesToSave.length === 0) return;

    let updatedLore = [...lore];
    let addedTerritories: any[] = [];

    entriesToSave.forEach(entry => {
      const id = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      const loreEntry: LoreEntry = {
        id,
        category: entry.category,
        title: entry.title || 'Unbenannt',
        description: entry.description || '',
        isUnlocked: true,
        secretsStage1: entry.secretsStage1 || '',
        secretsStage2: entry.secretsStage2 || '',
        secretsStage3: entry.secretsStage3 || '',
        details: entry.details || {}
      };

      updatedLore.push(loreEntry);

      if (entry.category === 'Orte') {
        const coords = entry.details?.coordinates || { x: 50, y: 50 };
        const newTerritory = {
          id: `territory-${id}`,
          name: entry.title || 'Unbenannt',
          type: entry.details?.type || 'stadt',
          description: entry.description || '',
          parentId: entry.details?.parentPlaceId || null,
          x: coords.x !== undefined ? Number(coords.x) : 50,
          y: coords.y !== undefined ? Number(coords.y) : 50,
          population: entry.details?.population || '',
          ruler: entry.details?.ruler || '',
          climate: entry.details?.climate || '',
          culture: entry.details?.culture || '',
          terrain: entry.details?.terrainTile || '',
          faction: entry.details?.faction || '',
          isUnlocked: true
        };
        addedTerritories.push(newTerritory);
      }
    });

    onUpdateLore(updatedLore);

    if (addedTerritories.length > 0 && onUpdateWorld) {
      onUpdateWorld({
        ...world,
        territories: [...(world?.territories || []), ...addedTerritories]
      });
    }

    setOmniSuccessMessage(`Erfolgreich ${entriesToSave.length} Einträge in Codex und Weltkarte gespeichert.`);
    setProposedEntries([]);
    setSelectedProposedIds(new Set());
  };

  const applyPreset = (presetName: 'onepiece' | 'middleearth' | 'westeros') => {
    if (presetName === 'onepiece') {
      const updatedWorld = {
        ...world,
        title: "One Piece",
        description: "Die große Ära der Piraten! Die Grand Line ist das gefährlichste Meer, umgeben von zwei Calm Belts und geschnitten von der gigantischen Red Line.",
        era: "Das große Piratenzeitalter",
        worldStructure: {
          worldName: "One Piece Welt",
          type: "Fantasy / Abenteuer",
          shape: "Archipel (Inselwelt)",
          continentsCount: 1,
          seasCount: 5,
          islandsCount: 100
        },
        terrains: [
          { type: 'Gebirge', name: 'Reverse Mountain', description: 'Der Eingang zur Grand Line auf dem Schnittpunkt mit der Red Line.', x: 50, y: 50 },
          { type: 'See', name: 'East Blue', description: 'Ein friedliches Meer im Nordosten.', x: 80, y: 25 },
          { type: 'See', name: 'West Blue', description: 'Das Meer im Südwesten.', x: 20, y: 75 },
          { type: 'See', name: 'North Blue', description: 'Das Meer im Nordwesten.', x: 20, y: 25 },
          { type: 'See', name: 'South Blue', description: 'Das Meer im Südosten.', x: 80, y: 75 },
          { type: 'See', name: 'Calm Belt Nord', description: 'Streifen ohne Wind voll von Seekönigen.', x: 45, y: 35 },
          { type: 'See', name: 'Calm Belt Süd', description: 'Streifen ohne Wind voll von Seekönigen.', x: 55, y: 65 }
        ],
        connections: [
          { fromPlace: 'Reverse Mountain', toPlace: 'Water 7', type: 'schiff', duration: '5 Tage' },
          { fromPlace: 'Water 7', toPlace: 'Wano Kuni', type: 'schiff', duration: '8 Tage' },
          { fromPlace: 'Wano Kuni', toPlace: 'Egghead', type: 'schiff', duration: '4 Tage' }
        ]
      };
      if (onUpdateWorld) onUpdateWorld(updatedWorld);

      const onepieceRegions: LoreEntry[] = [
        {
          id: `op-reg-1`,
          category: 'Orte',
          title: 'Reverse Mountain',
          description: 'Der gewaltige Berg, an dem Strömungen aus allen vier Blues aufeinandertreffen.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Insel', biome: 'Felsig', climate: 'Stürmisch', coordinates: { x: 50, y: 50 } }
        },
        {
          id: `op-reg-2`,
          category: 'Orte',
          title: 'Water 7',
          description: 'Die Stadt des Wassers, berühmt für ihre Schiffsbauer.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Metropole', biome: 'Wasserstadt', climate: 'Gemäßigt', coordinates: { x: 65, y: 45 } }
        },
        {
          id: `op-reg-3`,
          category: 'Orte',
          title: 'Wano Kuni',
          description: 'Das abgeschlossene Land der Samurai.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Königreich', biome: 'Kirschblüten, Berge', climate: 'Vier Jahreszeiten', coordinates: { x: 35, y: 55 } }
        },
        {
          id: `op-reg-4`,
          category: 'Orte',
          title: 'Egghead',
          description: 'Die Insel der Zukunft von Dr. Vegapunk.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Forschungsstation', biome: 'Futuristisch', climate: 'Künstlich reguliert', coordinates: { x: 75, y: 60 } }
        }
      ];

      const filtered = lore.filter(l => !(l.category === 'Orte' && l.details?.mapLevel === 'macro'));
      onUpdateLore([...filtered, ...onepieceRegions]);
    } else if (presetName === 'middleearth') {
      const updatedWorld = {
        ...world,
        title: "Mittelerde",
        description: "Eine uralte Fantasy-Welt voller Gefahren, Elben, Zwerge und dem drohenden Schatten Mordors im Osten.",
        era: "Drittes Zeitalter",
        worldStructure: {
          worldName: "Mittelerde",
          type: "High-Fantasy",
          shape: "Sprawling Kontinent",
          continentsCount: 1,
          seasCount: 1,
          islandsCount: 5
        },
        terrains: [
          { type: 'Gebirge', name: 'Nebelgebirge', description: 'Gewaltige, schneebedeckte Gipfel, die Mittelerde teilen.', x: 50, y: 40 },
          { type: 'Wald', name: 'Düsterwald', description: 'Ein riesiger, unheimlicher Wald voller Spinnen und Elbenreiche.', x: 65, y: 35 },
          { type: 'Fluss', name: 'Anduin', description: 'Der große Strom, der sich durch ganz Mittelerde zieht.', x: 60, y: 50 },
          { type: 'Gebirge', name: 'Schicksalsberg', description: 'Der glühende Vulkan im Herzen Mordors.', x: 75, y: 75 }
        ],
        connections: [
          { fromPlace: 'Auenland', toPlace: 'Bruchtal', type: 'fuss', duration: '14 Tage' },
          { fromPlace: 'Bruchtal', toPlace: 'Gondor', type: 'fuss', duration: '10 Tage' },
          { fromPlace: 'Gondor', toPlace: 'Mordor', type: 'fuss', duration: '3 Tage' }
        ]
      };
      if (onUpdateWorld) onUpdateWorld(updatedWorld);

      const meRegions: LoreEntry[] = [
        {
          id: `me-reg-1`,
          category: 'Orte',
          title: 'Auenland',
          description: 'Die friedliche und grüne Heimat der Hobbits.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Siedlung', biome: 'Grasland', climate: 'Mild', coordinates: { x: 30, y: 30 } }
        },
        {
          id: `me-reg-2`,
          category: 'Orte',
          title: 'Bruchtal',
          description: 'Das letzte heimelige Haus östlich des Meeres, Zuflucht der Elben.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Zuflucht', biome: 'Tal, Wasserfälle', climate: 'Ewig feucht-mild', coordinates: { x: 45, y: 35 } }
        },
        {
          id: `me-reg-3`,
          category: 'Orte',
          title: 'Gondor',
          description: 'Das stolze Menschenkönigreich im Süden mit der Weißen Stadt Minas Tirith.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Königreich', biome: 'Hügel, Festung', climate: 'Warm-gemäßigt', coordinates: { x: 55, y: 65 } }
        },
        {
          id: `me-reg-4`,
          category: 'Orte',
          title: 'Mordor',
          description: 'Das aschebedeckte Land des Dunklen Herrschers Sauron.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Imperium', biome: 'Ödland, Vulkanisch', climate: 'Heiß, giftig', coordinates: { x: 75, y: 70 } }
        }
      ];
      const filtered = lore.filter(l => !(l.category === 'Orte' && l.details?.mapLevel === 'macro'));
      onUpdateLore([...filtered, ...meRegions]);
    } else if (presetName === 'westeros') {
      const updatedWorld = {
        ...world,
        title: "Westeros",
        description: "Eine düstere, von Intrigen und Kriegen zerrissene Welt der sieben Königslande, wo der Winter naht.",
        era: "Ära des Thronfolgekriegs",
        worldStructure: {
          worldName: "Westeros",
          type: "Low-Fantasy / Mittelalterlich",
          shape: "Schmale Halbinsel",
          continentsCount: 1,
          seasCount: 3,
          islandsCount: 12
        },
        terrains: [
          { type: 'Gebirge', name: 'Die Mauer', description: 'Ein riesiger Eiswall im eisigen Norden.', x: 50, y: 15 },
          { type: 'Wald', name: 'Der Wolfswald', description: 'Dichte, kalte Nadelwälder um Winterfell.', x: 45, y: 30 },
          { type: 'Fluss', name: 'Der Tridente', description: 'Der dreigeteilte, strategisch wichtige Fluss.', x: 48, y: 55 }
        ],
        connections: [
          { fromPlace: 'Winterfell', toPlace: 'Drachenstein', type: 'pferd', duration: '12 Tage' },
          { fromPlace: 'Drachenstein', toPlace: 'Königsmund', type: 'schiff', duration: '2 Tage' }
        ]
      };
      if (onUpdateWorld) onUpdateWorld(updatedWorld);

      const wtRegions: LoreEntry[] = [
        {
          id: `wt-reg-1`,
          category: 'Orte',
          title: 'Winterfell',
          description: 'Der uralte Sitz des Hauses Stark im kalten Norden.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Burg', biome: 'Tundra, Wald', climate: 'Kalt', coordinates: { x: 45, y: 32 } }
        },
        {
          id: `wt-reg-2`,
          category: 'Orte',
          title: 'Königsmund',
          description: 'Die Hauptstadt von Westeros mit dem Eisernen Thron.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Hauptstadt', biome: 'Küste', climate: 'Warm', coordinates: { x: 52, y: 68 } }
        },
        {
          id: `wt-reg-3`,
          category: 'Orte',
          title: 'Drachenstein',
          description: 'Die vulkanische Inselfestung am Eingang der Schwarzwasserbucht.',
          isUnlocked: true,
          details: { mapLevel: 'macro', type: 'Insel', biome: 'Vulkanisch', climate: 'Rauh, windig', coordinates: { x: 62, y: 62 } }
        }
      ];
      const filtered = lore.filter(l => !(l.category === 'Orte' && l.details?.mapLevel === 'macro'));
      onUpdateLore([...filtered, ...wtRegions]);
    }
  };

  const handleGenerateAiWorld = async () => {
    if (!aiWorldDescription.trim()) return;
    setIsGeneratingAiWorld(true);
    try {
      const res = await GeminiService.generateWorldMapAndRulesFromSixCreationRules(
        world?.title || 'Eldoria',
        aiWorldDescription,
        [],
        isNsfw
      );
      
      if (res) {
        const updatedWorld = {
          ...world,
          worldStructure: {
            worldName: res.worldStructure?.worldName || world?.title || 'Eldoria',
            type: res.worldStructure?.type || '',
            shape: res.worldStructure?.shape || 'Kontinent',
            continentsCount: res.worldStructure?.continentsCount || 0,
            seasCount: res.worldStructure?.seasCount || 0,
            islandsCount: res.worldStructure?.islandsCount || 0
          },
          relationships: res.relationships || [],
          terrains: res.terrains || [],
          connections: res.connections || []
        };
        
        if (onUpdateWorld) onUpdateWorld(updatedWorld);

        const filteredLore = lore.filter(l => !(l.category === 'Orte' && l.details?.mapLevel === 'macro'));
        const newRegions: LoreEntry[] = (res.regions || []).map((reg: any, index: number) => ({
          id: `macro-region-${Date.now()}-${index}`,
          category: 'Orte',
          title: reg.title,
          description: reg.description || '',
          isUnlocked: true,
          details: {
            mapLevel: 'macro',
            type: reg.type || 'Region',
            biome: reg.biome || '',
            climate: reg.climate || '',
            coordinates: { x: reg.x || 50, y: reg.y || 50 }
          }
        }));

        onUpdateLore([...filteredLore, ...newRegions]);
        setAiWorldDescription('');
        setOrteSubTab('map');
      }
    } catch (err: any) {
      console.error("AI World Generation error", err);
      alert("Fehler bei der KI-Weltschöpfung: " + err.message);
    } finally {
      setIsGeneratingAiWorld(false);
    }
  };

  const handleUpdateKnowledge = (actorId: string, targetTitle: string, text: string) => {
    let actorEntry = lore.find(l => l.id === actorId);
    
    if (!actorEntry && actorId === '__player_knowledge__') {
      actorEntry = {
        id: '__player_knowledge__',
        category: 'Charaktere',
        title: playerName || 'Spieler',
        description: 'Geteiltes Wissen des Spielers',
        isUnlocked: true,
        details: {
          knowledgeMap: {}
        },
        knowledge: ''
      };
    }
    
    if (!actorEntry) return;
    
    const updatedDetails = { ...(actorEntry.details || {}) };
    const updatedKnowledgeMap = { ...(updatedDetails.knowledgeMap || {}) };
    
    if (text.trim() === '') {
      delete updatedKnowledgeMap[targetTitle];
    } else {
      updatedKnowledgeMap[targetTitle] = text;
    }
    
    updatedDetails.knowledgeMap = updatedKnowledgeMap;
    
    const lines = Object.entries(updatedKnowledgeMap)
      .filter(([_, t]) => (t as string).trim().length > 0)
      .map(([name, t]) => `- Über ${name}: ${(t as string).trim()}`);
    const knowledgeStr = lines.length > 0 ? lines.join('\n') : '';
    
    const updatedEntry = {
      ...actorEntry,
      details: updatedDetails,
      knowledge: knowledgeStr
    };
    
    let updatedLore: LoreEntry[];
    if (lore.some(l => l.id === actorId)) {
      updatedLore = lore.map(l => l.id === actorId ? updatedEntry : l);
    } else {
      updatedLore = [...lore, updatedEntry];
    }
    
    onUpdateLore(updatedLore);
  };

  const handleEdit = (entry: LoreEntry) => {
    setIsEditing(entry.id);
    setActiveCategory(entry.category);

    let preparedEntry = { ...entry };
    if (entry.category === 'Fraktionen' && entry.title?.trim()) {
      const fTitle = entry.title.trim().toLowerCase();
      const existingMembers: FactionMember[] = entry.details?.members ? [...entry.details.members] : [];

      const matchingCodexChars = lore.filter(item => {
        if (item.category !== 'Charaktere' && item.category !== 'Gegner') return false;
        const d = item.details || {};
        const f1 = d.faction || '';
        const f2 = d.appearance?.faction || '';
        const f3 = d.organization || '';
        const f4 = d.guild || '';
        const f5 = (item as any).faction || '';
        const combined = `${f1}, ${f2}, ${f3}, ${f4}, ${f5}`.toLowerCase();
        if (!combined.trim()) return false;
        const parts = combined.split(',').map(p => p.trim()).filter(Boolean);
        return parts.some(p => p === fTitle || (fTitle.length > 2 && (p.includes(fTitle) || fTitle.includes(p))));
      });

      let hasAdded = false;
      matchingCodexChars.forEach(char => {
        const isPresent = existingMembers.some(
          m => (m.characterId && m.characterId === char.id) || (m.name && m.name.trim().toLowerCase() === char.title.trim().toLowerCase())
        );
        if (!isPresent) {
          const charRole = char.details?.role || char.details?.appearance?.role || char.details?.job || 'Mitglied';
          existingMembers.push({
            id: `fm-${char.id}`,
            name: char.title,
            characterId: char.id,
            job: charRole,
            tasks: char.details?.notes || char.details?.background || 'Automatisch übernommen aus Codex',
            joinedDate: 'Aus Codex',
            status: 'Aktiv'
          });
          hasAdded = true;
        }
      });

      if (hasAdded || !entry.details?.members) {
        preparedEntry = {
          ...preparedEntry,
          details: {
            ...(preparedEntry.details || {}),
            members: existingMembers
          }
        };
      }
    }

    setEditForm(preparedEntry);
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentCategory = editForm.category || activeCategory;

  const handleGenerateImage = async () => {
    if (!editForm.title) return;
    setIsGeneratingImg(true);
    try {
      let prompt = `Erstelle ein cineastisches Bild für den Codexeintrag "${editForm.title}" in der Welt "${worldTitle}".\n\n`;
      
      if (currentCategory === 'Charaktere' || currentCategory === 'Gegner') {
        prompt += `Es handelt sich um einen Charakter. Das Bild ist ein Portrait.
        - Geschlecht: ${editForm.details?.gender || 'Unbekannt'}
        - Rasse: ${editForm.details?.race || 'Unbekannt'}
        - Rassemerkmale: ${editForm.details?.raceFeatures || 'keine'}
        - Alter: ${editForm.details?.age || 'Unbekannt'}
        - Statur: ${editForm.details?.build || 'Unbekannt'}
        - Haare: ${editForm.details?.hairColor || 'Unbekannt'}
        - Augenfarbe: ${editForm.details?.eyeColor || 'Unbekannt'}
        - Kleidung/Rolle: ${editForm.details?.outfit || editForm.details?.role || 'Unbekannt'}
        - Gesinnung/Ziel: ${editForm.details?.goal || 'Neutral'}
        Realistischer, detaillierter Fantasy- oder Sci-Fi-Stil, je nach Welt. Fokus auf das Gesicht. Keine Schrift.`;
      } else if (currentCategory === 'Gegenstände') {
        prompt += `Es handelt sich um einen Gegenstand: ${editForm.details?.itemType || 'Unbekannt'}. Seltenheit: ${editForm.details?.rarity || 'Unbekannt'}.
        Beschreibung: ${editForm.description}.
        Das Bild zeigt den Gegenstand detailliert und von nahem, ohne Hintergrund oder auf einem sauberen Podest. Keine Schrift.`;
      } else if (currentCategory === 'Orte') {
        prompt += `Es handelt sich um einen Ort: ${editForm.details?.type || ''}. Klima: ${editForm.details?.climate || ''}.
        Beschreibung: ${editForm.description}. Landschaftsbild. Keine Schrift.`;
      } else {
        prompt += `Beschreibung: ${editForm.description}. Keine Schrift.`;
      }

      const imageUrl = await GeminiService.generateImage(prompt, isNsfw);
      if (imageUrl) {
        setEditForm(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (e) {
      console.error(e);
      alert("Fehler bei der Bildgenerierung");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleGenerateNPCExpression = async (exprKey: string) => {
    if (!editForm.title) return;
    setGeneratingExpression(exprKey);
    try {
      const artStyle = "Hochwertige digitale Illustration, Fantasy Konzeptkunst, detailliert";
      
      let emotionDesc = "neutraler Gesichtsausdruck";
      if (exprKey === 'happy') emotionDesc = "glücklich lächelnd, fröhlich";
      if (exprKey === 'sad') emotionDesc = "trauriger Gesichtsausdruck";
      if (exprKey === 'angry') emotionDesc = "wütender Gesichtsausdruck, entschlossen";
      if (exprKey === 'surprised') emotionDesc = "überraschter Gesichtsausdruck, erstaunt";
      if (exprKey === 'blushing') emotionDesc = "leicht errötetes Gesicht, verlegen blickend";

      const prompt = `Portrait-Nahaufnahme für den Charakter "${editForm.title}" in der Welt "${worldTitle}" mit folgendem Ausdruck: ${emotionDesc}.\n` +
        `- Geschlecht: ${editForm.details?.gender || 'Unbekannt'}\n` +
        `- Rasse: ${editForm.details?.race || 'Unbekannt'}\n` +
        `- Rassemerkmale: ${editForm.details?.raceFeatures || 'keine'}\n` +
        `- Alter: ${editForm.details?.age || 'Unbekannt'}\n` +
        `- Statur: ${editForm.details?.build || 'Unbekannt'}\n` +
        `- Haare: ${editForm.details?.hairColor || 'Unbekannt'}\n` +
        `- Augenfarbe: ${editForm.details?.eyeColor || 'Unbekannt'}\n` +
        `- Kleidung/Rolle: ${editForm.details?.outfit || editForm.details?.role || 'Unbekannt'}\n` +
        `${artStyle}. Fokus auf das Gesicht und die Mimik. Keine Schrift im Bild.`;

      const imageUrl = await GeminiService.generateImage(prompt, isNsfw);
      if (imageUrl) {
        setEditForm(prev => {
          const prevExprs = prev.expressions || prev.details?.expressions || {};
          const expressions = {
            ...prevExprs,
            [exprKey]: imageUrl
          };
          const updated = {
            ...prev,
            expressions,
            details: {
              ...(prev.details || {}),
              expressions
            }
          };
          if (exprKey === 'neutral') {
            updated.image = imageUrl;
          }
          return updated;
        });
      }
    } catch (e) {
      console.error(e);
      alert("Fehler bei der Generierung des Gesichtsausdrucks");
    } finally {
      setGeneratingExpression(null);
    }
  };

  const handleUploadNPCExpression = async (exprKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (rawBase64) {
        try {
          const compressed = await GeminiService.compressImageBase64(rawBase64, 256, 0.7);
          setEditForm(prev => {
            const prevExprs = prev.expressions || prev.details?.expressions || {};
            const expressions = {
              ...prevExprs,
              [exprKey]: compressed
            };
            const updated = {
              ...prev,
              expressions,
              details: {
                ...(prev.details || {}),
                expressions
              }
            };
            if (exprKey === 'neutral') {
              updated.image = compressed;
            }
            return updated;
          });
        } catch (err) {
          console.error(err);
          alert("Fehler beim Verarbeiten des hochgeladenen Bildes.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const getItemFaction = (item: LoreEntry): string => {
    const f = item.details?.faction || (item as any).faction || '';
    return typeof f === 'string' ? f.trim() : '';
  };

  const availableFactions = useMemo(() => {
    const set = new Set<string>();
    lore.filter(l => l.category === 'Fraktionen').forEach(f => {
      if (f.title) set.add(f.title.trim());
    });
    lore.forEach(l => {
      const f = getItemFaction(l);
      if (f) {
        f.split(',').forEach(part => {
          const trimmed = part.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [lore]);

  const filteredLore = useMemo(() => {
    return lore
      .filter(l => l.category === activeCategory || (activeCategory === 'Story & Quests' && (l.category as string) === 'Events'))
      .filter(l => {
        if ((activeCategory === 'Charaktere' || activeCategory === 'Gegner') && playerName && l.title?.trim().toLowerCase() === playerName.trim().toLowerCase()) {
          return false;
        }
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const matchesSearch = l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term);
        if (matchesSearch) return true;
        if ((activeCategory === 'Story & Quests' || (activeCategory as string) === 'Events') && l.details?.eventSteps) {
          return l.details.eventSteps.some((s: any) => 
            (s.title || '').toLowerCase().includes(term) || 
            (s.description || '').toLowerCase().includes(term)
          );
        }
        return false;
      });
  }, [lore, activeCategory, playerName, searchTerm]);

  const groupedLore = useMemo(() => {
    const groups: { [faction: string]: LoreEntry[] } = {};
    filteredLore.forEach(item => {
      const rawFaction = getItemFaction(item);
      const f = rawFaction ? rawFaction : 'Ohne Fraktion';
      if (!groups[f]) groups[f] = [];
      groups[f].push(item);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    });

    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Ohne Fraktion') return 1;
      if (b === 'Ohne Fraktion') return -1;
      return a.localeCompare(b);
    });
  }, [filteredLore]);

  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  const assignedCodexCharacters = useMemo(() => {
    if ((currentCategory as string) !== 'Fraktionen' || !editForm.title?.trim()) return [];
    const factionTitle = editForm.title.trim().toLowerCase();
    
    return lore.filter(item => {
      if (item.category !== 'Charaktere' && item.category !== 'Gegner') return false;
      const d = item.details || {};
      const f1 = d.faction || '';
      const f2 = d.appearance?.faction || '';
      const f3 = d.organization || '';
      const f4 = d.guild || '';
      const f5 = d.workplace || '';
      const f6 = d.group || '';
      const f7 = (item as any).faction || '';
      const combined = `${f1}, ${f2}, ${f3}, ${f4}, ${f5}, ${f6}, ${f7}`.toLowerCase();
      
      if (!combined.trim()) return false;
      const parts = combined.split(',').map(p => p.trim()).filter(Boolean);
      return parts.some(p => p === factionTitle || (factionTitle.length > 2 && (p.includes(factionTitle) || factionTitle.includes(p))));
    });
  }, [lore, currentCategory, editForm.title]);

  const effectivePlayerName = useMemo(() => {
    return (playerName?.trim() || player?.name?.trim() || world?.player?.name?.trim() || 'Spieler').trim();
  }, [playerName, player?.name, world?.player?.name]);

  const effectivePlayerRole = useMemo(() => {
    return (playerRole?.trim() || player?.role?.trim() || player?.details?.role?.trim() || world?.player?.role?.trim() || 'Hauptcharakter').trim();
  }, [playerRole, player?.role, player?.details?.role, world?.player?.role]);

  const isUserInThisFaction = useMemo(() => {
    if ((currentCategory as string) !== 'Fraktionen' || !editForm.title?.trim()) return false;
    const currentFactionTitle = editForm.title.trim().toLowerCase();

    // Check direct player faction prop or player object
    const candidateFactions: string[] = [
      playerFaction || '',
      player?.appearance?.faction || '',
      player?.faction || '',
      player?.details?.faction || '',
      world?.player?.appearance?.faction || '',
      world?.player?.faction || '',
      world?.userFaction || '',
      world?.playerFaction || ''
    ].filter(Boolean);

    for (const f of candidateFactions) {
      const parts = f.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
      if (parts.some(p => p === currentFactionTitle || (currentFactionTitle.length > 2 && (p.includes(currentFactionTitle) || currentFactionTitle.includes(p))))) {
        return true;
      }
    }

    const pNameLower = effectivePlayerName.toLowerCase();
    
    // Check if player is present in lore characters
    const playerChar = lore.find(l => 
      (l.category === 'Charaktere' || l.category === 'Gegner') && 
      l.title?.trim().toLowerCase() === pNameLower
    );
    if (playerChar) {
      const d = playerChar.details || {};
      const fCombined = `${d.faction || ''}, ${d.appearance?.faction || ''}, ${d.organization || ''}, ${d.guild || ''}, ${d.workplace || ''}`.toLowerCase();
      if (fCombined.includes(currentFactionTitle) || currentFactionTitle.includes(fCombined)) return true;
    }

    if (assignedCodexCharacters.some(c => c.title?.trim().toLowerCase() === pNameLower)) {
      return true;
    }

    const members: FactionMember[] = editForm.details?.members || [];
    if (members.some(m => (m.characterId === '__player__' || (m.name && m.name.trim().toLowerCase() === pNameLower)))) {
      return true;
    }

    return false;
  }, [currentCategory, editForm.title, editForm.details?.members, lore, effectivePlayerName, playerFaction, player, world, assignedCodexCharacters]);

  // Unified member list: explicit members + auto-detected codex characters
  const effectiveMembers = useMemo(() => {
    if ((currentCategory as string) !== 'Fraktionen') return [];
    const explicitMembers: FactionMember[] = editForm.details?.members || [];
    
    const list: (FactionMember & { isAutoDetected?: boolean; codexEntry?: LoreEntry })[] = explicitMembers.map(m => {
      const match = lore.find(l => 
        (m.characterId && l.id === m.characterId) || 
        (m.name && l.title?.trim().toLowerCase() === m.name.trim().toLowerCase())
      );
      return {
        ...m,
        isAutoDetected: false,
        codexEntry: match
      };
    });

    assignedCodexCharacters.forEach(char => {
      const isAlreadyAdded = list.some(
        m => (m.characterId && m.characterId === char.id) || 
             (m.name && m.name.trim().toLowerCase() === char.title.trim().toLowerCase())
      );
      if (!isAlreadyAdded) {
        const charRole = char.details?.role || char.details?.appearance?.role || char.details?.job || 'Mitglied';
        list.push({
          id: `fm-codex-${char.id}`,
          name: char.title,
          characterId: char.id,
          job: charRole,
          tasks: char.details?.notes || char.details?.background || 'Automatisch übernommen aus Codex',
          joinedDate: 'Aus Codex',
          status: 'Aktiv',
          isAutoDetected: true,
          codexEntry: char
        });
      }
    });

    if (isUserInThisFaction) {
      const pNameLower = effectivePlayerName.toLowerCase();
      const isPlayerAdded = list.some(m => m.characterId === '__player__' || (m.name && m.name.trim().toLowerCase() === pNameLower));
      if (!isPlayerAdded) {
        list.unshift({
          id: `fm-player-auto`,
          name: effectivePlayerName,
          characterId: '__player__',
          job: effectivePlayerRole,
          tasks: 'Automatisch übernommen aus Codex',
          joinedDate: 'Aus Codex',
          status: 'Aktiv',
          isAutoDetected: true
        });
      }
    }

    return list;
  }, [currentCategory, editForm.details?.members, assignedCodexCharacters, isUserInThisFaction, effectivePlayerName, effectivePlayerRole, lore]);

  const handleUpdateMember = (index: number, updatedField: Partial<FactionMember>) => {
    const nextMembers: FactionMember[] = effectiveMembers.map((m, i) => {
      const { isAutoDetected, codexEntry, ...cleanMember } = m;
      if (i === index) {
        return { ...cleanMember, ...updatedField };
      }
      return cleanMember;
    });
    updateDetail('members', nextMembers);
  };

  const handleRemoveMember = (index: number) => {
    const nextMembers: FactionMember[] = effectiveMembers
      .filter((_, i) => i !== index)
      .map(m => {
        const { isAutoDetected, codexEntry, ...cleanMember } = m;
        return cleanMember;
      });
    updateDetail('members', nextMembers);
  };

  const handleAddMember = () => {
    const currentClean: FactionMember[] = effectiveMembers.map(m => {
      const { isAutoDetected, codexEntry, ...cleanMember } = m;
      return cleanMember;
    });
    const newMember: FactionMember = {
      id: `fm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      job: '',
      tasks: '',
      joinedDate: '',
      status: 'Aktiv'
    };
    updateDetail('members', [...currentClean, newMember]);
  };

  const factionHoldings = useMemo(() => {
    if ((currentCategory as string) !== 'Fraktionen' || !editForm.title?.trim()) return [];
    const fTitle = editForm.title.trim().toLowerCase();
    const fId = editForm.id;
    const holdings = world?.economyConfig?.holdings || world?.economy?.holdings || [];
    const members = editForm.details?.members || [];
    const leaderName = (editForm.details?.leader || '').trim().toLowerCase();

    return holdings.filter((h: any) => {
      // 1. Direct ID match
      if (h.ownerFactionId && h.ownerFactionId === fId) return true;
      if (h.controlledByFactionId && h.controlledByFactionId === fId) return true;
      if (h.loreEntryId && h.loreEntryId === fId) return true;

      // 2. Direct Name / Title match (exact or substring)
      if (fTitle) {
        const ownerFName = (h.ownerFactionName || '').trim().toLowerCase();
        const ctrlFName = (h.controlledByFactionName || '').trim().toLowerCase();
        const ownerF = (h.ownerFaction || '').trim().toLowerCase();
        const hName = (h.name || '').trim().toLowerCase();

        if (ownerFName && ownerFName === fTitle) return true;
        if (ctrlFName && ctrlFName === fTitle) return true;
        if (ownerF && ownerF === fTitle) return true;

        if (hName && (hName === fTitle || hName.includes(fTitle) || fTitle.includes(hName))) return true;
      }

      // 3. Leader or Member assignment match
      const assignedCharName = (h.assignedCharacterName || h.assignedManagerName || '').trim().toLowerCase();
      const assignedCharId = h.assignedCharacterId || h.ownerCharacterId || h.assignedManagerId;

      if (assignedCharId && (assignedCharId === fId || members.some((m: any) => m.characterId === assignedCharId || m.id === assignedCharId))) return true;
      if (assignedCharName && (
        (leaderName && assignedCharName === leaderName) ||
        members.some((m: any) => m.name && m.name.trim().toLowerCase() === assignedCharName)
      )) return true;

      return false;
    });
  }, [currentCategory, editForm.title, editForm.id, editForm.details?.members, editForm.details?.leader, world?.economyConfig?.holdings, world?.economy?.holdings]);

  const handleAssignHoldingToFaction = (holdingId: string) => {
    if (!world || !onUpdateWorld || !editForm.title?.trim() || !holdingId) return;
    const allHoldings = world?.economyConfig?.holdings || world?.economy?.holdings || [];
    const updated = allHoldings.map((h: any) => {
      if (h.id === holdingId) {
        return {
          ...h,
          ownerType: 'faction',
          ownerFactionId: editForm.id,
          ownerFactionName: editForm.title,
          loreEntryId: editForm.id
        };
      }
      return h;
    });
    const updatedEconomyConfig = {
      ...(world.economyConfig || {}),
      holdings: updated
    };
    onUpdateWorld({
      ...world,
      economyConfig: updatedEconomyConfig
    });
    setSelectedHoldingToAssign('');
  };

  const handleUnassignHoldingFromFaction = (holdingId: string) => {
    if (!world || !onUpdateWorld) return;
    const allHoldings = world?.economyConfig?.holdings || world?.economy?.holdings || [];
    const updated = allHoldings.map((h: any) => {
      if (h.id === holdingId) {
        return {
          ...h,
          ownerFactionId: undefined,
          ownerFactionName: undefined,
          controlledByFactionId: undefined,
          controlledByFactionName: undefined,
          ownerType: 'user'
        };
      }
      return h;
    });
    const updatedEconomyConfig = {
      ...(world.economyConfig || {}),
      holdings: updated
    };
    onUpdateWorld({
      ...world,
      economyConfig: updatedEconomyConfig
    });
  };

  const handleCreateHoldingForFaction = () => {
    if (!world || !onUpdateWorld || !editForm.title?.trim()) return;
    const allHoldings = world?.economyConfig?.holdings || world?.economy?.holdings || [];
    const newHolding: any = {
      id: `holding-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${editForm.title} - Betrieb`,
      type: 'taverne',
      icon: 'Building2',
      description: `Betrieb / Niederlassung der Fraktion ${editForm.title}`,
      level: 1,
      ownerType: 'faction',
      ownerFactionId: editForm.id,
      ownerFactionName: editForm.title,
      loreEntryId: editForm.id,
      incomePerInterval: 60,
      upkeepPerInterval: 25,
      staffCount: 4,
      status: 'active',
      roles: [
        {
          id: `role-${Date.now()}-1`,
          name: 'Verwalter / Betriebsleiter',
          assignedToName: editForm.details?.leader || 'Betriebsleiter',
          authorities: ['Tagesgeschäft leiten', 'Preise festlegen'],
          responsibilities: ['Betriebsführung'],
          salary: 15,
          workplaceArea: 'Hauptbereich'
        }
      ]
    };

    const updatedEconomyConfig = {
      ...(world.economyConfig || {}),
      holdings: [...allHoldings, newHolding]
    };
    onUpdateWorld({
      ...world,
      economyConfig: updatedEconomyConfig
    });
  };

  const handleImportAssignedCharactersToMembers = (charsToImport?: LoreEntry[]) => {
    const targets = charsToImport || assignedCodexCharacters;
    const currentMembers: FactionMember[] = editForm.details?.members || [];
    
    const newMembers: FactionMember[] = [...currentMembers];
    let addedCount = 0;

    // Auto-add assigned characters from codex
    targets.forEach(char => {
      const isAlreadyAdded = newMembers.some(
        m => (m.characterId && m.characterId === char.id) || (m.name && m.name.trim().toLowerCase() === char.title.trim().toLowerCase())
      );

      if (!isAlreadyAdded) {
        const charRole = char.details?.role || char.details?.appearance?.role || char.details?.job || 'Mitglied';
        newMembers.push({
          id: `fm-${char.id}`,
          name: char.title,
          characterId: char.id,
          job: charRole,
          tasks: char.details?.notes || char.details?.background || 'Automatisch übernommen aus Codex',
          joinedDate: 'Aus Codex',
          status: 'Aktiv'
        });
        addedCount++;
      }
    });

    // Auto-add player if member of this faction
    if (isUserInThisFaction) {
      const pNameLower = effectivePlayerName.toLowerCase();
      const isPlayerAdded = newMembers.some(m => m.characterId === '__player__' || (m.name && m.name.trim().toLowerCase() === pNameLower));
      if (!isPlayerAdded) {
        newMembers.unshift({
          id: `fm-player-${Date.now()}`,
          name: effectivePlayerName,
          characterId: '__player__',
          job: effectivePlayerRole,
          tasks: 'Automatisch übernommen aus Codex',
          joinedDate: 'Aus Codex',
          status: 'Aktiv'
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      updateDetail('members', newMembers);
    }
  };

  const handleHarmonizeFaction = async () => {
    if (!editForm.title?.trim()) {
      alert('Bitte gib zuerst einen Namen für die Fraktion ein.');
      return;
    }
    setIsHarmonizingFaction(true);
    setHarmonizeSuccessMessage(null);
    try {
      const leaderName = editForm.details?.leader?.trim() || '';
      
      // Determine Leader Profile
      let leaderProfile: any = null;
      if (leaderName) {
        const isPlayerLeader = leaderName.toLowerCase() === effectivePlayerName.toLowerCase();
        if (isPlayerLeader) {
          leaderProfile = {
            name: effectivePlayerName,
            role: effectivePlayerRole || 'Anführer / Hauptcharakter',
            personality: player?.personality || player?.details?.personality || '',
            goal: player?.goal || player?.details?.goal || '',
            bio: player?.bio || player?.details?.bio || player?.background || '',
            isPlayer: true
          };
        } else {
          const leaderCodex = lore.find(l => 
            (l.category === 'Charaktere' || l.category === 'Gegner') && 
            (l.title?.trim().toLowerCase() === leaderName.toLowerCase() || l.details?.rufName?.trim().toLowerCase() === leaderName.toLowerCase())
          );
          if (leaderCodex) {
            leaderProfile = {
              name: leaderCodex.title,
              role: leaderCodex.details?.role || leaderCodex.details?.job || 'Anführer',
              personality: leaderCodex.details?.personality || leaderCodex.details?.archetype || '',
              goal: leaderCodex.details?.goal || leaderCodex.details?.motivationCore?.superObjective || '',
              bio: leaderCodex.description || leaderCodex.details?.bio || '',
              isPlayer: false
            };
          } else {
            leaderProfile = {
              name: leaderName,
              role: 'Anführer',
              isPlayer: false
            };
          }
        }
      }

      // Determine Members
      const membersToHarmonize = effectiveMembers.map(m => {
        const isPlayer = m.characterId === '__player__' || (m.name && m.name.trim().toLowerCase() === effectivePlayerName.toLowerCase());
        const codex = lore.find(l => 
          (l.category === 'Charaktere' || l.category === 'Gegner') && 
          (l.id === m.characterId || l.title?.trim().toLowerCase() === m.name?.trim().toLowerCase())
        );
        return {
          id: m.id,
          name: m.name,
          role: m.job || codex?.details?.role || 'Mitglied',
          job: m.job || codex?.details?.role || 'Mitglied',
          characterId: m.characterId || codex?.id || '',
          bio: codex?.description || codex?.details?.bio || (isPlayer ? (player?.bio || '') : ''),
          personality: codex?.details?.personality || (isPlayer ? (player?.personality || '') : ''),
          tasks: m.tasks || '',
          joinedDate: m.joinedDate || '',
          status: m.status || 'Aktiv',
          isPlayer
        };
      });

      // Call Gemini Service
      const result = await GeminiService.harmonizeFactionAndMembers({
        factionData: {
          title: editForm.title,
          description: editForm.description,
          details: editForm.details
        },
        leaderProfile,
        members: membersToHarmonize,
        worldContext: {
          title: worldTitle,
          era: world?.era,
          tone: world?.tone,
          description: world?.description,
          rules: world
        },
        allLoreEntries: lore,
        userPrompt: factionHarmonizePrompt,
        keepExistingDetails: keepExistingLoreDetails
      });

      // 1. Update editForm with faction details
      setEditForm(prev => ({
        ...prev,
        details: {
          ...(prev.details || {}),
          ...result.factionDetails
        }
      }));

      // 2. Update characters in lore with reciprocal relationships and conduct
      let updatedLore = [...lore];
      let updatedCount = 0;

      for (const update of result.characterUpdates) {
        if (!update.characterName?.trim()) continue;
        const targetNameLower = update.characterName.trim().toLowerCase();

        // Check if matching codex character
        const charIdx = updatedLore.findIndex(l => 
          (l.category === 'Charaktere' || l.category === 'Gegner') && 
          (l.id === update.characterId || l.title?.trim().toLowerCase() === targetNameLower || l.details?.rufName?.trim().toLowerCase() === targetNameLower)
        );

        if (charIdx >= 0) {
          const currentChar = updatedLore[charIdx];
          const existingRels = currentChar.details?.relationships || [];
          
          // Merge relationships: replace matching targets, append new
          const mergedRels = [...existingRels];
          for (const newRel of update.relationships) {
            const relTargetLower = newRel.targetCharacter?.trim().toLowerCase();
            const existingRelIdx = mergedRels.findIndex(r => r.targetCharacter?.trim().toLowerCase() === relTargetLower);
            if (existingRelIdx >= 0) {
              mergedRels[existingRelIdx] = {
                ...mergedRels[existingRelIdx],
                ...newRel,
                id: mergedRels[existingRelIdx].id || newRel.id
              };
            } else {
              mergedRels.push(newRel);
            }
          }

          updatedLore[charIdx] = {
            ...currentChar,
            details: {
              ...(currentChar.details || {}),
              relationship: update.relationshipSummary || currentChar.details?.relationship || '',
              conduct: update.conductSummary || currentChar.details?.conduct || '',
              relationships: mergedRels
            }
          };
          updatedCount++;
        }

        // Check if player
        if (targetNameLower === effectivePlayerName.toLowerCase() && onUpdateWorld && world) {
          const existingPlayerRels = world.player?.relationships || player?.relationships || [];
          const mergedPlayerRels = [...existingPlayerRels];
          for (const newRel of update.relationships) {
            const relTargetLower = newRel.targetCharacter?.trim().toLowerCase();
            const existingRelIdx = mergedPlayerRels.findIndex(r => r.targetCharacter?.trim().toLowerCase() === relTargetLower);
            if (existingRelIdx >= 0) {
              mergedPlayerRels[existingRelIdx] = {
                ...mergedPlayerRels[existingRelIdx],
                ...newRel,
                id: mergedPlayerRels[existingRelIdx].id || newRel.id
              };
            } else {
              mergedPlayerRels.push(newRel);
            }
          }

          const updatedWorld = {
            ...world,
            player: {
              ...(world.player || player || {}),
              relationships: mergedPlayerRels,
              relationship: update.relationshipSummary || (world.player?.relationship || ''),
              conduct: update.conductSummary || (world.player?.conduct || '')
            }
          };
          onUpdateWorld(updatedWorld);
        }
      }

      onUpdateLore(updatedLore);

      // Synchronize associated holdings & economy system
      if (world && onUpdateWorld) {
        const allHoldings = world?.economyConfig?.holdings || world?.economy?.holdings || [];
        let holdingsChanged = false;

        const updatedHoldings = allHoldings.map((h: any) => {
          const isLinked = factionHoldings.some((fh: any) => fh.id === h.id);
          if (isLinked) {
            holdingsChanged = true;
            return {
              ...h,
              ownerType: 'faction',
              ownerFactionId: editForm.id,
              ownerFactionName: editForm.title,
              loreEntryId: editForm.id
            };
          }
          return h;
        });

        // Import holding staff/managers into faction members if missing
        const currentMembers: FactionMember[] = editForm.details?.members || [];
        const newMembers: FactionMember[] = [...currentMembers];
        let membersAddedFromHoldings = 0;

        factionHoldings.forEach((h: any) => {
          const roles = h.roles || [];
          roles.forEach((r: any) => {
            if (r.assignedToName?.trim()) {
              const nameTrim = r.assignedToName.trim();
              const nameLower = nameTrim.toLowerCase();
              if (nameLower !== 'spieler' && !newMembers.some(m => m.name?.trim().toLowerCase() === nameLower)) {
                newMembers.push({
                  id: `fm-hrole-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  name: nameTrim,
                  job: r.name || 'Führungskraft (Betrieb)',
                  tasks: `Zuständig für ${h.name} (${r.workplaceArea || 'Betrieb'})`,
                  joinedDate: 'Aus Wirtschaftssystem',
                  status: 'Aktiv'
                });
                membersAddedFromHoldings++;
              }
            }
          });
        });

        if (membersAddedFromHoldings > 0) {
          updateDetail('members', newMembers);
        }

        // Calculate economy totals for summary
        const totalInc = factionHoldings.reduce((sum: number, h: any) => sum + (h.incomePerInterval || 0), 0);
        const totalUp = factionHoldings.reduce((sum: number, h: any) => sum + (h.upkeepPerInterval || 0), 0);
        const netCash = totalInc - totalUp;
        const totalStaff = factionHoldings.reduce((sum: number, h: any) => sum + (h.staffCount || 0), 0);

        if (factionHoldings.length > 0) {
          const econSummary = `Betriebe: ${factionHoldings.length} aktive Gewerbe (${totalStaff} Beschäftigte). Passives Einkommen: +${totalInc} Gold/Monat (Unterhalt: -${totalUp} Gold, Netto: ${netCash >= 0 ? '+' : ''}${netCash} Gold/Monat).`;
          updateDetail('resourceEconomy', econSummary);
        }

        if (holdingsChanged) {
          const updatedEconomyConfig = {
            ...(world.economyConfig || {}),
            holdings: updatedHoldings
          };
          onUpdateWorld({
            ...world,
            economyConfig: updatedEconomyConfig
          });
        }
      }

      setHarmonizeSuccessMessage(`Fraktion "${editForm.title}", ${updatedCount} zugehörige Charaktere und ${factionHoldings.length} Betriebe wurden erfolgreich synchronisiert.`);
      setTimeout(() => {
        setHarmonizeSuccessMessage(null);
      }, 6000);
    } catch (err) {
      console.error('Fehler bei der Fraktions-Synchronisation:', err);
      alert('Fehler bei der Synchronisation der Fraktion. Bitte versuche es erneut.');
    } finally {
      setIsHarmonizingFaction(false);
    }
  };

  const updateAppearanceDetail = (key: string, value: any) => {
    setEditForm(prev => {
      const currentDetails = prev.details || {};
      let updatedAppearance = { ...currentDetails, [key]: value };
      updatedAppearance = autoCalculateAppearance(updatedAppearance, key);
      return {
        ...prev,
        details: updatedAppearance
      };
    });
  };

  return (
    <div className="w-full flex gap-6 flex-col">
      <div ref={formTopRef} className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Codex (Lore &amp; Wissen)</h3>
          <p className="text-xs text-slate-400">Verwalte Charaktere, Fraktionen, Gegenstände und Regeln dieser Welt.</p>
        </div>
      </div>

      <div className="w-full flex gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
        {visibleCategories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`text-left px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap font-medium ${
              activeCategory === c 
              ? 'bg-amber-600 shadow-md shadow-amber-900/20 text-white'
              : c === 'Omni-Smart-Fill'
                ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {c === 'Omni-Smart-Fill' && <i className="fa-solid fa-wand-magic-sparkles mr-2 opacity-70 text-amber-400"></i>}
            {c === 'Charaktere' && <i className="fa-solid fa-users mr-2 opacity-70"></i>}
            {c === 'Verhüllung' && <i className="fa-solid fa-mask mr-2 opacity-70 text-sky-400"></i>}
            {c === 'Gegner' && <i className="fa-solid fa-skull mr-2 opacity-70"></i>}
            {c === 'Orte' && <i className="fa-solid fa-map mr-2 opacity-70"></i>}
            {c === 'Weltkarte' && <i className="fa-solid fa-earth-americas mr-2 opacity-70 text-sky-400"></i>}
            {c === 'Fraktionen' && <i className="fa-solid fa-flag mr-2 opacity-70"></i>}
            {c === 'Gegenstände' && <i className="fa-solid fa-khanda mr-2 opacity-70"></i>}
            {c === 'Verbotenes Wissen' && <i className="fa-solid fa-eye-slash mr-2 opacity-75 text-red-400"></i>}
            {(c === 'Story & Quests' || (c as string) === 'Events') && <i className="fa-solid fa-map-route mr-2 opacity-70 text-amber-500"></i>}
            {c === 'Weltregeln' && <i className="fa-solid fa-scale-balanced mr-2 opacity-70"></i>}
            {c === 'Zeitlinie' && <i className="fa-solid fa-timeline mr-2 opacity-70 text-rose-400"></i>}
            {c === 'Omni-Smart-Fill' ? 'Multi-Smart-Fill' : c === 'Orte' ? 'Orte' : c === 'Weltkarte' ? 'Weltkarte' : c === 'Verhüllung' ? 'Verhüllung & Wissen' : c === 'Verbotenes Wissen' ? 'Geheimnisse & Verborgenes Wissen' : c === 'Story & Quests' || (c as string) === 'Events' ? 'Story & Quests' : c === 'Zeitlinie' ? 'Chronik & Zeitlinie' : c}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === c ? 'bg-black/20' : 'bg-slate-800'}`}>
              {c === 'Omni-Smart-Fill'
                ? proposedEntries.length
                : c === 'Story & Quests' || (c as string) === 'Events' 
                  ? (lore.find(l => l.category === 'Story & Quests' || (l.category as string) === 'Events')?.details?.eventSteps?.length || 0) 
                  : c === 'Verhüllung'
                    ? (lore.filter(l => (l.category === 'Charaktere' || l.category === 'Gegner') && l.id !== '__player_knowledge__' && (playerName ? l.title?.trim().toLowerCase() !== playerName.trim().toLowerCase() : true)).length + 1)
                    : c === 'Weltkarte'
                      ? (world?.territories?.length || 0)
                      : lore.filter(l => l.category === c).length
              }
            </span>
          </button>
        ))}
        {removedCategories.length > 0 && (
          <button
            type="button"
            onClick={() => setRemovedCategories([])}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Gelöschte Kategorie-Tags wiederherstellen"
          >
            <i className="fa-solid fa-rotate-left text-amber-400"></i>
            <span>Tags wiederherstellen</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {activeCategory === 'Omni-Smart-Fill' ? (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/80 border border-indigo-500/30 p-6 rounded-2xl flex flex-col gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 left-0"></div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                    <span>Multi-Smart-Fill: Mehrere Einträge gleichzeitig generieren</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Beschreibe ein Konzept, eine Fraktion oder ein Ereignis. Es werden automatisch verknüpfte Charaktere, Orte, Gegenstände und Geheimnisse erstellt.
                  </p>
                </div>
              </div>

              <AutoExpandingTextarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 text-sm min-h-[120px] outline-none focus:border-indigo-500 transition-all" 
                placeholder="Beschreibung für die Multi-Generierung eingeben..."
                value={omniSmartFillPrompt} 
                onChange={e => setOmniSmartFillPrompt(e.target.value)} 
                disabled={isOmniGenerating}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">
                  Erstellt automatische Verknüpfungen zwischen Fraktionen, Charakteren und Standorten.
                </span>
                <button 
                  onClick={handleOmniGenerate}
                  disabled={isOmniGenerating || !omniSmartFillPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
                >
                  {isOmniGenerating ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Generiere Einträge...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt text-amber-300"></i>
                      <span>Einträge generieren</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {omniSuccessMessage && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
                <i className="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
                <div>
                  <p className="font-bold">{omniSuccessMessage}</p>
                </div>
                <button onClick={() => setOmniSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-white">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {proposedEntries.length > 0 && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-xl gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Generierte Einträge zur Überprüfung ({proposedEntries.length})</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Passe Namen oder Texte direkt an und wähle aus, welche Einträge du speichern möchtest.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (selectedProposedIds.size === proposedEntries.length) {
                          setSelectedProposedIds(new Set());
                        } else {
                          setSelectedProposedIds(new Set(proposedEntries.map(e => e.tempId)));
                        }
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-all font-semibold cursor-pointer"
                    >
                      {selectedProposedIds.size === proposedEntries.length ? 'Alle abwählen' : 'Alle auswählen'}
                    </button>
                    <button
                      onClick={handleSaveSelectedOmniEntries}
                      disabled={selectedProposedIds.size === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Ausgewählte ({selectedProposedIds.size}) im Codex speichern</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {proposedEntries.map((entry) => {
                    const isSelected = selectedProposedIds.has(entry.tempId);
                    
                    const handleToggleSelect = () => {
                      const updated = new Set(selectedProposedIds);
                      if (isSelected) {
                        updated.delete(entry.tempId);
                      } else {
                        updated.add(entry.tempId);
                      }
                      setSelectedProposedIds(updated);
                    };

                    const handleFieldChange = (field: 'title' | 'description', value: string) => {
                      setProposedEntries(prev => prev.map(e => e.tempId === entry.tempId ? { ...e, [field]: value } : e));
                    };

                    return (
                      <div 
                        key={entry.tempId}
                        className={`bg-slate-900 border transition-all rounded-2xl overflow-hidden p-5 flex flex-col gap-4 relative ${
                          isSelected ? 'border-indigo-500/40 bg-slate-900/95 shadow-lg shadow-indigo-950/10' : 'border-slate-800/80 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3 justify-between">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={handleToggleSelect}
                              className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-500"
                            />
                            
                            <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-md flex items-center gap-1.5 ${
                              entry.category === 'Charaktere' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                              entry.category === 'Gegner' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              entry.category === 'Orte' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              entry.category === 'Fraktionen' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              entry.category === 'Gegenstände' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {entry.category === 'Charaktere' && <i className="fa-solid fa-users text-[8px]"></i>}
                              {entry.category === 'Gegner' && <i className="fa-solid fa-skull text-[8px]"></i>}
                              {entry.category === 'Orte' && <i className="fa-solid fa-map text-[8px]"></i>}
                              {entry.category === 'Fraktionen' && <i className="fa-solid fa-flag text-[8px]"></i>}
                              {entry.category === 'Gegenstände' && <i className="fa-solid fa-khanda text-[8px]"></i>}
                              {entry.category === 'Verbotenes Wissen' && <i className="fa-solid fa-eye-slash text-[8px]"></i>}
                              {entry.category === 'Weltregeln' && <i className="fa-solid fa-scale-balanced text-[8px]"></i>}
                              {entry.category === 'Zeitlinie' && <i className="fa-solid fa-timeline text-[8px]"></i>}
                              {entry.category}
                            </span>

                            <input 
                              type="text"
                              value={entry.title || ''}
                              onChange={e => handleFieldChange('title', e.target.value)}
                              className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-indigo-500 px-1 py-0.5"
                              placeholder="Name oder Titel"
                            />
                          </div>

                          <button 
                            onClick={() => {
                              setProposedEntries(prev => prev.filter(e => e.tempId !== entry.tempId));
                              const updated = new Set(selectedProposedIds);
                              updated.delete(entry.tempId);
                              setSelectedProposedIds(updated);
                            }}
                            className="text-slate-500 hover:text-rose-400 text-xs transition-all cursor-pointer"
                            title="Aus der Liste entfernen"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Beschreibung</label>
                          <AutoExpandingTextarea 
                            value={entry.description || ''}
                            onChange={e => handleFieldChange('description', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-slate-300 text-xs min-h-[70px] outline-none focus:border-indigo-500 transition-all"
                            placeholder="Beschreibung"
                          />
                        </div>

                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-2">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Erfasste Parameter:</span>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {entry.category === 'Charaktere' && (
                                <>
                                  {entry.details.role && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Rolle:</strong> {entry.details.role}</span>}
                                  {entry.details.race && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Rasse:</strong> {entry.details.race}</span>}
                                  {entry.details.age && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Alter:</strong> {entry.details.age}</span>}
                                  {entry.details.faction && <span className="bg-amber-950/20 border border-amber-800/20 px-2 py-0.5 rounded text-amber-300"><strong className="text-amber-400/80">Fraktion:</strong> {entry.details.faction}</span>}
                                  {entry.details.skills && <span className="bg-indigo-950/20 border border-indigo-800/20 px-2 py-0.5 rounded text-indigo-300"><strong className="text-indigo-400/80">Kräfte:</strong> {entry.details.skills}</span>}
                                </>
                              )}
                              {entry.category === 'Orte' && (
                                <>
                                  {entry.details.type && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Typ:</strong> {entry.details.type}</span>}
                                  {entry.details.climate && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Klima:</strong> {entry.details.climate}</span>}
                                  {entry.details.ruler && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Herrscher:</strong> {entry.details.ruler}</span>}
                                  {entry.details.population && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Einwohner:</strong> {entry.details.population}</span>}
                                </>
                              )}
                              {entry.category === 'Fraktionen' && (
                                <>
                                  {entry.details.leader && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Anführer:</strong> {entry.details.leader}</span>}
                                  {entry.details.leadershipStructure && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Struktur:</strong> {entry.details.leadershipStructure}</span>}
                                  {entry.details.foundingReason && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Ursprung:</strong> {entry.details.foundingReason}</span>}
                                  {entry.details.currentGoal && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Ziel:</strong> {entry.details.currentGoal}</span>}
                                  {entry.details.philosophy && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Credo:</strong> {entry.details.philosophy}</span>}
                                  {entry.details.members && entry.details.members.length > 0 && <span className="bg-amber-950/30 border border-amber-800/40 px-2 py-0.5 rounded text-amber-300"><strong className="text-amber-400">Mitglieder:</strong> {entry.details.members.length}</span>}
                                </>
                              )}
                              {entry.category === 'Gegenstände' && (
                                <>
                                  {entry.details.itemType && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Typ:</strong> {entry.details.itemType}</span>}
                                  {entry.details.rarity && <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"><strong className="text-slate-400">Seltenheit:</strong> {entry.details.rarity}</span>}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end p-4 bg-slate-900/40 border border-slate-800 rounded-xl mt-2">
                  <button
                    onClick={handleSaveSelectedOmniEntries}
                    disabled={selectedProposedIds.size === 0}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Ausgewählte ({selectedProposedIds.size}) im Codex speichern</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeCategory === 'Orte' ? (
          <div className="flex flex-col gap-6">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5 self-start shadow-xl">
              <button
                type="button"
                onClick={() => setOrteSubTab('map')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  orteSubTab === 'map'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <i className="fa-solid fa-map"></i>
                <span>Weltkarte</span>
              </button>
              <button
                type="button"
                onClick={() => setOrteSubTab('configurator')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  orteSubTab === 'configurator'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <i className="fa-solid fa-earth-europe"></i>
                <span>Welt-Konfigurator</span>
              </button>
            </div>

            {orteSubTab === 'map' ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setIsMapLevelDropdownOpen(!isMapLevelDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 shadow-sm cursor-pointer"
                      >
                        <i className={`fa-solid ${mapZoomLevel === 'macro' ? 'fa-earth-americas text-sky-400' : mapZoomLevel === 'meso' ? 'fa-mountain text-emerald-400' : mapZoomLevel === 'micro' ? 'fa-city text-amber-400' : 'fa-dungeon text-purple-400'}`}></i>
                        <span>
                          {mapZoomLevel === 'macro' && 'Welt'}
                          {mapZoomLevel === 'meso' && 'Region'}
                          {mapZoomLevel === 'micro' && 'Ort'}
                          {mapZoomLevel === 'building' && 'Gebäude'}
                        </span>
                        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1 transition-transform ${isMapLevelDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>

                      {isMapLevelDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                          <button
                            onClick={() => { setMapZoomLevel('macro'); setSelectedMacroId(null); setSelectedMesoId(null); setSelectedMicroId(null); setIsMapLevelDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-900 transition-colors ${mapZoomLevel === 'macro' ? 'bg-sky-950/40 text-sky-300 font-bold' : 'text-slate-300'}`}
                          >
                            <i className="fa-solid fa-earth-americas text-sky-400 w-4"></i>
                            <span>Welt</span>
                          </button>
                          <button
                            onClick={() => { setMapZoomLevel('meso'); setSelectedMesoId(null); setSelectedMicroId(null); setIsMapLevelDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-900 transition-colors ${mapZoomLevel === 'meso' ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-slate-300'}`}
                          >
                            <i className="fa-solid fa-mountain text-emerald-400 w-4"></i>
                            <span>Region</span>
                          </button>
                          <button
                            onClick={() => { setMapZoomLevel('micro'); setSelectedMicroId(null); setIsMapLevelDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-900 transition-colors ${mapZoomLevel === 'micro' ? 'bg-amber-950/40 text-amber-300 font-bold' : 'text-slate-300'}`}
                          >
                            <i className="fa-solid fa-city text-amber-400 w-4"></i>
                            <span>Ort</span>
                          </button>
                          <button
                            onClick={() => { setMapZoomLevel('building'); setIsMapLevelDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-900 transition-colors ${mapZoomLevel === 'building' ? 'bg-purple-950/40 text-purple-300 font-bold' : 'text-slate-300'}`}
                          >
                            <i className="fa-solid fa-dungeon text-purple-400 w-4"></i>
                            <span>Gebäude</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => handleZoom(Math.max(0.5, mapScale - 0.2))}
                        className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                        title="Verkleinern"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span className="text-[11px] font-mono text-slate-300 px-1">{Math.round(mapScale * 100)}%</span>
                      <button
                        onClick={() => handleZoom(Math.min(3, mapScale + 0.2))}
                        className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                        title="Vergrößern"
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                      <button
                        onClick={() => { setMapScale(1); setPanOffset({ x: 0, y: 0 }); }}
                        className="ml-1 text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 hover:bg-slate-800 rounded"
                        title="Ansicht zurücksetzen"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      onClick={() => setIsCustomizingGrid(!isCustomizingGrid)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isCustomizingGrid
                          ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-950/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-border-all"></i>
                      <span>Gitter ({mapGridSizes[mapZoomLevel]?.width || 10}x{mapGridSizes[mapZoomLevel]?.height || 10})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setIsStamperDropdownOpen(!isStamperDropdownOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all ${
                          activePlacingClassAsset
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-700 hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-stamp text-amber-400"></i>
                        <span>{activePlacingClassAsset ? activePlacingClassAsset.name : 'Objekt platzieren'}</span>
                        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1 transition-transform ${isStamperDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>

                      {isStamperDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-80 overflow-y-auto">
                          {WORLD_MAP_CLASSES.map(cls => (
                            <div key={cls.id} className="border-b border-slate-900 last:border-0">
                              <div className="px-3 py-1.5 bg-slate-900/60 text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                <i className={cls.icon}></i>
                                <span>{cls.label}</span>
                              </div>
                              {cls.items.map(item => (
                                <button
                                  key={item.name}
                                  onClick={() => {
                                    setActivePlacingClassAsset({ name: item.name, icon: item.icon, className: cls.id });
                                    setIsStamperDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-900 text-slate-300 transition-colors"
                                >
                                  <i className={`${item.icon} text-amber-400 w-4`}></i>
                                  <div>
                                    <div className="font-semibold text-slate-200">{item.name}</div>
                                    <div className="text-[9px] text-slate-500">{item.description}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setIsShowingJSONConnections(!isShowingJSONConnections)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isShowingJSONConnections
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-code"></i>
                      <span>Hierarchie JSON</span>
                    </button>
                  </div>
                </div>

                {isCustomizingGrid && (
                  <div className="bg-slate-950 border border-amber-900/40 p-4 rounded-xl flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-amber-400">Gittergröße für {mapZoomLevel.toUpperCase()}:</span>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span>Breite:</span>
                      <input
                        type="number"
                        min="4"
                        max="50"
                        value={mapGridSizes[mapZoomLevel]?.width || 10}
                        onChange={e => {
                          const val = Math.max(4, Math.min(50, parseInt(e.target.value) || 10));
                          setMapGridSizes(prev => {
                            const next = { ...prev, [mapZoomLevel]: { ...prev[mapZoomLevel], width: val } };
                            localStorage.setItem('adventureforge_map_grid_sizes', JSON.stringify(next));
                            return next;
                          });
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-center font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span>Höhe:</span>
                      <input
                        type="number"
                        min="4"
                        max="50"
                        value={mapGridSizes[mapZoomLevel]?.height || 10}
                        onChange={e => {
                          const val = Math.max(4, Math.min(50, parseInt(e.target.value) || 10));
                          setMapGridSizes(prev => {
                            const next = { ...prev, [mapZoomLevel]: { ...prev[mapZoomLevel], height: val } };
                            localStorage.setItem('adventureforge_map_grid_sizes', JSON.stringify(next));
                            return next;
                          });
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-center font-mono"
                      />
                    </div>
                  </div>
                )}

                {isShowingJSONConnections && (
                  <div className="bg-slate-950 border border-indigo-900/40 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">Hierarchische Struktur aller Orte:</span>
                      <button onClick={() => navigator.clipboard.writeText(hierarchicalConnectionsJSON)} className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-300 hover:text-white">
                        Kopieren
                      </button>
                    </div>
                    <pre className="text-[10px] text-slate-400 font-mono bg-slate-900 p-3 rounded max-h-48 overflow-y-auto">
                      {hierarchicalConnectionsJSON}
                    </pre>
                  </div>
                )}

                <div 
                  ref={mapContainerRef}
                  onPointerDown={handleMapBgPointerDown}
                  onPointerMove={handleMapPointerMove}
                  onPointerUp={handleMapPointerUp}
                  className="relative w-full aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 cursor-crosshair select-none touch-none shadow-2xl"
                >
                  <NauticalMapBackground
                    lore={lore}
                    mapZoomLevel={mapZoomLevel}
                    selectedMacroId={selectedMacroId || undefined}
                    selectedMesoId={selectedMesoId || undefined}
                    selectedMicroId={selectedMicroId || undefined}
                    worldTitle={worldTitle}
                    world={world}
                  />

                  <div 
                    className="absolute inset-0 transition-transform duration-75 origin-top-left"
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapScale})`,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div 
                      className="absolute inset-0 grid opacity-30 pointer-events-none"
                      style={{
                        gridTemplateColumns: `repeat(${backgroundGridWidth}, 1fr)`,
                        gridTemplateRows: `repeat(${backgroundGridHeight}, 1fr)`
                      }}
                    >
                      {backgroundTiles.map((tile, idx) => (
                        <div 
                          key={`tile-${idx}`} 
                          className="border border-slate-800/40 relative flex items-center justify-center text-[8px] font-mono text-slate-600/60"
                          style={{
                            backgroundColor: getTileColor(tile.terrainId)
                          }}
                        >
                        </div>
                      ))}
                    </div>

                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {lore.filter(l => l.category === 'Orte').map((place) => {
                        if (!place.details?.coordinates) return null;
                        const parent = lore.find(p => p.id === place.details?.parentPlaceId || p.title === place.details?.parentPlaceId);
                        if (!parent || !parent.details?.coordinates) return null;
                        
                        return (
                          <line
                            key={`conn-${place.id}-${parent.id}`}
                            x1={`${place.details.coordinates.x}%`}
                            y1={`${place.details.coordinates.y}%`}
                            x2={`${parent.details.coordinates.x}%`}
                            y2={`${parent.details.coordinates.y}%`}
                            stroke="#475569"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            opacity="0.6"
                          />
                        );
                      })}

                      {combatEffects.map(eff => (
                        <circle
                          key={`eff-circle-${eff.id}`}
                          cx={`${eff.x}%`}
                          cy={`${eff.y}%`}
                          r={`${eff.radius * 2}%`}
                          fill={eff.type === 'magma' ? 'rgba(239, 68, 68, 0.25)' : eff.type === 'eis' ? 'rgba(6, 182, 212, 0.25)' : eff.type === 'feuer' ? 'rgba(249, 115, 22, 0.25)' : eff.type === 'blitze' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(168, 85, 247, 0.25)'}
                          stroke={eff.type === 'magma' ? '#ef4444' : eff.type === 'eis' ? '#06b6d4' : eff.type === 'feuer' ? '#f97316' : eff.type === 'blitze' ? '#eab308' : '#a855f7'}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      ))}
                    </svg>

                    {combatEffects.map(eff => (
                      <div
                        key={`eff-marker-${eff.id}`}
                        style={{
                          left: `${eff.x}%`,
                          top: `${eff.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        className="absolute z-20 pointer-events-auto cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCombatEffects(prev => prev.filter(item => item.id !== eff.id));
                        }}
                        title={`${eff.description} (Klick zum Entfernen)`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg ${
                          eff.type === 'magma' ? 'bg-red-600 text-white shadow-red-500/50 animate-pulse' :
                          eff.type === 'eis' ? 'bg-cyan-500 text-slate-950 shadow-cyan-400/50' :
                          eff.type === 'feuer' ? 'bg-orange-500 text-white shadow-orange-500/50' :
                          eff.type === 'blitze' ? 'bg-yellow-400 text-slate-950 shadow-yellow-400/50 animate-bounce' :
                          'bg-purple-600 text-white shadow-purple-500/50'
                        }`}>
                          <i className={`fa-solid ${
                            eff.type === 'magma' ? 'fa-fire' :
                            eff.type === 'eis' ? 'fa-snowflake' :
                            eff.type === 'feuer' ? 'fa-fire-flame-curved' :
                            eff.type === 'blitze' ? 'fa-bolt' :
                            'fa-skull'
                          }`}></i>
                        </div>
                      </div>
                    ))}

                    {lore.filter(l => l.category === 'Orte').map((node) => {
                      const lvl = node.details?.mapLevel || 'meso';
                      let isVisible = false;
                      if (mapZoomLevel === 'macro') isVisible = lvl === 'macro';
                      else if (mapZoomLevel === 'meso') isVisible = lvl === 'meso' && (!selectedMacroId || node.details?.parentPlaceId === selectedMacroId);
                      else if (mapZoomLevel === 'micro') isVisible = lvl === 'micro' && (!selectedMesoId || node.details?.parentPlaceId === selectedMesoId);
                      else if (mapZoomLevel === 'building') isVisible = lvl === 'building' && (!selectedMicroId || node.details?.parentPlaceId === selectedMicroId);

                      if (!isVisible) return null;

                      const coords = node.details?.coordinates || { x: 50, y: 50 };
                      const isSelected = selectedNodeId === node.id;
                      const isTarget = node.details?.isActiveTarget;

                      return (
                        <div
                          key={node.id}
                          data-node="true"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggedNodeId(node.id);
                            setSelectedNodeId(node.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.id);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (lvl === 'macro') {
                              setSelectedMacroId(node.id);
                              setMapZoomLevel('meso');
                            } else if (lvl === 'meso') {
                              setSelectedMesoId(node.id);
                              setMapZoomLevel('micro');
                            } else if (lvl === 'micro') {
                              setSelectedMicroId(node.id);
                              setMapZoomLevel('building');
                            }
                          }}
                          style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          className={`absolute z-30 cursor-grab active:cursor-grabbing group flex flex-col items-center select-none transition-transform ${
                            isSelected ? 'scale-110 z-40' : ''
                          }`}
                        >
                          <div className={`relative px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all ${
                            isTarget 
                              ? 'bg-amber-600/90 border-amber-300 text-white ring-4 ring-amber-500/40 font-bold'
                              : isSelected
                                ? 'bg-indigo-600/90 border-indigo-300 text-white ring-2 ring-indigo-400/50'
                                : 'bg-slate-900/85 border-slate-700/80 text-slate-200 hover:border-slate-500'
                          }`}>
                            <i className={`${node.details?.icon || 'fa-solid fa-location-dot'} text-xs ${
                              isTarget ? 'text-white' : isSelected ? 'text-indigo-200' : 'text-amber-400'
                            }`}></i>
                            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">{node.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {getTacticalClashes().length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                      <span>Aktive Umwelt- und Kampfeffekte</span>
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getTacticalClashes().map((clash, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                          <i className={`${clash.icon} text-amber-400 mt-1`}></i>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{clash.label} ({clash.cell})</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{clash.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                      <span>KI-Weltschöpfung</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Gib eine Vision für deine Welt ein. Es werden Geografie, Regionen und Regeln automatisch generiert.
                    </p>
                  </div>

                  <AutoExpandingTextarea
                    value={aiWorldDescription}
                    onChange={e => setAiWorldDescription(e.target.value)}
                    placeholder="Beschreibung für die automatische Welterstellung eingeben..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-xs min-h-[100px] outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button onClick={() => applyPreset('onepiece')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg">Preset: Inselwelt</button>
                      <button onClick={() => applyPreset('middleearth')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg">Preset: Kontinent</button>
                      <button onClick={() => applyPreset('westeros')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg">Preset: Halbinsel</button>
                    </div>

                    <button
                      onClick={handleGenerateAiWorld}
                      disabled={isGeneratingAiWorld || !aiWorldDescription.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      {isGeneratingAiWorld ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
                      <span>Welt generieren</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : activeCategory === 'Weltkarte' ? (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-earth-americas text-sky-400"></i>
                    <span>Gebietsverwaltung ({world?.territories?.length || 0})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Definiere Kontinente, Reiche, Städte, Dungeons und Zonen für die Weltkarte.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const count = world?.territories?.length || 0;
                      if (confirm(`Möchtest du das Tag 'Weltkarte' und alle (${count}) Einträge wirklich löschen?`)) {
                        handleDeleteCategoryAndEntries('Weltkarte');
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Tag Weltkarte und alle Gebiets-Einträge löschen"
                  >
                    <i className="fa-solid fa-trash-can text-rose-400"></i>
                    <span>Tag &amp; alle ({world?.territories?.length || 0}) Einträge löschen</span>
                  </button>
                  {isEditingTerritory && (
                    <button
                      onClick={() => {
                        setIsEditingTerritory(null);
                        setTerritoryForm({
                          name: '',
                          type: 'stadt',
                          description: '',
                          parentId: null,
                          population: '',
                          ruler: '',
                          climate: '',
                          culture: '',
                          terrain: '',
                          faction: '',
                          x: 50,
                          y: 50
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Neues Gebiet erstellen
                    </button>
                  )}
                </div>
              </div>

              {/* Filter and Search Bar for Territories */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <div className="flex-1 min-w-[200px] relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    value={weltkarteSearch}
                    onChange={e => setWeltkarteSearch(e.target.value)}
                    placeholder="Gebiete durchsuchen..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                  />
                  {weltkarteSearch && (
                    <button
                      onClick={() => setWeltkarteSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Typ:</span>
                  <select
                    value={weltkarteTypeFilter}
                    onChange={e => setWeltkarteTypeFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500"
                  >
                    <option value="all">Alle Typen</option>
                    <option value="kontinent">Kontinent</option>
                    <option value="ozean">Meer / Ozean</option>
                    <option value="insel">Insel</option>
                    <option value="region">Region</option>
                    <option value="zone">Zone</option>
                    <option value="stadt">Stadt</option>
                    <option value="dorf">Dorf</option>
                    <option value="ort">Ort</option>
                    <option value="dungeon">Dungeon</option>
                    <option value="gebaeude">Gebäude</option>
                  </select>
                </div>

                {parentOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Übergeordnet:</span>
                    <select
                      value={weltkarteParentFilter}
                      onChange={e => setWeltkarteParentFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 max-w-[140px] truncate"
                    >
                      <option value="all">Alle</option>
                      {parentOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Sortierung:</span>
                  <select
                    value={weltkarteSortBy}
                    onChange={e => setWeltkarteSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="type">Typ</option>
                    <option value="pos-x">Position X</option>
                    <option value="pos-y">Position Y</option>
                  </select>
                </div>

                {(weltkarteSearch || weltkarteTypeFilter !== 'all' || weltkarteParentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setWeltkarteSearch('');
                      setWeltkarteTypeFilter('all');
                      setWeltkarteParentFilter('all');
                      setWeltkarteSortBy('name-asc');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold ml-auto"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>

              {/* Territory Editor Form */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{isEditingTerritory ? 'Gebiet bearbeiten' : 'Neues Gebiet hinzufügen'}</span>
                    {isEditingTerritory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTerritory(null);
                          setTerritoryForm({ type: 'stadt', x: 50, y: 50 });
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-slate-700/60"
                      >
                        <i className="fa-solid fa-plus mr-1"></i>
                        <span>Neues Gebiet hinzufügen</span>
                      </button>
                    )}
                  </div>
                </h5>

                {/* Smart Fill Gebiet */}
                <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>SMART FILL GEBIET</span>
                    </span>
                    <button 
                      type="button"
                      onClick={handleTerritorySmartFill}
                      disabled={isSmartFillingTerritory || !weltkarteSmartFill.trim()}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                    >
                      <i className={`fa-solid ${isSmartFillingTerritory ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                      <span>Automatisch Ausfüllen</span>
                    </button>
                  </div>

                  <AutoExpandingTextarea 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
                    placeholder="Beschreibe das Gebiet, seine Besonderheiten, Einwohner, Geschichte oder Klimazonen. Die KI füllt alle passenden Felder für diesen Gebietstyp automatisch aus." 
                    value={weltkarteSmartFill} 
                    onChange={e => setWeltkarteSmartFill(e.target.value)} 
                  />

                  <div className="flex items-center gap-2 px-1 select-none">
                    <input 
                      type="checkbox" 
                      id="isSmartFillComplementModeCheckbox"
                      checked={isSmartFillComplementMode} 
                      onChange={e => setIsSmartFillComplementMode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-indigo-600"
                    />
                    <label htmlFor="isSmartFillComplementModeCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
                      <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Gebiets-Daten behalten und neue Informationen hinzufügen
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name des Gebiets</label>
                    <input
                      type="text"
                      value={territoryForm.name || ''}
                      onChange={e => setTerritoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gebietstyp</label>
                    <select
                      value={territoryForm.type || 'stadt'}
                      onChange={e => setTerritoryForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                    >
                      <option value="kontinent">Kontinent</option>
                      <option value="ozean">Meer / Ozean</option>
                      <option value="insel">Insel</option>
                      <option value="region">Region</option>
                      <option value="zone">Zone</option>
                      <option value="stadt">Stadt</option>
                      <option value="dorf">Dorf</option>
                      <option value="ort">Ort</option>
                      <option value="dungeon">Dungeon</option>
                      <option value="gebaeude">Gebäude</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Übergeordnetes Gebiet</label>
                    <select
                      value={territoryForm.parentId || ''}
                      onChange={e => setTerritoryForm(prev => ({ ...prev, parentId: e.target.value || null }))}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                    >
                      <option value="">Keines (Oberste Ebene)</option>
                      {(world?.territories || []).filter((t: any) => t.id !== isEditingTerritory).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fraktion</label>
                    {(() => {
                      const availableFactions = (lore || [])
                        .filter(l => l.category === 'Fraktionen' && l.title?.trim())
                        .map(l => ({ id: l.id, title: l.title.trim() }));
                      const uniqueFactionTitles = Array.from(new Set(availableFactions.map(f => f.title)));
                      
                      return (
                        <>
                          <select
                            value={isCustomFactionInput ? '__custom__' : (territoryForm.faction || '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                setIsCustomFactionInput(true);
                              } else {
                                setIsCustomFactionInput(false);
                                const matchedFaction = availableFactions.find(f => f.title === val);
                                setTerritoryForm(prev => ({
                                  ...prev,
                                  faction: val,
                                  controlledByFactionId: matchedFaction ? matchedFaction.id : (val ? prev.controlledByFactionId : undefined)
                                }));
                              }
                            }}
                            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="">Keine Fraktion (Neutral)</option>
                            {uniqueFactionTitles.map(fTitle => (
                              <option key={fTitle} value={fTitle}>{fTitle}</option>
                            ))}
                            {territoryForm.faction && !uniqueFactionTitles.includes(territoryForm.faction) && !isCustomFactionInput && (
                              <option value={territoryForm.faction}>{territoryForm.faction}</option>
                            )}
                            <option value="__custom__">+ Freitext-Eingabe...</option>
                          </select>
                          {isCustomFactionInput && (
                            <input
                              type="text"
                              value={territoryForm.faction || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const matchedFaction = availableFactions.find(f => f.title.trim().toLowerCase() === val.trim().toLowerCase());
                                setTerritoryForm(prev => ({
                                  ...prev,
                                  faction: val,
                                  controlledByFactionId: matchedFaction ? matchedFaction.id : undefined
                                }));
                              }}
                              placeholder="Fraktionsname eingeben..."
                              className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                              autoFocus
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Position X (0 - 100 %)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={territoryForm.x !== undefined ? territoryForm.x : 50}
                      onChange={e => setTerritoryForm(prev => ({ ...prev, x: Number(e.target.value) }))}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Position Y (0 - 100 %)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={territoryForm.y !== undefined ? territoryForm.y : 50}
                      onChange={e => setTerritoryForm(prev => ({ ...prev, y: Number(e.target.value) }))}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Typ-spezifische Eigenschaften */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span>Eigenschaften für Gebietstyp: <strong className="text-slate-200 capitalize">{territoryForm.type || 'stadt'}</strong></span>
                  </div>
                  <TerritorySpecificFields
                    territory={territoryForm}
                    updateTerritory={(changes) => setTerritoryForm(prev => ({ ...prev, ...changes }))}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Beschreibung</label>
                  <AutoExpandingTextarea
                    value={territoryForm.description || ''}
                    onChange={e => setTerritoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detaillierte Beschreibung der Geografie, Geschichte und Besonderheiten..."
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-sky-500 min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleSaveTerritory}
                    disabled={!territoryForm.name || !territoryForm.description}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-950/20"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>{isEditingTerritory ? 'Gebiet aktualisieren' : 'Gebiet speichern'}</span>
                  </button>
                </div>
              </div>

              {/* Territory List (Von oben nach unten) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Gespeicherte Gebiete ({filteredAndSortedTerritories.length})
                  </span>
                  <span className="text-[11px] text-slate-500 italic">
                    Klicke auf ein Feld, um das Gebiet zu bearbeiten
                  </span>
                </div>

                {filteredAndSortedTerritories.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-500 italic">
                    Keine Gebiete vorhanden.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {filteredAndSortedTerritories.map((territory: any) => {
                      const isSelected = isEditingTerritory === territory.id;
                      const parentTerritory = (world?.territories || []).find((t: any) => t.id === territory.parentId);

                      return (
                        <div
                          key={territory.id}
                          onClick={() => {
                            setIsEditingTerritory(territory.id);
                            setTerritoryForm(territory);
                            formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`bg-slate-950 border px-4 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 bg-sky-950/30 text-sky-200 shadow-md shadow-sky-950/20'
                              : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-200'
                          }`}
                        >
                          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-400">
                                {territory.type || 'Ort'}
                              </span>
                              <h5 className="text-sm font-bold text-slate-100 truncate">
                                {territory.name}
                              </h5>
                              {parentTerritory && (
                                <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60">
                                  in {parentTerritory.name}
                                </span>
                              )}
                            </div>

                            {territory.description && (
                              <p className="text-xs text-slate-400 line-clamp-1">
                                {territory.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 border-t border-slate-900/80 pt-2 mt-0.5">
                              {territory.population && <span><strong>Einwohner:</strong> {territory.population}</span>}
                              {territory.ruler && <span><strong>Herrscher:</strong> {territory.ruler}</span>}
                              {territory.climate && <span><strong>Klima:</strong> {territory.climate}</span>}
                              {territory.faction && <span><strong>Fraktion:</strong> {territory.faction}</span>}
                              <span><strong>Position:</strong> ({territory.x}%, {territory.y}%)</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingTerritory(territory.id);
                                setTerritoryForm(territory);
                                formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-600 text-white shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                              }`}
                              title="Bearbeiten"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>{isSelected ? 'Bearbeiten...' : 'Bearbeiten'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTerritory(territory.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 text-xs p-1.5 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Gebiet löschen"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Region Markers List */}
              <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-6 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <i className="fa-solid fa-compass text-emerald-400"></i>
                      <span>Regionale Orte &amp; Meereszonen ({world?.regionMarkers?.length || 0})</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hier werden zusätzliche Kartenpunkte, maritime Zonen oder sonstige Orientierungspunkte verwaltet.
                    </p>
                  </div>
                  {world?.regionMarkers && world.regionMarkers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllRegionMarkers}
                      className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm animate-fade-in"
                    >
                      <i className="fa-solid fa-trash-can text-rose-400"></i>
                      <span>Alle löschen</span>
                    </button>
                  )}
                </div>

                {!world?.regionMarkers || world.regionMarkers.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-500 italic">
                    Keine regionalen Orte oder Meereszonen vorhanden.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {world.regionMarkers.map((marker: any, index: number) => {
                      const markerId = marker.id || `marker-${marker.name}`;
                      return (
                        <div
                          key={markerId || index}
                          className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex items-start justify-between gap-3 text-slate-200"
                        >
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                                {marker.type || 'Ort'}
                              </span>
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {marker.name}
                              </span>
                            </div>
                            {marker.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {marker.description}
                              </p>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Position: {marker.x !== undefined ? `${marker.x}%` : '50%'}, {marker.y !== undefined ? `${marker.y}%` : '50%'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRegionMarker(markerId)}
                            className="text-slate-500 hover:text-rose-400 text-xs p-1.5 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Wegpunkt löschen"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeCategory === 'Verhüllung' ? (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-mask text-sky-400"></i>
                  <span>Verhüllung &amp; Wissensstand der Charaktere</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Lege fest, was Charaktere oder Spieler über andere Personen, Fraktionen und Geheimnisse wissen oder verhüllen.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-semibold">Aktiver Betrachter:</span>
                <select
                  value={selectedActorId}
                  onChange={e => setSelectedActorId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                >
                  <option value="__player_knowledge__">{playerName || 'Spieler'} (Wissen des Spielers)</option>
                  {lore.filter(l => (l.category === 'Charaktere' || l.category === 'Gegner') && l.id !== '__player_knowledge__').map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {lore.filter(l => l.id !== selectedActorId && (l.category === 'Charaktere' || l.category === 'Gegner' || l.category === 'Fraktionen')).map(targetItem => {
                  const currentActor = lore.find(l => l.id === selectedActorId) || { details: { knowledgeMap: {} } };
                  const knowledgeMap = currentActor.details?.knowledgeMap || {};
                  const currentKnowledge = knowledgeMap[targetItem.title] || '';

                  return (
                    <div key={targetItem.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{targetItem.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{targetItem.category}</span>
                      </div>
                      <AutoExpandingTextarea
                        value={currentKnowledge}
                        onChange={e => handleUpdateKnowledge(selectedActorId, targetItem.title, e.target.value)}
                        placeholder="Was dieser Charakter über diesen Eintrag weiß..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-sky-500 min-h-[60px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        ) : (currentCategory === 'Charaktere' || currentCategory === 'Gegner') ? (
          <div className="flex flex-col gap-6">
            <CharacterLoreForm
              editForm={editForm}
              setEditForm={setEditForm}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={() => {
                setIsEditing(null);
                setEditForm({ category: currentCategory });
              }}
              lore={lore}
              onUpdateLore={onUpdateLore}
              worldTitle={worldTitle}
              isNsfw={isNsfw}
              worldPowerSettings={worldPowerSettings}
              playerName={playerName}
              world={world}
            />

            {/* List of Existing Lore Entries for this category */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Gespeicherte Einträge ({filteredLore.length})
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Einträge filtern..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500 w-36 sm:w-48"
                />
              </div>

              {filteredLore.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-500 italic">
                  Keine Einträge vorhanden.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {groupedLore.map(([factionName, items]) => (
                    <div key={factionName} className="flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-1 flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span>{factionName}</span>
                        <span className="text-slate-500 text-[10px]">({items.length})</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {items.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleEdit(item)}
                            className={`bg-slate-900 border px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isEditing === item.id 
                                ? 'border-amber-500 bg-amber-950/30 text-amber-300 font-bold shadow-md' 
                                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                            }`}
                          >
                            <span className="text-xs font-semibold truncate flex-1">
                              {item.title || 'Unbenannter Eintrag'}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 text-xs p-1 transition-colors"
                                title="Eintrag löschen"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Standard Lore Form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <i className={`fa-solid ${
                      (currentCategory as string) === 'Fraktionen' ? 'fa-flag text-amber-400' :
                      (currentCategory as string) === 'Gegenstände' ? 'fa-khanda text-indigo-400' :
                      (currentCategory as string) === 'Verbotenes Wissen' ? 'fa-eye-slash text-purple-400' :
                      (currentCategory as string) === 'Weltregeln' ? 'fa-scale-balanced text-teal-400' :
                      (currentCategory as string) === 'Story & Quests' || (currentCategory as string) === 'Events' ? 'fa-map-route text-amber-500' :
                      'fa-timeline text-rose-400'
                    }`}></i>
                    <span>
                      {isEditing 
                        ? `Eintrag bearbeiten: ${editForm.title || ''}` 
                        : `Neuer Eintrag (${(currentCategory as string) === 'Story & Quests' || (currentCategory as string) === 'Events' ? 'Story & Quests' : currentCategory})`}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentCategory === 'Story & Quests' || (currentCategory as string) === 'Events'
                      ? 'Gestalte die Stationen und Meilensteine der Kampagne.'
                      : `Definiere Details und Werte für ${currentCategory}.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const count = lore.filter(l => l.category === currentCategory).length;
                      if (confirm(`Möchtest du das Tag '${currentCategory}' und alle (${count}) Einträge wirklich löschen?`)) {
                        handleDeleteCategoryAndEntries(currentCategory as string);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title={`Tag ${currentCategory} und alle Einträge löschen`}
                  >
                    <i className="fa-solid fa-trash-can text-rose-400"></i>
                    <span>Tag &amp; alle ({lore.filter(l => l.category === currentCategory).length}) Einträge löschen</span>
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(null);
                        setEditForm({ category: ((activeCategory as string) === 'Verhüllung' ? 'Charaktere' : (activeCategory as string) === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
                    >
                      Neuen Eintrag erstellen
                    </button>
                  )}
                </div>
              </div>

              {/* Smart-Fill Input */}
              <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>SMART FILL CODEX ({currentCategory.toUpperCase()})</span>
                  </span>
                  <button 
                    type="button"
                    onClick={handleLoreSmartFill}
                    disabled={isSmartFillingLore || !loreSmartFill.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <i className={`fa-solid ${isSmartFillingLore ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                    <span>Automatisch Ausfüllen</span>
                  </button>
                </div>

                <AutoExpandingTextarea 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
                  placeholder={`Beschreibe den Eintrag für ${currentCategory}... Die KI füllt alle relevanten Felder (Titel, Beschreibung, Beziehungen, Attribute, Fraktion etc.) automatisch aus.`} 
                  value={loreSmartFill} 
                  onChange={e => setLoreSmartFill(e.target.value)} 
                />

                <div className="flex items-center gap-2 px-1 select-none">
                  <input 
                    type="checkbox" 
                    id="keepExistingLoreDetailsCheckbox"
                    checked={keepExistingLoreDetails} 
                    onChange={e => setKeepExistingLoreDetails(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-indigo-600"
                  />
                  <label htmlFor="keepExistingLoreDetailsCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
                    <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Codex-Daten behalten und neue Informationen hinzufügen
                  </label>
                </div>
              </div>

              {/* Basic Fields */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Titel / Name</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Name des Eintrags"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {/* Main Description */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hauptbeschreibung</label>
                <AutoExpandingTextarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaillierte Beschreibung des Eintrags..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[90px]"
                />
              </div>

              {currentCategory === 'Fraktionen' && (
                <div className="flex flex-col gap-5">
                  {/* Einheitliche Fraktions- & Mitglieder-Synchronisation */}
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <i className="fa-solid fa-arrows-rotate text-amber-400"></i>
                          <span>Einheitliche Aktualisierung (Fraktion &amp; Charaktere)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Synchronisiert die Fraktionsdaten basierend auf dem Anführer-Profil und befüllt wechselseitige Beziehungen, Verhalten und gemeinsame Vorgeschichte aller Mitglieder.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleHarmonizeFaction}
                        disabled={isHarmonizingFaction || !editForm.title?.trim()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow shrink-0"
                      >
                        <i className={`fa-solid ${isHarmonizingFaction ? 'fa-spinner animate-spin' : 'fa-arrows-rotate'}`}></i>
                        <span>{isHarmonizingFaction ? 'Synchronisiere...' : 'Fraktion & Charaktere synchronisieren'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Anführer / Leitfigur:</span>
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          {editForm.details?.leader?.trim() || (isUserInThisFaction ? `${effectivePlayerName} (Nutzer)` : 'Nicht festgelegt')}
                        </span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Mitglieder für Beziehungsabgleich:</span>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {effectiveMembers.length} Personen
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Zusatzanweisung für die Synchronisation (Optional)
                      </label>
                      <AutoExpandingTextarea
                        value={factionHarmonizePrompt}
                        onChange={e => setFactionHarmonizePrompt(e.target.value)}
                        placeholder="Optionale Vorgaben zur gemeinsamen Vorgeschichte, Führungsstil oder spezifischen Beziehungen..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                      />
                    </div>

                    {harmonizeSuccessMessage && (
                      <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                        <i className="fa-solid fa-check text-emerald-400"></i>
                        <span>{harmonizeSuccessMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Schritt 1 von 9: Führung, Sitz & Philosophie */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-scepter text-amber-500"></i>
                      <span>Schritt 1 von 9: Führung, Sitz &amp; Philosophie</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Anführer / Leitfigur ('leader')</label>
                        <input
                          type="text"
                          value={editForm.details?.leader || ''}
                          onChange={e => updateDetail('leader', e.target.value)}
                          placeholder="Name des Anführers oder Ratsvorsitzenden"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Führungsstruktur ('leadershipStructure')</label>
                        <input
                          type="text"
                          value={editForm.details?.leadershipStructure || ''}
                          onChange={e => updateDetail('leadershipStructure', e.target.value)}
                          placeholder="Einzelner Anführer, Rat, Königsfamilie, Gilde, Senat"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Hauptquartier / Sitz ('headquarters')</label>
                        <input
                          type="text"
                          value={editForm.details?.headquarters || ''}
                          onChange={e => updateDetail('headquarters', e.target.value)}
                          placeholder="Ort, Festung, Hauptsitz oder Stadt"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Grundphilosophie &amp; Credo ('philosophy')</label>
                      <AutoExpandingTextarea
                        value={editForm.details?.philosophy || ''}
                        onChange={e => updateDetail('philosophy', e.target.value)}
                        placeholder="Leitmotiv, Wahlspruch oder zentrale Werte der Fraktion..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                      />
                    </div>
                  </div>

                  {/* Schritt 2 von 9: Ursprung & Zielsetzungen */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-compass text-amber-500"></i>
                      <span>Schritt 2 von 9: Ursprung &amp; Zielsetzungen</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">1. Gründungsanlass &amp; Ursprung ('foundingReason')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.foundingReason || ''}
                          onChange={e => updateDetail('foundingReason', e.target.value)}
                          placeholder="Schutz, Religion, Krieg, Handel, Widerstand, Macht..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">2. Ursprüngliches Ziel ('originalGoal')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.originalGoal || ''}
                          onChange={e => updateDetail('originalGoal', e.target.value)}
                          placeholder="Historisches Ziel bei der Gründung..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">3. Aktuelle &amp; langfristige Ziele ('currentGoal')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.currentGoal || ''}
                          onChange={e => updateDetail('currentGoal', e.target.value)}
                          placeholder="Aktuelles Hauptziel und langfristige Bestrebungen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schritt 3 von 9: Geschichte & Entwicklung */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-clock-rotate-left text-amber-500"></i>
                      <span>Schritt 3 von 9: Geschichte &amp; Entwicklung</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">4. Prägende historische Ereignisse ('keyHistoricalEvents')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.keyHistoricalEvents || ''}
                          onChange={e => updateDetail('keyHistoricalEvents', e.target.value)}
                          placeholder="Wichtigste historische Ereignisse (Kriege, Paktabschlüsse, Krisen)..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">5. Wandel &amp; Veränderung ('evolutionAndChange')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.evolutionAndChange || ''}
                          onChange={e => updateDetail('evolutionAndChange', e.target.value)}
                          placeholder="Entwicklung und organisatorischer Wandel über die Zeit..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schritt 4 von 9: Zusammenhalt & Interne Konflikte */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-users-gear text-amber-500"></i>
                      <span>Schritt 4 von 9: Zusammenhalt &amp; Interne Konflikte</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">7. Zusammenhalt der Mitglieder ('cohesion')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.cohesion || ''}
                          onChange={e => updateDetail('cohesion', e.target.value)}
                          placeholder="Faktoren des Zusammenhalts (Ideologie, Loyalität, Geld, Religion)..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">8. Interne Konflikte &amp; Spannungen ('internalConflicts')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.internalConflicts || ''}
                          onChange={e => updateDetail('internalConflicts', e.target.value)}
                          placeholder="Machtkämpfe, Richtungsstreitigkeiten, interne Fraktionen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schritt 5 von 9: Beziehungen, Bündnisse & Wirtschafts-Verbindungen */}
                  <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-4 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-handshake text-amber-400 text-sm"></i>
                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Schritt 5 von 9: Beziehungen, Bündnisse &amp; Wirtschafts-Verbindungen
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <i className="fa-solid fa-link text-[9px]"></i>
                          Wirtschaftssystem verknüpft
                        </span>
                      </div>
                    </div>

                    {/* Diplomatische Grundstruktur */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Natürliche Verbündete ('allies')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.allies || ''}
                          onChange={e => updateDetail('allies', e.target.value)}
                          placeholder="Partner mit gleichen Werten oder Interessen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Rivalen ('rivals')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.rivals || ''}
                          onChange={e => updateDetail('rivals', e.target.value)}
                          placeholder="Wettbewerber um Macht, Territorium, Ressourcen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Feinde ('enemies')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.enemies || ''}
                          onChange={e => updateDetail('enemies', e.target.value)}
                          placeholder="Offene Feindschaft oder Feinde im Krieg..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Zweckallianzen ('convenienceAlliances')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.convenienceAlliances || ''}
                          onChange={e => updateDetail('convenienceAlliances', e.target.value)}
                          placeholder="Pragmatische oder brüchige Bündnisse..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ungelöste Konflikte ('unresolvedConflicts')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.unresolvedConflicts || ''}
                          onChange={e => updateDetail('unresolvedConflicts', e.target.value)}
                          placeholder="Schwelende Streitigkeiten, alte Rechnungen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Haltung zum Spieler / Abenteurern ('status')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.status || ''}
                          onChange={e => updateDetail('status', e.target.value)}
                          placeholder="Neutral, Verbündet, Misstrauisch, Feindselig..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                    </div>

                    {/* Spezifische Anbindung an das Wirtschafts- & Managementsystem */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-network-wired text-emerald-400 text-xs"></i>
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                            Wirtschafts- &amp; Handelsnetzwerk im Bündnissystem
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {factionHoldings.length} Betriebe zugeordnet
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Wirtschafts- &amp; Handelsabkommen ('economicAgreements')
                        </label>
                        <AutoExpandingTextarea
                          value={editForm.details?.economicAgreements || ''}
                          onChange={e => updateDetail('economicAgreements', e.target.value)}
                          placeholder="Beschreibung von Handelsverträgen, Zöllen, Monopolen, Rohstoff-Lieferkontrakten und finanziellen Bündnisabkommen..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Zugeordnete Betriebe</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">{factionHoldings.length} Gebäude / Gewerbe</span>
                          <span className="text-[10px] text-slate-500">Im Wirtschafts- &amp; Managementsystem registriert</span>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Registrierte Mitglieder</span>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            {editForm.details?.members?.length || 0} Personen
                          </span>
                          <span className="text-[10px] text-slate-500">Mit Personal- &amp; Aufgabenverknüpfung</span>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Finanzieller Status</span>
                          <span className="text-sm font-bold text-slate-200 font-mono truncate">
                            {editForm.details?.resourceEconomy ? editForm.details.resourceEconomy.substring(0, 24) : 'Nicht festgelegt'}
                          </span>
                          <span className="text-[10px] text-slate-500">Geld &amp; Ressourcen-Grundlage</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schritt 6 von 9: Ressourcen & Machtpotenzial */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-coins text-amber-500"></i>
                      <span>Schritt 6 von 9: Ressourcen &amp; Machtpotenzial</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Geld / Wirtschaft ('resourceEconomy')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceEconomy || ''}
                          onChange={e => updateDetail('resourceEconomy', e.target.value)}
                          placeholder="Finanzen, Schatzkammern, Einnahmequellen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Territorium ('resourceTerritory')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceTerritory || ''}
                          onChange={e => updateDetail('resourceTerritory', e.target.value)}
                          placeholder="Beherrschte Gebiete, Festungen, Posten..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Rohstoffe ('resourceMaterials')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceMaterials || ''}
                          onChange={e => updateDetail('resourceMaterials', e.target.value)}
                          placeholder="Erze, Magiekristalle, Bauholz, Getreide..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Mitglieder ('resourceMembers')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceMembers || ''}
                          onChange={e => updateDetail('resourceMembers', e.target.value)}
                          placeholder="Mitgliederzahl, Ausbildung, Rekrutierung..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Militär &amp; Kräfte ('resourceMilitary')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceMilitary || ''}
                          onChange={e => updateDetail('resourceMilitary', e.target.value)}
                          placeholder="Truppen, Schiffe, Elitekämpfer, Bewaffnung..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Politischer Einfluss ('resourceInfluence')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceInfluence || ''}
                          onChange={e => updateDetail('resourceInfluence', e.target.value)}
                          placeholder="Einfluss auf Gesetze, Höfe, Herrscher..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Wissen, Magie, Tech ('resourceKnowledge')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceKnowledge || ''}
                          onChange={e => updateDetail('resourceKnowledge', e.target.value)}
                          placeholder="Arkane Forschung, Spionage, Artefakte..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Handelsnetzwerk ('resourceTrade')</label>
                        <AutoExpandingTextarea
                          value={editForm.details?.resourceTrade || ''}
                          onChange={e => updateDetail('resourceTrade', e.target.value)}
                          placeholder="Karawanenrouten, Handelsposten, Zölle..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schritt 7 von 9: Betriebe & Besitztümer (Wirtschafts- & Managementsystem) */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-building-user text-amber-400 text-sm"></i>
                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Schritt 7 von 9: Betriebe &amp; Besitztümer (Wirtschafts- &amp; Managementsystem)
                        </h5>
                        <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
                          {factionHoldings.length}
                        </span>
                      </div>
                    </div>

                    {factionHoldings.length === 0 ? (
                      <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-lg text-center text-xs text-slate-400 flex flex-col gap-1.5 items-center">
                        <span className="font-semibold text-slate-300">Keine Betriebe dieser Fraktion zugeordnet.</span>
                        <span className="text-[11px] text-slate-400 max-w-md">
                          Die Zuordnung, Koppelung und Erstellung von Betrieben erfolgt direkt im <strong className="text-amber-400 font-semibold">Wirtschafts- &amp; Managementsystem</strong> unter den Betriebsstammdaten (Eigentümer / Besitzer).
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {factionHoldings.map((holding: any, idx: number) => {
                          return (
                            <div key={holding.id || idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200">{holding.name}</span>
                                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                                  {holding.type || 'Betrieb'} (Stufe {holding.level || 1})
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                                <div>Standort: <span className="text-slate-200">{holding.locationName || holding.location || 'Unbekannt'}</span></div>
                                <div>Einnahmen: <span className="text-emerald-400 font-mono">+{holding.incomePerInterval || 0} G/Monat</span></div>
                                <div>Unterhalt: <span className="text-rose-400 font-mono">-{holding.upkeepPerInterval || 0} G/Monat</span></div>
                                <div>Mitarbeiter: <span className="text-slate-200 font-mono">{holding.staffCount || 0}</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Schritt 8 von 9: Personal- & Mitgliederverwaltung (Wirtschafts- & Managementsystem) */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-users-rectangle text-amber-400 text-sm"></i>
                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Schritt 8 von 9: Personal- &amp; Mitgliederverwaltung (Wirtschafts- &amp; Managementsystem)
                        </h5>
                        <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
                          {effectiveMembers.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddMember}
                          className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <i className="fa-solid fa-user-plus text-[11px]"></i>
                          <span>Mitglied hinzufügen</span>
                        </button>
                      </div>
                    </div>

                    {effectiveMembers.length === 0 ? (
                      <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-lg text-center text-xs text-slate-500 italic">
                        Keine Mitglieder vorhanden. Charaktere im Codex mit dieser Fraktion werden hier automatisch angezeigt. Klicke auf "Mitglied hinzufügen", um weitere Personen manuell einzutragen.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {effectiveMembers.map((member, index) => (
                          <div key={member.id || index} className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-3 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              
                              {/* Name & Codex Link */}
                              <div className="md:col-span-4 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Name / Charakter
                                  </label>
                                </div>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={member.name || ''}
                                    onChange={e => handleUpdateMember(index, { name: e.target.value })}
                                    placeholder="Name des Mitglieds..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                                  />
                                  <select
                                    value={member.characterId || (member.name && member.name.trim().toLowerCase() === effectivePlayerName.toLowerCase() ? '__player__' : '')}
                                    onChange={e => {
                                      if (e.target.value === '__player__') {
                                        handleUpdateMember(index, {
                                          characterId: '__player__',
                                          name: effectivePlayerName,
                                          job: effectivePlayerRole || member.job || 'Hauptcharakter'
                                        });
                                        return;
                                      }
                                      const selectedChar = lore.find(l => l.id === e.target.value);
                                      const charRole = selectedChar ? (selectedChar.details?.role || selectedChar.details?.appearance?.role || selectedChar.details?.job || '') : '';
                                      handleUpdateMember(index, {
                                        characterId: e.target.value,
                                        name: selectedChar ? selectedChar.title : member.name,
                                        job: charRole || member.job
                                      });
                                    }}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-400 outline-none focus:border-amber-500 max-w-[130px] truncate"
                                    title="Charakter aus Codex oder Nutzer übernehmen"
                                  >
                                    <option value="">Aus Codex...</option>
                                    <option value="__player__">
                                      {effectivePlayerName} {effectivePlayerRole ? `(${effectivePlayerRole})` : '(Nutzer)'}
                                    </option>
                                    {lore.filter(l => (l.category === 'Charaktere' || l.category === 'Gegner') && l.id !== '__player_knowledge__').map(c => {
                                      const r = c.details?.role || c.details?.appearance?.role || c.details?.job;
                                      return (
                                        <option key={c.id} value={c.id}>
                                          {c.title} {r ? `(${r})` : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              {/* Job / Funktion */}
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Job / Funktion
                                </label>
                                <input
                                  type="text"
                                  value={member.job || ''}
                                  onChange={e => handleUpdateMember(index, { job: e.target.value })}
                                  placeholder="z.B. Verwalter, Wache, Inhaberin..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                                />
                              </div>

                              {/* Seit wann in der Fraktion */}
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Mitglied seit
                                </label>
                                <input
                                  type="text"
                                  value={member.joinedDate || ''}
                                  onChange={e => handleUpdateMember(index, { joinedDate: e.target.value })}
                                  placeholder="z.B. Seit Gründung / Seit 3 Jahren..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                                />
                              </div>

                              {/* Status & Entfernen */}
                              <div className="md:col-span-2 flex items-center justify-between gap-2">
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Status
                                  </label>
                                  <input
                                    type="text"
                                    value={member.status || 'Aktiv'}
                                    onChange={e => handleUpdateMember(index, { status: e.target.value })}
                                    placeholder="z.B. Aktiv..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(index)}
                                  className="mt-4 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                                  title="Mitglied entfernen"
                                >
                                  <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                              </div>

                            </div>

                            {/* Aufgaben (Wirtschafts- & Managementsystem) */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Aufgaben (Wirtschafts- &amp; Managementsystem)
                              </label>
                              <AutoExpandingTextarea
                                value={member.tasks || ''}
                                onChange={e => handleUpdateMember(index, { tasks: e.target.value })}
                                placeholder="Aufgaben und Pflichten für das Wirtschafts- und Managementsystem..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[45px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Schritt 9 von 9: Wirtschaftliches Auftrags- & Verwaltungssystem */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <i className="fa-solid fa-file-signature text-amber-500"></i>
                      <span>Schritt 9 von 9: Wirtschaftliches Auftrags- &amp; Verwaltungssystem</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Fraktions-Direktiven &amp; Wirtschaftsaufträge ('economyDirectives')
                        </label>
                        <AutoExpandingTextarea
                          value={editForm.details?.economyDirectives || ''}
                          onChange={e => updateDetail('economyDirectives', e.target.value)}
                          placeholder="Strategische Vorgaben, laufende Handelsaufträge und Produktionsanweisungen..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Offene Verwaltungsentscheidungen ('pendingDecisions')
                        </label>
                        <AutoExpandingTextarea
                          value={editForm.details?.pendingDecisions || ''}
                          onChange={e => updateDetail('pendingDecisions', e.target.value)}
                          placeholder="Ausstehende Beschlüsse zur Investition, Bündniserweiterung oder Infrastruktur..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentCategory === 'Gegenstände' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gegenstandstyp</label>
                    <select
                      value={editForm.details?.itemType || ITEM_TYPE_OPTIONS[0]}
                      onChange={e => updateDetail('itemType', e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    >
                      {ITEM_TYPE_OPTIONS.map(it => (
                        <option key={it} value={it}>{it}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seltenheit</label>
                    <input
                      type="text"
                      value={editForm.details?.rarity || ''}
                      onChange={e => updateDetail('rarity', e.target.value)}
                      placeholder="z.B. Legendär, Selten"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Besonderer Effekt / Wert</label>
                    <input
                      type="text"
                      value={editForm.details?.effect || ''}
                      onChange={e => updateDetail('effect', e.target.value)}
                      placeholder="Wirkung oder Goldwert"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {(currentCategory === 'Story & Quests' || (currentCategory as string) === 'Events') && (
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span>Station hinzufügen oder bearbeiten</span>
                      {editingStepId && (
                        <button onClick={handleCancelEditStep} className="text-[10px] text-rose-400 hover:text-rose-300">
                          Abbrechen
                        </button>
                      )}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Titel der Station</label>
                        <input
                          type="text"
                          value={newEventStepTitle}
                          onChange={e => setNewEventStepTitle(e.target.value)}
                          placeholder="z.B. Ankunft im Hafen"
                          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Typ</label>
                          <select
                            value={newEventStepType}
                            onChange={e => setNewEventStepType(e.target.value as any)}
                            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="story">Story</option>
                            <option value="quest">Quest</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Zweig</label>
                          <select
                            value={newEventStepBranch}
                            onChange={e => setNewEventStepBranch(e.target.value as any)}
                            className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="main">Hauptstrang</option>
                            <option value="side">Nebenstrang</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Ereignis-Beschreibung</label>
                      <AutoExpandingTextarea
                        value={newEventStepText}
                        onChange={e => setNewEventStepText(e.target.value)}
                        placeholder="Was passiert an dieser Station..."
                        className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddManualStep}
                        disabled={!newEventStepText.trim()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <i className="fa-solid fa-plus"></i>
                        <span>{editingStepId ? 'Station aktualisieren' : 'Station anfügen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Steps */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300">Ablauf der Kampagne ({(editForm.details?.eventSteps || []).length} Stationen):</span>
                    {(editForm.details?.eventSteps || []).map((step: any, idx: number) => (
                      <div
                        key={step.id}
                        className={`bg-slate-950 border p-3 rounded-xl flex items-center justify-between gap-3 ${
                          step.status === 'happened' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStepStatus(step.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                              step.status === 'happened'
                                ? 'bg-emerald-600 border-emerald-400 text-white'
                                : 'bg-slate-900 border-slate-700 text-slate-500'
                            }`}
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>

                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">{idx + 1}. {step.title}</span>
                            <span className="text-[11px] text-slate-400">{step.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 text-xs"
                          >
                            <i className="fa-solid fa-arrow-up"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, idx + 1)}
                            disabled={idx === (editForm.details?.eventSteps || []).length - 1}
                            className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 text-xs"
                          >
                            <i className="fa-solid fa-arrow-down"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditStep(step)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 text-xs"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 text-xs"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secrets Stages for Forbidden Knowledge */}
              <div className="bg-slate-950/60 border border-purple-900/30 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                  <i className="fa-solid fa-eye-slash text-purple-400"></i>
                  <span>Geheimnis-Stufen (Verborgenes Wissen)</span>
                </span>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-purple-400/80 font-bold uppercase">Stufe 1 (Gerüchte)</label>
                    <AutoExpandingTextarea
                      value={editForm.secretsStage1 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
                      placeholder="Was als Gerücht bekannt ist..."
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400/80 font-bold uppercase">Stufe 2 (Eingeweiht)</label>
                    <AutoExpandingTextarea
                      value={editForm.secretsStage2 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
                      placeholder="Was Eingeweihte wissen..."
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400/80 font-bold uppercase">Stufe 3 (Die Wahrheit)</label>
                    <AutoExpandingTextarea
                      value={editForm.secretsStage3 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
                      placeholder="Die absolute Wahrheit..."
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleDelete(isEditing)}
                    className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold flex items-center gap-1.5 mr-auto transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>Löschen</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setEditForm({ category: ((activeCategory as string) === 'Verhüllung' ? 'Charaktere' : (activeCategory as string) === 'Weltkarte' ? 'Weltregeln' : activeCategory) as LoreCategory });
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!editForm.title || !editForm.description}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/20 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{isEditing ? 'Eintrag aktualisieren' : 'Im Codex speichern'}</span>
                </button>
              </div>
            </div>

            {/* List of Existing Lore Entries for this category */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Gespeicherte Einträge ({filteredLore.length})
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Einträge filtern..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500 w-36 sm:w-48"
                />
              </div>

              {filteredLore.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-500 italic">
                  Keine Einträge vorhanden.
                </div>
              ) : (activeCategory === 'Charaktere' || activeCategory === 'Gegner') ? (
                <div className="flex flex-col gap-4">
                  {groupedLore.map(([factionName, items]) => (
                    <div key={factionName} className="flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-1 flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span>{factionName}</span>
                        <span className="text-slate-500 text-[10px]">({items.length})</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {items.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleEdit(item)}
                            className={`bg-slate-900 border px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isEditing === item.id 
                                ? 'border-amber-500 bg-amber-950/30 text-amber-300 font-bold shadow-md' 
                                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                            }`}
                          >
                            <span className="text-xs font-semibold truncate flex-1">
                              {item.title || 'Unbenannter Eintrag'}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 text-xs p-1 transition-colors"
                                title="Eintrag löschen"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredLore.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleEdit(item)}
                      className={`bg-slate-900 border px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isEditing === item.id 
                          ? 'border-amber-500 bg-amber-950/30 text-amber-300 font-bold shadow-md' 
                          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate flex-1">
                        {item.title || 'Unbenannter Eintrag'}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs p-1 transition-colors"
                          title="Eintrag löschen"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoreDatabaseView;
