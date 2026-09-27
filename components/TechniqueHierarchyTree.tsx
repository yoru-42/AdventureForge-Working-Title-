// -*- coding: utf-8 -*-
import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  BaseAbility, 
  CharacterPowerSource, 
  TechniqueItem, 
  AbilityType, 
  PowerSystem,
  CharacterPower,
  CharacterAbility,
  CharacterTechnique,
  CharacterPowerForm,
  ProgressionState
} from '../types';
import { 
  ADVENTURE_FORGE_ELEMENTS, 
  ABILITY_TYPES, 
  resolveKinesisName, 
  formatAbilityTypeLabel,
  buildCharacterPowerHierarchy,
  convertPowerHierarchyToLegacy,
  slugifyPowerId,
  generatePowerSystemId,
  generateCharacterPowerId,
  generateCharacterAbilityId,
  generateCharacterTechniqueId,
  generateCharacterPowerFormId,
  characterTechniqueToLegacyTechnique,
  characterPowerFormToLegacyTransformation
} from '../utils/abilityHierarchy';
import { 
  ALL_WEAPONS, 
  WEAPON_MASTERY_RANKS, 
  WIELDING_STYLES 
} from '../lib/weaponTypesData';
import { TechniqueSmartFillModal } from './TechniqueSmartFillModal';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { WeaponSkillTree } from './WeaponSkillTree';
import { TechniqueCard, getTechniqueMasteryLabel } from './TechniqueCard';

// Legacy Kompatibilitäts-Konstanten für externe Tests
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
  // Neue hierarchische Datenmodell-Props
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
  costResources,
  world,
  // Neue hierarchische Datenmodell-Props
  powerSystems: initialPowerSystems,
  powers: initialPowers,
  abilities: initialAbilities,
  characterTechniques: initialTechniques,
  forms: initialForms,
  character,
  onHierarchyChange
}) => {
  // -------------------------------------------------------------
  // 1. ZENTRALE DATENQUELLE: DIE NEUE POWER-HIERARCHIE
  // -------------------------------------------------------------
  const powerHierarchy = useMemo(() => {
    if (initialPowerSystems || initialPowers || initialAbilities || initialTechniques || initialForms) {
      return buildCharacterPowerHierarchy({
        powerSystems: initialPowerSystems,
        powers: initialPowers,
        characterAbilities: initialAbilities,
        characterTechniques: initialTechniques,
        powerForms: initialForms
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
  }, [
    initialPowerSystems,
    initialPowers,
    initialAbilities,
    initialTechniques,
    initialForms,
    character,
    powerSources,
    baseAbilities,
    techniques
  ]);

  // Synchronisation mit übergeordnetem onHierarchyChange-Callback
  useEffect(() => {
    if (onHierarchyChange && powerHierarchy) {
      onHierarchyChange(powerHierarchy);
    }
  }, [powerHierarchy, onHierarchyChange]);

  // -------------------------------------------------------------
  // 2. HAUPTNAVIGATION & EBENEN-ZUSTÄNDE
  // -------------------------------------------------------------
  const [mainView, setMainView] = useState<'powers' | 'weapons'>('powers');
  const [activeSystemId, setActiveSystemId] = useState<string>('');
  const [activePowerId, setActivePowerId] = useState<string>('');
  const [powerSubTab, setPowerSubTab] = useState<'abilities' | 'forms'>('abilities');
  const [activeAbilityId, setActiveAbilityId] = useState<string>('');
  const [activeFormId, setActiveFormId] = useState<string>('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Modal State für Smart Fill
  const [smartFillModalState, setSmartFillModalState] = useState<{
    isOpen: boolean;
    powerId?: string;
    abilityId?: string;
  }>({ isOpen: false });

  // -------------------------------------------------------------
  // 3. AKTIVE ENTITÄTEN AUFLÖSEN (KRAFTSYSTEM -> KRAFT -> ABILITY / FORM)
  // -------------------------------------------------------------
  const systems = powerHierarchy.powerSystems || [];
  const powers = powerHierarchy.powers || [];
  const abilities = powerHierarchy.abilities || [];
  const techniquesList = powerHierarchy.techniques || [];
  const forms = powerHierarchy.forms || [];

  // Aktives Kraftsystem
  useEffect(() => {
    if (systems.length > 0) {
      if (!activeSystemId || !systems.some(s => s.id === activeSystemId)) {
        setActiveSystemId(systems[0].id);
      }
    } else {
      setActiveSystemId('');
    }
  }, [systems, activeSystemId]);

  const activeSystem = useMemo(() => {
    if (!activeSystemId) return systems[0] || null;
    return systems.find(s => s.id === activeSystemId) || systems[0] || null;
  }, [systems, activeSystemId]);

  // Kräfte des aktiven Kraftsystems
  const currentPowers = useMemo(() => {
    if (!activeSystem) return powers;
    return powers.filter(p => p.powerSystemId === activeSystem.id);
  }, [powers, activeSystem]);

  // Aktive Kraft
  useEffect(() => {
    if (currentPowers.length > 0) {
      if (!activePowerId || !currentPowers.some(p => p.id === activePowerId)) {
        setActivePowerId(currentPowers[0].id);
      }
    } else {
      setActivePowerId('');
    }
  }, [currentPowers, activePowerId]);

  const activePower = useMemo(() => {
    if (!activePowerId) return currentPowers[0] || null;
    return currentPowers.find(p => p.id === activePowerId) || currentPowers[0] || null;
  }, [currentPowers, activePowerId]);

  // Fähigkeiten der aktiven Kraft
  const currentAbilities = useMemo(() => {
    if (!activePower) return [];
    return abilities.filter(a => a.powerId === activePower.id);
  }, [abilities, activePower]);

  // Aktive Fähigkeit
  useEffect(() => {
    if (currentAbilities.length > 0) {
      if (!activeAbilityId || !currentAbilities.some(a => a.id === activeAbilityId)) {
        setActiveAbilityId(currentAbilities[0].id);
      }
    } else {
      setActiveAbilityId('');
    }
  }, [currentAbilities, activeAbilityId]);

  const activeAbility = useMemo(() => {
    if (!activeAbilityId) return currentAbilities[0] || null;
    return currentAbilities.find(a => a.id === activeAbilityId) || currentAbilities[0] || null;
  }, [currentAbilities, activeAbilityId]);

  // Formen der aktiven Kraft
  const currentForms = useMemo(() => {
    if (!activePower) return [];
    return forms.filter(f => f.powerId === activePower.id);
  }, [forms, activePower]);

  // Aktive Form
  useEffect(() => {
    if (currentForms.length > 0) {
      if (!activeFormId || !currentForms.some(f => f.id === activeFormId)) {
        setActiveFormId(currentForms[0].id);
      }
    } else {
      setActiveFormId('');
    }
  }, [currentForms, activeFormId]);

  const activeForm = useMemo(() => {
    if (!activeFormId) return currentForms[0] || null;
    return currentForms.find(f => f.id === activeFormId) || currentForms[0] || null;
  }, [currentForms, activeFormId]);

  // Techniken der aktiven Fähigkeit
  const currentAbilityTechniques = useMemo(() => {
    if (!activeAbility) return [];
    return techniquesList.filter(t => t.abilityId === activeAbility.id);
  }, [techniquesList, activeAbility]);

  // Techniken der aktiven Form
  const currentFormTechniques = useMemo(() => {
    if (!activeForm) return [];
    return techniquesList.filter(t => 
      t.unlockedByTransformationId === activeForm.id ||
      (Array.isArray(t.unlockedByTransformationIds) && t.unlockedByTransformationIds.includes(activeForm.id)) ||
      (t.parentTransformationId === activeForm.id) ||
      (activeForm.techniqueIds && activeForm.techniqueIds.includes(t.id))
    );
  }, [techniquesList, activeForm]);

  // Waffen-Techniken (bleiben außerhalb der Power-Hierarchie)
  const weaponTechniques = useMemo(() => {
    return techniques.filter(t => t.category === 'Waffenbeherrschung' || t.category === 'Talente');
  }, [techniques]);

  // -------------------------------------------------------------
  // 4. ZENTRALE SYNCHRONISATION NACH ÄNDERUNGEN
  // -------------------------------------------------------------
  const applyHierarchyUpdate = (updatedHierarchy: {
    powerSystems: PowerSystem[];
    powers: CharacterPower[];
    abilities: CharacterAbility[];
    techniques: CharacterTechnique[];
    forms: CharacterPowerForm[];
  }) => {
    if (onHierarchyChange) {
      onHierarchyChange(updatedHierarchy);
    }
    const legacy = convertPowerHierarchyToLegacy(updatedHierarchy);
    // Erhalte eventuelle separate Waffen-Techniken im Legacy-Array
    const nonPowerLegacyTech = techniques.filter(
      t => t.category === 'Waffenbeherrschung' || t.category === 'Berufe' || t.category === 'Alltagskompetenzen'
    );
    onChange(legacy.powerSources, legacy.baseAbilities, [...legacy.techniques, ...nonPowerLegacyTech]);
  };

  // -------------------------------------------------------------
  // 5. HANDLERS: KRAFTSYSTEM (Ebene 1)
  // -------------------------------------------------------------
  const handleAddPowerSystem = () => {
    const sysName = `Kraftsystem ${systems.length + 1}`;
    const newSysId = generatePowerSystemId(sysName, systems.map(s => s.id));
    const newPowerId = generateCharacterPowerId(newSysId, 'Konkrete Kraft', powers.map(p => p.id));

    const newSys: PowerSystem = {
      id: newSysId,
      name: sysName,
      systemType: 'Magie',
      resourceName: 'Mana',
      powerIds: [newPowerId]
    };

    const newPower: CharacterPower = {
      id: newPowerId,
      powerSystemId: newSysId,
      name: `Konkrete Kraft`,
      resourceName: 'Mana',
      abilityIds: [],
      formIds: []
    };

    const nextSystems = [...systems, newSys];
    const nextPowers = [...powers, newPower];

    applyHierarchyUpdate({
      powerSystems: nextSystems,
      powers: nextPowers,
      abilities,
      techniques: techniquesList,
      forms
    });

    setActiveSystemId(newSysId);
    setActivePowerId(newPowerId);
  };

  const handleUpdatePowerSystem = (sysId: string, updates: Partial<PowerSystem>) => {
    const nextSystems = systems.map(s => (s.id === sysId ? { ...s, ...updates } : s));
    applyHierarchyUpdate({
      powerSystems: nextSystems,
      powers,
      abilities,
      techniques: techniquesList,
      forms
    });
  };

  const handleDeletePowerSystem = (sysId: string) => {
    const remainingSystems = systems.filter(s => s.id !== sysId);
    const deletedPowerIds = new Set(powers.filter(p => p.powerSystemId === sysId).map(p => p.id));
    const remainingPowers = powers.filter(p => p.powerSystemId !== sysId);
    const deletedAbilityIds = new Set(abilities.filter(a => a.powerId && deletedPowerIds.has(a.powerId)).map(a => a.id));
    const remainingAbilities = abilities.filter(a => !a.powerId || !deletedPowerIds.has(a.powerId));
    const remainingTechniques = techniquesList.filter(t => !t.abilityId || !deletedAbilityIds.has(t.abilityId));
    const remainingForms = forms.filter(f => !f.powerId || !deletedPowerIds.has(f.powerId));

    applyHierarchyUpdate({
      powerSystems: remainingSystems,
      powers: remainingPowers,
      abilities: remainingAbilities,
      techniques: remainingTechniques,
      forms: remainingForms
    });
  };

  // -------------------------------------------------------------
  // 6. HANDLERS: KRAFT / CHARACTERPOWER (Ebene 2)
  // -------------------------------------------------------------
  const handleAddPower = () => {
    if (!activeSystem) return;
    const powerName = `Neue Kraft ${currentPowers.length + 1}`;
    const newPowerId = generateCharacterPowerId(activeSystem.id, powerName, powers.map(p => p.id));

    const newPower: CharacterPower = {
      id: newPowerId,
      powerSystemId: activeSystem.id,
      name: powerName,
      resourceName: activeSystem.resourceName || 'Mana',
      abilityIds: [],
      formIds: []
    };

    const nextSystems = systems.map(s => {
      if (s.id === activeSystem.id) {
        return { ...s, powerIds: [...(s.powerIds || []), newPowerId] };
      }
      return s;
    });

    const nextPowers = [...powers, newPower];

    applyHierarchyUpdate({
      powerSystems: nextSystems,
      powers: nextPowers,
      abilities,
      techniques: techniquesList,
      forms
    });

    setActivePowerId(newPowerId);
  };

  const handleUpdatePower = (powerId: string, updates: Partial<CharacterPower>) => {
    const nextPowers = powers.map(p => (p.id === powerId ? { ...p, ...updates } : p));
    applyHierarchyUpdate({
      powerSystems: systems,
      powers: nextPowers,
      abilities,
      techniques: techniquesList,
      forms
    });
  };

  const handleDeletePower = (powerId: string) => {
    const remainingPowers = powers.filter(p => p.id !== powerId);
    const nextSystems = systems.map(s => ({
      ...s,
      powerIds: (s.powerIds || []).filter(id => id !== powerId)
    }));

    const deletedAbilityIds = new Set(abilities.filter(a => a.powerId === powerId).map(a => a.id));
    const remainingAbilities = abilities.filter(a => a.powerId !== powerId);
    const remainingTechniques = techniquesList.filter(t => !t.abilityId || !deletedAbilityIds.has(t.abilityId));
    const remainingForms = forms.filter(f => f.powerId !== powerId);

    applyHierarchyUpdate({
      powerSystems: nextSystems,
      powers: remainingPowers,
      abilities: remainingAbilities,
      techniques: remainingTechniques,
      forms: remainingForms
    });
  };

  // -------------------------------------------------------------
  // 7. HANDLERS: FÄHIGKEIT / CHARACTERABILITY (Ebene 3)
  // -------------------------------------------------------------
  const handleAddAbility = () => {
    if (!activePower) return;
    const defaultElement = ADVENTURE_FORGE_ELEMENTS[1] || 'Feuer';
    const defaultType: AbilityType = 'creation_manipulation';
    const initialName = resolveKinesisName(defaultElement, defaultType);
    const newAbId = generateCharacterAbilityId(activePower.id, initialName, abilities.map(a => a.id));

    const newAbility: CharacterAbility = {
      id: newAbId,
      powerId: activePower.id,
      name: initialName,
      element: defaultElement,
      abilityType: formatAbilityTypeLabel(defaultType),
      description: '',
      techniqueIds: []
    };

    const nextPowers = powers.map(p => {
      if (p.id === activePower.id) {
        return { ...p, abilityIds: [...(p.abilityIds || []), newAbId] };
      }
      return p;
    });

    const nextAbilities = [...abilities, newAbility];

    applyHierarchyUpdate({
      powerSystems: systems,
      powers: nextPowers,
      abilities: nextAbilities,
      techniques: techniquesList,
      forms
    });

    setActiveAbilityId(newAbId);
  };

  const handleUpdateAbility = (abilityId: string, updates: Partial<CharacterAbility>) => {
    const nextAbilities = abilities.map(a => {
      if (a.id === abilityId) {
        const next = { ...a, ...updates };
        if ((updates.element || updates.abilityType) && !updates.name) {
          const el = updates.element || a.element || 'Neutral';
          const at = updates.abilityType || a.abilityType || 'creation_manipulation';
          next.name = resolveKinesisName(el, at);
        }
        return next;
      }
      return a;
    });

    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities: nextAbilities,
      techniques: techniquesList,
      forms
    });
  };

  const handleDeleteAbility = (abilityId: string) => {
    const remainingAbilities = abilities.filter(a => a.id !== abilityId);
    const nextPowers = powers.map(p => ({
      ...p,
      abilityIds: (p.abilityIds || []).filter(id => id !== abilityId)
    }));
    const remainingTechniques = techniquesList.filter(t => t.abilityId !== abilityId);

    applyHierarchyUpdate({
      powerSystems: systems,
      powers: nextPowers,
      abilities: remainingAbilities,
      techniques: remainingTechniques,
      forms
    });
  };

  // -------------------------------------------------------------
  // 8. HANDLERS: TECHNIK / CHARACTERTECHNIQUE (Ebene 4)
  // -------------------------------------------------------------
  const handleAddTechnique = (forFormId?: string) => {
    if (!activePower) return;
    const targetAbilityId = forFormId ? undefined : activeAbility?.id;
    const parentContextId = forFormId || activeAbility?.id || activePower.id;
    const newTechId = generateCharacterTechniqueId(parentContextId, 'Neue Technik', techniquesList.map(t => t.id));
    const costRes = activePower.resourceName || activeSystem?.resourceName || 'Mana';

    const newTech: CharacterTechnique = {
      id: newTechId,
      powerId: activePower.id,
      abilityId: targetAbilityId,
      name: 'Neue Technik',
      techniqueType: 'Angriff',
      mode: 'Normal',
      element: activeAbility?.element || 'Neutral',
      cost: `10 ${costRes}`,
      costValue: 10,
      costResourceName: costRes,
      costFormula: 'absolut',
      range: 'Nahkampf / Mittlere Distanz',
      duration: 'Sofort',
      description: '',
      unlockedByTransformationId: forFormId,
      progression: {
        score: 0,
        level: 1,
        xp: 0,
        isLearnable: true
      }
    };

    const nextAbilities = abilities.map(a => {
      if (targetAbilityId && a.id === targetAbilityId) {
        return { ...a, techniqueIds: [...(a.techniqueIds || []), newTechId] };
      }
      return a;
    });

    const nextForms = forms.map(f => {
      if (forFormId && f.id === forFormId) {
        return { ...f, techniqueIds: [...(f.techniqueIds || []), newTechId] };
      }
      return f;
    });

    const nextTechniques = [...techniquesList, newTech];

    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities: nextAbilities,
      techniques: nextTechniques,
      forms: nextForms
    });

    setExpandedMap(prev => ({ ...prev, [newTechId]: true }));
  };

  const handleUpdateTechnique = (techId: string, updates: Partial<CharacterTechnique> | Partial<TechniqueItem>) => {
    const nextTechniques = techniquesList.map(t => {
      if (t.id === techId) {
        const progUpdates = (updates as any).progression || {};
        const scoreVal = (updates as any).score !== undefined ? (updates as any).score : progUpdates.score;
        const xpVal = (updates as any).xp !== undefined ? (updates as any).xp : progUpdates.xp;
        const lvlVal = (updates as any).level !== undefined ? (updates as any).level : progUpdates.level;

        return {
          ...t,
          ...updates,
          progression: {
            ...(t.progression || {}),
            ...progUpdates,
            score: scoreVal !== undefined ? scoreVal : t.progression?.score,
            xp: xpVal !== undefined ? xpVal : t.progression?.xp,
            level: lvlVal !== undefined ? lvlVal : t.progression?.level
          }
        };
      }
      return t;
    });

    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities,
      techniques: nextTechniques,
      forms
    });
  };

  const handleDeleteTechnique = (techId: string) => {
    const remainingTechniques = techniquesList.filter(t => t.id !== techId);
    const nextAbilities = abilities.map(a => ({
      ...a,
      techniqueIds: (a.techniqueIds || []).filter(id => id !== techId)
    }));
    const nextForms = forms.map(f => ({
      ...f,
      techniqueIds: (f.techniqueIds || []).filter(id => id !== techId)
    }));

    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities: nextAbilities,
      techniques: remainingTechniques,
      forms: nextForms
    });
  };

  // -------------------------------------------------------------
  // 9. HANDLERS: FORM / CHARACTERPOWERFORM (Ebene 3 Form)
  // -------------------------------------------------------------
  const handleAddForm = () => {
    if (!activePower) return;
    const formName = `Neue Gestalt ${currentForms.length + 1}`;
    const newFormId = generateCharacterPowerFormId(activePower.id, formName, forms.map(f => f.id));

    const newForm: CharacterPowerForm = {
      id: newFormId,
      powerId: activePower.id,
      name: formName,
      formType: 'Transformation',
      description: '',
      isTransformationOnly: true,
      techniqueIds: [],
      modifiers: {}
    };

    const nextPowers = powers.map(p => {
      if (p.id === activePower.id) {
        return { ...p, formIds: [...(p.formIds || []), newFormId] };
      }
      return p;
    });

    const nextForms = [...forms, newForm];

    applyHierarchyUpdate({
      powerSystems: systems,
      powers: nextPowers,
      abilities,
      techniques: techniquesList,
      forms: nextForms
    });

    setActiveFormId(newFormId);
    setPowerSubTab('forms');
  };

  const handleUpdateForm = (formId: string, updates: Partial<CharacterPowerForm>) => {
    const nextForms = forms.map(f => (f.id === formId ? { ...f, ...updates } : f));
    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities,
      techniques: techniquesList,
      forms: nextForms
    });
  };

  const handleDeleteForm = (formId: string) => {
    const remainingForms = forms.filter(f => f.id !== formId);
    const nextPowers = powers.map(p => ({
      ...p,
      formIds: (p.formIds || []).filter(id => id !== formId)
    }));

    applyHierarchyUpdate({
      powerSystems: systems,
      powers: nextPowers,
      abilities,
      techniques: techniquesList,
      forms: remainingForms
    });
  };

  // -------------------------------------------------------------
  // 10. SMART FILL HANDLER
  // -------------------------------------------------------------
  const handleTechniqueCreatedViaSmartFill = (
    techItem: CharacterTechnique | TechniqueItem,
    primaryAbilityId?: string
  ) => {
    if (!activePower) return;
    const targetAbilityId = primaryAbilityId || (techItem as CharacterTechnique).abilityId || activeAbility?.id;
    const parentId = targetAbilityId || activePower.id;
    const newTechId = techItem.id || generateCharacterTechniqueId(parentId, techItem.name, techniquesList.map(t => t.id));

    const newTech: CharacterTechnique = {
      id: newTechId,
      powerId: activePower.id,
      abilityId: targetAbilityId,
      name: techItem.name,
      description: techItem.description,
      techniqueType: (techItem as CharacterTechnique).techniqueType || (techItem as TechniqueItem).type || 'Angriff',
      mode: techItem.mode || 'Normal',
      element: techItem.element || activeAbility?.element || 'Neutral',
      cost: techItem.cost || '10 Mana',
      costValue: techItem.costValue !== undefined ? techItem.costValue : 10,
      costResourceName: techItem.costResourceName || activePower.resourceName || 'Mana',
      range: techItem.range || 'Nahkampf',
      duration: techItem.duration || 'Sofort',
      effects: techItem.effects || [],
      progression: techItem.progression || {
        score: (techItem as TechniqueItem).score || 0,
        level: (techItem as TechniqueItem).level || 1,
        xp: (techItem as TechniqueItem).xp || 0
      }
    };

    const nextAbilities = abilities.map(a => {
      if (targetAbilityId && a.id === targetAbilityId) {
        return { ...a, techniqueIds: [...(a.techniqueIds || []), newTechId] };
      }
      return a;
    });

    const nextTechniques = [...techniquesList, newTech];

    applyHierarchyUpdate({
      powerSystems: systems,
      powers,
      abilities: nextAbilities,
      techniques: nextTechniques,
      forms
    });

    setExpandedMap(prev => ({ ...prev, [newTechId]: true }));
  };

  // Helper für UI Expand / Collapse
  const toggleCardExpanded = (id: string, defaultExpanded: boolean) => {
    setExpandedMap(prev => {
      const current = prev[id] !== undefined ? prev[id] : defaultExpanded;
      return { ...prev, [id]: !current };
    });
  };

  // Legacy-Adapter für TechniqueCard (vollständig kompatibel)
  const adaptTechniqueForCard = (t: CharacterTechnique): TechniqueItem => {
    return characterTechniqueToLegacyTechnique(t, activeAbility || undefined, activePower || undefined);
  };

  const adaptFormForCard = (f: CharacterPowerForm): TechniqueItem => {
    return characterPowerFormToLegacyTransformation(f, activePower || undefined);
  };

  const availableTransformationsForCard = useMemo(() => {
    return forms.map(f => ({
      id: f.id,
      name: f.name,
      transformName: f.name
    }));
  }, [forms]);

  const legacyBaseAbilitiesForCard: BaseAbility[] = useMemo(() => {
    return abilities.map(a => ({
      id: a.id,
      displayName: a.name,
      name: a.name,
      element: a.element || 'Neutral',
      abilityType: a.abilityType || 'creation_manipulation',
      description: a.description
    }));
  }, [abilities]);

  const legacyPowerSourceForCard: CharacterPowerSource | null = useMemo(() => {
    if (!activePower) return null;
    return {
      id: activePower.id,
      powerName: activePower.name,
      source: activeSystem?.name || 'Kraftsystem',
      cost: activePower.resourceName || 'Mana'
    };
  }, [activePower, activeSystem]);

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-200">
      {/* ============================================================ */}
      {/* 0. OBERSTE ANSICHTSAUSWAHL: KRAFT-SYSTEME vs. WAFFEN         */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainView('powers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              mainView === 'powers'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <LucideIcons.Sparkles className="w-3.5 h-3.5" />
            <span>Kraft-Systeme &amp; Fähigkeiten</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/50 font-mono">
              {powers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('weapons')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              mainView === 'weapons'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <LucideIcons.Shield className="w-3.5 h-3.5" />
            <span>Waffenbeherrschung</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/50 font-mono">
              {weaponTechniques.length}
            </span>
          </button>
        </div>
      </div>

      {mainView === 'weapons' ? (
        /* ============================================================ */
        /* WAFFENBEHERRSCHUNG (SEPARATER BEREICH AUSSERHALB DER POWER)  */
        /* ============================================================ */
        <WeaponSkillTree
          techniques={techniques}
          activeBaseAbility={null}
          baseAbilities={baseAbilities}
          activePowerSource={legacyPowerSourceForCard}
          progressionLogic={progressionLogic}
          onUpdateEntry={(techId, updates) => {
            const updated = techniques.map(t => (t.id === techId ? { ...t, ...updates } : t));
            onChange(powerSources, baseAbilities, updated);
          }}
          onAddEntry={(newEntry) => {
            if (newEntry) {
              const entryToAdd: TechniqueItem = {
                id: newEntry.id || generateCharacterTechniqueId('wpn', newEntry.name || 'Waffenbeherrschung', techniques.map(t => t.id)),
                name: newEntry.name || 'Waffenbeherrschung (Rang 1)',
                category: 'Waffenbeherrschung',
                ...newEntry
              };
              onChange(powerSources, baseAbilities, [...techniques, entryToAdd]);
            }
          }}
          onDeleteEntry={(techId) => {
            const remaining = techniques.filter(t => t.id !== techId);
            onChange(powerSources, baseAbilities, remaining);
          }}
          readOnly={readOnly}
          onOpenSmartFill={() => {
            setSmartFillModalState({
              isOpen: true,
              powerId: activePower?.id,
              abilityId: activeAbility?.id
            });
          }}
        />
      ) : (
        /* ============================================================ */
        /* KRAFT-SYSTEME & HIERARCHIE-BAUM                              */
        /* ============================================================ */
        <div className="flex flex-col gap-4">
          {/* ------------------------------------------------------------ */}
          {/* EBENE 1: KRAFTSYSTEM (PowerSystem)                           */}
          {/* ------------------------------------------------------------ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <LucideIcons.Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  1. Kraftsystem / Ursprung ({systems.length})
                </span>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddPowerSystem}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kraftsystem hinzufügen</span>
                </button>
              )}
            </div>

            {/* System Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {systems.map((sys, sysIdx) => {
                const isSelected = activeSystem?.id === sys.id;
                return (
                  <button
                    key={`sys-tab-${sys.id || sysIdx}`}
                    type="button"
                    onClick={() => setActiveSystemId(sys.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800 text-amber-400 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <LucideIcons.Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{sys.name || `System ${sysIdx + 1}`}</span>
                    {sys.resourceName && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-400 font-mono">
                        {sys.resourceName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Aktives Kraftsystem Editor */}
            {activeSystem && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      System-Name
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                      placeholder="z.B. Magie, Teufelsfrucht, Ki, Quirk..."
                      value={activeSystem.name || ''}
                      onChange={e => handleUpdatePowerSystem(activeSystem.id, { name: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      System-Typ / Kategorie
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                      placeholder="z.B. Magie, Biologisch, Göttlich..."
                      value={activeSystem.systemType || ''}
                      onChange={e => handleUpdatePowerSystem(activeSystem.id, { systemType: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    {!readOnly && systems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeletePowerSystem(activeSystem.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-1.5 h-[30px] cursor-pointer"
                      >
                        <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                        <span>System entfernen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* EBENE 2: KONKRETE KRAFT (CharacterPower)                     */}
          {/* ------------------------------------------------------------ */}
          {activeSystem && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <LucideIcons.Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    2. Konkrete Kraft in {activeSystem.name} ({currentPowers.length})
                  </span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleAddPower}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <LucideIcons.Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kraft hinzufügen</span>
                  </button>
                )}
              </div>

              {/* Power Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {currentPowers.map((pow, powIdx) => {
                  const isSelected = activePower?.id === pow.id;
                  return (
                    <button
                      key={`pow-tab-${pow.id || powIdx}`}
                      type="button"
                      onClick={() => setActivePowerId(pow.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-800 text-cyan-400 border-cyan-500/60 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <LucideIcons.Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{pow.name || `Kraft ${powIdx + 1}`}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aktive Kraft Editor */}
              {activePower && (
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                        Name der Kraft
                      </label>
                      <input
                        type="text"
                        disabled={readOnly}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 h-[30px]"
                        placeholder="z.B. Feuerzauber, Mystische Zoan – Eis-Kitsune..."
                        value={activePower.name || ''}
                        onChange={e => handleUpdatePower(activePower.id, { name: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                        Kostenressource
                      </label>
                      <input
                        type="text"
                        disabled={readOnly}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 h-[30px]"
                        placeholder="z.B. Mana, Ausdauer, Fokus..."
                        value={activePower.resourceName || ''}
                        onChange={e => handleUpdatePower(activePower.id, { resourceName: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      {!readOnly && currentPowers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePower(activePower.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-1.5 h-[30px] cursor-pointer"
                        >
                          <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                          <span>Kraft entfernen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Beschreibung &amp; Natur dieser Kraft
                    </label>
                    <AutoExpandingTextarea
                      disabled={readOnly}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500 min-h-[44px] leading-relaxed"
                      placeholder="Ursprung, Schwingungsmuster oder Natur dieser Kraft..."
                      value={activePower.description || ''}
                      onChange={e => handleUpdatePower(activePower.id, { description: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* EBENE 3: UNTER-NAVIGATION FÜR DIE AKTIVE KRAFT               */}
          {/* [ Fähigkeiten (X) ] | [ Formen & Transformationen (Y) ]      */}
          {/* ------------------------------------------------------------ */}
          {activePower && (
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setPowerSubTab('abilities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  powerSubTab === 'abilities'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <LucideIcons.Sparkles className="w-3.5 h-3.5" />
                <span>Fähigkeiten ({currentAbilities.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPowerSubTab('forms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  powerSubTab === 'forms'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <LucideIcons.Shield className="w-3.5 h-3.5" />
                <span>Formen &amp; Transformationen ({currentForms.length})</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* ANSICHT: FÄHIGKEITEN & TECHNIKEN                             */}
          {/* ------------------------------------------------------------ */}
          {activePower && powerSubTab === 'abilities' && (
            <div className="flex flex-col gap-4">
              {/* Fähigkeiten-Liste der aktiven Kraft */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <LucideIcons.Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      3. Fähigkeiten in {activePower.name} ({currentAbilities.length})
                    </span>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleAddAbility}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <LucideIcons.Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fähigkeit hinzufügen</span>
                    </button>
                  )}
                </div>

                {/* Fähigkeiten-Tabs / Cards */}
                {currentAbilities.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Noch keine Fähigkeiten für diese Kraft angelegt. Klicke auf &bdquo;Fähigkeit hinzufügen&ldquo;.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentAbilities.map((ab, abIdx) => {
                      const isSelected = activeAbility?.id === ab.id;
                      const isPassive = ab.abilityType === 'Passiv' || (ab.name && ab.name.toLowerCase().includes('passiv'));
                      const techCount = (ab.techniqueIds || []).length;

                      return (
                        <button
                          key={`ab-tab-${ab.id || abIdx}`}
                          type="button"
                          onClick={() => setActiveAbilityId(ab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-950/70 text-amber-300 border-amber-500 shadow-sm'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span>{ab.name || `Fähigkeit ${abIdx + 1}`}</span>
                          {ab.element && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-300">
                              {ab.element}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            isPassive ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {isPassive ? 'Passiv' : `${techCount} Techniken`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Aktive Fähigkeit Konfiguration */}
                {activeAbility && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          Name der Fähigkeit
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                          placeholder="z.B. Feuer-Manipulation, Feuerresistenz..."
                          value={activeAbility.name || ''}
                          onChange={e => handleUpdateAbility(activeAbility.id, { name: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          Element / Aspekt
                        </label>
                        <select
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                          value={activeAbility.element || 'Feuer'}
                          onChange={e => handleUpdateAbility(activeAbility.id, { element: e.target.value })}
                        >
                          {ADVENTURE_FORGE_ELEMENTS.map(el => (
                            <option key={`el-opt-${el}`} value={el}>{el}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          Ausprägung / Typ
                        </label>
                        <select
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                          value={activeAbility.abilityType || 'Erschaffung + Manipulation'}
                          onChange={e => handleUpdateAbility(activeAbility.id, { abilityType: e.target.value })}
                        >
                          {ABILITY_TYPES.map(at => (
                            <option key={`at-opt-${at.id}`} value={at.label}>{at.label}</option>
                          ))}
                          <option value="Passiv">Passiv</option>
                          <option value="Körperverstärkung">Körperverstärkung</option>
                          <option value="Wahrnehmung">Wahrnehmung</option>
                          <option value="Spezial">Spezial</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        {!readOnly && currentAbilities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAbility(activeAbility.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-1.5 h-[30px] cursor-pointer"
                          >
                            <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                            <span>Fähigkeit entfernen</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                        Beschreibung der Fähigkeit
                      </label>
                      <AutoExpandingTextarea
                        disabled={readOnly}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[44px] leading-relaxed"
                        placeholder="Wirkung, Reichweite oder Mechanik dieser Fähigkeit..."
                        value={activeAbility.description || ''}
                        onChange={e => handleUpdateAbility(activeAbility.id, { description: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* EBENE 4: TECHNIKEN UNTER DIESER FÄHIGKEIT */}
              {activeAbility && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        {activeAbility.name}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="text-xs font-extrabold text-amber-400">
                        Techniken ({currentAbilityTechniques.length})
                      </span>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSmartFillModalState({
                              isOpen: true,
                              powerId: activePower.id,
                              abilityId: activeAbility.id
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="KI-gestützte Erstellung"
                        >
                          <LucideIcons.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Smart Fill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddTechnique()}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <LucideIcons.Plus className="w-3.5 h-3.5" />
                          <span>Technik hinzufügen</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Techniken Liste */}
                  {currentAbilityTechniques.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
                      <p>Keine konkreten Techniken für &bdquo;{activeAbility.name}&ldquo; vorhanden.</p>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleAddTechnique()}
                          className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <LucideIcons.Plus className="w-3.5 h-3.5" />
                          <span>Erste Technik für diese Fähigkeit erstellen</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentAbilityTechniques.map((tech, idx) => {
                        const defaultExpanded = currentAbilityTechniques.length <= 4;
                        const isExpanded = expandedMap[tech.id] !== undefined ? expandedMap[tech.id] : defaultExpanded;

                        return (
                          <TechniqueCard
                            key={`tech-card-${tech.id || idx}`}
                            entry={tech}
                            category="Techniken"
                            readOnly={readOnly}
                            isExpanded={isExpanded}
                            onToggleExpanded={() => toggleCardExpanded(tech.id, defaultExpanded)}
                            onUpdate={updates => handleUpdateTechnique(tech.id, updates)}
                            onDelete={() => handleDeleteTechnique(tech.id)}
                            activePowerSource={legacyPowerSourceForCard}
                            baseAbilities={legacyBaseAbilitiesForCard}
                            onToggleLinkedBaseAbility={() => {}}
                            progressionLogic={progressionLogic}
                            availableTransformations={availableTransformationsForCard}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* ANSICHT: FORMEN & TRANSFORMATIONEN (CharacterPowerForm)      */}
          {/* ------------------------------------------------------------ */}
          {activePower && powerSubTab === 'forms' && (
            <div className="bg-slate-950/70 border border-cyan-900/50 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <LucideIcons.Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Formen &amp; Transformationen in {activePower.name} ({currentForms.length})
                  </span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleAddForm}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <LucideIcons.Plus className="w-3.5 h-3.5" />
                    <span>Form hinzufügen</span>
                  </button>
                )}
              </div>

              {/* Form Tabs */}
              {currentForms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
                  <p>Keine Formen oder Transformationen für diese Kraft definiert.</p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleAddForm}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcons.Plus className="w-3.5 h-3.5" />
                      <span>Erste Gestalt / Form anlegen</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentForms.map((f, fIdx) => {
                      const isSelected = activeForm?.id === f.id;
                      return (
                        <button
                          key={`form-tab-${f.id || fIdx}`}
                          type="button"
                          onClick={() => setActiveFormId(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{f.name || `Form ${fIdx + 1}`}</span>
                          {f.formType && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-950 rounded text-slate-400">
                              {f.formType}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Aktive Form Konfiguration */}
                  {activeForm && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                            Name der Form / Gestalt
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 h-[30px]"
                            placeholder="z.B. Flammenform, Kitsune-Gestalt..."
                            value={activeForm.name || ''}
                            onChange={e => handleUpdateForm(activeForm.id, { name: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                            Form-Typ
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 h-[30px]"
                            placeholder="z.B. Transformation, Stufenform..."
                            value={activeForm.formType || ''}
                            onChange={e => handleUpdateForm(activeForm.id, { formType: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col justify-end">
                          {!readOnly && currentForms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteForm(activeForm.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-1.5 h-[30px] cursor-pointer"
                            >
                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                              <span>Form entfernen</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          Beschreibung der Verwandlung
                        </label>
                        <AutoExpandingTextarea
                          disabled={readOnly}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500 min-h-[44px] leading-relaxed"
                          placeholder="Optische Veränderung, Körpermodifikationen oder Aura..."
                          value={activeForm.description || ''}
                          onChange={e => handleUpdateForm(activeForm.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Form-spezifische Techniken */}
                  {activeForm && (
                    <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300">
                          Techniken der Form &bdquo;{activeForm.name}&ldquo; ({currentFormTechniques.length})
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleAddTechnique(activeForm.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1 cursor-pointer"
                          >
                            <LucideIcons.Plus className="w-3.5 h-3.5" />
                            <span>Technik für diese Form anlegen</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {currentFormTechniques.map((tech, idx) => (
                          <TechniqueCard
                            key={`form-tech-${tech.id || idx}`}
                            entry={tech}
                            category="Transformationen"
                            readOnly={readOnly}
                            isExpanded={expandedMap[tech.id] || false}
                            onToggleExpanded={() => toggleCardExpanded(tech.id, false)}
                            onUpdate={updates => handleUpdateTechnique(tech.id, updates)}
                            onDelete={() => handleDeleteTechnique(tech.id)}
                            activePowerSource={legacyPowerSourceForCard}
                            baseAbilities={legacyBaseAbilitiesForCard}
                            onToggleLinkedBaseAbility={() => {}}
                            progressionLogic={progressionLogic}
                            availableTransformations={availableTransformationsForCard}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. SMART FILL MODAL                                          */}
      {/* ============================================================ */}
      {smartFillModalState.isOpen && (
        <TechniqueSmartFillModal
          isOpen={smartFillModalState.isOpen}
          onClose={() => setSmartFillModalState({ isOpen: false })}
          powerSystems={systems}
          powers={powers}
          abilities={abilities}
          activePowerId={smartFillModalState.powerId || activePower?.id}
          activeAbilityId={smartFillModalState.abilityId || activeAbility?.id}
          powerSources={powerSources}
          baseAbilities={baseAbilities}
          characterName={characterName}
          characterRole={characterRole}
          worldTitle={worldTitle}
          onTechniqueCreated={(created, primaryAbId) => handleTechniqueCreatedViaSmartFill(created, primaryAbId)}
        />
      )}
    </div>
  );
};

export default TechniqueHierarchyTree;
