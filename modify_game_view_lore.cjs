const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf8');

const replacement = `          sorted.forEach(e => {
            const secretTag = !e.isUnlocked ? ' [GEHEIM: Der Spieler weiß das noch nicht! Bringe es organisch in die Story ein]' : '';
            let extraDetails = '';
            
            if (cat === 'Charaktere' && e.details) {
              const d = e.details;
              const traits = [];
              if (d.role) traits.push(\`Rolle: \${d.role}\`);
              if (d.gender || d.age) traits.push(\`Aussehen: \${d.gender || ''} \${d.age ? d.age + 'J' : ''}\`.trim());
              if (d.goal) traits.push(\`Ziel: \${d.goal}\`);
              
              if (d.campaignPowerLevels) {
                const powers = Object.entries(d.campaignPowerLevels).map(([k, v]) => \`\${k} (Aktuell: \${v.value}, Potenzial: \${v.potentialMax})\`);
                if (powers.length > 0) {
                  traits.push(\`Machtniveau: \${powers.join(', ')}\`);
                }
              }
              if (traits.length > 0) {
                extraDetails = \` | Details: \${traits.join('. ')}\`;
              }
            }
            
            loreInstruction += \`- \${e.title}\${e.order !== undefined && cat === 'Events' ? \` (#\${e.order})\` : ''}\${secretTag}: \${e.description}\${extraDetails}\\n\`;
          });`;

content = content.replace(/          sorted\.forEach\(e => \{\n            const secretTag = !e\.isUnlocked \? ' \[GEHEIM: Der Spieler weiß das noch nicht! Bringe es organisch in die Story ein\]' : '';\n            loreInstruction \+= `- \$\{e\.title\}\$\{e\.order !== undefined && cat === 'Events' \? ` \(#\$\{e\.order\}\)` : ''\}\$\{secretTag\}: \$\{e\.description\}\\n`;\n          \}\);/g, replacement);

fs.writeFileSync('components/GameView.tsx', content);
