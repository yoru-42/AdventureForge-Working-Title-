import React, { useState, useEffect } from 'react';

interface TransformationIntensityCardProps {
  intensityVal: number;
  stageName: string;
  onUpdateIntensity: (newVal: number) => void;
  readOnly?: boolean;
  className?: string;
  compact?: boolean;
  timeRateIncrease?: number;
  timeRateDecay?: number;
  timeUnitLabel?: string;
  defaultPointOfNoReturn?: number;
  onUpdatePointOfNoReturn?: (pnr: number) => void;
}

// Helper to parse localized decimal string (accepts both ',' and '.')
export const parseDecimal = (valStr: string): number => {
  const normalized = valStr.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to format float into clean localized string
export const formatNum = (num: number): string => {
  if (isNaN(num)) return '0';
  const rounded = Math.round(num * 100) / 100;
  return String(rounded).replace('.', ',');
};

// Helper to format duration smartly into days, hours, and minutes if applicable
export const formatDuration = (valueInUnits: number, timeUnit: string): string => {
  if (!isFinite(valueInUnits) || valueInUnits < 0) return '∞';
  if (valueInUnits === 0) return `0 ${timeUnit}`;

  const unitLower = (timeUnit || 'min.').trim().toLowerCase();

  // Minutes detection (Min., Min, Minuten, min, m)
  const isMinutes = unitLower.startsWith('min') || unitLower === 'm';
  if (isMinutes) {
    const totalMins = valueInUnits;
    if (totalMins < 60) {
      return `${formatNum(totalMins)} ${timeUnit}`;
    }

    const days = Math.floor(totalMins / 1440);
    const remMinsAfterDays = totalMins % 1440;
    const hours = Math.floor(remMinsAfterDays / 60);
    const mins = Math.round((remMinsAfterDays % 60) * 10) / 10;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    }
    if (hours > 0) {
      parts.push(`${hours} Std.`);
    }
    if (mins > 0 || parts.length === 0) {
      parts.push(`${formatNum(mins)} Min.`);
    }

    return `${parts.join(' ')} (${formatNum(totalMins)} ${timeUnit})`;
  }

  // Hours detection (Std., Std, Stunden, h)
  const isHours = unitLower.startsWith('std') || unitLower === 'h' || unitLower.startsWith('stund');
  if (isHours) {
    const totalHours = valueInUnits;
    if (totalHours < 24) {
      return `${formatNum(totalHours)} ${timeUnit}`;
    }
    const days = Math.floor(totalHours / 24);
    const hours = Math.round((totalHours % 24) * 10) / 10;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    }
    if (hours > 0 || parts.length === 0) {
      parts.push(`${formatNum(hours)} Std.`);
    }
    return `${parts.join(' ')} (${formatNum(totalHours)} ${timeUnit})`;
  }

  // Seconds detection (Sek., Sek, Sekunden, s)
  const isSeconds = unitLower.startsWith('sek') || unitLower.startsWith('sec') || unitLower === 's';
  if (isSeconds) {
    const totalSecs = valueInUnits;
    if (totalSecs < 60) {
      return `${formatNum(totalSecs)} ${timeUnit}`;
    }
    const totalMins = totalSecs / 60;
    if (totalMins < 60) {
      const mins = Math.floor(totalMins);
      const secs = Math.round(totalSecs % 60);
      return `${mins} Min. ${secs} Sek. (${formatNum(totalSecs)} ${timeUnit})`;
    }
    const days = Math.floor(totalMins / 1440);
    const remMinsAfterDays = totalMins % 1440;
    const hours = Math.floor(remMinsAfterDays / 60);
    const mins = Math.round(remMinsAfterDays % 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    if (hours > 0) parts.push(`${hours} Std.`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} Min.`);
    return `${parts.join(' ')} (${formatNum(totalSecs)} ${timeUnit})`;
  }

  return `${formatNum(valueInUnits)} ${timeUnit}`;
};

export const CONFIG_STORAGE_KEY = 'transformation_intensity_card_settings_v1';

export interface SavedCardSettings {
  pnrThreshold?: number;
  kraftStep?: number;
  zeitStep?: number;
  abklingenStep?: number;
  timeUnit?: string;
}

export const DEFAULT_TRANSFORMATION_SETTINGS: SavedCardSettings = {
  pnrThreshold: 80,
  kraftStep: 15,
  zeitStep: 10,
  abklingenStep: 20,
  timeUnit: 'Min.',
};

export const getTransformationCardSettings = (): Required<SavedCardSettings> => {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed: SavedCardSettings = JSON.parse(saved);
      return {
        pnrThreshold: typeof parsed.pnrThreshold === 'number' ? parsed.pnrThreshold : DEFAULT_TRANSFORMATION_SETTINGS.pnrThreshold,
        kraftStep: typeof parsed.kraftStep === 'number' ? parsed.kraftStep : DEFAULT_TRANSFORMATION_SETTINGS.kraftStep,
        zeitStep: typeof parsed.zeitStep === 'number' ? parsed.zeitStep : DEFAULT_TRANSFORMATION_SETTINGS.zeitStep,
        abklingenStep: typeof parsed.abklingenStep === 'number' ? parsed.abklingenStep : DEFAULT_TRANSFORMATION_SETTINGS.abklingenStep,
        timeUnit: typeof parsed.timeUnit === 'string' && parsed.timeUnit.trim() ? parsed.timeUnit : DEFAULT_TRANSFORMATION_SETTINGS.timeUnit,
      };
    }
  } catch (e) {}
  return DEFAULT_TRANSFORMATION_SETTINGS as Required<SavedCardSettings>;
};

export const TransformationIntensityCard: React.FC<TransformationIntensityCardProps> = ({
  intensityVal,
  stageName,
  onUpdateIntensity,
  readOnly = false,
  className = '',
  compact = false,
  timeRateIncrease = 10,
  timeRateDecay = 20,
  timeUnitLabel = 'Min.',
  defaultPointOfNoReturn = 80,
  onUpdatePointOfNoReturn,
}) => {
  // Configurable percentage steps & rates with localStorage persistence
  const [kraftStep, setKraftStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCardSettings = JSON.parse(saved);
        if (typeof parsed.kraftStep === 'number') return parsed.kraftStep;
      }
    } catch (e) {}
    return 15;
  });

  const [zeitStep, setZeitStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCardSettings = JSON.parse(saved);
        if (typeof parsed.zeitStep === 'number') return parsed.zeitStep;
      }
    } catch (e) {}
    return timeRateIncrease;
  });

  const [abklingenStep, setAbklingenStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCardSettings = JSON.parse(saved);
        if (typeof parsed.abklingenStep === 'number') return parsed.abklingenStep;
      }
    } catch (e) {}
    return timeRateDecay;
  });

  const [timeUnit, setTimeUnit] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCardSettings = JSON.parse(saved);
        if (typeof parsed.timeUnit === 'string' && parsed.timeUnit.trim()) return parsed.timeUnit;
      }
    } catch (e) {}
    return timeUnitLabel;
  });

  // Point of No Return threshold (in %)
  const [pnrThreshold, setPnrThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCardSettings = JSON.parse(saved);
        if (typeof parsed.pnrThreshold === 'number') return parsed.pnrThreshold;
      }
    } catch (e) {}
    return defaultPointOfNoReturn;
  });

  // String state for smooth free text typing with decimals
  const [pnrInput, setPnrInput] = useState<string>(() => formatNum(pnrThreshold));
  const [kraftInput, setKraftInput] = useState<string>(() => formatNum(kraftStep));
  const [zeitInput, setZeitInput] = useState<string>(() => formatNum(zeitStep));
  const [abklingenInput, setAbklingenInput] = useState<string>(() => formatNum(abklingenStep));
  const [intensityInput, setIntensityInput] = useState<string>(formatNum(intensityVal));

  // Simulation timer state for automatic rising / falling
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simMode, setSimMode] = useState<'increase' | 'decrease'>('increase');

  useEffect(() => {
    if (!isSimulating || readOnly) return;
    const interval = setInterval(() => {
      if (simMode === 'increase') {
        if (intensityVal >= 100) {
          setIsSimulating(false);
          return;
        }
        const next = Math.min(100, intensityVal + zeitStep);
        onUpdateIntensity(Math.round(next * 100) / 100);
      } else {
        if (intensityVal <= 0 || intensityVal >= pnrThreshold) {
          setIsSimulating(false);
          return;
        }
        const next = Math.max(0, intensityVal - abklingenStep);
        onUpdateIntensity(Math.round(next * 100) / 100);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, simMode, intensityVal, zeitStep, abklingenStep, pnrThreshold, readOnly, onUpdateIntensity]);

  const handleTimeStepForward = (units: number) => {
    if (readOnly) return;
    const delta = units * zeitStep;
    const nextVal = Math.min(100, Math.max(0, intensityVal + delta));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handleTimeStepBackward = (units: number) => {
    if (readOnly || isPastPNR) return;
    const delta = units * abklingenStep;
    const nextVal = Math.min(100, Math.max(0, intensityVal - delta));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  // Sync intensity input if prop changes
  useEffect(() => {
    setIntensityInput(formatNum(intensityVal));
  }, [intensityVal]);

  // Persist parameters to localStorage whenever they change
  useEffect(() => {
    try {
      const dataToSave: SavedCardSettings = {
        pnrThreshold,
        kraftStep,
        zeitStep,
        abklingenStep,
        timeUnit,
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dataToSave));
      window.dispatchEvent(new CustomEvent('transformation_settings_updated', { detail: dataToSave }));
    } catch (e) {
      console.warn('Could not save transformation card settings:', e);
    }
  }, [pnrThreshold, kraftStep, zeitStep, abklingenStep, timeUnit]);

  // Notify parent component if a saved custom PNR threshold exists
  useEffect(() => {
    if (onUpdatePointOfNoReturn && pnrThreshold !== defaultPointOfNoReturn) {
      onUpdatePointOfNoReturn(pnrThreshold);
    }
  }, []);

  // Toggle for configuration panel
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Active view tab: 'verwandlung' | 'abklingzeit' | 'beide'
  const [activeTab, setActiveTab] = useState<'beide' | 'verwandlung' | 'abklingzeit'>('beide');

  const handlePnrChange = (newPnr: number) => {
    const clamped = Math.max(0.01, Math.min(100, newPnr));
    const rounded = Math.round(clamped * 100) / 100;
    setPnrThreshold(rounded);
    if (onUpdatePointOfNoReturn) {
      onUpdatePointOfNoReturn(rounded);
    }
  };

  const handlePnrInputChange = (val: string) => {
    setPnrInput(val);
    const normalized = val.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') {
      handlePnrChange(0);
      return;
    }
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      handlePnrChange(parsed);
    }
  };

  const handleKraftInputChange = (val: string) => {
    setKraftInput(val);
    const normalized = val.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') {
      setKraftStep(0);
      return;
    }
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      setKraftStep(Math.round(parsed * 100) / 100);
    }
  };

  const handleZeitInputChange = (val: string) => {
    setZeitInput(val);
    const normalized = val.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') {
      setZeitStep(0);
      return;
    }
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      setZeitStep(Math.round(parsed * 100) / 100);
    }
  };

  const handleAbklingenInputChange = (val: string) => {
    setAbklingenInput(val);
    const normalized = val.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') {
      setAbklingenStep(0);
      return;
    }
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      setAbklingenStep(Math.round(parsed * 100) / 100);
    }
  };

  // Calculations
  const isPastPNR = intensityVal >= pnrThreshold;

  // Time calculations in units
  const remainingToPNR = Math.max(0, pnrThreshold - intensityVal);
  const pnrDurationVal = zeitStep > 0 ? remainingToPNR / zeitStep : Infinity;
  const zeroDurationVal = abklingenStep > 0 ? intensityVal / abklingenStep : Infinity;

  const timeToPNRFormatted = isPastPNR
    ? 'Erreicht (Irreversibel)'
    : pnrDurationVal === Infinity
    ? '∞'
    : formatDuration(pnrDurationVal, timeUnit);

  const timeToZeroFormatted = isPastPNR
    ? 'Kein Abklingen möglich'
    : intensityVal === 0
    ? `0 ${timeUnit} (Vollständig normal)`
    : zeroDurationVal === Infinity
    ? '∞'
    : formatDuration(zeroDurationVal, timeUnit);

  // Handlers for adjustments
  const handleIncrease = (step: number) => {
    if (readOnly) return;
    const nextVal = Math.min(100, Math.max(0, intensityVal + step));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handleDecrease = (step: number) => {
    if (readOnly) return;
    const nextVal = Math.min(100, Math.max(0, intensityVal - step));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handleReset = () => {
    if (readOnly) return;
    onUpdateIntensity(0);
  };

  const handleDirectInput = (valStr: string) => {
    if (readOnly) return;
    setIntensityInput(valStr);
    const normalized = valStr.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') return;
    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) return;
    const clamped = Math.min(100, Math.max(0, parsed));
    onUpdateIntensity(Math.round(clamped * 100) / 100);
  };

  return (
    <div className={`bg-slate-950/90 p-4 rounded-2xl border ${isPastPNR ? 'border-red-500/60 shadow-red-950/30' : 'border-amber-500/30'} space-y-3 shadow-xl backdrop-blur-sm ${className}`}>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-900">
        <div className="flex items-center gap-2 shrink-0">
          <i className={`fa-solid ${isPastPNR ? 'fa-skull-crossbones text-red-400' : 'fa-bolt-lightning text-amber-400'} text-sm`}></i>
          <span className="text-xs font-bold text-amber-300 tracking-wide">
            Verwandlung & Abklingzeit
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* TAB SWITCHER */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('beide')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'beide' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Übersicht
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verwandlung')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'verwandlung' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stufe & PNR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('abklingzeit')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'abklingzeit' ? 'bg-sky-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Abklingzeit
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  showSettings
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-slate-700'
                }`}
                title="Point of No Return & Zeiteinheiten anpassen"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
            )}

            <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-0.5 gap-1">
              <input
                type="text"
                inputMode="decimal"
                disabled={readOnly}
                value={intensityInput}
                onChange={(e) => handleDirectInput(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(intensityInput);
                  const clamped = Math.min(100, Math.max(0, parsed));
                  const rounded = Math.round(clamped * 100) / 100;
                  setIntensityInput(formatNum(rounded));
                  onUpdateIntensity(rounded);
                }}
                className={`w-12 bg-transparent text-xs font-mono font-bold text-right outline-none transition-all ${isPastPNR ? 'text-red-400' : 'text-amber-400'}`}
                title="Klicken oder tippen, um exakte Intensität (0-100%) einzustellen"
              />
              <span className="text-[10px] font-bold text-amber-400/80 pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WARNING BANNER IF PAST POINT OF NO RETURN */}
      {isPastPNR && (
        <div className="bg-red-950/80 border border-red-500/60 p-2 rounded-xl flex items-center justify-between text-red-200 text-[10px] shadow-lg animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <i className="fa-solid fa-triangle-exclamation text-red-400 text-sm shrink-0"></i>
            <span>Point of No Return ({formatNum(pnrThreshold)}%) überschritten! Transformation ist dauerhaft / irreversibel.</span>
          </div>
          <span className="font-mono bg-red-900/60 px-2 py-0.5 rounded border border-red-500/40 font-black text-white shrink-0">
            {formatNum(intensityVal)}%
          </span>
        </div>
      )}

      {/* SECTION 1: VERWANDLUNGSSTUFE & POINT OF NO RETURN */}
      {(activeTab === 'beide' || activeTab === 'verwandlung') && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group text-amber-400 text-[10px]"></i>
              <span>Verwandlungsstufe & Point of No Return</span>
            </span>
            <span className="font-bold text-amber-300">
              {stageName || 'Standard'}
            </span>
          </div>

          {/* PROGRESS BAR WITH POINT OF NO RETURN MARKER */}
          <div className="space-y-1">
            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
              {/* Progress fill */}
              <div
                className={`h-full transition-all duration-300 ${
                  isPastPNR
                    ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, intensityVal))}%` }}
              />

              {/* Point of No Return Vertical Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                style={{ left: `${pnrThreshold}%` }}
                title={`Point of No Return: ${formatNum(pnrThreshold)}%`}
              >
                <div className="absolute -top-1 -translate-x-1/2 bg-red-600 text-[8px] font-mono font-black text-white px-1 rounded-sm uppercase tracking-tighter shadow">
                  PNR
                </div>
              </div>
            </div>

            {/* BAR LEGEND / PNR SETTER */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-0.5">
              <span>0% (Menschlich)</span>
              
              <span className="text-red-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-flag text-[8px]"></i>
                <span>Point of No Return: {formatNum(pnrThreshold)}%</span>
              </span>

              <span>100% (Maximum)</span>
            </div>
          </div>

          {/* TIME TO POINT OF NO RETURN METRIC */}
          <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-hourglass-half text-orange-400"></i>
              <span>Zeit bis Point of No Return ({formatNum(pnrThreshold)}%):</span>
            </span>
            <span className={`font-mono font-bold ${isPastPNR ? 'text-red-400' : 'text-orange-300'}`}>
              {isPastPNR ? 'Erreicht (Irreversibel)' : `${timeToPNRFormatted} (+${formatNum(zeitStep)}%/${timeUnit})`}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: ABKLINGZEIT & DAUER BIS 0% */}
      {(activeTab === 'beide' || activeTab === 'abklingzeit') && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-clock-rotate-left text-sky-400 text-[10px]"></i>
              <span>Abklingzeit & Rückverwandlungs-Dauer</span>
            </span>
            <span className="font-mono font-bold text-sky-300">
              Rate: -{formatNum(abklingenStep)}% / {timeUnit}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-2 rounded-lg border border-slate-800 text-[10px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-stopwatch text-sky-400"></i>
              <span>Dauer bis wieder 0% erreicht ist:</span>
            </span>
            <span className={`font-mono font-black text-xs ${isPastPNR ? 'text-red-400' : intensityVal === 0 ? 'text-emerald-400' : 'text-sky-300'}`}>
              {timeToZeroFormatted}
            </span>
          </div>
        </div>
      )}

      {/* ZEITEINHEITEN SCHNELL-STEUERUNG (STEIGEN & FALLEN) */}
      {!readOnly && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9.5px]">
            <span className="text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-hourglass-start text-amber-400 text-[10px]"></i>
              <span>Zeiteinheiten Steuern ({timeUnit}) – Steigen & Fallen</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              Rate: +{formatNum(zeitStep)}% (Zeit) / -{formatNum(abklingenStep)}% (Abklingen)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Fallende Zeiteinheiten */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-sky-400 uppercase mr-0.5">Fallen:</span>
              <button
                type="button"
                disabled={isPastPNR}
                onClick={() => handleTimeStepBackward(10)}
                className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all ${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                }`}
                title={`10 ${timeUnit} abklingen (-${formatNum(10 * abklingenStep)}%)`}
              >
                -10 {timeUnit}
              </button>
              <button
                type="button"
                disabled={isPastPNR}
                onClick={() => handleTimeStepBackward(1)}
                className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all ${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                }`}
                title={`1 ${timeUnit} abklingen (-${formatNum(abklingenStep)}%)`}
              >
                -1 {timeUnit}
              </button>
            </div>

            {/* Steigende Zeiteinheiten */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-orange-400 uppercase mr-0.5">Steigen:</span>
              <button
                type="button"
                onClick={() => handleTimeStepForward(1)}
                className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                title={`1 ${timeUnit} vergangen (+${formatNum(zeitStep)}%)`}
              >
                +1 {timeUnit}
              </button>
              <button
                type="button"
                onClick={() => handleTimeStepForward(10)}
                className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                title={`10 ${timeUnit} vergangen (+${formatNum(10 * zeitStep)}%)`}
              >
                +10 {timeUnit}
              </button>
              <button
                type="button"
                onClick={() => handleTimeStepForward(60)}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                title={`60 ${timeUnit} vergangen (+${formatNum(60 * zeitStep)}%)`}
              >
                +1 Std. (+{formatNum(60 * zeitStep)}%)
              </button>
            </div>

            {/* Auto-Simulation Toggles */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={() => {
                  if (isSimulating && simMode === 'increase') {
                    setIsSimulating(false);
                  } else {
                    setSimMode('increase');
                    setIsSimulating(true);
                  }
                }}
                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  isSimulating && simMode === 'increase'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse'
                    : 'bg-slate-900 text-amber-400 border-slate-700 hover:border-amber-500/50'
                }`}
                title="Auto-Simulation: Verwandlungsstufe steigt kontinuierlich pro Sekunde"
              >
                <i className={`fa-solid ${isSimulating && simMode === 'increase' ? 'fa-pause' : 'fa-play'}`}></i>
                <span>Auto-Steigen</span>
              </button>

              <button
                type="button"
                disabled={isPastPNR}
                onClick={() => {
                  if (isSimulating && simMode === 'decrease') {
                    setIsSimulating(false);
                  } else {
                    setSimMode('decrease');
                    setIsSimulating(true);
                  }
                }}
                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 ${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : isSimulating && simMode === 'decrease'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-black animate-pulse cursor-pointer'
                    : 'bg-slate-900 text-sky-400 border-slate-700 hover:border-sky-500/50 cursor-pointer'
                }`}
                title="Auto-Simulation: Verwandlungsstufe fällt kontinuierlich pro Sekunde"
              >
                <i className={`fa-solid ${isSimulating && simMode === 'decrease' ? 'fa-pause' : 'fa-play'}`}></i>
                <span>Auto-Fallen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS WITH TIME UNITS */}
      {!readOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleIncrease(kraftStep)}
            className="px-2.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title={`Kraftaufwand & Kampf steigern die Intensität (+${formatNum(kraftStep)}%)`}
          >
            <i className="fa-solid fa-fire text-xs text-amber-400 group-hover:scale-110 transition-transform"></i>
            <span>Kraft +{formatNum(kraftStep)}%</span>
          </button>

          <button
            type="button"
            onClick={() => handleIncrease(zeitStep)}
            className="px-2.5 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title={`Verstrichene Zeit im verwandelten Zustand (+${formatNum(zeitStep)}% pro ${timeUnit})`}
          >
            <i className="fa-solid fa-hourglass-half text-xs text-orange-400 group-hover:scale-110 transition-transform"></i>
            <span>Zeit +{formatNum(zeitStep)}% / {timeUnit}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecrease(abklingenStep)}
            disabled={isPastPNR}
            className={`px-2.5 py-2 border font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm group ${
              isPastPNR
                ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer'
            }`}
            title={`Rast / Inaktivität lässt Effekt abklingen (-${formatNum(abklingenStep)}% pro ${timeUnit})`}
          >
            <i className="fa-solid fa-feather text-xs text-sky-400 group-hover:scale-110 transition-transform"></i>
            <span>Abklingen -{formatNum(abklingenStep)}%</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title="Intensität vollständig zurücksetzen (0%)"
          >
            <i className="fa-solid fa-rotate-left text-xs group-hover:-rotate-45 transition-transform"></i>
            <span>Reset (0%)</span>
          </button>
        </div>
      )}

      {/* CONFIGURATION / STEP SETTINGS PANEL */}
      {!readOnly && showSettings && (
        <div className="bg-slate-900/95 p-3.5 rounded-xl border border-amber-500/40 space-y-3 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-amber-400"></i>
              <span>Point of No Return & Zeiteinheiten konfigurieren</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <i className="fa-solid fa-floppy-disk text-[9px]"></i>
              <span>Automatisch gespeichert</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Point of No Return Threshold Config */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-red-500/30 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-red-400 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <i className="fa-solid fa-flag text-red-400 text-[10px] shrink-0"></i>
                  <span className="truncate">Point of No Return</span>
                </span>
                <span className="text-[10px] text-red-400 font-mono font-black shrink-0">%</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={pnrInput}
                onChange={(e) => handlePnrInputChange(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(pnrInput);
                  if (pnrInput.trim() === '' || isNaN(parsed) || parsed <= 0) {
                    const fallback = pnrThreshold || 80;
                    setPnrInput(formatNum(fallback));
                    handlePnrChange(fallback);
                  } else {
                    const rounded = Math.round(parsed * 100) / 100;
                    setPnrInput(formatNum(rounded));
                    handlePnrChange(rounded);
                  }
                }}
                className="w-full bg-slate-900 border border-red-500/40 focus:border-red-400 focus:ring-1 focus:ring-red-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="80"
              />
            </div>

            {/* Kraft Step Config */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <i className="fa-solid fa-fire text-amber-400 text-[10px] shrink-0"></i>
                  <span className="truncate">Kraft-Zuwachs</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-black shrink-0">%</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={kraftInput}
                onChange={(e) => handleKraftInputChange(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(kraftInput);
                  if (kraftInput.trim() === '' || isNaN(parsed)) {
                    const fallback = kraftStep ?? 15;
                    setKraftInput(formatNum(fallback));
                    setKraftStep(fallback);
                  } else {
                    const rounded = Math.round(parsed * 100) / 100;
                    setKraftInput(formatNum(rounded));
                    setKraftStep(rounded);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="15"
              />
            </div>

            {/* Zeit Step Config */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-orange-300 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <i className="fa-solid fa-hourglass-half text-orange-400 text-[10px] shrink-0"></i>
                  <span className="truncate">Zeit-Zuwachs</span>
                </span>
                <span className="text-[9px] text-orange-400 font-mono font-black shrink-0">%/{timeUnit}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={zeitInput}
                onChange={(e) => handleZeitInputChange(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(zeitInput);
                  if (zeitInput.trim() === '' || isNaN(parsed)) {
                    const fallback = zeitStep ?? 10;
                    setZeitInput(formatNum(fallback));
                    setZeitStep(fallback);
                  } else {
                    const rounded = Math.round(parsed * 100) / 100;
                    setZeitInput(formatNum(rounded));
                    setZeitStep(rounded);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="10"
              />
            </div>

            {/* Abklingen Step Config */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-sky-300 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <i className="fa-solid fa-feather text-sky-400 text-[10px] shrink-0"></i>
                  <span className="truncate">Abkling-Rate</span>
                </span>
                <span className="text-[9px] text-sky-400 font-mono font-black shrink-0">%/{timeUnit}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={abklingenInput}
                onChange={(e) => handleAbklingenInputChange(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(abklingenInput);
                  if (abklingenInput.trim() === '' || isNaN(parsed)) {
                    const fallback = abklingenStep ?? 20;
                    setAbklingenInput(formatNum(fallback));
                    setAbklingenStep(fallback);
                  } else {
                    const rounded = Math.round(parsed * 100) / 100;
                    setAbklingenInput(formatNum(rounded));
                    setAbklingenStep(rounded);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="20"
              />
            </div>

            {/* Time Unit Label Config */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-300 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <i className="fa-solid fa-clock text-amber-400 text-[10px] shrink-0"></i>
                  <span className="truncate">Zeiteinheit</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono font-black shrink-0">Text</span>
              </label>
              <input
                type="text"
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                onBlur={() => {
                  if (!timeUnit.trim()) setTimeUnit('Min.');
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="Min."
              />
            </div>
          </div>

          {/* Quick Fine-Tuning Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[9.5px] font-bold text-slate-400">Feinabstimmung der Intensität:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '-25%', val: -25 },
                { label: '-10%', val: -10 },
                { label: '-5%', val: -5 },
                { label: '-1%', val: -1 },
                { label: '-0,1%', val: -0.1 },
                { label: '+0,1%', val: 0.1 },
                { label: '+1%', val: 1 },
                { label: '+5%', val: 5 },
                { label: '+10%', val: 10 },
                { label: '+25%', val: 25 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    const next = Math.min(100, Math.max(0, intensityVal + btn.val));
                    onUpdateIntensity(next);
                  }}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[9px] font-mono font-bold transition-all active:scale-95"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransformationIntensityCard;
