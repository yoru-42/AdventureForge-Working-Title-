const fs = require('fs');

let content = fs.readFileSync('components/GameView.tsx', 'utf8');

content = content.replace(/handleSendMessage\(\);/g, 'handleSend();');
content = content.replace(/onClick=\{handleSendMessage\}/g, 'onClick={handleSend}');
content = content.replace(/isGenerating/g, 'isLoading');

fs.writeFileSync('components/GameView.tsx', content);
