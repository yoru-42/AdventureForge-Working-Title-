import { Adventure, CurrentLocationContext, WorldSetting, EconomyHolding, LoreEntry, Territory } from '../types';

export class LocationContextService {
  /**
   * Resolves the current structured location context for an adventure.
   * Priority hierarchy:
   * Raum (roomId / roomName)
   * ↓
   * Gebäude / Holding (buildingId / buildingName)
   * ↓
   * Ort / Siedlung (locationId / locationName)
   * ↓
   * Gebiet / Territorium (territoryId / territoryName)
   * ↓
   * Region / Welt (regionId / regionName, worldId / worldName)
   */
  public static resolveCurrentLocation(adventure: Adventure): CurrentLocationContext {
    if (!adventure) {
      return { worldName: 'Welt', locationName: 'Startgebiet' };
    }

    const world = adventure.world;
    const holdings = world?.economyConfig?.holdings || [];
    const loreEntries = adventure.loreDatabase || world?.loreDatabase || [];
    const territories = world?.territories || [];

    // 1. Direct structured context if already present and valid
    const existing = adventure.currentLocation || adventure.storyState?.currentLocationContext;
    if (existing && (existing.locationName || existing.buildingName || existing.territoryName)) {
      return this.enrichLocationContext(existing, adventure);
    }

    // 2. Check combatState context if in combat or after combat
    if (adventure.combatState?.currentLocationContext) {
      return this.enrichLocationContext(adventure.combatState.currentLocationContext, adventure);
    }

    // 3. Extract and parse from legacy strings
    const rawPlayerLoc = (adventure.player?.appearance?.currentLocation || '').trim();
    const rawStoryLoc = (adventure.storyState?.currentLocationName || '').trim();
    const rawTerritory = (adventure.storyState?.currentTerritoryName || '').trim();
    const rawWorldLocId = world?.dynamicWorldState?.currentLocationId || world?.currentLocationId || world?.startLocationId || '';
    const rawWorldLocName = world?.startLocationName || world?.title || 'Startgebiet';

    const candidateString = rawPlayerLoc || rawStoryLoc || rawWorldLocName;
    const parsed = this.parseLocationString(candidateString, holdings, loreEntries, territories);

    if (rawTerritory && !parsed.territoryName) {
      parsed.territoryName = rawTerritory;
    }

    if (rawWorldLocId && !parsed.locationId) {
      parsed.locationId = rawWorldLocId;
    }

    return this.enrichLocationContext(parsed, adventure);
  }

  /**
   * Parses a combined location string like:
   * "Falkengrund → Taverne „Zum Hirsch“ → Schankraum"
   * "Taverne Zum Hirsch (Schankraum)"
   * "Falkengrund, Zum Hirsch"
   * into a structured context.
   */
  public static parseLocationString(
    input: string,
    holdings: EconomyHolding[] = [],
    loreEntries: LoreEntry[] = [],
    territories: Territory[] = []
  ): CurrentLocationContext {
    if (!input || !input.trim()) {
      return { locationName: 'Startgebiet' };
    }

    const cleanInput = input
      .replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '')
      .replace(/[„“”]/g, '"')
      .trim();

    const isRoomKeyword = /schankraum|küche|gaststube|keller|lager|zimmer|schlafzimmer|saal|flur|dachboden|werkstatt|schmiede|tresen|kammer|büro|empfang|labor|gemach|privatzimmer|speisesaal|stube|thronsaal/i;
    const isBuildingKeyword = /taverne|gasthaus|herberge|wirtshaus|schmiede|burg|festung|tempel|schrein|kirche|kathedrale|gilde|zunfthaus|laden|geschäft|kontor|rathaus|palast|schloss|anwesen|gutshaus|werkstatt|turm|hospital|lazarett|mühle|bäckerei|brauerei|kaserne|garde|posten|quartier/i;

    // 1. Check for arrow syntax: "A → B → C" or "A -> B -> C"
    if (cleanInput.includes('→') || cleanInput.includes('->')) {
      const parts = cleanInput.split(/→|->/).map(p => p.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (parts.length >= 3) {
        return {
          locationName: parts[0],
          buildingName: parts[1],
          roomName: parts[2]
        };
      } else if (parts.length === 2) {
        // Could be Ort → Gebäude or Gebäude → Raum
        const firstMatchHolding = holdings.find(h => h.name.toLowerCase() === parts[0].toLowerCase());
        if (firstMatchHolding) {
          return {
            buildingId: firstMatchHolding.id,
            buildingName: firstMatchHolding.name,
            locationName: firstMatchHolding.locationName,
            roomName: parts[1]
          };
        }

        if (isRoomKeyword.test(parts[1]) || isBuildingKeyword.test(parts[0])) {
          return {
            buildingName: parts[0],
            roomName: parts[1]
          };
        }

        return {
          locationName: parts[0],
          buildingName: parts[1]
        };
      }
    }

    // 2. Check for colon syntax: "Zum Hirsch: Schankraum" or "Falkengrund – Zum Hirsch: Schankraum"
    if (cleanInput.includes(':')) {
      const [left, room] = cleanInput.split(':').map(s => s.trim());
      if (room) {
        const subContext = this.parseLocationString(left, holdings, loreEntries, territories);
        return {
          ...subContext,
          roomName: room
        };
      }
    }

    // 3. Check for slash syntax: "Nordlande / Eichenhain" or "Falkengrund / Taverne"
    if (cleanInput.includes('/')) {
      const slashParts = cleanInput.split('/').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (slashParts.length === 2) {
        const p0 = slashParts[0];
        const p1 = slashParts[1];
        if (isBuildingKeyword.test(p1) || isRoomKeyword.test(p1)) {
          if (isRoomKeyword.test(p1)) {
            return {
              buildingName: p0,
              roomName: p1
            };
          }
          return {
            locationName: p0,
            buildingName: p1
          };
        }
        return {
          regionName: p0,
          locationName: p1
        };
      }
    }

    // 4. Check for parenthesized syntax: "Zum Hirsch (Schankraum)" or "Schankraum (Zum Hirsch, Falkengrund)"
    const parenMatch = cleanInput.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      const mainPart = parenMatch[1].trim();
      const subPart = parenMatch[2].trim();

      if (isRoomKeyword.test(mainPart)) {
        const subSub = this.parseLocationString(subPart, holdings, loreEntries, territories);
        return {
          ...subSub,
          roomName: mainPart
        };
      }

      const holdingMatch = holdings.find(h => h.name.toLowerCase() === mainPart.toLowerCase());
      if (holdingMatch) {
        return {
          buildingId: holdingMatch.id,
          buildingName: holdingMatch.name,
          locationId: holdingMatch.locationId,
          locationName: holdingMatch.locationName,
          territoryId: holdingMatch.territoryId,
          roomName: subPart
        };
      }

      if (isBuildingKeyword.test(mainPart)) {
        return {
          buildingName: mainPart,
          roomName: subPart
        };
      }
    }

    // 5. Match against registered holdings in the world
    for (const h of holdings) {
      if (this.isExactLocationMatch(cleanInput, h.name)) {
        let roomName: string | undefined;
        const lowerInput = cleanInput.toLowerCase();
        const roomsToCheck = [
          ...(h.roomsOrAreas || []),
          ...(h.buildingRooms?.map(r => r.name) || []),
          'Schankraum', 'Küche', 'Gaststube', 'Keller', 'Lagerraum', 'Schlafsaal', 'Zimmer', 'Werkstatt', 'Büro', 'Empfang', 'Kammer'
        ];

        for (const r of roomsToCheck) {
          if (lowerInput.includes(r.toLowerCase())) {
            roomName = r;
            break;
          }
        }

        return {
          buildingId: h.id,
          buildingName: h.name,
          locationId: h.locationId,
          locationName: h.locationName,
          territoryId: h.territoryId,
          roomName
        };
      }
    }

    // 6. Match against Lore entries (Orte, Gebäude)
    for (const l of loreEntries) {
      if (l.title && this.isExactLocationMatch(cleanInput, l.title)) {
        if ((l.category as string) === 'Gebäude' || (l.details?.itemType || '').toLowerCase().includes('gebäude')) {
          return {
            buildingId: l.id,
            buildingName: l.title,
            locationName: l.details?.parentPlaceName || l.details?.locationName,
            territoryName: l.details?.territory || l.details?.region
          };
        }
        if (l.category === 'Orte') {
          return {
            locationId: l.id,
            locationName: l.title,
            territoryName: l.details?.territory || l.details?.region
          };
        }
      }
    }

    // 7. Match against Territories
    for (const t of territories) {
      if (this.isExactLocationMatch(cleanInput, t.name)) {
        return {
          territoryId: t.id,
          territoryName: t.name
        };
      }
    }

    // 8. Keyword fallback classification if not matched to lore/holdings
    if (isRoomKeyword.test(cleanInput)) {
      return {
        roomName: cleanInput
      };
    }
    if (isBuildingKeyword.test(cleanInput)) {
      return {
        buildingName: cleanInput
      };
    }

    // Default simple location
    return {
      locationName: cleanInput
    };
  }

  /**
   * Enriches a location context by matching IDs to registered world data (holdings, territories, world).
   */
  private static enrichLocationContext(
    ctx: CurrentLocationContext,
    adventure: Adventure
  ): CurrentLocationContext {
    const enriched: CurrentLocationContext = { ...ctx };
    const world = adventure.world;
    const holdings = world?.economyConfig?.holdings || [];
    const territories = world?.territories || [];

    // Set world info
    enriched.worldId = (world as any)?.id || 'world';
    enriched.worldName = world?.title || 'Welt';

    // Enrich from holding if building is specified
    if (enriched.buildingName || enriched.buildingId) {
      const match = holdings.find(h => 
        (enriched.buildingId && h.id === enriched.buildingId) ||
        (enriched.buildingName && h.name.toLowerCase() === enriched.buildingName.toLowerCase())
      );

      if (match) {
        enriched.buildingId = match.id;
        enriched.buildingName = match.name;
        if (!enriched.locationName && match.locationName) enriched.locationName = match.locationName;
        if (!enriched.locationId && match.locationId) enriched.locationId = match.locationId;
        if (!enriched.territoryId && match.territoryId) enriched.territoryId = match.territoryId;
      }
    }

    // Enrich territory
    if (enriched.territoryId && !enriched.territoryName) {
      const tMatch = territories.find(t => t.id === enriched.territoryId);
      if (tMatch) enriched.territoryName = tMatch.name;
    } else if (enriched.locationName && !enriched.territoryName) {
      const tMatch = territories.find(t => 
        t.name.toLowerCase() === enriched.locationName!.toLowerCase() ||
        ((t as any).locations && (t as any).locations.some((l: any) => l.name.toLowerCase() === enriched.locationName!.toLowerCase()))
      );
      if (tMatch) {
        enriched.territoryId = tMatch.id;
        enriched.territoryName = tMatch.name;
      }
    }

    enriched.updatedAt = new Date().toISOString();
    return enriched;
  }

  /**
   * Resolves a room within a specific building strictly.
   * Priority:
   * 1. Exact roomId match in registered rooms of the building
   * 2. Exact room name match in registered rooms of the building
   * 3. Normalized string match within the same building
   * 4. No hit -> return { roomId: undefined, roomName }
   */
  public static resolveRoom(
    building: EconomyHolding | any | undefined,
    roomIdOrName?: string
  ): { roomId?: string; roomName?: string } {
    if (!roomIdOrName || !roomIdOrName.trim()) {
      return { roomId: undefined, roomName: undefined };
    }

    const cleanInput = roomIdOrName.trim();

    if (!building) {
      return { roomId: undefined, roomName: cleanInput };
    }

    const registeredRooms: Array<{ id?: string; name: string }> = [];
    if (Array.isArray(building.buildingRooms)) {
      building.buildingRooms.forEach((r: any) => {
        if (typeof r === 'string') {
          registeredRooms.push({ name: r });
        } else if (r && typeof r === 'object' && r.name) {
          registeredRooms.push({ id: r.id, name: r.name });
        }
      });
    }
    if (Array.isArray(building.roomsOrAreas)) {
      building.roomsOrAreas.forEach((r: any) => {
        if (typeof r === 'string') {
          if (!registeredRooms.some(rr => rr.name.toLowerCase() === r.toLowerCase())) {
            registeredRooms.push({ name: r });
          }
        }
      });
    }

    // 1. Exact ID
    const matchById = registeredRooms.find(r => r.id && r.id === cleanInput);
    if (matchById) {
      return { roomId: matchById.id, roomName: matchById.name };
    }

    // 2. Exact Name
    const matchByName = registeredRooms.find(r => r.name.trim() === cleanInput);
    if (matchByName) {
      return { roomId: matchByName.id, roomName: matchByName.name };
    }

    // 3. Controlled normalized match within the SAME building
    const matchByNormalized = registeredRooms.find(r => r.name.trim().toLowerCase() === cleanInput.toLowerCase());
    if (matchByNormalized) {
      return { roomId: matchByNormalized.id, roomName: matchByNormalized.name };
    }

    // 4. No hit -> keep roomName, leave roomId undefined
    return { roomId: undefined, roomName: cleanInput };
  }

  /**
   * Resolves a building strictly within the current location / holdings pool.
   */
  public static resolveBuilding(
    holdings: EconomyHolding[] = [],
    buildingIdOrName?: string,
    currentLocationName?: string
  ): EconomyHolding | undefined {
    if (!buildingIdOrName || !buildingIdOrName.trim()) return undefined;
    const clean = buildingIdOrName.trim();

    // 1. Exact ID
    const byId = holdings.find(h => h.id === clean);
    if (byId) return byId;

    // Filter by location if specified
    const locationHoldings = currentLocationName
      ? holdings.filter(h => h.locationName && h.locationName.trim().toLowerCase() === currentLocationName.trim().toLowerCase())
      : holdings;

    const searchPool = locationHoldings.length > 0 ? locationHoldings : holdings;

    // 2. Exact Name in search pool
    const byExactName = searchPool.find(h => h.name.trim().toLowerCase() === clean.toLowerCase());
    if (byExactName) return byExactName;

    // 3. Exact Name in global holdings
    if (searchPool !== holdings) {
      const byGlobalExactName = holdings.find(h => h.name.trim().toLowerCase() === clean.toLowerCase());
      if (byGlobalExactName) return byGlobalExactName;
    }

    return undefined;
  }

  /**
   * Updates the central location context atomically across all legacy and current structures in the Adventure.
   */
  public static updateCurrentLocation(
    adventure: Adventure,
    update: Partial<CurrentLocationContext> | string,
    options: { preserveBuilding?: boolean; preserveRoom?: boolean } = {}
  ): Adventure {
    if (!adventure) return adventure;

    const current = this.resolveCurrentLocation(adventure);
    let patch: Partial<CurrentLocationContext> = {};

    if (typeof update === 'string') {
      patch = this.parseLocationString(
        update,
        adventure.world?.economyConfig?.holdings,
        adventure.loreDatabase,
        adventure.world?.territories
      );
    } else {
      patch = { ...update };
    }

    // Merge logic:
    // If a new location (Ort) is set and differs from current, reset building/room unless explicitly preserved
    const isNewLocation = patch.locationName && patch.locationName.toLowerCase() !== (current.locationName || '').toLowerCase();
    const isNewBuilding = patch.buildingName && patch.buildingName.toLowerCase() !== (current.buildingName || '').toLowerCase();

    const merged: CurrentLocationContext = {
      ...current,
      ...patch
    };

    if (isNewLocation && !patch.buildingName && !options.preserveBuilding) {
      merged.buildingId = undefined;
      merged.buildingName = undefined;
      merged.roomId = undefined;
      merged.roomName = undefined;
    } else if (isNewBuilding && !patch.roomName && !options.preserveRoom) {
      merged.roomId = undefined;
      merged.roomName = undefined;
    }

    const finalContext = this.enrichLocationContext(merged, adventure);
    const displayStr = this.formatLocationDisplay(finalContext);

    // Sync statusElements
    const currentStatusList = adventure.statusElements || [];
    let hasLocationElement = false;
    const updatedStatusElements = currentStatusList.map(el => {
      const label = (el.label || '').toLowerCase();
      if (label.includes('standort') || label.includes('ort')) {
        hasLocationElement = true;
        return {
          ...el,
          value: displayStr
        };
      }
      return el;
    });

    if (!hasLocationElement && currentStatusList.length > 0) {
      updatedStatusElements.push({
        id: 'loc-element',
        label: 'Standort',
        value: displayStr
      });
    }

    // Atomic update - Note: adventure.world global location IDs are intentionally NOT mutated by player movement!
    const updatedAdventure: Adventure = {
      ...adventure,
      currentLocation: finalContext,
      player: {
        ...adventure.player,
        appearance: {
          hairColor: adventure.player?.appearance?.hairColor || '',
          eyeColor: adventure.player?.appearance?.eyeColor || '',
          age: adventure.player?.appearance?.age || '',
          build: adventure.player?.appearance?.build || '',
          gender: adventure.player?.appearance?.gender || '',
          ...(adventure.player?.appearance || {}),
          currentLocation: displayStr
        }
      },
      storyState: {
        ...(adventure.storyState || { storyEntities: [] }),
        currentLocationContext: finalContext,
        currentLocationName: finalContext.locationName || displayStr,
        currentTerritoryName: finalContext.territoryName || ''
      },
      statusElements: updatedStatusElements
    };

    // If combatState is active or stored, synchronize it too
    if (updatedAdventure.combatState) {
      updatedAdventure.combatState = {
        ...updatedAdventure.combatState,
        currentLocationContext: finalContext,
        locationId: finalContext.locationId,
        locationName: displayStr,
        territoryId: finalContext.territoryId,
        buildingId: finalContext.buildingId,
        buildingName: finalContext.buildingName,
        roomId: finalContext.roomId,
        roomName: finalContext.roomName
      };
    }

    return updatedAdventure;
  }

  /**
   * Changes only the active room inside the current building, preserving building, location and territory.
   */
  public static changeRoom(adventure: Adventure, roomIdOrName: string): Adventure {
    const current = this.resolveCurrentLocation(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const currentBuilding = (current.buildingId || current.buildingName)
      ? holdings.find(h => (current.buildingId && h.id === current.buildingId) || (current.buildingName && h.name.toLowerCase() === current.buildingName.toLowerCase()))
      : undefined;

    const resolvedRoom = this.resolveRoom(currentBuilding, roomIdOrName);

    return this.updateCurrentLocation(adventure, {
      ...current,
      roomId: resolvedRoom.roomId,
      roomName: resolvedRoom.roomName
    }, { preserveBuilding: true });
  }

  /**
   * Enters a registered building/holding in the current location.
   */
  public static enterBuilding(
    adventure: Adventure,
    buildingIdOrName: string,
    initialRoomIdOrName?: string
  ): Adventure {
    const current = this.resolveCurrentLocation(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const match = this.resolveBuilding(holdings, buildingIdOrName, current.locationName);

    const buildingId = match ? match.id : undefined;
    const buildingName = match ? match.name : buildingIdOrName;
    const locationName = match?.locationName || current.locationName;
    const locationId = match?.locationId || current.locationId;
    const territoryId = match?.territoryId || current.territoryId;

    const resolvedRoom = this.resolveRoom(match, initialRoomIdOrName);

    return this.updateCurrentLocation(adventure, {
      ...current,
      buildingId,
      buildingName,
      locationId,
      locationName,
      territoryId,
      roomId: resolvedRoom.roomId,
      roomName: resolvedRoom.roomName
    });
  }

  /**
   * Leaves the current building and returns to the outer location.
   */
  public static leaveBuilding(adventure: Adventure): Adventure {
    const current = this.resolveCurrentLocation(adventure);
    return this.updateCurrentLocation(adventure, {
      ...current,
      buildingId: undefined,
      buildingName: undefined,
      roomId: undefined,
      roomName: undefined
    });
  }

  /**
   * Formats the standardized prompt block for AI context in Dialog, Combat, Travel, or Exploration modes.
   */
  public static formatLocationPromptBlock(
    location: CurrentLocationContext,
    mode: 'DIALOG' | 'COMBAT' | 'EXPLORATION' | 'TRAVEL' | 'STORY'
  ): string {
    const lines: string[] = ['CURRENT LOCATION\n'];

    if (location.worldName) {
      lines.push(`Welt:\n${location.worldName}\n`);
    }

    if (location.territoryName || location.regionName) {
      lines.push(`Gebiet:\n${location.territoryName || location.regionName}\n`);
    }

    if (location.locationName) {
      lines.push(`Ort:\n${location.locationName}\n`);
    }

    if (location.buildingName) {
      lines.push(`Gebäude:\n${location.buildingName}\n`);
    }

    if (location.roomName) {
      lines.push(`Raum:\n${location.roomName}\n`);
    }

    if (location.positionDescription) {
      lines.push(`Position/Szene:\n${location.positionDescription}\n`);
    }

    lines.push(`Aktueller Modus:\n${mode}`);

    return lines.join('\n');
  }

  /**
   * Formats the location for clean, unclipped display in HUD, title bars, and status lists.
   */
  public static formatLocationDisplay(location: CurrentLocationContext): string {
    if (!location) return 'Startgebiet';

    const parts: string[] = [];

    if (location.locationName) {
      parts.push(location.locationName);
    } else if (location.territoryName) {
      parts.push(location.territoryName);
    } else if (location.worldName) {
      parts.push(location.worldName);
    }

    if (location.buildingName) {
      parts.push(location.buildingName);
    }

    if (location.roomName) {
      parts.push(location.roomName);
    }

    if (parts.length === 0) {
      return 'Startgebiet';
    }

    return parts.join(' → ');
  }

  /**
   * Helper to normalize location strings and names for clean, exact comparison without loose substring flaws.
   */
  public static normalizeLocationName(s?: string): string {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/[„“”"'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper to check exact equality of normalized location strings.
   */
  public static isExactLocationMatch(a?: string, b?: string): boolean {
    const normA = this.normalizeLocationName(a);
    const normB = this.normalizeLocationName(b);
    if (!normA || !normB) return false;
    return normA === normB;
  }

  /**
   * Extracts or parses structured location context from a character (NPC, Character, LoreEntry, StoryEntityItem).
   */
  public static extractCharacterLocationContext(
    character: any,
    holdings: EconomyHolding[] = [],
    loreEntries: LoreEntry[] = [],
    territories: Territory[] = []
  ): CurrentLocationContext | null {
    if (!character) return null;

    // Check presenceState location context if present
    if (character.presenceState?.locationContext && typeof character.presenceState.locationContext === 'object') {
      return character.presenceState.locationContext;
    }

    // Direct structured object if present
    if (character.currentLocationContext && typeof character.currentLocationContext === 'object') {
      return character.currentLocationContext;
    }
    if (character.currentLocation && typeof character.currentLocation === 'object' && character.currentLocation.locationName) {
      return character.currentLocation;
    }

    // Explicit structured details
    const details = character.details || {};
    const explicitRoom = details.roomName || details.room;
    const explicitBuilding = details.buildingName || details.building || details.holdingName;
    const explicitLocation = details.locationName || details.parentPlaceName || details.placeName || details.town || details.city;
    const explicitTerritory = details.territory || details.territoryName;
    const explicitRegion = details.region || details.regionName;

    if (explicitRoom || explicitBuilding || explicitLocation) {
      return {
        roomName: explicitRoom,
        buildingName: explicitBuilding,
        locationName: explicitLocation,
        territoryName: explicitTerritory,
        regionName: explicitRegion
      };
    }

    // Raw string fields
    const rawString = (
      character.appearance?.currentLocation ||
      (typeof character.currentLocation === 'string' ? character.currentLocation : '') ||
      (typeof details.currentLocation === 'string' ? details.currentLocation : '') ||
      ''
    ).trim();

    if (!rawString) {
      return null;
    }

    return this.parseLocationString(rawString, holdings, loreEntries, territories);
  }

  /**
   * Checks if a character is physically present at the current location hierarchy.
   * Priority:
   * Raum -> Gebäude -> Ort -> (Territorium/Region alone NEVER suffice)
   *
   * Rules:
   * - Bekannt ≠ Anwesend ≠ Szenenteilnehmer ≠ Kampfbeteiligter
   * - No reliance on chat mentions or loose substring matches
   * - If player is in a room, a character in a different room of the same building is NOT present in that room.
   */
  public static isCharacterAtLocation(
    character: any,
    currentLocation: CurrentLocationContext,
    options?: {
      holdings?: EconomyHolding[];
      loreEntries?: LoreEntry[];
      territories?: Territory[];
      allowSameBuildingWhenInRoom?: boolean;
      explicitParticipantIds?: string[];
    }
  ): boolean {
    if (!character || !currentLocation) return false;

    // 1. Player is always at currentLocation
    if (character.id === 'player') return true;

    // 2. Explicit participant in active scene (e.g. dialogueParticipantIds)
    const charId = character.id;
    if (options?.explicitParticipantIds && charId && options.explicitParticipantIds.includes(charId)) {
      return true;
    }

    // 3. Check presenceState enum if defined on character
    if (character.presenceState) {
      if (character.presenceState.state === 'absent') {
        return false;
      }
      if (character.presenceState.state === 'scene_participant') {
        if (character.presenceState.sceneId && currentLocation.sceneId && character.presenceState.sceneId !== currentLocation.sceneId) {
          // Excluded: scene_participant status belongs to a different scene
        } else {
          return true;
        }
      }
    }

    // 4. Explicit boolean override flags (e.g. isExplicitlyPresent set for specific scene context)
    if ((character.isExplicitlyPresent === true || character.details?.isExplicitlyPresent === true) && character.presenceState?.state !== 'absent') {
      if (character.sceneId && currentLocation.sceneId && character.sceneId !== currentLocation.sceneId) {
        // Excluded due to scene mismatch
      } else {
        return true;
      }
    }

    // 4. Extract structured location of the character
    const charLoc = this.extractCharacterLocationContext(
      character,
      options?.holdings,
      options?.loreEntries,
      options?.territories
    );

    if (!charLoc) {
      return false;
    }

    // Direct ID matches
    if (charLoc.roomId && currentLocation.roomId && charLoc.roomId === currentLocation.roomId) {
      return true;
    }
    if (charLoc.buildingId && currentLocation.buildingId && !currentLocation.roomName && charLoc.buildingId === currentLocation.buildingId) {
      return true;
    }
    if (charLoc.locationId && currentLocation.locationId && !currentLocation.buildingName && !currentLocation.roomName && charLoc.locationId === currentLocation.locationId) {
      return true;
    }

    // -------------------------------------------------------------
    // FALL A: Aktueller Raum beim Spieler vorhanden (currentLocation.roomName)
    // -------------------------------------------------------------
    if (currentLocation.roomName) {
      if (charLoc.roomName) {
        // Room must match
        if (!this.isExactLocationMatch(charLoc.roomName, currentLocation.roomName)) {
          return false;
        }
        // If building is specified on character, it must also match
        if (charLoc.buildingName && currentLocation.buildingName) {
          if (!this.isExactLocationMatch(charLoc.buildingName, currentLocation.buildingName)) {
            return false;
          }
        }
        // If location is specified on character, it must also match
        if (charLoc.locationName && currentLocation.locationName) {
          if (!this.isExactLocationMatch(charLoc.locationName, currentLocation.locationName)) {
            return false;
          }
        }
        return true;
      }

      // If character has no room specified:
      if (options?.allowSameBuildingWhenInRoom && charLoc.buildingName && currentLocation.buildingName) {
        return this.isExactLocationMatch(charLoc.buildingName, currentLocation.buildingName);
      }

      // Character without room (e.g. only building or location) is NOT in this specific room
      return false;
    }

    // -------------------------------------------------------------
    // FALL B: Gebäude ohne Raum beim Spieler (currentLocation.buildingName, but no roomName)
    // -------------------------------------------------------------
    if (currentLocation.buildingName) {
      if (charLoc.buildingName) {
        if (!this.isExactLocationMatch(charLoc.buildingName, currentLocation.buildingName)) {
          return false;
        }
        // If location is specified on character, it must match
        if (charLoc.locationName && currentLocation.locationName) {
          if (!this.isExactLocationMatch(charLoc.locationName, currentLocation.locationName)) {
            return false;
          }
        }
        return true;
      }

      // Character has no building (only location or territory) -> NOT in this building
      return false;
    }

    // -------------------------------------------------------------
    // FALL C: Ort ohne Gebäude/Raum beim Spieler (currentLocation.locationName, but no buildingName, no roomName)
    // -------------------------------------------------------------
    if (currentLocation.locationName) {
      if (charLoc.locationName) {
        if (!this.isExactLocationMatch(charLoc.locationName, currentLocation.locationName)) {
          return false;
        }
        return true;
      }

      // Character has only territory or region -> NOT at location!
      return false;
    }

    // -------------------------------------------------------------
    // FALL D: Nur Territorium oder Region
    // -------------------------------------------------------------
    // Territorium oder Region allein erzeugen niemals physische Anwesenheit!
    return false;
  }

  /**
   * Checks if a character is participating in the immediate scene.
   */
  public static isCharacterInScene(
    character: any,
    currentLocation: CurrentLocationContext,
    sceneParticipantIds?: string[],
    options?: {
      holdings?: EconomyHolding[];
      loreEntries?: LoreEntry[];
      territories?: Territory[];
    }
  ): boolean {
    if (!character || !currentLocation) return false;

    const charId = character.id;
    if (sceneParticipantIds && charId && sceneParticipantIds.includes(charId)) {
      return true;
    }

    return this.isCharacterAtLocation(character, currentLocation, {
      ...options,
      explicitParticipantIds: sceneParticipantIds,
      allowSameBuildingWhenInRoom: false
    });
  }

  /**
   * Filters a list of characters (NPCs/Lore) to those who are physically present at the given location context.
   * Chat mentions do not count as physical presence ("Bekannt ≠ Anwesend").
   */
  public static filterPresentCharacters<T extends any>(
    characters: T[],
    currentLocation: CurrentLocationContext,
    options?: {
      sceneOnly?: boolean;
      explicitParticipantIds?: string[];
      holdings?: EconomyHolding[];
      loreEntries?: LoreEntry[];
      territories?: Territory[];
      allowSameBuildingWhenInRoom?: boolean;
    }
  ): T[] {
    if (!characters || characters.length === 0 || !currentLocation) return [];

    const seenIds = new Set<string>();

    return characters.filter(char => {
      const c = char as any;
      const charId = c.id;
      if (charId) {
        if (seenIds.has(charId)) return false;
        seenIds.add(charId);
      }

      if (options?.sceneOnly) {
        return this.isCharacterInScene(c, currentLocation, options.explicitParticipantIds, options);
      }

      return this.isCharacterAtLocation(c, currentLocation, options);
    });
  }

  /**
   * Central resolution for character identity across ID, exact name, exact nickname, and rufName.
   * Order:
   * 1. Exact ID
   * 2. Exact Name
   * 3. Exact Nickname / RufName
   * 4. Controlled exact normalized match
   * No loose includes() substring matching!
   * Handles duplicate names safely (returns undefined if ambiguous without ID).
   */
  public static resolveCharacter(
    characters: any[],
    identifier: { id?: string; name?: string; nickname?: string } | string
  ): any | undefined {
    if (!Array.isArray(characters) || characters.length === 0 || !identifier) {
      return undefined;
    }

    let targetId: string | undefined = undefined;
    let targetName: string | undefined = undefined;
    let targetNick: string | undefined = undefined;

    if (typeof identifier === 'string') {
      const clean = identifier.trim();
      if (!clean) return undefined;
      targetId = clean;
      targetName = clean;
    } else {
      targetId = identifier.id?.trim();
      targetName = identifier.name?.trim();
      targetNick = identifier.nickname?.trim();
    }

    // 1. Strict ID Match
    if (targetId) {
      const byId = characters.find(c => c && c.id === targetId);
      if (byId) return byId;
    }

    // 2. Strict Exact Name / Nickname Match
    const cleanTargetName = targetName ? targetName.toLowerCase() : undefined;
    const cleanTargetNick = targetNick ? targetNick.toLowerCase() : undefined;

    if (!cleanTargetName && !cleanTargetNick) {
      return undefined;
    }

    const matches = characters.filter(c => {
      if (!c) return false;
      const cName = (c.name || c.title || '').trim().toLowerCase();
      const cNick = (c.nickname || c.rufName || c.details?.nickname || c.details?.rufName || '').trim().toLowerCase();

      if (cleanTargetName && (cName === cleanTargetName || cNick === cleanTargetName)) {
        return true;
      }
      if (cleanTargetNick && (cName === cleanTargetNick || cNick === cleanTargetNick)) {
        return true;
      }
      return false;
    });

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      // Ambiguous duplicate names without matching ID! Return undefined to prevent wrong assignment.
      return undefined;
    }

    return undefined;
  }
}
