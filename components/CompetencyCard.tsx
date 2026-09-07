import React, { useState } from 'react';
import { ProfessionCompetency } from '../types';
import { getTalentLabel } from '../services/professionCompetencyService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { Star, Dumbbell, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface CompetencyCardProps {
  competency: ProfessionCompetency;
  onUpdate?: (updated: ProfessionCompetency) => void;
  onPractice: (competency: ProfessionCompetency) => void;
  onDelete: (id: string) => void;
  onEdit?: (competency: ProfessionCompetency) => void;
  onProficiencyChange?: (id: string, newProficiency: number) => void;
  onTalentChange?: (id: string, newTalent: number) => void;
}

export const CompetencyCard: React.FC<CompetencyCardProps> = ({
  competency,
  onUpdate,
  onPractice,
  onDelete,
  onProficiencyChange,
  onTalentChange
}) => {
  const [isExpanded, setIsExpanded] = useState(Boolean(competency.notes));

  const getCategoryBadgeClass = (category: ProfessionCompetency['category']) => {
    switch (category) {
      case 'Grundlage':
        return 'bg-sky-950/80 text-sky-300 border-sky-800/80 hover:border-sky-600';
      case 'Fortgeschritten':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80 hover:border-indigo-600';
      case 'Spezialisierung':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80 hover:border-amber-600';
      case 'Meisterschaft':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:border-emerald-600';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600';
    }
  };

  const talentScore = Math.max(0, Math.min(5, Math.round(competency.talent ?? 2)));

  const handleFieldChange = <K extends keyof ProfessionCompetency>(
    field: K,
    value: ProfessionCompetency[K]
  ) => {
    if (onUpdate) {
      onUpdate({
        ...competency,
        [field]: value
      });
    }
  };

  const handleProficiency = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    if (onProficiencyChange) {
      onProficiencyChange(competency.id, clamped);
    }
    if (onUpdate) {
      // Calculate scaled experience point approximate if desired
      const estimatedXp = Math.max(competency.experiencePoints || 0, clamped * 10);
      onUpdate({
        ...competency,
        proficiency: clamped,
        experiencePoints: estimatedXp
      });
    }
  };

  const handleTalent = (star: number) => {
    if (onTalentChange) {
      onTalentChange(competency.id, star);
    }
    if (onUpdate) {
      onUpdate({
        ...competency,
        talent: star
      });
    }
  };

  return (
    <div
      id={`competency-card-${competency.id}`}
      className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 transition flex flex-col gap-3 shadow-sm"
    >
      {/* Header: Name (Inline Editable), Category Dropdown, Action Buttons */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inline Editable Name */}
            <input
              type="text"
              id={`competency-name-input-${competency.id}`}
              value={competency.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              placeholder="Name der Kompetenz"
              className="text-sm font-semibold text-white bg-transparent hover:bg-slate-950/60 focus:bg-slate-950 border border-transparent hover:border-slate-800 focus:border-amber-500 rounded-lg px-2 py-0.5 outline-none transition min-w-[160px] flex-1"
            />

            {/* Direct Category Dropdown Badge */}
            <div className="relative inline-flex items-center shrink-0">
              <select
                id={`competency-category-select-${competency.id}`}
                value={competency.category}
                onChange={e =>
                  handleFieldChange(
                    'category',
                    e.target.value as ProfessionCompetency['category']
                  )
                }
                className={`text-[11px] font-semibold pl-2.5 pr-6 py-0.5 rounded-full border outline-none cursor-pointer appearance-none transition ${getCategoryBadgeClass(
                  competency.category
                )}`}
              >
                <option value="Grundlage" className="bg-slate-900 text-sky-300">
                  Grundlage
                </option>
                <option value="Fortgeschritten" className="bg-slate-900 text-indigo-300">
                  Fortgeschritten
                </option>
                <option value="Spezialisierung" className="bg-slate-900 text-amber-300">
                  Spezialisierung
                </option>
                <option value="Meisterschaft" className="bg-slate-900 text-emerald-300">
                  Meisterschaft
                </option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none opacity-70" />
            </div>
          </div>

          {/* Inline Editable Description */}
          <AutoExpandingTextarea
            id={`competency-description-input-${competency.id}`}
            value={competency.description || ''}
            onChange={e => handleFieldChange('description', e.target.value)}
            placeholder="Beschreibung der Kompetenz und spezifischen Tätigkeiten..."
            className="w-full bg-transparent hover:bg-slate-950/40 focus:bg-slate-950 border border-transparent hover:border-slate-800/80 focus:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none leading-relaxed transition resize-none placeholder:text-slate-600"
          />
        </div>

        {/* Top Right Action: Delete Button */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            id={`competency-delete-btn-${competency.id}`}
            onClick={() => onDelete(competency.id)}
            title="Kompetenz entfernen"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-900/60 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress & Beherrschung (Direct Slider & Numeric Input) */}
      <div className="flex flex-col gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Beherrschung</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5 focus-within:border-amber-500">
              <input
                type="number"
                id={`competency-proficiency-input-${competency.id}`}
                min="0"
                max="100"
                value={competency.proficiency}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  handleProficiency(isNaN(val) ? 0 : val);
                }}
                className="w-8 bg-transparent text-amber-400 font-mono font-bold text-xs text-right outline-none"
              />
              <span className="text-amber-400 font-mono font-bold text-xs">%</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              ({competency.experiencePoints || 0} XP)
            </span>
          </div>
        </div>

        {/* Direct Range Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            id={`competency-proficiency-slider-${competency.id}`}
            min="0"
            max="100"
            value={competency.proficiency}
            onChange={e => {
              const val = parseInt(e.target.value, 10) || 0;
              handleProficiency(val);
            }}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-900 rounded-full"
          />
        </div>
      </div>

      {/* Footer Settings: Talent, Practice Button, Notes Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60 flex-wrap gap-2">
        {/* Talent Selector */}
        <div className="flex items-center gap-1.5" title={`Talent: ${getTalentLabel(talentScore)}`}>
          <span className="text-[11px] text-slate-400">Talent:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
              const isActive = star <= talentScore;
              return (
                <button
                  key={star}
                  type="button"
                  id={`competency-talent-${competency.id}-star-${star}`}
                  onClick={() => handleTalent(star)}
                  className="p-0.5 transition cursor-pointer hover:scale-110"
                  title={`${star}/5 - ${getTalentLabel(star)}`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-700 hover:text-slate-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Practice Button & Notes Expand */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id={`competency-practice-btn-${competency.id}`}
            onClick={() => onPractice(competency)}
            title="Übung durchführen (+XP)"
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-amber-600/20 text-slate-200 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            <span>Üben</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({competency.practiceCount || 0})
            </span>
          </button>

          <button
            type="button"
            id={`competency-toggle-notes-${competency.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700"
          >
            <span>Notizen</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Notes & Details (AutoExpandingTextarea) */}
      {isExpanded && (
        <div className="mt-1 pt-2 border-t border-slate-800/60 text-xs text-slate-300 flex flex-col gap-2 bg-slate-950/70 p-3 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Notizen & Besonderheiten
            </span>
            {competency.lastPracticedAt && (
              <span className="text-[10px] text-slate-500 font-mono">
                Zuletzt geübt: {new Date(competency.lastPracticedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <AutoExpandingTextarea
            id={`competency-notes-input-${competency.id}`}
            value={competency.notes || ''}
            onChange={e => handleFieldChange('notes', e.target.value)}
            placeholder="Notizen zur Ausführung, Besonderheiten, Lehrmeister oder Arbeitsweisen..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500 resize-none leading-relaxed placeholder:text-slate-600"
          />
        </div>
      )}
    </div>
  );
};
