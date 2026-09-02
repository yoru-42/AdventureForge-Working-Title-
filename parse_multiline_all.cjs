const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<[a-zA-Z0-9]+/g) || []).length;
    const closes = (line.match(/>/g) || []).length;
    if (opens > closes && !line.includes('</')) {
        console.log("Possible multiline open tag at line", i+1, ":", line.trim());
    }
}
