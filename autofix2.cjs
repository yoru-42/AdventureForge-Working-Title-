const fs = require('fs');
const { execSync } = require('child_process');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
// Clean up any extra tags at the end
content = content.replace(/\n*<\/div>\n*  \);\n};\nexport default GameView;?\n*$/g, '');
content = content.replace(/export default GameView;?\n*$/, '');
// Also clean up my previous failed attempt
content = content.replace(/\n*<\/div><\/div>.*/g, '');

for (let divs = 0; divs < 10; divs++) {
    let testContent = content + '\n' + '</div>\n'.repeat(divs) + '  );\n};\nexport default GameView;\n';
    fs.writeFileSync('components/GameView.tsx', testContent);
    try {
        console.log(`Testing with ${divs} closing divs...`);
        execSync('npm run build', { stdio: 'ignore' });
        console.log(`Success with ${divs} closing divs!`);
        process.exit(0);
    } catch (e) {
        // Failed, continue
    }
}
console.log("Failed to auto-fix.");
