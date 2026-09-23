import React, { useState, useEffect, useMemo } from 'react';
import { 
  LoreEntry, 
  LoreCategory, 
  CharacterRelationship, 
  CharacterPowerSource, 
  StructuredInventory, 
  CustomInventoryItem,
  PersonalityTraits, 
  CampaignPowerParameter,
  WorldSetting,
  CharacterGoal
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { EyeColorEditor } from './EyeColorEditor';
import { LocationSelector } from './LocationSelector';
import { PersonalityTraitsEditor } from './PersonalityTraitsEditor';
import { RelationshipDetailEditor } from './RelationshipDetailEditor';
import CharacterPowerRadar from './CharacterPowerRadar';
import ProfessionSelect from './ProfessionSelect';
import CompetenceProfileEditor from './CompetenceProfileEditor';
import { CharacterMotivationPanel } from './CharacterMotivationPanel';
import { CharacterGoalsPanel } from './CharacterGoalsPanel';
import { GeminiService } from '../services/geminiService';
import { PERSONALITY_ARCHETYPES, applyArchetypeToTraits } from './personalityArchetypesData';
import { syncLoreWithReciprocalRelationships, removeCounterpartRelationshipFromLore, normalizeRelationships } from '../lib/relationshipHelper';
import { sanitizeCharacterNameAndProfession } from '../lib/loreSanitizer';
import { migrateLegacyProfessionData } from '../services/professionCompetencyService';
import { TechniqueHierarchyTree } from './TechniqueHierarchyTree';
import { normalizeAbilityHierarchy, syncCharacterAbilityTree } from '../utils/abilityHierarchy';
import { CharacterInventorySection } from './CharacterInventorySection';

export interface CharacterAbility {
  id: string;
  name: string;
  category?: string;
  source?: string;
  powerSourceId?: string;
  cost?: string;
  description?: string;
  techniques?: string;
  activationCondition?: string;
  transformName?: string;
  transformRole?: string;
  transformGender?: string;
  transformCupSize?: string;
  transformHairColor?: string;
  transformEyeColor?: string;
  transformHasHeterochromia?: boolean;
  transformEyeColorLeft?: string;
  transformEyeColorRight?: string;
  transformSkinTone?: string;
  transformBuild?: string;
  transformAge?: string;
  transformRace?: string;
  transformRaceFeatures?: string;
  transformHeight?: string;
  transformMeasurements?: string;
  transformOrigin?: string;
  transformFamily?: string;
  transformFaction?: string;
  transformOutfit?: string;
  transformLooks?: string;
  transformWings?: boolean;
  transformHorns?: boolean;
  transformArchetype?: string;
  transformPersonalityTraits?: PersonalityTraits;
  techniqueList?: {
    id: string;
    name: string;
    description?: string;
    type?: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support' | 'Heilung' | 'Zustandseffekt' | 'Spezial' | 'Beschwörung';
    subtype?: string;
  }[];
}

interface Props {
  editForm: Partial<LoreEntry>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<LoreEntry>>>;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  lore: LoreEntry[];
  onUpdateLore: (lore: LoreEntry[]) => void;
  worldTitle?: string;
  isNsfw?: boolean;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  playerName?: string;
  world?: WorldSetting | any;
}

const GENDER_OPTIONS = ['Männlich', 'Weiblich', 'Divers', 'Nicht-Binär', 'Androgyn', 'Futanari', 'Unbekannt'];
const BUILD_OPTIONS = ['Schlank', 'Sportlich', 'Muskulös', 'Kräftig', 'Zierlich', 'Drahtig', 'Kurvig', 'Stämmig', 'Hager', 'Unbekannt'];
const CUP_SIZE_OPTIONS = ['-', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

const TARGET_SECTIONS = [
  { id: 'all', label: 'Kompletter Charakter (Alle Bereiche)' },
  { id: 'appearance', label: 'Statur & Erscheinung' },
  { id: 'personality', label: 'Persönlichkeit' },
  { id: 'bio', label: 'Vergangenheit / Biografie' },
  { id: 'situation', label: 'Aktuelle Situation' },
  { id: 'motivation', label: 'Motivationskern & Handlungsantrieb' },
  { id: 'goals', label: 'Ziele & Pläne' },
  { id: 'secrets', label: 'Geheimnis-Stufen (Verborgenes Wissen)' },
  { id: 'relationships', label: 'Beziehungen' },
  { id: 'combat', label: 'Kampffähigkeiten & Techniken' },
  { id: 'professions', label: 'Berufe & Talente' },
  { id: 'inventory', label: '5. Besitz & Inventar' }
];

const toSafeString = (val: any): string => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).filter(Boolean).join(', ');
  if (val !== null && val !== undefined && typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return val ? String(val) : '';
};

export const CharacterLoreForm: React.FC<Props> = ({
  editForm,
  setEditForm,
  isEditing,
  setIsEditing,
  onSave,
  onDelete,
  onCancel,
  lore,
  onUpdateLore,
  worldTitle,
  isNsfw,
  worldPowerSettings,
  playerName,
  world
}) => {
  const [charTab, setCharTab] = useState<'profil' | 'beziehungen' | 'kampffaehigkeiten' | 'beruf_talente' | 'besitz_inventar'>('profil');
  const [activeTransformationId, setActiveTransformationId] = useState<string>('standard');
  const [activePowerSourceIdx, setActivePowerSourceIdx] = useState<number>(0);
  const [activeAbilityTab, setActiveAbilityTab] = useState<string>('Techniken');
  const [quickAbilityName, setQuickAbilityName] = useState<string>('');
  
  const [smartFillText, setSmartFillText] = useState<string>('');
  const [isSmartFilling, setIsSmartFilling] = useState<boolean>(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);
  const [keepExistingDetails, setKeepExistingDetails] = useState<boolean>(true);
  const [smartFillSelectedChar, setSmartFillSelectedChar] = useState<string>('new');
  const [smartFillTargetSection, setSmartFillTargetSection] = useState<string>('all');

  const savedCharacters = useMemo(() => {
    if (!lore || !Array.isArray(lore)) return [];
    return lore.filter(item => (item.category === 'Charaktere' || item.category === 'Gegner') && item.title);
  }, [lore]);

  useEffect(() => {
    if (isEditing) {
      setSmartFillSelectedChar(isEditing);
    } else if (editForm.title) {
      setSmartFillSelectedChar('current');
    } else {
      setSmartFillSelectedChar('new');
    }
  }, [isEditing]);

  const handleSelectCharacter = (val: string) => {
    setSmartFillSelectedChar(val);
    if (val === 'new') {
      setIsEditing(null);
      setKeepExistingDetails(false);
      setEditForm({
        category: 'Charaktere',
        title: '',
        description: '',
        details: {
          appearance: {
            gender: 'Unbekannt',
            build: 'Schlank'
          }
        }
      });
    } else if (val === 'current') {
      // Keep current form content as-is
    } else if (val === 'player') {
      const playerEntry = lore.find(l => (l.category === 'Charaktere' || l.category === 'Gegner') && l.title?.trim().toLowerCase() === playerName?.trim().toLowerCase());
      if (playerEntry) {
        let entryToSet = JSON.parse(JSON.stringify(playerEntry));
        if (entryToSet.details) {
          const d = entryToSet.details;
          if ((d.profession || d.role || d.jobTitle) && (!d.positions || !d.professionField || !d.professionProgress)) {
            entryToSet.details = { ...d, ...migrateLegacyProfessionData(d as any) };
          }
        }
        setEditForm(entryToSet);
        setIsEditing(playerEntry.id);
      } else if (playerName) {
        setIsEditing(null);
        setEditForm({
          category: 'Charaktere',
          title: playerName,
          details: {
            role: 'Spieler / Protagonist',
            appearance: { gender: 'Unbekannt', build: 'Schlank' }
          }
        });
      }
    } else {
      const found = lore.find(l => l.id === val);
      if (found) {
        let entryToSet = JSON.parse(JSON.stringify(found));
        if (entryToSet.details) {
          const d = entryToSet.details;
          if ((d.profession || d.role || d.jobTitle) && (!d.positions || !d.professionField || !d.professionProgress)) {
            entryToSet.details = { ...d, ...migrateLegacyProfessionData(d as any) };
          }
        }
        setEditForm(entryToSet);
        setIsEditing(found.id);
      }
    }
  };

  const getSmartFillPlaceholder = () => {
    switch (smartFillTargetSection) {
      case 'appearance':
        return 'Beschreibe Statur, Größe, Körperform, Haare, Augen, Rassemerkmale, Kleidung und das visuelle Erscheinungsbild...';
      case 'personality':
        return 'Beschreibe Wesenszüge, Temperament, Werte, Macken, Ängste, Vorlieben und den Charakter-Archetyp...';
      case 'bio':
        return 'Beschreibe Herkunft, Kindheit, wichtige Erlebnisse und die persönliche Vorgeschichte...';
      case 'situation':
        return 'Beschreibe den aktuellen Aufenthaltsort, die gegenwärtige Lebenslage, soziale Stellung und laufende Aufgaben...';
      case 'motivation':
        return 'Beschreibe den Motivationskern, das Hauptziel, innere Antriebe, Ideale, Schwüre, persönliche Werte und passende Handlungsziele...';
      case 'goals':
        return 'Beschreibe kurz-, mittel- und langfristige Ziele, konkrete Handlungsschritte (WIE), Ausweichpläne, Zielpersonen und Hindernisse...';
      case 'secrets':
        return 'Beschreibe Gerüchte (Stufe 1), Indizien (Stufe 2) und das verborgene Wissen (Stufe 3)...';
      case 'relationships':
        return 'Beschreibe Verbündete, Rivalen, Familie, Vorgesetzte, Vertraute und das Verhalten gegenüber anderen...';
      case 'combat':
        return 'Beschreibe Kräfte, Magie- oder Kampffähigkeiten, Spezialtechniken, Kraftquellen und Verwandlungsformen...';
      case 'professions':
        return 'Beschreibe Berufe, Handwerkskünste, Ränge, Fachwissen und alltägliche Talente...';
      default:
        return 'Beschreibe deinen Charakter, seine Verwandlungen, Beziehungen, Kampffähigkeiten sowie Berufe, Handwerke und Talente. Die KI füllt alle Felder in allen Tabs aus.';
    }
  };
  
  const [isGeneratingChar, setIsGeneratingChar] = useState<boolean>(false);
  const [isGeneratingMotivationCore, setIsGeneratingMotivationCore] = useState<boolean>(false);
  const [isGeneratingGoalsAI, setIsGeneratingGoalsAI] = useState<boolean>(false);
  const [isRelationshipsOpen, setIsRelationshipsOpen] = useState<boolean>(true);
  const [isMotivationOpen, setIsMotivationOpen] = useState<boolean>(true);
  const [isGoalsOpen, setIsGoalsOpen] = useState<boolean>(true);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<boolean>(false);
  const [generatingExpression, setGeneratingExpression] = useState<string | null>(null);
  const [isExtractingInventory, setIsExtractingInventory] = useState<boolean>(false);
  
  const [isFactionDropdownOpen, setIsFactionDropdownOpen] = useState<boolean>(false);
  const [customFactionInput, setCustomFactionInput] = useState<string>('');
  const [openApplicationsDropdown, setOpenApplicationsDropdown] = useState<string | null>(null);

  // Safe legacy data access for character profession v2 without triggering render-phase state updates
  const migratedLegacyDetails = useMemo(() => {
    if (!editForm.details) return {};
    const details = editForm.details;
    const needsMigration =
      (details.profession || details.role || details.jobTitle) &&
      (!details.positions || !details.professionField || !details.professionProgress);

    if (needsMigration) {
      return migrateLegacyProfessionData(details as any);
    }
    return {};
  }, [editForm.details]);

  // Helper to get and update appearance/details
  const getDetail = <T = string,>(key: string, defaultVal: T = '' as any): T => {
    if (editForm.details?.[key] !== undefined) {
      return editForm.details[key];
    }
    if ((migratedLegacyDetails as any)[key] !== undefined) {
      return (migratedLegacyDetails as any)[key];
    }
    return defaultVal;
  };

  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  const updateMultipleDetails = (updates: Record<string, any>) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        ...updates
      }
    }));
  };

  // Transformation logic
  const charTransformations = useMemo(() => {
    const abilities: CharacterAbility[] = editForm.details?.abilities || [];
    return abilities.filter(a => a.category === 'Transformationen');
  }, [editForm.details?.abilities]);

  const activeTransformation = useMemo(() => {
    if (activeTransformationId === 'standard') return null;
    return charTransformations.find(t => t.id === activeTransformationId) || null;
  }, [charTransformations, activeTransformationId]);

  const getAppearanceValue = (field: string) => {
    if (activeTransformation) {
      const transformKey = `transform${field.charAt(0).toUpperCase() + field.slice(1)}`;
      if ((activeTransformation as any)[transformKey] !== undefined) {
        return (activeTransformation as any)[transformKey];
      }
    }
    return getDetail(field, '');
  };

  const updateAppearanceValue = (field: string, value: any) => {
    if (activeTransformation) {
      const transformKey = `transform${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
      const updatedAbilities = currentAbilities.map(a => {
        if (a.id === activeTransformation.id) {
          return { ...a, [transformKey]: value };
        }
        return a;
      });
      updateDetail('abilities', updatedAbilities);
    } else {
      updateDetail(field, value);
    }
  };

  const updateAppearanceMultiple = (updates: Record<string, any>) => {
    if (activeTransformation) {
      const transformUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([k, v]) => {
        const transformKey = `transform${k.charAt(0).toUpperCase() + k.slice(1)}`;
        transformUpdates[transformKey] = v;
      });
      const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
      const updatedAbilities = currentAbilities.map(a => {
        if (a.id === activeTransformation.id) {
          return { ...a, ...transformUpdates };
        }
        return a;
      });
      updateDetail('abilities', updatedAbilities);
    } else {
      if (editForm.details) {
        setEditForm({
          ...editForm,
          details: {
            ...editForm.details,
            ...updates
          }
        });
      }
    }
  };

  // Archetype & Traits
  const getPersonalityArchetype = () => {
    if (activeTransformation && activeTransformation.transformArchetype !== undefined) {
      return activeTransformation.transformArchetype;
    }
    return editForm.details?.archetype || editForm.details?.personalityArchetype || '-';
  };

  const updatePersonalityArchetype = (archetype: string) => {
    if (activeTransformation) {
      const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
      const updatedAbilities = currentAbilities.map(a => {
        if (a.id === activeTransformation.id) {
          const updated = { ...a, transformArchetype: archetype };
          if (archetype && archetype !== '-') {
            updated.transformPersonalityTraits = applyArchetypeToTraits(a.transformPersonalityTraits || {}, archetype);
          }
          return updated;
        }
        return a;
      });
      updateDetail('abilities', updatedAbilities);
    } else {
      const currentTraits = editForm.details?.personalityTraits || {};
      const updatedTraits = archetype && archetype !== '-' 
        ? applyArchetypeToTraits(currentTraits, archetype) 
        : currentTraits;
      updateMultipleDetails({
        archetype: archetype,
        personalityArchetype: archetype,
        personalityTraits: updatedTraits
      });
    }
  };

  const getPersonalityTraits = (): PersonalityTraits => {
    if (activeTransformation && activeTransformation.transformPersonalityTraits) {
      return activeTransformation.transformPersonalityTraits;
    }
    return editForm.details?.personalityTraits || {};
  };

  const updatePersonalityTraits = (traits: PersonalityTraits) => {
    if (activeTransformation) {
      const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
      const updatedAbilities = currentAbilities.map(a => {
        if (a.id === activeTransformation.id) {
          return { ...a, transformPersonalityTraits: traits };
        }
        return a;
      });
      updateDetail('abilities', updatedAbilities);
    } else {
      updateDetail('personalityTraits', traits);
    }
  };

  // Relationships
  const getRelationships = (): CharacterRelationship[] => {
    return normalizeRelationships(editForm.details?.relationships);
  };

  const updateRelationships = (rels: CharacterRelationship[]) => {
    updateDetail('relationships', rels);
  };

  // Power sources & abilities
  const powerSourcesList: CharacterPowerSource[] = useMemo(() => {
    if (editForm.details?.powerSources && editForm.details.powerSources.length > 0) {
      return editForm.details.powerSources;
    }
    return [
      {
        id: 'default',
        source: editForm.details?.powerSource || '',
        cost: editForm.details?.powerCost || '',
        powerName: editForm.details?.powerName || '',
        powerDescription: editForm.details?.powerDescription || ''
      }
    ];
  }, [editForm.details?.powerSources, editForm.details?.powerSource, editForm.details?.powerCost, editForm.details?.powerName, editForm.details?.powerDescription]);

  const currentPowerIdx = Math.min(activePowerSourceIdx, powerSourcesList.length - 1);
  const activePowerSource = powerSourcesList[currentPowerIdx] || powerSourcesList[0] || {} as CharacterPowerSource;

  const updateActivePowerSource = (fields: Partial<CharacterPowerSource>) => {
    const newList = [...powerSourcesList];
    newList[currentPowerIdx] = { ...newList[currentPowerIdx], ...fields };
    const first = newList[0] || {} as CharacterPowerSource;
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        powerSources: newList,
        powerSource: first.source || '',
        powerCost: first.cost || '',
        powerName: first.powerName || '',
        powerDescription: first.powerDescription || ''
      }
    }));
  };

  const handleAddPowerSource = () => {
    const newSrc: CharacterPowerSource = {
      id: `ps-${Date.now()}`,
      source: 'Mana',
      cost: 'MP',
      powerName: 'Neue Kraft',
      powerDescription: 'Beschreibung der neuen Kraft...'
    };
    const newList = [...powerSourcesList, newSrc];
    const first = newList[0] || {} as CharacterPowerSource;
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        powerSources: newList,
        powerSource: first.source || '',
        powerCost: first.cost || '',
        powerName: first.powerName || '',
        powerDescription: first.powerDescription || ''
      }
    }));
    setActivePowerSourceIdx(newList.length - 1);
  };

  const handleRemovePowerSource = (idxToRemove: number) => {
    if (powerSourcesList.length <= 1) return;
    const newList = powerSourcesList.filter((_, i) => i !== idxToRemove);
    const first = newList[0] || {} as CharacterPowerSource;
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        powerSources: newList,
        powerSource: first.source || '',
        powerCost: first.cost || '',
        powerName: first.powerName || '',
        powerDescription: first.powerDescription || ''
      }
    }));
    setActivePowerSourceIdx(Math.max(0, currentPowerIdx - 1));
  };

  const buildInventoryFromData = (sourceInv: any, existingInv?: any, keepExisting: boolean = false): StructuredInventory => {
    const s = sourceInv || {};
    const e = existingInv || {};

    const extractedCustomItems: CustomInventoryItem[] = keepExisting
      ? (Array.isArray(e.customItems) ? [...e.customItems] : [])
      : (Array.isArray(s.customItems) ? [...s.customItems] : (Array.isArray(e.customItems) ? [...e.customItems] : []));

    const helperAddCustomItem = (itemObj: any, defaultSlot: 'weapon' | 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'finger' | 'neck' | 'wrist' | 'waist' | 'back' | 'inventory', defaultCategory: string) => {
      if (!itemObj || typeof itemObj !== 'object' || !itemObj.name) return;
      const itemName = String(itemObj.name).trim();
      if (!itemName) return;
      if (extractedCustomItems.some(ci => (ci.name || '').toLowerCase() === itemName.toLowerCase())) return;

      extractedCustomItems.push({
        id: 'custom_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: itemName,
        category: itemObj.category || defaultCategory,
        subCategory: itemObj.type || itemObj.subCategory || (defaultSlot === 'weapon' ? 'Nahkampfwaffe' : defaultCategory),
        slot: (itemObj.slot as any) || defaultSlot,
        equipped: itemObj.equipped !== undefined ? !!itemObj.equipped : true,
        rarity: (itemObj.rarity as any) || 'Selten',
        quality: itemObj.quality || 'Meisterlich geschmiedet',
        material: itemObj.material || '',
        durability: itemObj.durability || '100 / 100',
        weight: itemObj.weight || '',
        value: typeof itemObj.value === 'number' ? itemObj.value : 350,
        description: itemObj.description || '',
        specialEffects: itemObj.properties || itemObj.specialEffects || '',
        enchantments: itemObj.enchantments || '',
        combatStats: {
          damage: typeof itemObj.damage === 'object' ? JSON.stringify(itemObj.damage) : (itemObj.damage || itemObj.combatStats?.damage || ''),
          damageType: itemObj.damageType || itemObj.combatStats?.damageType || '',
          defense: typeof itemObj.defense === 'object' ? JSON.stringify(itemObj.defense) : (itemObj.defense || itemObj.combatStats?.defense || ''),
          range: itemObj.range || itemObj.combatStats?.range || (defaultSlot === 'weapon' ? 'Nahkampf' : ''),
          scalingStat: itemObj.scalingStat || itemObj.combatStats?.scalingStat || ''
        }
      });
    };

    let weapons: string[] = [];
    if (Array.isArray(s.weapons)) {
      s.weapons.forEach((w: any) => {
        if (typeof w === 'string' && w.trim()) {
          weapons.push(w.trim());
        } else if (w && typeof w === 'object' && w.name) {
          const wName = String(w.name).trim();
          if (wName) {
            weapons.push(wName);
            helperAddCustomItem(w, 'weapon', 'Waffen');
          }
        }
      });
    } else if (typeof s.weapons === 'string' && s.weapons.trim()) {
      weapons = s.weapons.split(',').map((w: string) => w.trim()).filter(Boolean);
    }

    let generalItems: string[] = [];
    if (Array.isArray(s.generalItems)) {
      s.generalItems.forEach((item: any) => {
        if (typeof item === 'string' && item.trim()) {
          generalItems.push(item.trim());
        } else if (item && typeof item === 'object' && item.name) {
          const itmName = String(item.name).trim();
          if (itmName) {
            generalItems.push(itmName);
            helperAddCustomItem(item, 'inventory', 'Gegenstände');
          }
        }
      });
    } else if (typeof s.generalItems === 'string' && s.generalItems.trim()) {
      generalItems = s.generalItems.split(',').map((item: string) => item.trim()).filter(Boolean);
    }

    const cleanSlotVal = (val: any, defaultSlot: any, defaultCat: string): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'object' && val.name) {
        helperAddCustomItem(val, defaultSlot, defaultCat);
        return String(val.name).trim();
      }
      return '';
    };

    const existingWeapons: string[] = Array.isArray(e.weapons)
      ? e.weapons.map((w: any) => {
          if (typeof w === 'string') return w.trim();
          if (w && typeof w === 'object' && w.name) {
            helperAddCustomItem(w, 'weapon', 'Waffen');
            return String(w.name).trim();
          }
          return '';
        }).filter(Boolean)
      : [];

    const existingGeneral: string[] = Array.isArray(e.generalItems)
      ? e.generalItems.map((g: any) => {
          if (typeof g === 'string') return g.trim();
          if (g && typeof g === 'object' && g.name) {
            helperAddCustomItem(g, 'inventory', 'Gegenstände');
            return String(g.name).trim();
          }
          return '';
        }).filter(Boolean)
      : [];

    const finalWeapons = keepExisting && existingWeapons.length > 0
      ? Array.from(new Set([...existingWeapons, ...weapons]))
      : (weapons.length > 0 ? weapons : existingWeapons);

    const finalGeneral = keepExisting && existingGeneral.length > 0
      ? Array.from(new Set([...existingGeneral, ...generalItems]))
      : (generalItems.length > 0 ? generalItems : existingGeneral);

    const sArmor = s.armor || {};
    const eArmor = e.armor || {};
    const sAcc = s.accessories || {};
    const eAcc = e.accessories || {};

    return {
      money: keepExisting && e.money !== undefined ? Number(e.money) : (s.money !== undefined ? Number(s.money) : (e.money ?? 100)),
      currencyLabel: keepExisting && e.currencyLabel ? String(e.currencyLabel) : String(s.currencyLabel || e.currencyLabel || 'Goldstücke'),
      weapons: finalWeapons,
      armor: {
        head: keepExisting && eArmor.head ? cleanSlotVal(eArmor.head, 'head', 'Rüstung') : cleanSlotVal(sArmor.head || eArmor.head, 'head', 'Rüstung'),
        chest: keepExisting && eArmor.chest ? cleanSlotVal(eArmor.chest, 'chest', 'Rüstung') : cleanSlotVal(sArmor.chest || eArmor.chest, 'chest', 'Rüstung'),
        hands: keepExisting && eArmor.hands ? cleanSlotVal(eArmor.hands, 'hands', 'Rüstung') : cleanSlotVal(sArmor.hands || eArmor.hands, 'hands', 'Rüstung'),
        legs: keepExisting && eArmor.legs ? cleanSlotVal(eArmor.legs, 'legs', 'Rüstung') : cleanSlotVal(sArmor.legs || eArmor.legs, 'legs', 'Rüstung'),
        feet: keepExisting && eArmor.feet ? cleanSlotVal(eArmor.feet, 'feet', 'Rüstung') : cleanSlotVal(sArmor.feet || eArmor.feet, 'feet', 'Rüstung')
      },
      accessories: {
        finger: keepExisting && eAcc.finger ? cleanSlotVal(eAcc.finger, 'finger', 'Schmuck & Accessoires') : cleanSlotVal(sAcc.finger || eAcc.finger, 'finger', 'Schmuck & Accessoires'),
        wrist: keepExisting && eAcc.wrist ? cleanSlotVal(eAcc.wrist, 'wrist', 'Schmuck & Accessoires') : cleanSlotVal(sAcc.wrist || eAcc.wrist, 'wrist', 'Schmuck & Accessoires'),
        waist: keepExisting && eAcc.waist ? cleanSlotVal(eAcc.waist, 'waist', 'Schmuck & Accessoires') : cleanSlotVal(sAcc.waist || eAcc.waist, 'waist', 'Schmuck & Accessoires'),
        back: keepExisting && eAcc.back ? cleanSlotVal(eAcc.back, 'back', 'Schmuck & Accessoires') : cleanSlotVal(sAcc.back || eAcc.back, 'back', 'Schmuck & Accessoires'),
        neck: keepExisting && eAcc.neck ? cleanSlotVal(eAcc.neck, 'neck', 'Schmuck & Accessoires') : cleanSlotVal(sAcc.neck || eAcc.neck, 'neck', 'Schmuck & Accessoires')
      },
      generalItems: finalGeneral,
      customItems: extractedCustomItems
    };
  };

  // Structured Inventory
  const structuredInventory: StructuredInventory = useMemo(() => {
    return buildInventoryFromData(editForm.details?.inventory, editForm.details?.inventory, false);
  }, [editForm.details?.inventory]);

  const setStructuredInventory = (inv: StructuredInventory) => {
    updateDetail('inventory', inv);
  };

  // AI Generation Handlers
  const handleSmartFill = async () => {
    const isNewCharMode = smartFillSelectedChar === 'new';
    const promptText = isNewCharMode
      ? (smartFillText.trim() ? `Erstelle einen neuen Charakter basierend auf folgender Beschreibung: ${smartFillText.trim()}` : '')
      : (smartFillText.trim() || `Vervollständige und verfeinere die Daten für den Charakter "${editForm.title || 'Charakter'}".`);

    if (!promptText.trim()) return;
    setIsSmartFilling(true);
    setSmartFillError(null);
    try {
      const existingFactions = lore
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);

      const existingCodexCharacters = lore
        .filter(l => l.category === 'Charaktere' || l.category === 'Gegner')
        .map(l => ({
          name: l.title + (l.details?.nickname ? ` (${l.details.nickname})` : ''),
          role: l.details?.role || '',
          profession: l.details?.profession || l.details?.role || '',
          professionLevel: l.details?.professionLevel || '',
          talents: l.details?.talents || '',
          everydaySkills: l.details?.everydaySkills || '',
          craftingSkills: l.details?.craftingSkills || '',
          race: l.details?.race || l.details?.appearance?.race || '',
          raceFeatures: l.details?.raceFeatures || l.details?.appearance?.raceFeatures || '',
          hairColor: l.details?.hairColor || l.details?.appearance?.hairColor || '',
          eyeColor: l.details?.eyeColor || l.details?.appearance?.eyeColor || '',
          age: l.details?.age || l.details?.appearance?.age || '',
          origin: l.details?.origin || l.details?.appearance?.origin || '',
          location: l.details?.currentSituation || l.details?.location || '',
          family: l.details?.family || '',
          relation: l.details?.relationship || l.details?.conduct || '',
          description: l.description || '',
          relationships: l.details?.relationships || []
        }));

      const existingCharForMerge = (!isNewCharMode && (keepExistingDetails || smartFillTargetSection !== 'all')) ? {
        name: editForm.title || '',
        role: editForm.details?.role || '',
        bio: editForm.description || '',
        personality: editForm.details?.personality || '',
        personalityArchetype: editForm.details?.personalityArchetype || editForm.details?.archetype || '',
        archetype: editForm.details?.archetype || editForm.details?.personalityArchetype || '',
        personalityTraits: editForm.details?.personalityTraits,
        appearance: {
          gender: editForm.details?.gender || 'Unbekannt',
          age: editForm.details?.age || '',
          build: editForm.details?.build || '',
          hairColor: editForm.details?.hairColor || '',
          eyeColor: editForm.details?.eyeColor || '',
          cupSize: editForm.details?.cupSize || '',
          outfit: editForm.details?.outfit || '',
          looks: editForm.details?.looks || '',
          height: editForm.details?.height || '',
          measurements: editForm.details?.measurements || '',
          weight: editForm.details?.weight || '',
          bodyFat: editForm.details?.bodyFat || '',
          muscleMass: editForm.details?.muscleMass || '',
          origin: editForm.details?.origin || '',
          family: editForm.details?.family || '',
          faction: editForm.details?.faction || '',
          currentLocation: editForm.details?.currentLocation || '',
          race: editForm.details?.race || '',
          raceFeatures: editForm.details?.raceFeatures || ''
        },
        weight: editForm.details?.weight || '',
        bodyFat: editForm.details?.bodyFat || '',
        muscleMass: editForm.details?.muscleMass || '',
        currentLocation: editForm.details?.currentLocation || '',
        relationships: editForm.details?.relationships || [],
        abilities: editForm.details?.abilities || [],
        powerSource: editForm.details?.powerSource || '',
        powerCost: editForm.details?.powerCost || '',
        techniques: editForm.details?.techniques || '',
        campaignPowerLevels: editForm.details?.campaignPowerLevels || editForm.details?.campaignPowerData || {},
        goal: editForm.details?.goal,
        motivationCore: editForm.details?.motivationCore,
        goals: editForm.details?.goals,
        inventory: editForm.details?.inventory
      } as any : undefined;

      const data = await GeminiService.autofillCharacter(
        promptText,
        worldPowerSettings,
        existingCharForMerge,
        world,
        existingFactions,
        existingCodexCharacters,
        isNewCharMode ? 'all' : smartFillTargetSection
      );

      if (data) {
        if (isNewCharMode) {
          setIsEditing(null);
        }
        setEditForm(prev => {
          const currentDetails = isNewCharMode ? {} : (prev.details || {});
          const getSafeStr = (val: any): string => {
            if (typeof val === 'string') return val.trim();
            if (val && typeof val === 'object') return (val.name || val.title || val.callName || '').toString().trim();
            return val ? String(val).trim() : '';
          };
          const generatedName = getSafeStr(data.name) || getSafeStr(data.callName) || getSafeStr(data.rufName);
          let rawTitle = isNewCharMode ? (generatedName || 'Neuer Charakter') : (prev.title || 'Neuer Charakter');
          if (!isNewCharMode && !keepExistingDetails && generatedName && smartFillTargetSection === 'all') {
            rawTitle = generatedName;
          }

          const { cleanName, extractedProfession, callName } = sanitizeCharacterNameAndProfession(
            rawTitle,
            data.profession || currentDetails.profession,
            data.role || currentDetails.role
          );
          const finalTitle = isNewCharMode ? (generatedName || cleanName || rawTitle) : (cleanName || rawTitle);

          const finalBio = (!isNewCharMode && (keepExistingDetails || smartFillTargetSection !== 'all') && prev.description) ? prev.description : (data.bio || '');
          const finalArchetype = data.personalityArchetype || data.archetype || (!isNewCharMode && keepExistingDetails ? (currentDetails.personalityArchetype || currentDetails.archetype || '') : '');
          const rawTraits = data.personalityTraits || (!isNewCharMode && keepExistingDetails ? currentDetails.personalityTraits : undefined);
          const finalTraits = finalArchetype && finalArchetype !== '-' ? applyArchetypeToTraits(rawTraits, finalArchetype) : (rawTraits || {});

          let generatedAbilities = (!isNewCharMode && keepExistingDetails) ? (currentDetails.abilities || []) : [];
          if (data.abilities && Array.isArray(data.abilities)) {
            const mappedAbilities = data.abilities.map((abil: any, aIndex: number) => {
              let cat = abil.category;
              if (!cat || cat === 'Standard' || cat === 'Kernfähigkeit') {
                cat = 'Techniken';
              }
              return {
                id: `abil-${Date.now()}-${aIndex}-${Math.random().toString(36).substring(2, 9)}`,
                name: abil.name || 'Fähigkeit',
                category: cat,
                source: abil.source || data.powerSource || '',
                cost: abil.cost || data.powerCost || '',
                description: abil.description || abil.skills || '',
                techniques: abil.techniques || (abil.techniqueList ? abil.techniqueList.map((t: any) => t.name).join(', ') : ''),
                activationCondition: abil.activationCondition || '',
                transformName: abil.transformName || '',
                transformRole: abil.transformRole || '',
                transformGender: abil.transformGender || '',
                transformCupSize: abil.transformCupSize || '',
                transformHairColor: abil.transformHairColor || '',
                transformEyeColor: abil.transformEyeColor || '',
                transformHasHeterochromia: abil.transformHasHeterochromia ?? false,
                transformEyeColorLeft: abil.transformEyeColorLeft || '',
                transformEyeColorRight: abil.transformEyeColorRight || '',
                transformSkinTone: abil.transformSkinTone || '',
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
                  ? abil.techniqueList.map((t: any, index: number) => ({
                      id: `tech-${Date.now()}-${aIndex}-${index}-${Math.random().toString(36).substring(2, 9)}`,
                      name: t.name,
                      description: t.description || '',
                      type: t.type || 'Angriff',
                      subtype: t.subtype || ''
                    }))
                  : []
              };
            });

            if (keepExistingDetails && currentDetails.abilities && currentDetails.abilities.length > 0) {
              generatedAbilities = [...currentDetails.abilities, ...mappedAbilities];
            } else {
              generatedAbilities = mappedAbilities;
            }
          }

          const nextSecrets1 = data.secretsStage1 !== undefined ? data.secretsStage1 : (keepExistingDetails ? (prev.secretsStage1 || currentDetails.secretsStage1 || '') : '');
          const nextSecrets2 = data.secretsStage2 !== undefined ? data.secretsStage2 : (keepExistingDetails ? (prev.secretsStage2 || currentDetails.secretsStage2 || '') : '');
          const nextSecrets3 = data.secretsStage3 !== undefined ? data.secretsStage3 : (keepExistingDetails ? (prev.secretsStage3 || currentDetails.secretsStage3 || '') : '');
          const nextKnowledge = data.knowledge !== undefined ? data.knowledge : (keepExistingDetails ? (prev.knowledge || currentDetails.knowledge || '') : '');

          const finalRole = data.role || data.profession || extractedProfession || currentDetails.role || currentDetails.profession || '';
          const finalProfession = data.profession || data.role || extractedProfession || currentDetails.profession || currentDetails.role || '';

          const mapGoalWithStages = (g: any, fallbackMainTitle?: string, motivationCore?: any): any => {
            const shortPlan = g.shortTermPlan || motivationCore?.shortTermPlan || '';
            const medPlan = g.mediumTermPlan || motivationCore?.mediumTermPlan || '';
            const longPlan = g.longTermPlan || motivationCore?.longTermPlan || '';
            const why = g.motivation || (motivationCore?.whyGoal ? toSafeString(motivationCore.whyGoal) : '');
            const activePlan = g.activePlan || (motivationCore?.methodsAndMeans ? toSafeString(motivationCore.methodsAndMeans) : '') || shortPlan;

            return {
              id: g.id || `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: g.title || fallbackMainTitle || 'Unbenanntes Ziel',
              description: g.description || '',
              timeframe: ['langfristig', 'mittelfristig', 'kurzfristig'].includes(g.timeframe) ? g.timeframe : 'mittelfristig',
              targetType: ['self', 'character', 'faction', 'world'].includes(g.targetType) ? g.targetType : 'self',
              targetName: g.targetName || (g.targetType === 'self' ? 'Selbst' : ''),
              targetId: g.targetId || undefined,
              priority: ['kritisch', 'hoch', 'normal', 'niedrig'].includes(g.priority) ? g.priority : 'normal',
              status: ['aktiv', 'pausiert', 'erreicht', 'gescheitert', 'aufgegeben'].includes(g.status) ? g.status : 'aktiv',
              motivation: why,
              activePlan: activePlan,
              shortTermPlan: shortPlan || undefined,
              mediumTermPlan: medPlan || undefined,
              longTermPlan: longPlan || undefined,
              alternativePlans: Array.isArray(g.alternativePlans) ? g.alternativePlans : (g.alternativePlans ? [g.alternativePlans] : []),
              obstacles: Array.isArray(g.obstacles) ? g.obstacles : (g.obstacles ? [g.obstacles] : (motivationCore?.fears ? [toSafeString(motivationCore.fears)] : [])),
              progress: typeof g.progress === 'number' ? Math.max(0, Math.min(100, g.progress)) : 0,
              mainGoalTitle: g.mainGoalTitle || fallbackMainTitle || undefined,
              parentGoalId: g.parentGoalId || undefined,
              isMainGoal: g.isMainGoal !== undefined ? g.isMainGoal : undefined,
              createdAt: g.createdAt || new Date().toISOString()
            };
          };

          let newDetails: any = { ...currentDetails };

          if (smartFillTargetSection === 'appearance') {
            newDetails = {
              ...currentDetails,
              gender: data.appearance?.gender || currentDetails.gender || 'Unbekannt',
              age: data.appearance?.age || currentDetails.age || '',
              build: data.appearance?.build || currentDetails.build || '',
              race: data.appearance?.race || currentDetails.race || 'Mensch',
              raceFeatures: data.appearance?.raceFeatures || currentDetails.raceFeatures || 'keine',
              hairColor: data.appearance?.hairColor || currentDetails.hairColor || '',
              eyeColor: data.appearance?.eyeColor || currentDetails.eyeColor || '',
              cupSize: data.appearance?.cupSize || currentDetails.cupSize || '-',
              height: data.appearance?.height || currentDetails.height || '',
              measurements: data.appearance?.measurements || currentDetails.measurements || '',
              weight: data.appearance?.weight || currentDetails.weight || '',
              bodyFat: data.appearance?.bodyFat || currentDetails.bodyFat || '',
              muscleMass: data.appearance?.muscleMass || currentDetails.muscleMass || '',
              origin: data.appearance?.origin || currentDetails.origin || '',
              family: data.appearance?.family || currentDetails.family || '',
              faction: data.appearance?.faction || currentDetails.faction || '',
              currentLocation: data.appearance?.currentLocation || currentDetails.currentLocation || '',
              outfit: data.appearance?.outfit || currentDetails.outfit || '',
              looks: data.appearance?.looks || currentDetails.looks || '',
              appearance: {
                ...(currentDetails.appearance || {}),
                ...(data.appearance || {})
              },
              abilities: data.abilities?.some((a: any) => a.category === 'Transformationen')
                ? generatedAbilities
                : (currentDetails.abilities || [])
            };
          } else if (smartFillTargetSection === 'personality') {
            newDetails = {
              ...currentDetails,
              personality: data.personality || currentDetails.personality || '',
              personalityArchetype: finalArchetype,
              archetype: finalArchetype,
              personalityTraits: finalTraits
            };
          } else if (smartFillTargetSection === 'bio') {
            newDetails = {
              ...currentDetails,
              bio: data.bio || prev.description || currentDetails.bio || '',
              origin: data.appearance?.origin || data.origin || currentDetails.origin || '',
              family: data.appearance?.family || data.family || currentDetails.family || ''
            };
          } else if (smartFillTargetSection === 'situation') {
            newDetails = {
              ...currentDetails,
              currentSituation: data.currentSituation || currentDetails.currentSituation || '',
              currentLocation: data.appearance?.currentLocation || currentDetails.currentLocation || ''
            };
          } else if (smartFillTargetSection === 'motivation') {
            const rawGenGoals = Array.isArray(data.goals) ? data.goals : [];
            const mappedGenGoals = rawGenGoals.map((g: any) => mapGoalWithStages(g, data.goal || data.motivationCore?.mainGoal, data.motivationCore));
            const existingGoals = currentDetails.goals || [];
            let nextGoals = existingGoals;
            if (mappedGenGoals.length > 0) {
              if (keepExistingDetails) {
                const existingIds = new Set(existingGoals.map((g: any) => g.id));
                nextGoals = [...existingGoals];
                for (const g of mappedGenGoals) {
                  if (!existingIds.has(g.id)) {
                    nextGoals.push(g);
                  }
                }
              } else {
                nextGoals = mappedGenGoals;
              }
            } else if ((data.goal || data.motivationCore?.mainGoal) && existingGoals.length === 0) {
              nextGoals = [mapGoalWithStages({
                id: `goal-${Date.now()}`,
                title: data.goal || data.motivationCore?.mainGoal,
                timeframe: 'langfristig',
                targetType: 'self',
                targetName: 'Selbst',
                priority: 'hoch',
                status: 'aktiv',
                shortTermPlan: data.motivationCore?.shortTermPlan || data.shortTermPlan || '',
                mediumTermPlan: data.motivationCore?.mediumTermPlan || data.mediumTermPlan || '',
                longTermPlan: data.motivationCore?.longTermPlan || data.longTermPlan || '',
              }, data.goal || data.motivationCore?.mainGoal, data.motivationCore)];
            }
            newDetails = {
              ...currentDetails,
              goal: data.goal || data.motivationCore?.mainGoal || currentDetails.goal || '',
              motivationCore: data.motivationCore || currentDetails.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
              goals: nextGoals
            };
          } else if (smartFillTargetSection === 'goals') {
            const rawGenGoals = Array.isArray(data.goals) ? data.goals : [];
            const mappedGenGoals = rawGenGoals.map((g: any) => mapGoalWithStages(g, data.goal || data.motivationCore?.mainGoal, data.motivationCore));
            const existingGoals = currentDetails.goals || [];
            let nextGoals = existingGoals;
            if (mappedGenGoals.length > 0) {
              if (keepExistingDetails) {
                const existingIds = new Set(existingGoals.map((g: any) => g.id));
                nextGoals = [...existingGoals];
                for (const g of mappedGenGoals) {
                  if (!existingIds.has(g.id)) {
                    nextGoals.push(g);
                  }
                }
              } else {
                nextGoals = mappedGenGoals;
              }
            } else if ((data.goal || data.motivationCore?.mainGoal) && existingGoals.length === 0) {
              nextGoals = [mapGoalWithStages({
                id: `goal-${Date.now()}`,
                title: data.goal || data.motivationCore?.mainGoal,
                timeframe: 'langfristig',
                targetType: 'self',
                targetName: 'Selbst',
                priority: 'hoch',
                status: 'aktiv',
                shortTermPlan: data.motivationCore?.shortTermPlan || data.shortTermPlan || '',
                mediumTermPlan: data.motivationCore?.mediumTermPlan || data.mediumTermPlan || '',
                longTermPlan: data.motivationCore?.longTermPlan || data.longTermPlan || '',
              }, data.goal || data.motivationCore?.mainGoal, data.motivationCore)];
            }
            newDetails = {
              ...currentDetails,
              goals: nextGoals,
              goal: nextGoals[0]?.title || data.goal || currentDetails.goal || ''
            };
          } else if (smartFillTargetSection === 'secrets') {
            newDetails = {
              ...currentDetails,
              secretsStage1: nextSecrets1,
              secretsStage2: nextSecrets2,
              secretsStage3: nextSecrets3,
              knowledge: nextKnowledge
            };
          } else if (smartFillTargetSection === 'relationships') {
            newDetails = {
              ...currentDetails,
              relationship: data.relationship || currentDetails.relationship || '',
              conduct: data.conduct || currentDetails.conduct || '',
              relationships: normalizeRelationships(data.relationships || currentDetails.relationships)
            };
          } else if (smartFillTargetSection === 'combat') {
            newDetails = {
              ...currentDetails,
              skills: data.skills || currentDetails.skills || '',
              powerSource: data.powerSource || currentDetails.powerSource || '',
              powerCost: data.powerCost || currentDetails.powerCost || '',
              techniques: data.techniques || currentDetails.techniques || '',
              abilities: generatedAbilities,
              campaignPowerLevels: data.campaignPowerLevels || data.campaignPowerData || currentDetails.campaignPowerLevels || currentDetails.campaignPowerData || {},
              campaignPowerData: data.campaignPowerData || data.campaignPowerLevels || currentDetails.campaignPowerData || currentDetails.campaignPowerLevels || {}
            };
          } else if (smartFillTargetSection === 'professions') {
            newDetails = {
              ...currentDetails,
              role: finalRole,
              profession: finalProfession || finalRole,
              professionField: data.professionField || currentDetails.professionField || '',
              professionSpecialization: data.professionSpecialization || currentDetails.professionSpecialization || '',
              professionLevel: data.professionLevel || currentDetails.professionLevel || '',
              secondaryProfessions: data.secondaryProfessions || currentDetails.secondaryProfessions || [],
              jobTitle: data.jobTitle || currentDetails.jobTitle || '',
              professionDescription: data.professionDescription || currentDetails.professionDescription || '',
              craftingSkills: data.craftingSkills || currentDetails.craftingSkills || '',
              talents: data.talents || currentDetails.talents || '',
              everydaySkills: data.everydaySkills || currentDetails.everydaySkills || ''
            };
          } else if (smartFillTargetSection === 'inventory') {
            const nextInv = buildInventoryFromData(data.structuredInventory, currentDetails.inventory, keepExistingDetails && !isNewCharMode);
            newDetails = {
              ...currentDetails,
              inventory: nextInv
            };
          } else {
            // 'all'
            newDetails = (!isNewCharMode && keepExistingDetails) ? {
              ...currentDetails,
              callName: generatedName || currentDetails.callName || finalTitle,
              nickname: data.nickname || currentDetails.nickname || '',
              rufName: data.rufName || currentDetails.rufName || generatedName || '',
              role: finalRole,
              profession: finalProfession || finalRole,
              professionField: data.professionField || currentDetails.professionField || '',
              professionSpecialization: data.professionSpecialization || currentDetails.professionSpecialization || '',
              professionLevel: data.professionLevel || currentDetails.professionLevel || '',
              secondaryProfessions: data.secondaryProfessions || currentDetails.secondaryProfessions || [],
              jobTitle: data.jobTitle || currentDetails.jobTitle || '',
              professionDescription: data.professionDescription || currentDetails.professionDescription || '',
              craftingSkills: data.craftingSkills || currentDetails.craftingSkills || '',
              talents: data.talents || currentDetails.talents || '',
              everydaySkills: data.everydaySkills || currentDetails.everydaySkills || '',
              professionRank: data.professionRank || data.professionLevel || currentDetails.professionRank || '',
              toolsAndEquipment: data.toolsAndEquipment || currentDetails.toolsAndEquipment || '',
              gender: data.appearance?.gender || currentDetails.gender || 'Unbekannt',
              age: data.appearance?.age || currentDetails.age || '',
              build: data.appearance?.build || currentDetails.build || '',
              race: data.appearance?.race || currentDetails.race || 'Mensch',
              raceFeatures: data.appearance?.raceFeatures || currentDetails.raceFeatures || 'keine',
              hairColor: data.appearance?.hairColor || currentDetails.hairColor || '',
              eyeColor: data.appearance?.eyeColor || currentDetails.eyeColor || '',
              cupSize: data.appearance?.cupSize || currentDetails.cupSize || '-',
              height: data.appearance?.height || currentDetails.height || '',
              measurements: data.appearance?.measurements || currentDetails.measurements || '',
              weight: data.appearance?.weight || currentDetails.weight || '',
              bodyFat: data.appearance?.bodyFat || currentDetails.bodyFat || '',
              muscleMass: data.appearance?.muscleMass || currentDetails.muscleMass || '',
              currentLocation: data.appearance?.currentLocation || currentDetails.currentLocation || '',
              origin: data.appearance?.origin || currentDetails.origin || '',
              family: data.appearance?.family || currentDetails.family || '',
              faction: data.appearance?.faction || currentDetails.faction || '',
              outfit: data.appearance?.outfit || currentDetails.outfit || '',
              looks: data.appearance?.looks || currentDetails.looks || '',
              appearance: {
                ...(currentDetails.appearance || {}),
                ...(data.appearance || {})
              },
              personality: data.personality || currentDetails.personality || '',
              personalityArchetype: finalArchetype,
              archetype: finalArchetype,
              personalityTraits: finalTraits,
              bio: finalBio,
              goal: data.goal || currentDetails.goal || '',
              motivationCore: data.motivationCore || currentDetails.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
              goals: (() => {
                const rawGenGoals = Array.isArray(data.goals) ? data.goals : [];
                const mappedGenGoals = rawGenGoals.map((g: any) => mapGoalWithStages(g, data.goal || data.motivationCore?.mainGoal, data.motivationCore));
                if (mappedGenGoals.length === 0) {
                  if (currentDetails.goals && currentDetails.goals.length > 0) return currentDetails.goals;
                  if (data.goal || data.motivationCore?.mainGoal) {
                    return [mapGoalWithStages({
                      id: `goal-${Date.now()}`,
                      title: data.goal || data.motivationCore?.mainGoal,
                      timeframe: 'langfristig',
                      targetType: 'self',
                      targetName: 'Selbst',
                      priority: 'hoch',
                      status: 'aktiv',
                      shortTermPlan: data.motivationCore?.shortTermPlan || data.shortTermPlan || '',
                      mediumTermPlan: data.motivationCore?.mediumTermPlan || data.mediumTermPlan || '',
                      longTermPlan: data.motivationCore?.longTermPlan || data.longTermPlan || '',
                    }, data.goal || data.motivationCore?.mainGoal, data.motivationCore)];
                  }
                  return [];
                }
                const existing = currentDetails.goals || [];
                const existingIds = new Set(existing.map((g: any) => g.id));
                const merged = [...existing];
                for (const g of mappedGenGoals) {
                  if (!existingIds.has(g.id)) {
                    merged.push(g);
                  }
                }
                return merged;
              })(),
              currentSituation: data.currentSituation || currentDetails.currentSituation || '',
              relationship: data.relationship || currentDetails.relationship || '',
              conduct: data.conduct || currentDetails.conduct || '',
              skills: data.skills || currentDetails.skills || '',
              powerSource: data.powerSource || currentDetails.powerSource || '',
              powerCost: data.powerCost || currentDetails.powerCost || '',
              techniques: data.techniques || currentDetails.techniques || '',
              abilities: generatedAbilities,
              techniqueList: Array.isArray(data.techniqueList) ? data.techniqueList : (currentDetails.techniqueList || []),
              relationships: normalizeRelationships(data.relationships || currentDetails.relationships),
              campaignPowerLevels: data.campaignPowerLevels || data.campaignPowerData || currentDetails.campaignPowerLevels || currentDetails.campaignPowerData || {},
              campaignPowerData: data.campaignPowerData || data.campaignPowerLevels || currentDetails.campaignPowerData || currentDetails.campaignPowerLevels || {},
              inventory: buildInventoryFromData(data.structuredInventory, currentDetails.inventory, true),
              secretsStage1: nextSecrets1,
              secretsStage2: nextSecrets2,
              secretsStage3: nextSecrets3,
              knowledge: nextKnowledge
            } : {
              callName: generatedName || finalTitle,
              nickname: data.nickname || '',
              rufName: data.rufName || data.nickname || generatedName || '',
              role: data.role || data.profession || '',
              profession: data.profession || data.role || '',
              professionField: data.professionField || '',
              professionSpecialization: data.professionSpecialization || '',
              professionRank: data.professionRank || data.professionLevel || '',
              professionLevel: data.professionLevel || '',
              secondaryProfessions: data.secondaryProfessions || [],
              jobTitle: data.jobTitle || '',
              professionDescription: data.professionDescription || '',
              craftingSkills: data.craftingSkills || '',
              talents: data.talents || '',
              everydaySkills: data.everydaySkills || '',
              toolsAndEquipment: data.toolsAndEquipment || '',
              gender: data.appearance?.gender || 'Unbekannt',
              age: data.appearance?.age || '',
              build: data.appearance?.build || '',
              race: data.appearance?.race || 'Mensch',
              raceFeatures: data.appearance?.raceFeatures || 'keine',
              hairColor: data.appearance?.hairColor || '',
              eyeColor: data.appearance?.eyeColor || '',
              cupSize: data.appearance?.cupSize || '-',
              height: data.appearance?.height || '',
              measurements: data.appearance?.measurements || '',
              weight: data.appearance?.weight || '',
              bodyFat: data.appearance?.bodyFat || '',
              muscleMass: data.appearance?.muscleMass || '',
              currentLocation: data.appearance?.currentLocation || '',
              origin: data.appearance?.origin || '',
              family: data.appearance?.family || '',
              faction: data.appearance?.faction || '',
              outfit: data.appearance?.outfit || '',
              looks: data.appearance?.looks || '',
              appearance: data.appearance || {},
              personality: data.personality || '',
              personalityArchetype: finalArchetype,
              archetype: finalArchetype,
              personalityTraits: finalTraits,
              bio: finalBio,
              goal: data.goal || '',
              motivationCore: data.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
              goals: (() => {
                const rawGenGoals = Array.isArray(data.goals) ? data.goals : [];
                const mappedGenGoals = rawGenGoals.map((g: any) => mapGoalWithStages(g, data.goal || data.motivationCore?.mainGoal, data.motivationCore));
                if (mappedGenGoals.length > 0) return mappedGenGoals;
                if (currentDetails.goals && currentDetails.goals.length > 0) return currentDetails.goals;
                if (data.goal || data.motivationCore?.mainGoal) {
                  return [mapGoalWithStages({
                    id: `goal-${Date.now()}`,
                    title: data.goal || data.motivationCore?.mainGoal,
                    timeframe: 'langfristig',
                    targetType: 'self',
                    targetName: 'Selbst',
                    priority: 'hoch',
                    status: 'aktiv',
                    shortTermPlan: data.motivationCore?.shortTermPlan || data.shortTermPlan || '',
                    mediumTermPlan: data.motivationCore?.mediumTermPlan || data.mediumTermPlan || '',
                    longTermPlan: data.motivationCore?.longTermPlan || data.longTermPlan || '',
                  }, data.goal || data.motivationCore?.mainGoal, data.motivationCore)];
                }
                return [];
              })(),
              currentSituation: data.currentSituation || '',
              relationship: data.relationship || '',
              conduct: data.conduct || '',
              skills: data.skills || '',
              powerSource: data.powerSource || '',
              powerCost: data.powerCost || '',
              techniques: data.techniques || '',
              abilities: generatedAbilities,
              techniqueList: Array.isArray(data.techniqueList) ? data.techniqueList : [],
              relationships: normalizeRelationships(data.relationships),
              campaignPowerLevels: data.campaignPowerLevels || data.campaignPowerData || {},
              campaignPowerData: data.campaignPowerData || data.campaignPowerLevels || {},
              powerSources: (data.powerSource || data.powerCost)
                ? [{ id: `${Date.now()}-ps-0`, name: data.powerSource || 'Hauptkraft', source: data.powerSource || '', cost: data.powerCost || '', powerName: data.powerSource || '' }]
                : [],
              inventory: buildInventoryFromData(data.structuredInventory, currentDetails.inventory, false),
              secretsStage1: nextSecrets1,
              secretsStage2: nextSecrets2,
              secretsStage3: nextSecrets3,
              knowledge: nextKnowledge,
              expressions: {}
            };

            const { powerSources: normalizedPs, baseAbilities: normalizedBa, techniques: normalizedTech } = normalizeAbilityHierarchy(newDetails);
            newDetails = syncCharacterAbilityTree(newDetails, normalizedPs, normalizedBa, normalizedTech);
          }

          return {
            ...prev,
            title: finalTitle,
            description: (smartFillTargetSection === 'all' || smartFillTargetSection === 'bio') ? (data.bio || finalBio) : (prev.description || finalBio),
            secretsStage1: (smartFillTargetSection === 'all' || smartFillTargetSection === 'secrets') ? nextSecrets1 : (prev.secretsStage1 || nextSecrets1),
            secretsStage2: (smartFillTargetSection === 'all' || smartFillTargetSection === 'secrets') ? nextSecrets2 : (prev.secretsStage2 || nextSecrets2),
            secretsStage3: (smartFillTargetSection === 'all' || smartFillTargetSection === 'secrets') ? nextSecrets3 : (prev.secretsStage3 || nextSecrets3),
            knowledge: (smartFillTargetSection === 'all' || smartFillTargetSection === 'secrets') ? nextKnowledge : (prev.knowledge || nextKnowledge),
            details: newDetails
          };
        });

        let targetTab: 'profil' | 'beziehungen' | 'kampffaehigkeiten' | 'beruf_talente' | 'besitz_inventar' = 'profil';
        if (['appearance', 'personality', 'bio', 'situation', 'secrets'].includes(smartFillTargetSection)) {
          targetTab = 'profil';
        } else if (['motivation', 'goals', 'relationships'].includes(smartFillTargetSection)) {
          targetTab = 'beziehungen';
        } else if (smartFillTargetSection === 'combat') {
          targetTab = 'kampffaehigkeiten';
        } else if (smartFillTargetSection === 'professions') {
          targetTab = 'beruf_talente';
        } else if (smartFillTargetSection === 'inventory') {
          targetTab = 'besitz_inventar';
        } else {
          targetTab = 'profil';
        }
        setCharTab(targetTab);
      }
    } catch (e: any) {
      console.error("Smart Fill Error:", e);
      const rawMsg = e?.message || String(e || '');
      setSmartFillError(rawMsg || "Fehler beim automatischen Ausfüllen. Bitte kurz warten und erneut versuchen.");
    } finally {
      setIsSmartFilling(false);
    }
  };

  const handleGenerateMotivationCore = async () => {
    const charName = editForm.title || editForm.details?.callName || 'Charakter';
    setIsGeneratingMotivationCore(true);
    try {
      const generated = await GeminiService.autofillMotivationCore(
        charName,
        editForm.details?.role,
        editForm.description || editForm.details?.bio,
        editForm.details?.personality,
        editForm.details?.motivationCore,
        undefined,
        world
      );

      if (generated) {
        setEditForm(prev => {
          const currentDetails = prev.details || {};
          const currentCore = currentDetails.motivationCore || {};
          const nextCore = { ...currentCore, ...generated };

          return {
            ...prev,
            details: {
              ...currentDetails,
              goal: generated.mainGoal || currentDetails.goal || '',
              motivationCore: nextCore
            }
          };
        });
      }
    } catch (err) {
      console.error("Fehler beim Generieren des Motivationskerns:", err);
    } finally {
      setIsGeneratingMotivationCore(false);
    }
  };

  const getGoals = (): CharacterGoal[] => {
    const currentGoals = editForm.details?.goals;
    if (Array.isArray(currentGoals)) {
      return currentGoals;
    }
    return [];
  };

  const updateGoals = (updatedGoals: CharacterGoal[]) => {
    setEditForm(prev => {
      const curDetails = prev.details || {};
      return {
        ...prev,
        details: {
          ...curDetails,
          goals: updatedGoals
        }
      };
    });
  };

  const codexCharactersForGoals = useMemo(() => {
    const chars: { id: string; title: string }[] = [];
    const effectivePlayerName = playerName?.trim() || world?.playerCharacter?.name?.trim();
    const isEditingPlayer = effectivePlayerName && editForm.title?.trim().toLowerCase() === effectivePlayerName.toLowerCase();

    if (!isEditingPlayer) {
      chars.push({
        id: 'player_user',
        title: effectivePlayerName ? `Spieler: ${effectivePlayerName}` : 'Spieler / Nutzer'
      });
    }

    const otherChars = lore
      .filter(item => item.category === 'Charaktere' && item.title?.trim().toLowerCase() !== editForm.title?.trim().toLowerCase())
      .filter(item => !effectivePlayerName || item.title?.trim().toLowerCase() !== effectivePlayerName.toLowerCase())
      .map(c => ({ id: c.id, title: c.title }));

    return [...chars, ...otherChars];
  }, [lore, editForm.title, playerName, world?.playerCharacter?.name]);

  const codexFactionsForGoals = useMemo(() => {
    return lore
      .filter(item => item.category === 'Fraktionen')
      .map(f => ({ id: f.id, title: f.title }));
  }, [lore]);

  const handleGenerateGoalsAI = async (userNotes?: any) => {
    setIsGeneratingGoalsAI(true);
    try {
      const safeNotes = typeof userNotes === 'string' ? userNotes.trim() : undefined;
      const existingGoals = getGoals();
      const codexCharNames = lore
        .filter(c => c.category === 'Charaktere' && c.title?.trim().toLowerCase() !== editForm.title?.trim().toLowerCase())
        .map(c => c.title);
      const codexFactionNames = lore
        .filter(c => c.category === 'Fraktionen')
        .map(c => c.title);

      const generated = await GeminiService.autofillCharacterGoals(
        editForm.title || editForm.details?.callName || 'Charakter',
        editForm.details?.role,
        editForm.description || editForm.details?.bio,
        editForm.details?.personality,
        editForm.details?.motivationCore,
        existingGoals,
        getRelationships(),
        codexCharNames,
        codexFactionNames,
        playerName,
        safeNotes,
        world
      );

      if (generated && generated.length > 0) {
        const existingIds = new Set(existingGoals.map(g => g.id));
        const merged = [...existingGoals];
        for (const gen of generated) {
          if (!existingIds.has(gen.id)) {
            merged.push(gen);
          }
        }
        updateGoals(merged);
      }
    } catch (err) {
      console.error('Fehler beim Generieren der Charakter-Ziele:', err);
    } finally {
      setIsGeneratingGoalsAI(false);
    }
  };

  const handleGenerateGoalsForMainGoal = async (mainGoalText: string, targetType: any = 'self', targetName?: string, targetId?: string) => {
    if (!mainGoalText.trim()) return;
    setIsGeneratingGoalsAI(true);
    try {
      const existingGoals = getGoals();
      const codexCharNames = lore
        .filter(c => c.category === 'Charaktere' && c.title?.trim().toLowerCase() !== editForm.title?.trim().toLowerCase())
        .map(c => c.title);
      const codexFactionNames = lore
        .filter(c => c.category === 'Fraktionen')
        .map(c => c.title);

      const generated = await GeminiService.generateGoalsForMainGoal({
        mainGoal: mainGoalText.trim(),
        targetType,
        targetName,
        targetId,
        characterName: editForm.title || editForm.details?.callName || 'Charakter',
        characterRole: editForm.details?.role,
        characterBio: editForm.description || editForm.details?.bio,
        characterPersonality: editForm.details?.personality,
        motivationCore: editForm.details?.motivationCore,
        relationships: getRelationships(),
        availableCharacters: codexCharNames,
        availableFactions: codexFactionNames,
        playerName,
        worldContext: world
      });

      if (generated && generated.length > 0) {
        updateGoals([...existingGoals, ...generated]);
      }
    } catch (err) {
      console.error('Fehler beim Generieren der Etappenziele für das Hauptziel:', err);
    } finally {
      setIsGeneratingGoalsAI(false);
    }
  };

  const handleGenerateCharacterAI = async () => {
    setIsGeneratingChar(true);
    try {
      const data = await GeminiService.autofillCharacter(
        editForm.title || 'Zufälliger Charakter',
        worldPowerSettings,
        undefined,
        world
      );

      if (data) {
        setEditForm(prev => {
          const currentDetails = prev.details || {};
          return {
            ...prev,
            title: prev.title || data.name || 'Charakter',
            description: prev.description || data.bio || data.personality || '',
            details: {
              ...currentDetails,
              callName: currentDetails.callName || data.name || '',
              role: currentDetails.role || data.role || '',
              gender: currentDetails.gender || data.appearance?.gender || 'Weiblich',
              age: currentDetails.age || data.appearance?.age || '22',
              race: currentDetails.race || data.appearance?.race || 'Mensch',
              build: currentDetails.build || data.appearance?.build || 'Schlank',
              hairColor: currentDetails.hairColor || data.appearance?.hairColor || '',
              eyeColor: currentDetails.eyeColor || data.appearance?.eyeColor || '',
              looks: currentDetails.looks || data.appearance?.looks || '',
              outfit: currentDetails.outfit || data.appearance?.outfit || '',
              personality: currentDetails.personality || data.personality || '',
              bio: currentDetails.bio || data.bio || '',
              goal: currentDetails.goal || data.goal || '',
              motivationCore: data.motivationCore || currentDetails.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
              goals: data.goals || currentDetails.goals || []
            }
          };
        });
      }
    } catch (e) {
      console.error("Character Gen Error:", e);
    } finally {
      setIsGeneratingChar(false);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!editForm.title) return;
    setIsGeneratingPortrait(true);
    try {
      const prompt = `${editForm.title}, ${editForm.details?.gender || ''} ${editForm.details?.race || ''} ${editForm.details?.role || ''}, ${editForm.details?.looks || ''}, high quality fantasy character portrait, expressive`;
      const imgUrl = await GeminiService.generateImage(prompt);
      if (imgUrl) {
        setEditForm(prev => ({
          ...prev,
          image: imgUrl,
          expressions: {
            ...(prev.expressions || {}),
            neutral: imgUrl
          }
        }));
      }
    } catch (e) {
      console.error("Portrait Gen Error:", e);
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleGenerateNPCExpression = async (exprKey: string) => {
    if (!editForm.title) return;
    setGeneratingExpression(exprKey);
    try {
      const baseDesc = `${editForm.title}, ${editForm.details?.gender || ''} ${editForm.details?.race || ''}, ${editForm.details?.looks || ''}`;
      const exprPrompts: Record<string, string> = {
        neutral: 'neutral calm expression',
        happy: 'happy smiling cheerful expression',
        sad: 'sad melancholic crying expression',
        angry: 'angry furious aggressive shouting expression',
        surprised: 'surprised shocked wide-eyed expression',
        blushing: 'blushing embarrassed shy cute expression'
      };
      const prompt = `${baseDesc}, ${exprPrompts[exprKey] || exprKey}, high quality fantasy character portrait, facial expression, face closeup`;
      const imgUrl = await GeminiService.generateImage(prompt);
      if (imgUrl) {
        setEditForm(prev => {
          const nextExpr = { ...(prev.expressions || {}), [exprKey]: imgUrl };
          const nextDetailsExpr = { ...(prev.details?.expressions || {}), [exprKey]: imgUrl };
          return {
            ...prev,
            image: exprKey === 'neutral' ? imgUrl : prev.image,
            expressions: nextExpr,
            details: {
              ...(prev.details || {}),
              expressions: nextDetailsExpr
            }
          };
        });
      }
    } catch (e) {
      console.error("Expression Gen Error:", e);
    } finally {
      setGeneratingExpression(null);
    }
  };

  const handleUploadNPCExpression = (exprKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setEditForm(prev => {
          const nextExpr = { ...(prev.expressions || {}), [exprKey]: result };
          const nextDetailsExpr = { ...(prev.details?.expressions || {}), [exprKey]: result };
          return {
            ...prev,
            image: exprKey === 'neutral' ? result : prev.image,
            expressions: nextExpr,
            details: {
              ...(prev.details || {}),
              expressions: nextDetailsExpr
            }
          };
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractInventory = async () => {
    setIsExtractingInventory(true);
    try {
      const tempCharForExtraction = {
        name: editForm.title || '',
        role: editForm.details?.role || '',
        appearance: {
          outfit: getAppearanceValue('outfit') || ''
        } as any,
        bio: editForm.description || '',
        skills: editForm.details?.skills || '',
        techniques: editForm.details?.techniques || ''
      } as any;
      const inv = await GeminiService.extractStructuredInventory(tempCharForExtraction, world);
      if (inv) {
        setStructuredInventory(inv);
      }
    } catch (e) {
      console.error("Inventory Extract Error:", e);
    } finally {
      setIsExtractingInventory(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-2xl flex flex-col gap-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm">
              <i className="fa-solid fa-user-gear text-xs"></i>
            </span>
            <h3 className="text-base md:text-lg font-bold text-slate-100">
              {isEditing ? `Eintrag bearbeiten: ${editForm.title || ''}` : 'Neuer Eintrag (Charaktere)'}
            </h3>
            {editForm.details?.inventory && (
              <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 rounded text-[10px] text-sky-400 font-bold">
                Inventar Geladen
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestalte Erscheinung, Biografie, Persönlichkeit, Beziehungen und Kampffähigkeiten dieses Charakters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(null);
                setEditForm({ category: 'Charaktere' });
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              Neuen Eintrag erstellen
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerateCharacterAI}
            disabled={isGeneratingChar}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isGeneratingChar ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            <span>KI Charakter</span>
          </button>
          <button
            type="button"
            onClick={handleGeneratePortrait}
            disabled={isGeneratingPortrait || !editForm.title}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isGeneratingPortrait ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-image"></i>}
            <span>KI Portrait</span>
          </button>
        </div>
      </div>

      {/* 5 Main Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => setCharTab('profil')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px] ${
            charTab === 'profil'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-user-gear"></i>
          <span>1. Profil &amp; Aussehen</span>
        </button>

        <button
          type="button"
          onClick={() => setCharTab('beziehungen')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px] ${
            charTab === 'beziehungen'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-people-arrows"></i>
          <span>2. Beziehungen, Motivation &amp; Ziele</span>
          {(getRelationships().length > 0 || getGoals().length > 0) && (
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${charTab === 'beziehungen' ? 'bg-slate-950 text-amber-500' : 'bg-slate-900 text-slate-400'}`}>
              {getRelationships().length + getGoals().length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCharTab('kampffaehigkeiten')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px] ${
            charTab === 'kampffaehigkeiten'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-bolt"></i>
          <span>3. Kampffähigkeiten</span>
        </button>

        <button
          type="button"
          onClick={() => setCharTab('beruf_talente')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px] ${
            charTab === 'beruf_talente'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-graduation-cap"></i>
          <span>4. Berufe &amp; Talente</span>
        </button>

        <button
          type="button"
          onClick={() => setCharTab('besitz_inventar')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px] ${
            charTab === 'besitz_inventar'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-briefcase"></i>
          <span>5. Besitz / Inventar</span>
          {((structuredInventory?.customItems?.length || 0) > 0 || (structuredInventory?.weapons?.length || 0) > 0) && (
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${charTab === 'besitz_inventar' ? 'bg-slate-950 text-amber-500' : 'bg-slate-900 text-slate-400'}`}>
              {(structuredInventory?.customItems?.length || 0) + (structuredInventory?.weapons?.length || 0)}
            </span>
          )}
        </button>
      </div>

      {/* Smart Fill Section */}
      <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>SMART FILL CHARAKTER</span>
          </span>
          <button 
            type="button"
            onClick={handleSmartFill}
            disabled={isSmartFilling || (!smartFillText.trim() && !editForm.title?.trim())}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <i className={`fa-solid ${isSmartFilling ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
            <span>Automatisch Ausfüllen</span>
          </button>
        </div>

        {/* 2 Eingabefeld-Menüs im exakten Stil von Geschlecht / Statur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
              Charakter
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-indigo-500"
              value={smartFillSelectedChar}
              onChange={e => handleSelectCharacter(e.target.value)}
            >
              <option value="new">Neuer Charakter (Freitext)</option>
              {isEditing && editForm.title && (
                <option value="current">Aktueller Eintrag: {editForm.title}</option>
              )}
              {savedCharacters.length > 0 && (
                <optgroup label="Gespeicherte Charaktere">
                  {savedCharacters.map((char, cIdx) => (
                    <option key={`char-opt-${char.id}-${cIdx}`} value={char.id}>
                      {char.title}{char.details?.role ? ` (${char.details.role})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {playerName && !savedCharacters.some(c => c.title?.toLowerCase() === playerName.toLowerCase()) && (
                <option value="player">Spieler: {playerName}</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
              Zu bearbeitender Bereich
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-indigo-500"
              value={smartFillTargetSection}
              onChange={e => setSmartFillTargetSection(e.target.value)}
            >
              {TARGET_SECTIONS.map((sec, sIdx) => (
                <option key={`sec-opt-${sec.id}-${sIdx}`} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AutoExpandingTextarea 
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
          placeholder={smartFillSelectedChar === 'new' ? 'Name und Beschreibung des neuen Charakters eingeben (z. B. Rolle, Aussehen, Persönlichkeit, Kräfte, Herkunft, Beziehungen)...' : getSmartFillPlaceholder()} 
          value={smartFillText} 
          onChange={e => setSmartFillText(e.target.value)} 
        />

        {smartFillError && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-200 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
              <span>{smartFillError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSmartFillError(null)}
              className="text-amber-400 hover:text-amber-200 text-xs px-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {smartFillSelectedChar !== 'new' && (
          <div className="flex items-center gap-2 px-1 select-none">
            <input 
              type="checkbox" 
              id="keepExistingCharacterDetailsCheckbox"
              checked={keepExistingDetails} 
              onChange={e => setKeepExistingDetails(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-indigo-600"
            />
            <label htmlFor="keepExistingCharacterDetailsCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
              <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Charakter-Daten behalten und neue Informationen hinzufügen
            </label>
          </div>
        )}
      </div>

      {/* TAB 1: PROFIL & AUSSEHEN */}
      {charTab === 'profil' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Porträts (Gesichtsausdrücke) */}
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
                const currentImg = editForm.expressions?.[expr.key] || editForm.details?.expressions?.[expr.key] || (expr.key === 'neutral' ? editForm.image : undefined);
                const isGeneratingThis = generatingExpression === expr.key;

                return (
                  <div key={expr.key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 text-center group/card">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {expr.label}
                    </span>

                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                      {currentImg ? (
                        <>
                          <img src={currentImg} alt={expr.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => {
                              setEditForm(prev => {
                                const nextExpr = { ...(prev.expressions || {}) };
                                delete nextExpr[expr.key];
                                const nextDetailsExpr = { ...(prev.details?.expressions || {}) };
                                delete nextDetailsExpr[expr.key];
                                const updated = { 
                                  ...prev, 
                                  expressions: nextExpr,
                                  details: { ...(prev.details || {}), expressions: nextDetailsExpr }
                                };
                                if (expr.key === 'neutral') {
                                  updated.image = undefined;
                                }
                                return updated;
                              });
                            }} 
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow transition-all cursor-pointer"
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
                        type="button"
                        disabled={isGeneratingThis || !editForm.title}
                        onClick={() => handleGenerateNPCExpression(expr.key)}
                        className="w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-[10px] font-bold text-amber-500 rounded border border-amber-500/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
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
                            if (file) handleUploadNPCExpression(expr.key, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Basic Fields (4 Columns) */}
          <div className="flex flex-col gap-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>Name des Charakters</span>
                  <span className="text-amber-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editForm.title || ''} 
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Name des Charakters eingeben..." 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>Rufname (Kampfanzeige)</span>
                  <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input 
                  type="text" 
                  value={getDetail('callName', editForm.title || '')} 
                  onChange={e => updateDetail('callName', e.target.value)}
                  placeholder={editForm.title ? editForm.title.split(' ')[0] : 'Rufname oder Kurzform (Standard: Name)'} 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Spitzname / Titel / Alias
                </label>
                <input 
                  type="text" 
                  value={getDetail('nickname', '')} 
                  onChange={e => updateDetail('nickname', e.target.value)}
                  placeholder="Spitzname, Alias oder Titel eingeben..." 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Rolle / Beruf
                  </label>
                  <button
                    type="button"
                    onClick={() => setCharTab('beruf_talente')}
                    className="text-[10px] text-amber-400/90 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                    title="Zu 4. Berufe & Talente wechseln"
                  >
                    In Berufe & Talente anpassen
                  </button>
                </div>

                <div
                  onClick={() => setCharTab('beruf_talente')}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-white transition-all cursor-pointer min-h-[46px] flex flex-col justify-center gap-1 group shadow-inner"
                  title="Klicken, um Berufe & Talente zu öffnen"
                >
                  {(getDetail('role', '') || getDetail('profession', '')) ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors break-words">
                          {getDetail('role', '') || getDetail('profession', '')}
                        </span>
                        {(getDetail('professionRank', '') || getDetail('professionLevel', '')) && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 shrink-0">
                            {getDetail('professionRank', '') || getDetail('professionLevel', '')}
                          </span>
                        )}
                      </div>
                      {getDetail('professionField', '') && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                          <span>{getDetail('professionField', '')}</span>
                          {getDetail('professionSpecialization', '') && (
                            <span className="text-slate-500">({getDetail('professionSpecialization', '')})</span>
                          )}
                        </div>
                      )}
                      {Array.isArray(getDetail('secondaryProfessions', [])) && getDetail('secondaryProfessions', []).length > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Nebenberufe: {getDetail('secondaryProfessions', []).map((sp: any) => typeof sp === 'string' ? sp : (sp?.profession || sp?.name)).filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Kein Beruf ausgewählt</span>
                      <span className="text-[10px] text-amber-400/90 group-hover:text-amber-300 font-medium">
                        Auswählen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transformation Switcher */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-masks-theater text-amber-400"></i>
                  <span>Gestalt / Transformations-Auswahl</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  (Definiere Aussehen separat für verschiedene Verwandlungen)
                </span>
              </div>
            </div>

            {activeTransformation && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                  <span>
                    Du bearbeitest gerade die Form <strong className="text-amber-400">&ldquo;{activeTransformation.transformName || activeTransformation.name}&rdquo;</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTransformationId('standard')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  Zurück zur Standardgestalt
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTransformationId('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTransformationId === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <i className="fa-solid fa-user text-[10px]"></i>
                <span>Standardgestalt</span>
              </button>

              {charTransformations.map((t, idx) => (
                <button
                  key={t.id ? `transf-${t.id}-${idx}` : `transf-${idx}`}
                  type="button"
                  onClick={() => setActiveTransformationId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTransformationId === t.id
                      ? 'bg-amber-600 text-white shadow border border-amber-400'
                      : 'bg-slate-950 text-amber-400 hover:bg-slate-900 border border-amber-500/30'
                  }`}
                >
                  <i className="fa-solid fa-bolt text-[10px]"></i>
                  <span>{t.transformName || t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Statur & Erscheinung */}
          <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
              <i className="fa-solid fa-id-card text-amber-400"></i>
              <span>Statur &amp; Erscheinung {activeTransformation ? `(${activeTransformation.transformName || activeTransformation.name})` : ''}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Geschlecht</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  value={getAppearanceValue('gender') || 'Weiblich'} 
                  onChange={e => updateAppearanceValue('gender', e.target.value)}
                >
                  {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Alter</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  placeholder="z.B. 24 Jahre"
                  value={getAppearanceValue('age')} 
                  onChange={e => updateAppearanceValue('age', e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Statur</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  value={getAppearanceValue('build') || 'Schlank'} 
                  onChange={e => updateAppearanceValue('build', e.target.value)}
                >
                  {BUILD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Haarfarbe</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  placeholder="z.B. Rabenschwarz" 
                  value={getAppearanceValue('hairColor')} 
                  onChange={e => updateAppearanceValue('hairColor', e.target.value)} 
                />
              </div>

              <div>
                <EyeColorEditor
                  eyeColor={getAppearanceValue('eyeColor')}
                  hasHeterochromia={getAppearanceValue('hasHeterochromia')}
                  eyeColorLeft={getAppearanceValue('eyeColorLeft')}
                  eyeColorRight={getAppearanceValue('eyeColorRight')}
                  onChange={updates => updateAppearanceMultiple(updates)}
                  labelClassName="text-[10px] text-slate-400 block uppercase font-bold"
                  inputClassName="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Körbchengröße</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  value={getAppearanceValue('cupSize') || "-"} 
                  onChange={e => updateAppearanceValue('cupSize', e.target.value)}
                >
                  {CUP_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Archetyp / Typus</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer" 
                  value={getPersonalityArchetype()} 
                  onChange={e => updatePersonalityArchetype(e.target.value)}
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
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Größe &amp; Körpermaße</label>
                <div className="flex gap-2">
                  <AutoExpandingTextarea 
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                    placeholder="Größe (z.B. 170cm)" 
                    value={getAppearanceValue('height')} 
                    onChange={e => updateAppearanceValue('height', e.target.value)} 
                  />
                  <AutoExpandingTextarea 
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                    placeholder="Maße (z.B. 90-60-90)" 
                    value={getAppearanceValue('measurements')} 
                    onChange={e => updateAppearanceValue('measurements', e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Gewicht, KFA &amp; Muskeln</label>
                <div className="flex gap-1.5">
                  <AutoExpandingTextarea 
                    className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                    placeholder="z.B. 62kg" 
                    value={getAppearanceValue('weight')} 
                    onChange={e => updateAppearanceValue('weight', e.target.value)} 
                  />
                  <AutoExpandingTextarea 
                    className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                    placeholder="KFA (20%)" 
                    value={getAppearanceValue('bodyFat')} 
                    onChange={e => updateAppearanceValue('bodyFat', e.target.value)} 
                  />
                  <AutoExpandingTextarea 
                    className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                    placeholder="Muskeln" 
                    value={getAppearanceValue('muscleMass')} 
                    onChange={e => updateAppearanceValue('muscleMass', e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Rasse</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  placeholder="z.B. Mensch, Dunkelelf" 
                  value={getAppearanceValue('race')} 
                  onChange={e => updateAppearanceValue('race', e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Herkunft</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  placeholder="z.B. Schattenklamm" 
                  value={getAppearanceValue('origin')} 
                  onChange={e => updateAppearanceValue('origin', e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Familie</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500" 
                  placeholder="z.B. Haus Ravencrest" 
                  value={getAppearanceValue('family')} 
                  onChange={e => updateAppearanceValue('family', e.target.value)} 
                />
              </div>

              {/* Fraktion */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Fraktion</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFactionDropdownOpen(!isFactionDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none text-left flex justify-between items-center hover:border-slate-500 transition-all cursor-pointer min-h-[38px]"
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
                          const dbFactions = lore
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

              {/* Aktueller Standort */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold flex justify-between">
                  <span>Aktueller Standort (Weltkarte)</span>
                  {(() => {
                    const createdOrte = Array.from(new Set([...(world?.territories || []).map((t: any) => t.name), ...(world?.regionMarkers || []).map((m: any) => m.name)].filter(Boolean)));
                    return createdOrte.length > 0 ? <span className="text-[9px] text-sky-400 font-normal"><i className="fa-solid fa-earth-americas mr-1"></i>Weltkarte aktiv ({createdOrte.length} Orte)</span> : null;
                  })()}
                </label>
                <LocationSelector
                  value={getAppearanceValue('currentLocation') || ''}
                  onChange={val => updateAppearanceValue('currentLocation', val)}
                  loreDatabase={lore}
                  placeholder="z.B. Schattenklamm"
                  world={world}
                />
              </div>

              {/* Aussehen */}
              <div className="col-span-2 sm:col-span-3">
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                  Aussehen (Gesicht, Haare, besondere Merkmale etc.)
                </label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[50px] outline-none focus:border-amber-500" 
                  placeholder="Z.B. langes schwarzes Haar, Sommersprossen, Narben, stechender Blick..." 
                  value={getAppearanceValue('looks')} 
                  onChange={e => updateAppearanceValue('looks', e.target.value)} 
                />
              </div>

              {/* Outfit */}
              <div className="col-span-2 sm:col-span-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-400 block uppercase font-bold">Kleidung / Outfit</label>
                </div>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[50px] outline-none focus:border-amber-500" 
                  placeholder="z.B. Dunkle Lederrobe, metallbeschlagene Handschuhe, Kapuzenumhang..." 
                  value={getAppearanceValue('outfit')} 
                  onChange={e => updateAppearanceValue('outfit', e.target.value)} 
                />
              </div>

              {/* Rassemerkmale */}
              <div className="col-span-2 sm:col-span-3">
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                  Rassemerkmale (Nicht-menschliche physische Eigenschaften)
                </label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500" 
                  placeholder="z.B. Spitze Ohren, Katzenohren, Schweif, Schuppen, Flügel oder 'keine'" 
                  value={getAppearanceValue('raceFeatures')} 
                  onChange={e => updateAppearanceValue('raceFeatures', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Quick-Link to Tab 5: Besitz & Inventar */}
          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-briefcase text-amber-400 text-sm"></i>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Besitz, Ausrüstung &amp; Spezial-Gegenstände</span>
                <span className="text-[11px] text-slate-400 block">Waffen, Katanas, Rüstungsteile, Finanzen und Inventar-Slots werden in Tab 5 verwaltet.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCharTab('besitz_inventar')}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Zu Besitz / Inventar</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </div>

          {/* Persönlichkeit, Biografie & Hintergründe */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Persönlichkeit
              </label>
              <AutoExpandingTextarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[64px] text-xs outline-none focus:border-amber-500" 
                placeholder={activeTransformation ? `Persönlichkeit (${activeTransformation.transformName || activeTransformation.name})...` : "Persönlichkeit (z.B. mutig, loyal, nachdenklich, charmant)..."} 
                value={getAppearanceValue('personality')} 
                onChange={e => updateAppearanceValue('personality', e.target.value)} 
              />
            </div>
            
            {/* 24 Persönlichkeitsmerkmale */}
            <PersonalityTraitsEditor
              traits={getPersonalityTraits()}
              onChange={traits => updatePersonalityTraits(traits)}
              archetype={getPersonalityArchetype()}
              onArchetypeChange={archetype => updatePersonalityArchetype(archetype)}
              title={activeTransformation ? `Persönlichkeitsmerkmale (${activeTransformation.transformName || activeTransformation.name})` : "Persönlichkeitsmerkmale"}
              subtitle="Quantitative Einstufung der Charaktereigenschaften auf einer Skala von 0 bis 100"
            />

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Vergangenheit / Biografie
              </label>
              <AutoExpandingTextarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[110px] text-xs outline-none focus:border-amber-500" 
                placeholder={activeTransformation ? `Vergangenheit / Biografie (${activeTransformation.transformName || activeTransformation.name})...` : "Herkunft, Kindheit, wichtige Bezugspersonen, Schlüsselereignisse, Werdegang, prägende Erfahrungen..."} 
                value={getAppearanceValue('bio')} 
                onChange={e => updateAppearanceValue('bio', e.target.value)} 
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Aktuelle Situation
              </label>
              <AutoExpandingTextarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[70px] text-xs outline-none focus:border-amber-500" 
                placeholder={activeTransformation ? `Aktuelle Situation (${activeTransformation.transformName || activeTransformation.name})...` : "Aktuelle Lage, Herausforderungen, Motivation..."} 
                value={getAppearanceValue('currentSituation')} 
                onChange={e => updateAppearanceValue('currentSituation', e.target.value)} 
              />
            </div>

            {/* Hinweis auf Tab 2 (Beziehungen, Motivation & Ziele) */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between gap-3 mt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs shrink-0">
                  <i className="fa-solid fa-bullseye text-[11px]"></i>
                </span>
                <div>
                  <span className="font-bold text-slate-200 block">Motivationskern, Ziele &amp; Beziehungen</span>
                  <span className="text-[11px] text-slate-400">
                    Werden zentral in Tab 2 verwaltet: Hauptziel, Ängste, Werte, Zeithorizonte und Pläne.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCharTab('beziehungen')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Zu Tab 2 wechseln</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>

            {/* Geheimnis-Stufen (Verborgenes Wissen) */}
            <div className="bg-slate-950/60 border border-purple-900/30 p-4 rounded-xl flex flex-col gap-3 mt-2">
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
                    placeholder="Was als Gerücht über diesen Charakter bekannt ist..."
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-400/80 font-bold uppercase">Stufe 2 (Eingeweiht)</label>
                  <AutoExpandingTextarea
                    value={editForm.secretsStage2 || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
                    placeholder="Was Vertraute und Eingeweihte wissen..."
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-400/80 font-bold uppercase">Stufe 3 (Die Wahrheit)</label>
                  <AutoExpandingTextarea
                    value={editForm.secretsStage3 || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
                    placeholder="Die absolute verborgene Wahrheit..."
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BEZIEHUNGEN, MOTIVATION & ZIELE */}
      {charTab === 'beziehungen' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {activeTransformation && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-bolt text-amber-400"></i>
                <span>
                  Du bearbeitest gerade die Beziehungen, Motivation &amp; Ziele für die aktive Form <strong className="text-amber-400">&ldquo;{activeTransformation.transformName || activeTransformation.name}&rdquo;</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTransformationId('standard')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
              >
                Zurück zur Standardgestalt
              </button>
            </div>
          )}

          {/* 1. MOTIVATIONSKERN & HANDLUNGSANTRIEB */}
          <CharacterMotivationPanel
            motivationCore={editForm.details?.motivationCore || (editForm.details?.goal ? { mainGoal: editForm.details.goal } : undefined)}
            mainGoalSync={editForm.details?.goal || ''}
            onChange={(updatedCore) => {
              setEditForm(prev => {
                const curDetails = prev.details || {};
                const newMainGoal = updatedCore.mainGoal !== undefined ? updatedCore.mainGoal : (curDetails.goal || '');
                return {
                  ...prev,
                  details: {
                    ...curDetails,
                    goal: newMainGoal,
                    motivationCore: updatedCore
                  }
                };
              });
            }}
            onGenerateAI={handleGenerateMotivationCore}
            isGenerating={isGeneratingMotivationCore}
            isOpen={isMotivationOpen}
            onToggleOpen={() => setIsMotivationOpen(prev => !prev)}
          />

          {/* 2. ZIELE & PLÄNE */}
          <CharacterGoalsPanel
            goals={getGoals()}
            onChange={updateGoals}
            motivationCore={editForm.details?.motivationCore}
            codexCharacters={codexCharactersForGoals}
            codexFactions={codexFactionsForGoals}
            relationships={getRelationships()}
            playerName={playerName || world?.playerCharacter?.name}
            characterName={editForm.title || editForm.details?.callName || 'Charakter'}
            sourceCharacterName={editForm.title || editForm.details?.callName || 'Charakter'}
            onGenerateAI={handleGenerateGoalsAI}
            onGenerateMainGoalAI={handleGenerateGoalsForMainGoal}
            isGeneratingAI={isGeneratingGoalsAI}
            isOpen={isGoalsOpen}
            onToggleOpen={() => setIsGoalsOpen(prev => !prev)}
          />

          {/* 3. BEZIEHUNGEN & VERHALTEN ZU ANDEREN */}
          <div className="flex flex-col gap-3 bg-slate-900/40 p-5 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1 flex-wrap gap-2">
              <div 
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setIsRelationshipsOpen(prev => !prev)}
              >
                <i className={`fa-solid fa-chevron-right text-xs text-slate-400 transition-transform ${isRelationshipsOpen ? 'rotate-90' : ''}`}></i>
                <div>
                  <span className="text-sm text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-people-arrows text-amber-500"></i>
                    <span>Beziehungen &amp; Verhalten zu anderen {activeTransformation ? `(${activeTransformation.transformName || activeTransformation.name})` : ''}</span>
                    {getRelationships().length > 0 && (
                      <span className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded-full text-[10px] font-bold">
                        {getRelationships().length}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">Wer ist dieser Charakter für andere und wie verhält er sich zu ihnen?</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isRelationshipsOpen) setIsRelationshipsOpen(true);
                  const currentRels = getRelationships();
                  const newRel: CharacterRelationship = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    targetCharacter: '',
                    type: '',
                    behavior: '',
                    sharedPast: '',
                    _isCustom: false
                  };
                  const updatedList = [...currentRels, newRel];
                  updateRelationships(updatedList);
                  if (editForm.title?.trim()) {
                    const synced = syncLoreWithReciprocalRelationships(lore, editForm.title.trim(), updatedList);
                    onUpdateLore(synced);
                  }
                }}
                className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600/30 transition-all font-sans cursor-pointer"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Eintrag hinzufügen
              </button>
            </div>

            {isRelationshipsOpen && (
              <>
                {getRelationships().length === 0 ? (
                  <div className="text-xs text-slate-400 italic px-2 py-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                    Bisher keine Beziehungen angelegt. Klicke oben auf &ldquo;+ Eintrag hinzufügen&rdquo;, um eine Beziehung zu einem NPC, Spieler oder einer Fraktion zu definieren.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getRelationships().map((rel, idx) => {
                      const codexCharacters = lore
                        .filter(item => item.category === 'Charaktere' && item.title?.trim().toLowerCase() !== editForm.title?.trim().toLowerCase())
                        .map(c => ({ id: c.id, title: c.title }));

                      return (
                        <RelationshipDetailEditor
                          key={`rel-char-${rel.id || 'r'}-${idx}`}
                          rel={rel}
                          idx={idx}
                          sourceCharacterName={editForm.title || 'Charakter'}
                          codexCharacters={codexCharacters}
                          playerName={playerName}
                          world={world}
                          allLoreEntries={lore}
                          onChange={updated => {
                            const newList = [...getRelationships()];
                            newList[idx] = updated;
                            updateRelationships(newList);
                            if (editForm.title?.trim()) {
                              const synced = syncLoreWithReciprocalRelationships(lore, editForm.title.trim(), newList);
                              onUpdateLore(synced);
                            }
                          }}
                          onDelete={() => {
                            const rels = getRelationships();
                            const relToDelete = rels[idx];
                            const newList = rels.filter(r => r.id !== rel.id);
                            updateRelationships(newList);
                            if (editForm.title?.trim() && relToDelete?.targetCharacter) {
                              const synced = removeCounterpartRelationshipFromLore(lore, editForm.title.trim(), relToDelete.targetCharacter);
                              onUpdateLore(synced);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KAMPFFÄHIGKEITEN */}
      {charTab === 'kampffaehigkeiten' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-300">Fähigkeiten, Kräfte &amp; Kampfeinstufung</h4>
            </div>

            {/* Macht- & Kampfeinstufung (CharacterPowerRadar) */}
            {worldPowerSettings && Object.keys(worldPowerSettings).length > 0 && (
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-chart-pie text-amber-400"></i>
                  <span>Macht- &amp; Kampfeinstufung (Power-Level)</span>
                </div>
                <CharacterPowerRadar
                  worldPowerSettings={worldPowerSettings || world?.campaignPowerSettings}
                  characterData={editForm.details?.campaignPowerData || editForm.details?.campaignPowerLevels || {}}
                  onChange={newData => {
                    updateMultipleDetails({
                      campaignPowerData: newData,
                      campaignPowerLevels: newData
                    });
                  }}
                />
              </div>
            )}

            {/* Einheitliche Fähigkeiten- & Techniken-Hierarchie */}
            {(() => {
              const { powerSources, baseAbilities, techniques } = normalizeAbilityHierarchy(editForm.details || {});
              return (
                <TechniqueHierarchyTree
                  powerSources={powerSources}
                  baseAbilities={baseAbilities}
                  techniques={techniques}
                  progressionLogic={world?.techniqueProgressionLogic || 'ep'}
                  world={world}
                  worldPowerSettings={worldPowerSettings || world?.campaignPowerSettings}
                  costResources={world?.costResources}
                  costPowerNames={world?.costPowerNames}
                  onChange={(newPs, newBa, newTech) => {
                    const updated = syncCharacterAbilityTree(editForm.details || {}, newPs, newBa, newTech);
                    updateMultipleDetails(updated);
                  }}
                  characterName={editForm.title || ''}
                  characterRole={getDetail('role', '')}
                  worldTitle={worldTitle}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: BERUFE & TALENTE */}
      {charTab === 'beruf_talente' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-300">Berufe, Talente & Alltagskompetenzen</h4>
            </div>

            <CompetenceProfileEditor
              progressionLogic={world?.techniqueProgressionLogic || 'ep'}
              profession={getDetail('profession', getDetail('role', ''))}
              onProfessionChange={(val, detectedField) => {
                updateMultipleDetails({
                  profession: val,
                  role: val,
                  ...(detectedField ? { professionField: detectedField } : {})
                });
              }}
              professionLevel={getDetail('professionLevel', '')}
              onProfessionLevelChange={val => updateDetail('professionLevel', val)}
              professionField={getDetail('professionField', '')}
              onProfessionFieldChange={val => updateDetail('professionField', val)}
              professionSpecialization={getDetail('professionSpecialization', '')}
              onProfessionSpecializationChange={val => updateDetail('professionSpecialization', val)}
              professionRank={getDetail('professionRank', getDetail('professionLevel', ''))}
              onProfessionRankChange={val => {
                updateDetail('professionRank', val);
                updateDetail('professionLevel', val);
              }}
              professionExperience={getDetail('professionExperience', undefined)}
              onExperienceChange={val => updateDetail('professionExperience', val)}
              professionProficiencyScore={getDetail('professionProficiencyScore', 0)}
              onProfessionProficiencyScoreChange={val => updateDetail('professionProficiencyScore', val)}
              professionExperiencePoints={getDetail('professionExperiencePoints', 0)}
              onProfessionExperiencePointsChange={val => updateDetail('professionExperiencePoints', val)}
              professionExperienceText={getDetail('professionExperienceText', '')}
              onProfessionExperienceTextChange={val => updateDetail('professionExperienceText', val)}
              professionPromotionConditions={getDetail('professionPromotionConditions', '')}
              onProfessionPromotionConditionsChange={val => updateDetail('professionPromotionConditions', val)}
              professionProgress={getDetail('professionProgress', undefined)}
              onProfessionProgressChange={val => updateDetail('professionProgress', val)}
              professionCompetencies={getDetail('professionCompetencies', [])}
              onProfessionCompetenciesChange={val => updateDetail('professionCompetencies', val)}
              socialTitles={getDetail<any[]>('socialTitles', [])}
              onSocialTitlesChange={val => updateDetail('socialTitles', val)}
              offices={getDetail<any[]>('offices', [])}
              onOfficesChange={val => updateDetail('offices', val)}
              positions={getDetail<any[]>('positions', [])}
              onPositionsChange={val => updateDetail('positions', val)}
              socialStatus={getDetail('socialStatus', '')}
              onSocialStatusChange={val => updateDetail('socialStatus', val)}
              craftingSkills={getDetail('craftingSkills', '')}
              onCraftingSkillsChange={val => updateDetail('craftingSkills', val)}
              jobTitle={getDetail('jobTitle', '')}
              onJobTitleChange={val => updateDetail('jobTitle', val)}
              authorities={getDetail<string[]>('authorities', [])}
              onAuthoritiesChange={val => updateDetail('authorities', val)}
              professionDescription={getDetail('professionDescription', '')}
              onProfessionDescriptionChange={val => updateDetail('professionDescription', val)}
              secondaryProfessions={getDetail<any[]>('secondaryProfessions', [])}
              onSecondaryProfessionsChange={val => updateDetail('secondaryProfessions', val)}
              talents={getDetail('talents', '')}
              onTalentsChange={val => updateDetail('talents', val)}
              everydaySkills={getDetail('everydaySkills', '')}
              onEverydaySkillsChange={val => updateDetail('everydaySkills', val)}
              everydaySkillsProficiencyScore={getDetail('everydaySkillsProficiencyScore', 0)}
              onEverydaySkillsProficiencyScoreChange={val => updateDetail('everydaySkillsProficiencyScore', val)}
              everydaySkillsExperienceText={getDetail('everydaySkillsExperienceText', '')}
              onEverydaySkillsExperienceTextChange={val => updateDetail('everydaySkillsExperienceText', val)}
              toolsAndEquipment={getDetail('toolsAndEquipment', '')}
              onToolsAndEquipmentChange={val => updateDetail('toolsAndEquipment', val)}
            />
          </div>
        </div>
      )}

      {/* TAB 5: BESITZ / INVENTAR */}
      {charTab === 'besitz_inventar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <CharacterInventorySection
            structuredInventory={structuredInventory}
            onChangeStructuredInventory={setStructuredInventory}
            characterName={editForm.title || ''}
            characterOutfit={getAppearanceValue('outfit')}
            lore={lore}
            onUpdateLore={onUpdateLore}
            world={world}
            isExtractingInventory={isExtractingInventory}
            onExtractInventory={handleExtractInventory}
          />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(isEditing)}
              className="px-4 py-2 bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-trash"></i>
              <span>Löschen</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!editForm.title?.trim()}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <i className="fa-solid fa-check"></i>
            <span>{isEditing ? 'Eintrag aktualisieren' : 'Im Codex speichern'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
