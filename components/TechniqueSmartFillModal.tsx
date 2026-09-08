// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { BaseAbility, CharacterPowerSource, TechniqueItem } from '../types';
import { formatAbilityTypeLabel, resolveKinesisName } from '../utils/abilityHierarchy';
import { smartFillTechnique } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface TechniqueSmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  powerSources: CharacterPowerSource[];
  baseAbilities: BaseAbility[];
  onTechniqueCreated: (technique: TechniqueItem, primaryBaseAbilityId: string) => void;
  characterName?: string;
  characterRole?: string;
  worldTitle?: string;
  initialPowerSourceId?: string;
  initialBaseAbilityId?: string;
}

export const TechniqueSmartFillModal: React.FC<TechniqueSmartFillModalProps> = ({
  isOpen,
  onClose,
  powerSources,
  baseAbilities,
  onTechniqueCreated,
  characterName,
  characterRole,
  worldTitle,
  initialPowerSourceId,
  initialBaseAbilityId
}) => {
  if (!isOpen) return null;

  // 1. Initialer Kraftquellen-Zustand
  const [selectedPowerSourceId, setSelectedPowerSourceId] = useState<string>(() => {
    if (initialPowerSourceId && powerSources.some(p => p.id === initialPowerSourceId)) {
      return initialPowerSourceId;
    }
    return powerSources[0]?.id || '';
  });

  // 2. Verfügbare Grundfähigkeiten filtern
  const availableBaseAbilities = baseAbilities.filter(
    ba => !selectedPowerSourceId || ba.powerSourceId === selectedPowerSourceId
  );

  // 3. Initialer Grundfähigkeits-Zustand
  const [selectedBaseAbilityId, setSelectedBaseAbilityId] = useState<string>(() => {
    if (initialBaseAbilityId && availableBaseAbilities.some(ba => ba.id === initialBaseAbilityId)) {
      return initialBaseAbilityId;
    }
    return availableBaseAbilities[0]?.id || baseAbilities[0]?.id || '';
  });

  // 4. Zusätzliche Grundfähigkeiten (Mehrfachauswahl für Kombinationen)
  const [additionalBaseAbilityIds, setAdditionalBaseAbilityIds] = useState<string[]>([]);
  const [showMultiAbilityToggle, setShowMultiAbilityToggle] = useState<boolean>(false);

  // 5. Technikbeschreibung & Status
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aktualisiere ausgewählte Grundfähigkeit, falls sich die Kraftquelle ändert
  useEffect(() => {
    if (selectedPowerSourceId) {
      const filtered = baseAbilities.filter(ba => ba.powerSourceId === selectedPowerSourceId);
      if (filtered.length > 0 && !filtered.some(ba => ba.id === selectedBaseAbilityId)) {
        setSelectedBaseAbilityId(filtered[0].id);
      }
    }
  }, [selectedPowerSourceId, baseAbilities]);

  const activePowerSource = powerSources.find(p => p.id === selectedPowerSourceId) || powerSources[0];
  const activeBaseAbility = baseAbilities.find(ba => ba.id === selectedBaseAbilityId) || availableBaseAbilities[0] || baseAbilities[0];

  const handleGenerate = async () => {
    if (!activeBaseAbility) {
      setErrorMessage('Bitte wähle eine gültige Grundfähigkeit aus.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Bitte gib eine kurze Beschreibung oder Idee für die Technik ein.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const additionalAbilities = additionalBaseAbilityIds
        .map(id => baseAbilities.find(ba => ba.id === id))
        .filter((ba): ba is BaseAbility => !!ba)
        .map(ba => ({
          id: ba.id,
          name: ba.displayName || ba.name || resolveKinesisName(ba.element, ba.abilityType),
          element: ba.element,
          abilityType: formatAbilityTypeLabel(ba.abilityType)
        }));

      const generated = await smartFillTechnique({
        powerSourceId: activePowerSource?.id,
        powerSourceName: activePowerSource?.powerName || activePowerSource?.source || 'Standard-Kraftquelle',
        baseAbilityId: activeBaseAbility.id,
        baseAbilityName: activeBaseAbility.displayName || activeBaseAbility.name || resolveKinesisName(activeBaseAbility.element, activeBaseAbility.abilityType),
        element: activeBaseAbility.element,
        abilityType: formatAbilityTypeLabel(activeBaseAbility.abilityType),
        additionalBaseAbilities: additionalAbilities,
        description: description.trim(),
        characterName,
        characterRole,
        worldTitle
      });

      const linkedIds = [activeBaseAbility.id, ...additionalBaseAbilityIds];
      const linkedNames = [
        activeBaseAbility.displayName || activeBaseAbility.name || resolveKinesisName(activeBaseAbility.element, activeBaseAbility.abilityType),
        ...additionalAbilities.map(a => a.name)
      ];

      const newTechnique: TechniqueItem = {
        id: `tech_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: generated.name,
        description: generated.description,
        type: generated.type,
        subtype: generated.subtype,
        tier: generated.tier,
        baseAbilityIds: linkedIds,
        baseAbilityNames: linkedNames,
        powerSourceId: activePowerSource?.id,
        powerSourceName: activePowerSource?.powerName || activePowerSource?.source,
        element: activeBaseAbility.element,
        abilityType: activeBaseAbility.abilityType,
        targetType: generated.targetType,
        effects: generated.effects,
        applications: generated.effects,
        costResourceName: generated.costResourceName,
        costValue: generated.costValue,
        cost: generated.cost,
        range: generated.range,
        duration: generated.duration,
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpNeeded: 100
      };

      onTechniqueCreated(newTechnique, activeBaseAbility.id);
      onClose();
    } catch (err: any) {
      console.error('Technique Smart Fill error:', err);
      setErrorMessage(err.message || 'Fehler beim Generieren der Technik. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <LucideIcons.Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">
                Smart Fill – Technik
              </h3>
              <p className="text-[11px] text-slate-400">
                Erzeuge eine balancierte Kampf-Technik aus Kraftquelle und Grundfähigkeit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* 1. Kraftquelle Auswahl */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Kraftquelle
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 font-semibold h-[38px]"
              value={selectedPowerSourceId}
              onChange={e => setSelectedPowerSourceId(e.target.value)}
            >
              {powerSources.map(ps => (
                <option key={ps.id} value={ps.id} className="bg-slate-900 text-white">
                  {ps.powerName || ps.source || 'Standard-Kraftquelle'} ({ps.cost || 'Mana'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Grundfähigkeit Auswahl */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Grundfähigkeit
            </label>
            {availableBaseAbilities.length === 0 ? (
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 italic">
                Keine Grundfähigkeiten für diese Kraftquelle vorhanden.
              </div>
            ) : (
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 font-semibold h-[38px]"
                value={selectedBaseAbilityId}
                onChange={e => setSelectedBaseAbilityId(e.target.value)}
              >
                {availableBaseAbilities.map(ba => (
                  <option key={ba.id} value={ba.id} className="bg-slate-900 text-white">
                    {ba.displayName || ba.name || resolveKinesisName(ba.element, ba.abilityType)} ({ba.element})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Element & Fähigkeitsart (Automatisch abgeleitete Datenanzeige) */}
          {activeBaseAbility && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Element / Aspekt
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-200">
                    {activeBaseAbility.element || 'Neutral'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Fähigkeitsart
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {formatAbilityTypeLabel(activeBaseAbility.abilityType)}
                </span>
              </div>
            </div>
          )}

          {/* Optional: Kombination mehrerer Grundfähigkeiten Toggle */}
          {baseAbilities.length > 1 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMultiAbilityToggle(!showMultiAbilityToggle)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <LucideIcons.Layers className="w-3.5 h-3.5" />
                <span>
                  {showMultiAbilityToggle 
                    ? 'Zusätzliche Grundfähigkeiten verbergen' 
                    : 'Mehrere Grundfähigkeiten kombinieren (+)'}
                </span>
              </button>

              {showMultiAbilityToggle && (
                <div className="mt-2.5 p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    Wähle weitere Grundfähigkeiten, die in diese Technik einfließen:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {baseAbilities
                      .filter(ba => ba.id !== activeBaseAbility?.id)
                      .map(ba => {
                        const isChecked = additionalBaseAbilityIds.includes(ba.id);
                        return (
                          <label
                            key={ba.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setAdditionalBaseAbilityIds([...additionalBaseAbilityIds, ba.id]);
                                } else {
                                  setAdditionalBaseAbilityIds(additionalBaseAbilityIds.filter(id => id !== ba.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                            />
                            <span className="truncate">
                              {ba.displayName || ba.name} ({ba.element})
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-3">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
              Technikbeschreibung
            </label>
            <AutoExpandingTextarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 min-h-[90px] leading-relaxed"
              placeholder="z.B. Erschaffe mit Eis eine Kuppel um mich, Verbündete oder Feinde, um sie zu schützen oder einzusperren."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <LucideIcons.AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !description.trim() || !activeBaseAbility}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                <span>Generiere Technik...</span>
              </>
            ) : (
              <>
                <LucideIcons.Sparkles className="w-4 h-4" />
                <span>Technik erstellen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
