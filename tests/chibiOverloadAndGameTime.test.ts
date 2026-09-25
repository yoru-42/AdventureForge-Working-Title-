import { Character, PowerAbility } from '../types';
import { resolveChibiForm } from '../services/chibiFormResolver';
import { processElapsedGameTime, updateCharacterMetamorphosisState } from '../components/bodyConditionResolver';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

export function runChibiOverloadAndGameTimeTests() {
  console.log('\n--- Starte Chibi-Überlastungs- und Ingame-Zeit-Tests ---');

  const basePlayer: Character = {
    id: 'player-1',
    name: 'Aria',
    role: 'Heldin',
    personality: 'Mutig und entschlossen',
    bio: 'Eine mächtige Esperin.',
    attributes: {} as any,
    appearance: {
      hairColor: 'Silber',
      eyeColor: 'Blau',
      age: '20',
      build: 'Schlank',
      gender: 'Weiblich',
      activeTransformationId: 'standard',
      powerUsage: 0,
      transformationIntensity: 0,
      metamorphosisProgress: 0
    },
    abilities: [
      {
        id: 'trans-esper',
        name: 'Esper-Erwachen',
        category: 'Transformationen',
        type: 'Transformation',
        transformName: 'Esper-Gestalt',
        chibiOnPowerOverload: {
          enabled: true,
          activationThreshold: 100,
          recoveryThreshold: 80
        }
      } as PowerAbility
    ]
  };

  // Test 1 – Overload aktiviert
  console.log('\n--- Test 1: Overload aktiviert bei powerUsage = 100% ---');
  const playerTrans1: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 100,
      transformationIntensity: 75
    }
  };
  const res1 = resolveChibiForm({
    player: playerTrans1,
    activeTransformation: playerTrans1.abilities![0]
  });
  assert(res1.active, 'Test 1a: Chibi ist aktiv bei powerUsage = 100%');
  assert(res1.source === 'power_overload', 'Test 1b: Quelle ist power_overload');
  assert(res1.remainingDurationGameMinutes === undefined, 'Test 1c: Power-Overload hat keine feste Restdauer');

  // Test 2 – Overload bleibt aktiv (Hysterese bei 90%)
  console.log('\n--- Test 2: Overload bleibt aktiv bei powerUsage = 90% (Hysterese) ---');
  let playerHysteresis = updateCharacterMetamorphosisState(playerTrans1, { powerUsage: 100 });
  playerHysteresis = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 90 });
  const res2 = resolveChibiForm({
    player: playerHysteresis,
    activeTransformation: playerHysteresis.abilities![0]
  });
  assert(res2.active && res2.source === 'power_overload', 'Test 2: Chibi bleibt aktiv bei powerUsage = 90% (>= 80%)');

  // Test 3 – Overload endet bei 79% (Transformation bleibt aktiv)
  console.log('\n--- Test 3: Overload endet bei powerUsage = 79% ---');
  const playerRecovered = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 79 });
  const res3 = resolveChibiForm({
    player: playerRecovered,
    activeTransformation: playerRecovered.abilities![0]
  });
  assert(!res3.active, 'Test 3a: Chibi ist deaktiviert bei powerUsage = 79% (< 80%)');
  assert(playerRecovered.appearance?.activeTransformationId === 'trans-esper', 'Test 3b: Transformation trans-esper bleibt weiterhin aktiv!');

  // Test 4 – Ingame-Zeit bei Overload (Kein künstlicher Countdown)
  console.log('\n--- Test 4: Ingame-Zeit bei Overload (Kein falscher Zeitablauf) ---');
  const overloadedPlayer: Character = updateCharacterMetamorphosisState(playerTrans1, { powerUsage: 100 });
  assert(Boolean(overloadedPlayer.appearance?.chibiForm?.enabled), 'Test 4a: Overload-Chibi ist initial aktiv');
  
  // 30 Minuten Ingame-Zeit vergehen mit Standard-Decay (10%/Stunde = 5% Decay) -> powerUsage = 95%
  const after30Min = processElapsedGameTime(overloadedPlayer, 30, 10);
  assert(Boolean(after30Min.appearance?.chibiForm?.enabled), 'Test 4b: Nach 30 Min Ingame-Zeit bleibt Chibi aktiv (powerUsage ist 95% >= 80%)');
  assert(after30Min.appearance?.chibiForm?.source === 'power_overload', 'Test 4c: Chibi-Quelle bleibt power_overload');
  assert(after30Min.appearance?.chibiForm?.durationGameMinutes === undefined, 'Test 4d: Overload-Chibi besitzt keinen Countdown in durationGameMinutes');

  // Test 5 – Echte zeitbasierte Chibi-Form (z.B. source: transformation, durationGameMinutes = 30)
  console.log('\n--- Test 5: Echte zeitbasierte Chibi-Form (30 Minuten) ---');
  const timedChibiPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      chibiForm: {
        enabled: true,
        source: 'transformation',
        durationGameMinutes: 30,
        autoRevert: true
      }
    }
  };

  // 10 Minuten vergangen -> Restdauer 20 Minuten
  const after10Min = processElapsedGameTime(timedChibiPlayer, 10);
  assert(after10Min.appearance?.chibiForm?.durationGameMinutes === 20, 'Test 5a: Nach 10 Min Ingame-Zeit verbleiben 20 Minuten');
  assert(after10Min.appearance?.activeTransformationId === 'trans-esper', 'Test 5b: Transformation bleibt während zeitbasierter Chibi-Form aktiv');

  // Weitere 20 Minuten vergangen -> Chibi endet
  const after30MinTotal = processElapsedGameTime(after10Min, 20);
  assert(!after30MinTotal.appearance?.chibiForm, 'Test 5c: Nach Ablauf der 30 Minuten Ingame-Zeit endet die Chibi-Form');
  assert(after30MinTotal.appearance?.activeTransformationId === 'trans-esper', 'Test 5d: Transformation bleibt nach Chibi-Ablauf bestehen');

  // Test 6 – Transformation unabhängig
  console.log('\n--- Test 6: Transformation & Moveset bleiben nach Chibi-Ende unverändert ---');
  assert(after30MinTotal.appearance?.activeTransformationId === 'trans-esper', 'Test 6a: activeTransformationId bleibt unverändert');
  assert(after30MinTotal.appearance?.transformationIntensity === timedChibiPlayer.appearance?.transformationIntensity, 'Test 6b: transformationIntensity bleibt erhalten');
  assert(after30MinTotal.appearance?.metamorphosisProgress === timedChibiPlayer.appearance?.metamorphosisProgress, 'Test 6c: metamorphosisProgress bleibt erhalten');
  assert(after30MinTotal.abilities?.length === basePlayer.abilities?.length, 'Test 6d: Moveset bleibt vollständig unabhängig');

  // Test 7 – Dauerhafte Chibi-Form (source: manual, ohne durationGameMinutes)
  console.log('\n--- Test 7: Dauerhafte Chibi-Form ---');
  const permChibiPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      chibiForm: {
        enabled: true,
        source: 'manual'
      }
    }
  };
  const resPerm = resolveChibiForm({ player: permChibiPlayer });
  assert(resPerm.active, 'Test 7a: Dauerhafte Chibi-Form ist aktiv');
  assert(resPerm.remainingDurationGameMinutes === undefined, 'Test 7b: Dauerhafte Chibi-Form hat keine ablaufende Dauer (dauerhaft)');

  const after60MinPerm = processElapsedGameTime(permChibiPlayer, 60);
  assert(Boolean(after60MinPerm.appearance?.chibiForm?.enabled), 'Test 7c: Dauerhafte Chibi-Form bleibt auch nach 60 Min Ingame-Zeit aktiv');

  console.log('\n✨ ALLE CHIBI- & INGAME-ZEIT-TESTS ERFOLGREICH BESTANDEN! ✨\n');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('chibiOverloadAndGameTime.test')) {
  runChibiOverloadAndGameTimeTests();
}
