import React, { useState, useMemo } from 'react';
import { PersonalityTraits } from '../types';
import { 
  PERSONALITY_ARCHETYPES, 
  PERSONALITY_ARCHETYPE_OPTIONS, 
  getArchetypeDefinition,
  applyArchetypeToTraits,
  PersonalityArchetypeDefinition 
} from './personalityArchetypesData';

export { 
  PERSONALITY_ARCHETYPES, 
  PERSONALITY_ARCHETYPE_OPTIONS, 
  getArchetypeDefinition,
  applyArchetypeToTraits
};
export type { PersonalityArchetypeDefinition };

export interface TraitDefinition {
  key: keyof PersonalityTraits;
  label: string;
  lowLabel: string;
  highLabel: string;
  category: 'Sozial & Zwischenmenschlich' | 'Wille & Mut' | 'Geist & Haltung' | 'Emotion & Temperament' | 'Lebensstil & Werte';
  neutralDescription: string;
}

export const PERSONALITY_TRAIT_DEFINITIONS: TraitDefinition[] = [
  // 1. Freundlichkeit
  {
    key: 'freundlichkeit',
    label: 'Freundlichkeit',
    lowLabel: 'unfreundlich',
    highLabel: 'herzlich',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Verhalten und Herzlichkeit im Umgang mit anderen Personen'
  },
  // 2. Geselligkeit
  {
    key: 'geselligkeit',
    label: 'Geselligkeit',
    lowLabel: 'einzelgängerisch',
    highLabel: 'gesellig',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Bedürfnis nach Gemeinschaft oder Rückzug'
  },
  // 3. Schüchternheit
  {
    key: 'schuechternheit',
    label: 'Schüchternheit',
    lowLabel: 'selbstsicher',
    highLabel: 'schüchtern',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Zurückhaltung oder Offenheit in sozialen Situationen'
  },
  // 4. Selbstvertrauen
  {
    key: 'selbstvertrauen',
    label: 'Selbstvertrauen',
    lowLabel: 'unsicher',
    highLabel: 'selbstsicher',
    category: 'Wille & Mut',
    neutralDescription: 'Glaube an die eigenen Fähigkeiten und Stärken'
  },
  // 5. Geduld
  {
    key: 'geduld',
    label: 'Geduld',
    lowLabel: 'ungeduldig',
    highLabel: 'geduldig',
    category: 'Emotion & Temperament',
    neutralDescription: 'Ausdauer und Ruhe bei Verzögerungen oder Herausforderungen'
  },
  // 6. Temperament
  {
    key: 'temperament',
    label: 'Temperament',
    lowLabel: 'ruhig',
    highLabel: 'hitzköpfig',
    category: 'Emotion & Temperament',
    neutralDescription: 'Reaktionsweise auf Provokation oder Konflikte'
  },
  // 7. Mut
  {
    key: 'mut',
    label: 'Mut',
    lowLabel: 'ängstlich',
    highLabel: 'mutig',
    category: 'Wille & Mut',
    neutralDescription: 'Bereitschaft, sich Gefahren und Ängsten zu stellen'
  },
  // 8. Risikobereitschaft
  {
    key: 'risikobereitschaft',
    label: 'Risikobereitschaft',
    lowLabel: 'vorsichtig',
    highLabel: 'risikofreudig',
    category: 'Wille & Mut',
    neutralDescription: 'Neigung zu kalkuliertem oder waghalsigem Handeln'
  },
  // 9. Empathie
  {
    key: 'empathie',
    label: 'Empathie',
    lowLabel: 'gefühllos',
    highLabel: 'einfühlsam',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Einfühlungsvermögen in die Gefühle und Nöte anderer'
  },
  // 10. Ehrlichkeit
  {
    key: 'ehrlichkeit',
    label: 'Ehrlichkeit',
    lowLabel: 'unehrlich',
    highLabel: 'ehrlich',
    category: 'Lebensstil & Werte',
    neutralDescription: 'Aufrichtigkeit und Wahrheitsliebe in Wort und Tat'
  },
  // 11. Loyalität
  {
    key: 'loyalitaet',
    label: 'Loyalität',
    lowLabel: 'wechselhaft',
    highLabel: 'loyal',
    category: 'Lebensstil & Werte',
    neutralDescription: 'Treue zu Verbündeten, Gruppen oder Schwüren'
  },
  // 12. Misstrauen
  {
    key: 'misstrauen',
    label: 'Misstrauen',
    lowLabel: 'vertrauensvoll',
    highLabel: 'misstrauisch',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Skepsis gegenüber den Absichten fremder Personen'
  },
  // 13. Dominanz
  {
    key: 'dominanz',
    label: 'Dominanz',
    lowLabel: 'unterwürfig',
    highLabel: 'dominant',
    category: 'Wille & Mut',
    neutralDescription: 'Bestreben, Führung zu übernehmen oder sich unterzuordnen'
  },
  // 14. Durchsetzungsvermögen
  {
    key: 'durchsetzungsvermoegen',
    label: 'Durchsetzungsvermögen',
    lowLabel: 'nachgiebig',
    highLabel: 'durchsetzungsstark',
    category: 'Wille & Mut',
    neutralDescription: 'Fähigkeit, eigene Interessen und Ziele durchzusetzen'
  },
  // 15. Disziplin
  {
    key: 'disziplin',
    label: 'Disziplin',
    lowLabel: 'undiszipliniert',
    highLabel: 'diszipliniert',
    category: 'Geist & Haltung',
    neutralDescription: 'Selbstbeherrschung, Pflichterfüllung und Durchhaltevermögen'
  },
  // 16. Neugier
  {
    key: 'neugier',
    label: 'Neugier',
    lowLabel: 'desinteressiert',
    highLabel: 'neugierig',
    category: 'Geist & Haltung',
    neutralDescription: 'Interesse an neuem Wissen, Geheimnissen und Erkundung'
  },
  // 17. Kreativität
  {
    key: 'kreativitaet',
    label: 'Kreativität',
    lowLabel: 'pragmatisch',
    highLabel: 'kreativ',
    category: 'Geist & Haltung',
    neutralDescription: 'Vorliebe für unkonventionelle Ideen oder bewährte Methoden'
  },
  // 18. Intelligenzorientierung
  {
    key: 'intelligenzorientierung',
    label: 'Intelligenzorientierung',
    lowLabel: 'intuitiv',
    highLabel: 'analytisch',
    category: 'Geist & Haltung',
    neutralDescription: 'Entscheidungsfindung über Bauchgefühl oder logische Analyse'
  },
  // 19. Emotionalität
  {
    key: 'emotionalitaet',
    label: 'Emotionalität',
    lowLabel: 'rational',
    highLabel: 'emotional',
    category: 'Emotion & Temperament',
    neutralDescription: 'Einfluss von Gefühlen versus kühler Vernunft'
  },
  // 20. Impulsivität
  {
    key: 'impulsivitaet',
    label: 'Impulsivität',
    lowLabel: 'bedacht',
    highLabel: 'impulsiv',
    category: 'Emotion & Temperament',
    neutralDescription: 'Neigung zu spontanem Handeln ohne langes Zögern'
  },
  // 21. Humor
  {
    key: 'humor',
    label: 'Humor',
    lowLabel: 'ernst',
    highLabel: 'verspielt',
    category: 'Sozial & Zwischenmenschlich',
    neutralDescription: 'Sinn für Heiterkeit, Späße und Leichtigkeit'
  },
  // 22. Eitelkeit
  {
    key: 'eitelkeit',
    label: 'Eitelkeit',
    lowLabel: 'bescheiden',
    highLabel: 'eitel',
    category: 'Lebensstil & Werte',
    neutralDescription: 'Wertlegung auf Aussehen, Status und Bewunderung'
  },
  // 23. Materialismus
  {
    key: 'materialismus',
    label: 'Materialismus',
    lowLabel: 'genügsam',
    highLabel: 'materialistisch',
    category: 'Lebensstil & Werte',
    neutralDescription: 'Fokus auf Wohlstand, Besitz und weltliche Schätze'
  },
  // 24. Ordnungsliebe
  {
    key: 'ordnungsliebe',
    label: 'Ordnungsliebe',
    lowLabel: 'chaotisch',
    highLabel: 'ordentlich',
    category: 'Lebensstil & Werte',
    neutralDescription: 'Struktur, Sauberkeit und Organisation im Alltag'
  }
];

export const CATEGORIES = [
  'Alle',
  'Sozial & Zwischenmenschlich',
  'Wille & Mut',
  'Emotion & Temperament',
  'Geist & Haltung',
  'Lebensstil & Werte'
] as const;

export function getTraitValueLabel(trait: TraitDefinition, val: number): string {
  if (val === 50) return 'ausgeglichen';
  if (val < 15) return `ausgeprägt ${trait.lowLabel}`;
  if (val < 35) return `eher ${trait.lowLabel}`;
  if (val < 45) return `leicht ${trait.lowLabel}`;
  if (val > 85) return `ausgeprägt ${trait.highLabel}`;
  if (val > 65) return `eher ${trait.highLabel}`;
  return `leicht ${trait.highLabel}`;
}

export function formatPersonalityTraitsAsPrompt(traits?: PersonalityTraits): string {
  if (!traits || Object.keys(traits).length === 0) return '';
  const entries: string[] = [];
  
  PERSONALITY_TRAIT_DEFINITIONS.forEach(def => {
    const val = traits[def.key];
    if (typeof val === 'number') {
      const label = getTraitValueLabel(def, val);
      entries.push(`${def.label}: ${val}/100 (${label})`);
    }
  });

  return entries.join(', ');
}

interface PersonalityTraitsEditorProps {
  traits?: PersonalityTraits;
  onChange?: (updatedTraits: PersonalityTraits) => void;
  archetype?: string;
  onArchetypeChange?: (archetype: string) => void;
  showArchetypeSelector?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  defaultExpanded?: boolean;
}

export const PersonalityTraitsEditor: React.FC<PersonalityTraitsEditorProps> = ({
  traits = {},
  onChange,
  archetype = '-',
  onArchetypeChange,
  showArchetypeSelector = true,
  readOnly = false,
  compact = false,
  title = 'Persönlichkeitsmerkmale',
  subtitle = 'Quantitative Einstufung der Charaktereigenschaften auf einer Skala von 0 bis 100',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchFilter, setSearchFilter] = useState('');

  const currentArchetypeDef = useMemo(() => {
    return getArchetypeDefinition(archetype);
  }, [archetype]);

  const currentTraits = useMemo(() => {
    return traits || {};
  }, [traits]);

  const handleSliderChange = (key: keyof PersonalityTraits, val: number) => {
    if (readOnly || !onChange) return;
    onChange({
      ...currentTraits,
      [key]: val
    });
  };

  const handleArchetypeSelect = (newArchetype: string) => {
    if (onArchetypeChange) {
      onArchetypeChange(newArchetype);
    }
    if (!readOnly && onChange) {
      const updatedTraits = applyArchetypeToTraits(currentTraits, newArchetype);
      onChange(updatedTraits);
    }
  };

  const handleApplyArchetypePresets = () => {
    if (readOnly || !onChange) return;
    const updatedTraits = applyArchetypeToTraits(currentTraits, archetype);
    onChange(updatedTraits);
  };

  const handleResetAll = () => {
    if (readOnly || !onChange) return;
    const resetObj: PersonalityTraits = {};
    PERSONALITY_TRAIT_DEFINITIONS.forEach(t => {
      resetObj[t.key] = 50;
    });
    onChange(resetObj);
  };

  const handleRandomize = () => {
    if (readOnly || !onChange) return;
    const randomObj: PersonalityTraits = {};
    PERSONALITY_TRAIT_DEFINITIONS.forEach(t => {
      // Create natural variation around middle or distinct traits (10-90)
      const r = Math.floor(Math.random() * 81) + 10;
      randomObj[t.key] = r;
    });
    onChange(randomObj);
  };

  const filteredTraits = useMemo(() => {
    return PERSONALITY_TRAIT_DEFINITIONS.filter(t => {
      const matchesCategory = selectedCategory === 'Alle' || t.category === selectedCategory;
      const matchesSearch = !searchFilter.trim() || 
        t.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.lowLabel.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.highLabel.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchFilter]);

  // Count active non-default (non-50) traits
  const customizedCount = useMemo(() => {
    return Object.values(currentTraits).filter(v => typeof v === 'number' && v !== 50).length;
  }, [currentTraits]);

  return (
    <div className="flex flex-col gap-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-slate-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs shrink-0 group-hover:bg-amber-500/20 transition-all">
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px]`}></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                <span className="text-amber-500">◆</span> {title}
              </span>
              {customizedCount > 0 && (
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded text-[10px] font-mono">
                  {customizedCount}/24 aktiv
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!readOnly && onChange && isExpanded && (
            <>
              <button
                type="button"
                onClick={handleRandomize}
                title="Merkmale zufällig befüllen"
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-dice text-[11px] text-amber-400"></i>
                <span className="hidden sm:inline text-[11px]">Zufall</span>
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                title="Alle Merkmale auf 50 (neutral) zurücksetzen"
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-rotate-left text-[10px]"></i>
                <span className="hidden sm:inline text-[11px]">50/50</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isExpanded ? 'Einklappen' : 'Ausklappen'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 pt-1 animate-in fade-in duration-150">
          {/* Archetyp Auswahlmenü */}
          {showArchetypeSelector && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1 sm:w-1/2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-500">◆</span> Archetyp / Typus
                </label>
                <select
                  disabled={readOnly || !onArchetypeChange}
                  value={archetype || '-'}
                  onChange={e => handleArchetypeSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-amber-500/70"
                >
                  <option value="-">- Kein Archetyp (Neutral) -</option>
                  <optgroup label="Klassische Dere-Typen">
                    {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Klassische Dere-Typen').map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Subtypen & Varianten">
                    {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Subtypen & Varianten').map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Western-Typen">
                    {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Western-Typen').map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Spezielle & Exzentrische Typen">
                    {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Spezielle & Exzentrische Typen').map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {currentArchetypeDef ? (
                <div className="flex-1 flex flex-col justify-between gap-1.5 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-amber-300">
                      {currentArchetypeDef.name}
                    </span>
                    {!readOnly && onChange && currentArchetypeDef.defaultTraits && (
                      <button
                        type="button"
                        onClick={handleApplyArchetypePresets}
                        title="Archetyp-Tendenzen auf die 24 Schieberegler anwenden"
                        className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                      >
                        Werte übernehmen
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                    {currentArchetypeDef.description}
                  </p>
                </div>
              ) : (
                <div className="hidden sm:flex flex-1 items-center text-[11px] text-slate-500 italic px-2">
                  Wählen Sie einen Archetyp aus, um typische Verhaltensmuster und Tendenzen festzulegen.
                </div>
              )}
            </div>
          )}

          {/* Category & Search Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin text-[11px]">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[140px] sm:w-48">
              <input
                type="text"
                placeholder="Merkmal suchen..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60"
              />
              <i className="fa-solid fa-magnifying-glass text-[10px] text-slate-500 absolute left-2.5 top-2"></i>
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Grid of Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredTraits.map(def => {
              const value = typeof currentTraits[def.key] === 'number' ? currentTraits[def.key]! : 50;
              const valueLabel = getTraitValueLabel(def, value);
              const isModified = value !== 50;

              return (
                <div
                  key={def.key}
                  className={`flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all ${
                    isModified
                      ? 'bg-slate-900/90 border-slate-700/80 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/50'
                  }`}
                >
                  {/* Trait Header & Value Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isModified ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                      {def.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                        value < 35 
                          ? 'bg-sky-950 text-sky-300 border border-sky-800/50' 
                          : value > 65 
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50' 
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {value} / 100
                      </span>

                      {!readOnly && isModified && (
                        <button
                          type="button"
                          onClick={() => handleSliderChange(def.key, 50)}
                          title="Auf neutral (50) setzen"
                          className="text-[10px] text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
                        >
                          <i className="fa-solid fa-rotate-left"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="flex flex-col gap-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      disabled={readOnly}
                      value={value}
                      onChange={e => handleSliderChange(def.key, parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-60 disabled:cursor-default"
                    />

                    {/* Bipolar Extremes Labels */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                      <span className={`transition-colors ${value < 40 ? 'text-sky-300 font-medium' : 'text-slate-500'}`}>
                        {def.lowLabel} (0)
                      </span>
                      <span className="text-[10px] text-slate-500 italic truncate max-w-[120px] text-center px-1">
                        {valueLabel}
                      </span>
                      <span className={`transition-colors ${value > 60 ? 'text-amber-300 font-medium' : 'text-slate-500'}`}>
                        {def.highLabel} (100)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTraits.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500 italic">
              Keine Merkmale gefunden, die dem Filter &bdquo;{searchFilter}&ldquo; entsprechen.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
