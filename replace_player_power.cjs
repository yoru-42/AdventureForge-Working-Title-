const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf8');

const replacement = `      const playerPowers = player.campaignPowerLevels ? Object.entries(player.campaignPowerLevels).map(([k, v]: any) => \`\${k} (Aktuell: \${v.value}, Potenzial: \${v.potentialMax})\`).join(', ') : '';
      const playerPowerInstruction = playerPowers ? \`\\n      - Macht-Einstufungen: \${playerPowers}\` : '';
      
      const profileInfo = userProfile ? \``;

content = content.replace(/      const profileInfo = userProfile \? `/g, replacement);

const target2 = `      - Kräfte & Fähigkeiten: \${getPlayerAbilitiesFormat()}`;
const replacement2 = `      - Kräfte & Fähigkeiten: \${getPlayerAbilitiesFormat()}\${playerPowerInstruction}`;
content = content.replace(new RegExp(target2.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), replacement2);

fs.writeFileSync('components/GameView.tsx', content);
console.log('Replaced all occurrences successfully');
