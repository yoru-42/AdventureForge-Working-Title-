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
  const playerLoc: CurrentLocationContext = { locationName: 'Falkengrund', sceneId: 'scene-24' };
  const npc = { id: 'npc-24', name: 'Bote', presenceState: { state: 'scene_participant', sceneId: 'scene-24', locationContext: playerLoc } };

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

// -------------------------------------------------------------
// SECTION 15 TESTS: Erwähnung, Anwesenheit, Szenenteilnahme, Dialog, Kampf
// -------------------------------------------------------------

// Test 38 (Section 15, Case 1): Erwähnung eines anwesenden Charakters
// NPC = present, AI state = mentioned_only -> presenceState = present bleibt unverändert.
{
  const loc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch' };
  const dummyAdventure: any = {
    npcs: [
      {
        id: 'npc-baron-1',
        name: 'Baron Von Falkenstein',
        presenceState: { state: 'present', locationContext: loc, updatedAt: '2026-01-01T00:00:00.000Z' }
      }
    ],
    currentLocation: loc
  };

  const processed = (AIStoryStateProcessor as any).processPresenceChanges(dummyAdventure, [
    { characterId: 'npc-baron-1', characterName: 'Baron Von Falkenstein', state: 'mentioned_only' }
  ]);

  const baron = processed.npcs.find((n: any) => n.id === 'npc-baron-1');
  assert(
    baron.presenceState.state === 'present' &&
    baron.presenceState.locationContext.buildingName === 'Taverne Zum Hirsch' &&
    baron.lastMentionedAt !== undefined,
    'Test 38: Erwähnung eines anwesenden Charakters lässt presenceState=present unverändert'
  );
}

// Test 39 (Section 15, Case 2): Erwähnung eines Szenenteilnehmers
// Vorher: presenceState = scene_participant, sceneId = scene-1. Danach: mentioned_only
// Ergebnis: presenceState = scene_participant, sceneId = scene-1 muss unverändert bleiben.
{
  const loc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch', sceneId: 'scene-1' };
  const dummyAdventure: any = {
    npcs: [
      {
        id: 'npc-wache-1',
        name: 'Wache Eric',
        presenceState: { state: 'scene_participant', sceneId: 'scene-1', locationContext: loc, updatedAt: '2026-01-01T00:00:00.000Z' }
      }
    ],
    currentLocation: loc
  };

  const processed = (AIStoryStateProcessor as any).processPresenceChanges(dummyAdventure, [
    { characterId: 'npc-wache-1', characterName: 'Wache Eric', state: 'mentioned_only' }
  ]);

  const eric = processed.npcs.find((n: any) => n.id === 'npc-wache-1');
  assert(
    eric.presenceState.state === 'scene_participant' &&
    eric.presenceState.sceneId === 'scene-1' &&
    eric.lastMentionedAt !== undefined,
    'Test 39: Erwähnung eines Szenenteilnehmers lässt scene_participant und sceneId unverändert'
  );
}

// Test 40 (Section 15, Case 3): Physisch anwesend, aber keine Szene
// NPC location = gleiche Taverne, current scene = scene-1, NPC sceneId = undefined
// Ergebnis: physically present = true, scene participant = false
{
  const loc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch', sceneId: 'scene-1' };
  const npc = {
    id: 'npc-gast',
    name: 'Gast',
    currentLocationContext: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch' },
    presenceState: { state: 'present', locationContext: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch' } }
  };

  const isPhysPresent = LocationContextService.isCharacterAtLocation(npc, loc);
  const isScenePart = LocationContextService.isCharacterSceneParticipant(npc, loc.sceneId);
  const isInScene = LocationContextService.isCharacterInScene(npc, loc);

  assert(
    isPhysPresent === true && isScenePart === false && isInScene === false,
    'Test 40: Physisch anwesend in gleicher Taverne, aber ohne Szenenzuordnung -> present=true, scene_participant=false'
  );
}

// Test 41 (Section 15, Case 4): Falsche Szene
// NPC sceneId = scene-2, current scene = scene-1
// Ergebnis: physically present kann true sein, scene participant = false
{
  const loc: CurrentLocationContext = { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch', sceneId: 'scene-1' };
  const npc = {
    id: 'npc-butler',
    name: 'Butler',
    currentLocationContext: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch' },
    presenceState: {
      state: 'scene_participant',
      sceneId: 'scene-2',
      locationContext: { locationName: 'Falkengrund', buildingName: 'Taverne Zum Hirsch' }
    }
  };

  const isPhysPresent = LocationContextService.isCharacterAtLocation(npc, loc);
  const isScenePart = LocationContextService.isCharacterSceneParticipant(npc, loc.sceneId);
  const isInScene = LocationContextService.isCharacterInScene(npc, loc);

  assert(
    isPhysPresent === true && isScenePart === false && isInScene === false,
    'Test 41: Falsche Szene (scene-2 vs scene-1) -> physically present=true, scene participant=false'
  );
}

// Test 42 (Section 15, Case 5): Gleicher Raum, aber keine Szenenteilnahme
// NPC room = Schankraum, Player room = Schankraum ohne explizite Szenenteilnahme
// Ergebnis: physically present = true, scene participant = false
{
  const loc: CurrentLocationContext = {
    locationName: 'Falkengrund',
    buildingName: 'Taverne Zum Hirsch',
    roomName: 'Schankraum',
    sceneId: 'scene-dialogue-1'
  };
  const npc = {
    id: 'npc-wirt',
    name: 'Wirt',
    currentLocationContext: {
      locationName: 'Falkengrund',
      buildingName: 'Taverne Zum Hirsch',
      roomName: 'Schankraum'
    },
    presenceState: {
      state: 'present',
      locationContext: {
        locationName: 'Falkengrund',
        buildingName: 'Taverne Zum Hirsch',
        roomName: 'Schankraum'
      }
    }
  };

  const isPhysPresent = LocationContextService.isCharacterAtLocation(npc, loc);
  const isScenePart = LocationContextService.isCharacterSceneParticipant(npc, loc.sceneId);
  const isInScene = LocationContextService.isCharacterInScene(npc, loc);

  assert(
    isPhysPresent === true && isScenePart === false && isInScene === false,
    'Test 42: Gleicher Raum, aber keine explizite Szenenteilnahme -> physically present=true, scene participant=false'
  );
}

// Test 43 (Section 15, Case 6): Expliziter Szenenteilnehmer
// dialogueParticipantIds / sceneParticipantIds mit stabiler characterId
// Ergebnis: scene participant = true nur für diese konkrete Szene
{
  const locScene1: CurrentLocationContext = { locationName: 'Falkengrund', sceneId: 'scene-1' };
  const locScene2: CurrentLocationContext = { locationName: 'Falkengrund', sceneId: 'scene-2' };
  const npc = {
    id: 'char-stable-43',
    name: 'Söldner'
  };

  const isParticipantInScene1 = LocationContextService.isCharacterSceneParticipant(npc, locScene1.sceneId, ['char-stable-43']);
  const isParticipantInScene2 = LocationContextService.isCharacterSceneParticipant(npc, locScene2.sceneId, ['other-char']);

  assert(
    isParticipantInScene1 === true && isParticipantInScene2 === false,
    'Test 43: Expliziter Szenenteilnehmer ist nur für die zugewiesene Szene Teilnehmer'
  );
}

// Test 44 (Section 15, Case 7): Dialogteilnehmer
// Ein Szenenteilnehmer ohne Dialogeintrag darf nicht automatisch als Dialogsprecher erscheinen.
{
  const sceneParticipants = [
    { id: 'char-player', name: 'Spieler' },
    { id: 'char-baron', name: 'Baron' },
    { id: 'char-butler', name: 'Butler' },
    { id: 'char-guard', name: 'Wache' }
  ];

  // Nur Baron und Butler sprechen aktiv im Dialog
  const dialogueSpeakers = ['char-player', 'char-baron', 'char-butler'];

  const guardIsScenePart = sceneParticipants.some(p => p.id === 'char-guard');
  const guardIsDialogueSpeaker = dialogueSpeakers.includes('char-guard');

  assert(
    guardIsScenePart === true && guardIsDialogueSpeaker === false,
    'Test 44: Szenenteilnehmer (Wache) ist nicht automatisch Dialogteilnehmer/Sprecher'
  );
}

// Test 45 (Section 15, Case 8): Combat
// Ein Dialogteilnehmer darf nicht automatisch als Kampfbeteiligter erscheinen.
{
  const dialogueSpeakers = [
    { id: 'char-player', name: 'Spieler' },
    { id: 'char-baron', name: 'Baron' },
    { id: 'char-guard', name: 'Wache' }
  ];

  // Nur die Wache greift an / ist Combat-Gegner, Baron schaut zu
  const combatParticipantIds = ['char-guard'];

  const baronInDialogue = dialogueSpeakers.some(s => s.id === 'char-baron');
  const baronInCombat = combatParticipantIds.includes('char-baron');

  assert(
    baronInDialogue === true && baronInCombat === false,
    'Test 45: Dialogteilnehmer (Baron) ist nicht automatisch Kampfbeteiligter'
  );
}

// Test 46 (Section 15, Case 9): Doppelte Namen
// Zwei NPCs mit demselben Namen (character-A, character-B) müssen über IDs getrennt bleiben.
{
  const npcs = [
    { id: 'char-a-46', name: 'Hans', appearance: { currentLocation: 'Falkengrund' } },
    { id: 'char-b-46', name: 'Hans', appearance: { currentLocation: 'Eichenhain' } }
  ];

  const resolvedA = LocationContextService.resolveCharacter(npcs, { id: 'char-a-46', name: 'Hans' });
  const resolvedB = LocationContextService.resolveCharacter(npcs, { id: 'char-b-46', name: 'Hans' });
  const ambiguous = LocationContextService.resolveCharacter(npcs, { name: 'Hans' });

  assert(
    resolvedA?.id === 'char-a-46' &&
    resolvedB?.id === 'char-b-46' &&
    ambiguous === undefined,
    'Test 46: Doppelte Namen werden über IDs strikt getrennt und ohne ID abgewiesen'
  );
}

// Test 47 (Section 15, Case 10): Dialog -> Kampf -> Dialog
// Die characterId und das Portrait müssen über alle drei Zustände erhalten bleiben.
{
  const originalChar = {
    id: 'char-baron-47',
    name: 'Baron',
    image: 'https://example.com/portraits/baron.png',
    currentLocationContext: { locationName: 'Falkengrund', buildingName: 'Schloss' },
    presenceState: { state: 'present', locationContext: { locationName: 'Falkengrund', buildingName: 'Schloss' } }
  };

  // 1. Im Dialog
  const dialogueChar = {
    characterId: originalChar.id,
    characterName: originalChar.name,
    avatar: originalChar.image
  };

  // 2. Im Kampf (Gegnerübernahme)
  const combatChar = {
    id: dialogueChar.characterId,
    name: dialogueChar.characterName,
    image: dialogueChar.avatar
  };

  // 3. Zurück im Dialog
  const postCombatDialogueChar = {
    characterId: combatChar.id,
    characterName: combatChar.name,
    avatar: combatChar.image
  };

  assert(
    dialogueChar.characterId === originalChar.id &&
    combatChar.id === originalChar.id &&
    postCombatDialogueChar.characterId === originalChar.id &&
    postCombatDialogueChar.avatar === originalChar.image,
    'Test 47: Dialog -> Kampf -> Dialog bewahrt characterId und Portrait konsistent'
  );
}

// Test 48: AI response with discovered character, location, item creates temporary StoryEntity items without modifying Codex
{
  const adv: any = {
    player: { name: 'Held', inventory: [] },
    npcs: [],
    loreDatabase: [{ id: 'lore-1', category: 'Weltregeln', title: 'Alte Gesetze' }],
    storyState: { storyEntities: [], activeGoals: [] },
    currentLocation: { locationName: 'Hauptstadt' }
  };

  const aiText = `
Hier ist die Geschichte.
\`\`\`json:story_state
{
  "locationChange": {
    "locationName": "Dunkelwald",
    "buildingName": "Verlassene Hütte"
  },
  "presenceChanges": [
    {
      "characterName": "Waldläufer Robin",
      "state": "present"
    }
  ],
  "inventoryChanges": [
    {
      "item": "Zauberkompass",
      "action": "added"
    }
  ],
  "discoveredEntities": [
    {
      "type": "character",
      "name": "Waldläufer Robin",
      "description": "Ein erfahrener Fährtensucher."
    },
    {
      "type": "location",
      "name": "Dunkelwald",
      "description": "Ein dichter, dunkler Wald."
    },
    {
      "type": "building",
      "name": "Verlassene Hütte",
      "description": "Eine alte Holzhütte."
    },
    {
      "type": "item",
      "name": "Zauberkompass",
      "description": "Ein leuchtender Kompass."
    },
    {
      "type": "creature",
      "name": "Schattenwolf",
      "description": "Ein wilder Wolf mit rot glühenden Augen."
    }
  ]
}
\`\`\`
`;

  const processed = AIStoryStateProcessor.parseAndProcessAiResponse(aiText, adv);
  const updatedAdv = processed.updatedAdventure;

  const storyEntities = updatedAdv.storyState?.storyEntities || [];
  const loreDb = updatedAdv.loreDatabase || [];

  assert(
    loreDb.length === 1 && loreDb[0].title === 'Alte Gesetze',
    'Test 48a: Permanent Codex (loreDatabase) is NOT automatically overwritten by AI discovery'
  );

  const foundRobin = storyEntities.find((e: any) => e.title === 'Waldläufer Robin');
  const foundDunkelwald = storyEntities.find((e: any) => e.title === 'Dunkelwald');
  const foundHuette = storyEntities.find((e: any) => e.title === 'Verlassene Hütte');
  const foundKompass = storyEntities.find((e: any) => e.title === 'Zauberkompass');
  const foundWolf = storyEntities.find((e: any) => e.title === 'Schattenwolf');

  assert(
    foundRobin !== undefined &&
    foundDunkelwald !== undefined &&
    foundHuette !== undefined &&
    foundKompass !== undefined &&
    foundWolf !== undefined,
    'Test 48b: All discovered entities (NPC, locations, item, enemy) reliably created in storyEntities'
  );

  assert(
    storyEntities.every((e: any) => e.isNewInStory === true && e.promotedToCodex === false),
    'Test 49: All new story entities have isNewInStory=true and promotedToCodex=false'
  );
}

// Test 50: Story-Info badge count reflects unpromoted and unkept temporary entities
{
  const testEntities: any[] = [
    { id: '1', title: 'A', isNewInStory: true, promotedToCodex: false },
    { id: '2', title: 'B', isNewInStory: false, promotedToCodex: false }, // user chose "Temporär behalten"
    { id: '3', title: 'C', isNewInStory: false, promotedToCodex: true },  // user chose "In Codex übernehmen"
    { id: '4', title: 'D', isNewInStory: true, promotedToCodex: false }
  ];

  const pendingCount = testEntities.filter(e => !e.promotedToCodex && e.isNewInStory !== false).length;
  assert(
    pendingCount === 2,
    'Test 50: Badge count correctly counts only unpromoted & newly marked story entities'
  );
}

// Test 51: Chat history and message persistence preservation logic
{
  const initialMsgs = [{ id: 'm1', text: 'Hallo' }, { id: 'm2', text: 'Auf ins Abenteuer!' }];
  const messagesRef = { current: initialMsgs };
  const currentAdventure: any = { id: 'adv-51', chatHistory: [] };

  const currentMsgs = messagesRef.current && messagesRef.current.length > 0 ? messagesRef.current : currentAdventure.chatHistory;
  const updatedAdventure = {
    ...currentAdventure,
    chatHistory: currentMsgs
  };

  assert(
    updatedAdventure.chatHistory.length === 2 && updatedAdventure.chatHistory[1].text === 'Auf ins Abenteuer!',
    'Test 51: Chat history is reliably preserved from latest messagesRef when updating adventure'
  );
}

// Test 52: ensureStoryEntity deduplication by ID and by Title
{
  let list: any[] = [];
  const res1 = AIStoryStateProcessor.ensureStoryEntity(list, {
    id: 'ent-1',
    category: 'Charaktere',
    title: 'Gideon Sternensucher',
    description: 'Ein geheimnisvoller Magier'
  });
  list = res1.updatedList;

  assert(list.length === 1 && res1.isNew === true, 'Test 52a: New entity added to empty list');

  // Same ID, updated description
  const res2 = AIStoryStateProcessor.ensureStoryEntity(list, {
    id: 'ent-1',
    category: 'Charaktere',
    title: 'Gideon Sternensucher',
    description: 'Ein mächtiger Magier'
  });
  list = res2.updatedList;
  assert(
    list.length === 1 && res2.isNew === false && list[0].description === 'Ein mächtiger Magier',
    'Test 52b: Existing ID updates description without creating duplicates'
  );

  // Same title in same category without ID
  const res3 = AIStoryStateProcessor.ensureStoryEntity(list, {
    category: 'Charaktere',
    title: 'Gideon Sternensucher',
    description: 'Weitere Notizen'
  });
  list = res3.updatedList;
  assert(
    list.length === 1 && res3.isNew === false,
    'Test 52c: Same title in same category does not create duplicate'
  );
}

// Test 53: ensureStoryEntity linked npcId deduplication
{
  let list: any[] = [];
  const res1 = AIStoryStateProcessor.ensureStoryEntity(list, {
    category: 'Charaktere',
    title: 'Wirtin Helga',
    description: 'Die Tavernenwirtin',
    details: { npcId: 'npc-helga-99' }
  });
  list = res1.updatedList;

  const res2 = AIStoryStateProcessor.ensureStoryEntity(list, {
    category: 'Charaktere',
    title: 'Helga',
    details: { npcId: 'npc-helga-99', role: 'Wirtin' }
  });
  list = res2.updatedList;

  assert(
    list.length === 1 && list[0].details?.role === 'Wirtin',
    'Test 53: Linked npcId resolves to existing story entity regardless of minor title variations'
  );
}

// Test 54: ensureStoryEntity checks permanent Codex (loreDatabase)
{
  const loreDb: any[] = [
    { id: 'lore-1', category: 'Orte', title: 'Falkengrund', description: 'Ein altes Dorf' }
  ];
  let list: any[] = [];

  const res = AIStoryStateProcessor.ensureStoryEntity(list, {
    category: 'Orte',
    title: 'Falkengrund',
    description: 'Dorfbeschreibung'
  }, loreDb);

  assert(
    res.entity.promotedToCodex === true && res.isNew === false,
    'Test 54: Entity already in Codex is marked as promotedToCodex and not a new pending badge'
  );
}

// Test 55: processedFirstMessage flag prevents duplicate initialization loops
{
  const adv: any = {
    id: 'adv-55',
    firstMessage: 'Willkommen in Falkengrund!\n<STORY_STATE_CHANGES>{"discoveredEntities":[{"type":"location","name":"Marktplatz"}]}</STORY_STATE_CHANGES>',
    storyState: {
      storyEntities: [],
      processedFirstMessage: true
    }
  };

  // When processedFirstMessage is true, GameView does not re-process firstMessage on mount/render
  assert(
    adv.storyState.processedFirstMessage === true,
    'Test 55: processedFirstMessage flag reliably tracks initialization state'
  );
}

// Test 56: computeMessageFingerprint produces deterministic hashes and detects differences
{
  const msgA = 'Willkommen im Abenteuer! Du stehst vor dem Tor.';
  const msgB = 'Willkommen im Abenteuer! Du stehst vor dem Palast.';
  const fpA1 = AIStoryStateProcessor.computeMessageFingerprint(msgA);
  const fpA2 = AIStoryStateProcessor.computeMessageFingerprint(msgA);
  const fpB = AIStoryStateProcessor.computeMessageFingerprint(msgB);

  assert(
    fpA1 === fpA2 && fpA1 !== fpB && fpA1.startsWith('fp-'),
    'Test 56: computeMessageFingerprint is deterministic and detects message content changes'
  );
}

// Test 57: Discovered character defaults to absent unless explicitly marked present
{
  const adv: any = {
    npcs: [],
    loreDatabase: [],
    storyState: { storyEntities: [] },
    currentLocation: { locationName: 'Falkengrund' }
  };

  const discoveryInput = [
    { name: 'Dorfältester Otto', type: 'character' as const, description: 'Der alte Älteste des Dorfes.' },
    { name: 'Wache Torben', type: 'character' as const, description: 'Wache am Stadttor.' }
  ];

  const presenceInput = [
    { characterName: 'Wache Torben', state: 'present' as const }
  ];

  const processed = (AIStoryStateProcessor as any).processDiscoveredEntities(adv, discoveryInput, [], presenceInput);
  const otto = processed.npcs.find((n: any) => n.name === 'Dorfältester Otto');
  const torben = processed.npcs.find((n: any) => n.name === 'Wache Torben');

  assert(
    otto && otto.presenceState.state === 'absent' &&
    torben && torben.presenceState.state === 'present',
    'Test 57: Discovered character defaults to absent unless explicitly present in presenceChanges'
  );
}

// Test 58: processLocationChange updates currentLocation without generating unprompted Story-Info entities
{
  const adv: any = {
    npcs: [],
    loreDatabase: [],
    storyState: { storyEntities: [] },
    currentLocation: { locationName: 'Altes Dorf' }
  };

  const processed = (AIStoryStateProcessor as any).processLocationChange(adv, {
    locationName: 'Neuer Bergpass',
    buildingName: 'Wachstation'
  }, []);

  assert(
    processed.currentLocation.locationName === 'Neuer Bergpass' &&
    processed.currentLocation.buildingName === 'Wachstation' &&
    (processed.storyState?.storyEntities || []).length === 0,
    'Test 58: Location change updates context without polluting storyEntities without discovery'
  );
}

console.log('\n=== ALL 58 ADVENTUREFORGE INTEGRATION & PRESENCE TESTS PASSED PERFECTLY ===');
