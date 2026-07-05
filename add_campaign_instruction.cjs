const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

const campaignInstructionSnippet = `
      // build campaign power settings instruction
      let campaignPowerInstruction = '';
      if (world.campaignPowerSettings) {
        const powerDetails = Object.entries(world.campaignPowerSettings).map(([key, val]) => \`- \${key}: \${val}/100\`).join('\\n      ');
        campaignPowerInstruction = \`KAMPAGNEN-GRUNDWERTE (Kräftedifferenz):\\n      \${powerDetails}\\n      Diese Werte definieren das grundsätzliche Machtniveau und die Kräftedifferenz dieser Dimensionen in der Welt. Beziehe diese Skalierung in Konflikte und Problemlösungen mit ein.\`;
      }
`;

content = content.replace(/(const loreInstruction = )/, campaignInstructionSnippet + '\n      $1');

// there are two places where systemInstruction is built
content = content.replace(/\$\{loreInstruction\}/g, '${campaignPowerInstruction}\n      ${loreInstruction}');

fs.writeFileSync('components/GameView.tsx', content);
console.log('Added campaign power instruction');
