const fs = require('fs');
let content = fs.readFileSync('components/bodyConditionResolver.ts', 'utf8');

content = content.replace(
  'const clamped = Math.max(0, Math.min(100, Math.round(newIntensity)));',
  'const clamped = Math.max(0, Math.min(100, Math.round(newIntensity * 100) / 100));'
);

content = content.replace(
  'const transformationIntensityVal = Math.max(0, Math.min(100, rawIntensity));',
  'const transformationIntensityVal = Math.max(0, Math.min(100, Math.round(rawIntensity * 100) / 100));'
);

fs.writeFileSync('components/bodyConditionResolver.ts', content);
console.log('bodyConditionResolver.ts updated!');
