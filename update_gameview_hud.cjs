const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf8');

const oldHudBadge1 = `<div className="flex items-center justify-between w-full mt-0.5 text-[10px]">
                        <span className="font-bold text-slate-100 truncate max-w-[90px]">
                          {resolvedApp.transformationStageName.split(' ')[0] || 'Standard'}
                        </span>
                        <span className={\`text-[8.5px] font-mono font-semibold shrink-0 px-1 py-0.2 rounded border \${
                          isPastPNR ? 'bg-red-900/80 text-red-200 border-red-700' : 'bg-slate-900/80 text-orange-300 border-slate-800'
                        }\`}>
                          {isPastPNR ? 'PNR Erreicht' : \`PNR: \${timeToPNRFormatted}\`}
                        </span>
                      </div>`;

const newHudBadge1 = `<div className="flex items-center justify-between w-full mt-0.5 text-[10px]">
                        <span className="font-bold text-slate-100 truncate max-w-[90px]">
                          {resolvedApp.transformationStageName.split(' ')[0] || 'Standard'}
                        </span>
                        <span className={\`text-[8.5px] font-mono font-semibold shrink-0 px-1 py-0.2 rounded border \${
                          isPastPNR ? 'bg-red-900/80 text-red-200 border-red-700' : 'bg-slate-900/80 text-orange-300 border-slate-800'
                        }\`}>
                          {isPastPNR ? 'PNR Erreicht' : \`PNR: \${timeToPNRFormatted}\`}
                        </span>
                      </div>
                      {/* Mini Progress Bar with PNR Marker */}
                      <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 relative mt-1">
                        <div
                          className={\`h-full transition-all duration-300 \${
                            isPastPNR
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 animate-pulse'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }\`}
                          style={{ width: \`\${Math.min(100, Math.max(0, currentInt))}%\` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_4px_rgba(239,68,68,0.8)]"
                          style={{ left: \`\${pnrThreshold}%\` }}
                          title={\`Point of No Return: \${formatNum(pnrThreshold)}%\`}
                        />
                      </div>`;

if (!content.includes('Mini Progress Bar with PNR Marker')) {
  content = content.replace(oldHudBadge1, newHudBadge1);
}

// Mini progress bar in HUD Badge 2
const oldHudBadge2 = `<span className="font-mono font-black text-xs text-sky-300 truncate">
                          {isPastPNR ? 'Kein Abklingen' : timeToZeroFormatted}
                        </span>
                      </div>`;

const newHudBadge2 = `<span className="font-mono font-black text-xs text-sky-300 truncate">
                          {isPastPNR ? 'Kein Abklingen' : timeToZeroFormatted}
                        </span>
                      </div>
                      {/* Mini Progress Decay Bar */}
                      <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 relative mt-1">
                        <div
                          className={\`h-full transition-all duration-300 \${
                            isPastPNR
                              ? 'bg-red-800/40'
                              : 'bg-gradient-to-r from-sky-500 to-indigo-400'
                          }\`}
                          style={{ width: \`\${Math.min(100, Math.max(0, currentInt))}%\` }}
                        />
                      </div>`;

if (!content.includes('Mini Progress Decay Bar')) {
  content = content.replace(oldHudBadge2, newHudBadge2);
}

fs.writeFileSync('components/GameView.tsx', content);
console.log('GameView.tsx HUD badges updated successfully!');
