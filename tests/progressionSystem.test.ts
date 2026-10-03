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

console.log('=== RUNNING PROGRESSION SYSTEM CLEANUP & SPECIFICATION TESTS ===\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: F Level 1 + ausreichende EP -> Level-Up funktioniert
// -----------------------------------------------------------------------------
console.log('--- Test 1: F Level 1 + ausreichende EP -> Level-Up ---');
const stateF1: ProgressionState = {
  level: 1,
  xp: 0,
  rank: 'F'
};
// Im Standard-Config (Modus C): F Level 1 benötigt 100 EP.
const resF1 = ProgressionService.applyXpGain(stateF1, 100, DEFAULT_PROGRESSION_CONFIG);
assert(resF1.levelsGained === 1, `Genau 1 Level aufgestiegen (erhalten: ${resF1.levelsGained})`);
assert(resF1.newState.level === 2, `Neues Level ist 2 (erhalten: ${resF1.newState.level})`);
assert(resF1.newState.rank === 'F', `Rang bleibt F`);
assert(resF1.newState.xp === 0, `Verbleibende EP sind 0 (erhalten: ${resF1.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 2: F Level 10 + ausreichende EP -> E-Rang wird erreicht
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: F Level 10 + ausreichende EP -> E-Rang Aufstieg ---');
const stateF10: ProgressionState = {
  level: 10,
  xp: 0,
  rank: 'F'
};
// Level 10 ist bereits das maximale Level für F (levelsPerRank = 10).
// Bei Erreichen/Aufstieg von F Level 10 wird E-Rang Level 1 freigeschaltet.
const resF10 = ProgressionService.applyXpGain(stateF10, 50, DEFAULT_PROGRESSION_CONFIG);
assert(resF10.rankUps.length === 1, `Genau 1 Rangaufstieg ausgelöst`);
assert(resF10.rankUps[0].fromRank === 'F' && resF10.rankUps[0].toRank === 'E', `Aufstieg von F nach E`);
assert(resF10.newState.rank === 'E', `Neuer Rang ist E (erhalten: ${resF10.newState.rank})`);
assert(resF10.newState.level === 1, `Level wird bei resetLevelOnRankUp auf 1 gesetzt`);
assert(resF10.newState.xp === 50, `Überschüssige 50 EP bleiben erhalten (erhalten: ${resF10.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 3: S Level 10 + sehr viele EP -> kein weiterer Rang wird erzeugt
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: S Level 10 + sehr viele EP -> Kein weiterer Rang ---');
const stateS10: ProgressionState = {
  level: 10,
  xp: 0,
  rank: 'S'
};
const resS10 = ProgressionService.applyXpGain(stateS10, 100000, DEFAULT_PROGRESSION_CONFIG);
assert(resS10.rankUps.length === 0, `Kein Rangaufstieg auf dem höchsten Rang S (erhalten: ${resS10.rankUps.length})`);
assert(resS10.newState.rank === 'S', `Rang bleibt stabil S, kein S+ oder Ähnliches (erhalten: ${resS10.newState.rank})`);
assert(resS10.newState.level === 10, `Level bleibt auf maximal 10 (erhalten: ${resS10.newState.level})`);
assert(resS10.newState.xpNeeded === 0, `xpNeeded ist 0 am Maximum`);
assert(resS10.newState.xp === 100000, `EP-Überschuss bleibt im Zustand erhalten (erhalten: ${resS10.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 4: Rangsystem deaktiviert -> kein Rang wird automatisch erzeugt
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Rangsystem deaktiviert -> kein automatischer Rang ---');
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
  }
};
const stateNoRank: ProgressionState = {
  level: 1,
  xp: 0
};
const resNoRank = ProgressionService.applyXpGain(stateNoRank, 150, configNoRank);
assert(resNoRank.newState.rank === undefined, `Kein Rang gesetzt bei deaktiviertem Rangsystem`);
assert(resNoRank.rankUps.length === 0, `Keine Rangaufstiege bei deaktiviertem Rangsystem`);
assert(resNoRank.levelsGained === 1, `Level steigt normal von 1 auf 2 (erhalten: ${resNoRank.newState.level})`);

// Auch in resolveCharacterProgression darf kein Rang erzeugt werden:
const charNoRank: Character = {
  name: 'NoRankChar',
  role: 'Bürger',
  personality: 'Ruhig',
  bio: 'Ein einfacher Bewohner.',
  appearance: { gender: 'Divers', hairColor: 'Schwarz', eyeColor: 'Braun', age: '30', build: 'Normal' },
  attributes: []
};
const resolvedNoRank = ProgressionService.resolveCharacterProgression(charNoRank, configNoRank);
assert(resolvedNoRank.rank === undefined, `resolveCharacterProgression erzeugt keinen Rang wenn rankSystem.enabled = false`);

// -----------------------------------------------------------------------------
// TEST 5: Levelsystem deaktiviert -> keine normale Level-Up-Schleife
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Levelsystem deaktiviert -> Keine Level-Up-Schleife ---');
const configNoLevel: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  levelSystem: {
    enabled: false,
    levelsPerRank: 10,
    maxLevel: 100,
    resetLevelOnRankUp: true
  }
};
const stateNoLevel: ProgressionState = {
  level: 5,
  xp: 10,
  rank: 'C'
};
const resNoLevel = ProgressionService.applyXpGain(stateNoLevel, 5000, configNoLevel);
assert(resNoLevel.levelsGained === 0, `Keine Level gewonnen bei deaktiviertem Levelsystem (erhalten: ${resNoLevel.levelsGained})`);
assert(resNoLevel.newState.level === 5, `Level bleibt unverändert bei 5 (erhalten: ${resNoLevel.newState.level})`);
assert(resNoLevel.newState.xp === 5010, `EP wurden im Zustand festgehalten (erhalten: ${resNoLevel.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 6: Großer EP-Gewinn -> mehrere Level-Ups funktionieren
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Großer EP-Gewinn -> Mehrere Level-Ups ---');
const stateMulti: ProgressionState = {
  level: 1,
  xp: 0,
  rank: 'F'
};
// Modus C im Standard:
// F1->2: 100 EP
// F2->3: 120 EP
// F3->4: 140 EP
// Summe für 3 Level-Ups = 360 EP.
// 400 EP -> 3 Level-Ups, Rest = 40 EP.
const resMulti = ProgressionService.applyXpGain(stateMulti, 400, DEFAULT_PROGRESSION_CONFIG);
assert(resMulti.levelsGained === 3, `Genau 3 Level gewonnen (erhalten: ${resMulti.levelsGained})`);
assert(resMulti.newState.level === 4, `Neues Level ist 4 (erhalten: ${resMulti.newState.level})`);
assert(resMulti.newState.xp === 40, `Verbleibende EP sind 40 (erhalten: ${resMulti.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 7: EP-Überschuss -> Rest-EP bleiben exakt erhalten
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: EP-Überschuss -> Rest-EP erhalten ---');
const stateSurplus: ProgressionState = {
  level: 1,
  xp: 25,
  rank: 'F'
};
// 25 + 120 = 145 EP. Bedarf = 100 EP. Rest = 45 EP.
const resSurplus = ProgressionService.applyXpGain(stateSurplus, 120, DEFAULT_PROGRESSION_CONFIG);
assert(resSurplus.newState.level === 2, `Level stieg von 1 auf 2`);
assert(resSurplus.newState.xp === 45, `Exakt 45 Rest-EP erhalten (erhalten: ${resSurplus.newState.xp})`);

// -----------------------------------------------------------------------------
// TEST 8: Level-Up + Attributwachstum -> Keine doppelte Steigerung
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Trennung points vs. applyLevelUpToAttributes ---');
const testAttributes: CharacterAttribute[] = [
  { name: 'Stärke', value: 20, max: 100 },
  { name: 'Abwehr', value: 15, max: 100 }
];
const statePoints: ProgressionState = {
  level: 1,
  xp: 0,
  points: 0
};
const resPoints = ProgressionService.applyXpGain(statePoints, 100, DEFAULT_PROGRESSION_CONFIG);
assert(resPoints.attributePointsEarned === 2, `2 Attributpunkte erworben (erhalten: ${resPoints.attributePointsEarned})`);
assert(resPoints.newState.points === 2, `State enthält 2 points zur manuellen Verteilung`);
// attributes-Array wurde durch applyXpGain NICHT mutiert!
assert(testAttributes[0].value === 20, `Stärke-Attribut im Array blieb unverändert bei 20 (keine automatische Doppelsteigerung)`);

// Separater expliziter Aufruf des automatischen Wachstums:
const grownAttrs = ProgressionService.applyLevelUpToAttributes(testAttributes, 1, DEFAULT_PROGRESSION_CONFIG, 'normal');
assert(grownAttrs[0].value === 22, `Automatische Steigerung erhöht Stärke von 20 auf 22 (erhalten: ${grownAttrs[0].value})`);

// -----------------------------------------------------------------------------
// TEST 9: Eindeutige Trennung von levelsPerRank und maxLevel
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: levelsPerRank vs maxLevel Trennung ---');
const configSeparation: ProgressionConfig = {
  ...ProgressionService.createDefaultProgressionConfig(),
  levelSystem: {
    enabled: true,
    levelsPerRank: 5,
    maxLevel: 100,
    resetLevelOnRankUp: true
  }
};
const stateSep: ProgressionState = {
  level: 4,
  xp: 0,
  rank: 'F'
};
// F4->F5 benötigt 160 EP. Bei levelsPerRank = 5 ist Level 5 die Grenze!
// Bei 500 EP: Level 5 erreicht -> Rangaufstieg zu E Level 1 -> weiter...
const resSep = ProgressionService.applyXpGain(stateSep, 500, configSeparation);
assert(resSep.rankUps.length >= 1, `Rangaufstieg ausgelöst bei Erreichen von levelsPerRank (5)`);
assert(resSep.rankUps[0].toRank === 'E', `Zu Rang E aufgestiegen`);

// -----------------------------------------------------------------------------
// TEST 10: Dynamische Neuberechnung des EP-Bedarfs nach Rangaufstieg
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: EP-Bedarf nach Rangaufstieg neu berechnet ---');
// F1 benötigt: 100 EP.
// E1 benötigt: 100 + 1 * 100 = 200 EP (da rankGrowth = 100).
const reqF = ProgressionService.calculateXpRequirement(1, 'F', DEFAULT_PROGRESSION_CONFIG);
const reqE = ProgressionService.calculateXpRequirement(1, 'E', DEFAULT_PROGRESSION_CONFIG);
assert(reqF === 100, `F Level 1 benötigt 100 EP (erhalten: ${reqF})`);
assert(reqE === 200, `E Level 1 benötigt 200 EP (erhalten: ${reqE})`);

// Rangaufstieg von F nach E prüfen:
const statePreRank: ProgressionState = {
  level: 10,
  xp: 0,
  rank: 'F'
};
// 50 EP geben: löst Rangaufstieg aus, neuer Zustand ist E Level 1.
const resPreRank = ProgressionService.applyXpGain(statePreRank, 50, DEFAULT_PROGRESSION_CONFIG);
assert(resPreRank.newState.rank === 'E', `Rang ist nun E`);
assert(resPreRank.newState.level === 1, `Level ist 1`);
assert(resPreRank.newState.xpNeeded === 200, `Neuer EP-Bedarf für E1 ist 200 und NICHT der alte F1-Bedarf (erhalten: ${resPreRank.newState.xpNeeded})`);

// -----------------------------------------------------------------------------
// TEST 11: minXpForRankUp saubere Bedingungsprüfung
// -----------------------------------------------------------------------------
console.log('\n--- Test 11: minXpForRankUp Bedingungsprüfung ---');
const configMinXp: ProgressionConfig = {
  ...DEFAULT_PROGRESSION_CONFIG,
  rankSystem: {
    ...DEFAULT_PROGRESSION_CONFIG.rankSystem,
    minXpForRankUp: 500
  }
};
// Level 10 erreicht, aber nur 200 EP verfügbar -> kein Rangaufstieg
const checkFailed = ProgressionService.checkRankUpConditions('F', 10, 200, configMinXp);
assert(checkFailed.canRankUp === false, `Rangaufstieg abgewiesen da 200 EP < 500 EP`);

// Level 10 erreicht und 600 EP verfügbar -> Rangaufstieg erlaubt
const checkSuccess = ProgressionService.checkRankUpConditions('F', 10, 600, configMinXp);
assert(checkSuccess.canRankUp === true, `Rangaufstieg gestattet bei 600 EP >= 500 EP`);

// -----------------------------------------------------------------------------
// TEST 12: resetLevelOnRankUp: false Unterstützung
// -----------------------------------------------------------------------------
console.log('\n--- Test 12: resetLevelOnRankUp: false Unterstützung ---');
const configNoReset: ProgressionConfig = {
  ...DEFAULT_PROGRESSION_CONFIG,
  levelSystem: {
    ...DEFAULT_PROGRESSION_CONFIG.levelSystem,
    resetLevelOnRankUp: false
  }
};
const stateNoReset: ProgressionState = {
  level: 10,
  xp: 0,
  rank: 'F'
};
const resNoReset = ProgressionService.applyXpGain(stateNoReset, 50, configNoReset);
assert(resNoReset.rankUps.length === 1, `Rangaufstieg ausgelöst`);
assert(resNoReset.newState.rank === 'E', `Rang ist E`);
assert(resNoReset.newState.level === 10, `Level bleibt 10 wenn resetLevelOnRankUp = false (erhalten: ${resNoReset.newState.level})`);

// -----------------------------------------------------------------------------
// TEST 13: Individuelle Parameter-Werteentwicklung & Rangaufstiegsbonus
// -----------------------------------------------------------------------------
console.log('\n--- Test 13: Individuelle Parameter-Werteentwicklung & Akzeptanztest ---');
const charTestState: ProgressionState = {
  level: 1,
  xp: 0,
  rank: 'F',
  potential: 1000,
  developmentProfile: 'normal',
  developmentRate: 1.0,
  race: 'Mensch',
  parameterGrowthFactors: {
    'Stärke': 1.0
  },
  campaignPowerLevels: {
    'Stärke': { value: 100, potentialMax: 1000 }
  }
};

// 1. Levelaufstieg mit Stärke-Faktor 1.0 (100 EP für Level 2)
const resLvl1 = ProgressionService.applyXpGain(charTestState, 100, DEFAULT_PROGRESSION_CONFIG);
assert(resLvl1.levelsGained === 1, `1 Level gewonnen`);
assert(resLvl1.newState.campaignPowerLevels?.['Stärke']?.value === 102, `Stärke ist von 100 auf 102 gestiegen (+2 Basis)`);

// 2. Anpassung des Stärke-Faktors auf 1.5
const charStateUpdatedFactor: ProgressionState = {
  ...resLvl1.newState,
  parameterGrowthFactors: {
    'Stärke': 1.5
  }
};

// Berechnetes Wachstum kontrollieren: 2 * 1.5 = +3
const calcGrowth = ProgressionService.calculateParameterGrowth({
  parameterName: 'Stärke',
  currentValue: 102,
  potential: 1000,
  parameterGrowthFactors: { 'Stärke': 1.5 },
  race: 'Mensch',
  developmentRateMultiplier: 1.0,
  profileMultiplier: 1.0,
  isRankUp: false
});
assert(calcGrowth === 3, `Berechnetes Wachstum pro Level bei Faktor 1.5 ist exakt +3 (erhalten: ${calcGrowth})`);

// Weiterer Levelaufstieg (120 EP für Level 3)
const resLvl2 = ProgressionService.applyXpGain(charStateUpdatedFactor, 120, DEFAULT_PROGRESSION_CONFIG);
assert(resLvl2.levelsGained === 1, `1 weiteres Level gewonnen`);
assert(resLvl2.newState.campaignPowerLevels?.['Stärke']?.value === 105, `Stärke ist von 102 auf 105 gestiegen (+3 bei Faktor 1.5)`);

// 3. Rangaufstieg mit Rang-Schub (rankGrowthMultiplier = 4)
const calcRankGrowth = ProgressionService.calculateParameterGrowth({
  parameterName: 'Stärke',
  currentValue: 105,
  potential: 1000,
  parameterGrowthFactors: { 'Stärke': 1.5 },
  race: 'Mensch',
  developmentRateMultiplier: 1.0,
  profileMultiplier: 1.0,
  rankGrowthMultiplier: 4,
  isRankUp: true
});
assert(calcRankGrowth === 12, `Berechnetes Rangwachstum bei Faktor 1.5 und Rangschub 4 ist exakt +12 (3 * 4)`);

// -----------------------------------------------------------------------------
// TEST 14: Entwicklungsbudget & freie Punkteverteilung (12 Punkte)
// -----------------------------------------------------------------------------
console.log('\n--- Test 14: Entwicklungsbudget & freie Punkteverteilung ---');
const budgetState: ProgressionState = {
  level: 1,
  xp: 0,
  rank: 'F',
  potential: 1000,
  developmentProfile: 'normal',
  developmentRate: 1.0,
  race: 'Mensch',
  parameterGrowthPoints: {
    'Stärke': 4,
    'Geschicklichkeit': 3,
    'Konstitution': 2,
    'Intelligenz': 1,
    'Willenskraft': 1,
    'Magie': 1
  },
  campaignPowerLevels: {
    'Stärke': { value: 10, potentialMax: 1000 },
    'Geschicklichkeit': { value: 10, potentialMax: 1000 },
    'Konstitution': { value: 10, potentialMax: 1000 },
    'Intelligenz': { value: 10, potentialMax: 1000 },
    'Willenskraft': { value: 10, potentialMax: 1000 },
    'Magie': { value: 10, potentialMax: 1000 }
  }
};

const resBudgetLvl = ProgressionService.applyXpGain(budgetState, 100, DEFAULT_PROGRESSION_CONFIG);
assert(resBudgetLvl.levelsGained === 1, `Level 1 -> 2`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Stärke']?.value === 14, `Stärke: 10 + 4 = 14`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Geschicklichkeit']?.value === 13, `Geschick: 10 + 3 = 13`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Konstitution']?.value === 12, `Konstitution: 10 + 2 = 12`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Intelligenz']?.value === 11, `Intelligenz: 10 + 1 = 11`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Willenskraft']?.value === 11, `Willenskraft: 10 + 1 = 11`);
assert(resBudgetLvl.newState.campaignPowerLevels?.['Magie']?.value === 11, `Magie: 10 + 1 = 11`);

// -----------------------------------------------------------------------------
// TEST 15: Gemeinsamer Rangbonus (+25%)
// -----------------------------------------------------------------------------
console.log('\n--- Test 15: Gemeinsamer Rangbonus (+25%) ---');
const calcCommonRankGrowth = ProgressionService.calculateParameterGrowth({
  parameterName: 'Stärke',
  currentValue: 14,
  potential: 1000,
  parameterGrowthPoints: { 'Stärke': 4 },
  race: 'Mensch',
  developmentRateMultiplier: 1.0,
  profileMultiplier: 1.0,
  rankGrowthMultiplier: 1,
  rankGrowthBonus: 25,
  isRankUp: true
});
// 4 * 1.25 = 5.0
assert(calcCommonRankGrowth === 5, `Rangwachstum bei +25% Bonus auf 4 Punkte ist exakt 5.0 (erhalten: ${calcCommonRankGrowth})`);

console.log('\n=== ALL PROGRESSION SYSTEM CLEANUP TESTS PASSED SUCCESSFULLY! ===');
