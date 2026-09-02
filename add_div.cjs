const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/\s*\);\s*\};\s*export default GameView;\s*$/g, '\n                  </div>\n  );\n};\nexport default GameView;\n');
fs.writeFileSync('components/GameView.tsx', content);
