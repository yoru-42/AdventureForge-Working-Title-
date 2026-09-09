import React, { useState, useMemo, useEffect } from 'react';
import {
  ProfessionTreeNode,
  ProfessionNodeTier,
  getProfessionTreeForField,
  evaluateNodePrerequisites,
  NodeEvaluationResult
} from '../lib/professionTreeData';
import { ProfessionCompetency } from '../types';
import {
  getCatalogCompetenciesForProfession,
  ProfessionCompetencyDefinition
} from '../lib/professionCompetencies';
import {
  createCompetencyFromDefinition,
  calculateCompetencyProgress,
  normalizeCompetency,
  getTalentLabel
} from '../services/professionCompetencyService';
import {
  CheckCircle2,
  Lock,
  Compass,
  ArrowRight,
  BookOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  GitFork,
  Check,
  Plus,
  Minus,
  Award,
  Trash2,
  Dumbbell,
  GraduationCap
} from 'lucide-react';

export interface ProfessionSkillTreeProps {
  fieldId: string;
  fieldName?: string;
  currentProfession: string;
  currentSpecialization?: string;
  currentRank?: string;
  experienceYears?: number;
  competencies?: ProfessionCompetency[];
  onCompetenciesChange?: (competencies: ProfessionCompetency[]) => void;
  onPracticeCompetency?: (competency: ProfessionCompetency) => void;
  additionalDirections?: string[];
  onSelectProfession: (professionName: string, specialization?: string, fieldId?: string) => void;
  onToggleAdditionalDirection?: (directionName: string, tier: ProfessionNodeTier, fieldId?: string) => void;
  readOnly?: boolean;
}

const TIER_LABELS: Record<ProfessionNodeTier, string> = {
  einstieg: 'Stufe 1: Lehrling / Einstieg',
  beruf: 'Stufe 2: Kernberufe',
  spezialisierung: 'Stufe 3: Spezialisierungen',
  meister: 'Stufe 4: Meisterstufe'
};

const TIER_BADGE_STYLES: Record<ProfessionNodeTier, string> = {
  einstieg: 'bg-slate-800 text-slate-300 border-slate-700',
  beruf: 'bg-amber-950/50 text-amber-300 border-amber-800/60 font-medium',
  spezialisierung: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 font-medium',
  meister: 'bg-amber-500/20 text-amber-200 border-amber-500/40 font-semibold'
};

interface BranchGroup {
  coreNode: ProfessionTreeNode;
  specializations: ProfessionTreeNode[];
  masters: ProfessionTreeNode[];
}

export const ProfessionSkillTree: React.FC<ProfessionSkillTreeProps> = ({
  fieldId,
  fieldName,
  currentProfession,
  currentSpecialization = '',
  currentRank = '',
  experienceYears = 0,
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

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [compCategoryFilter, setCompCategoryFilter] = useState<string>('Alle');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Map of node evaluations
  const evaluations = useMemo(() => {
    const map = new Map<string, NodeEvaluationResult>();
    for (const node of tree.nodes) {
      const evalResult = evaluateNodePrerequisites(node, {
        profession: currentProfession,
        professionSpecialization: currentSpecialization,
        professionRank: currentRank,
        experienceYears,
        competencies
      });
      map.set(node.id, evalResult);
    }
    return map;
  }, [tree, currentProfession, currentSpecialization, currentRank, experienceYears, competencies]);

  // Root Apprentice Node (Stufe 1: Lehrling)
  const rootNode = useMemo(() => {
    if (tree.rootNodeId) {
      const found = tree.nodes.find(n => n.id === tree.rootNodeId);
      if (found) return found;
    }
    return tree.nodes.find(n => n.tier === 'einstieg') || tree.nodes[0];
  }, [tree]);

  // Core Profession Nodes (Stufe 2: Kernberufe / Gesellen)
  const coreNodes = useMemo(() => {
    return tree.nodes.filter(n => n.tier === 'beruf');
  }, [tree]);

  // Grouped Branches: Core Node -> Its Specializations -> Its Masters
  const branches: BranchGroup[] = useMemo(() => {
    return coreNodes.map(coreNode => {
      // Find specializations connected to this core node
      const specializations = tree.nodes.filter(n => {
        if (n.tier !== 'spezialisierung') return false;
        if (n.specializationOf === coreNode.id || n.specializationOf === coreNode.name) return true;
        if (n.parentIds && n.parentIds.includes(coreNode.id)) return true;
        if (coreNode.childIds && coreNode.childIds.includes(n.id)) return true;
        return false;
      });

      // Find masters connected to this core or its specializations
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

  // Helper matchers
  const isNodeAdditionalDirection = (node: ProfessionTreeNode): boolean => {
    return additionalDirections.some(
      dir => dir.toLowerCase() === node.name.toLowerCase() || dir.toLowerCase() === node.id.toLowerCase()
    );
  };

  const isNodePrimaryProfession = (node: ProfessionTreeNode): boolean => {
    return node.name.toLowerCase() === currentProfession.toLowerCase() || node.id.toLowerCase() === currentProfession.toLowerCase();
  };

  const isNodePrimarySpecialization = (node: ProfessionTreeNode): boolean => {
    return !!currentSpecialization && (
      node.name.toLowerCase() === currentSpecialization.toLowerCase() || node.id.toLowerCase() === currentSpecialization.toLowerCase()
    );
  };

  // Automatically select matching branch when profession, specialization, or branches change
  useEffect(() => {
    if (branches.length === 0) return;

    // Keep existing valid selection if user has explicitly chosen one that exists
    if (selectedBranchId && branches.some(b => b.coreNode.id === selectedBranchId)) {
      return;
    }

    // Match current profession or specialization
    const matching = branches.find(b =>
      isNodePrimaryProfession(b.coreNode) ||
      b.specializations.some(s => isNodePrimarySpecialization(s)) ||
      isNodeAdditionalDirection(b.coreNode) ||
      b.specializations.some(s => isNodeAdditionalDirection(s))
    );

    if (matching) {
      setSelectedBranchId(matching.coreNode.id);
    } else {
      setSelectedBranchId(branches[0].coreNode.id);
    }
  }, [branches, currentProfession, currentSpecialization, selectedBranchId]);

  // Active single branch to display under Lehrling
  const activeBranch = useMemo(() => {
    if (branches.length === 0) return null;
    if (selectedBranchId) {
      const found = branches.find(b => b.coreNode.id === selectedBranchId);
      if (found) return found;
    }
    const matching = branches.find(b =>
      isNodePrimaryProfession(b.coreNode) ||
      b.specializations.some(s => isNodePrimarySpecialization(s))
    );
    return matching || branches[0];
  }, [branches, selectedBranchId, currentProfession, currentSpecialization]);

  // Selected node object (only for non-core nodes like Lehrling or Spezialisierung, to avoid duplicate Stufe 2 inspector)
  const activeDetailNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = tree.nodes.find(n => n.id === selectedNodeId);
    if (found && found.tier !== 'beruf') return found;
    return null;
  }, [selectedNodeId, tree]);

  const activeDetailEval = useMemo(() => {
    if (!activeDetailNode) return null;
    return evaluations.get(activeDetailNode.id) || null;
  }, [activeDetailNode, evaluations]);

  const handleApplyPrimaryProfession = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    if (node.tier === 'spezialisierung') {
      const parentNode = tree.nodes.find(n => node.parentIds.includes(n.id) && n.tier === 'beruf');
      const baseProf = parentNode ? parentNode.name : currentProfession || node.name;
      onSelectProfession(baseProf, node.name, fieldId);
    } else {
      onSelectProfession(node.name, '', fieldId);
    }
    setFeedbackMsg(`Hauptberuf festgelegt: ${node.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleApplySpecialization = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    const parentNode = tree.nodes.find(n => node.parentIds.includes(n.id) && n.tier === 'beruf');
    const baseProf = parentNode ? parentNode.name : currentProfession;
    onSelectProfession(baseProf, node.name, fieldId);
    setFeedbackMsg(`Spezialisierung festgelegt: ${node.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleToggleDirection = (node: ProfessionTreeNode) => {
    if (readOnly || !onToggleAdditionalDirection) return;
    onToggleAdditionalDirection(node.name, node.tier, fieldId);
  };

  // Competency management helpers for the active Kernberuf
  const catalogDefsForActiveBranch = useMemo(() => {
    if (!activeBranch) return [];
    return getCatalogCompetenciesForProfession(activeBranch.coreNode.name);
  }, [activeBranch]);

  const handleLearnCompetency = (def: ProfessionCompetencyDefinition) => {
    if (!onCompetenciesChange) return;
    const existing = (competencies || []).find(
      c => c.id === def.id || c.name.toLowerCase().trim() === def.name.toLowerCase().trim()
    );
    if (existing) {
      setFeedbackMsg(`Fachkompetenz "${def.name}" ist bereits erlernt.`);
      setTimeout(() => setFeedbackMsg(null), 2500);
      return;
    }
    const newComp = createCompetencyFromDefinition(def, 3, 10);
    onCompetenciesChange([...(competencies || []), newComp]);
    setFeedbackMsg(`Fachkompetenz erlernt: ${def.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handlePracticeCompetency = (comp: ProfessionCompetency) => {
    if (onPracticeCompetency) {
      onPracticeCompetency(comp);
      return;
    }
    if (onCompetenciesChange) {
      const result = calculateCompetencyProgress(comp, 30);
      const updatedList = (competencies || []).map(c => (c.id === comp.id ? result.updatedCompetency : c));
      onCompetenciesChange(updatedList);
      setFeedbackMsg(`Übung: ${comp.name} +${result.proficiencyGain}% (${result.updatedCompetency.proficiency}%)`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleAdjustProficiency = (comp: ProfessionCompetency, delta: number) => {
    if (!onCompetenciesChange) return;
    const newProf = Math.max(0, Math.min(100, (comp.proficiency || 0) + delta));
    const updated = {
      ...comp,
      proficiency: newProf,
      experiencePoints: Math.max(comp.experiencePoints || 0, newProf * 10)
    };
    onCompetenciesChange((competencies || []).map(c => (c.id === comp.id ? updated : c)));
  };

  const handleDeleteCompetency = (compId: string) => {
    if (!onCompetenciesChange) return;
    onCompetenciesChange((competencies || []).filter(c => c.id !== compId));
  };

  const handleAddAllFoundations = () => {
    if (!onCompetenciesChange || !activeBranch) return;
    const foundations = catalogDefsForActiveBranch.filter(d => d.category === 'Grundlage');
    const existingIds = new Set((competencies || []).map(c => c.id));
    const existingNames = new Set((competencies || []).map(c => c.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '')));
    const toAdd = foundations
      .filter(f => {
        const norm = f.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
        return !existingIds.has(f.id) && !existingNames.has(norm);
      })
      .map(f => createCompetencyFromDefinition(f, 3, 10));

    if (toAdd.length > 0) {
      onCompetenciesChange([...(competencies || []), ...toAdd]);
      setFeedbackMsg(`${toAdd.length} typische Grundlagen-Kompetenzen hinzugefügt.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg('Alle Grundlagen für diesen Beruf sind bereits vorhanden.');
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleCreateCustomCompetency = () => {
    if (!onCompetenciesChange || !activeBranch) return;
    const newComp = normalizeCompetency({
      name: `Neue Fachkompetenz (${activeBranch.coreNode.name})`,
      category: 'Grundlage',
      proficiency: 10,
      experiencePoints: 50,
      talent: 3,
      professionId: activeBranch.coreNode.id
    });
    onCompetenciesChange([...(competencies || []), newComp]);
    setFeedbackMsg('Neue Fachkompetenz angelegt.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Node Card Component (Used for Lehrling, Spezialisierungen & Meister)
  const renderNodeCard = (node: ProfessionTreeNode, isRoot: boolean = false) => {
    const evalResult = evaluations.get(node.id) || {
      isAvailable: true,
      isActive: false,
      missingPrerequisites: [],
      fulfilledPrerequisites: []
    };

    const isPrimary = isNodePrimaryProfession(node);
    const isSpec = isNodePrimarySpecialization(node);
    const isAdditional = isNodeAdditionalDirection(node);
    const isSelected = selectedNodeId === node.id;

    // Card border and background styling
    let cardStyle = 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900';
    if (isPrimary) {
      cardStyle = 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/50';
    } else if (isSpec) {
      cardStyle = 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50';
    } else if (isAdditional) {
      cardStyle = 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/30 ring-1 ring-indigo-500/50';
    } else if (isSelected) {
      cardStyle = 'bg-slate-800/90 border-slate-400 ring-1 ring-slate-400';
    } else if (!evalResult.isAvailable) {
      cardStyle = 'bg-slate-950/60 border-slate-900/80 opacity-75 hover:opacity-95';
    }

    return (
      <div
        key={node.id}
        id={`tree-node-${node.id}`}
        onClick={() => setSelectedNodeId(node.id)}
        className={`group rounded-xl p-3.5 transition-all cursor-pointer border text-left flex flex-col justify-between ${cardStyle} ${
          isRoot ? 'w-full max-w-md mx-auto min-h-[110px]' : 'min-w-[250px] w-full min-h-[120px]'
        }`}
      >
        {/* Top Meta Line */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
              TIER_BADGE_STYLES[node.tier]
            }`}
          >
            {node.tier === 'einstieg'
              ? 'Stufe 1: Lehrling'
              : node.tier === 'beruf'
              ? 'Kernberuf'
              : node.tier === 'spezialisierung'
              ? 'Spezialisierung'
              : 'Meistergrad'}
          </span>

          {/* Status Badge */}
          {isPrimary ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/90 border border-amber-600/60 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hauptberuf</span>
            </span>
          ) : isSpec ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/90 border border-cyan-600/60 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Spezialisierung</span>
            </span>
          ) : isAdditional ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/90 border border-indigo-600/60 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              <GitFork className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Weitere Richtung</span>
            </span>
          ) : evalResult.isAvailable ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verfügbar</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-900/50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              <Lock className="w-3 h-3 text-rose-400 shrink-0" />
              <span>{evalResult.missingPrerequisites.length} Bedingung{evalResult.missingPrerequisites.length > 1 ? 'en' : ''}</span>
            </span>
          )}
        </div>

        {/* Node Title & Description */}
        <div>
          <h5 className="text-sm font-semibold text-white group-hover:text-amber-300 transition leading-snug">
            {node.name}
          </h5>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 whitespace-nowrap">
            {node.prerequisites.length > 0
              ? `${node.prerequisites.length} Voraussetzung${node.prerequisites.length > 1 ? 'en' : ''}`
              : 'Offener Einstieg'}
          </span>
          <div className="flex items-center gap-2">
            {!readOnly && node.tier === 'spezialisierung' && !isSpec && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplySpecialization(node);
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/80 transition cursor-pointer font-medium"
              >
                Wählen
              </button>
            )}
            <span className="text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0">
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  // UNIFIED KERNBERUF CARD (STUFE 2: KERNBERUF + FACHKOMPETENZEN + WICHTIGE INFOS IN EINEM FELD)
  const renderUnifiedKernberufCard = (coreNode: ProfessionTreeNode) => {
    const evalResult = evaluations.get(coreNode.id) || {
      isAvailable: true,
      isActive: false,
      missingPrerequisites: [],
      fulfilledPrerequisites: []
    };
    const isPrimary = isNodePrimaryProfession(coreNode);

    // Filtered competencies for this profession
    const cName = coreNode.name.toLowerCase();
    const cId = coreNode.id.toLowerCase();
    const catalogDefs = catalogDefsForActiveBranch;
    const catalogIds = new Set(catalogDefs.map(d => d.id));
    const catalogNames = new Set(catalogDefs.map(d => d.name.toLowerCase().trim()));

    const learnedForThisProf = (competencies || []).filter(c => {
      if (c.professionId && (c.professionId.toLowerCase() === cId || c.professionId.toLowerCase() === cName)) {
        return true;
      }
      if (catalogIds.has(c.id)) return true;
      if (catalogNames.has(c.name.toLowerCase().trim())) return true;
      return false;
    });

    // Merge learned and available catalog items
    interface DisplayCompetencyItem {
      id: string;
      name: string;
      category: ProfessionCompetency['category'];
      description: string;
      learned?: ProfessionCompetency;
      definition?: ProfessionCompetencyDefinition;
    }

    const items: DisplayCompetencyItem[] = [];
    const processedIds = new Set<string>();
    const processedNames = new Set<string>();

    // 1. Process catalog definitions
    for (const def of catalogDefs) {
      const normName = def.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      if (processedIds.has(def.id) || processedNames.has(normName)) continue;
      processedIds.add(def.id);
      processedNames.add(normName);

      const learned = learnedForThisProf.find(c => {
        if (c.id === def.id) return true;
        const cNorm = c.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
        return cNorm === normName;
      });

      if (learned) {
        processedIds.add(learned.id);
        processedNames.add(learned.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, ''));
      }

      items.push({
        id: def.id,
        name: def.name,
        category: def.category,
        description: def.description,
        learned,
        definition: def
      });
    }

    // 2. Add custom or non-catalog competencies assigned to this profession
    for (const learned of learnedForThisProf) {
      const normName = learned.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      if (!processedIds.has(learned.id) && !processedNames.has(normName)) {
        processedIds.add(learned.id);
        processedNames.add(normName);
        items.push({
          id: learned.id,
          name: learned.name,
          category: learned.category,
          description: learned.description || 'Individuelle berufliche Fachkompetenz.',
          learned
        });
      }
    }

    // Filter items by category
    const filteredItems = compCategoryFilter === 'Alle'
      ? items
      : items.filter(item => item.category === compCategoryFilter);

    const learnedCount = items.filter(i => !!i.learned).length;

    return (
      <div
        id={`unified-kernberuf-${coreNode.id}`}
        className="w-full bg-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg shadow-slate-950/40 text-left transition"
      >
        {/* Header: Title, Status Badge, Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full border bg-amber-950/70 border-amber-600/60 text-amber-300 font-semibold whitespace-nowrap">
                Stufe 2: Kernberuf
              </span>
              {isPrimary ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Aktiver Hauptberuf</span>
                </span>
              ) : evalResult.isAvailable ? (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Verfügbar</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-900/50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>{evalResult.missingPrerequisites.length} Voraussetzung(en)</span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              {coreNode.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {coreNode.description}
            </p>
          </div>

          {/* Action Button */}
          {!readOnly && (
            <div className="shrink-0 flex items-center gap-2">
              {isPrimary ? (
                <div className="px-3.5 py-2 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Hauptberuf aktiv</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApplyPrimaryProfession(coreNode)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Als Hauptberuf festlegen</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback Alert if practice/learn happened */}
        {feedbackMsg && (
          <div className="p-2.5 bg-amber-950/60 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-amber-400 hover:text-white text-xs cursor-pointer ml-2"
            >
              Ausblenden
            </button>
          </div>
        )}

        {/* WICHTIGE BERUFS-INFORMATIONEN (Ränge, Voraussetzungen, Aufstiegswege) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Mögliche Ränge */}
          <div className="flex flex-col gap-1 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Mögliche Berufsgrade & Ränge</span>
            </span>
            <span className="text-slate-300 leading-relaxed">
              {coreNode.possibleRanks && coreNode.possibleRanks.length > 0
                ? coreNode.possibleRanks.join(' • ')
                : 'Lehrling • Geselle • Altgeselle • Meister'}
            </span>
          </div>

          {/* Aufstiegswege & Voraussetzungen */}
          <div className="flex flex-col gap-1 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Karriere- & Aufstiegswege</span>
            </span>
            <div className="flex flex-col gap-1">
              {coreNode.careerRoutes && coreNode.careerRoutes.length > 0 ? (
                coreNode.careerRoutes.map(r => (
                  <div key={r.id} className="flex items-start justify-between gap-2 text-[11px]">
                    <span className="text-slate-200 font-medium">{r.name}:</span>
                    <span className="text-slate-400 text-right">{r.requirementsSummary}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-400">Reguläre Gesellen- und Zunftprüfung</span>
              )}
            </div>
          </div>
        </div>

        {/* PASSENDE FACHKOMPETENZEN FÜR DIESEN BERUF */}
        <div className="flex flex-col gap-3 pt-3 border-t border-amber-900/40">
          {/* Competency Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Fachkompetenzen für {coreNode.name} ({learnedCount} erlernt / {items.length} gesamt)
              </h4>
            </div>

            {!readOnly && (
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddAllFoundations}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  title="Fügt alle typischen Grundlagen-Kompetenzen für diesen Beruf hinzu"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grundlagen hinzufügen</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateCustomCompetency}
                  className="px-2.5 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Neue Kompetenz</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {(['Alle', 'Grundlage', 'Fortgeschritten', 'Spezialisierung', 'Meisterschaft'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCompCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  compCategoryFilter === cat
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List of Competencies */}
          <div className="flex flex-col gap-2">
            {filteredItems.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                Keine Fachkompetenzen in dieser Kategorie vorhanden.
              </div>
            ) : (
              filteredItems.map((item, itemIdx) => {
                const isLearned = !!item.learned;
                const comp = item.learned;

                return (
                  <div
                    key={`kernberuf-comp-${item.id}-${itemIdx}`}
                    className={`rounded-xl p-3 border transition flex flex-col gap-2 ${
                      isLearned
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/60'
                    }`}
                  >
                    {/* Top Row: Category Badge, Name, Actions */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Badge */}
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded border whitespace-nowrap font-medium ${
                            item.category === 'Grundlage'
                              ? 'bg-sky-950/70 text-sky-300 border-sky-800/60'
                              : item.category === 'Fortgeschritten'
                              ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60'
                              : item.category === 'Spezialisierung'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {item.category}
                        </span>

                        {/* Name */}
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {item.name}
                        </span>

                        {/* Status Label */}
                        {isLearned ? (
                          <span className="text-[11px] px-2 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono">
                            {comp?.proficiency || 0}%
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            Katalog
                          </span>
                        )}
                      </div>

                      {/* Right Action Buttons */}
                      {!readOnly && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLearned && comp ? (
                            <>
                              {/* Practice Button */}
                              <button
                                type="button"
                                onClick={() => handlePracticeCompetency(comp)}
                                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Gezielte Übungseinheit absolvieren (+XP)"
                              >
                                <Dumbbell className="w-3 h-3 text-amber-400" />
                                <span>Üben</span>
                              </button>

                              {/* Stepper Buttons */}
                              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustProficiency(comp, -5)}
                                  className="px-2 py-1 hover:bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                                  title="Wert um 5% verringern"
                                >
                                  -
                                </button>
                                <span className="px-1.5 text-[11px] text-slate-300 font-mono">
                                  {comp.proficiency}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustProficiency(comp, 5)}
                                  className="px-2 py-1 hover:bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                                  title="Wert um 5% erhöhen"
                                >
                                  +
                                </button>
                              </div>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCompetency(comp.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                title="Kompetenz entfernen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : item.definition ? (
                            /* Learn Button */
                            <button
                              type="button"
                              onClick={() => handleLearnCompetency(item.definition!)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Erlernen</span>
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* If Learned: Progress Bar & XP */}
                    {isLearned && comp && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, comp.proficiency))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {comp.experiencePoints || 0} XP
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <GitFork className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                Talentbaum: {tree.fieldName}
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/70 text-slate-300 font-mono">
                {branches.length} Zweige • {tree.nodes.length} Stufen
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Entwicklungspfad: Lehrling → Zweig wählen → Kernberuf & Fachkompetenzen → Spezialisierungen → Meisterstufe
            </p>
          </div>
        </div>
      </div>

      {/* BRANCHING TALENT TREE VISUALIZATION */}
      <div className="w-full pb-2 pt-1">
        <div className="flex flex-col items-center gap-4 w-full">

          {/* LEVEL 1: WURZEL / EINSTIEG (LEHRLING) */}
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>{TIER_LABELS.einstieg}</span>
            </div>

            {/* Apprentice Root Card */}
            {rootNode && renderNodeCard(rootNode, true)}
          </div>

          {/* Tree Trunk: From Lehrling down to Branch Selector */}
          <div className="w-full flex flex-col items-center my-0.5">
            <div className="w-0.5 h-5 bg-amber-500/60" />
          </div>

          {/* ZWEIG-AUSWAHL: Felder wie Schmied, Schreiner, Koch, Bäcker usw. direkt unter Lehrling */}
          <div className="w-full flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <GitFork className="w-3.5 h-3.5 text-amber-400" />
              <span>Berufszweig wählen</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-4xl px-2">
              {branches.map(branch => {
                const isSelected = activeBranch?.coreNode.id === branch.coreNode.id;
                const isCurrentProf =
                  isNodePrimaryProfession(branch.coreNode) ||
                  branch.specializations.some(s => isNodePrimarySpecialization(s));
                const isAdditional =
                  isNodeAdditionalDirection(branch.coreNode) ||
                  branch.specializations.some(s => isNodeAdditionalDirection(s));

                return (
                  <button
                    key={branch.coreNode.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranchId(branch.coreNode.id);
                      setSelectedNodeId(branch.coreNode.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-slate-950 font-semibold shadow-md ring-1 ring-amber-400'
                        : isCurrentProf
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-700/60 hover:bg-amber-900/60'
                        : isAdditional
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/60'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{branch.coreNode.name}</span>
                    {isCurrentProf && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isSelected
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-900/90 text-amber-200'
                        }`}
                      >
                        Aktiv
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tree Trunk: From Branch Selector down into the Active Branch */}
          <div className="w-full flex flex-col items-center my-0.5">
            <div className="w-0.5 h-5 bg-amber-500/60" />
          </div>

          {/* AKTIVER ZWEIG: NUR DIESER WIRD DARGESTELLT */}
          {activeBranch && (
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
              {/* STUFE 2: KERNBERUF & FACHKOMPETENZEN - ZUSAMMEN IN EINEM FELD */}
              <div className="w-full flex flex-col items-center">
                {renderUnifiedKernberufCard(activeBranch.coreNode)}

                {(activeBranch.specializations.length > 0 || activeBranch.masters.length > 0) && (
                  <div className="w-0.5 h-4 bg-slate-700 my-1" />
                )}
              </div>

              {/* STUFE 3: SPEZIALISIERUNGEN DES ZWEIGS */}
              {activeBranch.specializations.length > 0 && (
                <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-slate-800/80 ml-4 sm:ml-6">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                      <Compass className="w-3 h-3" />
                      <span>Stufe 3: Spezialisierungen</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {activeBranch.specializations.length} Pfad{activeBranch.specializations.length !== 1 ? 'e' : ''}
                    </span>
                  </div>

                  {activeBranch.specializations.map(specNode => (
                    <div key={specNode.id} className="relative w-full">
                      <div className="absolute -left-3 top-5 w-3 h-0.5 bg-slate-800" />
                      {renderNodeCard(specNode)}
                    </div>
                  ))}
                </div>
              )}

              {/* STUFE 4: MEISTERSTUFE DES ZWEIGS */}
              {activeBranch.masters.length > 0 && (
                <div className="flex flex-col gap-2 mt-1 pt-2.5 border-t border-amber-900/30">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <Award className="w-3 h-3" />
                    <span>Stufe 4: Meisterstufe & Höchste Kunst</span>
                  </div>

                  {activeBranch.masters.map(masterNode => (
                    <div key={masterNode.id} className="w-full">
                      {renderNodeCard(masterNode)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SELECTED NODE INSPECTOR / DETAIL PANEL (Only for Lehrling, Spezialisierungen & Meister) */}
      {activeDetailNode && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 mt-2">
          {/* Header of Inspector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                    TIER_BADGE_STYLES[activeDetailNode.tier]
                  }`}
                >
                  {TIER_LABELS[activeDetailNode.tier]}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {activeDetailNode.name}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                {activeDetailNode.description}
              </p>
            </div>

            {/* Action Buttons */}
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* 1. Hauptberuf festlegen */}
                {isNodePrimaryProfession(activeDetailNode) ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-300 text-xs font-semibold whitespace-nowrap">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Aktiver Hauptberuf</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyPrimaryProfession(activeDetailNode)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Als Hauptberuf festlegen</span>
                  </button>
                )}

                {/* 2. Spezialisierung wählen (falls Stufe 3) */}
                {activeDetailNode.tier === 'spezialisierung' && (
                  isNodePrimarySpecialization(activeDetailNode) ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-300 text-xs font-semibold whitespace-nowrap">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Aktive Spezialisierung</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplySpecialization(activeDetailNode)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Als Haupt-Spezialisierung</span>
                    </button>
                  )
                )}

                {/* 3. Als weitere Richtung wählen */}
                {onToggleAdditionalDirection && !isNodePrimaryProfession(activeDetailNode) && (
                  isNodeAdditionalDirection(activeDetailNode) ? (
                    <button
                      type="button"
                      onClick={() => handleToggleDirection(activeDetailNode)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                      title="Aus den zusätzlichen Richtungen entfernen"
                    >
                      <Minus className="w-3.5 h-3.5 text-rose-400" />
                      <span>Weitere Richtung entfernen</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleDirection(activeDetailNode)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-600/60 text-indigo-300 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                      title="Als zusätzlichen Zweitberuf / Fachrichtung verfolgen"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Als weitere Richtung wählen</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Voraussetzungen & Aufstiegswege */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voraussetzungen */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Voraussetzungen & Qualifikationen</span>
                </span>
                {activeDetailEval?.isAvailable ? (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Erfüllt
                  </span>
                ) : (
                  <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Noch nicht erfüllt
                  </span>
                )}
              </div>

              {activeDetailNode.prerequisites.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed py-1">
                  Offener Einstieg ohne formale Vorbedingungen. Jeder Charakter kann diese Richtung einschlagen.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-xs py-1">
                  {activeDetailEval?.fulfilledPrerequisites.map((item, idx) => (
                    <li key={`f_${idx}`} className="flex items-start gap-2 text-emerald-300/90">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {activeDetailEval?.missingPrerequisites.map((item, idx) => (
                    <li key={`m_${idx}`} className="flex items-start gap-2 text-rose-300">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Mögliche Aufstiegswege */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aufstiegs- & Anerkennungswege</span>
                </span>
              </div>
              <div className="flex flex-col gap-2 py-1">
                {activeDetailNode.careerRoutes.map(route => (
                  <div
                    key={route.id}
                    className="border border-slate-800/80 bg-slate-900/60 rounded-lg p-2.5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">
                        {route.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 whitespace-nowrap">
                        {route.type === 'experience'
                          ? 'Berufserfahrung'
                          : route.type === 'exam'
                          ? 'Prüfung / Meister'
                          : route.type === 'social_recognition'
                          ? 'Anerkennung / Wahl'
                          : 'Notfall / Ernennung'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {route.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Empfohlene Fachkompetenzen */}
          {activeDetailNode.suggestedCompetencies.length > 0 && (
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Zugehörige Kernkompetenzen:</span>
              </span>
              {activeDetailNode.suggestedCompetencies.map((compName, idx) => (
                <span
                  key={idx}
                  className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"
                >
                  {compName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionSkillTree;
