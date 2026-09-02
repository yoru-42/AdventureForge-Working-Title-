import re

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix sortedFavorites
text = re.sub(r'\{sortedFavorites && sortedFavorites\.length > 0 \? sortedFavorites\.map\(e => \{[\s\S]*?\}\) : \(', 
r'''{getFavoriteTechniques().length > 0 ? getFavoriteTechniques().map(tech => {
    const e = tech.name;
    return (
        <button
            key={e}
            onClick={() => {
                insertFormatting(`*${e}*`, '');
                setShowFavoritesMenu(false);
            }}
            className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
            <span className="flex items-center justify-between w-full">
                <span>{e}</span>
            </span>
        </button>
    );
}) : (''', text)

# Fix adjustTextareaHeight, inputRef, isCombatMode, handleChatSubmit
text = text.replace('ref={inputRef}', 'ref={textareaRef}')
text = text.replace('adjustTextareaHeight(e.target);', '')
text = text.replace('handleChatSubmit(inputText)', 'handleSend()')
text = text.replace('isCombatMode', 'isCombatActive')
text = text.replace('<textarea', '<AutoExpandingTextarea')

with open('test2.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

