import fs from 'fs';
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
let lines = content.split('\n');

// Let's strip comments and string literals
content = content.replace(/\/\*[\s\S]*?\*\//g, '');
content = content.replace(/\/\/.*/g, '');
content = content.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');

// Find start of return (
let returnMatch = content.match(/return\s*\(\s*<div/);
console.log("Return starts at index:", returnMatch.index);

let sub = content.substring(returnMatch.index);
let depth = 0;
let i = 0;
while (i < sub.length) {
    if (sub.substring(i, i+4) === '<div') {
        depth++;
        i+=4;
    } else if (sub.substring(i, i+5) === '</div') {
        depth--;
        i+=5;
        if (depth === 0) {
            console.log("Root div closes at relative index:", i);
            let nextText = sub.substring(i, i+50).trim();
            console.log("Following text:", nextText);
            break;
        }
    } else {
        i++;
    }
}
console.log("Final depth:", depth);
