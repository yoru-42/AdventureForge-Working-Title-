import { Adventure, WorldSetting, Character, Territory, WorldLocationReference, WorldTime, BattleInstance } from '../types';
import { TravelService } from '../services/travelService';
import { GameTurnService } from '../services/gameTurnService';
import { WorldSimulationService } from '../services/worldSimulationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`[PASS] ${message}`);
}

const createMockAdventure = (): Adventure => {
  const worldTime: WorldTime = { day: 1, hour: 8, minute: 0, totalMinutes: 480 };

  const territory1: Territory = {
    id: 'terr_01',
    name: 'Sonnental',
    description: 'Ein fruchtbares Tal.',
    controlledByFactionId: 'faction_sonne_01',
    type: 'Region',
    parentId: '',
    x: 10,
    y: 10
  };

  const territory2: Territory = {
    id: 'terr_02',
    name: 'Nebeltal',
    description: 'Ein düsteres Nebeltal.',
    controlledByFactionId: 'faction_nebel_02',
    type: 'Region',
    parentId: '',
    x: 20,
    y: 20
  };

  const locA: WorldLocationReference = {
    id: 'loc_dorf_a',
    territoryId: 'terr_01',
    name: 'Dorf A',
    type: 'dorf',
    description: 'Ein kleines idyllisches Dorf.',
    terrainType: 'Sonnental'
  };

  const locB: WorldLocationReference = {
    id: 'loc_stadt_b',
    territoryId: 'terr_01',
    name: 'Stadt B',
    type: 'stadt',
    description: 'Eine geschäftige Handelsstadt.',
    terrainType: 'Straße'
  };

  const locC: WorldLocationReference = {
    id: 'loc_festung_c',
    territoryId: 'terr_02',
    name: 'Festung C',
    type: 'festung',
    description: 'Eine alte Bergfestung.',
    terrainType: 'Gebirge'
  };

  const locZ: WorldLocationReference = {
    id: 'loc_insel_z',
    territoryId: 'terr_02',
    name: 'Unerreichbare Insel Z',
    type: 'insel',
    description: 'Eine abgeschiedene Insel ohne Weg.'
  };

  const world: WorldSetting = {
    title: 'Testwelt',
    description: 'Eine fantastische Testwelt.',
    era: 'Mittelalter',
    tone: 'Heroisch',
    worldTime,
    territories: [territory1, territory2],
    locations: [locA, locB, locC, locZ],
    connections: [
      {
        id: 'conn_a_b',
        fromId: 'loc_dorf_a',
        toId: 'loc_stadt_b',
        fromPlace: 'Dorf A',
        toPlace: 'Stadt B',
        label: 'Königsstraße',
        distance: '12 km',
        travelTime: '120 Min',
        type: 'land'
      },
      {
        id: 'conn_b_c',
        fromId: 'loc_stadt_b',
        toId: 'loc_festung_c',
        fromPlace: 'Stadt B',
        toPlace: 'Festung C',
        label: 'Bergpfad',
        distance: '10 km',
        duration: '90 Min',
        type: 'land'
      }
    ],
    dynamicWorldState: {
      currentLocationId: 'loc_dorf_a',
      currentTerritoryId: 'terr_01'
    }
  };

  const player: Character = {
    id: 'player_01',
    name: 'Aron',
    role: 'Wanderer',
    personality: 'Mutig',
    bio: 'Ein reiselustiger Abenteurer.',
    appearance: {
      hairColor: 'Braun',
      eyeColor: 'Blau',
      height: '180 cm',
      outfit: 'Reisekleidung',
      currentLocation: 'Dorf A',
      age: '25',
      build: 'Schlank',
      gender: 'Männlich'
    },
    attributes: []
  };

  return {
    id: 'adv_test_travel_01',
    authorId: 'user_01',
    isPublic: false,
    world,
    player,
    npcs: [],
    inventory: [],
    prologue: 'Die Reise beginnt in Dorf A.',
    chatHistory: [],
    statusElements: [
      { id: 'stat_loc', label: 'Standort', value: 'Dorf A' }
    ]
  };
};

export async function runTravelSystemTests() {
  console.log('\n=== RUNNING TRAVEL & LOCATION SYSTEM TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
    } catch (err: any) {
      failed++;
      console.error(`❌ ${name} failed: ${err.message}`);
    }
  };

  // Test A – Direkte Reise
  await test('Test A: Direct Travel (Dorf A -> Stadt B)', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      return origSim.call(WorldSimulationService, params);
    };

    try {
      const adv = createMockAdventure();
      const result = await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Stadt B',
        generateAiResponse: async () => 'Du reist auf der Königsstraße nach Stadt B.',
        parserFn: (text, currentAdv, hp, mp, worldOverride) => ({
          cleanedText: text,
          updatedLore: [],
          updatedPlayer: currentAdv.player,
          updatedNpcs: [],
          notifications: [],
          updatedStructuredInventory: undefined,
          updatedWorld: worldOverride || currentAdv.world
        })
      });

      assert(simCalls === 1, 'Test A: Exactly 1 simulation step executed');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Stadt B', 'Test A: Player location updated to Stadt B');
      assert(result.updatedAdventure.world.worldTime?.totalMinutes === 600, 'Test A: World time advanced by 120 minutes (08:00 -> 10:00 = 600 totalMins)');
      assert(result.routeResolution.status === 'resolved', 'Test A: Route status is resolved');
      assert(result.routeResolution.totalTravelMinutes === 120, 'Test A: Calculated travel time is 120 minutes');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test B – Mehrere Verbindungen (Multi-hop Route A -> B -> C)
  await test('Test B: Multi-hop Route (Dorf A -> Stadt B -> Festung C)', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      return origSim.call(WorldSimulationService, params);
    };

    try {
      const adv = createMockAdventure();
      const result = await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Festung C',
        generateAiResponse: async () => 'Über Stadt B erreichst du schließlich Festung C.',
        parserFn: (text, currentAdv, hp, mp, worldOverride) => ({
          cleanedText: text,
          updatedLore: [],
          updatedPlayer: currentAdv.player,
          updatedNpcs: [],
          notifications: [],
          updatedStructuredInventory: undefined,
          updatedWorld: worldOverride || currentAdv.world
        })
      });

      assert(simCalls === 1, 'Test B: Exactly 1 simulation step executed for multi-hop travel');
      assert(result.routeResolution.status === 'resolved', 'Test B: Multi-hop route status is resolved');
      assert(result.routeResolution.segments.length === 2, 'Test B: Route consists of 2 segments');
      assert(result.routeResolution.totalTravelMinutes === 210, 'Test B: Total travel duration is 120 + 90 = 210 minutes');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Festung C', 'Test B: Player location updated to Festung C');
      assert(result.updatedAdventure.world.worldTime?.totalMinutes === 690, 'Test B: World time advanced by 210 minutes (08:00 -> 11:30)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test C – Nicht erreichbares Ziel
  await test('Test C: Unreachable Destination (Dorf A -> Unerreichbare Insel Z)', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      return origSim.call(WorldSimulationService, params);
    };

    try {
      const adv = createMockAdventure();
      const result = await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Unerreichbare Insel Z'
      });

      assert(simCalls === 0, 'Test C: Zero simulation steps executed for unreachable destination');
      assert(result.routeResolution.status === 'unreachable', 'Test C: Route status is unreachable');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Dorf A', 'Test C: Player remains at Dorf A (no teleportation)');
      assert(result.updatedAdventure.world.worldTime?.totalMinutes === 480, 'Test C: World time unchanged (08:00)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test D – Event während Reise
  await test('Test D: Event Processed During Travel', async () => {
    const adv = createMockAdventure();
    // Schedule an event at 09:00 (540 total minutes)
    adv.world.scheduledEvents = [
      {
        id: 'event_01',
        type: 'general',
        title: 'Händlerüberfall',
        description: 'Ein Händler wird unterwegs überfallen.',
        createdAtWorldTime: { day: 1, hour: 8, minute: 0, totalMinutes: 480 },
        scheduledForWorldTime: { day: 1, hour: 9, minute: 0, totalMinutes: 540 },
        status: 'scheduled'
      }
    ];

    const result = await GameTurnService.processPlayerTurn({
      adventure: adv,
      mode: 'travel',
      destinationIdOrName: 'Stadt B',
      generateAiResponse: async () => 'Unterwegs beobachtest du einen Händlerüberfall.',
      parserFn: (text, currentAdv, hp, mp, worldOverride) => ({
        cleanedText: text,
        updatedLore: [],
        updatedPlayer: currentAdv.player,
        updatedNpcs: [],
        notifications: [],
        updatedStructuredInventory: undefined,
        updatedWorld: worldOverride || currentAdv.world
      })
    });

    assert(result.simResult.processedEvents.length === 1, 'Test D: Event trigger at 09:00 was processed during travel window');
    assert(result.simResult.processedEvents[0].id === 'event_01', 'Test D: Correct event ID processed');
  });

  // Test E – Reiseabbruch durch Kampf
  await test('Test E: Travel Interrupted by Combat Encounter', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      const res = origSim.call(WorldSimulationService, params);
      // Inject spawned BattleInstance at intermediate location
      const mockBattle: BattleInstance = {
        id: 'battle_encounter_01',
        territoryId: 'terr_01',
        locationName: 'Stadt B',
        status: 'active',
        participatingFactionIds: ['faction_bandits'],
        participatingCharacterIds: ['player_01'],
        tacticalGroupIds: ['group_bandits_01']
      };
      return {
        ...res,
        spawnedBattleInstances: [mockBattle]
      };
    };

    try {
      const adv = createMockAdventure();
      const result = await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Festung C',
        generateAiResponse: async () => 'Die Reise wird in Stadt B durch einen Banditenüberfall unterbrochen!',
        parserFn: (text, currentAdv, hp, mp, worldOverride) => ({
          cleanedText: text,
          updatedLore: [],
          updatedPlayer: currentAdv.player,
          updatedNpcs: [],
          notifications: [],
          updatedStructuredInventory: undefined,
          updatedWorld: worldOverride || currentAdv.world
        })
      });

      assert(simCalls === 1, 'Test E: Exactly 1 simulation step executed');
      assert(result.isInterrupted === true, 'Test E: Travel marked as interrupted');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Stadt B', 'Test E: Player location stopped at intermediate Stadt B (no teleport to Festung C)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test F – Politische Kontrolle
  await test('Test F: Political Control Traversal', async () => {
    const adv = createMockAdventure();
    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Festung C'
    });

    assert(routeRes.traversedTerritories.length === 2, 'Test F: Route traverses 2 territories');
    assert(routeRes.traversedTerritories[0].controlledByFactionId === 'faction_sonne_01', 'Test F: Sonnental controlled by faction_sonne_01');
    assert(routeRes.traversedTerritories[1].controlledByFactionId === 'faction_nebel_02', 'Test F: Nebeltal controlled by faction_nebel_02');
  });

  // Test G – Save / Reload Roundtrip
  await test('Test G: Save / Reload Roundtrip Persistence', async () => {
    const adv = createMockAdventure();
    let savedStorage: Adventure | null = null;

    const result = await GameTurnService.processPlayerTurn({
      adventure: adv,
      mode: 'travel',
      destinationIdOrName: 'Stadt B',
      generateAiResponse: async () => 'Du reist nach Stadt B.',
      saveAdventure: async (updated) => {
        // Deep clone serialize/deserialize to simulate DB reload
        savedStorage = JSON.parse(JSON.stringify(updated));
      }
    });

    assert(savedStorage !== null, 'Test G: Save callback executed');
    const reloaded = savedStorage as unknown as Adventure;
    assert(reloaded.player.appearance.currentLocation === 'Stadt B', 'Test G: Reloaded player location is Stadt B');
    assert(reloaded.world.worldTime?.totalMinutes === 600, 'Test G: Reloaded world time is 600 mins');
    assert(reloaded.world.currentLocationId === 'loc_stadt_b', 'Test G: Reloaded world currentLocationId matches');
  });

  // Test H – Gemini Context Snapshot
  await test('Test H: Gemini Context Passed Updated World & Location', async () => {
    const adv = createMockAdventure();
    let passedContext: any = null;

    await GameTurnService.processPlayerTurn({
      adventure: adv,
      mode: 'travel',
      destinationIdOrName: 'Stadt B',
      generateAiResponse: async (promptContext) => {
        passedContext = promptContext;
        return 'Reise erfolgreich.';
      }
    });

    assert(passedContext !== null, 'Test H: Gemini prompt context received');
    assert(passedContext.activeWorld.worldTime.totalMinutes === 600, 'Test H: Gemini saw updated worldTime 600 mins');
    assert(passedContext.activeWorld.currentLocationId === 'loc_stadt_b', 'Test H: Gemini saw updated currentLocationId loc_stadt_b');
  });

  // Test I – Kein Double Step
  await test('Test I: Exactly One Simulation Step Per Travel Turn', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      return origSim.call(WorldSimulationService, params);
    };

    try {
      const adv = createMockAdventure();
      await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Stadt B',
        generateAiResponse: async () => 'Du reist nach Stadt B.'
      });

      assert(simCalls === 1, 'Test I: Exactly 1 simulation step executed');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test J – Fehlerfall
  await test('Test J: Travel Simulation Failure Does Not Persist Corrupted Save', async () => {
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = () => {
      throw new Error('Simulation Engine Failure!');
    };

    let saveCalled = false;
    try {
      const adv = createMockAdventure();
      await GameTurnService.processPlayerTurn({
        adventure: adv,
        mode: 'travel',
        destinationIdOrName: 'Stadt B',
        saveAdventure: () => {
          saveCalled = true;
        }
      });
      assert(false, 'Test J: Error should have thrown');
    } catch (err: any) {
      assert(err.message === 'Simulation Engine Failure!', 'Test J: Error caught correctly');
      assert(saveCalled === false, 'Test J: Save callback was NOT called on failure');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  console.log(`\n=== TRAVEL SYSTEM TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

if (process.argv[1]?.includes('travelSystemTests')) {
  runTravelSystemTests().then(res => {
    if (res.failed > 0) {
      throw new Error(`Failed ${res.failed} tests in travelSystemTests`);
    }
  });
}
