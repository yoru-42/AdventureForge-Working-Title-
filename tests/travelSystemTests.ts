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
    terrainType: 'Sonnental',
    x: 100,
    y: 100
  };

  const locB: WorldLocationReference = {
    id: 'loc_stadt_b',
    territoryId: 'terr_01',
    name: 'Stadt B',
    type: 'stadt',
    description: 'Eine geschäftige Handelsstadt.',
    terrainType: 'Straße',
    x: 200,
    y: 100
  };

  const locC: WorldLocationReference = {
    id: 'loc_festung_c',
    territoryId: 'terr_02',
    name: 'Festung C',
    type: 'festung',
    description: 'Eine alte Bergfestung.',
    terrainType: 'Gebirge',
    x: 300,
    y: 100
  };

  const locZ: WorldLocationReference = {
    id: 'loc_insel_z',
    territoryId: 'terr_02',
    name: 'Unerreichbare Insel Z',
    type: 'insel',
    description: 'Eine abgeschiedene Insel ohne Weg.',
    x: 500,
    y: 500
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
  console.log('\n=== RUNNING TRAVEL & LOCATION SYSTEM TEST SUITE (CORRECTED) ===\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
    } catch (err: any) {
      failed++;
      console.error(`❌ ${name} failed: ${err.message}\n${err.stack}`);
    }
  };

  // Test A – Keine Connection (Start und Ziel unverbunden)
  await test('Test A: No Connection (Dorf A -> Unerreichbare Insel Z)', async () => {
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

      assert(simCalls === 0, 'Test A: Zero simulation steps executed for unreachable destination');
      assert(result.routeResolution?.status === 'unreachable', 'Test A: Route status is unreachable');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Dorf A', 'Test A: Player remains at Dorf A');
      assert(result.updatedAdventure.world.worldTime?.totalMinutes === 480, 'Test A: World time unchanged (08:00)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test B – Keine Coordinate-Teleport-Route (Beweis: Coordinate Fallback ist entfernt)
  await test('Test B: No Coordinate Teleport (Dorf A and Insel Z have x/y but no connection)', async () => {
    const adv = createMockAdventure();
    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Unerreichbare Insel Z'
    });

    assert(routeRes.status === 'unreachable', 'Test B: Route is unreachable despite x/y coordinates existing');
    assert(routeRes.segments.length === 0, 'Test B: Zero segments returned (no teleport fallback created)');
    assert(routeRes.totalTravelMinutes === 0, 'Test B: 0 travel minutes');
  });

  // Test C – Fehlende Distanz/Dauer Daten
  await test('Test C: Connection Lacking Distance & Duration Data', async () => {
    const adv = createMockAdventure();
    // Add connection with missing distance and missing travelTime
    adv.world.connections!.push({
      id: 'conn_invalid',
      fromId: 'loc_dorf_a',
      toId: 'loc_insel_z',
      fromPlace: 'Dorf A',
      toPlace: 'Unerreichbare Insel Z',
      label: 'Geisterpfad'
      // No distance, no travelTime/duration
    });

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Unerreichbare Insel Z'
    });

    assert(routeRes.status === 'unreachable', 'Test C: Connection without distance or duration cannot be resolved');
    assert(routeRes.totalTravelMinutes === 0, 'Test C: No invented 30-min or 15km fallback values');
  });

  // Test D – Schnellere Route gewinnt (Dijkstra)
  await test('Test D: Faster Route Wins via Dijkstra (90 min 3-hop vs 240 min 2-hop)', async () => {
    const adv = createMockAdventure();
    // Add location X and Y
    const locX: WorldLocationReference = { id: 'loc_x', territoryId: 'terr_01', name: 'Ort X', type: 'raststaette' };
    const locY: WorldLocationReference = { id: 'loc_y', territoryId: 'terr_01', name: 'Ort Y', type: 'bruecke' };
    adv.world.locations!.push(locX, locY);

    // Route 1 (2 hops): Dorf A -> Stadt B (120 Min) -> Festung C (90 Min) => total 210 Min
    // Route 2 (3 hops): Dorf A -> Ort X (30 Min) -> Ort Y (30 Min) -> Festung C (30 Min) => total 90 Min
    adv.world.connections!.push(
      { id: 'conn_a_x', fromId: 'loc_dorf_a', toId: 'loc_x', travelTime: '30 Min' },
      { id: 'conn_x_y', fromId: 'loc_x', toId: 'loc_y', travelTime: '30 Min' },
      { id: 'conn_y_c', fromId: 'loc_y', toId: 'loc_festung_c', travelTime: '30 Min' }
    );

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Festung C'
    });

    assert(routeRes.status === 'resolved', 'Test D: Route resolved via Dijkstra');
    assert(routeRes.totalTravelMinutes === 90, 'Test D: Faster 90-minute 3-hop path chosen over 210-minute 2-hop path');
    assert(routeRes.segments.length === 3, 'Test D: Path consists of 3 faster segments');
  });

  // Test E – Blockierte Direct Connection mit Alternativroute
  await test('Test E: Blocked Direct Connection Uses Alternative Route', async () => {
    const adv = createMockAdventure();
    // Add direct connection Dorf A -> Festung C but set isBlocked = true
    adv.world.connections!.push({
      id: 'conn_direct_blocked',
      fromId: 'loc_dorf_a',
      toId: 'loc_festung_c',
      travelTime: '50 Min',
      isBlocked: true,
      label: 'Einsturz im Tunnel'
    });

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Festung C'
    });

    assert(routeRes.status === 'resolved', 'Test E: Route resolved via alternative path');
    assert(routeRes.segments.length === 2, 'Test E: Bypassed blocked direct path and took 2-segment alternative (A -> B -> C)');
    assert(routeRes.totalTravelMinutes === 210, 'Test E: Total travel time is 210 mins for unblocked alternative');
  });

  // Test F – Alle Routen blockiert
  await test('Test F: All Routes Blocked Returns Blocked/Unreachable', async () => {
    const adv = createMockAdventure();
    // Block conn_a_b
    adv.world.connections![0].isBlocked = true;

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Stadt B'
    });

    assert(routeRes.status === 'blocked', 'Test F: Route status is blocked when no unblocked route exists');
    assert(routeRes.totalTravelMinutes === 0, 'Test F: 0 minutes calculated when blocked');
  });

  // Test G – Reiseunterbrechung durch Kampf
  await test('Test G: Multi-hop Travel Interrupted by Combat Encounter', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      const res = origSim.call(WorldSimulationService, params);
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

      assert(simCalls === 1, 'Test G: Exactly 1 simulation step executed');
      assert(result.isInterrupted === true, 'Test G: Travel marked as interrupted');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Stadt B', 'Test G: Player location stopped at intermediate Stadt B (no teleport to Festung C)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test H – Genau Ein Simulation Step
  await test('Test H: Exactly One Simulation Step Per Travel Turn', async () => {
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

      assert(simCalls === 1, 'Test H: Exactly 1 simulation step executed');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test I – Save / Reload Roundtrip Persistence
  await test('Test I: Save / Reload Roundtrip Persistence', async () => {
    const adv = createMockAdventure();
    let savedStorage: Adventure | null = null;

    await GameTurnService.processPlayerTurn({
      adventure: adv,
      mode: 'travel',
      destinationIdOrName: 'Stadt B',
      generateAiResponse: async () => 'Du reist nach Stadt B.',
      saveAdventure: async (updated) => {
        savedStorage = JSON.parse(JSON.stringify(updated));
      }
    });

    assert(savedStorage !== null, 'Test I: Save callback executed');
    const reloaded = savedStorage as unknown as Adventure;
    assert(reloaded.player.appearance.currentLocation === 'Stadt B', 'Test I: Reloaded player location is Stadt B');
    assert(reloaded.world.worldTime?.totalMinutes === 600, 'Test I: Reloaded world time is 600 mins');
    assert(reloaded.world.currentLocationId === 'loc_stadt_b', 'Test I: Reloaded world currentLocationId matches');
  });

  // Test J – Circular Dependency & Module Execution Safety
  await test('Test J: TravelService and GameTurnService execute without circular dependency issues', async () => {
    assert(typeof TravelService.resolveRoute === 'function', 'Test J: TravelService.resolveRoute exists');
    assert(typeof GameTurnService.processPlayerTurn === 'function', 'Test J: GameTurnService.processPlayerTurn exists');
  });

  // Test K – BattleInstance without locationName/locationId (Keine Teleportation oder falscher Orts-Fallback)
  await test('Test K: BattleInstance without locationName/locationId does not claim origin as interruption location', async () => {
    let simCalls = 0;
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      simCalls++;
      const res = origSim.call(WorldSimulationService, params);
      const mockBattle: BattleInstance = {
        id: 'battle_encounter_no_loc',
        territoryId: 'terr_01',
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
        generateAiResponse: async () => 'Ein unvorhergesehenes Scharmützel bricht aus!',
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

      assert(simCalls === 1, 'Test K: Exactly 1 simulation step executed');
      assert(result.isInterrupted === true, 'Test K: Travel marked as interrupted');
      assert(result.interruptedAtLocation === undefined, 'Test K: Interrupted location is undefined (never claimed origin Dorf A as interruption site)');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Dorf A', 'Test K: Player location remains unchanged at last confirmed state without guessing');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test L – Multi-segment battle interruption at intermediate location
  await test('Test L: Multi-segment battle interruption stops at confirmed intermediate location', async () => {
    const origSim = WorldSimulationService.runSimulationStep;
    WorldSimulationService.runSimulationStep = (params) => {
      const res = origSim.call(WorldSimulationService, params);
      const mockBattle: BattleInstance = {
        id: 'battle_encounter_mid',
        locationId: 'loc_stadt_b',
        locationName: 'Stadt B',
        territoryId: 'terr_01',
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
        generateAiResponse: async () => 'In Stadt B wirst du angegriffen!',
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

      assert(result.isInterrupted === true, 'Test L: Travel interrupted');
      assert(result.updatedAdventure.player.appearance.currentLocation === 'Stadt B', 'Test L: Player stopped at intermediate Stadt B (not start Dorf A, not destination Festung C)');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test M – Unabhängig blockierte Verbindung liefert 'unreachable'
  await test('Test M: Unrelated blocked connection in world returns unreachable (not blocked)', async () => {
    const adv = createMockAdventure();
    // Add unrelated blocked connection X -> Y
    adv.world.connections!.push({
      id: 'conn_unrelated_blocked',
      fromId: 'loc_x',
      toId: 'loc_y',
      isBlocked: true
    });

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Unerreichbare Insel Z'
    });

    assert(routeRes.status === 'unreachable', 'Test M: Unconnected target returns unreachable despite unrelated blocked connection elsewhere');
  });

  // Test N – Relevante Blockierung ohne Alternative liefert 'blocked'
  await test('Test N: Relevant blockage without alternative route returns blocked', async () => {
    const adv = createMockAdventure();
    // Block the only connection between Dorf A and Stadt B
    adv.world.connections![0].isBlocked = true;

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Stadt B'
    });

    assert(routeRes.status === 'blocked', 'Test N: Relevant blockage returns blocked');
  });

  // Test O – Relevante Blockierung mit unblockierter Alternative liefert 'resolved'
  await test('Test O: Relevant direct blockage with unblocked alternative route returns resolved', async () => {
    const adv = createMockAdventure();
    // Direct A -> C is blocked
    adv.world.connections!.push({
      id: 'conn_direct_blocked',
      fromId: 'loc_dorf_a',
      toId: 'loc_festung_c',
      isBlocked: true
    });

    // Unblocked route A -> B -> C exists via conn_a_b and conn_b_c
    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Festung C'
    });

    assert(routeRes.status === 'resolved', 'Test O: Unblocked alternative path resolved despite blocked direct connection');
    assert(routeRes.segments.length === 2, 'Test O: Path goes through alternative (2 segments)');
  });

  // Test P – Kein Fallback auf Koordinaten
  await test('Test P: No coordinate fallback when no connection exists', async () => {
    const adv = createMockAdventure();
    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Unerreichbare Insel Z'
    });

    assert(routeRes.status === 'unreachable', 'Test P: Unreachable when no connection exists, coordinates ignored');
    assert(routeRes.segments.length === 0, 'Test P: Zero segments returned');
  });

  // Test Q – Kein künstlicher Zeitwert bei fehlerhafter Connection
  await test('Test Q: Connection missing travelTime and distance cannot be resolved', async () => {
    const adv = createMockAdventure();
    adv.world.connections!.push({
      id: 'conn_empty',
      fromId: 'loc_dorf_a',
      toId: 'loc_insel_z'
      // Missing distance and travelTime
    });

    const routeRes = TravelService.resolveRoute({
      world: adv.world,
      fromIdOrName: 'Dorf A',
      toIdOrName: 'Unerreichbare Insel Z'
    });

    assert(routeRes.status === 'unreachable', 'Test Q: Missing connection metrics result in unreachable route');
    assert(routeRes.totalTravelMinutes === 0, 'Test Q: 0 travel minutes calculated');
  });

  // Test R – Genau ein Simulation-Step
  await test('Test R: Single WorldSimulation step executed for successful travel', async () => {
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
        generateAiResponse: async () => 'Du kommst sicher an.'
      });

      assert(simCalls === 1, 'Test R: Exactly 1 simulation step executed');
    } finally {
      WorldSimulationService.runSimulationStep = origSim;
    }
  });

  // Test S – Save / Reload Persistence State Consistency
  await test('Test S: WorldState, Location, and Time persist identically after save and reload', async () => {
    const adv = createMockAdventure();
    let savedStorage: Adventure | null = null;

    await GameTurnService.processPlayerTurn({
      adventure: adv,
      mode: 'travel',
      destinationIdOrName: 'Stadt B',
      generateAiResponse: async () => 'Du reist nach Stadt B.',
      saveAdventure: async (updated) => {
        savedStorage = JSON.parse(JSON.stringify(updated));
      }
    });

    assert(savedStorage !== null, 'Test S: Save executed');
    const reloaded = savedStorage as unknown as Adventure;
    assert(reloaded.player.appearance.currentLocation === 'Stadt B', 'Test S: Reloaded player location matches');
    assert(reloaded.world.worldTime?.totalMinutes === 600, 'Test S: Reloaded world time matches');
    assert(reloaded.world.currentLocationId === 'loc_stadt_b', 'Test S: Reloaded currentLocationId matches');
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
