const { execSync } = require('child_process');
const fs = require('fs');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

while (true) {
    try {
        execSync('npx esbuild components/GameView.tsx --jsx=preserve', { stdio: 'pipe' });
        console.log("Success! File is perfectly balanced.");
        break;
    } catch (err) {
        const output = err.stderr.toString();
        if (output.includes('Unexpected end of file before a closing "div" tag') || output.includes('The character "}" is not valid inside a JSX element') || output.includes('Expected "}" but found "]"') || output.includes('Unexpected end of file')) {
            // we need another div before the end
            // The file ends with:
            //   );
            // };
            // export default GameView;
            
            // Insert </div> before the );
            content = content.replace(/\s*\);\s*\};\s*export default GameView;\s*$/g, '\n                  </div>\n  );\n};\nexport default GameView;\n');
            fs.writeFileSync('components/GameView.tsx', content);
            console.log("Added </div>");
        } else {
            console.log("Unknown error:");
            console.log(output);
            break;
        }
    }
}
