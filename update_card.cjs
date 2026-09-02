const fs = require('fs');
let content = fs.readFileSync('components/TransformationIntensityCard.tsx', 'utf8');

// Add simulation state right after pnrInput/kraftInput/etc state declarations
const stateTarget = `const [intensityInput, setIntensityInput] = useState<string>(formatNum(intensityVal));`;
const stateReplacement = `const [intensityInput, setIntensityInput] = useState<string>(formatNum(intensityVal));

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
  };`;

if (!content.includes('isSimulating')) {
  content = content.replace(stateTarget, stateReplacement);
}

// Replace progress bar block to include interactive range slider
const oldProgressBar = `{/* PROGRESS BAR WITH POINT OF NO RETURN MARKER */}
          <div className="space-y-1">
            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
              {/* Progress fill */}
              <div
                className={\`h-full transition-all duration-300 \${
                  isPastPNR
                    ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }\`}
                style={{ width: \`\${Math.min(100, Math.max(0, intensityVal))%\` }}
              />

              {/* Point of No Return Vertical Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                style={{ left: \`\${pnrThreshold}%\` }}
                title={\`Point of No Return: \${formatNum(pnrThreshold)}%\`}
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
          </div>`;

const newProgressBar = `{/* PROGRESS BAR WITH POINT OF NO RETURN MARKER & SLIDER */}
          <div className="space-y-1.5">
            <div className="relative w-full h-5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner group">
              {/* Progress fill */}
              <div
                className={\`h-full transition-all duration-300 \${
                  isPastPNR
                    ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300'
                }\`}
                style={{ width: \`\${Math.min(100, Math.max(0, intensityVal))}%\` }}
              />

              {/* Point of No Return Vertical Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                style={{ left: \`\${pnrThreshold}%\` }}
                title={\`Point of No Return: \${formatNum(pnrThreshold)}%\`}
              >
                <div className="absolute -top-1 -translate-x-1/2 bg-red-600 text-[8px] font-mono font-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow z-20 whitespace-nowrap">
                  PNR ({formatNum(pnrThreshold)}%)
                </div>
              </div>
            </div>

            {/* Interactive Range Slider */}
            {!readOnly && (
              <div className="flex items-center gap-2 pt-0.5 px-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <span className="text-[9px] font-bold text-amber-400/90 uppercase shrink-0">Regler:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={intensityVal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdateIntensity(Math.round(val * 100) / 100);
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                />
                <span className="text-[10px] font-mono font-black text-amber-300 shrink-0 min-w-[36px] text-right">
                  {formatNum(intensityVal)}%
                </span>
              </div>
            )}

            {/* BAR LEGEND */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-0.5">
              <span>0% (Menschlich)</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-flag text-[8px]"></i>
                <span>Point of No Return: {formatNum(pnrThreshold)}%</span>
              </span>
              <span>100% (Maximum)</span>
            </div>
          </div>`;

content = content.replace(oldProgressBar, newProgressBar);

// Add the Zeiteinheiten Steuern Section before the action buttons
const actionButtonsMarker = `{/* ACTION BUTTONS WITH TIME UNITS */}`;
const zeiteinheitenBlock = `{/* ZEITEINHEITEN SCHNELL-STEUERUNG (STEIGEN & FALLEN) */}
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
                className={\`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all \${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                }\`}
                title={\`10 \${timeUnit} abklingen (-\${formatNum(10 * abklingenStep)}%)\`}
              >
                -10 {timeUnit}
              </button>
              <button
                type="button"
                disabled={isPastPNR}
                onClick={() => handleTimeStepBackward(1)}
                className={\`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all \${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                }\`}
                title={\`1 \${timeUnit} abklingen (-\${formatNum(abklingenStep)}%)\`}
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
                title={\`1 \${timeUnit} vergangen (+\${formatNum(zeitStep)}%)\`}
              >
                +1 {timeUnit}
              </button>
              <button
                type="button"
                onClick={() => handleTimeStepForward(10)}
                className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                title={\`10 \${timeUnit} vergangen (+\${formatNum(10 * zeitStep)}%)\`}
              >
                +10 {timeUnit}
              </button>
              <button
                type="button"
                onClick={() => handleTimeStepForward(60)}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                title={\`60 \${timeUnit} vergangen (+\${formatNum(60 * zeitStep)}%)\`}
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
                className={\`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer \${
                  isSimulating && simMode === 'increase'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse'
                    : 'bg-slate-900 text-amber-400 border-slate-700 hover:border-amber-500/50'
                }\`}
                title="Auto-Simulation: Verwandlungsstufe steigt kontinuierlich pro Sekunde"
              >
                <i className={\`fa-solid \${isSimulating && simMode === 'increase' ? 'fa-pause' : 'fa-play'}\`}></i>
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
                className={\`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 \${
                  isPastPNR
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : isSimulating && simMode === 'decrease'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-black animate-pulse cursor-pointer'
                    : 'bg-slate-900 text-sky-400 border-slate-700 hover:border-sky-500/50 cursor-pointer'
                }\`}
                title="Auto-Simulation: Verwandlungsstufe fällt kontinuierlich pro Sekunde"
              >
                <i className={\`fa-solid \${isSimulating && simMode === 'decrease' ? 'fa-pause' : 'fa-play'}\`}></i>
                <span>Auto-Fallen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      `;

if (!content.includes('Zeiteinheiten Steuern')) {
  content = content.replace(actionButtonsMarker, zeiteinheitenBlock + actionButtonsMarker);
}

fs.writeFileSync('components/TransformationIntensityCard.tsx', content);
console.log('TransformationIntensityCard.tsx updated successfully!');
