// -*- coding: utf-8 -*-
import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { BaseAbility, CharacterPowerSource, TechniqueItem, AbilityType } from '../types';
import { 
  ADVENTURE_FORGE_ELEMENTS, 
  ABILITY_TYPES, 
  resolveKinesisName, 
  formatAbilityTypeLabel 
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
import { TechniqueCard } from './TechniqueCard';

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
}

export const CATEGORY_TABS = [
  'Passive Fähigkeiten',
  'Techniken',
  'Ultimative Techniken',
  'Transformationen',
  'Waffenbeherrschung'
] as const;

export type AbilityCategoryTab = typeof CATEGORY_TABS[number];

export const CATEGORY_ADD_LABELS: Record<AbilityCategoryTab, string> = {
  'Passive Fähigkeiten': 'Passive Fähigkeit hinzufügen',
  'Techniken': 'Technik hinzufügen',
  'Ultimative Techniken': 'Ultimative Technik hinzufügen',
  'Transformationen': 'Transformation hinzufügen',
  'Waffenbeherrschung': 'Waffenbeherrschung hinzufügen',
};

export const CATEGORY_EMPTY_LABELS: Record<AbilityCategoryTab, string> = {
  'Passive Fähigkeiten': 'Erste passive Fähigkeit erstellen',
  'Techniken': 'Erste Technik erstellen',
  'Ultimative Techniken': 'Erste ultimative Technik erstellen',
  'Transformationen': 'Erste Transformation erstellen',
  'Waffenbeherrschung': 'Erste Waffenbeherrschung erstellen',
};

const TECHNIQUE_MODES = [
  'Normal',
  'Verstärkt',
  'Dauerhaft',
  'Aufgeladen',
  'Schnellzauber',
  'Konter',
  'Bereich',
  'Fernkampf',
  'Nahkampf',
  'Kanalisiert'
];

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
  world
}) => {
  // 1. Sichere Standard-Kraftquelle falls Liste leer
  const safePowerSources = useMemo(() => {
    if (powerSources && powerSources.length > 0) {
      return powerSources.map(ps => {
        // Falls Altbestand noch die automatische "Standard-Kraftquelle" enthält, leeren wir die Felder
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

  // 2. Navigationszustände
  const [activePowerSourceId, setActivePowerSourceId] = useState<string>(() => {
    return safePowerSources[0]?.id || '';
  });

  const [activeBaseAbilityId, setActiveBaseAbilityId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<AbilityCategoryTab>('Techniken');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

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

  // Modal State für KI Smart Fill
  const [smartFillModalState, setSmartFillModalState] = useState<{
    isOpen: boolean;
    powerSourceId?: string;
    baseAbilityId?: string;
  }>({ isOpen: false });

  // 3. Gültige Kraftquelle ermitteln
  const activePowerSource = useMemo(() => {
    const found = safePowerSources.find(ps => ps.id === activePowerSourceId);
    return found || safePowerSources[0] || null;
  }, [safePowerSources, activePowerSourceId]);

  // Nur die in Schritt 3 von 9 registrierten Kraftquellen für Techniken (aus world.customResourceMappings)
  const registeredStep3PowerSources = useMemo(() => {
    const list: { id: string; name: string; effect?: string; description?: string }[] = [];
    if (world?.customResourceMappings && Array.isArray(world.customResourceMappings)) {
      world.customResourceMappings.forEach((m: any) => {
        if (m && typeof m.name === 'string' && m.name.trim().length > 0) {
          list.push(m);
        }
      });
    }
    if (world?.campaignPowerSettings?.customResourceMappings && Array.isArray(world.campaignPowerSettings.customResourceMappings)) {
      world.campaignPowerSettings.customResourceMappings.forEach((m: any) => {
        if (m && typeof m.name === 'string' && m.name.trim().length > 0 && !list.some(existing => existing.id === m.id || existing.name === m.name)) {
          list.push(m);
        }
      });
    }
    return list;
  }, [world?.customResourceMappings, world?.campaignPowerSettings]);

  // Nur die unter "Kosten-Ressourcen" eingetragenen Ressourcen anzeigen
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

  // Wenn activePowerSourceId ungültig ist, auf erste Kraftquelle zurücksetzen
  useEffect(() => {
    if (safePowerSources.length > 0 && !safePowerSources.some(ps => ps.id === activePowerSourceId)) {
      setActivePowerSourceId(safePowerSources[0].id);
    }
  }, [safePowerSources, activePowerSourceId]);

  // 4. Grundfähigkeiten für die aktuell ausgewählte Kraftquelle
  const currentBaseAbilities = useMemo(() => {
    if (!activePowerSource) return [];
    return baseAbilities.filter(ba => {
      if (ba.powerSourceId) return ba.powerSourceId === activePowerSource.id;
      return activePowerSource.id === safePowerSources[0]?.id;
    });
  }, [baseAbilities, activePowerSource, safePowerSources]);

  // 5. Gültige Grundfähigkeit ermitteln und sauber halten (OHNE künstliche Erzeugung)
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

  // 6. Helfer: Prüfen, zu welcher Kategorie ein Eintrag gehört
  const getTechniqueCategory = (tech: TechniqueItem): AbilityCategoryTab => {
    if (tech.category === 'Talente') return 'Waffenbeherrschung';
    if (tech.category && CATEGORY_TABS.includes(tech.category as AbilityCategoryTab)) {
      return tech.category as AbilityCategoryTab;
    }
    if (tech.type === 'Transformation') return 'Transformationen';
    if (tech.tier === 'Tier 4' || tech.tier === 'Ultimativ') return 'Ultimative Techniken';
    return 'Techniken';
  };

  // 7. Zähler für die 5 Kategorien der aktiven Grundfähigkeit
  const categoryCounts = useMemo(() => {
    const counts: Record<AbilityCategoryTab, number> = {
      'Passive Fähigkeiten': 0,
      'Techniken': 0,
      'Ultimative Techniken': 0,
      'Transformationen': 0,
      'Waffenbeherrschung': 0
    };

    if (!activeBaseAbility) return counts;

    techniques.forEach(tech => {
      const belongsToBase = (tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id)) ||
        (!tech.baseAbilityIds || tech.baseAbilityIds.length === 0) && (activePowerSource && tech.powerSourceId === activePowerSource.id);

      if (belongsToBase) {
        const cat = getTechniqueCategory(tech);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [techniques, activeBaseAbility, activePowerSource]);

  // 8. Einträge der aktuell ausgewählten Grundfähigkeit + aktuellen Kategorie
  const activeEntries = useMemo(() => {
    if (!activeBaseAbility) return [];

    return techniques.filter(tech => {
      const belongsToBase = (tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id)) ||
        (!tech.baseAbilityIds || tech.baseAbilityIds.length === 0) && (activePowerSource && tech.powerSourceId === activePowerSource.id);

      if (!belongsToBase) return false;
      return getTechniqueCategory(tech) === activeCategory;
    });
  }, [techniques, activeBaseAbility, activePowerSource, activeCategory]);

  // -------------------------------------------------------------
  // HANDLERS: Kraftquellen (OHNE automatische Grundfähigkeit!)
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

    // Keine automatische Grundfähigkeit erstellen!
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

    // Namen in verknüpften Grundfähigkeiten und Techniken synchron nachziehen
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

    // Techniken nicht pauschal löschen, sondern Kombinationstechniken erhalten & IDs/Namen synchronisieren!
    const remainingTech: TechniqueItem[] = [];

    techniques.forEach(tech => {
      if (tech.baseAbilityIds && tech.baseAbilityIds.length > 0) {
        const newBaseAbilityIds = tech.baseAbilityIds.filter(id => !deletedBaIds.includes(id));
        if (newBaseAbilityIds.length > 0) {
          // Technik besitzt noch andere gültige Grundfähigkeiten!
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
        } else {
          // Alle verknüpften Grundfähigkeiten gehörten zur gelöschten Kraftquelle
          // Wenn die Technik nicht zur gelöschten Kraftquelle gehörte, behalten
          if (tech.powerSourceId !== psId) {
            remainingTech.push(tech);
          }
        }
      } else {
        // Technik ohne explizite baseAbilityIds: nur entfernen, wenn sie direkt an dieser Kraftquelle hing
        if (tech.powerSourceId !== psId) {
          remainingTech.push(tech);
        }
      }
    });

    onChange(remainingPs, remainingBa, remainingTech);

    const nextPs = remainingPs[0];
    if (nextPs) {
      setActivePowerSourceId(nextPs.id);
      const nextBa = remainingBa.find(ba => ba.powerSourceId === nextPs.id);
      setActiveBaseAbilityId(nextBa ? nextBa.id : '');
    } else {
      setActivePowerSourceId('');
      setActiveBaseAbilityId('');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Grundfähigkeiten
  // -------------------------------------------------------------
  const handleAddBaseAbility = () => {
    if (!activePowerSource) return;

    const newBaId = `ba_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const defElement = 'Neutral';
    const defType: AbilityType = 'creation_manipulation';
    const defName = resolveKinesisName(defElement, defType);

    const newBa: BaseAbility = {
      id: newBaId,
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      name: defName,
      displayName: defName,
      element: defElement,
      abilityType: defType,
      description: `Erschaffung und Manipulation von ${defElement}.`,
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
          // Wenn der Nutzer den Namen nicht manuell überschrieben hat, Kinesenamen erneuern
          if (!updates.displayName && !updates.name) {
            next.displayName = resolveKinesisName(el, at);
            next.name = next.displayName;
          }
        }
        return next;
      }
      return ba;
    });

    // Namen in verknüpften Techniken synchron aktualisieren
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

    // baseAbilityIds und baseAbilityNames strikt synchron halten!
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
        } else {
          // Technik war ausschließlich dieser Grundfähigkeit zugeordnet -> entfernen
        }
      } else {
        updatedTech.push(tech);
      }
    });

    onChange(safePowerSources, remainingBa, updatedTech);

    // Automatisch eine andere Grundfähigkeit der aktuellen Kraftquelle auswählen
    const nextAvailable = remainingBa.filter(ba => activePowerSource && ba.powerSourceId === activePowerSource.id);
    if (nextAvailable.length > 0) {
      setActiveBaseAbilityId(nextAvailable[0].id);
    } else {
      setActiveBaseAbilityId('');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Einträge der Kategorien (Techniken, Passive etc.)
  // -------------------------------------------------------------
  const handleAddEntry = () => {
    if (!activeBaseAbility || !activePowerSource) return;

    const newId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const costResource = activePowerSource.cost || 'Mana';

    let defaultName = 'Neue Technik';
    let defaultType = 'Angriff';
    let defaultTier = 'Tier 1';
    let defaultCostVal = 10;
    let defaultCostStr = `10 ${costResource}`;
    let defaultMode = 'Normal';
    let defaultSummonCount: number | undefined = undefined;
    let defaultSummonCostVal: number | undefined = undefined;

    if (activeCategory === 'Passive Fähigkeiten') {
      defaultName = 'Neue passive Fähigkeit';
      defaultType = 'Support';
      defaultTier = 'Tier 1';
      defaultCostVal = 0;
      defaultCostStr = 'Passiv';
    } else if (activeCategory === 'Ultimative Techniken') {
      defaultName = 'Neue ultimative Technik';
      defaultTier = 'Tier 4';
      defaultCostVal = 50;
      defaultCostStr = `50 ${costResource}`;
    } else if (activeCategory === 'Transformationen') {
      defaultName = 'Neue Transformation';
      defaultType = 'Transformation';
      defaultCostVal = 25;
      defaultCostStr = `25 ${costResource}`;
    } else if (activeCategory === 'Waffenbeherrschung' || (activeCategory as string) === 'Talente') {
      const defaultWeapon = ALL_WEAPONS[1] || ALL_WEAPONS[0]; // Langschwert
      defaultName = `Waffenbeherrschung: ${defaultWeapon.name}`;
      defaultType = 'Spezial';
      defaultTier = 'Rang 1: Novize / Grundausbildung';
      defaultCostVal = 0;
      defaultCostStr = 'Rang 1';
    }

    const isWpnMastery = activeCategory === 'Waffenbeherrschung' || (activeCategory as string) === 'Talente';
    const defaultWeapon = isWpnMastery ? (ALL_WEAPONS[1] || ALL_WEAPONS[0]) : null;

    const newEntry: TechniqueItem = {
      id: newId,
      name: defaultName,
      description: isWpnMastery && defaultWeapon ? defaultWeapon.description : '',
      category: isWpnMastery ? 'Waffenbeherrschung' : activeCategory,
      type: defaultType,
      subtype: isWpnMastery && defaultWeapon ? defaultWeapon.categoryName : '',
      mode: defaultMode,
      tier: defaultTier,
      baseAbilityIds: [activeBaseAbility.id],
      baseAbilityNames: [activeBaseAbility.displayName || activeBaseAbility.name],
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      element: activeBaseAbility.element,
      abilityType: activeBaseAbility.abilityType,
      targetType: isWpnMastery ? 'Einzelziel / Nahkampf' : 'Selbst / Verbündete / Feinde',
      effects: isWpnMastery && defaultWeapon ? [...defaultWeapon.damageTypes] : [],
      costResourceName: costResource,
      costValue: defaultCostVal,
      costFormula: 'absolut',
      cost: defaultCostStr,
      range: isWpnMastery && defaultWeapon ? (defaultWeapon.rangeCategory === 'Fernkampf' ? 'Fernkampf' : defaultWeapon.rangeCategory === 'Stangenreichweite' ? 'Stangenreichweite' : 'Nahkampf') : 'Nahkampf / Mittlere Distanz',
      duration: isWpnMastery ? 'Permanent / Haltung' : 'Sofort',
      summonCount: defaultSummonCount,
      summonCostValue: defaultSummonCostVal,
      level: 1,
      maxLevel: 10,
      xp: 0,
      xpNeeded: 100,
      weaponType: isWpnMastery && defaultWeapon ? defaultWeapon.name : undefined,
      weaponCategory: isWpnMastery && defaultWeapon ? defaultWeapon.categoryName : undefined,
      masteryLevel: isWpnMastery ? 'Rang 1: Novize / Grundausbildung' : undefined,
      wieldingStyle: isWpnMastery && defaultWeapon ? defaultWeapon.wieldingStyles[0] : undefined,
      weaponManeuver: isWpnMastery && defaultWeapon && defaultWeapon.maneuvers.length > 0 ? defaultWeapon.maneuvers[0] : undefined
    };

    const updatedTech = [...techniques, newEntry];

    // Grundfähigkeit mit neuer Technique-ID aktualisieren
    const updatedBa = baseAbilities.map(ba => {
      if (ba.id === activeBaseAbility.id) {
        return {
          ...ba,
          techniqueIds: [...(ba.techniqueIds || []), newId]
        };
      }
      return ba;
    });

    setExpandedMap(prev => ({ ...prev, [newId]: true }));
    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<TechniqueItem>) => {
    const updatedTech = techniques.map(tech => {
      if (tech.id === entryId) {
        const next = { ...tech, ...updates };
        // Falls Kostenwert oder Ressource angepasst wurde, formatieren
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

  // Verknüpfung einer Grundfähigkeit umschalten (Kombinationstechnik)
  const handleToggleLinkedBaseAbility = (entryId: string, baId: string) => {
    const tech = techniques.find(t => t.id === entryId);
    if (!tech) return;

    const currentIds = tech.baseAbilityIds || [];
    let nextIds: string[];
    if (currentIds.includes(baId)) {
      if (currentIds.length <= 1) return; // Mindestens eine Verknüpfung beibehalten
      nextIds = currentIds.filter(id => id !== baId);
    } else {
      nextIds = [...currentIds, baId];
    }

    const nextNames = nextIds.map(id => {
      const ba = baseAbilities.find(b => b.id === id);
      return ba ? (ba.displayName || ba.name) : '';
    }).filter(Boolean);

    handleUpdateEntry(entryId, {
      baseAbilityIds: nextIds,
      baseAbilityNames: nextNames
    });
  };

  // KI Smart Fill Callback
  const handleTechniqueCreatedViaSmartFill = (newTech: TechniqueItem, targetBaId: string) => {
    newTech.category = activeCategory;
    if (activeCategory === 'Waffenbeherrschung') {
      const matchedWeapon = findWeaponByName(newTech.name) || findWeaponByName(newTech.description || '') || ALL_WEAPONS[1];
      newTech.weaponType = newTech.weaponType || matchedWeapon.name;
      newTech.weaponCategory = newTech.weaponCategory || matchedWeapon.categoryName;
      newTech.masteryLevel = newTech.masteryLevel || 'Rang 1: Novize / Grundausbildung';
      newTech.wieldingStyle = newTech.wieldingStyle || matchedWeapon.wieldingStyles[0];
      newTech.weaponManeuver = newTech.weaponManeuver || (matchedWeapon.maneuvers.length > 0 ? matchedWeapon.maneuvers[0] : undefined);
      if (!newTech.range) {
        newTech.range = matchedWeapon.rangeCategory === 'Fernkampf' ? 'Fernkampf' : (matchedWeapon.rangeCategory === 'Stangenreichweite' ? 'Stangenreichweite' : 'Nahkampf');
      }
      if (!newTech.effects || newTech.effects.length === 0) {
        newTech.effects = [...matchedWeapon.damageTypes];
      }
    }
    const updatedTech = [...techniques, newTech];
    const updatedBa = baseAbilities.map(ba => {
      if (ba.id === targetBaId) {
        return {
          ...ba,
          techniqueIds: [...(ba.techniqueIds || []), newTech.id]
        };
      }
      return ba;
    });

    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const availableTransformations = useMemo(() => {
    return techniques
      .filter(t => t.category === 'Transformationen' || t.type === 'Transformation')
      .map(t => ({
        id: t.id,
        name: t.transformName || t.name,
        transformName: t.transformName
      }));
  }, [techniques]);

  return (
    <div className="flex flex-col gap-4 text-slate-100">
      {/* ============================================================ */}
      {/* 1. KRAFTQUELLE TAG-LEISTE                                    */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Kraftquelle
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {safePowerSources.length} vorhanden
          </span>
        </div>

        {/* Tag-Auswahl */}
        <div className="flex flex-wrap items-center gap-1.5">
          {safePowerSources.map((ps, psIdx) => {
            const isActive = activePowerSource && ps.id === activePowerSource.id;
            return (
              <button
                key={`ps-${ps.id || 'ps'}-${psIdx}`}
                type="button"
                onClick={() => {
                  setActivePowerSourceId(ps.id);
                  // Automatisch erste Grundfähigkeit dieser Kraftquelle wählen (oder leer falls keine existiert)
                  const nextBa = baseAbilities.find(b => b.powerSourceId === ps.id);
                  setActiveBaseAbilityId(nextBa ? nextBa.id : '');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{ps.powerName || ps.source || 'Kraftquelle'}</span>
                {ps.cost && (
                  <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ps.cost}
                  </span>
                )}
              </button>
            );
          })}

          {!readOnly && (
            <button
              type="button"
              onClick={handleAddPowerSource}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/70 text-slate-400 hover:text-amber-400 transition-all flex items-center gap-1 cursor-pointer"
              title="Neue Kraftquelle anlegen"
            >
              <LucideIcons.Plus className="w-3.5 h-3.5" />
              <span>Kraftquelle</span>
            </button>
          )}
        </div>

        {/* Inline-Konfiguration der aktuell aktiven Kraftquelle */}
        {!readOnly && activePowerSource && (
          <div className="mt-1 pt-2.5 border-t border-slate-800/60 flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* 1. Name der Kraftquelle: Gut sichtbares Eingabefeld für Nutzer & KI */}
              <div className="sm:col-span-5 flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Name der Kraftquelle
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs font-semibold outline-none focus:border-amber-500 h-[34px] placeholder:text-slate-600 transition-colors"
                  placeholder="Name der Kraftquelle eintragen..."
                  value={activePowerSource.powerName || activePowerSource.source || ''}
                  onChange={e => {
                    const val = e.target.value;
                    handleUpdatePowerSource(activePowerSource.id, { 
                      powerName: val,
                      source: val
                    });
                  }}
                />
              </div>

              {/* 2. Menü: Zeigt Kraftquellen an */}
              <div className="sm:col-span-4 flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Kraftquellen
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-500 h-[34px] cursor-pointer"
                  value={
                    registeredStep3PowerSources.some(m => m.name === (activePowerSource.powerName || activePowerSource.source))
                      ? (activePowerSource.powerName || activePowerSource.source)
                      : ''
                  }
                  onChange={e => {
                    const chosen = e.target.value;
                    if (chosen) {
                      const mapping = registeredStep3PowerSources.find(m => m.name === chosen);
                      handleUpdatePowerSource(activePowerSource.id, { 
                        powerName: chosen,
                        source: chosen,
                        powerDescription: mapping?.description || activePowerSource.powerDescription || ''
                      });
                    } else {
                      handleUpdatePowerSource(activePowerSource.id, {
                        powerName: '',
                        source: ''
                      });
                    }
                  }}
                >
                  <option value="">-- Kraftquelle wählen --</option>
                  {registeredStep3PowerSources.length > 0 ? (
                    registeredStep3PowerSources.map(mapping => (
                      <option key={mapping.id} value={mapping.name} className="bg-slate-950 text-white">
                        {mapping.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled className="bg-slate-950 text-slate-500">
                      Keine Kraftquellen vorhanden
                    </option>
                  )}
                </select>
              </div>

              {/* 3. Ressource / Kosten: Zeigt ausschließlich registrierte Kosten-Ressourcen */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Ressource / Kosten
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-500 h-[34px] cursor-pointer"
                  value={activePowerSource.cost || ''}
                  onChange={e => handleUpdatePowerSource(activePowerSource.id, { cost: e.target.value })}
                >
                  <option value="">-- Ressource wählen --</option>
                  {registeredCostResources.map(cRes => (
                    <option key={cRes} value={cRes} className="bg-slate-950 text-white">
                      {cRes}
                    </option>
                  ))}
                  {activePowerSource.cost && !registeredCostResources.includes(activePowerSource.cost) && (
                    <option value={activePowerSource.cost} className="bg-slate-950 text-white">
                      {activePowerSource.cost}
                    </option>
                  )}
                  {registeredCostResources.length === 0 && !activePowerSource.cost && (
                    <option value="" disabled className="bg-slate-950 text-slate-500">
                      Keine Kosten-Ressourcen definiert
                    </option>
                  )}
                </select>
              </div>

              {/* 4. Löschen */}
              <div className="sm:col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => handleDeletePowerSource(activePowerSource.id)}
                  className="w-full px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/40 transition-colors h-[34px] flex items-center justify-center gap-1 cursor-pointer"
                  title="Diese Kraftquelle löschen"
                >
                  <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Löschen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. GRUNDFÄHIGKEIT TAG-LEISTE                                */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Grundfähigkeit ({activePowerSource ? (activePowerSource.powerName || activePowerSource.source) : 'Keine Kraftquelle'})
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {currentBaseAbilities.length} vorhanden
          </span>
        </div>

        {/* Tag-Auswahl */}
        <div className="flex flex-wrap items-center gap-1.5">
          {currentBaseAbilities.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              Keine Grundfähigkeiten für diese Kraftquelle vorhanden.
            </div>
          ) : (
            currentBaseAbilities.map((ba, baIdx) => {
              const isActive = activeBaseAbility && ba.id === activeBaseAbility.id;
              return (
                <button
                  key={`ba-${ba.id || 'ba'}-${baIdx}`}
                  type="button"
                  onClick={() => setActiveBaseAbilityId(ba.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{ba.displayName || ba.name || 'Grundfähigkeit'}</span>
                  {ba.element && (
                    <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ba.element}
                    </span>
                  )}
                </button>
              );
            })
          )}

          {!readOnly && activePowerSource && (
            <button
              type="button"
              onClick={handleAddBaseAbility}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/70 text-slate-400 hover:text-amber-400 transition-all flex items-center gap-1 cursor-pointer"
              title="Neue Grundfähigkeit anlegen"
            >
              <LucideIcons.Plus className="w-3.5 h-3.5" />
              <span>Grundfähigkeit</span>
            </button>
          )}
        </div>

        {/* Inline-Konfiguration der aktiv ausgewählten Grundfähigkeit */}
        {activeBaseAbility && !readOnly && (
          <div className="mt-1 pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">
                Kinese / Bezeichner
              </label>
              <input
                type="text"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                value={activeBaseAbility.displayName || activeBaseAbility.name || ''}
                placeholder="z.B. Kryokinese, Eiserne Haut"
                onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { displayName: e.target.value, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">
                Element
              </label>
              <select
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                value={activeBaseAbility.element || 'Neutral'}
                onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { element: e.target.value })}
              >
                {ADVENTURE_FORGE_ELEMENTS.map((el, elIdx) => (
                  <option key={`el-${el}-${elIdx}`} value={el}>{el}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">
                Fähigkeitsart
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                value={activeBaseAbility.abilityType || 'creation_manipulation'}
                onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { abilityType: e.target.value as AbilityType })}
              >
                {ABILITY_TYPES.map((at, atIdx) => (
                  <option key={`at-${at.id}-${atIdx}`} value={at.id}>{at.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => handleDeleteBaseAbility(activeBaseAbility.id)}
                className="px-2.5 py-1 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/40 transition-colors h-[30px] flex items-center gap-1 cursor-pointer"
                title="Diese Grundfähigkeit löschen"
              >
                <LucideIcons.Trash2 className="w-3 h-3" />
                <span>Löschen</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. KATEGORIEN-NAVIGATION (GENAU EINMAL!)                     */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Kategorien
          </span>
          <span className="text-[10px] text-slate-500">
            Gilt für: {activeBaseAbility ? (activeBaseAbility.displayName || activeBaseAbility.name) : 'Keine Grundfähigkeit'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CATEGORY_TABS.map((tab, tabIdx) => {
            const isTabActive = activeCategory === tab;
            const count = categoryCounts[tab] || 0;
            return (
              <button
                key={`cat-tab-${tab}-${tabIdx}`}
                type="button"
                onClick={() => setActiveCategory(tab)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer border min-w-0 ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-left leading-tight truncate">{tab}</span>
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
      {/* 4. INHALT DER AUSGEWÄHLTEN GRUNDFÄHIGKEIT + KATEGORIE         */}
      {/* ============================================================ */}
      {activeCategory === 'Waffenbeherrschung' ? (
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
              handleAddEntry();
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
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3.5">
          {/* Header des Inhaltsbereichs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {activeBaseAbility ? (activeBaseAbility.displayName || activeBaseAbility.name) : 'Keine Grundfähigkeit'}
              </span>
              <span className="text-slate-600">→</span>
              <span className="text-xs font-extrabold text-amber-400">
                {activeCategory} ({activeEntries.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Progressions-Regel Badge */}
              {progressionLogic === 'ep' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-[11px] text-amber-300 font-medium">
                  <LucideIcons.Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>EP-basiert (100 EP/Stufe)</span>
                </span>
              )}
              {progressionLogic === 'training' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-300 font-medium">
                  <LucideIcons.Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Training & Übung (4 Einheiten)</span>
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

              {/* Alle aufklappen / zuklappen */}
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

              {!readOnly && activeBaseAbility && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSmartFillModalState({
                        isOpen: true,
                        powerSourceId: activePowerSource?.id,
                        baseAbilityId: activeBaseAbility.id
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
                    onClick={handleAddEntry}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LucideIcons.Plus className="w-3.5 h-3.5" />
                    <span>{CATEGORY_ADD_LABELS[activeCategory]}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Listenansicht der Einträge */}
          {!activeBaseAbility ? (
            <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
              <p>Bitte wähle oben eine Grundfähigkeit aus oder erstelle eine neue.</p>
              {!readOnly && activePowerSource && (
                <button
                  type="button"
                  onClick={handleAddBaseAbility}
                  className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5" />
                  <span>Grundfähigkeit erstellen</span>
                </button>
              )}
            </div>
          ) : activeEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
              <p>Keine Einträge für &bdquo;{activeCategory}&ldquo; in {activeBaseAbility.displayName || activeBaseAbility.name} definiert.</p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddEntry}
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

      {/* ============================================================ */}
      {/* 5. KI SMART FILL MODAL                                       */}
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
