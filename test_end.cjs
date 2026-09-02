const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf8');

const anchor = 'fa-paper-plane text-sm"></i>\n                  </button>\n                </div>\n              </div>';
const idx = content.lastIndexOf(anchor);
if (idx === -1) {
    console.log("Anchor not found!");
} else {
    console.log("Anchor found at", idx);
    const end = `
            </div>
          )}
        </div>
      </div>
      
      {showSilhouetteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            <button onClick={() => setShowSilhouetteModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center z-10"><i className="fa-solid fa-xmark"></i></button>
            <div className="p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-amber-500 uppercase tracking-widest text-sm flex items-center gap-2">
                <i className="fa-solid fa-child-reaching"></i> Körper- & Aura-Zustand
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
              <BodySilhouette 
                player={adventure.player}
              />
            </div>
          </div>
        </div>
      )}

      {showAddOpponentForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative">
              <h3 className="text-amber-500 font-bold uppercase mb-4 text-sm">Gegner hinzufügen</h3>
              <p className="text-slate-300 text-xs mb-4">Möchtest du neue Gegner zum Kampf hinzufügen? Sag dem DM einfach im Chat, wer auftaucht!</p>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddOpponentForm(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200">Schließen</button>
              </div>
           </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-red-900/50 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <h3 className="text-red-500 font-bold uppercase mb-2 text-sm flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Warnung</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">Möchtest du den gesamten Chatverlauf <b>wirklich unwiderruflich löschen</b>? Nur die Prolog-Nachricht bleibt erhalten.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-colors">Abbrechen</button>
                <button onClick={() => { setShowResetConfirm(false); setMessages([{ ...messages[0], id: 'first-msg' }]); onUpdateAdventure({ ...adventure, combatState: { ...adventure.combatState, isCombatActive: false } }); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white transition-colors">Verlauf Löschen</button>
              </div>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-amber-900/50 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <h3 className="text-amber-500 font-bold uppercase mb-2 text-sm flex items-center gap-2"><i className="fa-solid fa-eraser"></i> Letzte Aktion widerrufen</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">Möchtest du deine letzte Eingabe und die Antwort des DMs löschen?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-colors">Abbrechen</button>
                <button onClick={() => { setShowDeleteConfirm(false); if (messages.length > 2) { const newMsgs = messages.slice(0, -2); setMessages(newMsgs); } }} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-slate-900 transition-colors">Widerrufen</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
`;
    content = content.slice(0, idx + anchor.length) + end;
    fs.writeFileSync('components/GameView.tsx', content);
}
