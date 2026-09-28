// -*- coding: utf-8 -*-
import {
  ProgressionService,
  DEFAULT_PROGRESSION_CONFIG,
  DEFAULT_DEVELOPMENT_PROFILES
} from '../services/progressionService';
import {
  ProgressionConfig,
  ProgressionState,
  CharacterAttribute,
  Character
} from '../types';

console.log('=== RUNNING PROGRESSION SYSTEM TESTS ===\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Modus A – Fester EP-Bedarf
// -----------------------------------------------------------------------------
console.log('--- Test 1: Modus A (Fester EP-Bedarf) ---');
const configFixed: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  epSystem: {
    enabled: true,
    requirementMode: 'fixed',
    baseRequirement: 100,
    levelGrowth: 20,
    rankGrowth: 50,
    multiplier: 1.0
  }
};

const reqLvl1 = ProgressionService.calculateXpRequirement(1, 'F', configFixed);
const reqLvl5 = ProgressionService.calculateXpRequirement(5, 'F', configFixed);
const reqLvl10 = ProgressionService.calculateXpRequirement(10, 'A', configFixed);

assert(reqLvl1 === 100, `Level 1 benötigt 100 EP (erhalten: ${reqLvl1})`);
assert(reqLvl5 === 100, `Level 5 benötigt ebenfalls 100 EP im festen Modus (erhalten: ${reqLvl5})`);
assert(reqLvl10 === 100, `Level 10 auf Rang A benötigt ebenfalls 100 EP (erhalten: ${reqLvl10})`);

// -----------------------------------------------------------------------------
// TEST 2: Modus B – Levelabhängiger EP-Bedarf
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Modus B (Levelabhängiger EP-Bedarf) ---');
const configLevelGrowth: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  epSystem: {
    enabled: true,
    requirementMode: 'level_growth',
    baseRequirement: 100,
    levelGrowth: 20,
    rankGrowth: 50,
    multiplier: 1.0
  }
};

const reqB1 = ProgressionService.calculateXpRequirement(1, 'F', configLevelGrowth);
const reqB2 = ProgressionService.calculateXpRequirement(2, 'F', configLevelGrowth);
const reqB3 = ProgressionService.calculateXpRequirement(3, 'F', configLevelGrowth);
const reqB4 = ProgressionService.calculateXpRequirement(4, 'F', configLevelGrowth);

assert(reqB1 === 100, `Level 1 benötigt 100 EP (erhalten: ${reqB1})`);
assert(reqB2 === 120, `Level 2 benötigt 120 EP (erhalten: ${reqB2})`);
assert(reqB3 === 140, `Level 3 benötigt 140 EP (erhalten: ${reqB3})`);
assert(reqB4 === 160, `Level 4 benötigt 160 EP (erhalten: ${reqB4})`);

// -----------------------------------------------------------------------------
// TEST 3: Modus C – Level- und rangabhängiger EP-Bedarf
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Modus C (Level- und rangabhängiger EP-Bedarf) ---');
const configRankGrowth: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  epSystem: {
    enabled: true,
    requirementMode: 'level_and_rank_growth',
    baseRequirement: 100,
    levelGrowth: 20,
    rankGrowth: 80,
    multiplier: 1.0
  }
};

// Rang F = Index 0 -> Base 100
const reqC_F1 = ProgressionService.calculateXpRequirement(1, 'F', configRankGrowth);
const reqC_F2 = ProgressionService.calculateXpRequirement(2, 'F', configRankGrowth);
// Rang E = Index 1 -> Base 100 + 80 = 180
const reqC_E1 = ProgressionService.calculateXpRequirement(1, 'E', configRankGrowth);
const reqC_E2 = ProgressionService.calculateXpRequirement(2, 'E', configRankGrowth);
// Rang D = Index 2 -> Base 100 + 160 = 260
const reqC_D1 = ProgressionService.calculateXpRequirement(1, 'D', configRankGrowth);

assert(reqC_F1 === 100, `F-Rang Level 1 benötigt 100 EP (erhalten: ${reqC_F1})`);
assert(reqC_F2 === 120, `F-Rang Level 2 benötigt 120 EP (erhalten: ${reqC_F2})`);
assert(reqC_E1 === 180, `E-Rang Level 1 benötigt 180 EP (erhalten: ${reqC_E1})`);
assert(reqC_E2 === 200, `E-Rang Level 2 benötigt 200 EP (erhalten: ${reqC_E2})`);
assert(reqC_D1 === 260, `D-Rang Level 1 benötigt 260 EP (erhalten: ${reqC_D1})`);

// -----------------------------------------------------------------------------
// TEST 4: Trennung von EP-Bedarf und EP-Gewinn (Entwicklungsrate & Profile)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Trennung EP-Bedarf vs. EP-Gewinn (Profile) ---');
const normalGain = ProgressionService.calculateEffectiveXpGain(100, DEFAULT_PROGRESSION_CONFIG, 'normal');
const fastGain = ProgressionService.calculateEffectiveXpGain(100, DEFAULT_PROGRESSION_CONFIG, 'fast');
const slowGain = ProgressionService.calculateEffectiveXpGain(100, DEFAULT_PROGRESSION_CONFIG, 'slow');

assert(normalGain === 100, `Normales Profil erhält 100 EP (erhalten: ${normalGain})`);
assert(fastGain === 150, `Schnelles Profil erhält 150 EP (1.5x) (erhalten: ${fastGain})`);
assert(slowGain === 75, `Langsames Profil erhält 75 EP (0.75x) (erhalten: ${slowGain})`);

// EP requirement scaling per profile
const normalReq = ProgressionService.calculateXpRequirement(1, 'F', DEFAULT_PROGRESSION_CONFIG, 'normal');
const slowReq = ProgressionService.calculateXpRequirement(1, 'F', DEFAULT_PROGRESSION_CONFIG, 'slow');
assert(normalReq === 100, `Normal EP-Bedarf = 100 (erhalten: ${normalReq})`);
assert(slowReq === 125, `Slow EP-Bedarf = 125 (1.25x Multiplikator) (erhalten: ${slowReq})`);

// -----------------------------------------------------------------------------
// TEST 5: Iteratives Level-Up & Rest-EP Erhaltung
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Iteratives Level-Up & Rest-EP Erhaltung ---');
const startState: ProgressionState = {
  level: 1,
  xp: 95,
  rank: 'F'
};

// Mode B: Lvl 1->2 benötigt 100 EP, Lvl 2->3 benötigt 120 EP
const res1 = ProgressionService.applyXpGain(startState, 50, configLevelGrowth);
// 95 + 50 = 145 EP. 145 >= 100 -> Level 2, Rest 45 EP. 45 < 120 -> Stop.
assert(res1.levelsGained === 1, `Genau 1 Level aufgestiegen (erhalten: ${res1.levelsGained})`);
assert(res1.newState.level === 2, `Neues Level ist 2 (erhalten: ${res1.newState.level})`);
assert(res1.newState.xp === 45, `Verbleibende EP sind 45 (erhalten: ${res1.newState.xp})`);
assert(res1.newState.xpNeeded === 120, `Nächster EP-Bedarf für Level 2 ist 120 (erhalten: ${res1.newState.xpNeeded})`);

// Großer EP-Gewinn mit mehrfachem Level-Up
const multiLevelState: ProgressionState = {
  level: 1,
  xp: 0,
  rank: 'F'
};
// Lvl 1->2: 100, Lvl 2->3: 120, Lvl 3->4: 140. Summe = 360 EP.
// Mit 380 EP: 3 Level-Ups (Lvl 4), Rest 20 EP.
const resMulti = ProgressionService.applyXpGain(multiLevelState, 380, configLevelGrowth);
assert(resMulti.levelsGained === 3, `3 Level-Ups erhalten (erhalten: ${resMulti.levelsGained})`);
assert(resMulti.newState.level === 4, `Neues Level ist 4 (erhalten: ${resMulti.newState.level})`);
assert(resMulti.newState.xp === 20, `Restliche EP sind 20 (erhalten: ${resMulti.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 6: Rangaufstieg (Rang vs. Level)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Rangaufstieg bei Erreichen der Levelgrenze ---');
const nearRankUpState: ProgressionState = {
  level: 9,
  xp: 0,
  rank: 'F'
};

// Im Standard-Config hat ein Rang 10 Level. Lvl 9->10 erfordert 260 EP, dann erfolgt Rangaufstieg nach E Level 1
const resRankUp = ProgressionService.applyXpGain(nearRankUpState, 300, DEFAULT_PROGRESSION_CONFIG);
assert(resRankUp.rankUps.length === 1, `Genau ein Rangaufstieg ausgelöst (erhalten: ${resRankUp.rankUps.length})`);
assert(resRankUp.rankUps[0].fromRank === 'F' && resRankUp.rankUps[0].toRank === 'E', `Aufstieg von F nach E`);
assert(resRankUp.newState.rank === 'E', `Neuer Rang ist E (erhalten: ${resRankUp.newState.rank})`);
assert(resRankUp.newState.level === 1, `Level wurde bei Rangaufstieg auf 1 zurückgesetzt (resetLevelOnRankUp: true)`);
assert(resRankUp.newState.xp === 40, `Verbleibende EP nach Rangaufstieg sind 40 (erhalten: ${resRankUp.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 7: Levelsystem ohne Rangsystem (Deaktiviertes Rangsystem)
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Levelsystem mit deaktiviertem Rangsystem ---');
const configNoRank: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  rankSystem: {
    enabled: false,
    ranks: [],
    requiresMaxLevelForRankUp: false
  },
  levelSystem: {
    enabled: true,
    levelsPerRank: 10,
    maxLevel: 50,
    resetLevelOnRankUp: false
  },
  epSystem: {
    enabled: true,
    requirementMode: 'level_growth',
    baseRequirement: 100,
    levelGrowth: 10,
    rankGrowth: 0,
    multiplier: 1.0
  }
};

const stateNoRank: ProgressionState = {
  level: 10,
  xp: 0
};

const resNoRank = ProgressionService.applyXpGain(stateNoRank, 500, configNoRank);
assert(resNoRank.rankUps.length === 0, `Kein Rangaufstieg wenn Rangsystem deaktiviert`);
assert(resNoRank.newState.level > 10, `Level steigt kontinuierlich über 10 hinaus (erhalten: ${resNoRank.newState.level})`);
assert(resNoRank.newState.rank === undefined, `Kein Rang gesetzt`);

// -----------------------------------------------------------------------------
// TEST 8: Attributsteigerung & Entwicklungspotenzial
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Attributsteigerung & Potenzial ---');
const testAttributes: CharacterAttribute[] = [
  { name: 'Stärke', value: 50, max: 200 },
  { name: 'Geschwindigkeit', value: 98, max: 100 }
];

const potentials = {
  'Stärke': 500,
  'Geschwindigkeit': 100
};

// 5 Level-Ups. BaseGrowth = 2 -> 5 * 2 = +10 Stärke, +10 Geschw.
// Geschwindigkeit ist bei 98 mit Max 100 -> wird auf 100 gekappt!
const updatedAttrs = ProgressionService.applyLevelUpToAttributes(testAttributes, 5, DEFAULT_PROGRESSION_CONFIG, 'normal', potentials);

const strength = updatedAttrs.find(a => a.name === 'Stärke');
const speed = updatedAttrs.find(a => a.name === 'Geschwindigkeit');

assert(strength?.value === 60, `Stärke stieg von 50 auf 60 (erhalten: ${strength?.value})`);
assert(speed?.value === 100, `Geschwindigkeit wurde bei Potenzialgrenze 100 gekappt (erhalten: ${speed?.value})`);

// -----------------------------------------------------------------------------
// TEST 9: Charakter-Progression Resolution (Deterministisch ohne KI)
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: resolveCharacterProgression ---');
const testChar: Character = {
  name: 'Aiden',
  role: 'Abenteurer',
  personality: 'Mutig',
  bio: 'Ein junger Krieger.',
  appearance: { gender: 'Männlich', hairColor: 'Braun', eyeColor: 'Blau', age: '20', build: 'Athletisch' },
  attributes: [{ name: 'Stärke', value: 15, max: 100 }],
  rank: 'E',
  potential: 750
};

const resolved = ProgressionService.resolveCharacterProgression(testChar, configRankGrowth);
assert(resolved.rank === 'E', `Rang E übernommen`);
assert(resolved.level === 1, `Start-Level 1`);
assert(resolved.potential === 750, `Potenzial 750 übernommen`);
assert(resolved.xpNeeded === 180, `E-Rang Start-EP-Bedarf = 180 (erhalten: ${resolved.xpNeeded})`);
assert(resolved.rankIndex === 1, `RankIndex ist 1`);

console.log('\n=== ALL PROGRESSION SYSTEM TESTS PASSED SUCCESSFULLY! ===');
