const fs = require('fs');

let content = fs.readFileSync('components/GameView.tsx', 'utf8');

// Fix BodySilhouette props
content = content.replace(
    /<BodySilhouette[\s\S]*?\/>/g,
    `<BodySilhouette player={adventure.player} />`
);

// Fix setAdventure
content = content.replace(/setAdventure\(prev => \(\{ \.\.\.prev, combatState: \{ \.\.\.prev\.combatState, isCombatActive: false \} \}\)\);/g, '');

fs.writeFileSync('components/GameView.tsx', content);
