import React, { useState } from 'react';
import { ProfessionCompetency } from '../types';
import { getTalentLabel } from '../services/professionCompetencyService';
import { Star, Edit3, Dumbbell, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface CompetencyCardProps {
  competency: ProfessionCompetency;
  onEdit: (competency: ProfessionCompetency) => void;
  onPractice: (competency: ProfessionCompetency) => void;
  onDelete: (id: string) => void;
  onProficiencyChange?: (id: string, newProficiency: number) => void;
  onTalentChange?: (id: string, newTalent: number) => void;
}

export const CompetencyCard: React.FC<CompetencyCardProps> = ({
  competency,
  onEdit,
  onPractice,
  onDelete,
  onProficiencyChange,
  onTalentChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryBadgeClass = (category: ProfessionCompetency['category']) => {
    switch (category) {
      case 'Grundlage':
        return 'bg-sky-950/60 text-sky-300 border-sky-800/60';
      case 'Fortgeschritten':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';
      case 'Spezialisierung':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'Meisterschaft':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const talentScore = Math.max(0, Math.min(5, Math.round(competency.talent ?? 2)));

  return (
    <div
      id={`competency-card-${competency.id}`}
      className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col gap-3 shadow-sm"
    >
      {/* Header: Name, Category, Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="text-sm font-semibold text-white break-words">
              {competency.name}
            </h5>
            <span
              id={`competency-category-badge-${competency.id}`}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${getCategoryBadgeClass(
                competency.category
              )}`}
            >
              {competency.category}
            </span>
          </div>
          {competency.description && (
            <p className="text-xs text-slate-300 leading-relaxed break-words mt-0.5">
              {competency.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id={`competency-practice-btn-${competency.id}`}
            onClick={() => onPractice(competency)}
            title="Übung durchführen (+XP)"
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-amber-600/20 text-slate-200 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium">Üben</span>
          </button>
          <button
            type="button"
            id={`competency-edit-btn-${competency.id}`}
            onClick={() => onEdit(competency)}
            title="Bearbeiten"
            className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id={`competency-delete-btn-${competency.id}`}
            onClick={() => onDelete(competency.id)}
            title="Entfernen"
            className="p-1.5 text-xs bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 rounded-lg transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Numeric Display */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Beherrschung</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              {competency.proficiency}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({competency.experiencePoints} XP)
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, competency.proficiency))}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Talent, Practice Count, Expandable Details */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/60 flex-wrap gap-2">
        {/* Talent display (neutral stars/segments) */}
        <div className="flex items-center gap-1.5" title={`Talent: ${getTalentLabel(talentScore)}`}>
          <span className="text-[11px] text-slate-500">Talent:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
              const isActive = star <= talentScore;
              return (
                <button
                  key={star}
                  type="button"
                  id={`competency-talent-${competency.id}-star-${star}`}
                  onClick={() => onTalentChange && onTalentChange(competency.id, star)}
                  disabled={!onTalentChange}
                  className={`p-0.5 transition ${
                    onTalentChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  }`}
                  title={`${star}/5`}
                >
                  <Star
                    className={`w-3 h-3 ${
                      isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Practice Count & Toggle Details */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            Übungen: <strong className="text-slate-300 font-mono">{competency.practiceCount || 0}</strong>
          </span>
          {(competency.notes || (competency.relatedCompetencyIds && competency.relatedCompetencyIds.length > 0)) && (
            <button
              type="button"
              id={`competency-toggle-notes-${competency.id}`}
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 transition cursor-pointer"
            >
              <span>Notizen</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details / Notes */}
      {isExpanded && (
        <div className="mt-1 pt-2 border-t border-slate-800/60 text-xs text-slate-300 flex flex-col gap-1.5 bg-slate-950/50 p-2.5 rounded-lg">
          {competency.notes && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Notizen & Feinheiten
              </span>
              <p className="text-slate-300 mt-0.5 whitespace-pre-line leading-relaxed">
                {competency.notes}
              </p>
            </div>
          )}
          {competency.lastPracticedAt && (
            <span className="text-[10px] text-slate-500">
              Zuletzt geübt: {new Date(competency.lastPracticedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
