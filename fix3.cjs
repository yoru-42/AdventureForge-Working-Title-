const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/export default GameView;?\n?$/, '');
content += `\n</div>\n  );\n};\nexport default GameView;\n`;
fs.writeFileSync('components/GameView.tsx', content);
