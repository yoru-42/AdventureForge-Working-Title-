const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

const regex = /<\/?([a-zA-Z0-9]+)/g;
let counts = {};
let match;
while ((match = regex.exec(content)) !== null) {
    const full = match[0];
    const tag = match[1];
    // filter generic typescript
    if (['string', 'number', 'boolean', 'Array', 'Record', 'HTMLDivElement', 'HTMLTextAreaElement', 'T', 'any', 'Partial'].includes(tag)) continue;
    
    if (full.startsWith('</')) {
        counts[tag] = (counts[tag] || 0) - 1;
    } else {
        counts[tag] = (counts[tag] || 0) + 1;
    }
}
// Account for self closing manually
counts['img'] -= (content.match(/<img/g) || []).length;
counts['input'] -= (content.match(/<input/g) || []).length;
counts['br'] -= (content.match(/<br/g) || []).length;
counts['TacticalCombatMap'] -= 1; // we know it's self closing
counts['AutoExpandingTextarea'] -= (content.match(/<AutoExpandingTextarea[^>]*\/>/g) || []).length; // Oh wait, > might be on another line!
counts['AutoExpandingTextarea'] -= 2; // we saw there are 2 self closing

// Also chatEndRef divs
counts['div'] -= 2;

for (let key in counts) {
    if (counts[key] !== 0) {
        console.log("Unbalanced:", key, counts[key]);
    }
}
