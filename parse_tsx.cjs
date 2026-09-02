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

function traverse(node) {
    // If it's a JSX element without a matching close tag, TS might create a JsxElement with empty or weird close tag
    if (ts.isJsxElement(node)) {
        const open = node.openingElement.tagName.getText();
        const close = node.closingElement.tagName.getText();
        if (open !== close) {
            console.log(`Mismatch at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: <${open}> matched with </${close}>`);
        }
    }
    ts.forEachChild(node, traverse);
}

traverse(sourceFile);
