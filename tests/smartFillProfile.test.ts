// -*- coding: utf-8 -*-
import { applySmartFillUpdates } from '../utils/smartFillUtils';
import { SmartFillContext } from '../types';

console.log('=== RUNNING SMART FILL PROFILE DOMAIN TESTS ===\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

// Sample character with data across ALL 5 domains
const baseCharacter = {
  id: 'char-123',
  name: 'Theron Vane',
  nickname: 'Der Schattenläufer',
  rufName: 'Theron',
  role: 'Gilden-Assassine',
  bio: 'Aufgewachsen in den Unterstadt-Slums.',
  personality: 'Ruhig, berechnend, loyal gegenüber Freunden.',
  personalityArchetype: 'Der stille Beobachter',
  currentSituation: 'Versteckt sich in einer Taverne.',
  appearance: {
    gender: 'Männlich',
    age: '26',
    race: 'Mensch',
    raceFeatures: 'keine',
    build: 'Schlank, athletisch',
    hairColor: 'Schwarz',
    eyeColor: 'Dunkelblau',
    cupSize: '-',
    outfit: 'Dunkler Lederwams mit Kapuze',
    looks: 'Scharfe Gesichtszüge, schmale Narbe an der linken Wange',
    height: '182 cm',
    measurements: '100-80-92',
    origin: 'Unterstadt',
    family: 'Keine bekannte Familie',
    faction: 'Schattengilde'
  },
  
  // Section 2: Relationships & Goals
  relationships: [
    { id: 'rel-1', targetCharacter: 'Seraphina', type: 'Schwester', relationshipStatus: 'Vertraut' }
  ],
  goal: 'Den Mörder seines Meisters finden',
  motivationCore: { mainGoal: 'Den Mörder seines Meisters finden' },
  goals: [
    { id: 'goal-1', title: 'Rache nehmen', priority: 'hoch', status: 'aktiv' }
  ],

  // Section 3: Abilities & Powers
  powerSource: 'Schattenmagie',
  powerCost: 'Mana',
  skills: 'Schatten-Schritt',
  techniques: 'Schatten-Schritt, Lautloser Dolchstoß',
  abilities: [
    { id: 'ab-1', name: 'Schatten-Schritt', category: 'Techniken', description: 'Teleportation durch Schatten' }
  ],
  techniqueList: [
    { id: 'tech-1', name: 'Lautloser Dolchstoß', description: 'Kritischer Angriff aus dem Hinterhalt' }
  ],
  powerSystems: [
    { id: 'sys-1', name: 'Magie', systemType: 'Schattenmagie' }
  ],
  powers: [
    { id: 'pow-1', name: 'Schattenmanipulation', powerSystemId: 'sys-1' }
  ],

  // Section 4: Professions & Talents
  profession: 'Assassine',
  professionField: 'Schattenkünste',
  professionSpecialization: 'Meuchelmord',
  secondaryProfessions: ['Giftmischer'],
  talents: 'Schlösser knacken, Lautlose Schritte',
  craftingSkills: 'Alchemie (Gifte)',
  everydaySkills: 'Schleichen (85%), Verkleiden (60%)',

  // Section 5: Inventory & Belongings
  structuredInventory: {
    money: 150,
    currencyLabel: 'Goldmünzen',
    weapons: [{ id: 'w-1', name: 'Schattendolch', damage: '1d6+3' }],
    generalItems: [{ id: 'i-1', name: 'Dietrich-Set', quantity: 1 }]
  },
  inventory: 'Schattendolch, Dietrich-Set, 150 Goldmünzen'
};

// -----------------------------------------------------------------------------
// TEST 1: Profil ergänzt (mode === 'supplement')
// -----------------------------------------------------------------------------
console.log('--- Test 1: Profil ergänzt (mode = supplement) ---');
const contextSupplement: SmartFillContext = {
  section: 'profile',
  targetId: 'char-123',
  mode: 'supplement',
  instruction: 'Füge weitere Details zur Kleidung und Vorgeschichte hinzu.'
};

const aiDataSupplement = {
  bio: 'Wurde mit 12 Jahren von der Schattengilde rekrutiert.',
  appearance: {
    outfit: 'Dunkler Lederwams mit Kapuze, verzierte Silberschließen',
    origin: 'Königreich Valoria'
  }
};

const resultSupplement = applySmartFillUpdates(baseCharacter, aiDataSupplement, contextSupplement);

assert(resultSupplement.name === 'Theron Vane', 'Bestehender Name bleibt im Ergänzungsmodus erhalten');
assert(resultSupplement.bio.includes('Unterstadt-Slums') && resultSupplement.bio.includes('Schattengilde rekrutiert'), 'Bio wurde um neue Informationen ergänzt');
assert(resultSupplement.appearance.outfit === 'Dunkler Lederwams mit Kapuze, verzierte Silberschließen', 'Outfit wurde aktualisiert');
assert(resultSupplement.appearance.hairColor === 'Schwarz', 'Bestehende Haarfarbe bleibt erhalten');


// -----------------------------------------------------------------------------
// TEST 2: Profil ersetzt (mode === 'replace')
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Profil ersetzt (mode = replace) ---');
const contextReplace: SmartFillContext = {
  section: 'profile',
  targetId: 'char-123',
  mode: 'replace',
  instruction: 'Ersetze das komplette Aussehen und die Persönlichkeit.'
};

const aiDataReplace = {
  name: 'Theron den Erneuerte',
  personality: 'Kalt, distanziert, kompromisslos.',
  bio: 'Neuanfang nach dem Fall der Gilde.',
  appearance: {
    gender: 'Männlich',
    age: '28',
    race: 'Mensch',
    hairColor: 'Silberweiß',
    eyeColor: 'Steingrau',
    outfit: 'Schlichte graue Robe'
  }
};

const resultReplace = applySmartFillUpdates(baseCharacter, aiDataReplace, contextReplace);

assert(resultReplace.name === 'Theron den Erneuerte', 'Name wurde im Ersetzen-Modus ausgetauscht');
assert(resultReplace.personality === 'Kalt, distanziert, kompromisslos.', 'Persönlichkeit wurde ersetzt');
assert(resultReplace.bio === 'Neuanfang nach dem Fall der Gilde.', 'Bio wurde ersetzt');
assert(resultReplace.appearance.hairColor === 'Silberweiß', 'Haarfarbe wurde ersetzt');


// -----------------------------------------------------------------------------
// TEST 3: Kein Inventar-Seiteneffekt
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Kein Inventar-Seiteneffekt ---');
assert(resultSupplement.structuredInventory === baseCharacter.structuredInventory, 'structuredInventory Referenz unverändert in supplement mode');
assert(resultReplace.structuredInventory === baseCharacter.structuredInventory, 'structuredInventory Referenz unverändert in replace mode');
assert(resultSupplement.inventory === baseCharacter.inventory, 'inventory Text unverändert');


// -----------------------------------------------------------------------------
// TEST 4: Keine Fähigkeits-Seiteneffekte
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Keine Fähigkeits-Seiteneffekte ---');
assert(resultSupplement.abilities === baseCharacter.abilities, 'abilities Referenz unverändert');
assert(resultSupplement.powers === baseCharacter.powers, 'powers Referenz unverändert');
assert(resultSupplement.powerSystems === baseCharacter.powerSystems, 'powerSystems Referenz unverändert');
assert(resultSupplement.techniques === baseCharacter.techniques, 'techniques Text unverändert');


// -----------------------------------------------------------------------------
// TEST 5: Keine Berufs-Seiteneffekte
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Keine Berufs-Seiteneffekte ---');
assert(resultSupplement.professionField === baseCharacter.professionField, 'professionField unverändert');
assert(resultSupplement.secondaryProfessions === baseCharacter.secondaryProfessions, 'secondaryProfessions unverändert');
assert(resultSupplement.talents === baseCharacter.talents, 'talents unverändert');
assert(resultSupplement.everydaySkills === baseCharacter.everydaySkills, 'everydaySkills unverändert');


// -----------------------------------------------------------------------------
// TEST 6: TargetId Schutz
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: TargetId Schutz ---');
const contextMismatch: SmartFillContext = {
  section: 'profile',
  targetId: 'char-DIFFERENT-999',
  mode: 'replace'
};

const resultMismatch = applySmartFillUpdates(baseCharacter, aiDataReplace, contextMismatch);
assert(resultMismatch === baseCharacter, 'Charakter bleibt völlig unverändert, wenn targetId nicht übereinstimmt');


// -----------------------------------------------------------------------------
// TEST 7: Full Character bleibt funktionsfähig
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Full Character bleibt funktionsfähig ---');
const contextFull: SmartFillContext = {
  section: 'full_character',
  targetId: 'char-123',
  mode: 'supplement'
};

const aiDataFull = {
  name: 'Theron Vane',
  bio: 'Umfassende neue Vorgeschichte',
  abilities: [
    { id: 'ab-2', name: 'Schattenklinge', category: 'Techniken', description: 'Erzeugt eine Klinge aus Schatten' }
  ]
};

const resultFull = applySmartFillUpdates(baseCharacter, aiDataFull, contextFull);
assert(resultFull.name === 'Theron Vane', 'Full character behält Namen bei');
assert(resultFull.abilities.length === 2, 'Full character hat neue Fähigkeit hinzugefügt');

console.log('\n=== ALL SMART FILL PROFILE TESTS PASSED SUCCESSFULLY! ===');
