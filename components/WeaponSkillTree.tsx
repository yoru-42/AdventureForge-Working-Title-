import React, { useState, useMemo, useEffect } from 'react';
import {
  WeaponTypeDefinition,
  WEAPON_CATEGORIES,
  ALL_WEAPONS,
  WIELDING_STYLES,
  getWeaponById,
  findWeaponByName,
  getWeaponsByCategory,
  getWeaponTreeNodeRanks,
  getWeaponTierCompetencies,
  getWeaponTalents,
  WeaponRankNodeData
} from '../lib/weaponTypesData';
import { TechniqueItem, BaseAbility, CharacterPowerSource } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  Check,
  Lock,
  Plus,
  Sliders,
  Star,
  Info,
  X,
  Award,
  Trash2,
  Briefcase,
  Layers,
  Compass,
  ArrowRight,
  ArrowDown,
  ClipboardList,
  Sparkles,
  Shield,
  Crosshair,
  Swords
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
}

interface WeaponCompetencyState {
  name: string;
  proficiency: number;
}

interface WeaponTalentState {
  name: string;
  score: number;
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
  onOpenSmartFill
}) => {
  // Alle Waffenbeherrschungs-Einträge
  const weaponEntries = useMemo(() => {
    return techniques.filter(t => t.category === 'Waffenbeherrschung');
  }, [techniques]);

  // Aktive ausgewählte Waffe (TechniqueItem ID)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(() => {
    return weaponEntries.length > 0 ? weaponEntries[0].id : null;
  });

  // Wenn keine ausgewählt oder gelöscht wurde, auf das erste Element zurückfallen
  useEffect(() => {
    if (weaponEntries.length > 0) {
      if (!selectedEntryId || !weaponEntries.some(e => e.id === selectedEntryId)) {
        setSelectedEntryId(weaponEntries[0].id);
      }
    } else {
      setSelectedEntryId(null);
    }
  }, [weaponEntries, selectedEntryId]);

  const currentEntry = useMemo(() => {
    return weaponEntries.find(e => e.id === selectedEntryId) || null;
  }, [weaponEntries, selectedEntryId]);

  // Aktive Waffendefinition
  const currentWeaponDef: WeaponTypeDefinition | undefined = useMemo(() => {
    if (!currentEntry) return undefined;
    if (currentEntry.weaponType) {
      const byId = getWeaponById(currentEntry.weaponType);
      if (byId) return byId;
      const byName = findWeaponByName(currentEntry.weaponType);
      if (byName) return byName;
    }
    return findWeaponByName(currentEntry.name);
  }, [currentEntry]);

  // Kategorie der aktuellen Waffe oder Dropdown-Kategorie
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return currentWeaponDef?.categoryId || 'schwerter_einhaendig';
  });

  useEffect(() => {
    if (currentWeaponDef?.categoryId) {
      setSelectedCategoryId(currentWeaponDef.categoryId);
    }
  }, [currentWeaponDef?.categoryId]);

  const weaponsInSelectedCat = useMemo(() => {
    return getWeaponsByCategory(selectedCategoryId);
  }, [selectedCategoryId]);

  // Erzeugung des 4-stufigen Talentbaums für die aktuelle Waffe
  const fallbackDef: WeaponTypeDefinition = useMemo(() => {
    if (currentWeaponDef) return currentWeaponDef;
    const name = currentEntry?.name || 'Waffenbeherrschung';
    return {
      id: currentEntry?.id || 'custom_weapon',
      name,
      categoryId: selectedCategoryId,
      categoryName: WEAPON_CATEGORIES.find(c => c.id === selectedCategoryId)?.name || 'Waffen',
      damageTypes: currentEntry?.effects || ['Schnitt', 'Stich'],
      wieldingStyles: [currentEntry?.wieldingStyle || 'Einhand'],
      rangeCategory: (currentEntry?.range === 'Fernkampf' ? 'Fernkampf' : currentEntry?.range === 'Stangenreichweite' ? 'Stangenreichweite' : currentEntry?.range === 'Defensiv' ? 'Defensiv' : 'Nahkampf'),
      description: currentEntry?.description || `Meisterschaft und Kampfführung mit ${name}.`,
      maneuvers: currentEntry?.weaponManeuver ? currentEntry.weaponManeuver.split(',').map(s => s.trim()).filter(Boolean) : ['Angriff', 'Parade']
    };
  }, [currentWeaponDef, currentEntry, selectedCategoryId]);

  const treeRankNodes = useMemo(() => {
    return getWeaponTreeNodeRanks(fallbackDef);
  }, [fallbackDef]);

  // Welcher Knoten im Talentbaum wird im Detail-Inspektor betrachtet (0: Rang 1, 1: Rang 2, 2: Rang 3, 3: Rang 4)
  const currentRankIndex = useMemo(() => {
    if (!currentEntry) return 0;
    const ml = (currentEntry.masteryLevel || currentEntry.tier || '').toLowerCase();
    if (ml.includes('rang 4') || ml.includes('großmeister') || ml.includes('legende') || currentEntry.level === 4) return 3;
    if (ml.includes('rang 3') || ml.includes('experte') || ml.includes('meister') || currentEntry.level === 3) return 2;
    if (ml.includes('rang 2') || ml.includes('geübt') || ml.includes('geselle') || currentEntry.level === 2) return 1;
    return 0; // Default Rang 1
  }, [currentEntry]);

  const [inspectedRankIndex, setInspectedRankIndex] = useState<number>(0);

  // Synchronisiere initialen Inspektionsknoten mit der aktuellen Stufe
  useEffect(() => {
    setInspectedRankIndex(currentRankIndex);
  }, [currentEntry?.id, currentRankIndex]);

  // UI Editiermodi für Fortschritt und Kampfpraxis
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Lokaler State für Fachkompetenzen und Talente pro Waffe
  const [customCompetencies, setCustomCompetencies] = useState<Record<string, Record<number, number>>>({});
  const [customTalents, setCustomTalents] = useState<Record<string, Record<string, number>>>({});

  // Berechne Kompetenzen für den inspizierten Knoten
  const inspectedNode = treeRankNodes[inspectedRankIndex] || treeRankNodes[0];

  const nodeCompetencyItems = useMemo(() => {
    const defaultList = inspectedNode.suggestedCompetencies;
    const entryId = currentEntry?.id || 'default';
    const entryScores = customCompetencies[entryId] || {};

    return defaultList.map((cName, idx) => {
      const baseProf = 40 + inspectedRankIndex * 15;
      const prof = entryScores[idx] !== undefined ? entryScores[idx] : Math.min(95, baseProf);
      return { name: cName, proficiency: prof, index: idx };
    });
  }, [inspectedNode, currentEntry?.id, customCompetencies, inspectedRankIndex]);

  const nodeTalents = useMemo(() => {
    const defaultTalents = getWeaponTalents(fallbackDef);
    const entryId = currentEntry?.id || 'default';
    const entryTalentScores = customTalents[entryId] || {};

    return defaultTalents.map(t => {
      const score = entryTalentScores[t.name] !== undefined ? entryTalentScores[t.name] : t.score;
      return { name: t.name, score };
    });
  }, [fallbackDef, currentEntry?.id, customTalents]);

  const handleAdjustCompetency = (idx: number, delta: number) => {
    if (readOnly || !currentEntry) return;
    const entryId = currentEntry.id;
    setCustomCompetencies(prev => {
      const currentMap = prev[entryId] || {};
      const currentVal = currentMap[idx] !== undefined ? currentMap[idx] : (40 + inspectedRankIndex * 15);
      const newVal = Math.max(0, Math.min(100, currentVal + delta));
      return {
        ...prev,
        [entryId]: {
          ...currentMap,
          [idx]: newVal
        }
      };
    });
  };

  const handlePracticeCompetency = (cName: string, idx: number) => {
    if (readOnly || !currentEntry) return;
    handleAdjustCompetency(idx, 5);
    setFeedbackMsg(`+25 Kampfpraxis-XP in '${cName}' erlangt!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleSetTalentScore = (tName: string, stars: number) => {
    if (readOnly || !currentEntry) return;
    const entryId = currentEntry.id;
    setCustomTalents(prev => ({
      ...prev,
      [entryId]: {
        ...(prev[entryId] || {}),
        [tName]: stars
      }
    }));
  };

  // Schnellauswahl / Wechsel einer vorgegebenen Waffenart
  const handleSelectPredefinedWeapon = (wDef: WeaponTypeDefinition) => {
    if (readOnly || !currentEntry) return;
    onUpdateEntry(currentEntry.id, {
      name: `${wDef.name} (Rang ${currentRankIndex + 1})`,
      weaponType: wDef.id,
      weaponCategory: wDef.categoryName,
      wieldingStyle: wDef.wieldingStyles[0] || 'Einhand',
      effects: wDef.damageTypes,
      range: wDef.rangeCategory,
      description: wDef.description,
      weaponManeuver: wDef.maneuvers.join(', ')
    });
    setFeedbackMsg(`Waffenart '${wDef.name}' übernommen.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Rangstufe der Waffe im Talentbaum setzen
  const handleSetRank = (rankIdx: number) => {
    if (readOnly || !currentEntry) return;
    const targetNode = treeRankNodes[rankIdx];
    const rankLabel = `Rang ${rankIdx + 1}: ${rankIdx === 0 ? 'Novize' : rankIdx === 1 ? 'Geübt' : rankIdx === 2 ? 'Experte' : 'Großmeister'}`;
    const cleanBaseName = fallbackDef.name.replace(/\s*\(Rang \d+\)/i, '').trim();

    onUpdateEntry(currentEntry.id, {
      name: `${cleanBaseName} (Rang ${rankIdx + 1})`,
      masteryLevel: targetNode.rankTitle,
      tier: `Rang ${rankIdx + 1}`,
      level: rankIdx + 1,
      trainingProgress: 25 + rankIdx * 25,
      description: currentEntry.description || targetNode.description
    });

    setFeedbackMsg(`Meisterschaft auf '${rankLabel}' gesetzt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Neue Waffenbeherrschung anlegen
  const handleCreateNewWeaponEntry = () => {
    if (readOnly) return;
    const defaultDef = weaponsInSelectedCat[0] || ALL_WEAPONS[0];
    const newId = `weapon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: Partial<TechniqueItem> = {
      id: newId,
      name: `${defaultDef.name} (Rang 1)`,
      category: 'Waffenbeherrschung',
      type: 'Angriff',
      weaponType: defaultDef.id,
      weaponCategory: defaultDef.categoryName,
      masteryLevel: `Rang 1: Novize / Grundausbildung`,
      tier: 'Rang 1',
      level: 1,
      trainingProgress: 25,
      xp: 180, // z.B. 180 Tage Erfahrung
      wieldingStyle: defaultDef.wieldingStyles[0] || 'Einhand',
      effects: defaultDef.damageTypes,
      range: defaultDef.rangeCategory,
      description: defaultDef.description,
      weaponManeuver: defaultDef.maneuvers.slice(0, 2).join(', '),
      baseAbilityIds: activeBaseAbility ? [activeBaseAbility.id] : [],
      baseAbilityNames: activeBaseAbility ? [activeBaseAbility.displayName || activeBaseAbility.name || ''] : []
    };

    onAddEntry(newEntry);
    setSelectedEntryId(newId);
    setFeedbackMsg(`Neue Waffenbeherrschung '${defaultDef.name}' angelegt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Waffenkampferfahrung formatieren
  const expDaysTotal = currentEntry?.xp !== undefined ? currentEntry.xp : 365 * (currentRankIndex + 1);
  const expYears = Math.floor(expDaysTotal / 365);
  const expMonths = Math.floor((expDaysTotal % 365) / 30);
  const expDays = (expDaysTotal % 365) % 30;

  const handleUpdateExperienceDays = (y: number, m: number, d: number) => {
    if (readOnly || !currentEntry) return;
    const total = Math.max(0, y * 365 + m * 30 + d);
    onUpdateEntry(currentEntry.id, { xp: total });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================================ */}
      {/* 1. KOPFZEILE: WAFFENART-WAHL, MEINE WAFFEN & AKTIONEN         */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col gap-3">
        {/* Obere Reihe: Tabs für alle erlernten/angelegten Waffen des Charakters */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Waffenbeherrschung & Talentbäume
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
              {weaponEntries.length} {weaponEntries.length === 1 ? 'Waffenbaum' : 'Waffenbäume'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSmartFill && !readOnly && (
              <button
                type="button"
                onClick={onOpenSmartFill}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="KI-gestützte Waffenbeherrschung generieren"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Smart Fill</span>
              </button>
            )}

            {!readOnly && (
              <button
                type="button"
                onClick={handleCreateNewWeaponEntry}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Waffenbaum anlegen</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback-Meldung */}
        {feedbackMsg && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-medium animate-in fade-in">
            {feedbackMsg}
          </div>
        )}

        {/* Waffenbäume-Umschalter (Tabs der vorhandenen Waffen) */}
        {weaponEntries.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Waffenbäume:
            </span>
            {weaponEntries.map((wEntry, wIdx) => {
              const isSelected = wEntry.id === selectedEntryId;
              const wDef = getWeaponById(wEntry.weaponType || '') || findWeaponByName(wEntry.name);
              const displayName = wDef?.name || wEntry.name.replace(/\s*\(Rang \d+\)/i, '') || `Waffe ${wIdx + 1}`;
              const rankText = wEntry.tier || `Rang ${wEntry.level || 1}`;

              return (
                <button
                  key={wEntry.id}
                  type="button"
                  onClick={() => setSelectedEntryId(wEntry.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-sm'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{displayName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {rankText}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-2">
            <p>Es ist noch kein Waffen-Talentbaum angelegt.</p>
            {!readOnly && (
              <button
                type="button"
                onClick={handleCreateNewWeaponEntry}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ersten Waffenbaum anlegen</span>
              </button>
            )}
          </div>
        )}

        {/* Waffenkatalog-Schnellwahl (Kategorie & Waffenmodell) */}
        {currentEntry && !readOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 bg-slate-950/40 p-2.5 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Waffengattung / Kategorie
              </label>
              <select
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
              >
                {WEAPON_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.weaponCount})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Waffenmodell / Vorlage übernehmen
              </label>
              <select
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                value={currentWeaponDef?.id || ''}
                onChange={e => {
                  const found = ALL_WEAPONS.find(w => w.id === e.target.value);
                  if (found) handleSelectPredefinedWeapon(found);
                }}
              >
                <option value="" disabled>Waffe aus Katalog wählen...</option>
                {weaponsInSelectedCat.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.damageTypes.join('/')})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Bezeichnung anpassen
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                  value={currentEntry.name}
                  placeholder="z.B. Langschwert (Rang 2)"
                  onChange={e => onUpdateEntry(currentEntry.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => onDeleteEntry(currentEntry.id)}
                  className="p-1.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/40 rounded-lg transition-colors h-[30px] w-[30px] flex items-center justify-center cursor-pointer shrink-0"
                  title="Diesen Waffenbaum löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DER TALENTBAUM: 4 MEISTERSCHAFTSSTUFEN ALS KNOTEN-GRAPH    */}
      {/* ============================================================ */}
      {currentEntry && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Meisterschafts-Talentbaum: {fallbackDef.name}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Klicke auf &bdquo;Details&ldquo; zur Inspektion oder setze das Häkchen für den erlernten Rang
            </span>
          </div>

          {/* Die 4 Stufen-Knoten im Talentbaum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {treeRankNodes.map((node, nodeIdx) => {
              const isLearned = nodeIdx <= currentRankIndex;
              const isCurrentRank = nodeIdx === currentRankIndex;
              const isInspected = nodeIdx === inspectedRankIndex;

              return (
                <div
                  key={node.id}
                  id={`weapon-tree-node-${node.id}`}
                  className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl transition-all duration-150 border h-full w-full min-w-0 ${
                    isCurrentRank
                      ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/40 shadow-sm shadow-amber-950/40'
                      : isLearned
                      ? 'bg-slate-900/95 border-amber-500/40'
                      : isInspected
                      ? 'bg-slate-900 border-amber-400/80 ring-1 ring-amber-400/40 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    {/* Titel & Status */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <span
                        className="text-sm font-bold text-white tracking-wide font-serif break-words leading-snug"
                        title={node.name}
                      >
                        {node.name}
                      </span>
                      {isCurrentRank && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 shrink-0">
                          Aktiv
                        </span>
                      )}
                    </div>

                    {/* Stufe & Aufstiegs-Verbindung */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-0.5 gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-amber-300/90 font-medium text-[10px] shrink-0">
                        {node.rankTierLabel}
                      </span>
                      {node.nextRankName && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 min-w-0 truncate max-w-[150px]" title={`Nächste Stufe: ${node.nextRankName}`}>
                          <ArrowRight className="w-3 h-3 text-amber-400/80 shrink-0" />
                          <span className="truncate">{node.nextRankName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Untere Leiste: "Erlernt" + "Details" Button */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isLearned}
                        disabled={readOnly}
                        onChange={() => handleSetRank(nodeIdx)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                      />
                      <span
                        className={`text-xs font-medium transition ${
                          isLearned ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {isCurrentRank ? 'Aktiv' : isLearned ? 'Erlernt' : 'Freischalten'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setInspectedRankIndex(nodeIdx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                        isInspected
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Info className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* 3. DETAIL-INSPEKTOR DES AUSGEWÄHLTEN KNOTENS (WIE BERUFSZWEIG) */}
          {/* ============================================================ */}
          <div
            id={`weapon-inspector-${inspectedNode.id}`}
            className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 my-1"
          >
            {/* Header: Title, Category & Status */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3 flex-wrap sm:flex-nowrap">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif uppercase tracking-wider">
                    {inspectedNode.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-bold">
                    {inspectedNode.rankTierLabel}
                  </span>
                  {inspectedRankIndex === currentRankIndex && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold">
                      Aktuell aktiv beherrschte Stufe
                    </span>
                  )}
                </div>
                {inspectedNode.description && (
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                    {inspectedNode.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {inspectedRankIndex !== currentRankIndex && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleSetRank(inspectedRankIndex)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    Als aktive Meisterschaftsstufe setzen
                  </button>
                )}
              </div>
            </div>

            {/* Waffeneigenschaften & Gattung */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {/* Waffengattung */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Waffengattung
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-700/60">
                  {currentEntry.weaponCategory || fallbackDef.categoryName}
                </span>
              </div>

              {/* Schadensarten */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Schadensarten
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(currentEntry.effects && currentEntry.effects.length > 0 ? currentEntry.effects : fallbackDef.damageTypes).map((dt, dtIdx) => (
                    <span
                      key={`dt-${dt}-${dtIdx}`}
                      className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20"
                    >
                      {dt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Kampfdistanz */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Kampfdistanz
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-xs border border-slate-700/60">
                  {currentEntry.range || fallbackDef.rangeCategory}
                </span>
              </div>

              {/* Führungsstil */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Führungsstil
                </span>
                <select
                  disabled={readOnly}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px] cursor-pointer"
                  value={currentEntry.wieldingStyle || fallbackDef.wieldingStyles[0] || 'Einhand'}
                  onChange={e => onUpdateEntry(currentEntry.id, { wieldingStyle: e.target.value })}
                >
                  {WIELDING_STYLES.map((ws, wsIdx) => (
                    <option key={`ws-${ws}-${wsIdx}`} value={ws}>{ws}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid: Meisterschaftsfortschritt & Kampfpraxis (Wie in Berufszweig) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              {/* Meisterschaftsfortschritt */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Meisterschaftsfortschritt</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-400">
                      {currentEntry.trainingProgress !== undefined ? currentEntry.trainingProgress : 25 + currentRankIndex * 25} %
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProgress(!isEditingProgress)}
                        className="text-slate-400 hover:text-amber-300 transition cursor-pointer p-0.5"
                        title="Fortschrittsregler anpassen"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, currentEntry.trainingProgress !== undefined ? currentEntry.trainingProgress : 25 + currentRankIndex * 25))}%`
                    }}
                  />
                </div>

                {isEditingProgress && !readOnly && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentEntry.trainingProgress !== undefined ? currentEntry.trainingProgress : 25 + currentRankIndex * 25}
                      onChange={e => onUpdateEntry(currentEntry.id, { trainingProgress: parseInt(e.target.value, 10) || 0 })}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Kampfpraxis & Erfahrung */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Kampferfahrung mit dieser Waffe</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-200">
                      {expYears > 0 ? `${expYears} J. ` : ''}{expMonths > 0 ? `${expMonths} Mon. ` : ''}{expDays > 0 || (expYears === 0 && expMonths === 0) ? `${expDays} Tage` : ''}
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setIsEditingExperience(!isEditingExperience)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        {isEditingExperience ? 'Fertig' : 'Ändern'}
                      </button>
                    )}
                  </div>
                </div>

                {isEditingExperience && !readOnly ? (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <label className="text-slate-400 text-[10px]">Jahre:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={expYears}
                      onChange={e => handleUpdateExperienceDays(parseInt(e.target.value, 10) || 0, expMonths, expDays)}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                    />
                    <label className="text-slate-400 text-[10px]">Monate:</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={expMonths}
                      onChange={e => handleUpdateExperienceDays(expYears, parseInt(e.target.value, 10) || 0, expDays)}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                    />
                    <label className="text-slate-400 text-[10px]">Tage:</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={expDays}
                      onChange={e => handleUpdateExperienceDays(expYears, expMonths, parseInt(e.target.value, 10) || 0)}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Akkumulierte Gefechts- und Trainingszeit mit {fallbackDef.name}
                  </span>
                )}
              </div>
            </div>

            {/* Typische Waffenmanöver & Spezialaktionen */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                  <span>Waffenmanöver & Spezialaktionen</span>
                </span>
                {!readOnly && (
                  <span className="text-[10px] text-slate-400">
                    Klick fügt Manöver hinzu
                  </span>
                )}
              </div>

              {/* Manöver Eingabefeld */}
              <input
                type="text"
                disabled={readOnly}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-amber-500 h-[30px]"
                value={currentEntry.weaponManeuver || ''}
                placeholder="z.B. Parierstoß, Halbschwertführung, Ausfallschritt..."
                onChange={e => onUpdateEntry(currentEntry.id, { weaponManeuver: e.target.value })}
              />

              {/* Schnellauswahl-Buttons für Manöver */}
              {fallbackDef.maneuvers && fallbackDef.maneuvers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {fallbackDef.maneuvers.map((m, mIdx) => {
                    const isIncluded = (currentEntry.weaponManeuver || '').includes(m);
                    return (
                      <button
                        key={`man-${m}-${mIdx}`}
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          const current = currentEntry.weaponManeuver || '';
                          if (!current.trim()) {
                            onUpdateEntry(currentEntry.id, { weaponManeuver: m });
                          } else if (!current.includes(m)) {
                            onUpdateEntry(currentEntry.id, { weaponManeuver: `${current}, ${m}` });
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                          isIncluded
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                        title={`Manöver „${m}“ hinzufügen`}
                      >
                        + {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fachkompetenzen & Waffentalente (Text oben, Controls unten) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. Zugeordnete Kampffertigkeiten / Fachkompetenzen */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Zugeordnete Kampffertigkeiten & Fachkompetenzen
                </span>
                <div className="flex flex-col gap-2">
                  {nodeCompetencyItems.map(comp => (
                    <div
                      key={comp.name}
                      className="flex flex-col gap-2 text-xs p-3 rounded-lg bg-slate-950/70 border border-slate-800"
                    >
                      {/* Text Oben */}
                      <span className="text-slate-200 font-medium leading-relaxed break-words">
                        {comp.name}
                      </span>
                      {/* Einstellmöglichkeiten Darunter */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 font-mono text-amber-300 text-xs font-bold min-w-[3.25rem] text-center">
                            {comp.proficiency}%
                          </span>
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAdjustCompetency(comp.index, -5)}
                                className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95"
                                title="Stufe um 5% verringern"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCompetency(comp.index, +5)}
                                className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95"
                              >
                                +
                              </button>
                            </>
                          )}
                        </div>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handlePracticeCompetency(comp.name, comp.index)}
                            className="px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold transition cursor-pointer active:scale-95"
                          >
                            Üben
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Waffentalente & Begabungen */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Waffentalente & Begabungen
                </span>
                <div className="flex flex-col gap-2">
                  {nodeTalents.map(talent => (
                    <div
                      key={talent.name}
                      className="flex flex-col gap-2 text-xs p-3 rounded-lg bg-slate-950/70 border border-slate-800"
                    >
                      {/* Text Oben */}
                      <span className="text-slate-200 font-medium leading-relaxed break-words">
                        {talent.name}
                      </span>
                      {/* Einstellmöglichkeiten (Sterne) Darunter */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Begabung
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              disabled={readOnly}
                              onClick={() => handleSetTalentScore(talent.name, star)}
                              className={`p-0.5 transition cursor-pointer ${
                                star <= talent.score ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'
                              }`}
                              title={`Begabung: ${star} von 5`}
                            >
                              <Star className={`w-3.5 h-3.5 ${star <= talent.score ? 'fill-amber-400' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Beschreibung, Kampfstil & Meisterboni */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Beschreibung, Kampfstil & Meisterboni
              </label>
              <AutoExpandingTextarea
                disabled={readOnly}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 leading-relaxed transition-all min-h-[60px]"
                value={currentEntry.description || ''}
                placeholder="Doktrin, Haltung, Vorzüge und besondere Boni im Waffenkampf beschreiben..."
                onChange={e => onUpdateEntry(currentEntry.id, { description: e.target.value })}
              />
            </div>

            {/* Verknüpfte Grundfähigkeiten */}
            {baseAbilities.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Verknüpfte Grundfähigkeiten
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {baseAbilities.map(ba => {
                    const isLinked = (currentEntry.baseAbilityIds || []).includes(ba.id);
                    return (
                      <button
                        key={ba.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          const currentIds = currentEntry.baseAbilityIds || [];
                          const nextIds = isLinked ? currentIds.filter(id => id !== ba.id) : [...currentIds, ba.id];
                          const nextNames = baseAbilities.filter(b => nextIds.includes(b.id)).map(b => b.displayName || b.name || '');
                          onUpdateEntry(currentEntry.id, { baseAbilityIds: nextIds, baseAbilityNames: nextNames });
                        }}
                        className={`px-2.5 py-1 rounded text-xs transition cursor-pointer border ${
                          isLinked
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {ba.displayName || ba.name || 'Grundfähigkeit'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeaponSkillTree;
