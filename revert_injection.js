const fs = require('fs');

let code = fs.readFileSync('lib/professionTreeData.ts', 'utf8');

// The objects I injected all start with `      {\n        id: '` and contain `\n        fieldId: '` and `\n        tier: 'beruf',\n` and have exactly the format I generated.
// Actually, it's easier to find any block inside `careerRoutes: [` that has `fieldId:`.
// Because `ProfessionCareerRoute` does not have `fieldId`.

let fixedCode = code;

// Regex to find injected blocks:
// They look like:
//       {
//         id: 'some_id',
//         fieldId: 'some_field',
//         name: 'Some Name',
//         tier: 'beruf',
//         ...
//       }
// And they are separated by commas.
// Wait, I can just use a regex to match the exact string I generated and move them out of `careerRoutes` into `nodes`.
// Or even simpler: just delete them and re-run a better script.

const injectionRegex = /\s*\{\s*id:\s*'[^']+',\s*fieldId:\s*'[^']+',\s*name:\s*'[^']+',\s*tier:\s*'beruf',\s*parentIds:\s*\['[^']+'\],\s*childIds:\s*\[\],\s*description:\s*'Ausgebildete Fachkraft im Bereich[^']+',\s*prerequisites:\s*\[\],\s*careerRoutes:\s*\[\],\s*suggestedCompetencies:\s*\[\],\s*possibleRanks:\s*\['[^']+',\s*'[^']+'\]\s*\}/g;

fixedCode = fixedCode.replace(injectionRegex, '');
// That will leave some trailing commas or weird formatting maybe.
// Let's do a more robust approach:
