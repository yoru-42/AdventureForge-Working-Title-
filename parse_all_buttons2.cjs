const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const opens = (content.match(/<button/g) || []).length;
const closes = (content.match(/<\/button>/g) || []).length;
console.log("Opens:", opens, "Closes:", closes, "Diff:", opens - closes);
