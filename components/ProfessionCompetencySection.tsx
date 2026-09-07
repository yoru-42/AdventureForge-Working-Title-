import React, { useState, useEffect, useMemo } from 'react';
import { ProfessionCompetency, ProfessionProgress, ProfessionExperience } from '../types';
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
  const [localField, setLocalField] = useState<string>(professionField || professionProgress?.fieldId || '');

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

  // Handler: Add manual custom competency
  const handleAddManual = () => {
    const newComp: ProfessionCompetency = normalizeCompetency({
      name: 'Neue Kompetenz',
      category: activeCategoryFilter !== 'Alle' ? (activeCategoryFilter as ProfessionCompetency['category']) : 'Grundlage',
      proficiency: 0,
      experiencePoints: 0,
      talent: 3
    });
    setEditingCompetency(newComp);
    setIsEditModalOpen(true);
  };

  // Handler: Save edited or created competency
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
      className="flex flex-col gap-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-inner"
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
        className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {sectionTitle}: {professionName || 'Nicht zugewiesen'}
            </h4>
          </div>
          <span className="text-xs font-semibold text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
            {currentRank}
          </span>
        </div>

        {/* Struktur: Berufsfeld -> Interaktiver Berufsskilltree -> Spezialisierung & Rang -> Erfahrung & Fortschritt */}
        <div className="flex flex-col gap-3">
          {/* Schritt 1: Übergeordnetes Berufsfeld */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Berufsfeld</span>
            </label>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer transition"
            >
              <option value="">Berufsfeld wählen...</option>
              {PROFESSION_FIELDS.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Schritt 2: Echter interaktiver Berufsskilltree für das gewählte Berufsfeld */}
          {currentField ? (
            <ProfessionSkillTree
              fieldId={currentField}
              fieldName={selectedFieldObj?.name}
              currentProfession={professionName}
              currentSpecialization={professionSpecialization}
              currentRank={currentRank}
              experienceYears={currentExp.years}
              competencies={competencies}
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

          {/* Schritt 3: Manuelle Anpassung / Freitext (optional einklappbar) */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">
                Aktuell gewählte Berufsdaten
              </span>
              <button
                type="button"
                onClick={() => setShowConditionsInput(prev => !prev)}
                className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{showConditionsInput ? 'Manuelle Eingabe verbergen' : 'Manuelle Eingabe / Freitext'}</span>
              </button>
            </div>

            {showConditionsInput && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                <label className="text-[11px] text-slate-400">
                  Benutzerdefinierte Berufsbezeichnung
                </label>
                {onProfessionNameChange ? (
                  <ProfessionSelect
                    value={professionName}
                    selectedField={currentField}
                    onFieldChange={val => {
                      setLocalField(val);
                      if (onProfessionFieldChange) onProfessionFieldChange(val);
                      updateProgress({ fieldId: val });
                    }}
                    onChange={(val, detectedField) => {
                      if (onProfessionNameChange) onProfessionNameChange(val, detectedField);
                      const effectiveField = detectedField || currentField;
                      if (detectedField) {
                        setLocalField(detectedField);
                        if (onProfessionFieldChange && detectedField !== currentField) {
                          onProfessionFieldChange(detectedField);
                        }
                      }
                      updateProgress({ fieldId: effectiveField, professionName: val });
                    }}
                    placeholder="Berufsbezeichnung wählen oder eintragen..."
                  />
                ) : (
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs">
                    {professionName || 'Keine Angabe'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schritt 4: Spezialisierung & Berufsrang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Spezialisierung / Schwerpunkt
              </label>
              <input
                type="text"
                id="profession-specialization-input"
                value={professionSpecialization}
                onChange={e => {
                  const val = e.target.value;
                  if (onSpecializationChange) onSpecializationChange(val);
                  updateProgress({ specialization: val });
                }}
                placeholder="Spezialisierung oder handwerklicher Schwerpunkt..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Berufsrang / Grad
              </label>
              <select
                id="profession-rank-select"
                value={currentRank}
                onChange={e => {
                  const val = e.target.value;
                  if (onProfessionRankChange) onProfessionRankChange(val);
                  updateProgress({ rank: val, level: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer transition"
              >
                {COMMON_PROFESSION_RANKS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                {!COMMON_PROFESSION_RANKS.includes(currentRank) && currentRank && (
                  <option value={currentRank}>{currentRank}</option>
                )}
              </select>
            </div>
          </div>

          {/* Zeile 3: Berufserfahrung */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Berufserfahrung</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {formatProfessionExperience(currentExp)}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentExp.years || 0}
                  onChange={e => handleUpdateExperience('years', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-white text-xs text-right outline-none font-mono"
                />
                <span className="text-slate-500 text-xs">Jahre</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={currentExp.months || 0}
                  onChange={e => handleUpdateExperience('months', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-white text-xs text-right outline-none font-mono"
                />
                <span className="text-slate-500 text-xs">Monate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Numeric XP */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Allgemeiner Berufsfortschritt</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400 text-sm">
                {safeProgress.overallProficiency}%
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                ({safeProgress.experiencePoints} XP gesamt)
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, safeProgress.overallProficiency))}%` }}
            />
          </div>

          {/* Quick Slider for overall proficiency */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Wert anpassen:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={safeProgress.overallProficiency}
              onChange={e => updateProgress({ overallProficiency: parseInt(e.target.value, 10) || 0 })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5">
              <input
                type="number"
                min="0"
                max="100"
                value={safeProgress.overallProficiency}
                onChange={e => updateProgress({ overallProficiency: parseInt(e.target.value, 10) || 0 })}
                className="w-8 bg-transparent text-white text-xs font-mono text-center outline-none"
              />
            </div>
          </div>
        </div>

        {/* Aufstiegsbedingungen (Collapsible) */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowConditionsInput(!showConditionsInput)}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-between w-full cursor-pointer py-1"
          >
            <span className="font-semibold text-[11px]">Bedingungen für Aufstieg & Beförderung</span>
            {showConditionsInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showConditionsInput && (
            <div className="pt-2 flex flex-col gap-2 animate-in fade-in duration-150">
              <AutoExpandingTextarea
                value={promotionConditionsText || (safeProgress.promotionConditions || []).join('\n')}
                onChange={e => {
                  const val = e.target.value;
                  if (onPromotionConditionsChange) {
                    onPromotionConditionsChange(val);
                  }
                  updateProgress({ promotionConditions: val.split('\n').filter(Boolean) });
                }}
                placeholder="z.B. Meisterstück anfertigen, 5 Jahre Erfahrung als Geselle, Zunftprüfung bestehen"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">
                Die KI berücksichtigt diese Bedingungen für Beförderungsprüfungen und Reifegrade im Abenteuer.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEREICH B: FACHKOMPETENZEN (Katalog, eigene Kompetenzen, Üben)             */}
      {/* ========================================================================= */}
      <div id="profession-section-b-competencies" className="flex flex-col gap-3">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Fachkompetenzen ({competencies.length})
            </h4>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleAddAllFoundations}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Fügt alle typischen Grundlagen-Kompetenzen für diesen Beruf hinzu"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Grundlagen hinzufügen</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
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
              <span>Neu</span>
            </button>
          </div>
        </div>

        {/* Filter bar: Category Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['Alle', 'Grundlage', 'Fortgeschritten', 'Spezialisierung', 'Meisterschaft'] as const).map(cat => {
              const count = categoryCounts[cat] || 0;
              const isActive = activeCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-950/60 text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kompetenz suchen..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-white text-xs outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Competencies Card List */}
        {filteredCompetencies.length === 0 ? (
          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center flex flex-col items-center justify-center gap-2">
            <Layers className="w-7 h-7 text-slate-600" />
            <p className="text-xs text-slate-400 max-w-sm">
              {competencies.length === 0
                ? 'Noch keine Fachkompetenzen für diesen Beruf vorhanden. Nutzen Sie die Schnelloptionen oben, um passende Grundlagen oder Katalog-Kompetenzen hinzuzufügen.'
                : 'Keine Fachkompetenzen entsprechen dem aktuellen Such- oder Kategoriefilter.'}
            </p>
            {competencies.length === 0 && (
              <button
                type="button"
                onClick={handleAddAllFoundations}
                className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Typische Grundlagen automatisch anlegen
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredCompetencies.map(comp => (
              <CompetencyCard
                key={comp.id}
                competency={comp}
                onPractice={handlePractice}
                onEdit={c => {
                  setEditingCompetency(c);
                  setIsEditModalOpen(true);
                }}
                onDelete={handleDeleteCompetency}
                onTalentChange={handleTalentChange}
              />
            ))}
          </div>
        )}
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
