import React, { useMemo, useState } from 'react';
import { JOB_CATEGORIES, getFieldIdForJob } from './jobPresets';

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string, detectedFieldId?: string) => void;
  selectedField?: string;
  onFieldChange?: (fieldId: string) => void;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  showNobleChildrenButton?: boolean;
}

/**
 * Berufsauswahl V3
 *
 * Wichtig:
 * - Berufszweig wird als kompakter Tag gewählt.
 * - Danach beginnt immer der Berufstree mit LEHRLING.
 * - Berufe sind einzelne Knoten und werden niemals zu Kombinationsberufen
 *   wie „Koch & Florist“ zusammengeführt.
 * - Adelstitel gehören nicht in diesen Tree.
 * - Berufserfahrung, Kompetenzen und Talente bleiben getrennte Ebenen.
 *
 * Die eigentlichen Aufstiegskanten können später über parentIds/childIds
 * aus dem Katalog ergänzt werden. Bis dahin werden alle Katalogberufe des
 * gewählten Berufszweigs als eigenständige erreichbare Berufsknoten unter
 * Lehrling dargestellt, damit kein Beruf verloren geht.
 */
export const ProfessionSelect: React.FC<ProfessionSelectProps> = ({
  value = '',
  onChange,
  selectedField = '',
  onFieldChange,
  placeholder = 'Beruf auswählen...',
  className = '',
  selectClassName = '',
  inputClassName = ''
}) => {
  const [openField, setOpenField] = useState(selectedField || '');

  const activeField = selectedField || openField;
  const activeCategory = useMemo(
    () => JOB_CATEGORIES.find(category => category.fieldId === activeField),
    [activeField]
  );

  const selectField = (fieldId: string) => {
    setOpenField(fieldId);
    onFieldChange?.(fieldId);

    // Beim Wechsel des Berufszweigs keinen alten Beruf mitschleppen.
    if (value) onChange('', fieldId);
  };

  const selectProfession = (job: string) => {
    const fieldId = activeCategory?.fieldId || getFieldIdForJob(job);
    onChange(job, fieldId);
    if (fieldId) {
      setOpenField(fieldId);
      onFieldChange?.(fieldId);
    }
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Kompakte Berufszweig-Auswahl */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Berufszweig wählen
          </span>
          {activeCategory && (
            <span className="text-[10px] text-slate-500">
              {activeCategory.jobs.length} Berufe
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {JOB_CATEGORIES.map(category => {
            const selected = category.fieldId === activeField;
            return (
              <button
                key={category.fieldId}
                type="button"
                onClick={() => selectField(category.fieldId)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                  selected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {category.category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Echter Berufstree */}
      {activeCategory ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 overflow-x-auto">
          <div className="min-w-max">
            <div className="flex justify-center">
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-center shadow-sm">
                <div className="text-xs font-black tracking-wide text-amber-300">LEHRLING</div>
                <div className="mt-0.5 text-[10px] text-slate-500">Berufseinstieg</div>
              </div>
            </div>

            <div className="mx-auto h-5 w-px bg-slate-700" />

            <div className="relative pt-4">
              {/* horizontale Verbindung vom Lehrling zu allen Berufsknoten */}
              {activeCategory.jobs.length > 1 && (
                <div className="absolute left-8 right-8 top-0 h-px bg-slate-700" />
              )}

              <div className="flex items-start justify-center gap-2 md:gap-3">
                {activeCategory.jobs.map((job, index) => {
                  const selected = value === job;
                  const safeId = `${activeCategory.fieldId}:${index}:${job}`;

                  return (
                    <div key={safeId} className="flex w-32 flex-col items-center">
                      <div className="h-4 w-px bg-slate-700" />
                      <button
                        type="button"
                        title={job}
                        onClick={() => selectProfession(job)}
                        className={`w-full min-h-[58px] rounded-xl border px-2 py-2 text-center transition ${
                          selected
                            ? 'border-amber-500 bg-amber-500/15 text-amber-200 shadow-md'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold leading-tight">{job}</div>
                        <div className="mt-1 text-[9px] text-slate-500">
                          {selected ? '✓ Aktueller Beruf' : 'Beruf wählen'}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Berufsentwicklung
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                  <div className="text-[10px] text-slate-500">Berufsfortschritt</div>
                  <div className="text-[11px] text-slate-300">separater Tree-Pfad</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                  <div className="text-[10px] text-slate-500">Berufserfahrung</div>
                  <div className="text-[11px] text-slate-300">eigener Erfahrungswert</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                  <div className="text-[10px] text-slate-500">Fachkompetenzen</div>
                  <div className="text-[11px] text-slate-300">Grundlagen · Talente</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                  <div className="text-[10px] text-slate-500">Spezialisierungen</div>
                  <div className="text-[11px] text-slate-300">mehrere Pfade möglich</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default ProfessionSelect;
