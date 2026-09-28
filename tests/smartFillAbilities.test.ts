// -*- coding: utf-8 -*-
import { applySmartFillUpdates } from '../utils/smartFillUtils';
import { generatePowerSystemId, generateCharacterPowerId, generateCharacterAbilityId, generateCharacterTechniqueId, generateCharacterPowerFormId } from '../utils/abilityHierarchy';
import { SmartFillContext, AbilitiesSmartFillScope } from '../types';

console.log('=== RUNNING SMART FILL KRÄFTE & FÄHIGKEITEN TESTS ===\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

const baseCharacter = {
  id: 'char-789',
  name: 'Kaelen',
  nickname: 'Der Schattentänzer',
  role: 'Schattenmagier',
  appearance: { hairColor: 'Schwarz', eyeColor: 'Violett', race: 'Elfe' },
  bio: 'Hintergrund von Kaelen.',
  relationships: [{ id: 'rel-1', targetCharacter: 'Lyra', type: 'Verbündete' }],
  goal: 'Das Schattensiegel brechen',
  profession: 'Assassine',
  inventory: 'Schattendolch, 50 Gold',
  structuredInventory: { money: 50 },

  // Power Hierarchy Data
  powerSystems: [
    { id: 'sys_schatten', name: 'Schattenmagie', description: 'Uralte Magie der Dunkelheit', progression: { level: 2, exp: 100 } }
  ],
  powers: [
    { id: 'power_schatten_manipulation', powerSystemId: 'sys_schatten', name: 'Schattenmanipulation', description: 'Beherrschung von Schatten', progression: { level: 3, exp: 250 } }
  ],
  characterAbilities: [
    { id: 'ab_schatten_schritte', powerId: 'power_schatten_manipulation', name: 'Schattenlauf', category: 'Grundfähigkeiten', description: 'Verschmelzen mit Schatten' }
  ],
  abilities: [
    { id: 'ab_schatten_schritte', powerId: 'power_schatten_manipulation', name: 'Schattenlauf', category: 'Grundfähigkeiten', description: 'Verschmelzen mit Schatten' }
  ],
  characterTechniques: [
    { id: 'tech_schatten_stich', abilityId: 'ab_schatten_schritte', name: 'Schattendolch-Stich', description: 'Ein schneller Hieb aus dem Hinterhalt', progression: { level: 1 } }
  ],
  techniqueList: [
    { id: 'tech_schatten_stich', abilityId: 'ab_schatten_schritte', name: 'Schattendolch-Stich', description: 'Ein schneller Hieb aus dem Hinterhalt', progression: { level: 1 } }
  ],
  powerForms: [
    { id: 'form_schatten_gestalt', powerId: 'power_schatten_manipulation', name: 'Schattenmonster-Form', formType: 'Transformation', description: 'Verwandlung in ein schattenhaftes Wesen' }
  ],
  forms: [
    { id: 'form_schatten_gestalt', powerId: 'power_schatten_manipulation', name: 'Schattenmonster-Form', formType: 'Transformation', description: 'Verwandlung in ein schattenhaftes Wesen' }
  ]
};

// -----------------------------------------------------------------------------
// TEST 1: scope = powers_abilities
// -----------------------------------------------------------------------------
console.log('--- Test 1: scope = powers_abilities ---');
const ctxPowersAbilities: SmartFillContext = {
  section: 'abilities',
  scope: 'powers_abilities',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataPowersAbilities = {
  powerSystems: [{ name: 'Nekromantie', description: 'Magie des Todes' }],
  powers: [{ name: 'Todesmagie', description: 'Totenbeschwörung' }],
  abilities: [{ name: 'Skeletterhebung', category: 'Grundfähigkeiten' }],
  techniques: [{ name: 'UNERWÜNSCHTE TECHNIK', description: 'Darf nicht erzeugt werden' }],
  powerForms: [{ name: 'UNERWÜNSCHTE FORM', description: 'Darf nicht erzeugt werden' }],
  profession: 'UNERWÜNSCHTER BERUF',
  inventory: 'UNERWÜNSCHTES ITEM'
};

const resPowersAbilities = applySmartFillUpdates(baseCharacter, aiDataPowersAbilities, ctxPowersAbilities);

assert(resPowersAbilities.powerSystems.length === 2, 'Neues PowerSystem wurde hinzugefügt');
assert(resPowersAbilities.powers.length === 2, 'Neue Power wurde hinzugefügt');
assert(resPowersAbilities.characterAbilities.length === 2, 'Neue Grundfähigkeit wurde hinzugefügt');
assert(resPowersAbilities.characterTechniques.length === 1, 'Techniken blieben geschützt und unverändert');
assert(resPowersAbilities.powerForms.length === 1, 'PowerForms blieben geschützt und unverändert');
assert(resPowersAbilities.profession === 'Assassine', 'Beruf blieb unverändert');
assert(resPowersAbilities.inventory === 'Schattendolch, 50 Gold', 'Inventar blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 2: scope = techniques
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: scope = techniques ---');
const ctxTechniques: SmartFillContext = {
  section: 'abilities',
  scope: 'techniques',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataTechniques = {
  techniqueList: [{ name: 'Schattenexplosion', description: 'Explosion aus Schattenenergie' }],
  powers: [{ name: 'UNERWÜNSCHTE KRAFT' }],
  profession: 'UNERWÜNSCHTER BERUF'
};

const resTechniques = applySmartFillUpdates(baseCharacter, aiDataTechniques, ctxTechniques);

assert(resTechniques.characterTechniques.length === 2, 'Neue Technik wurde hinzugefügt');
assert(resTechniques.powers.length === 1, 'Kräfte blieben bei scope=techniques unverändert');
assert(resTechniques.profession === 'Assassine', 'Beruf blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 3: scope = forms_transformations
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: scope = forms_transformations ---');
const ctxForms: SmartFillContext = {
  section: 'abilities',
  scope: 'forms_transformations',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataForms = {
  powerForms: [{ name: 'Schattenavatar-Form', description: 'Reine Schattenform mit Flügeln' }],
  techniqueList: [{ name: 'UNERWÜNSCHTE TECHNIK' }],
  inventory: 'UNERWÜNSCHTES INVENTAR'
};

const resForms = applySmartFillUpdates(baseCharacter, aiDataForms, ctxForms);

assert(resForms.powerForms.length === 2, 'Neue PowerForm wurde hinzugefügt');
assert(resForms.characterTechniques.length === 1, 'Normale Techniken blieben unverändert');
assert(resForms.inventory === 'Schattendolch, 50 Gold', 'Inventar blieb unverändert');

// -----------------------------------------------------------------------------
// TEST 4: scope = powers_abilities_techniques_forms (Alles)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: scope = powers_abilities_techniques_forms ---');
const ctxAll: SmartFillContext = {
  section: 'abilities',
  scope: 'powers_abilities_techniques_forms',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataAll = {
  powerSystems: [{ name: 'Blutmagie' }],
  powers: [{ name: 'Blutbeherrschung' }],
  abilities: [{ name: 'Blutgespür' }],
  techniqueList: [{ name: 'Blutspeer' }],
  powerForms: [{ name: 'Blutdämon-Form' }],
  name: 'UNERWÜNSCHTER NAME'
};

const resAll = applySmartFillUpdates(baseCharacter, aiDataAll, ctxAll);

assert(resAll.powerSystems.length === 2, 'PowerSystem in "Alles"-Modus ergänzt');
assert(resAll.powers.length === 2, 'Power in "Alles"-Modus ergänzt');
assert(resAll.characterAbilities.length === 2, 'Ability in "Alles"-Modus ergänzt');
assert(resAll.characterTechniques.length === 2, 'Technik in "Alles"-Modus ergänzt');
assert(resAll.powerForms.length === 2, 'Form in "Alles"-Modus ergänzt');
assert(resAll.name === 'Kaelen', 'Profilname blieb geschützt');

// -----------------------------------------------------------------------------
// TEST 5: Cross-Domain Schutzfilter
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Cross-Domain Schutzfilter ---');
const ctxCrossDomain: SmartFillContext = {
  section: 'abilities',
  scope: 'powers_abilities_techniques_forms',
  targetId: 'char-789',
  mode: 'replace'
};

const aiDataCrossDomain = {
  techniqueList: [{ name: 'Neuer Schattenstoss' }],
  appearance: { hairColor: 'Blond' },
  profession: 'König',
  inventory: 'Krone',
  relationships: [{ targetCharacter: 'Gegner', type: 'Feind' }]
};

const resCrossDomain = applySmartFillUpdates(baseCharacter, aiDataCrossDomain, ctxCrossDomain);

assert(resCrossDomain.appearance.hairColor === 'Schwarz', 'Aussehen wurde gefiltert');
assert(resCrossDomain.profession === 'Assassine', 'Beruf wurde gefiltert');
assert(resCrossDomain.inventory === 'Schattendolch, 50 Gold', 'Inventar wurde gefiltert');
assert(resCrossDomain.relationships.length === 1 && resCrossDomain.relationships[0].targetCharacter === 'Lyra', 'Beziehungen wurden gefiltert');

// -----------------------------------------------------------------------------
// TEST 6: Progression verbleibt unangetastet bei supplement
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Progression State Erhaltung ---');
const ctxProgression: SmartFillContext = {
  section: 'abilities',
  scope: 'powers_abilities',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataProgression = {
  powerSystems: [{ name: 'Schattenmagie', description: 'Aktualisierte Beschreibung' }]
};

const resProgression = applySmartFillUpdates(baseCharacter, aiDataProgression, ctxProgression);

assert(resProgression.powerSystems[0].progression.level === 2, 'Bestehendes Progressions-Level im PowerSystem bleibt erhalten');

// -----------------------------------------------------------------------------
// TEST 7: Stabile IDs (Kein Date.now() / Math.random())
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Stabile IDs (Kein Date.now()) ---');
const sysId1 = generatePowerSystemId('Schattenmagie');
const sysId2 = generatePowerSystemId('Schattenmagie');
assert(sysId1 === sysId2, 'PowerSystem IDs sind deterministisch und identisch');

const powId1 = generateCharacterPowerId('sys_schatten', 'Schattenlauf');
const powId2 = generateCharacterPowerId('sys_schatten', 'Schattenlauf');
assert(powId1 === powId2, 'Power IDs sind deterministisch und identisch');

const abId1 = generateCharacterAbilityId('power_schatten', 'Schattenblick');
const abId2 = generateCharacterAbilityId('power_schatten', 'Schattenblick');
assert(abId1 === abId2, 'Ability IDs sind deterministisch und identisch');

const techId1 = generateCharacterTechniqueId('ab_schatten', 'Schattenstoss');
const techId2 = generateCharacterTechniqueId('ab_schatten', 'Schattenstoss');
assert(techId1 === techId2, 'Technique IDs sind deterministisch und identisch');

const formId1 = generateCharacterPowerFormId('power_schatten', 'Schattenform');
const formId2 = generateCharacterPowerFormId('power_schatten', 'Schattenform');
assert(formId1 === formId2, 'Form IDs sind deterministisch und identisch');

// -----------------------------------------------------------------------------
// TEST 8: Full Character mode updates abilities properly
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: full_character Modus ---');
const ctxFull: SmartFillContext = {
  section: 'full_character',
  targetId: 'char-789',
  mode: 'supplement'
};

const aiDataFull = {
  abilities: [{ id: 'ab_neue_kraft', name: 'Neuer Strahl', category: 'Grundfähigkeiten' }]
};

const resFull = applySmartFillUpdates(baseCharacter, aiDataFull, ctxFull);
assert(resFull.abilities.some((a: any) => a.name === 'Neuer Strahl'), 'Full character mode fügt neue Fähigkeit ordnungsgemäß hinzu');

console.log('\n=== ALL SMART FILL ABILITIES TESTS PASSED SUCCESSFULLY! ===');
