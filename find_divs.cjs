const fs = require('fs');
const { execSync } = require('child_process');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');
let targetIdx = -1;
for (let i = 7180; i < 7800; i++) {
    if (lines[i] && lines[i].includes('</>') && lines[i+1] && lines[i+1].includes(') : (')) {
        targetIdx = i;
        break;
    }
}
if (targetIdx === -1) process.exit(1);

for (let divs = 1; divs <= 5; divs++) {
    let testLines = [...lines];
    testLines.splice(targetIdx, 0, '</div>'.repeat(divs));
    fs.writeFileSync('components/GameView.tsx', testLines.join('\n'));
    try {
        console.log(`\nTesting with ${divs} divs before </>...`);
        let out = execSync('npm run lint', { encoding: 'utf-8' });
        console.log("Success?");
    } catch (e) {
        console.log("Errors start with:");
        console.log(e.stdout.split('\n').slice(4, 8).join('\n'));
    }
}
