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

  // Test 1 – normale Transformation
  console.log('\n--- Test 1: Normale Transformation (Keine Überlastung) ---');
  const playerTrans1: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 0,
      transformationIntensity: 50
    }
  };
  const res1 = resolveChibiForm({
    player: playerTrans1,
    activeTransformation: playerTrans1.abilities![0]
  });
  assert(!res1.active, 'Test 1: Bei normaler Transformation ohne Überlastung ist kein Chibi aktiv');

  // Test 2 – Kraftüberlastung unter Schwelle (79% bei Schwelle 100%)
  console.log('\n--- Test 2: Kraftüberlastung unter Schwelle (79% bei 100%) ---');
  const playerTrans2: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 79,
      transformationIntensity: 100
    }
  };
  const res2 = resolveChibiForm({
    player: playerTrans2,
    activeTransformation: playerTrans2.abilities![0]
  });
  assert(!res2.active, 'Test 2: powerUsage = 79% löst bei activationThreshold = 100% kein Chibi aus');

  // Test 3 – Aktivierung bei 100%
  console.log('\n--- Test 3: Aktivierung bei 100% Kraftüberlastung ---');
  const playerTrans3: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 100,
      transformationIntensity: 100
    }
  };
  const res3 = resolveChibiForm({
    player: playerTrans3,
    activeTransformation: playerTrans3.abilities![0]
  });
  assert(res3.active, 'Test 3: Chibi ist aktiv bei powerUsage = 100%');
  assert(res3.source === 'power_overload', 'Test 3: Quelle ist power_overload');

  // Test 4 – Hysterese
  console.log('\n--- Test 4: Hysterese (Aktivierung 100%, Erholung 80%) ---');
  // Initial activate at 100%
  let playerHysteresis = updateCharacterMetamorphosisState(playerTrans1, { powerUsage: 100 });
  assert(Boolean(playerHysteresis.appearance?.chibiForm?.enabled), 'Test 4a: 100% -> Chibi aktiviert');

  // Drop to 95% -> should remain active
  playerHysteresis = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 95 });
  const resHyst95 = resolveChibiForm({
    player: playerHysteresis,
    activeTransformation: playerHysteresis.abilities![0]
  });
  assert(resHyst95.active && resHyst95.source === 'power_overload', 'Test 4b: 95% -> Chibi bleibt aktiv');

  // Drop to 85% -> should remain active
  playerHysteresis = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 85 });
  const resHyst85 = resolveChibiForm({
    player: playerHysteresis,
    activeTransformation: playerHysteresis.abilities![0]
  });
  assert(resHyst85.active && resHyst85.source === 'power_overload', 'Test 4c: 85% -> Chibi bleibt aktiv');

  // Drop to 81% -> should remain active
  playerHysteresis = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 81 });
  const resHyst81 = resolveChibiForm({
    player: playerHysteresis,
    activeTransformation: playerHysteresis.abilities![0]
  });
  assert(resHyst81.active && resHyst81.source === 'power_overload', 'Test 4d: 81% -> Chibi bleibt aktiv');

  // Drop to 79% -> should deactivate!
  playerHysteresis = updateCharacterMetamorphosisState(playerHysteresis, { powerUsage: 79 });
  const resHyst79 = resolveChibiForm({
    player: playerHysteresis,
    activeTransformation: playerHysteresis.abilities![0]
  });
  assert(!resHyst79.active, 'Test 4e: 79% (< 80%) -> Chibi deaktivert');

  // Test 5 – Tatsächliche Game-Time bei zeitbasierter Chibi-Form
  console.log('\n--- Test 5: Tatsächliche Ingame-Zeit (10 Minuten Dauer) ---');
  const timedChibiPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      chibiForm: {
        enabled: true,
        source: 'manual',
        durationGameMinutes: 10,
        autoRevert: true
      }
    }
  };

  // 0 Minuten verstrichen
  const after0Min = processElapsedGameTime(timedChibiPlayer, 0);
  assert(after0Min.appearance?.chibiForm?.durationGameMinutes === 10, 'Test 5a: Nach 0 Minuten Ingame-Zeit verbleiben 10 Minuten');

  // 5 Minuten verstrichen
  const after5Min = processElapsedGameTime(timedChibiPlayer, 5);
  assert(after5Min.appearance?.chibiForm?.durationGameMinutes === 5, 'Test 5b: Nach 5 Minuten Ingame-Zeit verbleiben 5 Minuten');

  // Weitere 5 Minuten verstrichen (insgesamt 10 Minuten)
  const after10Min = processElapsedGameTime(after5Min, 5);
  assert(!after10Min.appearance?.chibiForm, 'Test 5c: Nach Ablauf der 10 Minuten Ingame-Zeit endet die Chibi-Form');

  // Test 6 – Keine Spielzeit verstrichen
  console.log('\n--- Test 6: Keine Spielzeit verstrichen ---');
  const unchangedPlayer = processElapsedGameTime(timedChibiPlayer, 0);
  assert(unchangedPlayer.appearance?.chibiForm?.durationGameMinutes === 10, 'Test 6: Wenn keine Ingame-Zeit vergeht, bleibt die Restdauer exakt erhalten');

  // Test 7 – Chibi endet, Transformation bleibt aktiv & Moveset unverändert
  console.log('\n--- Test 7: Chibi endet, Transformation bleibt aktiv & Moveset unberührt ---');
  const activeEsperOverloaded: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 100,
      chibiForm: {
        enabled: true,
        source: 'power_overload',
        sourceName: 'Kraftüberlastung'
      }
    }
  };

  // Kraft sinkt unter Erholungsschwelle auf 75%
  const recoveredPlayer = updateCharacterMetamorphosisState(activeEsperOverloaded, { powerUsage: 75 });
  assert(!recoveredPlayer.appearance?.chibiForm, 'Test 7a: Chibi-Form ist beendet');
  assert(recoveredPlayer.appearance?.activeTransformationId === 'trans-esper', 'Test 7b: Esper-Transformation ist unverändert aktiv!');
  assert(recoveredPlayer.abilities?.length === basePlayer.abilities?.length, 'Test 7c: Moveset / Fähigkeiten bleiben voll erhalten');

  // Test 8 – Permanente Chibi-Form
  console.log('\n--- Test 8: Permanente / Dauerhafte Chibi-Form ---');
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
  assert(resPerm.active, 'Test 8a: Permanente Chibi-Form ist aktiv');
  assert(resPerm.remainingDurationGameMinutes === undefined, 'Test 8b: Permanente Chibi-Form hat keine ablaufende Dauer (dauerhaft)');

  console.log('\n✨ ALLE CHIBI- & INGAME-ZEIT-TESTS ERFOLGREICH BESTANDEN! ✨\n');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('chibiOverloadAndGameTime.test')) {
  runChibiOverloadAndGameTimeTests();
}
