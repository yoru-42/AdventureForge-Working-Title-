// -*- coding: utf-8 -*-
import React from 'react';
import {
  CharacterRank,
  DevelopmentProfileType,
  EpRequirementMode
} from '../types';
import {
  STANDARD_RANKS,
  DEFAULT_DEVELOPMENT_PROFILES
} from '../services/progressionService';
import {
  Activity,
  Award,
  Layers,
  Sliders,
  TrendingUp,
  Target,
  Shield,
  Info
} from 'lucide-react';
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
    requirementMode?: EpRequirementMode;
    baseRequirement?: number;
    levelGrowth?: number;
    rankGrowth?: number;
    maxRequirement?: number;
  };
}

interface IndividualProgressionEditorProps {
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static' | string;
  values: IndividualProgressionValues;
  onChange: (updated: Partial<IndividualProgressionValues>) => void;
  title?: string;
  subtitle?: string;
}

export const IndividualProgressionEditor: React.FC<IndividualProgressionEditorProps> = ({
  progressionLogic = 'ep',
  values,
  onChange,
  title = 'Individuelle Progression & Entwicklung',
  subtitle = 'Definiert die persönlichen Steigerungsraten, Entwicklungsgeschwindigkeiten und Potenzialgrenzen.'
}) => {
  const isEpLogic = progressionLogic === 'ep';

  // Resolved values with fallbacks
  const currentRank = values.rank || 'F';
  const currentLevel = values.level !== undefined ? values.level : 1;
  const currentXp = values.experiencePoints !== undefined 
    ? values.experiencePoints 
    : (typeof values.experience === 'number' ? values.experience : (values.xp ?? 0));
  const currentXpText = values.experienceText || `${currentXp} / 100 EP`;
  const currentLevelsPerRank = values.levelsPerRank ?? 10;
  const currentResetLevelOnRankUp = values.resetLevelOnRankUp ?? true;
  const currentAutoRankUp = values.autoRankUp ?? true;
  const currentMinXpForRankUp = values.minXpForRankUp ?? 0;
  const currentRequiresMaxLevel = values.requiresMaxLevelForRankUp ?? true;
  const currentRankUpReq = values.rankUpRequirements || '';

  const currentProfile = values.developmentProfile || 'normal';
  const defaultProfileData = DEFAULT_DEVELOPMENT_PROFILES[currentProfile] || DEFAULT_DEVELOPMENT_PROFILES['normal'];

  const epGainMult = values.developmentRate?.epGainMultiplier ?? defaultProfileData.epGainMultiplier ?? 1.0;
  const epReqMult = values.developmentRate?.epRequirementMultiplier ?? defaultProfileData.epRequirementMultiplier ?? 1.0;
  const attrGrowthMult = values.developmentRate?.attributeGrowthMultiplier ?? defaultProfileData.attributeGrowthMultiplier ?? 1.0;

  const reqMode: EpRequirementMode = values.epRequirement?.requirementMode || 'level_growth';
  const baseReq = values.epRequirement?.baseRequirement ?? 100;
  const levelGrowth = values.epRequirement?.levelGrowth ?? 20;
  const rankGrowth = values.epRequirement?.rankGrowth ?? 100;
  const maxReq = values.epRequirement?.maxRequirement ?? 50000;

  const baseAttrGrowth = values.attributeGrowth?.baseGrowthPerLevel ?? 2;
  const minAttrVal = values.attributeGrowth?.minAttributeValue ?? 0;
  const maxAttrVal = values.attributeGrowth?.maxAttributeValue ?? 1000;
  const enforcePotCap = values.enforcePotentialCap ?? values.attributeGrowth?.enforcePotentialCap ?? true;
  const potCapVal = values.potentialCap ?? values.attributeGrowth?.potentialCap ?? (typeof values.potential === 'number' ? values.potential : 1000);
  const potentialText = typeof values.potential === 'string' ? values.potential : (values.potential !== undefined ? String(values.potential) : 'Rang A (Hoch)');

  const handleProfileSelect = (pId: DevelopmentProfileType) => {
    const prof = DEFAULT_DEVELOPMENT_PROFILES[pId] || DEFAULT_DEVELOPMENT_PROFILES['normal'];
    onChange({
      developmentProfile: pId,
      developmentRate: {
        epGainMultiplier: prof.epGainMultiplier,
        epRequirementMultiplier: prof.epRequirementMultiplier,
        attributeGrowthMultiplier: prof.attributeGrowthMultiplier
      }
    });
  };

  const handleEpGainChange = (val: number) => {
    onChange({
      developmentProfile: 'custom',
      developmentRate: {
        epGainMultiplier: val,
        epRequirementMultiplier: epReqMult,
        attributeGrowthMultiplier: attrGrowthMult
      }
    });
  };

  const handleEpReqMultChange = (val: number) => {
    onChange({
      developmentProfile: 'custom',
      developmentRate: {
        epGainMultiplier: epGainMult,
        epRequirementMultiplier: val,
        attributeGrowthMultiplier: attrGrowthMult
      }
    });
  };

  const handleAttrGrowthMultChange = (val: number) => {
    onChange({
      developmentProfile: 'custom',
      developmentRate: {
        epGainMultiplier: epGainMult,
        epRequirementMultiplier: epReqMult,
        attributeGrowthMultiplier: val
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

      {/* 1. EP-basierte Bereiche: Level-System, Rang-System, EP-Anforderung (NUR bei EP-Logik) */}
      {isEpLogic && (
        <div className="space-y-5">
          {/* Level-System (Individuell) */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Individuelles Level-System
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Persönliche Stufen- und Levelstruktur dieses Charakters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
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
                  Stufen bis zum nächsten Rangaufstieg
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Level bei Rangaufstieg zurücksetzen
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ resetLevelOnRankUp: true })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      currentResetLevelOnRankUp
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nein
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  z. B. F10 zu E1 (Ja) oder E10 (Nein)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Erfahrungspunkte (EP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentXp}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    onChange({
                      experiencePoints: val,
                      experience: val,
                      xp: val
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Aktuell gesammelte Erfahrung
                </span>
              </div>
            </div>
          </div>

          {/* Rang-System (Individuell) */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Individuelles Rang-System
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rangstufe und Aufstiegsbedingungen dieses Charakters.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Rangfolge Visualisierung */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Rangfolge
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <option key={`char-rank-opt-${r}`} value={r}>
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
                    Rangaufstieg automatisch
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ autoRankUp: true })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        currentAutoRankUp
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Automatisch bei Erfüllung der Kriterien
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mindest-EP für Rangaufstieg
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentMinXpForRankUp}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      onChange({ minXpForRankUp: val });
                    }}
                    placeholder="0 für keine Mindest-EP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Optionale Zusatzbedingung (0 = deaktiviert)
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
                      Ein Rangaufstieg kann erst stattfinden, wenn das maximale Level der aktuellen Rangstufe erreicht wurde.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Voraussetzungen für den nächsten Rang / Prüfungsnotizen
                </label>
                <AutoExpandingTextarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 transition shadow-inner"
                  placeholder="z.B. Erreichen von Level 10 + Bestehen der Abenteurer-Prüfung in der Hauptstadt oder Bewältigung einer Rang-B-Quest..."
                  value={currentRankUpReq}
                  onChange={e => onChange({ rankUpRequirements: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* EP-Anforderung (Individuell) */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Individuelle EP-Anforderung
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Legt fest, wie viele EP dieser Charakter für den nächsten Levelaufstieg benötigt.
              </p>
            </div>

            {/* EP-Anforderungsmodell */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                EP-Anforderungsmodell
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'fixed' as EpRequirementMode,
                    title: 'Feste EP-Anforderung',
                    desc: 'Konstanter EP-Bedarf für jedes Level.'
                  },
                  {
                    id: 'level_growth' as EpRequirementMode,
                    title: 'EP steigt mit dem Level',
                    desc: 'EP-Bedarf wächst linear mit jedem neuen Level.'
                  },
                  {
                    id: 'level_and_rank_growth' as EpRequirementMode,
                    title: 'EP steigt mit Level und Rang',
                    desc: 'EP-Bedarf wächst mit Level und Rangstufe.'
                  }
                ].map(model => {
                  const isSelected = reqMode === model.id;
                  return (
                    <button
                      key={`indiv-ep-mode-${model.id}`}
                      type="button"
                      onClick={() =>
                        onChange({
                          epRequirement: {
                            requirementMode: model.id,
                            baseRequirement: baseReq,
                            levelGrowth,
                            rankGrowth,
                            maxRequirement: maxReq
                          }
                        })
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{model.title}</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {model.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Felder für EP-Bedarf */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {reqMode === 'fixed' ? 'EP für Levelaufstieg' : 'Basis-EP'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={baseReq}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 100);
                    onChange({
                      epRequirement: {
                        requirementMode: reqMode,
                        baseRequirement: val,
                        levelGrowth,
                        rankGrowth,
                        maxRequirement: maxReq
                      }
                    });
                  }}
                  placeholder="100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {reqMode === 'fixed' ? 'Fester Bedarf pro Stufe' : 'Ausgangswert auf Stufe 1'}
                </span>
              </div>

              {reqMode !== 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EP-Zuwachs pro Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={levelGrowth}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      onChange({
                        epRequirement: {
                          requirementMode: reqMode,
                          baseRequirement: baseReq,
                          levelGrowth: val,
                          rankGrowth,
                          maxRequirement: maxReq
                        }
                      });
                    }}
                    placeholder="20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Zusätzlicher Bedarf pro erreichtem Level
                  </span>
                </div>
              )}

              {reqMode === 'level_and_rank_growth' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EP-Zuwachs pro Rang
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rankGrowth}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      onChange({
                        epRequirement: {
                          requirementMode: reqMode,
                          baseRequirement: baseReq,
                          levelGrowth,
                          rankGrowth: val,
                          maxRequirement: maxReq
                        }
                      });
                    }}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Zusätzlicher Bedarf pro höherer Rangstufe
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maximale EP-Anforderung
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxReq}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 50000);
                    onChange({
                      epRequirement: {
                        requirementMode: reqMode,
                        baseRequirement: baseReq,
                        levelGrowth,
                        rankGrowth,
                        maxRequirement: val
                      }
                    });
                  }}
                  placeholder="50000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Obergrenze für den EP-Bedarf
                </span>
              </div>
            </div>

            {/* HUD / Anzeige Freitext */}
            <div className="pt-2 border-t border-slate-800/60 max-w-md">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                EP-Fortschrittsanzeige (HUD / Profiltext)
              </label>
              <input
                type="text"
                value={currentXpText}
                onChange={e => onChange({ experienceText: e.target.value })}
                placeholder="0 / 100 EP"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Individueller Text im Profil/HUD (z.B. {currentXp} / {baseReq} EP)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Nicht-EP-Logik Hinweis falls aktiv */}
      {!isEpLogic && (
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400/80 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Aktive Progressionslogik: {getLogicLabel()}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Für diese Weltregel werden Level- und Rangsysteme übersprungen. Die Werte und Fähigkeiten dieses Charakters entwickeln sich direkt über die unten konfigurierten Multiplikatoren für EP-Gewinn/Training, Attributwachstum und Potenzialbegrenzungen.
            </p>
          </div>
        </div>
      )}

      {/* 3. EP-Gewinn & Entwicklungsprofil (Individuell) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
              EP-Gewinn
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Legt fest, wie schnell dieser Charakter Erfahrung bzw. Trainingsfortschritt sammelt.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Entwicklungsprofil auswählen
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'verySlow' as DevelopmentProfileType, label: 'Sehr langsam' },
              { id: 'slow' as DevelopmentProfileType, label: 'Langsam' },
              { id: 'normal' as DevelopmentProfileType, label: 'Normal' },
              { id: 'fast' as DevelopmentProfileType, label: 'Schnell' },
              { id: 'veryFast' as DevelopmentProfileType, label: 'Sehr schnell' },
              { id: 'custom' as DevelopmentProfileType, label: 'Benutzerdefiniert' }
            ].map(p => {
              const isSelected = currentProfile === p.id;
              return (
                <button
                  key={`indiv-profile-${p.id}`}
                  type="button"
                  onClick={() => handleProfileSelect(p.id)}
                  className={`p-2.5 rounded-lg border text-center transition-all text-xs font-bold cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-300">
            EP-Gewinn-Multiplikator
          </label>
          
          {/* Quick-Preset Buttons for Multipliers */}
          <div className="flex flex-wrap gap-2 mb-2">
            {[0.25, 0.5, 1.0, 1.5, 2.0].map(multiplier => {
              const isMatch = Math.abs(epGainMult - multiplier) < 0.01;
              return (
                <button
                  key={`ep-gain-mult-btn-${multiplier}`}
                  type="button"
                  onClick={() => handleEpGainChange(multiplier)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isMatch
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {multiplier.toFixed(2)}×
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
              onChange={e => {
                const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                handleEpGainChange(val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Faktor auf erhaltene Erfahrungspunkte / Zuwachs
            </span>
          </div>
        </div>
      </div>

      {/* 4. Entwicklungs-Tempo (Individuell) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
              Entwicklungs-Tempo
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Das Entwicklungs-Tempo bestimmt unabhängig von der weltweiten Grundregel, wie dynamisch sich dieser spezifische Charakter entwickelt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              EP-Gewinn
            </label>
            <input
              type="number"
              step="0.05"
              min={0.1}
              max={10.0}
              value={epGainMult}
              onChange={e => {
                const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                handleEpGainChange(val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Multiplikator für erhaltene EP
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              EP-Anforderung
            </label>
            <input
              type="number"
              step="0.05"
              min={0.1}
              max={10.0}
              value={epReqMult}
              onChange={e => {
                const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                handleEpReqMultChange(val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Multiplikator für benötigte EP
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Werte-/Attributsteigerung
            </label>
            <input
              type="number"
              step="0.05"
              min={0.1}
              max={10.0}
              value={attrGrowthMult}
              onChange={e => {
                const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                handleAttrGrowthMultChange(val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Multiplikator für Wertzuwächse
            </span>
          </div>
        </div>
      </div>

      {/* 5. Werte-/Attributsteigerung (Individuell) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
              Werte-/Attributsteigerung
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Legt fest, was bei einem erfolgreichen Levelaufstieg bzw. Trainingsfortschritt passiert.
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
              Basis-Attributzuwachs pro Stufe
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
              Absolute Obergrenze für Attribute
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Potenzialgrenze berücksichtigen
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    enforcePotentialCap: true,
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: true,
                      potentialCap: potCapVal
                    }
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  enforcePotCap
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    enforcePotentialCap: false,
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: false,
                      potentialCap: potCapVal
                    }
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  !enforcePotCap
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Nein
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Kappt Steigerung am individuellen Potenzial
            </span>
          </div>
        </div>
      </div>

      {/* 6. Potenzial (Individuell) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
              Potenzial
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Das Potenzial begrenzt, wie weit sich dieser Charakter innerhalb des Systems entwickeln kann.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Potenzial berücksichtigen
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    enforcePotentialCap: true,
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: true,
                      potentialCap: potCapVal
                    }
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  enforcePotCap
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    enforcePotentialCap: false,
                    attributeGrowth: {
                      baseGrowthPerLevel: baseAttrGrowth,
                      minAttributeValue: minAttrVal,
                      maxAttributeValue: maxAttrVal,
                      enforcePotentialCap: false,
                      potentialCap: potCapVal
                    }
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  !enforcePotCap
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Nein
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Aktive Begrenzung durch Potenzial
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Potenzialgrenze
            </label>
            <input
              type="number"
              min={1}
              value={potCapVal}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1000);
                onChange({
                  potentialCap: val,
                  potential: typeof values.potential === 'string' ? values.potential : val,
                  attributeGrowth: {
                    baseGrowthPerLevel: baseAttrGrowth,
                    minAttributeValue: minAttrVal,
                    maxAttributeValue: maxAttrVal,
                    enforcePotentialCap: enforcePotCap,
                    potentialCap: val
                  }
                });
              }}
              placeholder="1000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Individuelle Potenzialobergrenze
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
              placeholder="z.B. Rang SSS (Grenzenlos), Rang A (Hoch)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Textuelle Klassifizierung des Talents
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualProgressionEditor;
