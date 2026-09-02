const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

let open = 0;
for (let i = 7180; i < 7780; i++) {
    const line = lines[i];
    let inString = false;
    let inTemplate = false;
    let escape = false;
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"' && !inTemplate) { inString = !inString; continue; }
        if (char === "'" && !inTemplate) { inString = !inString; continue; }
        if (char === '`' && !inString) { inTemplate = !inTemplate; continue; }
        
        if (!inString && !inTemplate) {
            if (char === '(') open++;
            if (char === ')') open--;
        }
    }
}
console.log("Open parens:", open);
