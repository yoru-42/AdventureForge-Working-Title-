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

    // 3. Check for parenthesized syntax: "Zum Hirsch (Schankraum)" or "Schankraum (Zum Hirsch, Falkengrund)"
    const parenMatch = cleanInput.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      const mainPart = parenMatch[1].trim();
      const subPart = parenMatch[2].trim();

      // Check if mainPart is a room name and subPart has building/location
      const isRoomKeywords = /schankraum|küche|zimmer|schlafzimmer|saal|flur|keller|dachboden|werkstatt|schmiede|tresen|kammer/i;
      if (isRoomKeywords.test(mainPart)) {
        const subSub = this.parseLocationString(subPart, holdings, loreEntries, territories);
        return {
          ...subSub,
          roomName: mainPart
        };
      }

      // Or mainPart is building and subPart is room
      const holdingMatch = holdings.find(h => h.name.toLowerCase().includes(mainPart.toLowerCase()) || mainPart.toLowerCase().includes(h.name.toLowerCase()));
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
    }

    // 4. Match against registered holdings in the world
    for (const h of holdings) {
      if (cleanInput.toLowerCase().includes(h.name.toLowerCase())) {
        // Check if there is room mentioned in the remainder
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

    // 5. Match against Lore entries (Orte, Gebäude)
    for (const l of loreEntries) {
      if (l.title && cleanInput.toLowerCase().includes(l.title.toLowerCase())) {
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

    // 6. Match against Territories
    for (const t of territories) {
      if (cleanInput.toLowerCase().includes(t.name.toLowerCase())) {
        return {
          territoryId: t.id,
          territoryName: t.name,
          locationName: cleanInput
        };
      }
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
        (enriched.buildingName && h.name.toLowerCase() === enriched.buildingName.toLowerCase()) ||
        (enriched.buildingName && h.name.toLowerCase().includes(enriched.buildingName.toLowerCase()))
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
        t.name.toLowerCase().includes(enriched.locationName!.toLowerCase()) ||
        enriched.locationName!.toLowerCase().includes(t.name.toLowerCase())
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

    // Atomic update
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
      world: {
        ...adventure.world,
        currentLocationId: finalContext.locationId || adventure.world?.currentLocationId,
        currentTerritoryId: finalContext.territoryId || adventure.world?.currentTerritoryId,
        dynamicWorldState: adventure.world?.dynamicWorldState ? {
          ...adventure.world.dynamicWorldState,
          currentLocationId: finalContext.locationId || adventure.world.dynamicWorldState.currentLocationId,
          currentTerritoryId: finalContext.territoryId || adventure.world.dynamicWorldState.currentTerritoryId
        } : undefined
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
    return this.updateCurrentLocation(adventure, {
      ...current,
      roomId: roomIdOrName.toLowerCase().replace(/\s+/g, '-'),
      roomName: roomIdOrName
    }, { preserveBuilding: true, preserveRoom: true });
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
    const match = holdings.find(h => 
      h.id.toLowerCase() === buildingIdOrName.toLowerCase() ||
      h.name.toLowerCase() === buildingIdOrName.toLowerCase() ||
      h.name.toLowerCase().includes(buildingIdOrName.toLowerCase())
    );

    const buildingId = match ? match.id : buildingIdOrName;
    const buildingName = match ? match.name : buildingIdOrName;
    const locationName = match?.locationName || current.locationName;
    const locationId = match?.locationId || current.locationId;
    const territoryId = match?.territoryId || current.territoryId;

    return this.updateCurrentLocation(adventure, {
      ...current,
      buildingId,
      buildingName,
      locationId,
      locationName,
      territoryId,
      roomId: initialRoomIdOrName ? initialRoomIdOrName.toLowerCase().replace(/\s+/g, '-') : undefined,
      roomName: initialRoomIdOrName
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
}
