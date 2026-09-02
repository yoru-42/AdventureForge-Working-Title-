import fs from 'fs';
const content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

let stack = [];
for (let i = 7179; i < 7780; i++) {
    let str = lines[i].replace(/`[^`]*`/g, '').replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
    let regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
        let tag = match[1];
        let full = match[0];
        if (full.endsWith('/>')) continue;
        if (['br', 'img', 'input', 'hr'].includes(tag)) continue;
        if (full.startsWith('</')) {
            if (stack.length && stack[stack.length - 1].tag === tag) {
                stack.pop();
            } else {
                console.log("Unmatched closing:", tag, "at line", i + 1);
            }
        } else {
            stack.push({tag, line: i + 1});
        }
    }
}
console.log("Remaining open:");
stack.forEach(s => console.log(s.tag, s.line));
