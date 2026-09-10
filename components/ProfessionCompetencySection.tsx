import React, { useState, useEffect, useMemo } from 'react';
import { ProfessionCompetency, ProfessionProgress, ProfessionExperience, SecondaryProfession } from '../types';
import { ProfessionNodeTier } from '../lib/professionTreeData';
import { CompetencyCard } from './CompetencyCard';
import { CompetencyCatalogModal } from './CompetencyCatalogModal';
import { CompetencyEditModal } from './CompetencyEditModal';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { ProfessionSelect } from './ProfessionSelect';
import { ProfessionSkillTree } from './ProfessionSkillTree';
import { getFieldIdForJob } from './jobPresets';
import {
  calculateCompetencyProgress,
  normalizeCompetency,
  normalizeProfessionProgress,
  createCompetencyFromDefinition,
  formatProfessionExperience
} from '../services/professionCompetencyService';
import {
  getCatalogCompetenciesForProfession,
  PROFESSION_FIELDS,
  findProfessionCatalogEntry
} from '../lib/professionCompetencies';
import {
  Search,
  Plus,
  BookOpen,
  CheckCircle2,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Edit3
} from 'lucide-react';

export const COMMON_PROFESSION_RANKS = [
  'Ungelernt / Helfer',
  'Lehrling',
  'Geselle',
  'Altgeselle',
  'Meister',
  'Großmeister'
];

interface ProfessionCompetencySectionProps {
  sectionTitle?: string;
  professionName: string;
  onProfessionNameChange?: (name: string, detectedFieldId?: string) => void;
  professionLevel: string;
  professionField?: string;
  professionSpecialization?: string;
  professionRank?: string;
  professionExperience?: ProfessionExperience;
  professionProgress?: ProfessionProgress;
  onProfessionProgressChange?: (prog: ProfessionProgress) => void;
  onProfessionFieldChange?: (field: string) => void;
  onSpecializationChange?: (spec: string) => void;
  onProfessionRankChange?: (rank: string) => void;
  onExperienceChange?: (exp: ProfessionExperience) => void;
  competencies: ProfessionCompetency[];
  onCompetenciesChange: (comps: ProfessionCompetency[]) => void;
  // Multi-direction support (Secondary professions / Additional talent paths)
  secondaryProfessions?: SecondaryProfession[];
  onSecondaryProfessionsChange?: (secondaries: SecondaryProfession[]) => void;
  additionalDirections?: string[];
  onAdditionalDirectionsChange?: (directions: string[]) => void;
  // Legacy sync handlers for backward compatibility
  onProficiencyScoreChange?: (score: number) => void;
  onExperiencePointsChange?: (xp: number) => void;
  onPromotionConditionsChange?: (cond: string) => void;
  promotionConditionsText?: string;
}

export const ProfessionCompetencySection: React.FC<ProfessionCompetencySectionProps> = ({
  sectionTitle = 'Beruf & Fachkompetenzen',
  professionName,
  onProfessionNameChange,
  professionLevel,
  professionField,
  professionSpecialization = '',
  professionRank = '',
  professionExperience,
  professionProgress,
  onProfessionProgressChange,
  onProfessionFieldChange,
  onSpecializationChange,
  onProfessionRankChange,
  onExperienceChange,
  competencies = [],
  onCompetenciesChange,
  secondaryProfessions = [],
  onSecondaryProfessionsChange,
  additionalDirections,
  onAdditionalDirectionsChange,
  onProficiencyScoreChange,
  onExperiencePointsChange,
  onPromotionConditionsChange,
  promotionConditionsText = ''
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [editingCompetency, setEditingCompetency] = useState<ProfessionCompetency | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [showConditionsInput, setShowConditionsInput] = useState<boolean>(false);
  const [showManualJobInput, setShowManualJobInput] = useState<boolean>(false);
  const [localField, setLocalField] = useState<string>(professionField || professionProgress?.fieldId || '');
  const [localAdditionalDirections, setLocalAdditionalDirections] = useState<string[]>([]);

  // Collect active additional directions from secondaryProfessions, props, and local state
  const activeAdditionalDirections = useMemo(() => {
    const set = new Set<string>();
    if (additionalDirections) {
      additionalDirections.forEach(d => set.add(d));
    }
    if (secondaryProfessions) {
      secondaryProfessions.forEach(s => {
        if (s.profession) set.add(s.profession);
        if (s.specialization) set.add(s.specialization);
      });
    }
    localAdditionalDirections.forEach(d => set.add(d));
    return Array.from(set);
  }, [additionalDirections, secondaryProfessions, localAdditionalDirections]);

  const handleToggleAdditionalDirection = (directionName: string, tier: ProfessionNodeTier, fieldId?: string) => {
    const isAlreadyActive = activeAdditionalDirections.includes(directionName);

    if (onSecondaryProfessionsChange && secondaryProfessions) {
      if (isAlreadyActive) {
        const updated = secondaryProfessions.filter(
          s => s.profession !== directionName && s.specialization !== directionName
        );
        onSecondaryProfessionsChange(updated);
      } else {
        const newSec: SecondaryProfession = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `sec_${Date.now()}`,
          profession: tier === 'spezialisierung' ? (professionName || directionName) : directionName,
          professionLevel: 'Lehrling / Einsteiger',
          professionField: fieldId || localField || professionField,
          specialization: tier === 'spezialisierung' ? directionName : '',
          description: `Zusätzlicher Entwicklungspfad im Bereich ${fieldId || localField || professionField}`
        };
        onSecondaryProfessionsChange([...secondaryProfessions, newSec]);
      }
    }

    const next = isAlreadyActive
      ? activeAdditionalDirections.filter(d => d !== directionName)
      : [...activeAdditionalDirections, directionName];
    setLocalAdditionalDirections(next);
    if (onAdditionalDirectionsChange) {
      onAdditionalDirectionsChange(next);
    }
  };

  useEffect(() => {
    if (professionField !== undefined && professionField !== '') {
      setLocalField(professionField);
    } else if (professionProgress?.fieldId) {
      setLocalField(professionProgress.fieldId);
    }
  }, [professionField, professionProgress?.fieldId]);

  // Normalized experience
  const currentExp: ProfessionExperience = useMemo(() => {
    return professionExperience || {
      years: professionProgress?.experienceYears || 0,
      months: professionProgress?.experienceMonths || 0,
      days: professionProgress?.experienceDays || 0
    };
  }, [professionExperience, professionProgress]);

  // Derived profession field if not set
  const currentField = useMemo(() => {
    if (localField) return localField;
    if (professionField) return professionField;
    if (professionProgress?.fieldId) return professionProgress.fieldId;
    const match = findProfessionCatalogEntry(professionName);
    if (match) return match.fieldId;
    const detected = getFieldIdForJob(professionName);
    return detected || '';
  }, [localField, professionField, professionProgress?.fieldId, professionName]);

  // Current rank
  const currentRank = professionRank || professionLevel || 'Anfänger';

  // Normalized progress
  const safeProgress: ProfessionProgress = useMemo(() => {
    return normalizeProfessionProgress(
      professionProgress || {
        professionName: professionName || 'Beruf',
        fieldId: currentField,
        specialization: professionSpecialization,
        rank: currentRank,
        level: professionLevel || currentRank,
        experienceYears: currentExp.years,
        experienceMonths: currentExp.months,
        experienceDays: currentExp.days
      },
      professionName
    );
  }, [professionProgress, professionName, professionLevel, currentField, professionSpecialization, currentRank, currentExp]);

  // Filtered competencies
  const filteredCompetencies = useMemo(() => {
    return competencies.filter(c => {
      if (activeCategoryFilter !== 'Alle' && c.category !== activeCategoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = c.name.toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const notesMatch = (c.notes || '').toLowerCase().includes(q);
      return nameMatch || descMatch || notesMatch;
    });
  }, [competencies, activeCategoryFilter, searchQuery]);

  // Overall counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Alle: competencies.length,
      Grundlage: 0,
      Fortgeschritten: 0,
      Spezialisierung: 0,
      Meisterschaft: 0
    };
    competencies.forEach(c => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });
    return counts;
  }, [competencies]);

  // Handler: Update overall progress
  const updateProgress = (updates: Partial<ProfessionProgress>) => {
    const next: ProfessionProgress = {
      ...safeProgress,
      ...updates
    };
    if (onProfessionProgressChange) {
      onProfessionProgressChange(next);
    }
    if (updates.overallProficiency !== undefined && onProficiencyScoreChange) {
      onProficiencyScoreChange(updates.overallProficiency);
    }
    if (updates.experiencePoints !== undefined && onExperiencePointsChange) {
      onExperiencePointsChange(updates.experiencePoints);
    }
  };

  // Handler: Update experience
  const handleUpdateExperience = (part: 'years' | 'months' | 'days', val: number) => {
    const nextExp: ProfessionExperience = {
      ...currentExp,
      [part]: Math.max(0, Math.floor(val))
    };
    if (onExperienceChange) {
      onExperienceChange(nextExp);
    }
    updateProgress({
      experienceYears: nextExp.years,
      experienceMonths: nextExp.months,
      experienceDays: nextExp.days,
      experienceText: formatProfessionExperience(nextExp)
    });
  };

  const handleExperienceChange = (newExp: ProfessionExperience) => {
    if (onExperienceChange) {
      onExperienceChange(newExp);
    }
    updateProgress({
      experienceYears: newExp.years,
      experienceMonths: newExp.months,
      experienceDays: newExp.days,
      experienceText: formatProfessionExperience(newExp)
    });
  };

  // Handler: Practice action on a single competency
  const handlePractice = (comp: ProfessionCompetency) => {
    const baseXp = 30; // standard deliberate practice
    const { updatedCompetency, proficiencyGain, effectiveXp } = calculateCompetencyProgress(comp, baseXp);

    // Update list and apply side benefit to related competencies
    const relatedIds = updatedCompetency.relatedCompetencyIds || [];
    const updatedList = competencies.map(c => {
      if (c.id === updatedCompetency.id) {
        return updatedCompetency;
      }
      if (relatedIds.includes(c.id)) {
        const sideResult = calculateCompetencyProgress(c, Math.max(3, Math.round(baseXp * 0.15)));
        return sideResult.updatedCompetency;
      }
      return c;
    });

    onCompetenciesChange(updatedList);

    // Minor overall profession bump
    const newOverallXp = safeProgress.experiencePoints + Math.round(effectiveXp * 0.25);
    const newOverallProf = Math.min(100, safeProgress.overallProficiency + (proficiencyGain > 0 ? 1 : 0));
    updateProgress({
      overallProficiency: newOverallProf,
      experiencePoints: newOverallXp
    });

    // Feedback notification
    const msg = proficiencyGain > 0
      ? `Übung erfolgreich: ${updatedCompetency.name} +${proficiencyGain}% (${updatedCompetency.proficiency}%, +${effectiveXp} XP)`
      : `Übung abgeschlossen: ${updatedCompetency.name} (+${effectiveXp} XP gesammelt)`;

    setPracticeFeedback(msg);
    setTimeout(() => setPracticeFeedback(null), 4000);
  };

  // Handler: Add from catalog
  const handleAddFromCatalog = (newComps: ProfessionCompetency[]) => {
    const existingIds = new Set(competencies.map(c => c.id));
    const toAdd = newComps.filter(c => !existingIds.has(c.id));
    if (toAdd.length > 0) {
      onCompetenciesChange([...competencies, ...toAdd]);
    }
  };

  // Handler: One-click "Alle passenden Grundlagen hinzufügen"
  const handleAddAllFoundations = () => {
    const catalog = getCatalogCompetenciesForProfession(professionName);
    const foundations = catalog.filter(def => def.category === 'Grundlage');

    const existingNames = new Set(
      competencies.map(c => c.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, ''))
    );

    const toAdd: ProfessionCompetency[] = [];
    foundations.forEach(f => {
      const norm = f.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      if (!existingNames.has(norm)) {
        toAdd.push(createCompetencyFromDefinition(f, 3, 0));
      }
    });

    if (toAdd.length > 0) {
      onCompetenciesChange([...competencies, ...toAdd]);
      setPracticeFeedback(`${toAdd.length} grundlegende Kompetenzen für ${professionName || 'den Beruf'} hinzugefügt.`);
      setTimeout(() => setPracticeFeedback(null), 4000);
    } else {
      setPracticeFeedback('Alle Grundlagen für diesen Beruf sind bereits vorhanden.');
      setTimeout(() => setPracticeFeedback(null), 3000);
    }
  };

  // Handler: Add manual custom competency directly inline into list
  const handleAddManual = () => {
    const newComp: ProfessionCompetency = normalizeCompetency({
      name: 'Neue Fachkompetenz',
      category: activeCategoryFilter !== 'Alle' ? (activeCategoryFilter as ProfessionCompetency['category']) : 'Grundlage',
      proficiency: 0,
      experiencePoints: 0,
      talent: 3
    });
    onCompetenciesChange([...competencies, newComp]);
  };

  // Handler: Direct inline update for any competency field
  const handleUpdateCompetency = (updated: ProfessionCompetency) => {
    onCompetenciesChange(
      competencies.map(c => (c.id === updated.id ? updated : c))
    );
  };

  // Handler: Save edited or created competency (fallback from modal if used)
  const handleSaveCompetency = (saved: ProfessionCompetency) => {
    const exists = competencies.some(c => c.id === saved.id);
    if (exists) {
      onCompetenciesChange(competencies.map(c => (c.id === saved.id ? saved : c)));
    } else {
      onCompetenciesChange([...competencies, saved]);
    }
  };

  // Handler: Delete competency
  const handleDeleteCompetency = (id: string) => {
    onCompetenciesChange(competencies.filter(c => c.id !== id));
  };

  // Handler: Direct talent change from card
  const handleTalentChange = (id: string, newTalent: number) => {
    onCompetenciesChange(
      competencies.map(c => (c.id === id ? { ...c, talent: newTalent } : c))
    );
  };

  const selectedFieldObj = useMemo(() => {
    return PROFESSION_FIELDS.find(f => f.id === currentField);
  }, [currentField]);

  return (
    <div
      id={`profession-competency-section-${professionName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'main'}`}
      className="flex flex-col gap-6 w-full"
    >
      {/* Feedback toast if practicing */}
      {practiceFeedback && (
        <div
          id="practice-feedback-alert"
          className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-center justify-between animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{practiceFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPracticeFeedback(null)}
            className="text-amber-400 hover:text-white text-xs cursor-pointer ml-2"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEREICH A: BERUF (Berufsfeld, Berufsbezeichnung untergeordnet, Rang, XP)   */}
      {/* ========================================================================= */}
      <div
        id="profession-section-a-overview"
        className="flex flex-col gap-4"
      >
        {/* Berufsfeld Toolbar & Active Status - Prominent, high-visibility highlight banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:p-4 bg-slate-900/90 border-2 border-amber-500/40 rounded-xl shadow-md shadow-amber-950/20 ring-1 ring-amber-500/20 transition">
          {/* Berufsfeld Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Berufsfeld
                </span>
                <span className="text-[11px] text-slate-400">
                  Ausrichtung wählen
                </span>
              </div>
            </div>

            {/* Prominent Dropdown Select */}
            <div className="flex-1 max-w-md min-w-[240px]">
              <select
                id="profession-field-select"
                value={currentField}
                onChange={e => {
                  const val = e.target.value;
                  setLocalField(val);
                  if (onProfessionFieldChange) onProfessionFieldChange(val);
                  
                  // If a new field is chosen, check if current professionName belongs to a different field
                  if (val && professionName) {
                    const matchingField = getFieldIdForJob(professionName);
                    if (matchingField && matchingField !== val) {
                      if (onProfessionNameChange) onProfessionNameChange('', val);
                      updateProgress({ fieldId: val, professionName: '' });
                      return;
                    }
                  }
                  updateProgress({ fieldId: val });
                }}
                className="w-full bg-slate-950 border-2 border-amber-500/60 hover:border-amber-400 focus:border-amber-400 text-amber-100 font-semibold text-sm rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer transition shadow-inner"
              >
                <option value="" className="bg-slate-950 text-slate-400">
                  Berufsfeld auswählen...
                </option>
                {PROFESSION_FIELDS.map(f => (
                  <option key={f.id} value={f.id} className="bg-slate-950 text-slate-200">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Status Badges & Manual Text Toggle */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            {professionName ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs font-semibold shadow-sm">
                <span className="text-slate-400 font-normal">Hauptberuf:</span>
                <span>{professionName}</span>
                {professionSpecialization && <span className="text-slate-400 font-normal">({professionSpecialization})</span>}
              </span>
            ) : (
              <span className="text-slate-500 text-xs italic px-2 py-1">Kein Beruf zugewiesen</span>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium">
              {currentRank}
            </span>
            <button
              type="button"
              onClick={() => setShowManualJobInput(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Freitext oder benutzerdefinierte Berufsbezeichnung eingeben"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{showManualJobInput ? 'Schließen' : 'Freitext'}</span>
            </button>
          </div>
        </div>

        {/* Manuelle Eingabe / Freitext (optional) */}
        {showManualJobInput && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in duration-150">
            <label className="text-[11px] text-slate-400">
              Benutzerdefinierte Berufsbezeichnung
            </label>
            <input
              type="text"
              value={professionName}
              onChange={e => {
                const val = e.target.value;
                if (onProfessionNameChange) onProfessionNameChange(val, currentField);
                updateProgress({ professionName: val });
              }}
              placeholder="Berufsbezeichnung eingeben..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Interaktiver kompakter Berufsskilltree für das gewählte Berufsfeld */}
        {currentField ? (
          <ProfessionSkillTree
            fieldId={currentField}
            fieldName={selectedFieldObj?.name}
            currentProfession={professionName}
            currentSpecialization={professionSpecialization}
            currentRank={currentRank}
            experienceYears={currentExp.years}
            experienceMonths={currentExp.months}
            experienceDays={currentExp.days}
            professionExperience={currentExp}
            onExperienceChange={handleExperienceChange}
            professionProgress={safeProgress}
            onProfessionProgressChange={updateProgress}
            competencies={competencies}
            onCompetenciesChange={onCompetenciesChange}
            onPracticeCompetency={handlePractice}
            additionalDirections={activeAdditionalDirections}
            onToggleAdditionalDirection={handleToggleAdditionalDirection}
            onSelectProfession={(newProf, newSpec, newField) => {
              if (newField && newField !== currentField) {
                setLocalField(newField);
                if (onProfessionFieldChange) onProfessionFieldChange(newField);
              }
              if (onProfessionNameChange) {
                onProfessionNameChange(newProf, newField || currentField);
              }
              if (newSpec !== undefined && onSpecializationChange) {
                onSpecializationChange(newSpec);
              }
              updateProgress({
                fieldId: newField || currentField,
                professionName: newProf,
                specialization: newSpec !== undefined ? newSpec : professionSpecialization
              });
            }}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-400">
            Bitte wählen Sie oben ein Berufsfeld aus, um den dazugehörigen Berufsskilltree und die Entwicklungspfade anzuzeigen.
          </div>
        )}

        {/* Schnellzugriff Katalog & Eigene Fachkompetenzen */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="text-slate-400">
            Fachkompetenzen im Profil: <span className="text-white font-bold">{competencies.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Kompetenzen aus dem strukturierten Katalog auswählen"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Aus Katalog wählen</span>
            </button>
            <button
              type="button"
              onClick={handleAddManual}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Eigene Kompetenz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      <CompetencyCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onAddCompetencies={handleAddFromCatalog}
        professionName={professionName}
        existingCompetencies={competencies}
      />

      {/* Edit / Create Modal */}
      <CompetencyEditModal
        isOpen={isEditModalOpen}
        competency={editingCompetency}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCompetency(null);
        }}
        onSave={handleSaveCompetency}
      />
    </div>
  );
};

export default ProfessionCompetencySection;
