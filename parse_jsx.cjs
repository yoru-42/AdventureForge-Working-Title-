const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

// A very simple tag matcher
const lines = content.split('\n');
let openTags = [];

for (let i = 7180; i < 7780; i++) {
    const line = lines[i];
    // Find all <tag> and </tag>
    const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        if (fullTag.endsWith('/>')) continue; // self closing
        if (['br', 'img', 'hr', 'input'].includes(tagName.toLowerCase())) continue; // void elements
        
        if (fullTag.startsWith('</')) {
            // closing tag
            if (openTags.length > 0 && openTags[openTags.length - 1].name === tagName) {
                openTags.pop();
            } else {
                console.log(`Mismatch at line ${i+1}: expected ${openTags.length > 0 ? openTags[openTags.length-1].name : 'none'}, found ${tagName}`);
            }
        } else {
            openTags.push({name: tagName, line: i+1});
        }
    }
}
console.log("Remaining open tags:");
openTags.forEach(t => console.log(t.name, "at line", t.line));
