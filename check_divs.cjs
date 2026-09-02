const fs = require('fs');
const content = fs.readFileSync('components/GameView.tsx', 'utf-8');
const lines = content.split('\n');

let open = 0;
let inFragment = false;
let fragmentStart = 7179;
let fragmentEnd = 7779;

for (let i = fragmentStart; i < fragmentEnd; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    open += (opens - closes);
    if (open < 0) {
        console.log("Negative open at line", i);
    }
}
console.log("Remaining open divs inside fragment:", open);
