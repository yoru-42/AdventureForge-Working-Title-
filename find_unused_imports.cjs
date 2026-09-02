const fs = require('fs');
const ts = require('typescript');

const content = fs.readFileSync('components/GameView.tsx', 'utf8');
const sourceFile = ts.createSourceFile(
  'GameView.tsx',
  content,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

let imports = [];
function traverse(node) {
    if (ts.isImportDeclaration(node)) {
        if (node.importClause && node.importClause.namedBindings) {
            const bindings = node.importClause.namedBindings;
            if (ts.isNamedImports(bindings)) {
                bindings.elements.forEach(el => imports.push(el.name.text));
            }
        }
    }
    ts.forEachChild(node, traverse);
}
traverse(sourceFile);

imports.forEach(i => {
    // very naive regex
    let re = new RegExp('<' + i + '(\\s|>)');
    let re2 = new RegExp(i + '\\s*\\(');
    let re3 = new RegExp(i + '\\s*\\=');
    if (!content.match(re) && !content.match(re2) && !content.match(re3)) {
        // check if used somewhere
        let count = (content.match(new RegExp('\\b' + i + '\\b', 'g')) || []).length;
        if (count === 1) { // only the import
            console.log("Unused import:", i);
        }
    }
});
