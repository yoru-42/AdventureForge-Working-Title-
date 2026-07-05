const fs = require('fs');
let content = fs.readFileSync('components/AdventureEditor.tsx', 'utf-8');

content = content.replace(
  /useState\(mode === GameViewMode.JOIN_CUSTOM_CHAR \? 3 : 1\);/,
  "useState(mode === GameViewMode.JOIN_CUSTOM_CHAR ? 4 : 1);"
);

content = content.replace(/\{step\} von 5/g, '{step} von 6');
content = content.replace(/step < 5/g, 'step < 6');

content = content.replace(/\{step === 5 && \(/g, '{step === 6 && (');
content = content.replace(/\{step === 4 && \(/g, '{step === 5 && (');
content = content.replace(/\{step === 3 && \(/g, '{step === 4 && (');
content = content.replace(/\{step === 2 && mode !== GameViewMode\.JOIN_CUSTOM_CHAR && \(/g, '{step === 3 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (');

fs.writeFileSync('components/AdventureEditor.tsx', content);
console.log('Replaced steps');
