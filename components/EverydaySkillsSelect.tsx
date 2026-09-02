import React, { useState } from 'react';
import { EVERYDAY_SKILL_CATEGORIES } from './everydaySkillPresets';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface EverydaySkillsSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface EverydaySkillItem {
  name: string;
  score: number; // 0 - 100
  label: string; // 'Anfänger', 'Fortgeschritten', 'Erfahren', 'Meisterhaft'
  note?: string;
}

export function getSkillLabel(score: number): string {
  if (score <= 25) return 'Anfänger';
  if (score <= 55) return 'Fortgeschritten';
  if (score <= 80) return 'Erfahren';
  return 'Meisterhaft';
}

export function parseEverydaySkills(text: string): EverydaySkillItem[] {
  if (!text || !text.trim()) return [];

  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());

  return parts.map(part => {
    const match = part.match(/^([^(]+)(?:\(([^)]+)\))?/);
    if (!match) {
      return { name: part.trim(), score: 50, label: 'Fortgeschritten' };
    }
    const name = match[1].trim();
    const details = match[2] ? match[2].trim() : '';

    let score = 50;
    let note = '';

    if (details) {
      const scoreMatch = details.match(/(\d+)%/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
      } else if (details.toLowerCase().includes('anfänger') || details.toLowerCase().includes('grundkenntnisse')) {
        score = 25;
      } else if (details.toLowerCase().includes('fortgeschritten')) {
        score = 50;
      } else if (details.toLowerCase().includes('erfahren') || details.toLowerCase().includes('routine')) {
        score = 75;
      } else if (details.toLowerCase().includes('meisterhaft') || details.toLowerCase().includes('perfektioniert')) {
        score = 95;
      }

      const noteMatch = details.match(/(?:Note|Notiz|Hinweis|Praxis):\s*([^|)]+)/i);
      if (noteMatch) {
        note = noteMatch[1].trim();
      }
    }

    const label = getSkillLabel(score);
    return { name, score, label, note };
  });
}

export function serializeEverydaySkills(items: EverydaySkillItem[]): string {
  return items.map(item => {
    const label = getSkillLabel(item.score);
    let details = `${label} - ${item.score}%`;
    if (item.note && item.note.trim()) {
      details += ` | Note: ${item.note.trim()}`;
    }
    return `${item.name} (${details})`;
  }).join(', ');
}

export const EverydaySkillsSelect: React.FC<EverydaySkillsSelectProps> = ({
  value,
  onChange,
  placeholder = "Alltagskompetenzen und praktische Fertigkeiten im Alltag",
  className = "bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[60px]"
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [showRawText, setShowRawText] = useState<boolean>(false);

  const skillItems = parseEverydaySkills(value);
  const activeSkillNames = skillItems.map(item => item.name);

  const handleToggleSkill = (skillName: string) => {
    let updated: EverydaySkillItem[];
    if (activeSkillNames.includes(skillName)) {
      updated = skillItems.filter(item => item.name !== skillName);
    } else {
      updated = [
        ...skillItems,
        { name: skillName, score: 50, label: 'Fortgeschritten', note: '' }
      ];
    }
    onChange(serializeEverydaySkills(updated));
  };

  const handleUpdateItem = (index: number, fields: Partial<EverydaySkillItem>) => {
    const list = [...skillItems];
    const newScore = fields.score !== undefined ? Math.max(0, Math.min(100, fields.score)) : list[index].score;
    list[index] = {
      ...list[index],
      ...fields,
      score: newScore,
      label: getSkillLabel(newScore)
    };
    onChange(serializeEverydaySkills(list));
  };

  const handleRemoveItem = (index: number) => {
    const list = skillItems.filter((_, i) => i !== index);
    onChange(serializeEverydaySkills(list));
  };

  return (
    <div className="flex flex-col w-full gap-2.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
        >
          <i className="fa-solid fa-list-check text-[10px]"></i>
          <span>
            {isOpen ? 'Auswahlmenü für Alltagskompetenzen schließen' : 'Alltagskompetenzen aus Liste auswählen...'}
          </span>
        </button>

        {skillItems.length > 0 && (
          <span className="text-[10px] text-amber-300 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            {skillItems.length} Fertigkeiten mit individuellem Level
          </span>
        )}
      </div>

      {isOpen && (
        <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Mehrfachauswahl Alltagskompetenzen
            </span>
            <span className="text-[10px] text-slate-400">
              Anklicken zum Aktivieren / Deaktivieren
            </span>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {EVERYDAY_SKILL_CATEGORIES.map(cat => (
              <div key={cat.category} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {cat.category}:
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.skills.map(skill => {
                    const isSelected = activeSkillNames.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUELLE BEHERRSCHUNGSSTUFEN PRO GEWÄHLTER ALLTAGSKOMPETENZ */}
      {skillItems.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Individuelle Beherrschungsstufen der Fertigkeiten
            </span>
            <span className="text-[10px] text-slate-400">
              Setze für jede Fertigkeit ein eigenes Level
            </span>
          </div>

          <div className="space-y-3">
            {skillItems.map((item, idx) => {
              const presets = [
                { name: 'Anfänger', score: 25 },
                { name: 'Fortgeschritten', score: 50 },
                { name: 'Erfahren', score: 75 },
                { name: 'Meisterhaft', score: 95 }
              ];

              return (
                <div
                  key={`${item.name}-${idx}`}
                  className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="text-amber-400">•</span>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {item.label} ({item.score}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-1.5 py-0.5 rounded transition cursor-pointer"
                        title="Entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Schnellauswahl Stufe & Regler */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-1">
                      {presets.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleUpdateItem(idx, { score: p.score })}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition border cursor-pointer ${
                            Math.abs(item.score - p.score) < 15
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={item.score}
                        onChange={e => handleUpdateItem(idx, { score: Number(e.target.value) })}
                        className="w-full accent-amber-500 bg-slate-900 rounded h-1.5 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.score}
                        onChange={e => handleUpdateItem(idx, { score: Number(e.target.value) })}
                        className="w-12 bg-slate-900 border border-slate-800 rounded p-1 text-center text-[11px] text-amber-300 font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Freitext Notiz/Praxis für diese spezifische Fertigkeit */}
                  <input
                    type="text"
                    value={item.note || ''}
                    onChange={e => handleUpdateItem(idx, { note: e.target.value })}
                    placeholder="Praxiserfahrung / Notiz zu dieser Fertigkeit (z.B. Seit der Kindheit gelernt)"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AutoExpandingTextarea zur Übersicht & direkten Bearbeitung */}
      {skillItems.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="text-[10px] text-slate-500 hover:text-slate-400 transition underline cursor-pointer"
            >
              {showRawText ? 'Manuelle Text-Eingabe ausblenden' : 'Manuelle Text-Eingabe (Rohdaten) einblenden'}
            </button>
          </div>
          {showRawText && (
            <AutoExpandingTextarea
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className={className}
            />
          )}
        </div>
      ) : (
        <AutoExpandingTextarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  );
};

export default EverydaySkillsSelect;
