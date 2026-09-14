import React, { useState, useMemo } from 'react';
import { Check, Plus, Trash2, Search, X, SlidersHorizontal, FileText, Layers, Info } from 'lucide-react';
import { EVERYDAY_SKILL_CATEGORIES, ALL_EVERYDAY_SKILLS } from './everydaySkillPresets';
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

export function getCategoryForSkill(skillName: string): string {
  const found = EVERYDAY_SKILL_CATEGORIES.find(c => c.skills.includes(skillName));
  return found ? found.category : 'Eigene Fertigkeiten';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');

  const skillItems = useMemo(() => parseEverydaySkills(value), [value]);
  const activeSkillNames = useMemo(() => skillItems.map(item => item.name), [skillItems]);

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

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (activeSkillNames.some(name => name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkillInput('');
      return;
    }
    const updated = [
      ...skillItems,
      { name: trimmed, score: 50, label: 'Fortgeschritten', note: '' }
    ];
    onChange(serializeEverydaySkills(updated));
    setCustomSkillInput('');
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

  // Filtered categories and skills
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return EVERYDAY_SKILL_CATEGORIES.map(cat => {
      if (selectedCategory !== 'alle' && selectedCategory !== 'ausgewaehlt' && cat.category !== selectedCategory) {
        return null;
      }

      let skills = cat.skills;
      if (selectedCategory === 'ausgewaehlt') {
        skills = skills.filter(s => activeSkillNames.includes(s));
      }

      if (query) {
        skills = skills.filter(s => s.toLowerCase().includes(query));
      }

      if (skills.length === 0) return null;

      return {
        category: cat.category,
        skills
      };
    }).filter(Boolean) as typeof EVERYDAY_SKILL_CATEGORIES;
  }, [selectedCategory, searchQuery, activeSkillNames]);

  // Total custom skills not in presets
  const customActiveSkills = useMemo(() => {
    return skillItems.filter(item => !ALL_EVERYDAY_SKILLS.includes(item.name));
  }, [skillItems]);

  const levelPresets = [
    { label: 'Anfänger', score: 25 },
    { label: 'Fortgeschritten', score: 50 },
    { label: 'Erfahren', score: 75 },
    { label: 'Meisterhaft', score: 95 }
  ];

  return (
    <div className="flex flex-col w-full gap-4 text-slate-100">
      {/* KOPFZEILE: SUCHE, KATEGORIEN & ANSICHTS-UMSCHALTER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Suchleiste */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Fertigkeiten im Katalog filtern..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                title="Filter zurücksetzen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Eigene Fertigkeit hinzufügen */}
          <div className="flex items-center gap-1.5 sm:w-72">
            <input
              type="text"
              value={customSkillInput}
              onChange={e => setCustomSkillInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="Eigene Fertigkeit eintragen..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 transition"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              disabled={!customSkillInput.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shrink-0 cursor-pointer"
              title="Fertigkeit hinzufügen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hinzufügen</span>
            </button>
          </div>

          {/* Ansichtsmodus */}
          <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Katalog</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Textansicht</span>
            </button>
          </div>
        </div>

        {/* Kategorie-Filterleiste */}
        {viewMode === 'visual' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('alle')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer ${
                selectedCategory === 'alle'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              Alle Bereiche ({ALL_EVERYDAY_SKILLS.length})
            </button>

            {skillItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ausgewaehlt')}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer ${
                  selectedCategory === 'ausgewaehlt'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-950/70 text-emerald-400 border-slate-800 hover:border-emerald-800/60'
                }`}
              >
                Ausgewählt ({skillItems.length})
              </button>
            )}

            {EVERYDAY_SKILL_CATEGORIES.map(cat => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer ${
                  selectedCategory === cat.category
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.category} ({cat.skills.length})
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'raw' ? (
        /* REINE TEXTANSICHT */
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Formatierte Daten der Alltagskompetenzen
          </label>
          <AutoExpandingTextarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
          />
        </div>
      ) : (
        /* VISUELLE ÜBERSICHT: KATALOG & GEWÄHLTE STUFEN (OHNE AUSKLAPPEN) */
        <div className="flex flex-col gap-5">
          {/* BEREICH 1: AUSGEWÄHLTE ALLTAGSKOMPETENZEN & STUFEN */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Aktive Alltagskompetenzen ({skillItems.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Stufen von Anfänger bis Meisterhaft
              </span>
            </div>

            {skillItems.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/60 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Noch keine Alltagskompetenzen ausgewählt. Klicke unten auf eine Fertigkeit im Katalog, um sie zu aktivieren.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {skillItems.map((item, idx) => {
                  const categoryName = getCategoryForSkill(item.name);

                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 transition hover:border-slate-700"
                    >
                      {/* Name, Kategorie & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-slate-100 truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                            {item.label} ({item.score}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition cursor-pointer"
                            title={`${item.name} entfernen`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stufenauswahl & Feinjustierung */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center pt-1 border-t border-slate-900">
                        {/* 4 Stufen-Pills */}
                        <div className="lg:col-span-6 grid grid-cols-4 gap-1">
                          {levelPresets.map(preset => {
                            const isSelected = Math.abs(item.score - preset.score) < 13;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleUpdateItem(idx, { score: preset.score })}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border text-center transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Schieberegler & Prozentwert */}
                        <div className="lg:col-span-6 flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={item.score}
                            onChange={e => handleUpdateItem(idx, { score: Number(e.target.value) })}
                            className="w-full accent-amber-500 bg-slate-900 rounded h-1.5 cursor-pointer"
                          />
                          <div className="flex items-center shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.score}
                              onChange={e => handleUpdateItem(idx, { score: Number(e.target.value) })}
                              className="w-14 bg-slate-900 border border-slate-800 rounded-lg py-0.5 px-1.5 text-center text-xs text-amber-300 font-bold outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 ml-1">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Notizfeld */}
                      <div className="pt-0.5">
                        <AutoExpandingTextarea
                          value={item.note || ''}
                          onChange={e => handleUpdateItem(idx, { note: e.target.value })}
                          placeholder="Erfahrungsnotiz oder praktischer Anwendungsbereich (optional)"
                          className="w-full bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/70 transition"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BEREICH 2: KATALOG DER ALLTAGSKOMPETENZEN (DIREKT SICHTBAR) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Katalog der Alltagskompetenzen
              </span>
              <span className="text-[11px] text-slate-400">
                Klicke auf eine Fertigkeit zum Aktivieren oder Deaktivieren
              </span>
            </div>

            {/* Spezielle aktive eigene Fertigkeiten, die nicht in Standard-Presets sind */}
            {customActiveSkills.length > 0 && selectedCategory === 'ausgewaehlt' && (
              <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-800/60">
                <span className="text-[11px] font-bold text-amber-300">
                  Eigene Fertigkeiten:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {customActiveSkills.map(item => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleToggleSkill(item.name)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer bg-amber-500/20 text-amber-300 border-amber-500/50"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.name}</span>
                      <span className="text-[10px] text-amber-400/80 font-normal">
                        ({item.score}%)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredCategories.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/60 text-center text-slate-400 text-xs">
                Keine passenden Fertigkeiten gefunden.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredCategories.map(cat => (
                  <div key={cat.category} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">
                        {cat.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.skills.length} Fertigkeiten
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map(skill => {
                        const activeItem = skillItems.find(item => item.name === skill);
                        const isSelected = !!activeItem;

                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleToggleSkill(skill)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-800/90 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span>{skill}</span>
                            {isSelected && (
                              <span className="text-[10px] text-amber-400/80 font-normal shrink-0">
                                ({activeItem.score}%)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EverydaySkillsSelect;
