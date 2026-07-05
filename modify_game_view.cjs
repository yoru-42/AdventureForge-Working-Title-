const fs = require('fs');
let content = fs.readFileSync('components/GameView.tsx', 'utf-8');

// Replace startCombat
content = content.replace(
  /const startCombat = async \(enemyId: string, customName\?: string\) => \{[\s\S]*?await sendActionText\([\s\S]*?\);\n  \};/,
  `const startCombat = (enemyId: string, customName?: string) => {
    setIsCombatActive(true);
    setSelectedEnemyId(enemyId);
    if (enemyId === 'custom' && customName) {
      setCustomEnemyName(customName);
    }
    
    // Wir setzen HP/MP nur einmalig falls sie 0 sind (zur Bequemlichkeit)
    const isHero = adventure.world.isHeroic !== false;
    const initialPlayerHp = isHero ? 150 : 100;
    const initialPlayerMp = isHero ? 120 : 80;
    if (playerMaxHp === 0) {
      setPlayerHp(initialPlayerHp);
      setPlayerMaxHp(initialPlayerHp);
    }
    if (playerMaxMp === 0) {
      setPlayerMp(initialPlayerMp);
      setPlayerMaxMp(initialPlayerMp);
    }
    
    let ehp = 100;
    if (adventure.world.dramaLevel === 'Hoch') ehp = 150;
    else if (adventure.world.dramaLevel === 'Niedrig') ehp = 75;
    
    if (enemyMaxHp === 0) {
      setEnemyHp(ehp);
      setEnemyMaxHp(ehp);
    }
    
    setCombatSubMenu('main');
    setIsCombatMenuExpanded(!isCombatMenuExpanded);
  };`);

// Replace handleCombatAction
content = content.replace(
  /const handleCombatAction = async \(actionType: string, actionDetail: string, dmgDealt: number, mpCost: number, isHeal: boolean = false\) => \{[\s\S]*?await sendActionText\(actionText\);\n  \};/,
  `const handleCombatAction = (actionType: string, actionDetail: string, dmgDealt: number, mpCost: number, isHeal: boolean = false) => {
    if (mpCost > 0 && playerMp < mpCost) {
      setError("Nicht genügend MP/Chakra für diese Fähigkeit!");
      return;
    }

    const enemyName = getActiveEnemyName();
    
    let actionText = "";
    if (actionType === 'attack') {
      actionText = \`*Ich greife \${enemyName} mutig an!*\`;
    } else if (actionType === 'skill') {
      if (isHeal) {
        actionText = \`*Ich konzentriere mich und bereite die Fähigkeit '\${actionDetail}' auf mich selbst vor!*\`;
      } else {
        actionText = \`*Ich fokussiere meine Kraft und bereite '\${actionDetail}' gegen \${enemyName} vor!*\`;
      }
    } else if (actionType === 'defend') {
      actionText = \`*Ich bereite mich vor und wähle die defensive Haltung: \${actionDetail}.* Ich achte genau auf die Bewegungen von \${enemyName}!*\`;
    } else if (actionType === 'item') {
      actionText = \`*Ich hole hastig das Item '\${actionDetail}' hervor um es einzusetzen!*\`;
    } else if (actionType === 'flee') {
      actionText = \`*Ich breche den Kampf ab und versuche vor \${enemyName} zu fliehen!*\`;
      setIsCombatActive(false);
      setIsCombatMenuExpanded(false);
    }
    
    if (actionText) {
      setInputText(prev => prev ? prev + '\\n' + actionText : actionText);
      setIsCombatMenuExpanded(false);
    }
  };`);

fs.writeFileSync('components/GameView.tsx', content);
console.log('Done');
