import React from 'react';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface CompetenceProficiencyWidgetProps {
  title?: string;
  proficiencyScore?: number; // 0-100
  onProficiencyScoreChange?: (val: number) => void;
  experiencePoints?: number;
  onExperiencePointsChange?: (val: number) => void;
  experienceText?: string;
  onExperienceTextChange?: (val: string) => void;
  promotionConditions?: string;
  onPromotionConditionsChange?: (val: string) => void;
  showPromotionConditions?: boolean;
}

export const getProficiencyLabel = (score: number): string => {
  if (score <= 20) return 'Anfänger (Grundkenntnisse)';
  if (score <= 45) return 'Fortgeschritten (Solide Praxis)';
  if (score <= 70) return 'Erfahren (Hohe Routine)';
  if (score <= 90) return 'Spezialist (Ausgewiesener Könner)';
  return 'Meisterhaft (Perfektioniert)';
};

export const CompetenceProficiencyWidget: React.FC<CompetenceProficiencyWidgetProps> = ({
  title,
  proficiencyScore = 0,
  onProficiencyScoreChange,
  experiencePoints = 0,
  onExperiencePointsChange,
  experienceText = '',
  onExperienceTextChange,
  promotionConditions = '',
  onPromotionConditionsChange,
  showPromotionConditions = true
}) => {
  const score = Math.max(0, Math.min(100, proficiencyScore));
  const levelLabel = getProficiencyLabel(score);

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-3.5">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {score}% Beherrschung
          </span>
        </div>
      )}

      {/* Beherrschungsgrad & Fortschrittsbalken */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">Beherrschungsgrad & Kompetenzniveau</span>
          <span className="text-[11px] font-medium text-amber-300/90">{levelLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={e => onProficiencyScoreChange?.(Number(e.target.value))}
            className="w-full accent-amber-500 bg-slate-900 rounded-lg h-2 cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={e => onProficiencyScoreChange?.(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center text-xs text-amber-300 font-bold outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Fortschrittsbalken */}
        <div className="w-full bg-slate-900 border border-slate-800/80 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Erfahrungswert & Praxiserfahrung */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="flex flex-col gap-1 sm:col-span-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Erfahrungspunkte (XP)
          </label>
          <input
            type="number"
            min={0}
            value={experiencePoints}
            onChange={e => onExperiencePointsChange?.(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Praxiserfahrung & Routine
          </label>
          <input
            type="text"
            value={experienceText}
            onChange={e => onExperienceTextChange?.(e.target.value)}
            placeholder="z.B. 4 Jahre Praxis in der örtlichen Gilde"
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Aufstiegsbedingungen / Voraussetzungen für höheren Berufslevel */}
      {showPromotionConditions && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Voraussetzungen für Aufstieg / Nächsten Ausbildungsgrad
            </label>
            <span className="text-[10px] text-slate-500">Prüfungen & Meilensteine</span>
          </div>
          <AutoExpandingTextarea
            value={promotionConditions}
            onChange={e => onPromotionConditionsChange?.(e.target.value)}
            placeholder="Welche Bedingungen, Meilensteine oder Prüfungen erforderlich sind, um in die nächste Stufe aufzusteigen"
            className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500 min-h-[45px]"
          />
        </div>
      )}
    </div>
  );
};

export default CompetenceProficiencyWidget;
