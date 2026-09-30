// -*- coding: utf-8 -*-
import React from 'react';
import { CampaignPowerParameter, WorldSetting, ProgressionConfig, DevelopmentProfileType } from '../types';
import { STANDARD_RANKS, ProgressionService, DEFAULT_PROGRESSION_CONFIG } from '../services/progressionService';
import { DEFAULT_RACES, RaceService, RaceDefinition } from '../services/raceService';
import { AutoExpandingTextarea } from './AutoExpandingTextarea';
import RpgStatusWindow from './RpgStatusWindow';
import { Dna, BarChart3, Layers, Info } from 'lucide-react';

interface CharacterRaceAndStatsSectionProps {
  race: string;
  onRaceChange: (val: string) => void;
  customRaces?: RaceDefinition[];
  raceFeatures?: string;
  onRaceFeaturesChange?: (val: string) => void;
  origin?: string;
  onOriginChange?: (val: string) => void;
  world?: WorldSetting;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  characterPowerData?: any;
  onCharacterPowerDataChange: (newData: any) => void;
  level?: number;
  onLevelChange?: (lvl: number) => void;
  rank?: string;
  onRankChange?: (rank: string) => void;
  potential?: number;
  onPotentialChange?: (pot: number) => void;
  xp?: number;
  onXpChange?: (xp: number) => void;
  developmentProfile?: DevelopmentProfileType;
  progressionConfig?: ProgressionConfig;
  levelsPerRank?: number;
}

export const CharacterRaceAndStatsSection: React.FC<CharacterRaceAndStatsSectionProps> = ({
  race,
  onRaceChange,
  customRaces,
  raceFeatures = '',
  onRaceFeaturesChange,
  origin = '',
  onOriginChange,
  world,
  worldPowerSettings = {},
  characterPowerData = {},
  onCharacterPowerDataChange,
  level = 1,
  onLevelChange,
  rank = 'F',
  onRankChange,
  potential = 1000,
  onPotentialChange,
  xp = 0,
  onXpChange,
  developmentProfile,
  progressionConfig,
  levelsPerRank
}) => {
  const currentRace = race || 'Mensch';
  const availableRaces = customRaces && customRaces.length > 0
    ? Array.from(new Map([...DEFAULT_RACES, ...customRaces].map(r => [r.name.toLowerCase(), r])).values())
    : DEFAULT_RACES;

  const currentRaceDef = RaceService.getRaceDefinition(currentRace, availableRaces);
  const effectiveConfig = progressionConfig || world?.progressionConfig || DEFAULT_PROGRESSION_CONFIG;
  const currentLevelsPerRank = levelsPerRank ?? effectiveConfig.levelSystem?.levelsPerRank ?? 10;
  const xpNeeded = ProgressionService.calculateXpRequirement(level, rank, effectiveConfig, developmentProfile);
  const progressPercent = xpNeeded > 0 ? Math.min(100, Math.max(0, Math.round((xp / xpNeeded) * 100))) : 100;

  return (
    <div className="space-y-6">
      {/* 1. RASSE & EIGENSCHAFTEN */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Dna className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Rasse &amp; Eigenschaften
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rasse / Spezies
            </label>
            <select
              value={currentRace}
              onChange={e => onRaceChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {availableRaces.map(r => (
                <option key={r.id || r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
              {currentRaceDef.description || 'Biologische Spezies'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rassenmerkmale
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={raceFeatures}
              onChange={e => onRaceFeaturesChange?.(e.target.value)}
              placeholder="z. B. Spitze Ohren, Dämmersicht, Hornansatz"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Anatomische oder visuelle Eigenheiten
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Herkunft / Volk
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={origin}
              onChange={e => onOriginChange?.(e.target.value)}
              placeholder="z. B. Eisiges Nordland, Hochgebirge"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Heimatland oder Kulturkreis
            </span>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSION */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Progression
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Rang
            </label>
            <select
              value={rank || 'F'}
              onChange={e => onRankChange?.(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold cursor-pointer"
            >
              {STANDARD_RANKS.map(r => (
                <option key={`char-rank-${r}`} value={r}>
                  Rang {r}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Gesamteinstufung
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Level
            </label>
            <input
              type="number"
              min={1}
              value={level}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                onLevelChange?.(val);
              }}
              placeholder="1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Stufe {level} / {currentLevelsPerRank} (pro Rang)
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Erfahrungspunkte (EP)
            </label>
            <input
              type="number"
              min={0}
              value={xp}
              onChange={e => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                onXpChange?.(val);
              }}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Aktuell angesammelte EP
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Individuelles Potenzial
            </label>
            <input
              type="number"
              min={1}
              value={potential}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 1000);
                onPotentialChange?.(val);
              }}
              placeholder="1000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              Beeinflusst die Wachstumsgeschwindigkeit
            </span>
          </div>
        </div>

        {/* EP-Fortschrittsbalken / nächste Stufe */}
        <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">EP-Fortschritt / nächste Stufe</span>
            <span className="font-bold text-amber-300 text-xs">
              {xp} <span className="text-slate-500 font-normal">/ {xpNeeded} EP</span>
              <span className="ml-2 text-slate-400 font-normal text-[10px]">({progressPercent}%)</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. KAMPFEIGENSCHAFTEN & PARAMETER */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 px-1">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Kampfeigenschaften &amp; Parameter
          </h3>
        </div>

        {worldPowerSettings && Object.keys(worldPowerSettings).length > 0 ? (
          <RpgStatusWindow
            world={world}
            worldPowerSettings={worldPowerSettings}
            campaignPowerLevels={characterPowerData}
            onChangeCampaignPowerLevels={onCharacterPowerDataChange}
          />
        ) : (
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              In der Spielwelt sind noch keine Kampagnen-Parameter definiert. Definiere diese im Welten-Editor unter Schritt 1.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterRaceAndStatsSection;

