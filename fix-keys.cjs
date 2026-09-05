const fs = require('fs');

const { execSync } = require('child_process');

// Find all lines with key={*.id}
const output = execSync('grep -rn "key={.*\\.id}" components/ App.tsx', { encoding: 'utf8' });
console.log(output);
