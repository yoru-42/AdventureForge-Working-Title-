
import React, { useState, useEffect, useRef } from 'react';
import { Adventure, WorldSetting, Character, NPC, GameViewMode, StatusElement, UserProfile, LoreEntry, TechniqueRuleItem, StructuredInventory, CharacterPowerSource, CharacterRelationship, PersonalityTraits } from '../types';
import { GeminiService } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import ProfessionSelect from './ProfessionSelect';
import CompetenceProfileEditor from './CompetenceProfileEditor';
import { migrateLegacyProfessionData } from '../services/professionCompetencyService';
import * as LucideIcons from 'lucide-react';
import RelationshipDetailEditor from './RelationshipDetailEditor';
import { syncLoreWithReciprocalRelationships, removeCounterpartRelationshipFromLore } from '../lib/relationshipHelper';
import LoreDatabaseView, { TRANSPORTS, TERRAIN_PRESETS } from './LoreDatabaseView';
import { NauticalMapBackground } from './NauticalMapBackground';
import { autoCalculateAppearance } from '../utils/appearance';
import { EyeColorEditor } from './EyeColorEditor';
import { BodySilhouette } from './BodySilhouette';
import { getTransformationCardSettings } from './TransformationIntensityCard';
import { updateStandardFormFromMetamorphosisThresholds } from './bodyConditionResolver';
import { PersonalityTraitsEditor } from './PersonalityTraitsEditor';
import { PERSONALITY_ARCHETYPES, PERSONALITY_ARCHETYPE_OPTIONS, applyArchetypeToTraits } from './personalityArchetypesData';
import CampaignPowerSettings from './CampaignPowerSettings';
import CharacterPowerRadar from './CharacterPowerRadar';
import { LocationSelector } from './LocationSelector';
import { CivilizationManager } from './CivilizationManager';
import { RegionsManager } from './RegionsManager';
import { PlacesManager } from './PlacesManager';
import { WorldNpcsManager } from './WorldNpcsManager';
import { WorldStoryManager } from './WorldStoryManager';
import { WorldMapEditor } from './WorldMapEditor';
import { InteractiveWorldMap } from './InteractiveWorldMap';
import { TacticalCanvasEditor } from './TacticalCanvasEditor';
import { EconomyManager } from './EconomyManager';
import { normalizeOnePieceWorldGeometry, normalizeWorldGeometry, formatDisplayLocationName } from '../utils/mapUtils';
import { getOnePieceTerritories } from '../utils/onePiecePreset';
import { 
  EP_DEFAULT_PARAMETERS, 
  EP_DEFAULT_STAT_ALLOCATIONS, 
  EP_DEFAULT_COST_RESOURCES, 
  EP_DEFAULT_HEALTH_NAMES, 
  EP_DEFAULT_COST_NAMES,
  createEpDefaultWorldSettings
} from '../lib/progressionDefaults';

interface Props {
  onSave: (adventure: Adventure) => void;
  onAutoSave?: (adventure: Adventure) => void;
  onCancel: () => void;
  initialData?: Adventure;
  mode: GameViewMode;
  userId: string;
  userProfile?: UserProfile;
}

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Nicht-Binär", "Androgyn", "Unbekannt"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Drahtig", "Kurvig", "Stämmig", "Hager"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const TAG_OPTIONS = [
  "Fantasy", "Sci-Fi", "Horror", "Cyberpunk", "Steampunk", "Post-Apokalyptisch", 
  "Mittelalter", "Zukunft", "Gegenwart", "Romantik", "Krimi", "Mystery", "Action", "Abenteuer",
  "Anime", "Manga"
];

const HUD_PRESETS: Record<string, { label: string, value: string }[]> = {
  "Klassisch": [
    { label: "Uhrzeit", value: "12:00" },
    { label: "Standort", value: "Startgebiet" },
    { label: "Vermögen", value: "100 Gold" }
  ],
  "Fokus Status & Emotion": [
    { label: "Uhrzeit", value: "12:00" },
    { label: "Standort", value: "Startgebiet" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Körperliche Veränderungen", value: "Keine" },
    { label: "Aktuelle Emotion", value: "Ruhig" },
    { label: "Tonart", value: "Normal" }
  ],
  "RPG": [
    { label: "Uhrzeit", value: "12:00" },
    { label: "Standort", value: "Taverne" },
    { label: "HP", value: "100/100" },
    { label: "MP", value: "50/50" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Vermögen", value: "10 Gold" },
    { label: "Level", value: "1" }
  ],
  "Körper & Transformation": [
    { label: "Uhrzeit", value: "12:00" },
    { label: "Standort", value: "Startgebiet" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Körperliche Veränderungen", value: "Keine" },
    { label: "Verwandlungsstufe", value: "0%" },
    { label: "Point of No Return", value: "80%" }
  ],
  "Metamorphose & Fluch": [
    { label: "Uhrzeit", value: "12:00" },
    { label: "Standort", value: "Arkaner Tempel" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Körperliche Veränderungen", value: "Keine" },
    { label: "Transformation", value: "0%" },
    { label: "Flüche & Segen", value: "Inaktiv" }
  ],
  "Survival": [
    { label: "Uhrzeit", value: "08:00" },
    { label: "Standort", value: "Zuflucht" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Hunger", value: "Satt" },
    { label: "Durst", value: "Kein Durst" },
    { label: "Temperatur", value: "Normal" }
  ],
  "Sci-Fi": [
    { label: "Uhrzeit", value: "06:00" },
    { label: "Standort", value: "Raumstation" },
    { label: "Körperlicher Zustand", value: "Gesund" },
    { label: "Sauerstoff", value: "100%" },
    { label: "Energie", value: "Voll" },
    { label: "Vermögen", value: "500 Credits" }
  ]
};

const calculateCupFromChest = (chestStr: string): string => {
  const val = parseInt(chestStr.replace(/\D/g, ''));
  if (isNaN(val)) return "-";
  if (val < 78) return "AA";
  if (val <= 82) return "A";
  if (val <= 87) return "B";
  if (val <= 92) return "C";
  if (val <= 97) return "D";
  if (val <= 102) return "E";
  if (val <= 107) return "F";
  if (val <= 112) return "G";
  return "H";
};

const calculateChestFromCup = (cup: string): string => {
  const map: Record<string, string> = {
    "AA": "75", "A": "80", "B": "85", "C": "90", "D": "95", "E": "100", "F": "105", "G": "110", "H": "115"
  };
  return map[cup] || "";
};

const progressionRatesConfig: Record<string, Array<{ id: string; label: string; desc: string; icon: string }>> = {
  ep: [
    { id: 'slow', label: 'Herausfordernd (0.5x EP)', desc: 'Geringer EP-Gewinn. Ideal für langsame, hardcore-orientierte Kampagnen mit Fokus auf Grind.', icon: '' },
    { id: 'normal', label: 'Klassisch (1.0x EP)', desc: 'Ausgewogene, klassische RPG-Progression. Angenehmes Tempo für die meisten Spieler.', icon: '' },
    { id: 'fast', label: 'Dynamisch (1.5x EP)', desc: 'Erhöhter EP-Gewinn. Schnellerer Fortschritt, perfekt für story-fokussiertes Gameplay.', icon: '' },
    { id: 'extreme', label: 'Turbo (2.5x EP)', desc: 'Kräfte und Level explodieren förmlich. Perfekt für epische, rasante Abenteuer.', icon: '' },
  ],
  training: [
    { id: 'slow', label: 'Zähes Training', desc: 'Nur harte, repetitive Übungen und intensive Narration steigern die Werte spürbar.', icon: '' },
    { id: 'normal', label: 'RP-Wachstum', desc: 'Ausgewogene Steigerung. Belohnt regelmäßiges, sinnvolles Ausspielen von Training.', icon: '' },
    { id: 'fast', label: 'Schnelle Auffassungsgabe', desc: 'Werte steigen rasch durch kurze Trainingseinheiten oder praktische Übung.', icon: '' },
    { id: 'extreme', label: 'Genie-Modus', desc: 'Eine einzige gute Übung oder Aktion schaltet sofort enorme Kraftsteigerungen frei.', icon: '' },
  ],
  milestone: [
    { id: 'slow', label: 'Erzählerische Meilensteine', desc: 'Steigerung nur nach dem Abschluss von gewaltigen Story-Kapiteln oder Arcs.', icon: '' },
    { id: 'normal', label: 'Kapitelweise Progression', desc: 'Erreichte Quests und wichtige Meilensteine gewähren verlässliche Level-Ups.', icon: '' },
    { id: 'fast', label: 'Häufige Checkpoints', desc: 'Jeder nennenswerte Erfolg oder gewonnene Kampf belohnt deine Werte direkt.', icon: '' },
    { id: 'extreme', label: 'Immer im Fluss', desc: 'Konstante, unaufhaltsame Progression nach jedem kleinen Ereignis.', icon: '' },
  ],
  static: [
    { id: 'slow', label: 'Felsenfest (Gesperrt)', desc: 'Die Werte sind absolut fixiert. Keine Veränderung im gesamten Spielverlauf möglich.', icon: '' },
    { id: 'normal', label: 'Konservative Verteilung', desc: 'Talentpunkte oder Umverteilungen kosten sehr viel Aufwand, Gold oder Tribut.', icon: '' },
    { id: 'fast', label: 'Ausgewogene Flexibilität', desc: 'Verteile freie Talentpunkte komfortabel beim Erreichen neuer Ränge.', icon: '' },
    { id: 'extreme', label: 'Flexibler Umbau', desc: 'Jederzeit freie, kostenlose Umverteilung aller Werte für maximale Build-Freiheit.', icon: '' },
  ],
};

const AdventureEditor: React.FC<Props> = ({ onSave, onAutoSave, onCancel, initialData, mode, userId, userProfile }) => {
  const adventureIdRef = useRef<string>(mode === GameViewMode.JOIN_CUSTOM_CHAR ? `adv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` : (initialData?.id || `adv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`));
  const [step, setStep] = useState(mode === GameViewMode.JOIN_CUSTOM_CHAR ? 6 : 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [isGeneratingCampaignSettings, setIsGeneratingCampaignSettings] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [playerGeneratingExpression, setPlayerGeneratingExpression] = useState<string | null>(null);
  const [isGeneratingNpcs, setIsGeneratingNpcs] = useState(false);
  const [generatingNpcId, setGeneratingNpcId] = useState<string | null>(null);
  const [generatingPortraitId, setGeneratingPortraitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const handleCancelClick = () => {
    if (mode === GameViewMode.EDIT_WORLD) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [isGeneratingEconomy, setIsGeneratingEconomy] = useState(false);
  
  // States for Step 4 (Weltschöpfung / 6 Weltschöpfungs-Regeln)
  const [isGeneratingWorldMap, setIsGeneratingWorldMap] = useState(false);
  const [isGeneratingGeography, setIsGeneratingGeography] = useState(false);
  const [isGeneratingCivilization, setIsGeneratingCivilization] = useState(false);
  const [step4MainTab, setStep4MainTab] = useState<'world_phases' | 'rules1to5' | 'overview' | 'world_rules'>('world_phases');
  const [activePhase, setActivePhase] = useState<number>(1);
  const [creationRuleTab, setCreationRuleTab] = useState<'struktur' | 'regionen' | 'beziehungen' | 'gelaende' | 'verbindungen' | 'regeln'>('struktur');
  
  // Custom Map Builder States
  const [mapTool, setMapTool] = useState<'inspect' | 'add_marker' | 'add_connection' | 'delete'>('inspect');
  const [selectedMarkerForConnection, setSelectedMarkerForConnection] = useState<{ id: string; type: string; name: string; x: number; y: number } | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [newMarkerForm, setNewMarkerForm] = useState({
    show: false,
    x: 50,
    y: 50,
    name: '',
    category: 'place' as 'civilization' | 'region' | 'place' | 'npc' | 'story' | 'terrain',
    type: 'Stadt',
    description: '',
    detail1: '',
    detail2: '',
  });
  const [activeAbilityTab, setActiveAbilityTab] = useState<string>('Techniken');
  const [activePowerSourceIdx, setActivePowerSourceIdx] = useState<number>(0);
  const [openApplicationsDropdown, setOpenApplicationsDropdown] = useState<string | null>(null);
  
  // States for interactive world map in Overview Tab (Codex Weltkarte style)
  const [mapZoomLevel, setMapZoomLevel] = useState<'macro' | 'meso' | 'micro' | 'building'>('macro');
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [selectedMesoId, setSelectedMesoId] = useState<string | null>(null);
  const [selectedMicroId, setSelectedMicroId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mapScale, setMapScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [travelStartNodeId, setTravelStartNodeId] = useState<string | null>(null);
  const [travelEndNodeId, setTravelEndNodeId] = useState<string | null>(null);
  const [selectedTransportId, setSelectedTransportId] = useState<string>('foot');
  const [manualX1, setManualX1] = useState<number>(20);
  const [manualY1, setManualY1] = useState<number>(20);
  const [manualX2, setManualX2] = useState<number>(80);
  const [manualY2, setManualY2] = useState<number>(80);
  const [newRegionForm, setNewRegionForm] = useState({ title: '', type: '', biome: '', climate: '', x: 50, y: 50, description: '' });
  const [newRelationshipForm, setNewRelationshipForm] = useState({ fromPlace: '', toPlace: '', direction: '', distance: '' });
  const [newTerrainForm, setNewTerrainForm] = useState({ type: 'Gebirge' as 'Gebirge' | 'Wald' | 'Fluss' | 'See', name: '', description: '', x: 50, y: 50 });
  const [newConnectionForm, setNewConnectionForm] = useState({ fromPlace: '', toPlace: '', type: '', duration: '' });
  const [newRuleForm, setNewRuleForm] = useState({ title: '', scope: '', restrictedFrom: '', description: '' });
  const [customTag, setCustomTag] = useState<string>('');
  const [playerSmartFill, setPlayerSmartFill] = useState<string>('');
  const [isSmartFillingChar, setIsSmartFillingChar] = useState(false);
  const [keepExistingPlayerDetails, setKeepExistingPlayerDetails] = useState<boolean>(true);
  
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialData?.world?.era) {
      return initialData.world.era.split(',').map(t => t.trim()).filter(t => t !== '');
    }
    return [];
  });

  const [persistentCustomTags, setPersistentCustomTags] = useState<string[]>(() => {
    let locals: string[] = [];
    try {
      const stored = localStorage.getItem('persistent_custom_tags');
      if (stored) locals = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    const initialTags = initialData?.world?.era 
      ? initialData.world.era.split(',').map(t => t.trim()).filter(t => t !== '')
      : [];
    const merged = Array.from(new Set([...locals, ...initialTags.filter(t => !TAG_OPTIONS.includes(t))]));
    return merged;
  });

  const [tagUsageCounts, setTagUsageCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('tag_selection_counts');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
      const updatedCounts = {
        ...tagUsageCounts,
        [tag]: (tagUsageCounts[tag] || 0) + 1
      };
      setTagUsageCounts(updatedCounts);
      try {
        localStorage.setItem('tag_selection_counts', JSON.stringify(updatedCounts));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddCustomTagState = (tagStr: string) => {
    const trimmed = tagStr.trim();
    if (!trimmed) return;
    
    let updatedCustom = [...persistentCustomTags];
    if (!persistentCustomTags.includes(trimmed)) {
      updatedCustom = [...persistentCustomTags, trimmed];
      setPersistentCustomTags(updatedCustom);
      try {
        localStorage.setItem('persistent_custom_tags', JSON.stringify(updatedCustom));
      } catch (e) {
        console.error(e);
      }
    }

    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    
    const updatedCounts = {
      ...tagUsageCounts,
      [trimmed]: (tagUsageCounts[trimmed] || 0) + 1
    };
    setTagUsageCounts(updatedCounts);
    try {
      localStorage.setItem('tag_selection_counts', JSON.stringify(updatedCounts));
    } catch (e) {
      console.error(e);
    }
  };

  const getSortedTags = () => {
    const uniqueTags = Array.from(new Set([...TAG_OPTIONS, ...persistentCustomTags, ...selectedTags]));
    return uniqueTags.sort((a, b) => {
      const countA = tagUsageCounts[a] || 0;
      const countB = tagUsageCounts[b] || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return a.localeCompare(b);
    });
  };

  const sortedTags = getSortedTags();
  const top10Tags = sortedTags.slice(0, 10);
  const remainingTags = sortedTags.slice(10);
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [prologue, setPrologue] = useState(initialData?.prologue ?? '');
  const [firstMessage, setFirstMessage] = useState(initialData?.firstMessage ?? '');
  const [isGeneratingFirstMsg, setIsGeneratingFirstMsg] = useState(false);
  const [isGeneratingPrologue, setIsGeneratingPrologue] = useState(false);
  const [expandedNpcId, setExpandedNpcId] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | undefined>(initialData?.backgroundImage);
  const [statusElements, setStatusElements] = useState<StatusElement[]>(() => {
    const rawStatus = initialData?.statusElements ?? HUD_PRESETS["Klassisch"].map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) }));
    const playerLoc = initialData?.player?.appearance?.currentLocation;
    if (playerLoc) {
      const locIdx = rawStatus.findIndex(s => (s.label || '').toLowerCase().includes('standort') || (s.label || '').toLowerCase().includes('ort'));
      if (locIdx !== -1) {
        if (!rawStatus[locIdx].value) {
          rawStatus[locIdx] = { ...rawStatus[locIdx], value: playerLoc };
        }
      } else {
        rawStatus.push({
          id: Math.random().toString(36).substr(2, 9),
          label: 'Standort',
          value: playerLoc
        });
      }
    }
    return rawStatus;
  });

  const [structuredInventory, setStructuredInventory] = useState<StructuredInventory | undefined>(initialData?.structuredInventory);
  const [isExtractingInventory, setIsExtractingInventory] = useState(false);
  
  const [loreDatabase, setLoreDatabase] = useState<LoreEntry[]>(() => {
    let initialLore = [...(initialData?.loreDatabase || [])].filter(l => l.category !== 'Orte');
    const initialNpcs = initialData?.npcs || [];
    
    // Migrate NPCs to LoreDatabase if they aren't there
    initialNpcs.forEach(npc => {
      const exists = initialLore.find(l => l.id === npc.id || l.title === npc.name);
      if (!exists) {
        initialLore.push({
          id: npc.id || Math.random().toString(36).substr(2, 9),
          category: 'Charaktere',
          title: npc.name,
          description: npc.bio,
          isUnlocked: true,
          image: npc.image,
          details: {
            role: npc.role,
            gender: npc.appearance?.gender,
            age: npc.appearance?.age,
            build: npc.appearance?.build,
            hairColor: npc.appearance?.hairColor,
            eyeColor: npc.appearance?.eyeColor,
            cupSize: npc.appearance?.cupSize,
            height: npc.appearance?.height,
            measurements: npc.appearance?.measurements,
            origin: npc.appearance?.origin,
            family: npc.appearance?.family,
            faction: npc.appearance?.faction,
            race: npc.appearance?.race,
            raceFeatures: npc.appearance?.raceFeatures,
            outfit: npc.appearance?.outfit,
            goal: npc.goal,
            skills: npc.skills,
            isHostile: npc.isHostile,
            personality: (npc as any).personality || '',
            currentSituation: (npc as any).currentSituation || ''
          }
        });
      }
    });

    // Migrate abilities for all lore entries as well (from 'Passive Fähigkeiten' or empty to 'Techniken')
    return initialLore.map(entry => {
      if (entry.details?.abilities && Array.isArray(entry.details.abilities)) {
        return {
          ...entry,
          details: {
            ...entry.details,
            abilities: entry.details.abilities.map((a: any) => {
              if (!a.category || a.category === 'Passive Fähigkeiten') {
                return { ...a, category: 'Techniken' };
              }
              return a;
            })
          }
        };
      }
      return entry;
    });
  });

  const [world, setWorld] = useState<WorldSetting>(() => {
    const epDefaults = createEpDefaultWorldSettings();
    const w: WorldSetting = initialData?.world ?? {
      title: '',
      description: '',
      era: '',
      tone: 'Düster & Ernst',
      isHeroic: true,
      dramaLevel: 'Mittel',
      regionMarkers: [],
      civilizationMarkers: [],
      placeMarkers: [],
      terrains: [],
      borders: [],
      techniqueProgressionLogic: 'ep',
      techniqueProgressionRate: 'normal',
      techniqueRulesList: [],
      campaignPowerSettings: epDefaults.campaignPowerSettings,
      customStatAllocations: epDefaults.customStatAllocations,
      costResources: epDefaults.costResources,
      healthPowerNames: epDefaults.healthPowerNames,
      costPowerNames: epDefaults.costPowerNames,
      healthLabel: epDefaults.healthLabel,
      costLabel: epDefaults.costLabel,
      mapConfig: {
        continentStencil: 'none',
        coastlineStyle: 'rugged',
        mountainStyle: 'young',
        riverStyle: 'branched',
        biomeStyle: 'grassland',
        mapStyle: 'minimalist',
        decorations: [],
        mapWidth: 100,
        mapHeight: 100
      }
    };
    if (!w.techniqueRulesList) {
      w.techniqueRulesList = [];
    }
    let resultWorld = w;
    if (initialData?.world) {
      resultWorld = normalizeOnePieceWorldGeometry(w);
    }
    return normalizeWorldGeometry(resultWorld);
  });

  const [mapViewerMode, setMapViewerMode] = useState<'editor' | 'viewer'>('editor');

  // Automatisches Vorladen der Profildaten für neue Abenteuer
  const getDefaultPlayerState = (): Character => {
    let p: Character;
    if (initialData?.player) {
      p = { ...initialData.player };
      // Synchronize role and profession so they always match
      const synchronizedRole = p.role || p.profession || '';
      p.role = synchronizedRole;
      p.profession = synchronizedRole;
    } else if (userProfile) {
      const prefRole = userProfile.preferredRole || '';
      p = {
        name: userProfile.name,
        role: prefRole,
        profession: prefRole,
        personality: '',
        bio: userProfile.bio,
        currentSituation: '',
        goal: '',
        appearance: {
          hairColor: userProfile.appearance.hairColor,
          eyeColor: userProfile.appearance.eyeColor,
          age: userProfile.appearance.age,
          build: userProfile.appearance.build,
          gender: userProfile.appearance.gender,
          cupSize: userProfile.appearance.cupSize,
          raceFeatures: userProfile.appearance.raceFeatures || '',
          outfit: '',
          looks: ''
        },
        attributes: [
          { name: 'Gesundheit', value: 100, max: 100 },
          { name: 'Mana', value: 50, max: 50 }
        ]
      };
    } else {
      p = {
        name: '',
        role: '',
        personality: '',
        bio: '',
        currentSituation: '',
        goal: '',
        appearance: {
          hairColor: '',
          eyeColor: '',
          age: '',
          build: 'Schlank',
          gender: 'Weiblich',
          cupSize: '',
          raceFeatures: '',
          outfit: '',
          looks: ''
        },
        attributes: [
          { name: 'Gesundheit', value: 100, max: 100 },
          { name: 'Mana', value: 50, max: 50 }
        ]
      };
    }

    if (p.abilities && p.abilities.length > 0) {
      p.abilities = p.abilities.map(a => {
        if (!a.category || a.category === 'Passive Fähigkeiten') {
          return { ...a, category: 'Techniken' };
        }
        return a;
      });
    }

    // Synchronize player currentLocation with statusElements or active location if missing/empty
    if (!p.appearance.currentLocation) {
      const initialStatus = initialData?.statusElements ?? HUD_PRESETS["Klassisch"];
      const locElem = initialStatus.find(s => (s.label || '').toLowerCase().includes('standort') || (s.label || '').toLowerCase().includes('ort'));
      if (locElem && locElem.value) {
        p.appearance.currentLocation = locElem.value;
      } else {
        const activeOrt = initialData?.loreDatabase?.find(l => l.category === 'Orte' && l.details?.isActiveTarget)
          || initialData?.loreDatabase?.find(l => l.category === 'Orte');
        if (activeOrt?.title) {
          p.appearance.currentLocation = activeOrt.title;
        }
      }
    }

    return migrateLegacyProfessionData(p);
  };

  const [player, setPlayer] = useState<Character>(getDefaultPlayerState());
  const [playerCharTab, setPlayerCharTab] = useState<'profil' | 'beziehungen' | 'kampffaehigkeiten' | 'beruf_talente'>('profil');

  const [step4SubTab, setStep4SubTab] = useState<'interactive' | 'worldmap' | 'tactical'>('interactive');
  const [customCombatState, setCustomCombatState] = useState<any>(() => {
    return initialData?.combatState || {
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
  });
  const playerPowerSourcesList: CharacterPowerSource[] = player.powerSources && player.powerSources.length > 0
    ? player.powerSources
    : [
        {
          id: 'default',
          source: player.powerSource || '',
          cost: player.powerCost || '',
          powerName: player.powerName || '',
          powerDescription: player.powerDescription || ''
        }
      ];

  const currentPowerSourceIdx = Math.min(activePowerSourceIdx, playerPowerSourcesList.length - 1);
  const activePowerSource = (playerPowerSourcesList[currentPowerSourceIdx] || playerPowerSourcesList[0] || {}) as CharacterPowerSource;

  const [newRelPlayerTarget, setNewRelPlayerTarget] = useState('');
  const [quickAbilityName, setQuickAbilityName] = useState('');
  const [newRelPlayerIsCustom, setNewRelPlayerIsCustom] = useState(false);
  const [newRelPlayerType, setNewRelPlayerType] = useState('');
  const [newRelPlayerBehavior, setNewRelPlayerBehavior] = useState('');
  const [isFactionDropdownOpen, setIsFactionDropdownOpen] = useState(false);
  const [customFactionInput, setCustomFactionInput] = useState('');

  const [npcs, setNpcs] = useState<NPC[]>(() => {
    const rawNpcs = initialData?.npcs ?? [];
    return rawNpcs.map(npc => {
      if (npc.abilities && npc.abilities.length > 0) {
        return {
          ...npc,
          abilities: npc.abilities.map(a => {
            if (!a.category || a.category === 'Passive Fähigkeiten') {
              return { ...a, category: 'Techniken' };
            }
            return a;
          })
        };
      }
      return npc;
    });
  });


  // Auto-save debounced
  useEffect(() => {
    if (!onAutoSave) return;
    const timeoutId = setTimeout(() => {
      let newChatHistory = mode === GameViewMode.JOIN_CUSTOM_CHAR 
        ? [] 
        : ((initialData?.chatHistory && initialData.chatHistory.length > 0)
          ? [...initialData.chatHistory] 
          : [
              { id: 'prologue-msg', role: 'model', text: prologue || 'Die Reise beginnt...', isCombatLog: false } as any
            ]);

      if (newChatHistory.length > 0) {
        newChatHistory = newChatHistory.map(m => {
          if (m.id === 'prologue-msg') {
            return { ...m, text: prologue || 'Die Reise beginnt...' };
          }
          if (m.id === 'first-msg') {
            return { ...m, text: firstMessage };
          }
          return m;
        });
      }

      const currentAdventure: Adventure = {
        id: adventureIdRef.current,
        authorId: mode === GameViewMode.JOIN_CUSTOM_CHAR ? userId : (initialData?.authorId || userId),
        isPublic,
        world,
        player,
        npcs,
        loreDatabase,
        inventory: initialData?.inventory ?? ['Starterpaket'],
        structuredInventory: structuredInventory,
        prologue: prologue || 'Die Reise beginnt...',
        firstMessage: firstMessage,
        chatHistory: newChatHistory,
        backgroundImage: bgImage,
        statusElements,
        initialPlayer: JSON.parse(JSON.stringify(player))
      };
      
      onAutoSave(currentAdventure);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [world, player, npcs, loreDatabase, isPublic, prologue, firstMessage, structuredInventory, bgImage, statusElements, onAutoSave]);

  const handleUpdateLoreDatabase = (newLore: LoreEntry[]) => {
    const cleanLore = (newLore || []).filter(l => l.category !== 'Orte');
    setLoreDatabase(cleanLore);

    const pName = player?.name || 'Spieler';
    const isOwnerMatch = (owner?: string) => {
      if (!owner) return false;
      const o = owner.trim().toLowerCase();
      const p = pName.trim().toLowerCase();
      return o === p || o === 'spieler' || o === 'player' || (player?.nickname && o === player.nickname.trim().toLowerCase());
    };

    const notOwnedItemNames = newLore
      .filter(entry => 
        entry.category === 'Gegenstände' && 
        (!entry.details?.owner || !isOwnerMatch(entry.details.owner))
      )
      .map(entry => entry.title.trim().toLowerCase());

    const playerOwnedEntries = newLore.filter(entry => 
      entry.category === 'Gegenstände' && isOwnerMatch(entry.details?.owner)
    );

    let changedInv = false;
    const currentInv = structuredInventory || { weapons: [], generalItems: [], armor: {}, accessories: {}, money: 100, currencyLabel: 'Goldstücke' };

    let cleanWeapons = (currentInv.weapons || []).filter(wpn => {
      const isNotOwned = wpn && notOwnedItemNames.includes(wpn.trim().toLowerCase());
      if (isNotOwned) changedInv = true;
      return !isNotOwned;
    });

    let cleanGeneralItems = (currentInv.generalItems || []).filter(itm => {
      const isNotOwned = itm && notOwnedItemNames.includes(itm.trim().toLowerCase());
      if (isNotOwned) changedInv = true;
      return !isNotOwned;
    });

    const cleanArmor = { ...(currentInv.armor || {}) };
    if (currentInv.armor) {
      (Object.keys(currentInv.armor) as Array<keyof typeof cleanArmor>).forEach(slot => {
        const val = cleanArmor[slot];
        if (val && notOwnedItemNames.includes(val.trim().toLowerCase())) {
          cleanArmor[slot] = "";
          changedInv = true;
        }
      });
    }

    const cleanAccessories = { ...(currentInv.accessories || {}) };
    if (currentInv.accessories) {
      (Object.keys(currentInv.accessories) as Array<keyof typeof cleanAccessories>).forEach(slot => {
        const val = cleanAccessories[slot];
        if (val && notOwnedItemNames.includes(val.trim().toLowerCase())) {
          cleanAccessories[slot] = "";
          changedInv = true;
        }
      });
    }

    const weaponKeywords = ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild', 'drachenschwert', 'lanze', 'kolben', 'hammer', 'stab'];
    playerOwnedEntries.forEach(entry => {
      const title = entry.title?.trim();
      if (!title) return;
      const titleLower = title.toLowerCase();
      const typeLower = (entry.details?.itemType || '').toLowerCase();
      const descLower = (entry.description || '').toLowerCase();
      const isWeapon = typeLower.includes('waff') || weaponKeywords.some(kw => titleLower.includes(kw) || typeLower.includes(kw) || descLower.includes(kw));

      if (isWeapon) {
        if (!cleanWeapons.some(w => w.trim().toLowerCase() === titleLower)) {
          cleanWeapons.push(title);
          changedInv = true;
        }
      } else {
        const inArmor = Object.values(cleanArmor).some(a => typeof a === 'string' && a.trim().toLowerCase() === titleLower);
        const inAcc = Object.values(cleanAccessories).some(a => typeof a === 'string' && a.trim().toLowerCase() === titleLower);
        if (!inArmor && !inAcc && !cleanGeneralItems.some(i => i.trim().toLowerCase() === titleLower)) {
          cleanGeneralItems.push(title);
          changedInv = true;
        }
      }
    });

    if (changedInv) {
      setStructuredInventory({
        ...currentInv,
        weapons: cleanWeapons,
        generalItems: cleanGeneralItems,
        armor: cleanArmor,
        accessories: cleanAccessories
      });
    }
  };

  const handleUpdateLoreDatabaseFlexible = (updater: LoreEntry[] | ((prev: LoreEntry[]) => LoreEntry[])) => {
    const nextLore = typeof updater === 'function' ? updater(loreDatabase) : updater;
    handleUpdateLoreDatabase(nextLore);
  };

  const updateTechniqueRule = (type: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support', key: string, value: any) => {
    setWorld(prev => {
      const currentRules = prev.techniqueRules || {
        Angriff: { type: 'Angriff', defaultSubtype: 'Einzelschuss', mainParameter: 'Stärke', progressionCostValue: 100, costResourceName: 'Mana', costValue: 10, levelScaling: 'Linear (+10% Schaden pro Level)' },
        Verteidigung: { type: 'Verteidigung', defaultSubtype: 'Schild/Barriere', mainParameter: 'Ausdauer', progressionCostValue: 100, costResourceName: 'Mana', costValue: 8, levelScaling: 'Linear (+15% Absorption pro Level)' },
        Transformation: { type: 'Transformation', defaultSubtype: 'Modus/Form', mainParameter: 'Magie', progressionCostValue: 100, costResourceName: 'Mana', costValue: 15, levelScaling: 'Flach (Verlängert Dauer um +5s pro Level)' },
        Support: { type: 'Support', defaultSubtype: 'Direkte Heilung', mainParameter: 'Intelligenz', progressionCostValue: 100, costResourceName: 'Mana', costValue: 12, levelScaling: 'Linear (+12% Effekt pro Level)' }
      };
      return {
        ...prev,
        techniqueRules: {
          ...currentRules,
          [type]: {
            ...currentRules[type],
            [key]: value
          }
        }
      };
    });
  };

  const updateTechniqueRuleListItem = (id: string, key: keyof TechniqueRuleItem, value: any) => {
    setWorld(prev => {
      const list = prev.techniqueRulesList || [];
      const updatedList = list.map((item: TechniqueRuleItem) => {
        if (item.id === id) {
          return { ...item, [key]: value };
        }
        return item;
      });
      return {
        ...prev,
        techniqueRulesList: updatedList
      };
    });
  };

  const handleImportFromProfile = () => {
    if (!userProfile) return;
    setPlayer({
      ...player,
      name: userProfile.name,
      role: userProfile.preferredRole,
      bio: userProfile.bio,
      appearance: {
        ...player.appearance,
        gender: userProfile.appearance.gender,
        age: userProfile.appearance.age,
        build: userProfile.appearance.build,
        hairColor: userProfile.appearance.hairColor,
        eyeColor: userProfile.appearance.eyeColor,
        cupSize: userProfile.appearance.cupSize
      }
    });
  };

  const addStatusElement = (label = '', value = '') => {
    setStatusElements([...statusElements, { id: Math.random().toString(36).substr(2, 9), label, value }]);
  };

  const removeStatusElement = (id: string) => {
    setStatusElements(statusElements.filter(s => s.id !== id));
  };

  const updateStatusElement = (id: string, updates: Partial<StatusElement>) => {
    setStatusElements(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        const l = (updated.label || '').toLowerCase();
        if (l.includes('standort') || l.includes('ort')) {
          setPlayer(prevPlayer => {
            if (prevPlayer.appearance.currentLocation !== updated.value) {
              return {
                ...prevPlayer,
                appearance: {
                  ...prevPlayer.appearance,
                  currentLocation: updated.value || ''
                }
              };
            }
            return prevPlayer;
          });
        } else if (l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits')) {
          const numMatch = (updated.value || '').match(/\d+/);
          const parsedMoney = numMatch ? parseInt(numMatch[0]) : (structuredInventory?.money ?? 100);
          const textMatch = (updated.value || '').replace(/\d+/g, '').trim();
          setStructuredInventory(old => ({
            ...(old || {}),
            money: parsedMoney,
            currencyLabel: textMatch || old?.currencyLabel || 'Goldstücke'
          }));
        }
        return updated;
      }
      return s;
    }));
  };

  const mapCharacterAbilitiesAndPowers = (charData: any) => {
    if (!charData) return {};
    
    // Parse campaign power levels list to record/map format
    const levels: Record<string, { value: number; potentialMax: number; xp: number }> = {};
    if (charData.campaignPowerLevelsList && Array.isArray(charData.campaignPowerLevelsList)) {
      charData.campaignPowerLevelsList.forEach((item: any) => {
        if (item.parameterName) {
          levels[item.parameterName] = {
            value: item.value !== undefined ? item.value : 10,
            potentialMax: item.potentialMax !== undefined ? item.potentialMax : 80,
            xp: 0
          };
        }
      });
    } else if (charData.campaignPowerLevels) {
      Object.entries(charData.campaignPowerLevels).forEach(([k, v]: [string, any]) => {
        levels[k] = {
          value: v?.value !== undefined ? v.value : 10,
          potentialMax: v?.potentialMax !== undefined ? v.potentialMax : 80,
          xp: v?.xp || 0
        };
      });
    }

    // Build abilities list from top-level or existing abilities
    let mappedAbilities = charData.abilities;
    if (!mappedAbilities || mappedAbilities.length === 0) {
      if (charData.skills || charData.powerSource || charData.techniques || charData.techniqueList) {
        const defaultResName = charData.powerCost || 'Mana';
        const techListMapped = (charData.techniqueList && Array.isArray(charData.techniqueList))
          ? charData.techniqueList.filter((t: any) => t && t.name).map((t: any, index: number) => {
              const cVal = t.costValue !== undefined ? t.costValue : 10;
              const cForm = t.costFormula || 'absolut';
              const cRes = t.costResourceName || defaultResName;
              return {
                id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
                name: t.name.trim(),
                description: t.description ? t.description.trim() : '',
                type: t.type || 'Angriff',
                subtype: t.subtype || 'Einzelschuss',
                tier: t.tier || 'Tier 1',
                baseValue: t.baseValue !== undefined ? t.baseValue : 15,
                costFormula: cForm,
                costValue: cVal,
                costResourceName: cRes,
                cost: `${cVal}${cForm === 'proz.' ? '%' : ''} ${cRes}`,
                level: t.level || 1,
                xp: t.xp || 0,
                maxLevel: t.maxLevel || 10,
                xpNeeded: t.xpNeeded || 100
              };
            })
          : (charData.techniques
              ? charData.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean).map((name: string, index: number) => ({
                  id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
                  name,
                  description: '',
                  type: 'Angriff' as const,
                  subtype: 'Einzelschuss',
                  tier: 'Tier 1',
                  baseValue: 15,
                  costFormula: 'absolut' as const,
                  costValue: 10,
                  costResourceName: defaultResName,
                  cost: `10 ${defaultResName}`,
                  level: 1,
                  xp: 0,
                  maxLevel: 10,
                  xpNeeded: 100
                }))
              : []
            );

        mappedAbilities = [{
          id: `ab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          source: charData.powerSource || '',
          cost: charData.powerCost || '',
          description: charData.skills || '',
          techniques: charData.techniques || '',
          techniqueList: techListMapped
        }];
      }
    } else {
      mappedAbilities = mappedAbilities.map((abil: any) => ({
        ...abil,
        techniqueList: abil.techniqueList?.map((t: any, index: number) => {
          const cVal = t.costValue !== undefined ? t.costValue : 10;
          const cForm = t.costFormula || 'absolut';
          const cRes = t.costResourceName || 'Mana';
          return {
            id: t.id || `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            name: t.name || '',
            description: t.description || '',
            type: t.type || 'Angriff',
            subtype: t.subtype || 'Einzelschuss',
            tier: t.tier || 'Tier 1',
            baseValue: t.baseValue !== undefined ? t.baseValue : 15,
            costFormula: cForm,
            costValue: cVal,
            costResourceName: cRes,
            cost: `${cVal}${cForm === 'proz.' ? '%' : ''} ${cRes}`,
            level: t.level || 1,
            xp: t.xp || 0,
            maxLevel: t.maxLevel || 10,
            xpNeeded: t.xpNeeded || 100
          };
        })
      }));
    }

    return {
      campaignPowerLevels: Object.keys(levels).length > 0 ? levels : undefined,
      abilities: mappedAbilities
    };
  };

  const handleAutofillStep2And3 = async () => {
    setIsGeneratingCampaignSettings(true);
    setError(null);
    try {
      const data = await GeminiService.autofillCampaignAndBalancingSettings(
        selectedTags,
        world.title || "",
        world.description || "",
        world.dramaLevel || "Mittel",
        world.isNsfw
      );

      // Convert list of campaign parameters to record/map format
      const campaignPowerSettings: Record<string, any> = {};
      if (data.campaignParametersList && Array.isArray(data.campaignParametersList)) {
        data.campaignParametersList.forEach((param: any) => {
          if (param.name) {
            campaignPowerSettings[param.name] = {
              min: param.min !== undefined ? param.min : 10,
              max: param.max !== undefined ? param.max : 80,
              levelUpLogic: param.levelUpLogic || 'EP-basiert (Gegnerstärke)',
              scaleMin: param.scaleMin !== undefined ? param.scaleMin : 0,
              scaleMax: param.scaleMax !== undefined ? param.scaleMax : 100,
              category: param.category || 'physical'
            };
          }
        });
      }

      // Convert cost resources
      let costResources = data.costResources || [];
      if (Array.isArray(costResources)) {
        costResources = costResources.map((r: any) => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          name: r.name || 'Mana',
          sourcePowers: r.sourcePowers || [],
          baseMax: r.baseMax !== undefined ? r.baseMax : 100
        }));
      }

      // Convert custom mappings
      let customResourceMappings = data.customResourceMappings || [];
      if (Array.isArray(customResourceMappings)) {
        customResourceMappings = customResourceMappings.map((m: any) => ({
          id: m.id || Math.random().toString(36).substr(2, 9),
          name: m.name || 'Fokus',
          icon: m.icon || '✨',
          sourcePowers: m.sourcePowers || [],
          baseMax: m.baseMax !== undefined ? m.baseMax : 100,
          effect: m.effect || 'regen',
          description: m.description || ''
        }));
      }

      // Convert technique rules list
      let techniqueRulesList = data.techniqueRulesList || [];
      if (Array.isArray(techniqueRulesList)) {
        techniqueRulesList = techniqueRulesList.map((r: any, idx: number) => ({
          id: r.id || `rule-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          type: r.type || 'Angriff',
          subtype: r.subtype || 'Einzelschuss',
          costResourceName: r.costResourceName || 'Mana',
          costFormula: r.costFormula || 'absolut',
          tier: r.tier || 'Tier 1',
          baseValue: r.baseValue !== undefined ? r.baseValue : 15,
          scalingAndEffect: r.scalingAndEffect || ''
        }));
      }

      setWorld(prev => ({
        ...prev,
        description: prev.description ? prev.description : (data.generatedDescription || ""),
        campaignPowerSettings,
        healthLabel: data.healthLabel || 'Gesundheit',
        costLabel: data.costLabel || 'Kosten / Verbrauch',
        healthPowerNames: data.healthPowerNames || [],
        costPowerNames: data.costPowerNames || [],
        costResources,
        customResourceMappings,
        techniqueProgressionLogic: data.techniqueProgressionLogic || 'ep',
        techniqueProgressionRate: data.techniqueProgressionRate || 'normal',
        techniqueRulesList
      }));

      if (data.generatedTags && Array.isArray(data.generatedTags) && data.generatedTags.length > 0) {
        setSelectedTags(prev => {
          const merged = Array.from(new Set([...prev, ...data.generatedTags]));
          return merged;
        });
      }

    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Smart-Fill der Kampagnen-Einstellungen: " + (err.message || String(err)));
    } finally {
      setIsGeneratingCampaignSettings(false);
    }
  };

  const handleAutofillStep1 = async () => {
    setIsGenerating(true);
    try {
      // Übergebe das userProfile und den aktuellen Player-Stand (falls geändert)
      const data = await GeminiService.autofillAdventure(selectedTags, world.title, world.description, userProfile, world.isNsfw, player, world.isHeroic, world.dramaLevel);
      
      // Convert list of campaign parameters to record/map format
      const campaignPowerSettings: Record<string, any> = {};
      if (data.campaignParametersList && Array.isArray(data.campaignParametersList)) {
        data.campaignParametersList.forEach((param: any) => {
          if (param.name) {
            campaignPowerSettings[param.name] = {
              min: param.min !== undefined ? param.min : 10,
              max: param.max !== undefined ? param.max : 80,
              levelUpLogic: param.levelUpLogic || 'EP-basiert (Gegnerstärke)',
              scaleMin: param.scaleMin !== undefined ? param.scaleMin : 0,
              scaleMax: param.scaleMax !== undefined ? param.scaleMax : 100,
              category: param.category || 'physical'
            };
          }
        });
      }

      // Convert cost resources
      let costResources = data.costResources || [];
      if (Array.isArray(costResources)) {
        costResources = costResources.map((r: any) => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          name: r.name || 'Mana',
          sourcePowers: r.sourcePowers || [],
          baseMax: r.baseMax !== undefined ? r.baseMax : 100
        }));
      }

      // Convert custom mappings
      let customResourceMappings = data.customResourceMappings || [];
      if (Array.isArray(customResourceMappings)) {
        customResourceMappings = customResourceMappings.map((m: any) => ({
          id: m.id || Math.random().toString(36).substr(2, 9),
          name: m.name || 'Fokus',
          icon: m.icon || '✨',
          sourcePowers: m.sourcePowers || [],
          baseMax: m.baseMax !== undefined ? m.baseMax : 100,
          effect: m.effect || 'regen',
          description: m.description || ''
        }));
      }

      // Convert technique rules list
      let techniqueRulesList = data.techniqueRulesList || [];
      if (Array.isArray(techniqueRulesList)) {
        techniqueRulesList = techniqueRulesList.map((r: any, idx: number) => ({
          id: r.id || `rule-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          type: r.type || 'Angriff',
          subtype: r.subtype || 'Einzelschuss',
          costResourceName: r.costResourceName || 'Mana',
          costFormula: r.costFormula || 'absolut',
          tier: r.tier || 'Tier 1',
          baseValue: r.baseValue !== undefined ? r.baseValue : 15,
          scalingAndEffect: r.scalingAndEffect || ''
        }));
      } else {
        techniqueRulesList = [];
      }

      setWorld({
        title: data.title,
        description: data.description,
        era: selectedTags.join(', '),
        tone: data.tone,
        isNsfw: world.isNsfw,
        isHeroic: world.isHeroic,
        dramaLevel: world.dramaLevel,
        campaignPowerSettings,
        healthLabel: data.healthLabel || 'Gesundheit',
        costLabel: data.costLabel || 'Kosten / Verbrauch',
        healthPowerNames: data.healthPowerNames || [],
        costPowerNames: data.costPowerNames || [],
        costResources,
        customResourceMappings,
        techniqueProgressionLogic: data.techniqueProgressionLogic || 'ep',
        techniqueProgressionRate: data.techniqueProgressionRate || 'normal',
        techniqueRulesList
      });

      setPrologue(data.prologue || '');
      setFirstMessage(data.firstMessage || '');
      
      // Die KI hat nun einen Charakter generiert, der das Profil respektiert aber in die Welt passt
      if (data.player) {
        const mappedPower = mapCharacterAbilitiesAndPowers(data.player);
        const archetype = data.player.personalityArchetype || player.personalityArchetype;
        const traits = data.player.personalityTraits || player.personalityTraits;
        const syncedTraits = archetype && archetype !== '-' ? applyArchetypeToTraits(traits, archetype) : traits;
        setPlayer({ 
          ...player, 
          ...data.player,
          personalityArchetype: archetype,
          personalityTraits: syncedTraits,
          appearance: { ...player.appearance, ...(data.player.appearance || {}) },
          attributes: player.attributes,
          abilities: mappedPower.abilities || player.abilities,
          campaignPowerLevels: mappedPower.campaignPowerLevels || player.campaignPowerLevels
        });
      }
      
      if (data.npcs && Array.isArray(data.npcs)) {
        setNpcs(data.npcs.map((n: any) => {
          const mappedPower = mapCharacterAbilitiesAndPowers(n);
          const archetype = n.personalityArchetype;
          const traits = n.personalityTraits;
          const syncedTraits = archetype && archetype !== '-' ? applyArchetypeToTraits(traits, archetype) : traits;
          return { 
            ...n, 
            id: Math.random().toString(36).substr(2, 9), 
            personalityArchetype: archetype,
            personalityTraits: syncedTraits,
            attributes: [],
            appearance: {
              hairColor: '', eyeColor: '', age: '', build: 'Schlank', gender: 'Weiblich', cupSize: '', outfit: '',
              ...(n.appearance || {})
            },
            abilities: mappedPower.abilities,
            campaignPowerLevels: mappedPower.campaignPowerLevels
          };
        }));
      }

      // Lore Datenbank mit generierten Daten befüllen
      let generatedLore: LoreEntry[] = [];
      if (data.loreDatabase && Array.isArray(data.loreDatabase)) {
        generatedLore = data.loreDatabase
          .filter((l: any) => {
            // Verhindere, dass der Hauptcharakter (Spieler) redundant in der Lore-Datenbank als Charakter-Eintrag landet
            const pName = data.player?.name || player?.name;
            const isPlayerName = pName && l.title && l.title.trim().toLowerCase() === pName.trim().toLowerCase();
            return !(l.category === 'Charaktere' && isPlayerName);
          })
          .map((l: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            category: l.category as any,
            title: l.title,
            description: l.description,
            details: l.details || {},
            isUnlocked: l.isUnlocked !== false,
            order: l.order,
            secretsStage1: l.secretsStage1,
            secretsStage2: l.secretsStage2,
            secretsStage3: l.secretsStage3,
            knowledge: l.knowledge
          }));
      }

      // Falls bestimmte Basiseinträge wie Genres/Tags fehlen, füge sie hinzu
      if (selectedTags.length > 0) {
        generatedLore.push({
          id: 'genre-tags-lore',
          category: 'Weltregeln',
          title: 'Themen & Atmosphäre',
          description: `Die Atmosphäre der Welt wird maßgeblich durch folgende Themen, Genres und Tags bestimmt: ${selectedTags.join(', ')}.`,
          isUnlocked: true
        });
      }

      // Auch die Weltbeschreibung als Basis-Ort oder Weltregel einfügen
      if (data.description) {
        generatedLore.push({
          id: 'world-setting-lore',
          category: 'Weltregeln',
          title: `Grundregeln von ${data.title || world.title || 'der Welt'}`,
          description: data.description,
          isUnlocked: true
        });
      }

      // Dedupliziere generierte Lore anhand der Kategorie und des normalisierten Titels
      const normalizeTitle = (t: string) => {
        let s = t.toLowerCase().trim();
        s = s.replace(/^(die|der|das|ein|eine|einen|einem|eines|einer|the|a|an)\s+/, '');
        return s.trim();
      };
      
      const uniqueLore: LoreEntry[] = [];
      generatedLore.forEach(item => {
        if (!item.title) return;
        const normTitle = normalizeTitle(item.title);
        const isDuplicate = uniqueLore.some(u => u.category === item.category && normalizeTitle(u.title) === normTitle);
        if (!isDuplicate) {
          uniqueLore.push(item);
        }
      });
      generatedLore = uniqueLore;

      setLoreDatabase(generatedLore);

      if (statusElements.length === 0) {
        addStatusElement('Zeit', '08:00');
      }
    } catch (err: any) {
      console.error(err);
      setError("Weltengenerierung fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter / Netzwerkfehler"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractInventory = async () => {
    if (!player.name) return;
    setIsExtractingInventory(true);
    setError(null);
    try {
      const inv = await GeminiService.extractStructuredInventory(player, world);
      setStructuredInventory(inv);
    } catch (err: any) {
      console.error(err);
      setError("Ausrüstungsextraktion fehlgeschlagen: " + (err?.message || "Unbekannter Fehler"));
    } finally {
      setIsExtractingInventory(false);
    }
  };

  const handleGeneratePlayer = async () => {
    setIsGeneratingChar(true);
    setError(null);
    try {
      const existingFactions = loreDatabase
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const char = await GeminiService.generatePlayer(world, player, userProfile, prologue, existingFactions);
      const mappedPower = mapCharacterAbilitiesAndPowers(char);
      setPlayer(prev => {
        const archetype = char.personalityArchetype || prev.personalityArchetype;
        const traits = char.personalityTraits || prev.personalityTraits;
        const syncedTraits = archetype && archetype !== '-' ? applyArchetypeToTraits(traits, archetype) : traits;
        return { 
          ...prev, 
          ...char, 
          personalityArchetype: archetype,
          personalityTraits: syncedTraits,
          attributes: prev.attributes,
          abilities: mappedPower.abilities || prev.abilities,
          campaignPowerLevels: mappedPower.campaignPowerLevels || prev.campaignPowerLevels
        };
      });

      // Pull structured inventory automatically from generated player character info
      try {
        const inv = await GeminiService.extractStructuredInventory(char, world);
        setStructuredInventory(inv);
      } catch (invErr) {
        console.error("Fehler bei der automatischen Inventarextraktion:", invErr);
      }
    } catch (err: any) {
      console.error(err);
      setError("Charaktergenerierung fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingChar(false);
    }
  };

  const handleGeneratePlayerPortrait = async () => {
    if (!player.name) return;
    setIsGeneratingPortrait(true);
    try {
      const artStyle = selectedTags.includes("Anime") ? "Anime, Manga Stil, detailliert" :
                       selectedTags.includes("JRPG") ? "JRPG Stil, Final Fantasy art style, detailliert" :
                       "Hochwertige digitale Illustration, Fantasy Konzeptkunst";
      const prompt = `Portrait von einem Fantasy-Charakter namens ${player.name}. ${player.appearance.gender}, ${player.appearance.hairColor} Haare, ${player.appearance.eyeColor} Augen, Statur: ${player.appearance.build}, ${player.appearance.outfit ? 'trägt ' + player.appearance.outfit : ''}. ${artStyle}`;
      const url = await GeminiService.generateImage(prompt);
      if (url) {
        setPlayer({...player, image: url});
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Fehler bei der Bildgenerierung");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleGeneratePlayerExpression = async (exprKey: string) => {
    if (!player.name?.trim()) {
      setError("Bitte gib zuerst einen Namen für den Charakter ein, bevor du ein Porträt generierst.");
      return;
    }
    setPlayerGeneratingExpression(exprKey);
    try {
      const artStyle = selectedTags.includes("Anime") ? "Anime Stil, detailliertes Anime Porträt" :
                       selectedTags.includes("JRPG") ? "Klassische RPG Charakter-Illustration, detailliert" :
                       "Hochwertige digitale Fantasy Portrait-Konzeptkunst";
      
      let emotionDesc = "neutraler Gesichtsausdruck";
      if (exprKey === 'happy') emotionDesc = "glücklich lächelnd, lachend, fröhlich";
      if (exprKey === 'sad') emotionDesc = "trauriger Gesichtsausdruck, weinerlich, den Tränen nahe";
      if (exprKey === 'angry') emotionDesc = "wütender Gesichtsausdruck, zornig, finsterer Blick, entschlossen";
      if (exprKey === 'surprised') emotionDesc = "überraschter Gesichtsausdruck, weit geöffnete Augen, erstaunt, schockiert";
      if (exprKey === 'blushing') emotionDesc = "errötetes Gesicht, schüchtern blickend, verlegen lächelnd, süß";

      const prompt = `Porträt-Nahaufnahme von dem RPG-Charakter namens ${player.name} mit folgendem Ausdruck: ${emotionDesc}. Geschlecht: ${player.appearance?.gender || 'Unbekannt'}, Haare: ${player.appearance?.hairColor || 'Unbekannt'}, Augen: ${player.appearance?.eyeColor || 'Unbekannt'}, Statur: ${player.appearance?.build || 'Unbekannt'}, ${player.appearance?.outfit ? 'Outfit: ' + player.appearance.outfit : ''}. ${artStyle}. Zentrierte Kopf- und Schulteraufnahme (Avatar / Headshot Portrait), 1:1 Format. Fokus auf Gesicht und Mimik. Keine Schrift oder Text im Bild.`;
      
      const url = await GeminiService.generateImage(prompt, false, "1:1");
      if (url) {
        setPlayer(prev => {
          const updated = {
            ...prev,
            expressions: {
              ...(prev.expressions || {}),
              [exprKey]: url
            }
          };
          if (exprKey === 'neutral') {
            updated.image = url;
          }
          return updated;
        });
      } else {
        setError(`Fehler bei der Generierung des Ausdrucks ${exprKey}: Keine Bild-Daten empfangen.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Fehler bei der Generierung des Ausdrucks ${exprKey}: ` + (err?.message || "Unbekannter Fehler"));
    } finally {
      setPlayerGeneratingExpression(null);
    }
  };

  const handleUploadPlayerExpression = async (exprKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (rawBase64) {
        try {
          const compressed = await GeminiService.compressImageBase64(rawBase64, 256, 0.7);
          setPlayer(prev => {
            const updated = {
              ...prev,
              expressions: {
                ...(prev.expressions || {}),
                [exprKey]: compressed
              }
            };
            if (exprKey === 'neutral') {
              updated.image = compressed;
            }
            return updated;
          });
        } catch (err) {
          console.error(err);
          setError("Fehler beim Komprimieren des hochgeladenen Bildes.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlayerSmartFill = async () => {
    setIsSmartFillingChar(true);
    try {
      const promptToUse = playerSmartFill.trim() || 'Vollständigen Charakter automatisch mit passenden Details, Vorgeschichte, Beziehungen und Fähigkeiten ausstatten.';
      const existingFactions = loreDatabase
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);

      const existingCodexCharacters = [
        ...npcs.map(n => ({
          name: n.name + (n.nickname ? ` (${n.nickname})` : ''),
          role: n.role,
          family: n.appearance?.family || (n as any).family || '',
          relation: n.relationship || n.conduct || '',
          description: n.bio || ''
        })),
        ...loreDatabase
          .filter(l => l.category === 'Charaktere')
          .map(l => ({
            name: l.title + (l.details?.nickname ? ` (${l.details.nickname})` : ''),
            role: l.details?.role || '',
            family: l.details?.family || '',
            relation: l.details?.relationship || l.details?.conduct || '',
            description: l.description || ''
          }))
      ];

      const data = await GeminiService.autofillCharacter(
        promptToUse, 
        world.campaignPowerSettings,
        keepExistingPlayerDetails ? player : undefined,
        world,
        existingFactions,
        existingCodexCharacters
      );
      setPlayer(prev => {
        let generatedAbilities = prev.abilities || [];
        if (data.abilities && Array.isArray(data.abilities)) {
          const defaultPsId = activePowerSource?.id || playerPowerSourcesList[0]?.id || 'ps-1';
          const mappedAbilities = data.abilities.map((abil: any, aIndex: number) => {
            const techniques = abil.techniques || (abil.techniqueList ? abil.techniqueList.map((t: any) => t.name).join(', ') : '');
            let cat = abil.category;
            if (!cat || cat === 'Standard' || cat === 'Kernfähigkeit') {
              cat = 'Techniken';
            }
            return {
              id: `${Date.now()}-${aIndex}-${Math.random().toString(36).substr(2, 5)}`,
              name: abil.name || 'Fähigkeit',
              category: cat,
              powerSourceId: abil.powerSourceId || defaultPsId,
              source: abil.source || data.powerSource || '',
              cost: abil.cost || data.powerCost || '',
              description: abil.description || abil.skills || '',
              techniques: techniques,
              activationCondition: abil.activationCondition || '',
              transformName: abil.transformName || '',
              transformRole: abil.transformRole || '',
              transformGender: abil.transformGender || '',
              transformCupSize: abil.transformCupSize || '',
              transformHairColor: abil.transformHairColor || '',
              transformEyeColor: abil.transformEyeColor || '',
              transformBuild: abil.transformBuild || '',
              transformAge: abil.transformAge || '',
              transformRace: abil.transformRace || '',
              transformRaceFeatures: abil.transformRaceFeatures || '',
              transformHeight: abil.transformHeight || '',
              transformMeasurements: abil.transformMeasurements || '',
              transformOrigin: abil.transformOrigin || '',
              transformFamily: abil.transformFamily || '',
              transformFaction: abil.transformFaction || '',
              transformOutfit: abil.transformOutfit || '',
              transformLooks: abil.transformLooks || '',
              transformWings: !!abil.transformWings,
              transformHorns: !!abil.transformHorns,
              techniqueList: (abil.techniqueList && Array.isArray(abil.techniqueList))
                ? abil.techniqueList.filter((t: any) => t && t.name).map((t: any, index: number) => ({ 
                    id: `${Date.now()}-${aIndex}-${index}-${Math.random().toString(36).substr(2, 3)}`, 
                    name: t.name.trim(), 
                    description: t.description ? t.description.trim() : '',
                    type: t.type || 'Angriff',
                    subtype: t.subtype || ''
                  }))
                : (techniques 
                    ? techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean).map((name: string, index: number) => ({ 
                        id: `${Date.now()}-${aIndex}-${index}-${Math.random().toString(36).substr(2, 3)}`, 
                        name, 
                        description: '',
                        type: 'Angriff',
                        subtype: ''
                      }))
                    : []
                  )
            };
          });

          if (keepExistingPlayerDetails && prev.abilities && prev.abilities.length > 0) {
            const mergedAbilities = prev.abilities.map(existingAbil => {
              const matchingNewAbil = mappedAbilities.find(
                a => (a.name || '').toLowerCase().trim() === (existingAbil.name || '').toLowerCase().trim()
              );
              if (matchingNewAbil) {
                return {
                  ...existingAbil,
                  category: existingAbil.category || matchingNewAbil.category,
                  source: existingAbil.source || matchingNewAbil.source,
                  cost: existingAbil.cost || matchingNewAbil.cost,
                  description: existingAbil.description || matchingNewAbil.description,
                  techniques: existingAbil.techniques || matchingNewAbil.techniques,
                  activationCondition: existingAbil.activationCondition || matchingNewAbil.activationCondition,
                  transformName: existingAbil.transformName || matchingNewAbil.transformName,
                  transformRole: existingAbil.transformRole || matchingNewAbil.transformRole,
                  transformGender: existingAbil.transformGender || matchingNewAbil.transformGender,
                  transformCupSize: existingAbil.transformCupSize || matchingNewAbil.transformCupSize,
                  transformHairColor: existingAbil.transformHairColor || matchingNewAbil.transformHairColor,
                  transformEyeColor: existingAbil.transformEyeColor || matchingNewAbil.transformEyeColor,
                  transformBuild: existingAbil.transformBuild || matchingNewAbil.transformBuild,
                  transformAge: existingAbil.transformAge || matchingNewAbil.transformAge,
                  transformRace: existingAbil.transformRace || matchingNewAbil.transformRace,
                  transformRaceFeatures: existingAbil.transformRaceFeatures || matchingNewAbil.transformRaceFeatures,
                  transformHeight: existingAbil.transformHeight || matchingNewAbil.transformHeight,
                  transformMeasurements: existingAbil.transformMeasurements || matchingNewAbil.transformMeasurements,
                  transformOrigin: existingAbil.transformOrigin || matchingNewAbil.transformOrigin,
                  transformFamily: existingAbil.transformFamily || matchingNewAbil.transformFamily,
                  transformFaction: existingAbil.transformFaction || matchingNewAbil.transformFaction,
                  transformOutfit: existingAbil.transformOutfit || matchingNewAbil.transformOutfit,
                  transformLooks: existingAbil.transformLooks || matchingNewAbil.transformLooks,
                  transformWings: existingAbil.transformWings !== undefined && existingAbil.transformWings !== false ? existingAbil.transformWings : matchingNewAbil.transformWings,
                  transformHorns: existingAbil.transformHorns !== undefined && existingAbil.transformHorns !== false ? existingAbil.transformHorns : matchingNewAbil.transformHorns,
                  techniqueList: (existingAbil.techniqueList && existingAbil.techniqueList.length > 0)
                    ? existingAbil.techniqueList
                    : matchingNewAbil.techniqueList
                };
              }
              return existingAbil;
            });
            const existingNames = new Set(prev.abilities.map(a => (a.name || '').toLowerCase().trim()));
            const nonDuplicates = mappedAbilities.filter(a => !existingNames.has((a.name || '').toLowerCase().trim()));
            generatedAbilities = [...mergedAbilities, ...nonDuplicates];
          } else {
            generatedAbilities = mappedAbilities;
          }
        } else if (data.skills || data.powerSource) {
          const newAbil = {
            id: `ab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            source: data.powerSource || '',
            cost: data.powerCost || '',
            description: data.skills || '',
            techniques: data.techniques || '',
            techniqueList: (data.techniqueList && Array.isArray(data.techniqueList))
              ? data.techniqueList.filter((t: any) => t && t.name).map((t: any, index: number) => ({ 
                  id: `${Date.now()}-${index}`, 
                  name: t.name.trim(), 
                  description: t.description ? t.description.trim() : '' 
                }))
              : (data.techniques 
                  ? data.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean).map((name: string, index: number) => ({ 
                      id: `${Date.now()}-${index}`, 
                      name, 
                      description: '' 
                    }))
                  : []
                )
          };
          if (keepExistingPlayerDetails && prev.abilities && prev.abilities.length > 0) {
            generatedAbilities = [...prev.abilities, newAbil];
          } else {
            generatedAbilities = [newAbil];
          }
        }

        const finalBio = keepExistingPlayerDetails && prev.bio ? prev.bio : (data.bio || '');

        const finalPersonality = keepExistingPlayerDetails && prev.personality ? prev.personality : (data.personality || '');

        const finalArchetype = data.personalityArchetype || (keepExistingPlayerDetails ? prev.personalityArchetype : '');
        const rawTraits = data.personalityTraits || (keepExistingPlayerDetails ? prev.personalityTraits : undefined);
        const finalTraits = finalArchetype && finalArchetype !== '-' ? applyArchetypeToTraits(rawTraits, finalArchetype) : rawTraits;

        const finalOutfit = data.appearance?.outfit || (keepExistingPlayerDetails ? prev.appearance?.outfit : '') || '';

        let mergedRelationships = keepExistingPlayerDetails ? (prev.relationships || []) : [];
        if (data.relationships && Array.isArray(data.relationships)) {
          const incoming = data.relationships.map((r: any, index: number) => ({
            id: r.id || `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            targetCharacter: r.targetCharacter || '',
            type: r.type || '',
            relationshipStatus: r.relationshipStatus || '',
            addressFromSelfToTarget: r.addressFromSelfToTarget || '',
            addressFromTargetToSelf: r.addressFromTargetToSelf || '',
            behavior: r.behavior || '',
            aiDirectives: r.aiDirectives || '',
            perceptionSelfToTarget: r.perceptionSelfToTarget || '',
            perceptionTargetToSelf: r.perceptionTargetToSelf || '',
            secretsAndMotives: r.secretsAndMotives || '',
            boundariesAndTaboos: r.boundariesAndTaboos || '',
            sharedPast: r.sharedPast || '',
            keyMemories: r.keyMemories || '',
            valuesSelfToTarget: r.valuesSelfToTarget || {
              affection: 0, trust: 50, respect: 50, loyalty: 50, familiarity: 30, fear: 0, bond: 30, hostility: 0
            },
            valuesTargetToSelf: r.valuesTargetToSelf || {
              affection: 0, trust: 50, respect: 50, loyalty: 50, familiarity: 30, fear: 0, bond: 30, hostility: 0
            },
            keyEvents: Array.isArray(r.keyEvents) ? r.keyEvents.map((ev: any, evI: number) => ({
              id: ev.id || `${Date.now()}-${evI}`,
              title: ev.title || 'Schlüsselereignis',
              description: ev.description || '',
              dateOrChapter: ev.dateOrChapter || '',
              impact: ev.impact || ''
            })) : [],
            _isCustom: r._isCustom || false
          }));
          if (keepExistingPlayerDetails) {
            const existingTargets = new Set(mergedRelationships.map(r => (r.targetCharacter || '').toLowerCase().trim()));
            const newFiltered = incoming.filter(r => r.targetCharacter && !existingTargets.has(r.targetCharacter.toLowerCase().trim()));
            mergedRelationships = [...mergedRelationships, ...newFiltered];
          } else {
            mergedRelationships = incoming;
          }
        }

        const nextSecrets1 = data.secretsStage1 !== undefined ? data.secretsStage1 : (keepExistingPlayerDetails ? prev.secretsStage1 : '');
        const nextSecrets2 = data.secretsStage2 !== undefined ? data.secretsStage2 : (keepExistingPlayerDetails ? prev.secretsStage2 : '');
        const nextSecrets3 = data.secretsStage3 !== undefined ? data.secretsStage3 : (keepExistingPlayerDetails ? prev.secretsStage3 : '');
        const nextKnowledge = data.knowledge !== undefined ? data.knowledge : (keepExistingPlayerDetails ? prev.knowledge : '');

        const newAppearance = keepExistingPlayerDetails ? {
          ...prev.appearance,
          gender: data.appearance?.gender || prev.appearance?.gender || 'Unbekannt',
          age: data.appearance?.age || prev.appearance?.age || '',
          build: data.appearance?.build || prev.appearance?.build || '',
          hairColor: data.appearance?.hairColor || prev.appearance?.hairColor || '',
          eyeColor: data.appearance?.eyeColor || prev.appearance?.eyeColor || '',
          cupSize: data.appearance?.cupSize || prev.appearance?.cupSize || '-',
          outfit: finalOutfit,
          looks: data.appearance?.looks || prev.appearance?.looks || '',
          height: data.appearance?.height || prev.appearance?.height || '',
          measurements: data.appearance?.measurements || prev.appearance?.measurements || '',
          origin: data.appearance?.origin || prev.appearance?.origin || '',
          family: data.appearance?.family || prev.appearance?.family || '',
          faction: data.appearance?.faction || prev.appearance?.faction || '',
          race: data.appearance?.race || prev.appearance?.race || 'Mensch',
          raceFeatures: data.appearance?.raceFeatures || prev.appearance?.raceFeatures || 'keine',
          personalityArchetype: finalArchetype,
        } : {
          gender: data.appearance?.gender || 'Unbekannt',
          age: data.appearance?.age || '',
          build: data.appearance?.build || '',
          hairColor: data.appearance?.hairColor || '',
          eyeColor: data.appearance?.eyeColor || '',
          cupSize: data.appearance?.cupSize || '-',
          outfit: finalOutfit,
          looks: data.appearance?.looks || '',
          height: data.appearance?.height || '',
          measurements: data.appearance?.measurements || '',
          origin: data.appearance?.origin || '',
          family: data.appearance?.family || '',
          faction: data.appearance?.faction || '',
          race: data.appearance?.race || 'Mensch',
          raceFeatures: data.appearance?.raceFeatures || 'keine',
          personalityArchetype: finalArchetype,
        };

        const generatedPlayerName = (data.name?.trim()) || (data.callName?.trim()) || (data.rufName?.trim()) || '';
        const finalRole = data.role || data.profession || (keepExistingPlayerDetails ? (prev.role || prev.profession || '') : '');
        const finalProfession = data.profession || data.role || (keepExistingPlayerDetails ? (prev.profession || prev.role || '') : '');

        return {
          ...prev,
          name: keepExistingPlayerDetails && prev.name ? prev.name : (generatedPlayerName || (prev.name && prev.name.length < 50 ? prev.name : 'Neuer Spieler-Charakter')),
          nickname: data.nickname || (keepExistingPlayerDetails ? prev.nickname : ''),
          rufName: data.rufName || data.nickname || generatedPlayerName || (keepExistingPlayerDetails ? prev.rufName : ''),
          role: finalRole,
          profession: finalProfession || finalRole,
          professionLevel: data.professionLevel || (keepExistingPlayerDetails ? prev.professionLevel : ''),
          secondaryProfessions: data.secondaryProfessions || (keepExistingPlayerDetails ? prev.secondaryProfessions : []),
          jobTitle: data.jobTitle || (keepExistingPlayerDetails ? prev.jobTitle : ''),
          professionDescription: data.professionDescription || (keepExistingPlayerDetails ? prev.professionDescription : ''),
          craftingSkills: data.craftingSkills || (keepExistingPlayerDetails ? prev.craftingSkills : ''),
          talents: data.talents || (keepExistingPlayerDetails ? prev.talents : ''),
          everydaySkills: data.everydaySkills || (keepExistingPlayerDetails ? prev.everydaySkills : ''),
          personality: finalPersonality,
          personalityArchetype: finalArchetype,
          personalityTraits: finalTraits,
          bio: finalBio,
          currentSituation: data.currentSituation || (keepExistingPlayerDetails ? prev.currentSituation : ''),
          goal: data.goal || (keepExistingPlayerDetails ? prev.goal : ''),
          relationship: data.relationship || (keepExistingPlayerDetails ? prev.relationship : ''),
          conduct: data.conduct || (keepExistingPlayerDetails ? prev.conduct : ''),
          relationships: mergedRelationships,
          skills: data.skills || (keepExistingPlayerDetails ? prev.skills : ''),
          powerSource: data.powerSource || (keepExistingPlayerDetails ? prev.powerSource : ''),
          powerCost: data.powerCost || (keepExistingPlayerDetails ? prev.powerCost : ''),
          techniques: data.techniques || (keepExistingPlayerDetails ? prev.techniques : ''),
          abilities: generatedAbilities,
          campaignPowerLevels: data.campaignPowerLevels || (keepExistingPlayerDetails ? prev.campaignPowerLevels : {}),
          secretsStage1: nextSecrets1,
          secretsStage2: nextSecrets2,
          secretsStage3: nextSecrets3,
          knowledge: nextKnowledge,
          appearance: newAppearance
        };
      });

      // Pull structured inventory automatically from generated smart fill info
      try {
        const tempCharForExtraction = {
          name: data.name || player.name,
          role: data.role || player.role,
          appearance: {
            outfit: data.appearance?.outfit || player.appearance?.outfit || ''
          } as any,
          bio: data.bio || player.bio,
          skills: data.skills || player.skills,
          techniques: data.techniques || player.techniques
        } as any;
        const inv = await GeminiService.extractStructuredInventory(tempCharForExtraction, world);
        setStructuredInventory(inv);
      } catch (invErr) {
        console.error("Fehler bei der automatischen Inventarextraktion nach Smart Fill:", invErr);
      }

      setPlayerSmartFill('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Fehler beim Smart Fill");
    } finally {
      setIsSmartFillingChar(false);
    }
  };

  const handleGenerateAllNPCs = async () => {
    setIsGeneratingNpcs(true);
    setError(null);
    try {
      const existingFactions = loreDatabase
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const generated = await GeminiService.generateNPCs(world, 3, player, prologue, existingFactions);
      setNpcs(generated.map((n: any) => {
        const mappedPower = mapCharacterAbilitiesAndPowers(n);
        return { 
          ...n, 
          id: Math.random().toString(36).substr(2, 9), 
          attributes: [],
          abilities: mappedPower.abilities,
          campaignPowerLevels: mappedPower.campaignPowerLevels
        };
      }));
    } catch (err: any) {
      console.error(err);
      setError("NPC-Generierung fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingNpcs(false);
    }
  };

  const handleGenerateAllPortraits = async () => {
    setIsGeneratingNpcs(true);
    setError(null);
    try {
      const updatedNpcs = [...npcs];
      for (let i = 0; i < updatedNpcs.length; i++) {
        setGeneratingPortraitId(updatedNpcs[i].id);
        const img = await GeminiService.generateCharacterPortrait(updatedNpcs[i], world);
        if (img) updatedNpcs[i] = { ...updatedNpcs[i], image: img };
      }
      setNpcs(updatedNpcs);
    } catch (err: any) {
      console.error(err);
      setError("Generierung der NPC-Portraits fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingNpcs(false);
      setGeneratingPortraitId(null);
    }
  };

  const handleGenerateSingleNPC = async (id: string) => {
    setGeneratingNpcId(id);
    setError(null);
    const existingNpc = npcs.find(n => n.id === id);
    try {
      const existingFactions = loreDatabase
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const npcData = await GeminiService.generateSingleNPC(world, existingNpc, player, prologue, existingFactions);
      setNpcs(npcs.map(n => n.id === id ? { ...n, ...npcData, id, attributes: [] } : n));
    } catch (err: any) {
      console.error(err);
      setError("Generierung des NPCs fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setGeneratingNpcId(null);
    }
  };

  const handleGenerateNPCPortrait = async (id: string) => {
    setGeneratingPortraitId(id);
    setError(null);
    const npc = npcs.find(n => n.id === id);
    if (!npc) return;
    try {
      const imageUrl = await GeminiService.generateCharacterPortrait(npc, world);
      if (imageUrl) setNpcs(npcs.map(n => n.id === id ? { ...n, image: imageUrl } : n));
    } catch (err: any) {
      console.error(err);
      setError("Generierung des NPC-Portraits fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setGeneratingPortraitId(null);
    }
  };

  const handleAddKInpc = async () => {
    setIsGeneratingNpcs(true);
    setError(null);
    try {
      const existingFactions = loreDatabase
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const npcData = await GeminiService.generateSingleNPC(world, undefined, player, prologue, existingFactions);
      const id = Math.random().toString(36).substr(2, 9);
      setNpcs([...npcs, { ...npcData, id, attributes: [] }]);
      setExpandedNpcId(id);
    } catch (err: any) {
      console.error(err);
      setError("Hinzufügen des KI-NPCs fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingNpcs(false);
    }
  };

  const handleGeneratePrologue = async () => {
    setIsGeneratingPrologue(true);
    setError(null);
    try {
      const text = await GeminiService.generatePrologue(world, player, selectedTags, loreDatabase);
      setPrologue(text);
    } catch (err: any) {
      console.error(err);
      setError("Generierung des Prologs fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingPrologue(false);
    }
  };

  const handleGenerateFirstMessage = async () => {
    setIsGeneratingFirstMsg(true);
    setError(null);
    try {
      const msg = await GeminiService.generateFirstMessage(world, player, npcs, prologue, selectedTags, loreDatabase);
      setFirstMessage(msg);
    } catch (err: any) {
      console.error(err);
      setError("Generierung der Startszene fehlgeschlagen: " + (err?.message || "Unbekannter Fehler / Sicherheitsfilter"));
    } finally {
      setIsGeneratingFirstMsg(false);
    }
  };

  const handleGenerateEconomy = async () => {
    try {
      setIsGeneratingEconomy(true);
      setError(null);
      const holdings = await GeminiService.generateEconomyHoldings(world, loreDatabase);
      if (holdings && holdings.length > 0) {
        setWorld(prev => ({
          ...prev,
          economyConfig: {
            currencyName: prev.economyConfig?.currencyName || 'Goldmünzen',
            currencyIcon: prev.economyConfig?.currencyIcon || 'G',
            payoutInterval: prev.economyConfig?.payoutInterval || 'weekly',
            allowPassiveIncome: prev.economyConfig?.allowPassiveIncome ?? true,
            enableRandomEvents: prev.economyConfig?.enableRandomEvents ?? true,
            holdings: holdings
          }
        }));
        setSuccessMessage(`${holdings.length} Wirtschaftsbetriebe & Besitztümer erfolgreich KI-generiert!`);
      }
    } catch (err: any) {
      console.error('Fehler bei KI-Wirtschaftsgenerierung:', err);
      setError('Fehler bei der Generierung der Wirtschaftsdaten: ' + (err?.message || 'Unbekannter Fehler'));
    } finally {
      setIsGeneratingEconomy(false);
    }
  };

  const handlePlayerAppearanceChange = (field: keyof typeof player.appearance, val: string) => {
    // 1. Retrieve the clean untransformed baseline Standardgestalt
    const baselineApp = {
      ...(player.appearance?.originalStandardAppearance || player.appearance)
    };
    delete baselineApp.originalStandardAppearance;

    // 2. Apply the change and auto-calculations to the baseline
    let newBaselineApp = { ...baselineApp, [field]: val };
    newBaselineApp = autoCalculateAppearance(newBaselineApp, field);

    // 3. Temporarily create a character with this new clean baseline
    const tempPlayer = {
      ...player,
      appearance: {
        ...player.appearance,
        ...newBaselineApp,
        originalStandardAppearance: undefined
      }
    };

    // 4. Re-apply the metamorphosis with the current intensity to compute the proper backed up/morphed state
    const currentIntensity = player.appearance?.transformationIntensity ?? 0;
    const updatedPlayer = updateStandardFormFromMetamorphosisThresholds(tempPlayer, currentIntensity);

    setPlayer(updatedPlayer);

    if (field === 'currentLocation') {
      setStatusElements(prev => {
        const hasLocElement = prev.some(s => (s.label || '').toLowerCase().includes('standort') || (s.label || '').toLowerCase().includes('ort'));
        if (hasLocElement) {
          return prev.map(s => {
            if ((s.label || '').toLowerCase().includes('standort') || (s.label || '').toLowerCase().includes('ort')) {
              return { ...s, value: val };
            }
            return s;
          });
        } else {
          return [...prev, { id: Math.random().toString(36).substr(2, 9), label: 'Standort', value: val }];
        }
      });
    }
  };

  const activeTransformationId = player.appearance?.activeTransformationId || 'standard';
  const activeTransformation = (player.abilities || []).find(
    a => a.category === 'Transformationen' && a.id === activeTransformationId
  );

  const getPlayerName = () => {
    if (activeTransformation) {
      return activeTransformation.transformName !== undefined
        ? activeTransformation.transformName
        : '';
    }
    return player.name || '';
  };

  const getPlayerRufName = () => {
    if (activeTransformation) {
      return activeTransformation.transformRufName !== undefined
        ? activeTransformation.transformRufName
        : '';
    }
    return player.rufName || '';
  };

  const getPlayerNickname = () => {
    if (activeTransformation) {
      return activeTransformation.transformNickname !== undefined
        ? activeTransformation.transformNickname
        : '';
    }
    return player.nickname || '';
  };

  const getPlayerRole = () => {
    if (activeTransformation) {
      return activeTransformation.transformRole !== undefined
        ? activeTransformation.transformRole
        : (player.role || player.profession || '');
    }
    return player.role || player.profession || '';
  };

  const getAppearanceValue = (field: keyof typeof player.appearance) => {
    if (activeTransformation) {
      const transformKey = `transform${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof typeof activeTransformation;
      const transformVal = (activeTransformation[transformKey] as string) || '';
      
      if (field === 'outfit') {
        const isOnePiece = 
          (world?.title || '').toLowerCase().includes('one piece') ||
          (world?.description || '').toLowerCase().includes('one piece') ||
          (player?.bio || '').toLowerCase().includes('one piece') ||
          (player?.bio || '').toLowerCase().includes('teufelsfrucht') ||
          (player?.bio || '').toLowerCase().includes('zoan');
          
        const lowerVal = transformVal.toLowerCase().trim();
        const isEmptyOrKeine = !transformVal || lowerVal === 'keine' || lowerVal === 'nackt' || lowerVal.includes('vollständiges fell') || lowerVal.includes('fell');
        
        if (isOnePiece && isEmptyOrKeine) {
          const baseOutfit = player.appearance.outfit || 'Standardkleidung';
          return `${baseOutfit} (Passt sich elastisch der veränderten Größe der Form an)`;
        }
      }
      if (transformVal) return transformVal;

      const tName = (activeTransformation.name || '').toLowerCase();
      const tDesc = (activeTransformation.description || '').toLowerCase();
      const isYouth = tName.includes('jungbrunn') || tName.includes('verjüng') || tName.includes('kind') || tDesc.includes('jungbrunn') || tDesc.includes('verjüng') || tDesc.includes('metamorphose');
      const isGiant = tName.includes('riese') || tName.includes('koloss') || tName.includes('giant') || tDesc.includes('riese') || tDesc.includes('koloss');
      const isBeast = tName.includes('bestie') || tName.includes('beast') || tName.includes('dämon') || tName.includes('werwolf');

      if ((field as string) === 'age' && isYouth) return '8-10 Jahre (Verjüngt)';
      if ((field as string) === 'build' && isYouth) return 'Kindlich / Zierlich';
      if ((field as string) === 'build' && isGiant) return 'Kolossal / Muskelbepackt';
      if ((field as string) === 'build' && isBeast) return 'Muskulös / Bestialisch';
      if ((field as string) === 'height' && isYouth) return '125 cm';
      if ((field as string) === 'height' && isGiant) return '380 cm';
      if ((field as string) === 'weight' && isYouth) return '28 kg';
      if ((field as string) === 'weight' && isGiant) return '450 kg';
      if ((field as string) === 'looks' && isYouth) return 'Kindliche, verjüngte Gesichtszüge durch den Jungbrunn-Fluch';

      return player.appearance[field] || '';
    }
    
    // When editing the Standardgestalt, we must read from the clean baseline backup if available,
    // otherwise the inputs will show morphed values.
    const baselineApp = player.appearance?.originalStandardAppearance || player.appearance;
    return (baselineApp as any)[field] || '';
  };

  const updatePlayerName = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformName: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, name: val });
    }
  };

  const updatePlayerRufName = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformRufName: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, rufName: val });
    }
  };

  const updatePlayerNickname = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformNickname: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, nickname: val });
    }
  };

  const updatePlayerRole = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformRole: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer(prev => ({ ...prev, role: val, profession: val }));
    }
  };

  const updateAppearanceValue = (field: keyof typeof player.appearance, val: any) => {
    if (activeTransformation) {
      const transformKey = `transform${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof typeof activeTransformation;
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, [transformKey]: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      handlePlayerAppearanceChange(field, val);
    }
  };

  const updateAppearanceMultiple = (updates: Partial<typeof player.appearance>) => {
    if (activeTransformation) {
      const transformUpdates: any = {};
      Object.entries(updates).forEach(([k, v]) => {
        const transformKey = `transform${k.charAt(0).toUpperCase() + k.slice(1)}`;
        transformUpdates[transformKey] = v;
      });
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, ...transformUpdates } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      const baselineApp = {
        ...(player.appearance?.originalStandardAppearance || player.appearance)
      };
      delete (baselineApp as any).originalStandardAppearance;

      let newBaselineApp = { ...baselineApp, ...updates };
      Object.keys(updates).forEach(f => {
        newBaselineApp = autoCalculateAppearance(newBaselineApp, f);
      });

      const tempPlayer = {
        ...player,
        appearance: {
          ...player.appearance,
          ...newBaselineApp,
          originalStandardAppearance: undefined
        }
      };

      const currentIntensity = player.appearance?.transformationIntensity ?? 0;
      const updatedPlayer = updateStandardFormFromMetamorphosisThresholds(tempPlayer, currentIntensity);
      setPlayer(updatedPlayer);
    }
  };

  const getPlayerPersonality = () => {
    if (activeTransformation) {
      return activeTransformation.transformPersonality !== undefined 
        ? activeTransformation.transformPersonality 
        : (player.personality || '');
    }
    return player.personality || '';
  };

  const getPlayerPersonalityTraits = (): PersonalityTraits => {
    if (activeTransformation) {
      return activeTransformation.transformPersonalityTraits || player.personalityTraits || {};
    }
    return player.personalityTraits || {};
  };

  const updatePlayerPersonality = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformPersonality: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, personality: val });
    }
  };

  const updatePlayerPersonalityTraits = (traits: PersonalityTraits) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformPersonalityTraits: traits } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, personalityTraits: traits });
    }
  };

  const getPlayerPersonalityArchetype = (): string => {
    if (activeTransformation) {
      return activeTransformation.transformPersonalityArchetype !== undefined
        ? activeTransformation.transformPersonalityArchetype
        : (player.appearance?.personalityArchetype || player.personalityArchetype || '-');
    }
    return player.appearance?.personalityArchetype || player.personalityArchetype || '-';
  };

  const updatePlayerPersonalityArchetype = (archetype: string) => {
    const currentTraits = getPlayerPersonalityTraits();
    const updatedTraits = applyArchetypeToTraits(currentTraits, archetype);
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { 
              ...a, 
              transformPersonalityArchetype: archetype,
              transformPersonalityTraits: updatedTraits
            } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({
        ...player,
        personalityArchetype: archetype,
        personalityTraits: updatedTraits,
        appearance: {
          ...player.appearance,
          personalityArchetype: archetype
        }
      });
    }
  };

  const getPlayerBio = () => {
    if (activeTransformation) {
      return activeTransformation.transformBio !== undefined 
        ? activeTransformation.transformBio 
        : (player.bio || '');
    }
    return player.bio || '';
  };

  const updatePlayerBio = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformBio: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, bio: val });
    }
  };

  const getPlayerCurrentSituation = () => {
    if (activeTransformation) {
      return activeTransformation.transformCurrentSituation !== undefined 
        ? activeTransformation.transformCurrentSituation 
        : (player.currentSituation || '');
    }
    return player.currentSituation || '';
  };

  const updatePlayerCurrentSituation = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformCurrentSituation: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, currentSituation: val });
    }
  };

  const getPlayerGoal = () => {
    if (activeTransformation) {
      return activeTransformation.transformGoal !== undefined 
        ? activeTransformation.transformGoal 
        : (player.goal || '');
    }
    return player.goal || '';
  };

  const updatePlayerGoal = (val: string) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformGoal: val } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, goal: val });
    }
  };

  const getPlayerRelationships = (): CharacterRelationship[] => {
    if (activeTransformation) {
      return activeTransformation.transformRelationships !== undefined 
        ? activeTransformation.transformRelationships 
        : (player.relationships || []);
    }
    return player.relationships || [];
  };

  const updatePlayerRelationships = (newList: CharacterRelationship[]) => {
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformRelationships: newList } 
          : a
      );
      setPlayer({ ...player, abilities: updatedAbilities });
    } else {
      setPlayer({ ...player, relationships: newList });
    }
  };

  const handleDeleteAbility = (abilityId: string) => {
    const currentAbilities = player.abilities || [];
    const abilityToDelete = currentAbilities.find(a => a.id === abilityId);

    // 1. Basic filter to remove from player.abilities
    const updatedAbilities = currentAbilities.filter(a => a.id !== abilityId);

    // 2. If it's the active transformation, reset activeTransformationId to standard
    let updatedAppearance = player.appearance;
    if (player.appearance?.activeTransformationId === abilityId) {
      updatedAppearance = {
        ...player.appearance,
        activeTransformationId: 'standard'
      };
    }

    setPlayer({
      ...player,
      appearance: updatedAppearance,
      abilities: updatedAbilities
    });

    // 3. If it is a Body Swap (koerpertausch) or reciprocal swap, we should also clean it up on partner characters
    if (abilityToDelete) {
      const isBodySwap = abilityToDelete.transformIdentityPerception === 'koerpertausch' || 
                         abilityToDelete.transformSwappedCharacterName ||
                         (abilityId && String(abilityId).startsWith('trans_swap_reciprocal_')) ||
                         (abilityId && String(abilityId).startsWith('reciprocal_swap_'));
      
      if (isBodySwap) {
        const targetId = abilityToDelete.transformSwappedCharacterId;
        const targetName = abilityToDelete.transformSwappedCharacterName || 
                           abilityToDelete.name?.replace('Körpertausch: ', '')?.trim();

        // A. Clean up NPCs
        if (npcs && npcs.length > 0) {
          const updatedNpcs = npcs.map(npc => {
            const matchesNpc = (targetId && npc.id === targetId) || 
                               (targetName && npc.name?.toLowerCase().trim() === targetName.toLowerCase().trim());
            
            if (matchesNpc && npc.abilities) {
              return {
                ...npc,
                abilities: npc.abilities.filter(a => {
                  const isMatch = a.transformIdentityPerception === 'koerpertausch' && 
                    (a.transformSwappedCharacterId === (player as any).id || 
                     (a.transformSwappedCharacterName && a.transformSwappedCharacterName.toLowerCase().trim() === (player.name || '').toLowerCase().trim()));
                  return !isMatch;
                })
              };
            }
            return npc;
          });
          setNpcs(updatedNpcs);
        }

        // B. Clean up Lore Database (Codex-Charaktere)
        if (loreDatabase && loreDatabase.length > 0) {
          const updatedLore = loreDatabase.map(entry => {
            const matchesLore = (targetId && entry.id === targetId) || 
                                (targetName && entry.title?.toLowerCase().trim() === targetName.toLowerCase().trim());
            
            if (matchesLore && entry.details?.abilities) {
              return {
                ...entry,
                details: {
                  ...entry.details,
                  abilities: entry.details.abilities.filter((a: any) => {
                    const isMatch = a.transformIdentityPerception === 'koerpertausch' && 
                      (a.transformSwappedCharacterId === (player as any).id || 
                       (a.transformSwappedCharacterName && a.transformSwappedCharacterName.toLowerCase().trim() === (player.name || '').toLowerCase().trim()));
                    return !isMatch;
                  })
                }
              };
            }
            return entry;
          });
          setLoreDatabase(updatedLore);
        }
      }
    }
  };

  const addNPC = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNPC: NPC = {
      id,
      name: '',
      role: '',
      personality: '',
      bio: '',
      currentSituation: '',
      goal: '',
      isHostile: false,
      appearance: {
        hairColor: '',
        eyeColor: '',
        age: '',
        build: 'Schlank',
        gender: 'Weiblich',
        cupSize: '',
        race: '',
        raceFeatures: '',
        height: '',
        measurements: '',
        origin: '',
        family: '',
        faction: '',
        outfit: ''
      },
      attributes: []
    };
    setNpcs([...npcs, newNPC]);
    setExpandedNpcId(id);
  };

  const updateNPC = (id: string, updates: Partial<NPC>) => {
    setNpcs(npcs.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const updateNPCAppearance = (id: string, updates: Partial<NPC['appearance']>) => {
    setNpcs(npcs.map(n => n.id === id ? { ...n, appearance: { ...n.appearance, ...updates } } : n));
  };

  const handleHarmonizeWorld = async () => {
    setIsHarmonizing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const currentNpcs = loreDatabase
        .filter(l => l.category === 'Charaktere' && l.title?.trim().toLowerCase() !== player.name?.trim().toLowerCase())
        .map(c => ({
          id: c.id,
          name: c.title,
          bio: c.description,
          currentSituation: c.details?.currentSituation || '',
          relationship: c.details?.relationship || '',
          conduct: c.details?.conduct || ''
        }));

      const result = await GeminiService.harmonizeWorldWithSecrets(
        world,
        prologue,
        firstMessage,
        currentNpcs,
        loreDatabase,
        world.isNsfw
      );

      if (result.worldDescription) {
        setWorld(prev => ({ ...prev, description: result.worldDescription }));
      }

      if (result.prologue) {
        setPrologue(result.prologue);
      }
      if (result.firstMessage) {
        setFirstMessage(result.firstMessage);
      }

      let updatedLore = [...loreDatabase];

      if (Array.isArray(result.npcs)) {
        updatedLore = updatedLore.map(item => {
          if (item.category === 'Charaktere') {
            const matchedNpc = result.npcs.find(n => n.name?.toLowerCase() === item.title?.toLowerCase());
            if (matchedNpc) {
              return {
                ...item,
                description: matchedNpc.bio || item.description,
                details: {
                  ...item.details,
                  currentSituation: matchedNpc.currentSituation || item.details?.currentSituation,
                  relationship: matchedNpc.relationship || item.details?.relationship,
                  conduct: matchedNpc.conduct || item.details?.conduct
                }
              };
            }
          }
          return item;
        });
      }

      if (Array.isArray(result.loreDatabase)) {
        updatedLore = updatedLore.map(item => {
          if (item.category !== 'Charaktere' && item.category !== 'Verbotenes Wissen') {
            const matchedLore = result.loreDatabase.find(l => l.title?.toLowerCase() === item.title?.toLowerCase());
            if (matchedLore) {
              return {
                ...item,
                description: matchedLore.description || item.description
              };
            }
          }
          return item;
        });
      }

      setLoreDatabase(updatedLore);
      setSuccessMessage("Erfolg: Die Spielwelt, der Prolog, die Startszene, alle NPCs und Codex-Einträge wurden erfolgreich an dein verbotenes Wissen angepasst und harmonisiert!");
    } catch (err: any) {
      console.error(err);
      setError("Fehler bei der Konsistenz-Harmonisierung: " + err.message);
    } finally {
      setIsHarmonizing(false);
    }
  };

  const handleGenerateWorldMap = async (smartFillPrompt?: string) => {
    setIsGeneratingWorldMap(true);
    setError(null);
    setSuccessMessage(null);
    try {
      let existingMapContext = '';
      if (smartFillPrompt) {
        const items: string[] = [];
        (world.regionMarkers || []).forEach(m => {
          items.push(`- [Region/Landmarke] "${m.name}" (${m.type}) bei Zentrum (x: ${m.x}, y: ${m.y}), Grenzen: [minX: ${m.minX ?? Math.max(0, m.x-8)}, maxX: ${m.maxX ?? Math.min(100, m.x+8)}, minY: ${m.minY ?? Math.max(0, m.y-6)}, maxY: ${m.maxY ?? Math.min(100, m.y+6)}] ${m.color ? `Farbe: ${m.color}` : ''} - ${m.description || ''}`);
        });
        (world.civilizationMarkers || []).forEach(m => {
          items.push(`- [Zivilisation/Reich] "${m.name}" (${m.type}) bei Zentrum (x: ${m.x}, y: ${m.y}), Grenzen: [minX: ${m.minX ?? Math.max(0, m.x-8)}, maxX: ${m.maxX ?? Math.min(100, m.x+8)}, minY: ${m.minY ?? Math.max(0, m.y-6)}, maxY: ${m.maxY ?? Math.min(100, m.y+6)}] - ${m.description || ''}`);
        });
        (world.placeMarkers || []).forEach(m => {
          items.push(`- [Ort/Siedlung] "${m.name}" (${m.type}) bei Zentrum (x: ${m.x}, y: ${m.y}), Grenzen: [minX: ${m.minX ?? Math.max(0, m.x-5)}, maxX: ${m.maxX ?? Math.min(100, m.x+5)}, minY: ${m.minY ?? Math.max(0, m.y-5)}, maxY: ${m.maxY ?? Math.min(100, m.y+5)}] - ${m.description || ''}`);
        });
        (world.terrains || []).forEach(m => {
          items.push(`- [Gelände/Landschaft] "${m.name}" (${m.type}) bei Zentrum (x: ${m.x}, y: ${m.y}), Grenzen: [minX: ${m.minX ?? Math.max(0, m.x-8)}, maxX: ${m.maxX ?? Math.min(100, m.x+8)}, minY: ${m.minY ?? Math.max(0, m.y-6)}, maxY: ${m.maxY ?? Math.min(100, m.y+6)}] - ${m.description || ''}`);
        });
        existingMapContext = items.length > 0 ? items.join('\n') : 'Bisher keine Landmarken auf der Karte vorhanden.';
      }

      const res = await GeminiService.generateWorldMapAndRulesFromSixCreationRules(
        world.title,
        world.description,
        selectedTags,
        world.isNsfw,
        smartFillPrompt,
        existingMapContext
      );
      
      if (res) {
        if (smartFillPrompt) {
          // APPEND & ENRICH MODE
          const isRedLinePrompt = /red\s*line|rote\s*linie|redline/i.test(smartFillPrompt);

          setWorld(prev => {
            let oldTerrains = prev.terrains || [];
            let oldConnections = prev.connections || [];
            let oldRegionMarkers = prev.regionMarkers || [];
            let oldCivMarkers = prev.civilizationMarkers || [];
            let oldPlaceMarkers = prev.placeMarkers || [];

            // If Red Line is requested, strip away any old/broken Red Line items or misplaced top-left test items
            if (isRedLinePrompt) {
              const isRedLineItem = (name: string) => /red\s*line|rote\s*linie|redline/i.test(name || '');
              oldRegionMarkers = oldRegionMarkers.filter(m => !isRedLineItem(m.name));
              oldTerrains = oldTerrains.filter(t => !isRedLineItem(t.name));
              oldCivMarkers = oldCivMarkers.filter(c => !isRedLineItem(c.name));
              oldPlaceMarkers = oldPlaceMarkers.filter(p => !isRedLineItem(p.name));
            }

            // Extract terrains
            let newTerrains = (res.terrains || []).map((t: any) => {
              const cx = typeof t.x === 'number' ? t.x : 50;
              const cy = typeof t.y === 'number' ? t.y : 50;
              return {
                type: t.type || 'Gebirge',
                name: t.name,
                description: t.description || '',
                x: cx,
                y: cy,
                minX: typeof t.minX === 'number' ? t.minX : Math.max(0, cx - 8),
                maxX: typeof t.maxX === 'number' ? t.maxX : Math.min(100, cx + 8),
                minY: typeof t.minY === 'number' ? t.minY : Math.max(0, cy - 6),
                maxY: typeof t.maxY === 'number' ? t.maxY : Math.min(100, cy + 6),
                color: t.color || '#f59e0b',
                adjacentZones: t.adjacentZones || ''
              };
            }).filter((t: any) => t && t.name && !oldTerrains.some(ot => ot.name.toLowerCase() === t.name.toLowerCase()));
            
            // Extract regions
            let newRegionMarkers = (res.regions || []).map((reg: any) => {
              let type = reg.type || 'Wald';
              const b = (reg.biome || reg.type || reg.title || '').toLowerCase();
              if (b.includes('gebirge') || b.includes('berg') || b.includes('wall') || b.includes('kette') || b.includes('line')) type = 'Gebirgspass';
              else if (b.includes('insel')) type = 'Inselgruppe';
              else if (b.includes('ruine') || b.includes('alt')) type = 'Ruine';
              else if (b.includes('tempel') || b.includes('heilig')) type = 'Tempel';
              else if (b.includes('dungeon') || b.includes('höhle')) type = 'Dungeon';

              const name = reg.title || reg.name;
              const cx = typeof reg.x === 'number' ? reg.x : 50;
              const cy = typeof reg.y === 'number' ? reg.y : 50;

              return {
                type,
                name,
                description: reg.description || '',
                x: cx,
                y: cy,
                minX: typeof reg.minX === 'number' ? reg.minX : Math.max(0, cx - 8),
                maxX: typeof reg.maxX === 'number' ? reg.maxX : Math.min(100, cx + 8),
                minY: typeof reg.minY === 'number' ? reg.minY : Math.max(0, cy - 6),
                maxY: typeof reg.maxY === 'number' ? reg.maxY : Math.min(100, cy + 6),
                color: reg.color || (name.toLowerCase().includes('red line') ? '#ef4444' : '#10b981'),
                adjacentZones: reg.adjacentZones || '',
                hazardLevel: 'Mittel'
              };
            }).filter((rm: any) => rm && rm.name && !oldRegionMarkers.some(orm => orm.name.toLowerCase() === rm.name.toLowerCase()));

            // Extract civs
            let newCivMarkers = (res.civilizations || []).map((civ: any) => {
              const cx = typeof civ.x === 'number' ? civ.x : 50;
              const cy = typeof civ.y === 'number' ? civ.y : 50;
              return {
                name: civ.name,
                type: civ.type || 'Königreich',
                description: civ.description || '',
                x: cx,
                y: cy,
                minX: typeof civ.minX === 'number' ? civ.minX : Math.max(0, cx - 8),
                maxX: typeof civ.maxX === 'number' ? civ.maxX : Math.min(100, cx + 8),
                minY: typeof civ.minY === 'number' ? civ.minY : Math.max(0, cy - 6),
                maxY: typeof civ.maxY === 'number' ? civ.maxY : Math.min(100, cy + 6),
                color: civ.color || '#f43f5e',
                adjacentZones: civ.adjacentZones || ''
              };
            }).filter((c: any) => c && c.name && !oldCivMarkers.some(oc => oc.name.toLowerCase() === c.name.toLowerCase()));

            // Extract places
            let newPlaceMarkers = (res.places || []).map((p: any) => {
              const cx = typeof p.x === 'number' ? p.x : 50;
              const cy = typeof p.y === 'number' ? p.y : 50;
              return {
                name: p.name,
                type: p.type || 'Hauptstadt',
                description: p.description || '',
                x: cx,
                y: cy,
                minX: typeof p.minX === 'number' ? p.minX : Math.max(0, cx - 5),
                maxX: typeof p.maxX === 'number' ? p.maxX : Math.min(100, cx + 5),
                minY: typeof p.minY === 'number' ? p.minY : Math.max(0, cy - 5),
                maxY: typeof p.maxY === 'number' ? p.maxY : Math.min(100, cy + 5),
                color: p.color || '#38bdf8',
                adjacentZones: p.adjacentZones || ''
              };
            }).filter((p: any) => p && p.name && !oldPlaceMarkers.some(op => op.name.toLowerCase() === p.name.toLowerCase()));

            // If user specifically asked for Red Line:
            if (isRedLinePrompt) {
              const redLineItem = {
                type: 'Gebirgspass',
                name: 'Red Line',
                description: 'Eine gigantische, rote Kontinentalwand, die sich vertikal über die gesamte Welt erstreckt und Reverse Mountain bei Zentrum (x: 50, y: 50) kreuzt.',
                x: 50,
                y: 50,
                minX: 47,
                maxX: 53,
                minY: 0,
                maxY: 100,
                color: '#ef4444',
                adjacentZones: 'Reverse Mountain, North Blue, East Blue, West Blue, South Blue',
                hazardLevel: 'Mittel'
              };

              newRegionMarkers = [redLineItem];
              newCivMarkers = [];
              newPlaceMarkers = [];
              newTerrains = [];
            } else if (smartFillPrompt.trim().length > 0 && !smartFillPrompt.toLowerCase().includes('erweitere') && !smartFillPrompt.toLowerCase().includes('mehr')) {
              // Targeted prompt: filter out unrequested filler items
              const promptWords = smartFillPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
              if (promptWords.length > 0) {
                const matchesPrompt = (item: any) => {
                  const text = `${item.name || ''} ${item.description || ''} ${item.type || ''}`.toLowerCase();
                  return promptWords.some(w => text.includes(w));
                };
                newRegionMarkers = newRegionMarkers.filter(matchesPrompt);
                newCivMarkers = newCivMarkers.filter(matchesPrompt);
                newPlaceMarkers = newPlaceMarkers.filter(matchesPrompt);
                newTerrains = newTerrains.filter(matchesPrompt);
              }
            }

            // Extract connections
            const newConnections = (res.connections || []).filter((c: any) => c && c.fromPlace && c.toPlace && !oldConnections.some(oc => oc.fromPlace?.toLowerCase() === c.fromPlace?.toLowerCase() && oc.toPlace?.toLowerCase() === c.toPlace?.toLowerCase()));

            return normalizeOnePieceWorldGeometry({
              ...prev,
              terrains: [...oldTerrains, ...newTerrains],
              regionMarkers: [...oldRegionMarkers, ...newRegionMarkers],
              civilizationMarkers: [...oldCivMarkers, ...newCivMarkers],
              placeMarkers: [...oldPlaceMarkers, ...newPlaceMarkers],
              connections: [...oldConnections, ...newConnections]
            });
          });

          // Also convert and append to loreDatabase
          const newRegions: LoreEntry[] = (res.regions || []).map((reg: any, index: number) => ({
            id: `macro-region-${Date.now()}-${index}`,
            category: 'Orte',
            title: reg.title || reg.name,
            description: reg.description || '',
            isUnlocked: true,
            details: {
              mapLevel: 'macro',
              type: reg.type || 'Region',
              biome: reg.biome || '',
              climate: reg.climate || '',
              coordinates: { x: typeof reg.x === 'number' ? reg.x : 50, y: typeof reg.y === 'number' ? reg.y : 50 }
            }
          }));

          const newWeltregeln: LoreEntry[] = (res.weltregeln || []).map((wr: any, index: number) => ({
            id: `weltregel-${Date.now()}-${index}`,
            category: 'Weltregeln',
            title: wr.title,
            description: wr.description || '',
            isUnlocked: true,
            details: {
              scope: wr.scope || 'Weltweit',
              restrictedFrom: wr.restrictedFrom || ''
            }
          }));

          setLoreDatabase(prev => [...prev, ...newRegions, ...newWeltregeln]);
          setSuccessMessage("Die Weltkarte wurde erfolgreich erweitert! Neue Landmarken, Regionen und Transportwege wurden hinzugefügt.");
        } else {
          // ORIGINAL OVERWRITE MODE
          const processedTerrains = (res.terrains || []).map((t: any) => {
            const cx = typeof t.x === 'number' ? t.x : 50;
            const cy = typeof t.y === 'number' ? t.y : 50;
            return {
              type: t.type || 'Gebirge',
              name: t.name,
              description: t.description || '',
              x: cx,
              y: cy,
              minX: typeof t.minX === 'number' ? t.minX : Math.max(0, cx - 8),
              maxX: typeof t.maxX === 'number' ? t.maxX : Math.min(100, cx + 8),
              minY: typeof t.minY === 'number' ? t.minY : Math.max(0, cy - 6),
              maxY: typeof t.maxY === 'number' ? t.maxY : Math.min(100, cy + 6),
              color: t.color || '#f59e0b',
              adjacentZones: t.adjacentZones || ''
            };
          });

          const processedRegions = (res.regions || []).map((reg: any) => {
            let type = reg.type || 'Wald';
            const b = (reg.biome || reg.type || reg.title || '').toLowerCase();
            if (b.includes('gebirge') || b.includes('berg') || b.includes('wall') || b.includes('kette') || b.includes('line')) type = 'Gebirgspass';
            else if (b.includes('insel')) type = 'Inselgruppe';
            else if (b.includes('ruine') || b.includes('alt')) type = 'Ruine';
            else if (b.includes('tempel') || b.includes('heilig')) type = 'Tempel';
            else if (b.includes('dungeon') || b.includes('höhle')) type = 'Dungeon';

            const name = reg.title || reg.name;
            const cx = typeof reg.x === 'number' ? reg.x : 50;
            const cy = typeof reg.y === 'number' ? reg.y : 50;

            return {
              type,
              name,
              description: reg.description || '',
              x: cx,
              y: cy,
              minX: typeof reg.minX === 'number' ? reg.minX : Math.max(0, cx - 8),
              maxX: typeof reg.maxX === 'number' ? reg.maxX : Math.min(100, cx + 8),
              minY: typeof reg.minY === 'number' ? reg.minY : Math.max(0, cy - 6),
              maxY: typeof reg.maxY === 'number' ? reg.maxY : Math.min(100, cy + 6),
              color: reg.color || (name.toLowerCase().includes('red line') ? '#ef4444' : '#10b981'),
              adjacentZones: reg.adjacentZones || '',
              hazardLevel: 'Mittel'
            };
          });

          const processedCivs = (res.civilizations || []).map((civ: any) => {
            const cx = typeof civ.x === 'number' ? civ.x : 50;
            const cy = typeof civ.y === 'number' ? civ.y : 50;
            return {
              name: civ.name,
              type: civ.type || 'Königreich',
              description: civ.description || '',
              x: cx,
              y: cy,
              minX: typeof civ.minX === 'number' ? civ.minX : Math.max(0, cx - 8),
              maxX: typeof civ.maxX === 'number' ? civ.maxX : Math.min(100, cx + 8),
              minY: typeof civ.minY === 'number' ? civ.minY : Math.max(0, cy - 6),
              maxY: typeof civ.maxY === 'number' ? civ.maxY : Math.min(100, cy + 6),
              color: civ.color || '#f43f5e',
              adjacentZones: civ.adjacentZones || ''
            };
          });

          const processedPlaces = (res.places || []).map((p: any) => {
            const cx = typeof p.x === 'number' ? p.x : 50;
            const cy = typeof p.y === 'number' ? p.y : 50;
            return {
              name: p.name,
              type: p.type || 'Hauptstadt',
              description: p.description || '',
              x: cx,
              y: cy,
              minX: typeof p.minX === 'number' ? p.minX : Math.max(0, cx - 5),
              maxX: typeof p.maxX === 'number' ? p.maxX : Math.min(100, cx + 5),
              minY: typeof p.minY === 'number' ? p.minY : Math.max(0, cy - 5),
              maxY: typeof p.maxY === 'number' ? p.maxY : Math.min(100, cy + 5),
              color: p.color || '#38bdf8',
              adjacentZones: p.adjacentZones || ''
            };
          });

          setWorld(prev => ({
            ...prev,
            worldStructure: {
              worldName: res.worldStructure?.worldName || world.title,
              type: res.worldStructure?.type || '',
              shape: res.worldStructure?.shape || '',
              continentsCount: res.worldStructure?.continentsCount || 0,
              seasCount: res.worldStructure?.seasCount || 0,
              islandsCount: res.worldStructure?.islandsCount || 0
            },
            relationships: res.relationships || [],
            terrains: processedTerrains,
            regionMarkers: processedRegions,
            civilizationMarkers: processedCivs,
            placeMarkers: processedPlaces,
            connections: res.connections || [],
            mapConfig: res.mapConfig || prev.mapConfig
          }));

          const filteredLore = loreDatabase.filter(l => 
            !(l.category === 'Orte' && l.details?.mapLevel === 'macro') &&
            !(l.category === 'Weltregeln')
          );

          const newRegions: LoreEntry[] = (res.regions || []).map((reg: any, index: number) => ({
            id: `macro-region-${Date.now()}-${index}`,
            category: 'Orte',
            title: reg.title || reg.name,
            description: reg.description || '',
            isUnlocked: true,
            details: {
              mapLevel: 'macro',
              type: reg.type || 'Region',
              biome: reg.biome || '',
              climate: reg.climate || '',
              coordinates: { x: typeof reg.x === 'number' ? reg.x : 50, y: typeof reg.y === 'number' ? reg.y : 50 }
            }
          }));

          const newWeltregeln: LoreEntry[] = (res.weltregeln || []).map((wr: any, index: number) => ({
            id: `weltregel-${Date.now()}-${index}`,
            category: 'Weltregeln',
            title: wr.title,
            description: wr.description || '',
            isUnlocked: true,
            details: {
              scope: wr.scope || 'Weltweit',
              restrictedFrom: wr.restrictedFrom || ''
            }
          }));

          setLoreDatabase([...filteredLore, ...newRegions, ...newWeltregeln]);
          setSuccessMessage("Die 6 Weltschöpfungs-Regeln wurden erfolgreich berechnet! Deine interaktive Weltkarte, Klimazonen, Transportwege und Zugangsregeln sind jetzt einsatzbereit.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Fehler bei der KI-Kartenerschaffung: " + err.message);
    } finally {
      setIsGeneratingWorldMap(false);
    }
  };

  const handleGenerateGeography = async () => {
    setIsGeneratingGeography(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await GeminiService.generateNaturalGeography(
        world.title,
        world.description,
        selectedTags,
        {
          worldSize: world.physicalGeography?.worldSize,
          continentsCount: world.physicalGeography?.continentsCount,
          climateZones: world.physicalGeography?.climateZones
        },
        world.isNsfw
      );

      if (res && res.physicalGeography) {
        setWorld(prev => ({
          ...prev,
          physicalGeography: {
            worldSize: res.physicalGeography.worldSize || prev.physicalGeography?.worldSize || 'Mittel',
            continentsCount: res.physicalGeography.continentsCount || prev.physicalGeography?.continentsCount || 0,
            oceans: res.physicalGeography.oceans || '',
            islands: res.physicalGeography.islands || '',
            mountains: res.physicalGeography.mountains || '',
            rivers: res.physicalGeography.rivers || '',
            lakes: res.physicalGeography.lakes || '',
            coasts: res.physicalGeography.coasts || '',
            forests: res.physicalGeography.forests || '',
            swamps: res.physicalGeography.swamps || '',
            deserts: res.physicalGeography.deserts || '',
            tundra: res.physicalGeography.tundra || '',
            volcanoes: res.physicalGeography.volcanoes || '',
            climateZones: res.physicalGeography.climateZones || ''
          },
          terrains: res.terrains || []
        }));
        setSuccessMessage("Die physische Welt und Geographie wurde erfolgreich durch die KI erschaffen! Die natürlichen Geländemerkmale wurden auf deiner Karte platziert.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Fehler bei der Generierung der Geographie: " + err.message);
    } finally {
      setIsGeneratingGeography(false);
    }
  };

  const handleFinish = () => {
    let newChatHistory = mode === GameViewMode.JOIN_CUSTOM_CHAR 
      ? [] 
      : ((initialData?.chatHistory && initialData.chatHistory.length > 0)
        ? [...initialData.chatHistory] 
        : [
            { id: 'prologue-msg', role: 'model', text: prologue || 'Die Reise beginnt...', isCombatLog: false } as any
          ]);

    // Update existing prologue and first message inside chatHistory if they were edited
    if (newChatHistory.length > 0) {
      const hasFirstMsg = newChatHistory.some(m => m.id === 'first-msg');
      
      newChatHistory = newChatHistory.map(m => {
        if (m.id === 'prologue-msg') {
          return { ...m, text: prologue || 'Die Reise beginnt...' };
        }
        if (m.id === 'first-msg' && firstMessage) {
          return { ...m, text: firstMessage };
        }
        return m;
      });

      // If we didn't have a first message but we just wrote one in the editor AND we only have the prologue...
      if (!hasFirstMsg && firstMessage && newChatHistory.length === 1 && newChatHistory[0].id === 'prologue-msg') {
        newChatHistory.push({ id: 'first-msg', role: 'model', text: firstMessage, isCombatLog: false } as any);
      }
    } else if (firstMessage) {
      newChatHistory = [
        { id: 'prologue-msg', role: 'model', text: prologue || 'Die Reise beginnt...', isCombatLog: false } as any,
        { id: 'first-msg', role: 'model', text: firstMessage, isCombatLog: false } as any
      ];
    }

    const finalNpcs: NPC[] = loreDatabase
      .filter(l => l.category === 'Charaktere' && l.title?.trim().toLowerCase() !== player.name?.trim().toLowerCase())
      .map(c => ({
        id: c.id,
        name: c.title,
        rufName: c.details?.rufName || '',
        role: c.details?.role || '',
        appearance: {
          gender: c.details?.gender || '',
          age: c.details?.age || '',
          build: c.details?.build || '',
          hairColor: c.details?.hairColor || '',
          eyeColor: c.details?.eyeColor || '',
          cupSize: c.details?.cupSize || '',
          outfit: c.details?.outfit || '',
          race: c.details?.race || '',
          raceFeatures: c.details?.raceFeatures || '',
        },
        bio: c.description,
        currentSituation: c.details?.currentSituation || '',
        goal: c.details?.goal || '',
        skills: c.details?.skills || '',
        isHostile: c.details?.isHostile || false,
        image: c.image,
        attributes: [],
        campaignPowerLevels: c.details?.campaignPowerLevels || {},
        personality: c.details?.personality || '',
        relationship: c.details?.relationship || '',
        conduct: c.details?.conduct || '',
        relationships: c.details?.relationships || [],
        conducts: c.details?.conducts || [],
        secretsStage1: c.secretsStage1 || c.details?.secretsStage1 || '',
        secretsStage2: c.secretsStage2 || c.details?.secretsStage2 || '',
        secretsStage3: c.secretsStage3 || c.details?.secretsStage3 || '',
        knowledge: c.knowledge || c.details?.knowledge || '',
      }));

    const finalWorld: WorldSetting = {
      ...world,
      era: selectedTags.join(', ')
    };

    const playerLore = loreDatabase.find(l => l.id === '__player_knowledge__' || (player.name && l.title === player.name));
    const finalPlayer = {
      ...player,
      knowledge: playerLore?.knowledge || playerLore?.details?.knowledge || player.knowledge || ''
    };

    let finalLoreDatabase = loreDatabase ? JSON.parse(JSON.stringify(loreDatabase)) : [];
    if (finalPlayer.name?.trim() && finalPlayer.relationships && finalPlayer.relationships.length > 0) {
      finalLoreDatabase = syncLoreWithReciprocalRelationships(finalLoreDatabase, finalPlayer.name.trim(), finalPlayer.relationships);
    }

    const finalAdventure: Adventure = {
      id: adventureIdRef.current,
      authorId: mode === GameViewMode.JOIN_CUSTOM_CHAR ? userId : (initialData?.authorId || userId),
      isPublic,
      world: finalWorld,
      player: finalPlayer,
      npcs: finalNpcs,
      loreDatabase: finalLoreDatabase,
      inventory: initialData?.inventory ?? ['Starterpaket'],
      structuredInventory: structuredInventory,
      prologue: prologue || 'Die Reise beginnt...',
      firstMessage: firstMessage,
      chatHistory: newChatHistory,
      backgroundImage: bgImage,
      statusElements,
      combatState: customCombatState,
      initialPlayer: JSON.parse(JSON.stringify(finalPlayer)),
      initialStatusElements: JSON.parse(JSON.stringify(statusElements)),
      initialStructuredInventory: structuredInventory ? JSON.parse(JSON.stringify(structuredInventory)) : undefined,
      initialLoreDatabase: finalLoreDatabase,
      initialNpcs: finalNpcs ? JSON.parse(JSON.stringify(finalNpcs)) : [],
      initialInventory: initialData?.inventory ?? ['Starterpaket']
    };
    onSave(finalAdventure);
  };

  const getLandmassPath = (cx: number, cy: number, seedStr: string, size = 12) => {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = seed + seedStr.charCodeAt(i) * (i + 1);
    }
    const numPoints = 14;
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const sinOffset1 = Math.sin(angle * 3 + seed) * 3.5;
      const cosOffset2 = Math.cos(angle * 5 + seed * 1.7) * 2.5;
      const r = size + sinOffset1 + cosOffset2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push({ x, y });
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      const nextIdx = (i + 1) % points.length;
      const p1 = points[i];
      const p2 = points[nextIdx];
      const xc = (p1.x + p2.x) / 2;
      const yc = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x} ${p1.y}, ${xc} ${yc}`;
    }
    d += " Z";
    return d;
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 min-h-screen relative sm:bg-transparent sm:py-10 sm:items-center overflow-y-auto w-full">
      <div className="w-full max-w-2xl bg-slate-900/50 sm:rounded-2xl border-b sm:border border-slate-700 backdrop-blur-md flex-1 flex flex-col relative overflow-hidden">
        
        <div className="border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 flex flex-col">
          <div className="p-4 sm:px-6 sm:py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-fantasy text-amber-400">
                {mode === GameViewMode.EDIT_WORLD ? 'Welt anpassen' : mode === GameViewMode.JOIN_CUSTOM_CHAR ? 'Dein Held' : 'Weltenschmiede'}
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                 {mode === GameViewMode.JOIN_CUSTOM_CHAR ? 'Anpassung' : `Schritt ${step} von 9`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mode === GameViewMode.EDIT_WORLD && (
                <button
                  onClick={handleFinish}
                  className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Alle Änderungen jetzt speichern und Editor schließen"
                >
                  <i className="fa-solid fa-floppy-disk"></i> Speichern
                </button>
              )}
              <button onClick={handleCancelClick} className="p-2 text-slate-500 hover:text-white" title="Abbrechen">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
          </div>

          {/* Quick-Switch Steps Navigation Bar */}
          {mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="px-4 pb-3 sm:px-6 flex flex-wrap items-center justify-start sm:justify-between gap-1.5 border-t border-slate-800/50 pt-2 bg-slate-950/20">
              {[
                { s: 1, label: 'Basics' },
                { s: 2, label: 'Logik' },
                { s: 3, label: 'Regeln' },
                { s: 4, label: 'Weltkarte' },
                { s: 5, label: 'Codex' },
                { s: 6, label: 'Held' },
                { s: 7, label: 'HUD' },
                { s: 8, label: 'Wirtschaft' },
                { s: 9, label: 'Start' },
              ].map((item) => {
                const isActive = step === item.s;
                return (
                  <button
                    key={item.s}
                    onClick={() => setStep(item.s)}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all text-left group shrink-0 ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      {item.s}
                    </span>
                    <span className="text-[11px] font-medium hidden sm:inline ml-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-8 flex-1 space-y-8 z-10 relative">
          {error && (
            <div className="p-3 bg-red-950/85 border border-red-800/40 rounded-xl text-red-200 text-xs flex justify-between items-center shadow-lg backdrop-blur-md animate-in fade-in duration-200">
              <span className="flex-1 pr-2">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold px-2 py-1">✕</button>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-950/85 border border-emerald-800/40 rounded-xl text-emerald-200 text-xs flex justify-between items-center shadow-lg backdrop-blur-md animate-in fade-in duration-200">
              <span className="flex-1 pr-2">{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 font-bold px-2 py-1">✕</button>
            </div>
          )}
          {step === 1 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-slate-100">Basics & Sichtbarkeit</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button onClick={() => setIsPublic(true)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${isPublic ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Öffentlich</button>
                    <button onClick={() => setIsPublic(false)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!isPublic ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>Privat</button>
                  </div>
                  <button 
                    onClick={() => setWorld({...world, isNsfw: !world.isNsfw})} 
                    className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-2 ${world.isNsfw ? 'bg-red-600/20 border-red-500 text-red-500 shadow-lg shadow-red-900/20' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    NSFW {world.isNsfw ? 'AN' : 'AUS'}
                  </button>
                  <button 
                    onClick={() => setWorld({...world, isHeroic: !world.isHeroic})} 
                    className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-2 ${world.isHeroic ? 'bg-amber-600/20 border-amber-500 text-amber-500 shadow-lg shadow-amber-900/20' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    <i className={`fa-solid ${world.isHeroic ? 'fa-crown' : 'fa-user-group'}`}></i>
                    {world.isHeroic ? 'Zentrum der Story' : 'Normaler Bürger'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Name deiner Welt</label>
                    <AutoExpandingTextarea className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white outline-none focus:ring-1 focus:ring-amber-500 transition-all text-sm" placeholder="Name deiner Welt" value={world.title || ''} onChange={e => setWorld({...world, title: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Drama-Level / Konflikt-Intensität</label>
                  <div className="flex gap-2">
                    {(['Niedrig', 'Mittel', 'Hoch'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setWorld({...world, dramaLevel: level})}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                          world.dramaLevel === level 
                            ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    {world.dramaLevel === 'Niedrig' && "Ruhige Geschichte. NPCs sind meist freundlich und bodenständig."}
                    {world.dramaLevel === 'Mittel' && "Ausgewogene Mischung aus Alltag und spannenden Wendungen."}
                    {world.dramaLevel === 'Hoch' && "Viel Drama, exzentrische Charaktere und häufige Konflikte."}
                  </p>
                </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Welten-Beschreibung</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white min-h-[128px] outline-none focus:ring-1 focus:ring-amber-500 transition-all text-sm"
                  placeholder="Was macht diese Welt einzigartig?"
                  value={world.description || ''}
                  onChange={e => setWorld({...world, description: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Tags / Genre</label>
                  <button 
                    onClick={() => setSelectedTags([])}
                    className="text-[10px] text-slate-500 hover:text-red-500 transition-colors font-bold uppercase"
                  >
                    Alle abwählen
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {top10Tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                        selectedTags.includes(tag) 
                          ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  
                  {isTagsExpanded && remainingTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                        selectedTags.includes(tag) 
                          ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {remainingTags.length > 0 && (
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800"
                    >
                      <i className={`fa-solid ${isTagsExpanded ? 'fa-angle-up' : 'fa-angle-down'}`}></i>
                      {isTagsExpanded ? 'Weniger Tags anzeigen' : `${remainingTags.length} weitere Tags anzeigen`}
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customTag.trim()) {
                        handleAddCustomTagState(customTag);
                        setCustomTag('');
                      }
                    }}
                    placeholder="Eigenen Tag / Genre hinzufügen..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTag.trim()) {
                        handleAddCustomTagState(customTag);
                      }
                      setCustomTag('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i> Hinzufügen
                  </button>
                </div>
              </div>
              </div>
              <button onClick={handleAutofillStep1} disabled={isGenerating} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95">
                 <i className={`fa-solid ${isGenerating ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i> KI-Gesamtpaket generieren
              </button>
            </div>
          )}

          
          {step === 2 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xl font-fantasy text-amber-400 flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    <span>LOGIK FÜR DIE WERTE-STEIGERUNG & PROGRESSION</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Wähle die globale Progression-Regel aus, die für alle erstellten Parameter (z.B. HP, Magie, Stärke) sowie Fertigkeiten und Techniken in dieser Kampagne gilt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {[
                    { id: 'ep', icon: '⚡', label: 'EP-basiert (Kampf)', desc: 'Erfahrungspunkte (XP) werden für fast jede Aktion im Kampf erhalten. Immer genau 100 EP für ein Level-Up. Wenn dein Charakter ein viel höheres Level und Rang als der Gegner hat, erhältst du nur minimale EP.' },
                    { id: 'training', icon: '🏋️', label: 'Training & Übung', desc: 'Dieser Wert steigt dynamisch, wenn der Charakter den Wert im Rollenspiel anwendet, trainiert oder im Abenteuer gezielt einsetzt (z.B. Einheiten & praktische Übungen außerhalb von Kämpfen).' },
                    { id: 'milestone', icon: '🏆', label: 'Story-Meilensteine', desc: 'Dieser Wert steigt nur nach dem Erreichen von bedeutenden Meilensteinen in der Story oder nach dem Besiegen von Boss-Gegnern.' },
                    { id: 'static', icon: '🔒', label: 'Statisch', desc: 'Manuelle Verteilung durch Talentpunkte oder Gold. Dieser Wert stellt die feste, naturgegebene Grenze des Charakters dar.' },
                  ].map((item) => {
                    const active = (world.techniqueProgressionLogic || 'ep') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setWorld(prev => {
                            const updatedWorld = { ...prev, techniqueProgressionLogic: item.id as any };
                            if (item.id === 'ep') {
                              // If campaignPowerSettings is empty or doesn't contain 'Stärke', initialize with standard EP defaults
                              const existingKeys = Object.keys(updatedWorld.campaignPowerSettings || {});
                              if (existingKeys.length === 0 || !existingKeys.includes('Stärke')) {
                                updatedWorld.campaignPowerSettings = JSON.parse(JSON.stringify(EP_DEFAULT_PARAMETERS));
                              } else {
                                const updatedSettings = { ...updatedWorld.campaignPowerSettings };
                                Object.keys(updatedSettings).forEach(k => {
                                  const val = updatedSettings[k];
                                  if (val && typeof val === 'object') {
                                    updatedSettings[k] = {
                                      ...val,
                                      levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP."
                                    } as any;
                                  }
                                });
                                updatedWorld.campaignPowerSettings = updatedSettings;
                              }

                              if (!updatedWorld.customStatAllocations || updatedWorld.customStatAllocations.length === 0) {
                                updatedWorld.customStatAllocations = JSON.parse(JSON.stringify(EP_DEFAULT_STAT_ALLOCATIONS));
                              }
                              if (!updatedWorld.costResources || updatedWorld.costResources.length === 0) {
                                updatedWorld.costResources = JSON.parse(JSON.stringify(EP_DEFAULT_COST_RESOURCES));
                              }
                              if (!updatedWorld.costPowerNames || updatedWorld.costPowerNames.length === 0) {
                                updatedWorld.costPowerNames = [...EP_DEFAULT_COST_NAMES];
                              }
                              if (!updatedWorld.healthPowerNames || updatedWorld.healthPowerNames.length === 0) {
                                updatedWorld.healthPowerNames = [...EP_DEFAULT_HEALTH_NAMES];
                              }
                            } else {
                              // Auto-synchronize all parameters' levelUpLogic text to stay fully aligned
                              if (updatedWorld.campaignPowerSettings) {
                                const updatedSettings = { ...updatedWorld.campaignPowerSettings };
                                const textMapping = {
                                  ep: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
                                  training: "Dieser Wert steigt dynamisch, wenn der Charakter den Wert im Rollenspiel anwendet, trainiert oder im Abenteuer gezielt einsetzt.",
                                  milestone: "Dieser Wert steigt nur nach dem Erreichen von bedeutenden Meilensteinen in der Story oder nach dem Besiegen von Boss-Gegnern.",
                                  static: "Dieser Wert ist unveränderlich und stellt die feste, naturgegebene bzw. unüberwindbare Grenze des Charerakters dar."
                                };
                                const text = textMapping[item.id as 'ep' | 'training' | 'milestone' | 'static'];
                                Object.keys(updatedSettings).forEach(k => {
                                  const val = updatedSettings[k];
                                  if (val && typeof val === 'object') {
                                    updatedSettings[k] = {
                                      ...val,
                                      levelUpLogic: text
                                    } as any;
                                  } else {
                                    updatedSettings[k] = {
                                      min: 0,
                                      max: typeof val === 'number' ? val : 100,
                                      levelUpLogic: text
                                    } as any;
                                  }
                                });
                                updatedWorld.campaignPowerSettings = updatedSettings;
                              }
                            }
                            return updatedWorld;
                          });
                        }}
                        className={`p-5 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between relative overflow-hidden group ${
                          active
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {active && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                            Aktiviert
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-slate-950/80 w-11 h-11 rounded-xl flex items-center justify-center border border-slate-800 group-hover:scale-105 transition-transform">{item.icon}</span>
                          <div>
                            <span className="text-sm font-extrabold uppercase tracking-wide block">{item.label}</span>
                            <span className="text-[10px] text-slate-500">Globaler Regelsatz</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-rate selection */}
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                    <div>
                      <h4 className="text-sm font-fantasy text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📈</span>
                        <span>STEIGERUNGS-RATE & ENTWICKLUNGS-TEMPO</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Passe an, mit welcher Intensität und Geschwindigkeit Parameter & Techniken anwachsen.
                      </p>
                    </div>
                    <span className="self-start sm:self-center text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-md uppercase tracking-wider">
                      Modus: {
                        (world.techniqueProgressionLogic || 'ep') === 'ep' ? '⚡ EP-basiert' :
                        (world.techniqueProgressionLogic || 'ep') === 'training' ? '🏋️ Training' :
                        (world.techniqueProgressionLogic || 'ep') === 'milestone' ? '🏆 Meilensteine' : '🔒 Statisch'
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(progressionRatesConfig[world.techniqueProgressionLogic || 'ep'] || []).map((rate) => {
                      const isRateActive = (world.techniqueProgressionRate || 'normal') === rate.id;
                      return (
                        <button
                          key={rate.id}
                          type="button"
                          onClick={() => setWorld(prev => ({ ...prev, techniqueProgressionRate: rate.id }))}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between relative overflow-hidden group/rate ${
                            isRateActive
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                              : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg group-hover/rate:scale-110 transition-transform">{rate.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wide">{rate.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                            {rate.desc}
                          </p>
                          {isRateActive && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Techniken Regelsatz & Default-Konfigurations-Datenbank (Excel-style) */}
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-fantasy text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📊</span>
                        <span>TECHNIK-REGELN & BALANCING-VORGABEN (DATENBLATT)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Definiere im Spielwelt-Datenblatt die Formeln und Standardwerte deiner Techniken. Spieler übernehmen diese Balancing-Vorgaben bei der Erstellung.
                      </p>
                    </div>
                  </div>

                  {/* Excel-Spreadsheet Grid */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                    <table className="w-full border-collapse text-left min-w-[1000px] text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="py-1.5 px-2 border-r border-slate-800 text-center w-[30px] bg-slate-900/60 font-bold">#</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">A (Typ)</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">B (Untertyp)</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">C (Kraftquelle)</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">D (Kosten-Formel)</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">E (Tier)</th>
                          <th className="py-1.5 px-3 border-r border-slate-800 text-slate-300 font-bold">F (Basis-Wert)</th>
                          <th className="py-1.5 px-3 text-slate-300 font-bold">Skalierung / Effekt für die Gemini-KI im Chat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(world.techniqueRulesList || []).map((rule, index) => {
                          const type = rule.type;
                          
                          // Determine Colors matching the system:
                          // Rot = schlecht/Angriff
                          // Grün = gut/Support
                          // Gold = selten/stark/Transformation
                          // Lila = Scaling/Potenzial/Verteidigung
                          let colorClass = '';
                          if (type === 'Angriff') {
                            colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                          } else if (type === 'Support') {
                            colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                          } else if (type === 'Transformation') {
                            colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                          } else { // Verteidigung
                            colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                          }

                          const createdCostResources = world.costResources?.map(r => r.name) || [];
                          const costResourceOptions = createdCostResources.length > 0 
                            ? createdCostResources 
                            : ['Mana', 'Ausdauer', 'MP', 'SP'];

                          return (
                            <tr key={rule.id || index} className="hover:bg-slate-900/30 transition-colors group">
                              {/* Row Number */}
                              <td className="py-1.5 px-2 border-r border-slate-800 text-center font-bold text-slate-600 bg-slate-900/20 w-[30px] select-none">
                                {index + 1}
                              </td>

                              {/* A (Typ) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass} uppercase tracking-wider`}>
                                    {type}
                                  </span>
                                </div>
                              </td>

                              {/* B (Untertyp) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <span className="text-xs text-slate-200 font-medium font-mono">
                                  {rule.subtype}
                                </span>
                              </td>

                              {/* C (Kraftquelle) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <select
                                  value={rule.costResourceName}
                                  onChange={(e) => updateTechniqueRuleListItem(rule.id, 'costResourceName', e.target.value)}
                                  className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500/50 rounded px-1 py-1 text-xs text-slate-300 outline-none cursor-pointer font-mono"
                                >
                                  {costResourceOptions.map(res => (
                                    <option key={res} value={res} className="bg-slate-950 text-white">{res}</option>
                                  ))}
                                </select>
                              </td>

                              {/* D (Kosten-Formel) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <select
                                  value={rule.costFormula}
                                  onChange={(e) => updateTechniqueRuleListItem(rule.id, 'costFormula', e.target.value as any)}
                                  className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500/50 rounded px-1 py-1 text-xs text-slate-300 outline-none cursor-pointer font-mono"
                                >
                                  <option value="absolut" className="bg-slate-950 text-white">absolut</option>
                                  <option value="proz." className="bg-slate-950 text-white">proz.</option>
                                </select>
                              </td>

                              {/* E (Tier) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <select
                                  value={rule.tier}
                                  onChange={(e) => updateTechniqueRuleListItem(rule.id, 'tier', e.target.value)}
                                  className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500/50 rounded px-1 py-1 text-xs text-slate-300 outline-none cursor-pointer font-mono"
                                >
                                  <option value="Tier 1" className="bg-slate-950 text-white">Tier 1</option>
                                  <option value="Tier 2" className="bg-slate-950 text-white">Tier 2</option>
                                  <option value="Tier 3" className="bg-slate-950 text-white">Tier 3</option>
                                  <option value="Tier 4" className="bg-slate-950 text-white">Tier 4</option>
                                </select>
                              </td>

                              {/* F (Basis-Wert) */}
                              <td className="p-1 px-3 border-r border-slate-800 align-middle">
                                <input
                                  type="number"
                                  value={rule.baseValue}
                                  onChange={(e) => updateTechniqueRuleListItem(rule.id, 'baseValue', parseInt(e.target.value) || 0)}
                                  className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500/50 rounded px-1.5 py-1 text-xs text-white text-center outline-none font-mono"
                                />
                              </td>

                              {/* Scaling / Effect */}
                              <td className="p-1 px-3 align-middle">
                                <input
                                  type="text"
                                  value={rule.scalingAndEffect}
                                  onChange={(e) => updateTechniqueRuleListItem(rule.id, 'scalingAndEffect', e.target.value)}
                                  className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500/50 rounded px-1.5 py-1 text-xs text-white outline-none font-mono"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Explanatory hint matching the image exactly */}
                  <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2 text-xs leading-relaxed text-slate-400">
                    <p className="font-bold text-amber-500/95 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info"></i>
                      <span>Balancing Farb-Vorgaben:</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span><strong className="text-rose-400">Rot:</strong> Angriff / Schaden</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span><strong className="text-indigo-400">Lila:</strong> Scaling / Verteidigung</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span><strong className="text-amber-400">Gold:</strong> Selten / Transformation</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span><strong className="text-emerald-400">Grün:</strong> Gut / Support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-100">Kampagnen-Einstellungen</h3>
              </div>

              <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/40 p-5 rounded-2xl border border-indigo-500/20 shadow-xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 flex-shrink-0">
                    <i className="fa-solid fa-wand-magic-sparkles text-lg animate-pulse"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      KI Smart-Fill (Schritt 2 & 3)
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-extrabold uppercase tracking-wider">
                        Balancing-Engine
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Fülle alle Werte, Spezialressourcen und Technik-Stufen für den vorherigen (Schritt 2) und diesen Schritt (Schritt 3) automatisch aus. Das System analysiert deine Welten-Beschreibung und Genres, um ein perfekt ausbalanciertes Regelwerk zu erstellen.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillStep2And3}
                  disabled={isGeneratingCampaignSettings}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-500 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  {isGeneratingCampaignSettings ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                      <span>Generiere & balanciere Kampagnen-Parameter...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                      <span>Automatisch ausfüllen & balancieren</span>
                    </>
                  )}
                </button>
                {!world.description && (
                  <p className="text-[10px] text-sky-400 italic text-center">
                    *Tipp: Da noch keine Welten-Beschreibung vorhanden ist, generiert die KI diese und die Genre-Tags im Hintergrund automatisch mit!
                  </p>
                )}
              </div>

              <CampaignPowerSettings 
                data={world.campaignPowerSettings || {}}
                onChange={(newData) => setWorld(prev => ({ ...prev, campaignPowerSettings: newData }))}
                healthPowerName={world.healthPowerName}
                onHealthPowerNameChange={(name) => setWorld(prev => ({ ...prev, healthPowerName: name }))}
                costPowerName={world.costPowerName}
                onCostPowerNameChange={(name) => setWorld(prev => ({ ...prev, costPowerName: name }))}
                healthPowerNames={world.healthPowerNames || []}
                onHealthPowerNamesChange={(names) => setWorld(prev => ({ ...prev, healthPowerNames: names }))}
                costPowerNames={world.costPowerNames || []}
                onCostPowerNamesChange={(names) => setWorld(prev => ({ ...prev, costPowerNames: names }))}
                healthLabel={world.healthLabel || 'Gesundheit'}
                onHealthLabelChange={(label) => setWorld(prev => ({ ...prev, healthLabel: label }))}
                costLabel={world.costLabel || 'Kosten / Verbrauch'}
                onCostLabelChange={(label) => setWorld(prev => ({ ...prev, costLabel: label }))}
                costResources={world.costResources || []}
                onCostResourcesChange={(resources) => setWorld(prev => ({ ...prev, costResources: resources }))}
                customResourceMappings={world.customResourceMappings || []}
                onCustomResourceMappingsChange={(mappings) => setWorld(prev => ({ ...prev, customResourceMappings: mappings }))}
                customStatAllocations={world.customStatAllocations || []}
                onCustomStatAllocationsChange={(allocations) => setWorld(prev => ({ ...prev, customStatAllocations: allocations }))}
              />
            </div>
          )}

          {step === 4 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Multi-tab switcher header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schritt 4: Weltkarte & Taktisches Schlachtfeld</span>
                </div>
                
                <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800/50 self-start sm:self-auto gap-1">
                  <button
                    onClick={() => setStep4SubTab('interactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      step4SubTab === 'interactive'
                        ? 'bg-amber-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-earth-americas text-amber-400"></i> 🌍 Interaktive Weltkarte
                  </button>
                  <button
                    onClick={() => setStep4SubTab('worldmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      step4SubTab === 'worldmap'
                        ? 'bg-amber-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-map"></i> 🎨 Vektor & Karteneditor
                  </button>
                  <button
                    onClick={() => setStep4SubTab('tactical')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      step4SubTab === 'tactical'
                        ? 'bg-amber-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-crosshairs"></i> Gefechtsfeld (Taktisch)
                  </button>
                </div>
              </div>

              {step4SubTab === 'interactive' ? (
                <InteractiveWorldMap
                  world={world}
                  onChangeWorld={setWorld}
                  loreDatabase={loreDatabase}
                  onUpdateLore={handleUpdateLoreDatabaseFlexible}
                />
              ) : step4SubTab === 'worldmap' ? (
                <WorldMapEditor
                  world={world}
                  onChangeWorld={setWorld}
                  loreDatabase={loreDatabase}
                  onUpdateLore={handleUpdateLoreDatabaseFlexible}
                  isGenerating={isGeneratingWorldMap}
                  onGenerate={handleGenerateWorldMap}
                  selectedTags={selectedTags}
                />
              ) : (
                <TacticalCanvasEditor
                  player={player}
                  combatState={customCombatState}
                  onChangeCombatState={setCustomCombatState}
                  worldSetting={world}
                  loreDatabase={loreDatabase}
                />
              )}
            </div>
          )}

          {step === 5 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {loreDatabase.some(l => l.category === 'Verbotenes Wissen') && (
                <div className="bg-red-950/25 border border-red-900/40 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                      <i className="fa-solid fa-eye-slash animate-pulse text-red-500"></i> Verbotenes Wissen definiert!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Möchtest du, dass die KI deine Welten-Beschreibung, die NPCs, den Prolog und die erste Szene an dieses verbotene Wissen anpasst, damit alles einheitlich ist und Geheimnisse verborgen bleiben?
                    </p>
                  </div>
                  <button
                    onClick={handleHarmonizeWorld}
                    disabled={isHarmonizing}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isHarmonizing ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i> Harmonisiere...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Welt & NPCs anpassen
                      </>
                    )}
                  </button>
                </div>
              )}
               <LoreDatabaseView 
                  lore={loreDatabase}
                  onUpdateLore={handleUpdateLoreDatabase}
                  onClose={() => {}} // Not needed here as it's a step
                  worldTitle={world.title}
                  isNsfw={world.isNsfw}
                  worldPowerSettings={world.campaignPowerSettings}
                  playerName={getPlayerName() || player.name}
                  playerRole={player.role}
                  playerFaction={player.appearance?.faction || (player as any).faction}
                  player={player}
                  world={world}
                  onUpdateWorld={setWorld}
                  playerAttributes={player.attributes}
                />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">Gestalte deinen Charakter</h3>
                  {structuredInventory && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse" title="Ausrüstung und Tascheninhalte wurden erfolgreich aus der Charakter-Beschreibung extrahiert!">
                      <i className="fa-solid fa-circle text-[6px]"></i> Inventar Geladen
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile && (
                    <button onClick={handleImportFromProfile} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-700 transition-all">
                      <i className="fa-solid fa-user-check"></i> Vom Profil laden
                    </button>
                  )}
                  <button onClick={handleGeneratePlayer} disabled={isGeneratingChar} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-600/30 transition-all">
                    <i className={`fa-solid ${isGeneratingChar ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i> KI Held
                  </button>
                  <button onClick={handleGeneratePlayerPortrait} disabled={isGeneratingPortrait || !player.name} className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-500 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-amber-600/30 transition-all">
                    <i className={`fa-solid ${isGeneratingPortrait ? 'fa-spinner animate-spin' : 'fa-image'}`}></i> KI Portrait
                  </button>
                  <button onClick={handleExtractInventory} disabled={isExtractingInventory || !player.name} className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-emerald-600/30 transition-all" title="Extrahiert Waffen, Kleidung und Tascheninhalte aus deinen Charakterdaten">
                    <i className={`fa-solid ${isExtractingInventory ? 'fa-spinner animate-spin' : 'fa-briefcase'}`}></i> KI Inventar
                  </button>
                </div>
              </div>

              {/* Tab Navigation for Character Creation */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPlayerCharTab('profil')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playerCharTab === 'profil'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg font-black scale-[1.01]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <i className="fa-solid fa-id-card text-sm"></i>
                  <span>1. Profil & Aussehen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerCharTab('beziehungen')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playerCharTab === 'beziehungen'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg font-black scale-[1.01]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <i className="fa-solid fa-people-arrows text-sm"></i>
                  <span>2. Beziehungen</span>
                  {player.relationships && player.relationships.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-slate-900/80 border border-amber-500/30 text-amber-400 rounded-full font-bold">
                      {player.relationships.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerCharTab('kampffaehigkeiten')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playerCharTab === 'kampffaehigkeiten'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg font-black scale-[1.01]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                  <span>3. Kampffähigkeiten</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerCharTab('beruf_talente')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playerCharTab === 'beruf_talente'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg font-black scale-[1.01]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <i className="fa-solid fa-briefcase text-sm"></i>
                  <span>4. Berufe & Talente</span>
                </button>
              </div>

              {/* Player Smart Fill */}
              <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                <label className="text-xs text-indigo-400 font-bold uppercase flex justify-between items-center">
                  <span>Smart Fill Charakter</span>
                  <button 
                    onClick={handlePlayerSmartFill}
                    disabled={isSmartFillingChar}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-[10px] transition-all flex items-center gap-2"
                  >
                    <i className={`fa-solid ${isSmartFillingChar ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                    Automatisch Ausfüllen
                  </button>
                </label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
                  placeholder="Beschreibe deinen Charakter, seine Verwandlungen, Beziehungen, Kampffähigkeiten sowie Berufe, Handwerke und Talente. Die KI füllt alle Felder in allen Tabs aus." 
                  value={playerSmartFill} 
                  onChange={e => setPlayerSmartFill(e.target.value)} 
                />
                
                <div className="flex items-center gap-2 px-1 select-none">
                  <input 
                    type="checkbox" 
                    id="keepExistingPlayerDetailsCheckbox"
                    checked={keepExistingPlayerDetails} 
                    onChange={e => setKeepExistingPlayerDetails(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-indigo-600"
                  />
                  <label htmlFor="keepExistingPlayerDetailsCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
                    <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Charakter-Daten behalten und neue Informationen hinzufügen
                  </label>
                </div>
              </div>

              {/* TAB 1: PROFIL & AUSSEHEN */}
              {playerCharTab === 'profil' && (
                <div className="space-y-6 animate-in fade-in duration-200">

              {/* Porträts & Gesichtsausdrücke */}
              <div className="bg-slate-800/25 border border-slate-700/60 rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Porträts & Gesichtsausdrücke</h3>
                      <p className="text-[11px] text-slate-400">Erstelle verschiedene Gesichtsausdrücke, die im Chat und in Dialogen angezeigt werden</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'neutral', label: 'Standard (Neutral)' },
                    { key: 'happy', label: 'Glücklich' },
                    { key: 'sad', label: 'Traurig' },
                    { key: 'angry', label: 'Wütend' },
                    { key: 'surprised', label: 'Überrascht' },
                    { key: 'blushing', label: 'Errötet' }
                  ].map((expr) => {
                    const currentImg = player.expressions?.[expr.key] || (expr.key === 'neutral' ? player.image : undefined);
                    const isGeneratingThis = playerGeneratingExpression === expr.key;

                    return (
                      <div key={expr.key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 text-center group/card">
                        <span className="text-[11px] font-semibold text-slate-300">
                          {expr.label}
                        </span>

                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                          {currentImg ? (
                            <>
                              <img src={currentImg} alt={expr.label} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => {
                                  setPlayer(prev => {
                                    const nextExpr = { ...(prev.expressions || {}) };
                                    delete nextExpr[expr.key];
                                    const updated = { ...prev, expressions: nextExpr };
                                    if (expr.key === 'neutral') {
                                      updated.image = undefined;
                                    }
                                    return updated;
                                  });
                                }} 
                                className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow transition-all"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </>
                          ) : (
                            <div className="text-slate-600 text-[10px] flex flex-col items-center gap-1 p-1">
                              <i className="fa-regular fa-image text-lg"></i>
                              <span>Nicht gesetzt</span>
                            </div>
                          )}

                          {isGeneratingThis && (
                            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-1.5 text-slate-200">
                              <i className="fa-solid fa-spinner animate-spin text-sm text-amber-500"></i>
                              <span className="text-[9px] font-medium tracking-wider uppercase animate-pulse">KI Erstellt...</span>
                            </div>
                          )}
                        </div>

                        <div className="w-full flex flex-col gap-1.5 mt-1">
                          <button
                            disabled={isGeneratingThis || !player.name}
                            onClick={() => handleGeneratePlayerExpression(expr.key)}
                            className="w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-[10px] font-bold text-amber-500 rounded border border-amber-500/20 flex items-center justify-center gap-1 transition-all"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i> KI Erstellen
                          </button>

                          <label className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all">
                            <i className="fa-solid fa-upload"></i> Hochladen
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadPlayerExpression(expr.key, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex flex-col gap-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> {activeTransformation ? 'Name der Transformation' : 'Name des Charakters'} <span className="text-red-500">*</span>
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all font-semibold"
                      placeholder={activeTransformation ? `Name im transformierten Zustand (leer = unbenannte Form)` : "Name des Charakters eingeben..."} 
                      value={getPlayerName()} 
                      onChange={e => updatePlayerName(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-emerald-400">◆</span> Rufname (Kampfanzeige)
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all font-semibold"
                      placeholder={activeTransformation ? "Rufname im Kampf (optional)" : "Rufname oder Kurzform (Standard: Name)"} 
                      value={getPlayerRufName()} 
                      onChange={e => updatePlayerRufName(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Spitzname / Titel / Alias
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all"
                      placeholder="Spitzname, Alias oder Titel eingeben..." 
                      value={getPlayerNickname()} 
                      onChange={e => updatePlayerNickname(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> {activeTransformation ? 'Rolle im transformierten Zustand' : 'Rolle / Beruf'}
                    </label>
                    <ProfessionSelect
                      value={getPlayerRole()} 
                      onChange={val => {
                        updatePlayerRole(val);
                      }}
                      placeholder="Beruf wählen oder eintragen..." 
                    />
                  </div>
                </div>
              </div>
              
              {/* Gestalt / Form Switcher Banner */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${activeTransformation ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'}`}>
                    <i className={`fa-solid ${activeTransformation ? 'fa-bolt' : 'fa-user'}`}></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                      <span>PROFIL & STATUR BEARBEITEN</span>
                      {activeTransformation ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          ⚡ AKTIV: {activeTransformation.transformName || activeTransformation.name}
                        </span>
                      ) : (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          👤 STANDARDGESTALT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTransformation 
                        ? `Du bearbeitest gerade Alter, Statur & Aussehen für die aktive Form "${activeTransformation.transformName || activeTransformation.name}".`
                        : 'Du bearbeitest Alter, Statur & Aussehen deiner untransformierten Standardgestalt.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayer({
                        ...player,
                        appearance: {
                          ...player.appearance,
                          activeTransformationId: 'standard'
                        }
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      !activeTransformation 
                        ? 'bg-indigo-600 text-white shadow border border-indigo-400' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    <i className="fa-solid fa-user text-[10px]"></i>
                    Standard
                  </button>

                  {(player.abilities || []).filter(a => a.category === 'Transformationen' || (a as any).type === 'Transformation').map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPlayer({
                          ...player,
                          appearance: {
                            ...player.appearance,
                            activeTransformationId: t.id
                          }
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        activeTransformationId === t.id 
                          ? 'bg-amber-600 text-white shadow border border-amber-400' 
                          : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30'
                      }`}
                    >
                      <i className="fa-solid fa-bolt text-[10px]"></i>
                      {t.transformName || t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Geschlecht</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={getAppearanceValue('gender') ? getAppearanceValue('gender').charAt(0).toUpperCase() + getAppearanceValue('gender').slice(1).toLowerCase() : 'Weiblich'} onChange={e => updateAppearanceValue('gender', e.target.value)}>
                      {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Alter</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" value={getAppearanceValue('age')} onChange={e => updateAppearanceValue('age', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Statur</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={getAppearanceValue('build') || 'Schlank'} onChange={e => updateAppearanceValue('build', e.target.value)}>
                      {BUILD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Haarfarbe</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Blond" value={getAppearanceValue('hairColor')} onChange={e => updateAppearanceValue('hairColor', e.target.value)} />
                  </div>
                  <div>
                    <EyeColorEditor
                      eyeColor={getAppearanceValue('eyeColor')}
                      hasHeterochromia={getAppearanceValue('hasHeterochromia') as any}
                      eyeColorLeft={getAppearanceValue('eyeColorLeft')}
                      eyeColorRight={getAppearanceValue('eyeColorRight')}
                      onChange={updates => updateAppearanceMultiple(updates)}
                      labelClassName="text-[10px] text-slate-500 block uppercase font-bold"
                      inputClassName="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Körbchengröße</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={getAppearanceValue('cupSize') || "-"} onChange={e => updateAppearanceValue('cupSize', e.target.value)}>
                      {CUP_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Archetyp / Typus</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer" 
                      value={getPlayerPersonalityArchetype()} 
                      onChange={e => updatePlayerPersonalityArchetype(e.target.value)}
                    >
                      <option value="-">- Kein Archetyp (Neutral) -</option>
                      <optgroup label="Klassische Dere-Typen">
                        {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Klassische Dere-Typen').map(a => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Subtypen & Varianten">
                        {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Subtypen & Varianten').map(a => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Western-Typen">
                        {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Western-Typen').map(a => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Spezielle & Exzentrische Typen">
                        {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Spezielle & Exzentrische Typen').map(a => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                                    <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Größe & Körpermaße</label>
                    <div className="flex gap-2">
                       <AutoExpandingTextarea className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="Größe (z.B. 170cm)" value={getAppearanceValue('height')} onChange={e => updateAppearanceValue('height', e.target.value)} />
                       <AutoExpandingTextarea className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="Maße (z.B. 90-60-90)" value={getAppearanceValue('measurements')} onChange={e => updateAppearanceValue('measurements', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Gewicht, KFA & Muskeln</label>
                    <div className="flex gap-1.5">
                       <AutoExpandingTextarea className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. 75kg" value={getAppearanceValue('weight')} onChange={e => updateAppearanceValue('weight', e.target.value)} />
                       <AutoExpandingTextarea className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="KFA (z.B. 22%)" value={getAppearanceValue('bodyFat')} onChange={e => updateAppearanceValue('bodyFat', e.target.value)} />
                       <AutoExpandingTextarea className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="Muskeln (z.B. 35%)" value={getAppearanceValue('muscleMass')} onChange={e => updateAppearanceValue('muscleMass', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Rasse</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Mensch, Elf" value={getAppearanceValue('race')} onChange={e => updateAppearanceValue('race', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Herkunft</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Eisiges Nordland" value={getAppearanceValue('origin')} onChange={e => updateAppearanceValue('origin', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Familie</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Haus Arryn" value={getAppearanceValue('family')} onChange={e => updateAppearanceValue('family', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Fraktion</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsFactionDropdownOpen(!isFactionDropdownOpen)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none text-left flex justify-between items-center hover:border-slate-500 transition-all cursor-pointer min-h-[38px]"
                      >
                        <span className="truncate">
                          {(() => {
                            const val = getAppearanceValue('faction') || '';
                            const selected = val.split(',').map(f => f.trim()).filter(Boolean);
                            return selected.length > 0 ? selected.join(', ') : 'Keine';
                          })()}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-2">
                          {isFactionDropdownOpen ? '▲' : '▼'}
                        </span>
                      </button>

                      {isFactionDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsFactionDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto p-2 space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                updateAppearanceValue('faction', '');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                                !(getAppearanceValue('faction') || '').trim()
                                  ? 'bg-amber-500/10 text-amber-400 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>Keine</span>
                              {!(getAppearanceValue('faction') || '').trim() && (
                                <span className="text-amber-500 text-[10px]">✓</span>
                              )}
                            </button>

                            {(() => {
                              const dbFactions = loreDatabase
                                .filter(l => l.category === 'Fraktionen')
                                .map(l => l.title)
                                .filter(Boolean) as string[];
                              const allFactions = Array.from(new Set(dbFactions));
                              const currentVal = getAppearanceValue('faction') || '';
                              const selected = currentVal.split(',').map(f => f.trim()).filter(Boolean);

                              return allFactions.map(factionName => {
                                const isSelected = selected.some(f => f.toLowerCase() === factionName.toLowerCase());
                                return (
                                  <button
                                    key={factionName}
                                    type="button"
                                    onClick={() => {
                                      let updated: string[];
                                      if (isSelected) {
                                        updated = selected.filter(f => f.toLowerCase() !== factionName.toLowerCase());
                                      } else {
                                        updated = [...selected, factionName];
                                      }
                                      updateAppearanceValue('faction', updated.join(', '));
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-amber-500/10 text-amber-400 font-bold'
                                        : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                                  >
                                    <span className="truncate">{factionName}</span>
                                    {isSelected && (
                                      <span className="text-amber-500 text-[10px]">✓</span>
                                    )}
                                  </button>
                                );
                              });
                            })()}

                            <div className="pt-2 border-t border-slate-800 mt-1 flex gap-1">
                              <input
                                type="text"
                                placeholder="Eigene Fraktion..."
                                value={customFactionInput}
                                onChange={e => setCustomFactionInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = customFactionInput.trim();
                                    if (val) {
                                      const currentVal = getAppearanceValue('faction') || '';
                                      const selected = currentVal.split(',').map(f => f.trim()).filter(Boolean);
                                      if (!selected.some(f => f.toLowerCase() === val.toLowerCase())) {
                                        updateAppearanceValue('faction', [...selected, val].join(', '));
                                      }
                                      setCustomFactionInput('');
                                    }
                                  }
                                }}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = customFactionInput.trim();
                                  if (val) {
                                    const currentVal = getAppearanceValue('faction') || '';
                                    const selected = currentVal.split(',').map(f => f.trim()).filter(Boolean);
                                    if (!selected.some(f => f.toLowerCase() === val.toLowerCase())) {
                                      updateAppearanceValue('faction', [...selected, val].join(', '));
                                    }
                                    setCustomFactionInput('');
                                  }
                                }}
                                className="bg-amber-600 text-white font-bold rounded px-2.5 py-1 text-xs hover:bg-amber-500 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold flex justify-between">
                       <span>Aktueller Standort (Weltkarte)</span>
                       {(() => {
                         const createdOrte = Array.from(new Set([...(world?.territories || []).map((t: any) => t.name), ...(world?.regionMarkers || []).map((m: any) => m.name)].filter(Boolean)));
                         return createdOrte.length > 0 ? <span className="text-[9px] text-sky-400 font-normal"><i className="fa-solid fa-earth-americas mr-1"></i>Weltkarte aktiv ({createdOrte.length} Orte)</span> : null;
                       })()}
                    </label>
                    <LocationSelector
                      value={player.appearance.currentLocation || ''}
                      onChange={val => handlePlayerAppearanceChange('currentLocation', val)}
                      loreDatabase={loreDatabase}
                      placeholder="z.B. Eichenwald"
                      world={world}
                    />
                    {(() => {
                      const activeOrt = loreDatabase.find(l => l.category === 'Orte' && l.details?.isActiveTarget);
                      if (!activeOrt) return null;
                      return (
                        <div className="flex flex-col gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => handlePlayerAppearanceChange('currentLocation', activeOrt.title)}
                            className={`text-[9px] px-2 py-1 rounded transition-all border flex items-center gap-1 self-start ${
                              player.appearance.currentLocation?.trim().toLowerCase() === activeOrt.title.trim().toLowerCase()
                              ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/50 font-semibold shadow-inner'
                              : 'bg-indigo-950/40 text-indigo-300 border-indigo-900/50 hover:bg-indigo-900/30'
                            }`}
                          >
                            <i className="fa-solid fa-location-dot"></i> Aktives Reiseziel: {activeOrt.title}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Aussehen (Gesicht, Haare, besondere Merkmale etc.)</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px]" placeholder="Z.B. langes Haar, Sommersprossen, hübsches Gesicht, Narben..." value={getAppearanceValue('looks')} onChange={e => updateAppearanceValue('looks', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-500 block uppercase font-bold">Kleidung / Outfit</label>
                      {activeTransformation && (() => {
                        const isOnePiece = 
                          (world?.title || '').toLowerCase().includes('one piece') ||
                          (world?.description || '').toLowerCase().includes('one piece') ||
                          (player?.bio || '').toLowerCase().includes('one piece') ||
                          (player?.bio || '').toLowerCase().includes('teufelsfrucht') ||
                          (player?.bio || '').toLowerCase().includes('zoan');
                        if (isOnePiece) {
                          return (
                            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                              Kleidung passt sich elastisch der Zoan-Form an
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px]" placeholder="Wird von KI generiert oder hier eingeben..." value={getAppearanceValue('outfit')} onChange={e => updateAppearanceValue('outfit', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Rassemerkmale (Nicht-menschliche physische Eigenschaften)</label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500" 
                      placeholder="z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe/Muster/Verteilung am Körper), ein Katzenkopf, Flügel, Hörner etc. oder 'keine'" 
                      value={getAppearanceValue('raceFeatures')} 
                      onChange={e => updateAppearanceValue('raceFeatures', e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC BODY SILHOUETTE COMPONENT - standalone */}
              <div className="space-y-2 mt-2">
                <label className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest block">
                  Charakter-Silhouette & Physischer Status
                </label>
                <BodySilhouette 
                  player={player} 
                  loreDatabase={loreDatabase}
                  npcs={npcs}
                  costResources={world?.costResources}
                  world={world}
                  onUpdateLore={setLoreDatabase}
                  onUpdateNpcs={setNpcs}
                  onUpdatePlayer={setPlayer} 
                />
              </div>

              {/* Ausrüstung & Inventar (Detailzuordnung) - standalone */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-briefcase text-sky-400 text-sm"></i>
                        <div>
                          <span className="text-xs text-slate-200 font-bold uppercase tracking-wider block">Ausrüstung & Inventar</span>
                          <span className="text-[10px] text-slate-500 block">Bestimmt das detaillierte Start-Inventar im Logbuch.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExtractInventory}
                        disabled={isExtractingInventory || !player.name}
                        className="px-2 py-1 bg-sky-600/20 border border-sky-500/30 text-sky-400 rounded hover:bg-sky-600/30 transition-all flex items-center gap-1.5 text-[9.5px] font-bold"
                        title="Analysiert das obige 'Kleidung / Outfit' Feld und befüllt die Slots automatisch neu"
                      >
                        <i className={`fa-solid ${isExtractingInventory ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        Aus Outfit extrahieren
                      </button>
                    </div>

                    {/* Inventory Form Fields */}
                    <div className="space-y-4">
                      {/* Kleidung & Rüstung */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                          <i className="fa-solid fa-shirt"></i> Kleidung & Rüstung
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Kopf</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Kopfbedeckung"
                              value={structuredInventory?.armor?.head || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const armor = inv.armor || {};
                                setStructuredInventory({
                                  ...inv,
                                  armor: { ...armor, head: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Brust / Torso</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Oberbekleidung"
                              value={structuredInventory?.armor?.chest || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const armor = inv.armor || {};
                                setStructuredInventory({
                                  ...inv,
                                  armor: { ...armor, chest: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Hände</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Handschuhe"
                              value={structuredInventory?.armor?.hands || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const armor = inv.armor || {};
                                setStructuredInventory({
                                  ...inv,
                                  armor: { ...armor, hands: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Beine</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Beinkleidung"
                              value={structuredInventory?.armor?.legs || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const armor = inv.armor || {};
                                setStructuredInventory({
                                  ...inv,
                                  armor: { ...armor, legs: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Füße</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Schuhwerk"
                              value={structuredInventory?.armor?.feet || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const armor = inv.armor || {};
                                setStructuredInventory({
                                  ...inv,
                                  armor: { ...armor, feet: e.target.value }
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Schmuck & Accessoires */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                          <i className="fa-solid fa-gem"></i> Schmuck & Accessoires
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Finger</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Ringe"
                              value={structuredInventory?.accessories?.finger || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const acc = inv.accessories || {};
                                setStructuredInventory({
                                  ...inv,
                                  accessories: { ...acc, finger: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Hals</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Ketten, Amulette"
                              value={structuredInventory?.accessories?.neck || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const acc = inv.accessories || {};
                                setStructuredInventory({
                                  ...inv,
                                  accessories: { ...acc, neck: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Handgelenke</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Armreifen"
                              value={structuredInventory?.accessories?.wrist || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const acc = inv.accessories || {};
                                setStructuredInventory({
                                  ...inv,
                                  accessories: { ...acc, wrist: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Taille</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Gürtel, Schärpen"
                              value={structuredInventory?.accessories?.waist || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const acc = inv.accessories || {};
                                setStructuredInventory({
                                  ...inv,
                                  accessories: { ...acc, waist: e.target.value }
                                });
                              }}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Rücken</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Umhänge, Taschen"
                              value={structuredInventory?.accessories?.back || ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                const acc = inv.accessories || {};
                                setStructuredInventory({
                                  ...inv,
                                  accessories: { ...acc, back: e.target.value }
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Finanzen, Waffen & Sonstiges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/60 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Geld</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500 font-mono font-bold"
                              value={structuredInventory?.money ?? 100}
                              onChange={e => {
                                const newMoney = parseInt(e.target.value) || 0;
                                const inv = structuredInventory || {};
                                const currLabel = inv.currencyLabel || (world.title.toLowerCase().includes('one piece') ? 'Berry' : 'Goldstücke');
                                setStructuredInventory({
                                  ...inv,
                                  money: newMoney
                                });
                                setStatusElements(prev => prev.map(s => {
                                  const l = (s.label || '').toLowerCase();
                                  if (l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits')) {
                                    return { ...s, value: `${newMoney} ${currLabel}`.trim() };
                                  }
                                  return s;
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Währung</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="Berry"
                              value={structuredInventory?.currencyLabel || ''}
                              onChange={e => {
                                const newCurr = e.target.value;
                                const inv = structuredInventory || {};
                                const currentMoney = inv.money ?? 100;
                                setStructuredInventory({
                                  ...inv,
                                  currencyLabel: newCurr
                                });
                                setStatusElements(prev => prev.map(s => {
                                  const l = (s.label || '').toLowerCase();
                                  if (l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits')) {
                                    return { ...s, value: `${currentMoney} ${newCurr}`.trim() };
                                  }
                                  return s;
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Waffen (kommagetrennt)</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                              placeholder="z.B. Holzschwert"
                              value={structuredInventory?.weapons ? structuredInventory.weapons.join(', ') : ''}
                              onChange={e => {
                                const inv = structuredInventory || {};
                                setStructuredInventory({
                                  ...inv,
                                  weapons: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                });
                              }}
                            />
                          </div>

                          {/* Synced Codex Items for the Player */}
                          {(() => {
                            const pName = player?.name || 'Spieler';
                            const isOwnerMatch = (owner?: string) => {
                              if (!owner) return false;
                              const o = owner.trim().toLowerCase();
                              const p = pName.trim().toLowerCase();
                              return o === p || o === 'spieler' || o === 'player' || (player?.nickname && o === player.nickname.trim().toLowerCase());
                            };
                            const codexPlayerItems = loreDatabase.filter(entry => 
                              entry.category === 'Gegenstände' && isOwnerMatch(entry.details?.owner)
                            );

                            if (codexPlayerItems.length === 0) return null;

                            return (
                              <div className="bg-slate-950/70 border border-amber-500/20 rounded-lg p-2 mt-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1.5">
                                  <i className="fa-solid fa-scroll text-amber-500 text-[8px]"></i>
                                  Aus Codex verknüpft (Besitzer: {pName}):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {codexPlayerItems.map((item, iIdx) => (
                                    <span 
                                      key={item.id || `codex-itm-${iIdx}`} 
                                      className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-slate-200 flex items-center gap-1"
                                      title={`${item.title} (${item.details?.itemType || 'Gegenstand'}): ${item.description}`}
                                    >
                                      <i className="fa-solid fa-shield-halved text-amber-400 text-[8px]"></i>
                                      <span className="font-semibold">{item.title}</span>
                                      {item.details?.itemType && (
                                        <span className="text-[8px] text-amber-400/70">({item.details.itemType})</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
 
              <div className="grid grid-cols-1 gap-4">
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[64px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder={activeTransformation ? `Persönlichkeit (${activeTransformation.transformName || activeTransformation.name})...` : "Persönlichkeit (z.B. mutig, stur, humorvoll)..."} value={getPlayerPersonality()} onChange={e => updatePlayerPersonality(e.target.value)} />
                
                {/* 24 Persönlichkeitsmerkmale (0 ↔ 100) & Archetypen */}
                <PersonalityTraitsEditor
                  traits={getPlayerPersonalityTraits()}
                  onChange={traits => updatePlayerPersonalityTraits(traits)}
                  archetype={getPlayerPersonalityArchetype()}
                  onArchetypeChange={archetype => updatePlayerPersonalityArchetype(archetype)}
                  title={activeTransformation ? `Persönlichkeitsmerkmale (${activeTransformation.transformName || activeTransformation.name})` : "Persönlichkeitsmerkmale"}
                  subtitle="Quantitative Einstufung der Charaktereigenschaften auf einer Skala von 0 bis 100"
                />

                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[96px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder={activeTransformation ? `Vergangenheit / Biografie (${activeTransformation.transformName || activeTransformation.name})...` : "Herkunft, Kindheit, wichtige Bezugspersonen, Schlüsselereignisse, Werdegang, prägende Erfahrungen und ungelöste Vergangenheit..."} value={getPlayerBio()} onChange={e => updatePlayerBio(e.target.value)} />
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder={activeTransformation ? `Aktuelle Situation (${activeTransformation.transformName || activeTransformation.name})...` : "Aktuelle Situation..."} value={getPlayerCurrentSituation()} onChange={e => updatePlayerCurrentSituation(e.target.value)} />
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder={activeTransformation ? `Hauptziel / Bestrebungen (${activeTransformation.transformName || activeTransformation.name})...` : "Hauptziel / Bestrebungen..."} value={getPlayerGoal()} onChange={e => updatePlayerGoal(e.target.value)} />
              </div>
            </div>
          )}

              {/* TAB 2: BEZIEHUNGEN */}
              {playerCharTab === 'beziehungen' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {activeTransformation && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>
                          Du bearbeitest gerade die Beziehungen für die aktive Form <strong className="text-amber-400">&ldquo;{activeTransformation.transformName || activeTransformation.name}&rdquo;</strong>.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPlayer({
                            ...player,
                            appearance: {
                              ...player.appearance,
                              activeTransformationId: 'standard'
                            }
                          });
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-650 text-[10px] font-bold"
                      >
                        Zur Ursprünglichen Gestalt
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 bg-slate-900/40 p-5 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                      <div>
                        <span className="text-sm text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                          <i className="fa-solid fa-people-arrows text-amber-500"></i>
                          Beziehungen & Verhalten zu anderen {activeTransformation ? `(${activeTransformation.transformName || activeTransformation.name})` : ''}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">Wer ist dieser Charakter für andere und wie verhält er sich zu ihnen?</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => updatePlayerRelationships([
                          ...getPlayerRelationships(),
                          { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), targetCharacter: '', type: '', behavior: '', sharedPast: '', _isCustom: false }
                        ])}
                        className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600/30 transition-all font-sans cursor-pointer"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i> Eintrag hinzufügen
                      </button>
                    </div>

                    {getPlayerRelationships().length === 0 ? (
                      <div className="text-xs text-slate-400 italic px-2 py-4 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                        Bisher keine Beziehungen angelegt. Klicke oben auf "+ Eintrag hinzufügen", um eine Beziehung zu einem NPC, Gefährten oder einer Fraktion zu definieren.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getPlayerRelationships().map((rel, idx) => {
                          const codexCharacters = loreDatabase
                            .filter(item => item.category === 'Charaktere' && item.title?.trim().toLowerCase() !== getPlayerName()?.trim().toLowerCase())
                            .map(c => ({ id: c.id, title: c.title }));

                          return (
                            <RelationshipDetailEditor
                              key={rel.id || `rel-p-${idx}`}
                              rel={rel}
                              idx={idx}
                              sourceCharacterName={getPlayerName() || 'Spieler'}
                              codexCharacters={codexCharacters}
                              playerName={getPlayerName()}
                              world={world}
                              allLoreEntries={loreDatabase}
                              onChange={updated => {
                                const newList = [...getPlayerRelationships()];
                                newList[idx] = updated;
                                updatePlayerRelationships(newList);
                                if (getPlayerName()?.trim()) {
                                  const synced = syncLoreWithReciprocalRelationships(loreDatabase, getPlayerName().trim(), newList);
                                  setLoreDatabase(synced);
                                }
                              }}
                              onDelete={() => {
                                const rels = getPlayerRelationships();
                                const relToDelete = rels[idx];
                                const newList = rels.filter(r => r.id !== rel.id);
                                updatePlayerRelationships(newList);
                                if (getPlayerName()?.trim() && relToDelete?.targetCharacter) {
                                  const synced = removeCounterpartRelationshipFromLore(loreDatabase, getPlayerName().trim(), relToDelete.targetCharacter);
                                  setLoreDatabase(synced);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: KAMPFFÄHIGKEITEN */}
              {playerCharTab === 'kampffaehigkeiten' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-slate-300">Gefährte / Fähigkeiten & Kräfte</h4>
                  </div>

                  {/* 1. Kraftquelle & Kosten/Verbrauch + Kernfähigkeit (Hauptfeld) */}
                  {(() => {
                    const customSourceNames = world.customResourceMappings?.map(m => m.name) || [];
                    const customCostOptions = world.costResources?.map(r => r.name) || [];
                    const defaultCostFallbacks = customCostOptions.length > 0 ? customCostOptions : ["MP", "Ausdauer"];
                    
                    const list: CharacterPowerSource[] = player.powerSources && player.powerSources.length > 0
                      ? player.powerSources
                      : [
                          {
                            id: 'default',
                            source: player.powerSource || '',
                            cost: player.powerCost || '',
                            powerName: player.powerName || '',
                            powerDescription: player.powerDescription || ''
                          }
                        ];

                    const currentIdx = Math.min(activePowerSourceIdx, list.length - 1);
                    const activeSource = (list[currentIdx] || list[0] || {}) as CharacterPowerSource;

                    const updateActiveSource = (fields: Partial<CharacterPowerSource>) => {
                      const newList = [...list] as CharacterPowerSource[];
                      newList[currentIdx] = { ...newList[currentIdx], ...fields };
                      const first = newList[0] || {} as CharacterPowerSource;
                      setPlayer({
                        ...player,
                        powerSources: newList,
                        powerSource: first.source || '',
                        powerCost: first.cost || '',
                        powerName: first.powerName || '',
                        powerDescription: first.powerDescription || ''
                      });
                    };

                    const handleAddSource = () => {
                      const newSrc: CharacterPowerSource = {
                        id: `ps-${Date.now()}`,
                        source: 'Mana',
                        cost: 'MP',
                        powerName: 'Neue Kraft',
                        powerDescription: 'Beschreibung der neuen Kraft...'
                      };
                      const newList = [...list, newSrc];
                      const first = (newList[0] || {}) as CharacterPowerSource;
                      setPlayer({
                        ...player,
                        powerSources: newList,
                        powerSource: first.source || '',
                        powerCost: first.cost || '',
                        powerName: first.powerName || '',
                        powerDescription: first.powerDescription || ''
                      });
                      setActivePowerSourceIdx(newList.length - 1);
                    };

                    const handleRemoveSource = (idxToRemove: number) => {
                      if (list.length <= 1) return;
                      const newList = list.filter((_, i) => i !== idxToRemove);
                      const first = (newList[0] || {}) as CharacterPowerSource;
                      setPlayer({
                        ...player,
                        powerSources: newList,
                        powerSource: first.source || '',
                        powerCost: first.cost || '',
                        powerName: first.powerName || '',
                        powerDescription: first.powerDescription || ''
                      });
                      setActivePowerSourceIdx(Math.max(0, currentIdx - 1));
                    };

                    return (
                      <div className="space-y-4 mb-2">
                        {/* Power Sources Tabs */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 pb-2">
                          {list.map((src, sIdx) => (
                            <div 
                              key={src.id || sIdx} 
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                                sIdx === currentIdx 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                              }`}
                              onClick={() => setActivePowerSourceIdx(sIdx)}
                            >
                              <i className="fa-solid fa-bolt-lightning text-[10px]"></i>
                              <span>{src.source || 'Keine Quelle'} {src.powerName ? `(${src.powerName})` : ''}</span>
                              {list.length > 1 && (
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSource(sIdx);
                                  }}
                                  className="ml-1 text-[10px] text-slate-500 hover:text-red-400 transition"
                                  title="Kraftquelle entfernen"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddSource}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-dashed border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition flex items-center gap-1"
                          >
                            <i className="fa-solid fa-plus text-[10px]"></i>
                            <span>Hinzufügen</span>
                          </button>
                        </div>

                        {/* Selected Power Source Configuration */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
                          {/* Kernfähigkeit / Haupt-Kraft Hauptfeld */}
                          <div className="space-y-4">
                            <div className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                              <i className="fa-solid fa-crown text-[11px]"></i>
                              <span>Kernfähigkeit (Haupt-Kraft)</span>
                            </div>

                            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-4 shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Kraftquelle */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1 flex items-center gap-1">
                                    <i className="fa-solid fa-bolt text-amber-500 text-[10px]"></i>
                                    <span>Kraftquelle</span>
                                  </label>
                                  <div className="flex gap-2">
                                    <select 
                                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] flex-1"
                                      value={customSourceNames.includes(activeSource.source || '') ? (activeSource.source || '') : (activeSource.source ? '__custom__' : '')}
                                      onChange={e => {
                                        const val = e.target.value;
                                        if (val === '__custom__') {
                                          updateActiveSource({ source: 'Mana' });
                                        } else {
                                          updateActiveSource({ source: val });
                                        }
                                      }}
                                    >
                                      <option value="">-- Keine / Standard --</option>
                                      {customSourceNames.map((name, mIdx) => <option key={`global-custom-${name}-${mIdx}`} value={name}>{name}</option>)}
                                      <option value="__custom__">Eigene eingeben...</option>
                                    </select>
                                    {(!customSourceNames.includes(activeSource.source || '') || activeSource.source === '') && (
                                      <input 
                                        type="text"
                                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 w-1/2 h-[38px] font-semibold"
                                        placeholder="z.B. Teufelsfrucht"
                                        value={activeSource.source || ''}
                                        onChange={e => updateActiveSource({ source: e.target.value })}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Kosten / Verbrauch */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1 flex items-center gap-1">
                                    <i className="fa-solid fa-droplet text-indigo-500 text-[10px]"></i>
                                    <span>Kosten / Verbrauch</span>
                                  </label>
                                  <div className="flex gap-2">
                                    <select 
                                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] flex-1"
                                      value={defaultCostFallbacks.includes(activeSource.cost || '') ? (activeSource.cost || '') : (activeSource.cost ? '__custom__' : '')}
                                      onChange={e => {
                                        const val = e.target.value;
                                        if (val === '__custom__') {
                                          updateActiveSource({ cost: 'MP' });
                                        } else {
                                          updateActiveSource({ cost: val });
                                        }
                                      }}
                                    >
                                      <option value="">-- Keine / Standard --</option>
                                      {defaultCostFallbacks.map((name, idx) => <option key={`global-cost-${name}-${idx}`} value={name}>{name}</option>)}
                                      <option value="__custom__">Eigene eingeben...</option>
                                    </select>
                                    {(!defaultCostFallbacks.includes(activeSource.cost || '') || activeSource.cost === '') && (
                                      <input 
                                        type="text"
                                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 w-1/2 h-[38px] font-semibold"
                                        placeholder="z.B. MP"
                                        value={activeSource.cost || ''}
                                        onChange={e => updateActiveSource({ cost: e.target.value })}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Name der Kraft */}
                                <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                                  <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1">
                                    Name der Kraft
                                  </label>
                                  <input 
                                    type="text"
                                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-bold text-amber-400"
                                    placeholder="z.B. Hyo-Hyo no Mi, Modell: Eis-Kitsune"
                                    value={activeSource.powerName || ''}
                                    onChange={e => updateActiveSource({ powerName: e.target.value })}
                                  />
                                </div>
                              </div>

                              {/* Beschreibung der Kraft */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1">
                                  Beschreibung der Kraft (Großes Feld)
                                </label>
                                <AutoExpandingTextarea 
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-xs outline-none focus:border-amber-500 min-h-[96px] leading-relaxed"
                                  placeholder="Detaillierte Beschreibung der Kräfte, Funktionsweise, Stärken und Grenzen..."
                                  value={activeSource.powerDescription || ''}
                                  onChange={e => updateActiveSource({ powerDescription: e.target.value })}
                                />
                              </div>

                              {/* Kraft-Fähigkeiten (Fähigkeit 1, Fähigkeit 2...) */}
                              <div className="flex flex-col gap-2.5 border-t border-slate-800/60 pt-4">
                                <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1 flex items-center gap-1.5">
                                  <i className="fa-solid fa-wand-magic-sparkles text-amber-500 text-[10px]"></i>
                                  <span>Zugeordnete Fähigkeiten</span>
                                </label>

                                {(() => {
                                  const currentAbilities = player.abilities || [];
                                  const activeHauptAbilities = currentAbilities.filter(ability => {
                                    const matchesCategory = ability.category === 'Kernfähigkeit' || ability.category === 'Haupt-Fähigkeiten';
                                    const belongsToActive = ability.powerSourceId === activeSource.id || (!ability.powerSourceId && activeSource.id === playerPowerSourcesList[0]?.id);
                                    return matchesCategory && belongsToActive;
                                  });

                                  return (
                                    <div className="space-y-2">
                                      {activeHauptAbilities.length === 0 ? (
                                        <div className="text-[11px] text-slate-500 italic p-2 border border-dashed border-slate-850 rounded-lg bg-slate-950/20 text-center">
                                          Keine Fähigkeiten direkt der Kernfähigkeit zugeordnet. Trage unten eine ein!
                                        </div>
                                      ) : (
                                        activeHauptAbilities.map((ability, idx) => (
                                          <div key={ability.id || `haupt-${idx}`} className="flex gap-2 items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                                            <span className="text-[10px] font-extrabold text-amber-500 shrink-0 min-w-[75px] uppercase tracking-wider">
                                              Fähigkeit {idx + 1}
                                            </span>
                                            <input 
                                              type="text"
                                              className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[32px] font-semibold"
                                              value={ability.name || ''}
                                              placeholder="z.B. Eis-Manipulation"
                                              onChange={e => {
                                                const val = e.target.value;
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, name: val, category: 'Kernfähigkeit' } : a)
                                                });
                                              }}
                                            />
                                            <button 
                                              type="button"
                                              onClick={() => handleDeleteAbility(ability.id)}
                                              className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-all text-xs shrink-0 border border-transparent hover:border-red-500/10"
                                              title="Fähigkeit löschen"
                                            >
                                              <i className="fa-solid fa-trash"></i>
                                            </button>
                                          </div>
                                        ))
                                      )}

                                      {/* Hinzufügen-Formular für Haupt-Fähigkeiten direkt hier */}
                                      <div className="flex gap-2 mt-2 pt-1">
                                        <input 
                                          type="text"
                                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[34px] font-medium"
                                          placeholder="Neue Fähigkeit für diese Kernfähigkeit, z.B. Eis Erzeugung..."
                                          value={quickAbilityName}
                                          onChange={e => setQuickAbilityName(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (!quickAbilityName.trim()) return;
                                              const globalSource = activeSource.source || '';
                                              const globalCost = activeSource.cost || '';
                                              setPlayer({
                                                ...player,
                                                abilities: [
                                                  ...currentAbilities,
                                                  {
                                                    id: `ab-${Date.now()}`,
                                                    name: quickAbilityName.trim(),
                                                    category: 'Kernfähigkeit',
                                                    source: globalSource,
                                                    cost: globalCost,
                                                    description: '',
                                                    techniques: '',
                                                    powerSourceId: activeSource.id
                                                  }
                                                ]
                                              });
                                              setQuickAbilityName('');
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!quickAbilityName.trim()) return;
                                            const globalSource = activeSource.source || '';
                                            const globalCost = activeSource.cost || '';
                                            setPlayer({
                                              ...player,
                                              abilities: [
                                                ...currentAbilities,
                                                {
                                                  id: `ab-${Date.now()}`,
                                                  name: quickAbilityName.trim(),
                                                  category: 'Kernfähigkeit',
                                                  source: globalSource,
                                                  cost: globalCost,
                                                  description: '',
                                                  techniques: '',
                                                  powerSourceId: activeSource.id
                                                }
                                              ]
                                            });
                                            setQuickAbilityName('');
                                          }}
                                          className="bg-amber-500 text-slate-950 font-extrabold text-xs px-3 rounded-lg hover:bg-amber-400 transition-all flex items-center gap-1 shrink-0 h-[34px]"
                                        >
                                          <i className="fa-solid fa-plus text-[10px]"></i>
                                          <span>Fähigkeit hinzufügen</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Reiter (Tabs) für Fähigkeiten-Kategorien */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {['Passive Fähigkeiten', 'Techniken', 'Ultimative Techniken', 'Transformationen', 'Talente'].map(tab => {
                        const count = (player.abilities || []).filter(a => {
                          if (a.category !== tab) return false;
                          const belongsToActive = a.powerSourceId === activePowerSource.id || (!a.powerSourceId && activePowerSource.id === playerPowerSourcesList[0]?.id);
                          return belongsToActive;
                        }).length;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveAbilityTab(tab)}
                            className={`flex-1 min-w-[130px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              activeAbilityTab === tab
                              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`}
                          >
                            <span>{tab}</span>
                            {count > 0 && (
                              <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                                activeAbilityTab === tab ? 'bg-slate-950 text-amber-500' : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Button zum Hinzufügen im aktiven Tab */}
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => {
                          const globalSource = activePowerSource.source || '';
                          const globalCost = activePowerSource.cost || '';
                          setPlayer({
                            ...player,
                            abilities: [
                              ...(player.abilities || []),
                              {
                                id: `ab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                name: '',
                                category: activeAbilityTab,
                                source: globalSource,
                                cost: globalCost,
                                description: '',
                                techniques: '',
                                powerSourceId: activePowerSource.id
                              }
                            ]
                          });
                        }}
                        className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600/30 transition-all shadow-sm"
                      >
                        <i className="fa-solid fa-plus"></i> {activeAbilityTab} hinzufügen
                      </button>
                    </div>

                    {/* Fähigkeiten-Liste für aktiven Tab */}
                    {(() => {
                      const currentAbilities = player.abilities || [];
                      const activeAbilities = currentAbilities.filter(ability => {
                        const matchesCategory = !ability.category ? activeAbilityTab === 'Passive Fähigkeiten' : ability.category === activeAbilityTab;
                        if (!matchesCategory) return false;
                        
                        const belongsToActive = ability.powerSourceId === activePowerSource.id || (!ability.powerSourceId && activePowerSource.id === playerPowerSourcesList[0]?.id);
                        return belongsToActive;
                      });

                      if (activeAbilities.length === 0) {
                        return (
                          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                            <LucideIcons.Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 italic">Keine Einträge für &ldquo;{activeAbilityTab}&rdquo; definiert.</p>
                            <p className="text-[10px] text-slate-600 mt-1">Klicke oben auf &ldquo;{activeAbilityTab} hinzufügen&rdquo;, um loszulegen.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4">
                          {activeAbilities.map((ability, idx) => {
                            return (
                              <div key={ability.id || `ability-${idx}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 relative shadow-inner">
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteAbility(ability.id)}
                                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded-lg transition-colors text-xs border border-transparent hover:border-red-500/20"
                                  title="Löschen"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                                
                                <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <i className="fa-solid fa-cube"></i>
                                  <span>{activeAbilityTab} #{idx + 1}</span>
                                </div>

                                {activeAbilityTab === 'Passive Fähigkeiten' ? (
                                  <div className="grid grid-cols-1 gap-3">
                                    {/* Name */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Name der passiven Fähigkeit</label>
                                      <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                        placeholder="z.B. Regeneration, Eiserner Wille..."
                                        value={ability.name || ''}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setPlayer({
                                            ...player,
                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, name: val } : a)
                                          });
                                        }}
                                      />
                                    </div>

                                    {/* Effekt */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Effekt</label>
                                      <AutoExpandingTextarea 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white min-h-[60px] text-xs outline-none focus:border-amber-500" 
                                        placeholder="z.B. Erhöht die Verteidigung um 15%..." 
                                        value={ability.description || ''} 
                                        onChange={e => setPlayer({
                                          ...player,
                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, description: e.target.value } : a)
                                        })} 
                                      />
                                    </div>

                                    {/* Aktivierungsbedingungen */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Aktivierungsbedingungen</label>
                                      <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                        placeholder="z.B. Wenn LP unter 30% sinken oder im Sonnenlicht..."
                                        value={ability.activationCondition || ''}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setPlayer({
                                            ...player,
                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, activationCondition: val } : a)
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-3">
                                    {/* Name */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">
                                        {activeAbilityTab === 'Transformationen' ? 'Name der Verwandlung / Form' : 'Name der Fähigkeit / Technik'}
                                      </label>
                                      <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                        placeholder={activeAbilityTab === 'Transformationen' ? 'z.B. Reine Esper-Form, Kinder-Form...' : 'z.B. Feuerball, Elementarmanipulation...'}
                                        value={ability.name || ''}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setPlayer({
                                            ...player,
                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, name: val, transformName: activeAbilityTab === 'Transformationen' ? (a.transformName !== undefined ? a.transformName : val) : a.transformName } : a)
                                          });
                                        }}
                                      />
                                    </div>

                                    {/* Beschreibung */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">
                                        {activeAbilityTab === 'Transformationen' ? 'Funktionsweise, Auslöser & Grenzen' : 'Beschreibung / Effekt'}
                                      </label>
                                      <AutoExpandingTextarea 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white min-h-[60px] text-xs outline-none focus:border-amber-500" 
                                        placeholder={activeAbilityTab === 'Transformationen' ? 'z.B. Zeitlich begrenzte Nutzung durch hohen Energieverbrauch, verwandelt sich in Kinder-Form bei Erschöpfung...' : 'z.B. Erschafft ein mächtiges Schutzschild oder fügt Flächenschaden zu...'} 
                                        value={ability.description || ''} 
                                        onChange={e => setPlayer({
                                          ...player,
                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, description: e.target.value } : a)
                                        })} 
                                      />
                                    </div>

                                    {activeAbilityTab === 'Transformationen' && (
                                      <div className="flex flex-col gap-3 mt-2 pt-2 border-t border-slate-800/60">
                                        {/* KI-Wahrnehmung & Öffentliche Identität */}
                                        <div className="flex flex-col gap-2">
                                          <label className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <i className="fa-solid fa-masks-theater text-xs text-amber-500"></i>
                                            <span>KI-Wahrnehmung & Öffentliche Identität</span>
                                          </label>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformIdentityPerception: 'bekannt' } : a)
                                                });
                                              }}
                                              className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                                                (ability.transformIdentityPerception || 'bekannt') === 'bekannt'
                                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500/30'
                                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                              }`}
                                            >
                                              <div className="font-extrabold flex items-center gap-1.5">
                                                <i className="fa-solid fa-user text-emerald-400"></i>
                                                <span>Bekannt</span>
                                              </div>
                                              <p className="text-[9.5px] font-normal text-slate-400 mt-0.5">
                                                NPCs erkennen {player.name || 'den Charakter'}.
                                              </p>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformIdentityPerception: 'getrennt' } : a)
                                                });
                                              }}
                                              className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                                                (ability.transformIdentityPerception || 'bekannt') === 'getrennt'
                                                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold ring-1 ring-purple-500/30'
                                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                              }`}
                                            >
                                              <div className="font-extrabold flex items-center gap-1.5">
                                                <i className="fa-solid fa-masks-theater text-purple-400"></i>
                                                <span>Getrennt</span>
                                              </div>
                                              <p className="text-[9.5px] font-normal text-slate-400 mt-0.5">
                                                Geheimidentität / Unbekannte Gestalt.
                                              </p>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformIdentityPerception: 'koerpertausch' } : a)
                                                });
                                              }}
                                              className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                                                (ability.transformIdentityPerception || 'bekannt') === 'koerpertausch'
                                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/30'
                                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                              }`}
                                            >
                                              <div className="font-extrabold flex items-center gap-1.5">
                                                <i className="fa-solid fa-arrows-rotate text-amber-400"></i>
                                                <span>Körpertausch</span>
                                              </div>
                                              <p className="text-[9.5px] font-normal text-slate-400 mt-0.5">
                                                Codex-Charakter übertragen.
                                              </p>
                                            </button>
                                          </div>

                                          {/* KÖRPERTAUSCH CODEX AUSWAHL */}
                                          {(ability.transformIdentityPerception || 'bekannt') === 'koerpertausch' && (
                                            <div className="mt-2 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2 text-xs">
                                              <div className="flex items-center justify-between gap-2">
                                                <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                                  <i className="fa-solid fa-book-bookmark text-amber-400"></i>
                                                  <span>Codex-Charakter auswählen:</span>
                                                </label>
                                                {ability.transformSwappedCharacterName && (
                                                  <span className="text-[9.5px] text-amber-400 font-bold">
                                                    Aktuell: {ability.transformSwappedCharacterName}
                                                  </span>
                                                )}
                                              </div>
                                              <select
                                                value={ability.transformSwappedCharacterId || ''}
                                                onChange={(e) => {
                                                  const selectedId = e.target.value;
                                                  const targetCodex = (loreDatabase || []).find((l: any) => (l.id || `codex-${l.title}`) === selectedId);
                                                  const targetNpc = (npcs || []).find((n: any) => (n.id || `npc-${n.name}`) === selectedId);
                                                  const target = targetCodex || targetNpc;

                                                  if (target) {
                                                    const d = (target as any).details || (target as any).appearance || target;
                                                    const targetName = (target as any).title || (target as any).name || 'Charakter';
                                                    const targetGender = d.gender || 'Weiblich';
                                                    const targetRace = d.race || 'Mensch';
                                                    const targetHeight = d.height ? String(d.height) : '170';
                                                    const targetBuild = d.build || 'Schlank';
                                                    const targetCup = d.cupSize || '-';

                                                    setPlayer({
                                                      ...player,
                                                      abilities: currentAbilities.map(a => a.id === ability.id ? {
                                                        ...a,
                                                        transformIdentityPerception: 'koerpertausch',
                                                        transformSwappedCharacterId: selectedId,
                                                        transformSwappedCharacterName: targetName,
                                                        transformSwappedCharacterSource: targetCodex ? 'codex' : 'npc',
                                                        transformName: `Körpertausch: ${targetName}`,
                                                        transformGender: targetGender,
                                                        transformRace: targetRace,
                                                        transformHeight: targetHeight,
                                                        transformBuild: targetBuild,
                                                        transformCupSize: targetCup,
                                                        transformHairColor: d.hairColor || '',
                                                        transformEyeColor: d.eyeColor || '',
                                                        transformOutfit: d.outfit || '',
                                                        transformLooks: d.looks || ''
                                                      } : a)
                                                    });
                                                  }
                                                }}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                                              >
                                                <option value="">-- Charakter aus Codex / NPC wählen --</option>
                                                {player && player.name && (
                                                  <optgroup label="Nutzer / Hauptcharakter">
                                                    <option value={(player as any).id || 'main_player_user'}>
                                                      {player.name} (Nutzer / Hauptcharakter)
                                                    </option>
                                                  </optgroup>
                                                )}
                                                <optgroup label="Codex-Charaktere">
                                                  {(loreDatabase || [])
                                                    .filter((l: any) => l.category === 'Charaktere' || l.category === 'Gegner' || l.details?.gender || l.details?.role)
                                                    .map((l: any) => (
                                                      <option key={l.id || l.title} value={l.id || `codex-${l.title}`}>
                                                        {l.title || l.details?.name} {l.details?.role ? `(${l.details.role})` : ''}
                                                      </option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="NPCs">
                                                  {(npcs || []).map((n: any) => (
                                                    <option key={n.id || n.name} value={n.id || `npc-${n.name}`}>
                                                      {n.name} {n.role ? `(${n.role})` : ''}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              </select>
                                            </div>
                                          )}
                                        </div>

                                        {/* Transformiertes Aussehen, Kleidung & Details */}
                                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-3 mt-1">
                                          <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <i className="fa-solid fa-sparkles text-amber-400"></i>
                                            <span>Verwandeltes Aussehen & Details</span>
                                          </div>

                                          {/* Aussehen & Erscheinung */}
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] text-slate-400 font-bold uppercase">Form-Aussehen & Merkmale</label>
                                            <AutoExpandingTextarea
                                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[50px]"
                                              placeholder="z.B. Leuchtender Körper, magenta-flammendes Haar, glühende rosa Augen..."
                                              value={ability.transformLooks || ''}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformLooks: val } : a)
                                                });
                                              }}
                                            />
                                          </div>

                                          {/* Kleidung & Ausrüstungsverhalten */}
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] text-slate-400 font-bold uppercase">Kleidung & Ausrüstungsverhalten</label>
                                            <AutoExpandingTextarea
                                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[50px]"
                                              placeholder="z.B. Kleidung verschwindet während Verwandlung (nackt) und erscheint bei Rückverwandlung wieder / Kleidung behält Originalgröße..."
                                              value={ability.transformOutfit || ''}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformOutfit: val } : a)
                                                });
                                              }}
                                            />
                                          </div>

                                          {/* Rassenmerkmale / Physische Veränderungen */}
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] text-slate-400 font-bold uppercase">Rassenmerkmale / Physische Veränderungen</label>
                                            <AutoExpandingTextarea
                                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[45px]"
                                              placeholder="z.B. Rosa Fell, spitze Ohren, Krallen an Händen und Füßen..."
                                              value={ability.transformRaceFeatures || ''}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformRaceFeatures: val } : a)
                                                });
                                              }}
                                            />
                                          </div>

                                          {/* Parameter Grid: Alter, Größe, Statur, Rasse, Haare, Augen, Körbchen */}
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Alter</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. 24 / Kind (8)"
                                                value={ability.transformAge || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformAge: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Größe</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. 175 cm"
                                                value={ability.transformHeight || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformHeight: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Statur</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. Schlank / Zierlich"
                                                value={ability.transformBuild || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformBuild: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Rasse</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. Esper-Hybrid"
                                                value={ability.transformRace || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformRace: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Haarfarbe</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. Magenta"
                                                value={ability.transformHairColor || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformHairColor: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Augenfarbe</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. Rosa glühend"
                                                value={ability.transformEyeColor || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformEyeColor: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Körbchengröße</label>
                                              <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                                                placeholder="z.B. D / -"
                                                value={ability.transformCupSize || ''}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformCupSize: val } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            <div className="flex items-center gap-4 pt-4">
                                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={!!ability.transformWings}
                                                  onChange={e => {
                                                    const checked = e.target.checked;
                                                    setPlayer({
                                                      ...player,
                                                      abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformWings: checked } : a)
                                                    });
                                                  }}
                                                  className="rounded bg-slate-900 border-slate-700 text-amber-500"
                                                />
                                                <span className="text-[10px] font-bold uppercase">Flügel</span>
                                              </label>
                                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={!!ability.transformHorns}
                                                  onChange={e => {
                                                    const checked = e.target.checked;
                                                    setPlayer({
                                                      ...player,
                                                      abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, transformHorns: checked } : a)
                                                    });
                                                  }}
                                                  className="rounded bg-slate-900 border-slate-700 text-amber-500"
                                                />
                                                <span className="text-[10px] font-bold uppercase">Hörner</span>
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Techniken */}
                                {activeAbilityTab !== 'Passive Fähigkeiten' && (
                                  <div className="flex flex-col gap-1 mt-1 border-t border-slate-800/60 pt-3">
                                  <div className={`flex items-center ${(activeAbilityTab === 'Techniken' || activeAbilityTab === 'Ultimative Techniken') ? 'justify-end' : 'justify-between'}`}>
                                    {activeAbilityTab !== 'Techniken' && activeAbilityTab !== 'Ultimative Techniken' && (
                                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1 flex items-center gap-1">
                                        <i className="fa-solid fa-wand-magic-sparkles text-indigo-400 text-[10px]"></i>
                                        <span>Zugehörige Kampf-Techniken ({ability.techniqueList?.length || 0})</span>
                                      </label>
                                    )}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const activeWorld = world;
                                        const defaultRules = activeWorld.techniqueRules || {
                                          Angriff: { type: 'Angriff', defaultSubtype: 'Einzelschuss', mainParameter: 'Stärke', progressionCostValue: 100, costResourceName: 'Mana', costValue: 10, levelScaling: 'Linear (+10% Schaden pro Level)' }
                                        };
                                        const rule = defaultRules['Angriff'] || {
                                          type: 'Angriff',
                                          defaultSubtype: 'Einzelschuss',
                                          mainParameter: 'Stärke',
                                          progressionCostValue: 100,
                                          costResourceName: 'Mana',
                                          costValue: 10,
                                          levelScaling: 'Linear (+10% Schaden pro Level)'
                                        };
                                        const progLogic = activeWorld.techniqueProgressionLogic || 'ep';
                                        const newTech: any = {
                                          id: `tech-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                          name: '',
                                          type: 'Angriff',
                                          subtype: rule.defaultSubtype,
                                          description: '',
                                          level: 1,
                                          maxLevel: 10,
                                          xp: 0,
                                          xpNeeded: progLogic === 'ep' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 100) : undefined,
                                          xpGainPerUse: progLogic === 'ep' ? 10 : undefined,
                                          trainingRequired: progLogic === 'training' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 3) : undefined,
                                          trainingProgress: progLogic === 'training' ? 0 : undefined,
                                          milestoneRequirement: progLogic === 'milestone' ? String(rule.progressionCostValue || 'Nach Bosskampf') : undefined,
                                          staticCost: progLogic === 'static' ? String(rule.progressionCostValue || '5 FP') : undefined,
                                          cost: `s{rule.costValue} ${rule.costResourceName}`,
                                          tier: 'Tier 1',
                                          baseValue: 0,
                                          costResourceName: rule.costResourceName || 'Mana',
                                          costValue: rule.costValue || 10,
                                          costFormula: 'absolut'
                                        };
                                        const newTechList = [...(ability.techniqueList || []), newTech];
                                        setPlayer({
                                          ...player,
                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map(t => t.name).join(', ') } : a)
                                        });
                                      }}
                                      className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center gap-1"
                                    >
                                      <i className="fa-solid fa-plus text-[9px]"></i> Kampf-Technik hinzufügen
                                    </button>
                                  </div>

                                  {(!ability.techniqueList || ability.techniqueList.length === 0) ? (
                                    <textarea 
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white min-h-[60px] text-xs outline-none focus:border-amber-500 mt-1" 
                                      placeholder="z.B. Eis Atem, Angriff mit Eiszapfen..." 
                                      value={ability.techniques || ''} 
                                      onChange={e => setPlayer({
                                        ...player,
                                        abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniques: e.target.value } : a)
                                      })} 
                                    />
                                  ) : (
                                    <div className="flex flex-col gap-2.5 mt-1">
                                      {ability.techniqueList.map((tech, tIdx) => (
                                        <div key={tech.id || `tech-${tIdx}`} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 relative group">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 font-extrabold uppercase">Kampf-Technik #${tIdx + 1}</span>
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                const newTechList = ability.techniqueList?.filter(t => t.id !== tech.id) || [];
                                                setPlayer({
                                                  ...player,
                                                  abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map(t => t.name).join(', ') } : a)
                                                });
                                              }}
                                              className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20"
                                            >
                                              <i className="fa-solid fa-trash-can text-[9px]"></i> Löschen
                                            </button>
                                          </div>

                                          {(() => {
                                            const getRadarValue = (radarName: string) => {
                                              const rawVal = player.campaignPowerLevels?.[radarName];
                                              if (rawVal !== undefined) {
                                                if (typeof rawVal === 'number') return rawVal;
                                                if (typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal) {
                                                  return (rawVal as any).value || 0;
                                                }
                                                return parseInt(String(rawVal)) || 0;
                                              }
                                              return 0;
                                            };

                                            const efficiencyValue = (() => {
                                              const allocations = world.customStatAllocations || [];
                                              const efficiencyAlloc = allocations.find(a => a.coreRole === 'CORE_RESOURCE_EFFICIENCY');
                                              if (efficiencyAlloc && efficiencyAlloc.selectedRadarNames && efficiencyAlloc.selectedRadarNames.length > 0) {
                                                return efficiencyAlloc.selectedRadarNames.reduce((sum, name) => sum + getRadarValue(name), 0);
                                              }
                                              const fallbackKey = Object.keys(player.campaignPowerLevels || {}).find(k => k.toLowerCase().includes('effizienz'));
                                              if (fallbackKey) {
                                                return getRadarValue(fallbackKey);
                                              }
                                              return 0;
                                            })();

                                            const getMaxPoolValue = (resourceName: string) => {
                                              const nameToMatch = resourceName || 'Mana';
                                              
                                              // 1. Check player attributes - prefer current value (Aktueller Wert) over max
                                              const attr = player.attributes?.find(a => a.name.toLowerCase() === nameToMatch.toLowerCase());
                                              if (attr && attr.value !== undefined) return attr.value;
                                              if (attr && attr.max !== undefined) return attr.max;
                                              
                                              // 2. Check world cost resources
                                              const costResources = (world as any)?.costResources || [];
                                              const res = costResources.find((r: any) => r.name?.toLowerCase() === nameToMatch.toLowerCase());
                                              if (res) {
                                                if (res.radarPowerName) {
                                                  const powerLevel = player.campaignPowerLevels?.[res.radarPowerName] as any;
                                                  if (powerLevel !== undefined && powerLevel !== null) {
                                                    if (typeof powerLevel === 'number') return powerLevel;
                                                    if (typeof powerLevel === 'object') {
                                                      if (powerLevel.value !== undefined) return powerLevel.value;
                                                      if (powerLevel.max !== undefined) return powerLevel.max;
                                                      if (powerLevel.potentialMax !== undefined) return powerLevel.potentialMax;
                                                    }
                                                  }
                                                }
                                                if (res.baseMax !== undefined) return res.baseMax;
                                              }

                                              // 3. Fallbacks
                                              if (nameToMatch.toLowerCase() === 'mana' || nameToMatch.toLowerCase() === 'mp') return 50;
                                              if (nameToMatch.toLowerCase() === 'gesundheit' || nameToMatch.toLowerCase() === 'hp') return 100;
                                              return 100;
                                            };

                                            const selectedTier = tech.tier || 'Tier 1';
                                            const resName = tech.costResourceName || player.powerCost || 'Mana';
                                            const maxPool = getMaxPoolValue(resName);
                                            let tierPercent = 5;
                                            if (selectedTier.includes('4') || selectedTier.toLowerCase().includes('ultimativ')) tierPercent = 60;
                                            else if (selectedTier.includes('3') || selectedTier.toLowerCase().includes('meisterhaft')) tierPercent = 35;
                                            else if (selectedTier.includes('2') || selectedTier.toLowerCase().includes('fortgeschritten')) tierPercent = 15;
                                            
                                            const basisKosten = Math.max(1, Math.round(maxPool * tierPercent / 100));
                                            const finalKosten = Math.max(1, Math.round(basisKosten * (1 - efficiencyValue / 200)));

                                            return (
                                              <>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-1">
                                                  {/* Name der Technik */}
                                                  <div className="md:col-span-3 flex flex-col gap-1">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Name der Technik</label>
                                                    <input 
                                                      type="text"
                                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold h-[38px]"
                                                      placeholder="z.B. Eis Atem"
                                                      value={tech.name || ''}
                                                      onChange={e => {
                                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, name: e.target.value } : t) || [];
                                                        setPlayer({
                                                          ...player,
                                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map(t => t.name).join(', ') } : a)
                                                        });
                                                      }}
                                                    />
                                                  </div>

                                                  {/* Tier Dropdown */}
                                                  <div className="md:col-span-3 flex flex-col gap-1">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Kategorie / Tier</label>
                                                    <select
                                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-semibold h-[38px]"
                                                      value={selectedTier}
                                                      onChange={e => {
                                                        const newTier = e.target.value;
                                                        let newTierPercent = 5;
                                                        if (newTier.includes('4') || newTier.toLowerCase().includes('ultimativ')) newTierPercent = 60;
                                                        else if (newTier.includes('3') || newTier.toLowerCase().includes('meisterhaft')) newTierPercent = 35;
                                                        else if (newTier.includes('2') || newTier.toLowerCase().includes('fortgeschritten')) newTierPercent = 15;
                                                        const newBasis = Math.max(1, Math.round(maxPool * newTierPercent / 100));
                                                        const newFinal = Math.max(1, Math.round(newBasis * (1 - efficiencyValue / 200)));

                                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                                          ...t, 
                                                          tier: newTier,
                                                          cost: `${newFinal} ${resName}`,
                                                          costValue: newFinal
                                                        } : t) || [];
                                                        setPlayer({
                                                          ...player,
                                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                        });
                                                      }}
                                                    >
                                                      <option value="Tier 1" className="bg-slate-900 text-white">Tier 1 (Standard - 5%)</option>
                                                      <option value="Tier 2" className="bg-slate-900 text-white">Tier 2 (Fortgeschritten - 15%)</option>
                                                      <option value="Tier 3" className="bg-slate-900 text-white">Tier 3 (Meisterhaft - 35%)</option>
                                                      <option value="Tier 4" className="bg-slate-900 text-white">Tier 4 (Ultimativ - 60%)</option>
                                                    </select>
                                                  </div>

                                                  {/* Kosten-Ressource Dropdown & Eingabefeld */}
                                                  <div className="md:col-span-3 flex flex-col gap-1">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Kosten / Verbrauch</label>
                                                    <div className="flex h-[38px]">
                                                      <input
                                                        type="number"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs text-center outline-none focus:border-amber-500 font-mono font-bold"
                                                        value={tech.costValue === 0 ? '' : (tech.costValue !== undefined ? tech.costValue : finalKosten)}
                                                        min="0"
                                                        onChange={e => {
                                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                                            ...t, 
                                                            costValue: val,
                                                            cost: `${val} ${resName}`
                                                          } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                        onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                                                        placeholder="Wert"
                                                      />
                                                    </div>
                                                  </div>

                                                  {/* Anwendung Dropdown (Mehrfachauswahl) */}
                                                  <div className="md:col-span-3 flex flex-col gap-1">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Anwendung</label>
                                                    <div className="relative">
                                                      <button
                                                        type="button"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-semibold h-[38px] flex items-center justify-between text-left cursor-pointer"
                                                        onClick={() => setOpenApplicationsDropdown(openApplicationsDropdown === tech.id ? null : tech.id)}
                                                      >
                                                        <span className="truncate">
                                                          {tech.applications && tech.applications.length > 0
                                                            ? tech.applications.join(', ')
                                                            : 'Sonstiges'}
                                                        </span>
                                                        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                                                      </button>

                                                      {openApplicationsDropdown === tech.id && (
                                                        <>
                                                          <div 
                                                            className="fixed inset-0 z-40" 
                                                            onClick={() => setOpenApplicationsDropdown(null)}
                                                          />
                                                          <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-52 overflow-y-auto z-50 p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                                            {['Angriff', 'Verteidigung', 'Unterstützung', 'Bewegung', 'Kontrolle', 'Heilung', 'Beschwörung', 'Umgebung verändern', 'Sonstiges'].map(app => {
                                                              const isSelected = tech.applications?.includes(app) || (app === 'Sonstiges' && (!tech.applications || tech.applications.length === 0));
                                                              return (
                                                                <button
                                                                  key={app}
                                                                  type="button"
                                                                  className={`flex items-center gap-2 p-1.5 rounded-md text-xs font-medium text-left cursor-pointer w-full transition-colors ${isSelected ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20' : 'text-slate-300 hover:bg-slate-900 border border-transparent'}`}
                                                                  onClick={() => {
                                                                    let newApps = [...(tech.applications || [])];
                                                                    if (app === 'Sonstiges') {
                                                                      newApps = ['Sonstiges'];
                                                                    } else {
                                                                      newApps = newApps.filter(a => a !== 'Sonstiges');
                                                                      if (newApps.includes(app)) {
                                                                        newApps = newApps.filter(a => a !== app);
                                                                      } else {
                                                                        newApps.push(app);
                                                                      }
                                                                      if (newApps.length === 0) {
                                                                        newApps = ['Sonstiges'];
                                                                      }
                                                                    }
                                                                    const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, applications: newApps } : t) || [];
                                                                    setPlayer({
                                                                      ...player,
                                                                      abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                                    });
                                                                  }}
                                                                >
                                                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'}`}>
                                                                    {isSelected && <i className="fa-solid fa-check text-[8px]" />}
                                                                  </div>
                                                                  <span>{app}</span>
                                                                </button>
                                                              );
                                                            })}
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Count field for Summoning / Clones / Illusions */}
                                                {(tech.applications?.includes('Beschwörung') ||
                                                  tech.type === 'Beschwörung' ||
                                                  tech.name?.toLowerCase().includes('beschwör') ||
                                                  tech.name?.toLowerCase().includes('doppelgänger') ||
                                                  tech.name?.toLowerCase().includes('illusion') ||
                                                  tech.name?.toLowerCase().includes('klon')) && (
                                                  <div className="bg-indigo-950/20 border border-indigo-500/30 p-2.5 rounded-xl mt-2 flex flex-col gap-1.5">
                                                    <label className="text-[10px] text-indigo-300 font-bold uppercase flex items-center justify-between">
                                                      <span className="flex items-center gap-1.5">
                                                        <i className="fa-solid fa-users text-indigo-400"></i>
                                                        Anzahl Einheiten / Klone auf dem Kampfraster
                                                      </span>
                                                      <span className="text-amber-400 font-mono font-extrabold">{tech.summonCount !== undefined ? tech.summonCount : 2}x</span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                      <input
                                                        type="number"
                                                        min="1"
                                                        max="20"
                                                        value={tech.summonCount !== undefined ? tech.summonCount : 2}
                                                        onChange={(e) => {
                                                          const val = Math.max(1, parseInt(e.target.value) || 1);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, summonCount: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                        className="w-28 bg-slate-900 border border-indigo-500/50 rounded-lg p-1.5 text-indigo-200 font-mono font-bold text-xs outline-none focus:border-amber-500 h-[36px] text-center"
                                                        placeholder="Anzahl"
                                                      />
                                                      <span className="text-[10.5px] text-slate-300 font-medium italic">
                                                        Erscheinen beim Ausführen der Technik direkt als Einheiten-Tokens auf dem Kampfraster!
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Calculated Cost Info Block */}
                                                <div className="mt-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                                    <span className="font-semibold text-slate-400">Verbrauchsberechnung:</span>
                                                    <span className="text-slate-400">Basis ({selectedTier}: {tierPercent}% von {maxPool} {resName}) = <strong className="text-white">{basisKosten}</strong></span>
                                                    <span className="text-slate-500">|</span>
                                                    <span className="text-slate-400">Energie-Effizienz ({efficiencyValue}) = <strong className="text-green-400 font-bold">-{Math.round((efficiencyValue / 200) * 100)}%</strong></span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-500 uppercase font-extrabold">Finale Kosten</span>
                                                    <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                                                      {finalKosten} {resName}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Stufe & Max Stufe if non-standard tab */}
                                                {activeAbilityTab !== 'Techniken' && activeAbilityTab !== 'Ultimative Techniken' && (
                                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Stufe (Lv)</label>
                                                      <input 
                                                        type="number"
                                                        min="1"
                                                        max={tech.maxLevel || 10}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono font-bold text-center"
                                                        value={tech.level || 1}
                                                        onChange={e => {
                                                          const val = Math.max(1, parseInt(e.target.value) || 1);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, level: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Max Lv</label>
                                                      <input 
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono text-center"
                                                        value={tech.maxLevel || 10}
                                                        onChange={e => {
                                                          const val = Math.max(1, parseInt(e.target.value) || 10);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, maxLevel: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </>
                                            );
                                          })()}

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                                            {/* Beschreibung */}
                                            <div className="flex flex-col gap-1">
                                              <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Beschreibung</label>
                                              <textarea 
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white min-h-[65px] text-xs outline-none focus:border-amber-500" 
                                                placeholder="z.B. Sie formt scharfe Krallen aus Eis an ihren Fingerspitzen, die Metall zerschneiden können." 
                                                value={tech.description || ''} 
                                                onChange={e => {
                                                  const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, description: e.target.value } : t) || [];
                                                  setPlayer({
                                                    ...player,
                                                    abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                  });
                                                }}
                                              />
                                            </div>

                                            {/* Grundwert & Höhe der Wirkung */}
                                            <div className="grid grid-cols-2 gap-3.5">
                                              {/* Grundwert */}
                                              <div className="flex flex-col gap-1">
                                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Grundwert</label>
                                                <input 
                                                  type="number"
                                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-semibold"
                                                  placeholder="z.B. 15"
                                                  value={tech.baseValue === 0 ? '' : (tech.baseValue !== undefined ? tech.baseValue : 15)}
                                                  onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, baseValue: val } : t) || [];
                                                    setPlayer({
                                                      ...player,
                                                      abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                    });
                                                  }}
                                                  onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                                                />
                                              </div>

                                              {/* Höhe der Wirkung */}
                                              <div className="flex flex-col gap-1">
                                                {(() => {
                                                  const assocSource = playerPowerSourcesList.find(ps => ps.id === ability.powerSourceId) || playerPowerSourcesList[0];
                                                  const powerSourceValue = (() => {
                                                    if (!assocSource) return 0;
                                                    const levelByPowerName = assocSource.powerName ? player.campaignPowerLevels?.[assocSource.powerName] : undefined;
                                                    const levelBySource = assocSource.source ? player.campaignPowerLevels?.[assocSource.source] : undefined;
                                                    const rawVal = levelByPowerName !== undefined ? levelByPowerName : (levelBySource !== undefined ? levelBySource : undefined);
                                                    if (rawVal !== undefined) {
                                                      if (typeof rawVal === 'number') return rawVal;
                                                      if (typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal) {
                                                        return (rawVal as any).value || 0;
                                                      }
                                                      return parseInt(String(rawVal)) || 0;
                                                    }
                                                    return 0;
                                                  })();
                                                  const techBaseVal = tech.baseValue !== undefined ? tech.baseValue : 15;
                                                  const computedWirkung = Math.round(techBaseVal * (1 + powerSourceValue / 100));
                                                  const sourceLabel = assocSource ? (assocSource.powerName || assocSource.source || 'Kraftquelle') : 'Kraftquelle';

                                                  return (
                                                    <>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase ml-1 flex justify-between items-center">
                                                        <span>Höhe der Wirkung</span>
                                                        <span className="text-[8px] text-amber-500 font-normal normal-case">
                                                          ({sourceLabel}: {techBaseVal} × (1 + {powerSourceValue}/100) = {computedWirkung})
                                                        </span>
                                                      </label>
                                                      <input 
                                                        type="text"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-semibold"
                                                        placeholder={`z.B. ${computedWirkung}`}
                                                        value={tech.effectValue !== undefined ? tech.effectValue : (tech.scaling !== undefined && tech.scaling !== '' ? tech.scaling : computedWirkung)}
                                                        onChange={e => {
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, effectValue: e.target.value, scaling: e.target.value } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Progress Logic Editor */}
                                          {activeAbilityTab !== 'Techniken' && activeAbilityTab !== 'Ultimative Techniken' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5 border-t border-slate-900/60 pt-2 bg-slate-900/20 p-2 rounded-lg">
                                            {(() => {
                                              const globalLogic = world.techniqueProgressionLogic || 'ep';
                                              
                                              if (globalLogic === 'ep') {
                                                return (
                                                  <>
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase">Aktuelle EP</label>
                                                      <input 
                                                        type="number"
                                                        min="0"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono"
                                                        value={tech.xp || 0}
                                                        onChange={e => {
                                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, xp: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase">Benötigte EP</label>
                                                      <input 
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono"
                                                        value={tech.xpNeeded || 100}
                                                        onChange={e => {
                                                          const val = Math.max(1, parseInt(e.target.value) || 100);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, xpNeeded: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                  </>
                                                );
                                              }

                                              if (globalLogic === 'training') {
                                                return (
                                                  <>
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase">Trainingseinheiten absolviert</label>
                                                      <input 
                                                        type="number"
                                                        min="0"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono"
                                                        value={tech.trainingProgress || 0}
                                                        onChange={e => {
                                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, trainingProgress: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase">Trainingseinheiten benötigt</label>
                                                      <input 
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono"
                                                        value={tech.trainingRequired || 3}
                                                        onChange={e => {
                                                          const val = Math.max(1, parseInt(e.target.value) || 3);
                                                          const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, trainingRequired: val } : t) || [];
                                                          setPlayer({
                                                            ...player,
                                                            abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                          });
                                                        }}
                                                      />
                                                    </div>
                                                  </>
                                                );
                                              }

                                              if (globalLogic === 'milestone') {
                                                return (
                                                  <div className="md:col-span-2">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Bedingung für Aufstieg</label>
                                                    <input 
                                                      type="text"
                                                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                      placeholder="z.B. Finde das One Piece / Besiege den Boss"
                                                      value={tech.milestoneRequirement || ''}
                                                      onChange={e => {
                                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, milestoneRequirement: e.target.value } : t) || [];
                                                        setPlayer({
                                                          ...player,
                                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                        });
                                                      }}
                                                    />
                                                  </div>
                                                );
                                              }

                                              if (globalLogic === 'static') {
                                                return (
                                                  <div className="md:col-span-2">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Freischalt-Kosten / Voraussetzung</label>
                                                    <input 
                                                      type="text"
                                                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                      placeholder="z.B. 10 Talentpunkte / 500 Gold"
                                                      value={tech.staticCost || ''}
                                                      onChange={e => {
                                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, staticCost: e.target.value } : t) || [];
                                                        setPlayer({
                                                          ...player,
                                                          abilities: currentAbilities.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                        });
                                                      }}
                                                    />
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {world.campaignPowerSettings && Object.keys(world.campaignPowerSettings).length > 0 && (
                  <CharacterPowerRadar 
                    worldPowerSettings={world.campaignPowerSettings}
                    characterData={player.campaignPowerLevels}
                    onChange={(newData) => setPlayer({ ...player, campaignPowerLevels: newData })}
                  />
                )}
              </div>
              )}

              {playerCharTab === 'beruf_talente' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-sm font-bold text-slate-300">Berufe, Talente & Alltagskompetenzen</h4>
                    </div>

                    <CompetenceProfileEditor
                      profession={player.profession || player.role || ''}
                      onProfessionChange={val => {
                        if (activeTransformation) {
                          const updatedAbilities = (player.abilities || []).map(a => 
                            a.id === activeTransformation.id 
                              ? { ...a, transformRole: val } 
                              : a
                          );
                          setPlayer(prev => ({ ...prev, profession: val, abilities: updatedAbilities }));
                        } else {
                          setPlayer(prev => ({ ...prev, profession: val, role: val }));
                        }
                      }}
                      professionLevel={player.professionLevel || ''}
                      onProfessionLevelChange={val => setPlayer(prev => ({ ...prev, professionLevel: val }))}
                      professionField={player.professionField || ''}
                      onProfessionFieldChange={val => setPlayer(prev => ({ ...prev, professionField: val }))}
                      professionSpecialization={player.professionSpecialization || ''}
                      onProfessionSpecializationChange={val => setPlayer(prev => ({ ...prev, professionSpecialization: val }))}
                      professionRank={player.professionRank || player.professionLevel || ''}
                      onProfessionRankChange={val => setPlayer(prev => ({ ...prev, professionRank: val, professionLevel: val }))}
                      professionExperience={player.professionExperience}
                      onExperienceChange={val => setPlayer(prev => ({ ...prev, professionExperience: val }))}
                      professionProficiencyScore={player.professionProficiencyScore || 0}
                      onProfessionProficiencyScoreChange={val => setPlayer(prev => ({ ...prev, professionProficiencyScore: val }))}
                      professionExperiencePoints={player.professionExperiencePoints || 0}
                      onProfessionExperiencePointsChange={val => setPlayer(prev => ({ ...prev, professionExperiencePoints: val }))}
                      professionExperienceText={player.professionExperienceText || ''}
                      onProfessionExperienceTextChange={val => setPlayer(prev => ({ ...prev, professionExperienceText: val }))}
                      professionPromotionConditions={player.professionPromotionConditions || ''}
                      onProfessionPromotionConditionsChange={val => setPlayer(prev => ({ ...prev, professionPromotionConditions: val }))}
                      professionProgress={player.professionProgress}
                      onProfessionProgressChange={val => setPlayer(prev => ({ ...prev, professionProgress: val }))}
                      professionCompetencies={player.professionCompetencies || []}
                      onProfessionCompetenciesChange={val => setPlayer(prev => ({ ...prev, professionCompetencies: val }))}
                      socialTitles={player.socialTitles || []}
                      onSocialTitlesChange={val => setPlayer(prev => ({ ...prev, socialTitles: val }))}
                      offices={player.offices || []}
                      onOfficesChange={val => setPlayer(prev => ({ ...prev, offices: val }))}
                      positions={player.positions || []}
                      onPositionsChange={val => setPlayer(prev => ({ ...prev, positions: val }))}
                      craftingSkills={player.craftingSkills || ''}
                      onCraftingSkillsChange={val => setPlayer(prev => ({ ...prev, craftingSkills: val }))}
                      jobTitle={player.jobTitle || ''}
                      onJobTitleChange={val => setPlayer(prev => ({ ...prev, jobTitle: val }))}
                      authorities={player.authorities || []}
                      onAuthoritiesChange={val => setPlayer(prev => ({ ...prev, authorities: val }))}
                      professionDescription={player.professionDescription || ''}
                      onProfessionDescriptionChange={val => setPlayer(prev => ({ ...prev, professionDescription: val }))}
                      secondaryProfessions={player.secondaryProfessions || []}
                      onSecondaryProfessionsChange={val => setPlayer(prev => ({ ...prev, secondaryProfessions: val }))}
                      talents={player.talents || ''}
                      onTalentsChange={val => setPlayer(prev => ({ ...prev, talents: val }))}
                      everydaySkills={player.everydaySkills || ''}
                      onEverydaySkillsChange={val => setPlayer(prev => ({ ...prev, everydaySkills: val }))}
                      everydaySkillsProficiencyScore={player.everydaySkillsProficiencyScore || 0}
                      onEverydaySkillsProficiencyScoreChange={val => setPlayer(prev => ({ ...prev, everydaySkillsProficiencyScore: val }))}
                      everydaySkillsExperienceText={player.everydaySkillsExperienceText || ''}
                      onEverydaySkillsExperienceTextChange={val => setPlayer(prev => ({ ...prev, everydaySkillsExperienceText: val }))}
                      toolsAndEquipment={player.toolsAndEquipment || ''}
                      onToolsAndEquipmentChange={val => setPlayer(prev => ({ ...prev, toolsAndEquipment: val }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-100">HUD & Interface</h3>
                <button 
                  onClick={() => setStatusElements(HUD_PRESETS["Klassisch"].map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) })))}
                  className="text-[10px] text-slate-500 hover:text-amber-500 transition-colors font-bold uppercase"
                >
                  Standard wiederherstellen
                </button>
              </div>

              {/* Empfohlene Presets & Standard-Schnellauswahl */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-gamepad text-amber-500"></i> Empfohlene Presets
                  </label>
                  <button 
                    onClick={() => {
                      let recommended = "Klassisch";
                      if (selectedTags.includes("Sci-Fi") || selectedTags.includes("Cyberpunk")) recommended = "Sci-Fi";
                      else if (selectedTags.includes("Fantasy") || selectedTags.includes("Mittelalter")) recommended = "RPG";
                      else if (selectedTags.includes("Post-Apokalyptisch") || selectedTags.includes("Horror")) recommended = "Survival";
                      
                      const moneyStr = `${structuredInventory?.money ?? 100} ${structuredInventory?.currencyLabel || 'Gold'}`.trim();
                      setStatusElements(HUD_PRESETS[recommended].map(p => {
                        const l = p.label.toLowerCase();
                        if (l.includes('vermögen') || l.includes('geld') || l.includes('gold')) {
                          return { ...p, id: Math.random().toString(36).substr(2, 9), value: moneyStr };
                        }
                        return { ...p, id: Math.random().toString(36).substr(2, 9) };
                      }));
                    }}
                    className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors font-bold uppercase flex items-center gap-1"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Passend zu Tags wählen
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(HUD_PRESETS).map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        const moneyStr = `${structuredInventory?.money ?? 100} ${structuredInventory?.currencyLabel || 'Gold'}`.trim();
                        setStatusElements(HUD_PRESETS[preset].map(p => {
                          const l = p.label.toLowerCase();
                          if (l.includes('vermögen') || l.includes('geld') || l.includes('gold')) {
                            return { ...p, id: Math.random().toString(36).substr(2, 9), value: moneyStr };
                          }
                          return { ...p, id: Math.random().toString(36).substr(2, 9) };
                        }));
                      }}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Quick Add Buttons for Core Elements */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Standard-Anzeigen hinzufügen:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Uhrzeit', value: '12:00', icon: 'fa-clock', color: 'text-amber-400' },
                      { label: 'Standort', value: 'Startgebiet', icon: 'fa-map-location-dot', color: 'text-sky-400' },
                      { label: 'Körperlicher Zustand', value: 'Gesund', icon: 'fa-heart-pulse', color: 'text-emerald-400' },
                      { label: 'Körperliche Veränderungen', value: 'Keine', icon: 'fa-dna', color: 'text-teal-400' },
                      { label: 'Aktuelle Emotion', value: 'Ruhig', icon: 'fa-face-smile', color: 'text-amber-400' },
                      { label: 'Emotionale Intensität', value: 'Mittel', icon: 'fa-gauge-high', color: 'text-orange-400' },
                      { label: 'Tonart', value: 'Normal', icon: 'fa-microphone-lines', color: 'text-sky-400' },
                      { label: 'Vermögen', value: `${structuredInventory?.money ?? 100} ${structuredInventory?.currencyLabel || 'Gold'}`.trim(), icon: 'fa-coins', color: 'text-yellow-400' },
                      { label: 'Verwandlungsstufe', value: '0% (Standard)', icon: 'fa-bolt-lightning', color: 'text-purple-400' },
                      { label: 'Point of No Return', value: '80%', icon: 'fa-flag text-red-400', color: 'text-red-400' },
                      { label: 'Kraftnutzung', value: '0%', icon: 'fa-bolt', color: 'text-amber-400' },
                      { label: 'Abklingzeit', value: '0 Min. (bis 0%)', icon: 'fa-stopwatch', color: 'text-sky-400' },
                      { label: 'Flüche & Segen', value: 'Inaktiv', icon: 'fa-wand-magic-sparkles', color: 'text-amber-300' }
                    ].map(stdItem => {
                      const exists = statusElements.some(el => el.label.toLowerCase() === stdItem.label.toLowerCase());
                      return (
                        <button
                          key={stdItem.label}
                          type="button"
                          disabled={exists}
                          onClick={() => {
                            if (!exists) {
                              setStatusElements([
                                ...statusElements,
                                { id: Math.random().toString(36).substr(2, 9), label: stdItem.label, value: stdItem.value }
                              ]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            exists 
                              ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed' 
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-amber-500/40 cursor-pointer'
                          }`}
                        >
                          <i className={`fa-solid ${stdItem.icon} ${stdItem.color}`}></i>
                          <span>+ {stdItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Kampagnen-Parameter als Tags-Auswahl */}
              {Object.keys(world.campaignPowerSettings || {}).length > 0 && (
                <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-tags text-amber-500"></i> DEINE PARAMETER AUS DEN KAMPAGNEN-EINSTELLUNGEN
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Klicke auf einen deiner definierten Parameter, um ihn direkt im HUD als Statuswert zu überwachen (z.B. Ausdauer):
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.keys(world.campaignPowerSettings || {}).map(paramName => {
                      const paramValObj = (world.campaignPowerSettings as any)?.[paramName];
                      let startVal = "100%";
                      if (paramValObj && typeof paramValObj === 'object') {
                        startVal = `${paramValObj.min ?? 50}/${paramValObj.max ?? 100}`;
                      } else if (typeof paramValObj === 'number') {
                        startVal = `${Math.floor(paramValObj * 0.4)}/${paramValObj}`;
                      }
                      
                      const isAlreadyAdded = statusElements.some(el => el.label.toLowerCase() === paramName.toLowerCase());

                      return (
                        <button
                          key={paramName}
                          type="button"
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              setStatusElements([...statusElements, {
                                id: Math.random().toString(36).substr(2, 9),
                                label: paramName,
                                value: startVal
                              }]);
                            }
                          }}
                          disabled={isAlreadyAdded}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isAlreadyAdded
                              ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                              : 'bg-amber-600/10 border-amber-500/20 text-amber-400 hover:bg-amber-600/20 hover:border-amber-500/40'
                          }`}
                        >
                          <span>+ {paramName}</span>
                          <span className="text-[10px] text-slate-500">({startVal})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-2.5">
                {statusElements.map(el => {
                  const labelLower = (el.label || '').toLowerCase();
                  const isLocation = labelLower.includes('standort') || labelLower.includes('ort');
                  const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                  const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                  const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                  let computedRawVal = el.value || '';
                  let isReadonly = false;
                  
                  if (isPnr || isAbkling || isVerwandlung) {
                     const transSettings = getTransformationCardSettings();
                     isReadonly = true;
                     if (isPnr) computedRawVal = `${transSettings.pnrThreshold}%`;
                     if (isAbkling) computedRawVal = `-${transSettings.abklingenStep}%/${transSettings.timeUnit}`;
                     if (isVerwandlung) computedRawVal = `0% (Live im Spiel)`;
                  } else {
                     computedRawVal = el.value || (isLocation ? (player.appearance.currentLocation || '') : '');
                  }
                  
                  const displayValue = isLocation ? formatDisplayLocationName(computedRawVal) : computedRawVal;

                  return (
                    <div key={el.id} className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/50 border border-slate-700 p-2.5 sm:p-3 rounded-xl">
                      <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Label (z.B. Gold)" value={el.label || ''} onChange={e => updateStatusElement(el.id, { label: e.target.value })} />
                      
                      {isReadonly ? (
                        <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-xs text-amber-400 font-mono font-bold min-w-0 flex-1 truncate flex items-center justify-center opacity-80 cursor-not-allowed">
                          {displayValue} (Live)
                        </div>
                      ) : (
                        <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Wert (z.B. 100)" value={displayValue} onChange={e => updateStatusElement(el.id, { value: e.target.value })} />
                      )}
                      
                      <button 
                        type="button" 
                        onClick={() => removeStatusElement(el.id)} 
                        className="shrink-0 w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:text-red-200 hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer"
                        title="Feld löschen"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => addStatusElement()} className="p-3 bg-slate-800 rounded-xl text-xs text-amber-500 font-bold border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">+ Feld hinzufügen</button>
              </div>
            </div>
          )}

          {step === 8 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <EconomyManager
              world={world}
              setWorld={setWorld}
              loreDatabase={loreDatabase}
              npcs={npcs}
              isGenerating={isGeneratingEconomy}
              onGenerateEconomy={handleGenerateEconomy}
              onAddCodexEntry={(newLore) => setLoreDatabase(prev => [...prev, newLore])}
              onDeleteOrteEntries={() => {
                setLoreDatabase(prev => prev.filter(l => l.category !== 'Orte' && !l.id?.startsWith('lore-holding-')));
                setWorld(prev => ({
                  ...prev,
                  loreDatabase: (prev.loreDatabase || []).filter(l => l.category !== 'Orte' && !l.id?.startsWith('lore-holding-'))
                }));
              }}
              combatState={customCombatState}
              onUpdateCombatState={(updates) => setCustomCombatState({ ...customCombatState, ...updates })}
            />
          )}

          {step === 9 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {loreDatabase.some(l => l.category === 'Verbotenes Wissen') && (
                <div className="bg-red-950/25 border border-red-900/40 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                      <i className="fa-solid fa-eye-slash animate-pulse text-red-500"></i> Verbotenes Wissen definiert!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Möchtest du, dass die KI deine Welten-Beschreibung, die NPCs, den Prolog und die erste Szene an dieses verbotene Wissen anpasst, damit alles einheitlich ist und Geheimnisse verborgen bleiben?
                    </p>
                  </div>
                  <button
                    onClick={handleHarmonizeWorld}
                    disabled={isHarmonizing}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isHarmonizing ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i> Harmonisiere...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Welt & NPCs anpassen
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-100">Der Prolog</h3>
                    <button onClick={handleGeneratePrologue} disabled={isGeneratingPrologue || !world.description} className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-amber-600/30 transition-all">
                      <i className={`fa-solid ${isGeneratingPrologue ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i> KI Prolog generieren
                    </button>
                 </div>
                 <p className="text-xs text-slate-400">Nutzt die Welten-Beschreibung und Ära/Zeitpunkt als Vorlage für einen atmosphärischen Einstieg.</p>
                 <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-slate-300 min-h-[200px] outline-none focus:border-amber-500 leading-relaxed italic transition-all" placeholder="Die Geschichte beginnt (Hintergrundwissen/Szene)..." value={prologue || ''} onChange={e => setPrologue(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-100">Spielstart / Erste Szene</h3>
                    <button onClick={handleGenerateFirstMessage} disabled={isGeneratingFirstMsg || !prologue} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-600/30 transition-all">
                      <i className={`fa-solid ${isGeneratingFirstMsg ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i> KI Startszene
                    </button>
                 </div>
                 <p className="text-xs text-slate-400">Diese Antwort richtet sich direkt an den Spieler und leitet die erste Interaktion ein.</p>
                 <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-slate-100 min-h-[160px] outline-none focus:border-amber-500 leading-relaxed transition-all" placeholder="Die erste Antwort der KI, die den Spieler anspricht..." value={firstMessage} onChange={e => setFirstMessage(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-6 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 backdrop-blur-md z-20 flex items-center justify-between gap-2 sm:gap-4 mt-auto">
          <button onClick={handleCancelClick} className="px-3 sm:px-6 py-2.5 sm:py-3 text-slate-400 hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0">Abbrechen</button>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {mode === GameViewMode.EDIT_WORLD && step < 9 && (
              <button onClick={handleFinish} className="px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                <i className="fa-solid fa-floppy-disk text-xs sm:text-sm"></i> Speichern
              </button>
            )}
            {step > 1 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && <button onClick={() => setStep(step - 1)} className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-bold transition-colors hover:bg-slate-700 whitespace-nowrap">Zurück</button>}
            {(step < 9 && mode !== GameViewMode.JOIN_CUSTOM_CHAR) ? (
              <button onClick={() => setStep(step + 1)} className="px-4 sm:px-8 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">Weiter</button>
            ) : (
              <button onClick={handleFinish} className="px-4 sm:px-8 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all active:scale-95 whitespace-nowrap">
                {mode === GameViewMode.EDIT_WORLD ? 'Speichern & Beenden' : 'Starten'}
              </button>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-500"></i> Ungespeicherte Änderungen?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Du hast den Editor geschlossen. Möchtest du deine Änderungen an der Welt, den Charakteren oder dem Codex speichern?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    handleFinish();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <i className="fa-solid fa-floppy-disk"></i> Speichern & Schließen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    onCancel();
                  }}
                  className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 font-bold rounded-xl text-xs transition-all"
                >
                  Verwerfen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
                >
                  Weiterbearbeiten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdventureEditor;
