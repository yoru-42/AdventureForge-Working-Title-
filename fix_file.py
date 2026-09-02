import sys

with open('components/GameView.tsx', 'rb') as f:
    content = f.read()

idx = content.find(b'<div className="relative">\n                    <button\n                      type="button"\n                      onClick={() => { setShowToneMenu')

if idx != -1:
    valid_part = content[:idx]
    valid_str = valid_part.decode('utf-8')
    
    rest = """<div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowToneMenu(!showToneMenu); setShowEmotionMenu(false); setShowFavoritesMenu(false); }}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                      title="Stimme/Tonart beschreiben"
                    >
                      <i className="fa-solid fa-microphone-lines group-hover:-translate-y-0.5 transition-transform text-xs"></i>
                    </button>
                    {showToneMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                          <span>Tonart</span>
                          <span className="text-[8px] text-slate-500 lowercase">oft benutzt oben</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {sortedTones && sortedTones.length > 0 ? sortedTones.map(e => {
                            const count = toneUsage[e] || 0;
                            return (
                              <button
                                key={e}
                                onClick={() => {
                                  insertFormatting(`[spricht ${e}] `, '');
                                  handleSelectTone(e);
                                  setShowToneMenu(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{e}</span>
                                  {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                                </span>
                              </button>
                            );
                          }) : (
                            <div className="px-3 py-4 text-xs text-slate-500 text-center italic">Keine Tonarten vorhanden.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowFavoritesMenu(!showFavoritesMenu); setShowEmotionMenu(false); setShowToneMenu(false); }}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                      title="Favoriten einfügen"
                    >
                      <i className="fa-solid fa-star group-hover:-translate-y-0.5 transition-transform text-xs"></i>
                    </button>
                    {showFavoritesMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                          <span>Favoriten</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {sortedFavorites && sortedFavorites.length > 0 ? sortedFavorites.map(e => {
                            const count = favoriteUsage[e] || 0;
                            return (
                              <button
                                key={e}
                                onClick={() => {
                                  insertFormatting(e, '');
                                  handleSelectFavorite(e);
                                  setShowFavoritesMenu(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{e}</span>
                                  {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                                </span>
                              </button>
                            );
                          }) : (
                            <div className="px-3 py-4 text-xs text-slate-500 text-center italic">Keine Favoriten vorhanden. Füge eine durch Stern-Klick im Chat hinzu!</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Main Text Input Area */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChatSubmit(inputText);
                }} 
                className="flex flex-col gap-2 relative mt-2"
              >
                <div className="relative group">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      adjustTextareaHeight(e.target);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading) handleChatSubmit(inputText);
                      }
                    }}
                    disabled={isLoading}
                    placeholder={isLoading ? 'Die Welt reagiert...' : isCombatMode ? 'Was tust du im Kampf?' : 'Was tust du? (Enter zum Senden)'}
                    className="w-full bg-slate-950/80 border-2 border-slate-700/50 rounded-xl p-3 pr-14 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none overflow-hidden min-h-[52px]"
                    rows={1}
                    style={{ maxHeight: '160px' }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || (!inputText.trim() && !pendingCombatAction && queuedCombatActions.length === 0)}
                    className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-amber-950 disabled:opacity-30 disabled:hover:bg-amber-500/20 disabled:hover:text-amber-500 transition-all flex items-center justify-center shadow-lg active:scale-95 group/btn"
                  >
                    {isLoading ? (
                      <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                    ) : (
                      <i className="fa-solid fa-paper-plane text-[13px] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"></i>
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Shift+Enter für Zeilenumbruch
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"""
    with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
        f.write(valid_str + rest)
    print("Successfully recovered file")
else:
    print("Could not find ToneMenu block")
