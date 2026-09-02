const fs = require('fs');
const { execSync } = require('child_process');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

for (let divs = 0; divs < 15; divs++) {
    let extraDivs = Array(divs).fill('</div>').join('\n');
    let testContent = content.replace(/export default GameView;\n*$/, extraDivs + '\nexport default GameView;\n');
    fs.writeFileSync('components/GameView.tsx', testContent);
    try {
        console.log(`Testing with ${divs} extra divs...`);
        execSync('npm run build', { stdio: 'ignore' });
        console.log(`Success with ${divs} extra divs!`);
        process.exit(0);
    } catch (e) {
        // failed
    }
}
console.log("Failed again");
