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
  extractProgressionState,
  buildCharacterPowerHierarchy
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

// ----------------------------------------------------------------------------
// Test 6: buildCharacterPowerHierarchy Priority (New Data > Legacy)
// ----------------------------------------------------------------------------
console.log('\n--- Test 6: buildCharacterPowerHierarchy Priority ---');

const charWithNewAndOldData: Partial<Character> = {
  id: 'char_hybrid_data',
  name: 'Kaelin Schattenwind',
  // Neue strukturierte Daten
  powerSystems: [
    {
      id: 'sys_haki',
      name: 'Haki',
      systemType: 'Haki',
      resourceName: 'Willenskraft',
      powerIds: ['power_observation_haki']
    }
  ],
  powers: [
    {
      id: 'power_observation_haki',
      powerSystemId: 'sys_haki',
      name: 'Kenbunshoku Haki',
      subtype: 'Wahrnehmung',
      resourceName: 'Willenskraft',
      abilityIds: ['ab_aura_sense'],
      formIds: []
    }
  ],
  characterAbilities: [
    {
      id: 'ab_aura_sense',
      powerId: 'power_observation_haki',
      name: 'Aurenwahrnehmung',
      abilityType: 'Wahrnehmung',
      techniqueIds: ['tech_future_sight']
    }
  ],
  characterTechniques: [
    {
      id: 'tech_future_sight',
      abilityId: 'ab_aura_sense',
      powerId: 'power_observation_haki',
      name: 'Zukunftssicht',
      techniqueType: 'Spezial'
    }
  ],
  // Veraltete Legacy-Daten (sollten ignoriert werden, da neue Daten vorhanden sind)
  powerSources: [
    {
      id: 'ps_old_magic',
      source: 'Alte Magie',
      powerName: 'Altes Mana'
    }
  ]
};

const builtFromNew = buildCharacterPowerHierarchy(charWithNewAndOldData);

assert.strictEqual(builtFromNew.powerSystems.length, 1);
assert.strictEqual(builtFromNew.powerSystems[0].name, 'Haki');
assert.strictEqual(builtFromNew.powers.length, 1);
assert.strictEqual(builtFromNew.powers[0].name, 'Kenbunshoku Haki');
assert.strictEqual(builtFromNew.abilities.length, 1);
assert.strictEqual(builtFromNew.abilities[0].name, 'Aurenwahrnehmung');
assert.strictEqual(builtFromNew.techniques.length, 1);
assert.strictEqual(builtFromNew.techniques[0].name, 'Zukunftssicht');
console.log('[PASS] Test 6: buildCharacterPowerHierarchy prioritizes existing new data correctly');

// ----------------------------------------------------------------------------
// Test 7: Deterministic IDs & Idempotency
// ----------------------------------------------------------------------------
console.log('\n--- Test 7: Deterministic IDs & Idempotency ---');

const legacyCharToTest: Partial<Character> = {
  id: 'char_repeat',
  name: 'Aron Feuerfaust',
  powerSources: [
    {
      id: 'ps_fire_source',
      source: 'Magie',
      powerName: 'Pyromantie',
      cost: 'Mana'
    }
  ],
  baseAbilities: [
    {
      id: 'ba_pyro',
      displayName: 'Pyrokinese',
      element: 'Feuer',
      abilityType: 'creation_manipulation'
    }
  ],
  techniqueList: [
    {
      id: 'tech_fireball',
      name: 'Feuerball',
      category: 'Techniken',
      baseAbilityIds: ['ba_pyro']
    }
  ]
};

const run1 = buildCharacterPowerHierarchy(legacyCharToTest);
const run2 = buildCharacterPowerHierarchy(legacyCharToTest);

assert.strictEqual(run1.powers[0].id, run2.powers[0].id, 'IDs müssen deterministisch und stabil bleiben');
assert.strictEqual(run1.abilities[0].id, run2.abilities[0].id);
assert.strictEqual(run1.techniques[0].id, run2.techniques[0].id);
assert.strictEqual(run1.powers.length, 1, 'Keine Duplikate bei wiederholter Konvertierung');
assert.strictEqual(run1.abilities.length, 1);
assert.strictEqual(run1.techniques.length, 1);
console.log('[PASS] Test 7: Deterministic stable IDs and idempotency verified');

// ----------------------------------------------------------------------------
// Test 8: Non-Power Domains (Waffenbeherrschung, Berufe) Excluded from CharacterTechnique
// ----------------------------------------------------------------------------
console.log('\n--- Test 8: Domain Separation (Weapons/Professions not in CharacterTechnique) ---');

const mixedCharacter: Partial<Character> = {
  id: 'char_mixed',
  name: 'Gareth der Schmiedemeister',
  powerSources: [
    {
      id: 'ps_earth',
      source: 'Magie',
      powerName: 'Erdmagie',
      cost: 'Mana'
    }
  ],
  baseAbilities: [
    {
      id: 'ba_geo',
      displayName: 'Geokinese',
      element: 'Erde',
      abilityType: 'manipulation'
    }
  ],
  techniqueList: [
    {
      id: 'tech_rock_throw',
      name: 'Felswurf',
      category: 'Techniken',
      baseAbilityIds: ['ba_geo']
    },
    {
      id: 'weapon_sword_mastery',
      name: 'Einhandschwert-Meisterschaft',
      category: 'Waffenbeherrschung',
      weaponType: 'Schwert'
    },
    {
      id: 'profession_smithing',
      name: 'Meisterschmied',
      category: 'Berufe'
    },
    {
      id: 'everyday_cooking',
      name: 'Lagerfeuer-Kochen',
      category: 'Alltagskompetenzen'
    }
  ]
};

const hierarchyClean = buildCharacterPowerHierarchy(mixedCharacter);

assert.strictEqual(hierarchyClean.techniques.length, 1, 'Nur magische/taktische Techniken in CharacterTechnique');
assert.strictEqual(hierarchyClean.techniques[0].name, 'Felswurf');
const hasWeapon = hierarchyClean.techniques.some(t => t.id === 'weapon_sword_mastery');
const hasProf = hierarchyClean.techniques.some(t => t.id === 'profession_smithing');
const hasEveryday = hierarchyClean.techniques.some(t => t.id === 'everyday_cooking');
assert.strictEqual(hasWeapon, false, 'Waffenbeherrschung nicht in CharacterTechnique');
assert.strictEqual(hasProf, false, 'Berufe nicht in CharacterTechnique');
assert.strictEqual(hasEveryday, false, 'Alltagskompetenzen nicht in CharacterTechnique');
console.log('[PASS] Test 8: Strict separation of power techniques vs weapons/professions verified');

// ----------------------------------------------------------------------------
// Test 9: Graph Relationship Integrity
// ----------------------------------------------------------------------------
console.log('\n--- Test 9: Complete Graph Relationship Integrity ---');

const powerSys = hierarchyClean.powerSystems[0];
const powerEntry = hierarchyClean.powers[0];
const abilityEntry = hierarchyClean.abilities[0];
const techEntry = hierarchyClean.techniques[0];

assert.ok(powerSys.powerIds?.includes(powerEntry.id), 'PowerSystem -> CharacterPower');
assert.strictEqual(powerEntry.powerSystemId, powerSys.id, 'CharacterPower -> PowerSystem');
assert.ok(powerEntry.abilityIds?.includes(abilityEntry.id), 'CharacterPower -> CharacterAbility');
assert.strictEqual(abilityEntry.powerId, powerEntry.id, 'CharacterAbility -> CharacterPower');
assert.ok(abilityEntry.techniqueIds?.includes(techEntry.id), 'CharacterAbility -> CharacterTechnique');
assert.strictEqual(techEntry.abilityId, abilityEntry.id, 'CharacterTechnique -> CharacterAbility');
assert.strictEqual(techEntry.powerId, powerEntry.id, 'CharacterTechnique -> CharacterPower');

console.log('[PASS] Test 9: Graph relationships in all directions verified');

// ----------------------------------------------------------------------------
// Test A: Legacy ohne ID (deterministische Ability-ID über 3 Aufrufe)
// ----------------------------------------------------------------------------
console.log('\n--- Test A: Legacy ohne ID (deterministische Ability-ID) ---');

const legacyCharNoAbilityId = {
  powerSources: [
    {
      id: 'ps_arcane',
      source: 'Arkanmagie',
      powerName: 'Arkanum'
    }
  ],
  baseAbilities: [
    {
      displayName: 'Arkanokinese',
      element: 'Neutral',
      abilityType: 'creation_manipulation'
    }
  ]
};

const norm1 = buildCharacterPowerHierarchy(legacyCharNoAbilityId);
const norm2 = buildCharacterPowerHierarchy(legacyCharNoAbilityId);
const norm3 = buildCharacterPowerHierarchy(legacyCharNoAbilityId);

assert.ok(norm1.abilities[0].id.startsWith('ba_'), 'Generierte deterministische ID');
assert.strictEqual(norm1.abilities[0].id, norm2.abilities[0].id, 'ID Aufruf 1 == Aufruf 2');
assert.strictEqual(norm2.abilities[0].id, norm3.abilities[0].id, 'ID Aufruf 2 == Aufruf 3');
console.log(`[PASS] Test A: Deterministische Ability-ID (${norm1.abilities[0].id}) über 3 Läufe identisch`);

// ----------------------------------------------------------------------------
// Test B: Legacy-Technik ohne ID (deterministische Technik-ID über 2 Aufrufe)
// ----------------------------------------------------------------------------
console.log('\n--- Test B: Legacy-Technik ohne ID (deterministische Technik-ID) ---');

const legacyCharNoTechId = {
  powerSources: [
    {
      id: 'ps_pyro',
      source: 'Feuermagie',
      powerName: 'Pyromantie'
    }
  ],
  techniques: [
    {
      name: 'Flammenstoß',
      category: 'Techniken',
      type: 'Angriff'
    }
  ]
};

const techNorm1 = buildCharacterPowerHierarchy(legacyCharNoTechId);
const techNorm2 = buildCharacterPowerHierarchy(legacyCharNoTechId);

assert.ok(techNorm1.techniques[0].id.startsWith('tech_'), 'Generierte deterministische Technik-ID');
assert.strictEqual(techNorm1.techniques[0].id, techNorm2.techniques[0].id, 'Technik-ID Aufruf 1 == Aufruf 2');
console.log(`[PASS] Test B: Deterministische Technik-ID (${techNorm1.techniques[0].id}) über 2 Läufe identisch`);

// ----------------------------------------------------------------------------
// Test C: Mehrere Powers eines Systems (Magie mit Mana, Runen, Heilung)
// ----------------------------------------------------------------------------
console.log('\n--- Test C: Mehrere Powers eines gemeinsamen Systems ---');

const multiPowerChar: Partial<Character> = {
  powerSystems: [
    {
      id: 'sys_magic',
      name: 'Magie',
      systemType: 'Magie',
      powerIds: []
    }
  ],
  powers: [
    {
      id: 'power_mana_manipulation',
      powerSystemId: 'sys_magic',
      name: 'Mana-Manipulation'
    },
    {
      id: 'power_rune_magic',
      powerSystemId: 'sys_magic',
      name: 'Runenmagie'
    },
    {
      id: 'power_healing_magic',
      powerSystemId: 'sys_magic',
      name: 'Heilmagie'
    }
  ]
};

const hierarchyMulti = buildCharacterPowerHierarchy(multiPowerChar);

assert.strictEqual(hierarchyMulti.powerSystems.length, 1, 'Nur 1 gemeinsames Kraftsystem');
assert.strictEqual(hierarchyMulti.powerSystems[0].id, 'sys_magic');
assert.strictEqual(hierarchyMulti.powers.length, 3);
assert.strictEqual(hierarchyMulti.powers[0].powerSystemId, 'sys_magic');
assert.strictEqual(hierarchyMulti.powers[1].powerSystemId, 'sys_magic');
assert.strictEqual(hierarchyMulti.powers[2].powerSystemId, 'sys_magic');

assert.strictEqual(hierarchyMulti.powerSystems[0].powerIds?.length, 3);
assert.ok(hierarchyMulti.powerSystems[0].powerIds?.includes('power_mana_manipulation'));
assert.ok(hierarchyMulti.powerSystems[0].powerIds?.includes('power_rune_magic'));
assert.ok(hierarchyMulti.powerSystems[0].powerIds?.includes('power_healing_magic'));
console.log('[PASS] Test C: Mehrere Powers zeigen auf dasselbe System & System enthält alle 3 Power-IDs');

// ----------------------------------------------------------------------------
// Test D: Falsche Referenz (ungültige powerSystemId wird korrigiert)
// ----------------------------------------------------------------------------
console.log('\n--- Test D: Falsche Referenz (ungültige powerSystemId) ---');

const charInvalidSysRef: Partial<Character> = {
  powerSystems: [
    {
      id: 'sys_valid_solar',
      name: 'Solarmagie',
      powerIds: []
    }
  ],
  powers: [
    {
      id: 'power_sun_beam',
      powerSystemId: 'sys_non_existent_phantom', // Ungültiges System!
      name: 'Sonnenstrahl'
    }
  ]
};

const hierarchyD = buildCharacterPowerHierarchy(charInvalidSysRef);

assert.strictEqual(hierarchyD.powers[0].powerSystemId, 'sys_valid_solar', 'Power wurde dem gültigen System zugeordnet');
assert.ok(hierarchyD.powerSystems[0].powerIds?.includes('power_sun_beam'), 'System powerIds aktualisiert');
assert.strictEqual(hierarchyD.powerSystems[0].powerIds?.includes('sys_non_existent_phantom'), false, 'Keine Phantom-ID');
console.log('[PASS] Test D: Ungültige System-Referenz sauber behoben');

// ----------------------------------------------------------------------------
// Test E: Falsche Systemliste (System A hat fälschlicherweise Power 2)
// ----------------------------------------------------------------------------
console.log('\n--- Test E: Falsche Systemliste bereinigen ---');

const charMismatchedLists: Partial<Character> = {
  powerSystems: [
    {
      id: 'sys_A',
      name: 'System A',
      powerIds: ['power_1', 'power_2'] // power_2 gehört eigentlich zu System B!
    },
    {
      id: 'sys_B',
      name: 'System B',
      powerIds: []
    }
  ],
  powers: [
    {
      id: 'power_1',
      powerSystemId: 'sys_A',
      name: 'Kraft 1'
    },
    {
      id: 'power_2',
      powerSystemId: 'sys_B',
      name: 'Kraft 2'
    }
  ]
};

const hierarchyE = buildCharacterPowerHierarchy(charMismatchedLists);

const sysA = hierarchyE.powerSystems.find(s => s.id === 'sys_A');
const sysB = hierarchyE.powerSystems.find(s => s.id === 'sys_B');

assert.deepStrictEqual(sysA?.powerIds, ['power_1'], 'System A darf nur Power 1 enthalten');
assert.deepStrictEqual(sysB?.powerIds, ['power_2'], 'System B darf nur Power 2 enthalten');
console.log('[PASS] Test E: Falsche Systemliste vollständig synchronisiert');

// ----------------------------------------------------------------------------
// Test F: Wiederholte Normalisierung (3 Durchläufe, Idempotenz & keine Duplikate)
// ----------------------------------------------------------------------------
console.log('\n--- Test F: Wiederholte Normalisierung & Idempotenz ---');

const recursiveInput = { ...hierarchyMulti };
const round1 = buildCharacterPowerHierarchy(recursiveInput);
const round2 = buildCharacterPowerHierarchy(round1);
const round3 = buildCharacterPowerHierarchy(round2);

assert.strictEqual(round3.powerSystems.length, 1);
assert.strictEqual(round3.powers.length, 3);
assert.strictEqual(round3.powerSystems[0].powerIds?.length, 3);
assert.deepStrictEqual(round1, round3, 'Durchlauf 1 und 3 sind exakt identisch');
console.log('[PASS] Test F: Wiederholte Normalisierung erzeugt keine Duplikate oder veränderten Listen');

console.log('\n✨ ALL POWER-ABILITY-TECHNIQUE-FORM TESTS PASSED SUCCESSFULLY! ✨');
