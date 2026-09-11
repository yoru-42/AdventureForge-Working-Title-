import React, { useState } from 'react';
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
import AutoExpandingTextarea from './AutoExpandingTextarea';
import EverydaySkillsSelect from './EverydaySkillsSelect';
import { ProfessionCompetencySection } from './ProfessionCompetencySection';
import { TitlesAndPositionsSection } from './TitlesAndPositionsSection';
import { getDutiesForProfessionAndLevel } from './professionDuties';
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
  const [showDutiesSuggestions, setShowDutiesSuggestions] = useState<boolean>(false);

  // Section collapse states per V4 Specification Section 1
  const [isProfessionsOpen, setIsProfessionsOpen] = useState<boolean>(true);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState<boolean>(false);
  const [isTitlesOpen, setIsTitlesOpen] = useState<boolean>(false);

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

  return (
    <div id="competence-profile-editor" className="flex flex-col gap-6 w-full">
      {/* ========================================================================= */}
      {/* 1. HAUPTBERUF - KOMPETENZPROFIL (BERUFE & TALENTBAUM)                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsProfessionsOpen(prev => !prev)}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-500/60 transition">
              {isProfessionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <div>
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider group-hover:text-amber-300 transition">
                Berufe (Hauptberuf & Talentbaum)
              </h5>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Berufszweig, Talentbaum, Erfahrung und Fachkompetenzen
              </span>
            </div>
          </button>
        </div>

        {isProfessionsOpen && (
          <div className="flex flex-col gap-4">

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
            secondaryProfessions={secondaryProfessions}
            onSecondaryProfessionsChange={onSecondaryProfessionsChange}
            socialTitles={socialTitles}
            onSocialTitlesChange={onSocialTitlesChange}
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
    )}
  </div>

      {/* ========================================================================= */}
      {/* 2. NEBENBERUFE & WEITERE QUALIFIKATIONEN                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsSecondaryOpen(prev => !prev)}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-500/60 transition">
              {isSecondaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <div>
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider group-hover:text-amber-300 transition">
                Nebenberufe ({secondaryProfessions.length})
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zusätzliche Berufe, Nebentätigkeiten oder Zweitausbildungen des Charakters
              </p>
            </div>
          </button>

          {onSecondaryProfessionsChange && (
            <button
              type="button"
              id="btn-add-secondary-profession"
              onClick={handleAddSecondaryProfession}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nebenberuf hinzufügen</span>
            </button>
          )}
        </div>

        {isSecondaryOpen && (
          <div className="flex flex-col gap-4">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. GESELLSCHAFTLICHE TITEL, ÄMTER & POSITIONEN (ADELSTITEL & STAND)        */}
      {/* ========================================================================= */}
      {onSocialTitlesChange && onOfficesChange && onPositionsChange && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsTitlesOpen(prev => !prev)}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-500/60 transition">
                {isTitlesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider group-hover:text-amber-300 transition">
                  Adelstitel & Gesellschaftlicher Stand
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Adelstitel, öffentliche Ämter, Ränge und gesellschaftliche Positionen (keine Berufe)
                </p>
              </div>
            </button>
          </div>

          {isTitlesOpen && (
            <TitlesAndPositionsSection
              socialTitles={socialTitles}
              offices={offices}
              positions={positions}
              onChangeSocialTitles={onSocialTitlesChange}
              onChangeOffices={onOfficesChange}
              onChangePositions={onPositionsChange}
            />
          )}
        </div>
      )}

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
    </div>
  );
};

export default CompetenceProfileEditor;
