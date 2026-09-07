import React, { useState, useEffect, useMemo } from 'react';
import {
  JOB_CATEGORIES,
  ALL_PRESET_JOBS,
  NOBLE_CHILDREN_GROUPS,
  getFieldIdForJob,
  getJobCategoryByFieldId
} from './jobPresets';

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

export const ProfessionSelect: React.FC<ProfessionSelectProps> = ({
  value = "",
  onChange,
  selectedField = "",
  onFieldChange,
  placeholder = "Berufsbezeichnung wählen...",
  selectClassName = "w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition shadow-inner font-normal",
  inputClassName = "w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 transition shadow-inner font-normal",
  showNobleChildrenButton = true
}) => {
  const safeValue = value || "";
  const allNobleTitles = useMemo(() => NOBLE_CHILDREN_GROUPS.flatMap(g => g.titles), []);
  const isValueInPresets = ALL_PRESET_JOBS.includes(safeValue);
  const isValueInNoble = allNobleTitles.includes(safeValue);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!isValueInPresets && !isValueInNoble && safeValue.trim().length > 0);
  const [showNobleChildrenSubmenu, setShowNobleChildrenSubmenu] = useState<boolean>(false);

  useEffect(() => {
    const sVal = value || "";
    if (ALL_PRESET_JOBS.includes(sVal) || sVal.trim().length === 0 || allNobleTitles.includes(sVal)) {
      setIsCustomMode(false);
    } else {
      setIsCustomMode(true);
    }
  }, [value, allNobleTitles]);

  const handleJobSelected = (job: string) => {
    const detectedField = getFieldIdForJob(job);
    if (detectedField && onFieldChange) {
      onFieldChange(detectedField);
    }
    onChange(job, detectedField);
  };

  const handleSelectTitle = (title: string) => {
    setIsCustomMode(false);
    const detectedField = getFieldIdForJob(title) || 'adel_herrschaft';
    if (onFieldChange) {
      onFieldChange(detectedField);
    }
    onChange(title, detectedField);
  };

  // Organize categories: if selectedField is provided, ONLY include that specific field's jobs
  const organizedCategories = useMemo(() => {
    if (!selectedField) return JOB_CATEGORIES;
    const activeCat = getJobCategoryByFieldId(selectedField);
    if (!activeCat) return JOB_CATEGORIES;
    return [activeCat];
  }, [selectedField]);

  // Check if current value exists in the filtered categories
  const isValueInOrganized = useMemo(() => {
    return organizedCategories.some(cat => cat.jobs.includes(safeValue));
  }, [organizedCategories, safeValue]);

  const selectValue = isCustomMode ? '__custom__' : (isValueInOrganized ? safeValue : '');

  return (
    <div className="flex flex-col w-full">
      <select
        className={selectClassName}
        value={selectValue}
        onChange={e => {
          const val = e.target.value;
          if (val === '__custom__') {
            setIsCustomMode(true);
          } else if (val) {
            setIsCustomMode(false);
            handleJobSelected(val);
          } else {
            setIsCustomMode(false);
            onChange('');
          }
        }}
      >
        <option value="">{placeholder}</option>
        {organizedCategories.map(cat => {
          return (
            <optgroup
              key={cat.fieldId}
              label={`Passende Berufe: ${cat.category}`}
            >
              {cat.jobs.map(job => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </optgroup>
          );
        })}
        <option value="__custom__">Eigene Berufsbezeichnung / Freitext eintragen...</option>
      </select>

      {isCustomMode && (
        <input
          type="text"
          value={safeValue}
          onChange={e => {
            const val = e.target.value;
            const detectedField = getFieldIdForJob(val);
            if (detectedField && onFieldChange) {
              onFieldChange(detectedField);
            }
            onChange(val, detectedField);
          }}
          placeholder="Eigene Berufsbezeichnung eintragen..."
          className={inputClassName}
        />
      )}

      {showNobleChildrenButton && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setShowNobleChildrenSubmenu(!showNobleChildrenSubmenu)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-[10px]">{showNobleChildrenSubmenu ? '▲' : '▼'}</span>
            <span>
              {showNobleChildrenSubmenu ? 'Adelstitel ausblenden' : 'Adels- und Nachkommentitel auswählen'}
            </span>
          </button>

          {showNobleChildrenSubmenu && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mt-2 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Adels- und Standestitel
                </span>
                <span className="text-[10px] text-slate-500">
                  Auswahl übernimmt den Titel
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
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
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
        </div>
      )}
    </div>
  );
};

export default ProfessionSelect;
