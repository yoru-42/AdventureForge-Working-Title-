// -*- coding: utf-8 -*-
import React from 'react';
import { CampaignPowerParameter, CharacterRank } from '../types';
import { STANDARD_RANKS } from '../services/progressionService';
import { AutoExpandingTextarea } from './AutoExpandingTextarea';
import CharacterPowerRadar from './CharacterPowerRadar';
import { Dna, BarChart3, Layers, Info } from 'lucide-react';

interface CharacterRaceAndStatsSectionProps {
  race: string;
  onRaceChange: (val: string) => void;
  raceFeatures?: string;
  onRaceFeaturesChange?: (val: string) => void;
  origin?: string;
  onOriginChange?: (val: string) => void;
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
}

export const CharacterRaceAndStatsSection: React.FC<CharacterRaceAndStatsSectionProps> = ({
  race,
  onRaceChange,
  raceFeatures = '',
  onRaceFeaturesChange,
  origin = '',
  onOriginChange,
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
  onXpChange
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Rasse & grundlegende Eigenschaften */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Dna className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Rasse &amp; grundlegende Eigenschaften
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Definiert die biologische Spezies, Herkunft und physiologische Besonderheiten dieser Figur.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rasse / Spezies
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={race}
              onChange={e => onRaceChange(e.target.value)}
              placeholder="z. B. Mensch, Elf, Zwerg"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Biologische Spezies
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Besondere Rassenmerkmale
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={raceFeatures}
              onChange={e => onRaceFeaturesChange?.(e.target.value)}
              placeholder="z. B. Spitze Ohren, Dämmersicht, Hornansatz"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Anatomische oder visuelle Eigenheiten
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Herkunft / Volk
            </label>
            <AutoExpandingTextarea
              minRows={1}
              value={origin}
              onChange={e => onOriginChange?.(e.target.value)}
              placeholder="z. B. Eisiges Nordland, Hochgebirge"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Heimatland oder Kulturkreis
            </span>
          </div>
        </div>
      </div>

      {/* 2. Individueller Entwicklungszustand */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Individueller Entwicklungszustand
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Gibt an, wo diese konkrete Figur aktuell steht. Die globale Progressionsregel bestimmt, wie Fortschritt erzielt wird.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Aktuelles Level
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Fortschrittsstufe
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rang
            </label>
            <select
              value={rank || 'F'}
              onChange={e => onRankChange?.(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              {STANDARD_RANKS.map(r => (
                <option key={`char-rank-${r}`} value={r}>
                  Rang {r}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Gesamteinstufung
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Persönliche Wachstumsgrenze
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Aktuell angesammelte EP
            </span>
          </div>
        </div>
      </div>

      {/* 3. Macht & Werte (Kampagnen-Skala) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Macht &amp; Werte (Kampagnen-Skala)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Konkrete Einstufung der Attribute innerhalb der für die Kampagne definierten Skalen.
              </p>
            </div>
          </div>
        </div>

        {worldPowerSettings && Object.keys(worldPowerSettings).length > 0 ? (
          <CharacterPowerRadar
            worldPowerSettings={worldPowerSettings}
            characterData={characterPowerData}
            onChange={onCharacterPowerDataChange}
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
