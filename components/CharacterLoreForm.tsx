import React, { useState, useEffect, useMemo } from 'react';
import { 
  LoreEntry, 
  LoreCategory, 
  CharacterRelationship, 
  CharacterPowerSource, 
  StructuredInventory, 
  PersonalityTraits, 
  CampaignPowerParameter,
  WorldSetting 
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { EyeColorEditor } from './EyeColorEditor';
import { LocationSelector } from './LocationSelector';
import { PersonalityTraitsEditor } from './PersonalityTraitsEditor';
import { RelationshipDetailEditor } from './RelationshipDetailEditor';
import CharacterPowerRadar from './CharacterPowerRadar';
import { GeminiService } from '../services/geminiService';
import { PERSONALITY_ARCHETYPES, applyArchetypeToTraits } from './personalityArchetypesData';
import { syncLoreWithReciprocalRelationships, removeCounterpartRelationshipFromLore } from '../lib/relationshipHelper';

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
  const [charTab, setCharTab] = useState<'profil' | 'beziehungen' | 'kampffaehigkeiten'>('profil');
  const [activeTransformationId, setActiveTransformationId] = useState<string>('standard');
  const [activePowerSourceIdx, setActivePowerSourceIdx] = useState<number>(0);
  const [activeAbilityTab, setActiveAbilityTab] = useState<string>('Techniken');
  const [quickAbilityName, setQuickAbilityName] = useState<string>('');
  
  const [smartFillText, setSmartFillText] = useState<string>('');
  const [isSmartFilling, setIsSmartFilling] = useState<boolean>(false);
  const [keepExistingDetails, setKeepExistingDetails] = useState<boolean>(true);
  
  const [isGeneratingChar, setIsGeneratingChar] = useState<boolean>(false);
  const [isGeneratingMotivationCore, setIsGeneratingMotivationCore] = useState<boolean>(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<boolean>(false);
  const [generatingExpression, setGeneratingExpression] = useState<string | null>(null);
  const [isExtractingInventory, setIsExtractingInventory] = useState<boolean>(false);
  
  const [isFactionDropdownOpen, setIsFactionDropdownOpen] = useState<boolean>(false);
  const [customFactionInput, setCustomFactionInput] = useState<string>('');
  const [openApplicationsDropdown, setOpenApplicationsDropdown] = useState<string | null>(null);

  // Helper to get and update appearance/details
  const getDetail = (key: string, defaultVal: string = '') => {
    return editForm.details?.[key] !== undefined ? editForm.details[key] : defaultVal;
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
    return editForm.details?.archetype || '-';
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
      updateDetail('archetype', archetype);
      if (archetype && archetype !== '-') {
        const currentTraits = editForm.details?.personalityTraits || {};
        updateDetail('personalityTraits', applyArchetypeToTraits(currentTraits, archetype));
      }
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
    return editForm.details?.relationships || [];
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

  // Structured Inventory
  const structuredInventory: StructuredInventory = editForm.details?.inventory || {
    armor: { head: '', chest: '', hands: '', legs: '', feet: '' },
    accessories: { finger: '', neck: '', wrist: '', waist: '', back: '' },
    weapons: [],
    money: 100,
    currencyLabel: 'Goldstücke'
  };

  const setStructuredInventory = (inv: StructuredInventory) => {
    updateDetail('inventory', inv);
  };

  // AI Generation Handlers
  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsSmartFilling(true);
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
          family: l.details?.family || '',
          relation: l.details?.relationship || l.details?.conduct || '',
          description: l.description || ''
        }));

      const existingCharForMerge = keepExistingDetails ? {
        name: editForm.title || '',
        role: editForm.details?.role || '',
        bio: editForm.description || '',
        personality: editForm.details?.personality || '',
        personalityArchetype: editForm.details?.personalityArchetype || '',
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
          origin: editForm.details?.origin || '',
          family: editForm.details?.family || '',
          faction: editForm.details?.faction || '',
          race: editForm.details?.race || '',
          raceFeatures: editForm.details?.raceFeatures || '',
          personalityArchetype: editForm.details?.personalityArchetype
        },
        relationships: editForm.details?.relationships || [],
        abilities: editForm.details?.abilities || [],
        powerSource: editForm.details?.powerSource || '',
        powerCost: editForm.details?.powerCost || '',
        techniques: editForm.details?.techniques || '',
        campaignPowerLevels: editForm.details?.campaignPowerLevels || {}
      } as any : undefined;

      const data = await GeminiService.autofillCharacter(
        smartFillText,
        worldPowerSettings,
        existingCharForMerge,
        world,
        existingFactions,
        existingCodexCharacters
      );

      if (data) {
        setEditForm(prev => {
          const currentDetails = prev.details || {};
          const generatedName = (data.name?.trim()) || (data.callName?.trim()) || (data.rufName?.trim()) || '';
          const finalTitle = keepExistingDetails && prev.title ? prev.title : (generatedName || (prev.title && prev.title.length < 50 ? prev.title : 'Neuer Charakter'));
          const finalBio = keepExistingDetails && prev.description ? prev.description : (data.bio || '');
          const finalArchetype = data.personalityArchetype || data.archetype || (keepExistingDetails ? (currentDetails.personalityArchetype || currentDetails.archetype || '') : '');
          const rawTraits = data.personalityTraits || (keepExistingDetails ? currentDetails.personalityTraits : undefined);
          const finalTraits = finalArchetype && finalArchetype !== '-' ? applyArchetypeToTraits(rawTraits, finalArchetype) : (rawTraits || {});

          let generatedAbilities = keepExistingDetails ? (currentDetails.abilities || []) : [];
          if (data.abilities && Array.isArray(data.abilities)) {
            const mappedAbilities = data.abilities.map((abil: any, aIndex: number) => ({
              id: `${Date.now()}-${aIndex}-${Math.random().toString(36).substr(2, 5)}`,
              name: abil.name || 'Fähigkeit',
              category: abil.category || 'Standard',
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
                    id: `${Date.now()}-${aIndex}-${index}-${Math.random().toString(36).substr(2, 3)}`,
                    name: t.name,
                    description: t.description || '',
                    type: t.type || 'Angriff',
                    subtype: t.subtype || ''
                  }))
                : []
            }));

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

          const newDetails = keepExistingDetails ? {
            ...currentDetails,
            callName: generatedName || currentDetails.callName || finalTitle,
            nickname: data.nickname || currentDetails.nickname || '',
            rufName: data.rufName || currentDetails.rufName || generatedName || '',
            role: data.role || currentDetails.role || '',
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
            origin: data.appearance?.origin || currentDetails.origin || '',
            family: data.appearance?.family || currentDetails.family || '',
            faction: data.appearance?.faction || currentDetails.faction || '',
            outfit: data.appearance?.outfit || currentDetails.outfit || '',
            looks: data.appearance?.looks || currentDetails.looks || '',
            personality: data.personality || currentDetails.personality || '',
            personalityArchetype: finalArchetype,
            archetype: finalArchetype,
            personalityTraits: finalTraits,
            bio: finalBio,
            goal: data.goal || currentDetails.goal || '',
            motivationCore: data.motivationCore || currentDetails.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
            currentSituation: data.currentSituation || currentDetails.currentSituation || '',
            relationship: data.relationship || currentDetails.relationship || '',
            conduct: data.conduct || currentDetails.conduct || '',
            skills: data.skills || currentDetails.skills || '',
            powerSource: data.powerSource || currentDetails.powerSource || '',
            powerCost: data.powerCost || currentDetails.powerCost || '',
            techniques: data.techniques || currentDetails.techniques || '',
            abilities: generatedAbilities,
            relationships: data.relationships || currentDetails.relationships || [],
            campaignPowerLevels: data.campaignPowerLevels || currentDetails.campaignPowerLevels || {},
            secretsStage1: nextSecrets1,
            secretsStage2: nextSecrets2,
            secretsStage3: nextSecrets3,
            knowledge: nextKnowledge
          } : {
            callName: generatedName || finalTitle,
            nickname: data.nickname || '',
            rufName: data.rufName || data.nickname || generatedName || '',
            role: data.role || '',
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
            origin: data.appearance?.origin || '',
            family: data.appearance?.family || '',
            faction: data.appearance?.faction || '',
            outfit: data.appearance?.outfit || '',
            looks: data.appearance?.looks || '',
            personality: data.personality || '',
            personalityArchetype: finalArchetype,
            archetype: finalArchetype,
            personalityTraits: finalTraits,
            bio: finalBio,
            goal: data.goal || '',
            motivationCore: data.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined),
            currentSituation: data.currentSituation || '',
            relationship: data.relationship || '',
            conduct: data.conduct || '',
            skills: data.skills || '',
            powerSource: data.powerSource || '',
            powerCost: data.powerCost || '',
            techniques: data.techniques || '',
            abilities: generatedAbilities,
            relationships: data.relationships || [],
            campaignPowerLevels: data.campaignPowerLevels || {},
            powerSources: (data.powerSource || data.powerCost)
              ? [{ id: `${Date.now()}-ps-0`, name: data.powerSource || 'Hauptkraft', source: data.powerSource || '', cost: data.powerCost || '', powerName: data.powerSource || '' }]
              : [],
            inventory: data.inventory || [],
            secretsStage1: nextSecrets1,
            secretsStage2: nextSecrets2,
            secretsStage3: nextSecrets3,
            knowledge: nextKnowledge,
            expressions: {}
          };

          return {
            ...prev,
            title: finalTitle,
            description: finalBio,
            secretsStage1: nextSecrets1,
            secretsStage2: nextSecrets2,
            secretsStage3: nextSecrets3,
            knowledge: nextKnowledge,
            details: newDetails
          };
        });
      }
    } catch (e) {
      console.error("Smart Fill Error:", e);
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
              motivationCore: data.motivationCore || currentDetails.motivationCore || (data.goal ? { mainGoal: data.goal } : undefined)
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
      const prompt = `${editForm.title}, ${editForm.details?.gender || ''} ${editForm.details?.race || ''} ${editForm.details?.role || ''}, ${editForm.details?.looks || ''}, anime grandia style portrait, high quality, expressive`;
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
      const prompt = `${baseDesc}, ${exprPrompts[exprKey] || exprKey}, anime character portrait, grandia style, face closeup`;
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
            <span className="text-xl">👤</span>
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
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
            >
              Neuen Eintrag erstellen
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerateCharacterAI}
            disabled={isGeneratingChar}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all"
          >
            {isGeneratingChar ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            <span>KI Charakter</span>
          </button>
          <button
            type="button"
            onClick={handleGeneratePortrait}
            disabled={isGeneratingPortrait || !editForm.title}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 transition-all"
          >
            {isGeneratingPortrait ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-image"></i>}
            <span>KI Portrait</span>
          </button>
        </div>
      </div>

      {/* 3 Main Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setCharTab('profil')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            charTab === 'beziehungen'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-people-arrows"></i>
          <span>2. Beziehungen</span>
          {getRelationships().length > 0 && (
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${charTab === 'beziehungen' ? 'bg-slate-950 text-amber-500' : 'bg-slate-900 text-slate-400'}`}>
              {getRelationships().length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCharTab('kampffaehigkeiten')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            charTab === 'kampffaehigkeiten'
              ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <i className="fa-solid fa-bolt"></i>
          <span>3. Kampffähigkeiten</span>
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
            disabled={isSmartFilling || !smartFillText.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <i className={`fa-solid ${isSmartFilling ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
            <span>Automatisch Ausfüllen</span>
          </button>
        </div>

        <AutoExpandingTextarea 
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-indigo-500" 
          placeholder="Beschreibe deinen Charakter, seine Transformationen/Körperveränderungen (was er davor war, seine alten Beziehungen & seine neue Gestalt), Kontakte oder Kampffähigkeiten. Die KI füllt alle Felder in allen Tabs (Profil, Beziehungen & Kampffähigkeiten) perfekt aus." 
          value={smartFillText} 
          onChange={e => setSmartFillText(e.target.value)} 
        />

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
      </div>

      {/* TAB 1: PROFIL & AUSSEHEN */}
      {charTab === 'profil' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grandia 1 style portraits */}
          <div className="bg-slate-800/25 border border-slate-700/60 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Grandia-Porträts (Gesichtsausdrücke)</h3>
                  <p className="text-[11px] text-slate-400">Erstelle verschiedene Gesichtsausdrücke, die im Chat und Dialogen angezeigt werden</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'neutral', label: 'Standard (Neutral)', icon: '😐' },
                { key: 'happy', label: 'Glücklich', icon: '😊' },
                { key: 'sad', label: 'Traurig', icon: '😭' },
                { key: 'angry', label: 'Wütend', icon: '😡' },
                { key: 'surprised', label: 'Überrascht', icon: '😲' },
                { key: 'blushing', label: 'Errötet', icon: '😳' }
              ].map((expr) => {
                const currentImg = editForm.expressions?.[expr.key] || editForm.details?.expressions?.[expr.key] || (expr.key === 'neutral' ? editForm.image : undefined);
                const isGeneratingThis = generatingExpression === expr.key;

                return (
                  <div key={expr.key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 text-center group/card">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <span>{expr.icon}</span> {expr.label}
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
                  placeholder="z.B. Luna Shadowend" 
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
                  placeholder={editForm.title ? editForm.title.split(' ')[0] : 'z.B. Luna'} 
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
                  placeholder="z.B. Die Schattentänzerin" 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Rolle / Beruf
                </label>
                <input 
                  type="text" 
                  value={getDetail('role', '')} 
                  onChange={e => updateDetail('role', e.target.value)}
                  placeholder="z.B. Schattenmagierin, Waldläufer" 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner"
                />
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

              {charTransformations.map(t => (
                <button
                  key={t.id}
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
                    const createdOrte = Array.from(new Set(lore.filter(l => l.category === 'Orte').map(l => l.title).filter(Boolean)));
                    return createdOrte.length > 0 ? <span className="text-[9px] text-sky-400 font-normal"><i className="fa-solid fa-earth-americas mr-1"></i>Weltkarte aktiv</span> : null;
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

          {/* Ausrüstung & Inventar */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-briefcase text-sky-400 text-sm"></i>
                <div>
                  <span className="text-xs text-slate-200 font-bold uppercase tracking-wider block">Ausrüstung &amp; Inventar</span>
                  <span className="text-[10px] text-slate-500 block">Bestimmt das Inventar und die Ausrüstung dieses Charakters.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExtractInventory}
                disabled={isExtractingInventory || !getAppearanceValue('outfit')}
                className="px-2.5 py-1 bg-sky-600/20 border border-sky-500/30 text-sky-400 rounded-lg hover:bg-sky-600/30 transition-all flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                title="Analysiert das Outfit und befüllt die Slots automatisch"
              >
                <i className={`fa-solid ${isExtractingInventory ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i>
                <span>Aus Outfit extrahieren</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Kleidung & Rüstung */}
              <div className="space-y-2">
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-shirt"></i> Kleidung &amp; Rüstung
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Kopf</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Kopfbedeckung"
                      value={structuredInventory?.armor?.head || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          armor: { ...(inv.armor || {}), head: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Brust / Torso</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Oberbekleidung"
                      value={structuredInventory?.armor?.chest || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          armor: { ...(inv.armor || {}), chest: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Hände</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Handschuhe"
                      value={structuredInventory?.armor?.hands || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          armor: { ...(inv.armor || {}), hands: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Beine</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Beinkleidung"
                      value={structuredInventory?.armor?.legs || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          armor: { ...(inv.armor || {}), legs: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Füße</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Schuhwerk"
                      value={structuredInventory?.armor?.feet || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          armor: { ...(inv.armor || {}), feet: e.target.value }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Schmuck & Accessoires */}
              <div className="space-y-2">
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-gem"></i> Schmuck &amp; Accessoires
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Finger</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Ringe"
                      value={structuredInventory?.accessories?.finger || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          accessories: { ...(inv.accessories || {}), finger: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Hals</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Ketten, Amulette"
                      value={structuredInventory?.accessories?.neck || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          accessories: { ...(inv.accessories || {}), neck: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Handgelenke</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Armreifen"
                      value={structuredInventory?.accessories?.wrist || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          accessories: { ...(inv.accessories || {}), wrist: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Taille</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Gürtel, Schärpen"
                      value={structuredInventory?.accessories?.waist || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          accessories: { ...(inv.accessories || {}), waist: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Rücken</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Umhänge, Rucksäcke"
                      value={structuredInventory?.accessories?.back || ''}
                      onChange={e => {
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          accessories: { ...(inv.accessories || {}), back: e.target.value }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Finanzen & Waffen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/60 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Geld</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500 font-mono font-bold"
                      value={structuredInventory?.money ?? 100}
                      onChange={e => {
                        const newMoney = parseInt(e.target.value) || 0;
                        const inv = structuredInventory;
                        setStructuredInventory({
                          ...inv,
                          money: newMoney
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Währung</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                      placeholder="Goldstücke"
                      value={structuredInventory?.currencyLabel || 'Goldstücke'}
                      onChange={e => {
                        const inv = structuredInventory;
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                    placeholder="z.B. Eisendolch, Zauberstab"
                    value={structuredInventory?.weapons ? structuredInventory.weapons.join(', ') : ''}
                    onChange={e => {
                      const inv = structuredInventory;
                      setStructuredInventory({
                        ...inv,
                        weapons: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      });
                    }}
                  />
                </div>
              </div>

              {/* Codex Linked Items */}
              {(() => {
                const charName = editForm.title || '';
                if (!charName) return null;
                const codexItems = lore.filter(item => 
                  item.category === 'Gegenstände' && 
                  item.details?.owner?.trim().toLowerCase() === charName.trim().toLowerCase()
                );
                if (codexItems.length === 0) return null;

                return (
                  <div className="bg-slate-950/70 border border-amber-500/20 rounded-lg p-2.5 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1.5">
                      <i className="fa-solid fa-scroll text-amber-500 text-[9px]"></i>
                      Aus Codex verknüpft (Besitzer: {charName}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {codexItems.map((item, iIdx) => (
                        <span 
                          key={item.id || `codex-item-${iIdx}`} 
                          className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-slate-200 flex items-center gap-1"
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

            {/* Motivationskern & Handlungsantrieb */}
            <div className="bg-slate-950/60 border border-amber-900/30 p-4 rounded-xl flex flex-col gap-3.5 mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-900/20 pb-2.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-bullseye text-amber-500"></i>
                  <span>Motivationskern & Handlungsantrieb</span>
                </span>
                <button
                  type="button"
                  onClick={handleGenerateMotivationCore}
                  disabled={isGeneratingMotivationCore}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Motivationskern per KI ausfüllen oder verfeinern"
                >
                  <i className={`fa-solid fa-wand-magic-sparkles ${isGeneratingMotivationCore ? 'animate-spin' : ''}`}></i>
                  <span>{isGeneratingMotivationCore ? 'Wird generiert...' : 'Motivationskern per KI generieren'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Hauptziel */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-amber-400 font-bold uppercase">
                    Übergeordnetes Hauptziel / Bestrebungen
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.mainGoal || getAppearanceValue('goal') || ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateAppearanceValue('goal', val);
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          goal: val,
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            mainGoal: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Frieden für das Reich, Rache an den Verrätern, Aufstieg zum Gildenmeister..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Synchronisiert mit dem Hauptziel des Charakters.</span>
                </div>

                {/* 2. Warum dieses Ziel / Innerer Antrieb */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-amber-400 font-bold uppercase">
                    Innerer Antrieb / Warum dieses Ziel?
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.whyGoal || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            whyGoal: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Suche nach Sicherheit, Schutz der Familie, unstillbarer Machthunger, Gerechtigkeitssinn..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Der tief sitzende emotionale oder existenzielle Grund.</span>
                </div>

                {/* 3. Aktuelle Prioritäten */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">
                    Aktuelle Prioritäten
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.currentPriorities || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            currentPriorities: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Ressourcen beschaffen, Spuren der Attentäter verfolgen, Verbündete überzeugen..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Was den Charakter momentan am stärksten beschäftigt.</span>
                </div>

                {/* 4. Bedürfnisse */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">
                    Bedürfnisse
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.needs || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            needs: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Nahrung, Geld, körperliche Sicherheit, soziale Anerkennung, Einfluss, Informationen..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Elementare und materielle Notwendigkeiten.</span>
                </div>

                {/* 5. Ängste & Vermeidung */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-red-400 font-bold uppercase">
                    Ängste & Vermeidung
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.fears || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            fears: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Verrat durch Vertraute, Kontrollverlust über magische Kräfte, Entehrung der Sippe..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-red-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Gefahren oder Umstände, die unbedingt vermieden werden sollen.</span>
                </div>

                {/* 6. Werte & Prinzipien */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-emerald-400 font-bold uppercase">
                    Werte & Prinzipien
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.valuesPrinciples || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            valuesPrinciples: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Treue zu Gefährten, Schutz der Schwachen, Pragmatismus vor Ehre..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Moralischer Kompass und Richtlinien des Handelns.</span>
                </div>

                {/* 7. Mittel & Vorgehensweise */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-sky-400 font-bold uppercase">
                    Mittel & Vorgehensweise
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.methodsAndMeans || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            methodsAndMeans: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Diplomatie und Verhandlung, verdeckte Täuschung, direkte Gewalt, langfristige Planung..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-sky-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Taktiken und Strategien zur Zielerreichung.</span>
                </div>

                {/* 8. Veränderbarkeit & Trigger */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-purple-400 font-bold uppercase">
                    Veränderbarkeit & Trigger
                  </label>
                  <AutoExpandingTextarea
                    value={editForm.details?.motivationCore?.changeTriggers || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        details: {
                          ...(prev.details || {}),
                          motivationCore: {
                            ...(prev.details?.motivationCore || {}),
                            changeTriggers: val
                          }
                        }
                      }));
                    }}
                    placeholder="z. B. Verlust eines Gefährten, Enthüllung einer alten Lüge, Erreichen eines Etappenziels..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[60px]"
                  />
                  <span className="text-[9px] text-slate-500">Welche Ereignisse Prioritäten oder Gesinnung verändern können.</span>
                </div>
              </div>
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

      {/* TAB 2: BEZIEHUNGEN */}
      {charTab === 'beziehungen' && (
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
                onClick={() => setActiveTransformationId('standard')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
              >
                Zurück zur Standardgestalt
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 bg-slate-900/40 p-5 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
              <div>
                <span className="text-sm text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-people-arrows text-amber-500"></i>
                  <span>Beziehungen &amp; Verhalten zu anderen {activeTransformation ? `(${activeTransformation.transformName || activeTransformation.name})` : ''}</span>
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">Wer ist dieser Charakter für andere und wie verhält er sich zu ihnen?</span>
              </div>
              <button 
                type="button"
                onClick={() => {
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
                      key={rel.id || `rel-char-${idx}`}
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

            {/* 1. Kraftquelle & Kosten/Verbrauch + Kernfähigkeit (Hauptfeld) */}
            {(() => {
              const customSourceNames = (world as any)?.customResourceMappings?.map((m: any) => m.name) || [];
              const customCostOptions = (world as any)?.costResources?.map((r: any) => r.name) || [];
              const defaultCostFallbacks = customCostOptions.length > 0 ? customCostOptions : ["MP", "Ausdauer"];

              return (
                <div className="space-y-4 mb-2">
                  {/* Power Sources Tabs */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 pb-2">
                    {powerSourcesList.map((src, sIdx) => (
                      <div 
                        key={src.id || sIdx} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                          sIdx === currentPowerIdx 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                        onClick={() => setActivePowerSourceIdx(sIdx)}
                      >
                        <i className="fa-solid fa-bolt-lightning text-[10px]"></i>
                        <span>{src.source || 'Keine Quelle'} {src.powerName ? `(${src.powerName})` : ''}</span>
                        {powerSourcesList.length > 1 && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePowerSource(sIdx);
                            }}
                            className="ml-1 text-[10px] text-slate-500 hover:text-red-400 transition cursor-pointer"
                            title="Kraftquelle entfernen"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPowerSource}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-dashed border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      <span>Neue Kraftquelle</span>
                    </button>
                  </div>

                  {/* Selected Power Source Configuration */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
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
                              value={customSourceNames.includes(activePowerSource.source || '') ? (activePowerSource.source || '') : (activePowerSource.source ? '__custom__' : '')}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '__custom__') {
                                  updateActivePowerSource({ source: 'Mana' });
                                } else {
                                  updateActivePowerSource({ source: val });
                                }
                              }}
                            >
                              <option value="">-- Keine / Standard --</option>
                              {customSourceNames.map((name: string, mIdx: number) => <option key={`global-custom-${name}-${mIdx}`} value={name}>{name}</option>)}
                              <option value="__custom__">Eigene eingeben...</option>
                            </select>
                            {(!customSourceNames.includes(activePowerSource.source || '') || activePowerSource.source === '') && (
                              <input 
                                type="text"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 w-1/2 h-[38px] font-semibold"
                                placeholder="z.B. Schattenmagie"
                                value={activePowerSource.source || ''}
                                onChange={e => updateActivePowerSource({ source: e.target.value })}
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
                              value={defaultCostFallbacks.includes(activePowerSource.cost || '') ? (activePowerSource.cost || '') : (activePowerSource.cost ? '__custom__' : '')}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '__custom__') {
                                  updateActivePowerSource({ cost: 'MP' });
                                } else {
                                  updateActivePowerSource({ cost: val });
                                }
                              }}
                            >
                              <option value="">-- Keine / Standard --</option>
                              {defaultCostFallbacks.map((name: string, idx: number) => <option key={`global-cost-${name}-${idx}`} value={name}>{name}</option>)}
                              <option value="__custom__">Eigene eingeben...</option>
                            </select>
                            {(!defaultCostFallbacks.includes(activePowerSource.cost || '') || activePowerSource.cost === '') && (
                              <input 
                                type="text"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 w-1/2 h-[38px] font-semibold"
                                placeholder="z.B. MP"
                                value={activePowerSource.cost || ''}
                                onChange={e => updateActivePowerSource({ cost: e.target.value })}
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
                            placeholder="z.B. Schattenmanipulation"
                            value={activePowerSource.powerName || ''}
                            onChange={e => updateActivePowerSource({ powerName: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Beschreibung der Kraft */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1">
                          Beschreibung der Kraft (Großes Feld)
                        </label>
                        <AutoExpandingTextarea 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-xs outline-none focus:border-amber-500 min-h-[80px] leading-relaxed"
                          placeholder="Detaillierte Beschreibung der Kräfte, Funktionsweise, Stärken und Grenzen..."
                          value={activePowerSource.powerDescription || ''}
                          onChange={e => updateActivePowerSource({ powerDescription: e.target.value })}
                        />
                      </div>

                      {/* Zugeordnete Fähigkeiten */}
                      <div className="flex flex-col gap-2.5 border-t border-slate-800/60 pt-4">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase ml-1 flex items-center gap-1.5">
                          <i className="fa-solid fa-wand-magic-sparkles text-amber-500 text-[10px]"></i>
                          <span>Zugeordnete Fähigkeiten</span>
                        </label>

                        {(() => {
                          const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
                          const activeHauptAbilities = currentAbilities.filter(ability => {
                            const matchesCategory = ability.category === 'Kernfähigkeit' || ability.category === 'Haupt-Fähigkeiten';
                            const belongsToActive = ability.powerSourceId === activePowerSource.id || (!ability.powerSourceId && activePowerSource.id === powerSourcesList[0]?.id);
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
                                      placeholder="z.B. Schattensprung"
                                      onChange={e => {
                                        const val = e.target.value;
                                        updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, name: val, category: 'Kernfähigkeit' } : a));
                                      }}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        updateDetail('abilities', currentAbilities.filter(a => a.id !== ability.id));
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-all text-xs shrink-0 cursor-pointer"
                                      title="Fähigkeit löschen"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                ))
                              )}

                              {/* Hinzufügen-Formular für Haupt-Fähigkeiten */}
                              <div className="flex gap-2 mt-2 pt-1">
                                <input 
                                  type="text"
                                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 h-[34px] font-medium"
                                  placeholder="Neue Fähigkeit für diese Kernfähigkeit, z.B. Schattenklinge..."
                                  value={quickAbilityName}
                                  onChange={e => setQuickAbilityName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (!quickAbilityName.trim()) return;
                                      const globalSource = activePowerSource.source || '';
                                      const globalCost = activePowerSource.cost || '';
                                      updateDetail('abilities', [
                                        ...currentAbilities,
                                        {
                                          id: `ab-${Date.now()}`,
                                          name: quickAbilityName.trim(),
                                          category: 'Kernfähigkeit',
                                          source: globalSource,
                                          cost: globalCost,
                                          description: '',
                                          techniques: '',
                                          powerSourceId: activePowerSource.id
                                        }
                                      ]);
                                      setQuickAbilityName('');
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!quickAbilityName.trim()) return;
                                    const globalSource = activePowerSource.source || '';
                                    const globalCost = activePowerSource.cost || '';
                                    updateDetail('abilities', [
                                      ...currentAbilities,
                                      {
                                        id: `ab-${Date.now()}`,
                                        name: quickAbilityName.trim(),
                                        category: 'Kernfähigkeit',
                                        source: globalSource,
                                        cost: globalCost,
                                        description: '',
                                        techniques: '',
                                        powerSourceId: activePowerSource.id
                                      }
                                    ]);
                                    setQuickAbilityName('');
                                  }}
                                  className="bg-amber-500 text-slate-950 font-extrabold text-xs px-3 rounded-lg hover:bg-amber-400 transition-all flex items-center gap-1 shrink-0 h-[34px] cursor-pointer"
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
              );
            })()}

            {/* Macht- & Kampfeinstufung (CharacterPowerRadar) */}
            {worldPowerSettings && Object.keys(worldPowerSettings).length > 0 && (
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-chart-pie text-amber-400"></i>
                  <span>Macht- &amp; Kampfeinstufung (Power-Level)</span>
                </div>
                <CharacterPowerRadar
                  worldPowerSettings={worldPowerSettings}
                  characterData={editForm.details?.campaignPowerData || {}}
                  onChange={newData => updateDetail('campaignPowerData', newData)}
                />
              </div>
            )}

            {/* Reiter (Tabs) für Fähigkeiten-Kategorien */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['Passive Fähigkeiten', 'Techniken', 'Ultimative Techniken', 'Transformationen', 'Talente'].map(tab => {
                  const count = ((editForm.details?.abilities || []) as CharacterAbility[]).filter(a => {
                    if (a.category !== tab) return false;
                    const belongsToActive = a.powerSourceId === activePowerSource.id || (!a.powerSourceId && activePowerSource.id === powerSourcesList[0]?.id);
                    return belongsToActive;
                  }).length;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveAbilityTab(tab)}
                      className={`flex-1 min-w-[130px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
                    const globalSource = activePowerSource.source || '';
                    const globalCost = activePowerSource.cost || '';
                    updateDetail('abilities', [
                      ...currentAbilities,
                      {
                        id: Date.now().toString(),
                        name: '',
                        category: activeAbilityTab,
                        source: globalSource,
                        cost: globalCost,
                        description: '',
                        techniques: '',
                        powerSourceId: activePowerSource.id
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600/30 transition-all shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-plus"></i> {activeAbilityTab} hinzufügen
                </button>
              </div>

              {/* Fähigkeiten-Liste für aktiven Tab */}
              {(() => {
                const currentAbilities: CharacterAbility[] = editForm.details?.abilities || [];
                const activeAbilities = currentAbilities.filter(ability => {
                  const matchesCategory = !ability.category ? activeAbilityTab === 'Passive Fähigkeiten' : ability.category === activeAbilityTab;
                  if (!matchesCategory) return false;
                  const belongsToActive = ability.powerSourceId === activePowerSource.id || (!ability.powerSourceId && activePowerSource.id === powerSourcesList[0]?.id);
                  return belongsToActive;
                });

                if (activeAbilities.length === 0) {
                  return (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                      <span className="text-2xl block mb-2">✨</span>
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
                            onClick={() => updateDetail('abilities', currentAbilities.filter(a => a.id !== ability.id))}
                            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded-lg transition-colors text-xs border border-transparent hover:border-red-500/20 cursor-pointer"
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
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Name der passiven Fähigkeit</label>
                                <input 
                                  type="text"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                  placeholder="z.B. Regeneration, Eiserner Wille..."
                                  value={ability.name || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, name: val } : a));
                                  }}
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Effekt</label>
                                <AutoExpandingTextarea 
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white min-h-[60px] text-xs outline-none focus:border-amber-500" 
                                  placeholder="z.B. Erhöht die Verteidigung um 15%..." 
                                  value={ability.description || ''} 
                                  onChange={e => updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, description: e.target.value } : a))} 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Name der Fähigkeit / Technik</label>
                                <input 
                                  type="text"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                  placeholder="z.B. Schattenschlag"
                                  value={ability.name || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, name: val } : a));
                                  }}
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Kosten / Verbrauch</label>
                                <input 
                                  type="text"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                                  placeholder="z.B. 15 MP"
                                  value={ability.cost || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, cost: val } : a));
                                  }}
                                />
                              </div>

                              <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Wirkung &amp; Beschreibung</label>
                                <AutoExpandingTextarea 
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white min-h-[50px] text-xs outline-none focus:border-amber-500" 
                                  placeholder="Detaillierte Beschreibung der Wirkung..."
                                  value={ability.description || ''}
                                  onChange={e => updateDetail('abilities', currentAbilities.map(a => a.id === ability.id ? { ...a, description: e.target.value } : a))}
                                />
                              </div>
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
