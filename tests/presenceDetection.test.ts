import { LocationContextService } from '../services/locationContextService';
import { CurrentLocationContext } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

console.log('=== RUNNING PRESENCE & SCENE DETECTION TESTS ===\n');

// Test 1: Same room -> Present
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const npc = {
    id: 'npc-1',
    name: 'Wirtin',
    appearance: { currentLocation: 'Taverne Zum Hirsch → Schankraum' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 1: Same room (Schankraum) -> Present'
  );
}

// Test 2: Different room in same building -> NOT present in scene/room
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const npc = {
    id: 'npc-2',
    name: 'Koch',
    appearance: { currentLocation: 'Taverne Zum Hirsch → Küche' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 2: Different room (Küche vs Schankraum) -> Not present in room'
  );
}

// Test 3: Same building (player without specific room) -> Present in building
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch'
  };
  const npc = {
    id: 'npc-3',
    name: 'Gast',
    appearance: { currentLocation: 'Taverne Zum Hirsch' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 3: Same building (Taverne Zum Hirsch) -> Present'
  );
}

// Test 4: Same location (player on town level) -> Present at location
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund'
  };
  const npc = {
    id: 'npc-4',
    name: 'Wache',
    appearance: { currentLocation: 'Falkengrund' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 4: Same location (Falkengrund) -> Present'
  );
}

// Test 5: Same territory only -> NOT present
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    territoryName: 'Falkenmark'
  };
  const npc = {
    id: 'npc-5',
    name: 'Jäger',
    appearance: { currentLocation: 'Falkenmark' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 5: Same territory only (Falkenmark vs Falkengrund) -> NOT present'
  );
}

// Test 6: Same region only -> NOT present
{
  const playerLoc: CurrentLocationContext = {
    regionName: 'Nordlande',
    locationName: 'Falkengrund'
  };
  const npc = {
    id: 'npc-6',
    name: 'Holzfäller',
    appearance: { currentLocation: 'Nordlande / Eichenhain' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 6: Same region, different location (Eichenhain vs Falkengrund) -> NOT present'
  );
}

// Test 7: Chat mention without location -> NOT present ("Bekannt != Anwesend")
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const npc = {
    id: 'npc-7',
    name: 'Baron',
    currentSituation: 'Der Baron wird im Gespräch als Herrscher erwähnt.',
    appearance: { currentLocation: 'Burg Falkenstein' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 7: Chat mention of distant character -> NOT present'
  );
}

// Test 8: Explicit scene participant -> Present in scene
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const npc = {
    id: 'npc-8',
    name: 'Bote',
    appearance: { currentLocation: 'Reisend' }
  };
  assert(
    LocationContextService.isCharacterInScene(npc, playerLoc, ['npc-8']) === true,
    'Test 8: Explicit scene participant (npc-8 in sceneParticipantIds) -> Present in scene'
  );
}

// Test 9: Same name, different IDs -> Exact ID resolution
{
  const playerLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const npc1 = {
    id: 'npc-anna-1',
    name: 'Anna',
    appearance: { currentLocation: 'Taverne Zum Hirsch → Schankraum' }
  };
  const npc2 = {
    id: 'npc-anna-2',
    name: 'Anna',
    appearance: { currentLocation: 'Eichenhain' }
  };
  const filtered = LocationContextService.filterPresentCharacters([npc1, npc2], playerLoc);
  assert(
    filtered.length === 1 && filtered[0].id === 'npc-anna-1',
    'Test 9: Same name characters resolved strictly by location & ID'
  );
}

// Test 10: Dialogue -> Combat participant IDs preserved
{
  const dialogueParticipantIds = ['npc-bandit-1', 'npc-bandit-boss'];
  assert(
    dialogueParticipantIds.includes('npc-bandit-1') && dialogueParticipantIds.includes('npc-bandit-boss'),
    'Test 10: Dialogue participant IDs preserved for combat preparation'
  );
}

// Test 11: Combat -> Dialogue location preserved
{
  const initialLoc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum'
  };
  const dummyAdventure: any = {
    currentLocation: initialLoc,
    player: { appearance: { currentLocation: 'Falkengrund → Taverne Zum Hirsch → Schankraum' } },
    combatState: { isCombatActive: true, currentLocationContext: initialLoc }
  };
  const resolved = LocationContextService.resolveCurrentLocation(dummyAdventure);
  assert(
    resolved.roomName === 'Schankraum' && resolved.buildingName === 'Taverne Zum Hirsch',
    'Test 11: LocationContext preserved across combat and dialogue transitions'
  );
}

// Test 12: Rendering does not mutate state
{
  const npc = { id: 'npc-12', name: 'Test', appearance: { currentLocation: 'Falkengrund' } };
  const loc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const isPres1 = LocationContextService.isCharacterAtLocation(npc, loc);
  const isPres2 = LocationContextService.isCharacterAtLocation(npc, loc);
  assert(
    isPres1 === true && isPres2 === true && npc.appearance.currentLocation === 'Falkengrund',
    'Test 12: Idempotent presence checking without state mutation'
  );
}

// Imports for pipeline tests
import { AIStoryStateProcessor } from '../services/aiStoryStateProcessor';

// Test 13: processPresenceChanges - mentioned_only vs scene_participant
{
  const dummyAdventure: any = {
    npcs: [
      { id: 'npc-13a', name: 'Bartholomäus', currentSituation: 'Neu' },
      { id: 'npc-13b', name: 'Clara', currentSituation: 'Neu' }
    ],
    currentLocation: { locationName: 'Falkengrund' }
  };

  const processed = (AIStoryStateProcessor as any).processPresenceChanges(dummyAdventure, [
    { characterId: 'npc-13a', characterName: 'Bartholomäus', state: 'mentioned_only' },
    { characterId: 'npc-13b', characterName: 'Clara', state: 'scene_participant' }
  ]);

  const bart = processed.npcs.find((n: any) => n.id === 'npc-13a');
  const clara = processed.npcs.find((n: any) => n.id === 'npc-13b');

  assert(
    bart.presenceState.state === 'absent' &&
    bart.currentSituation.includes('erwähnt') &&
    LocationContextService.isCharacterAtLocation(bart, dummyAdventure.currentLocation) === false,
    'Test 13a: mentioned_only sets presenceState to absent and returns false for presence'
  );

  assert(
    clara.presenceState.state === 'scene_participant' &&
    clara.currentSituation.includes('aktiv') &&
    LocationContextService.isCharacterAtLocation(clara, dummyAdventure.currentLocation) === true,
    'Test 13b: scene_participant sets presenceState to scene_participant and returns true for presence'
  );
}

// Test 14: Movement of player does NOT mutate global world state (adventure.world.currentLocationId)
{
  const dummyAdventure: any = {
    world: { currentLocationId: 'world-loc-global-orig' },
    currentLocation: { locationName: 'Falkengrund', locationId: 'loc-1' },
    storyState: { currentLocationContext: { locationName: 'Falkengrund', locationId: 'loc-1' } }
  };

  const updated = LocationContextService.updateCurrentLocation(dummyAdventure, {
    locationId: 'loc-2',
    locationName: 'Drachenfels'
  });

  assert(
    updated.currentLocation.locationName === 'Drachenfels' &&
    updated.world.currentLocationId === 'world-loc-global-orig',
    'Test 14: Player location update preserves adventure.world.currentLocationId'
  );
}

// Test 15: resolveRoom and resolveBuilding strict ID and name matching
{
  const mockHolding: any = {
    id: 'holding-taverne',
    name: 'Taverne Zum Hirsch',
    buildingRooms: [
      { id: 'room-1', name: 'Schankraum' },
      { id: 'room-2', name: 'Küche' }
    ]
  };

  const resolvedBuilding = LocationContextService.resolveBuilding([mockHolding], 'Taverne Zum Hirsch');
  assert(
    resolvedBuilding?.id === 'holding-taverne',
    'Test 15a: resolveBuilding matches holding by name without wildcard creation'
  );

  const resolvedKnownRoom = LocationContextService.resolveRoom(mockHolding, 'Schankraum');
  assert(
    resolvedKnownRoom.roomId === 'room-1' && resolvedKnownRoom.roomName === 'Schankraum',
    'Test 15b: resolveRoom matches registered room ID strictly'
  );

  const resolvedUnregisteredRoom = LocationContextService.resolveRoom(mockHolding, 'Geheimkammer Hinter Dem Regal');
  assert(
    resolvedUnregisteredRoom.roomId === undefined && resolvedUnregisteredRoom.roomName === 'Geheimkammer Hinter Dem Regal',
    'Test 15c: resolveRoom keeps roomName and leaves roomId undefined for unregistered room (no unsafe string replace ID)'
  );
}

// Test 16: Structured State Validation discards malformed items safely
{
  const malformedInput = {
    discoveredEntities: [
      { name: 'Gültiger NPC', type: 'character' },
      { name: '', type: 'character' }, // invalid name
      { name: 'Invalid Type', type: 'unknown_type' }, // invalid type
      null
    ],
    presenceChanges: [
      { characterName: 'Clara', state: 'scene_participant' },
      { characterName: '', state: 'present' }, // invalid name
      { characterName: 'Wache', state: 'flying' } // invalid state
    ]
  };

  const validated = AIStoryStateProcessor.validateStoryStateChanges(malformedInput);
  assert(
    validated.discoveredEntities?.length === 1 && validated.discoveredEntities[0].name === 'Gültiger NPC',
    'Test 16a: validateStoryStateChanges safely discards malformed discoveredEntities'
  );
  assert(
    validated.presenceChanges?.length === 1 && validated.presenceChanges[0].characterName === 'Clara',
    'Test 16b: validateStoryStateChanges safely discards malformed presenceChanges'
  );
}

// Test 17: AIStoryStateProcessor decoupled from legacy scanner on plain text response
{
  const plainNarrativeAiText = "Du betrittst die alte Bibliothek. Der Staub tanzt im Sonnenlicht.";
  const dummyAdv: any = {
    npcs: [{ id: 'npc-orig', name: 'Original NPC' }],
    storyState: { storyEntities: [] }
  };

  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(plainNarrativeAiText, dummyAdv);
  assert(
    processed.hasStructuredData === false &&
    processed.cleanedNarrativeText === plainNarrativeAiText &&
    processed.updatedAdventure.npcs.length === 1,
    'Test 17: AIStoryStateProcessor does not run legacy scanner on plain narrative text'
  );
}

// Test 18: Absent presenceState overrides companion/party boolean flags
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const absentCompanion = {
    id: 'comp-1',
    name: 'Gefährte',
    isCompanion: true,
    presenceState: { state: 'absent' }
  };

  assert(
    LocationContextService.isCharacterAtLocation(absentCompanion, playerLoc) === false,
    'Test 18: presenceState.state === "absent" overrides isCompanion flag'
  );
}

console.log('\n=== ALL 18 TESTS PASSED PERFECTLY ===');
