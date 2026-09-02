const fs = require('fs');
const content = fs.readFileSync('components/GameView.tsx', 'utf-8');

let curly = 0;
let paren = 0;
let square = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curly++;
    if (char === '}') curly--;
    if (char === '(') paren++;
    if (char === ')') paren--;
    if (char === '[') square++;
    if (char === ']') square--;
}
console.log('curly:', curly);
console.log('paren:', paren);
console.log('square:', square);
