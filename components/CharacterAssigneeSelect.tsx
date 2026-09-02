import React, { useState, useEffect } from 'react';
import { LoreEntry, NPC, EconomyHolding } from '../types';

interface CharacterAssigneeSelectProps {
  value: string;
  onChange: (value: string) => void;
  loreDatabase?: LoreEntry[];
  npcs?: NPC[];
  holding?: EconomyHolding;
  placeholder?: string;
  selectClassName?: string;
  inputClassName?: string;
}

export const CharacterAssigneeSelect: React.FC<CharacterAssigneeSelectProps> = ({
  value,
  onChange,
  loreDatabase = [],
  npcs = [],
  holding,
  placeholder = "Besetzt durch wählen...",
  selectClassName = "w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-amber-300 outline-none focus:border-amber-500 transition",
  inputClassName = "w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-amber-300 outline-none focus:border-amber-500 transition"
}) => {
  // Extract all character names from loreDatabase
  const codexCharacters = (loreDatabase || [])
    .filter(l => l.category === 'Charaktere' || l.category === 'Gegner' || l.category === 'Akteure' || l.category === 'Fraktionen' || l.type === 'character')
    .map(l => l.title.trim())
    .filter(Boolean);

  // Extract names from NPCs
  const npcNames = (npcs || []).map(n => n.name ? n.name.trim() : '').filter(Boolean);

  // Extract names from holding lore members if available
  const holdingMemberNames = (holding?.loreMembers || []).map(m => m.name ? m.name.trim() : '').filter(Boolean);

  // Combine unique character names
  const allKnownCharacters = Array.from(new Set([
    ...codexCharacters,
    ...npcNames,
    ...holdingMemberNames
  ]));

  const presetValues = ['', 'Spieler', ...allKnownCharacters];
  const isValueInPresets = presetValues.includes(value.trim());

  const [isCustomMode, setIsCustomMode] = useState<boolean>(!isValueInPresets && value.trim().length > 0);

  useEffect(() => {
    if (!presetValues.includes(value.trim()) && value.trim().length > 0) {
      setIsCustomMode(true);
    }
  }, [value, allKnownCharacters.join(',')]);

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
        <option value="">-- Unbesetzt / Vakant --</option>
        <option value="Spieler">Spieler / Nutzer</option>

        {allKnownCharacters.length > 0 && (
          <optgroup label="Bekannte Charaktere & Personen">
            {allKnownCharacters.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </optgroup>
        )}

        <option value="__custom__">Eigener Name / Freitext eingeben...</option>
      </select>

      {isCustomMode && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Name oder Bezeichnung eingeben..."
          className={inputClassName}
        />
      )}
    </div>
  );
};

export default CharacterAssigneeSelect;
