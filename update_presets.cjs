const fs = require('fs');

let code = fs.readFileSync('components/jobPresets.ts', 'utf8');

// Add to natur_landwirtschaft
code = code.replace(
  '"Förster",',
  '"Förster",\n      "Waldhüter",\n      "Waldläuferin",\n      "Jägerin",\n      "Kräuterfrau",\n      "Kräutersammlerin",'
);

// Add to medizin
code = code.replace(
  '"Heiler",',
  '"Heiler",\n      "Heilerin",'
);
code = code.replace(
  '"Kräuterkundiger",',
  '"Kräuterkundiger",\n      "Kräuterkundige",'
);

// Add some female forms as AI loves to output them
code = code.replace(
  '"Bauer",',
  '"Bauer",\n      "Bäuerin",'
);
code = code.replace(
  '"Koch",',
  '"Koch",\n      "Köchin",'
);
code = code.replace(
  '"Hexe",',
  '"Hexe",\n      "Magierin",'
);

// Add to magie if Hexe is missing
if (!code.includes('"Hexe",')) {
  code = code.replace(
    '"Magier",',
    '"Magier",\n      "Magierin",\n      "Hexe",\n      "Hexer",'
  );
}

fs.writeFileSync('components/jobPresets.ts', code);
console.log('Presets updated');
