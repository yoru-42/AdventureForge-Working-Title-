const fs = require('fs');

const compIds = [];
for (let i = 1; i <= 4; i++) {
  const code = fs.readFileSync('lib/professionTierCompetenciesPart' + i + '.ts', 'utf8');
  const compMatch = code.match(/^  [a-zA-Z0-9_]+:\s*{/gm);
  if (compMatch) {
    compMatch.forEach(m => {
      compIds.push(m.replace(':', '').replace('{', '').trim());
    });
  }
}

const treeCode = fs.readFileSync('lib/professionTreeData.ts', 'utf8');
const treeMatch = treeCode.match(/id:\s*'([^']+)'/g) || [];
const treeIds = treeMatch.map(m => m.match(/'([^']+)'/)[1]);

const progCode = fs.readFileSync('lib/professionProgressionData.ts', 'utf8');
const progMatch = progCode.match(/branchKey:\s*'([^']+)'/g) || [];
const progIds = progMatch.map(m => m.match(/'([^']+)'/)[1]);

const allExistingIds = new Set([...treeIds, ...progIds]);
const uniqueCompIds = [...new Set(compIds)];

const missingInTree = uniqueCompIds.filter(id => !allExistingIds.has(id));
console.log('Total Missing:', missingInTree.length);
console.log('Missing:', missingInTree.join(', '));
