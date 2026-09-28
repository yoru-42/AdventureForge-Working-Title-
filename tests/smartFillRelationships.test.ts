// -*- coding: utf-8 -*-
import { applySmartFillUpdates, generateDeterministicRelationshipId, generateDeterministicGoalId } from '../utils/smartFillUtils';
import { SmartFillContext, RelationshipsSmartFillScope } from '../types';

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
    { id: 'rel-2', targetCharacter: 'Kael', type: 'Rivale', behavior: 'Misstrauisch' }
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
// TEST 1: scope: 'relationships' (supplement)
// -----------------------------------------------------------------------------
console.log('--- Test 1: scope = relationships (supplement) ---');
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
// TEST 2: scope: 'motivation_goals' (supplement)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: scope = motivation_goals (supplement) ---');
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
// TEST A: Einzelne Beziehung + replace (targetId = rel-1)
// -----------------------------------------------------------------------------
console.log('\n--- Test A: Einzelne Beziehung + replace (targetId = rel-1) ---');
const ctxTestA: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships',
  targetId: 'rel-1',
  mode: 'replace'
};

const aiDataTestA = {
  relationships: [{ id: 'rel-1', targetCharacter: 'Darian', type: 'Ehemaliger Freund', behavior: 'Nachtragend' }]
};

const resTestA = applySmartFillUpdates(baseCharacter, aiDataTestA, ctxTestA);

assert(resTestA.relationships.length === 2, 'Gesamtanzahl der Beziehungen bleibt 2 (keine Löschung von rel-2)');
assert(resTestA.relationships.find((r: any) => r.id === 'rel-1').type === 'Ehemaliger Freund', 'Nur rel-1 wurde in replace ersetzt');
assert(resTestA.relationships.find((r: any) => r.id === 'rel-2').type === 'Rivale', 'rel-2 bleibt unangetastet');
assert(resTestA.goal === 'Das arkanische Arcanum meistern', 'Motivation/Ziele blieben bei gezieltem Beziehungs-replace unangetastet');

// -----------------------------------------------------------------------------
// TEST B: Gesamte Beziehungen + replace (targetId = character.id)
// -----------------------------------------------------------------------------
console.log('\n--- Test B: Gesamte Beziehungen + replace (targetId = character.id) ---');
const ctxTestB: SmartFillContext = {
  section: 'relationships',
  scope: 'relationships',
  targetId: 'char-456',
  mode: 'replace'
};

const aiDataTestB = {
  relationships: [{ targetCharacter: 'Lord Malakor', type: 'Erzfeind' }]
};

const resTestB = applySmartFillUpdates(baseCharacter, aiDataTestB, ctxTestB);

assert(resTestB.relationships.length === 1 && resTestB.relationships[0].targetCharacter === 'Lord Malakor', 'Alle bisherigen Beziehungen wurden durch neue ersetzt');
assert(resTestB.goal === 'Das arkanische Arcanum meistern', 'Motivation & Ziele blieben beim Ersetzen aller Beziehungen unangetastet');

// -----------------------------------------------------------------------------
// TEST C: Motivation/Ziele + replace
// -----------------------------------------------------------------------------
console.log('\n--- Test C: Motivation/Ziele + replace ---');
const ctxTestC: SmartFillContext = {
  section: 'relationships',
  scope: 'motivation_goals',
  targetId: 'char-456',
  mode: 'replace'
};

const aiDataTestC = {
  goal: 'Das alte Kaiserreich wiedererrichten',
  motivationCore: { mainGoal: 'Kaiserreich wiedererrichten', whyGoal: 'Ehre' },
  goals: [{ id: 'goal-kaiser', title: 'Hauptstadt einnehmen' }]
};

const resTestC = applySmartFillUpdates(baseCharacter, aiDataTestC, ctxTestC);

assert(resTestC.goal === 'Das alte Kaiserreich wiedererrichten', 'Hauptziel wurde im replace-Modus ersetzt');
assert(resTestC.goals.length === 1 && resTestC.goals[0].title === 'Hauptstadt einnehmen', 'Alte Ziele wurden durch neue Ziele ersetzt');
assert(resTestC.relationships.length === 2, 'Beziehungen blieben beim Ersetzen von Motivation/Zielen vollständig erhalten');

// -----------------------------------------------------------------------------
// TEST D: Motivation/Ziele + supplement
// -----------------------------------------------------------------------------
console.log('\n--- Test D: Motivation/Ziele + supplement ---');
const ctxTestD: SmartFillContext = {
  section: 'relationships',
  scope: 'motivation_goals',
  targetId: 'char-456',
  mode: 'supplement'
};

const aiDataTestD = {
  goals: [
    { title: 'Erstes Buch der Arcanum finden' }, // Duplikat
    { title: 'Zweites Buch der Arcanum suchen' }  // Neu
  ]
};

const resTestD = applySmartFillUpdates(baseCharacter, aiDataTestD, ctxTestD);

assert(resTestD.goals.length === 2, 'Bestehende Ziele bleiben erhalten und neues Ziel wird ohne Duplikate ergänzt');
assert(resTestD.goals.some((g: any) => g.title === 'Zweites Buch der Arcanum suchen'), 'Neues Ziel ist vorhanden');

// -----------------------------------------------------------------------------
// TEST E: Strict Typing Check
// -----------------------------------------------------------------------------
console.log('\n--- Test E: Strict Scope Typing Check ---');
const validScopes: RelationshipsSmartFillScope[] = [
  'relationships',
  'motivation_goals',
  'relationships_and_motivation_goals'
];
assert(validScopes.length === 3, 'Alle 3 Scopes im RelationshipsSmartFillScope Typ vorhanden');

// -----------------------------------------------------------------------------
// TEST F: Stabile IDs (Kein Date.now())
// -----------------------------------------------------------------------------
console.log('\n--- Test F: Stabile IDs (Kein Date.now()) ---');
const id1 = generateDeterministicRelationshipId('char-456', 'Darian', 0);
const id2 = generateDeterministicRelationshipId('char-456', 'Darian', 0);
assert(id1 === id2, 'Zwei Aufrufe mit gleichen Parametern erzeugen absolut identische, deterministische IDs');
assert(id1 === 'rel_char456_darian', `ID ist strukturiert und stabil: ${id1}`);

const goalId1 = generateDeterministicGoalId('char-456', 'Arcanum finden', 0);
const goalId2 = generateDeterministicGoalId('char-456', 'Arcanum finden', 0);
assert(goalId1 === goalId2, 'Ziel-IDs sind ebenfalls deterministisch und stabil');

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

assert(resCrossDomain.appearance.hairColor === 'Rot', 'Aussehen wurde gefiltered');
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
