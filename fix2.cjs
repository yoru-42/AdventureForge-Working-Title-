const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/<\/div><\/div><\/div>/g, '</div>\n          </div>');
fs.writeFileSync('components/GameView.tsx', content);
