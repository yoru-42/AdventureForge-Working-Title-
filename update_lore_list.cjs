const fs = require('fs');
let content = fs.readFileSync('components/LoreDatabaseView.tsx', 'utf8');

// I will keep the map, but change the rendered output
const newRender = `<div className="flex flex-col gap-2">
                {filteredLore.map((entry) => (
                  <div key={entry.id} className={\`p-3 rounded-lg border transition-all flex items-center justify-between \${
                    entry.isUnlocked ? 'bg-slate-800/80 border-slate-700 shadow-sm' : 'bg-slate-900/50 border-slate-800 opacity-70'
                  }\`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      {!entry.isUnlocked ? (
                        <i className="fa-solid fa-lock text-slate-500 text-xs shrink-0" title="Noch geheim"></i>
                      ) : (
                        <i className="fa-solid fa-book text-amber-500/50 text-xs shrink-0"></i>
                      )}
                      
                      <div className="flex items-center gap-2 truncate">
                        <h3 className="text-sm font-bold text-amber-500 truncate">{entry.title}</h3>
                        {activeCategory === 'Events' && entry.order !== undefined && (
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono shrink-0">#{entry.order}</span>
                        )}
                        {activeCategory === 'Charaktere' && entry.details?.role && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30 truncate shrink-0">{entry.details.role}</span>
                        )}
                        {activeCategory === 'Charaktere' && entry.details?.isHostile && (
                          <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full border border-red-500/30 font-bold shrink-0"><i className="fa-solid fa-skull text-[8px] mr-1"></i>Feind</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 shrink-0 bg-slate-900/50 rounded-lg border border-slate-800 p-1 ml-2">
                      <button onClick={() => handleEdit(entry)} className="p-1 w-7 h-7 flex items-center justify-center text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded transition-colors" title="Bearbeiten / Details ansehen"><i className="fa-solid fa-pen text-xs"></i></button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-slate-800 hover:text-red-300 rounded transition-colors" title="Löschen"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                  </div>
                ))}
              </div>`;

// Replace the old grid/list structure with the new compact version
content = content.replace(/<div className=\{activeCategory === 'Charaktere' \? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-3"\}>[\s\S]*?<\/div>\n\s*\}\)\}\n\s*<\/div>/, newRender);

fs.writeFileSync('components/LoreDatabaseView.tsx', content);
