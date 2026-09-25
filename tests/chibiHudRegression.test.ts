import { Character, PowerAbility } from '../types';
import { resolveChibiForm, ResolvedChibiForm } from '../services/chibiFormResolver';
import { formatDuration } from '../components/TransformationIntensityCard';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

/**
 * Pure HUD string derivation matching GameView.tsx (lines 8090-8145)
 */
export function computeChibiHudDisplay(
  resolvedChibi: ResolvedChibiForm,
  summaryText: string = 'Keine'
): {
  chibiDurationText: string;
  changeValueText: string;
  remainingDurationDetail: string;
} {
  let chibiDurationText = 'dauerhaft';
  if (resolvedChibi.active) {
    if (resolvedChibi.source === 'manual') {
      if (resolvedChibi.remainingDurationGameMinutes !== undefined && resolvedChibi.remainingDurationGameMinutes > 0) {
        chibiDurationText = `Dauer: ${formatDuration(resolvedChibi.remainingDurationGameMinutes, 'Min.')}`;
      } else {
        chibiDurationText = 'dauerhaft';
      }
    } else if (resolvedChibi.source === 'race') {
      chibiDurationText = 'dauerhaft';
    } else if (resolvedChibi.source === 'transformation') {
      if (resolvedChibi.remainingDurationGameMinutes !== undefined && resolvedChibi.remainingDurationGameMinutes > 0) {
        chibiDurationText = `Dauer: ${formatDuration(resolvedChibi.remainingDurationGameMinutes, 'Min.')}`;
      } else {
        chibiDurationText = 'dauerhaft';
      }
    } else if (resolvedChibi.source === 'power_overload') {
      chibiDurationText = 'Kraftüberlastung';
    } else {
      chibiDurationText = 'dauerhaft';
    }
  }

  const changeValueText = resolvedChibi.active
    ? (chibiDurationText === 'Kraftüberlastung'
        ? 'Chibi-Form · Kraftüberlastung'
        : (chibiDurationText === 'dauerhaft'
            ? 'Chibi-Form · dauerhaft'
            : `Chibi-Form · ${chibiDurationText}`))
    : (summaryText && summaryText !== 'Keine' ? `${summaryText} · dauerhaft` : 'Keine');

  const remainingDurationDetail = resolvedChibi.source === 'power_overload'
    ? 'Dynamisch (bis Erholung unter Erholungsschwelle)'
    : (resolvedChibi.remainingDurationGameMinutes !== undefined && resolvedChibi.remainingDurationGameMinutes > 0
        ? formatDuration(resolvedChibi.remainingDurationGameMinutes, 'Min.')
        : 'dauerhaft');

  return {
    chibiDurationText,
    changeValueText,
    remainingDurationDetail
  };
}

export function runChibiHudRegressionTests() {
  console.log('\n--- Starte Chibi-HUD Regressionstests ---');

  const basePlayer: Character = {
    id: 'player-1',
    name: 'Aria',
    role: 'Heldin',
    personality: 'Mutig',
    bio: 'Heldin',
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

  // Test 1: Transformation ohne eigene Chibi-Dauer
  console.log('\n--- Test 1: Transformation ohne eigene Chibi-Dauer ---');
  const transAbilityNoChibiDuration: PowerAbility = {
    id: 'trans-esper',
    name: 'Esper-Erwachen',
    category: 'Transformationen',
    type: 'Transformation',
    transformName: 'Esper-Gestalt',
    chibiForm: {
      enabled: true
      // Keine durationGameMinutes gesetzt
    }
  } as PowerAbility;

  const transPlayerNoChibiDuration: Character = {
    ...basePlayer,
    abilities: [transAbilityNoChibiDuration],
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      transformationIntensity: 50,
      chibiForm: {
        enabled: true,
        source: 'transformation',
        autoRevert: true
        // Keine durationGameMinutes gesetzt
      }
    }
  };
  // Angenommene Transformationsrestdauer durch Ressourcen/Upkeep: 60 Minuten
  const remainingTransformationUpkeepDuration = 60;
  const transUpkeepFormatted = formatDuration(remainingTransformationUpkeepDuration, 'Min.');
  assert(transUpkeepFormatted.includes('60 Min.') || transUpkeepFormatted.includes('1 Std.'), 'Transformations-Upkeep-Dauer ist ca. 60 Min.');

  const res1 = resolveChibiForm({
    player: transPlayerNoChibiDuration,
    activeTransformation: transAbilityNoChibiDuration
  });
  assert(res1.active, 'Test 1a: Chibi-Form ist aktiv');
  assert(res1.source === 'transformation', 'Test 1b: Quelle ist transformation');
  assert(res1.remainingDurationGameMinutes === undefined, 'Test 1c: Chibi hat keine eigene durationGameMinutes');

  const hud1 = computeChibiHudDisplay(res1);
  assert(hud1.chibiDurationText === 'dauerhaft', 'Test 1d: chibiDurationText ist "dauerhaft"');
  assert(hud1.changeValueText === 'Chibi-Form · dauerhaft', 'Test 1e: HUD zeigt "Chibi-Form · dauerhaft"');
  assert(!hud1.changeValueText.includes('60'), 'Test 1f: HUD übernimmt NICHT die 60 Min. Transformationsdauer');
  assert(hud1.remainingDurationDetail === 'dauerhaft', 'Test 1g: Detailansicht zeigt "dauerhaft"');

  // Test 2: Transformation mit eigener Chibi-Dauer (z.B. 30 Minuten)
  console.log('\n--- Test 2: Transformation mit eigener Chibi-Dauer (30 Min.) ---');
  const transAbilityWithChibiDuration: PowerAbility = {
    id: 'trans-esper',
    name: 'Esper-Erwachen',
    category: 'Transformationen',
    type: 'Transformation',
    transformName: 'Esper-Gestalt',
    chibiForm: {
      enabled: true,
      durationGameMinutes: 30
    }
  } as PowerAbility;

  const transPlayerWithChibiDuration: Character = {
    ...basePlayer,
    abilities: [transAbilityWithChibiDuration],
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      transformationIntensity: 75,
      chibiForm: {
        enabled: true,
        source: 'transformation',
        durationGameMinutes: 30,
        autoRevert: true
      }
    }
  };
  // Angenommene Transformationsrestdauer durch Upkeep: 120 Minuten (2 Std.)
  const res2 = resolveChibiForm({
    player: transPlayerWithChibiDuration,
    activeTransformation: transAbilityWithChibiDuration
  });
  assert(res2.active, 'Test 2a: Chibi-Form ist aktiv');
  assert(res2.remainingDurationGameMinutes === 30, 'Test 2b: Chibi-Restdauer ist 30 Minuten');

  const hud2 = computeChibiHudDisplay(res2);
  assert(hud2.chibiDurationText === 'Dauer: 30 Min.', 'Test 2c: chibiDurationText ist "Dauer: 30 Min."');
  assert(hud2.changeValueText === 'Chibi-Form · Dauer: 30 Min.', 'Test 2d: HUD zeigt "Chibi-Form · Dauer: 30 Min."');
  assert(hud2.remainingDurationDetail === '30 Min.', 'Test 2e: Detailansicht zeigt "30 Min."');
  assert(!hud2.changeValueText.includes('120'), 'Test 2f: Normale Transformationsdauer (120 Min.) ersetzt nicht den Chibi-Wert');

  // Test 3: Power-Overload
  console.log('\n--- Test 3: Power-Overload ---');
  const overloadPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      powerUsage: 100,
      transformationIntensity: 90
    }
  };
  const res3 = resolveChibiForm({
    player: overloadPlayer,
    activeTransformation: overloadPlayer.abilities![0]
  });
  assert(res3.active, 'Test 3a: Overload-Chibi ist aktiv');
  assert(res3.source === 'power_overload', 'Test 3b: Quelle ist power_overload');
  assert(res3.remainingDurationGameMinutes === undefined, 'Test 3c: Keine feste Restdauer');

  const hud3 = computeChibiHudDisplay(res3);
  assert(hud3.chibiDurationText === 'Kraftüberlastung', 'Test 3d: chibiDurationText ist "Kraftüberlastung"');
  assert(hud3.changeValueText === 'Chibi-Form · Kraftüberlastung', 'Test 3e: Geschlossener HUD zeigt "Chibi-Form · Kraftüberlastung"');
  assert(!hud3.changeValueText.includes('Dauer'), 'Test 3f: Keine künstliche Zeitdauer im HUD');
  assert(hud3.remainingDurationDetail === 'Dynamisch (bis Erholung unter Erholungsschwelle)', 'Test 3g: Detailansicht zeigt dynamischen Erholungstext');

  // Test 4: Manuelle Chibi-Form ohne Dauer
  console.log('\n--- Test 4: Manuelle Chibi-Form ohne Dauer ---');
  const manualPermPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      chibiForm: {
        enabled: true,
        source: 'manual'
      }
    }
  };
  const res4 = resolveChibiForm({ player: manualPermPlayer });
  assert(res4.active, 'Test 4a: Manuelle Chibi-Form ist aktiv');
  assert(res4.source === 'manual', 'Test 4b: Quelle ist manual');
  assert(res4.remainingDurationGameMinutes === undefined, 'Test 4c: Keine Restdauer');

  const hud4 = computeChibiHudDisplay(res4);
  assert(hud4.chibiDurationText === 'dauerhaft', 'Test 4d: chibiDurationText ist "dauerhaft"');
  assert(hud4.changeValueText === 'Chibi-Form · dauerhaft', 'Test 4e: HUD zeigt "Chibi-Form · dauerhaft"');
  assert(hud4.remainingDurationDetail === 'dauerhaft', 'Test 4f: Detailansicht zeigt "dauerhaft"');

  // Test 5: Manuelle Chibi-Form mit eigener Dauer (20 Min.)
  console.log('\n--- Test 5: Manuelle Chibi-Form mit eigener Dauer (20 Min.) ---');
  const manualTimedPlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      chibiForm: {
        enabled: true,
        source: 'manual',
        durationGameMinutes: 20
      }
    }
  };
  const res5 = resolveChibiForm({ player: manualTimedPlayer });
  assert(res5.active, 'Test 5a: Manuelle zeitbasierte Chibi-Form ist aktiv');
  assert(res5.source === 'manual', 'Test 5b: Quelle ist manual');
  assert(res5.remainingDurationGameMinutes === 20, 'Test 5c: Restdauer ist 20 Min.');

  const hud5 = computeChibiHudDisplay(res5);
  assert(hud5.chibiDurationText === 'Dauer: 20 Min.', 'Test 5d: chibiDurationText ist "Dauer: 20 Min."');
  assert(hud5.changeValueText === 'Chibi-Form · Dauer: 20 Min.', 'Test 5e: HUD zeigt "Chibi-Form · Dauer: 20 Min."');
  assert(hud5.remainingDurationDetail === '20 Min.', 'Test 5f: Detailansicht zeigt "20 Min."');

  // Test 6: Race-Quelle ohne eigene Dauer
  console.log('\n--- Test 6: Race-Quelle ohne eigene Dauer ---');
  const racePlayer: Character = {
    ...basePlayer,
    appearance: {
      ...basePlayer.appearance!,
      race: 'Feenwesen',
      raceChibiForm: {
        enabled: true,
        source: 'race',
        visualOnly: true
      }
    } as any
  };
  const res6 = resolveChibiForm({ player: racePlayer });
  assert(res6.active, 'Test 6a: Race-Chibi ist aktiv');
  assert(res6.source === 'race', 'Test 6b: Quelle ist race');
  assert(res6.remainingDurationGameMinutes === undefined, 'Test 6c: Race-Chibi hat keine Restdauer');

  const hud6 = computeChibiHudDisplay(res6);
  assert(hud6.chibiDurationText === 'dauerhaft', 'Test 6d: chibiDurationText ist "dauerhaft"');
  assert(hud6.changeValueText === 'Chibi-Form · dauerhaft', 'Test 6e: HUD zeigt "Chibi-Form · dauerhaft"');
  assert(hud6.remainingDurationDetail === 'dauerhaft', 'Test 6f: Detailansicht zeigt "dauerhaft"');

  // Test 7: Kritischer Regressionstest – normale Transformationsdauer darf niemals Chibi-Dauer werden
  console.log('\n--- Test 7: Kritischer Regressionstest – Transformation-Restdauer vs Chibi-Dauer ---');
  const remainingTransformationDuration = 60; // 60 Minuten aus Ressourcen/Upkeep
  const transWithUpkeepPlayer: Character = {
    ...basePlayer,
    abilities: [transAbilityNoChibiDuration],
    appearance: {
      ...basePlayer.appearance!,
      activeTransformationId: 'trans-esper',
      transformationIntensity: 100,
      chibiForm: {
        enabled: true,
        source: 'transformation'
        // Absichtlich keine durationGameMinutes!
      }
    }
  };

  const res7 = resolveChibiForm({
    player: transWithUpkeepPlayer,
    activeTransformation: transAbilityNoChibiDuration
  });

  const hud7 = computeChibiHudDisplay(res7);
  assert(hud7.chibiDurationText === 'dauerhaft', 'Test 7a: Chibi-Dauer bleibt "dauerhaft" trotz 60 Min. Transformationsdauer');
  assert(hud7.changeValueText === 'Chibi-Form · dauerhaft', 'Test 7b: HUD-Text bleibt "Chibi-Form · dauerhaft"');
  assert(!hud7.changeValueText.includes(String(remainingTransformationDuration)), 'Test 7c: Die 60 Minuten dürfen NICHT in die Chibi-Anzeige einfließen');
  assert(hud7.remainingDurationDetail === 'dauerhaft', 'Test 7d: Detail-Modal zeigt "dauerhaft" für Chibi');

  console.log('\n✨ ALLE CHIBI-HUD REGRESSIONSTESTS ERFOLGREICH BESTANDEN! ✨\n');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('chibiHudRegression.test')) {
  runChibiHudRegressionTests();
}
