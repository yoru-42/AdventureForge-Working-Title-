import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProfessionCompetency } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { getTalentLabel } from '../services/professionCompetencyService';
import { X, Check, Star } from 'lucide-react';

interface CompetencyEditModalProps {
  competency: ProfessionCompetency | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: ProfessionCompetency) => void;
}

export const CompetencyEditModal: React.FC<CompetencyEditModalProps> = ({
  competency,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(competency?.name || '');
  const [category, setCategory] = useState<ProfessionCompetency['category']>(competency?.category || 'Grundlage');
  const [proficiency, setProficiency] = useState<number>(competency?.proficiency || 0);
  const [experiencePoints, setExperiencePoints] = useState<number>(competency?.experiencePoints || 0);
  const [talent, setTalent] = useState<number>(competency?.talent ?? 3);
  const [practiceCount, setPracticeCount] = useState<number>(competency?.practiceCount || 0);
  const [description, setDescription] = useState(competency?.description || '');
  const [notes, setNotes] = useState(competency?.notes || '');

  // Keep state in sync with selected competency
  useEffect(() => {
    if (competency) {
      setName(competency.name || '');
      setCategory(competency.category || 'Grundlage');
      setProficiency(competency.proficiency || 0);
      setExperiencePoints(competency.experiencePoints || 0);
      setTalent(competency.talent ?? 3);
      setPracticeCount(competency.practiceCount || 0);
      setDescription(competency.description || '');
      setNotes(competency.notes || '');
    }
  }, [competency]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (!isOpen || !competency) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, competency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competency) return;
    onSave({
      ...competency,
      name: name.trim() || 'Kompetenz',
      category,
      proficiency: Math.max(0, Math.min(100, Math.round(proficiency))),
      experiencePoints: Math.max(0, Math.round(experiencePoints)),
      talent: Math.max(0, Math.min(5, Math.round(talent))),
      practiceCount: Math.max(0, Math.round(practiceCount)),
      description: description.trim(),
      notes: notes.trim()
    });
    onClose();
  };

  if (!isOpen || !competency) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="competency-edit-modal"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Kompetenz bearbeiten
          </h3>
          <button
            type="button"
            id="competency-edit-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Name der Kompetenz
            </label>
            <input
              type="text"
              id="competency-edit-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Schmiedefeuer entzünden, Fleisch schneiden"
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Kategorie
            </label>
            <select
              id="competency-edit-category-select"
              value={category}
              onChange={e => setCategory(e.target.value as ProfessionCompetency['category'])}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition"
            >
              <option value="Grundlage">Grundlage</option>
              <option value="Fortgeschritten">Fortgeschritten</option>
              <option value="Spezialisierung">Spezialisierung</option>
              <option value="Meisterschaft">Meisterschaft</option>
            </select>
          </div>

          {/* Proficiency (Slider + Input) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Beherrschung (0–100%)
              </label>
              <span className="text-amber-400 font-mono font-bold text-xs">
                {proficiency}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="competency-edit-proficiency-slider"
                min="0"
                max="100"
                value={proficiency}
                onChange={e => setProficiency(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <input
                type="number"
                id="competency-edit-proficiency-num"
                min="0"
                max="100"
                value={proficiency}
                onChange={e => setProficiency(Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-white text-xs font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Talent (0 to 5) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Talent / Lernfähigkeit (0–5)
              </label>
              <span className="text-xs text-slate-400">
                {getTalentLabel(talent)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  id={`competency-edit-talent-btn-${val}`}
                  onClick={() => setTalent(val)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1 ${
                    talent === val
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Star className={`w-3 h-3 ${talent >= val && val > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  <span>{val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* XP and Practice Count Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Erfahrungspunkte (XP)
              </label>
              <input
                type="number"
                id="competency-edit-xp-input"
                min="0"
                value={experiencePoints}
                onChange={e => setExperiencePoints(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Anzahl der Übungen
              </label>
              <input
                type="number"
                id="competency-edit-practices-input"
                min="0"
                value={practiceCount}
                onChange={e => setPracticeCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Beschreibung der Tätigkeit
            </label>
            <AutoExpandingTextarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Kurze präzise Beschreibung der Tätigkeit..."
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition min-h-[50px]"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Persönliche Notizen & Feinheiten
            </label>
            <AutoExpandingTextarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Besondere Kniffe, Schwächen oder persönliche Notizen..."
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition min-h-[50px]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              id="competency-edit-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              id="competency-edit-submit-btn"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
