// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { 
  Shield, 
  Flame, 
  Sparkles, 
  Layers, 
  Zap, 
  Dumbbell, 
  Award, 
  Lock, 
  TrendingUp, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal 
} from 'lucide-react';
import { TechniqueItem, BaseAbility, CharacterPowerSource, TechniqueTransformationModifier, TransformationModifierType } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export interface TechniqueCardProps {
  entry: TechniqueItem;
  category: 'Passive Fähigkeiten' | 'Techniken' | 'Ultimative Techniken' | 'Transformationen';
  readOnly?: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (updates: Partial<TechniqueItem>) => void;
  onDelete: () => void;
  activePowerSource: CharacterPowerSource | null;
  baseAbilities: BaseAbility[];
  onToggleLinkedBaseAbility: (baId: string) => void;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  availableTransformations?: Array<{ id: string; name: string; transformName?: string }>;
}

export const TECHNIQUE_MODES = [
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

export const TECHNIQUE_LEVEL_PRESETS = [
  { label: 'Anfänger', score: 0 },
  { label: 'Basis', score: 25 },
  { label: 'Fortgeschritten', score: 50 },
  { label: 'Erfahren', score: 75 },
  { label: 'Meisterhaft', score: 95 }
];

export const getTechniqueMasteryLabel = (score: number): string => {
  if (score <= 0) return 'Anfänger';
  if (score <= 25) return 'Basis';
  if (score <= 55) return 'Fortgeschritten';
  if (score <= 80) return 'Erfahren';
  return 'Meisterhaft';
};

export const getTechniqueTierFromScore = (score: number, defaultCategory?: string): string => {
  if (defaultCategory === 'Ultimative Techniken') return 'Tier 4';
  if (score <= 25) return 'Tier 1';
  if (score <= 55) return 'Tier 2';
  if (score <= 80) return 'Tier 3';
  return 'Tier 4';
};

export const TechniqueCard: React.FC<TechniqueCardProps> = ({
  entry,
  category,
  readOnly = false,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onDelete,
  activePowerSource,
  baseAbilities = [],
  onToggleLinkedBaseAbility,
  progressionLogic = 'ep',
  availableTransformations = []
}) => {
  const [showTransformModifiers, setShowTransformModifiers] = useState<boolean>(false);
  const isTechOrUlt = category === 'Techniken' || category === 'Ultimative Techniken';
  const isTransform = category === 'Transformationen';
  const isPassive = category === 'Passive Fähigkeiten';

  // Synchronisierter Score & Beherrschungsgrad
  const currentScore = entry.score !== undefined 
    ? entry.score 
    : (entry.trainingProgress !== undefined ? entry.trainingProgress : 0);

  const currentXp = entry.xp !== undefined ? entry.xp : 0;
  const currentLevel = entry.level || 1;
  const currentUnits = entry.trainingUnits || 0;
  const currentPoints = entry.points !== undefined 
    ? entry.points 
    : (currentScore === 0 ? 0 : currentScore <= 25 ? 1 : currentScore <= 55 ? 2 : currentScore <= 80 ? 3 : 4);

  const masteryLabel = getTechniqueMasteryLabel(currentScore);
  const resourceName = entry.costResourceName || activePowerSource?.cost || 'Mana';

  // -------------------------------------------------------------
  // Progression Handler
  // -------------------------------------------------------------
  const handleSetScore = (scoreVal: number) => {
    const clamped = Math.min(100, Math.max(0, scoreVal));
    const tier = getTechniqueTierFromScore(clamped, category);
    onUpdate({
      score: clamped,
      trainingProgress: clamped,
      tier,
      masteryLevel: `${getTechniqueMasteryLabel(clamped)} (${clamped}%)`,
      points: clamped === 0 ? 0 : clamped <= 25 ? 1 : clamped <= 55 ? 2 : clamped <= 80 ? 3 : 4
    });
  };

  // EP Steigerung
  const handleAddXp = (amount: number) => {
    let nextXp = currentXp + amount;
    let nextScore = currentScore;
    let nextLevel = currentLevel;
    let nextTier = entry.tier || getTechniqueTierFromScore(nextScore, category);

    if (nextXp >= 100) {
      nextXp = nextXp - 100;
      nextLevel = Math.min(10, nextLevel + 1);
      nextScore = Math.min(100, nextScore + 20);
      nextTier = getTechniqueTierFromScore(nextScore, category);
    }

    onUpdate({
      xp: Math.min(100, Math.max(0, nextXp)),
      score: nextScore,
      trainingProgress: nextScore,
      level: nextLevel,
      tier: nextTier,
      masteryLevel: `${getTechniqueMasteryLabel(nextScore)} (${nextScore}%)`
    });
  };

  const handleLevelUp = () => {
    const nextScore = Math.min(100, currentScore + 25);
    const nextLevel = Math.min(10, currentLevel + 1);
    const nextTier = getTechniqueTierFromScore(nextScore, category);

    onUpdate({
      xp: 0,
      score: nextScore,
      trainingProgress: nextScore,
      level: nextLevel,
      tier: nextTier,
      masteryLevel: `${getTechniqueMasteryLabel(nextScore)} (${nextScore}%)`
    });
  };

  // Training Steigerung
  const handleAddTraining = (amount: number) => {
    const nextUnits = Math.min(4, currentUnits + amount);
    onUpdate({ trainingUnits: nextUnits });
  };

  const handleCompleteRoutine = () => {
    const nextScore = Math.min(95, currentScore + 25);
    const nextTier = getTechniqueTierFromScore(nextScore, category);
    onUpdate({
      trainingUnits: 0,
      score: nextScore,
      trainingProgress: nextScore,
      tier: nextTier,
      masteryLevel: `${getTechniqueMasteryLabel(nextScore)} (${nextScore}%)`
    });
  };

  // Meilenstein Steigerung
  const handleMilestoneAdvance = () => {
    const nextScore = Math.min(95, currentScore + 25);
    const nextTier = getTechniqueTierFromScore(nextScore, category);
    onUpdate({
      score: nextScore,
      trainingProgress: nextScore,
      tier: nextTier,
      masteryLevel: `${getTechniqueMasteryLabel(nextScore)} (${nextScore}%)`
    });
  };

  const handleMilestoneDemote = () => {
    const prevScore = Math.max(0, currentScore - 25);
    const prevTier = getTechniqueTierFromScore(prevScore, category);
    onUpdate({
      score: prevScore,
      trainingProgress: prevScore,
      tier: prevTier,
      masteryLevel: `${getTechniqueMasteryLabel(prevScore)} (${prevScore}%)`
    });
  };

  // Statische Punkte
  const handleSetPoints = (pts: number) => {
    const scoreMap: Record<number, number> = { 0: 0, 1: 25, 2: 50, 3: 75, 4: 95 };
    const nextScore = scoreMap[pts] !== undefined ? scoreMap[pts] : 0;
    const nextTier = getTechniqueTierFromScore(nextScore, category);
    onUpdate({
      points: pts,
      score: nextScore,
      trainingProgress: nextScore,
      tier: nextTier,
      masteryLevel: `${getTechniqueMasteryLabel(nextScore)} (${nextScore}%)`
    });
  };

  // Icon je nach Kategorie
  const renderCategoryIcon = () => {
    if (isPassive) return <Shield className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (category === 'Ultimative Techniken') return <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
    if (isTransform) return <Layers className="w-4 h-4 text-cyan-400 shrink-0" />;
    return <Flame className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700/80">
      {/* ============================================================ */}
      {/* 1. KARTEN-HEADER (Immer sichtbar & einklappbar)               */}
      {/* ============================================================ */}
      <div 
        onClick={onToggleExpanded}
        className="p-3 bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {renderCategoryIcon()}
          <span className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-[320px]">
            {entry.name || 'Unbenannte Fähigkeit'}
          </span>

          {/* Subtitle / Mode Badges */}
          {isTechOrUlt && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
              {entry.type || 'Angriff'} • {entry.mode || 'Normal'}
            </span>
          )}
          {isPassive && entry.activationCondition && (
            <span className="hidden sm:inline-block text-[11px] text-emerald-400/90 font-medium truncate max-w-[220px]">
              {entry.activationCondition}
            </span>
          )}
          {isTransform && entry.transformName && (
            <span className="hidden sm:inline-block text-[11px] text-cyan-400/90 font-medium truncate max-w-[220px]">
              Form: {entry.transformName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Kosten Badge */}
          {isPassive ? (
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-[10px] font-semibold">
              Passiv
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-medium">
              {entry.costValue !== undefined ? `${entry.costValue} ${resourceName}` : (entry.cost || `10 ${resourceName}`)}
            </span>
          )}

          {/* Tier Badge */}
          <span className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-slate-300 text-[10px] font-medium">
            {entry.tier || (category === 'Ultimative Techniken' ? 'Tier 4' : 'Tier 1')}
          </span>

          {/* Beherrschung Badge */}
          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
            {masteryLabel} ({currentScore}%)
          </span>

          {/* Progression Mini-Badge nach Regelsatz */}
          {progressionLogic === 'ep' && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-amber-300 font-mono">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{currentXp}/100 EP</span>
            </span>
          )}
          {progressionLogic === 'training' && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-emerald-300 font-mono">
              <Dumbbell className="w-3 h-3 text-emerald-400" />
              <span>{currentUnits}/4 Übungen</span>
            </span>
          )}
          {progressionLogic === 'milestone' && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-purple-300 font-medium">
              <Award className="w-3 h-3 text-purple-400" />
              <span>Stufe {currentScore <= 25 ? '1' : currentScore <= 55 ? '2' : currentScore <= 80 ? '3' : '4'}</span>
            </span>
          )}
          {progressionLogic === 'static' && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{currentPoints} Pkt</span>
            </span>
          )}

          {/* Auf-/Zuklappen Button */}
          <button
            type="button"
            onClick={onToggleExpanded}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Einklappen' : 'Aufklappen'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Löschen Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title="Fähigkeit löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. AUFGEKLAPPTER BEREICH                                      */}
      {/* ============================================================ */}
      {isExpanded && (
        <div className="p-3 sm:p-4 flex flex-col gap-3.5 bg-slate-950/40">
          {/* Sektion 1: Grunddaten & Parameter */}
          <div className="flex flex-col gap-2.5">
            {/* Zeile 1: Name & Spezifische Attribute */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
              {/* Name */}
              <div className={`${isTechOrUlt ? 'sm:col-span-5' : 'sm:col-span-6'} flex flex-col gap-1`}>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  Name
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-bold outline-none focus:border-amber-500 h-[32px] disabled:opacity-50"
                  value={entry.name || ''}
                  placeholder="z.B. Frostlanze, Schattensprung..."
                  onChange={e => onUpdate({ name: e.target.value })}
                />
              </div>

              {/* Modus (Techniken / Ultimative Techniken) */}
              {isTechOrUlt && (
                <div className="sm:col-span-3 flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Modus
                  </label>
                  <select
                    disabled={readOnly}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] cursor-pointer disabled:opacity-50"
                    value={TECHNIQUE_MODES.includes(entry.mode || '') ? (entry.mode || 'Normal') : '__custom__'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        onUpdate({ mode: '' });
                      } else {
                        onUpdate({ mode: val });
                      }
                    }}
                  >
                    {TECHNIQUE_MODES.map(m => (
                      <option key={`mod-${m}`} value={m}>{m}</option>
                    ))}
                    <option value="__custom__">Eigener Modus...</option>
                  </select>
                  {!TECHNIQUE_MODES.includes(entry.mode || '') && (
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[28px] mt-1 disabled:opacity-50"
                      value={entry.mode || ''}
                      placeholder="Modus eingeben..."
                      onChange={e => onUpdate({ mode: e.target.value })}
                    />
                  )}
                </div>
              )}

              {/* Typ (Techniken / Ultimative Techniken) */}
              {isTechOrUlt && (
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Typ / Klassifikation
                  </label>
                  <select
                    disabled={readOnly}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] cursor-pointer disabled:opacity-50"
                    value={entry.type || 'Angriff'}
                    onChange={e => onUpdate({ type: e.target.value })}
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

              {/* Passive: Auslöser & Wirkungsbereich */}
              {isPassive && (
                <>
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Bedingung / Auslöser
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] disabled:opacity-50"
                      value={entry.activationCondition || ''}
                      placeholder="z.B. Permanent aktiv, Bei HP < 25%"
                      onChange={e => onUpdate({ activationCondition: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Wirkungsziel / Wirkungsbereich
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] disabled:opacity-50"
                      value={entry.targetType || ''}
                      placeholder="z.B. Selbst, Aura (Umkreis 5m), Gruppe"
                      onChange={e => onUpdate({ targetType: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Transformationen: Form & Metamorphose */}
              {isTransform && (
                <>
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Form / Gestalt
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] disabled:opacity-50"
                      value={entry.transformName || ''}
                      placeholder="z.B. Schattenwolf-Form"
                      onChange={e => onUpdate({ transformName: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                      Metamorphose-Einfluss
                    </label>
                    <select
                      disabled={readOnly}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[32px] cursor-pointer disabled:opacity-50"
                      value={entry.metamorphosisInfluence !== undefined ? entry.metamorphosisInfluence : 100}
                      onChange={e => onUpdate({ metamorphosisInfluence: parseInt(e.target.value, 10) || 100 })}
                    >
                      <option value={100}>100% (Vollständige Wandlung)</option>
                      <option value={75}>75% (Große Gestaltanpassung)</option>
                      <option value={50}>50% (Teil-Transformation)</option>
                      <option value={25}>25% (Geringe körperliche Mutation)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Zeile 2: Kosten, Tier, Reichweite & Dauer */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Kosten */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  {isPassive ? 'Kosten / Unterhalt' : `Kosten (${resourceName})`}
                </label>
                {isPassive ? (
                  <input
                    type="text"
                    disabled={readOnly}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                    value={entry.cost || 'Passiv'}
                    placeholder="Passiv (0)"
                    onChange={e => onUpdate({ cost: e.target.value })}
                  />
                ) : (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      disabled={readOnly}
                      min={0}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                      value={entry.costValue !== undefined ? entry.costValue : (category === 'Ultimative Techniken' ? 50 : 10)}
                      onChange={e => onUpdate({ costValue: parseInt(e.target.value, 10) || 0 })}
                    />
                    <span className="text-[11px] text-slate-400 font-medium">
                      {resourceName}
                    </span>
                  </div>
                )}
              </div>

              {/* Tier / Rang */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  Tier / Rang
                </label>
                <select
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer disabled:opacity-50"
                  value={entry.tier || (category === 'Ultimative Techniken' ? 'Tier 4' : 'Tier 1')}
                  onChange={e => onUpdate({ tier: e.target.value })}
                >
                  <option value="Tier 1">Tier 1 (Grundstufe)</option>
                  <option value="Tier 2">Tier 2 (Fortgeschritten)</option>
                  <option value="Tier 3">Tier 3 (Meisterhaft)</option>
                  <option value="Tier 4">Tier 4 (Ultimativ)</option>
                </select>
              </div>

              {/* Reichweite */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  {isPassive ? 'Wirkungsradius' : 'Reichweite'}
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                  value={entry.range || ''}
                  placeholder={isPassive ? 'z.B. Selbst, Aura 5m' : 'z.B. Nahkampf, 15m'}
                  onChange={e => onUpdate({ range: e.target.value })}
                />
              </div>

              {/* Dauer */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  {isPassive ? 'Frequenz' : 'Dauer'}
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                  value={entry.duration || ''}
                  placeholder={isPassive ? 'Dauerhaft aktiv' : isTransform ? 'z.B. 5 Runden' : 'z.B. Sofort, 3 Runden'}
                  onChange={e => onUpdate({ duration: e.target.value })}
                />
              </div>
            </div>

            {/* Beschwörungs-Zusatzoptionen */}
            {entry.type === 'Beschwörung' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Beschwörungen (Anzahl)
                  </label>
                  <input
                    type="number"
                    disabled={readOnly}
                    min={1}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                    value={entry.summonCount !== undefined ? entry.summonCount : 1}
                    onChange={e => onUpdate({ summonCount: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Kosten pro weiterer Beschwörung ({resourceName})
                  </label>
                  <input
                    type="number"
                    disabled={readOnly}
                    min={0}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] disabled:opacity-50"
                    value={entry.summonCostValue !== undefined ? entry.summonCostValue : 5}
                    onChange={e => onUpdate({ summonCostValue: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* Sektion 2: Globale Progression & Stufen-Steigerung            */}
          {/* ============================================================ */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
            {/* FALL A: EP-BASIERTE PROGRESSION (KAMPF) */}
            {progressionLogic === 'ep' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>EP-basierte Progression (Kampf)</span>
                  </div>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {currentXp} / 100 EP bis zum nächsten Stufenaufstieg
                  </span>
                </div>

                {/* Fortschrittsbalken */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, currentXp)}%` }}
                  />
                </div>

                {/* EP Aktionen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(10)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +10 EP
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(25)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +25 EP
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(50)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +50 EP
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-slate-400 gap-1.5">
                      <span>EP:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={readOnly}
                        value={currentXp}
                        onChange={e => onUpdate({ xp: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-amber-400 font-mono text-xs outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={readOnly || currentScore >= 95}
                      onClick={handleLevelUp}
                      className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        currentXp >= 100
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-extrabold'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Stufenaufstieg</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Aktuelle Stufe: Level {currentLevel} • {entry.tier || 'Tier 1'}</span>
                  <div className="flex items-center gap-1.5">
                    <span>EP-Gewinn pro Einsatz:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      disabled={readOnly}
                      value={entry.xpGainPerUse || 5}
                      onChange={e => onUpdate({ xpGainPerUse: Number(e.target.value) || 5 })}
                      className="w-12 bg-slate-950 border border-slate-800 rounded px-1 text-center text-slate-200 text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FALL B: TRAINING & ÜBUNG */}
            {progressionLogic === 'training' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Progression durch Training & Übung</span>
                  </div>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {currentUnits} von 4 Übungseinheiten absolviert
                  </span>
                </div>

                {/* 4 Übungseinheiten Segmente */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(seg => (
                    <div
                      key={`train-seg-${seg}`}
                      className={`h-2 rounded-full border transition-all ${
                        seg <= currentUnits
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Trainings Aktionen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly || currentUnits >= 4}
                      onClick={() => handleAddTraining(1)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +1 Praxisanwendung
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || currentUnits >= 4}
                      onClick={() => handleAddTraining(2)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +2 Intensive Übung
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={readOnly || currentScore >= 95}
                    onClick={handleCompleteRoutine}
                    className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      currentUnits >= 4
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Routine meistern (Stufe steigern)</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                  Dieser Wert steigt dynamisch bei Anwendung im Rollenspiel und gezielten Übungseinheiten im Abenteuer.
                </div>
              </div>
            )}

            {/* FALL C: STORY-MEILENSTEINE */}
            {progressionLogic === 'milestone' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Progression durch Story-Meilensteine & Prüfungen</span>
                  </div>
                  <span className="text-slate-300 text-[11px]">
                    Aktuelle Stufe: {masteryLabel}
                  </span>
                </div>

                {/* Stufenübersicht */}
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {TECHNIQUE_LEVEL_PRESETS.map((lvl, lIdx) => {
                    const isCurrent = (
                      lvl.score === 0 ? currentScore === 0 :
                      lvl.score === 25 ? currentScore > 0 && currentScore <= 35 :
                      lvl.score === 50 ? currentScore > 35 && currentScore <= 62 :
                      lvl.score === 75 ? currentScore > 62 && currentScore <= 85 :
                      currentScore > 85
                    );
                    return (
                      <div
                        key={`ms-${lvl.label}-${lvl.score}`}
                        className={`text-center py-1 rounded text-[10px] font-medium border transition ${
                          isCurrent
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {lvl.score === 0 ? 'Basis (0%)' : `Stufe ${lIdx}: ${lvl.label}`}
                      </div>
                    );
                  })}
                </div>

                {/* Meilenstein Aktionen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly || currentScore >= 95}
                      onClick={handleMilestoneAdvance}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Meilenstein bestätigen (Stufe steigern)</span>
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || currentScore <= 0}
                      onClick={handleMilestoneDemote}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Stufe verringern
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <AutoExpandingTextarea
                    disabled={readOnly}
                    value={entry.milestoneRequirement || entry.milestoneNote || ''}
                    onChange={e => onUpdate({ milestoneRequirement: e.target.value, milestoneNote: e.target.value })}
                    placeholder="Erreichter Story-Meilenstein, Lehrmeisterabschluss oder bestandene Prüfung..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* FALL D: STATISCH (TALENTPUNKTE) */}
            {progressionLogic === 'static' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Statische Talentpunkte & Feste Begabung</span>
                  </div>
                  <span className="text-slate-300 text-[11px]">
                    Investierte Punkte: {currentPoints}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
                  {[
                    { pts: 0, name: 'Anfänger (0%)' },
                    { pts: 1, name: 'Basis (25%)' },
                    { pts: 2, name: 'Fortgeschritten (50%)' },
                    { pts: 3, name: 'Erfahren (75%)' },
                    { pts: 4, name: 'Meisterhaft (95%)' }
                  ].map(p => {
                    const isSelected = currentPoints === p.pts;
                    return (
                      <button
                        key={`stat-pt-${p.pts}`}
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleSetPoints(p.pts)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        } disabled:opacity-50`}
                      >
                        {p.pts} Pkt: {p.name}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                  Unveränderlicher Wert: Diese Fähigkeit stellt eine feste Veranlagung dar und steigt nicht automatisch durch Kämpfe.
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MANUELLE BEHERRSCHUNG & FEINABSTIMMUNG (Schieberegler)       */}
            {/* ============================================================ */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manuelle Beherrschung & Feinabstimmung:</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={readOnly}
                    value={currentScore}
                    onChange={e => handleSetScore(Number(e.target.value) || 0)}
                    className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-amber-300 font-bold text-xs outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                disabled={readOnly}
                value={currentScore}
                onInput={e => handleSetScore(Number((e.target as HTMLInputElement).value) || 0)}
                onChange={e => handleSetScore(Number(e.target.value) || 0)}
                className="w-full accent-amber-500 bg-slate-900 rounded h-2 cursor-pointer disabled:opacity-40"
              />

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-1">
                {TECHNIQUE_LEVEL_PRESETS.map(lvl => {
                  const isMatch = currentScore === lvl.score;
                  return (
                    <button
                      key={`preset-${lvl.label}-${lvl.score}`}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleSetScore(lvl.score)}
                      className={`py-1 px-1.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                        isMatch
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      } disabled:opacity-50`}
                    >
                      {lvl.label} ({lvl.score}%)
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Sektion 3: Beschreibung & Wirkung                             */}
          {/* ============================================================ */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
              Beschreibung & Wirkung
            </label>
            <AutoExpandingTextarea
              disabled={readOnly}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[56px] leading-relaxed disabled:opacity-50"
              placeholder="Wirkungsweise, visuelle Effekte und taktischer Nutzen..."
              value={entry.description || ''}
              onChange={e => onUpdate({ description: e.target.value })}
            />
          </div>

          {/* ============================================================ */}
          {/* Sektion 4: Verknüpfte Grundfähigkeiten                       */}
          {/* ============================================================ */}
          {baseAbilities.length > 1 && (
            <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase mr-1">
                Verknüpfte Grundfähigkeiten:
              </span>
              {baseAbilities.map((ba, baIdx) => {
                const isLinked = entry.baseAbilityIds?.includes(ba.id);
                return (
                  <button
                    key={`ba-link-${ba.id || 'ba'}-${baIdx}`}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onToggleLinkedBaseAbility(ba.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isLinked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                    } disabled:opacity-50`}
                  >
                    {ba.displayName || ba.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* Sektion 5: Transformation-Modifikatoren & Freischaltung     */}
          {/* ============================================================ */}
          {category !== 'Transformationen' && availableTransformations.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTransformModifiers(!showTransformModifiers)}
                  className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wide flex items-center gap-1.5 hover:text-purple-200 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Transformation-Modifikatoren ({entry.transformationModifiers?.length || 0})</span>
                  {showTransformModifiers ? (
                    <ChevronUp className="w-3 h-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  )}
                </button>

                {entry.unlockedByTransformationId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold">
                    Form-Exklusiv
                  </span>
                )}
              </div>

              {showTransformModifiers && (
                <div className="bg-slate-950/70 border border-purple-950/60 rounded-xl p-3 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-1.5">
                    <span>Wie verhält sich diese Technik in Verwandlungen?</span>
                    <span className="text-slate-500 italic">Modifier Layer</span>
                  </div>

                  {/* Freischaltungs-Schalter (nur in Verwandlung verfügbar) */}
                  <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">Nur in Verwandlung verfügbar</span>
                      <span className="text-[9.5px] text-slate-400">Steht in Normalgestalt nicht zur Verfügung</span>
                    </div>
                    <select
                      disabled={readOnly}
                      value={entry.unlockedByTransformationId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        onUpdate({
                          unlockedByTransformationId: val || undefined,
                          isTransformationOnly: !!val
                        });
                      }}
                      className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-purple-500"
                    >
                      <option value="">Immer verfügbar (Normal &amp; Transformiert)</option>
                      {availableTransformations.map(t => (
                        <option key={`unlock-opt-${t.id}`} value={t.id}>
                          Nur in: {t.transformName || t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Liste der Modifikatoren je Transformation */}
                  <div className="space-y-2.5">
                    {availableTransformations.map(trans => {
                      const existingMod = (entry.transformationModifiers || []).find(
                        m => m.transformationId === trans.id
                      );
                      const modType = existingMod?.modifierType || 'unverändert';

                      const handleUpdateModifier = (updates: Partial<TechniqueTransformationModifier>) => {
                        const currentList = [...(entry.transformationModifiers || [])];
                        const idx = currentList.findIndex(m => m.transformationId === trans.id);
                        if (idx >= 0) {
                          currentList[idx] = { ...currentList[idx], ...updates };
                        } else {
                          currentList.push({
                            transformationId: trans.id,
                            transformationName: trans.transformName || trans.name,
                            modifierType: 'weiterentwicklung',
                            ...updates
                          });
                        }
                        onUpdate({ transformationModifiers: currentList });
                      };

                      const handleRemoveModifier = () => {
                        const filtered = (entry.transformationModifiers || []).filter(
                          m => m.transformationId !== trans.id
                        );
                        onUpdate({ transformationModifiers: filtered });
                      };

                      return (
                        <div
                          key={`trans-mod-${trans.id}`}
                          className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <i className="fa-solid fa-bolt text-purple-400 text-[10px]"></i>
                              {trans.transformName || trans.name}
                            </span>
                            <select
                              disabled={readOnly}
                              value={modType}
                              onChange={e => {
                                const val = e.target.value as TransformationModifierType;
                                if (val === 'unverändert') {
                                  handleRemoveModifier();
                                } else {
                                  handleUpdateModifier({
                                    modifierType: val,
                                    disabled: val === 'deaktiviert'
                                  });
                                }
                              }}
                              className="bg-slate-950 border border-slate-700 text-xs rounded px-2 py-0.5 text-slate-300 outline-none focus:border-purple-500 font-semibold"
                            >
                              <option value="unverändert">Unverändert (Basis beibehalten)</option>
                              <option value="weiterentwicklung">Weiterentwickeln (Evolve)</option>
                              <option value="verstärkung">Verstärken (Enhance)</option>
                              <option value="veränderung">Verändern (Modify)</option>
                              <option value="ersetzung">Ersetzen (Replace)</option>
                              <option value="deaktiviert">Deaktivieren (Sperren)</option>
                            </select>
                          </div>

                          {modType !== 'unverändert' && modType !== 'deaktiviert' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/50">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                  Modifizierter Name
                                </label>
                                <input
                                  type="text"
                                  disabled={readOnly}
                                  placeholder={entry.name || 'z.B. Elementarkontrolle'}
                                  value={existingMod?.overrideName || ''}
                                  onChange={e => handleUpdateModifier({ overrideName: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-750 rounded p-1.5 text-xs text-white outline-none focus:border-purple-500 font-bold"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                  Modifizierte Kosten
                                </label>
                                <input
                                  type="text"
                                  disabled={readOnly}
                                  placeholder={entry.cost || 'z.B. 25 MP'}
                                  value={existingMod?.overrideCost || ''}
                                  onChange={e => handleUpdateModifier({ overrideCost: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-750 rounded p-1.5 text-xs text-white outline-none focus:border-purple-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                  Modifizierte Beschreibung
                                </label>
                                <AutoExpandingTextarea
                                  disabled={readOnly}
                                  placeholder="Beschreibung der Technik in dieser Verwandlungsform..."
                                  value={existingMod?.overrideDescription || ''}
                                  onChange={e => handleUpdateModifier({ overrideDescription: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-750 rounded p-1.5 text-xs text-white outline-none focus:border-purple-500 min-h-[44px]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
