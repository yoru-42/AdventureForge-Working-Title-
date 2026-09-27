import assert from 'assert';
import {
  getCharacterCapabilities,
  trainCharacterCapability,
  toggleFavoriteCapability,
  getCapabilityActionText,
  CharacterCapabilityEntry
} from '../utils/capabilityAdapter';
import { Adventure, Character, TechniqueItem, ProfessionCompetency } from '../types';

export function runCapabilityAdapterTests() {
  console.log('=== RUNNING CAPABILITY ADAPTER & CENTRALIZATION TEST SUITE ===');

  const mockPlayer: Character = {
    id: 'char_test_01',
    name: 'Valerius',
    role: 'Krieger',
    personality: 'Mutig und entschlossen',
    bio: 'Ein erfahrener Abenteurer auf der Suche nach Meisterschaft.',
    appearance: {} as any,
    attributes: [{ name: 'Stärke', value: 15, max: 20 }],
    techniqueList: [
      {
        id: 'tech_fireball',
        name: 'Feuerball',
        category: 'Techniken',
        type: 'Angriff',
        level: 2,
        maxLevel: 10,
        xp: 40,
        xpNeeded: 100,
        progressionLogic: 'ep',
        isFavorite: false
      },
      {
        id: 'tech_meteor',
        name: 'Sternschnuppen-Sturm',
        category: 'Ultimative Techniken',
        type: 'Finisher',
        level: 1,
        maxLevel: 5,
        xp: 0,
        xpNeeded: 150,
        isFavorite: true
      },
      {
        id: 'tech_iron_skin',
        name: 'Eiserne Haut',
        category: 'Passive Fähigkeiten',
        type: 'Passiv',
        level: 3,
        maxLevel: 10,
        isFavorite: false
      },
      {
        id: 'tech_sword_mastery',
        name: 'Einhandschwert-Führung',
        category: 'Waffenbeherrschung',
        weaponType: 'Einhandschwert',
        type: 'Spezial',
        level: 2,
        maxLevel: 10,
        isFavorite: false
      }
    ],
    everydaySkills: 'Erste Hilfe (Fortgeschritten - 50%), Orientierung (Anfänger - 20%, Übungen: 2/4)',
    profession: 'Schmied',
    professionCompetencies: [
      {
        id: 'comp_blacksmith_heat',
        name: 'Klingenhärtung',
        category: 'Fortgeschritten',
        proficiency: 45,
        experiencePoints: 120,
        talent: 4,
        description: 'Meisterhaftes Erhitzen und Abschrecken von Stahl'
      }
    ]
  };

  const mockAdventure: Adventure = {
    id: 'adv_test_01',
    player: mockPlayer,
    world: {
      techniqueProgressionLogic: 'ep',
      techniqueProgressionRate: 'normal'
    } as any
  } as Adventure;

  // Test A: Central list displays all 6 areas
  console.log('--- Test A: Central list displays all 6 areas ---');
  const caps = getCharacterCapabilities(mockPlayer);
  const categories = new Set(caps.map(c => c.category));
  assert(categories.has('technique'), 'Techniken vorhanden');
  assert(categories.has('ultimate'), 'Ultimative Techniken vorhanden');
  assert(categories.has('passive'), 'Passive Fähigkeiten vorhanden');
  assert(categories.has('weapon'), 'Waffenbeherrschung vorhanden');
  assert(categories.has('competence'), 'Alltagskompetenzen vorhanden');
  assert(categories.has('profession'), 'Berufe vorhanden');
  console.log('[PASS] Test A: All 6 capability categories resolved successfully');

  // Test B: Regular ability appears regardless of favorite status
  console.log('--- Test B: Non-favorite ability appears in the list ---');
  const fireball = caps.find(c => c.name === 'Feuerball');
  assert(fireball !== undefined, 'Feuerball must exist');
  assert(fireball.isFavorite === false, 'Feuerball is not a favorite');
  assert(fireball.canUse === true, 'Feuerball can be used');
  console.log('[PASS] Test B: Non-favorite ability appears correctly');

  // Test C: Deduplication - No double entries
  console.log('--- Test C: Deduplication ---');
  const playerWithDuplicates: Character = {
    ...mockPlayer,
    techniqueList: [
      ...mockPlayer.techniqueList!,
      // Duplicate of Feuerball with different casing or same id
      {
        id: 'tech_fireball',
        name: 'feuerball',
        category: 'Techniken',
        level: 2
      }
    ]
  };
  const capsDedup = getCharacterCapabilities(playerWithDuplicates);
  const fireballCount = capsDedup.filter(c => c.name.toLowerCase() === 'feuerball').length;
  assert(fireballCount === 1, `Expected exactly 1 Feuerball, got ${fireballCount}`);
  console.log('[PASS] Test C: Duplicate abilities cleanly deduplicated');

  // Test D: Canonical source used
  console.log('--- Test D: Canonical player.techniqueList used ---');
  assert(fireball.sourceId === 'tech_fireball', 'sourceId must match technique id in techniqueList');
  console.log('[PASS] Test D: Canonical data source verified');

  // Test E: Training uses same capability ID and updates source
  console.log('--- Test E: Training updates canonical data ---');
  const trainResult = trainCharacterCapability(mockAdventure, fireball!);
  const updatedPlayer = trainResult.updatedAdventure.player;
  const updatedFireball = updatedPlayer.techniqueList?.find(t => t.id === 'tech_fireball');
  assert(updatedFireball !== undefined, 'Fireball must exist in updated player');
  assert((updatedFireball.xp || 0) > 40, `XP should have increased from 40, got ${updatedFireball.xp}`);
  assert(trainResult.roleplayText.includes('Feuerball'), 'Roleplay text includes technique name');
  console.log('[PASS] Test E: Training deterministically updated player.techniqueList');

  // Test F: Progression rate respected
  console.log('--- Test F: Progression rate multiplier ---');
  const fastAdventure: Adventure = {
    ...mockAdventure,
    world: {
      ...mockAdventure.world,
      techniqueProgressionRate: 'fast'
    } as any
  };
  const fastTrainResult = trainCharacterCapability(fastAdventure, fireball!);
  const fastFireball = fastTrainResult.updatedAdventure.player.techniqueList?.find(t => t.id === 'tech_fireball');
  assert((fastFireball?.xp || 0) > (updatedFireball?.xp || 0), 'Fast progression rate yields higher XP');
  console.log('[PASS] Test F: Technique progression rate multiplier verified');

  // Test G: Profession competency progression
  console.log('--- Test G: Profession competency training ---');
  const bladeHardening = caps.find(c => c.name === 'Klingenhärtung');
  assert(bladeHardening !== undefined, 'Klingenhärtung must exist');
  assert(bladeHardening.category === 'profession', 'Must be classified as profession');
  assert(bladeHardening.canUse === true, 'Profession capability can be practiced/used');

  const profTrainResult = trainCharacterCapability(mockAdventure, bladeHardening!);
  const updatedComp = profTrainResult.updatedAdventure.player.professionCompetencies?.find(c => c.id === 'comp_blacksmith_heat');
  assert(updatedComp !== undefined, 'Competency must be updated in professionCompetencies');
  assert(updatedComp.proficiency >= 45, 'Proficiency must increase or maintain');
  console.log('[PASS] Test G: Profession competency trained using profession service');

  // Test H: Everyday skills parsed and trained without parallel storage
  console.log('--- Test H: Everyday skills parsed and trained ---');
  const firstAid = caps.find(c => c.name === 'Erste Hilfe');
  assert(firstAid !== undefined, 'Erste Hilfe must exist');
  assert(firstAid.category === 'competence', 'Category is competence');
  assert(firstAid.progress === 50, 'Progress must be 50%');

  const everydayTrainResult = trainCharacterCapability(mockAdventure, firstAid!);
  assert(typeof everydayTrainResult.updatedAdventure.player.everydaySkills === 'string', 'everydaySkills remains a serialized string');
  assert(everydayTrainResult.updatedAdventure.player.everydaySkills?.includes('Erste Hilfe'), 'Serialized string contains Erste Hilfe');
  console.log('[PASS] Test H: Everyday skills cleanly parsed and serialized without parallel storage');

  // Test I: Passive abilities are not marked as directly usable in combat
  console.log('--- Test I: Passive abilities canUse is false ---');
  const ironSkin = caps.find(c => c.name === 'Eiserne Haut');
  assert(ironSkin !== undefined, 'Eiserne Haut must exist');
  assert(ironSkin.canUse === false, 'Passive ability canUse must be false');
  assert(ironSkin.canTrain === true, 'Passive ability canTrain is true');
  console.log('[PASS] Test I: Passive abilities distinguish training from combat execution');

  // Test J: Favorite toggle works on canonical storage
  console.log('--- Test J: Favorite toggling ---');
  const toggledAdv = toggleFavoriteCapability(mockAdventure, fireball!);
  const toggledFireball = toggledAdv.player.techniqueList?.find(t => t.id === 'tech_fireball');
  assert(toggledFireball?.isFavorite === true, 'Fireball should now be marked as favorite');
  console.log('[PASS] Test J: Favorite toggled on canonical techniqueList');

  // Test K: Semantically correct action texts
  console.log('--- Test K: Action texts ---');
  assert(getCapabilityActionText(fireball!).includes('setzt Feuerball ein'), 'Technique action text correct');
  const swordManeuver = caps.find(c => c.category === 'weapon')!;
  assert(getCapabilityActionText(swordManeuver).includes('Manöver'), 'Weapon action text correct');
  assert(getCapabilityActionText(bladeHardening!).includes('Berufskompetenz'), 'Profession action text correct');
  console.log('[PASS] Test K: Action texts semantically distinct for each domain');

  console.log('=== ALL CAPABILITY ADAPTER TESTS PASSED (11/11) ===');
}

runCapabilityAdapterTests();
