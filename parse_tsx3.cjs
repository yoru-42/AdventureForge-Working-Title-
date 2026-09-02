const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('components/GameView.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
    'GameView.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

function findUnclosed(node) {
    if (ts.isJsxElement(node)) {
        if (node.closingElement.pos === node.closingElement.end) {
            // Unclosed!
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            console.log(`Unclosed JSX Element <${node.openingElement.tagName.getText()}> at line ${line + 1}`);
        }
    }
    ts.forEachChild(node, findUnclosed);
}
findUnclosed(sourceFile);
