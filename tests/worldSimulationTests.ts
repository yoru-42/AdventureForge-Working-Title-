import { WorldSimulationService, MAX_EVENT_PROCESSING_DEPTH } from '../services/worldSimulationService';
import { WorldSetting, WorldEvent, WorldTime } from '../types';

export function runWorldSimulationTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(message);
      console.error(`❌ TEST FAILED: ${message}`);
    }
  }

  console.log('--- STARTING WORLD SIMULATION & EVENT ARCHITECTURE TESTS ---');

  // -------------------------------------------------------------
  // Test 1: Time Math & Rollover Accuracy
  // -------------------------------------------------------------
  const t1 = WorldSimulationService.fromTotalMinutes(0);
  assert(t1.day === 1 && t1.hour === 0 && t1.minute === 0, 'Minute 0 maps to Day 1, 00:00');

  const t2 = WorldSimulationService.addMinutes({ day: 1, hour: 23, minute: 50 }, 20);
  assert(t2.day === 2 && t2.hour === 0 && t2.minute === 10, 'Day 1, 23:50 + 20 mins rolls over to Day 2, 00:10');

  const t3Mins = WorldSimulationService.toTotalMinutes({ day: 2, hour: 0, minute: 10 });
  assert(t3Mins === 1450, 'Day 2, 00:10 equals 1450 total minutes');

  // -------------------------------------------------------------
  // Test 2: Action Time Estimation Heuristics
  // -------------------------------------------------------------
  assert(WorldSimulationService.estimateActionDurationMinutes('Ich lege mich schlafen.') === 480, 'Sleep action estimates 480 mins');
  assert(WorldSimulationService.estimateActionDurationMinutes('Wir machen eine kurze Rast am Lagerfeuer.') === 60, 'Rest action estimates 60 mins');
  assert(WorldSimulationService.estimateActionDurationMinutes('Wir reiten nach Nordhafen.') === 180, 'Travel action estimates 180 mins');
  assert(WorldSimulationService.estimateActionDurationMinutes('Ich greife den Banditen mit dem Schwert an!') === 15, 'Combat action estimates 15 mins');
  assert(WorldSimulationService.estimateActionDurationMinutes('Wir durchsuchen die Ruine gründlich.') === 30, 'Search action estimates 30 mins');
  assert(WorldSimulationService.estimateActionDurationMinutes('Hallo Gastwirt, hast du Zimmer frei?') === 10, 'Default dialogue action estimates 10 mins');

  // Mock initial world setting
  const initialWorld: WorldSetting = {
    title: 'Simulation Test World',
    description: 'Test environment for event architecture',
    era: 'Mittelalter',
    tone: 'Bodenständig',
    worldTime: { day: 1, hour: 8, minute: 0, totalMinutes: 480 },
    territories: [
      {
        id: 'terr_1',
        name: 'Grenzland',
        type: 'region',
        parentId: null,
        x: 0,
        y: 0,
        description: 'Eine unruhige Grenzregion',
        controlledByFactionId: 'faction_rebels',
        placeMarkers: [
          { id: 'loc_1', name: 'Alte Mühle', type: 'village', x: 10, y: 10 }
        ]
      }
    ],
    economyConfig: {
      currencyName: 'Goldmünzen',
      currencyIcon: '💰',
      payoutInterval: 'daily',
      allowPassiveIncome: true,
      enableRandomEvents: true,
      holdings: [
        {
          id: 'holding_muehle',
          name: 'Alte Mühle',
          type: 'saegewerk',
          level: 1,
          ownerType: 'character',
          staffCount: 5,
          territoryId: 'terr_1',
          locationName: 'loc_1',
          status: 'active',
          incomePerInterval: 50,
          upkeepPerInterval: 10,
          activityLogs: []
        }
      ]
    },
    facts: [],
    scheduledEvents: [],
    dynamicWorldState: {
      scheduledEvents: [],
      eventHistory: []
    }
  };

  // -------------------------------------------------------------
  // Test 3: Scheduling Events & Order Preservation
  // -------------------------------------------------------------
  const evtA: Partial<WorldEvent> & { type: string } = {
    type: 'raid',
    title: 'Banditenüberfall',
    scheduledForWorldTime: { day: 1, hour: 9, minute: 0, totalMinutes: 540 },
    priority: 1,
    territoryId: 'terr_1',
    locationId: 'loc_1',
    isPlayerVisible: true
  };

  const evtB: Partial<WorldEvent> & { type: string } = {
    type: 'reinforcement',
    title: 'Verstärkung der Wache',
    scheduledForWorldTime: { day: 1, hour: 8, minute: 30, totalMinutes: 510 },
    priority: 5,
    territoryId: 'terr_1',
    isPlayerVisible: true
  };

  let schedRes = WorldSimulationService.scheduleEvent({ world: initialWorld, event: evtA });
  schedRes = WorldSimulationService.scheduleEvent({ world: schedRes.updatedWorld, event: evtB });

  assert(schedRes.updatedWorld.scheduledEvents?.length === 2, '2 events scheduled onto world');

  // -------------------------------------------------------------
  // Test 4: Execution Order & Consequence Application
  // -------------------------------------------------------------
  // Advance time by 120 mins (8:00 -> 10:00). Both evtB (8:30) and evtA (9:00) should execute.
  const simRes1 = WorldSimulationService.runSimulationStep({
    world: schedRes.updatedWorld,
    minutesToAdd: 120,
    actionText: 'Wir warten zwei Stunden.'
  });

  assert(simRes1.timeEnd.hour === 10 && simRes1.timeEnd.minute === 0, 'World time advanced to 10:00');
  assert(simRes1.processedEvents.length === 2, 'Both scheduled events were processed');
  assert(simRes1.processedEvents[0].type === 'reinforcement', 'Event B (8:30) processed before Event A (9:00)');
  assert(simRes1.processedEvents[1].type === 'raid', 'Event A (9:00) processed second');
  assert(simRes1.updatedWorld.scheduledEvents?.length === 0, 'No scheduled events remaining in active queue');
  assert(simRes1.updatedWorld.dynamicWorldState?.eventHistory?.length === 2, 'Resolved events moved to eventHistory');

  // -------------------------------------------------------------
  // Test 5: Preconditions & Event Cancellation
  // -------------------------------------------------------------
  const invalidLocEvt: Partial<WorldEvent> & { type: string } = {
    type: 'siege',
    title: 'Belagerung einer Phantomstadt',
    scheduledForWorldTime: { day: 1, hour: 10, minute: 30 },
    preconditions: { locationExists: true },
    locationId: 'loc_non_existent',
    isPlayerVisible: true
  };

  const schedInvalid = WorldSimulationService.scheduleEvent({ world: simRes1.updatedWorld, event: invalidLocEvt });
  const simResPre = WorldSimulationService.runSimulationStep({
    world: schedInvalid.updatedWorld,
    minutesToAdd: 60
  });

  assert(simResPre.cancelledEvents.length === 1, 'Event with missing location precondition was cancelled');
  assert(simResPre.cancelledEvents[0].status === 'cancelled', 'Cancelled event has status === cancelled');

  // -------------------------------------------------------------
  // Test 6: Political Control Transfer & Economic Impact
  // -------------------------------------------------------------
  const politicalEvt: Partial<WorldEvent> & { type: string } = {
    type: 'trade_shift',
    title: 'Einnahme durch die Reichsgarde',
    scheduledForWorldTime: { day: 1, hour: 12, minute: 0 },
    territoryId: 'terr_1',
    locationId: 'loc_1',
    consequences: {
      controlTransferFactionId: 'faction_guard',
      economicImpact: 'under_siege',
      generatedFactText: 'Reichsgarde übernimmt Grenzland'
    },
    isPlayerVisible: true
  };

  const schedPol = WorldSimulationService.scheduleEvent({ world: simResPre.updatedWorld, event: politicalEvt });
  const simResPol = WorldSimulationService.runSimulationStep({
    world: schedPol.updatedWorld,
    minutesToAdd: 120
  });

  const terrAfter = simResPol.updatedWorld.territories?.find(t => t.id === 'terr_1');
  assert(terrAfter?.controlledByFactionId === 'faction_guard', 'Territory control transferred to faction_guard');

  const holdingAfter = simResPol.updatedWorld.economyConfig?.holdings.find(h => h.id === 'holding_muehle');
  assert(holdingAfter?.status === 'under_siege', 'Economy holding status changed to under_siege');
  assert(holdingAfter?.activityLogs?.length === 1, 'Activity log entry created for economy holding');

  // -------------------------------------------------------------
  // Test 7: Recursion & Event Loop Protection (Max Depth = 10)
  // -------------------------------------------------------------
  const recursiveEvt: Partial<WorldEvent> & { type: string } = {
    id: 'evt_loop_1',
    type: 'general',
    title: 'Endlose Kettenreaktion',
    scheduledForWorldTime: simResPol.timeEnd,
    consequences: {
      followUpEventType: 'general',
      followUpEventDelayMinutes: 0
    },
    processingDepth: 0
  };

  const schedLoop = WorldSimulationService.scheduleEvent({ world: simResPol.updatedWorld, event: recursiveEvt });
  const simResLoop = WorldSimulationService.runSimulationStep({
    world: schedLoop.updatedWorld,
    minutesToAdd: 30
  });

  // Processing depth starting at 0 allows 10 chain executions (depths 0..9 resolved, depth 10 cancelled)
  const totalChain = simResLoop.processedEvents.length + simResLoop.cancelledEvents.length;
  assert(simResLoop.cancelledEvents.length >= 1, 'Event loop protection triggered and cancelled event');
  assert(simResLoop.cancelledEvents[0].data?.cancelReason?.includes('processing depth'), 'Cancel reason indicates depth limit exceeded');

  // -------------------------------------------------------------
  // Test 8: Hidden vs Visible Event Filtering
  // -------------------------------------------------------------
  const secretEvt: Partial<WorldEvent> & { type: string } = {
    type: 'observation',
    title: 'Geheimes Treffen der Spione',
    description: 'Schatten im Wald tauschen Nachrichten aus',
    scheduledForWorldTime: simResLoop.timeEnd,
    isPlayerVisible: false
  };

  const visibleEvt: Partial<WorldEvent> & { type: string } = {
    type: 'general',
    title: 'Öffentlicher Marktschrei',
    description: 'Der Marktschreier verkündet neue Steuern',
    scheduledForWorldTime: simResLoop.timeEnd,
    isPlayerVisible: true
  };

  let schedVis = WorldSimulationService.scheduleEvent({ world: simResLoop.updatedWorld, event: secretEvt });
  schedVis = WorldSimulationService.scheduleEvent({ world: schedVis.updatedWorld, event: visibleEvt });

  const simResVis = WorldSimulationService.runSimulationStep({
    world: schedVis.updatedWorld,
    minutesToAdd: 60
  });

  assert(simResVis.playerVisibleSummary.includes('Öffentlicher Marktschrei'), 'Player visible summary contains public event');
  assert(!simResVis.playerVisibleSummary.includes('Geheimes Treffen'), 'Player visible summary omits hidden event');

  // -------------------------------------------------------------
  // Test 9: Determinism Verification
  // -------------------------------------------------------------
  const simResDetA = WorldSimulationService.runSimulationStep({
    world: schedVis.updatedWorld,
    minutesToAdd: 60,
    seed: 12345
  });

  const simResDetB = WorldSimulationService.runSimulationStep({
    world: schedVis.updatedWorld,
    minutesToAdd: 60,
    seed: 12345
  });

  assert(simResDetA.timeEnd.totalMinutes === simResDetB.timeEnd.totalMinutes, 'Deterministic simulation end times match');
  assert(simResDetA.processedEvents.length === simResDetB.processedEvents.length, 'Deterministic simulation processed event counts match');

  console.log(`--- WORLD SIMULATION TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED ---`);

  return { passed, failed, errors };
}
