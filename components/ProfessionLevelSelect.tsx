import React, { useState, useEffect } from 'react';

export const PROFESSION_LEVEL_PRESETS = [
  "Ungelernt / Autodidakt",
  "Neuling / Anfänger",
  "Lehrling / Auszubildender",
  "Geselle / Fortgeschritten",
  "Experte / Spezialist",
  "Meister / Führungskraft",
  "Großmeister / Koryphäe",
  "Veteran / Legendär"
];

interface ProfessionLevelSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectClassName?: string;
  inputClassName?: string;
}

export const ProfessionLevelSelect: React.FC<ProfessionLevelSelectProps> = ({
  value,
  onChange,
  placeholder = "Berufslevel / Ausbildungsgrad wählen...",
  selectClassName = "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-normal",
  inputClassName = "w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 transition shadow-inner font-normal"
}) => {
  const isValueInPresets = PROFESSION_LEVEL_PRESETS.includes(value);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!isValueInPresets && value.trim().length > 0);

  useEffect(() => {
    if (!PROFESSION_LEVEL_PRESETS.includes(value) && value.trim().length > 0) {
      setIsCustomMode(true);
    }
  }, [value]);

  const selectValue = isCustomMode ? '__custom__' : (isValueInPresets ? value : '');

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
        {PROFESSION_LEVEL_PRESETS.map(lvl => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
        <option value="__custom__">Eigener Ausbildungsgrad / Freitext...</option>
      </select>

      {isCustomMode && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Eigener Ausbildungsgrad / Freitext..."
          className={inputClassName}
        />
      )}
    </div>
  );
};

export default ProfessionLevelSelect;
