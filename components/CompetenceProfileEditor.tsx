import React from 'react';
import { SecondaryProfession } from '../types';
import ProfessionSelect from './ProfessionSelect';
import ProfessionLevelSelect from './ProfessionLevelSelect';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import EverydaySkillsSelect from './EverydaySkillsSelect';
import CompetenceProficiencyWidget from './CompetenceProficiencyWidget';

interface CompetenceProfileEditorProps {
  profession: string;
  onProfessionChange: (val: string) => void;
  professionLevel: string;
  onProfessionLevelChange: (val: string) => void;
  craftingSkills: string;
  onCraftingSkillsChange: (val: string) => void;
  jobTitle: string;
  onJobTitleChange: (val: string) => void;
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
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            Primäre Qualifikation
          </span>
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

        {/* FLOW ARROW 1 */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
            <span className="h-3 w-[1px] bg-slate-800"></span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              ↓ Ausbildungsgrad & Beherrschung
            </span>
            <span className="h-3 w-[1px] bg-slate-800"></span>
          </div>
        </div>

        {/* 2. BERUFSLEVEL / AUSBILDUNGSGRAD */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              2. Berufslevel / Ausbildungsgrad
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Erfahrungsstufe</span>
          </div>
          <ProfessionLevelSelect
            value={professionLevel}
            onChange={onProfessionLevelChange}
            placeholder="Berufslevel oder Ausbildungsgrad wählen..."
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

        {/* FLOW ARROW 2 */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
            <span className="h-3 w-[1px] bg-slate-800"></span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              ↓ Qualifikationen & Fertigkeiten
            </span>
            <span className="h-3 w-[1px] bg-slate-800"></span>
          </div>
        </div>

        {/* 3. FÄHIGKEITEN */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              3. Berufliche Fähigkeiten & Fertigkeiten
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Handwerk & Fachkenntnisse</span>
          </div>
          <AutoExpandingTextarea
            value={craftingSkills}
            onChange={e => onCraftingSkillsChange(e.target.value)}
            placeholder="Spezifische berufliche Fähigkeiten, Fertigkeiten, Handwerk und Fachkenntnisse"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[65px]"
          />
        </div>

        {/* FLOW ARROW 3 */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
            <span className="h-3 w-[1px] bg-slate-800"></span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              ↓ Position & Rang
            </span>
            <span className="h-3 w-[1px] bg-slate-800"></span>
          </div>
        </div>

        {/* 4. POSITION */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              4. Position, Titel & Rang
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Funktion in Betrieb / Gilde</span>
          </div>
          <input
            type="text"
            value={jobTitle}
            onChange={e => onJobTitleChange(e.target.value)}
            placeholder="Position, Titel, Rang oder Funktion in Betrieb oder Organisation"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-medium"
          />
        </div>

        {/* FLOW ARROW 4 */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
            <span className="h-3 w-[1px] bg-slate-800"></span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              ↓ Aufgaben & Pflichten
            </span>
            <span className="h-3 w-[1px] bg-slate-800"></span>
          </div>
        </div>

        {/* 5. VERANTWORTLICHKEITEN */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              5. Verantwortlichkeiten & Arbeitsalltag
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Tägliche Pflichten</span>
          </div>
          <AutoExpandingTextarea
            value={professionDescription}
            onChange={e => onProfessionDescriptionChange(e.target.value)}
            placeholder="Beschreibung der täglichen beruflichen Aufgaben, Pflichten und Verantwortungsbereiche"
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner min-h-[70px]"
          />
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
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Berufslevel / Ausbildungsgrad
                    </label>
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
    </div>
  );
};

export default CompetenceProfileEditor;
