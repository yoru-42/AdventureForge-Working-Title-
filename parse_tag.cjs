const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');
const fragment = lines.slice(7754, 7770).join('\n');
console.log(fragment);
