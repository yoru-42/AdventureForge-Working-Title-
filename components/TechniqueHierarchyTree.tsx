// -*- coding: utf-8 -*-
import React, { useState } from 'react';
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

interface TechniqueHierarchyTreeProps {
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
  // Smart Fill State
  const [smartFillModalState, setSmartFillModalState] = useState<{
    isOpen: boolean;
    powerSourceId?: string;
    baseAbilityId?: string;
  }>({ isOpen: false });

  // Accordion / Collapsed states
  const [collapsedPowerSources, setCollapsedPowerSources] = useState<Record<string, boolean>>({});
  const [collapsedBaseAbilities, setCollapsedBaseAbilities] = useState<Record<string, boolean>>({});

  // Toggle Collapse
  const togglePowerSource = (psId: string) => {
    setCollapsedPowerSources(prev => ({ ...prev, [psId]: !prev[psId] }));
  };

  const toggleBaseAbility = (baId: string) => {
    setCollapsedBaseAbilities(prev => ({ ...prev, [baId]: !prev[baId] }));
  };

  // 1. Kraftquellen Actions
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

    // Erzeuge direkt eine Standard-Grundfähigkeit für diese Kraftquelle
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
  };

  const handleUpdatePowerSource = (psId: string, updates: Partial<CharacterPowerSource>) => {
    const updatedPs = powerSources.map(ps => {
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
    onChange(updatedPs, baseAbilities, techniques);
  };

  const handleDeletePowerSource = (psId: string) => {
    if (powerSources.length <= 1) return;
    const updatedPs = powerSources.filter(ps => ps.id !== psId);
    const updatedBa = baseAbilities.filter(ba => ba.powerSourceId !== psId);
    const updatedTech = techniques.filter(t => t.powerSourceId !== psId);
    onChange(updatedPs, updatedBa, updatedTech);
  };

  // 2. Grundfähigkeiten Actions
  const handleAddBaseAbility = (powerSourceId: string) => {
    const ps = powerSources.find(p => p.id === powerSourceId) || powerSources[0];
    const newBaId = `ba_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const defElement = 'Feuer';
    const defType: AbilityType = 'creation_manipulation';
    const defName = resolveKinesisName(defElement, defType);

    const newBa: BaseAbility = {
      id: newBaId,
      powerSourceId: ps?.id,
      powerSourceName: ps?.powerName,
      name: defName,
      displayName: defName,
      element: defElement,
      abilityType: defType,
      description: `Erschaffung und Manipulation des Elements ${defElement}.`,
      techniqueIds: []
    };

    onChange(powerSources, [...baseAbilities, newBa], techniques);
  };

  const handleUpdateBaseAbility = (baId: string, updates: Partial<BaseAbility>) => {
    const updatedBa = baseAbilities.map(ba => {
      if (ba.id === baId) {
        const nextElement = updates.element !== undefined ? updates.element : ba.element;
        const nextAbilityType = updates.abilityType !== undefined ? updates.abilityType : ba.abilityType;
        let nextDisplayName = updates.displayName !== undefined ? updates.displayName : ba.displayName;

        // Falls Element oder Typ geändert wurde und kein individueller Name gesetzt wurde
        if (updates.element !== undefined || updates.abilityType !== undefined) {
          const prevDefault = resolveKinesisName(ba.element, ba.abilityType);
          if (!ba.displayName || ba.displayName === prevDefault) {
            nextDisplayName = resolveKinesisName(nextElement, nextAbilityType);
          }
        }

        return {
          ...ba,
          ...updates,
          element: nextElement,
          abilityType: nextAbilityType,
          displayName: nextDisplayName,
          name: nextDisplayName
        };
      }
      return ba;
    });

    // Aktualisiere gecachte Grundfähigkeitsnamen in verknüpften Techniken
    const updatedTech = techniques.map(t => {
      if (t.baseAbilityIds?.includes(baId)) {
        const targetBa = updatedBa.find(b => b.id === baId);
        return {
          ...t,
          element: targetBa?.element || t.element,
          abilityType: targetBa?.abilityType || t.abilityType,
          baseAbilityNames: (t.baseAbilityIds || []).map(id => {
            const match = updatedBa.find(b => b.id === id);
            return match ? match.displayName : id;
          })
        };
      }
      return t;
    });

    onChange(powerSources, updatedBa, updatedTech);
  };

  const handleDeleteBaseAbility = (baId: string) => {
    const updatedBa = baseAbilities.filter(ba => ba.id !== baId);
    const updatedTech = techniques.filter(t => !t.baseAbilityIds?.includes(baId) || (t.baseAbilityIds.length > 1));
    // Entferne baId aus multi-ability Techniken
    const cleanedTech = updatedTech.map(t => ({
      ...t,
      baseAbilityIds: t.baseAbilityIds?.filter(id => id !== baId),
      baseAbilityNames: t.baseAbilityNames?.filter((_, idx) => t.baseAbilityIds?.[idx] !== baId)
    }));
    onChange(powerSources, updatedBa, cleanedTech);
  };

  // 3. Techniken Actions
  const handleAddManualTechnique = (baseAbilityId: string, powerSourceId: string) => {
    const ba = baseAbilities.find(b => b.id === baseAbilityId);
    const ps = powerSources.find(p => p.id === powerSourceId);
    const newTechId = `tech_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newTech: TechniqueItem = {
      id: newTechId,
      name: 'Neue Technik',
      description: '',
      type: 'Angriff',
      subtype: 'Standard',
      tier: 'Tier 1',
      baseAbilityIds: ba ? [ba.id] : [],
      baseAbilityNames: ba ? [ba.displayName] : [],
      powerSourceId: ps?.id,
      powerSourceName: ps?.powerName,
      element: ba?.element || 'Neutral',
      abilityType: ba?.abilityType || 'creation_manipulation',
      targetType: 'Selbst / Verbündete / Feinde',
      effects: [],
      costResourceName: ps?.cost || 'Mana',
      costValue: 10,
      cost: `10 ${ps?.cost || 'Mana'}`,
      level: 1,
      maxLevel: 10,
      xp: 0,
      xpNeeded: 100
    };

    const updatedTech = [...techniques, newTech];
    onChange(powerSources, baseAbilities, updatedTech);
  };

  const handleUpdateTechnique = (techId: string, updates: Partial<TechniqueItem>) => {
    const updatedTech = techniques.map(t => {
      if (t.id === techId) {
        return { ...t, ...updates };
      }
      return t;
    });
    onChange(powerSources, baseAbilities, updatedTech);
  };

  const handleDeleteTechnique = (techId: string) => {
    const updatedTech = techniques.filter(t => t.id !== techId);
    onChange(powerSources, baseAbilities, updatedTech);
  };

  const handleSmartFillCreated = (newTech: TechniqueItem) => {
    const updatedTech = [...techniques, newTech];
    onChange(powerSources, baseAbilities, updatedTech);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div>
          <div className="text-xs font-black text-slate-200 tracking-wider uppercase flex items-center gap-2">
            <LucideIcons.GitFork className="w-4 h-4 text-amber-500" />
            <span>Fähigkeiten-Hierarchie</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kraftquelle → Grundfähigkeit (Element · Fähigkeitsart) → Techniken
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSmartFillModalState({ isOpen: true })}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <LucideIcons.Sparkles className="w-3.5 h-3.5" />
              <span>Smart Fill Technik</span>
            </button>
            <button
              type="button"
              onClick={handleAddPowerSource}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <LucideIcons.Plus className="w-3.5 h-3.5" />
              <span>Kraftquelle hinzufügen</span>
            </button>
          </div>
        )}
      </div>

      {/* Baumansicht */}
      <div className="space-y-6">
        {powerSources.map((ps, psIdx) => {
          const isPsCollapsed = collapsedPowerSources[ps.id];
          const matchingBaseAbilities = baseAbilities.filter(
            ba => ba.powerSourceId === ps.id || (!ba.powerSourceId && psIdx === 0)
          );

          return (
            <div
              key={ps.id}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Level 1: Kraftquelle Header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => togglePowerSource(ps.id)}
                    className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                  >
                    {isPsCollapsed ? (
                      <LucideIcons.ChevronRight className="w-4 h-4" />
                    ) : (
                      <LucideIcons.ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
                    <LucideIcons.Zap className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-extrabold text-amber-500 uppercase tracking-widest">
                        Kraftquelle #{psIdx + 1}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({matchingBaseAbilities.length} Grundfähigkeiten)
                      </span>
                    </div>

                    {readOnly ? (
                      <h4 className="font-bold text-slate-100 text-sm truncate">
                        {ps.powerName || ps.source}
                      </h4>
                    ) : (
                      <input
                        type="text"
                        className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 font-bold text-slate-100 text-sm outline-none px-1 py-0.5 w-full max-w-sm transition-colors"
                        value={ps.powerName || ps.source || ''}
                        onChange={e => handleUpdatePowerSource(ps.id, { powerName: e.target.value, source: e.target.value })}
                        placeholder="z.B. Teufelskräfte, Haki, Magie..."
                      />
                    )}
                  </div>
                </div>

                {/* Kraftquellen-Kosten & Aktionen */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Kosten:</span>
                    {readOnly ? (
                      <span className="text-xs font-bold text-slate-200">{ps.cost || 'Mana'}</span>
                    ) : (
                      <input
                        type="text"
                        className="bg-transparent text-xs font-bold text-slate-200 outline-none w-16 text-right"
                        value={ps.cost || ''}
                        onChange={e => handleUpdatePowerSource(ps.id, { cost: e.target.value })}
                        placeholder="z.B. MP"
                      />
                    )}
                  </div>

                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAddBaseAbility(ps.id)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <LucideIcons.Plus className="w-3.5 h-3.5" />
                        <span>Grundfähigkeit</span>
                      </button>

                      {powerSources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePowerSource(ps.id)}
                          className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Kraftquelle löschen"
                        >
                          <LucideIcons.Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Level 2: Grundfähigkeiten Container */}
              {!isPsCollapsed && (
                <div className="p-4 space-y-4">
                  {matchingBaseAbilities.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center text-xs text-slate-500 italic">
                      Keine Grundfähigkeiten vorhanden. Klicke oben auf &ldquo;Grundfähigkeit&rdquo;, um eine hinzuzufügen.
                    </div>
                  ) : (
                    matchingBaseAbilities.map(ba => {
                      const isBaCollapsed = collapsedBaseAbilities[ba.id];
                      const matchingTechniques = techniques.filter(
                        t => t.baseAbilityIds?.includes(ba.id) || (!t.baseAbilityIds?.length && t.powerSourceId === ps.id)
                      );

                      return (
                        <div
                          key={ba.id}
                          className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-3 relative group"
                        >
                          {/* Grundfähigkeit Header & Konfiguration */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleBaseAbility(ba.id)}
                                className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                              >
                                {isBaCollapsed ? (
                                  <LucideIcons.ChevronRight className="w-3.5 h-3.5" />
                                ) : (
                                  <LucideIcons.ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <div className="p-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 shrink-0">
                                <LucideIcons.Flame className="w-3.5 h-3.5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Anzeigename / Kinese-Bezeichnung */}
                                  {readOnly ? (
                                    <span className="font-bold text-slate-100 text-xs">
                                      {ba.displayName || ba.name}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-bold outline-none focus:border-amber-500 w-36"
                                      value={ba.displayName || ba.name || ''}
                                      onChange={e => handleUpdateBaseAbility(ba.id, { displayName: e.target.value })}
                                      placeholder="z.B. Kryokinese"
                                    />
                                  )}

                                  {/* Element Auswahl */}
                                  {readOnly ? (
                                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[11px] font-semibold">
                                      {ba.element}
                                    </span>
                                  ) : (
                                    <select
                                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs font-semibold outline-none focus:border-amber-500"
                                      value={ba.element || 'Neutral'}
                                      onChange={e => handleUpdateBaseAbility(ba.id, { element: e.target.value })}
                                    >
                                      {ADVENTURE_FORGE_ELEMENTS.map(el => (
                                        <option key={el} value={el} className="bg-slate-900 text-white">
                                          {el}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {/* Fähigkeitsart Auswahl */}
                                  {readOnly ? (
                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[11px] font-semibold">
                                      {formatAbilityTypeLabel(ba.abilityType)}
                                    </span>
                                  ) : (
                                    <select
                                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-amber-400 text-xs font-semibold outline-none focus:border-amber-500"
                                      value={ba.abilityType || 'creation_manipulation'}
                                      onChange={e => handleUpdateBaseAbility(ba.id, { abilityType: e.target.value as AbilityType })}
                                    >
                                      {ABILITY_TYPES.map(at => (
                                        <option key={at.id} value={at.id} className="bg-slate-900 text-white">
                                          {at.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Grundfähigkeit Aktionen */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {!readOnly && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSmartFillModalState({
                                      isOpen: true,
                                      powerSourceId: ps.id,
                                      baseAbilityId: ba.id
                                    })}
                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <LucideIcons.Sparkles className="w-3 h-3" />
                                    <span>Smart Fill</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddManualTechnique(ba.id, ps.id)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <LucideIcons.Plus className="w-3 h-3" />
                                    <span>Technik</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBaseAbility(ba.id)}
                                    className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="Grundfähigkeit löschen"
                                  >
                                    <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Level 3: Techniken Liste / Baumunterelemente */}
                          {!isBaCollapsed && (
                            <div className="space-y-2.5 pl-3 border-l-2 border-slate-800">
                              {matchingTechniques.length === 0 ? (
                                <div className="text-[11px] text-slate-500 italic p-2.5 bg-slate-900/30 rounded-lg border border-slate-850">
                                  Keine Techniken für {ba.displayName || ba.name} angelegt. Klicke auf &ldquo;Smart Fill&rdquo; oder &ldquo;Technik&rdquo;, um neue Anwendungen zu erstellen.
                                </div>
                              ) : (
                                matchingTechniques.map((tech, tIdx) => {
                                  const isMultiAbility = (tech.baseAbilityIds?.length || 0) > 1;

                                  return (
                                    <div
                                      key={tech.id}
                                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 hover:border-slate-750 transition-all shadow-sm"
                                    >
                                      {!readOnly ? (
                                        <div className="space-y-3">
                                          {/* Kopfzeile: Index, Name, Tier, Typ, Kosten, Löschen */}
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-extrabold text-slate-500 font-mono shrink-0">
                                              #{tIdx + 1}
                                            </span>

                                            {/* Name Input */}
                                            <input
                                              type="text"
                                              className="flex-1 min-w-[160px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold outline-none focus:border-amber-500 placeholder:text-slate-600"
                                              value={tech.name || ''}
                                              onChange={e => handleUpdateTechnique(tech.id, { name: e.target.value })}
                                              placeholder="Name der Technik"
                                            />

                                            {/* Tier Auswahl */}
                                            <select
                                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-amber-400 text-xs font-bold outline-none focus:border-amber-500 cursor-pointer shrink-0"
                                              value={tech.tier || 'Tier 1'}
                                              onChange={e => handleUpdateTechnique(tech.id, { tier: e.target.value })}
                                            >
                                              <option value="Tier 1" className="bg-slate-950 text-amber-400">Tier 1</option>
                                              <option value="Tier 2" className="bg-slate-950 text-amber-400">Tier 2</option>
                                              <option value="Tier 3" className="bg-slate-950 text-amber-400">Tier 3</option>
                                              <option value="Tier 4" className="bg-slate-950 text-amber-400">Tier 4</option>
                                            </select>

                                            {/* Typ Auswahl */}
                                            <select
                                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 text-xs font-semibold outline-none focus:border-amber-500 cursor-pointer shrink-0"
                                              value={tech.type || 'Angriff'}
                                              onChange={e => handleUpdateTechnique(tech.id, { type: e.target.value })}
                                            >
                                              <option value="Angriff" className="bg-slate-950 text-white">Angriff</option>
                                              <option value="Verteidigung" className="bg-slate-950 text-white">Verteidigung</option>
                                              <option value="Transformation" className="bg-slate-950 text-white">Transformation</option>
                                              <option value="Support" className="bg-slate-950 text-white">Support</option>
                                              <option value="Heilung" className="bg-slate-950 text-white">Heilung</option>
                                              <option value="Zustandseffekt" className="bg-slate-950 text-white">Zustandseffekt</option>
                                              <option value="Spezial" className="bg-slate-950 text-white">Spezial</option>
                                              <option value="Beschwörung" className="bg-slate-950 text-white">Beschwörung</option>
                                            </select>

                                            {/* Kosten: Wert & Ressource */}
                                            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-0.5 shrink-0">
                                              <input
                                                type="number"
                                                min={0}
                                                className="w-14 bg-transparent text-white text-xs font-mono font-bold text-center outline-none py-1"
                                                value={tech.costValue ?? (parseInt(tech.cost || '0') || 10)}
                                                onChange={e => {
                                                  const val = parseInt(e.target.value) || 0;
                                                  const resName = tech.costResourceName || ps.cost || 'Mana';
                                                  handleUpdateTechnique(tech.id, {
                                                    costValue: val,
                                                    cost: `${val} ${resName}`
                                                  });
                                                }}
                                                placeholder="0"
                                              />
                                              <input
                                                type="text"
                                                className="w-20 bg-transparent text-slate-300 text-xs font-semibold outline-none py-1 border-l border-slate-800 pl-1.5 placeholder:text-slate-600"
                                                value={tech.costResourceName || ps.cost || 'Mana'}
                                                onChange={e => {
                                                  const resName = e.target.value;
                                                  const currentVal = tech.costValue ?? (parseInt(tech.cost || '0') || 10);
                                                  handleUpdateTechnique(tech.id, {
                                                    costResourceName: resName,
                                                    cost: `${currentVal} ${resName}`
                                                  });
                                                }}
                                                placeholder="Ressource"
                                              />
                                            </div>

                                            {/* Löschen */}
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteTechnique(tech.id)}
                                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                              title="Technik löschen"
                                            >
                                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Beschreibung & Wirkung */}
                                          <div>
                                            <AutoExpandingTextarea
                                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs leading-relaxed outline-none focus:border-amber-500 min-h-[48px] placeholder:text-slate-600"
                                              value={tech.description || ''}
                                              onChange={e => handleUpdateTechnique(tech.id, { description: e.target.value })}
                                              placeholder="Wirkung, Ablauf und Details der Technik beschreiben..."
                                            />
                                          </div>

                                          {/* Zieltyp & Kombinations-Badge */}
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                                Ziel:
                                              </span>
                                              <input
                                                type="text"
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs outline-none focus:border-amber-500 placeholder:text-slate-600"
                                                value={tech.targetType || ''}
                                                onChange={e => handleUpdateTechnique(tech.id, { targetType: e.target.value })}
                                                placeholder="z.B. Selbst / Verbündete / Feinde"
                                              />
                                            </div>

                                            {isMultiAbility && (
                                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 rounded flex items-center gap-1">
                                                <LucideIcons.Layers className="w-2.5 h-2.5" />
                                                <span>Kombination</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        /* Read-Only Ansicht */
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                              <span className="text-[10px] font-extrabold text-slate-500 font-mono">
                                                #{tIdx + 1}
                                              </span>
                                              <span className="font-bold text-slate-100 text-xs">
                                                {tech.name}
                                              </span>
                                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold text-amber-400 rounded">
                                                {tech.tier || 'Tier 1'}
                                              </span>
                                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">
                                                {tech.type || 'Angriff'}
                                              </span>
                                              {isMultiAbility && (
                                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 rounded flex items-center gap-1">
                                                  <LucideIcons.Layers className="w-2.5 h-2.5" />
                                                  <span>Kombination</span>
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                                              {tech.cost || `${tech.costValue || 10} ${tech.costResourceName || ps.cost || 'Mana'}`}
                                            </span>
                                          </div>

                                          {tech.description && (
                                            <p className="text-slate-300 text-[11.5px] leading-relaxed">
                                              {tech.description}
                                            </p>
                                          )}

                                          {tech.targetType && (
                                            <div className="text-[10.5px] text-slate-400">
                                              <strong className="text-slate-500">Ziel:</strong> {tech.targetType}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Smart Fill Modal */}
      {smartFillModalState.isOpen && (
        <TechniqueSmartFillModal
          isOpen={smartFillModalState.isOpen}
          onClose={() => setSmartFillModalState({ isOpen: false })}
          powerSources={powerSources}
          baseAbilities={baseAbilities}
          onTechniqueCreated={handleSmartFillCreated}
          characterName={characterName}
          characterRole={characterRole}
          worldTitle={worldTitle}
          initialPowerSourceId={smartFillModalState.powerSourceId}
          initialBaseAbilityId={smartFillModalState.baseAbilityId}
        />
      )}
    </div>
  );
};
