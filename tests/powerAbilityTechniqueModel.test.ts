import assert from 'assert';
import {
  PowerSystem,
  CharacterPower,
  CharacterAbility,
  CharacterTechnique,
  CharacterPowerForm,
  ProgressionState,
  Character,
  CharacterPowerSource,
  BaseAbility,
  TechniqueItem
} from '../types';
import {
  powerSourceToPowerSystem,
  powerSourceToCharacterPower,
  baseAbilityToCharacterAbility,
  techniqueItemToCharacterTechnique,
  techniqueItemToCharacterPowerForm,
  characterPowerToLegacyPower,
  characterAbilityToLegacyBaseAbility,
  characterTechniqueToLegacyTechnique,
  characterPowerFormToLegacyTransformation,
  convertLegacyToPowerHierarchy,
  convertPowerHierarchyToLegacy,
  extractProgressionState
} from '../utils/abilityHierarchy';

console.log('=== TEST SUITE: POWER - ABILITY - TECHNIQUE - FORM DATA MODEL ===\n');

// ----------------------------------------------------------------------------
// Test 1: Teufelsfrucht Example Model Architecture
// ----------------------------------------------------------------------------
console.log('--- Test 1: Teufelsfrucht Example (Eis-Kitsune) ---');

const devilFruitSystem: PowerSystem = {
  id: 'sys_devil_fruit',
  name: 'Teufelsfrucht',
  systemType: 'Teufelsfrucht',
  origin: 'Große Schatzmeere / Teufelsfrüchte',
  resourceName: 'Ausdauer',
  powerIds: ['power_ice_kitsune']
};

const iceKitsunePower: CharacterPower = {
  id: 'power_ice_kitsune',
  powerSystemId: 'sys_devil_fruit',
  name: 'Mystische Zoan – Eis-Kitsune',
  subtype: 'Mystische Zoan',
  element: 'Eis',
  resourceName: 'Ausdauer',
  abilityIds: ['ab_ice_create', 'ab_kitsune_form', 'ab_fox_senses', 'ab_illusions'],
  formIds: ['form_hybrid_kitsune'],
  progression: {
    level: 3,
    xp: 450,
    maxLevel: 10,
    xpNeeded: 600,
    progressionLogic: 'ep'
  }
};

const kitsuneAbilities: CharacterAbility[] = [
  {
    id: 'ab_ice_create',
    powerId: 'power_ice_kitsune',
    name: 'Eis erzeugen',
    description: 'Ermöglicht das spontane Gefrieren der Umgebung und Erschaffen von Eis.',
    abilityType: 'Erzeugung',
    element: 'Eis',
    techniqueIds: ['tech_ice_projectile', 'tech_frost_paw', 'tech_ice_storm'],
    progression: { level: 2, xp: 120, maxLevel: 5, progressionLogic: 'ep' }
  },
  {
    id: 'ab_fox_senses',
    powerId: 'power_ice_kitsune',
    name: 'Fuchssinne',
    description: 'Verfeinerte Sinne, Geruchssinn und Wahrnehmung von Gefahren.',
    abilityType: 'Passiv',
    element: 'Spirit',
    techniqueIds: [], // Rein passiv - keine künstliche Technik notwendig!
    progression: { level: 3, points: 30, progressionLogic: 'milestone' }
  },
  {
    id: 'ab_illusions',
    powerId: 'power_ice_kitsune',
    name: 'Illusionen',
    description: 'Spiegelungen im Eis und trügerische Fuchslichter.',
    abilityType: 'Manipulation',
    element: 'Licht',
    techniqueIds: ['tech_fox_jump'],
    progression: { level: 1, xp: 0, maxLevel: 5, progressionLogic: 'ep' }
  }
];

const kitsuneTechniques: CharacterTechnique[] = [
  {
    id: 'tech_ice_projectile',
    abilityId: 'ab_ice_create',
    powerId: 'power_ice_kitsune',
    name: 'Eisprojektil',
    description: 'Feuert messerscharfe Eissplitter ab.',
    techniqueType: 'Angriff',
    mode: 'Fernkampf',
    element: 'Eis',
    cost: '15 Ausdauer',
    costValue: 15,
    costResourceName: 'Ausdauer',
    costFormula: 'absolut',
    range: '20 Meter'
  },
  {
    id: 'tech_frost_paw',
    abilityId: 'ab_ice_create',
    powerId: 'power_ice_kitsune',
    name: 'Frostpfote',
    description: 'Nahkampfangriff mit vereisten Klauen.',
    techniqueType: 'Angriff',
    mode: 'Nahkampf',
    element: 'Eis',
    cost: '10 Ausdauer',
    costValue: 10,
    costResourceName: 'Ausdauer'
  },
  {
    id: 'tech_ice_storm',
    abilityId: 'ab_ice_create',
    powerId: 'power_ice_kitsune',
    name: 'Eissturm',
    description: 'Flächendeckender eisiger Blizzard.',
    techniqueType: 'Angriff',
    mode: 'Bereich',
    element: 'Eis',
    cost: '40 Ausdauer',
    costValue: 40,
    costResourceName: 'Ausdauer'
  },
  {
    id: 'tech_fox_jump',
    abilityId: 'ab_illusions',
    powerId: 'power_ice_kitsune',
    name: 'Kitsune-Sprung',
    description: 'Täuschender Sprung, der ein kurzes Nachbild hinterlässt.',
    techniqueType: 'Bewegung',
    mode: 'Schnellzauber',
    element: 'Licht',
    cost: '12 Ausdauer',
    costValue: 12,
    costResourceName: 'Ausdauer'
  }
];

const hybridForm: CharacterPowerForm = {
  id: 'form_hybrid_kitsune',
  powerId: 'power_ice_kitsune',
  name: 'Hybridform',
  description: 'Halb Mensch, halb Eis-Kitsune mit Fuchsohren, 9 eisblauen Schweifen und gesteigerter Kälteresistenz.',
  formType: 'Zoan-Hybrid',
  abilityIds: ['ab_ice_create', 'ab_fox_senses', 'ab_illusions'],
  techniqueIds: ['tech_frost_paw'],
  modifiers: {
    strength: '+20%',
    agility: '+35%',
    iceDamageBonus: '+50%'
  },
  progression: {
    level: 2,
    trainingUnits: 15,
    trainingProgress: 60,
    progressionLogic: 'training'
  }
};

assert.strictEqual(devilFruitSystem.id, 'sys_devil_fruit');
assert.strictEqual(iceKitsunePower.powerSystemId, 'sys_devil_fruit');
assert.strictEqual(kitsuneAbilities.length, 3);
assert.strictEqual(kitsuneAbilities[1].techniqueIds?.length, 0, 'Passive Fuchssinne benötigt keine Pflicht-Technik');
assert.strictEqual(kitsuneTechniques[0].abilityId, 'ab_ice_create');
assert.strictEqual(kitsuneTechniques[0].powerId, 'power_ice_kitsune');
assert.strictEqual(hybridForm.modifiers?.agility, '+35%');
console.log('[PASS] Test 1: Teufelsfrucht structure valid & relationships intact');

// ----------------------------------------------------------------------------
// Test 2: Quirk Example (Fliegen)
// ----------------------------------------------------------------------------
console.log('\n--- Test 2: Quirk Example (Fliegen) ---');

const quirkSystem: PowerSystem = {
  id: 'sys_quirk',
  name: 'Quirk',
  systemType: 'Quirk',
  resourceName: 'Ausdauer'
};

const flightPower: CharacterPower = {
  id: 'power_flight',
  powerSystemId: 'sys_quirk',
  name: 'Fliegen',
  description: 'Genetische Fähigkeit zur Aufhebung und Manipulation der eigenen Schwerkraft.',
  resourceName: 'Ausdauer',
  abilityIds: ['ab_hover', 'ab_flight_control', 'ab_air_maneuver']
};

const flightAbilities: CharacterAbility[] = [
  {
    id: 'ab_hover',
    powerId: 'power_flight',
    name: 'Schweben',
    abilityType: 'Bewegung'
  },
  {
    id: 'ab_flight_control',
    powerId: 'power_flight',
    name: 'Flugkontrolle',
    abilityType: 'Manipulation'
  },
  {
    id: 'ab_air_maneuver',
    powerId: 'power_flight',
    name: 'Luftmanöver',
    abilityType: 'Bewegung',
    techniqueIds: ['tech_dive', 'tech_air_blast', 'tech_evasive_flight']
  }
];

const flightTechniques: CharacterTechnique[] = [
  {
    id: 'tech_dive',
    abilityId: 'ab_air_maneuver',
    powerId: 'power_flight',
    name: 'Sturzflug',
    techniqueType: 'Angriff'
  },
  {
    id: 'tech_air_blast',
    abilityId: 'ab_air_maneuver',
    powerId: 'power_flight',
    name: 'Luftstoß',
    techniqueType: 'Angriff'
  },
  {
    id: 'tech_evasive_flight',
    abilityId: 'ab_air_maneuver',
    powerId: 'power_flight',
    name: 'Ausweichflug',
    techniqueType: 'Bewegung'
  }
];

assert.strictEqual(flightPower.powerSystemId, 'sys_quirk');
assert.strictEqual(flightAbilities[2].techniqueIds?.length, 3);
assert.strictEqual(flightTechniques[0].name, 'Sturzflug');
console.log('[PASS] Test 2: Quirk example model verified');

// ----------------------------------------------------------------------------
// Test 3: Magie Example (Mana-Manipulation)
// ----------------------------------------------------------------------------
console.log('\n--- Test 3: Magie Example (Mana-Manipulation) ---');

const magicSystem: PowerSystem = {
  id: 'sys_magic',
  name: 'Magie',
  systemType: 'Magie',
  resourceName: 'Mana'
};

const manaPower: CharacterPower = {
  id: 'power_mana_manipulation',
  powerSystemId: 'sys_magic',
  name: 'Mana-Manipulation',
  resourceName: 'Mana',
  abilityIds: ['ab_mana_sense', 'ab_mana_gather', 'ab_mana_shaping', 'ab_mana_reinforce']
};

const manaAbilities: CharacterAbility[] = [
  { id: 'ab_mana_sense', powerId: 'power_mana_manipulation', name: 'Mana wahrnehmen', abilityType: 'Wahrnehmung' },
  { id: 'ab_mana_gather', powerId: 'power_mana_manipulation', name: 'Mana sammeln', abilityType: 'Erzeugung' },
  { id: 'ab_mana_shaping', powerId: 'power_mana_manipulation', name: 'Mana formen', abilityType: 'Manipulation', techniqueIds: ['tech_mana_blast', 'tech_mana_shield'] },
  { id: 'ab_mana_reinforce', powerId: 'power_mana_manipulation', name: 'Mana verstärken', abilityType: 'Unterstützung', techniqueIds: ['tech_mana_impulse'] }
];

const manaTechniques: CharacterTechnique[] = [
  { id: 'tech_mana_blast', abilityId: 'ab_mana_shaping', powerId: 'power_mana_manipulation', name: 'Mana-Projektil', techniqueType: 'Angriff', cost: '10 Mana' },
  { id: 'tech_mana_shield', abilityId: 'ab_mana_shaping', powerId: 'power_mana_manipulation', name: 'Manaschild', techniqueType: 'Verteidigung', cost: '15 Mana' },
  { id: 'tech_mana_impulse', abilityId: 'ab_mana_reinforce', powerId: 'power_mana_manipulation', name: 'Mana-Impuls', techniqueType: 'Support', cost: '20 Mana' }
];

assert.strictEqual(manaAbilities[0].name, 'Mana wahrnehmen');
assert.strictEqual(manaTechniques[1].techniqueType, 'Verteidigung');
console.log('[PASS] Test 3: Magie example model verified');

// ----------------------------------------------------------------------------
// Test 4: Migration & Round-Trip with Legacy Character
// ----------------------------------------------------------------------------
console.log('\n--- Test 4: Legacy Character Migration & Round-Trip ---');

const legacyCharacter: Partial<Character> = {
  id: 'char_test_01',
  name: 'Lyra Frostklaue',
  powerSources: [
    {
      id: 'ps_kitsune',
      source: 'Teufelsfrucht',
      powerName: 'Eis-Kitsune Zoan',
      powerDescription: 'Mystische Teufelsfrucht der Eisfüchsin',
      cost: 'Ausdauer'
    }
  ],
  baseAbilities: [
    {
      id: 'ba_cryo',
      powerSourceId: 'ps_kitsune',
      displayName: 'Kryokinese',
      name: 'Kryokinese',
      element: 'Eis',
      abilityType: 'creation_manipulation',
      description: 'Erschaffung und Manipulation von Eis.',
      level: 4,
      xp: 250,
      maxLevel: 10,
      progressionLogic: 'ep',
      techniqueIds: ['tech_spear', 'tech_wall']
    }
  ],
  techniqueList: [
    {
      id: 'tech_spear',
      name: 'Eisspeer',
      description: 'Ein spitzer Speer aus Eis.',
      category: 'Techniken',
      type: 'Angriff',
      baseAbilityIds: ['ba_cryo'],
      powerSourceId: 'ps_kitsune',
      cost: '15 Ausdauer',
      costValue: 15,
      costResourceName: 'Ausdauer',
      level: 2,
      xp: 50,
      progressionLogic: 'ep'
    },
    {
      id: 'tech_wall',
      name: 'Eiswand',
      description: 'Errichtet eine schützende Wand aus ewigem Eis.',
      category: 'Techniken',
      type: 'Verteidigung',
      baseAbilityIds: ['ba_cryo'],
      powerSourceId: 'ps_kitsune',
      cost: '25 Ausdauer',
      costValue: 25,
      costResourceName: 'Ausdauer'
    },
    {
      id: 'tech_hybrid',
      name: 'Kitsune Hybridform',
      transformName: 'Kitsune Hybridform',
      description: 'Verwandlung in die Neunschwänzige Halb-Fuchs-Gestalt.',
      category: 'Transformationen',
      type: 'Transformation',
      powerSourceId: 'ps_kitsune',
      baseAbilityIds: ['ba_cryo'],
      transformationModifiers: [
        { transformationId: 'form_hybrid', overrideName: 'Kryo-Kitsune Kralle', overrideCost: '20 Ausdauer' }
      ]
    }
  ]
};

// 4a. Migration in neue Struktur
const hierarchy = convertLegacyToPowerHierarchy(legacyCharacter);

assert.strictEqual(hierarchy.powerSystems.length, 1);
assert.strictEqual(hierarchy.powerSystems[0].systemType, 'Teufelsfrucht');
assert.strictEqual(hierarchy.powers.length, 1);
assert.strictEqual(hierarchy.powers[0].name, 'Eis-Kitsune Zoan');
assert.strictEqual(hierarchy.powers[0].powerSystemId, hierarchy.powerSystems[0].id);

assert.strictEqual(hierarchy.abilities.length, 1);
assert.strictEqual(hierarchy.abilities[0].name, 'Kryokinese');
assert.strictEqual(hierarchy.abilities[0].progression?.level, 4);
assert.strictEqual(hierarchy.abilities[0].progression?.progressionLogic, 'ep');

assert.strictEqual(hierarchy.techniques.length, 2);
assert.strictEqual(hierarchy.techniques[0].name, 'Eisspeer');
assert.strictEqual(hierarchy.techniques[0].costValue, 15);
assert.strictEqual(hierarchy.techniques[1].name, 'Eiswand');

assert.strictEqual(hierarchy.forms.length, 1);
assert.strictEqual(hierarchy.forms[0].name, 'Kitsune Hybridform');
assert.strictEqual(hierarchy.forms[0].formType, 'Transformation');

// 4b. Rückwärtskonvertierung in Legacy-Format
const backToLegacy = convertPowerHierarchyToLegacy(hierarchy);

assert.strictEqual(backToLegacy.powerSources.length, 1);
assert.strictEqual(backToLegacy.powerSources[0].powerName, 'Eis-Kitsune Zoan');
assert.strictEqual(backToLegacy.baseAbilities.length, 1);
assert.strictEqual(backToLegacy.baseAbilities[0].displayName, 'Kryokinese');
assert.strictEqual(backToLegacy.baseAbilities[0].level, 4);

assert.strictEqual(backToLegacy.techniques.length, 3);
const migratedSpear = backToLegacy.techniques.find(t => t.id === 'tech_spear');
assert.ok(migratedSpear, 'Eisspeer erhalten');
assert.strictEqual(migratedSpear?.costValue, 15);
assert.strictEqual(migratedSpear?.costResourceName, 'Ausdauer');

const migratedForm = backToLegacy.techniques.find(t => t.id === 'tech_hybrid');
assert.ok(migratedForm, 'Hybridform erhalten');
assert.strictEqual(migratedForm?.category, 'Transformationen');

console.log('[PASS] Test 4: Migration & Round-Trip completely lossless');

// ----------------------------------------------------------------------------
// Test 5: extractProgressionState Utility
// ----------------------------------------------------------------------------
console.log('\n--- Test 5: extractProgressionState Utility ---');

const itemWithMixedProgression = {
  id: 'item_1',
  name: 'TestItem',
  level: 5,
  xp: 1200,
  maxLevel: 20,
  xpNeeded: 1500,
  progressionLogic: 'ep',
  xpGainPerUse: 25,
  trainingRequired: 10,
  trainingUnits: 4,
  trainingProgress: 40,
  score: 40,
  milestoneRequirement: 'Besiege einen Drachen',
  milestoneNote: 'Fast geschafft',
  points: 50,
  isUnlocked: true,
  isLearnable: true
};

const extracted = extractProgressionState(itemWithMixedProgression);
assert.ok(extracted);
assert.strictEqual(extracted?.level, 5);
assert.strictEqual(extracted?.xp, 1200);
assert.strictEqual(extracted?.progressionLogic, 'ep');
assert.strictEqual(extracted?.trainingProgress, 40);
assert.strictEqual(extracted?.milestoneRequirement, 'Besiege einen Drachen');
assert.strictEqual(extracted?.isUnlocked, true);

const emptyExtracted = extractProgressionState({ id: 'empty' });
assert.strictEqual(emptyExtracted, undefined, 'Objekt ohne Progressionsfelder liefert undefined');

console.log('[PASS] Test 5: extractProgressionState correctly extracts all progression attributes');

console.log('\n✨ ALL POWER-ABILITY-TECHNIQUE-FORM TESTS PASSED SUCCESSFULLY! ✨');
