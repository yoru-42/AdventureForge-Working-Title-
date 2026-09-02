const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

// Find the line with `        </>` and `      ) : (`
let targetIdx = -1;
for (let i = 7179; i < 7800; i++) {
    if (lines[i] && lines[i].includes('</>')) {
        targetIdx = i;
        break;
    }
}
if (targetIdx !== -1) {
    lines.splice(targetIdx, 0, '            </div></div></div>');
}

let newContent = lines.join('\n');
fs.writeFileSync('components/GameView.tsx', newContent);
