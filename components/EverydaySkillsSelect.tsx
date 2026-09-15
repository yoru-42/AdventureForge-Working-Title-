import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Search,
  X,
  SlidersHorizontal,
  FileText,
  Layers,
  Info,
  Zap,
  Dumbbell,
  Award,
  Lock,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EVERYDAY_SKILL_CATEGORIES, ALL_EVERYDAY_SKILLS } from './everydaySkillPresets';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export type EverydayProgressionRule = 'ep' | 'training' | 'milestone' | 'static';

interface EverydaySkillsSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  progressionLogic?: EverydayProgressionRule;
  onProgressionLogicChange?: (logic: EverydayProgressionRule) => void;
}

export interface EverydaySkillItem {
  name: string;
  score: number; // 0 - 100
  label: string; // 'Anfänger', 'Fortgeschritten', 'Erfahren', 'Meisterhaft'
  xp?: number; // 0 - 100 for 'ep'
  trainingUnits?: number; // 0 - 4 for 'training'
  milestoneNote?: string; // Story event / exam for 'milestone'
  points?: number; // 1 - 4 for 'static'
  note?: string; // General practical notes
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
      return { name: part.trim(), score: 0, label: 'Anfänger', xp: 0, trainingUnits: 0, points: 0 };
    }
    const name = match[1].trim();
    const details = match[2] ? match[2].trim() : '';

    let score = 0;
    let note = '';
    let xp = 0;
    let trainingUnits = 0;
    let milestoneNote = '';
    let points = 0;

    if (details) {
      const scoreMatch = details.match(/(\d+)%/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
      } else if (details.toLowerCase().includes('meisterhaft') || details.toLowerCase().includes('perfektioniert')) {
        score = 95;
      } else if (details.toLowerCase().includes('erfahren') || details.toLowerCase().includes('routine')) {
        score = 75;
      } else if (details.toLowerCase().includes('fortgeschritten')) {
        score = 50;
      } else if (details.toLowerCase().includes('anfänger') || details.toLowerCase().includes('grundkenntnisse')) {
        score = 0;
      }

      const xpMatch = details.match(/EP:\s*(\d+)/i);
      if (xpMatch) {
        xp = parseInt(xpMatch[1], 10);
      }

      const trainingMatch = details.match(/(?:Übungen|Training|Einheiten):\s*(\d+)/i);
      if (trainingMatch) {
        trainingUnits = parseInt(trainingMatch[1], 10);
      }

      const milestoneMatch = details.match(/(?:Meilenstein|Milestone):\s*([^|)]+)/i);
      if (milestoneMatch) {
        milestoneNote = milestoneMatch[1].trim();
      }

      const pointsMatch = details.match(/(?:Punkte|Pkt|TP):\s*(\d+)/i);
      if (pointsMatch) {
        points = parseInt(pointsMatch[1], 10);
      } else {
        points = score === 0 ? 0 : score <= 25 ? 1 : score <= 55 ? 2 : score <= 80 ? 3 : 4;
      }

      const noteMatch = details.match(/(?:Note|Notiz|Hinweis|Praxis):\s*([^|)]+)/i);
      if (noteMatch) {
        note = noteMatch[1].trim();
      }
    } else {
      points = score === 0 ? 0 : score <= 25 ? 1 : score <= 55 ? 2 : score <= 80 ? 3 : 4;
    }

    const label = getSkillLabel(score);
    return { name, score, label, note, xp, trainingUnits, milestoneNote, points };
  });
}

export function serializeEverydaySkills(items: EverydaySkillItem[]): string {
  return items.map(item => {
    const label = getSkillLabel(item.score);
    const segments: string[] = [`${label} - ${item.score}%`];
    if (item.xp !== undefined && item.xp > 0) {
      segments.push(`EP: ${item.xp}/100`);
    }
    if (item.trainingUnits !== undefined && item.trainingUnits > 0) {
      segments.push(`Übungen: ${item.trainingUnits}/4`);
    }
    if (item.milestoneNote && item.milestoneNote.trim()) {
      segments.push(`Meilenstein: ${item.milestoneNote.trim()}`);
    }
    if (item.points !== undefined && item.points > 0) {
      segments.push(`Punkte: ${item.points}`);
    }
    if (item.note && item.note.trim()) {
      segments.push(`Note: ${item.note.trim()}`);
    }
    return `${item.name} (${segments.join(' | ')})`;
  }).join(', ');
}

const LEVEL_PRESETS = [
  { label: 'Anfänger', score: 0, tier: 0 },
  { label: 'Anfänger', score: 25, tier: 1 },
  { label: 'Fortgeschritten', score: 50, tier: 2 },
  { label: 'Erfahren', score: 75, tier: 3 },
  { label: 'Meisterhaft', score: 95, tier: 4 }
];

const PROGRESSION_RULE_DETAILS: Record<EverydayProgressionRule, {
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  ep: {
    label: 'EP-basiert (Kampf)',
    badge: 'Erfahrungspunkte',
    description: 'Erfahrungspunkte (XP) werden durch Aktionen gesammelt. Genau 100 EP für einen Stufenaufstieg.',
    icon: Zap
  },
  training: {
    label: 'Training & Übung',
    badge: 'Praxis & Routine',
    description: 'Dieser Wert steigt durch praktische Übungseinheiten, Routine und gezielte Anwendung im Alltag.',
    icon: Dumbbell
  },
  milestone: {
    label: 'Story-Meilensteine',
    badge: 'Meilensteine & Prüfungen',
    description: 'Dieser Wert steigt nur nach dem Erreichen von bedeutenden Story-Meilensteinen oder bestandenen Meisterprüfungen.',
    icon: Award
  },
  static: {
    label: 'Statisch',
    badge: 'Feste Veranlagung',
    description: 'Manuelle Verteilung über Talentpunkte oder Gold. Dieser Wert stellt die feste Grenze des Charakters dar.',
    icon: Lock
  }
};

export const EverydaySkillsSelect: React.FC<EverydaySkillsSelectProps> = ({
  value,
  onChange,
  placeholder = "Alltagskompetenzen und praktische Fertigkeiten im Alltag",
  className = "bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-sky-500 transition shadow-inner min-h-[60px]",
  progressionLogic = 'ep'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');
  const [expandedSkillsMap, setExpandedSkillsMap] = useState<Record<string, boolean>>({});

  // Active progression logic (governed by Step 2)
  const activeLogic: EverydayProgressionRule = progressionLogic || 'ep';
  const activeRuleConfig = PROGRESSION_RULE_DETAILS[activeLogic];
  const ActiveRuleIcon = activeRuleConfig.icon;

  const skillItems = useMemo(() => parseEverydaySkills(value), [value]);
  const activeSkillNames = useMemo(() => skillItems.map(item => item.name), [skillItems]);

  const toggleSkillExpanded = (skillName: string) => {
    setExpandedSkillsMap(prev => ({
      ...prev,
      [skillName]: !prev[skillName]
    }));
  };

  const handleToggleSkill = (skillName: string) => {
    if (activeSkillNames.includes(skillName)) {
      const updated = skillItems.filter(item => item.name !== skillName);
      onChange(serializeEverydaySkills(updated));
      setExpandedSkillsMap(prev => {
        const next = { ...prev };
        delete next[skillName];
        return next;
      });
    } else {
      const updated = [
        ...skillItems,
        {
          name: skillName,
          score: 0,
          label: 'Anfänger',
          xp: 0,
          trainingUnits: 0,
          points: 0,
          note: ''
        }
      ];
      onChange(serializeEverydaySkills(updated));
      setExpandedSkillsMap(prev => ({ ...prev, [skillName]: true }));
    }
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
      {
        name: trimmed,
        score: 0,
        label: 'Anfänger',
        xp: 0,
        trainingUnits: 0,
        points: 0,
        note: ''
      }
    ];
    onChange(serializeEverydaySkills(updated));
    setExpandedSkillsMap(prev => ({ ...prev, [trimmed]: true }));
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
    const skillName = skillItems[index]?.name;
    const list = skillItems.filter((_, i) => i !== index);
    onChange(serializeEverydaySkills(list));
    if (skillName) {
      setExpandedSkillsMap(prev => {
        const next = { ...prev };
        delete next[skillName];
        return next;
      });
    }
  };

  // Steigerungs-Hilfsfunktionen für EP-basiert
  const handleAddXp = (index: number, amount: number) => {
    const list = [...skillItems];
    const item = list[index];
    const currentXp = item.xp || 0;
    const newXp = currentXp + amount;

    if (newXp >= 100 && item.score < 95) {
      const nextScore = item.score < 20 ? 25 : item.score < 40 ? 50 : item.score < 65 ? 75 : 95;
      list[index] = {
        ...item,
        score: nextScore,
        label: getSkillLabel(nextScore),
        xp: Math.max(0, newXp - 100)
      };
    } else {
      list[index] = {
        ...item,
        xp: Math.min(100, newXp)
      };
    }
    onChange(serializeEverydaySkills(list));
  };

  const handleTriggerLevelUp = (index: number) => {
    const list = [...skillItems];
    const item = list[index];
    const nextScore = item.score < 20 ? 25 : item.score < 40 ? 50 : item.score < 65 ? 75 : 95;
    list[index] = {
      ...item,
      score: nextScore,
      label: getSkillLabel(nextScore),
      xp: Math.max(0, (item.xp || 0) - 100)
    };
    onChange(serializeEverydaySkills(list));
  };

  // Steigerungs-Hilfsfunktionen für Training & Übung
  const handleAddTraining = (index: number, units: number) => {
    const list = [...skillItems];
    const item = list[index];
    const currentUnits = item.trainingUnits || 0;
    const newUnits = currentUnits + units;

    if (newUnits >= 4 && item.score < 95) {
      const nextScore = item.score < 20 ? 25 : item.score < 40 ? 50 : item.score < 65 ? 75 : 95;
      list[index] = {
        ...item,
        score: nextScore,
        label: getSkillLabel(nextScore),
        trainingUnits: 0
      };
    } else {
      list[index] = {
        ...item,
        trainingUnits: Math.min(4, newUnits)
      };
    }
    onChange(serializeEverydaySkills(list));
  };

  const handleCompleteTrainingRoutine = (index: number) => {
    const list = [...skillItems];
    const item = list[index];
    const nextScore = item.score < 20 ? 25 : item.score < 40 ? 50 : item.score < 65 ? 75 : 95;
    list[index] = {
      ...item,
      score: nextScore,
      label: getSkillLabel(nextScore),
      trainingUnits: 0
    };
    onChange(serializeEverydaySkills(list));
  };

  // Steigerungs-Hilfsfunktionen für Story-Meilensteine
  const handleMilestoneAdvance = (index: number) => {
    const list = [...skillItems];
    const item = list[index];
    const nextScore = item.score < 20 ? 25 : item.score < 40 ? 50 : item.score < 65 ? 75 : 95;
    list[index] = {
      ...item,
      score: nextScore,
      label: getSkillLabel(nextScore)
    };
    onChange(serializeEverydaySkills(list));
  };

  const handleMilestoneDemote = (index: number) => {
    const list = [...skillItems];
    const item = list[index];
    const prevScore = item.score > 85 ? 75 : item.score > 60 ? 50 : item.score > 20 ? 25 : 0;
    list[index] = {
      ...item,
      score: prevScore,
      label: getSkillLabel(prevScore)
    };
    onChange(serializeEverydaySkills(list));
  };

  // Steigerungs-Hilfsfunktionen für Statisch (Talentpunkte)
  const handleSetPoints = (index: number, points: number) => {
    const list = [...skillItems];
    const item = list[index];
    const scoreMap: Record<number, number> = { 0: 0, 1: 25, 2: 50, 3: 75, 4: 95 };
    const score = scoreMap[points] ?? 0;
    list[index] = {
      ...item,
      points,
      score,
      label: getSkillLabel(score)
    };
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

  // Helper to render an active skill card with progression controls
  const renderActiveSkillCard = (item: EverydaySkillItem) => {
    const realIndex = skillItems.findIndex(s => s.name === item.name);
    if (realIndex === -1) return null;

    const isExpanded = !!expandedSkillsMap[item.name];
    const categoryName = getCategoryForSkill(item.name);

    return (
      <div
        key={item.name}
        className={`bg-slate-950 border rounded-xl transition duration-150 flex flex-col ${
          isExpanded ? 'border-sky-500/50 shadow-sm' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Header-Zeile des Eintrags */}
        <div className="p-3 flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none min-w-0"
            onClick={() => toggleSkillExpanded(item.name)}
          >
            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm font-semibold text-slate-100 truncate">
              {item.name}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline shrink-0">
              {categoryName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Stufen- & Prozent-Badge */}
            <span className="text-xs font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              {item.label} ({item.score}%)
            </span>

            {/* Spezifisches Regel-Badge */}
            {activeLogic === 'ep' && (
              <span className="text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hidden md:inline">
                {item.xp || 0}/100 EP
              </span>
            )}
            {activeLogic === 'training' && (
              <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hidden md:inline">
                {item.trainingUnits || 0}/4 Übungen
              </span>
            )}
            {activeLogic === 'milestone' && (
              <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hidden md:inline">
                Stufe {item.score <= 25 ? 1 : item.score <= 55 ? 2 : item.score <= 80 ? 3 : 4}
              </span>
            )}
            {activeLogic === 'static' && (
              <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hidden md:inline">
                {item.points || 2} Pkt
              </span>
            )}

            {/* Aufklappen / Einklappen Button */}
            <button
              type="button"
              onClick={() => toggleSkillExpanded(item.name)}
              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center gap-1 ${
                isExpanded
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title={isExpanded ? 'Details einklappen' : 'Details & Steigerung aufklappen'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Entfernen Button */}
            <button
              type="button"
              onClick={() => handleRemoveItem(realIndex)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800/80 hover:border-rose-900/40 transition cursor-pointer"
              title={`${item.name} deaktivieren`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Aufgeklappter Bereich: Progression, Feinjustierung & Notiz */}
        {isExpanded && (
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/40 flex flex-col gap-3">
            {/* SPEZIFISCHER PROGRESSIONS-STEIGERUNGSBEREICH */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
              {/* FALL A: EP-BASIERT */}
              {activeLogic === 'ep' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span>Erfahrungspunkte (EP)</span>
                    </div>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {item.xp || 0} / 100 EP bis zum nächsten Stufenaufstieg
                    </span>
                  </div>

                  {/* EP-Fortschrittsbalken */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-sky-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, item.xp || 0)}%` }}
                    />
                  </div>

                  {/* Steigerungs-Aktionen */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddXp(realIndex, 10)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        +10 EP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddXp(realIndex, 25)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        +25 EP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddXp(realIndex, 50)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        +50 EP
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-xs text-slate-400 gap-1">
                        <span>EP:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.xp || 0}
                          onChange={e => handleUpdateItem(realIndex, { xp: Math.max(0, Math.min(100, Number(e.target.value))) })}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-sky-300 font-mono text-xs outline-none focus:border-sky-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTriggerLevelUp(realIndex)}
                        disabled={item.score >= 95}
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          (item.xp || 0) >= 100
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                            : 'bg-sky-950/80 text-sky-300 border border-sky-800/80 hover:bg-sky-900/60'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Stufenaufstieg</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FALL B: TRAINING & ÜBUNG */}
              {activeLogic === 'training' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300">
                      <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
                      <span>Training & Praktische Übungen</span>
                    </div>
                    <span className="text-slate-300 text-[11px]">
                      {item.trainingUnits || 0} von 4 Übungseinheiten absolviert
                    </span>
                  </div>

                  {/* 4-Stufen Fortschritts-Segmente */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map(step => {
                      const isDone = (item.trainingUnits || 0) >= step;
                      return (
                        <div
                          key={step}
                          className={`h-2 rounded transition-all ${
                            isDone ? 'bg-sky-500 shadow-sm' : 'bg-slate-950 border border-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Aktionen zur Übung & Routine */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddTraining(realIndex, 1)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        +1 Praxisanwendung
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddTraining(realIndex, 2)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        +2 Intensive Übung
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteTrainingRoutine(realIndex)}
                      disabled={item.score >= 95}
                      className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        (item.trainingUnits || 0) >= 4
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                          : 'bg-sky-950/80 text-sky-300 border border-sky-800/80 hover:bg-sky-900/60'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Routine meistern (Stufe steigern)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* FALL C: STORY-MEILENSTEINE */}
              {activeLogic === 'milestone' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300">
                      <Award className="w-3.5 h-3.5 text-sky-400" />
                      <span>Story-Meilensteine & Prüfungen</span>
                    </div>
                    <span className="text-slate-300 text-[11px]">
                      Aktuelle Stufe: {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    {LEVEL_PRESETS.map((lvl, lIdx) => {
                      const isCurrent = (
                        lvl.score === 0 ? item.score === 0 :
                        lvl.score === 25 ? item.score > 0 && item.score <= 35 :
                        lvl.score === 50 ? item.score > 35 && item.score <= 62 :
                        lvl.score === 75 ? item.score > 62 && item.score <= 85 :
                        item.score > 85
                      );
                      return (
                        <div
                          key={`${lvl.label}-${lvl.score}`}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-medium border transition ${
                            isCurrent
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {lvl.score === 0 ? 'Basis (0%)' : `Stufe ${lIdx}: ${lvl.label} (${lvl.score}%)`}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMilestoneAdvance(realIndex)}
                        disabled={item.score >= 95}
                        className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Meilenstein bestätigen (Stufe steigern)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMilestoneDemote(realIndex)}
                        disabled={item.score <= 0}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Stufe verringern
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <AutoExpandingTextarea
                      value={item.milestoneNote || ''}
                      onChange={e => handleUpdateItem(realIndex, { milestoneNote: e.target.value })}
                      placeholder="Erreichter Story-Meilenstein, Lehrmeisterabschluss oder bestandene Prüfung"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* FALL D: STATISCH (TALENTPUNKTE) */}
              {activeLogic === 'static' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300">
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      <span>Statische Talentpunkte & Feste Grenze</span>
                    </div>
                    <span className="text-slate-300 text-[11px]">
                      Investierte Punkte: {item.points !== undefined ? item.points : (item.score === 0 ? 0 : item.score <= 25 ? 1 : item.score <= 55 ? 2 : item.score <= 80 ? 3 : 4)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
                    {[
                      { pts: 0, name: 'Anfänger (0%)' },
                      { pts: 1, name: 'Anfänger (25%)' },
                      { pts: 2, name: 'Fortgeschritten (50%)' },
                      { pts: 3, name: 'Erfahren (75%)' },
                      { pts: 4, name: 'Meisterhaft (95%)' }
                    ].map(p => {
                      const currentPts = item.points !== undefined ? item.points : (item.score === 0 ? 0 : item.score <= 25 ? 1 : item.score <= 55 ? 2 : item.score <= 80 ? 3 : 4);
                      const isSelected = currentPts === p.pts;

                      return (
                        <button
                          key={p.pts}
                          type="button"
                          onClick={() => handleSetPoints(realIndex, p.pts)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {p.pts} Pkt: {p.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                    Unveränderlicher Wert: Diese Fertigkeit stellt eine feste Veranlagung dar und steigt nicht durch EP oder Übung.
                  </div>
                </div>
              )}
            </div>

            {/* MANUELLE FEINABSTIMMUNG & SCHIEBEREGLER */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Manuelle Beherrschung & Feinabstimmung:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.score}
                    onChange={e => handleUpdateItem(realIndex, { score: Number(e.target.value) })}
                    className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-sky-300 font-bold text-xs outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={item.score}
                onChange={e => handleUpdateItem(realIndex, { score: Number(e.target.value) || 0 })}
                onInput={e => handleUpdateItem(realIndex, { score: Number((e.target as HTMLInputElement).value) || 0 })}
                className="w-full accent-sky-500 bg-slate-950 rounded h-2 cursor-pointer"
              />

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-0.5">
                {LEVEL_PRESETS.map(preset => {
                  const isSelected = (
                    preset.score === 0 ? item.score === 0 :
                    preset.score === 25 ? item.score > 0 && item.score <= 35 :
                    preset.score === 50 ? item.score > 35 && item.score <= 62 :
                    preset.score === 75 ? item.score > 62 && item.score <= 85 :
                    item.score > 85
                  );
                  return (
                    <button
                      key={`${preset.label}-${preset.score}`}
                      type="button"
                      onClick={() => handleUpdateItem(realIndex, { score: preset.score })}
                      className={`py-1 rounded text-[10px] border transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset.label} ({preset.score}%)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NOTIZFELD */}
            <div>
              <AutoExpandingTextarea
                value={item.note || ''}
                onChange={e => handleUpdateItem(realIndex, { note: e.target.value })}
                placeholder={
                  activeLogic === 'ep'
                    ? "Erfahrungsnotiz oder praktischer Einsatz im Abenteuer (optional)"
                    : activeLogic === 'training'
                    ? "Dokumentierte Praxisanwendung oder Trainingsinhalt im Abenteuer (optional)"
                    : activeLogic === 'milestone'
                    ? "Begründung oder Kontext des Meilensteins (optional)"
                    : "Herkunft oder Grund der festen Veranlagung (optional)"
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-3 text-slate-100">
      {/* EINHEITLICHES FELD FÜR ALLTAGSKOMPETENZEN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3.5 shadow-sm">
        {/* 1. KOPFZEILE: SUCHE, EIGENE FERTIGKEIT & ANSICHT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Suchleiste */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Fertigkeiten filtern..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500 transition"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500 transition"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              disabled={!customSkillInput.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shrink-0 cursor-pointer"
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
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
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
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Textansicht</span>
            </button>
          </div>
        </div>

        {/* 2. KATEGORIE-FILTERLEISTE */}
        {viewMode === 'visual' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('alle')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer ${
                selectedCategory === 'alle'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              Alle Bereiche ({ALL_EVERYDAY_SKILLS.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('ausgewaehlt')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'ausgewaehlt'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Check className="w-3 h-3 text-sky-400" />
              <span>Ausgewählt ({skillItems.length})</span>
            </button>

            {EVERYDAY_SKILL_CATEGORIES.map(cat => {
              const activeCountInCategory = cat.skills.filter(s => activeSkillNames.includes(s)).length;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                    selectedCategory === cat.category
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    activeCountInCategory > 0
                      ? 'bg-sky-500/30 text-sky-200 font-bold'
                      : 'bg-slate-900 text-slate-500'
                  }`}>
                    {activeCountInCategory > 0 ? `${activeCountInCategory}/${cat.skills.length}` : cat.skills.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. KOMPAKTER STATUS-BALKEN (KAMPAGNENREGEL & AKTIVE ANZAHL) */}
        {viewMode === 'visual' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ActiveRuleIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                Regel: <strong className="text-sky-300 font-semibold">{activeRuleConfig.label}</strong>
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {skillItems.length} {skillItems.length === 1 ? 'Fertigkeit' : 'Fertigkeiten'} ausgewählt
            </span>
          </div>
        )}

        {/* 4. TEXTANSICHT (RAW TEXT) */}
        {viewMode === 'raw' && (
          <div className="flex flex-col gap-2">
            <AutoExpandingTextarea
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className={className}
            />
            <span className="text-[11px] text-slate-400">
              Format: Fertigkeitsname (Beherrschung - Prozent% | EP: X/100 | Übungen: X/4 | Meilenstein: Text | Note: Notiz)
            </span>
          </div>
        )}

        {/* 5. GEMEINSAMES KATALOG- & AKTIV-FELD (ALLES AUF EINEN BLICK) */}
        {viewMode === 'visual' && (
          <div className="flex flex-col gap-4">
            {/* FALL: NUR AUSGEWÄHLTE FILTER-ANSICHT */}
            {selectedCategory === 'ausgewaehlt' ? (
              <div className="flex flex-col gap-3">
                {skillItems.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Info className="w-5 h-5 text-slate-500" />
                    <span>Noch keine Alltagskompetenzen ausgewählt. Klicke oben auf &quot;Alle Bereiche&quot; oder wähle eine Kategorie, um Fertigkeiten hinzuzufügen.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {skillItems.map(item => renderActiveSkillCard(item))}
                  </div>
                )}
              </div>
            ) : (
              /* FALL: KATALOG MIT INTEGRIERTEN AKTIVEN FERTIGKEITEN */
              <div className="flex flex-col gap-4">
                {/* EIGENE FERTIGKEITEN (WENN VORHANDEN) */}
                {customActiveSkills.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Eigene Fertigkeiten
                      </span>
                      <span className="text-[10px] text-sky-400/90 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                        {customActiveSkills.length} aktiv
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {customActiveSkills.map(item => renderActiveSkillCard(item))}
                    </div>
                  </div>
                )}

                {filteredCategories.length === 0 && customActiveSkills.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-400 text-xs">
                    Keine passenden Fertigkeiten gefunden.
                  </div>
                ) : (
                  filteredCategories.map(cat => {
                    const activeInCategory = skillItems.filter(item => cat.skills.includes(item.name));
                    const availableInCategory = cat.skills.filter(s => !activeSkillNames.includes(s));

                    return (
                      <div
                        key={cat.category}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-3"
                      >
                        {/* Kategorie Kopfzeile */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-xs font-bold text-slate-200">
                            {cat.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {activeInCategory.length > 0 ? (
                              <span className="text-sky-300 font-semibold">{activeInCategory.length} ausgewählt / {cat.skills.length} gesamt</span>
                            ) : (
                              <span>{cat.skills.length} Fertigkeiten</span>
                            )}
                          </span>
                        </div>

                        {/* Aktive Fertigkeiten in dieser Kategorie */}
                        {activeInCategory.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                              Aktive Fertigkeiten ({activeInCategory.length}):
                            </span>
                            <div className="grid grid-cols-1 gap-2.5">
                              {activeInCategory.map(item => renderActiveSkillCard(item))}
                            </div>
                          </div>
                        )}

                        {/* Verfügbare Fertigkeiten zum Hinzufügen */}
                        {availableInCategory.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {activeInCategory.length > 0 && (
                              <span className="text-[11px] font-medium text-slate-400 pt-1">
                                Verfügbar zum Hinzufügen ({availableInCategory.length}):
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {availableInCategory.map(skill => (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => handleToggleSkill(skill)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 text-slate-300 border border-slate-800/90 hover:border-sky-500/60 hover:text-white transition flex items-center gap-1.5 cursor-pointer group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
                                  <span>{skill}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EverydaySkillsSelect;
