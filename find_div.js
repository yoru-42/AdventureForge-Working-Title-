import fs from 'fs';
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
let lines = content.split('\n');
let opens = 0;
let closes = 0;

for(let i = 7179; i < 7785; i++) {
    let l = lines[i];
    let os = (l.match(/<div(\s|>)/g) || []).length;
    let cs = (l.match(/<\/div>/g) || []).length;
    opens += os;
    closes += cs;
    console.log(`Line ${i+1} [+${os} -${cs}] (Total: ${opens - closes}) | ${l.trim()}`);
}
