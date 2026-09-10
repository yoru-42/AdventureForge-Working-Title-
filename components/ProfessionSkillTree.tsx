import React, { useState, useMemo, useEffect } from 'react';
import {
  ProfessionTreeNode,
  ProfessionNodeTier,
  getProfessionTreeForField,
  evaluateNodePrerequisites,
  NodeEvaluationResult
} from '../lib/professionTreeData';
import { ProfessionCompetency, ProfessionExperience, ProfessionProgress } from '../types';
import {
  getCatalogCompetenciesForProfession,
  ProfessionCompetencyDefinition
} from '../lib/professionCompetencies';
import {
  createCompetencyFromDefinition,
  calculateCompetencyProgress,
  formatProfessionExperience
} from '../services/professionCompetencyService';
import {
  Check,
  Lock,
  Plus,
  Minus,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Sliders,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export interface ProfessionSkillTreeProps {
  fieldId: string;
  fieldName?: string;
  currentProfession: string;
  currentSpecialization?: string;
  currentRank?: string;
  experienceYears?: number;
  experienceMonths?: number;
  experienceDays?: number;
  professionExperience?: ProfessionExperience;
  onExperienceChange?: (exp: ProfessionExperience) => void;
  professionProgress?: ProfessionProgress;
  onProfessionProgressChange?: (progress: ProfessionProgress) => void;
  competencies?: ProfessionCompetency[];
  onCompetenciesChange?: (competencies: ProfessionCompetency[]) => void;
  onPracticeCompetency?: (competency: ProfessionCompetency) => void;
  additionalDirections?: string[];
  onSelectProfession: (professionName: string, specialization?: string, fieldId?: string) => void;
  onToggleAdditionalDirection?: (directionName: string, tier: ProfessionNodeTier, fieldId?: string) => void;
  readOnly?: boolean;
}

interface BranchGroup {
  coreNode: ProfessionTreeNode;
  specializations: ProfessionTreeNode[];
  masters: ProfessionTreeNode[];
}

interface NodeCompetencyItem {
  name: string;
  proficiency: number;
  category: string;
  talent: number;
  isCustom?: boolean;
  raw?: ProfessionCompetency;
}

interface NodeTalentItem {
  name: string;
  score: number; // 1 - 5
}

/**
 * Generates an ASCII-style block progress bar matching the specification:
 * e.g. 41% -> ████████░░░░░░░░░░░░
 */
function renderAsciiBar(percent: number, totalBlocks = 20): string {
  const safePercent = Math.max(0, Math.min(100, percent));
  const filled = Math.round((safePercent / 100) * totalBlocks);
  const unfilled = totalBlocks - filled;
  return '█'.repeat(filled) + '░'.repeat(unfilled);
}

/**
 * Formats experience for compact node display:
 * e.g. "180 Tage", "2 J. 3 Mon.", "1 Jahr"
 */
function formatNodeExperience(
  exp?: ProfessionExperience | number,
  fallbackDays?: number
): string {
  if (typeof exp === 'number') {
    if (exp <= 0 && fallbackDays) return `${fallbackDays} Tage`;
    return `${exp} ${exp === 1 ? 'Jahr' : 'Jahre'}`;
  }
  if (!exp) {
    if (fallbackDays) return `${fallbackDays} Tage`;
    return '0 Tage';
  }

  const y = exp.years || 0;
  const m = exp.months || 0;
  const d = exp.days || 0;

  if (y > 0 && m > 0) return `${y} J. ${m} Mon.`;
  if (y > 0) return `${y} ${y === 1 ? 'Jahr' : 'Jahre'}`;
  if (m > 0 && d > 0) return `${m} Mon. ${d} Tage`;
  if (m > 0) return `${m} ${m === 1 ? 'Monat' : 'Monate'}`;
  if (d > 0) return `${d} ${d === 1 ? 'Tag' : 'Tage'}`;
  if (fallbackDays) return `${fallbackDays} Tage`;
  return '0 Tage';
}

export const ProfessionSkillTree: React.FC<ProfessionSkillTreeProps> = ({
  fieldId,
  fieldName,
  currentProfession,
  currentSpecialization = '',
  currentRank = '',
  experienceYears = 0,
  experienceMonths = 0,
  experienceDays = 0,
  professionExperience,
  onExperienceChange,
  professionProgress,
  onProfessionProgressChange,
  competencies = [],
  onCompetenciesChange,
  onPracticeCompetency,
  additionalDirections = [],
  onSelectProfession,
  onToggleAdditionalDirection,
  readOnly = false
}) => {
  const tree = useMemo(() => {
    return getProfessionTreeForField(fieldId, fieldName);
  }, [fieldId, fieldName]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedSpecNodeId, setSelectedSpecNodeId] = useState<string | null>(null);
  const [editingExpNodeId, setEditingExpNodeId] = useState<string | null>(null);
  const [editingProgNodeId, setEditingProgNodeId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Derive current structured experience
  const currentExp: ProfessionExperience = useMemo(() => {
    if (professionExperience) {
      return {
        years: professionExperience.years ?? experienceYears,
        months: professionExperience.months ?? experienceMonths,
        days: professionExperience.days ?? experienceDays
      };
    }
    return {
      years: experienceYears,
      months: experienceMonths,
      days: experienceDays
    };
  }, [professionExperience, experienceYears, experienceMonths, experienceDays]);

  // Root Apprentice Node (Stufe 1: Lehrling)
  const rootNode = useMemo(() => {
    if (tree.rootNodeId) {
      const found = tree.nodes.find(n => n.id === tree.rootNodeId);
      if (found) return found;
    }
    return tree.nodes.find(n => n.tier === 'einstieg') || tree.nodes[0];
  }, [tree]);

  // Core Profession Nodes (Stufe 2: Kernberufe)
  const coreNodes = useMemo(() => {
    return tree.nodes.filter(n => n.tier === 'beruf');
  }, [tree]);

  // Grouped Branches: Core Node -> Its Specializations -> Its Masters
  const branches: BranchGroup[] = useMemo(() => {
    return coreNodes.map(coreNode => {
      const specializations = tree.nodes.filter(n => {
        if (n.tier !== 'spezialisierung') return false;
        if (n.specializationOf === coreNode.id || n.specializationOf === coreNode.name) return true;
        if (n.parentIds && n.parentIds.includes(coreNode.id)) return true;
        if (coreNode.childIds && coreNode.childIds.includes(n.id)) return true;
        return false;
      });

      const specIds = new Set(specializations.map(s => s.id));
      const masters = tree.nodes.filter(n => {
        if (n.tier !== 'meister') return false;
        if (n.parentIds && n.parentIds.some(pid => pid === coreNode.id || specIds.has(pid))) return true;
        if (coreNode.childIds && coreNode.childIds.includes(n.id)) return true;
        return false;
      });

      return {
        coreNode,
        specializations,
        masters
      };
    });
  }, [coreNodes, tree]);

  // Node evaluations (prerequisites fulfilled / missing)
  const evaluations = useMemo(() => {
    const map = new Map<string, NodeEvaluationResult>();
    for (const node of tree.nodes) {
      const evalResult = evaluateNodePrerequisites(node, {
        profession: currentProfession,
        professionSpecialization: currentSpecialization,
        professionRank: currentRank,
        experienceYears: currentExp.years,
        competencies
      });
      map.set(node.id, evalResult);
    }
    return map;
  }, [tree, currentProfession, currentSpecialization, currentRank, currentExp.years, competencies]);

  // Match active branch when profession / branches change
  useEffect(() => {
    if (branches.length === 0) return;

    if (selectedBranchId && branches.some(b => b.coreNode.id === selectedBranchId)) {
      return;
    }

    const matching = branches.find(b => {
      const coreMatch =
        b.coreNode.name.toLowerCase() === currentProfession.toLowerCase() ||
        b.coreNode.id.toLowerCase() === currentProfession.toLowerCase();
      const specMatch = b.specializations.some(
        s =>
          s.name.toLowerCase() === currentSpecialization.toLowerCase() ||
          s.id.toLowerCase() === currentSpecialization.toLowerCase()
      );
      return coreMatch || specMatch;
    });

    if (matching) {
      setSelectedBranchId(matching.coreNode.id);
    } else {
      setSelectedBranchId(branches[0].coreNode.id);
    }
  }, [branches, currentProfession, currentSpecialization, selectedBranchId]);

  // Active branch currently selected
  const activeBranch = useMemo(() => {
    return branches.find(b => b.coreNode.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // Keep active specialization in sync
  useEffect(() => {
    if (!activeBranch) return;
    if (currentSpecialization) {
      const matchingSpec = activeBranch.specializations.find(
        s =>
          s.name.toLowerCase() === currentSpecialization.toLowerCase() ||
          s.id.toLowerCase() === currentSpecialization.toLowerCase()
      );
      if (matchingSpec) {
        setSelectedSpecNodeId(matchingSpec.id);
        return;
      }
    }
    // If current selected spec does not belong to active branch, reset or pick first if appropriate
    if (selectedSpecNodeId && !activeBranch.specializations.some(s => s.id === selectedSpecNodeId)) {
      setSelectedSpecNodeId(null);
    }
  }, [activeBranch, currentSpecialization]);

  // Helper: check if a node represents the current active profession
  const isNodeActiveProfession = (node: ProfessionTreeNode): boolean => {
    const curP = currentProfession.toLowerCase().trim();
    const curS = currentSpecialization.toLowerCase().trim();
    const nodeName = node.name.toLowerCase().trim();
    const nodeId = node.id.toLowerCase().trim();

    if (node.tier === 'einstieg') {
      return (
        curP === nodeName ||
        curP === nodeId ||
        Boolean(node.possibleRanks && node.possibleRanks.some(r => r.toLowerCase() === curP)) ||
        (!curP)
      );
    }
    if (node.tier === 'beruf') {
      return (
        curP === nodeName ||
        curP === nodeId ||
        Boolean(node.possibleRanks && node.possibleRanks.some(r => r.toLowerCase() === curP))
      );
    }
    if (node.tier === 'spezialisierung' || node.tier === 'meister') {
      return (
        Boolean(curS && (curS === nodeName || curS === nodeId)) ||
        curP === nodeName ||
        Boolean(node.possibleRanks && node.possibleRanks.some(r => r.toLowerCase() === curP || r.toLowerCase() === curS))
      );
    }
    return false;
  };

  // Helper: extract competencies and talents for a node
  const getNodeCompetenciesAndTalents = (node: ProfessionTreeNode) => {
    const isRoot = node.tier === 'einstieg';
    const isCore = node.tier === 'beruf';

    let baseList: { name: string; category: string; defaultScore: number; defaultTalent: number }[] = [];

    if (isRoot) {
      baseList = [
        { name: 'Arbeitsplatz vorbereiten', category: 'Grundlagen', defaultScore: 68, defaultTalent: 3 },
        { name: 'Werkzeuge sicher benutzen', category: 'Grundlagen', defaultScore: 75, defaultTalent: 4 },
        { name: 'einfache Tätigkeiten', category: 'Grundlagen', defaultScore: 62, defaultTalent: 3 },
        { name: 'Materialkunde & Lagerung', category: 'Grundlagen', defaultScore: 54, defaultTalent: 3 }
      ];
    } else {
      // Find catalog entries
      const catalogEntries = getCatalogCompetenciesForProfession(node.name);
      if (catalogEntries.length > 0) {
        baseList = catalogEntries.slice(0, 7).map(c => ({
          name: c.name,
          category: c.category === 'Grundlage' ? 'Grundlagen' : c.category,
          defaultScore: c.category === 'Grundlage' ? 65 : 45,
          defaultTalent: 3
        }));
      } else if (node.suggestedCompetencies && node.suggestedCompetencies.length > 0) {
        baseList = node.suggestedCompetencies.map(name => ({
          name,
          category: 'Grundlagen',
          defaultScore: 55,
          defaultTalent: 3
        }));
      } else {
        baseList = [
          { name: `${node.name} Grundlagen`, category: 'Grundlagen', defaultScore: 50, defaultTalent: 3 },
          { name: `Werkzeuge & Techniken`, category: 'Grundlagen', defaultScore: 50, defaultTalent: 3 }
        ];
      }
    }

    // Map each item with character's actual competencies
    const compItems: NodeCompetencyItem[] = baseList.map(item => {
      const match = competencies.find(
        c => c.name.toLowerCase() === item.name.toLowerCase() || c.name.toLowerCase().includes(item.name.toLowerCase())
      );
      if (match) {
        return {
          name: match.name,
          proficiency: match.proficiency,
          category: item.category,
          talent: match.talent ?? item.defaultTalent,
          raw: match
        };
      }
      return {
        name: item.name,
        proficiency: item.defaultScore,
        category: item.category,
        talent: item.defaultTalent
      };
    });

    // Also include any user-added competencies belonging to this profession that aren't in base list
    const userMatches = competencies.filter(
      c =>
        c.professionId === node.id ||
        (c.professionId && c.professionId.toLowerCase() === node.name.toLowerCase())
    );
    for (const uc of userMatches) {
      if (!compItems.some(ci => ci.name.toLowerCase() === uc.name.toLowerCase())) {
        compItems.push({
          name: uc.name,
          proficiency: uc.proficiency,
          category: uc.category === 'Grundlage' ? 'Grundlagen' : uc.category,
          talent: uc.talent ?? 3,
          isCustom: true,
          raw: uc
        });
      }
    }

    // Derive talents:
    let talentItems: NodeTalentItem[] = [];
    if (isRoot) {
      talentItems = [
        { name: 'Handgeschick', score: 3 },
        { name: 'Lernfähigkeit', score: 4 },
        { name: 'Sorgfalt', score: 3 }
      ];
    } else if (node.name.toLowerCase().includes('koch')) {
      talentItems = [
        { name: 'Fleischgerichte', score: 3 },
        { name: 'Saucen', score: 5 },
        { name: 'Gemüse schneiden', score: 4 }
      ];
    } else if (node.name.toLowerCase().includes('schmied')) {
      talentItems = [
        { name: 'Hammerschlag', score: 4 },
        { name: 'Feuergefühl', score: 5 },
        { name: 'Formgebung', score: 3 }
      ];
    } else if (node.name.toLowerCase().includes('bäcker') || node.name.toLowerCase().includes('baecker')) {
      talentItems = [
        { name: 'Teigführung', score: 4 },
        { name: 'Ofenhitze', score: 5 },
        { name: 'Rezepturgefühl', score: 3 }
      ];
    } else {
      // Pick from the first 2-3 competencies talent ratings
      talentItems = compItems.slice(0, 3).map(ci => ({
        name: ci.name,
        score: ci.talent || 3
      }));
    }

    // Sync any custom talent ratings already set in character competencies
    talentItems = talentItems.map(t => {
      const match = competencies.find(c => c.name.toLowerCase().includes(t.name.toLowerCase()));
      if (match && typeof match.talent === 'number') {
        return { name: t.name, score: match.talent };
      }
      return t;
    });

    return { compItems, talentItems };
  };

  // State update handlers
  const handleSelectProfession = (node: ProfessionTreeNode) => {
    if (node.tier === 'einstieg') {
      const entryTitle = node.possibleRanks?.[0] || node.name;
      onSelectProfession(entryTitle, '', fieldId);
      setFeedbackMsg(`Einstiegsstatus '${entryTitle}' im Berufsfeld '${fieldName || fieldId}' festgelegt.`);
    } else if (node.tier === 'beruf') {
      onSelectProfession(node.name, '', fieldId);
      setFeedbackMsg(`Beruf '${node.name}' als Hauptberuf gewählt.`);
    } else if (node.tier === 'spezialisierung' || node.tier === 'meister') {
      if (activeBranch) {
        onSelectProfession(activeBranch.coreNode.name, node.name, fieldId);
      } else {
        onSelectProfession(node.name, node.name, fieldId);
      }
      setFeedbackMsg(`Spezialisierung '${node.name}' gewählt.`);
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAdjustProficiency = (compName: string, delta: number) => {
    if (!onCompetenciesChange) return;

    const existingIndex = competencies.findIndex(c => c.name.toLowerCase() === compName.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...competencies];
      const current = updated[existingIndex];
      const newScore = Math.max(0, Math.min(100, current.proficiency + delta));
      updated[existingIndex] = { ...current, proficiency: newScore };
      onCompetenciesChange(updated);
    } else {
      // Create new competency item
      const newComp: ProfessionCompetency = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: compName,
        category: 'Grundlage',
        proficiency: Math.max(0, Math.min(100, 50 + delta)),
        experiencePoints: 50,
        talent: 3
      };
      onCompetenciesChange([...competencies, newComp]);
    }
  };

  const handleSetTalent = (talentName: string, stars: number) => {
    if (!onCompetenciesChange) return;

    const existingIndex = competencies.findIndex(c => c.name.toLowerCase() === talentName.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...competencies];
      updated[existingIndex] = { ...updated[existingIndex], talent: stars };
      onCompetenciesChange(updated);
    } else {
      // Create competency representation with talent
      const newComp: ProfessionCompetency = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: talentName,
        category: 'Grundlage',
        proficiency: 50,
        experiencePoints: 50,
        talent: stars
      };
      onCompetenciesChange([...competencies, newComp]);
    }
    setFeedbackMsg(`Talent '${talentName}' auf ${stars}/5 Sterne gesetzt.`);
    setTimeout(() => setFeedbackMsg(null), 2000);
  };

  const handlePracticeComp = (item: NodeCompetencyItem) => {
    const compToPractice: ProfessionCompetency = item.raw || {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      category: item.category as any,
      proficiency: item.proficiency,
      experiencePoints: item.proficiency * 10,
      talent: item.talent
    };

    if (onPracticeCompetency) {
      onPracticeCompetency(compToPractice);
    }

    if (onCompetenciesChange) {
      const result = calculateCompetencyProgress(compToPractice, 35);
      const existingIndex = competencies.findIndex(c => c.name.toLowerCase() === item.name.toLowerCase());
      if (existingIndex >= 0) {
        const updated = [...competencies];
        updated[existingIndex] = result.updatedCompetency;
        onCompetenciesChange(updated);
      } else {
        onCompetenciesChange([...competencies, result.updatedCompetency]);
      }
      setFeedbackMsg(`+${result.effectiveXp} XP in '${item.name}' erhalten!`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleUpdateExperience = (years: number, months: number, days: number) => {
    const newExp: ProfessionExperience = { years, months, days };
    if (onExperienceChange) {
      onExperienceChange(newExp);
    }
    if (onProfessionProgressChange && professionProgress) {
      onProfessionProgressChange({
        ...professionProgress,
        experienceYears: years,
        experienceMonths: months,
        experienceDays: days
      });
    }
  };

  const handleUpdateProgress = (val: number) => {
    const safeVal = Math.max(0, Math.min(100, val));
    if (onProfessionProgressChange) {
      onProfessionProgressChange({
        ...(professionProgress || {
          professionName: currentProfession,
          level: currentRank,
          fieldId,
          overallProficiency: safeVal,
          experiencePoints: safeVal * 20
        }),
        overallProficiency: safeVal
      });
    }
  };

  // Reusable Single-Node Card Component adhering strictly to Section 5
  const renderProfessionNode = (node: ProfessionTreeNode, isApprentice = false) => {
    const isActive = isNodeActiveProfession(node);
    const evaluation = evaluations.get(node.id);
    const isAvailable = evaluation ? evaluation.isAvailable : true;
    const isLocked = !isAvailable && !isActive;

    // Progress value calculation
    let progressVal = 0;
    if (isApprentice) {
      // If character has higher profession, apprentice is considered completed (100%), otherwise active progress or 24%
      if (!isActive && currentProfession && !currentProfession.toLowerCase().includes('lehrling')) {
        progressVal = 100;
      } else {
        progressVal = professionProgress ? professionProgress.overallProficiency : 24;
      }
    } else if (isActive) {
      progressVal = professionProgress ? professionProgress.overallProficiency : 41;
    } else {
      progressVal = 0;
    }

    // Experience value calculation
    let formattedExp = '';
    if (isApprentice) {
      formattedExp = formatNodeExperience(currentExp, 180);
    } else if (isActive) {
      formattedExp = formatNodeExperience(currentExp, 0);
    } else {
      formattedExp = '0 Tage';
    }

    const { compItems, talentItems } = getNodeCompetenciesAndTalents(node);
    const isEditingExp = editingExpNodeId === node.id;
    const isEditingProg = editingProgNodeId === node.id;

    return (
      <div
        key={node.id}
        id={`profession-tree-node-${node.id}`}
        className={`w-full max-w-2xl mx-auto rounded-2xl border transition-all duration-200 shadow-md ${
          isActive
            ? 'bg-slate-900/95 border-amber-500/80 shadow-amber-950/20 ring-1 ring-amber-500/40'
            : isLocked
            ? 'bg-slate-950/80 border-rose-900/40 opacity-90'
            : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
        } p-4 sm:p-5`}
      >
        {/* Node Header: Berufsbezeichnung & Status Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-serif">
              {node.name}
            </h3>
            {node.description && (
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg leading-relaxed">
                {node.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {isActive ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/70 text-emerald-400 text-xs font-semibold shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aktueller Beruf</span>
              </div>
            ) : isLocked ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/70 text-rose-300 text-xs font-semibold shadow-sm">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Gesperrt</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectProfession(node)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 hover:bg-amber-600 hover:text-slate-950 border border-amber-600/70 text-amber-300 text-xs font-semibold transition cursor-pointer"
              >
                <span>Als Beruf wählen</span>
              </button>
            )}
          </div>
        </div>

        {/* Missing Prerequisites Notice (if locked) */}
        {isLocked && evaluation && evaluation.missingPrerequisites.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200">
            <span className="font-semibold block mb-1">Voraussetzungen noch nicht erfüllt:</span>
            <ul className="space-y-0.5 pl-4 list-disc text-[11px] text-rose-300">
              {evaluation.missingPrerequisites.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. Berufsfortschritt */}
        <div className="pt-3.5 mt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Berufsfortschritt</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400 text-sm">
                {progressVal} %
              </span>
              {isActive && (
                <button
                  type="button"
                  onClick={() => setEditingProgNodeId(isEditingProg ? null : node.id)}
                  className="text-[11px] text-slate-400 hover:text-amber-300 transition cursor-pointer"
                  title="Fortschritt anpassen"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Graphical Progress Bar matching prompt: ████████████░░░░░░░░ */}
          <div className="mt-1 font-mono text-xs text-amber-400 tracking-wider overflow-x-auto select-none py-0.5">
            {renderAsciiBar(progressVal, 20)}
          </div>

          {/* Interactive slider when adjusting */}
          {isActive && isEditingProg && (
            <div className="flex items-center gap-3 mt-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={e => handleUpdateProgress(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="font-mono text-xs text-white w-8 text-right font-bold">
                {progressVal}%
              </span>
            </div>
          )}
        </div>

        {/* 2. Berufserfahrung */}
        <div className="pt-3 mt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Berufserfahrung</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-slate-200">
                {formattedExp}
              </span>
              {isActive && (
                <button
                  type="button"
                  onClick={() => setEditingExpNodeId(isEditingExp ? null : node.id)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {isEditingExp ? 'Fertig' : 'Anpassen'}
                </button>
              )}
            </div>
          </div>

          {/* Interactive experience adjustment */}
          {isActive && isEditingExp && (
            <div className="flex flex-wrap items-center gap-3 mt-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Jahre:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentExp.years}
                  onChange={e =>
                    handleUpdateExperience(parseInt(e.target.value, 10) || 0, currentExp.months || 0, currentExp.days || 0)
                  }
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-center outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Monate:</span>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={currentExp.months || 0}
                  onChange={e =>
                    handleUpdateExperience(currentExp.years, parseInt(e.target.value, 10) || 0, currentExp.days || 0)
                  }
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-center outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Tage:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={currentExp.days || 0}
                  onChange={e =>
                    handleUpdateExperience(currentExp.years, currentExp.months || 0, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-center outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Fachkompetenzen */}
        <div className="pt-3 mt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
            Fachkompetenzen
          </div>

          {/* Grundlagen Section */}
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
            Grundlagen
          </div>

          <div className="flex flex-col gap-1">
            {compItems.map(comp => (
              <div
                key={comp.name}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-800/40 group transition"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="text-slate-200 truncate">{comp.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-amber-400 text-xs font-semibold w-12 text-right">
                    {comp.proficiency} %
                  </span>

                  <div className="opacity-60 group-hover:opacity-100 flex items-center gap-1 transition">
                    <button
                      type="button"
                      onClick={() => handleAdjustProficiency(comp.name, -5)}
                      className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer"
                      title="Wert verringern (-5%)"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustProficiency(comp.name, +5)}
                      className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer"
                      title="Wert erhöhen (+5%)"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePracticeComp(comp)}
                      className="px-1.5 py-0.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/60 text-amber-300 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                      title="Praktische Übungseinheit absolvieren"
                    >
                      <span>Üben</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Talente */}
        <div className="pt-3 mt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
            Talente
          </div>

          <div className="flex flex-col gap-1.5">
            {talentItems.map(talentItem => (
              <div
                key={talentItem.name}
                className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded-lg hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="text-slate-200 truncate">{talentItem.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map(starNum => {
                    const isFilled = starNum <= talentItem.score;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => handleSetTalent(talentItem.name, starNum)}
                        className="text-sm transition hover:scale-110 cursor-pointer outline-none focus:outline-none"
                        title={`Talent ${starNum}/5 zuweisen`}
                      >
                        {isFilled ? (
                          <span className="text-amber-400">★</span>
                        ) : (
                          <span className="text-slate-600">☆</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full py-2">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-950 border border-amber-500 text-amber-100 text-xs px-4 py-2.5 rounded-xl shadow-xl animate-in fade-in duration-200">
          {feedbackMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LEHRLING (Der erste Knoten des Berufstrees)                            */}
      {/* ========================================================================= */}
      {rootNode && renderProfessionNode(rootNode, true)}

      {/* ========================================================================= */}
      {/* 2. VERBINDUNGSLINIE 1                                                     */}
      {/* ========================================================================= */}
      <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-amber-500/40 my-1 mx-auto" />

      {/* ========================================================================= */}
      {/* 3. BERUFSZWEIG WÄHLEN (Kompakte Tag-/Chip-Darstellung)                    */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col items-center justify-center my-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
          Berufszweig wählen
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto px-2">
          {branches.map(b => {
            const isSelected = b.coreNode.id === selectedBranchId;
            const isCurrentActive =
              b.coreNode.name.toLowerCase() === currentProfession.toLowerCase() ||
              b.coreNode.id.toLowerCase() === currentProfession.toLowerCase();

            return (
              <button
                key={b.coreNode.id}
                type="button"
                onClick={() => {
                  setSelectedBranchId(b.coreNode.id);
                  setSelectedSpecNodeId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-md ring-2 ring-amber-400/80 scale-105'
                    : isCurrentActive
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 font-semibold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {isCurrentActive && <Check className="w-3 h-3 text-emerald-400" />}
                <span>{b.coreNode.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VERBINDUNGSLINIE 2                                                     */}
      {/* ========================================================================= */}
      <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/40 to-amber-500/60 my-1 mx-auto" />

      {/* ========================================================================= */}
      {/* 5. KONKRETER BERUFSKNOTEN (Ausgewählter Kernberuf)                         */}
      {/* ========================================================================= */}
      {activeBranch && renderProfessionNode(activeBranch.coreNode, false)}

      {/* ========================================================================= */}
      {/* 6. WEITERE BERUFSÄSTE / SPEZIALISIERUNGEN                                 */}
      {/* ========================================================================= */}
      {activeBranch && activeBranch.specializations.length > 0 && (
        <>
          <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-amber-500/40 my-1 mx-auto" />

          <div className="w-full flex flex-col items-center justify-center my-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 mb-2">
              Weitere Berufsäste & Spezialisierungen
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto px-2">
              {activeBranch.specializations.map(specNode => {
                const isSelected = selectedSpecNodeId === specNode.id;
                const isCurrentActive =
                  currentSpecialization &&
                  (specNode.name.toLowerCase() === currentSpecialization.toLowerCase() ||
                    specNode.id.toLowerCase() === currentSpecialization.toLowerCase());
                const evaluation = evaluations.get(specNode.id);
                const isAvailable = evaluation ? evaluation.isAvailable : true;

                return (
                  <button
                    key={specNode.id}
                    type="button"
                    onClick={() => setSelectedSpecNodeId(isSelected ? null : specNode.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-600 text-slate-950 font-bold shadow-md ring-2 ring-amber-400/80 scale-105'
                        : isCurrentActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/70 font-semibold'
                        : isAvailable
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950 text-slate-500 border border-slate-800/60 opacity-80'
                    }`}
                  >
                    {!isAvailable && <Lock className="w-3 h-3 text-rose-400" />}
                    {isCurrentActive && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>{specNode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. AUSGEWÄHLTER SPEZIALISIERUNGS-KNOTEN */}
          {selectedSpecNodeId && (() => {
            const specNode = activeBranch.specializations.find(s => s.id === selectedSpecNodeId);
            if (!specNode) return null;
            return (
              <>
                <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/40 to-amber-500/60 my-1 mx-auto" />
                {renderProfessionNode(specNode, false)}

                {/* Optional: Check if this specialization has masters/further child nodes */}
                {activeBranch.masters.filter(m => m.parentIds?.includes(specNode.id)).length > 0 && (
                  <>
                    <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-amber-500/40 my-1 mx-auto" />
                    <div className="w-full flex flex-col items-center justify-center my-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 mb-2">
                        Höchste Meisterschaft & Perfektion
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto px-2">
                        {activeBranch.masters
                          .filter(m => m.parentIds?.includes(specNode.id))
                          .map(masterNode => {
                            const isMasterSelected = selectedSpecNodeId === masterNode.id;
                            const isMasterActive =
                              currentSpecialization &&
                              (masterNode.name.toLowerCase() === currentSpecialization.toLowerCase() ||
                                masterNode.id.toLowerCase() === currentSpecialization.toLowerCase());
                            return (
                              <button
                                key={masterNode.id}
                                type="button"
                                onClick={() => setSelectedSpecNodeId(masterNode.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                  isMasterSelected
                                    ? 'bg-amber-600 text-slate-950 font-bold shadow-md ring-2 ring-amber-400/80'
                                    : isMasterActive
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 font-semibold'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                                }`}
                              >
                                {isMasterActive && <Check className="w-3 h-3 text-emerald-400" />}
                                <span>{masterNode.name}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};
