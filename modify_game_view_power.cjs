const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

const powerFunction = `
const calculateCombatPower = (char?: any) => {
  if (!char) return 100;
  let power = 50; // base power
  if (char.attributes) {
    char.attributes.forEach((attr: any) => power += attr.value);
  }
  if (char.abilities) {
    char.abilities.forEach((ability: any) => {
      power += 50;
      if (ability.techniqueList) {
        power += ability.techniqueList.length * 20;
      } else if (ability.techniques) {
        power += ability.techniques.split(',').length * 20;
      }
    });
  }
  if (char.skills) {
    power += char.skills.split(',').length * 15;
  }
  if (char.campaignPowerLevels) {
    Object.values(char.campaignPowerLevels).forEach((lvl: any) => {
      if (lvl && typeof lvl.value === 'number') {
        power += lvl.value;
      }
    });
  }
  return power;
};
`;

// Insert after imports:
content = content.replace(/(import .*;\n)(?=\n*interface)/, '$1\n' + powerFunction + '\n');

// Add power display in combat UI:
const combatUIRegex = /<div className="flex flex-col gap-1 w-1\/2">([\s\S]*?)<div className="text-\[10px\] font-bold text-slate-300">Gegner/;
if (content.match(combatUIRegex)) {
  content = content.replace(combatUIRegex, `<div className="flex flex-col gap-1 w-1/2 xs:w-auto flex-1">$1<div className="text-[10px] font-bold text-slate-300">Gegner <span className="text-[9px] text-amber-500 ml-1">(Kampfkraft: {calculateCombatPower(selectedEnemyId === 'custom' ? undefined : adventure.npcs.find(n => n.id === selectedEnemyId))})</span>`);
} else {
  console.log("Could not find enemy combat UI header");
}

const playerCombatUIRegex = /<div className="flex flex-col gap-1 w-1\/2 text-right">([\s\S]*?)<div className="text-\[10px\] font-bold text-slate-300">(\{player\.name\}|Spieler)/;
if (content.match(playerCombatUIRegex)) {
  content = content.replace(playerCombatUIRegex, `<div className="flex flex-col gap-1 w-1/2 xs:w-auto flex-1 text-right">$1<div className="text-[10px] font-bold text-slate-300"><span className="text-[9px] text-blue-400 mr-1">(Kampfkraft: {calculateCombatPower(adventure.player)})</span> $2`);
} else {
  console.log("Could not find player combat UI header");
}

fs.writeFileSync('components/GameView.tsx', content);
console.log('Done Power');
