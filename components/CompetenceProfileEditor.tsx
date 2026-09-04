import React, { useState } from 'react';
import { SecondaryProfession } from '../types';
import ProfessionSelect from './ProfessionSelect';
import ProfessionLevelSelect from './ProfessionLevelSelect';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import EverydaySkillsSelect from './EverydaySkillsSelect';
import CompetenceProficiencyWidget from './CompetenceProficiencyWidget';
import { getDutiesForProfessionAndLevel, DUTIES_BY_ARCHETYPE } from './professionDuties';
import { STANDARD_AUTHORITIES, AUTHORITY_DUTIES_MAP } from './economy/EconomyPresets';

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
  profession: string;
  onProfessionChange: (val: string) => void;
  professionLevel: string;
  onProfessionLevelChange: (val: string) => void;
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
  const [catalogTarget, setCatalogTarget] = useState<{ type: 'main' | 'secondary', index?: number } | null>(null);
  const [catalogArchetype, setCatalogArchetype] = useState<string>("handwerk");
  const [catalogLevel, setCatalogLevel] = useState<string>("Ungelernt / Autodidakt");

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

  const handleApplyDuties = () => {
    if (suggestedDuties.length === 0) return;
    onProfessionDescriptionChange(addAllDutiesToText(professionDescription, suggestedDuties));
  };

  const handleApplyCatalogSelection = () => {
    if (!catalogTarget) return;

    const archetype = DUTIES_BY_ARCHETYPE[catalogArchetype];
    if (!archetype) return;

    const duties = archetype.levelDuties[catalogLevel] || [];
    if (duties.length === 0) return;

    if (catalogTarget.type === 'main') {
      onProfessionLevelChange(catalogLevel);
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

  return (
    <div className="space-y-6">
      {/* HAUPTBERUF - KOMPETENZPROFIL */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Hauptberuf - Kompetenzprofil
          </h5>
          <button
            type="button"
            onClick={() => {
              // Try to find matching archetype for current profession to initialize
              const currentKey = getDutiesForProfessionAndLevel ? 'handwerk' : 'handwerk'; 
              // We'll let the user browse, but initialized to the current profession's archetype if possible
              const key = profession ? (Object.keys(DUTIES_BY_ARCHETYPE).find(k => {
                const title = (profession || "").toLowerCase().trim();
                // simple heuristics or default to handwerk
                return title.includes(k) || k === "handwerk";
              }) || "handwerk") : "handwerk";
              
              setCatalogArchetype(key);
              setCatalogLevel(professionLevel || "Ungelernt / Autodidakt");
              setCatalogTarget({ type: 'main' });
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Katalog der Aufgaben und Pflichten</span>
          </button>
        </div>

        {/* 1. BERUF */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              1. Hauptberuf / Spezialisierung
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Fachbereich</span>
          </div>
          <ProfessionSelect
            value={profession}
            onChange={onProfessionChange}
            placeholder="Hauptberuf wählen oder eintragen..."
          />
        </div>

        {/* 2. BERUFSLEVEL / AUSBILDUNGSGRAD */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              2. Berufslevel / Ausbildungsgrad
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Erfahrungsstufe</span>
          </div>
          <ProfessionLevelSelect
            value={professionLevel}
            onChange={onProfessionLevelChange}
            placeholder="Ausbildungsgrad oder Stufe wählen..."
          />
        </div>

        {/* ANZEIGE: BEHERRSCHUNG, ERFAHRUNG & AUFSTIEGSBEDINGUNGEN FÜR HAUPTBERUF */}
        <CompetenceProficiencyWidget
          title="Fortschritt, Erfahrung & Aufstieg (Hauptberuf)"
          proficiencyScore={professionProficiencyScore}
          onProficiencyScoreChange={onProfessionProficiencyScoreChange}
          experiencePoints={professionExperiencePoints}
          onExperiencePointsChange={onProfessionExperiencePointsChange}
          experienceText={professionExperienceText}
          onExperienceTextChange={onProfessionExperienceTextChange}
          promotionConditions={professionPromotionConditions}
          onPromotionConditionsChange={onProfessionPromotionConditionsChange}
          showPromotionConditions={true}
        />

        {/* 3. FÄHIGKEITEN */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              3. Berufliche Fähigkeiten & Handwerk
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Fachkenntnisse</span>
          </div>
          <AutoExpandingTextarea
            value={craftingSkills}
            onChange={e => onCraftingSkillsChange(e.target.value)}
            placeholder="Spezifische Fertigkeiten, handwerkliche Techniken und Fachkenntnisse eintragen"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[60px]"
          />
        </div>

        {/* 4. POSITION */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              4. Betriebliche Position, Titel & Rang
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Funktion in Betrieb oder Organisation</span>
          </div>
          <input
            type="text"
            value={jobTitle}
            onChange={e => onJobTitleChange(e.target.value)}
            placeholder="Position, Amt, Titel oder Rangbezeichnung"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-medium"
          />
        </div>

        {/* 5. BEFUGNISSE & HANDLUNGSRECHTE */}
        {onAuthoritiesChange && (
          <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-slate-300 font-bold uppercase tracking-wider block">
                  5. Befugnisse & Weisungsrechte
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Entscheidungsrechte im Wirtschafts- und Managementsystem</span>
              </div>
              {authorities.length > 0 && (
                <span className="text-[10px] text-amber-400 font-mono font-medium">
                  {authorities.length} zugewiesen
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
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
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                      has
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{auth}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${has ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-600'}`}>
                      {has ? 'Aktiv' : 'Aus'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. AUFGABEN, PFLICHTEN & ARBEITSALLTAG */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                {onAuthoritiesChange ? '6.' : '5.'} Aufgaben, Pflichten & Arbeitsalltag
              </label>
              <span className="text-[10px] text-slate-500 font-medium block">
                Tägliche Routine, Pflichten und Arbeitsabläufe
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[72px]"
          />

          {/* VORSCHLÄGE & AUFGABEN-MODULE */}
          {(suggestedDuties.length > 0 || authorityDuties.length > 0) && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 mt-1">
              {/* Vorgeschlagene Aufgaben aus Beruf & Ausbildungsgrad */}
              {suggestedDuties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Vorschläge für {profession} ({professionLevel})</span>
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
                  <div className="space-y-1.5">
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

              {/* Aufgaben aus zugewiesenen Befugnissen */}
              {authorityDuties.length > 0 && (
                <div className={`space-y-2 ${suggestedDuties.length > 0 ? 'pt-3 border-t border-slate-800/70' : ''}`}>
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
                  <div className="space-y-1.5">
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
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 leading-snug">
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
      </div>

      {/* NEBENBERUFE & WEITERE QUALIFIKATIONEN */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
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
              onClick={handleAddSecondaryProfession}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Nebenberuf hinzufügen</span>
            </button>
          )}
        </div>

        {secondaryProfessions.length === 0 ? (
          <div className="p-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-500">
            Keine Nebenberufe eingetragen. Klicke auf "+ Nebenberuf hinzufügen", um eine weitere Berufsqualifikation zu ergänzen.
          </div>
        ) : (
          <div className="space-y-4">
            {secondaryProfessions.map((sec, idx) => (
              <div
                key={sec.id || idx}
                className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3.5 relative group"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">
                    Nebenberuf #{idx + 1}
                  </span>
                  {onSecondaryProfessionsChange && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryProfession(idx)}
                      className="px-2 py-0.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                      title="Nebenberuf entfernen"
                    >
                      Entfernen
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Beruf */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Beruf / Spezialisierung
                    </label>
                    <ProfessionSelect
                      value={sec.profession || ''}
                      onChange={val => handleUpdateSecondaryProfession(idx, { profession: val })}
                      placeholder="Nebenberuf wählen oder eintragen..."
                    />
                  </div>

                  {/* Ausbildungsgrad */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Berufslevel / Ausbildungsgrad
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const key = sec.profession ? (Object.keys(DUTIES_BY_ARCHETYPE).find(k => {
                            const title = (sec.profession || "").toLowerCase().trim();
                            return title.includes(k) || k === "handwerk";
                          }) || "handwerk") : "handwerk";
                          setCatalogArchetype(key);
                          setCatalogLevel(sec.professionLevel || "Ungelernt / Autodidakt");
                          setCatalogTarget({ type: 'secondary', index: idx });
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline transition font-bold cursor-pointer"
                      >
                        Katalog öffnen
                      </button>
                    </div>
                    <ProfessionLevelSelect
                      value={sec.professionLevel || ''}
                      onChange={val => handleUpdateSecondaryProfession(idx, { professionLevel: val })}
                      placeholder="Ausbildungsgrad wählen..."
                    />
                  </div>
                </div>

                <CompetenceProficiencyWidget
                  title={`Fortschritt & Aufstieg (Nebenberuf #${idx + 1})`}
                  proficiencyScore={sec.proficiencyScore || 0}
                  onProficiencyScoreChange={val => handleUpdateSecondaryProfession(idx, { proficiencyScore: val })}
                  experiencePoints={sec.experiencePoints || 0}
                  onExperiencePointsChange={val => handleUpdateSecondaryProfession(idx, { experiencePoints: val })}
                  experienceText={sec.experienceText || ''}
                  onExperienceTextChange={val => handleUpdateSecondaryProfession(idx, { experienceText: val })}
                  promotionConditions={sec.promotionConditions || ''}
                  onPromotionConditionsChange={val => handleUpdateSecondaryProfession(idx, { promotionConditions: val })}
                  showPromotionConditions={true}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Position / Rang */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Position, Titel & Rang
                    </label>
                    <input
                      type="text"
                      value={sec.jobTitle || ''}
                      onChange={e => handleUpdateSecondaryProfession(idx, { jobTitle: e.target.value })}
                      placeholder="Position oder Rang im Nebenberuf..."
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition font-medium"
                    />
                  </div>

                  {/* Beschreibung / Fertigkeiten */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Fähigkeiten & Aufgaben
                    </label>
                    <AutoExpandingTextarea
                      value={sec.description || ''}
                      onChange={e => handleUpdateSecondaryProfession(idx, { description: e.target.value })}
                      placeholder="Besondere Fähigkeiten oder Tätigkeiten in diesem Nebenberuf..."
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition min-h-[42px]"
                    />

                    {/* Live-Vorschläge für Nebenberuf */}
                    {sec.profession && sec.professionLevel && (() => {
                      const secDuties = getDutiesForProfessionAndLevel(sec.profession || '', sec.professionLevel || '');
                      if (secDuties.length === 0) return null;
                      const secDesc = sec.description || '';
                      const allSecInText = secDuties.every(d => isDutyInText(secDesc, d));

                      return (
                        <div className="bg-slate-900/50 border border-slate-800/70 rounded-xl p-2.5 space-y-2 mt-1.5">
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Vorschläge für {sec.profession} ({sec.professionLevel})</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (allSecInText) {
                                  handleUpdateSecondaryProfession(idx, {
                                    description: removeAllDutiesFromText(secDesc, secDuties)
                                  });
                                } else {
                                  handleUpdateSecondaryProfession(idx, {
                                    description: addAllDutiesToText(secDesc, secDuties)
                                  });
                                }
                              }}
                              className="text-[9px] text-amber-500 hover:text-amber-400 transition font-bold cursor-pointer uppercase tracking-wider"
                            >
                              {allSecInText ? 'Alle entfernen' : 'Alle übernehmen'}
                            </button>
                          </div>
                          <div className="space-y-1">
                            {secDuties.map((duty, dIdx) => {
                              const active = isDutyInText(secDesc, duty);
                              return (
                                <button
                                  key={dIdx}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateSecondaryProfession(idx, {
                                      description: toggleDutyInText(secDesc, duty)
                                    });
                                  }}
                                  className={`w-full p-2 rounded-lg text-[11px] text-left border flex items-center justify-between gap-2 transition cursor-pointer ${
                                    active
                                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                                  }`}
                                >
                                  <span className="leading-snug">{duty}</span>
                                  <span
                                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 transition ${
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
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ERGÄNZENDE KOMPETENZEN & AUSRÜSTUNG */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[60px]"
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[60px]"
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
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[60px]"
          />
        </div>
      </div>

      {/* BERUFS- UND PFLICHTENKATALOG MODAL */}
      {catalogTarget !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Katalog der Aufgaben und Pflichten
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wähle eine Berufskategorie und einen Ausbildungsgrad aus, um die typischen Aufgaben zu übernehmen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatalogTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Schließen</span>
              </button>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left Column: Categories */}
              <div className="w-1/3 border-r border-slate-800 bg-slate-950/20 overflow-y-auto p-3 space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3 py-1.5">
                  Berufskategorien
                </div>
                {Object.keys(DUTIES_BY_ARCHETYPE).map((key) => {
                  const item = DUTIES_BY_ARCHETYPE[key];
                  const isActive = catalogArchetype === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCatalogArchetype(key)}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                        isActive
                          ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      {item.archetype}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Levels and Duties */}
              <div className="w-2/3 overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                      Ausgewählte Kategorie
                    </span>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight mt-0.5">
                      {DUTIES_BY_ARCHETYPE[catalogArchetype]?.archetype || ""}
                    </h4>
                  </div>

                  {/* Levels List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Ausbildungsgrad wählen
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(DUTIES_BY_ARCHETYPE[catalogArchetype]?.levelDuties || {}).map((lvl) => {
                        const isSelected = catalogLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCatalogLevel(lvl)}
                            className={`border rounded-xl p-2.5 text-left text-xs font-medium transition duration-150 cursor-pointer ${
                              isSelected
                                ? "bg-amber-600/10 border-amber-500/40 text-amber-300"
                                : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duties Preview Box */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Zugeordnete Aufgaben und Pflichten
                    </span>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                      {(DUTIES_BY_ARCHETYPE[catalogArchetype]?.levelDuties[catalogLevel] || []).map((duty, idx) => (
                        <li key={idx} className="marker:text-slate-600 pl-1">
                          {duty}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
                  Daten übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetenceProfileEditor;
