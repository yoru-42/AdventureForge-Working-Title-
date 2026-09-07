import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  SecondaryProfession,
  ProfessionCompetency,
  ProfessionProgress,
  SocialTitleState,
  OfficeState,
  PositionState,
  ProfessionExperience
} from '../types';
import ProfessionSelect from './ProfessionSelect';
import ProfessionLevelSelect from './ProfessionLevelSelect';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import EverydaySkillsSelect from './EverydaySkillsSelect';
import { ProfessionCompetencySection } from './ProfessionCompetencySection';
import { TitlesAndPositionsSection } from './TitlesAndPositionsSection';
import { getDutiesForProfessionAndLevel, DUTIES_BY_ARCHETYPE } from './professionDuties';
import { STANDARD_AUTHORITIES, AUTHORITY_DUTIES_MAP } from './economy/EconomyPresets';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const normalizeForCompare = (s: string) =>
  s.trim().toLowerCase().replace(/^[-*•]\s*/, '').replace(/\s+/g, ' ');

const isDutyInText = (text: string, duty: string): boolean => {
  if (!text || !duty) return false;
  const normDuty = normalizeForCompare(duty);
  const lines = text.split('\n');
  return lines.some(line => {
    const normLine = normalizeForCompare(line);
    if (!normLine) return false;
    return normLine.includes(normDuty) || (normDuty.length > 15 && normLine.length > 15 && normDuty.includes(normLine));
  });
};

const toggleDutyInText = (text: string, duty: string): string => {
  const normDuty = normalizeForCompare(duty);
  const lines = text.split('\n');
  const exists = lines.some(line => {
    const normLine = normalizeForCompare(line);
    if (!normLine) return false;
    return normLine.includes(normDuty) || (normDuty.length > 15 && normLine.length > 15 && normDuty.includes(normLine));
  });

  if (exists) {
    const remaining = lines.filter(line => {
      const normLine = normalizeForCompare(line);
      if (!normLine) return true;
      return !(normLine.includes(normDuty) || (normDuty.length > 15 && normLine.length > 15 && normDuty.includes(normLine)));
    });
    return remaining.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  } else {
    const cleanDuty = duty.trim().replace(/^[-*•]\s*/, '');
    const bullet = `- ${cleanDuty}`;
    return text.trim() ? `${text.trim()}\n${bullet}` : bullet;
  }
};

const addAllDutiesToText = (currentText: string, duties: string[]): string => {
  let res = currentText;
  duties.forEach(d => {
    if (!isDutyInText(res, d)) {
      const cleanDuty = d.trim().replace(/^[-*•]\s*/, '');
      res = res.trim() ? `${res.trim()}\n- ${cleanDuty}` : `- ${cleanDuty}`;
    }
  });
  return res;
};

const removeAllDutiesFromText = (currentText: string, duties: string[]): string => {
  let res = currentText;
  duties.forEach(d => {
    if (isDutyInText(res, d)) {
      res = toggleDutyInText(res, d);
    }
  });
  return res;
};

interface CompetenceProfileEditorProps {
  // Main profession core
  profession: string;
  onProfessionChange: (val: string, detectedField?: string) => void;
  professionLevel: string;
  onProfessionLevelChange: (val: string) => void;
  professionField?: string;
  onProfessionFieldChange?: (val: string) => void;
  professionSpecialization?: string;
  onProfessionSpecializationChange?: (val: string) => void;
  professionRank?: string;
  onProfessionRankChange?: (val: string) => void;
  professionExperience?: ProfessionExperience;
  onExperienceChange?: (val: ProfessionExperience) => void;

  craftingSkills: string;
  onCraftingSkillsChange: (val: string) => void;
  jobTitle: string;
  onJobTitleChange: (val: string) => void;
  authorities?: string[];
  onAuthoritiesChange?: (val: string[]) => void;
  professionDescription: string;
  onProfessionDescriptionChange: (val: string) => void;

  professionProficiencyScore?: number;
  onProfessionProficiencyScoreChange?: (val: number) => void;
  professionExperiencePoints?: number;
  onProfessionExperiencePointsChange?: (val: number) => void;
  professionExperienceText?: string;
  onProfessionExperienceTextChange?: (val: string) => void;
  professionPromotionConditions?: string;
  onProfessionPromotionConditionsChange?: (val: string) => void;

  professionProgress?: ProfessionProgress;
  onProfessionProgressChange?: (val: ProfessionProgress) => void;
  professionCompetencies?: ProfessionCompetency[];
  onProfessionCompetenciesChange?: (val: ProfessionCompetency[]) => void;

  // Social Titles, Offices & Positions (V2 decoupled system)
  socialTitles?: SocialTitleState[];
  onSocialTitlesChange?: (val: SocialTitleState[]) => void;
  offices?: OfficeState[];
  onOfficesChange?: (val: OfficeState[]) => void;
  positions?: PositionState[];
  onPositionsChange?: (val: PositionState[]) => void;

  // Secondary professions
  secondaryProfessions?: SecondaryProfession[];
  onSecondaryProfessionsChange?: (val: SecondaryProfession[]) => void;

  talents: string;
  onTalentsChange: (val: string) => void;

  everydaySkills: string;
  onEverydaySkillsChange: (val: string) => void;
  everydaySkillsProficiencyScore?: number;
  onEverydaySkillsProficiencyScoreChange?: (val: number) => void;
  everydaySkillsExperienceText?: string;
  onEverydaySkillsExperienceTextChange?: (val: string) => void;

  toolsAndEquipment: string;
  onToolsAndEquipmentChange: (val: string) => void;
}

export const CompetenceProfileEditor: React.FC<CompetenceProfileEditorProps> = ({
  profession,
  onProfessionChange,
  professionLevel,
  onProfessionLevelChange,
  professionField,
  onProfessionFieldChange,
  professionSpecialization = '',
  onProfessionSpecializationChange,
  professionRank = '',
  onProfessionRankChange,
  professionExperience,
  onExperienceChange,

  craftingSkills,
  onCraftingSkillsChange,
  jobTitle,
  onJobTitleChange,
  authorities = [],
  onAuthoritiesChange,
  professionDescription,
  onProfessionDescriptionChange,

  professionProficiencyScore = 0,
  onProfessionProficiencyScoreChange,
  professionExperiencePoints = 0,
  onProfessionExperiencePointsChange,
  professionExperienceText = '',
  onProfessionExperienceTextChange,
  professionPromotionConditions = '',
  onProfessionPromotionConditionsChange,

  professionProgress,
  onProfessionProgressChange,
  professionCompetencies = [],
  onProfessionCompetenciesChange,

  socialTitles = [],
  onSocialTitlesChange,
  offices = [],
  onOfficesChange,
  positions = [],
  onPositionsChange,

  secondaryProfessions = [],
  onSecondaryProfessionsChange,

  talents,
  onTalentsChange,

  everydaySkills,
  onEverydaySkillsChange,
  everydaySkillsProficiencyScore = 0,
  onEverydaySkillsProficiencyScoreChange,
  everydaySkillsExperienceText = '',
  onEverydaySkillsExperienceTextChange,

  toolsAndEquipment,
  onToolsAndEquipmentChange
}) => {
  const [catalogTarget, setCatalogTarget] = useState<{ type: 'main' | 'secondary'; index?: number } | null>(null);
  const [catalogArchetype, setCatalogArchetype] = useState<string>('handwerk');
  const [catalogLevel, setCatalogLevel] = useState<string>('Ungelernt / Autodidakt');
  const [showDutiesSuggestions, setShowDutiesSuggestions] = useState<boolean>(false);

  const suggestedDuties = profession && professionLevel
    ? getDutiesForProfessionAndLevel(profession, professionLevel)
    : [];

  const authorityDuties = authorities.map(auth => ({
    auth,
    duty: AUTHORITY_DUTIES_MAP[auth] || `${auth} im Betrieb operativ ausführen und überwachen`
  }));

  const allSuggestedInText = suggestedDuties.length > 0 && suggestedDuties.every(d => isDutyInText(professionDescription, d));
  const allAuthoritiesInText = authorityDuties.length > 0 && authorityDuties.every(item => isDutyInText(professionDescription, item.duty));

  const dutyLineCount = professionDescription
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0).length;

  const handleApplyCatalogSelection = () => {
    if (!catalogTarget) return;

    const archetype = DUTIES_BY_ARCHETYPE[catalogArchetype];
    if (!archetype) return;

    const duties = archetype.levelDuties[catalogLevel] || [];
    if (duties.length === 0) return;

    if (catalogTarget.type === 'main') {
      onProfessionLevelChange(catalogLevel);
      if (onProfessionRankChange) onProfessionRankChange(catalogLevel);
      onProfessionDescriptionChange(addAllDutiesToText(professionDescription || '', duties));
    } else if (catalogTarget.type === 'secondary' && catalogTarget.index !== undefined) {
      const idx = catalogTarget.index;
      const sec = secondaryProfessions[idx];
      if (sec) {
        handleUpdateSecondaryProfession(idx, {
          professionLevel: catalogLevel,
          description: addAllDutiesToText(sec.description || '', duties)
        });
      }
    }

    setCatalogTarget(null);
  };

  const handleAddSecondaryProfession = () => {
    if (!onSecondaryProfessionsChange) return;
    const newSec: SecondaryProfession = {
      id: `sec-prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      profession: '',
      professionLevel: '',
      jobTitle: '',
      description: '',
      proficiencyScore: 0,
      experiencePoints: 0,
      experienceText: '',
      promotionConditions: ''
    };
    onSecondaryProfessionsChange([...secondaryProfessions, newSec]);
  };

  const handleUpdateSecondaryProfession = (index: number, updatedFields: Partial<SecondaryProfession>) => {
    if (!onSecondaryProfessionsChange) return;
    const list = [...secondaryProfessions];
    list[index] = { ...list[index], ...updatedFields };
    onSecondaryProfessionsChange(list);
  };

  const handleRemoveSecondaryProfession = (index: number) => {
    if (!onSecondaryProfessionsChange) return;
    const list = secondaryProfessions.filter((_, i) => i !== index);
    onSecondaryProfessionsChange(list);
  };

  // Lock body scroll while duties catalog modal is open
  useEffect(() => {
    if (catalogTarget !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [catalogTarget]);

  return (
    <div id="competence-profile-editor" className="flex flex-col gap-6 w-full">
      {/* ========================================================================= */}
      {/* 1. HAUPTBERUF - KOMPETENZPROFIL (EINSCHLIESSLICH KOMPETENZSEKTION)        */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Hauptberuf & Fachkompetenzen
            </h5>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Erlerntes Handwerk, Fachgebiet und handwerkliche Fertigkeiten des Charakters
            </span>
          </div>
          <button
            type="button"
            id="open-duties-catalog-btn"
            onClick={() => {
              const key = profession ? (Object.keys(DUTIES_BY_ARCHETYPE).find(k => {
                const title = (profession || '').toLowerCase().trim();
                return title.includes(k) || k === 'handwerk';
              }) || 'handwerk') : 'handwerk';
              setCatalogArchetype(key);
              setCatalogLevel(professionLevel || 'Ungelernt / Autodidakt');
              setCatalogTarget({ type: 'main' });
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Katalog der Aufgaben & Pflichten</span>
          </button>
        </div>

        {/* 1.1 KOMPETENZSYSTEM (Bereich A & B: Berufsfeld, Berufsbezeichnung untergeordnet, Spezialisierung, Rang, Erfahrung, Fortschritt, Kompetenzen) */}
        <div>
          <ProfessionCompetencySection
            professionName={profession}
            onProfessionNameChange={onProfessionChange}
            professionLevel={professionLevel}
            professionField={professionField}
            onProfessionFieldChange={onProfessionFieldChange}
            professionSpecialization={professionSpecialization}
            onSpecializationChange={onProfessionSpecializationChange}
            professionRank={professionRank}
            onProfessionRankChange={val => {
              if (onProfessionRankChange) onProfessionRankChange(val);
              onProfessionLevelChange(val);
            }}
            professionExperience={professionExperience}
            onExperienceChange={onExperienceChange}
            professionProgress={professionProgress || {
              professionName: profession,
              level: professionLevel,
              fieldId: professionField,
              specialization: professionSpecialization,
              rank: professionRank || professionLevel,
              overallProficiency: professionProficiencyScore,
              experiencePoints: professionExperiencePoints,
              experienceText: professionExperienceText,
              promotionConditions: professionPromotionConditions ? [professionPromotionConditions] : []
            }}
            onProfessionProgressChange={prog => {
              if (onProfessionProgressChange) onProfessionProgressChange(prog);
              if (onProfessionProficiencyScoreChange) onProfessionProficiencyScoreChange(prog.overallProficiency);
              if (onProfessionExperiencePointsChange) onProfessionExperiencePointsChange(prog.experiencePoints);
            }}
            competencies={professionCompetencies}
            onCompetenciesChange={comps => {
              if (onProfessionCompetenciesChange) onProfessionCompetenciesChange(comps);
            }}
            onProficiencyScoreChange={onProfessionProficiencyScoreChange}
            onExperiencePointsChange={onProfessionExperiencePointsChange}
            onPromotionConditionsChange={onProfessionPromotionConditionsChange}
            promotionConditionsText={professionPromotionConditions}
          />
        </div>

        {/* 1.3 BERUFLICHE FÄHIGKEITEN & BESCHREIBENDER TEXT */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-1.5">
          <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
            Zusätzliche Handwerkskenntnisse & Fertigkeiten
          </label>
          <AutoExpandingTextarea
            value={craftingSkills}
            onChange={e => onCraftingSkillsChange(e.target.value)}
            placeholder="Spezifische Fertigkeiten, handwerkliche Techniken und Fachkenntnisse eintragen"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition min-h-[55px]"
          />
        </div>

        {/* 1.4 BEFUGNISSE & WEISUNGSRECHTE (Wirtschaft / Betrieb) */}
        {onAuthoritiesChange && (
          <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-slate-300 font-bold uppercase tracking-wider block">
                  Befugnisse & Weisungsrechte im Betrieb
                </label>
                <span className="text-[10px] text-slate-500">
                  Operative Handlungsrechte im Wirtschafts- und Managementsystem
                </span>
              </div>
              {authorities.length > 0 && (
                <span className="text-[10px] text-amber-400 font-mono font-medium">
                  {authorities.length} aktiv
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              {STANDARD_AUTHORITIES.map(auth => {
                const has = authorities.includes(auth);
                return (
                  <button
                    key={auth}
                    type="button"
                    onClick={() => {
                      const next = has
                        ? authorities.filter(a => a !== auth)
                        : [...authorities, auth];
                      onAuthoritiesChange(next);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                      has
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{auth}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        has ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {has ? 'Aktiv' : 'Aus'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1.5 AUFGABEN, PFLICHTEN & ARBEITSALLTAG */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                Aufgaben, Pflichten & Arbeitsalltag
              </label>
              <span className="text-[10px] text-slate-500 block">
                Tägliche Arbeitsabläufe und Pflichten
              </span>
            </div>
            {dutyLineCount > 0 && (
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {dutyLineCount} {dutyLineCount === 1 ? 'Eintrag' : 'Einträge'}
              </span>
            )}
          </div>

          <AutoExpandingTextarea
            value={professionDescription}
            onChange={e => onProfessionDescriptionChange(e.target.value)}
            placeholder="Beschreibung der täglichen Aufgaben, Pflichten und Arbeitsabläufe"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition min-h-[65px]"
          />

          {/* VORSCHLÄGE & AUFGABEN-MODULE (Aufklappbar) */}
          {(suggestedDuties.length > 0 || authorityDuties.length > 0) && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Passende Aufgaben-Vorschläge
                </span>
                <button
                  type="button"
                  onClick={() => setShowDutiesSuggestions(!showDutiesSuggestions)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>{showDutiesSuggestions ? 'Vorschläge verbergen' : 'Vorschläge anzeigen'}</span>
                  {showDutiesSuggestions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showDutiesSuggestions && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-150">
                  {suggestedDuties.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Vorschläge für {profession}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (allSuggestedInText) {
                              onProfessionDescriptionChange(removeAllDutiesFromText(professionDescription, suggestedDuties));
                            } else {
                              onProfessionDescriptionChange(addAllDutiesToText(professionDescription, suggestedDuties));
                            }
                          }}
                          className="text-[10px] text-amber-500 hover:text-amber-400 transition font-bold cursor-pointer uppercase tracking-wider"
                        >
                          {allSuggestedInText ? 'Alle entfernen' : 'Alle übernehmen'}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {suggestedDuties.map((duty, idx) => {
                          const active = isDutyInText(professionDescription, duty);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onProfessionDescriptionChange(toggleDutyInText(professionDescription, duty))}
                              className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between gap-3 transition cursor-pointer ${
                                active
                                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span className="leading-snug">{duty}</span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 transition ${
                                  active
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {active ? 'Übernommen' : '+ Hinzufügen'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {authorityDuties.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/70">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Aufgaben aus Befugnissen ({authorityDuties.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allAuthDutyTexts = authorityDuties.map(a => a.duty);
                            if (allAuthoritiesInText) {
                              onProfessionDescriptionChange(removeAllDutiesFromText(professionDescription, allAuthDutyTexts));
                            } else {
                              onProfessionDescriptionChange(addAllDutiesToText(professionDescription, allAuthDutyTexts));
                            }
                          }}
                          className="text-[10px] text-amber-500 hover:text-amber-400 transition font-bold cursor-pointer uppercase tracking-wider"
                        >
                          {allAuthoritiesInText ? 'Alle entfernen' : 'Alle übernehmen'}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {authorityDuties.map(({ auth, duty }, idx) => {
                          const active = isDutyInText(professionDescription, duty);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onProfessionDescriptionChange(toggleDutyInText(professionDescription, duty))}
                              className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between gap-3 transition cursor-pointer ${
                                active
                                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 leading-snug">
                                <span className="text-[9px] font-mono text-amber-400/90 uppercase tracking-wide bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                  {auth}
                                </span>
                                <span>{duty}</span>
                              </div>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 transition ${
                                  active
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {active ? 'Übernommen' : '+ Hinzufügen'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GESELLSCHAFTLICHE TITEL, ÄMTER & POSITIONEN (SEPARATER V2-BEREICH)      */}
      {/* ========================================================================= */}
      {onSocialTitlesChange && onOfficesChange && onPositionsChange && (
        <TitlesAndPositionsSection
          socialTitles={socialTitles}
          offices={offices}
          positions={positions}
          onChangeSocialTitles={onSocialTitlesChange}
          onChangeOffices={onOfficesChange}
          onChangePositions={onPositionsChange}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. NEBENBERUFE & WEITERE QUALIFIKATIONEN                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Nebenberufe & Weitere Qualifikationen
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Zusätzliche Berufe, Nebentätigkeiten oder Zweitausbildungen des Charakters
            </p>
          </div>
          {onSecondaryProfessionsChange && (
            <button
              type="button"
              id="btn-add-secondary-profession"
              onClick={handleAddSecondaryProfession}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nebenberuf hinzufügen</span>
            </button>
          )}
        </div>

        {secondaryProfessions.length === 0 ? (
          <div className="p-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-500">
            Keine Nebenberufe eingetragen. Klicke auf "+ Nebenberuf hinzufügen", um eine weitere Berufsqualifikation zu ergänzen.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {secondaryProfessions.map((sec, idx) => (
              <div
                key={sec.id || idx}
                id={`secondary-profession-card-${idx}`}
                className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col gap-3.5 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">
                    Nebenberuf #{idx + 1}
                  </span>
                  {onSecondaryProfessionsChange && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryProfession(idx)}
                      className="px-2 py-0.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition flex items-center gap-1 cursor-pointer"
                      title="Nebenberuf entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Entfernen</span>
                    </button>
                  )}
                </div>

                {/* Einspaltiges Layout für den Nebenberuf */}
                <div>
                  <ProfessionCompetencySection
                    sectionTitle={`Nebenberuf #${idx + 1}`}
                    professionName={sec.profession || ''}
                    onProfessionNameChange={(val, detectedField) => {
                      const updates: Partial<SecondaryProfession> = { profession: val };
                      if (detectedField) updates.professionField = detectedField;
                      handleUpdateSecondaryProfession(idx, updates);
                    }}
                    professionLevel={sec.professionLevel || ''}
                    professionField={sec.professionField || ''}
                    onProfessionFieldChange={val => handleUpdateSecondaryProfession(idx, { professionField: val })}
                    professionSpecialization={sec.specialization || ''}
                    onSpecializationChange={val => handleUpdateSecondaryProfession(idx, { specialization: val })}
                    professionRank={sec.professionLevel || ''}
                    onProfessionRankChange={val => handleUpdateSecondaryProfession(idx, { professionLevel: val })}
                    professionProgress={sec.professionProgress || {
                      professionName: sec.profession || 'Nebenberuf',
                      level: sec.professionLevel || 'Anfänger',
                      fieldId: sec.professionField || '',
                      specialization: sec.specialization || '',
                      rank: sec.professionLevel || 'Anfänger',
                      overallProficiency: sec.proficiencyScore || 0,
                      experiencePoints: sec.experiencePoints || 0,
                      experienceText: sec.experienceText || '',
                      promotionConditions: sec.promotionConditions ? [sec.promotionConditions] : []
                    }}
                    onProfessionProgressChange={secProg => {
                      handleUpdateSecondaryProfession(idx, {
                        professionProgress: secProg,
                        proficiencyScore: secProg.overallProficiency,
                        experiencePoints: secProg.experiencePoints
                      });
                    }}
                    competencies={sec.professionCompetencies || []}
                    onCompetenciesChange={secComps => {
                      handleUpdateSecondaryProfession(idx, {
                        professionCompetencies: secComps
                      });
                    }}
                    onProficiencyScoreChange={val => handleUpdateSecondaryProfession(idx, { proficiencyScore: val })}
                    onExperiencePointsChange={val => handleUpdateSecondaryProfession(idx, { experiencePoints: val })}
                    onPromotionConditionsChange={val => handleUpdateSecondaryProfession(idx, { promotionConditions: val })}
                    promotionConditionsText={sec.promotionConditions || ''}
                  />
                </div>

                {/* Einspaltige Detailfelder für Nebenberuf */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Fähigkeiten & Aufgaben im Nebenberuf
                    </label>
                    <AutoExpandingTextarea
                      value={sec.description || ''}
                      onChange={e => handleUpdateSecondaryProfession(idx, { description: e.target.value })}
                      placeholder="Besondere Fertigkeiten oder Tätigkeiten in diesem Nebenberuf..."
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition min-h-[45px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. ERGÄNZENDE KOMPETENZEN & AUSRÜSTUNG (AutoExpandingTextareas)           */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="border-b border-slate-800/80 pb-2">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ergänzende Kompetenzen & Ausrüstung
          </h5>
        </div>

        {/* Spezielle Talente & Wissen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Spezielle Talente & Spezialwissen
          </label>
          <AutoExpandingTextarea
            value={talents}
            onChange={e => onTalentsChange(e.target.value)}
            placeholder="Spezielle Talente, Fachwissen und kognitive Kenntnisse"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition min-h-[55px]"
          />
        </div>

        {/* Alltagskompetenzen & Praktische Fertigkeiten */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Alltagskompetenzen & Praktische Fertigkeiten
          </label>
          <EverydaySkillsSelect
            value={everydaySkills}
            onChange={onEverydaySkillsChange}
            placeholder="Alltagskompetenzen und praktische Fertigkeiten im Alltag"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition min-h-[55px]"
          />
        </div>

        {/* Berufswerkzeuge & Ausrüstung */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Berufswerkzeuge, Lizenzen & Ausrüstung
          </label>
          <AutoExpandingTextarea
            value={toolsAndEquipment}
            onChange={e => onToolsAndEquipmentChange(e.target.value)}
            placeholder="Berufswerkzeuge, Lizenzen, Zertifikate und berufliche Ausrüstung"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition min-h-[55px]"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BERUFS- UND PFLICHTENKATALOG MODAL (Fixed Viewport Centered via Portal)    */}
      {/* ========================================================================= */}
      {catalogTarget !== null && typeof document !== 'undefined' && createPortal(
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setCatalogTarget(null);
          }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Katalog der Aufgaben und Pflichten
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wähle eine Berufskategorie und einen Ausbildungsgrad aus, um typische Pflichten zu übernehmen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatalogTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                Schließen
              </button>
            </div>

            {/* Einspaltiger Inhalt mit optimaler Raumausnutzung */}
            <div className="flex flex-col gap-4 overflow-y-auto p-5 flex-1">
              {/* Kategorie-Auswahl */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Berufskategorie
                </label>
                <select
                  value={catalogArchetype}
                  onChange={e => setCatalogArchetype(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.keys(DUTIES_BY_ARCHETYPE).map(key => (
                    <option key={key} value={key}>
                      {DUTIES_BY_ARCHETYPE[key].archetype}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ausbildungsgrad */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Ausbildungsgrad
                </label>
                <select
                  value={catalogLevel}
                  onChange={e => setCatalogLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.keys(DUTIES_BY_ARCHETYPE[catalogArchetype]?.levelDuties || {}).map(lvl => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pflichten-Vorschau */}
              <div className="flex flex-col gap-2 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Zugeordnete Aufgaben & Pflichten
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
                  {(DUTIES_BY_ARCHETYPE[catalogArchetype]?.levelDuties[catalogLevel] || []).map((duty, idx) => (
                    <li key={idx} className="marker:text-slate-600 pl-1">
                      {duty}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-950/40">
              <span className="text-[10px] text-slate-500">
                Ziel: {catalogTarget.type === 'main' ? 'Hauptberuf' : `Nebenberuf #${(catalogTarget.index || 0) + 1}`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCatalogTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleApplyCatalogSelection}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  Pflichten übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CompetenceProfileEditor;
