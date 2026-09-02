const fs = require('fs');
let content = fs.readFileSync('components/AdventureEditor.tsx', 'utf8');

const importStr = "import { getTransformationCardSettings } from './TransformationIntensityCard';";
if (!content.includes('getTransformationCardSettings')) {
  content = content.replace("import { generateGameSummary } from '../lib/gemini';", "import { generateGameSummary } from '../lib/gemini';\nimport { getTransformationCardSettings } from './TransformationIntensityCard';");
}

const targetStr = `                  const displayValue = isLocation ? formatDisplayLocationName(rawVal) : rawVal;
                  return (
                    <div key={el.id} className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/50 border border-slate-700 p-2.5 sm:p-3 rounded-xl">
                      <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Label (z.B. Gold)" value={el.label || ''} onChange={e => updateStatusElement(el.id, { label: e.target.value })} />
                      <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Wert (z.B. 100)" value={displayValue} onChange={e => updateStatusElement(el.id, { value: e.target.value })} />
                      <button `;

const replacement = `                  const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                  const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                  const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                  let rawVal = el.value || '';
                  let isReadonly = false;
                  
                  if (isPnr || isAbkling || isVerwandlung) {
                     const transSettings = getTransformationCardSettings();
                     isReadonly = true;
                     if (isPnr) rawVal = \`\${transSettings.pnrThreshold}%\`;
                     if (isAbkling) rawVal = \`-\${transSettings.abklingenStep}%/\${transSettings.timeUnit}\`;
                     if (isVerwandlung) rawVal = \`0% (Live im Spiel)\`;
                  } else {
                     rawVal = el.value || (isLocation ? (player.appearance.currentLocation || '') : '');
                  }
                  
                  const displayValue = isLocation ? formatDisplayLocationName(rawVal) : rawVal;

                  return (
                    <div key={el.id} className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/50 border border-slate-700 p-2.5 sm:p-3 rounded-xl">
                      <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Label (z.B. Gold)" value={el.label || ''} onChange={e => updateStatusElement(el.id, { label: e.target.value })} />
                      
                      {isReadonly ? (
                        <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-xs text-amber-400 font-mono font-bold min-w-0 flex-1 truncate flex items-center justify-center opacity-80 cursor-not-allowed">
                          {displayValue} (Live)
                        </div>
                      ) : (
                        <input className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white min-w-0 flex-1 outline-none focus:border-amber-500" placeholder="Wert (z.B. 100)" value={displayValue} onChange={e => updateStatusElement(el.id, { value: e.target.value })} />
                      )}
                      
                      <button `;

if (!content.includes(targetStr)) {
  console.log('Target string not found in AdventureEditor!');
  process.exit(1);
}

content = content.replace(targetStr, replacement);
fs.writeFileSync('components/AdventureEditor.tsx', content);
console.log('Done AdventureEditor');
