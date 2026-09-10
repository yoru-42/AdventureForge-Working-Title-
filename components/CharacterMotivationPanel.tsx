import React from 'react';
import { MotivationCore } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface Props {
  motivationCore?: MotivationCore;
  mainGoalFallback?: string;
  mainGoalSync?: string;
  onChange: (updated: MotivationCore, mainGoalChanged?: string) => void;
  onGenerateAI: () => void;
  isGeneratingAI?: boolean;
  isGenerating?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CharacterMotivationPanel: React.FC<Props> = ({
  motivationCore = {},
  mainGoalFallback,
  mainGoalSync,
  onChange,
  onGenerateAI,
  isGeneratingAI = false,
  isGenerating = false,
  isOpen,
  onToggleOpen
}) => {
  const currentMainGoal = motivationCore.mainGoal ?? mainGoalSync ?? mainGoalFallback ?? '';
  const isBusy = isGeneratingAI || isGenerating;

  const updateField = (field: keyof MotivationCore, val: string) => {
    const updated: MotivationCore = {
      ...motivationCore,
      [field]: val
    };
    if (field === 'mainGoal') {
      onChange(updated, val);
    } else {
      onChange(updated);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Kopfzeile (einklappbar) */}
      <div className="p-4 flex items-center justify-between gap-3 bg-slate-950/40 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 text-left flex-1 cursor-pointer group"
        >
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs transition-transform group-hover:scale-105">
            <i className={`fa-solid ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'} text-[11px]`}></i>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-200 font-bold uppercase tracking-wider">
                Motivationskern &amp; Handlungsantrieb
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                Warum &amp; Werte
              </span>
            </div>
            <span className="text-xs text-slate-400 block mt-0.5">
              Psychologischer Kern, innere Überzeugungen, Ängste und Handlungsmotive
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onGenerateAI}
          disabled={isBusy}
          className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          title="Motivationskern durch Analyse von Rolle, Biografie und Persönlichkeit generieren oder verfeinern"
        >
          <i className={`fa-solid fa-wand-magic-sparkles ${isBusy ? 'animate-spin' : ''}`}></i>
          <span>{isBusy ? 'Wird generiert...' : 'Motivationskern per KI generieren'}</span>
        </button>
      </div>

      {/* Inhalt */}
      {isOpen && (
        <div className="p-5 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Hauptziel */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                Übergeordnetes Hauptziel / Bestrebungen
              </label>
              <AutoExpandingTextarea
                value={currentMainGoal}
                onChange={e => updateField('mainGoal', e.target.value)}
                placeholder="Das übergeordnete Lebensziel oder die zentrale Bestrebung..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Synchronisiert mit dem Hauptziel des Charakters.
              </span>
            </div>

            {/* 2. Warum dieses Ziel? */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                Innerer Antrieb / Warum dieses Ziel?
              </label>
              <AutoExpandingTextarea
                value={motivationCore.whyGoal || ''}
                onChange={e => updateField('whyGoal', e.target.value)}
                placeholder="Tief sitzender emotionaler oder existenzieller Antrieb (z. B. Schutz, Freiheit, Anerkennung, Rache)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Der grundlegende seelische oder existenzielle Beweggrund.
              </span>
            </div>

            {/* 3. Aktuelle Prioritäten */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                Aktuelle Prioritäten
              </label>
              <AutoExpandingTextarea
                value={motivationCore.currentPriorities || ''}
                onChange={e => updateField('currentPriorities', e.target.value)}
                placeholder="Gegenwärtige Dringlichkeiten und unmittelbare Schwerpunkte..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Was den Charakter im gegenwärtigen Lebensabschnitt am stärksten fordert.
              </span>
            </div>

            {/* 4. Bedürfnisse */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                Bedürfnisse
              </label>
              <AutoExpandingTextarea
                value={motivationCore.needs || ''}
                onChange={e => updateField('needs', e.target.value)}
                placeholder="Materielle, körperliche, soziale und emotionale Notwendigkeiten..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Elementare Erfordernisse (z. B. Sicherheit, Ressourcen, Einfluss, Information).
              </span>
            </div>

            {/* 5. Ängste & Vermeidung */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-red-400 font-bold uppercase tracking-wider">
                Ängste &amp; Vermeidung
              </label>
              <AutoExpandingTextarea
                value={motivationCore.fears || ''}
                onChange={e => updateField('fears', e.target.value)}
                placeholder="Umstände, Konsequenzen oder Gefahren, die unter allen Umständen verhindert werden sollen..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-red-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Befürchtungen, die Entscheidungen maßgeblich einschränken oder leiten.
              </span>
            </div>

            {/* 6. Werte & Prinzipien */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                Werte &amp; Prinzipien
              </label>
              <AutoExpandingTextarea
                value={motivationCore.valuesPrinciples || ''}
                onChange={e => updateField('valuesPrinciples', e.target.value)}
                placeholder="Moralischer Kompass, Grundregeln, Tabus und persönliche Ehrenkodizes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Feste Richtlinien des Verhaltens und unüberwindbare moralische Grenzen.
              </span>
            </div>

            {/* 7. Mittel & Vorgehensweisen */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">
                Mittel &amp; Vorgehensweisen
              </label>
              <AutoExpandingTextarea
                value={motivationCore.methodsAndMeans || ''}
                onChange={e => updateField('methodsAndMeans', e.target.value)}
                placeholder="Bevorzugte Taktiken (z. B. Diplomatie, Verhandlung, Täuschung, direkte Gewalt, Ausdauer)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Taktische und strategische Werkzeuge zur praktischen Zielumsetzung.
              </span>
            </div>

            {/* 8. Veränderungsauslöser */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                Veränderungsauslöser
              </label>
              <AutoExpandingTextarea
                value={motivationCore.changeTriggers || ''}
                onChange={e => updateField('changeTriggers', e.target.value)}
                placeholder="Ereignisse, Enthüllungen oder Verluste, die Gesinnung oder Prioritäten wandeln können..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[70px]"
              />
              <span className="text-[10px] text-slate-500">
                Bedingungen für innere Wandlung, Sinneswandel oder Neuausrichtung.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterMotivationPanel;
