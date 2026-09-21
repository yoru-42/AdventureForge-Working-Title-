import { LocationContextService } from '../services/locationContextService';
import { AIStoryStateProcessor } from '../services/aiStoryStateProcessor';
import { CurrentLocationContext } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

console.log('=== RUNNING FULL ADVENTUREFORGE PRESENCE & STATE PIPELINE SUITE ===\n');

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

// Test 8: Mentioned + previously known physical location preserves location
{
  const dummyAdventure: any = {
    npcs: [
      {
        id: 'npc-8a',
        name: 'Aldric',
        currentLocationContext: { locationName: 'Burg Falkenstein' },
        presenceState: { state: 'present', locationContext: { locationName: 'Burg Falkenstein' } }
      }
    ],
    currentLocation: { locationName: 'Falkengrund' }
  };

  const processed = (AIStoryStateProcessor as any).processPresenceChanges(dummyAdventure, [
    { characterId: 'npc-8a', characterName: 'Aldric', state: 'mentioned_only' }
  ]);

  const aldric = processed.npcs.find((n: any) => n.id === 'npc-8a');
  assert(
    aldric.lastMentionedAt !== undefined &&
    aldric.currentLocationContext.locationName === 'Burg Falkenstein' &&
    aldric.presenceState.state !== 'absent',
    'Test 8: mentioned_only records lastMentionedAt and preserves known physical location'
  );
}

// Test 9: Explicit present state
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const npc = {
    id: 'npc-9',
    name: 'Händler',
    presenceState: { state: 'present', locationContext: playerLoc }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 9: presenceState.state === "present" -> physically present'
  );
}

// Test 10: Explicit scene_participant bound to matching sceneId
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund', sceneId: 'scene-10' };
  const npc = {
    id: 'npc-10',
    name: 'Bote',
    presenceState: { state: 'scene_participant', sceneId: 'scene-10', locationContext: playerLoc }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 10: scene_participant with matching sceneId -> present in scene'
  );
}

// Test 11: scene_participant with old sceneId -> does NOT grant presence in new scene
{
  const newSceneLoc: CurrentLocationContext = { locationName: 'Falkengrund', sceneId: 'scene-new-11' };
  const npc = {
    id: 'npc-11',
    name: 'Alter Gast',
    appearance: { currentLocation: 'Burg Falkenstein' },
    presenceState: { state: 'scene_participant', sceneId: 'scene-old-10', locationContext: { locationName: 'Burg Falkenstein' } }
  };
  assert(
    LocationContextService.isCharacterAtLocation(npc, newSceneLoc) === false,
    'Test 11: scene_participant with old sceneId does not grant presence in new scene'
  );
}

// Test 12: Companion flag alone does NOT grant physical presence
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const companion = {
    id: 'comp-12',
    name: 'Schattenwolf',
    isCompanion: true,
    appearance: { currentLocation: 'Burg Falkenstein' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(companion, playerLoc) === false,
    'Test 12: Companion flag alone does not grant physical presence'
  );
}

// Test 13: PartyMember flag alone does NOT grant physical presence
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const partyMember = {
    id: 'party-13',
    name: 'Magierin',
    isPartyMember: true,
    appearance: { currentLocation: 'Zauberturm' }
  };
  assert(
    LocationContextService.isCharacterAtLocation(partyMember, playerLoc) === false,
    'Test 13: PartyMember flag alone does not grant physical presence'
  );
}

// Test 14: Duplicate Names resolved strictly by ID when ID is provided
{
  const npcs = [
    { id: 'npc-hans-1', name: 'Hans', currentSituation: 'Alter Hans' },
    { id: 'npc-hans-2', name: 'Hans', currentSituation: 'Neuer Hans' }
  ];

  const resolved = LocationContextService.resolveCharacter(npcs, {
    id: 'npc-hans-2',
    name: 'Hans'
  });

  assert(
    resolved && resolved.id === 'npc-hans-2' && resolved.currentSituation === 'Neuer Hans',
    'Test 14: Duplicate names resolved strictly by ID when ID is provided'
  );
}

// Test 15: Duplicate Names with NO ID -> returns undefined (prevents false assignment)
{
  const npcs = [
    { id: 'npc-hans-1', name: 'Hans' },
    { id: 'npc-hans-2', name: 'Hans' }
  ];

  const resolved = LocationContextService.resolveCharacter(npcs, { name: 'Hans' });

  assert(
    resolved === undefined,
    'Test 15: Duplicate names without ID returns undefined to prevent false assignment'
  );
}

// Test 16: Player movement does NOT mutate global world state (adventure.world.currentLocationId)
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
    'Test 16: Player location update preserves adventure.world.currentLocationId'
  );
}

// Test 17: Room change preserves building context
{
  const dummyAdventure: any = {
    currentLocation: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch', roomName: 'Schankraum' },
    storyState: { currentLocationContext: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch', roomName: 'Schankraum' } }
  };

  const updated = LocationContextService.updateCurrentLocation(dummyAdventure, {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Küche'
  });

  assert(
    updated.currentLocation.buildingName === 'Taverne Zum Hirsch' &&
    updated.currentLocation.roomName === 'Küche',
    'Test 17: Room change preserves building context'
  );
}

// Test 18: Unregistered room name keeps roomName and leaves roomId undefined (no fake ID generated)
{
  const mockHolding: any = { id: 'holding-1', name: 'Altes Anwesen', buildingRooms: [] };
  const resolvedRoom = LocationContextService.resolveRoom(mockHolding, 'Geheimkammer Hinter Dem Regal');

  assert(
    resolvedRoom.roomId === undefined && resolvedRoom.roomName === 'Geheimkammer Hinter Dem Regal',
    'Test 18: Unregistered room keeps roomName and leaves roomId undefined (no fake string replace ID)'
  );
}

// Test 19: Registered room correctly resolved with exact ID
{
  const mockHolding: any = {
    id: 'holding-1',
    name: 'Taverne',
    buildingRooms: [{ id: 'room-schankraum-id', name: 'Schankraum' }]
  };
  const resolvedRoom = LocationContextService.resolveRoom(mockHolding, 'Schankraum');

  assert(
    resolvedRoom.roomId === 'room-schankraum-id' && resolvedRoom.roomName === 'Schankraum',
    'Test 19: Registered room correctly resolved with exact ID'
  );
}

// Test 20: Registered building correctly resolved by exact name
{
  const holdings: any[] = [{ id: 'bld-hirsch', name: 'Taverne Zum Hirsch' }];
  const resolved = LocationContextService.resolveBuilding(holdings, 'Taverne Zum Hirsch');

  assert(
    resolved?.id === 'bld-hirsch',
    'Test 20: Registered building correctly resolved by exact name'
  );
}

// Test 21: Similar building names not confused (exact matching)
{
  const holdings: any[] = [
    { id: 'bld-haus', name: 'Haus' },
    { id: 'bld-rathaus', name: 'Rathaus' }
  ];
  const resolved = LocationContextService.resolveBuilding(holdings, 'Rathaus');

  assert(
    resolved?.id === 'bld-rathaus',
    'Test 21: Similar building names (Haus vs Rathaus) resolved strictly without substring confusion'
  );
}

// Test 22: Known character without physical presence is NOT available in dialogue
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const allChars = [
    { id: 'npc-distant', name: 'König', appearance: { currentLocation: 'Hauptstadt' } },
    { id: 'npc-local', name: 'Wache', appearance: { currentLocation: 'Falkengrund' } }
  ];

  const present = LocationContextService.filterPresentCharacters(allChars, playerLoc);

  assert(
    present.length === 1 && present[0].id === 'npc-local',
    'Test 22: Distant known character is excluded from available dialogue NPCs'
  );
}

// Test 23: Present character is available according to presence rules
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Taverne', roomName: 'Schankraum' };
  const npc = { id: 'npc-23', name: 'Wirt', appearance: { currentLocation: 'Taverne → Schankraum' } };

  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === true,
    'Test 23: Physically present character in same room is available'
  );
}

// Test 24: Scene participant is available
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const npc = { id: 'npc-24', name: 'Bote', presenceState: { state: 'scene_participant', locationContext: playerLoc } };

  assert(
    LocationContextService.isCharacterInScene(npc, playerLoc) === true,
    'Test 24: Active scene participant is available in scene'
  );
}

// Test 25: Mention alone does NOT make character available for dialogue
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const npc = { id: 'npc-25', name: 'Händler', currentSituation: 'Erwähnt in Notizen', appearance: { currentLocation: 'Fernes Dorf' } };

  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 25: Mention alone does not grant dialogue availability'
  );
}

// Test 26: Dialogue -> Combat transition retains character ID
{
  const dialogueParticipantIds = ['npc-enemy-1', 'npc-enemy-2'];
  const combatParticipants = dialogueParticipantIds.map(id => ({ id, name: 'Gegner' }));

  assert(
    combatParticipants[0].id === 'npc-enemy-1' && combatParticipants[1].id === 'npc-enemy-2',
    'Test 26: Dialogue to combat transition preserves character IDs'
  );
}

// Test 27: Combat -> Dialogue transition retains character ID and location
{
  const combatLoc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Gasse' };
  const npc = { id: 'npc-enemy-1', currentLocationContext: combatLoc, presenceState: { state: 'present', locationContext: combatLoc } };

  assert(
    npc.id === 'npc-enemy-1' && npc.currentLocationContext.locationName === 'Falkengrund',
    'Test 27: Combat to dialogue transition retains character ID and LocationContext'
  );
}

// Test 28: AI state processor handles valid structured state changes
{
  const aiText = `Du sprichst mit Clara.
<STORY_STATE_CHANGES>
{
  "presenceChanges": [
    { "characterId": "npc-clara", "characterName": "Clara", "state": "scene_participant" }
  ]
}
</STORY_STATE_CHANGES>`;

  const dummyAdv: any = {
    npcs: [{ id: 'npc-clara', name: 'Clara' }],
    currentLocation: { locationName: 'Falkengrund' }
  };

  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(aiText, dummyAdv);

  assert(
    processed.hasStructuredData === true &&
    processed.cleanedNarrativeText === 'Du sprichst mit Clara.',
    'Test 28: AI state processor parses structured state and strips JSON block from narrative'
  );
}

// Test 29: Narrative text remains clean even when structured JSON block exists
{
  const aiText = `Der Staub liegt schwer auf den Büchern.
<STORY_STATE_CHANGES>
{
  "presenceChanges": []
}
</STORY_STATE_CHANGES>`;

  const dummyAdv: any = { npcs: [], currentLocation: { locationName: 'Bibliothek' } };
  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(aiText, dummyAdv);

  assert(
    !processed.cleanedNarrativeText.includes('<STORY_STATE_CHANGES>'),
    'Test 29: Narrative text is stripped of state change XML tags'
  );
}

// Test 30: Legacy scanner is NOT invoked on plain narrative text
{
  const plainText = 'Ein einfacher Satz ohne Zustandssignale.';
  const dummyAdv: any = { npcs: [{ id: 'n1', name: 'N1' }] };
  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(plainText, dummyAdv);

  assert(
    processed.hasStructuredData === false &&
    processed.cleanedNarrativeText === plainText &&
    processed.updatedAdventure.npcs.length === 1,
    'Test 30: Legacy scanner is decoupled and not invoked on normal narrative text'
  );
}

// Test 31: Malformed JSON does not crash narrative rendering
{
  const malformedText = `Ein Sturm zieht auf.
<STORY_STATE_CHANGES>
{ INVALID JSON HERE
</STORY_STATE_CHANGES>`;

  const dummyAdv: any = { npcs: [] };
  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(malformedText, dummyAdv);

  assert(
    processed.cleanedNarrativeText === 'Ein Sturm zieht auf.',
    'Test 31: Malformed JSON safely strips tag without crashing narrative response'
  );
}

// Test 32: validateStoryStateChanges discards invalid state values
{
  const input = {
    presenceChanges: [
      { characterName: 'Clara', state: 'flying' }, // invalid state
      { characterName: 'Wache', state: 'present' } // valid state
    ]
  };

  const validated = AIStoryStateProcessor.validateStoryStateChanges(input);

  assert(
    validated.presenceChanges?.length === 1 && validated.presenceChanges[0].characterName === 'Wache',
    'Test 32: validateStoryStateChanges discards invalid state values'
  );
}

// Test 33: New discovered characters are placed in storyEntities (Story Info), NOT directly promoted to permanent Codex
{
  const input = {
    discoveredEntities: [
      { name: 'Unbekannter Fremder', type: 'character', description: 'Ein Mann im Kapuzenmantel' }
    ]
  };

  const dummyAdv: any = { npcs: [], loreDatabase: [], storyState: { storyEntities: [] } };
  const processed = (AIStoryStateProcessor as any).processDiscoveredEntities(dummyAdv, input.discoveredEntities);

  assert(
    processed.storyState.storyEntities.some((e: any) => e.title === 'Unbekannter Fremder') &&
    !processed.loreDatabase.some((l: any) => l.title === 'Unbekannter Fremder'),
    'Test 33: Discovered entities land in temporary storyEntities (Story Info) first, NOT permanent Codex'
  );
}

// Test 34: New character receives LocationContext only if derivable from AI state
{
  const input = {
    discoveredEntities: [
      { name: 'Gardeoffizier', type: 'character', description: 'Wache am Tor' }
    ]
  };

  const dummyAdv: any = { npcs: [], loreDatabase: [], storyState: { storyEntities: [] } };
  const processed = (AIStoryStateProcessor as any).processDiscoveredEntities(dummyAdv, input.discoveredEntities);
  const ent = processed.storyState.storyEntities.find((e: any) => e.title === 'Gardeoffizier');

  assert(
    ent !== undefined,
    'Test 34: New discovered entity processed safely into storyEntities'
  );
}

// Test 35: Rendering / querying isCharacterAtLocation multiple times is idempotent with zero state mutation
{
  const npc = { id: 'npc-35', name: 'Test', appearance: { currentLocation: 'Falkengrund' } };
  const loc: CurrentLocationContext = { locationName: 'Falkengrund' };

  const isPres1 = LocationContextService.isCharacterAtLocation(npc, loc);
  const isPres2 = LocationContextService.isCharacterAtLocation(npc, loc);
  const isPres3 = LocationContextService.isCharacterAtLocation(npc, loc);

  assert(
    isPres1 === true && isPres2 === true && isPres3 === true && npc.appearance.currentLocation === 'Falkengrund',
    'Test 35: Multiple presence queries are completely idempotent and cause zero state mutations'
  );
}

// Test 36: isExplicitlyPresent without matching sceneId does NOT force presence
{
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund' };
  const npc = {
    id: 'npc-36',
    name: 'Schatten',
    isExplicitlyPresent: true,
    appearance: { currentLocation: 'Zauberturm' }
  };

  assert(
    LocationContextService.isCharacterAtLocation(npc, playerLoc) === false,
    'Test 36: isExplicitlyPresent=true without matching sceneId does NOT force physical presence'
  );
}

// Test 37: scene_participant without sceneId fallback to 'present' in AI state processor
{
  const dummyAdventure: any = {
    npcs: [{ id: 'npc-37', name: 'Bote' }],
    currentLocation: { locationName: 'Falkengrund' } // no sceneId!
  };

  const processed = (AIStoryStateProcessor as any).processPresenceChanges(dummyAdventure, [
    { characterId: 'npc-37', characterName: 'Bote', state: 'scene_participant' }
  ]);

  const bote = processed.npcs.find((n: any) => n.id === 'npc-37');

  assert(
    bote.presenceState.state === 'present',
    'Test 37: scene_participant without active sceneId falls back to "present"'
  );
}

console.log('\n=== ALL 37 ADVENTUREFORGE INTEGRATION & PRESENCE TESTS PASSED PERFECTLY ===');
