// -*- coding: utf-8 -*-
import React from 'react';
import { CharacterRank, DevelopmentProfileType, ProgressionConfig } from '../types';
import { STANDARD_RANKS, ProgressionService } from '../services/progressionService';
import { Activity, Award, Layers, TrendingUp, Shield, Info } from 'lucide-react';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export interface IndividualProgressionValues {
  rank?: CharacterRank | string;
  level?: number;
  xp?: number;
  experience?: number;
  experiencePoints?: number;
  experienceText?: string;
  potential?: number | string;
  potentialCap?: number;
  enforcePotentialCap?: boolean;
  developmentProfile?: DevelopmentProfileType;
  rankUpRequirements?: string;
  levelsPerRank?: number;
  resetLevelOnRankUp?: boolean;
  autoRankUp?: boolean;
  minXpForRankUp?: number;
  requiresMaxLevelForRankUp?: boolean;
  developmentRate?: {
    epGainMultiplier?: number;
    epRequirementMultiplier?: number;
    attributeGrowthMultiplier?: number;
  };
  attributeGrowth?: {
    baseGrowthPerLevel?: number;
    minAttributeValue?: number;
    maxAttributeValue?: number;
    enforcePotentialCap?: boolean;
    potentialCap?: number;
  };
  epRequirement?: {
    requirementMode?: any;
    baseRequirement?: number;
    levelGrowth?: number;
    rankGrowth?: number;
    maxRequirement?: number;
  };
}

interface IndividualProgressionEditorProps {
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static' | string;
  worldProgressionConfig?: ProgressionConfig;
  values: IndividualProgressionValues;
  onChange: (updated: Partial<IndividualProgressionValues>) => void;
  title?: string;
  subtitle?: string;
}

export const IndividualProgressionEditor: React.FC<IndividualProgressionEditorProps> = ({
  progressionLogic = 'ep',
  worldProgressionConfig,
  values,
  onChange,
  title = 'Entwicklung dieses Charakters',
  subtitle = 'Lege fest, wie sich dieser Charakter persönlich entwickelt. Die grundlegenden Regeln der Welt bleiben dabei unverändert.'
}) => {
  const isEpLogic = progressionLogic === 'ep';

  // Current state values with clean fallbacks
  const currentRank = values.rank || 'F';
  const currentLevel = values.level !== undefined ? values.level : 1;
  const currentXp =
    values.experiencePoints !== undefined
      ? values.experiencePoints
      : typeof values.experience === 'number'
      ? values.experience
      : values.xp ?? 0;

  // EP Multiplier
  const epGainMult = values.developmentRate?.epGainMultiplier ?? 1.0;
  const attrGrowthMult = values.developmentRate?.attributeGrowthMultiplier ?? 1.0;

  // Calculated requirement from global rule
  const calculatedXpRequirement = ProgressionService.calculateXpRequirement(
    currentLevel,
    currentRank,
    worldProgressionConfig
  );

  const currentXpText = values.experienceText || `${currentXp} / ${calculatedXpRequirement || 100} EP`;

  // Rank & Level settings
  const currentLevelsPerRank = values.levelsPerRank ?? 10;
  const currentResetLevelOnRankUp = values.resetLevelOnRankUp ?? true;
  const currentAutoRankUp = values.autoRankUp ?? true;
  const currentMinXpForRankUp = values.minXpForRankUp ?? 0;
  const currentRequiresMaxLevel = values.requiresMaxLevelForRankUp ?? true;
  const currentRankUpReq = values.rankUpRequirements || '';

  // Attribute Growth & Potential
  const baseAttrGrowth = values.attributeGrowth?.baseGrowthPerLevel ?? 2;
  const minAttrVal = values.attributeGrowth?.minAttributeValue ?? 0;
  const maxAttrVal = values.attributeGrowth?.maxAttributeValue ?? 1000;

  const enforcePotCap =
    values.enforcePotentialCap ?? values.attributeGrowth?.enforcePotentialCap ?? true;
  const potCapVal =
    values.potentialCap ??
    values.attributeGrowth?.potentialCap ??
    (typeof values.potential === 'number' ? values.potential : 1000);
  const potentialText =
    typeof values.potential === 'string'
      ? values.potential
      : values.potential !== undefined
      ? String(values.potential)
      : 'Rang A (Hoch)';

  // Synchronized EP update
  const handleXpChange = (newXpVal: number) => {
    const val = Math.max(0, newXpVal);
    onChange({
      experiencePoints: val,
      experience: val,
      xp: val,
      experienceText: `${val} / ${calculatedXpRequirement || 100} EP`
    });
  };

  // Synchronized EP Gain Multiplier update
  const handleEpGainMultChange = (val: number) => {
    const safeVal = Math.max(0.1, val);
    onChange({
      developmentRate: {
        ...values.developmentRate,
        epGainMultiplier: safeVal,
        attributeGrowthMultiplier: attrGrowthMult
      }
    });
  };

  // Synchronized Attribute Growth Multiplier update
  const handleAttrGrowthMultChange = (val: number) => {
    const safeVal = Math.max(0.1, val);
    onChange({
      developmentRate: {
        ...values.developmentRate,
        epGainMultiplier: epGainMult,
        attributeGrowthMultiplier: safeVal
      }
    });
  };

  // Synchronized Potential Cap & Enforcement
  const handlePotentialCapChange = (val: number) => {
    const safeCap = Math.max(1, val);
    onChange({
      potentialCap: safeCap,
      potential: typeof values.potential === 'string' ? values.potential : safeCap,
      attributeGrowth: {
        baseGrowthPerLevel: baseAttrGrowth,
        minAttributeValue: minAttrVal,
        maxAttributeValue: maxAttrVal,
        enforcePotentialCap: enforcePotCap,
        potentialCap: safeCap
      }
    });
  };

  const handlePotentialEnforcementChange = (enforce: boolean) => {
    onChange({
      enforcePotentialCap: enforce,
      attributeGrowth: {
        baseGrowthPerLevel: baseAttrGrowth,
        minAttributeValue: minAttrVal,
        maxAttributeValue: maxAttrVal,
        enforcePotentialCap: enforce,
        potentialCap: potCapVal
      }
    });
  };

  const getLogicLabel = () => {
    switch (progressionLogic) {
      case 'training':
        return 'Training & Übung';
      case 'milestone':
        return 'Story-Meilensteine';
      case 'static':
        return 'Statische Werte';
      case 'ep':
      default:
        return 'EP-basiert';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {title}
            </h4>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 font-semibold">
              Globale Regel: {getLogicLabel()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* 1. Aktueller Entwicklungsstand (Nur bei EP-basierten Regeln) */}
      {isEpLogic && (
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                Aktueller Entwicklungsstand
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gegenwärtiger Stand von Rang, Stufe und gesammelter Erfahrung dieses Charakters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aktueller Rang
              </label>
              <select
                value={currentRank}
                onChange={e => onChange({ rank: e.target.value as CharacterRank })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
              >
                {STANDARD_RANKS.map(r => (
                  <option key={`rank-opt-${r}`} value={r}>
                    Rang {r}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Gegenwärtige Rangstufe
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aktuelles Level
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={currentLevel}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onChange({ level: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Aktueller Level-Stand
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aktuelle Erfahrungspunkte (EP)
              </label>
              <input
                type="number"
                min={0}
                value={currentXp}
                onChange={e => handleXpChange(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Einziges Eingabefeld für gesammelte EP
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Berechneter EP-Bedarf
              </label>
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-mono font-bold shadow-inner flex items-center justify-between">
                <span>{currentXp} / {calculatedXpRequirement || 100} EP</span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">Globale Regel</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Bedarf für nächste Stufe
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 max-w-md">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              EP-Fortschritts-Text (HUD / Profil)
            </label>
            <input
              type="text"
              value={currentXpText}
              onChange={e => onChange({ experienceText: e.target.value })}
              placeholder="z.B. 340 / 500 EP"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Sichtbare Textanzeige im Spieler-HUD
            </span>
          </div>
        </div>
      )}

      {/* 2. Nicht-EP-Logik Hinweis */}
      {!isEpLogic && (
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400/80 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Aktive Progressionslogik: {getLogicLabel()}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Für diese Spielregel sind Level- und EP-Systeme inaktiv. Die Werte und Talente entwickeln sich über Ausführung, Training oder Story-Fortschritte.
            </p>
          </div>
        </div>
      )}

      {/* 3. Persönliche Entwicklung */}
      <div className="space-y-5">
        {/* EP-Gewinn (NUR bei EP-Logik) */}
        {isEpLogic && (
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  EP-Gewinn
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bestimmt, wie viele EP dieser Charakter aus einer normalen EP-Quelle erhält.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                EP-Gewinn-Multiplikator
              </label>

              {/* Multiplikator Schnellwahl-Buttons */}
              <div className="flex flex-wrap gap-2">
                {[0.5, 1.0, 1.25, 1.5, 2.0].map(mult => {
                  const isMatch = Math.abs(epGainMult - mult) < 0.01;
                  return (
                    <button
                      key={`ep-gain-mult-${mult}`}
                      type="button"
                      onClick={() => handleEpGainMultChange(mult)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {mult.toFixed(2)}×
                    </button>
                  );
                })}
              </div>

              <div className="max-w-xs">
                <input
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={10.0}
                  value={epGainMult}
                  onChange={e =>
                    handleEpGainMultChange(parseFloat(e.target.value) || 1.0)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Persönlicher Entwicklungsfaktor auf erhaltene EP (z. B. 1.00× = Standard)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Werte-/Attributsteigerung */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                Werte-/Attributsteigerung
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Legt fest, wie stark Attribute bei Steigerungen und Aufstiegen wachsen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wertsteigerung pro Level
              </label>
              <input
                type="number"
                min={0}
                value={baseAttrGrowth}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: val,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                placeholder="2"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Basis-Attributzuwachs
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wachstums-Multiplikator
              </label>
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={attrGrowthMult}
                onChange={e => handleAttrGrowthMultChange(parseFloat(e.target.value) || 1.0)}
                placeholder="1.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Multiplikator auf Attributzuwächse (z.B. 1.00×)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimaler Wert
              </label>
              <input
                type="number"
                min={0}
                value={minAttrVal}
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: val,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Untergrenze für Attribute
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maximaler Wert
              </label>
              <input
                type="number"
                min={1}
                value={maxAttrVal}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1000);
                  onChange({
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: val,
                      enforcePotentialCap: enforcePotCap,
                      potentialCap: potCapVal
                    }
                  });
                }}
                placeholder="1000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Absolute Obergrenze
              </span>
            </div>
          </div>
        </div>

        {/* Potenzial (Konsolidierter Bereich) */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                Potenzial
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Begrenzt das maximale Wachstum dieses Charakters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Potenzialwert / Potenzialgrenze
              </label>
              <input
                type="number"
                min={1}
                value={potCapVal}
                onChange={e => handlePotentialCapChange(parseInt(e.target.value) || 1000)}
                placeholder="1000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Numerische Höchstgrenze für Werte
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Potenzial begrenzt Werteentwicklung
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePotentialEnforcementChange(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    enforcePotCap
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => handlePotentialEnforcementChange(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    !enforcePotCap
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nein
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Kappt Zuwachs am Potenzialwert
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Potenzial-Einstufung / Beschreibung
              </label>
              <input
                type="text"
                value={potentialText}
                onChange={e => onChange({ potential: e.target.value })}
                placeholder="z.B. Rang A (Hoch), Rang SSS (Grenzenlos)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Klassifizierung im Profil
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Rangentwicklung (Nur bei EP-basierten Regeln) */}
      {isEpLogic && (
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                Rangentwicklung
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Individuelle Ausnahmen und Aufstiegsbedingungen für diesen Charakter.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Rangfolge Visualisierung & Schnellauswahl */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rangstufe wählen
              </label>
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {STANDARD_RANKS.map((r, idx) => {
                  const isCharRank = String(currentRank).toUpperCase() === r;
                  return (
                    <React.Fragment key={`char-rank-step-${r}`}>
                      <button
                        type="button"
                        onClick={() => onChange({ rank: r })}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          isCharRank
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold scale-105'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-400 hover:border-slate-600'
                        }`}
                        title={`Rang ${r} auswählen`}
                      >
                        {r}
                      </button>
                      {idx < STANDARD_RANKS.length - 1 && (
                        <span className="text-slate-500 text-xs font-bold select-none">
                          →
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Level pro Rang
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={currentLevelsPerRank}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 10);
                    onChange({ levelsPerRank: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Stufen innerhalb einer Rangstufe
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Automatischer Rangaufstieg
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ autoRankUp: true })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      currentAutoRankUp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ autoRankUp: false })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      !currentAutoRankUp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nein
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Automatisch bei Kriterienerfüllung
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mindest-EP für Aufstieg
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentMinXpForRankUp}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    onChange({ minXpForRankUp: val });
                  }}
                  placeholder="0 = Deaktiviert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Individueller Schwellenwert (0 = aus)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Level zurücksetzen bei Aufstieg
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ resetLevelOnRankUp: true })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      currentResetLevelOnRankUp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ resetLevelOnRankUp: false })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      !currentResetLevelOnRankUp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nein
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  z. B. F10 → E1 (Ja) oder E10 (Nein)
                </span>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={currentRequiresMaxLevel}
                  onChange={e => onChange({ requiresMaxLevelForRankUp: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Voraussetzung: Maximales Level des aktuellen Rangs erforderlich ({currentLevelsPerRank})
                  </span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block">
                    Ein Rangaufstieg findet erst nach Erreichen der höchsten Levelstufe des aktuellen Rangs statt.
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Individuelle Rangaufstiegs- & Prüfungsnotizen
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 transition shadow-inner"
                placeholder="z.B. Erreichen von Level 10 + Bestehen der Abenteurer-Prüfung in der Hauptstadt..."
                value={currentRankUpReq}
                onChange={e => onChange({ rankUpRequirements: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualProgressionEditor;
