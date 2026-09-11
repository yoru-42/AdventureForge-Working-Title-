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
import { TechniqueSmartFillModal } from './TechniqueSmartFillModal';
import AutoExpandingTextarea from './AutoExpandingTextarea';

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
}

export const CATEGORY_TABS = [
  'Passive Fähigkeiten',
  'Techniken',
  'Ultimative Techniken',
  'Transformationen',
  'Talente'
] as const;

export type AbilityCategoryTab = typeof CATEGORY_TABS[number];

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
  readOnly = false
}) => {
  // 1. Sichere Standard-Kraftquelle falls Liste leer
  const safePowerSources = useMemo(() => {
    if (powerSources && powerSources.length > 0) return powerSources;
    return [{
      id: 'ps_default_main',
      source: 'Standard-Kraftquelle',
      powerName: 'Standard-Kraftquelle',
      cost: 'Mana',
      powerDescription: ''
    }];
  }, [powerSources]);

  // 2. Navigationszustände
  const [activePowerSourceId, setActivePowerSourceId] = useState<string>(() => {
    return safePowerSources[0]?.id || 'ps_default_main';
  });

  const [activeBaseAbilityId, setActiveBaseAbilityId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<AbilityCategoryTab>('Techniken');

  // Modal State für KI Smart Fill
  const [smartFillModalState, setSmartFillModalState] = useState<{
    isOpen: boolean;
    powerSourceId?: string;
    baseAbilityId?: string;
  }>({ isOpen: false });

  // 3. Gültige Kraftquelle ermitteln
  const activePowerSource = useMemo(() => {
    const found = safePowerSources.find(ps => ps.id === activePowerSourceId);
    return found || safePowerSources[0] || {
      id: 'ps_default_main',
      source: 'Standard-Kraftquelle',
      powerName: 'Standard-Kraftquelle',
      cost: 'Mana',
      powerDescription: ''
    };
  }, [safePowerSources, activePowerSourceId]);

  // Wenn activePowerSourceId ungültig ist, auf erste Kraftquelle zurücksetzen
  useEffect(() => {
    if (!safePowerSources.some(ps => ps.id === activePowerSourceId)) {
      if (safePowerSources[0]) {
        setActivePowerSourceId(safePowerSources[0].id);
      }
    }
  }, [safePowerSources, activePowerSourceId]);

  // 4. Grundfähigkeiten für die aktuell ausgewählte Kraftquelle
  const currentBaseAbilities = useMemo(() => {
    return baseAbilities.filter(ba => {
      if (ba.powerSourceId) return ba.powerSourceId === activePowerSource.id;
      return activePowerSource.id === safePowerSources[0]?.id;
    });
  }, [baseAbilities, activePowerSource.id, safePowerSources]);

  // 5. Gültige Grundfähigkeit ermitteln und sicherstellen
  useEffect(() => {
    if (currentBaseAbilities.length > 0) {
      const existsInCurrent = currentBaseAbilities.some(ba => ba.id === activeBaseAbilityId);
      if (!existsInCurrent) {
        setActiveBaseAbilityId(currentBaseAbilities[0].id);
      }
    } else {
      setActiveBaseAbilityId('');
    }
  }, [currentBaseAbilities, activeBaseAbilityId]);

  const activeBaseAbility = useMemo(() => {
    return currentBaseAbilities.find(ba => ba.id === activeBaseAbilityId) || currentBaseAbilities[0] || null;
  }, [currentBaseAbilities, activeBaseAbilityId]);

  // 6. Helfer: Prüfen, zu welcher Kategorie ein Eintrag gehört
  const getTechniqueCategory = (tech: TechniqueItem): AbilityCategoryTab => {
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
      'Talente': 0
    };

    if (!activeBaseAbility) return counts;

    techniques.forEach(tech => {
      const belongsToBase = (tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id)) ||
        (!tech.baseAbilityIds || tech.baseAbilityIds.length === 0) && (tech.powerSourceId === activePowerSource.id);

      if (belongsToBase) {
        const cat = getTechniqueCategory(tech);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [techniques, activeBaseAbility, activePowerSource.id]);

  // 8. Einträge der aktuell ausgewählten Grundfähigkeit + aktuellen Kategorie
  const activeEntries = useMemo(() => {
    if (!activeBaseAbility) return [];

    return techniques.filter(tech => {
      const belongsToBase = (tech.baseAbilityIds && tech.baseAbilityIds.includes(activeBaseAbility.id)) ||
        (!tech.baseAbilityIds || tech.baseAbilityIds.length === 0) && (tech.powerSourceId === activePowerSource.id);

      if (!belongsToBase) return false;
      return getTechniqueCategory(tech) === activeCategory;
    });
  }, [techniques, activeBaseAbility, activePowerSource.id, activeCategory]);

  // -------------------------------------------------------------
  // HANDLERS: Kraftquellen
  // -------------------------------------------------------------
  const handleAddPowerSource = () => {
    const newId = `ps_${Date.now()}`;
    const newPs: CharacterPowerSource = {
      id: newId,
      source: 'Neue Kraftquelle',
      powerName: 'Neue Kraftquelle',
      cost: 'Mana',
      powerDescription: ''
    };
    const updatedPs = [...powerSources, newPs];

    // Erzeuge direkt eine Standard-Grundfähigkeit für die neue Kraftquelle
    const newBaId = `ba_${Date.now()}`;
    const newBa: BaseAbility = {
      id: newBaId,
      powerSourceId: newId,
      powerSourceName: newPs.powerName,
      name: 'Kryokinese',
      displayName: 'Kryokinese',
      element: 'Eis',
      abilityType: 'creation_manipulation',
      description: 'Erschaffung und Manipulation von Eis.',
      techniqueIds: []
    };
    const updatedBa = [...baseAbilities, newBa];

    onChange(updatedPs, updatedBa, techniques);
    setActivePowerSourceId(newId);
    setActiveBaseAbilityId(newBaId);
  };

  const handleUpdatePowerSource = (psId: string, updates: Partial<CharacterPowerSource>) => {
    const updatedPs = safePowerSources.map(ps => {
      if (ps.id === psId) {
        return {
          ...ps,
          ...updates,
          powerName: updates.powerName || updates.source || ps.powerName,
          source: updates.source || updates.powerName || ps.source
        };
      }
      return ps;
    });

    // Namen in verknüpften Grundfähigkeiten und Techniken nachziehen
    const updatedBa = baseAbilities.map(ba => {
      if (ba.powerSourceId === psId && updates.powerName) {
        return { ...ba, powerSourceName: updates.powerName };
      }
      return ba;
    });

    const updatedTech = techniques.map(tech => {
      if (tech.powerSourceId === psId && updates.powerName) {
        return { ...tech, powerSourceName: updates.powerName };
      }
      return tech;
    });

    onChange(updatedPs, updatedBa, updatedTech);
  };

  const handleDeletePowerSource = (psId: string) => {
    if (safePowerSources.length <= 1) return;

    const remainingPs = safePowerSources.filter(ps => ps.id !== psId);
    const remainingBa = baseAbilities.filter(ba => ba.powerSourceId !== psId);
    const remainingTech = techniques.filter(tech => tech.powerSourceId !== psId);

    onChange(remainingPs, remainingBa, remainingTech);

    const nextPs = remainingPs[0];
    if (nextPs) {
      setActivePowerSourceId(nextPs.id);
      const nextBa = remainingBa.find(ba => ba.powerSourceId === nextPs.id);
      setActiveBaseAbilityId(nextBa ? nextBa.id : '');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Grundfähigkeiten
  // -------------------------------------------------------------
  const handleAddBaseAbility = () => {
    const newBaId = `ba_${Date.now()}`;
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

    // Namen in verknüpften Techniken aktualisieren
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
            element: tech.baseAbilityIds[0] === baId ? target.element : tech.element
          };
        }
        return tech;
      });
    }

    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleDeleteBaseAbility = (baId: string) => {
    const remainingBa = baseAbilities.filter(ba => ba.id !== baId);
    // Verknüpfungen in Techniken anpassen
    const updatedTech = techniques.map(tech => {
      if (tech.baseAbilityIds?.includes(baId)) {
        const newIds = tech.baseAbilityIds.filter(id => id !== baId);
        return { ...tech, baseAbilityIds: newIds };
      }
      return tech;
    });

    onChange(safePowerSources, remainingBa, updatedTech);

    // Automatisch eine andere Grundfähigkeit auswählen
    const nextAvailable = remainingBa.filter(ba => ba.powerSourceId === activePowerSource.id);
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
    if (!activeBaseAbility) return;

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
    } else if (activeCategory === 'Talente') {
      defaultName = 'Neues Talent';
      defaultType = 'Spezial';
      defaultCostVal = 0;
      defaultCostStr = 'Rang 1';
    }

    const newEntry: TechniqueItem = {
      id: newId,
      name: defaultName,
      description: '',
      category: activeCategory,
      type: defaultType,
      subtype: '',
      mode: defaultMode,
      tier: defaultTier,
      baseAbilityIds: [activeBaseAbility.id],
      baseAbilityNames: [activeBaseAbility.displayName || activeBaseAbility.name],
      powerSourceId: activePowerSource.id,
      powerSourceName: activePowerSource.powerName || activePowerSource.source,
      element: activeBaseAbility.element,
      abilityType: activeBaseAbility.abilityType,
      targetType: 'Selbst / Verbündete / Feinde',
      effects: [],
      costResourceName: costResource,
      costValue: defaultCostVal,
      costFormula: 'absolut',
      cost: defaultCostStr,
      range: 'Nahkampf / Mittlere Distanz',
      duration: 'Sofort',
      summonCount: defaultSummonCount,
      summonCostValue: defaultSummonCostVal,
      level: 1,
      maxLevel: 10,
      xp: 0,
      xpNeeded: 100
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

    onChange(safePowerSources, updatedBa, updatedTech);
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<TechniqueItem>) => {
    const updatedTech = techniques.map(tech => {
      if (tech.id === entryId) {
        const next = { ...tech, ...updates };
        // Falls Kostenwert oder Ressource angepasst wurde, formatieren
        if (updates.costValue !== undefined || updates.costResourceName !== undefined) {
          const val = updates.costValue !== undefined ? updates.costValue : (tech.costValue || 0);
          const res = updates.costResourceName !== undefined ? updates.costResourceName : (tech.costResourceName || 'Mana');
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
      return ba ? (ba.displayName || ba.name) : 'Unbekannt';
    });

    handleUpdateEntry(entryId, {
      baseAbilityIds: nextIds,
      baseAbilityNames: nextNames
    });
  };

  // KI Smart Fill Callback
  const handleTechniqueCreatedViaSmartFill = (newTech: TechniqueItem, targetBaId: string) => {
    newTech.category = activeCategory;
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
            const isActive = ps.id === activePowerSource.id;
            return (
              <button
                key={`ps-${ps.id || 'ps'}-${psIdx}`}
                type="button"
                onClick={() => {
                  setActivePowerSourceId(ps.id);
                  // Automatisch erste Grundfähigkeit dieser Kraftquelle wählen
                  const nextBa = baseAbilities.find(b => b.powerSourceId === ps.id);
                  if (nextBa) {
                    setActiveBaseAbilityId(nextBa.id);
                  }
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
        {!readOnly && (
          <div className="mt-1 pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">
                Name der Kraftquelle
              </label>
              <input
                type="text"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                value={activePowerSource.powerName || activePowerSource.source || ''}
                placeholder="z.B. Teufelskräfte, Magie, Haki"
                onChange={e => handleUpdatePowerSource(activePowerSource.id, { powerName: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">
                Ressource / Kosten
              </label>
              <input
                type="text"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                value={activePowerSource.cost || ''}
                placeholder="z.B. Mana, Ausdauer, MP"
                onChange={e => handleUpdatePowerSource(activePowerSource.id, { cost: e.target.value })}
              />
            </div>

            <div className="flex items-end justify-end">
              {safePowerSources.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeletePowerSource(activePowerSource.id)}
                  className="px-2.5 py-1 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/40 transition-colors h-[30px] flex items-center gap-1 cursor-pointer"
                  title="Diese Kraftquelle löschen"
                >
                  <LucideIcons.Trash2 className="w-3 h-3" />
                  <span>Löschen</span>
                </button>
              )}
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
            Grundfähigkeit ({activePowerSource.powerName || activePowerSource.source})
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

          {!readOnly && (
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
          <div className="mt-1 pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-2">
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
              <div className="flex gap-1.5 items-center">
                <select
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                  value={activeBaseAbility.abilityType || 'creation_manipulation'}
                  onChange={e => handleUpdateBaseAbility(activeBaseAbility.id, { abilityType: e.target.value as AbilityType })}
                >
                  {ABILITY_TYPES.map((at, atIdx) => (
                    <option key={`at-${at.id}-${atIdx}`} value={at.id}>{at.label}</option>
                  ))}
                </select>
                {currentBaseAbilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBaseAbility(activeBaseAbility.id)}
                    className="p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/40 rounded-lg transition-colors h-[30px] w-[30px] flex items-center justify-center cursor-pointer shrink-0"
                    title="Diese Grundfähigkeit löschen"
                  >
                    <LucideIcons.Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
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
            Gilt für: {activeBaseAbility?.displayName || activeBaseAbility?.name || 'Keine Grundfähigkeit'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {CATEGORY_TABS.map((tab, tabIdx) => {
            const isTabActive = activeCategory === tab;
            const count = categoryCounts[tab] || 0;
            return (
              <button
                key={`cat-tab-${tab}-${tabIdx}`}
                type="button"
                onClick={() => setActiveCategory(tab)}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="truncate">{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ml-1 shrink-0 ${
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

          {!readOnly && activeBaseAbility && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSmartFillModalState({
                    isOpen: true,
                    powerSourceId: activePowerSource.id,
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
                <span>{activeCategory.replace(/en$/, '')} hinzufügen</span>
              </button>
            </div>
          )}
        </div>

        {/* Listenansicht der Einträge */}
        {!activeBaseAbility ? (
          <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            Bitte wähle zuerst eine Grundfähigkeit oben aus oder erstelle eine neue.
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
                <span>Ersten Eintrag erstellen</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeEntries.map((entry, idx) => {
              const isTechOrUlt = activeCategory === 'Techniken' || activeCategory === 'Ultimative Techniken';
              const isTransform = activeCategory === 'Transformationen';
              const isPassive = activeCategory === 'Passive Fähigkeiten';
              const isTalent = activeCategory === 'Talente';

              return (
                <div 
                  key={`entry-${entry.id || 'e'}-${idx}`}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-3 transition-all hover:border-slate-700/80"
                >
                  {/* Erste Zeile: Name, Modus, Typ, Tier, Löschen */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                    {/* Name */}
                    <div className={`${isTechOrUlt ? 'sm:col-span-5' : 'sm:col-span-6'} flex flex-col gap-1`}>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                        Name
                      </label>
                      <input
                        type="text"
                        disabled={readOnly}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-bold outline-none focus:border-amber-500 h-[32px]"
                        value={entry.name || ''}
                        placeholder="z.B. Frostlanze, Schattensprung..."
                        onChange={e => handleUpdateEntry(entry.id, { name: e.target.value })}
                      />
                    </div>

                    {/* Modus (für Techniken / Ultimative Techniken) */}
                    {isTechOrUlt && (
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Modus
                        </label>
                        <div className="flex gap-1">
                          <select
                            disabled={readOnly}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] cursor-pointer"
                            value={TECHNIQUE_MODES.includes(entry.mode || '') ? (entry.mode || 'Normal') : '__custom__'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                handleUpdateEntry(entry.id, { mode: '' });
                              } else {
                                handleUpdateEntry(entry.id, { mode: val });
                              }
                            }}
                          >
                            {TECHNIQUE_MODES.map((m, mIdx) => (
                              <option key={`mod-${m}-${mIdx}`} value={m}>{m}</option>
                            ))}
                            <option value="__custom__">Eigener Modus...</option>
                          </select>
                        </div>
                        {!TECHNIQUE_MODES.includes(entry.mode || '') && (
                          <input
                            type="text"
                            disabled={readOnly}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[28px] mt-1"
                            value={entry.mode || ''}
                            placeholder="Modus eingeben..."
                            onChange={e => handleUpdateEntry(entry.id, { mode: e.target.value })}
                          />
                        )}
                      </div>
                    )}

                    {/* Typ / Klassifikation */}
                    {isTechOrUlt && (
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Typ
                        </label>
                        <select
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] cursor-pointer"
                          value={entry.type || 'Angriff'}
                          onChange={e => handleUpdateEntry(entry.id, { type: e.target.value })}
                        >
                          <option value="Angriff">Angriff</option>
                          <option value="Verteidigung">Verteidigung</option>
                          <option value="Support">Support</option>
                          <option value="Heilung">Heilung</option>
                          <option value="Zustandseffekt">Zustandseffekt</option>
                          <option value="Spezial">Spezial</option>
                          <option value="Beschwörung">Beschwörung</option>
                          <option value="Transformation">Transformation</option>
                        </select>
                      </div>
                    )}

                    {/* Passive/Talent Auslöser bzw. Rang */}
                    {(isPassive || isTalent || isTransform) && (
                      <div className="sm:col-span-5 flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          {isPassive ? 'Bedingung / Auslöser' : isTalent ? 'Rang / Stufe' : 'Form / Gestalt'}
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px]"
                          value={isPassive ? (entry.activationCondition || '') : isTalent ? (entry.tier || '') : (entry.transformName || '')}
                          placeholder={isPassive ? 'z.B. Permanent aktiv, Bei HP < 25%' : isTalent ? 'z.B. Rang 1, Experte' : 'z.B. Schattenwolf-Form'}
                          onChange={e => {
                            if (isPassive) handleUpdateEntry(entry.id, { activationCondition: e.target.value });
                            else if (isTalent) handleUpdateEntry(entry.id, { tier: e.target.value });
                            else handleUpdateEntry(entry.id, { transformName: e.target.value });
                          }}
                        />
                      </div>
                    )}

                    {/* Löschen Button */}
                    <div className="sm:col-span-1 flex items-end justify-end h-full">
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Eintrag löschen"
                        >
                          <LucideIcons.Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Zweite Zeile für Kosten und Stufe */}
                  {(isTechOrUlt || isTransform) && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Kosten ({entry.costResourceName || activePowerSource.cost || 'Mana'})
                        </label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            disabled={readOnly}
                            min={0}
                            className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                            value={entry.costValue !== undefined ? entry.costValue : 10}
                            onChange={e => handleUpdateEntry(entry.id, { costValue: parseInt(e.target.value, 10) || 0 })}
                          />
                          <span className="text-[11px] text-slate-400">
                            {entry.costResourceName || activePowerSource.cost || 'Mana'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Tier / Rang
                        </label>
                        <select
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                          value={entry.tier || (activeCategory === 'Ultimative Techniken' ? 'Tier 4' : 'Tier 1')}
                          onChange={e => handleUpdateEntry(entry.id, { tier: e.target.value })}
                        >
                          <option value="Tier 1">Tier 1 (Grundtechnik)</option>
                          <option value="Tier 2">Tier 2 (Fortgeschritten)</option>
                          <option value="Tier 3">Tier 3 (Meisterhaft)</option>
                          <option value="Tier 4">Tier 4 (Ultimativ)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Reichweite
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                          value={entry.range || ''}
                          placeholder="z.B. Nahkampf, 15m"
                          onChange={e => handleUpdateEntry(entry.id, { range: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Dauer
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                          value={entry.duration || ''}
                          placeholder="z.B. Sofort, 3 Runden"
                          onChange={e => handleUpdateEntry(entry.id, { duration: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Beschwörungs-Parameter (Wenn Typ Beschwörung ist) */}
                  {entry.type === 'Beschwörung' && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Beschwörungen (Anzahl)
                        </label>
                        <input
                          type="number"
                          disabled={readOnly}
                          min={1}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                          value={entry.summonCount !== undefined ? entry.summonCount : 1}
                          onChange={e => handleUpdateEntry(entry.id, { summonCount: parseInt(e.target.value, 10) || 1 })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                          Kosten pro weiterer Beschwörung ({entry.costResourceName || activePowerSource.cost || 'Mana'})
                        </label>
                        <input
                          type="number"
                          disabled={readOnly}
                          min={0}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                          value={entry.summonCostValue !== undefined ? entry.summonCostValue : 5}
                          onChange={e => handleUpdateEntry(entry.id, { summonCostValue: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Beschreibung / Effekt (AutoExpandingTextarea) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase">
                      Beschreibung & Wirkung
                    </label>
                    <AutoExpandingTextarea
                      disabled={readOnly}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 min-h-[50px] leading-relaxed"
                      placeholder="Wirkungsweise, visuelle Effekte und taktischer Nutzen..."
                      value={entry.description || ''}
                      onChange={e => handleUpdateEntry(entry.id, { description: e.target.value })}
                    />
                  </div>

                  {/* Kombinationstechnik / Mehrere Grundfähigkeiten */}
                  {baseAbilities.length > 1 && (
                    <div className="pt-1 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase mr-1">
                        Verknüpfte Grundfähigkeiten:
                      </span>
                      {baseAbilities.map((ba, baIdx) => {
                        const isLinked = entry.baseAbilityIds?.includes(ba.id);
                        return (
                          <button
                            key={`ba-link-${ba.id || 'ba'}-${baIdx}`}
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleToggleLinkedBaseAbility(entry.id, ba.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${
                              isLinked
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {ba.displayName || ba.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. KI SMART FILL MODAL                                       */}
      {/* ============================================================ */}
      {smartFillModalState.isOpen && (
        <TechniqueSmartFillModal
          isOpen={smartFillModalState.isOpen}
          onClose={() => setSmartFillModalState({ isOpen: false })}
          powerSources={safePowerSources}
          baseAbilities={baseAbilities}
          initialPowerSourceId={smartFillModalState.powerSourceId || activePowerSource.id}
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
