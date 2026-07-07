
import React, { useState, useEffect } from 'react';
import { Adventure, WorldSetting, Character, NPC, GameViewMode, StatusElement, UserProfile, LoreEntry, TechniqueRuleItem, StructuredInventory } from '../types';
import { GeminiService } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import LoreDatabaseView from './LoreDatabaseView';
import { autoCalculateAppearance } from '../utils/appearance';
import CampaignPowerSettings from './CampaignPowerSettings';
import CharacterPowerRadar from './CharacterPowerRadar';

interface Props {
  onSave: (adventure: Adventure) => void;
  onCancel: () => void;
  initialData?: Adventure;
  mode: GameViewMode;
  userId: string;
  userProfile?: UserProfile;
}

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Nicht-Binär", "Androgyn", "Unbekannt"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Drahtig", "Kurvig", "Stämmig", "Hager"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
const DEFAULT_POWER_SOURCES = ["Mana", "Chakra", "Ausdauer", "Aura", "Zorn", "Glaube", "Blutmagie", "Technologie", "Göttlich", "Keine"];
const DEFAULT_POWER_COSTS = ["MP (Magiepunkte)", "SP (Spezialpunkte)", "HP (Lebenspunkte)", "Ausdauer", "Chakra", "Energie", "Fokus", "Keine"];

const defaultTechniqueRulesList: TechniqueRuleItem[] = [
  {
    id: 'angriff-1',
    type: 'Angriff',
    subtype: 'Einzelschuss',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 1',
    baseValue: 15,
    scalingAndEffect: 'Endschaden = B * (1 + R/100) * L | Konzentrierter Direktschaden auf ein einzelnes Opfer.'
  },
  {
    id: 'angriff-2',
    type: 'Angriff',
    subtype: 'Flächenangriff',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 2',
    baseValue: 25,
    scalingAndEffect: 'Endschaden = (B * (1 + R/100) * L) * 0,7 | Trifft alle anwesenden Gegner, verursacht pro Ziel 30% weniger Schaden als ein Einzelschuss.'
  },
  {
    id: 'angriff-3',
    type: 'Angriff',
    subtype: 'Kettenangriff',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 2',
    baseValue: 20,
    scalingAndEffect: 'Schaden pro Treffer = (B * (1 + R/100) * L) / Anzahl der Treffer | Teilt die Gesamtwucht auf X schnelle Schläge auf. Jeder Schlag hat eine eigene Trefferchance.'
  },
  {
    id: 'verteidigung-1',
    type: 'Verteidigung',
    subtype: 'Absorber/Schild',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 1',
    baseValue: 10,
    scalingAndEffect: 'Schild-Punkte = B * (1 + R/100) * L | Erzeugt eine temporäre Barriere. Eingehender Schaden zieht erst Schild-Punkte ab, bevor die echten HP sinken.'
  },
  {
    id: 'verteidigung-2',
    type: 'Verteidigung',
    subtype: 'Evasion/Ausweichen',
    costResourceName: 'Ausdauer',
    costFormula: 'proz.',
    tier: 'Tier 2',
    baseValue: 15,
    scalingAndEffect: 'Zusätzliche Ausweichchance in % = ((R * L) / 2) + (M * 0,5) | Erhöht die prozentuale Chance, gegnerischem Schaden komplett mit 0 Schadenspunkten zu entgehen.'
  },
  {
    id: 'verteidigung-3',
    type: 'Verteidigung',
    subtype: 'Parade/Konter',
    costResourceName: 'Ausdauer',
    costFormula: 'absolut',
    tier: 'Tier 3',
    baseValue: 30,
    scalingAndEffect: 'Reflektierter Schaden = (Eingesteckter Schaden) * (R/100) * L | Fängt den gegnerischen Angriff ab und wirft einen Prozentsatz des Schadens sofort auf den Angreifer zurück.'
  },
  {
    id: 'transformation-1',
    type: 'Transformation',
    subtype: 'Vollständig',
    costResourceName: 'Mana',
    costFormula: 'proz.',
    tier: 'Tier 4',
    baseValue: 25,
    scalingAndEffect: 'Temporärer Bonus auf alle Radarwerte = +(B * L) in % | Der Charakter wechselt die Gestalt. Multipliziere für die Dauer alle Diagramm-Werte mit diesem Faktor.'
  },
  {
    id: 'transformation-2',
    type: 'Transformation',
    subtype: 'Teilweise',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 2',
    baseValue: 12,
    scalingAndEffect: 'Temporärer Bonus auf einen Radarwert = +(B * L) | Verwandelt nur ein Körperteil (z.B. Krallen). Addiert einen festen Bonus auf genau ein ausgewähltes Attribut.'
  },
  {
    id: 'transformation-3',
    type: 'Transformation',
    subtype: 'Formwechsel/Stance',
    costResourceName: 'Ausdauer',
    costFormula: 'absolut',
    tier: 'Tier 1',
    baseValue: 5,
    scalingAndEffect: 'Attribut A = Attribut A * 1,25 ∧ Attribut B = Attribut B * 0,75 | Tauscht Werte permanent, solange die Haltung aktiv ist (z.B. +25% Angriff für -25% Verteidigung).'
  },
  {
    id: 'support-1',
    type: 'Support',
    subtype: 'Heilung/Regeneration',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 1',
    baseValue: 12,
    scalingAndEffect: 'Geheilte HP = B * (1 + R/100) * L | Füllt die grüne Lebensleiste im HUD sofort auf (kann HP_max nicht überschreiten).'
  },
  {
    id: 'support-2',
    type: 'Support',
    subtype: 'Debuff (Sicht/Bewegung)',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 2',
    baseValue: 8,
    scalingAndEffect: 'Gegner-Malus in % = (R * L) / 2 | Senkt die Treffsicherheit oder Geschwindigkeit des Gegners für eine Anzahl an Runden, die dem Tier-Level entspricht.'
  },
  {
    id: 'support-3',
    type: 'Support',
    subtype: 'Statuseffekt/Buff',
    costResourceName: 'Mana',
    costFormula: 'absolut',
    tier: 'Tier 2',
    baseValue: 10,
    scalingAndEffect: 'Effekt-Dauer in Runden = Tier-Stufe (Tier 1 = 1 Rde, ..., Tier 4 = 4 Rden) | Verleiht Angriffen Bonuseffekte'
  }
];

const TAG_OPTIONS = [
  "Fantasy", "Sci-Fi", "Horror", "Cyberpunk", "Steampunk", "Post-Apokalyptisch", 
  "Mittelalter", "Zukunft", "Gegenwart", "Romantik", "Krimi", "Mystery", "Action", "Abenteuer",
  "Anime", "Manga"
];

const HUD_PRESETS: Record<string, { label: string, value: string }[]> = {
  "Klassisch": [
    { label: "Zeit", value: "12:00" }
  ],
  "RPG": [
    { label: "HP", value: "100/100" },
    { label: "MP", value: "50/50" },
    { label: "Gold", value: "10" },
    { label: "Level", value: "1" }
  ],
  "Survival": [
    { label: "Hunger", value: "Satt" },
    { label: "Durst", value: "Kein Durst" },
    { label: "Temperatur", value: "Normal" }
  ],
  "Sci-Fi": [
    { label: "Sauerstoff", value: "100%" },
    { label: "Energie", value: "Voll" },
    { label: "Schild", value: "100%" }
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
    { id: 'slow', label: 'Herausfordernd (0.5x EP)', desc: 'Geringer EP-Gewinn. Ideal für langsame, hardcore-orientierte Kampagnen mit Fokus auf Grind.', icon: '🐢' },
    { id: 'normal', label: 'Klassisch (1.0x EP)', desc: 'Ausgewogene, klassische RPG-Progression. Angenehmes Tempo für die meisten Spieler.', icon: '⚖️' },
    { id: 'fast', label: 'Dynamisch (1.5x EP)', desc: 'Erhöhter EP-Gewinn. Schnellerer Fortschritt, perfekt für story-fokussiertes Gameplay.', icon: '⚡' },
    { id: 'extreme', label: 'Turbo (2.5x EP)', desc: 'Kräfte und Level explodieren förmlich. Perfekt für epische, rasante Abenteuer.', icon: '🚀' },
  ],
  training: [
    { id: 'slow', label: 'Zähes Training', desc: 'Nur harte, repetitive Übungen und intensive Narration steigern die Werte spürbar.', icon: '🪵' },
    { id: 'normal', label: 'Stetiges RP-Wachstum', desc: 'Ausgewogene Steigerung. Belohnt regelmäßiges, sinnvolles Ausspielen von Training.', icon: '🎯' },
    { id: 'fast', label: 'Schnelle Auffassungsgabe', desc: 'Werte steigen rasch durch kurze Trainingseinheiten oder praktische Übung.', icon: '🔥' },
    { id: 'extreme', label: 'Genie-Modus', desc: 'Eine einzige gute Übung oder Aktion schaltet sofort enorme Kraftsteigerungen frei.', icon: '🌟' },
  ],
  milestone: [
    { id: 'slow', label: 'Erzählerische Meilensteine', desc: 'Steigerung nur nach dem Abschluss von gewaltigen Story-Kapiteln oder Arcs.', icon: '📖' },
    { id: 'normal', label: 'Kapitelweise Progression', desc: 'Erreichte Quests und wichtige Meilensteine gewähren verlässliche Level-Ups.', icon: '🔑' },
    { id: 'fast', label: 'Häufige Checkpoints', desc: 'Jeder nennenswerte Erfolg oder gewonnene Kampf belohnt deine Werte direkt.', icon: '🎉' },
    { id: 'extreme', label: 'Immer im Fluss', desc: 'Konstante, unaufhaltsame Progression nach jedem kleinen Ereignis.', icon: '🌊' },
  ],
  static: [
    { id: 'slow', label: 'Felsenfest (Gesperrt)', desc: 'Die Werte sind absolut fixiert. Keine Veränderung im gesamten Spielverlauf möglich.', icon: '⛰️' },
    { id: 'normal', label: 'Konservative Verteilung', desc: 'Talentpunkte oder Umverteilungen kosten sehr viel Aufwand, Gold oder Tribut.', icon: '💎' },
    { id: 'fast', label: 'Ausgewogene Flexibilität', desc: 'Verteile freie Talentpunkte komfortabel beim Erreichen neuer Ränge.', icon: '🍀' },
    { id: 'extreme', label: 'Grenzenloser Umbau', desc: 'Jederzeit freie, kostenlose Umverteilung aller Werte für maximale Build-Freiheit.', icon: '✨' },
  ],
};

const AdventureEditor: React.FC<Props> = ({ onSave, onCancel, initialData, mode, userId, userProfile }) => {
  const [step, setStep] = useState(mode === GameViewMode.JOIN_CUSTOM_CHAR ? 5 : 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [isGeneratingCampaignSettings, setIsGeneratingCampaignSettings] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isGeneratingNpcs, setIsGeneratingNpcs] = useState(false);
  const [generatingNpcId, setGeneratingNpcId] = useState<string | null>(null);
  const [generatingPortraitId, setGeneratingPortraitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  const [statusElements, setStatusElements] = useState<StatusElement[]>(initialData?.statusElements ?? HUD_PRESETS["Klassisch"].map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) })));
  const [structuredInventory, setStructuredInventory] = useState<StructuredInventory | undefined>(initialData?.structuredInventory);
  const [isExtractingInventory, setIsExtractingInventory] = useState(false);
  
  const [loreDatabase, setLoreDatabase] = useState<LoreEntry[]>(() => {
    let initialLore = [...(initialData?.loreDatabase || [])];
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

    return initialLore;
  });

  const [world, setWorld] = useState<WorldSetting>(() => {
    const w = initialData?.world ?? {
      title: '',
      description: '',
      era: '',
      tone: 'Düster & Ernst',
      isHeroic: true,
      dramaLevel: 'Mittel'
    };
    if (!w.techniqueRulesList) {
      w.techniqueRulesList = JSON.parse(JSON.stringify(defaultTechniqueRulesList));
    }
    return w;
  });

  // Automatisches Vorladen der Profildaten für neue Abenteuer
  const getDefaultPlayerState = (): Character => {
    if (initialData?.player) return initialData.player;

    if (userProfile) {
      return {
        name: userProfile.name,
        role: userProfile.preferredRole,
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
          outfit: ''
        },
        attributes: [
          { name: 'Gesundheit', value: 100, max: 100 },
          { name: 'Mana', value: 50, max: 50 }
        ]
      };
    }

    return {
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
        outfit: ''
      },
      attributes: [
        { name: 'Gesundheit', value: 100, max: 100 },
        { name: 'Mana', value: 50, max: 50 }
      ]
    };
  };

  const [player, setPlayer] = useState<Character>(getDefaultPlayerState());
  const [newRelPlayerTarget, setNewRelPlayerTarget] = useState('');
  const [newRelPlayerIsCustom, setNewRelPlayerIsCustom] = useState(false);
  const [newRelPlayerType, setNewRelPlayerType] = useState('');
  const [newRelPlayerBehavior, setNewRelPlayerBehavior] = useState('');

  const [npcs, setNpcs] = useState<NPC[]>(initialData?.npcs ?? []);

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
      const list = prev.techniqueRulesList || JSON.parse(JSON.stringify(defaultTechniqueRulesList));
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
    setStatusElements(statusElements.map(s => s.id === id ? { ...s, ...updates } : s));
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
          id: Date.now().toString(),
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
        techniqueRulesList = JSON.parse(JSON.stringify(defaultTechniqueRulesList));
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
        setPlayer({ 
          ...player, 
          ...data.player,
          appearance: { ...player.appearance, ...(data.player.appearance || {}) },
          attributes: player.attributes,
          abilities: mappedPower.abilities || player.abilities,
          campaignPowerLevels: mappedPower.campaignPowerLevels || player.campaignPowerLevels
        });
      }
      
      if (data.npcs && Array.isArray(data.npcs)) {
        setNpcs(data.npcs.map((n: any) => {
          const mappedPower = mapCharacterAbilitiesAndPowers(n);
          return { 
            ...n, 
            id: Math.random().toString(36).substr(2, 9), 
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
            secretsStage3: l.secretsStage3
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
      setPlayer(prev => ({ 
        ...prev, 
        ...char, 
        attributes: prev.attributes,
        abilities: mappedPower.abilities || prev.abilities,
        campaignPowerLevels: mappedPower.campaignPowerLevels || prev.campaignPowerLevels
      }));

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

  const handlePlayerSmartFill = async () => {
    if (!playerSmartFill.trim()) return;
    setIsSmartFillingChar(true);
    try {
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
        playerSmartFill, 
        world.campaignPowerSettings,
        keepExistingPlayerDetails ? player : undefined,
        world,
        existingFactions,
        existingCodexCharacters
      );
      setPlayer(prev => {
        let generatedAbilities = prev.abilities;
        if (data.skills || data.powerSource) {
          const newAbil = {
            id: Date.now().toString(),
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
            // Check if there are existing abilities. We append the new one contextually.
            generatedAbilities = [...prev.abilities, newAbil];
          } else {
            generatedAbilities = [newAbil];
          }
        }

        const finalBio = (keepExistingPlayerDetails && prev.bio && prev.bio !== 'Unbekannt' && data.bio && data.bio !== prev.bio)
          ? `${prev.bio}\n\n[Ergänzung]: ${data.bio}`
          : (data.bio || prev.bio);

        const finalPersonality = (keepExistingPlayerDetails && prev.personality && prev.personality !== 'Unbekannt' && data.personality && data.personality !== prev.personality)
          ? `${prev.personality}, ${data.personality}`
          : (data.personality || prev.personality);

        const finalOutfit = (keepExistingPlayerDetails && prev.appearance?.outfit && prev.appearance.outfit !== 'Unbekannt' && data.appearance?.outfit && data.appearance.outfit !== prev.appearance.outfit)
          ? `${prev.appearance.outfit} (Zusätzlich: ${data.appearance.outfit})`
          : (data.appearance?.outfit || prev.appearance.outfit);

        let mergedRelationships = prev.relationships || [];
        if (data.relationships && Array.isArray(data.relationships)) {
          const incoming = data.relationships.map((r: any, index: number) => ({
            id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            targetCharacter: r.targetCharacter || '',
            type: r.type || '',
            behavior: r.behavior || '',
            _isCustom: false
          }));
          if (keepExistingPlayerDetails) {
            const existingTargets = new Set(mergedRelationships.map(r => (r.targetCharacter || '').toLowerCase().trim()));
            const newFiltered = incoming.filter(r => r.targetCharacter && !existingTargets.has(r.targetCharacter.toLowerCase().trim()));
            mergedRelationships = [...mergedRelationships, ...newFiltered];
          } else {
            mergedRelationships = incoming;
          }
        }

        return {
          ...prev,
          name: data.name || prev.name,
          role: data.role || prev.role,
          personality: finalPersonality,
          bio: finalBio,
          currentSituation: data.currentSituation || prev.currentSituation,
          goal: data.goal || prev.goal,
          relationship: data.relationship || prev.relationship,
          conduct: data.conduct || prev.conduct,
          relationships: mergedRelationships,
          skills: data.skills || prev.skills,
          powerSource: data.powerSource || prev.powerSource,
          powerCost: data.powerCost || prev.powerCost,
          techniques: data.techniques || prev.techniques,
          abilities: generatedAbilities,
          campaignPowerLevels: data.campaignPowerLevels || prev.campaignPowerLevels,
          secretsStage1: data.secretsStage1 !== undefined ? data.secretsStage1 : prev.secretsStage1,
          secretsStage2: data.secretsStage2 !== undefined ? data.secretsStage2 : prev.secretsStage2,
          secretsStage3: data.secretsStage3 !== undefined ? data.secretsStage3 : prev.secretsStage3,
          appearance: {
            ...prev.appearance,
            gender: data.appearance?.gender || prev.appearance.gender,
            age: data.appearance?.age || prev.appearance.age,
            build: data.appearance?.build || prev.appearance.build,
            hairColor: data.appearance?.hairColor || prev.appearance.hairColor,
            eyeColor: data.appearance?.eyeColor || prev.appearance.eyeColor,
            cupSize: data.appearance?.cupSize || prev.appearance.cupSize,
            outfit: finalOutfit,
            height: data.appearance?.height || prev.appearance.height,
            measurements: data.appearance?.measurements || prev.appearance.measurements,
            origin: data.appearance?.origin || prev.appearance.origin,
            family: data.appearance?.family || prev.appearance.family,
            faction: data.appearance?.faction || prev.appearance.faction,
            race: data.appearance?.race || prev.appearance.race,
            raceFeatures: data.appearance?.raceFeatures || prev.appearance.raceFeatures,
          }
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

  const handlePlayerAppearanceChange = (field: keyof typeof player.appearance, val: string) => {
    let newAppearance = { ...player.appearance, [field]: val };
    newAppearance = autoCalculateAppearance(newAppearance, field);
    setPlayer({ ...player, appearance: newAppearance });
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
      }));

    const finalWorld: WorldSetting = {
      ...world,
      era: selectedTags.join(', ')
    };

    const finalAdventure: Adventure = {
      id: mode === GameViewMode.JOIN_CUSTOM_CHAR ? Date.now().toString() : (initialData?.id || Date.now().toString()),
      authorId: mode === GameViewMode.JOIN_CUSTOM_CHAR ? userId : (initialData?.authorId || userId),
      isPublic,
      world: finalWorld,
      player,
      npcs: finalNpcs,
      loreDatabase,
      inventory: initialData?.inventory ?? ['Starterpaket'],
      structuredInventory: structuredInventory,
      prologue: prologue || 'Die Reise beginnt...',
      firstMessage: firstMessage,
      chatHistory: newChatHistory,
      backgroundImage: bgImage,
      statusElements,
      initialPlayer: JSON.parse(JSON.stringify(player)),
      initialStatusElements: JSON.parse(JSON.stringify(statusElements)),
      initialStructuredInventory: structuredInventory ? JSON.parse(JSON.stringify(structuredInventory)) : undefined,
      initialLoreDatabase: loreDatabase ? JSON.parse(JSON.stringify(loreDatabase)) : [],
      initialNpcs: finalNpcs ? JSON.parse(JSON.stringify(finalNpcs)) : [],
      initialInventory: initialData?.inventory ?? ['Starterpaket']
    };
    onSave(finalAdventure);
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 min-h-screen relative sm:bg-transparent sm:py-10 sm:items-center overflow-y-auto w-full">
      <div className="w-full max-w-2xl bg-slate-900/50 sm:rounded-2xl border-b sm:border border-slate-700 backdrop-blur-md flex-1 flex flex-col relative overflow-hidden">
        
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-fantasy text-amber-400">
              {mode === GameViewMode.EDIT_WORLD ? 'Welt anpassen' : mode === GameViewMode.JOIN_CUSTOM_CHAR ? 'Dein Held' : 'Weltenschmiede'}
            </h2>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
               {mode === GameViewMode.JOIN_CUSTOM_CHAR ? 'Anpassung' : `Schritt ${step} von 7`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="p-2 text-slate-500 hover:text-white" title="Abbrechen">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 flex-1 space-y-8 z-10 relative">
          {error && (
            <div className="p-3 bg-red-950/85 border border-red-800/40 rounded-xl text-red-200 text-xs flex justify-between items-center shadow-lg backdrop-blur-md animate-in fade-in duration-200">
              <span className="flex-1 pr-2">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold px-2 py-1">✕</button>
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
                      Fülle alle Werte, Spezialressourcen und Technik-Stufen für diesen (Schritt 2) und den nächsten Schritt (Schritt 3) automatisch aus. Das System analysiert deine Welten-Beschreibung und Genres, um ein perfekt ausbalanciertes Regelwerk zu erstellen.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillStep2And3}
                  disabled={isGeneratingCampaignSettings || !world.description}
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
                  <p className="text-[10px] text-amber-500/80 italic text-center">
                    *Bitte trage zuerst im 1. Schritt eine Welten-Beschreibung ein, um das Smart-Fill zu nutzen.
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

          {step === 3 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
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
                    <button
                      type="button"
                      onClick={() => {
                        setWorld(prev => ({
                          ...prev,
                          techniqueRulesList: JSON.parse(JSON.stringify(defaultTechniqueRulesList))
                        }));
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-[10px] font-bold text-slate-300 transition-all flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <i className="fa-solid fa-rotate"></i> Standard laden
                    </button>
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
                        {(world.techniqueRulesList || defaultTechniqueRulesList).map((rule, index) => {
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

          {step === 4 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <LoreDatabaseView 
                  lore={loreDatabase}
                  onUpdateLore={setLoreDatabase}
                  onClose={() => {}} // Not needed here as it's a step
                  worldTitle={world.title}
                  isNsfw={world.isNsfw}
                  worldPowerSettings={world.campaignPowerSettings}
                  playerName={player.name}
                  world={world}
                />
            </div>
          )}

          {step === 5 && (
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

              {/* Player Smart Fill */}
              <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                <label className="text-xs text-indigo-400 font-bold uppercase flex justify-between items-center">
                  <span>Smart Fill Charakter</span>
                  <button 
                    onClick={handlePlayerSmartFill}
                    disabled={isSmartFillingChar || !playerSmartFill.trim()}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-[10px] transition-all flex items-center gap-2"
                  >
                    <i className={`fa-solid ${isSmartFillingChar ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                    Automatisch Ausfüllen
                  </button>
                </label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
                  placeholder="Beschreibe deinen Charakter ausführlich (z.B. 'Ein 25-jähriger Krieger aus dem Nordland, stark gebaut, trägt eine Drachenrüstung und gehört der Feuergilde an...'). Die KI füllt dann die Felder darunter passend aus." 
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

              {player.image && (
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl">
                    <img src={player.image} alt="Portrait" className="w-full h-full object-cover" />
                    <button onClick={() => setPlayer({...player, image: undefined})} className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AutoExpandingTextarea className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-white outline-none focus:ring-1 focus:ring-amber-500 w-full text-sm" placeholder="Name des Helden" value={player.name || ''} onChange={e => setPlayer({...player, name: e.target.value})} />
                <AutoExpandingTextarea className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-white outline-none focus:ring-1 focus:ring-amber-500 w-full text-sm" placeholder="Rolle (z.B. Kriegerin)" value={player.role || ''} onChange={e => setPlayer({...player, role: e.target.value})} />
              </div>
              
              <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Geschlecht</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={player.appearance.gender ? player.appearance.gender.charAt(0).toUpperCase() + player.appearance.gender.slice(1).toLowerCase() : 'Weiblich'} onChange={e => handlePlayerAppearanceChange('gender', e.target.value)}>
                      {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Alter</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" value={player.appearance.age || ''} onChange={e => handlePlayerAppearanceChange('age', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Statur</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={player.appearance.build || 'Schlank'} onChange={e => handlePlayerAppearanceChange('build', e.target.value)}>
                      {BUILD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Haarfarbe</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Blond" value={player.appearance.hairColor || ''} onChange={e => handlePlayerAppearanceChange('hairColor', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Augenfarbe</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Blau" value={player.appearance.eyeColor || ''} onChange={e => handlePlayerAppearanceChange('eyeColor', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Körbchengröße</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none" value={player.appearance.cupSize || "-"} onChange={e => handlePlayerAppearanceChange('cupSize', e.target.value)}>
                      {CUP_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                                    <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Größe & Körpermaße</label>
                    <div className="flex gap-2">
                       <AutoExpandingTextarea className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="Größe (z.B. 170cm)" value={player.appearance.height || ''} onChange={e => handlePlayerAppearanceChange('height', e.target.value)} />
                       <AutoExpandingTextarea className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="Maße (z.B. 90-60-90)" value={player.appearance.measurements || ''} onChange={e => handlePlayerAppearanceChange('measurements', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Rasse</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Mensch, Elf" value={player.appearance.race || ''} onChange={e => handlePlayerAppearanceChange('race', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Herkunft</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Eisiges Nordland" value={player.appearance.origin || ''} onChange={e => handlePlayerAppearanceChange('origin', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Familie</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" placeholder="z.B. Haus Arryn" value={player.appearance.family || ''} onChange={e => handlePlayerAppearanceChange('family', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold flex justify-between">
                       <span>Fraktion</span>
                       {(() => {
                         const createdFactions = Array.from(new Set(loreDatabase.filter(l => l.category === 'Fraktionen').map(l => l.title).filter(Boolean)));
                         return createdFactions.length > 0 ? <span className="text-[9px] text-amber-500 font-normal">Klicke zum Auswählen</span> : null;
                       })()}
                    </label>
                    <AutoExpandingTextarea 
                      aria-label="Spieler-Fraktion"
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 w-full" 
                      placeholder="z.B. Abenteurergilde" 
                      value={player.appearance.faction || ''} 
                      onChange={e => handlePlayerAppearanceChange('faction', e.target.value)} 
                    />
                    {(() => {
                      const createdFactions = Array.from(new Set(loreDatabase.filter(l => l.category === 'Fraktionen').map(l => l.title).filter(Boolean)));
                      if (createdFactions.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {createdFactions.map(factionName => (
                            <button
                              key={factionName}
                              type="button"
                              onClick={() => handlePlayerAppearanceChange('faction', factionName)}
                              className={`text-[9.5px] px-2 py-1 rounded transition-all border ${
                                player.appearance.faction?.trim().toLowerCase() === factionName.trim().toLowerCase()
                                ? 'bg-amber-600/30 text-amber-400 border-amber-500/50 font-semibold shadow-inner'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                              }`}
                            >
                              {factionName}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Kleidung / Outfit</label>
                    <AutoExpandingTextarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px]" placeholder="Wird von KI generiert oder hier eingeben..." value={player.appearance.outfit || ''} onChange={e => handlePlayerAppearanceChange('outfit', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Rassemerkmale (Nicht-menschliche physische Eigenschaften)</label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500" 
                      placeholder="z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe/Muster/Verteilung am Körper), ein Katzenkopf, Flügel, Hörner etc. oder 'keine'" 
                      value={player.appearance.raceFeatures || ''} 
                      onChange={e => handlePlayerAppearanceChange('raceFeatures', e.target.value)} 
                    />
                  </div>

                  {/* Ausrüstung & Inventar (Detailzuordnung) */}
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4 col-span-2 sm:col-span-3">
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
                                const inv = structuredInventory || {};
                                setStructuredInventory({
                                  ...inv,
                                  money: parseInt(e.target.value) || 0
                                });
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
                                const inv = structuredInventory || {};
                                setStructuredInventory({
                                  ...inv,
                                  currencyLabel: e.target.value
                                });
                              }}
                            />
                          </div>
                        </div>
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="grid grid-cols-1 gap-4">
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[64px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="Persönlichkeit (z.B. mutig, stur, humorvoll)..." value={player.personality || ''} onChange={e => setPlayer({...player, personality: e.target.value})} />
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[96px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="Vergangenheit / Biografie..." value={player.bio || ''} onChange={e => setPlayer({...player, bio: e.target.value})} />
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="Aktuelle Situation..." value={player.currentSituation || ''} onChange={e => setPlayer({...player, currentSituation: e.target.value})} />
                <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="Hauptziel / Bestrebungen..." value={player.goal || ''} onChange={e => setPlayer({...player, goal: e.target.value})} />

                {/* Geheimnisse & Verborgenes Wissen (3-Stufen-Logik) */}
                <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <i className="fa-solid fa-user-shield text-amber-500"></i>
                    <div>
                      <span className="text-xs text-slate-350 font-bold uppercase tracking-wider block">Geheimnisse & Verborgenes Wissen (3-Stufen-Logik)</span>
                      <span className="text-[10px] text-slate-500 block">Diese Geheimnisse sind für NPCs im Chat eine absolute Blackbox, bis du sie enthüllst.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {/* Stufe 1 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Stufe 1: Öffentliches Wissen
                      </label>
                      <p className="text-[9px] text-slate-500 leading-tight mb-1">Für alle NPCs und Charaktere von Anfang an bekannt.</p>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                        placeholder="z.B. Er ist ein registrierter Abenteurer, besitzt ein blaues Schwert..."
                        value={player.secretsStage1 || ''}
                        onChange={e => setPlayer({ ...player, secretsStage1: e.target.value })}
                      />
                    </div>

                    {/* Stufe 2 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Stufe 2: Indizien & Verdacht
                      </label>
                      <p className="text-[9px] text-slate-500 leading-tight mb-1">NPCs wissen es nicht direkt, dürfen aber vorsichtig nachforschen.</p>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                        placeholder="z.B. Er schaut oft nervös auf seine Taschenuhr, wenn das Wort 'Zeit' fällt..."
                        value={player.secretsStage2 || ''}
                        onChange={e => setPlayer({ ...player, secretsStage2: e.target.value })}
                      />
                    </div>

                    {/* Stufe 3 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-red-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> Stufe 3: Absolutes Geheimnis
                      </label>
                      <p className="text-[9px] text-slate-500 leading-tight mb-1">Absolute Blackbox. Für NPCs streng tabu, bis es bewiesen wird.</p>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                        placeholder="z.B. Er ist in Wahrheit der gesuchte Schattenmagier, der vor 5 Jahren floh..."
                        value={player.secretsStage3 || ''}
                        onChange={e => setPlayer({ ...player, secretsStage3: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                    <div>
                      <span className="text-xs text-slate-350 font-bold uppercase tracking-wider">Beziehungen & Verhalten zu anderen</span>
                      <span className="text-[10px] text-slate-500 block">Wer ist dieser Charakter für andere und wie verhält er sich zu ihnen?</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPlayer({
                        ...player,
                        relationships: [
                          ...(player.relationships || []),
                          { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), targetCharacter: '', type: '', behavior: '', _isCustom: false }
                        ]
                      })}
                      className="px-2 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-500 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-amber-600/30 transition-all font-sans"
                    >
                      <i className="fa-solid fa-plus text-[9px]"></i> Eintrag hinzufügen
                    </button>
                  </div>

                  {(!player.relationships || player.relationships.length === 0) ? (
                    <div className="text-[11px] text-slate-500 italic px-1 py-1">
                      Bisher keine Beziehungen angelegt. Klicke oben auf "+ Eintrag hinzufügen", um eine zu erstellen.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {player.relationships.map((rel, idx) => (
                        <div key={rel.id} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col gap-3 relative animate-in fade-in duration-150">
                          <button 
                            type="button"
                            onClick={() => {
                              setPlayer({
                                ...player,
                                relationships: (player.relationships || []).filter(r => r.id !== rel.id)
                              });
                            }}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded transition-colors text-xs"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                          
                          <div className="text-xs font-bold text-slate-400 mb-1">Beziehung #{idx + 1}</div>
                          
                          <div className="flex flex-col gap-4">
                            {/* Charakter / Ziel */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Charakter / Ziel</label>
                              {(() => {
                                const codexCharacters = loreDatabase.filter(item => item.category === 'Charaktere' && item.title?.trim().toLowerCase() !== player.name?.trim().toLowerCase());
                                const isCustom = rel._isCustom || (rel.targetCharacter && !codexCharacters.some(c => c.title === rel.targetCharacter));
                                
                                return !isCustom ? (
                                  <div className="flex gap-1.5 w-full">
                                    <select
                                      value={rel.targetCharacter || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const newList = [...(player.relationships || [])];
                                        if (val === '__custom__') {
                                          newList[idx] = { ...rel, targetCharacter: '', _isCustom: true };
                                        } else {
                                          newList[idx] = { ...rel, targetCharacter: val, _isCustom: false };
                                        }
                                        setPlayer({ ...player, relationships: newList });
                                      }}
                                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-[38px] w-full"
                                    >
                                      <option value="">-- Wählen --</option>
                                      {codexCharacters.length > 0 && (
                                        <optgroup label="Codex Charaktere">
                                          {codexCharacters.map(c => (
                                            <option key={c.id} value={c.title}>{c.title}</option>
                                          ))}
                                        </optgroup>
                                      )}
                                      <option value="__custom__">✍️ Freitext...</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = [...(player.relationships || [])];
                                        newList[idx] = { ...rel, targetCharacter: '', _isCustom: true };
                                        setPlayer({ ...player, relationships: newList });
                                      }}
                                      title="Freitext eingeben"
                                      className="px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[38px]"
                                    >
                                      <i className="fa-solid fa-pen text-[9px]"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1.5 w-full">
                                    <input
                                      type="text"
                                      placeholder="Name / Gruppe..."
                                      value={rel.targetCharacter || ''}
                                      onChange={e => {
                                        const newList = [...(player.relationships || [])];
                                        newList[idx] = { ...rel, targetCharacter: e.target.value };
                                        setPlayer({ ...player, relationships: newList });
                                      }}
                                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 h-[38px] w-full"
                                    />
                                    {codexCharacters.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newList = [...(player.relationships || [])];
                                          newList[idx] = { ...rel, targetCharacter: '', _isCustom: false };
                                          setPlayer({ ...player, relationships: newList });
                                        }}
                                        title="Zurück zur Auswahl"
                                        className="px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[38px]"
                                      >
                                        <i className="fa-solid fa-list text-[10px]"></i>
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Details Row under the target character select */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Beziehung zu ihm/ihr */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Beziehung zu ihm/ihr</label>
                                <AutoExpandingTextarea
                                  rows={3}
                                  value={rel.type || ''}
                                  onChange={e => {
                                    const newList = [...(player.relationships || [])];
                                    newList[idx] = { ...rel, type: e.target.value };
                                    setPlayer({ ...player, relationships: newList });
                                  }}
                                  placeholder="z.B. Rivalin, Gefährte"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 min-h-[96px]"
                                />
                              </div>
                              
                              {/* Verhalten (Conduct) */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Verhalten (Conduct)</label>
                                <AutoExpandingTextarea
                                  rows={3}
                                  value={rel.behavior || ''}
                                  onChange={e => {
                                    const newList = [...(player.relationships || [])];
                                    newList[idx] = { ...rel, behavior: e.target.value };
                                    setPlayer({ ...player, relationships: newList });
                                  }}
                                  placeholder="z.B. Distanziert aber treu"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 min-h-[96px]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h4 className="text-sm font-bold text-slate-300">Gefährte / Fähigkeiten & Kräfte</h4>
                    <button 
                      onClick={() => setPlayer({...player, abilities: [...(player.abilities || []), { id: Date.now().toString(), source: '', cost: '', description: '', techniques: '' }]})}
                      className="px-2 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-500 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-amber-600/30 transition-all"
                    >
                      <i className="fa-solid fa-plus"></i> Kraft hinzufügen
                    </button>
                  </div>
                  
                  {player.abilities && player.abilities.map((ability, idx) => (
                    <div key={ability.id} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col gap-3 relative">
                      <button 
                        onClick={() => setPlayer({...player, abilities: player.abilities?.filter(a => a.id !== ability.id)})}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded transition-colors text-xs"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <div className="text-xs font-bold text-slate-400 mb-1">Kraft / Fähigkeit #{idx + 1}</div>
                      {(() => {
                        const customSourceNames = world.customResourceMappings?.map(m => m.name) || [];
                        const sourceVal = ability.source || '';
                        const isSourceInOptions = customSourceNames.includes(sourceVal);
                        const selectedSourceOpt = sourceVal === '' ? '' : (isSourceInOptions ? sourceVal : '__custom__');

                        const customCostOptions = world.costResources?.map(r => r.name) || [];
                        const defaultCostFallbacks = customCostOptions.length > 0 ? customCostOptions : ["MP", "Ausdauer"];
                        const costVal = ability.cost || '';
                        const isCostInOptions = defaultCostFallbacks.includes(costVal);
                        const selectedCostOpt = costVal === '' ? '' : (isCostInOptions ? costVal : '__custom__');

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Kraftquelle */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Kraftquelle</label>
                              <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                value={sourceVal}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPlayer({
                                    ...player,
                                    abilities: player.abilities?.map(a => a.id === ability.id ? {...a, source: val} : a)
                                  });
                                }}
                              >
                                <option value="">-- Wählen (Keine) --</option>
                                {customSourceNames.length > 0 && (
                                  <optgroup label="Spezial-Ressourcen / Kraftquellen">
                                    {customSourceNames.map((name, mIdx) => <option key={`custom-${name}-${mIdx}`} value={name}>{name}</option>)}
                                  </optgroup>
                                )}
                              </select>
                            </div>

                            {/* Kosten / Verbrauch */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Kosten / Verbrauch</label>
                              <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                value={costVal}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPlayer({
                                    ...player,
                                    abilities: player.abilities?.map(a => a.id === ability.id ? {...a, cost: val} : a)
                                  });
                                }}
                              >
                                <option value="">-- Wählen (Keine) --</option>
                                <optgroup label="Kosten- & Verbrauchs-Ressourcen">
                                  {defaultCostFallbacks.map((name, idx) => <option key={`cost-${name}-${idx}`} value={name}>{name}</option>)}
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Fähigkeit (Beschreibung der Kraft)</label>
                        <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[60px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="z.B. Mystische Zoan Frucht Modell Eis Fuchs..." value={ability.description || ''} onChange={e => setPlayer({...player, abilities: player.abilities?.map(a => a.id === ability.id ? {...a, description: e.target.value} : a)})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Techniken</label>
                          <button 
                            type="button"
                            onClick={() => {
                              const defaultRules = world.techniqueRules || {
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
                              const progLogic = world.techniqueProgressionLogic || 'ep';
                              const newTech = {
                                id: Date.now().toString(),
                                name: '',
                                type: 'Angriff' as const,
                                subtype: rule.defaultSubtype,
                                description: rule.levelScaling,
                                level: 1,
                                maxLevel: 10,
                                xp: 0,
                                xpNeeded: progLogic === 'ep' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 100) : undefined,
                                xpGainPerUse: progLogic === 'ep' ? 10 : undefined,
                                trainingRequired: progLogic === 'training' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 3) : undefined,
                                trainingProgress: progLogic === 'training' ? 0 : undefined,
                                milestoneRequirement: progLogic === 'milestone' ? String(rule.progressionCostValue || 'Nach Bosskampf') : undefined,
                                staticCost: progLogic === 'static' ? String(rule.progressionCostValue || '5 FP') : undefined,
                                cost: `${rule.costValue} ${rule.costResourceName}`
                              };
                              const newTechList = [newTech, ...(ability.techniqueList || [])];
                              setPlayer({
                                ...player, 
                                abilities: player.abilities?.map(a => a.id === ability.id ? {
                                  ...a, 
                                  techniqueList: newTechList,
                                  techniques: newTechList.map(t => t.name).filter(Boolean).join(', ')
                                } : a)
                              });
                            }}
                            className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                          >
                            + Technik hinzufügen
                          </button>
                        </div>
                        {(!ability.techniqueList || ability.techniqueList.length === 0) ? (
                          <AutoExpandingTextarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[60px] text-sm outline-none focus:ring-1 focus:ring-amber-500" placeholder="z.B. Eis Atem, Angriff mit Eiszapfen..." value={ability.techniques || ''} onChange={e => setPlayer({...player, abilities: player.abilities?.map(a => a.id === ability.id ? {...a, techniques: e.target.value} : a)})} />
                        ) : (
                          <div className="flex flex-col gap-2.5 mt-1">
                            {ability.techniqueList.map((tech, tIdx) => (
                              <div key={tech.id || `tech-${tIdx}`} className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Technik #{tIdx + 1}</span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newTechList = ability.techniqueList?.filter(t => t.id !== tech.id) || [];
                                      setPlayer({
                                        ...player,
                                        abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map(t => t.name).join(', ') } : a)
                                      });
                                    }}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20"
                                  >
                                    <i className="fa-solid fa-trash-can text-[9px]"></i> Löschen
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                                  {/* Name der Technik */}
                                  <div className="md:col-span-5 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Name der Technik</label>
                                    <AutoExpandingTextarea 
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-600" 
                                      placeholder="z.B. Eis Atem"
                                      value={tech.name || ''}
                                      onChange={e => {
                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, name: e.target.value } : t) || [];
                                        setPlayer({
                                          ...player,
                                          abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map(t => t.name).join(', ') } : a)
                                        });
                                      }}
                                    />
                                  </div>

                                  {/* Typ */}
                                  <div className="md:col-span-3 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Typ</label>
                                    <select
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200"
                                      value={tech.type || 'Angriff'}
                                      onChange={e => {
                                        const newType = e.target.value as any;
                                        const defaultRules = world.techniqueRules || {
                                          Angriff: { type: 'Angriff', defaultSubtype: 'Einzelschuss', mainParameter: 'Stärke', progressionCostValue: 100, costResourceName: 'Mana', costValue: 10, levelScaling: 'Linear (+10% Schaden pro Level)' },
                                          Verteidigung: { type: 'Verteidigung', defaultSubtype: 'Schild/Barriere', mainParameter: 'Ausdauer', progressionCostValue: 100, costResourceName: 'Mana', costValue: 8, levelScaling: 'Linear (+15% Absorption pro Level)' },
                                          Transformation: { type: 'Transformation', defaultSubtype: 'Modus/Form', mainParameter: 'Magie', progressionCostValue: 100, costResourceName: 'Mana', costValue: 15, levelScaling: 'Flach (Verlängert Dauer um +5s pro Level)' },
                                          Support: { type: 'Support', defaultSubtype: 'Direkte Heilung', mainParameter: 'Intelligenz', progressionCostValue: 100, costResourceName: 'Mana', costValue: 12, levelScaling: 'Linear (+12% Effekt pro Level)' }
                                        };
                                        const rule = defaultRules[newType] || {
                                          type: newType,
                                          defaultSubtype: newType === 'Angriff' ? 'Einzelschuss' : newType === 'Verteidigung' ? 'Schild/Barriere' : newType === 'Transformation' ? 'Modus/Form' : 'Direkte Heilung',
                                          mainParameter: newType === 'Angriff' ? 'Stärke' : newType === 'Verteidigung' ? 'Ausdauer' : newType === 'Transformation' ? 'Magie' : 'Intelligenz',
                                          progressionCostValue: world.techniqueProgressionLogic === 'ep' ? 100 : world.techniqueProgressionLogic === 'training' ? 3 : 'Nach Bosskampf',
                                          costResourceName: 'Mana',
                                          costValue: newType === 'Angriff' ? 10 : newType === 'Verteidigung' ? 8 : newType === 'Transformation' ? 15 : 12,
                                          levelScaling: newType === 'Angriff' ? 'Linear (+10% Schaden pro Level)' : newType === 'Verteidigung' ? 'Linear (+15% Absorption pro Level)' : newType === 'Transformation' ? 'Flach (Verlängert Dauer um +5s pro Level)' : 'Linear (+12% Effekt pro Level)'
                                        };
                                        const progLogic = world.techniqueProgressionLogic || 'ep';
                                        
                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                          ...t, 
                                          type: newType, 
                                          subtype: rule.defaultSubtype,
                                          description: rule.levelScaling,
                                          xpNeeded: progLogic === 'ep' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 100) : undefined,
                                          trainingRequired: progLogic === 'training' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 3) : undefined,
                                          milestoneRequirement: progLogic === 'milestone' ? String(rule.progressionCostValue || 'Nach Bosskampf') : undefined,
                                          staticCost: progLogic === 'static' ? String(rule.progressionCostValue || '5 FP') : undefined,
                                          cost: `${rule.costValue} ${rule.costResourceName}`
                                        } : t) || [];
                                        
                                        setPlayer({
                                          ...player,
                                          abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                        });
                                      }}
                                    >
                                      <option value="Angriff">💥 Angriff</option>
                                      <option value="Transformation">🧬 Transformation</option>
                                      <option value="Verteidigung">🛡️ Verteidigung</option>
                                      <option value="Support">🧪 Support</option>
                                    </select>
                                  </div>

                                  {/* Untertyp */}
                                  <div className="md:col-span-4 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Untertyp</label>
                                    {(() => {
                                      const currentType = tech.type || 'Angriff';
                                      const presets = currentType === 'Angriff' 
                                        ? ['Einzelschuss', 'Flächenangriff', 'Nahkampf', 'Fernkampf', 'Kettenangriff', 'Sonstiges']
                                        : currentType === 'Transformation'
                                        ? ['Modus/Form', 'Teilverwandlung', 'Vollverwandlung', 'Sonstiges']
                                        : currentType === 'Verteidigung'
                                        ? ['Schild/Barriere', 'Parade/Konter', 'Ausweichen', 'Sonstiges']
                                        : ['Direkte Heilung', 'Regeneration', 'Stärkung (Buff)', 'Schwächung (Debuff)', 'Zustandsheilung', 'Sonstiges'];
                                      
                                      const isCustom = tech.subtype && !presets.includes(tech.subtype);
                                      const selectVal = isCustom ? 'Sonstiges' : (tech.subtype || presets[0]);

                                      return (
                                        <div className="flex flex-col gap-1">
                                          <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200"
                                            value={selectVal}
                                            onChange={e => {
                                              const val = e.target.value;
                                              const newSubtype = val === 'Sonstiges' ? '' : val;
                                              const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, subtype: newSubtype } : t) || [];
                                              setPlayer({
                                                ...player,
                                                abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                              });
                                            }}
                                          >
                                            {presets.map(p => (
                                              <option key={p} value={p}>{p}</option>
                                            ))}
                                          </select>
                                          {(selectVal === 'Sonstiges' || isCustom) && (
                                            <input
                                              type="text"
                                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] outline-none focus:border-amber-500 placeholder-slate-600 mt-1"
                                              placeholder="Eigener Untertyp..."
                                              value={tech.subtype || ''}
                                              onChange={e => {
                                                const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, subtype: e.target.value } : t) || [];
                                                setPlayer({
                                                  ...player,
                                                  abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                                });
                                              }}
                                            />
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Tier */}
                                  <div className="md:col-span-3 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Tier</label>
                                    <select
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200 font-mono"
                                      value={tech.tier || 'Tier 1'}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, tier: val } : t) || [];
                                        setPlayer({
                                          ...player,
                                          abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                        });
                                      }}
                                    >
                                      <option value="Tier 1">Tier 1</option>
                                      <option value="Tier 2">Tier 2</option>
                                      <option value="Tier 3">Tier 3</option>
                                      <option value="Tier 4">Tier 4</option>
                                    </select>
                                  </div>

                                  {/* Basis-Wert */}
                                  <div className="md:col-span-2 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Basis-Wert</label>
                                    <input
                                      type="number"
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono text-center"
                                      placeholder="z.B. 15"
                                      value={tech.baseValue !== undefined ? tech.baseValue : 0}
                                      onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, baseValue: val } : t) || [];
                                        setPlayer({
                                          ...player,
                                          abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                        });
                                      }}
                                    />
                                  </div>

                                  {/* Kosten */}
                                  {(() => {
                                    const createdCostResources = world.costResources?.map(r => r.name) || [];
                                    const costResourceOptions = createdCostResources.length > 0 
                                      ? createdCostResources 
                                      : ['MP', 'SP'];

                                    return (
                                      <div className="md:col-span-7 flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Kosten (Ressource, Typ & Wert)</label>
                                        <div className="flex gap-1.5 w-full">
                                          {/* Resource Dropdown */}
                                          <select
                                            className="w-[40%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] font-mono text-slate-200"
                                            value={tech.costResourceName || (costResourceOptions[0] || 'MP')}
                                            onChange={e => {
                                              const resName = e.target.value;
                                              const costVal = tech.costValue !== undefined ? tech.costValue : 10;
                                              const formula = tech.costFormula || 'absolut';
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                                ...t, 
                                                costResourceName: resName,
                                                cost: combinedCost
                                              } : t) || [];
                                              setPlayer({
                                                ...player,
                                                abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                              });
                                            }}
                                          >
                                            {costResourceOptions.map(res => (
                                              <option key={res} value={res}>{res}</option>
                                            ))}
                                          </select>

                                          {/* Formula Selection */}
                                          <select
                                            className="w-[30%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] font-mono text-slate-200"
                                            value={tech.costFormula || 'absolut'}
                                            onChange={e => {
                                              const formula = e.target.value as 'absolut' | 'proz.';
                                              const resName = tech.costResourceName || (costResourceOptions[0] || 'MP');
                                              const costVal = tech.costValue !== undefined ? tech.costValue : 10;
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                                ...t, 
                                                costFormula: formula,
                                                cost: combinedCost
                                              } : t) || [];
                                              setPlayer({
                                                ...player,
                                                abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                              });
                                            }}
                                          >
                                            <option value="absolut">Abs.</option>
                                            <option value="proz.">Proz.</option>
                                          </select>

                                          {/* Cost Value Input */}
                                          <input
                                            type="number"
                                            min="0"
                                            className="w-[30%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] text-center font-mono"
                                            placeholder="10"
                                            value={tech.costValue !== undefined ? tech.costValue : 10}
                                            onChange={e => {
                                              const costVal = Math.max(0, parseInt(e.target.value) || 0);
                                              const resName = tech.costResourceName || (costResourceOptions[0] || 'MP');
                                              const formula = tech.costFormula || 'absolut';
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { 
                                                ...t, 
                                                costValue: costVal,
                                                cost: combinedCost
                                              } : t) || [];
                                              setPlayer({
                                                ...player,
                                                abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Beschreibung / Effekt */}
                                  <div className="md:col-span-12 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Beschreibung / Effekt (Was macht sie?)</label>
                                    <AutoExpandingTextarea 
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-600 min-h-[64px]" 
                                      placeholder="z.B. Friert Gegner im Umkreis für 10 Sekunden ein."
                                      value={tech.description || ''}
                                      onChange={e => {
                                        const newTechList = ability.techniqueList?.map(t => t.id === tech.id ? { ...t, description: e.target.value } : t) || [];
                                        setPlayer({
                                          ...player,
                                          abilities: player.abilities?.map(a => a.id === ability.id ? { ...a, techniqueList: newTechList } : a)
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!player.abilities || player.abilities.length === 0) && (
                    <div className="text-center p-6 border border-dashed border-slate-700 rounded-lg text-slate-500 text-xs">
                      Keine speziellen Kräfte definiert. Klicke auf "Kraft hinzufügen" um eine neue Fähigkeit zu erstellen.
                    </div>
                  )}
                </div>
                
                {world.campaignPowerSettings && Object.keys(world.campaignPowerSettings).length > 0 && (
                  <CharacterPowerRadar 
                    worldPowerSettings={world.campaignPowerSettings}
                    characterData={player.campaignPowerLevels}
                    onChange={(newData) => setPlayer({ ...player, campaignPowerLevels: newData })}
                  />
                )}
              </div>
            </div>
          )}

          {step === 6 && (
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

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Empfohlene Presets</label>
                  <button 
                    onClick={() => {
                      let recommended = "Klassisch";
                      if (selectedTags.includes("Sci-Fi") || selectedTags.includes("Cyberpunk")) recommended = "Sci-Fi";
                      else if (selectedTags.includes("Fantasy") || selectedTags.includes("Mittelalter")) recommended = "RPG";
                      else if (selectedTags.includes("Post-Apokalyptisch") || selectedTags.includes("Horror")) recommended = "Survival";
                      
                      setStatusElements(HUD_PRESETS[recommended].map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) })));
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
                      onClick={() => setStatusElements(HUD_PRESETS[preset].map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) })))}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-700 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kampagnen-Parameter als Tags-Auswahl */}
              {Object.keys(world.campaignPowerSettings || {}).length > 0 && (
                <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏷️</span> DEINE PARAMETER AUS DEN KAMPAGNEN-EINSTELLUNGEN
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

              <div className="grid gap-3">
                {statusElements.map(el => (
                  <div key={el.id} className="flex gap-2 bg-slate-800/50 border border-slate-700 p-3 rounded-xl items-center">
                    <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white flex-1 outline-none focus:border-amber-500" placeholder="Label (z.B. Gold)" value={el.label || ''} onChange={e => updateStatusElement(el.id, { label: e.target.value })} />
                    <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white flex-1 outline-none focus:border-amber-500" placeholder="Wert (z.B. 100)" value={el.value || ''} onChange={e => updateStatusElement(el.id, { value: e.target.value })} />
                    <button onClick={() => removeStatusElement(el.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><i className="fa-solid fa-trash"></i></button>
                  </div>
                ))}
                <button onClick={() => addStatusElement()} className="p-3 bg-slate-800 rounded-xl text-xs text-amber-500 font-bold border border-slate-700 hover:bg-slate-700 transition-colors">+ Feld hinzufügen</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
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

        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 backdrop-blur-md z-20 flex justify-between gap-4 mt-auto">
          <button onClick={onCancel} className="px-6 py-3 text-slate-400 hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors">Abbrechen</button>
          <div className="flex gap-2">
            {step > 1 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && <button onClick={() => setStep(step - 1)} className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold transition-colors hover:bg-slate-700">Zurück</button>}
            {(step < 7 && mode !== GameViewMode.JOIN_CUSTOM_CHAR) ? (
              <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">Weiter</button>
            ) : (
              <button onClick={handleFinish} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all active:scale-95">Starten</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureEditor;
