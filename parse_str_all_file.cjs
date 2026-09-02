const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const fragment = content.replace(/`[^`]*`/g, '""').replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""');

const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
let counts = {};
let match;
while ((match = regex.exec(fragment)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    
    // Ignore self-closing inside the tag like <img /> or <div />
    if (fullTag.endsWith('/>') || fullTag.endsWith('/ >')) continue;
    if (['br', 'img', 'hr', 'input'].includes(tagName.toLowerCase())) continue;
    
    if (fullTag.startsWith('</')) {
        counts[tagName] = (counts[tagName] || 0) - 1;
    } else {
        counts[tagName] = (counts[tagName] || 0) + 1;
    }
}
for (let key in counts) {
    if (counts[key] !== 0) {
        console.log("Unbalanced tag:", key, "Count:", counts[key]);
    }
}
