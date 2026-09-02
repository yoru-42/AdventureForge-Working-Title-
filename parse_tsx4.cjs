const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('components/GameView.tsx', 'utf8');
const sourceFile = ts.createSourceFile('GameView.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function walk(node, depth) {
    if (ts.isJsxElement(node)) {
        const open = node.openingElement.tagName.getText();
        const close = node.closingElement.tagName.getText();
        const { line: l1 } = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart());
        const { line: l2 } = sourceFile.getLineAndCharacterOfPosition(node.closingElement.getStart());
        
        // If the open and close tags have different names or if the closing tag is at the very end of the file unexpectedly.
        if (open !== close || (open === '' && close === '')) {
             console.log(`Mismatch: <${open}> at ${l1+1} with </${close}> at ${l2+1}`);
        }
        
        // check for missing closing tags that typescript patches with ""
        if (node.closingElement.getFullText().trim() === '') {
             console.log(`Empty closing text: <${open}> at ${l1+1}`);
        }
    }
    ts.forEachChild(node, n => walk(n, depth + 1));
}
walk(sourceFile, 0);
