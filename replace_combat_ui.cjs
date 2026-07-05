const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

const regex = /<p className=\"text-\[11px\] text-slate-400\">Wähle einen Widersacher[\s\S]*?\{selectedEnemyId === 'custom' && \([\s\S]*?\)\}/;
const replaceVal = `<p className="text-[11px] text-slate-400">Gib an, gegen wen du kämpfen möchtest (z.B. einen spezifischen Gegner oder eine ganze Gruppe).</p>
              
              <div className="space-y-1 mt-2">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gegner / Feindliche Gruppe</label>
                <input
                  type="text"
                  value={customEnemyName}
                  onChange={e => setCustomEnemyName(e.target.value)}
                  placeholder="z.B. Großer Bär, Ninja-Assassinen, Banditen..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>`;

content = content.replace(regex, replaceVal);

// We also need to fix the button beneath it which checks if !selectedEnemyId
content = content.replace(/if \(!selectedEnemyId\) \{/, `if (!customEnemyName.trim()) {`);
content = content.replace(/setError\(\"Bitte wähle zuerst einen Gegner aus!\"\);/, `setError("Bitte gib einen Gegner an!");`);
content = content.replace(/if \(selectedEnemyId === 'custom' && !customEnemyName\.trim\(\)\) \{[\s\S]*?return;\n\s*\}/, ``);
content = content.replace(/startCombat\(selectedEnemyId, customEnemyName\);/, `startCombat('custom', customEnemyName);`);

fs.writeFileSync('components/GameView.tsx', content);
console.log('Replaced');
