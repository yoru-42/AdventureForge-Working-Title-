const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

const targetStr = `4. Passe im [[STATUS]] Block die HP-Werte für Spieler und Gegner an, wenn sie sich ändern! Z.B. [[STATUS: Gegner_HP=\${enemyHp}, Spieler_HP=\${playerHp}]]. Wenn der Gegner in diesem Zug Schaden verursacht, ziehe diesen direkt im Status ab (z.B. falls der Gegner trifft und 15 Schaden verursacht, schreibe [[STATUS: Spieler_HP=\${Math.max(0, playerHp - 15)}]]).`;
const replacementStr = `4. Passe im [[STATUS]] Block die HP- und MP-Werte für Spieler und Gegner an, wenn sie sich ändern! Z.B. [[STATUS: Gegner_HP=\${enemyHp}, Spieler_HP=\${playerHp}, Spieler_MP=\${playerMp}]]. Wenn der Gegner in diesem Zug Schaden verursacht, ziehe diesen direkt im Status ab (z.B. Spieler_HP=\${Math.max(0, playerHp - 15)}). Wenn der Spieler einen Skill nutzt der Mana kostet, ziehe auch MP ab (z.B. Spieler_MP=\${Math.max(0, playerMp - 20)}).`;

content = content.split(targetStr).join(replacementStr);

fs.writeFileSync('components/GameView.tsx', content);
console.log('Replaced');
