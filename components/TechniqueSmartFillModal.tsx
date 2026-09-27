// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  BaseAbility, 
  CharacterPowerSource, 
  TechniqueItem,
  CharacterPower,
  CharacterAbility,
  CharacterTechnique,
  PowerSystem
} from '../types';
import { 
  formatAbilityTypeLabel, 
  resolveKinesisName,
  generateCharacterTechniqueId
} from '../utils/abilityHierarchy';
import { smartFillTechnique } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export interface TechniqueSmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Neue Hierarchie-Props (bevorzugt)
  powerSystems?: PowerSystem[];
  powers?: CharacterPower[];
  abilities?: CharacterAbility[];
  activePowerId?: string;
  activeAbilityId?: string;
  onTechniqueCreated: (technique: CharacterTechnique | TechniqueItem, primaryAbilityId: string) => void;
  // Legacy-Kompatibilitätsprops
  powerSources?: CharacterPowerSource[];
  baseAbilities?: BaseAbility[];
  initialPowerSourceId?: string;
  initialBaseAbilityId?: string;
  characterName?: string;
  characterRole?: string;
  worldTitle?: string;
}

export const TechniqueSmartFillModal: React.FC<TechniqueSmartFillModalProps> = ({
  isOpen,
  onClose,
  powerSystems = [],
  powers = [],
  abilities = [],
  activePowerId,
  activeAbilityId,
  onTechniqueCreated,
  powerSources = [],
  baseAbilities = [],
  initialPowerSourceId,
  initialBaseAbilityId,
  characterName,
  characterRole,
  worldTitle
}) => {
  if (!isOpen) return null;

  // 1. Vereinheitlichte Liste der Kräfte ermitteln (bevorzugt aus powers, Fallback aus powerSources)
  const normalizedPowers = powers.length > 0
    ? powers.map(p => ({
        id: p.id,
        name: p.name || 'Kraft',
        resourceName: p.resourceName || 'Mana'
      }))
    : powerSources.map(ps => ({
        id: ps.id,
        name: ps.powerName || ps.source || 'Kraftquelle',
        resourceName: ps.cost || 'Mana'
      }));

  // 2. Vereinheitlichte Liste der Fähigkeiten ermitteln (bevorzugt aus abilities, Fallback aus baseAbilities)
  const normalizedAbilities = abilities.length > 0
    ? abilities.map(a => ({
        id: a.id,
        powerId: a.powerId,
        name: a.name || 'Fähigkeit',
        element: a.element || 'Neutral',
        abilityType: a.abilityType || 'creation_manipulation'
      }))
    : baseAbilities.map(ba => ({
        id: ba.id,
        powerId: ba.powerSourceId,
        name: ba.displayName || ba.name || resolveKinesisName(ba.element, ba.abilityType),
        element: ba.element || 'Neutral',
        abilityType: ba.abilityType || 'creation_manipulation'
      }));

  // 3. Ausgewählte Kraft
  const [selectedPowerId, setSelectedPowerId] = useState<string>(() => {
    const initId = activePowerId || initialPowerSourceId;
    if (initId && normalizedPowers.some(p => p.id === initId)) {
      return initId;
    }
    return normalizedPowers[0]?.id || '';
  });

  // 4. Verfügbare Fähigkeiten für ausgewählte Kraft
  const availableAbilities = normalizedAbilities.filter(
    a => !selectedPowerId || !a.powerId || a.powerId === selectedPowerId || normalizedPowers.length === 1
  );

  // 5. Ausgewählte Hauptfähigkeit
  const [selectedAbilityId, setSelectedAbilityId] = useState<string>(() => {
    const initId = activeAbilityId || initialBaseAbilityId;
    if (initId && availableAbilities.some(a => a.id === initId)) {
      return initId;
    }
    return availableAbilities[0]?.id || normalizedAbilities[0]?.id || '';
  });

  // 6. Zusätzliche Fähigkeiten für Kombinationszauber
  const [additionalAbilityIds, setAdditionalAbilityIds] = useState<string[]>([]);
  const [showMultiAbilityToggle, setShowMultiAbilityToggle] = useState<boolean>(false);

  // 7. Beschreibung & Generierungsstatus
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aktualisiere ausgewählte Fähigkeit, falls sich die Kraft ändert
  useEffect(() => {
    if (selectedPowerId) {
      const filtered = normalizedAbilities.filter(
        a => !a.powerId || a.powerId === selectedPowerId || normalizedPowers.length === 1
      );
      if (filtered.length > 0 && !filtered.some(a => a.id === selectedAbilityId)) {
        setSelectedAbilityId(filtered[0].id);
      }
    }
  }, [selectedPowerId, normalizedAbilities, normalizedPowers.length]);

  const activePower = normalizedPowers.find(p => p.id === selectedPowerId) || normalizedPowers[0];
  const activeAbility = normalizedAbilities.find(a => a.id === selectedAbilityId) || availableAbilities[0] || normalizedAbilities[0];

  const handleGenerate = async () => {
    if (!activeAbility) {
      setErrorMessage('Bitte wähle eine gültige Fähigkeit aus.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Bitte gib eine kurze Beschreibung oder Idee für die Technik ein.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const additionalAbilities = additionalAbilityIds
        .map(id => normalizedAbilities.find(a => a.id === id))
        .filter((a): a is typeof normalizedAbilities[0] => !!a)
        .map(a => ({
          id: a.id,
          name: a.name,
          element: a.element,
          abilityType: formatAbilityTypeLabel(a.abilityType)
        }));

      const generated = await smartFillTechnique({
        powerSourceId: activePower?.id,
        powerSourceName: activePower?.name || 'Kraft',
        baseAbilityId: activeAbility.id,
        baseAbilityName: activeAbility.name,
        element: activeAbility.element,
        abilityType: formatAbilityTypeLabel(activeAbility.abilityType),
        additionalBaseAbilities: additionalAbilities,
        description: description.trim(),
        characterName,
        characterRole,
        worldTitle
      });

      // Erzeuge deterministische, stabile ID
      const newTechId = generateCharacterTechniqueId(activeAbility.id, generated.name);

      const newTechnique: CharacterTechnique = {
        id: newTechId,
        powerId: activePower?.id,
        abilityId: activeAbility.id,
        name: generated.name,
        description: generated.description,
        techniqueType: generated.type || 'Angriff',
        mode: generated.mode || 'Normal',
        element: activeAbility.element || 'Neutral',
        cost: generated.cost || `${generated.costValue || 10} ${generated.costResourceName || activePower?.resourceName || 'Mana'}`,
        costValue: generated.costValue !== undefined ? generated.costValue : 10,
        costResourceName: generated.costResourceName || activePower?.resourceName || 'Mana',
        costFormula: 'absolut',
        range: generated.range || 'Nahkampf',
        duration: generated.duration || 'Sofort',
        targetType: generated.targetType,
        effects: generated.effects || [],
        progression: {
          score: 0,
          level: 1,
          xp: 0,
          isLearnable: true
        }
      };

      onTechniqueCreated(newTechnique, activeAbility.id);
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
                Erzeuge eine balancierte Technik aus Kraft und Fähigkeit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* 1. Kraft Auswahl */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Kraft
            </label>
            {normalizedPowers.length <= 1 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white flex items-center justify-between">
                <span>{activePower?.name || 'Standard-Kraft'}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activePower?.resourceName || 'Mana'}
                </span>
              </div>
            ) : (
              <select
                value={selectedPowerId}
                onChange={e => setSelectedPowerId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
              >
                {normalizedPowers.map(p => (
                  <option key={`sf-pow-${p.id}`} value={p.id}>
                    {p.name} ({p.resourceName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Haupt-Fähigkeit Auswahl */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Haupt-Fähigkeit (Fokus der Technik)
            </label>
            {availableAbilities.length === 0 ? (
              <div className="text-xs text-amber-400/90 italic bg-amber-950/30 border border-amber-900/50 rounded-xl p-3">
                Keine Fähigkeiten für diese Kraft vorhanden.
              </div>
            ) : (
              <select
                value={selectedAbilityId}
                onChange={e => setSelectedAbilityId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
              >
                {availableAbilities.map(a => (
                  <option key={`sf-ab-${a.id}`} value={a.id}>
                    {a.name} [{a.element}] ({formatAbilityTypeLabel(a.abilityType)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Optionale Kombinations-Fähigkeiten */}
          {normalizedAbilities.length > 1 && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowMultiAbilityToggle(!showMultiAbilityToggle)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <LucideIcons.Plus className="w-3.5 h-3.5" />
                <span>Kombinations-Fähigkeiten hinzufügen ({additionalAbilityIds.length})</span>
              </button>

              {showMultiAbilityToggle && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Wähle weitere Fähigkeiten aus, um Synergien oder Kombinations-Effekte zu erzeugen:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {normalizedAbilities
                      .filter(a => a.id !== selectedAbilityId)
                      .map(a => {
                        const isChecked = additionalAbilityIds.includes(a.id);
                        return (
                          <label
                            key={`sf-combo-${a.id}`}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setAdditionalAbilityIds([...additionalAbilityIds, a.id]);
                                } else {
                                  setAdditionalAbilityIds(additionalAbilityIds.filter(id => id !== a.id));
                                }
                              }}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0"
                            />
                            <span className="truncate">{a.name} ({a.element})</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Technik-Idee / Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Technik-Idee oder gewünschte Wirkung *
            </label>
            <AutoExpandingTextarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="z.B. Ein fliegender Eisspeer, der das Ziel verlangsamt und beim Aufprall in Splitter explodiert..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 min-h-[80px]"
            />
          </div>

          {/* Fehlermeldung */}
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
              <LucideIcons.AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !description.trim() || !activeAbility}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <LucideIcons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generiere Technik...</span>
              </>
            ) : (
              <>
                <LucideIcons.Sparkles className="w-3.5 h-3.5" />
                <span>Technik generieren</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechniqueSmartFillModal;
