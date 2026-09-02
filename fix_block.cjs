const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
content = content.replace(/<\/div><\/div><\/div>\n        <\/>/g, '</div>\n          </div>\n        </>');
fs.writeFileSync('components/GameView.tsx', content);
