import React, { useState, useMemo, useEffect } from 'react';
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
import { calculateCompetencyProgress } from '../services/professionCompetencyService';
import {
  Check,
  Lock,
  Plus,
  Sliders,
  Star,
  Info,
  X,
  Award,
  Trash2
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
  onSelectProfession,
  readOnly = false
}) => {
  const tree = useMemo(() => {
    return getProfessionTreeForField(fieldId, fieldName);
  }, [fieldId, fieldName]);

  // Which node's details are currently opened in the inspector (null = closed)
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);
  const [editingProgNodeId, setEditingProgNodeId] = useState<string | null>(null);
  const [editingExpNodeId, setEditingExpNodeId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modals for "Nebenberufe +" and "Adelige Titel +"
  const [isAddSecondaryModalOpen, setIsAddSecondaryModalOpen] = useState(false);
  const [customSecondaryName, setCustomSecondaryName] = useState('');
  const [customSecondarySpec, setCustomSecondarySpec] = useState('');

  const [isNobilityModalOpen, setIsNobilityModalOpen] = useState(false);
  const [selectedNobilityPreset, setSelectedNobilityPreset] = useState('');
  const [customNobilityTitle, setCustomNobilityTitle] = useState('');
  const [nobilityGrantedBy, setNobilityGrantedBy] = useState('');

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

  const rootNode = useMemo(() => {
    return tree.nodes.find(n => n.tier === 'einstieg') || tree.nodes[0];
  }, [tree]);

  const coreNodes = useMemo(() => {
    return tree.nodes.filter(n => n.tier === 'beruf');
  }, [tree]);

  // Prerequisites evaluation
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

  // Role & Learned detection helpers
  const isNodeMain = (node: ProfessionTreeNode): boolean => {
    if (!currentProfession) return false;
    const curP = currentProfession.toLowerCase().trim();
    return curP === node.name.toLowerCase().trim() || curP === node.id.toLowerCase().trim();
  };

  const isNodeLearned = (node: ProfessionTreeNode): boolean => {
    const nameLower = node.name.toLowerCase().trim();
    const idLower = node.id.toLowerCase().trim();

    if (currentProfession) {
      const curP = currentProfession.toLowerCase().trim();
      if (curP === nameLower || curP === idLower) return true;
    }

    const inSecondaries = secondaryProfessions.some(
      s =>
        s.profession?.toLowerCase().trim() === nameLower ||
        s.profession?.toLowerCase().trim() === idLower ||
        (s.specialization && s.specialization.toLowerCase().trim() === nameLower)
    );
    if (inSecondaries) return true;

    if (additionalDirections.some(d => d.toLowerCase().trim() === nameLower || d.toLowerCase().trim() === idLower)) {
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
      // Unlearn:
      // Remove from secondaryProfessions if present
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
          setFeedbackMsg(`'${node.name}' entfernt. Neuer Hauptberuf: '${nextMain.profession}'.`);
        } else {
          onSelectProfession('', '', fieldId);
          setFeedbackMsg(`'${node.name}' als erlernt entfernt.`);
        }
      } else {
        setFeedbackMsg(`'${node.name}' als erlernt entfernt.`);
      }
    } else {
      // Learn:
      // If no main profession is set, make this the main profession
      if (!currentProfession) {
        const entryTitle = node.possibleRanks?.[0] || node.name;
        onSelectProfession(entryTitle, '', fieldId);
        setFeedbackMsg(`'${entryTitle}' als erlernter Hauptberuf festgelegt.`);
      } else {
        // Add as secondary profession
        if (onSecondaryProfessionsChange) {
          const newSec: SecondaryProfession = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sec_${Date.now()}`,
            profession: node.name,
            professionLevel: 'Lehrling / Geselle',
            professionField: fieldId,
            specialization: node.tier === 'spezialisierung' ? node.name : '',
            description: node.description || `Erlernter Beruf (${node.name})`
          };
          onSecondaryProfessionsChange([...secondaryProfessions, newSec]);
        }
        if (onToggleAdditionalDirection) {
          onToggleAdditionalDirection(node.name, node.tier, fieldId);
        }
        setFeedbackMsg(`'${node.name}' als erlernter Nebenberuf hinzugefügt.`);
      }
    }

    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Set as Main Profession (from Details Inspector)
  const handleSetMain = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    const nameLower = node.name.toLowerCase().trim();

    // If it was in secondaryProfessions, remove it
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

    // If there was an existing main profession, keep it as secondary
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
    setFeedbackMsg(`'${node.name}' als Hauptberuf gewählt.`);
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
    setFeedbackMsg(`Nebenberuf '${profName}' hinzugefügt.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Add / manage noble titles
  const handleAddNobilityTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titleVal = (customNobilityTitle.trim() || selectedNobilityPreset.trim());
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

  // Filter noble titles from socialTitles
  const nobleTitles = useMemo(() => {
    return socialTitles.filter(t => !t.titleType || t.titleType === 'nobility');
  }, [socialTitles]);

  // Competencies and talents extraction
  const getNodeCompetenciesAndTalents = (node: ProfessionTreeNode) => {
    const isRoot = node.tier === 'einstieg';
    let baseList: { name: string; category: string; defaultScore: number; defaultTalent: number }[] = [];

    if (isRoot) {
      baseList = [
        { name: 'Arbeitsplatz vorbereiten', category: 'Grundlagen', defaultScore: 68, defaultTalent: 3 },
        { name: 'Werkzeuge sicher benutzen', category: 'Grundlagen', defaultScore: 75, defaultTalent: 4 },
        { name: 'einfache Tätigkeiten', category: 'Grundlagen', defaultScore: 62, defaultTalent: 3 },
        { name: 'Materialkunde & Lagerung', category: 'Grundlagen', defaultScore: 54, defaultTalent: 3 }
      ];
    } else {
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
      talentItems = compItems.slice(0, 3).map(ci => ({
        name: ci.name,
        score: ci.talent || 3
      }));
    }

    talentItems = talentItems.map(t => {
      const match = competencies.find(c => c.name.toLowerCase().includes(t.name.toLowerCase()));
      if (match && typeof match.talent === 'number') {
        return { name: t.name, score: match.talent };
      }
      return t;
    });

    return { compItems, talentItems };
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
  };

  const handleUpdateExperience = (years: number, months: number, days: number) => {
    const newExp: ProfessionExperience = { years, months, days };
    if (onExperienceChange) onExperienceChange(newExp);
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

  // ---------------------------------------------------------------------------
  // COMPACT CLEAN TALENT TREE NODE RENDERING
  // Keine "Kernberuf" Beschriftung, keine Pfade-Buttons, keine abgeschnittenen Texte.
  // Es reicht ein kleines Feld mit "Erlernt" + "Details".
  // ---------------------------------------------------------------------------
  const renderCompactNode = (node: ProfessionTreeNode) => {
    const isLearned = isNodeLearned(node);
    const isInspected = inspectingNodeId === node.id;
    const evaluation = evaluations.get(node.id);
    const isAvailable = evaluation ? evaluation.isAvailable : true;
    const isLocked = !isAvailable && !isLearned;

    return (
      <div
        key={node.id}
        id={`tree-node-${node.id}`}
        className={`relative flex flex-col justify-between p-3.5 rounded-xl transition-all duration-150 border ${
          isLearned
            ? 'bg-amber-950/30 border-amber-500/70 shadow-sm shadow-amber-950/30'
            : isInspected
            ? 'bg-slate-900 border-amber-400/80 ring-1 ring-amber-400/40 shadow-sm'
            : isLocked
            ? 'bg-slate-950/80 border-slate-800/80 opacity-75'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 shadow-sm'
        }`}
      >
        {/* Titel ohne Abschneiden, keine störenden Badges */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <span
            className="text-sm font-bold text-white tracking-wide font-serif break-words leading-snug"
            title={node.name}
          >
            {node.name}
          </span>
          {isLocked && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-900/60 text-rose-300 text-[10px] shrink-0"
              title="Voraussetzungen noch nicht erfüllt"
            >
              <Lock className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Untere Leiste: Kleines Feld "Erlernt" + "Details" Button */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
          {/* Kleines Feld mit "Erlernt" */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isLearned}
              onChange={() => handleToggleLearned(node)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
            />
            <span
              className={`text-xs font-medium transition ${
                isLearned ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Erlernt
            </span>
          </label>

          {/* Details / Info 1-Click Toggle */}
          <button
            type="button"
            onClick={() => setInspectingNodeId(isInspected ? null : node.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
              isInspected
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={isInspected ? 'Details schließen' : 'Details einsehen'}
          >
            <Info className="w-3 h-3 text-slate-400" />
            <span>{isInspected ? 'Schließen' : 'Details'}</span>
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 1-CLICK EXPANDABLE DETAIL INSPECTOR
  // ---------------------------------------------------------------------------
  const renderNodeInspector = (node: ProfessionTreeNode) => {
    const isMain = isNodeMain(node);
    const isLearned = isNodeLearned(node);
    const evaluation = evaluations.get(node.id);
    const isAvailable = evaluation ? evaluation.isAvailable : true;
    const isLocked = !isAvailable && !isLearned;
    const { compItems, talentItems } = getNodeCompetenciesAndTalents(node);

    // Sub-specializations for this core node
    const specializations = tree.nodes.filter(n => {
      if (n.tier !== 'spezialisierung' && n.tier !== 'meister') return false;
      if (n.specializationOf === node.id || n.specializationOf === node.name) return true;
      if (n.parentIds && n.parentIds.includes(node.id)) return true;
      if (node.childIds && node.childIds.includes(n.id)) return true;
      return false;
    });

    // Progress
    let progressVal = 0;
    if (node.tier === 'einstieg') {
      progressVal = !isMain && currentProfession ? 100 : professionProgress ? professionProgress.overallProficiency : 24;
    } else if (isMain) {
      progressVal = professionProgress ? professionProgress.overallProficiency : 41;
    } else if (isLearned) {
      progressVal = 30;
    }

    const formattedExp = formatNodeExperience(currentExp, node.tier === 'einstieg' ? 180 : 0);
    const isEditingProg = editingProgNodeId === node.id;
    const isEditingExp = editingExpNodeId === node.id;

    return (
      <div
        id={`node-inspector-${node.id}`}
        className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 my-3"
      >
        {/* Header: Title & 1-Click Close */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white font-serif uppercase tracking-wider">
                {node.name}
              </h3>
              {isMain && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-bold">
                  Aktueller Hauptberuf
                </span>
              )}
              {isLearned && !isMain && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold">
                  Erlernt (Nebenberuf)
                </span>
              )}
            </div>
            {node.description && (
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                {node.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* If learned but not main, allow promoting to main */}
            {isLearned && !isMain && (
              <button
                type="button"
                onClick={() => handleSetMain(node)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Als Hauptberuf festlegen
              </button>
            )}

            {/* Prominent Single-Click Close Button */}
            <button
              type="button"
              onClick={() => setInspectingNodeId(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 ml-1"
              title="Details schließen"
            >
              <X className="w-3.5 h-3.5 text-amber-400" />
              <span>Schließen</span>
            </button>
          </div>
        </div>

        {/* Prerequisites notice if locked */}
        {isLocked && evaluation && evaluation.missingPrerequisites.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200">
            <span className="font-bold block mb-1">Voraussetzungen noch nicht erfüllt:</span>
            <ul className="space-y-0.5 pl-4 list-disc text-[11px] text-rose-300">
              {evaluation.missingPrerequisites.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mögliche Vertiefungen / Spezialisierungen (ohne Pfade-Banner) */}
        {specializations.length > 0 && (
          <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mögliche Spezialisierungen & Meistertitel
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {specializations.map(specNode => {
                const isCurrentSpec = currentSpecialization?.toLowerCase().trim() === specNode.name.toLowerCase().trim();
                return (
                  <button
                    key={specNode.id}
                    type="button"
                    onClick={() => {
                      onSelectProfession(isMain ? currentProfession : node.name, specNode.name, fieldId);
                      setFeedbackMsg(`Spezialisierung '${specNode.name}' gewählt.`);
                      setTimeout(() => setFeedbackMsg(null), 2500);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      isCurrentSpec
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {specNode.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid: Progress & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          {/* Berufsfortschritt */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Berufsfortschritt</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-400">{progressVal} %</span>
                {isMain && (
                  <button
                    type="button"
                    onClick={() => setEditingProgNodeId(isEditingProg ? null : node.id)}
                    className="text-slate-400 hover:text-amber-300 transition cursor-pointer p-0.5"
                    title="Schieberegler anpassen"
                  >
                    <Sliders className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progressVal))}%` }}
              />
            </div>

            {isMain && isEditingProg && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressVal}
                  onChange={e => handleUpdateProgress(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Berufserfahrung */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Erfahrung & Praxis</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-200">{formattedExp}</span>
                {isMain && (
                  <button
                    type="button"
                    onClick={() => setEditingExpNodeId(isEditingExp ? null : node.id)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    {isEditingExp ? 'Fertig' : 'Ändern'}
                  </button>
                )}
              </div>
            </div>

            {isMain && isEditingExp ? (
              <div className="flex items-center gap-2 text-xs mt-1">
                <label className="text-slate-400 text-[10px]">Jahre:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentExp.years}
                  onChange={e =>
                    handleUpdateExperience(parseInt(e.target.value, 10) || 0, currentExp.months || 0, currentExp.days || 0)
                  }
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                />
                <label className="text-slate-400 text-[10px]">Monate:</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={currentExp.months || 0}
                  onChange={e =>
                    handleUpdateExperience(currentExp.years, parseInt(e.target.value, 10) || 0, currentExp.days || 0)
                  }
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                />
                <label className="text-slate-400 text-[10px]">Tage:</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={currentExp.days || 0}
                  onChange={e =>
                    handleUpdateExperience(currentExp.years, currentExp.months || 0, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-white font-mono text-center text-xs"
                />
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                Akkumulierte Tätigkeitszeit in diesem Fachbereich
              </span>
            )}
          </div>
        </div>

        {/* Fachkompetenzen & Talente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kompetenzen */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Zugeordnete Fachkompetenzen
            </span>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {compItems.map(comp => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="text-slate-200 truncate pr-2">{comp.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-amber-400 text-xs font-bold w-10 text-right">
                      {comp.proficiency}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustProficiency(comp.name, -5)}
                      className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustProficiency(comp.name, +5)}
                      className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePracticeComp(comp)}
                      className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-800 text-amber-300 rounded text-[10px] font-bold transition cursor-pointer"
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
            <div className="flex flex-col gap-1.5">
              {talentItems.map(t => (
                <div
                  key={t.name}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="text-slate-300 truncate pr-2">{t.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map(starNum => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => handleSetTalent(t.name, starNum)}
                        className="p-0.5 hover:scale-110 transition cursor-pointer"
                        title={`${starNum}/5 Sterne`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            starNum <= t.score ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setInspectingNodeId(null)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Details schließen
          </button>
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

      {/* ========================================================================= */}
      {/* AUSGEWÄHLTE BERUFE: Hauptberuf, Nebenberufe, [Nebenberufe +], [Adelige Titel +] */}
      {/* ========================================================================= */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ausgewählte Berufe:
          </span>

          {/* Hauptberuf Tag */}
          {currentProfession ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 font-semibold">
              <span>Hauptberuf: {currentProfession}</span>
              {currentSpecialization && (
                <span className="text-amber-200/80 font-normal">({currentSpecialization})</span>
              )}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 italic">
              Kein Hauptberuf festgelegt
            </span>
          )}

          {/* Secondary Professions Badges */}
          {secondaryProfessions.map(sec => (
            <span
              key={sec.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 font-medium"
            >
              <span>Nebenberuf: {sec.profession}</span>
              <button
                type="button"
                onClick={() => {
                  const matchNode = tree.nodes.find(
                    n => n.name.toLowerCase() === sec.profession.toLowerCase()
                  );
                  if (matchNode) {
                    handleToggleLearned(matchNode);
                  } else if (onSecondaryProfessionsChange) {
                    onSecondaryProfessionsChange(secondaryProfessions.filter(s => s.id !== sec.id));
                  }
                }}
                className="hover:text-rose-300 ml-0.5 cursor-pointer text-emerald-400"
                title="Nebenberuf entfernen"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Tag: Nebenberufe + */}
          <button
            type="button"
            onClick={() => setIsAddSecondaryModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium transition cursor-pointer"
            title="Weiteren Nebenberuf hinzufügen"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nebenberufe +</span>
          </button>

          {/* Adelige Titel Tags */}
          {nobleTitles.map(t => (
            <span
              key={t.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/60 text-indigo-300 font-medium"
            >
              <Award className="w-3 h-3 text-indigo-400" />
              <span>Adelstitel: {t.title}</span>
              <button
                type="button"
                onClick={() => handleRemoveNobilityTitle(t.id)}
                className="hover:text-rose-300 ml-0.5 cursor-pointer text-indigo-400"
                title="Adelstitel entfernen"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Tag: Adelige Titel + */}
          <button
            type="button"
            onClick={() => setIsNobilityModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium transition cursor-pointer"
            title="Adelige Titel verwalten"
          >
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Adelige Titel +</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. WURZELKNOTEN: EINSTIEG / GRUNDAUSBILDUNG                                */}
      {/* ========================================================================= */}
      <div className="w-full max-w-sm">
        {rootNode && renderCompactNode(rootNode)}
      </div>

      {/* VERBINDUNGSLINIE */}
      <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-amber-500/40 my-1 mx-auto" />

      {/* ========================================================================= */}
      {/* 2. BERUFE DES FACHBEREICHS (Kompakt, ohne Pfade, mit Erlernt-Feld)       */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-center gap-3 my-2">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent flex-1" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800">
            Berufe des Fachbereichs
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent flex-1" />
        </div>

        {/* Raster der Berufe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
          {coreNodes.map(node => (
            <div key={node.id} className="flex flex-col gap-2">
              {renderCompactNode(node)}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAIL-INSPEKTOR (Mit 1 Klick aufrufbar & schließbar)                   */}
      {/* ========================================================================= */}
      {inspectingNodeId && (() => {
        const targetNode = tree.nodes.find(n => n.id === inspectingNodeId);
        if (!targetNode) return null;
        return renderNodeInspector(targetNode);
      })()}

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
                  placeholder="z. B. Schmied, Kräuterkundiger, Alchemist..."
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
                  placeholder="z. B. Waffenfertigung, Feldküche..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* Schnellauswahl aus nicht erlernten Berufen des aktuellen Fachbereichs */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">
                  Schnellauswahl aus diesem Fachbereich:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {coreNodes
                    .filter(n => !isNodeLearned(n))
                    .map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setCustomSecondaryName(n.name)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer border border-slate-700"
                      >
                        {n.name}
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

            {/* Aktuelle Adelstitel */}
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

            {/* Neuen Adelstitel hinzufügen */}
            <form onSubmit={handleAddNobilityTitle} className="flex flex-col gap-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                Neuen Adelstitel hinzufügen:
              </span>

              {/* Auswahl aus Standard-Adelstiteln */}
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

              {/* Oder freie Eingabe */}
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
    </div>
  );
};

export default ProfessionSkillTree;
