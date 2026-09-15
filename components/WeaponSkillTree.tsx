import React, { useState, useMemo } from 'react';
import {
  WeaponTypeDefinition,
  WEAPON_CATEGORIES,
  ALL_WEAPONS,
  WIELDING_STYLES,
  getWeaponById,
  findWeaponByName
} from '../lib/weaponTypesData';
import { TechniqueItem, BaseAbility, CharacterPowerSource } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  Check,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  FileText,
  Sparkles,
  Swords,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  Dumbbell,
  Award,
  Lock
} from 'lucide-react';

export interface WeaponSkillTreeProps {
  techniques: TechniqueItem[];
  activeBaseAbility: BaseAbility | null;
  baseAbilities: BaseAbility[];
  activePowerSource?: CharacterPowerSource | null;
  onUpdateEntry: (id: string, updates: Partial<TechniqueItem>) => void;
  onAddEntry: (newEntry?: Partial<TechniqueItem>) => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  onOpenSmartFill?: () => void;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
}

export const LEVEL_PRESETS = [
  { label: 'Anfänger', score: 0 },
  { label: 'Anfänger', score: 25 },
  { label: 'Fortgeschritten', score: 50 },
  { label: 'Erfahren', score: 75 },
  { label: 'Meisterhaft', score: 95 }
];

export function getWeaponLabel(score: number): string {
  if (score <= 25) return 'Anfänger';
  if (score <= 55) return 'Fortgeschritten';
  if (score <= 80) return 'Erfahren';
  return 'Meisterhaft';
}

export const WeaponSkillTree: React.FC<WeaponSkillTreeProps> = ({
  techniques = [],
  activeBaseAbility,
  baseAbilities = [],
  activePowerSource,
  onUpdateEntry,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  onOpenSmartFill,
  progressionLogic = 'ep'
}) => {
  // Alle aktiven Waffenbeherrschungen des Charakters
  const weaponEntries = useMemo(() => {
    return techniques.filter(t => t.category === 'Waffenbeherrschung');
  }, [techniques]);

  // Suchfilter & Kategorie
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [customWeaponInput, setCustomWeaponInput] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');

  // Ausklapp-Status der aktiven Waffenkarten
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (weaponEntries.length > 0) {
      initial[weaponEntries[0].id] = true;
    }
    return initial;
  });

  const toggleSkillExpanded = (id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Hilfsfunktion: Waffendefinition aus Katalog ermitteln
  const getWeaponDefForEntry = (entry: TechniqueItem): WeaponTypeDefinition => {
    if (entry.weaponType) {
      const byId = getWeaponById(entry.weaponType);
      if (byId) return byId;
      const byName = findWeaponByName(entry.weaponType);
      if (byName) return byName;
    }
    const cleanName = entry.name.replace(/\s*\(Rang \d+\)/i, '').replace(/\s*\([^)]*\)/, '').trim();
    const byClean = findWeaponByName(cleanName);
    if (byClean) return byClean;

    return {
      id: entry.id,
      name: cleanName || entry.name || 'Waffe',
      categoryId: 'custom',
      categoryName: entry.weaponCategory || 'Waffen',
      damageTypes: entry.effects && entry.effects.length > 0 ? entry.effects : ['Schnitt', 'Stich'],
      wieldingStyles: [entry.wieldingStyle || 'Einhand'],
      rangeCategory: (entry.range === 'Fernkampf' ? 'Fernkampf' : entry.range === 'Stangenreichweite' ? 'Stangenreichweite' : entry.range === 'Defensiv' ? 'Defensiv' : 'Nahkampf'),
      description: entry.description || `Beherrschung und Kampfführung mit ${cleanName}.`,
      maneuvers: ['Grundangriff', 'Parade']
    };
  };

  // Schnelles Hinzufügen einer Waffe aus dem Katalog
  const handleAddWeaponFromCatalog = (wDef: WeaponTypeDefinition) => {
    if (readOnly) return;
    const newId = `weapon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: Partial<TechniqueItem> = {
      id: newId,
      name: wDef.name,
      category: 'Waffenbeherrschung',
      type: 'Angriff',
      weaponType: wDef.id,
      weaponCategory: wDef.categoryName,
      masteryLevel: 'Anfänger (0%)',
      tier: 'Rang 1',
      level: 1,
      trainingProgress: 0,
      xp: 0,
      wieldingStyle: wDef.wieldingStyles[0] || 'Einhand',
      effects: wDef.damageTypes,
      range: wDef.rangeCategory,
      description: wDef.description,
      baseAbilityIds: activeBaseAbility ? [activeBaseAbility.id] : [],
      baseAbilityNames: activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name || ''] : []
    };
    onAddEntry(newEntry);
    setExpandedMap(prev => ({ ...prev, [newId]: true }));
  };

  // Eigene Waffe hinzufügen
  const handleAddCustomWeapon = () => {
    const trimmed = customWeaponInput.trim();
    if (!trimmed || readOnly) return;

    const newId = `weapon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: Partial<TechniqueItem> = {
      id: newId,
      name: trimmed,
      category: 'Waffenbeherrschung',
      type: 'Angriff',
      weaponCategory: 'Eigene Waffen',
      masteryLevel: 'Anfänger (0%)',
      tier: 'Rang 1',
      level: 1,
      trainingProgress: 0,
      xp: 0,
      wieldingStyle: 'Einhand',
      effects: ['Schnitt'],
      range: 'Nahkampf',
      description: '',
      baseAbilityIds: activeBaseAbility ? [activeBaseAbility.id] : [],
      baseAbilityNames: activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name || ''] : []
    };
    onAddEntry(newEntry);
    setExpandedMap(prev => ({ ...prev, [newId]: true }));
    setCustomWeaponInput('');
  };

  // EP anpassen
  const handleAddXp = (entry: TechniqueItem, amount: number) => {
    if (readOnly) return;
    const currentXp = entry.xp || 0;
    const nextXp = Math.min(100, currentXp + amount);
    onUpdateEntry(entry.id, { xp: nextXp });
  };

  const handleSetXp = (entry: TechniqueItem, xpVal: number) => {
    if (readOnly) return;
    onUpdateEntry(entry.id, { xp: Math.max(0, Math.min(100, xpVal)) });
  };

  // Stufenaufstieg
  const handleTriggerLevelUp = (entry: TechniqueItem) => {
    if (readOnly) return;
    const currentScore = entry.trainingProgress !== undefined ? entry.trainingProgress : (entry.score !== undefined ? entry.score : 0);
    let nextScore = 25;
    if (currentScore < 25) nextScore = 25;
    else if (currentScore < 50) nextScore = 50;
    else if (currentScore < 75) nextScore = 75;
    else if (currentScore < 95) nextScore = 95;
    else nextScore = 100;

    const nextRank = nextScore <= 25 ? 1 : nextScore <= 55 ? 2 : nextScore <= 80 ? 3 : 4;
    const label = getWeaponLabel(nextScore);

    onUpdateEntry(entry.id, {
      trainingProgress: nextScore,
      score: nextScore,
      xp: 0,
      level: nextRank,
      tier: `Rang ${nextRank}`,
      masteryLevel: `${label} (${nextScore}%)`
    });
  };

  // Manuelle Beherrschung anpassen
  const handleUpdateScore = (entry: TechniqueItem, scoreVal: number) => {
    if (readOnly) return;
    const cleanScore = Math.max(0, Math.min(100, scoreVal));
    const label = getWeaponLabel(cleanScore);
    const rank = cleanScore <= 25 ? 1 : cleanScore <= 55 ? 2 : cleanScore <= 80 ? 3 : 4;
    onUpdateEntry(entry.id, {
      trainingProgress: cleanScore,
      score: cleanScore,
      level: rank,
      tier: `Rang ${rank}`,
      masteryLevel: `${label} (${cleanScore}%)`
    });
  };

  // Training & Übung
  const handleAddTraining = (entry: TechniqueItem, amount: number) => {
    if (readOnly) return;
    const currentUnits = entry.trainingUnits || 0;
    onUpdateEntry(entry.id, { trainingUnits: Math.min(4, currentUnits + amount) });
  };

  const handleCompleteRoutine = (entry: TechniqueItem) => {
    if (readOnly) return;
    const currentScore = entry.trainingProgress !== undefined ? entry.trainingProgress : (entry.score !== undefined ? entry.score : 0);
    const nextScore = Math.min(95, currentScore + 25);
    const label = getWeaponLabel(nextScore);
    const rank = nextScore <= 25 ? 1 : nextScore <= 55 ? 2 : nextScore <= 80 ? 3 : 4;
    onUpdateEntry(entry.id, {
      trainingUnits: 0,
      trainingProgress: nextScore,
      score: nextScore,
      level: rank,
      tier: `Rang ${rank}`,
      masteryLevel: `${label} (${nextScore}%)`
    });
  };

  // Meilenstein Steigerung & Verringerung
  const handleMilestoneAdvance = (entry: TechniqueItem) => {
    if (readOnly) return;
    const currentScore = entry.trainingProgress !== undefined ? entry.trainingProgress : (entry.score !== undefined ? entry.score : 0);
    const nextScore = Math.min(95, currentScore + 25);
    const label = getWeaponLabel(nextScore);
    const rank = nextScore <= 25 ? 1 : nextScore <= 55 ? 2 : nextScore <= 80 ? 3 : 4;
    onUpdateEntry(entry.id, {
      trainingProgress: nextScore,
      score: nextScore,
      level: rank,
      tier: `Rang ${rank}`,
      masteryLevel: `${label} (${nextScore}%)`
    });
  };

  const handleMilestoneDemote = (entry: TechniqueItem) => {
    if (readOnly) return;
    const currentScore = entry.trainingProgress !== undefined ? entry.trainingProgress : (entry.score !== undefined ? entry.score : 0);
    const prevScore = Math.max(0, currentScore - 25);
    const label = getWeaponLabel(prevScore);
    const rank = prevScore <= 25 ? 1 : prevScore <= 55 ? 2 : prevScore <= 80 ? 3 : 4;
    onUpdateEntry(entry.id, {
      trainingProgress: prevScore,
      score: prevScore,
      level: rank,
      tier: `Rang ${rank}`,
      masteryLevel: `${label} (${prevScore}%)`
    });
  };

  // Statische Talentpunkte
  const handleSetPoints = (entry: TechniqueItem, pts: number) => {
    if (readOnly) return;
    const scoreMap: Record<number, number> = { 0: 0, 1: 25, 2: 50, 3: 75, 4: 95 };
    const nextScore = scoreMap[pts] !== undefined ? scoreMap[pts] : 0;
    const label = getWeaponLabel(nextScore);
    const rank = nextScore <= 25 ? 1 : nextScore <= 55 ? 2 : nextScore <= 80 ? 3 : 4;
    onUpdateEntry(entry.id, {
      points: pts,
      trainingProgress: nextScore,
      score: nextScore,
      level: rank,
      tier: `Rang ${rank}`,
      masteryLevel: `${label} (${nextScore}%)`
    });
  };

  // Formatierter Text für die Textansicht (Raw Mode)
  const rawTextOverview = useMemo(() => {
    if (weaponEntries.length === 0) return 'Keine aktiven Waffenbeherrschungen angelegt.';
    return weaponEntries.map(w => {
      const wDef = getWeaponDefForEntry(w);
      const score = w.trainingProgress !== undefined ? w.trainingProgress : 0;
      const label = getWeaponLabel(score);
      const effects = (w.effects || wDef.damageTypes || []).join('/');
      return `${w.name.replace(/\s*\(Rang \d+\)/i, '').trim()} (${label} - ${score}% | ${w.xp || 0}/100 EP | Stil: ${w.wieldingStyle || 'Einhand'} | Schaden: ${effects}${w.description ? ` | ${w.description}` : ''})`;
    }).join('\n');
  }, [weaponEntries]);

  // Gefilterte Kategorien und verfügbare Waffen
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return WEAPON_CATEGORIES.map(cat => {
      if (selectedCategory !== 'alle' && selectedCategory !== 'ausgewaehlt' && cat.id !== selectedCategory) {
        return null;
      }

      const allCatWeapons = ALL_WEAPONS.filter(w => w.categoryId === cat.id);
      const matchingWeapons = allCatWeapons.filter(w => {
        if (!q) return true;
        return (
          w.name.toLowerCase().includes(q) ||
          w.categoryName.toLowerCase().includes(q) ||
          w.damageTypes.some(d => d.toLowerCase().includes(q))
        );
      });

      return {
        ...cat,
        weapons: matchingWeapons
      };
    }).filter(Boolean) as (typeof WEAPON_CATEGORIES[0] & { weapons: WeaponTypeDefinition[] })[];
  }, [searchQuery, selectedCategory]);

  // Aktive Waffen Namen
  const activeWeaponNames = useMemo(() => {
    return weaponEntries.map(w => {
      const clean = w.name.replace(/\s*\(Rang \d+\)/i, '').replace(/\s*\([^)]*\)/, '').trim().toLowerCase();
      return clean;
    });
  }, [weaponEntries]);

  // Rendern einer aktiven Waffendetail-Karte (EXAKT WIE IN ALLTAGSKOMPETENZEN)
  const renderActiveWeaponCard = (entry: TechniqueItem) => {
    const isExpanded = !!expandedMap[entry.id];
    const wDef = getWeaponDefForEntry(entry);
    const currentScore = entry.trainingProgress !== undefined ? entry.trainingProgress : (entry.score !== undefined ? entry.score : 0);
    const currentXp = entry.xp || 0;
    const label = getWeaponLabel(currentScore);
    const cleanName = entry.name.replace(/\s*\(Rang \d+\)/i, '').trim();

    return (
      <div
        key={entry.id}
        className={`bg-slate-950 border rounded-xl transition duration-150 flex flex-col ${
          isExpanded ? 'border-sky-500/50 shadow-sm' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Header-Zeile des Eintrags */}
        <div className="p-3 flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none min-w-0"
            onClick={() => toggleSkillExpanded(entry.id)}
          >
            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm font-semibold text-slate-100 truncate">
              {cleanName}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline shrink-0">
              {entry.weaponCategory || wDef.categoryName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Stufen- & Prozent-Badge */}
            <span className="text-xs font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              {label} ({currentScore}%)
            </span>

            {/* EP-Badge */}
            <span className="text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hidden md:inline">
              {currentXp}/100 EP
            </span>

            {/* Aufklappen / Einklappen Button */}
            <button
              type="button"
              onClick={() => toggleSkillExpanded(entry.id)}
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
            {!readOnly && (
              <button
                type="button"
                onClick={() => onDeleteEntry(entry.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800/80 hover:border-rose-900/40 transition cursor-pointer"
                title={`${cleanName} deaktivieren`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Aufgeklappter Bereich: Progression, Feinjustierung & Notiz */}
        {isExpanded && (
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/40 flex flex-col gap-3">
            {/* PROGRESSIONS-STEIGERUNGSBEREICH BASIEREND AUF DER REGEL */}
            {progressionLogic === 'ep' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-sky-300">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>Erfahrungspunkte (EP)</span>
                  </div>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {currentXp} / 100 EP bis zum nächsten Stufenaufstieg
                  </span>
                </div>

                {/* EP-Fortschrittsbalken */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-sky-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, currentXp)}%` }}
                  />
                </div>

                {/* Steigerungs-Aktionen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(entry, 10)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +10 EP
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(entry, 25)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +25 EP
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleAddXp(entry, 50)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
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
                        disabled={readOnly}
                        value={currentXp}
                        onChange={e => handleSetXp(entry, Number(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-sky-300 font-mono text-xs outline-none focus:border-sky-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={readOnly || currentScore >= 95}
                      onClick={() => handleTriggerLevelUp(entry)}
                      className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        currentXp >= 100
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

            {progressionLogic === 'training' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Progression durch Training & Übung</span>
                  </div>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {entry.trainingUnits || 0} von 4 Übungseinheiten absolviert
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(seg => (
                    <div
                      key={`w-train-${seg}`}
                      className={`h-2 rounded-full border transition-all ${
                        seg <= (entry.trainingUnits || 0)
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly || (entry.trainingUnits || 0) >= 4}
                      onClick={() => handleAddTraining(entry, 1)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +1 Praxisanwendung
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || (entry.trainingUnits || 0) >= 4}
                      onClick={() => handleAddTraining(entry, 2)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      +2 Intensive Übung
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={readOnly || currentScore >= 95}
                    onClick={() => handleCompleteRoutine(entry)}
                    className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      (entry.trainingUnits || 0) >= 4
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Routine meistern (Stufe steigern)</span>
                  </button>
                </div>
              </div>
            )}

            {progressionLogic === 'milestone' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>Story-Meilensteine & Meisterprüfung</span>
                  </div>
                  <span className="text-slate-300 text-[11px]">
                    Aktuelle Stufe: {getWeaponLabel(currentScore)} ({currentScore}%)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={readOnly || currentScore >= 95}
                      onClick={() => handleMilestoneAdvance(entry)}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Meilenstein bestätigen (Stufe steigern)</span>
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || currentScore <= 0}
                      onClick={() => handleMilestoneDemote(entry)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      Stufe verringern
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <AutoExpandingTextarea
                    disabled={readOnly}
                    value={entry.milestoneRequirement || entry.milestoneNote || ''}
                    onChange={e => onUpdateEntry(entry.id, { milestoneRequirement: e.target.value, milestoneNote: e.target.value })}
                    placeholder="Erreichter Meilenstein, Waffenschmied-Unterweisung oder bestandenes Duell..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {progressionLogic === 'static' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Statische Talentpunkte</span>
                  </div>
                  <span className="text-slate-300 text-[11px]">
                    Investierte Punkte: {entry.points !== undefined ? entry.points : (currentScore === 0 ? 0 : currentScore <= 25 ? 1 : currentScore <= 55 ? 2 : currentScore <= 80 ? 3 : 4)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
                  {[
                    { pts: 0, name: 'Anfänger (0%)' },
                    { pts: 1, name: 'Basis (25%)' },
                    { pts: 2, name: 'Fortgeschritten (50%)' },
                    { pts: 3, name: 'Erfahren (75%)' },
                    { pts: 4, name: 'Meisterhaft (95%)' }
                  ].map(p => {
                    const currentPts = entry.points !== undefined ? entry.points : (currentScore === 0 ? 0 : currentScore <= 25 ? 1 : currentScore <= 55 ? 2 : currentScore <= 80 ? 3 : 4);
                    const isSelected = currentPts === p.pts;
                    return (
                      <button
                        key={`w-pts-${p.pts}`}
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleSetPoints(entry, p.pts)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        } disabled:opacity-50`}
                      >
                        {p.pts} Pkt: {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MANUELLE FEINABSTIMMUNG & SCHIEBEREGLER */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Manuelle Beherrschung & Feinabstimmung:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={readOnly}
                    value={currentScore}
                    onChange={e => handleUpdateScore(entry, Number(e.target.value) || 0)}
                    className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-sky-300 font-bold text-xs outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                disabled={readOnly}
                value={currentScore}
                onChange={e => handleUpdateScore(entry, Number(e.target.value) || 0)}
                onInput={e => handleUpdateScore(entry, Number((e.target as HTMLInputElement).value) || 0)}
                className="w-full accent-sky-500 bg-slate-950 rounded h-2 cursor-pointer"
              />

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-0.5">
                {LEVEL_PRESETS.map(preset => {
                  const isSelected = (
                    preset.score === 0 ? currentScore === 0 :
                    preset.score === 25 ? currentScore > 0 && currentScore <= 35 :
                    preset.score === 50 ? currentScore > 35 && currentScore <= 62 :
                    preset.score === 75 ? currentScore > 62 && currentScore <= 85 :
                    currentScore > 85
                  );
                  return (
                    <button
                      key={`${preset.label}-${preset.score}`}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleUpdateScore(entry, preset.score)}
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

            {/* KOMPAKTE PARAMETER-LEISTE (Führungsstil, Schaden, Reichweite) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Führungsstil:</span>
                <select
                  disabled={readOnly}
                  value={entry.wieldingStyle || wDef.wieldingStyles[0] || 'Einhand'}
                  onChange={e => onUpdateEntry(entry.id, { wieldingStyle: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
                >
                  {WIELDING_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Schaden:</span>
                <span className="text-slate-200 font-medium">{(entry.effects && entry.effects.length > 0 ? entry.effects : wDef.damageTypes).join('/')}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Distanz:</span>
                <span className="text-slate-200 font-medium">{entry.range || wDef.rangeCategory}</span>
              </div>
            </div>

            {/* NOTIZFELD (WIE IN ALLTAGSKOMPETENZEN) */}
            <div>
              <AutoExpandingTextarea
                disabled={readOnly}
                value={entry.description || ''}
                onChange={e => onUpdateEntry(entry.id, { description: e.target.value })}
                placeholder="Erfahrungsnotiz oder praktischer Einsatz im Abenteuer (optional)"
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
      {/* EINHEITLICHES FELD FÜR WAFFENBEHERRSCHUNG (KOMPAKT & IDENTISCH MIT ALLTAGSKOMPETENZEN) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3.5 shadow-sm">
        {/* 1. KOPFZEILE: SUCHE, EIGENE WAFFE, SMART FILL & ANSICHT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Suchleiste */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Waffen oder Gattungen filtern..."
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

          {/* Eigene Waffe hinzufügen */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 sm:w-72">
              <input
                type="text"
                value={customWeaponInput}
                onChange={e => setCustomWeaponInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomWeapon();
                  }
                }}
                placeholder="Eigene Waffe eintragen..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
              <button
                type="button"
                onClick={handleAddCustomWeapon}
                disabled={!customWeaponInput.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shrink-0 cursor-pointer"
                title="Waffe anlegen"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hinzufügen</span>
              </button>
            </div>
          )}

          {/* Smart Fill & Ansichtsmodus */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            {onOpenSmartFill && !readOnly && (
              <button
                type="button"
                onClick={onOpenSmartFill}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="KI-gestützte Waffenbeherrschung generieren"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Smart Fill</span>
              </button>
            )}

            <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg p-0.5">
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
        </div>

        {/* 2. KATEGORIE-FILTERLEISTE (WAFFENGATTUNGEN) */}
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
              Alle Gattungen ({ALL_WEAPONS.length})
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
              <span>Ausgewählt ({weaponEntries.length})</span>
            </button>

            {WEAPON_CATEGORIES.map(cat => {
              const allCatWeapons = ALL_WEAPONS.filter(w => w.categoryId === cat.id);
              const activeInCat = allCatWeapons.filter(w => activeWeaponNames.includes(w.name.toLowerCase())).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    activeInCat > 0
                      ? 'bg-sky-500/30 text-sky-200 font-bold'
                      : 'bg-slate-900 text-slate-500'
                  }`}>
                    {activeInCat > 0 ? `${activeInCat}/${allCatWeapons.length}` : allCatWeapons.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. STATUS-BALKEN */}
        {viewMode === 'visual' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                Waffenbeherrschungen: <strong className="text-sky-300 font-semibold">{weaponEntries.length} aktiv erlernt</strong>
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              Katalog umfasst 11 Gattungen mit {ALL_WEAPONS.length} Waffen
            </span>
          </div>
        )}

        {/* 4. TEXTANSICHT (RAW TEXT) */}
        {viewMode === 'raw' && (
          <div className="flex flex-col gap-2">
            <AutoExpandingTextarea
              readOnly
              value={rawTextOverview}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed outline-none"
            />
            <span className="text-[11px] text-slate-400">
              Übersicht der aktiven Waffenbeherrschungen mit Stufe, Fortschritt, Erfahrung und Details.
            </span>
          </div>
        )}

        {/* 5. GEMEINSAMES KATALOG- & AKTIV-FELD (ALLES AUF EINEN BLICK) */}
        {viewMode === 'visual' && (
          <div className="flex flex-col gap-4">
            {/* FALL A: NUR AUSGEWÄHLTE FILTER-ANSICHT */}
            {selectedCategory === 'ausgewaehlt' ? (
              <div className="flex flex-col gap-3">
                {weaponEntries.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-400 text-xs">
                    Noch keine Waffenbeherrschungen erlernt. Wähle eine Waffengattung oder klicke auf &quot;Alle Gattungen&quot;, um Waffen hinzuzufügen.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {weaponEntries.map(w => renderActiveWeaponCard(w))}
                  </div>
                )}
              </div>
            ) : (
              /* FALL B: KATALOG MIT INTEGRIERTEN AKTIVEN WAFFEN PRO KATEGORIE */
              <div className="flex flex-col gap-4">
                {filteredCategories.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-400 text-xs">
                    Keine passenden Waffen gefunden.
                  </div>
                ) : (
                  filteredCategories.map(cat => {
                    // Finde aktive Waffen in dieser Kategorie
                    const activeInCat = weaponEntries.filter(w => {
                      const wDef = getWeaponDefForEntry(w);
                      return cat.weapons.some(cw => cw.id === wDef.id || cw.name.toLowerCase() === wDef.name.toLowerCase());
                    });

                    // Finde noch nicht aktive Waffen zum schnellen Hinzufügen
                    const availableInCat = cat.weapons.filter(w => {
                      return !activeWeaponNames.includes(w.name.toLowerCase());
                    });

                    return (
                      <div
                        key={cat.id}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-3"
                      >
                        {/* Kategorie Kopfzeile - identisch zu Alltagskompetenzen */}
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-100 font-sans">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                ({cat.description})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-sky-400 font-semibold shrink-0">
                            {activeInCat.length > 0 ? (
                              <span>{activeInCat.length} ausgewählt / {cat.weapons.length} gesamt</span>
                            ) : (
                              <span>{cat.weapons.length} verfügbar</span>
                            )}
                          </span>
                        </div>

                        {/* Aktive Waffen in dieser Kategorie */}
                        {activeInCat.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                              Aktive Fertigkeiten ({activeInCat.length}):
                            </span>
                            <div className="grid grid-cols-1 gap-2.5">
                              {activeInCat.map(w => renderActiveWeaponCard(w))}
                            </div>
                          </div>
                        )}

                        {/* Verfügbare Waffen zum Hinzufügen */}
                        {availableInCat.length > 0 && !readOnly && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            {activeInCat.length > 0 && (
                              <span className="text-[11px] font-medium text-slate-400">
                                Verfügbar zum Hinzufügen ({availableInCat.length}):
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {availableInCat.map(w => (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => handleAddWeaponFromCatalog(w)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 text-slate-300 border border-slate-800/90 hover:border-sky-500/60 hover:text-white transition flex items-center gap-1.5 cursor-pointer group"
                                  title={`${w.name} als Waffenbeherrschung anlegen`}
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
                                  <span>{w.name}</span>
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

export default WeaponSkillTree;
