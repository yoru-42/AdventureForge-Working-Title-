import fs from 'fs';

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
// Remove block comments
content = content.replace(/\/\*[\s\S]*?\*\//g, '');
// Remove line comments
content = content.replace(/\/\/.*/g, '');

let open = 0;
let i = 0;
while (i < content.length) {
    if (content.substr(i, 4) === '<div') {
        open++;
        i += 4;
    } else if (content.substr(i, 5) === '</div') {
        open--;
        i += 5;
    } else if (content.substr(i, 2) === '/>') {
        // Wait, what if it's <div ... />?
        // Let's just find <div and </div> and <div />.
        i++;
    } else {
        i++;
    }
}
console.log("Difference:", open);
