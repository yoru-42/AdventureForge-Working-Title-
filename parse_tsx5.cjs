const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('components/GameView.tsx', 'utf8');
const sourceFile = ts.createSourceFile('GameView.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics.length > 0) {
    const d = diagnostics[0];
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start);
    console.log(`First error at line ${line + 1}: ${d.messageText}`);
    
    // Find the parent node
    let current = sourceFile;
    function findNode(node) {
        if (d.start >= node.getStart() && d.start < node.getEnd()) {
            current = node;
            ts.forEachChild(node, findNode);
        }
    }
    findNode(sourceFile);
    console.log("Error inside node kind:", ts.SyntaxKind[current.kind]);
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(current.getStart());
    console.log("Node starts at line:", startLine + 1);
    console.log("Node text preview:", current.getText().substring(0, 100));
}
