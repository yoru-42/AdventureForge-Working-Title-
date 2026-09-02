const fs = require('fs');
const esbuild = require('esbuild');

const content = fs.readFileSync('components/GameView.tsx', 'utf-8');

esbuild.transform(content, { loader: 'tsx' }).then(() => {
    console.log("Syntax is OK");
}).catch(e => {
    console.error("Syntax Error:", e.message);
});
