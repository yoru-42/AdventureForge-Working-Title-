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

const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics && diagnostics.length > 0) {
    diagnostics.forEach(diag => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
        console.log(`Error at line ${line + 1}, col ${character + 1}: ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
    });
} else {
    console.log("No syntax errors found.");
}
