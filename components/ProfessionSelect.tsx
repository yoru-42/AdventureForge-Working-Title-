import React, { useState, useEffect } from 'react';
import { JOB_CATEGORIES, ALL_PRESET_JOBS, NOBLE_CHILDREN_GROUPS } from './jobPresets';

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  showNobleChildrenButton?: boolean;
}

export const ProfessionSelect: React.FC<ProfessionSelectProps> = ({
  value = "",
  onChange,
  placeholder = "Beruf wählen oder eintragen...",
  selectClassName = "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-normal",
  inputClassName = "w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-normal",
  showNobleChildrenButton = true
}) => {
  const safeValue = value || "";
  const isValueInPresets = ALL_PRESET_JOBS.includes(safeValue);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!isValueInPresets && safeValue.trim().length > 0);
  const [showNobleChildrenSubmenu, setShowNobleChildrenSubmenu] = useState<boolean>(false);

  useEffect(() => {
    const sVal = value || "";
    if (!ALL_PRESET_JOBS.includes(sVal) && sVal.trim().length > 0) {
      setIsCustomMode(true);
    }
  }, [value]);

  const selectValue = isCustomMode ? '__custom__' : (isValueInPresets ? safeValue : '');

  const handleSelectTitle = (title: string) => {
    setIsCustomMode(false);
    onChange(title);
  };

  return (
    <div className="flex flex-col w-full">
      <select
        className={selectClassName}
        value={selectValue}
        onChange={e => {
          const val = e.target.value;
          if (val === '__custom__') {
            setIsCustomMode(true);
          } else {
            setIsCustomMode(false);
            onChange(val);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {JOB_CATEGORIES.map(cat => (
          <optgroup key={cat.category} label={cat.category}>
            {cat.jobs.map(job => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__custom__">Eigener Beruf / Freitext eingeben...</option>
      </select>

      {showNobleChildrenButton && (
        <>
          <div className="flex items-center justify-between mt-1.5">
            <button
              type="button"
              onClick={() => setShowNobleChildrenSubmenu(!showNobleChildrenSubmenu)}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-sitemap text-[10px]"></i>
              <span>
                {showNobleChildrenSubmenu ? 'Adelsnachkommen-Menü schließen' : 'Kinder von Adeligen & Kindertitel (z.B. Herzogstochter)...'}
              </span>
            </button>
          </div>

          {showNobleChildrenSubmenu && (
            <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 mt-2 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Titel für Adelsnachkommen & Kinder
                </span>
                <span className="text-[10px] text-slate-400">
                  Klicken zum Übernehmen
                </span>
              </div>

              <div className="space-y-2.5">
                {NOBLE_CHILDREN_GROUPS.map(group => (
                  <div key={group.house} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {group.house}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {group.titles.map(title => {
                        const isSelected = safeValue === title;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => handleSelectTitle(title)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isCustomMode && (
        <input
          type="text"
          value={safeValue}
          onChange={e => onChange(e.target.value)}
          placeholder="Eigener Beruf / Freitext..."
          className={inputClassName}
        />
      )}
    </div>
  );
};

export default ProfessionSelect;
