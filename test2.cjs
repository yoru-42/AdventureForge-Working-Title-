const fs = require('fs');
const { execSync } = require('child_process');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/\n*<\/div>\n*  \);\n};\nexport default GameView;?\n*$/g, '');
content = content.replace(/export default GameView;?\n*$/, '');
// remove previous insertions
content = content.replace(/<\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/div>/g, '</div>');
content = content.replace(/<\/div><\/div><\/div><\/div><\/div>/g, '');

const lines = content.split('\n');
let targetIdx = -1;
for (let i = 7180; i < 7800; i++) {
    if (lines[i] && lines[i].includes('</>') && lines[i+1] && lines[i+1].includes(') : (')) {
        targetIdx = i;
        break;
    }
}
if (targetIdx !== -1) {
    lines.splice(targetIdx, 0, '</div></div>');
}

content = lines.join('\n');

for (let i = 0; i < 10; i++) {
    let testContent = content + '\n' + '</div>\n'.repeat(i) + '  );\n};\nexport default GameView;\n';
    fs.writeFileSync('components/GameView.tsx', testContent);
    try {
        console.log(`Testing with ${i} trailing divs...`);
        execSync('npm run build', { stdio: 'ignore' });
        console.log(`SUCCESS with ${i} trailing divs!`);
        process.exit(0);
    } catch (e) {
    }
}
console.log("Failed again");
