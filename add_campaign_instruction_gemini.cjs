const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf-8');

const campaignSnippetForGen = `
      let campaignPowerInstruction = '';
      if (world.campaignPowerSettings) {
        const powerDetails = Object.entries(world.campaignPowerSettings).map(([key, val]) => \`- \${key}: \${val}/100\`).join('\\n');
        campaignPowerInstruction = \`KAMPAGNEN-GRUNDWERTE (Kräftedifferenz):\\n\${powerDetails}\\n\`;
      }
`;

content = content.replace(/(const systemInstruction = \`Du bist ein Weltklasse Dungeon Master für "\$\{world\.title\}"\.\n)/, campaignSnippetForGen + '\n      $1${campaignPowerInstruction}');

fs.writeFileSync('services/geminiService.ts', content);
console.log('Added campaign power to geminiService');
