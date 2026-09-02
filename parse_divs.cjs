const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');
let count = 0;
for(let i=7180; i<7780; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  count += opens - closes;
  if (count < 0) console.log("Negative at line", i+1, line);
}
console.log("Remaining divs open:", count);
