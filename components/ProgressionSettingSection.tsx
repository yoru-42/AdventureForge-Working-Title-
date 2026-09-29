// -*- coding: utf-8 -*-
import React from 'react';
import {
  WorldSetting,
  ProgressionConfig,
  DevelopmentProfileType,
  EpRequirementMode,
  CharacterRank
} from '../types';
import {
  ProgressionService,
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
  Info,
  Check
} from 'lucide-react';

interface ProgressionSettingSectionProps {
  world: WorldSetting;
  onChange: (updatedWorld: WorldSetting) => void;
}

export const ProgressionSettingSection: React.FC<ProgressionSettingSectionProps> = ({
  world,
  onChange
}) => {
  // Sicherstellen, dass progressionConfig existiert
  const activeLogic = world.techniqueProgressionLogic || 'ep';
  const config: ProgressionConfig =
    world.progressionConfig || ProgressionService.createDefaultProgressionConfig();

  const updateConfig = (updater: (prev: ProgressionConfig) => ProgressionConfig) => {
    const newConfig = updater(JSON.parse(JSON.stringify(config)));
    onChange({
      ...world,
      progressionConfig: newConfig
    });
  };

  const handleLogicChange = (logic: 'ep' | 'training' | 'milestone' | 'static') => {
    const updated: WorldSetting = {
      ...world,
      techniqueProgressionLogic: logic
    };

    if (logic === 'ep') {
      if (!updated.progressionConfig) {
        updated.progressionConfig = ProgressionService.createDefaultProgressionConfig();
      }
    }

    onChange(updated);
  };

  const handleProfileSelect = (profileType: DevelopmentProfileType) => {
    updateConfig(prev => {
      const profile =
        prev.developmentProfiles?.[profileType] || DEFAULT_DEVELOPMENT_PROFILES[profileType];
      return {
        ...prev,
        activeProfile: profileType,
        developmentRate: {
          epGainMultiplier: profile.epGainMultiplier,
          epRequirementMultiplier: profile.epRequirementMultiplier,
          attributeGrowthMultiplier: profile.attributeGrowthMultiplier
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Progressionslogik Auswahl */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wide">
              Schritt 2 von 9: Logik für die Werte-Steigerung & Progression
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Wähle die globale Progressionsregel für die Spielwelt. Die Auswahl bestimmt, nach welchem Prinzip Werte, Fertigkeiten und Techniken wachsen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            {
              id: 'ep' as const,
              label: 'EP-basiert',
              desc: 'Erfahrungspunkte werden durch Aktionen und Herausforderungen erworben.'
            },
            {
              id: 'training' as const,
              label: 'Training & Übung',
              desc: 'Werte steigen durch gezielte Anwendung und praktische Übungen.'
            },
            {
              id: 'milestone' as const,
              label: 'Story-Meilensteine',
              desc: 'Fortschritt erfolgt durch das Erreichen bedeutender Meilensteine.'
            },
            {
              id: 'static' as const,
              label: 'Statisch',
              desc: 'Feste Werte ohne automatische Steigerung.'
            }
          ].map(item => {
            const isActive = activeLogic === item.id;
            return (
              <button
                key={`prog-logic-${item.id}`}
                type="button"
                onClick={() => handleLogicChange(item.id)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Aktiv</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide block">
                    {item.label}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Nicht-EP-Logiken: Hinweis */}
      {activeLogic !== 'ep' && (
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">
              Einstellungsmenü folgt in einem späteren Schritt
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Für die gewählte Progressionslogik ist die Grundregel für die Spielwelt aktiv. Detaillierte Konfigurationsoptionen für diesen Modus werden in einem separaten Schritt bereitgestellt.
            </p>
          </div>
        </div>
      )}

      {/* 3. EP-basierte Progression: Detaileinstellungen */}
      {activeLogic === 'ep' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Level-System */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                    Level-System
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Level gehören ausschließlich zur EP-basierten Progression.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig(prev => ({
                      ...prev,
                      levelSystem: {
                        ...prev.levelSystem,
                        enabled: !prev.levelSystem.enabled
                      }
                    }))
                  }
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    config.levelSystem.enabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}
                >
                  {config.levelSystem.enabled ? 'Ein' : 'Aus'}
                </button>
              </div>
            </div>

            {config.levelSystem.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start-Level
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.levelSystem.startLevel ?? 1}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      updateConfig(prev => ({
                        ...prev,
                        levelSystem: { ...prev.levelSystem, startLevel: val }
                      }));
                    }}
                    placeholder="1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Anfangsstufe neuer Charaktere
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Maximales Level
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.levelSystem.maxLevel ?? 100}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value) || 100);
                      updateConfig(prev => ({
                        ...prev,
                        levelSystem: { ...prev.levelSystem, maxLevel: val }
                      }));
                    }}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Globale Sicherheits-Obergrenze
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Level pro Rang
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.levelSystem.levelsPerRank ?? 10}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value) || 10);
                      updateConfig(prev => ({
                        ...prev,
                        levelSystem: { ...prev.levelSystem, levelsPerRank: val }
                      }));
                    }}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Stufen innerhalb einer Rangstufe
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Level bei Rangaufstieg zurücksetzen
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(prev => ({
                          ...prev,
                          levelSystem: { ...prev.levelSystem, resetLevelOnRankUp: true }
                        }))
                      }
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        config.levelSystem.resetLevelOnRankUp
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(prev => ({
                          ...prev,
                          levelSystem: { ...prev.levelSystem, resetLevelOnRankUp: false }
                        }))
                      }
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        !config.levelSystem.resetLevelOnRankUp
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
              </div>
            )}
          </div>

          {/* Rang-System */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                    Rang-System
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Level und Rang sind ausschließlich Bestandteil der EP-basierten Progressionslogik.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig(prev => ({
                      ...prev,
                      rankSystem: {
                        ...prev.rankSystem,
                        enabled: !prev.rankSystem.enabled
                      }
                    }))
                  }
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    config.rankSystem.enabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}
                >
                  {config.rankSystem.enabled ? 'Ein' : 'Aus'}
                </button>
              </div>
            </div>

            {config.rankSystem.enabled && (
              <div className="space-y-4 pt-1">
                {/* Visualisierung Rangfolge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rangfolge
                  </label>
                  <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {STANDARD_RANKS.map((r, idx) => (
                      <React.Fragment key={`rank-step-${r}`}>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-400">
                          {r}
                        </div>
                        {idx < STANDARD_RANKS.length - 1 && (
                          <span className="text-slate-500 text-xs font-bold select-none">
                            →
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Start-Rang
                    </label>
                    <select
                      value={config.rankSystem.startRank || 'F'}
                      onChange={e => {
                        const val = e.target.value as CharacterRank;
                        updateConfig(prev => ({
                          ...prev,
                          rankSystem: { ...prev.rankSystem, startRank: val }
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {STANDARD_RANKS.map(r => (
                        <option key={`start-rank-${r}`} value={r}>
                          Rang {r}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Anfangsraststufe für neue Charaktere
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Rangaufstieg automatisch
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig(prev => ({
                            ...prev,
                            rankSystem: { ...prev.rankSystem, autoRankUp: true }
                          }))
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          config.rankSystem.autoRankUp !== false
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig(prev => ({
                            ...prev,
                            rankSystem: { ...prev.rankSystem, autoRankUp: false }
                          }))
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          config.rankSystem.autoRankUp === false
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
                      value={config.rankSystem.minXpForRankUp ?? 0}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        updateConfig(prev => ({
                          ...prev,
                          rankSystem: { ...prev.rankSystem, minXpForRankUp: val }
                        }));
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
                      checked={config.rankSystem.requiresMaxLevelForRankUp}
                      onChange={e =>
                        updateConfig(prev => ({
                          ...prev,
                          rankSystem: {
                            ...prev.rankSystem,
                            requiresMaxLevelForRankUp: e.target.checked
                          }
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Voraussetzung: Maximales Level des aktuellen Rangs erforderlich
                      </span>
                      <span className="text-[11px] text-slate-400 leading-relaxed block">
                        Ein Rangaufstieg kann erst stattfinden, wenn das maximale Level der aktuellen Rangstufe ({config.levelSystem.levelsPerRank}) erreicht wurde.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 3. EP-Anforderung */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  EP-Anforderung
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Legt fest, wie viele EP für den nächsten Levelaufstieg benötigt werden.
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
                  const isSelected = config.epSystem.requirementMode === model.id;
                  return (
                    <button
                      key={`ep-mode-${model.id}`}
                      type="button"
                      onClick={() =>
                        updateConfig(prev => ({
                          ...prev,
                          epSystem: { ...prev.epSystem, requirementMode: model.id }
                        }))
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
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

            {/* Spezifische Felder je nach Modell */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {config.epSystem.requirementMode === 'fixed'
                    ? 'EP für Levelaufstieg'
                    : 'Basis-EP'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.epSystem.baseRequirement ?? 100}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 100);
                    updateConfig(prev => ({
                      ...prev,
                      epSystem: { ...prev.epSystem, baseRequirement: val }
                    }));
                  }}
                  placeholder="100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {config.epSystem.requirementMode === 'fixed'
                    ? 'Fester Bedarf pro Stufe'
                    : 'Ausgangswert auf Stufe 1'}
                </span>
              </div>

              {config.epSystem.requirementMode !== 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EP-Zuwachs pro Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={config.epSystem.levelGrowth ?? 20}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      updateConfig(prev => ({
                        ...prev,
                        epSystem: { ...prev.epSystem, levelGrowth: val }
                      }));
                    }}
                    placeholder="20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Zusätzlicher Bedarf pro erreichtem Level
                  </span>
                </div>
              )}

              {config.epSystem.requirementMode === 'level_and_rank_growth' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EP-Zuwachs pro Rang
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={config.epSystem.rankGrowth ?? 100}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      updateConfig(prev => ({
                        ...prev,
                        epSystem: { ...prev.epSystem, rankGrowth: val }
                      }));
                    }}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                  value={config.epSystem.maxRequirement ?? 50000}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 50000);
                    updateConfig(prev => ({
                      ...prev,
                      epSystem: { ...prev.epSystem, maxRequirement: val }
                    }));
                  }}
                  placeholder="50000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Obergrenze für den EP-Bedarf
                </span>
              </div>
            </div>
          </div>

          {/* 4. EP-Gewinn & Entwicklungsprofil */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  EP-Gewinn
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Legt fest, wie schnell EP gesammelt werden.
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
                  const isSelected = (config.activeProfile || 'normal') === p.id;
                  return (
                    <button
                      key={`profile-${p.id}`}
                      type="button"
                      onClick={() => handleProfileSelect(p.id)}
                      className={`p-2.5 rounded-lg border text-center transition-all text-xs font-bold ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-xs pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                EP-Gewinn-Multiplikator
              </label>
              <input
                type="number"
                step="0.05"
                min={0.1}
                max={10.0}
                value={config.developmentRate.epGainMultiplier ?? 1.0}
                onChange={e => {
                  const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                  updateConfig(prev => ({
                    ...prev,
                    activeProfile: 'custom',
                    developmentRate: { ...prev.developmentRate, epGainMultiplier: val }
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Faktor auf erhaltene Erfahrungspunkte
              </span>
            </div>
          </div>

          {/* 5. Entwicklungs-Tempo */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Entwicklungs-Tempo
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Das Entwicklungs-Tempo bestimmt unabhängig von der eigentlichen EP-Anforderung, wie schnell sich ein Charakter entwickelt.
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
                  value={config.developmentRate.epGainMultiplier ?? 1.0}
                  onChange={e => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                    updateConfig(prev => ({
                      ...prev,
                      activeProfile: 'custom',
                      developmentRate: { ...prev.developmentRate, epGainMultiplier: val }
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                  value={config.developmentRate.epRequirementMultiplier ?? 1.0}
                  onChange={e => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                    updateConfig(prev => ({
                      ...prev,
                      activeProfile: 'custom',
                      developmentRate: { ...prev.developmentRate, epRequirementMultiplier: val }
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                  value={config.developmentRate.attributeGrowthMultiplier ?? 1.0}
                  onChange={e => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                    updateConfig(prev => ({
                      ...prev,
                      activeProfile: 'custom',
                      developmentRate: { ...prev.developmentRate, attributeGrowthMultiplier: val }
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Multiplikator für Wertzuwächse
                </span>
              </div>
            </div>
          </div>

          {/* 6. Werte-/Attributsteigerung */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Werte-/Attributsteigerung
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Legt fest, was bei einem erfolgreichen Levelaufstieg passiert.
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
                  value={config.attributeProgression.baseGrowthPerLevel ?? 2}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    updateConfig(prev => ({
                      ...prev,
                      attributeProgression: { ...prev.attributeProgression, baseGrowthPerLevel: val }
                    }));
                  }}
                  placeholder="2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                  value={config.attributeProgression.minAttributeValue ?? 0}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    updateConfig(prev => ({
                      ...prev,
                      attributeProgression: { ...prev.attributeProgression, minAttributeValue: val }
                    }));
                  }}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                  value={config.attributeProgression.maxAttributeValue ?? 1000}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 1000);
                    updateConfig(prev => ({
                      ...prev,
                      attributeProgression: { ...prev.attributeProgression, maxAttributeValue: val }
                    }));
                  }}
                  placeholder="1000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Globale Obergrenze für Attribute
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
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          enforcePotentialCap: true
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      config.attributeProgression.enforcePotentialCap
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          enforcePotentialCap: false
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      !config.attributeProgression.enforcePotentialCap
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

          {/* 7. Potenzial */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Potenzial
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Das Potenzial begrenzt, wie weit sich ein Charakter oder eine Entwicklung innerhalb des Systems entwickeln kann.
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
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          enforcePotentialCap: true
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      config.attributeProgression.enforcePotentialCap
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          enforcePotentialCap: false
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      !config.attributeProgression.enforcePotentialCap
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
                  value={config.attributeProgression.potentialCap ?? 1000}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 1000);
                    updateConfig(prev => ({
                      ...prev,
                      attributeProgression: {
                        ...prev.attributeProgression,
                        potentialCap: val
                      }
                    }));
                  }}
                  placeholder="1000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Standardmäßige Potenzialobergrenze
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Individuelle Abweichung pro Charakter
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          allowIndividualPotentialVariance: true
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      config.attributeProgression.allowIndividualPotentialVariance !== false
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig(prev => ({
                        ...prev,
                        attributeProgression: {
                          ...prev.attributeProgression,
                          allowIndividualPotentialVariance: false
                        }
                      }))
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      config.attributeProgression.allowIndividualPotentialVariance === false
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nein
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Erlaubt individuelle Höchstpotenziale
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
