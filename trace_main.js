import fs from 'fs';
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
let lines = content.split('\n');

let mainStart = 6702; // 0-indexed for 6703
console.log("Main start at line", mainStart + 1);

let depth = 0;
for (let i = mainStart; i < lines.length; i++) {
    let l = lines[i];
    // strip string literals and comments roughly, but careful with JSX
    l = l.replace(/\/\/.*/g, '');
    let os = (l.match(/<div(\s|>)/g) || []).length;
    let cs = (l.match(/<\/div>/g) || []).length;
    depth += os - cs;
    
    // Check if we hit 0 depth inside the loop, meaning root closed.
    if (depth === 0 && os === 0 && cs > 0) {
        console.log(`Root closes at line ${i+1}`);
    }
}
console.log("Final depth:", depth);
