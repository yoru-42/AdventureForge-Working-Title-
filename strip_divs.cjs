const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/(?:\s*<\/div>\s*)+\s*\);\s*\};\s*export default GameView;\s*$/g, '\n  );\n};\nexport default GameView;\n');
fs.writeFileSync('components/GameView.tsx', content);
