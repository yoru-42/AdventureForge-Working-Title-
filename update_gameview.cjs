const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf8');

const targetStr = `                return (
                  <div key={\`\${el.id || el.label}-\${idx}\`} className="flex-shrink-0 bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-1.5 flex flex-col items-center min-w-[120px] shadow-sm">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{el.label}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 w-full justify-center">
                      {el.label === 'Ausdauer' && <i className="fa-solid fa-bolt text-[10px] text-amber-500/50 shrink-0"></i>}
                      {el.label === 'HP' && <i className="fa-solid fa-heart text-[10px] text-red-500/50 shrink-0"></i>}
                      {el.label === 'MP' && <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-indigo-400/50 shrink-0"></i>}
                      <input
                        type="text"
                        value={el.value || ''}
                        onChange={(e) => updateItemValue(e.target.value)}
                        className="bg-transparent text-amber-400 font-bold text-center text-sm w-full max-w-[100px] focus:bg-slate-950/40 rounded border border-transparent focus:border-amber-500/30 px-1 py-0.5 outline-none transition-all placeholder:text-slate-600"
                        placeholder="Wert..."
                      />
                    </div>
                  </div>
                );`;

const replacement = `                const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                let finalValue = el.value || '';
                let isReadonly = false;
                let colorClass = 'text-amber-400';

                if (isPnr) {
                  finalValue = \`\${formatNum(transSettings.pnrThreshold)}%\`;
                  isReadonly = true;
                  colorClass = 'text-red-400';
                } else if (isVerwandlung) {
                  finalValue = \`\${formatNum(resolvedApp.transformationIntensityVal || 0)}%\`;
                  isReadonly = true;
                  colorClass = 'text-purple-400';
                } else if (isAbkling) {
                  finalValue = \`-\${formatNum(transSettings.abklingenStep)}%/\${transSettings.timeUnit}\`;
                  isReadonly = true;
                  colorClass = 'text-sky-400';
                }

                return (
                  <div key={\`\${el.id || el.label}-\${idx}\`} className="flex-shrink-0 bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-1.5 flex flex-col items-center min-w-[120px] shadow-sm">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{el.label}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 w-full justify-center">
                      {el.label === 'Ausdauer' && <i className="fa-solid fa-bolt text-[10px] text-amber-500/50 shrink-0"></i>}
                      {el.label === 'HP' && <i className="fa-solid fa-heart text-[10px] text-red-500/50 shrink-0"></i>}
                      {el.label === 'MP' && <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-indigo-400/50 shrink-0"></i>}
                      
                      {isReadonly ? (
                         <span className={\`bg-transparent font-bold text-center text-sm w-full max-w-[100px] px-1 py-0.5 font-mono \${colorClass}\`}>
                           {finalValue}
                         </span>
                      ) : (
                        <input
                          type="text"
                          value={finalValue}
                          onChange={(e) => updateItemValue(e.target.value)}
                          className="bg-transparent text-amber-400 font-bold text-center text-sm w-full max-w-[100px] focus:bg-slate-950/40 rounded border border-transparent focus:border-amber-500/30 px-1 py-0.5 outline-none transition-all placeholder:text-slate-600"
                          placeholder="Wert..."
                        />
                      )}
                    </div>
                  </div>
                );`;

if (!content.includes(targetStr)) {
  console.log('Target string not found!');
  process.exit(1);
}

content = content.replace(targetStr, replacement);
fs.writeFileSync('components/GameView.tsx', content);
console.log('Done');
