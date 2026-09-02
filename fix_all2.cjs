const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

// Find the line that has `        </>` right before `      ) : (`
let targetIdx = -1;
for (let i = 7600; i < 7900; i++) {
    if (lines[i] && lines[i].includes(') : (') && lines[i - 1].includes('</>')) {
        targetIdx = i - 1;
        break;
    }
}
// Remove the incorrectly inserted line at 7605
let cleanLines = lines.filter(l => !l.includes('</div></div></div>'));

if (targetIdx !== -1) {
    // Find new idx
    let newTarget = -1;
    for (let i = 7600; i < 7900; i++) {
        if (cleanLines[i] && cleanLines[i].includes(') : (') && cleanLines[i - 1].includes('</>')) {
            newTarget = i - 1;
            break;
        }
    }
    if (newTarget !== -1) {
        cleanLines.splice(newTarget, 0, '            </div></div></div>');
    }
}

let newContent = cleanLines.join('\n');
fs.writeFileSync('components/GameView.tsx', newContent);
