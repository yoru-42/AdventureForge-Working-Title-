const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');
const fragment = lines.slice(7179, 7780).join('\n'); // !isCombatActive block
const opens = (fragment.match(/<div(\s|>)/g) || []).length;
const closes = (fragment.match(/<\/div>/g) || []).length;
console.log("Opens:", opens, "Closes:", closes, "Diff:", opens - closes);
