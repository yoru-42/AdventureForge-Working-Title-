// -*- coding: utf-8 -*-
import { applySmartFillUpdates } from '../utils/smartFillUtils';
import { SmartFillContext } from '../types';

console.log('=== RUNNING SMART FILL RELATIONSHIPS, MOTIVATION & GOALS TESTS ===\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

const baseCharacter = {
  id: 'char-456',
  name: 'Valeria',
  nickname: 'Die Feuertänzerin',
  role: 'Magierin',
  appearance: { hairColor: 'Rot', eyeColor: 'Grün', race: 'Mensch' },
  bio: 'Vorgeschichte von Valeria.',
  
  // Section 2: Relationships, Motivation & Goals
  relationships: [
    { id: 'rel-1', targetCharacter: 'Darian', type: 'Freund', behavior: 'Freundlich' },
    { id: 'rel-2', targetCharacter: 'Kael', type: 'Rivale', behavior: 'Mistrauisch' }
  ],
  relationship: 'Freundlich zu Darian',
  conduct: 'Zurückhaltend gegenüber Fremden',
  goal: 'Das arkanische Arcanum meistern',
  motivationCore: { mainGoal: 'Das arkanische Arcanum meistern', whyGoal: 'Macht' },
  goals: [
    { id: 'goal-1', title: 'Erstes Buch der Arcanum finden', priority: 'hoch', status: 'aktiv' }
  ],

  // Other domains
  abilities: [{ id: 'ab-1', name: 'Feuerball' }],
  profession: 'Alchemistin',
  talents: 'Trankbrauen',
  structuredInventory: { money: 100, weapons: [{ name: 'Stab' }] },
  inventory: 'Stab, 100 Münzen'
};

// -----------------------------------------------------------------------------
// TEST 1: scope: 'relationships'
// -----------------------------------------------------------------------------
console.log('--- Test 1: scope = relationships ---');
const ctxRelOnly: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships',
  targetId: 'char-456',
  mode: 'supplement'
};

const aiDataRelOnly = {
  relationships: [
    { id: 'rel-3', targetCharacter: 'Elena', type: 'Mentor', behavior: 'Respektvoll' }
  ],
  goal: 'NEUES UNERWÜNSCHTES ZIEL',
  inventory: 'NEUES UNERWÜNSCHTES ITEM'
};

const resRelOnly = applySmartFillUpdates(baseCharacter, aiDataRelOnly, ctxRelOnly);

assert(resRelOnly.relationships.length === 3, 'Neue Beziehung wurde hinzugefügt');
assert(resRelOnly.goal === 'Das arkanische Arcanum meistern', 'Motivation/Ziel blieb unverändert (Schutzfilter gewahrt)');
assert(resRelOnly.inventory === 'Stab, 100 Münzen', 'Inventar blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 2: scope: 'motivation_goals'
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: scope = motivation_goals ---');
const ctxMotivOnly: SmartFillContext = {
  section: 'relationships',
  scope: 'motivation_goals',
  targetId: 'char-456',
  mode: 'supplement'
};

const aiDataMotivOnly = {
  goal: 'Das alte Imperium wiederaufbauen',
  relationships: [
    { targetCharacter: 'UNERWÜNSCHTE PERSON', type: 'Feind' }
  ]
};

const resMotivOnly = applySmartFillUpdates(baseCharacter, aiDataMotivOnly, ctxMotivOnly);

assert(resMotivOnly.goal === 'Das arkanische Arcanum meistern', 'Hauptziel im Ergänzungsmodus beibehalten');
assert(resMotivOnly.relationships.length === 2, 'Beziehungen wurden NICHT geändert');
assert(!resMotivOnly.relationships.some((r: any) => r.targetCharacter === 'UNERWÜNSCHTE PERSON'), 'Keine unerwünschten Beziehungen erzeugt');

// -----------------------------------------------------------------------------
// TEST 3: scope: 'relationships_and_motivation_goals'
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: scope = relationships_and_motivation_goals ---');
const ctxBoth: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships_and_motivation_goals',
  targetId: 'char-456',
  mode: 'supplement'
};

const aiDataBoth = {
  relationships: [{ targetCharacter: 'Gildenmeister', type: 'Vorgesetzter' }],
  goals: [{ id: 'goal-2', title: 'Gildenrang aufsteigen' }],
  name: 'UNERWÜNSCHTER NAME'
};

const resBoth = applySmartFillUpdates(baseCharacter, aiDataBoth, ctxBoth);

assert(resBoth.relationships.length === 3, 'Beziehung hinzugefügt');
assert(resBoth.goals.length === 2, 'Neues Ziel hinzugefügt');
assert(resBoth.name === 'Valeria', 'Profilname blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 4: targetId für einzelne Beziehung
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: targetId für einzelne Beziehung ---');
const ctxTargetRel: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships',
  targetId: 'rel-1',
  mode: 'supplement'
};

const aiDataTargetRel = {
  relationships: [{ id: 'rel-1', behavior: 'Sehr eng befreundet, vertraut ihm das Leben an' }]
};

const resTargetRel = applySmartFillUpdates(baseCharacter, aiDataTargetRel, ctxTargetRel);

assert(resTargetRel.relationships.find((r: any) => r.id === 'rel-1').behavior.includes('Sehr eng befreundet'), 'Gezielte Beziehung wurde aktualisiert');
assert(resTargetRel.relationships.find((r: any) => r.id === 'rel-2').behavior === 'Mistrauisch', 'Andere Beziehung blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 5: mode = 'replace' mit scope = 'relationships'
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: mode = replace mit scope = relationships ---');
const ctxReplaceRel: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships',
  targetId: 'char-456',
  mode: 'replace'
};

const aiDataReplaceRel = {
  relationships: [{ targetCharacter: 'Neuer Partner', type: 'Verbündeter' }]
};

const resReplaceRel = applySmartFillUpdates(baseCharacter, aiDataReplaceRel, ctxReplaceRel);

assert(resReplaceRel.relationships.length === 1 && resReplaceRel.relationships[0].targetCharacter === 'Neuer Partner', 'Beziehungen wurden ersetzt');
assert(resReplaceRel.goal === 'Das arkanische Arcanum meistern', 'Motivation & Ziele blieben auch bei replace der Beziehungen unangetastet');

// -----------------------------------------------------------------------------
// TEST 6: mode = 'replace' mit scope = 'motivation_goals'
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: mode = replace mit scope = motivation_goals ---');
const ctxReplaceMotiv: SmartFillContext = {
  section: 'relationships',
  scope: 'motivation_goals',
  targetId: 'char-456',
  mode: 'replace'
};

const aiDataReplaceMotiv = {
  goal: 'Neues alleiniges Ziel',
  goals: [{ id: 'goal-new', title: 'Neues Ziel' }]
};

const resReplaceMotiv = applySmartFillUpdates(baseCharacter, aiDataReplaceMotiv, ctxReplaceMotiv);

assert(resReplaceMotiv.goal === 'Neues alleiniges Ziel', 'Ziel wurde ersetzt');
assert(resReplaceMotiv.relationships.length === 2, 'Beziehungen blieben bei replace der Motivation unangetastet');

// -----------------------------------------------------------------------------
// TEST 7: Cross-Domain Versehentliche AI-Daten filtern
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Cross-Domain Schutzfilter ---');
const ctxCrossDomain: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships_and_motivation_goals',
  targetId: 'char-456',
  mode: 'replace'
};

const aiDataCrossDomain = {
  relationships: [{ targetCharacter: 'Mora', type: 'Begleiter' }],
  appearance: { hairColor: 'Blond' },
  abilities: [{ id: 'ab-99', name: 'Todesfluch' }],
  profession: 'Königin',
  inventory: 'Krone, Zauberstab'
};

const resCrossDomain = applySmartFillUpdates(baseCharacter, aiDataCrossDomain, ctxCrossDomain);

assert(resCrossDomain.appearance.hairColor === 'Rot', 'Aussehen wurde gefiltert');
assert(resCrossDomain.abilities.length === 1 && resCrossDomain.abilities[0].id === 'ab-1', 'Fähigkeiten wurden gefiltert');
assert(resCrossDomain.profession === 'Alchemistin', 'Berufe wurden gefiltert');
assert(resCrossDomain.inventory === 'Stab, 100 Münzen', 'Inventar wurde gefiltert');

// -----------------------------------------------------------------------------
// TEST 8: full_character bleibt unverändert funktionsfähig
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: full_character Modus ---');
const ctxFullChar: SmartFillContext = {
  section: 'full_character',
  targetId: 'char-456',
  mode: 'supplement'
};

const aiDataFullChar = {
  profession: 'Grossalchemistin'
};

const resFullChar = applySmartFillUpdates(baseCharacter, aiDataFullChar, ctxFullChar);
assert(resFullChar.profession === 'Grossalchemistin', 'Full character mode aktualisiert Berufe');

console.log('\n=== ALL SMART FILL RELATIONSHIPS TESTS PASSED SUCCESSFULLY! ===');
