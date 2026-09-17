import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ProfessionTreeNode,
  ProfessionNodeTier,
  getProfessionTreeForField,
  evaluateNodePrerequisites,
  NodeEvaluationResult
} from '../lib/professionTreeData';
import {
  ProfessionCompetency,
  ProfessionExperience,
  ProfessionProgress,
  SecondaryProfession,
  SocialTitleState
} from '../types';
import { PRESET_NOBILITY_TITLES } from '../services/positionService';
import { getCatalogCompetenciesForProfession } from '../lib/professionCompetencies';
import { getCompetenciesForJobTier } from '../lib/professionTierCompetenciesData';
import { calculateCompetencyProgress } from '../services/professionCompetencyService';
import { getDetailedDutiesForJobAndTier } from '../lib/professionDutiesDetailed';
import { getSuggestedAuthoritiesForProfession } from '../lib/professionAuthoritiesData';
import { formatGenderedProfessionTitle, getGenderPair } from '../lib/professionGenderHelper';
import EverydaySkillsSelect, { parseEverydaySkills } from './EverydaySkillsSelect';
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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Move,
  Eye,
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
  onToggleAdditionalDirection?: (directionName: string, tier: ProfessionNodeTier, fieldId?: string) => void;
  secondaryProfessions?: SecondaryProfession[];
  onSecondaryProfessionsChange?: (secondaries: SecondaryProfession[]) => void;
  socialTitles?: SocialTitleState[];
  onSocialTitlesChange?: (titles: SocialTitleState[]) => void;
  everydaySkills?: string;
  onEverydaySkillsChange?: (skills: string) => void;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  activeCategoryTab?: 'hauptberuf' | 'nebenberufe' | 'adelstitel' | 'alltagskompetenzen';
  onSelectCategoryTab?: (tab: 'hauptberuf' | 'nebenberufe' | 'adelstitel' | 'alltagskompetenzen') => void;
  onSelectProfession: (professionName: string, specialization?: string, fieldId?: string) => void;
  readOnly?: boolean;
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
  score: number;
}

// Layout coordinate for interactive node map
interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

function formatNodeExperience(exp?: ProfessionExperience | number, fallbackDays?: number): string {
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
  onToggleAdditionalDirection,
  secondaryProfessions = [],
  onSecondaryProfessionsChange,
  socialTitles = [],
  onSocialTitlesChange,
  everydaySkills = '',
  onEverydaySkillsChange,
  progressionLogic = 'ep',
  activeCategoryTab = 'hauptberuf',
  onSelectCategoryTab,
  onSelectProfession,
  readOnly = false
}) => {
  const tree = useMemo(() => {
    return getProfessionTreeForField(fieldId, fieldName);
  }, [fieldId, fieldName]);

  // Which node's details are currently opened in the inspector
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);
  const [editingProgNodeId, setEditingProgNodeId] = useState<string | null>(null);
  const [editingExpNodeId, setEditingExpNodeId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // View mode: 'map' (interactive pan/zoom canvas) or 'list' (hierarchical list)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Canvas pan & zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Modals for "Nebenberufe +", "Adelige Titel +" and "Alltagskompetenzen"
  const [isAddSecondaryModalOpen, setIsAddSecondaryModalOpen] = useState(false);
  const [customSecondaryName, setCustomSecondaryName] = useState('');
  const [customSecondarySpec, setCustomSecondarySpec] = useState('');

  const [isNobilityModalOpen, setIsNobilityModalOpen] = useState(false);
  const [selectedNobilityPreset, setSelectedNobilityPreset] = useState('');
  const [customNobilityTitle, setCustomNobilityTitle] = useState('');
  const [nobilityGrantedBy, setNobilityGrantedBy] = useState('');

  const [isEverydayModalOpen, setIsEverydayModalOpen] = useState(false);

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

  const groupedBranches = useMemo(() => {
    const map = new Map<string, ProfessionTreeNode[]>();

    for (const node of tree.nodes) {
      const branch = node.category || tree.fieldName || 'Berufszweig';
      if (!map.has(branch)) {
        map.set(branch, []);
      }
      map.get(branch)!.push(node);
    }

    const groups: { branchName: string; nodes: ProfessionTreeNode[] }[] = [];
    map.forEach((nodes, branchName) => {
      // Sort nodes: Lehrling (rankOrder: 0) -> Geselle (1) -> Spezialisierung (2) -> Meister (3)
      const sorted = [...nodes].sort((a, b) => {
        const rankA = a.rankOrder ?? 0;
        const rankB = b.rankOrder ?? 0;
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name, 'de');
      });
      groups.push({ branchName, nodes: sorted });
    });

    return groups;
  }, [tree.nodes, tree.fieldName]);

  // Automatically select the active profession's branch or default to the first branch
  useEffect(() => {
    if (groupedBranches.length === 0) return;

    // If currently 'all' or selected branch is not in current field, pick matching or first branch
    const exists = groupedBranches.some(b => b.branchName === selectedBranchFilter);
    if (!exists || selectedBranchFilter === 'all') {
      if (currentProfession) {
        const curLow = currentProfession.toLowerCase().trim();
        const matchingBranch = groupedBranches.find(b => {
          if (b.branchName.toLowerCase().trim() === curLow) return true;
          return b.nodes.some(n => {
            const pair = getGenderPair(n.name);
            return (
              n.name.toLowerCase().trim() === curLow ||
              pair.male.toLowerCase().trim() === curLow ||
              pair.female.toLowerCase().trim() === curLow
            );
          });
        });
        if (matchingBranch) {
          setSelectedBranchFilter(matchingBranch.branchName);
          return;
        }
      }
      setSelectedBranchFilter(groupedBranches[0].branchName);
    }
  }, [fieldId, currentProfession, groupedBranches]);

  const currentBranchIndex = useMemo(() => {
    return groupedBranches.findIndex(b => b.branchName === selectedBranchFilter);
  }, [groupedBranches, selectedBranchFilter]);

  const handlePrevBranch = () => {
    if (groupedBranches.length === 0) return;
    const idx = currentBranchIndex <= 0 ? groupedBranches.length - 1 : currentBranchIndex - 1;
    setSelectedBranchFilter(groupedBranches[idx].branchName);
    setPan({ x: 30, y: 30 });
    setZoom(0.95);
  };

  const handleNextBranch = () => {
    if (groupedBranches.length === 0) return;
    const idx = currentBranchIndex >= groupedBranches.length - 1 ? 0 : currentBranchIndex + 1;
    setSelectedBranchFilter(groupedBranches[idx].branchName);
    setPan({ x: 30, y: 30 });
    setZoom(0.95);
  };

  const handleSelectBranch = (branchName: string) => {
    setSelectedBranchFilter(branchName);
    setPan({ x: 30, y: 30 });
    setZoom(0.95);
  };

  // Prerequisites evaluation
  const evaluations = useMemo(() => {
    const map = new Map<string, NodeEvaluationResult>();
    for (const node of tree.nodes) {
      const evalResult = evaluateNodePrerequisites(node, {
        profession: currentProfession,
        professionSpecialization: currentSpecialization,
        professionRank: currentRank,
        experienceYears: currentExp.years,
        competencies,
        secondaryProfessions,
        additionalDirections
      });
      map.set(node.id, evalResult);
    }
    return map;
  }, [tree, currentProfession, currentSpecialization, currentRank, currentExp.years, competencies, secondaryProfessions, additionalDirections]);

  // Role & Learned detection helpers
  const isNodeMain = (node: ProfessionTreeNode): boolean => {
    if (!currentProfession) return false;
    const curP = currentProfession.toLowerCase().trim();
    const nodeNameLower = node.name.toLowerCase().trim();
    const nodeIdLower = node.id.toLowerCase().trim();

    if (curP === nodeNameLower || curP === nodeIdLower) return true;

    // Check gender pair matching
    const pair = getGenderPair(node.name);
    if (curP === pair.male.toLowerCase().trim() || curP === pair.female.toLowerCase().trim()) return true;

    return false;
  };

  const isNodeLearned = (node: ProfessionTreeNode): boolean => {
    const nameLower = node.name.toLowerCase().trim();
    const idLower = node.id.toLowerCase().trim();
    const pair = getGenderPair(node.name);
    const maleLower = pair.male.toLowerCase().trim();
    const femaleLower = pair.female.toLowerCase().trim();

    if (currentProfession) {
      const curP = currentProfession.toLowerCase().trim();
      if (curP === nameLower || curP === idLower || curP === maleLower || curP === femaleLower) return true;
    }

    const inSecondaries = secondaryProfessions.some(s => {
      const sProf = s.profession?.toLowerCase().trim();
      const sSpec = s.specialization?.toLowerCase().trim();
      return (
        sProf === nameLower ||
        sProf === idLower ||
        sProf === maleLower ||
        sProf === femaleLower ||
        sSpec === nameLower ||
        sSpec === idLower ||
        sSpec === maleLower ||
        sSpec === femaleLower
      );
    });
    if (inSecondaries) return true;

    if (
      additionalDirections.some(d => {
        const dLower = d.toLowerCase().trim();
        return dLower === nameLower || dLower === idLower || dLower === maleLower || dLower === femaleLower;
      })
    ) {
      return true;
    }

    return false;
  };

  // Toggle "Erlernt" for any profession node
  const handleToggleLearned = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    const learned = isNodeLearned(node);
    const nameLower = node.name.toLowerCase().trim();

    if (learned) {
      // Unlearn
      if (onSecondaryProfessionsChange) {
        const updated = secondaryProfessions.filter(
          s =>
            s.profession?.toLowerCase().trim() !== nameLower &&
            s.specialization?.toLowerCase().trim() !== nameLower
        );
        if (updated.length !== secondaryProfessions.length) {
          onSecondaryProfessionsChange(updated);
        }
      }

      if (onToggleAdditionalDirection) {
        onToggleAdditionalDirection(node.name, node.tier, fieldId);
      }

      // If it is the current main profession:
      if (currentProfession && currentProfession.toLowerCase().trim() === nameLower) {
        if (secondaryProfessions.length > 0) {
          const nextMain = secondaryProfessions[0];
          onSelectProfession(nextMain.profession, nextMain.specialization || '', nextMain.professionField || fieldId);
          if (onSecondaryProfessionsChange) {
            onSecondaryProfessionsChange(secondaryProfessions.slice(1));
          }
          setFeedbackMsg(`'${formatGenderedProfessionTitle(node.name)}' entfernt. Neuer Hauptberuf: '${formatGenderedProfessionTitle(nextMain.profession)}'.`);
        } else {
          onSelectProfession('', '', fieldId);
          setFeedbackMsg(`'${formatGenderedProfessionTitle(node.name)}' als erlernt entfernt.`);
        }
      } else {
        setFeedbackMsg(`'${formatGenderedProfessionTitle(node.name)}' als erlernt entfernt.`);
      }
    } else {
      // Learn
      if (!currentProfession) {
        const entryTitle = node.possibleRanks?.[0] || node.name;
        onSelectProfession(entryTitle, '', fieldId);
        setFeedbackMsg(`'${formatGenderedProfessionTitle(entryTitle)}' als erlernter Hauptberuf festgelegt.`);
      } else {
        // Add as secondary profession
        if (onSecondaryProfessionsChange) {
          const newSec: SecondaryProfession = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sec_${Date.now()}`,
            profession: node.name,
            professionLevel: node.tier === 'einstieg' ? 'Lehrling' : node.tier === 'beruf' ? 'Geselle' : node.tier === 'spezialisierung' ? 'Spezialist' : 'Meister',
            professionField: fieldId,
            specialization: node.tier === 'spezialisierung' ? node.name : '',
            description: node.description || `Erlernter Beruf (${node.name})`
          };
          onSecondaryProfessionsChange([...secondaryProfessions, newSec]);
        }
        if (onToggleAdditionalDirection) {
          onToggleAdditionalDirection(node.name, node.tier, fieldId);
        }
        setFeedbackMsg(`'${formatGenderedProfessionTitle(node.name)}' als erlernter Nebenberuf hinzugefügt.`);
      }
    }

    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Set as Main Profession
  const handleSetMain = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    const nameLower = node.name.toLowerCase().trim();

    if (onSecondaryProfessionsChange && secondaryProfessions.length > 0) {
      const updated = secondaryProfessions.filter(
        s =>
          s.profession?.toLowerCase().trim() !== nameLower &&
          s.specialization?.toLowerCase().trim() !== nameLower
      );
      if (updated.length !== secondaryProfessions.length) {
        onSecondaryProfessionsChange(updated);
      }
    }

    if (currentProfession && currentProfession.toLowerCase().trim() !== nameLower && onSecondaryProfessionsChange) {
      const prevMainSec: SecondaryProfession = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sec_${Date.now()}`,
        profession: currentProfession,
        professionLevel: currentRank || 'Geselle',
        professionField: fieldId,
        specialization: currentSpecialization,
        description: `Ehemaliger Hauptberuf (${currentProfession})`
      };
      onSecondaryProfessionsChange([...secondaryProfessions.filter(s => s.profession.toLowerCase().trim() !== nameLower), prevMainSec]);
    }

    onSelectProfession(node.name, '', fieldId);
    setFeedbackMsg(`'${formatGenderedProfessionTitle(node.name)}' als Hauptberuf gewählt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Add a secondary profession manually via modal
  const handleAddCustomSecondary = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const profName = customSecondaryName.trim();
    if (!profName) return;

    const newSec: SecondaryProfession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sec_${Date.now()}`,
      profession: profName,
      professionLevel: 'Lehrling / Geselle',
      professionField: fieldId,
      specialization: customSecondarySpec.trim(),
      description: `Erlernter Nebenberuf (${profName})`
    };

    if (onSecondaryProfessionsChange) {
      onSecondaryProfessionsChange([...secondaryProfessions, newSec]);
    }

    setCustomSecondaryName('');
    setCustomSecondarySpec('');
    setIsAddSecondaryModalOpen(false);
    setFeedbackMsg(`Nebenberuf '${formatGenderedProfessionTitle(profName)}' hinzugefügt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Add / manage noble titles
  const handleAddNobilityTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titleVal = customNobilityTitle.trim() || selectedNobilityPreset.trim();
    if (!titleVal) return;

    const newTitle: SocialTitleState = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `title_${Date.now()}`,
      title: titleVal,
      titleType: 'nobility',
      grantedBy: nobilityGrantedBy.trim() || undefined
    };

    if (onSocialTitlesChange) {
      onSocialTitlesChange([...socialTitles, newTitle]);
    }

    setCustomNobilityTitle('');
    setSelectedNobilityPreset('');
    setNobilityGrantedBy('');
    setFeedbackMsg(`Adelstitel '${titleVal}' hinzugefügt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleRemoveNobilityTitle = (id: string) => {
    if (!onSocialTitlesChange) return;
    onSocialTitlesChange(socialTitles.filter(t => t.id !== id));
  };

  const nobleTitles = useMemo(() => {
    return socialTitles.filter(t => !t.titleType || t.titleType === 'nobility');
  }, [socialTitles]);

  // Competencies and talents extraction
  const getNodeCompetenciesAndTalents = (node: ProfessionTreeNode) => {
    const isRoot = node.tier === 'einstieg';
    let baseList: { name: string; category: 'Grundlage' | 'Fortgeschritten' | 'Spezialisierung' | 'Meisterschaft'; defaultScore: number; defaultTalent: number }[] = [];

    if (node.suggestedCompetencies && node.suggestedCompetencies.length > 0) {
      baseList = node.suggestedCompetencies.map((name, idx) => ({
        name,
        category: (idx < 2 ? 'Grundlage' : 'Fortgeschritten') as 'Grundlage' | 'Fortgeschritten',
        defaultScore: isRoot ? 60 : 50,
        defaultTalent: 3
      }));
    } else {
      const tierRank = node.rankOrder ?? (node.tier === 'einstieg' ? 0 : node.tier === 'beruf' ? 1 : node.tier === 'spezialisierung' ? 2 : 3);
      const tierComps = getCompetenciesForJobTier(node.name || currentProfession || '', tierRank);
      if (tierComps.length > 0) {
        baseList = tierComps.map((name, idx) => ({
          name,
          category: (idx < 2 ? 'Grundlage' : 'Fortgeschritten') as 'Grundlage' | 'Fortgeschritten',
          defaultScore: 50,
          defaultTalent: 3
        }));
      } else {
        const catComps = getCatalogCompetenciesForProfession(node.name || currentProfession || '');
        baseList = catComps.slice(0, 4).map(c => ({
          name: c.name,
          category: c.category,
          defaultScore: 50,
          defaultTalent: 3
        }));
      }
    }

    const compItems: NodeCompetencyItem[] = baseList.map(base => {
      const existing = competencies.find(c => c.name.toLowerCase() === base.name.toLowerCase());
      return {
        name: base.name,
        proficiency: existing ? existing.proficiency : base.defaultScore,
        category: base.category,
        talent: existing ? existing.talent : base.defaultTalent,
        raw: existing
      };
    });

    const talentItems: NodeTalentItem[] = baseList.map(base => {
      const existing = competencies.find(c => c.name.toLowerCase() === base.name.toLowerCase());
      return {
        name: base.name,
        score: existing ? existing.talent : base.defaultTalent
      };
    });

    return { compItems, talentItems };
  };

  // Adjust competency score
  const handleAdjustProficiency = (compName: string, delta: number) => {
    if (readOnly || !onCompetenciesChange) return;
    const existing = competencies.find(c => c.name.toLowerCase() === compName.toLowerCase());
    if (existing) {
      const newProf = Math.max(0, Math.min(100, existing.proficiency + delta));
      const updated = competencies.map(c => (c.name.toLowerCase() === compName.toLowerCase() ? { ...c, proficiency: newProf } : c));
      onCompetenciesChange(updated);
    } else {
      const newComp: ProfessionCompetency = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp_${Date.now()}`,
        name: compName,
        proficiency: Math.max(0, Math.min(100, 50 + delta)),
        category: 'Grundlage',
        talent: 3,
        practiceCount: 0,
        experiencePoints: 0
      };
      onCompetenciesChange([...competencies, newComp]);
    }
  };

  const handleSetTalent = (compName: string, talent: number) => {
    if (readOnly || !onCompetenciesChange) return;
    const existing = competencies.find(c => c.name.toLowerCase() === compName.toLowerCase());
    if (existing) {
      const updated = competencies.map(c => (c.name.toLowerCase() === compName.toLowerCase() ? { ...c, talent } : c));
      onCompetenciesChange(updated);
    } else {
      const newComp: ProfessionCompetency = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp_${Date.now()}`,
        name: compName,
        proficiency: 50,
        category: 'Grundlage',
        talent,
        practiceCount: 0,
        experiencePoints: 0
      };
      onCompetenciesChange([...competencies, newComp]);
    }
  };

  const handlePracticeComp = (compItem: NodeCompetencyItem) => {
    if (readOnly) return;
    if (compItem.raw && onPracticeCompetency) {
      onPracticeCompetency(compItem.raw);
    } else if (onCompetenciesChange) {
      const cat: 'Grundlage' | 'Fortgeschritten' | 'Spezialisierung' | 'Meisterschaft' =
        compItem.category === 'Grundlage' ||
        compItem.category === 'Fortgeschritten' ||
        compItem.category === 'Spezialisierung' ||
        compItem.category === 'Meisterschaft'
          ? compItem.category
          : 'Grundlage';

      const newComp: ProfessionCompetency = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp_${Date.now()}`,
        name: compItem.name,
        proficiency: Math.min(100, compItem.proficiency + 2),
        category: cat,
        talent: compItem.talent || 3,
        practiceCount: 1,
        experiencePoints: 35
      };
      onCompetenciesChange([...competencies, newComp]);
      if (onPracticeCompetency) onPracticeCompetency(newComp);
    }
    setFeedbackMsg(`Kompetenz '${compItem.name}' geübt (+35 XP).`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleUpdateProgress = (val: number) => {
    if (readOnly || !onProfessionProgressChange) return;
    onProfessionProgressChange({
      professionName: currentProfession || 'Beruf',
      overallProficiency: Math.max(0, Math.min(100, val)),
      experiencePoints: professionProgress?.experiencePoints ?? 0,
      ...professionProgress
    });
  };

  const handleUpdateExperience = (years: number, months: number, days: number) => {
    if (readOnly || !onExperienceChange) return;
    onExperienceChange({ years, months, days });
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE TALENT TREE NODE GRAPH COMPUTATION (X, Y POSITIONS & CONNECTIONS)
  // ---------------------------------------------------------------------------
  const activeBranches = useMemo(() => {
    if (selectedBranchFilter === 'all') return groupedBranches;
    return groupedBranches.filter(b => b.branchName === selectedBranchFilter);
  }, [groupedBranches, selectedBranchFilter]);

  // Layout parameters for node map
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 135;
  const TIER_Y_OFFSETS: Record<number, number> = {
    0: 50,    // Einstieg / Lehrling (Top)
    1: 250,   // Grundstufe / Geselle
    2: 450,   // Beförderungen & Spezialisierungen
    3: 660    // Meisterstufe (Bottom)
  };

  // Compute 2D node map layout positions for all nodes in the active branches
  const { nodePositions, treeConnections, canvasWidth, canvasHeight } = useMemo(() => {
    const posMap = new Map<string, NodePosition>();
    const connections: { fromId: string; toId: string; fromPos: NodePosition; toPos: NodePosition; isLearned: boolean; isUnlocked: boolean }[] = [];

    let currentBranchX = 40;
    const BRANCH_GAP = 80;

    activeBranches.forEach(branch => {
      const tier0 = branch.nodes.filter(n => (n.rankOrder ?? 0) === 0);
      const tier1 = branch.nodes.filter(n => (n.rankOrder ?? 0) === 1);
      const tier2 = branch.nodes.filter(n => (n.rankOrder ?? 0) === 2);
      const tier3 = branch.nodes.filter(n => (n.rankOrder ?? 0) === 3);

      const maxInTier = Math.max(tier0.length, tier1.length, tier2.length, tier3.length, 1);
      const branchWidth = Math.max(maxInTier * (NODE_WIDTH + 24), NODE_WIDTH + 40);

      // Helper to position nodes evenly in a horizontal tier row
      const positionTierRow = (tierNodes: ProfessionTreeNode[], rankOrder: number) => {
        const count = tierNodes.length;
        if (count === 0) return;
        const totalRowWidth = count * NODE_WIDTH + (count - 1) * 24;
        const startX = currentBranchX + (branchWidth - totalRowWidth) / 2;
        const y = TIER_Y_OFFSETS[rankOrder] || (rankOrder * 200 + 50);

        tierNodes.forEach((node, idx) => {
          const x = startX + idx * (NODE_WIDTH + 24);
          posMap.set(node.id, {
            x,
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          });
        });
      };

      positionTierRow(tier0, 0);
      positionTierRow(tier1, 1);
      positionTierRow(tier2, 2);
      positionTierRow(tier3, 3);

      currentBranchX += branchWidth + BRANCH_GAP;
    });

    const totalWidth = Math.max(currentBranchX + 100, 1000);
    const totalHeight = 850;

    // Now build all connection lines (parent -> child)
    tree.nodes.forEach(childNode => {
      const childPos = posMap.get(childNode.id);
      if (!childPos) return;

      const childLearned = isNodeLearned(childNode);
      const childEval = evaluations.get(childNode.id);
      const childUnlocked = !childEval || childEval.status !== 'locked';

      const parents = childNode.parentIds || [];
      parents.forEach(parentId => {
        const parentPos = posMap.get(parentId);
        if (parentPos) {
          const parentNode = tree.nodes.find(n => n.id === parentId);
          const parentLearned = parentNode ? isNodeLearned(parentNode) : false;
          connections.push({
            fromId: parentId,
            toId: childNode.id,
            fromPos: parentPos,
            toPos: childPos,
            isLearned: parentLearned && childLearned,
            isUnlocked: childUnlocked
          });
        }
      });
    });

    return {
      nodePositions: posMap,
      treeConnections: connections,
      canvasWidth: totalWidth,
      canvasHeight: totalHeight
    };
  }, [activeBranches, tree.nodes, evaluations, currentProfession, secondaryProfessions, additionalDirections]);

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node-card') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    if (canvasRef.current) {
      const containerW = canvasRef.current.clientWidth;
      const containerH = canvasRef.current.clientHeight;
      const contentW = canvasWidth * zoom;
      const contentH = canvasHeight * zoom;
      
      const paddingX = containerW * 0.5;
      const paddingY = containerH * 0.5;
      
      const minX = -contentW + paddingX;
      const maxX = containerW - paddingX;
      
      const minY = -contentH + paddingY;
      const maxY = containerH - paddingY;
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }

    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(1.6, prev + delta)));
  };

  const handleResetView = () => {
    setPan({ x: 30, y: 30 });
    setZoom(0.95);
  };

  const handleFocusNode = (nodeId: string) => {
    const pos = nodePositions.get(nodeId);
    if (!pos || !canvasRef.current) return;
    const containerWidth = canvasRef.current.clientWidth;
    const containerHeight = canvasRef.current.clientHeight;

    setPan({
      x: containerWidth / 2 - (pos.x + pos.width / 2) * zoom,
      y: containerHeight / 2 - (pos.y + pos.height / 2) * zoom
    });
  };

  // Find currently inspected node object
  const inspectingNode = useMemo(() => {
    if (!inspectingNodeId) return null;
    return tree.nodes.find(n => n.id === inspectingNodeId) || null;
  }, [tree.nodes, inspectingNodeId]);

  // Render a Single Node Card
  const renderNodeCard = (node: ProfessionTreeNode) => {
    const isLearned = isNodeLearned(node);
    const isMain = isNodeMain(node);
    const evaluation = evaluations.get(node.id);
    const isLocked = evaluation ? evaluation.status === 'locked' : false;
    const isInspected = inspectingNodeId === node.id;
    const genderedTitle = formatGenderedProfessionTitle(node.name);

    const tierBadge =
      node.tier === 'einstieg'
        ? { label: 'Lehrling', color: 'bg-sky-950/80 text-sky-300 border-sky-600/40' }
        : node.tier === 'beruf'
        ? { label: 'Geselle', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40' }
        : node.tier === 'spezialisierung'
        ? { label: 'Spezialisierung', color: 'bg-amber-950/80 text-amber-300 border-amber-600/40' }
        : { label: 'Meisterstufe', color: 'bg-purple-950/80 text-purple-300 border-purple-600/40' };

    return (
      <div
        id={`tree-node-${node.id}`}
        key={node.id}
        onClick={() => {
          setInspectingNodeId(isInspected ? null : node.id);
        }}
        className={`interactive-node-card group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md select-none ${
          isInspected
            ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 shadow-amber-950/50 shadow-xl scale-[1.02] z-20'
            : isMain
            ? 'bg-amber-950/40 border-amber-500/70 shadow-amber-950/30'
            : isLearned
            ? 'bg-slate-900/90 border-emerald-500/50 hover:border-emerald-400'
            : isLocked
            ? 'bg-slate-950/80 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
            : 'bg-slate-900/80 border-slate-700 hover:border-amber-500/50 hover:bg-slate-850'
        }`}
        style={{ width: `${NODE_WIDTH}px`, minHeight: `${NODE_HEIGHT}px` }}
      >
        {/* Top Badges: Tier & Status */}
        <div className="flex items-center justify-between gap-1.5 w-full">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierBadge.color}`}>
            {tierBadge.label}
          </span>

          <div className="flex items-center gap-1.5">
            {isMain ? (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Hauptberuf</span>
              </span>
            ) : isLearned ? (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Erlernt</span>
              </span>
            ) : isLocked ? (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-950/40 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>Gesperrt</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                Verfügbar
              </span>
            )}
          </div>
        </div>

        {/* Center: Title (Männlich / Weiblich) */}
        <div className="my-1.5 flex flex-col">
          <h4 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide leading-snug group-hover:text-amber-200 transition">
            {genderedTitle}
          </h4>
          {node.rankTitle && node.rankTitle !== node.name && (
            <span className="text-[10px] text-slate-400 italic truncate mt-0.5">
              {node.rankTitle}
            </span>
          )}
        </div>

        {/* Bottom Bar: Action Buttons */}
        <div
          className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 mt-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Quick Toggle Erlernt */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isLearned}
              onChange={() => handleToggleLearned(node)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
            />
            <span className={`text-[11px] font-semibold transition ${isLearned ? 'text-amber-300' : 'text-slate-400 hover:text-slate-300'}`}>
              Erlernt
            </span>
          </label>

          <div className="flex items-center gap-1.5">
            {isLearned && !isMain && (
              <button
                type="button"
                onClick={() => handleSetMain(node)}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-[10px] font-bold transition cursor-pointer"
                title="Als Hauptberuf festlegen"
              >
                Hauptberuf
              </button>
            )}

            <button
              type="button"
              onClick={() => setInspectingNodeId(isInspected ? null : node.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                isInspected
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Details & Kompetenzen anzeigen"
            >
              <span>{isInspected ? 'Schließen' : 'Details'}</span>
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Detailed Node Inspector
  const renderNodeInspector = () => {
    if (!inspectingNode) return null;
    const node = inspectingNode;
    const isLearned = isNodeLearned(node);
    const isMain = isNodeMain(node);
    const evaluation = evaluations.get(node.id);
    const isLocked = evaluation ? evaluation.status === 'locked' : false;
    const genderedTitle = formatGenderedProfessionTitle(node.name);

    const { compItems, talentItems } = getNodeCompetenciesAndTalents(node);
    const nodeDuties = getDetailedDutiesForJobAndTier(node.name || currentProfession || '', node.tier);
    const nodeAuthorities = getSuggestedAuthoritiesForProfession(node.name || currentProfession || '', node.tier);

    const avgCompetencyProficiency =
      competencies.length > 0
        ? Math.round(competencies.reduce((sum, c) => sum + c.proficiency, 0) / competencies.length)
        : 50;

    const progressVal = isMain
      ? professionProgress?.overallProficiency ?? 45
      : isLearned
      ? 100
      : avgCompetencyProficiency;
    const formattedExp = formatNodeExperience(currentExp);

    return (
      <div
        id="profession-node-inspector"
        className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in duration-200 mt-4"
      >
        {/* Inspector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40">
                {node.tier === 'einstieg' ? 'Lehrling / Einstieg' : node.tier === 'beruf' ? 'Geselle / Grundberuf' : node.tier === 'spezialisierung' ? 'Spezialisierung' : 'Meisterstufe'}
              </span>
              {node.category && (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  Zweig: {node.category}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-amber-200 font-serif tracking-wide mt-1">
              {genderedTitle}
            </h3>
            {node.rankTitle && (
              <span className="text-xs text-slate-400 italic">{node.rankTitle}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLearned}
                onChange={() => handleToggleLearned(node)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
              />
              <span className={`text-xs font-semibold ${isLearned ? 'text-amber-300' : 'text-slate-400'}`}>
                {isLearned ? 'Erlernt' : 'Als erlernt markieren'}
              </span>
            </label>

            {isLearned && !isMain && (
              <button
                type="button"
                onClick={() => handleSetMain(node)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Als Hauptberuf
              </button>
            )}

            <button
              type="button"
              onClick={() => setInspectingNodeId(null)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Inspector schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kurzbeschreibung */}
        {node.description && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {node.description}
          </p>
        )}

        {/* Qualifikationsvoraussetzungen */}
        {node.prerequisites && node.prerequisites.length > 0 && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Qualifikationsvoraussetzungen</span>
              {isLocked ? (
                <span className="text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Voraussetzungen noch offen
                </span>
              ) : (
                <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Voraussetzungen erfüllt
                </span>
              )}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {evaluation?.allEvaluations ? (
                evaluation.allEvaluations.map((evalItem, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      evalItem.isFulfilled
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                        : evalItem.isHard
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {evalItem.isFulfilled ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : evalItem.isHard ? (
                        <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{evalItem.prerequisite?.label || evalItem.detail}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {evalItem.isHard ? 'Pflicht' : 'Empfohlen'}
                    </span>
                  </div>
                ))
              ) : (
                node.prerequisites.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg border bg-slate-900/60 border-slate-800 text-xs text-slate-300"
                  >
                    <span>{req.label}</span>
                    <span className="text-[10px] text-slate-400">
                      {req.required !== false ? 'Pflicht' : 'Empfohlen'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Typische Aufgaben & Pflichten */}
        {nodeDuties && nodeDuties.length > 0 && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Typische Aufgaben & Berufspflichten</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {nodeDuties.map((duty, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{duty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Befugnisse & Weisungsrechte */}
        {nodeAuthorities && nodeAuthorities.length > 0 && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Befugnisse & Weisungsrechte</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {nodeAuthorities.map((auth, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{auth}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fachkompetenzen & Talente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Kompetenzen */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Zugeordnete Fachkompetenzen
            </span>
            <div className="flex flex-col gap-2">
              {compItems.map(comp => (
                <div
                  key={comp.name}
                  className="flex flex-col gap-2 text-xs p-3 rounded-lg bg-slate-900/70 border border-slate-800"
                >
                  <span className="text-slate-200 font-medium leading-relaxed break-words">
                    {comp.name}
                  </span>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 font-mono text-amber-300 text-xs font-bold min-w-[3.25rem] text-center">
                        {comp.proficiency}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustProficiency(comp.name, -5)}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95"
                        title="Stufe um 5% verringern"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustProficiency(comp.name, +5)}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95"
                        title="Stufe um 5% erhöhen"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePracticeComp(comp)}
                      className="px-3 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/40 rounded text-[11px] font-bold transition cursor-pointer active:scale-95 whitespace-nowrap"
                      title="35 XP durch praktische Übung"
                    >
                      Üben
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Talente */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Berufstalente & Begabungen
            </span>
            <div className="flex flex-col gap-2">
              {talentItems.map(t => (
                <div
                  key={t.name}
                  className="flex flex-col gap-2 text-xs p-3 rounded-lg bg-slate-900/70 border border-slate-800"
                >
                  <span className="text-slate-200 font-medium leading-relaxed break-words">
                    {t.name}
                  </span>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Veranlagung:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(starNum => (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => handleSetTalent(t.name, starNum)}
                          className="p-1 hover:scale-110 transition cursor-pointer"
                          title={`${starNum}/5 Sterne`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              starNum <= t.score ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // MAIN TALENT TREE RENDER
  // ---------------------------------------------------------------------------
  return (
    <div id="profession-skilltree-container" className="flex flex-col items-center w-full py-2">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-950 border border-amber-500 text-amber-100 text-xs px-4 py-2.5 rounded-xl shadow-xl animate-in fade-in duration-200">
          {feedbackMsg}
        </div>
      )}

      {/* Top Controls: Branch Switcher & Map / List View Toggle */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3">
        {/* Branch Selector: Compact dropdown & steppers without horizontal scrolling */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Berufszweig:
          </span>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={handlePrevBranch}
              disabled={groupedBranches.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Vorheriger Berufszweig"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <select
                value={selectedBranchFilter}
                onChange={e => handleSelectBranch(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-700/80 text-amber-200 text-xs sm:text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer focus:border-amber-500 hover:border-slate-600 transition min-w-[200px] sm:min-w-[280px]"
              >
                {groupedBranches.map(b => (
                  <option key={b.branchName} value={b.branchName} className="bg-slate-900 text-slate-200 py-1">
                    {formatGenderedProfessionTitle(b.branchName)} ({b.nodes.length} Stufen)
                  </option>
                ))}
                <option value="all" className="bg-slate-900 text-amber-300 py-1 font-bold">
                  Alle Zweige im Berufsfeld anzeigen ({tree.nodes.length} Stufen)
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400/80 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleNextBranch}
              disabled={groupedBranches.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Nächster Berufszweig"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedBranchFilter !== 'all' && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 hidden md:inline">
              {groupedBranches.find(b => b.branchName === selectedBranchFilter)?.nodes.length || 0} Entwicklungsschritte
            </span>
          )}
        </div>

        {/* View Mode Toggle & Canvas Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'map' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Node-Karte</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE NODE MAP CANVAS (PAN & ZOOM WITH SVG CONNECTORS)           */}
      {/* ========================================================================= */}
      {viewMode === 'map' ? (
        <div className="w-full flex flex-col gap-2">
          {/* Canvas Viewport */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative w-full h-[620px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Top-Right Canvas Toolbar Controls */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Vergrößern (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Verkleinern (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="px-2 h-7 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
                title="Ansicht zurücksetzen (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{Math.round(zoom * 100)}%</span>
              </button>
            </div>

            {/* Transformable Canvas Content */}
            <div
              className="absolute origin-top-left transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`
              }}
            >
              {/* SVG Connecting Lines between Nodes */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvasWidth}
                height={canvasHeight}
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <marker
                    id="arrow-learned"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                  <marker
                    id="arrow-unlocked"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                  </marker>
                  <marker
                    id="arrow-locked"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                  </marker>
                </defs>

                {treeConnections.map((conn, idx) => {
                  const startX = conn.fromPos.x + conn.fromPos.width / 2;
                  const startY = conn.fromPos.y + conn.fromPos.height;
                  const endX = conn.toPos.x + conn.toPos.width / 2;
                  const endY = conn.toPos.y;
                  const midY = (startY + endY) / 2;

                  // Smooth cubic bezier curve from parent bottom to child top
                  const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                  return (
                    <g key={`conn-${conn.fromId}-${conn.toId}-${idx}`}>
                      {/* Glow outline for learned connections */}
                      {conn.isLearned && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="6"
                          strokeOpacity="0.4"
                          filter="url(#glow-gold)"
                        />
                      )}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={conn.isLearned ? '#f59e0b' : conn.isUnlocked ? '#d97706' : '#475569'}
                        strokeWidth={conn.isLearned ? 3.5 : conn.isUnlocked ? 2.5 : 1.5}
                        strokeDasharray={conn.isUnlocked ? undefined : '6 4'}
                        markerEnd={conn.isLearned ? 'url(#arrow-learned)' : conn.isUnlocked ? 'url(#arrow-unlocked)' : 'url(#arrow-locked)'}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Positioned Node Cards on Canvas */}
              {activeBranches.map(branch =>
                branch.nodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{
                        left: `${pos.x}px`,
                        top: `${pos.y}px`
                      }}
                    >
                      {renderNodeCard(node)}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>Tipp: Klicke und ziehe mit der Maus, um dich auf der Karte zu bewegen. Klicke auf einen Knotenpunkt, um Details einzusehen.</span>
            <span>Männliche & weibliche Berufsbezeichnungen integriert</span>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. HIERARCHICAL LIST VIEW (FALLBACK / ALTERNATIVE ACCESSIBLE VIEW)        */
        /* ========================================================================= */
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto my-3">
          {activeBranches.map(({ branchName, nodes }) => {
            const tier0 = nodes.filter(n => (n.rankOrder ?? 0) === 0);
            const tier1 = nodes.filter(n => (n.rankOrder ?? 0) === 1);
            const tier2 = nodes.filter(n => (n.rankOrder ?? 0) === 2);
            const tier3 = nodes.filter(n => (n.rankOrder ?? 0) === 3);

            const activeTiers = [
              { rankOrder: 0, title: 'Lehrling / Einstieg', nodes: tier0 },
              { rankOrder: 1, title: 'Grundstufe / Geselle', nodes: tier1 },
              { rankOrder: 2, title: 'Beförderungen & Spezialisierungen', nodes: tier2 },
              { rankOrder: 3, title: 'Meisterstufe', nodes: tier3 }
            ].filter(t => t.nodes.length > 0);

            return (
              <div
                key={branchName}
                className="w-full bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-sm"
              >
                {/* Branch Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
                    <h4 className="text-sm sm:text-base font-bold text-amber-200 uppercase tracking-wider font-serif">
                      Berufszweig: {formatGenderedProfessionTitle(branchName)}
                    </h4>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    {nodes.length} Stufen & Pfade
                  </span>
                </div>

                {/* Vertical progression tiers */}
                <div className="flex flex-col gap-4 w-full">
                  {activeTiers.map(tierGroup => (
                    <div key={tierGroup.rankOrder} className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                        {tierGroup.title}
                      </span>
                      <div
                        className={`grid w-full gap-3.5 ${
                          tierGroup.nodes.length === 1
                            ? 'max-w-xl mx-auto grid-cols-1'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}
                      >
                        {tierGroup.nodes.map(node => (
                          <div key={node.id} className="flex flex-col w-full min-w-0">
                            {renderNodeCard(node)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DETAILED NODE INSPECTOR DRAWER (SHOWN WHEN A NODE IS CLICKED)          */}
      {/* ========================================================================= */}
      {renderNodeInspector()}

      {/* ========================================================================= */}
      {/* MODAL: NEBENBERUFE +                                                      */}
      {/* ========================================================================= */}
      {isAddSecondaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Nebenberuf hinzufügen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSecondaryModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSecondary} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Berufsbezeichnung
                </label>
                <input
                  type="text"
                  value={customSecondaryName}
                  onChange={e => setCustomSecondaryName(e.target.value)}
                  placeholder="z. B. Koch, Schmied, Magier..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Spezialisierung / Richtung (optional)
                </label>
                <input
                  type="text"
                  value={customSecondarySpec}
                  onChange={e => setCustomSecondarySpec(e.target.value)}
                  placeholder="z. B. Gourmetküche, Waffenfertigung..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">
                  Schnellauswahl aus diesem Fachbereich:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {tree.nodes
                    .filter(n => n.tier === 'beruf' && !isNodeLearned(n))
                    .map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setCustomSecondaryName(n.name)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer border border-slate-700"
                      >
                        {formatGenderedProfessionTitle(n.name)}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSecondaryModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!customSecondaryName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADELIGE TITEL +                                                    */}
      {/* ========================================================================= */}
      {isNobilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Adelige Titel verwalten
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNobilityModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                Aktuell zugewiesene Adelstitel ({nobleTitles.length}):
              </span>
              {nobleTitles.length === 0 ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-500 italic text-center">
                  Bisher sind keine Adelstitel für diesen Charakter eingetragen.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {nobleTitles.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-semibold text-white">{t.title}</span>
                        {t.grantedBy && (
                          <span className="text-slate-400 text-[11px]">(Verliehen von: {t.grantedBy})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNobilityTitle(t.id)}
                        className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-1"
                        title="Titel entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddNobilityTitle} className="flex flex-col gap-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                Neuen Adelstitel hinzufügen:
              </span>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Typischer Adelstitel
                </label>
                <select
                  value={selectedNobilityPreset}
                  onChange={e => {
                    setSelectedNobilityPreset(e.target.value);
                    if (e.target.value) setCustomNobilityTitle('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">-- Titel aus Vorlage wählen oder unten frei eingeben --</option>
                  {PRESET_NOBILITY_TITLES.map(p => (
                    <option key={p.title} value={p.title}>
                      {p.title} ({p.description.substring(0, 45)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Oder freie Bezeichnung
                </label>
                <input
                  type="text"
                  value={customNobilityTitle}
                  onChange={e => {
                    setCustomNobilityTitle(e.target.value);
                    if (e.target.value) setSelectedNobilityPreset('');
                  }}
                  placeholder="z. B. Ritter von Falkenstein, Markgraf, Baronin..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Verliehen von / Herkunft (optional)
                </label>
                <input
                  type="text"
                  value={nobilityGrantedBy}
                  onChange={e => setNobilityGrantedBy(e.target.value)}
                  placeholder="z. B. Krone des Südens, Fürstenhaus, Erbrecht..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNobilityModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Schließen
                </button>
                <button
                  type="submit"
                  disabled={!selectedNobilityPreset && !customNobilityTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                >
                  Titel hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Alltagskompetenzen verwalten */}
      {isEverydayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Alltagskompetenzen & Praktische Fertigkeiten
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEverydayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Verwalte Alltagskompetenzen, Hobbys und lebenspraktische Fähigkeiten deines Charakters.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                Alltagskompetenzen
              </label>
              <EverydaySkillsSelect
                value={everydaySkills}
                onChange={onEverydaySkillsChange || (() => {})}
                progressionLogic={progressionLogic}
                placeholder="Alltagskompetenzen und praktische Fertigkeiten im Alltag"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-sky-500 transition min-h-[55px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEverydayModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionSkillTree;
