const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<button(\s|>)/g) || []).length;
  const closes = (line.match(/<\/button>/g) || []).length;
  count += opens - closes;
}
console.log("Remaining buttons open:", count);
