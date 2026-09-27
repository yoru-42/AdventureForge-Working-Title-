// -*- coding: utf-8 -*-
import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  BaseAbility, 
  CharacterPowerSource, 
  TechniqueItem, 
  AbilityType, 
  TechniqueTransformationModifier, 
  TransformationModifierType,
  PowerSystem,
  CharacterPower,
  CharacterAbility,
  CharacterTechnique,
  CharacterPowerForm
} from '../types';
import { 
  ADVENTURE_FORGE_ELEMENTS, 
  ABILITY_TYPES, 
  resolveKinesisName, 
  formatAbilityTypeLabel,
  buildCharacterPowerHierarchy
} from '../utils/abilityHierarchy';
import { 
  WEAPON_CATEGORIES, 
  ALL_WEAPONS, 
  WEAPON_MASTERY_RANKS, 
  WIELDING_STYLES, 
  getWeaponById, 
  findWeaponByName, 
  getWeaponsByCategory,
  WeaponTypeDefinition 
} from '../lib/weaponTypesData';
import { TechniqueSmartFillModal } from './TechniqueSmartFillModal';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { WeaponSkillTree } from './WeaponSkillTree';
import { TechniqueCard, getTechniqueMasteryLabel } from './TechniqueCard';
import EverydaySkillsSelect, { parseEverydaySkills } from './EverydaySkillsSelect';
import CompetenceProfileEditor from './CompetenceProfileEditor';

export interface TechniqueHierarchyTreeProps {
  powerSources: CharacterPowerSource[];
  baseAbilities: BaseAbility[];
  techniques: TechniqueItem[];
  onChange: (
    powerSources: CharacterPowerSource[],
    baseAbilities: BaseAbility[],
    techniques: TechniqueItem[]
  ) => void;
  characterName?: string;
  characterRole?: string;
  worldTitle?: string;
  readOnly?: boolean;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  worldPowerSettings?: Record<string, any>;
  costResources?: Array<{ id?: string; name: string }>;
  costPowerNames?: string[];
  world?: any;
  // Optionale Props für direkte Berufs- & Alltagskompetenzintegration
  profession?: string;
  onProfessionChange?: (val: string, detectedField?: string) => void;
  professionLevel?: string;
  onProfessionLevelChange?: (val: string) => void;
  professionField?: string;
  onProfessionFieldChange?: (val: string) => void;
  professionSpecialization?: string;
  onProfessionSpecializationChange?: (val: string) => void;
  professionRank?: string;
  onProfessionRankChange?: (val: string) => void;
  professionExperience?: any;
  onProfessionExperienceChange?: (val: any) => void;
  professionProficiencyScore?: number;
  onProfessionProficiencyScoreChange?: (val: number) => void;
  professionExperiencePoints?: number;
  onProfessionExperiencePointsChange?: (val: number) => void;
  professionExperienceText?: string;
  onProfessionExperienceTextChange?: (val: string) => void;
  professionPromotionConditions?: string;
  onProfessionPromotionConditionsChange?: (val: string) => void;
  professionProgress?: any;
  onProfessionProgressChange?: (val: any) => void;
  professionCompetencies?: any[];
  onProfessionCompetenciesChange?: (val: any[]) => void;
  secondaryProfessions?: any[];
  onSecondaryProfessionsChange?: (val: any[]) => void;
  socialTitles?: any[];
  onSocialTitlesChange?: (val: any[]) => void;
  offices?: any[];
  onOfficesChange?: (val: any[]) => void;
  positions?: any[];
  onPositionsChange?: (val: any[]) => void;
  socialStatus?: string;
  onSocialStatusChange?: (val: string) => void;
  craftingSkills?: string;
  onCraftingSkillsChange?: (val: string) => void;
  jobTitle?: string;
  onJobTitleChange?: (val: string) => void;
  authorities?: string[];
  onAuthoritiesChange?: (val: string[]) => void;
  professionDescription?: string;
  onProfessionDescriptionChange?: (val: string) => void;
  talents?: string;
  onTalentsChange?: (val: string) => void;
  everydaySkills?: string;
  onEverydaySkillsChange?: (val: string) => void;
  everydaySkillsProficiencyScore?: number;
  onEverydaySkillsProficiencyScoreChange?: (val: number) => void;
  everydaySkillsExperienceText?: string;
  onEverydaySkillsExperienceTextChange?: (val: string) => void;
  toolsAndEquipment?: string;
  onToolsAndEquipmentChange?: (val: string) => void;
  // Neue hierarchische Datenmodell-Props (Schritt 2)
  powerSystems?: PowerSystem[];
  powers?: CharacterPower[];
  abilities?: CharacterAbility[];
  characterTechniques?: CharacterTechnique[];
  forms?: CharacterPowerForm[];
  character?: any;
  onHierarchyChange?: (hierarchy: {
    powerSystems: PowerSystem[];
    powers: CharacterPower[];
    abilities: CharacterAbility[];
    techniques: CharacterTechnique[];
    forms: CharacterPowerForm[];
  }) => void;
}

export const CATEGORY_TABS = [
  'Training & Erlernbare Fertigkeiten',
  'Passive Fähigkeiten',
  'Techniken',
  'Ultimative Techniken',
  'Waffenbeherrschung'
] as const;

export type AbilityCategoryTab = typeof CATEGORY_TABS[number];

export const CATEGORY_ADD_LABELS: Record<AbilityCategoryTab, string> = {
  'Training & Erlernbare Fertigkeiten': 'Erlernbare Fertigkeit / Ausbildungsziel anlegen',
  'Passive Fähigkeiten': 'Passive Fähigkeit hinzufügen',
  'Techniken': 'Technik hinzufügen',
  'Ultimative Techniken': 'Ultimative Technik hinzufügen',
  'Waffenbeherrschung': 'Waffenbeherrschung hinzufügen'
};

export const CATEGORY_EMPTY_LABELS: Record<AbilityCategoryTab, string> = {
  'Training & Erlernbare Fertigkeiten': 'Erstes Ausbildungsziel anlegen',
  'Passive Fähigkeiten': 'Erste passive Fähigkeit erstellen',
  'Techniken': 'Erste Technik erstellen',
  'Ultimative Techniken': 'Erste ultimative Technik erstellen',
  'Waffenbeherrschung': 'Erste Waffenbeherrschung erstellen'
};

export const TRANS_CATEGORY_TABS = [
  'Passive Fähigkeiten',
  'Techniken',
  'Ultimative Techniken'
] as const;

export type TransCategoryTab = typeof TRANS_CATEGORY_TABS[number];

export const TRANS_CATEGORY_ADD_LABELS: Record<TransCategoryTab, string> = {
  'Passive Fähigkeiten': 'Passive Fähigkeit hinzufügen',
  'Techniken': 'Technik hinzufügen',
  'Ultimative Techniken': 'Ultimative Technik hinzufügen'
};

export const TRANS_CATEGORY_EMPTY_LABELS: Record<TransCategoryTab, string> = {
  'Passive Fähigkeiten': 'Erste passive Fähigkeit für diese Gestalt erstellen',
  'Techniken': 'Erste Technik für diese Gestalt erstellen',
  'Ultimative Techniken': 'Erste ultimative Technik für diese Gestalt erstellen'
};

export const TechniqueHierarchyTree: React.FC<TechniqueHierarchyTreeProps> = ({
  powerSources,
  baseAbilities,
  techniques,
  onChange,
  characterName,
  characterRole,
  worldTitle,
  readOnly = false,
  progressionLogic = 'ep',
  worldPowerSettings,
  costResources,
  costPowerNames,
  world,
  // Berufs- & Alltagskompetenz-Integration
  profession = '',
  onProfessionChange,
  professionLevel = '',
  onProfessionLevelChange,
  professionField = '',
  onProfessionFieldChange,
  professionSpecialization = '',
  onProfessionSpecializationChange,
  professionRank = '',
  onProfessionRankChange,
  professionExperience,
  onProfessionExperienceChange,
  professionProficiencyScore = 0,
  onProfessionProficiencyScoreChange,
  professionExperiencePoints = 0,
  onProfessionExperiencePointsChange,
  professionExperienceText = '',
  onProfessionExperienceTextChange,
  professionPromotionConditions = '',
  onProfessionPromotionConditionsChange,
  professionProgress,
  onProfessionProgressChange,
  professionCompetencies = [],
  onProfessionCompetenciesChange,
  secondaryProfessions = [],
  onSecondaryProfessionsChange,
  socialTitles = [],
  onSocialTitlesChange,
  offices = [],
  onOfficesChange,
  positions = [],
  onPositionsChange,
  socialStatus = '',
  onSocialStatusChange,
  craftingSkills = '',
  onCraftingSkillsChange,
  jobTitle = '',
  onJobTitleChange,
  authorities = [],
  onAuthoritiesChange,
  professionDescription = '',
  onProfessionDescriptionChange,
  talents = '',
  onTalentsChange,
  everydaySkills = '',
  onEverydaySkillsChange,
  everydaySkillsProficiencyScore = 0,
  onEverydaySkillsProficiencyScoreChange,
  everydaySkillsExperienceText = '',
  onEverydaySkillsExperienceTextChange,
  toolsAndEquipment = '',
  onToolsAndEquipmentChange,
  // Neue hierarchische Datenmodell-Props (Schritt 2)
  powerSystems,
  powers,
  abilities,
  characterTechniques,
  forms,
  character,
  onHierarchyChange
}) => {
  // 0. Neue Hierarchie ermitteln (Schritt 2: Interne Anbindung)
  const powerHierarchy = useMemo(() => {
    if (powerSystems || powers || abilities || characterTechniques || forms) {
      return buildCharacterPowerHierarchy({
        powerSystems,
        powers,
        characterAbilities: abilities,
        characterTechniques,
        powerForms: forms
      });
    }
    if (character) {
      return buildCharacterPowerHierarchy(character);
    }
    return buildCharacterPowerHierarchy({
      powerSources,
      baseAbilities,
      techniques
    });
  }, [powerSystems, powers, abilities, characterTechniques, forms, character, powerSources, baseAbilities, techniques]);

  useEffect(() => {
    if (onHierarchyChange && powerHierarchy) {
      onHierarchyChange(powerHierarchy);
    }
  }, [powerHierarchy, onHierarchyChange]);

  // 1. Sichere Standard-Kraftquelle falls Liste leer
  const safePowerSources = useMemo(() => {
    if (powerSources && powerSources.length > 0) {
      return powerSources.map(ps => {
        if (ps.powerName === 'Standard-Kraftquelle' || ps.source === 'Standard-Kraftquelle') {
          return {
            ...ps,
            source: ps.source === 'Standard-Kraftquelle' ? '' : ps.source,
            powerName: ps.powerName === 'Standard-Kraftquelle' ? '' : ps.powerName,
            cost: ps.cost === 'Mana' ? '' : ps.cost
          };
        }
        return ps;
      });
    }
    if (readOnly) return [];
    return [{
      id: 'ps_default_main',
      source: '',
      powerName: '',
      cost: '',
      powerDescription: ''
    }];
  }, [powerSources, readOnly]);

  // 2. Trennung zwischen Standard-Kampffähigkeiten und Transformationen
  const standardTechniques = useMemo(() => {
    return techniques.filter(t => 
      t.type !== 'Transformation' && 
      t.category !== 'Transformationen' && 
      !t.isTransformationOnly && 
      !t.unlockedByTransformationId &&
      (!t.unlockedByTransformationIds || t.unlockedByTransformationIds.length === 0)
    );
  }, [techniques]);

  const transformationItems = useMemo(() => {
    return techniques.filter(t => t.type === 'Transformation' || t.category === 'Transformationen');
  }, [techniques]);

  // 3. Navigationszustände & Formauswahl (Normalform vs. Transformationen)
  const [selectedFormId, setSelectedFormId] = useState<string>('normal');

  const [activePowerSourceId, setActivePowerSourceId] = useState<string>(() => {
    return safePowerSources[0]?.id || '';
  });

  const [activeBaseAbilityId, setActiveBaseAbilityId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<AbilityCategoryTab>('Training & Erlernbare Fertigkeiten');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // 4. Trainingsplan Filter & Such-Zustand
  const [trainingSearchTerm, setTrainingSearchTerm] = useState<string>('');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<'alle' | 'in_ausbildung' | 'erlernbar' | 'gemeistert' | 'gesperrt'>('alle');
  const [trainingCategoryFilter, setTrainingCategoryFilter] = useState<string>('alle');

  // Lokaler Fallback-Zustand für Alltagskompetenzen & Berufe falls von übergeordneter Komponente nicht gebunden
  const [localEverydaySkills, setLocalEverydaySkills] = useState<string>(everydaySkills || '');
  const [localProfession, setLocalProfession] = useState<string>(profession || '');

  // Synchronisation mit Props
  useEffect(() => {
    if (everydaySkills !== undefined) {
      setLocalEverydaySkills(everydaySkills);
    }
  }, [everydaySkills]);

  useEffect(() => {
    if (profession !== undefined) {
      setLocalProfession(profession);
    }
  }, [profession]);

  // 5. Transformations-Zustand
  const [selectedTransformationId, setSelectedTransformationId] = useState<string>('');
  const [activeTransCategory, setActiveTransCategory] = useState<TransCategoryTab>('Techniken');
  const [showTransModifiersInEditor, setShowTransModifiersInEditor] = useState<boolean>(false);

  useEffect(() => {
    if (transformationItems.length > 0) {
      if (!selectedTransformationId || !transformationItems.some(t => t.id === selectedTransformationId)) {
        setSelectedTransformationId(transformationItems[0].id);
      }
    } else {
      setSelectedTransformationId('');
    }

    if (selectedFormId !== 'normal' && !transformationItems.some(t => t.id === selectedFormId)) {
      setSelectedFormId('normal');
    }
  }, [transformationItems, selectedTransformationId, selectedFormId]);

  const selectedTransformation = useMemo(() => {
    if (!selectedTransformationId) return transformationItems[0] || null;
    return transformationItems.find(t => t.id === selectedTransformationId) || transformationItems[0] || null;
  }, [transformationItems, selectedTransformationId]);

  const toggleCardExpanded = (id: string, defaultExpanded: boolean) => {
    setExpandedMap(prev => {
      const current = prev[id] !== undefined ? prev[id] : defaultExpanded;
      return { ...prev, [id]: !current };
    });
  };

  const handleToggleAll = (expand: boolean, entriesToToggle: TechniqueItem[]) => {
    const next: Record<string, boolean> = {};
    entriesToToggle.forEach(e => {
      next[e.id] = expand;
    });
    setExpandedMap(next);
  };

  // Modal State für Smart Fill
  const [smartFillModalState, setSmartFillModalState] = useState<{
    isOpen: boolean;
    powerSourceId?: string;
    baseAbilityId?: string;
  }>({ isOpen: false });

  // Gültige Kraftquelle ermitteln
  const activePowerSource = useMemo(() => {
    const found = safePowerSources.find(ps => ps.id === activePowerSourceId);
    return found || safePowerSources[0] || null;
  }, [safePowerSources, activePowerSourceId]);

  // Kosten-Ressourcen aus Kampagneneinstellungen
  const registeredCostResources = useMemo(() => {
    const list: string[] = [];
    const resList = costResources || world?.costResources;
    if (Array.isArray(resList)) {
      resList.forEach((r: any) => {
        const name = typeof r === 'string' ? r.trim() : (r && r.name ? String(r.name).trim() : '');
        if (name && !list.includes(name)) {
          list.push(name);
        }
      });
    }
    return list;
  }, [costResources, world?.costResources]);

  useEffect(() => {
    if (safePowerSources.length > 0 && !safePowerSources.some(ps => ps.id === activePowerSourceId)) {
      setActivePowerSourceId(safePowerSources[0].id);
    }
  }, [safePowerSources, activePowerSourceId]);

  // Grundfähigkeiten für die aktuell ausgewählte Kraftquelle
  const currentBaseAbilities = useMemo(() => {
    if (!activePowerSource) return [];
    return baseAbilities.filter(ba => {
      if (ba.powerSourceId) return ba.powerSourceId === activePowerSource.id;
      return activePowerSource.id === safePowerSources[0]?.id;
    });
  }, [baseAbilities, activePowerSource, safePowerSources]);

  useEffect(() => {
    if (currentBaseAbilities.length > 0) {
      const existsInCurrent = currentBaseAbilities.some(ba => ba.id === activeBaseAbilityId);
      if (!existsInCurrent) {
        setActiveBaseAbilityId(currentBaseAbilities[0].id);
      }
    } else {
      if (activeBaseAbilityId !== '') {
        setActiveBaseAbilityId('');
      }
    }
  }, [currentBaseAbilities, activeBaseAbilityId]);

  const activeBaseAbility = useMemo(() => {
    if (!activeBaseAbilityId) return null;
    return currentBaseAbilities.find(ba => ba.id === activeBaseAbilityId) || null;
  }, [currentBaseAbilities, activeBaseAbilityId]);

  // Kategorie-Helfer
  const getTechniqueCategory = (tech: TechniqueItem): AbilityCategoryTab => {
    if (tech.category === 'Talente') return 'Waffenbeherrschung';
    if (tech.category && (CATEGORY_TABS as readonly string[]).includes(tech.category)) {
      return tech.category as AbilityCategoryTab;
    }
    if (tech.tier === 'Tier 4' || tech.tier === 'Ultimativ') return 'Ultimative Techniken';
    return 'Techniken';
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<AbilityCategoryTab, number> = {
      'Training & Erlernbare Fertigkeiten': 0,
      'Passive Fähigkeiten': 0,
      'Techniken': 0,
      'Ultimative Techniken': 0,
      'Waffenbeherrschung': 0
    };

    standardTechniques.forEach(tech => {
      const belongs = activeBaseAbility
        ? Boolean(tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id))
        : Boolean(activePowerSource && (tech.powerSourceId === activePowerSource.id || !tech.powerSourceId));

      if (belongs) {
        const cat = getTechniqueCategory(tech);
        if (cat in counts) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }

      // Alle erlernbaren Techniken zählen für den Trainings-Tab
      if (tech.isLearnable !== false) {
        counts['Training & Erlernbare Fertigkeiten']++;
      }
    });

    return counts;
  }, [standardTechniques, activeBaseAbility, activePowerSource]);

  // Einträge der ausgewählten Kategorie
  const activeEntries = useMemo(() => {
    return standardTechniques.filter(tech => {
      const belongs = activeBaseAbility
        ? Boolean(tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id))
        : Boolean(activePowerSource && (tech.powerSourceId === activePowerSource.id || !tech.powerSourceId));

      if (!belongs) return false;
      return getTechniqueCategory(tech) === activeCategory;
    });
  }, [standardTechniques, activeBaseAbility, activePowerSource, activeCategory]);

  // Alle Fertigkeiten im Trainings- & Lernplan
  const trainingEntries = useMemo(() => {
    return standardTechniques.filter(tech => {
      // Prüfe Suchbegriff
      if (trainingSearchTerm.trim()) {
        const term = trainingSearchTerm.toLowerCase();
        const matchesName = tech.name.toLowerCase().includes(term);
        const matchesDesc = (tech.description || '').toLowerCase().includes(term);
        const matchesReq = (tech.learningRequirements || tech.requiredAttribute || '').toLowerCase().includes(term);
        const matchesTeacher = (tech.requiredTeacherOrScroll || '').toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesReq && !matchesTeacher) {
          return false;
        }
      }

      // Prüfe Kategorie-Filter
      if (trainingCategoryFilter !== 'alle') {
        const cat = getTechniqueCategory(tech);
        if (cat !== trainingCategoryFilter) return false;
      }

      // Status ermitteln
      const currentScore = tech.score !== undefined ? tech.score : (tech.trainingProgress || 0);
      const status = tech.learningStatus || (currentScore >= 95 ? 'gemeistert' : currentScore > 0 ? 'in_ausbildung' : 'erlernbar');

      // Prüfe Status-Filter
      if (trainingStatusFilter !== 'alle') {
        if (trainingStatusFilter === 'gemeistert' && status !== 'gemeistert' && currentScore < 95) return false;
        if (trainingStatusFilter === 'in_ausbildung' && status !== 'in_ausbildung') return false;
        if (trainingStatusFilter === 'erlernbar' && status !== 'erlernbar') return false;
        if (trainingStatusFilter === 'gesperrt' && status !== 'gesperrt') return false;
      }

      return true;
    });
  }, [standardTechniques, trainingSearchTerm, trainingCategoryFilter, trainingStatusFilter]);

  // Trainings-Statistiken
  const trainingStats = useMemo(() => {
    let inAusbildung = 0;
    let gemeistert = 0;
    let erlernbar = 0;
    let gesperrt = 0;

    standardTechniques.forEach(t => {
      const score = t.score !== undefined ? t.score : (t.trainingProgress || 0);
      const st = t.learningStatus || (score >= 95 ? 'gemeistert' : score > 0 ? 'in_ausbildung' : 'erlernbar');
      if (st === 'gemeistert' || score >= 95) gemeistert++;
      else if (st === 'in_ausbildung') inAusbildung++;
      else if (st === 'gesperrt') gesperrt++;
      else erlernbar++;
    });

    return {
      total: standardTechniques.length,
      inAusbildung,
      gemeistert,
      erlernbar,
      gesperrt
    };
  }, [standardTechniques]);

  const availableTransformations = useMemo(() => {
    return transformationItems.map(t => ({
      id: t.id,
      name: t.transformName || t.name,
      transformName: t.transformName
    }));
  }, [transformationItems]);

  // Transformationseigene Fähigkeiten
  const currentTransTechniques = useMemo(() => {
    if (!selectedTransformation) return [];
    return techniques.filter(t => 
      t.unlockedByTransformationId === selectedTransformation.id ||
      (Array.isArray(t.unlockedByTransformationIds) && t.unlockedByTransformationIds.includes(selectedTransformation.id)) ||
      (t.parentTransformationId === selectedTransformation.id && t.type !== 'Transformation' && t.category !== 'Transformationen')
    );
  }, [techniques, selectedTransformation]);

  const transCategoryCounts = useMemo(() => {
    const counts: Record<TransCategoryTab, number> = {
      'Passive Fähigkeiten': 0,
      'Techniken': 0,
      'Ultimative Techniken': 0
    };
    currentTransTechniques.forEach(t => {
      if (t.category === 'Passive Fähigkeiten') {
        counts['Passive Fähigkeiten']++;
      } else if (t.category === 'Ultimative Techniken' || t.tier === 'Tier 4') {
        counts['Ultimative Techniken']++;
      } else {
        counts['Techniken']++;
      }
    });
    return counts;
  }, [currentTransTechniques]);

  const activeTransEntries = useMemo(() => {
    return currentTransTechniques.filter(t => {
      if (activeTransCategory === 'Passive Fähigkeiten') {
        return t.category === 'Passive Fähigkeiten';
      }
      if (activeTransCategory === 'Ultimative Techniken') {
        return t.category === 'Ultimative Techniken' || t.tier === 'Tier 4';
      }
      return t.category !== 'Passive Fähigkeiten' && t.category !== 'Ultimative Techniken' && t.tier !== 'Tier 4';
    });
  }, [currentTransTechniques, activeTransCategory]);

  // -------------------------------------------------------------
  // HANDLERS: Kraftquellen
  // -------------------------------------------------------------
  const handleAddPowerSource = () => {
    const newId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newPs: CharacterPowerSource = {
      id: newId,
      source: '',
      powerName: '',
      cost: '',
      powerDescription: ''
    };
    const updatedPs = [...safePowerSources, newPs];

    onChange(updatedPs, baseAbilities, techniques);
    setActivePowerSourceId(newId);
    setActiveBaseAbilityId('');
  };

  const handleUpdatePowerSource = (psId: string, updates: Partial<CharacterPowerSource>) => {
    const updatedPs = safePowerSources.map(ps => {
      if (ps.id === psId) {
        return {
          ...ps,
          ...updates,
          powerName: updates.powerName !== undefined ? updates.powerName : (updates.source !== undefined ? updates.source : ps.powerName),
          source: updates.source !== undefined ? updates.source : (updates.powerName !== undefined ? updates.powerName : ps.source)
        };
      }
      return ps;
    });

    const newPowerName = updates.powerName !== undefined ? updates.powerName : updates.source;
    const updatedBa = baseAbilities.map(ba => {
      if (ba.powerSourceId === psId && newPowerName !== undefined) {
        return { ...ba, powerSourceName: newPowerName };
      }
      return ba;
    });

    const updatedTech = techniques.map(tech => {
      if (tech.powerSourceId === psId && newPowerName !== undefined) {
        return { ...tech, powerSourceName: newPowerName };
      }
      return tech;
    });

    onChange(updatedPs, updatedBa, updatedTech);
  };

  const handleDeletePowerSource = (psId: string) => {
    const deletedBaIds = baseAbilities.filter(ba => ba.powerSourceId === psId).map(ba => ba.id);
    const remainingPs = safePowerSources.filter(ps => ps.id !== psId);
    const remainingBa = baseAbilities.filter(ba => ba.powerSourceId !== psId);

    const remainingTech: TechniqueItem[] = [];

    techniques.forEach(tech => {
      if (tech.baseAbilityIds && tech.baseAbilityIds.length > 0) {
        const newBaseAbilityIds = tech.baseAbilityIds.filter(id => !deletedBaIds.includes(id));
        if (newBaseAbilityIds.length > 0) {
          const newBaseAbilityNames = newBaseAbilityIds.map(id => {
            const ba = remainingBa.find(b => b.id === id);
            return ba ? (ba.displayName || ba.name) : '';
          }).filter(Boolean);

          const remappedPsId = tech.powerSourceId === psId
            ? (remainingBa.find(b => b.id === newBaseAbilityIds[0])?.powerSourceId || remainingPs[0]?.id || '')
            : (tech.powerSourceId || remainingPs[0]?.id || '');

          const remappedPs = remainingPs.find(p => p.id === remappedPsId) || remainingPs[0];

          remainingTech.push({
            ...tech,
            powerSourceId: remappedPs?.id,
            powerSourceName: remappedPs?.powerName || remappedPs?.source,
            baseAbilityIds: newBaseAbilityIds,
            baseAbilityNames: newBaseAbilityNames
          });
        }
      } else if (tech.powerSourceId !== psId) {
        remainingTech.push(tech);
      }
    });

    onChange(remainingPs, remainingBa, remainingTech);

    if (remainingPs.length > 0) {
      setActivePowerSourceId(remainingPs[0].id);
    } else {
      setActivePowerSourceId('');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Grundfähigkeiten
  // -------------------------------------------------------------
  const handleAddBaseAbility = () => {
    if (!activePowerSource) return;

    const newBaId = `ba_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const defaultElement = ADVENTURE_FORGE_ELEMENTS[0] || 'Feuer';
    const defaultAbilityType: AbilityType = 'creation_manipulation';
    const initialName = resolveKinesisName(defaultElement, defaultAbilityType);

    const newBa: BaseAbility = {
      id: newBaId,
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      displayName: initialName,
      name: initialName,
      element: defaultElement,
      abilityType: defaultAbilityType,
      description: '',
      techniqueIds: []
    };

    const updatedBa = [...baseAbilities, newBa];
    onChange(safePowerSources, updatedBa, techniques);
    setActiveBaseAbilityId(newBaId);
  };

  const handleUpdateBaseAbility = (baId: string, updates: Partial<BaseAbility>) => {
    const updatedBa = baseAbilities.map(ba => {
      if (ba.id === baId) {
        const next = { ...ba, ...updates };
        if (updates.element || updates.abilityType) {
          const el = updates.element || ba.element;
          const at = updates.abilityType || ba.abilityType;
          if (!updates.displayName && !updates.name) {
            next.displayName = resolveKinesisName(el, at);
            next.name = next.displayName;
          }
        }
        return next;
      }
      return ba;
    });

    const target = updatedBa.find(b => b.id === baId);
    let updatedTech = techniques;
    if (target) {
      const name = target.displayName || target.name;
      updatedTech = techniques.map(tech => {
        if (tech.baseAbilityIds?.includes(baId)) {
          const idx = tech.baseAbilityIds.indexOf(baId);
          const newNames = [...(tech.baseAbilityNames || [])];
          newNames[idx] = name;
          return {
            ...tech,
            baseAbilityNames: newNames,
            element: tech.baseAbilityIds[0] === baId ? target.element : tech.element,
            abilityType: tech.baseAbilityIds[0] === baId ? target.abilityType : tech.abilityType
          };
        }
        return tech;
      });
    }

    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleDeleteBaseAbility = (baId: string) => {
    const remainingBa = baseAbilities.filter(ba => ba.id !== baId);
    const updatedTech: TechniqueItem[] = [];

    techniques.forEach(tech => {
      if (tech.baseAbilityIds && tech.baseAbilityIds.includes(baId)) {
        const newIds = tech.baseAbilityIds.filter(id => id !== baId);
        if (newIds.length > 0) {
          const newNames = newIds.map(id => {
            const ba = remainingBa.find(b => b.id === id);
            return ba ? (ba.displayName || ba.name) : '';
          }).filter(Boolean);

          updatedTech.push({
            ...tech,
            baseAbilityIds: newIds,
            baseAbilityNames: newNames
          });
        }
      } else {
        updatedTech.push(tech);
      }
    });

    onChange(safePowerSources, remainingBa, updatedTech);

    const nextAvailable = remainingBa.filter(ba => activePowerSource && ba.powerSourceId === activePowerSource.id);
    if (nextAvailable.length > 0) {
      setActiveBaseAbilityId(nextAvailable[0].id);
    } else {
      setActiveBaseAbilityId('');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Standard-Einträge & Training
  // -------------------------------------------------------------
  const handleAddEntry = (targetCategory?: AbilityCategoryTab) => {
    if (!activePowerSource) return;

    const chosenCat = targetCategory || activeCategory;
    const newId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const costResource = activePowerSource.cost || 'Mana';

    let defaultName = 'Neue Technik';
    let defaultType = 'Angriff';
    let defaultTier = 'Tier 1';
    let defaultCostVal = 10;
    let defaultCostStr = `10 ${costResource}`;
    let defaultMode = 'Normal';
    let targetCatString: string = chosenCat;

    if (chosenCat === 'Training & Erlernbare Fertigkeiten') {
      defaultName = 'Neue erlernbare Fertigkeit';
      defaultType = 'Angriff';
      defaultTier = 'Tier 1';
      defaultCostVal = 10;
      defaultCostStr = `10 ${costResource}`;
      targetCatString = 'Techniken';
    } else if (chosenCat === 'Passive Fähigkeiten') {
      defaultName = 'Neue passive Fähigkeit';
      defaultType = 'Support';
      defaultTier = 'Tier 1';
      defaultCostVal = 0;
      defaultCostStr = 'Passiv';
    } else if (chosenCat === 'Ultimative Techniken') {
      defaultName = 'Neue ultimative Technik';
      defaultTier = 'Tier 4';
      defaultCostVal = 50;
      defaultCostStr = `50 ${costResource}`;
    } else if (chosenCat === 'Waffenbeherrschung' || (chosenCat as string) === 'Talente') {
      const defaultWeapon = ALL_WEAPONS[1] || ALL_WEAPONS[0];
      defaultName = `Waffenbeherrschung: ${defaultWeapon.name}`;
      defaultType = 'Spezial';
      defaultTier = 'Rang 1: Novize / Grundausbildung';
      defaultCostVal = 0;
      defaultCostStr = 'Rang 1';
    }

    const isWpnMastery = chosenCat === 'Waffenbeherrschung';
    const defaultWeapon = isWpnMastery ? (ALL_WEAPONS[1] || ALL_WEAPONS[0]) : null;

    const baseAbilityIds = activeBaseAbility ? [activeBaseAbility.id] : [];
    const baseAbilityNames = activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name] : [];
    const element = activeBaseAbility ? activeBaseAbility.element : 'Neutral';
    const abilityType = activeBaseAbility ? activeBaseAbility.abilityType : 'creation_manipulation';

    const newEntry: TechniqueItem = {
      id: newId,
      name: defaultName,
      description: isWpnMastery && defaultWeapon ? defaultWeapon.description : '',
      category: targetCatString,
      type: defaultType,
      subtype: isWpnMastery && defaultWeapon ? defaultWeapon.categoryName : '',
      mode: defaultMode,
      tier: defaultTier,
      baseAbilityIds,
      baseAbilityNames,
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      element,
      abilityType,
      targetType: isWpnMastery ? 'Einzelziel / Nahkampf' : 'Selbst / Verbündete / Feinde',
      effects: isWpnMastery && defaultWeapon ? [...defaultWeapon.damageTypes] : [],
      costResourceName: costResource,
      costValue: defaultCostVal,
      costFormula: 'absolut',
      cost: defaultCostStr,
      range: isWpnMastery && defaultWeapon ? (defaultWeapon.rangeCategory === 'Fernkampf' ? 'Fernkampf' : defaultWeapon.rangeCategory === 'Stangenreichweite' ? 'Stangenreichweite' : 'Nahkampf') : 'Nahkampf / Mittlere Distanz',
      duration: isWpnMastery ? 'Permanent / Haltung' : 'Sofort',
      level: 1,
      maxLevel: 10,
      xp: 0,
      xpNeeded: 100,
      trainingProgress: 0,
      score: 0,
      trainingHours: 0,
      targetTrainingHours: 20,
      isLearnable: true,
      learningStatus: 'erlernbar',
      learningRequirements: 'Grundstufe erforderlich',
      weaponType: isWpnMastery && defaultWeapon ? defaultWeapon.name : undefined,
      weaponCategory: isWpnMastery && defaultWeapon ? defaultWeapon.categoryName : undefined,
      masteryLevel: isWpnMastery ? 'Rang 1: Novize / Grundausbildung' : undefined,
      wieldingStyle: isWpnMastery && defaultWeapon ? defaultWeapon.wieldingStyles[0] : undefined,
      weaponManeuver: isWpnMastery && defaultWeapon && defaultWeapon.maneuvers.length > 0 ? defaultWeapon.maneuvers[0] : undefined
    };

    const updatedTech = [...techniques, newEntry];

    const updatedBa = activeBaseAbility
      ? baseAbilities.map(ba => {
          if (ba.id === activeBaseAbility.id) {
            return {
              ...ba,
              techniqueIds: [...(ba.techniqueIds || []), newId]
            };
          }
          return ba;
        })
      : baseAbilities;

    setExpandedMap(prev => ({ ...prev, [newId]: true }));
    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<TechniqueItem>) => {
    const updatedTech = techniques.map(tech => {
      if (tech.id === entryId) {
        const next = { ...tech, ...updates };
        if (updates.costValue !== undefined || updates.costResourceName !== undefined) {
          const val = updates.costValue !== undefined ? updates.costValue : (tech.costValue || 0);
          const res = updates.costResourceName !== undefined ? updates.costResourceName : (tech.costResourceName || activePowerSource?.cost || 'Mana');
          if (next.category === 'Passive Fähigkeiten' && val === 0) {
            next.cost = 'Passiv';
          } else {
            next.cost = `${val} ${res}`;
          }
        }
        return next;
      }
      return tech;
    });

    onChange(safePowerSources, baseAbilities, updatedTech);
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedTech = techniques.filter(tech => tech.id !== entryId);
    const updatedBa = baseAbilities.map(ba => ({
      ...ba,
      techniqueIds: (ba.techniqueIds || []).filter(id => id !== entryId)
    }));

    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleToggleLinkedBaseAbility = (techId: string, baId: string) => {
    const target = techniques.find(t => t.id === techId);
    if (!target) return;

    const currentIds = target.baseAbilityIds || [];
    let nextIds: string[] = [];

    if (currentIds.includes(baId)) {
      if (currentIds.length <= 1) return;
      nextIds = currentIds.filter(id => id !== baId);
    } else {
      nextIds = [...currentIds, baId];
    }

    const nextNames = nextIds.map(id => {
      const ba = baseAbilities.find(b => b.id === id);
      return ba ? (ba.displayName || ba.name) : '';
    }).filter(Boolean);

    const primaryBa = baseAbilities.find(b => b.id === nextIds[0]);

    handleUpdateEntry(techId, {
      baseAbilityIds: nextIds,
      baseAbilityNames: nextNames,
      element: primaryBa ? primaryBa.element : target.element,
      abilityType: primaryBa ? primaryBa.abilityType : target.abilityType
    });
  };

  // Schnelle Trainings-Steigerungen
  const handleQuickTrainProgress = (tech: TechniqueItem, deltaProgress: number) => {
    const curProgress = tech.score !== undefined ? tech.score : (tech.trainingProgress || 0);
    const newProgress = Math.min(100, Math.max(0, curProgress + deltaProgress));
    const newStatus = newProgress >= 95 ? 'gemeistert' : (newProgress > 0 ? 'in_ausbildung' : 'erlernbar');
    const newHours = (tech.trainingHours || 0) + (deltaProgress > 10 ? 2 : 1);
    
    handleUpdateEntry(tech.id, {
      score: newProgress,
      trainingProgress: newProgress,
      trainingUnits: Math.min(4, Math.floor(newProgress / 25)),
      trainingHours: newHours,
      learningStatus: newStatus,
      masteryLevel: `${getTechniqueMasteryLabel(newProgress)} (${newProgress}%)`
    });
  };

  const handleQuickMastery = (tech: TechniqueItem) => {
    handleUpdateEntry(tech.id, {
      score: 100,
      trainingProgress: 100,
      trainingUnits: 4,
      learningStatus: 'gemeistert',
      tier: tech.category === 'Ultimative Techniken' ? 'Tier 4' : 'Tier 3',
      masteryLevel: 'Meisterhaft (100%)'
    });
  };

  // Transformationen verwalten
  const handleAddTransformation = () => {
    const newId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTrans: TechniqueItem = {
      id: newId,
      name: 'Neue Verwandlungsstufe',
      transformName: 'Neue Gestalt',
      type: 'Transformation',
      category: 'Transformationen',
      tier: 'Tier 1',
      description: 'Optische und körperliche Verwandlung mit speziellen Modifikatoren.',
      cost: '20 Mana',
      costValue: 20,
      costResourceName: activePowerSource?.cost || 'Mana',
      range: 'Selbst',
      duration: '5 Runden',
      isTransformationOnly: false,
      chibiForm: {
        enabled: false,
        bodyScale: 0.6,
        visualAge: 'Kindlich',
        chibiOnPowerOverload: {
          enabled: false,
          activationThreshold: 100,
          recoveryThreshold: 80,
          durationGameMinutes: 30,
          autoRevert: true
        }
      }
    };

    const updatedTech = [...techniques, newTrans];
    onChange(safePowerSources, baseAbilities, updatedTech);
    setSelectedTransformationId(newId);
  };

  const handleTechniqueCreatedViaSmartFill = (newTech: Partial<TechniqueItem>) => {
    if (!activePowerSource) return;

    const newId = newTech.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const costResource = newTech.costResourceName || activePowerSource.cost || 'Mana';

    const baseAbilityIds = newTech.baseAbilityIds || (activeBaseAbility ? [activeBaseAbility.id] : []);
    const baseAbilityNames = newTech.baseAbilityNames || (activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name] : []);
    const element = newTech.element || (activeBaseAbility ? activeBaseAbility.element : 'Neutral');
    const abilityType = newTech.abilityType || (activeBaseAbility ? activeBaseAbility.abilityType : 'creation_manipulation');

    const entryToAdd: TechniqueItem = {
      id: newId,
      name: newTech.name || 'Neue Technik',
      description: newTech.description || '',
      category: newTech.category || activeCategory,
      type: newTech.type || 'Angriff',
      subtype: newTech.subtype || '',
      mode: newTech.mode || 'Normal',
      tier: newTech.tier || 'Tier 1',
      baseAbilityIds,
      baseAbilityNames,
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      element,
      abilityType,
      targetType: newTech.targetType || 'Selbst / Verbündete / Feinde',
      effects: newTech.effects || [],
      costResourceName: costResource,
      costValue: newTech.costValue !== undefined ? newTech.costValue : 10,
      costFormula: 'absolut',
      cost: newTech.cost || `${newTech.costValue || 10} ${costResource}`,
      range: newTech.range || 'Nahkampf / Mittlere Distanz',
      duration: newTech.duration || 'Sofort',
      level: 1,
      maxLevel: 10,
      xp: 0,
      xpNeeded: 100,
      isLearnable: true,
      learningStatus: 'erlernbar',
      ...newTech
    };

    const updatedTech = [...techniques, entryToAdd];

    const updatedBa = activeBaseAbility
      ? baseAbilities.map(ba => {
          if (ba.id === activeBaseAbility.id) {
            return {
              ...ba,
              techniqueIds: [...(ba.techniqueIds || []), newId]
            };
          }
          return ba;
        })
      : baseAbilities;

    setExpandedMap(prev => ({ ...prev, [newId]: true }));
    onChange(safePowerSources, updatedBa, updatedTech);
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* ============================================================ */}
      {/* 1. KRAFTQUELLEN-SELEKTOR & MANAGEMENT                         */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <LucideIcons.Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Kraftquellen ({safePowerSources.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Form-Umschalter: Normalform vs. Transformationen */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFormId('normal')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedFormId === 'normal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normalform
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormId(selectedTransformationId || 'trans_main')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFormId !== 'normal'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Transformationen</span>
                {transformationItems.length > 0 && (
                  <span className="text-[10px] px-1 bg-slate-900/50 rounded font-bold">
                    {transformationItems.length}
                  </span>
                )}
              </button>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleAddPowerSource}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <LucideIcons.Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Kraftquelle hinzufügen</span>
              </button>
            )}
          </div>
        </div>

        {/* Kraftquellen-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {safePowerSources.map((ps, psIdx) => {
            const isSelected = activePowerSourceId === ps.id;
            const displayName = ps.powerName || ps.source || `Kraftquelle ${psIdx + 1}`;
            return (
              <button
                key={`ps-tab-${ps.id || psIdx}`}
                type="button"
                onClick={() => setActivePowerSourceId(ps.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800 text-amber-400 border-amber-500/60 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <LucideIcons.Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{displayName}</span>
                {ps.cost && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-400 font-mono">
                    {ps.cost}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Aktive Kraftquelle Editor */}
        {activePowerSource && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  Name der Kraftquelle
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                  placeholder="z.B. Äther-Mana, Ki, Chakra..."
                  value={activePowerSource.powerName || activePowerSource.source || ''}
                  onChange={e => handleUpdatePowerSource(activePowerSource.id, { powerName: e.target.value, source: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  Kostenressource
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                  placeholder="z.B. MP, Ausdauer, Fokus..."
                  value={activePowerSource.cost || ''}
                  onChange={e => handleUpdatePowerSource(activePowerSource.id, { cost: e.target.value })}
                />
              </div>

              <div className="flex flex-col justify-end">
                {!readOnly && safePowerSources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeletePowerSource(activePowerSource.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-1.5 h-[30px] cursor-pointer"
                  >
                    <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                    <span>Kraftquelle entfernen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                Beschreibung der Kraftquelle & Herkunft
              </label>
              <AutoExpandingTextarea
                disabled={readOnly}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[44px] leading-relaxed"
                placeholder="Ursprung, Schwingungsmuster oder Natur dieser Kraft..."
                value={activePowerSource.powerDescription || ''}
                onChange={e => handleUpdatePowerSource(activePowerSource.id, { powerDescription: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. HAUPTNAVIGATION: DIE 7 BEREICHE                            */}
      {/* ============================================================ */}
      {selectedFormId === 'normal' ? (
        <>
          {/* GRUNDFÄHIGKEITEN (KINESEN & MANIPULATIONEN) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <LucideIcons.Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Grundfähigkeiten / Elementare Disziplinen
                </span>
              </div>

              {!readOnly && activePowerSource && (
                <button
                  type="button"
                  onClick={handleAddBaseAbility}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grundfähigkeit hinzufügen</span>
                </button>
              )}
            </div>

            {/* Grundfähigkeiten Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentBaseAbilities.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-1">
                  Keine Grundfähigkeiten für diese Kraftquelle definiert (Techniken werden direkt zugeordnet).
                </div>
              ) : (
                currentBaseAbilities.map((ba, baIdx) => {
                  const isSelected = activeBaseAbilityId === ba.id;
                  const displayName = ba.displayName || ba.name || `Grundfähigkeit ${baIdx + 1}`;
                  return (
                    <button
                      key={`ba-tab-${ba.id || baIdx}`}
                      type="button"
                      onClick={() => setActiveBaseAbilityId(ba.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{displayName}</span>
                      {ba.element && (
                        <span className="text-[10px] px-1 bg-slate-900 text-slate-300 rounded">
                          {ba.element}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Aktive Grundfähigkeit Konfiguration */}
            {activeBaseAbility && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Element
                  </label>
                  <select
                    disabled={readOnly}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                    value={activeBaseAbility.element || 'Feuer'}
                    onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { element: e.target.value })}
                  >
                    {ADVENTURE_FORGE_ELEMENTS.map(el => (
                      <option key={`el-opt-${el}`} value={el}>{el}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Ausprägung / Kinese
                  </label>
                  <select
                    disabled={readOnly}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                    value={activeBaseAbility.abilityType || 'creation_manipulation'}
                    onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { abilityType: e.target.value as AbilityType })}
                  >
                    {ABILITY_TYPES.map(at => (
                      <option key={`at-opt-${at.id}`} value={at.id}>{at.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end justify-end">
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBaseAbility(activeBaseAbility.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 transition flex items-center gap-1.5 h-[30px] cursor-pointer"
                    >
                      <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                      <span>Entfernen</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TAB-LEISTE: DIE 7 SYSTEM-BEREICHE */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                System-Bereiche &amp; Fertigkeitsbäume
              </span>
              <span className="text-[10px] text-slate-400">
                Aktiv: {activeBaseAbility ? (activeBaseAbility.displayName || activeBaseAbility.name) : (activePowerSource ? (activePowerSource.powerName || activePowerSource.source || 'Kraftquelle') : 'Gesamtsystem')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {CATEGORY_TABS.map((tab, tabIdx) => {
                const isTabActive = activeCategory === tab;
                const count = categoryCounts[tab] || 0;
                return (
                  <button
                    key={`cat-tab-${tab}-${tabIdx}`}
                    type="button"
                    onClick={() => setActiveCategory(tab)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer border min-w-0 ${
                      isTabActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                        : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-left leading-tight break-words text-xs">{tab}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap ${
                      isTabActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* BEREICH 1: TRAINING & ERLERNBARE FERTIGKEITEN               */}
          {/* ============================================================ */}
          {activeCategory === 'Training & Erlernbare Fertigkeiten' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-4">
              {/* Header & Statistiken */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Erlernbar Gesamt
                  </span>
                  <span className="text-base sm:text-lg font-black text-amber-400">
                    {trainingStats.total}
                  </span>
                  <span className="text-[10px] text-slate-400">Im Ausbildungsplan</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wide">
                    In Ausbildung
                  </span>
                  <span className="text-base sm:text-lg font-black text-cyan-400">
                    {trainingStats.inAusbildung}
                  </span>
                  <span className="text-[10px] text-slate-400">Aktives Training</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
                    Gemeistert
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {trainingStats.gemeistert}
                  </span>
                  <span className="text-[10px] text-slate-400">Vollständig erlernt</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Bereit / Gesperrt
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-200">
                    {trainingStats.erlernbar} / {trainingStats.gesperrt}
                  </span>
                  <span className="text-[10px] text-slate-400">Voraussetzungen</span>
                </div>
              </div>

              {/* Filter- & Suchleiste */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <LucideIcons.Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 outline-none"
                    placeholder="Fertigkeit, Lehrmeister, Attribut oder Voraussetzung suchen..."
                    value={trainingSearchTerm}
                    onChange={e => setTrainingSearchTerm(e.target.value)}
                  />
                  {trainingSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setTrainingSearchTerm('')}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <LucideIcons.X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Statusfilter */}
                <div className="flex flex-wrap items-center gap-1">
                  {(['alle', 'in_ausbildung', 'erlernbar', 'gemeistert', 'gesperrt'] as const).map(st => {
                    const isStActive = trainingStatusFilter === st;
                    const label = st === 'alle' ? 'Alle Status' : st === 'in_ausbildung' ? 'In Ausbildung' : st === 'erlernbar' ? 'Erlernbar' : st === 'gemeistert' ? 'Gemeistert' : 'Gesperrt';
                    return (
                      <button
                        key={`train-st-${st}`}
                        type="button"
                        onClick={() => setTrainingStatusFilter(st)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer border ${
                          isStActive
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleAddEntry('Training & Erlernbare Fertigkeiten')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
                  >
                    <LucideIcons.Plus className="w-3.5 h-3.5" />
                    <span>Ausbildungsziel anlegen</span>
                  </button>
                )}
              </div>

              {/* Liste aller erlernbaren Fertigkeiten */}
              {trainingEntries.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
                  <LucideIcons.GraduationCap className="w-8 h-8 text-slate-400 opacity-60" />
                  <p>Keine erlernbaren Fertigkeiten für diesen Filter gefunden.</p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleAddEntry('Training & Erlernbare Fertigkeiten')}
                      className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcons.Plus className="w-3.5 h-3.5" />
                      <span>Erstes Ausbildungsziel anlegen</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {trainingEntries.map((entry, idx) => {
                    const currentScore = entry.score !== undefined ? entry.score : (entry.trainingProgress || 0);
                    const status = entry.learningStatus || (currentScore >= 95 ? 'gemeistert' : currentScore > 0 ? 'in_ausbildung' : 'erlernbar');
                    const masteryLabel = getTechniqueMasteryLabel(currentScore);
                    const isExpanded = expandedMap[entry.id] || false;

                    return (
                      <div
                        key={`train-item-${entry.id || idx}`}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-3 transition-all"
                      >
                        {/* Kopfzeile */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{entry.name}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-semibold">
                              {entry.category || 'Techniken'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              status === 'gemeistert'
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : status === 'in_ausbildung'
                                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                                : status === 'gesperrt'
                                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                : 'bg-amber-950/60 border-amber-800 text-amber-300'
                            }`}>
                              {status === 'gemeistert' ? 'Gemeistert' : status === 'in_ausbildung' ? 'In Ausbildung' : status === 'gesperrt' ? 'Gesperrt' : 'Erlernbar'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-amber-400 font-bold">
                              {masteryLabel} ({currentScore}%)
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCardExpanded(entry.id, false)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer"
                            >
                              {isExpanded ? 'Details verbergen' : 'Details bearbeiten'}
                            </button>
                          </div>
                        </div>

                        {/* Trainingsfortschritt & Schnell-Aktionen */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <LucideIcons.Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Trainingsaufwand: {entry.trainingHours || 0} / {entry.targetTrainingHours || 20} Std.</span>
                            </div>
                            <span>Fortschritt: {currentScore}%</span>
                          </div>

                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, currentScore)}%` }}
                            />
                          </div>

                          {!readOnly && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleQuickTrainProgress(entry, 10)}
                                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium cursor-pointer"
                                >
                                  +1 Praxis-Übung
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickTrainProgress(entry, 25)}
                                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium cursor-pointer"
                                >
                                  +1 Übungseinheit (+25%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickMastery(entry)}
                                  className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold cursor-pointer"
                                >
                                  Meisterung abschließen
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <select
                                  disabled={readOnly}
                                  value={status}
                                  onChange={e => handleUpdateEntry(entry.id, { learningStatus: e.target.value })}
                                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
                                >
                                  <option value="erlernbar">Status: Erlernbar</option>
                                  <option value="in_ausbildung">Status: In Ausbildung</option>
                                  <option value="gemeistert">Status: Gemeistert</option>
                                  <option value="gesperrt">Status: Gesperrt</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Voraussetzungen & Quellen */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/60 border border-slate-850 rounded-lg p-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Lehrmeister / Quelle:
                            </span>
                            <span className="text-slate-200">
                              {entry.requiredTeacherOrScroll || 'Freies Selbststudium'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Voraussetzungen:
                            </span>
                            <span className="text-slate-200">
                              {entry.requiredAttribute || entry.learningRequirements || 'Keine Vorbedingungen'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Vorstufen-Techniken:
                            </span>
                            <span className="text-slate-200">
                              {entry.prerequisiteTechniques || 'Keine'}
                            </span>
                          </div>
                        </div>

                        {/* Aufklappbare Detail-Ansicht (Vollständige TechniqueCard) */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-800">
                            <TechniqueCard
                              entry={entry}
                              category={entry.category || 'Techniken'}
                              readOnly={readOnly}
                              isExpanded={true}
                              onToggleExpanded={() => toggleCardExpanded(entry.id, false)}
                              onUpdate={updates => handleUpdateEntry(entry.id, updates)}
                              onDelete={() => handleDeleteEntry(entry.id)}
                              activePowerSource={activePowerSource}
                              baseAbilities={baseAbilities}
                              onToggleLinkedBaseAbility={baId => handleToggleLinkedBaseAbility(entry.id, baId)}
                              progressionLogic={progressionLogic}
                              availableTransformations={availableTransformations}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* BEREICH 5: WAFFENBEHERRSCHUNG                                 */}
          {/* ============================================================ */}
          {activeCategory === 'Waffenbeherrschung' && (
            <WeaponSkillTree
              techniques={techniques}
              activeBaseAbility={activeBaseAbility}
              baseAbilities={baseAbilities}
              activePowerSource={activePowerSource}
              progressionLogic={progressionLogic}
              onUpdateEntry={handleUpdateEntry}
              onAddEntry={(newEntry) => {
                if (newEntry) {
                  const entryToAdd: TechniqueItem = {
                    id: newEntry.id || `tech_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    name: newEntry.name || 'Waffenbeherrschung (Rang 1)',
                    category: 'Waffenbeherrschung',
                    powerSourceId: activePowerSource?.id,
                    baseAbilityIds: activeBaseAbility ? [activeBaseAbility.id] : [],
                    baseAbilityNames: activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name || ''] : [],
                    ...newEntry
                  };
                  const updatedBa = baseAbilities.map(ba => {
                    if (activeBaseAbility && ba.id === activeBaseAbility.id) {
                      return {
                        ...ba,
                        techniqueIds: [...(ba.techniqueIds || []), entryToAdd.id]
                      };
                    }
                    return ba;
                  });
                  onChange(powerSources, updatedBa, [...techniques, entryToAdd]);
                } else {
                  handleAddEntry('Waffenbeherrschung');
                }
              }}
              onDeleteEntry={handleDeleteEntry}
              readOnly={readOnly}
              onOpenSmartFill={() => {
                setSmartFillModalState({
                  isOpen: true,
                  powerSourceId: activePowerSource?.id,
                  baseAbilityId: activeBaseAbility?.id
                });
              }}
            />
          )}

          {/* ============================================================ */}
          {/* BEREICHE 2-4: PASSIVE, TECHNIKEN & ULTIMATIVE                */}
          {/* ============================================================ */}
          {(activeCategory === 'Passive Fähigkeiten' || activeCategory === 'Techniken' || activeCategory === 'Ultimative Techniken') && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    {activeBaseAbility ? (activeBaseAbility.displayName || activeBaseAbility.name) : (activePowerSource ? (activePowerSource.powerName || activePowerSource.source || 'Kraftquelle') : 'Keine Kraftquelle')}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="text-xs font-extrabold text-amber-400">
                    {activeCategory} ({activeEntries.length})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {progressionLogic === 'ep' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-[11px] text-amber-300 font-medium">
                      <LucideIcons.Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>EP-basiert (100 EP/Stufe)</span>
                    </span>
                  )}
                  {progressionLogic === 'training' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-300 font-medium">
                      <LucideIcons.Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Training &amp; Übung (4 Einheiten)</span>
                    </span>
                  )}
                  {progressionLogic === 'milestone' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-[11px] text-purple-300 font-medium">
                      <LucideIcons.Award className="w-3.5 h-3.5 text-purple-400" />
                      <span>Story-Meilensteine</span>
                    </span>
                  )}
                  {progressionLogic === 'static' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-medium">
                      <LucideIcons.Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Statische Talentpunkte</span>
                    </span>
                  )}

                  {activeEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const anyCollapsed = activeEntries.some(e => {
                          const defExp = activeEntries.length <= 4;
                          return expandedMap[e.id] !== undefined ? !expandedMap[e.id] : !defExp;
                        });
                        handleToggleAll(anyCollapsed, activeEntries);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                    >
                      {activeEntries.some(e => {
                        const defExp = activeEntries.length <= 4;
                        return expandedMap[e.id] !== undefined ? !expandedMap[e.id] : !defExp;
                      })
                        ? 'Alle aufklappen'
                        : 'Alle zuklappen'}
                    </button>
                  )}

                  {!readOnly && activePowerSource && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSmartFillModalState({
                            isOpen: true,
                            powerSourceId: activePowerSource?.id,
                            baseAbilityId: activeBaseAbility?.id
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="KI-gestützte Erstellung"
                      >
                        <LucideIcons.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Smart Fill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddEntry(activeCategory)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <LucideIcons.Plus className="w-3.5 h-3.5" />
                        <span>{CATEGORY_ADD_LABELS[activeCategory]}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!activePowerSource ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
                  <p>Bitte erstelle oder wähle zuerst eine Kraftquelle aus.</p>
                </div>
              ) : activeEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
                  <p>
                    Keine Einträge für &bdquo;{activeCategory}&ldquo;{activeBaseAbility ? ` in ${activeBaseAbility.displayName || activeBaseAbility.name}` : ''} definiert.
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleAddEntry(activeCategory)}
                      className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcons.Plus className="w-3.5 h-3.5" />
                      <span>{CATEGORY_EMPTY_LABELS[activeCategory]}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeEntries.map((entry, idx) => {
                    const defaultExpanded = activeEntries.length <= 4;
                    const isExpanded = expandedMap[entry.id] !== undefined ? expandedMap[entry.id] : defaultExpanded;

                    return (
                      <TechniqueCard
                        key={`tech-card-${entry.id || idx}`}
                        entry={entry}
                        category={activeCategory}
                        readOnly={readOnly}
                        isExpanded={isExpanded}
                        onToggleExpanded={() => toggleCardExpanded(entry.id, defaultExpanded)}
                        onUpdate={updates => handleUpdateEntry(entry.id, updates)}
                        onDelete={() => handleDeleteEntry(entry.id)}
                        activePowerSource={activePowerSource}
                        baseAbilities={baseAbilities}
                        onToggleLinkedBaseAbility={baId => handleToggleLinkedBaseAbility(entry.id, baId)}
                        progressionLogic={progressionLogic}
                        availableTransformations={availableTransformations}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : selectedTransformation ? (
        /* ============================================================ */
        /* TRANSFORMATIONEN-ANSICHT                                      */
        /* ============================================================ */
        <div className="bg-slate-950/70 border border-cyan-900/50 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  Transformation
                </span>
                <h4 className="text-sm sm:text-base font-black text-white">
                  {selectedTransformation.transformName || selectedTransformation.name}
                </h4>
                {selectedTransformation.tier && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                    {selectedTransformation.tier}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTransformationId}
                onChange={e => setSelectedTransformationId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-cyan-300 outline-none focus:border-cyan-500 font-bold cursor-pointer"
              >
                {transformationItems.map(t => (
                  <option key={`trans-sel-${t.id}`} value={t.id}>
                    {t.transformName || t.name}
                  </option>
                ))}
              </select>

              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddTransformation}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1 cursor-pointer"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5" />
                  <span>Stufe hinzufügen</span>
                </button>
              )}
            </div>
          </div>

          {/* Transformationseigene Techniken */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {TRANS_CATEGORY_TABS.map(tab => (
                <button
                  key={`trans-tab-${tab}`}
                  type="button"
                  onClick={() => setActiveTransCategory(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    activeTransCategory === tab
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="ml-1 text-[10px] opacity-80">({transCategoryCounts[tab] || 0})</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {activeTransEntries.map((entry, idx) => (
                <TechniqueCard
                  key={`trans-tech-card-${entry.id || idx}`}
                  entry={entry}
                  category={activeTransCategory}
                  readOnly={readOnly}
                  isExpanded={expandedMap[entry.id] || false}
                  onToggleExpanded={() => toggleCardExpanded(entry.id, false)}
                  onUpdate={updates => handleUpdateEntry(entry.id, updates)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  activePowerSource={activePowerSource}
                  baseAbilities={baseAbilities}
                  onToggleLinkedBaseAbility={baId => handleToggleLinkedBaseAbility(entry.id, baId)}
                  progressionLogic={progressionLogic}
                  availableTransformations={availableTransformations}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center flex flex-col items-center gap-3">
          <LucideIcons.Zap className="w-8 h-8 text-cyan-400 opacity-60" />
          <p className="text-xs text-slate-300">
            Keine Transformation ausgewählt oder noch keine Transformationen definiert.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddTransformation}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <LucideIcons.Plus className="w-4 h-4" />
              <span>Erste Transformation erstellen</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. KI SMART FILL MODAL                                       */}
      {/* ============================================================ */}
      {smartFillModalState.isOpen && (
        <TechniqueSmartFillModal
          isOpen={smartFillModalState.isOpen}
          onClose={() => setSmartFillModalState({ isOpen: false })}
          powerSources={safePowerSources}
          baseAbilities={baseAbilities}
          initialPowerSourceId={smartFillModalState.powerSourceId || activePowerSource?.id}
          initialBaseAbilityId={smartFillModalState.baseAbilityId || activeBaseAbility?.id}
          characterName={characterName}
          characterRole={characterRole}
          worldTitle={worldTitle}
          onTechniqueCreated={handleTechniqueCreatedViaSmartFill}
        />
      )}
    </div>
  );
};

export default TechniqueHierarchyTree;
