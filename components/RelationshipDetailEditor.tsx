import React, { useState } from 'react';
import { CharacterRelationship, DirectionalRelationshipValues, RelationshipEvent } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { GeminiService } from '../services/geminiService';

interface Props {
  rel: CharacterRelationship;
  onChange: (updated: CharacterRelationship) => void;
  onDelete: () => void;
  sourceCharacterName: string;
  codexCharacters: { id: string; title: string }[];
  idx: number;
  playerName?: string;
  world?: any;
  allLoreEntries?: any[];
}

const DEFAULT_REL_TYPES = [
  'Freund / Freundin',
  'Rivale / Rivalin',
  'Geschwister',
  'Mentor / Schüler',
  'Feind / Gegenspieler',
  'Erzfeind',
  'Partner / Geliebte(r)',
  'Ehepartner',
  'Vorgesetzter / Untergebener',
  'Gefährte / Kamerad',
  'Geschäftspartner',
  'Beschützer / Schützling',
  'Familie / Verwandter',
  'Zweckbündnis',
  'Bekannte(r)'
];

const DEFAULT_STATUS_PHASES = [
  'Erstes Kennenlernen',
  'Wachsendes Vertrauen',
  'Enge Verbündete',
  'Angespannter Frieden',
  'Verdeckter Konflikt',
  'Erbitterte Fehde',
  'Stillschweigendes Einvernehmen',
  'Entfremdung nach Vertrauensbruch',
  'Familiäre Verbundenheit',
  'Tiefe Liebe & Seelenverwandtschaft',
  'Feindselige Distanz'
];

export const RelationshipDetailEditor: React.FC<Props> = ({
  rel,
  onChange,
  onDelete,
  sourceCharacterName,
  codexCharacters,
  idx,
  playerName,
  world,
  allLoreEntries
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'anreden' | 'wahrnehmung' | 'vergangenheit' | 'werte' | 'ereignisse'>('anreden');
  const [valueDirection, setValueDirection] = useState<'selfToTarget' | 'targetToSelf'>('selfToTarget');
  
  // Smart-Fill states for this single relationship
  const [showSmartFill, setShowSmartFill] = useState<boolean>(false);
  const [smartFillPrompt, setSmartFillPrompt] = useState<string>('');
  const [isSmartFilling, setIsSmartFilling] = useState<boolean>(false);
  const [keepExistingDetails, setKeepExistingDetails] = useState<boolean>(true);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);

  const targetName = rel.targetCharacter || 'Zielcharakter';
  const selfName = sourceCharacterName || 'Dieser Charakter';

  const handleRelationshipSmartFill = async () => {
    let chosenTarget = rel.targetCharacter;
    if (!chosenTarget) {
      const potentialTarget = codexCharacters.find(c => c.title && c.title !== selfName)?.title 
        || (playerName && playerName !== selfName ? playerName : '')
        || 'Zielcharakter';
      chosenTarget = potentialTarget;
    }

    setIsSmartFilling(true);
    setSmartFillError(null);
    try {
      const promptToUse = smartFillPrompt.trim() || 'Vollständige Beziehungsdetails, Anreden, Regieanweisungen, Geheimnisse, Werte und Ereignisse automatisch ausfüllen.';
      const generated = await GeminiService.autofillSingleRelationship(
        selfName,
        chosenTarget,
        promptToUse,
        rel,
        world,
        allLoreEntries,
        keepExistingDetails
      );

      // Intelligent verketten/befüllen
      let updatedRel: any;

      const isBlank = (val: any) => {
        if (val === undefined || val === null) return true;
        if (typeof val === 'string' && val.trim() === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        return false;
      };

      if (!keepExistingDetails) {
        updatedRel = {
          id: rel.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          _isCustom: rel._isCustom || false,
          targetCharacter: chosenTarget,
          ...generated
        };
      } else {
        updatedRel = { ...rel };
        const allKeys = [
          'type',
          'relationshipStatus',
          'isPotential',
          'duration',
          'currentStance',
          'dependency',
          'fearIntimidation',
          'addressFromSelfToTarget',
          'addressFromTargetToSelf',
          'behavior',
          'aiDirectives',
          'perceptionSelfToTarget',
          'perceptionTargetToSelf',
          'secretsAndMotives',
          'boundariesAndTaboos',
          'sharedPast',
          'keyMemories',
          'valuesSelfToTarget',
          'valuesTargetToSelf',
          'keyEvents'
        ];

        for (const key of allKeys) {
          const genVal = (generated as any)[key];
          const curVal = (rel as any)[key];

          if (isBlank(curVal)) {
            if (!isBlank(genVal)) {
              updatedRel[key] = genVal;
            }
          } else if (key === 'valuesSelfToTarget' || key === 'valuesTargetToSelf') {
            if (genVal && typeof genVal === 'object') {
              updatedRel[key] = genVal;
            }
          }
        }
      }

      updatedRel.targetCharacter = chosenTarget;
      updatedRel._isCustom = rel._isCustom;

      onChange(updatedRel);
      setIsExpanded(true);
      setShowSmartFill(false);
      setSmartFillPrompt('');
    } catch (err: any) {
      console.error('Fehler bei Beziehungs-Smart-Fill:', err);
      setSmartFillError(err.message || 'Fehler beim Generieren der Beziehungsdaten.');
    } finally {
      setIsSmartFilling(false);
    }
  };

  // Helper for updating directional values
  const updateDirectionalValue = (
    direction: 'selfToTarget' | 'targetToSelf',
    key: keyof DirectionalRelationshipValues,
    value: number
  ) => {
    const fieldKey = direction === 'selfToTarget' ? 'valuesSelfToTarget' : 'valuesTargetToSelf';
    const currentObj = rel[fieldKey] || {};
    onChange({
      ...rel,
      [fieldKey]: {
        ...currentObj,
        [key]: value
      }
    });
  };

  // Helper for adding relationship event
  const addKeyEvent = () => {
    const newEvent: RelationshipEvent = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      title: 'Neues Schlüsselereignis',
      description: '',
      dateOrChapter: '',
      impact: ''
    };
    onChange({
      ...rel,
      keyEvents: [...(rel.keyEvents || []), newEvent]
    });
  };

  const updateKeyEvent = (eventId: string, updatedEvent: Partial<RelationshipEvent>) => {
    const updatedList = (rel.keyEvents || []).map(ev => ev.id === eventId ? { ...ev, ...updatedEvent } : ev);
    onChange({
      ...rel,
      keyEvents: updatedList
    });
  };

  const removeKeyEvent = (eventId: string) => {
    onChange({
      ...rel,
      keyEvents: (rel.keyEvents || []).filter(ev => ev.id !== eventId)
    });
  };

  // Extract current values with safe defaults
  const selfToTargetVals: DirectionalRelationshipValues = rel.valuesSelfToTarget || {
    affection: 0,
    trust: 50,
    respect: 50,
    loyalty: 50,
    familiarity: 30,
    fear: 0,
    bond: 30,
    hostility: 0
  };

  const targetToSelfVals: DirectionalRelationshipValues = rel.valuesTargetToSelf || {
    affection: 0,
    trust: 50,
    respect: 50,
    loyalty: 50,
    familiarity: 30,
    fear: 0,
    bond: 30,
    hostility: 0
  };

  const activePlayerName = playerName?.trim() || world?.player?.name?.trim() || 'Spieler';
  const isSelfPlayer = sourceCharacterName.toLowerCase().trim() === activePlayerName.toLowerCase().trim();

  const isCustomTarget = rel._isCustom || (
    rel.targetCharacter && 
    !codexCharacters.some(c => c.title === rel.targetCharacter) && 
    rel.targetCharacter !== sourceCharacterName &&
    rel.targetCharacter !== activePlayerName &&
    (!playerName || rel.targetCharacter !== playerName)
  );

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 relative transition-all shadow-md">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs transition-colors shrink-0 cursor-pointer"
          >
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </button>
          
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-amber-400">Beziehung #{idx + 1}:</span>
            <span className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-[220px]">
              {selfName} ↔ {targetName}
            </span>
            {rel.type && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                {rel.type}
              </span>
            )}
            {rel.relationshipStatus && (
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                {rel.relationshipStatus}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSmartFill(!showSmartFill)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showSmartFill
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
            title="KI Smart-Fill für diese Beziehung öffnen"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[11px]"></i>
            <span className="hidden sm:inline">Smart-Fill</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Beziehung löschen"
            className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-xs shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Smart Fill Panel */}
      {showSmartFill && (
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <i className="fa-solid fa-bolt text-amber-400"></i>
              KI Smart-Fill für Beziehung ({selfName} ↔ {targetName})
            </span>
            <button
              type="button"
              onClick={() => setShowSmartFill(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Generiert oder vervollständigt automatisch alle Anreden, Regieanweisungen, Verhaltensmuster, Geheimnisse, Tabus, Vorgeschichte, Erinnerungen sowie direktionale Werte und Ereignisse zwischen den beiden Charakteren.
          </p>

          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={smartFillPrompt}
              onChange={e => setSmartFillPrompt(e.target.value)}
              placeholder="Optionale Notiz / Anweisung (z. B. 'Erzfeinde seit Kindheitstagen, tiefes Misstrauen aber heimlicher Respekt...')"
              className="w-full bg-slate-950 border border-amber-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
              onKeyDown={e => {
                if (e.key === 'Enter' && !isSmartFilling) {
                  e.preventDefault();
                  handleRelationshipSmartFill();
                }
              }}
            />

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <label className="flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepExistingDetails}
                  onChange={e => setKeepExistingDetails(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                Bestehendes beibehalten (Ergänzungs-Modus)
              </label>

              <button
                type="button"
                disabled={isSmartFilling}
                onClick={handleRelationshipSmartFill}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isSmartFilling ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Generiere Daten...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                    <span>⚡ Smart-Fill ausführen</span>
                  </>
                )}
              </button>
            </div>

            {smartFillError && (
              <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2 mt-1">
                <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
                {smartFillError}
              </div>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="flex flex-col gap-4 pt-1 animate-in fade-in duration-150">
          {/* Target Character & Basic Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target Character Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Zielcharakter / Gegenüber
              </label>
              {!isCustomTarget ? (
                <div className="flex gap-1.5 w-full">
                  <select
                    value={rel.targetCharacter || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        onChange({ ...rel, targetCharacter: '', _isCustom: true });
                      } else {
                        onChange({ ...rel, targetCharacter: val, _isCustom: false });
                      }
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px] w-full"
                  >
                    <option value="">-- Wählen --</option>
                    {!isSelfPlayer && (
                      <optgroup label="Nutzer / Hauptcharakter">
                        <option value={activePlayerName}>{activePlayerName} (Nutzer / Hauptcharakter)</option>
                      </optgroup>
                    )}
                    {codexCharacters.length > 0 && (
                      <optgroup label="Codex Charaktere">
                        {codexCharacters.map(c => (
                          <option key={c.id} value={c.title}>{c.title}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__custom__">Freitext eingeben...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onChange({ ...rel, targetCharacter: '', _isCustom: true })}
                    title="Freitext eingeben"
                    className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[36px] text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 w-full">
                  <input
                    type="text"
                    placeholder="Name des Ziels..."
                    value={rel.targetCharacter || ''}
                    onChange={e => onChange({ ...rel, targetCharacter: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px] w-full"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...rel, targetCharacter: '', _isCustom: false })}
                    title="Zurück zur Liste"
                    className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[36px] text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-list"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Grundbeziehung (Type) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Grundbeziehung (z. B. Freund, Rivale)
              </label>
              <div className="relative">
                <input
                  type="text"
                  list={`rel-types-list-${idx}`}
                  value={rel.type || ''}
                  onChange={e => onChange({ ...rel, type: e.target.value })}
                  placeholder="z. B. Freund, Rivale, Geschwister..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px]"
                />
                <datalist id={`rel-types-list-${idx}`}>
                  {DEFAULT_REL_TYPES.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Aktueller Beziehungsstatus / Phase */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Aktueller Status / Beziehungsphase
              </label>
              <div className="relative">
                <input
                  type="text"
                  list={`rel-status-list-${idx}`}
                  value={rel.relationshipStatus || ''}
                  onChange={e => onChange({ ...rel, relationshipStatus: e.target.value })}
                  placeholder="z. B. Enge Verbündete, Angespannter Frieden..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px]"
                />
                <datalist id={`rel-status-list-${idx}`}>
                  {DEFAULT_STATUS_PHASES.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Extended Context Row: Modus / Dauer / Aktuelle Haltung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
            {/* Beziehungsmodus (Aktiv vs. Potenziell) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Beziehungs-Modus
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-0.5 h-[36px]">
                <button
                  type="button"
                  onClick={() => onChange({ ...rel, isPotential: false })}
                  className={`flex-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    !rel.isPotential
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bestehend (Aktiv)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...rel, isPotential: true })}
                  className={`flex-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    rel.isPotential
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Potenziell / Zukünftig
                </button>
              </div>
            </div>

            {/* Dauer / Besteht seit */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Dauer / Besteht seit
              </label>
              <input
                type="text"
                value={rel.duration || ''}
                onChange={e => onChange({ ...rel, duration: e.target.value })}
                placeholder="z. B. 'Seit der Kindheit', '10 Jahre', 'Kürzlich'..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px]"
              />
            </div>

            {/* Aktuelle Haltung */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Aktuelle Haltung
              </label>
              <input
                type="text"
                value={rel.currentStance || ''}
                onChange={e => onChange({ ...rel, currentStance: e.target.value })}
                placeholder="z. B. 'Wohlwollend und loyal', 'Wachsame Skepsis'..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 h-[36px]"
              />
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60">
            <button
              type="button"
              onClick={() => setActiveTab('anreden')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'anreden'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-comments text-[11px]"></i>
              Anreden & Verhalten
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wahrnehmung')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wahrnehmung'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-eye text-[11px]"></i>
              Wahrnehmung & Tabus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vergangenheit')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'vergangenheit'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-book-bookmark text-[11px]"></i>
              Vergangenheit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('werte')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'werte'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <i className="fa-solid fa-sliders text-[11px]"></i>
              Direktionale Werte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ereignisse')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ereignisse'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-timeline text-[11px]"></i>
              Ereignis-Chronik {rel.keyEvents && rel.keyEvents.length > 0 ? `(${rel.keyEvents.length})` : ''}
            </button>
          </div>

          {/* TAB 1: ANREDEN & VERHALTEN */}
          {activeTab === 'anreden' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* How Self addresses Target */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-arrow-right text-[9px]"></i>
                    Wie {selfName} den/die {targetName} anspricht / nennt:
                  </label>
                  <input
                    type="text"
                    value={rel.addressFromSelfToTarget || ''}
                    onChange={e => onChange({ ...rel, addressFromSelfToTarget: e.target.value })}
                    placeholder="z. B. 'Kleiner', 'Meister Karr', 'Alter Dickkopf', 'Eure Durchlaucht'..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-white text-xs outline-none"
                  />
                  <span className="text-[9px] text-slate-500">Formale Anrede, Spitzname oder Kosename im Gespräch.</span>
                </div>

                {/* How Target addresses Self */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left text-[9px]"></i>
                    Wie {targetName} den/die {selfName} anspricht / nennt:
                  </label>
                  <input
                    type="text"
                    value={rel.addressFromTargetToSelf || ''}
                    onChange={e => onChange({ ...rel, addressFromTargetToSelf: e.target.value })}
                    placeholder="z. B. 'Küken', 'Herr Vizeadmiral', 'Schwesterchen', 'Du Scharlatan'..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-white text-xs outline-none"
                  />
                  <span className="text-[9px] text-slate-500">Gegenseitige Anrede aus der Perspektive von {targetName}.</span>
                </div>
              </div>

              {/* Behavior / Conduct */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Verhalten & Verhaltensdynamik (Behavior & Conduct)
                </label>
                <AutoExpandingTextarea
                  rows={2}
                  value={rel.behavior || ''}
                  onChange={e => onChange({ ...rel, behavior: e.target.value })}
                  placeholder="z. B. Beschützend, stichelnd im Gespräch, stellt sich im Kampf sofort vor ihn. Reagiert hochempfindlich bei Kritik."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>

              {/* Story-AI Directives */}
              <div className="flex flex-col gap-1 bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg">
                <label className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-robot text-amber-400"></i>
                  Verbindliche Story-KI Regieanweisungen
                </label>
                <AutoExpandingTextarea
                  rows={2}
                  value={rel.aiDirectives || ''}
                  onChange={e => onChange({ ...rel, aiDirectives: e.target.value })}
                  placeholder="z. B. STRENG EINHALTEN: Charakter darf ihn NIEMALS siezen. Verwendet immer den Spitznamen 'Kleiner'. Im Kampf agieren sie ohne Worte wie ein eingespieltes Team."
                  className="w-full bg-slate-950 border border-amber-900/50 focus:border-amber-400 rounded-lg p-2.5 text-amber-100 text-xs outline-none"
                />
                <span className="text-[9px] text-amber-400/70">
                  Diese Regieanweisungen werden der Story-KI direkt injiziert, damit Charaktere nicht plötzlich unpassende Anreden oder Verhalten verwenden!
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: WAHRNEHMUNG & TABUS */}
          {activeTab === 'wahrnehmung' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Perception Self -> Target */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Persönliche Wahrnehmung: {selfName} ➔ {targetName}
                  </label>
                  <AutoExpandingTextarea
                    rows={2}
                    value={rel.perceptionSelfToTarget || ''}
                    onChange={e => onChange({ ...rel, perceptionSelfToTarget: e.target.value })}
                    placeholder="z. B. Sieht in ihm ein ungeschliffenes Talent, aber fürchtet seine Hitzköpfigkeit..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white text-xs outline-none"
                  />
                </div>

                {/* Perception Target -> Self */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                    Persönliche Wahrnehmung: {targetName} ➔ {selfName}
                  </label>
                  <AutoExpandingTextarea
                    rows={2}
                    value={rel.perceptionTargetToSelf || ''}
                    onChange={e => onChange({ ...rel, perceptionTargetToSelf: e.target.value })}
                    placeholder="z. B. Sieht in {selfName} eine unnachgiebige Führungsperson, bewundert aber ihren Mut..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Dependencies & Social Dynamics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Dependency */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-link text-[9px]"></i>
                    Abhängigkeit & Autonomie
                  </label>
                  <AutoExpandingTextarea
                    rows={2}
                    value={rel.dependency || ''}
                    onChange={e => onChange({ ...rel, dependency: e.target.value })}
                    placeholder="z. B. Finanziell oder operativ auf den anderen angewiesen; emotionale Stütze; vollkommen eigenständig..."
                    className="w-full bg-slate-950 border border-teal-900/50 focus:border-teal-400 rounded-lg p-2.5 text-white text-xs outline-none"
                  />
                </div>

                {/* Fear / Intimidation */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                    Furcht, Einschüchterung & Respekt
                  </label>
                  <AutoExpandingTextarea
                    rows={2}
                    value={rel.fearIntimidation || ''}
                    onChange={e => onChange({ ...rel, fearIntimidation: e.target.value })}
                    placeholder="z. B. Fürchtet unberechenbare Zornesausbrüche; zeigt keinerlei Furcht und lässt sich nicht einschüchtern..."
                    className="w-full bg-slate-950 border border-orange-900/50 focus:border-orange-400 rounded-lg p-2.5 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Secrets & Motives */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <i className="fa-solid fa-user-secret text-[9px]"></i>
                  Geheimnisse & Verborgene Absichten bezüglich dieser Beziehung
                </label>
                <AutoExpandingTextarea
                  rows={2}
                  value={rel.secretsAndMotives || ''}
                  onChange={e => onChange({ ...rel, secretsAndMotives: e.target.value })}
                  placeholder="z. B. Versucht vor ihm zu verbergen, dass sie einst für seine Feinde gearbeitet hat. Er hofft heimlich auf ihre Wiederannäherung."
                  className="w-full bg-slate-950 border border-purple-900/50 focus:border-purple-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>

              {/* Boundaries & Taboos */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <i className="fa-solid fa-ban text-[9px]"></i>
                  Grenzen & Tabus (Unverrückbare rote Linien)
                </label>
                <AutoExpandingTextarea
                  rows={2}
                  value={rel.boundariesAndTaboos || ''}
                  onChange={e => onChange({ ...rel, boundariesAndTaboos: e.target.value })}
                  placeholder="z. B. Sprechen NIEMALS über den Tod der Mutter. Würde ihm niemals ins Gesicht lügen; er greift sie niemals körperlich an."
                  className="w-full bg-slate-950 border border-red-900/50 focus:border-red-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VERGANGENHEIT & ERINNERUNGEN */}
          {activeTab === 'vergangenheit' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Gemeinsame Vorgeschichte (Shared Past)
                </label>
                <AutoExpandingTextarea
                  rows={3}
                  value={rel.sharedPast || ''}
                  onChange={e => onChange({ ...rel, sharedPast: e.target.value })}
                  placeholder="z. B. Haben vor fünf Jahren gemeinsam die magische Akademie besucht und die Gildenprüfung absolviert..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Wichtige gemeinsame Erinnerungen (Key Shared Memories)
                </label>
                <AutoExpandingTextarea
                  rows={3}
                  value={rel.keyMemories || ''}
                  onChange={e => onChange({ ...rel, keyMemories: e.target.value })}
                  placeholder="z. B. Der Brand im Schattenwald, als sie Rücken an Rücken gegen die Wölfe kämpften; Das Versprechen am Flussufer."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: DIREKTIONALE BEZIEHUNGSWERTE */}
          {activeTab === 'werte' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Direction selector */}
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 ml-2">Perspektive der Beziehungswerte:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setValueDirection('selfToTarget')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      valueDirection === 'selfToTarget'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {selfName} ➔ {targetName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValueDirection('targetToSelf')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      valueDirection === 'targetToSelf'
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {targetName} ➔ {selfName}
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <i className="fa-solid fa-circle-info text-amber-400 mr-1.5"></i>
                Beziehungen sind asymmetrisch! {selfName} kann {targetName} vertrauen, während {targetName} Groll oder Furcht hegt. Beide Richtungen werden im Hintergrund automatisch im Codex synchronisiert.
              </div>

              {/* Sliders Grid */}
              {(() => {
                const vals = valueDirection === 'selfToTarget' ? selfToTargetVals : targetToSelfVals;
                const accentColor = valueDirection === 'selfToTarget' ? 'amber' : 'sky';

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                    {/* Zuneigung (-100 bis +100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-heart text-rose-500"></i> Zuneigung / Affektion
                        </span>
                        <span className={`text-xs font-mono font-bold ${
                          (vals.affection ?? 0) < 0 ? 'text-rose-400' : (vals.affection ?? 0) > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          {vals.affection ?? 0}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={vals.affection ?? 0}
                        onChange={e => updateDirectionalValue(valueDirection, 'affection', parseInt(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>-100 (Hass)</span>
                        <span>0 (Neutral)</span>
                        <span>+100 (Liebe)</span>
                      </div>
                    </div>

                    {/* Vertrauen (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-shield-halved text-emerald-400"></i> Vertrauen
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {vals.trust ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.trust ?? 50}
                        onChange={e => updateDirectionalValue(valueDirection, 'trust', parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Misstrauen)</span>
                        <span>100% (Blindes Vertrauen)</span>
                      </div>
                    </div>

                    {/* Respekt (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-award text-amber-400"></i> Respekt
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {vals.respect ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.respect ?? 50}
                        onChange={e => updateDirectionalValue(valueDirection, 'respect', parseInt(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Verachtung)</span>
                        <span>100% (Höchste Ehrfurcht)</span>
                      </div>
                    </div>

                    {/* Loyalität (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-handshake text-blue-400"></i> Loyalität
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {vals.loyalty ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.loyalty ?? 50}
                        onChange={e => updateDirectionalValue(valueDirection, 'loyalty', parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Unberechenbar)</span>
                        <span>100% (Bedingungslose Treue)</span>
                      </div>
                    </div>

                    {/* Vertrautheit (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-[#00d2ff] fa-people-roof text-cyan-400"></i> Vertrautheit
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {vals.familiarity ?? 30}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.familiarity ?? 30}
                        onChange={e => updateDirectionalValue(valueDirection, 'familiarity', parseInt(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Fremde)</span>
                        <span>100% (In- und auswendig)</span>
                      </div>
                    </div>

                    {/* Angst / Furcht (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-ghost text-purple-400"></i> Angst / Furcht
                        </span>
                        <span className="text-xs font-mono font-bold text-purple-400">
                          {vals.fear ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.fear ?? 0}
                        onChange={e => updateDirectionalValue(valueDirection, 'fear', parseInt(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Furchtlos)</span>
                        <span>100% (Panische Angst)</span>
                      </div>
                    </div>

                    {/* Bindung (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-link text-indigo-400"></i> Emotionale Bindung
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {vals.bond ?? 30}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.bond ?? 30}
                        onChange={e => updateDirectionalValue(valueDirection, 'bond', parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Gleichgültig)</span>
                        <span>100% (Unzertrennliches Band)</span>
                      </div>
                    </div>

                    {/* Feindseligkeit (0-100) */}
                    <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-skull text-red-500"></i> Feindseligkeit
                        </span>
                        <span className="text-xs font-mono font-bold text-red-500">
                          {vals.hostility ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vals.hostility ?? 0}
                        onChange={e => updateDirectionalValue(valueDirection, 'hostility', parseInt(e.target.value))}
                        className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>0% (Friedlich)</span>
                        <span>100% (Offene Fehde)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: EREIGNIS-CHRONIK */}
          {activeTab === 'ereignisse' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold">
                  Wichtige Meilensteine & Veränderungs-Ereignisse
                </span>
                <button
                  type="button"
                  onClick={addKeyEvent}
                  className="px-2.5 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded text-xs font-bold flex items-center gap-1 hover:bg-amber-600/30 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i> Ereignis hinzufügen
                </button>
              </div>

              {(!rel.keyEvents || rel.keyEvents.length === 0) ? (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/40 rounded-lg border border-slate-800">
                  Noch keine Schlüsselereignisse erfasst. Klicke auf "+ Ereignis hinzufügen", um wichtige Wendepunkte in dieser Beziehung einzutragen.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rel.keyEvents.map((ev, evIdx) => (
                    <div key={ev.id || evIdx} className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 relative">
                      <button
                        type="button"
                        onClick={() => removeKeyEvent(ev.id)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors text-xs p-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <input
                          type="text"
                          placeholder="Titel des Ereignisses (z.B. Verrat in der Festung)"
                          value={ev.title || ''}
                          onChange={e => updateKeyEvent(ev.id, { title: e.target.value })}
                          className="bg-slate-900 border border-slate-750 text-white rounded px-2.5 py-1 text-xs outline-none focus:border-amber-500 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Zeitpunkt / Kapitel (z.B. Kapitel 3 / Vor 2 Jahren)"
                          value={ev.dateOrChapter || ''}
                          onChange={e => updateKeyEvent(ev.id, { dateOrChapter: e.target.value })}
                          className="bg-slate-900 border border-slate-750 text-slate-300 rounded px-2.5 py-1 text-xs outline-none focus:border-amber-500"
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Detaillierte Beschreibung des Geschehens..."
                        value={ev.description || ''}
                        onChange={e => updateKeyEvent(ev.id, { description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded p-2 text-xs outline-none focus:border-amber-500 resize-none"
                      />

                      <input
                        type="text"
                        placeholder="Auswirkung auf Beziehung (z.B. -30 Vertrauen, +40 Feindseligkeit)"
                        value={ev.impact || ''}
                        onChange={e => updateKeyEvent(ev.id, { impact: e.target.value })}
                        className="bg-slate-900 border border-slate-750 text-amber-300 rounded px-2.5 py-1 text-xs outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelationshipDetailEditor;
