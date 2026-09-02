const fs = require('fs');

let content = fs.readFileSync('components/GameView.tsx', 'utf-8');
let lines = content.split('\n');

// We know 9363 is the closing )} of the ToneMenu.
// Let's insert a </div> at 9364 to close the relative div of 9327.
lines.splice(9364, 0, '                  </div>');
fs.writeFileSync('components/GameView.tsx', lines.join('\n'));
