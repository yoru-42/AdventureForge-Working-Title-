const fs = require('fs');
let code = fs.readFileSync('lib/professionTreeData.ts', 'utf8');

// Match my exact injected blocks
const injectionRegex = /,?\s*\{\s*id:\s*'[^']+',\s*fieldId:\s*'[^']+',\s*name:\s*'[^']+',\s*tier:\s*'beruf',\s*parentIds:\s*\['[^']+'\],\s*childIds:\s*\[\],\s*description:\s*'Ausgebildete Fachkraft im Bereich[^']+',\s*prerequisites:\s*\[\],\s*careerRoutes:\s*\[\],\s*suggestedCompetencies:\s*\[\],\s*possibleRanks:\s*\['[^']+',\s*'[^']+'\]\s*\}/g;

const origLength = code.length;
code = code.replace(injectionRegex, '');

// Clean up any remaining trailing commas inside careerRoutes arrays
code = code.replace(/,\s*\]/g, ']');

fs.writeFileSync('lib/professionTreeData.ts', code);
console.log('Original length:', origLength, 'New length:', code.length);
