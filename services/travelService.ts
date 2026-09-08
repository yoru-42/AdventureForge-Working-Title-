import { Adventure, WorldSetting, WorldLocationReference, Territory, LoreEntry, BattleInstance } from '../types';
import { WorldIntegrationService } from './worldIntegrationService';
import { WorldSimulationService, SimulationStepResult } from './worldSimulationService';
import { GameTurnService, ProcessPlayerTurnParams, ProcessPlayerTurnResult } from './gameTurnService';
import { GeminiService } from './geminiService';

export interface RouteSegment {
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  connectionId?: string;
  label?: string;
  distanceKm?: number;
  durationMinutes: number;
  terrain?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  territoryId?: string;
  controllingFactionId?: string;
}

export interface RouteResolution {
  status: 'resolved' | 'unreachable' | 'blocked' | 'not_found';
  fromLocation: WorldLocationReference;
  toLocation: WorldLocationReference;
  segments: RouteSegment[];
  totalDistanceKm: number;
  totalTravelMinutes: number;
  traversedTerritories: Territory[];
  isBlocked?: boolean;
  blockReason?: string;
  reason?: string;
}

export class TravelService {
  /**
   * Helper to parse duration strings into minutes.
   * e.g., "120 Min", "2 Std", "2 Stunden", "1.5h", "90m"
   */
  public static parseDurationStringToMinutes(durationStr?: string): number | null {
    if (!durationStr) return null;
    const str = durationStr.trim().toLowerCase();
    
    // Check hours
    const hourMatch = str.match(/([\d.,]+)\s*(std|stunden?|h|hours?)/);
    if (hourMatch) {
      const hours = parseFloat(hourMatch[1].replace(',', '.'));
      if (!isNaN(hours)) return Math.round(hours * 60);
    }

    // Check minutes
    const minMatch = str.match(/([\d.,]+)\s*(min|minuten?|m)/);
    if (minMatch) {
      const mins = parseFloat(minMatch[1].replace(',', '.'));
      if (!isNaN(mins)) return Math.round(mins);
    }

    // Pure number fallback
    const pureNum = parseFloat(str.replace(',', '.'));
    if (!isNaN(pureNum) && pureNum > 0) {
      return Math.round(pureNum);
    }

    return null;
  }

  /**
   * Helper to parse distance string into Km.
   * e.g., "12 km", "15,5 kilometer"
   */
  public static parseDistanceStringToKm(distStr?: string): number | null {
    if (!distStr) return null;
    const match = distStr.trim().toLowerCase().match(/([\d.,]+)/);
    if (match) {
      const dist = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(dist)) return dist;
    }
    return null;
  }

  /**
   * Calculates duration in minutes for a segment based on distance, connection data, and terrain.
   */
  public static calculateSegmentMinutes(connection: any, terrainTypes: string[] = []): number {
    // 1. Explicit connection duration/travelTime
    const explicitMins = this.parseDurationStringToMinutes(connection.travelTime || connection.duration);
    if (explicitMins && explicitMins > 0) {
      return explicitMins;
    }

    // 2. Calculate via distance + terrain
    const distKm = this.parseDistanceStringToKm(connection.distance) || 10;
    
    // Base walking speed: 4 km/h = 15 min per km
    let baseMinPerKm = 15;
    if (connection.type === 'sea' || connection.type === 'ship') baseMinPerKm = 3; // ~20 km/h
    if (connection.type === 'air') baseMinPerKm = 1.5; // ~40 km/h

    let terrainMultiplier = 1.0;
    for (const t of terrainTypes) {
      const lower = t.toLowerCase();
      if (lower.includes('berg') || lower.includes('gebirge') || lower.includes('pass')) terrainMultiplier = Math.max(terrainMultiplier, 1.8);
      else if (lower.includes('sumpf')) terrainMultiplier = Math.max(terrainMultiplier, 2.0);
      else if (lower.includes('wald')) terrainMultiplier = Math.max(terrainMultiplier, 1.3);
      else if (lower.includes('wüste') || lower.includes('schnee')) terrainMultiplier = Math.max(terrainMultiplier, 1.5);
    }

    return Math.max(15, Math.round(distKm * baseMinPerKm * terrainMultiplier));
  }

  /**
   * Retrieves the current player location and its resolved WorldLocationReference & Territory.
   */
  public static getPlayerLocation(adventure: Adventure): {
    locationName: string;
    locationRef: WorldLocationReference | null;
    territory: Territory | null;
  } {
    const world = adventure.world;
    const playerLocName = (adventure.player?.appearance?.currentLocation || world?.startLocationName || world?.title || 'Startgebiet').trim();
    const currentLocId = world?.dynamicWorldState?.currentLocationId || world?.currentLocationId || world?.startLocationId;

    const res = WorldIntegrationService.resolveLocationReference({
      idOrName: currentLocId || playerLocName,
      world,
      loreDatabase: adventure.loreDatabase
    });

    const locationRef = res.value;
    let territory: Territory | null = null;

    if (locationRef?.territoryId) {
      territory = (world.territories || []).find(t => t.id === locationRef.territoryId) || null;
    }

    return {
      locationName: locationRef?.name || playerLocName,
      locationRef,
      territory
    };
  }

  /**
   * Resolves a route between source and destination using canonical World State connections.
   */
  public static resolveRoute(params: {
    world: WorldSetting;
    fromIdOrName: string;
    toIdOrName: string;
    loreDatabase?: LoreEntry[];
  }): RouteResolution {
    const { world, fromIdOrName, toIdOrName, loreDatabase = world.loreDatabase || [] } = params;

    const fromRes = WorldIntegrationService.resolveLocationReference({ idOrName: fromIdOrName, world, loreDatabase });
    const toRes = WorldIntegrationService.resolveLocationReference({ idOrName: toIdOrName, world, loreDatabase });

    if (!fromRes.value || !toRes.value) {
      const missing = !fromRes.value ? fromIdOrName : toIdOrName;
      return {
        status: 'not_found',
        fromLocation: fromRes.value!,
        toLocation: toRes.value!,
        segments: [],
        totalDistanceKm: 0,
        totalTravelMinutes: 0,
        traversedTerritories: [],
        reason: `Ort "${missing}" konnte nicht im Weltzustand gefunden werden.`
      };
    }

    const fromLoc = fromRes.value;
    const toLoc = toRes.value;

    // Same location check
    if (fromLoc.id === toLoc.id || fromLoc.name.toLowerCase() === toLoc.name.toLowerCase()) {
      return {
        status: 'resolved',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments: [],
        totalDistanceKm: 0,
        totalTravelMinutes: 0,
        traversedTerritories: []
      };
    }

    const connections = world.connections || [];
    const territories = world.territories || [];

    // Helper to check connection match
    const isConnMatch = (conn: any, locA: WorldLocationReference, locB: WorldLocationReference) => {
      const fromMatch = (conn.fromId && conn.fromId === locA.id) ||
        (conn.fromPlace && conn.fromPlace.toLowerCase() === locA.name.toLowerCase());
      const toMatch = (conn.toId && conn.toId === locB.id) ||
        (conn.toPlace && conn.toPlace.toLowerCase() === locB.name.toLowerCase());

      const revFromMatch = (conn.fromId && conn.fromId === locB.id) ||
        (conn.fromPlace && conn.fromPlace.toLowerCase() === locB.name.toLowerCase());
      const revToMatch = (conn.toId && conn.toId === locA.id) ||
        (conn.toPlace && conn.toPlace.toLowerCase() === locA.name.toLowerCase());

      return (fromMatch && toMatch) || (revFromMatch && revToMatch);
    };

    // 1. Direct connection check
    const directConn = connections.find(c => isConnMatch(c, fromLoc, toLoc));
    if (directConn) {
      if (directConn.isBlocked) {
        return {
          status: 'blocked',
          fromLocation: fromLoc,
          toLocation: toLoc,
          segments: [],
          totalDistanceKm: 0,
          totalTravelMinutes: 0,
          traversedTerritories: [],
          isBlocked: true,
          blockReason: directConn.label ? `Verbindung ist blockiert: ${directConn.label}` : 'Die Route ist derzeit blockiert.',
          reason: 'Verbindung blockiert.'
        };
      }

      const dist = this.parseDistanceStringToKm(directConn.distance) || 15;
      const duration = this.calculateSegmentMinutes(directConn, [fromLoc.terrainType, toLoc.terrainType].filter(Boolean) as string[]);
      
      const traversedTerrs: Territory[] = [];
      if (fromLoc.territoryId) {
        const t1 = territories.find(t => t.id === fromLoc.territoryId);
        if (t1) traversedTerrs.push(t1);
      }
      if (toLoc.territoryId && toLoc.territoryId !== fromLoc.territoryId) {
        const t2 = territories.find(t => t.id === toLoc.territoryId);
        if (t2) traversedTerrs.push(t2);
      }

      const segment: RouteSegment = {
        fromLocationId: fromLoc.id,
        fromLocationName: fromLoc.name,
        toLocationId: toLoc.id,
        toLocationName: toLoc.name,
        connectionId: directConn.id,
        label: directConn.label,
        distanceKm: dist,
        durationMinutes: duration,
        terrain: [fromLoc.terrainType, toLoc.terrainType].filter(Boolean) as string[],
        territoryId: toLoc.territoryId
      };

      return {
        status: 'resolved',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments: [segment],
        totalDistanceKm: dist,
        totalTravelMinutes: duration,
        traversedTerritories: traversedTerrs
      };
    }

    // 2. BFS Graph Search across all connections
    // Collect all unique location nodes in connections
    const locMap = new Map<string, WorldLocationReference>();
    const registerLoc = (ref: WorldLocationReference) => {
      locMap.set(ref.id, ref);
      locMap.set(ref.name.toLowerCase(), ref);
    };

    registerLoc(fromLoc);
    registerLoc(toLoc);

    (world.locations || []).forEach(registerLoc);

    // Build adjacency list
    const adj = new Map<string, { targetLoc: WorldLocationReference; conn: any }[]>();
    const addEdge = (locA: WorldLocationReference, locB: WorldLocationReference, conn: any) => {
      if (!adj.has(locA.id)) adj.set(locA.id, []);
      adj.get(locA.id)!.push({ targetLoc: locB, conn });
    };

    for (const c of connections) {
      if (c.isBlocked) continue;
      
      const resA = WorldIntegrationService.resolveLocationReference({ idOrName: c.fromId || c.fromPlace, world, loreDatabase });
      const resB = WorldIntegrationService.resolveLocationReference({ idOrName: c.toId || c.toPlace, world, loreDatabase });

      if (resA.value && resB.value) {
        addEdge(resA.value, resB.value, c);
        addEdge(resB.value, resA.value, c);
      }
    }

    // BFS Queue
    const queue: { currentId: string; path: { loc: WorldLocationReference; conn: any }[] }[] = [
      { currentId: fromLoc.id, path: [] }
    ];
    const visited = new Set<string>([fromLoc.id]);

    let foundPath: { loc: WorldLocationReference; conn: any }[] | null = null;

    while (queue.length > 0) {
      const { currentId, path } = queue.shift()!;

      if (currentId === toLoc.id) {
        foundPath = path;
        break;
      }

      const neighbors = adj.get(currentId) || [];
      for (const { targetLoc, conn } of neighbors) {
        if (!visited.has(targetLoc.id)) {
          visited.add(targetLoc.id);
          queue.push({
            currentId: targetLoc.id,
            path: [...path, { loc: targetLoc, conn }]
          });
        }
      }
    }

    if (foundPath && foundPath.length > 0) {
      const segments: RouteSegment[] = [];
      let totalDist = 0;
      let totalMins = 0;
      const traversedTerrs = new Map<string, Territory>();

      let prevLoc = fromLoc;
      for (const step of foundPath) {
        const stepLoc = step.loc;
        const dist = this.parseDistanceStringToKm(step.conn?.distance) || 10;
        const dur = this.calculateSegmentMinutes(step.conn, [prevLoc.terrainType, stepLoc.terrainType].filter(Boolean) as string[]);

        segments.push({
          fromLocationId: prevLoc.id,
          fromLocationName: prevLoc.name,
          toLocationId: stepLoc.id,
          toLocationName: stepLoc.name,
          connectionId: step.conn?.id,
          label: step.conn?.label,
          distanceKm: dist,
          durationMinutes: dur,
          territoryId: stepLoc.territoryId
        });

        totalDist += dist;
        totalMins += dur;

        if (stepLoc.territoryId) {
          const t = territories.find(ter => ter.id === stepLoc.territoryId);
          if (t) traversedTerrs.set(t.id, t);
        }

        prevLoc = stepLoc;
      }

      return {
        status: 'resolved',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments,
        totalDistanceKm: totalDist,
        totalTravelMinutes: totalMins,
        traversedTerritories: Array.from(traversedTerrs.values())
      };
    }

    // Fallback: Check coordinates if both locations have x, y
    if (typeof fromLoc.x === 'number' && typeof fromLoc.y === 'number' && typeof toLoc.x === 'number' && typeof toLoc.y === 'number') {
      const dx = toLoc.x - fromLoc.x;
      const dy = toLoc.y - fromLoc.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      const distKm = Math.round(pixelDist * 0.5); // scale
      const durMins = this.calculateSegmentMinutes({ distance: `${distKm} km` });

      const traversedTerrs: Territory[] = [];
      if (fromLoc.territoryId) {
        const t1 = territories.find(t => t.id === fromLoc.territoryId);
        if (t1) traversedTerrs.push(t1);
      }
      if (toLoc.territoryId && toLoc.territoryId !== fromLoc.territoryId) {
        const t2 = territories.find(t => t.id === toLoc.territoryId);
        if (t2) traversedTerrs.push(t2);
      }

      return {
        status: 'resolved',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments: [{
          fromLocationId: fromLoc.id,
          fromLocationName: fromLoc.name,
          toLocationId: toLoc.id,
          toLocationName: toLoc.name,
          distanceKm: distKm,
          durationMinutes: durMins,
          territoryId: toLoc.territoryId
        }],
        totalDistanceKm: distKm,
        totalTravelMinutes: durMins,
        traversedTerritories: traversedTerrs
      };
    }

    // If no route exists and no coordinates
    return {
      status: 'unreachable',
      fromLocation: fromLoc,
      toLocation: toLoc,
      segments: [],
      totalDistanceKm: 0,
      totalTravelMinutes: 0,
      traversedTerritories: [],
      reason: `Keine passable Verbindung oder Route zwischen "${fromLoc.name}" und "${toLoc.name}" gefunden.`
    };
  }

  /**
   * Executes an atomic production travel turn for the player.
   * Pipeline:
   * 1. Get current player location
   * 2. Resolve route to destination
   * 3. Handle unreachable/not_found without moving player or advancing time
   * 4. Perform EXACTLY ONE WorldSimulationStep with calculated travelMinutes
   * 5. Check if simulation spawned combat/encounter interruption mid-travel:
   *    - If interrupted: set player location to intermediate encounter location
   *    - If completed: set player location to destination location
   * 6. Pass activeWorld snapshot to Gemini & Parser
   * 7. Save adventure state atomically
   */
  public static async executeTravelTurn(params: ProcessPlayerTurnParams & {
    destinationIdOrName: string;
  }): Promise<ProcessPlayerTurnResult & {
    routeResolution: RouteResolution;
    isInterrupted?: boolean;
    interruptedAtLocation?: string;
  }> {
    const {
      adventure,
      destinationIdOrName,
      actionText = `Ich reise nach ${destinationIdOrName}.`,
      generateAiResponse,
      parserFn,
      saveAdventure
    } = params;

    if (!adventure || !adventure.world) {
      throw new Error("Ungültiger Abenteuer-Zustand für Reisezug.");
    }

    const { locationName: currentLocName } = this.getPlayerLocation(adventure);

    // Step 1 & 2: Route Resolution
    const routeRes = this.resolveRoute({
      world: adventure.world,
      fromIdOrName: currentLocName,
      toIdOrName: destinationIdOrName,
      loreDatabase: adventure.loreDatabase
    });

    if (routeRes.status !== 'resolved') {
      // Unreachable or not found -> Do NOT advance time or move player
      const userMsg = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user' as const,
        text: actionText
      };
      const modelMsg = {
        id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model' as const,
        text: routeRes.reason || `Die Reise nach "${destinationIdOrName}" ist derzeit nicht möglich.`
      };

      const updatedChat = [...(adventure.chatHistory || []), userMsg, modelMsg];
      const unchangedAdventure = {
        ...adventure,
        chatHistory: updatedChat
      };

      return {
        updatedAdventure: unchangedAdventure,
        activeWorld: adventure.world,
        simResult: {
          updatedWorld: adventure.world,
          timeStart: adventure.world.worldTime || { day: 1, hour: 8, minute: 0, totalMinutes: 480 },
          timeEnd: adventure.world.worldTime || { day: 1, hour: 8, minute: 0, totalMinutes: 480 },
          processedEvents: [],
          cancelledEvents: [],
          spawnedBattleInstances: [],
          generatedFacts: [],
          changeLogs: [],
          playerVisibleSummary: ''
        },
        rawAiResponse: modelMsg.text,
        cleanedText: modelMsg.text,
        notifications: [],
        userMsg,
        modelMsg,
        routeResolution: routeRes,
        isInterrupted: false
      };
    }

    // Step 3: Calculate Travel Minutes & Run EXACTLY ONE Simulation Step
    const travelMinutes = routeRes.totalTravelMinutes > 0 ? routeRes.totalTravelMinutes : 30;

    const simResult = WorldSimulationService.runSimulationStep({
      world: adventure.world,
      minutesToAdd: travelMinutes,
      mode: 'action',
      actionText
    });

    const activeWorld = simResult.updatedWorld;

    // Step 4: Check Interruption (BattleInstance spawned during travel)
    const hasCombatInterruption = simResult.spawnedBattleInstances.length > 0;
    let finalLocation = routeRes.toLocation;
    let interruptedAtLocationName: string | undefined = undefined;

    if (hasCombatInterruption) {
      // Interrupted! Use intermediate location or origin location
      const battleInst = simResult.spawnedBattleInstances[0];
      if (battleInst.locationName) {
        interruptedAtLocationName = battleInst.locationName;
      } else if (routeRes.segments.length > 0) {
        interruptedAtLocationName = routeRes.segments[0].fromLocationName;
      } else {
        interruptedAtLocationName = currentLocName;
      }

      // Resolve intermediate location ref
      const interRes = WorldIntegrationService.resolveLocationReference({
        idOrName: interruptedAtLocationName,
        world: activeWorld,
        loreDatabase: adventure.loreDatabase
      });
      if (interRes.value) {
        finalLocation = interRes.value;
      }
    }

    // Update canonical location references in activeWorld and player appearance
    activeWorld.currentLocationId = finalLocation.id;
    activeWorld.currentTerritoryId = finalLocation.territoryId;
    if (!activeWorld.dynamicWorldState) activeWorld.dynamicWorldState = {};
    activeWorld.dynamicWorldState.currentLocationId = finalLocation.id;
    activeWorld.dynamicWorldState.currentTerritoryId = finalLocation.territoryId;

    const updatedPlayer = {
      ...adventure.player,
      appearance: {
        ...adventure.player.appearance,
        currentLocation: finalLocation.name
      }
    };

    // Construct user message
    const userMsg = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user' as const,
      text: actionText
    };

    const updatedMessagesForAi = [...(adventure.chatHistory || []), userMsg];

    let rawAiResponse = '';

    if (generateAiResponse) {
      rawAiResponse = await generateAiResponse({
        messages: updatedMessagesForAi,
        activeWorld
      });
    } else {
      // Gemini prompt with activeWorld context
      let simulationInstruction = '';
      if (simResult.playerVisibleSummary) {
        simulationInstruction = `\nDYNAMISCHE WELT-SIMULATION & EREIGNISSE (WÄHREND DER REISE EINGETRETEN):\n${simResult.playerVisibleSummary}\n`;
      }

      let travelContextInstruction = `\nREISE-DETAILS:
- Startort: ${currentLocName}
- Zielort: ${routeRes.toLocation.name}
- Zurückgelegte Strecke: ${routeRes.totalDistanceKm} km
- Benötigte Reisezeit: ${travelMinutes} Minuten
- Aktueller Standort nach Reise: ${finalLocation.name}${hasCombatInterruption ? ` (REISE DURCH KAMPF/EREIGNIS UNTERBROCHEN bei ${finalLocation.name})` : ' (Erfolgreich am Ziel angekommen)'}`;

      const currentStatsStr = (adventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${activeWorld.title || adventure.world.title}".
${simulationInstruction}
WELT: ${activeWorld.description || adventure.world.description} (Ton: ${activeWorld.tone || adventure.world.tone})
${travelContextInstruction}

SPIELER-CHARAKTER:
${updatedPlayer.name} (${updatedPlayer.role}). 
- Bio: ${updatedPlayer.bio}
- Aktueller Standort: ${updatedPlayer.appearance.currentLocation}
- Ziel: ${updatedPlayer.goal}

AKTUELLE WERTE: ${currentStatsStr}`;

      const response = await GeminiService.chat(
        updatedMessagesForAi,
        systemInstruction,
        activeWorld.isNsfw,
        adventure.summaryLog
      );
      rawAiResponse = response.text || '';
    }

    // Step 5: Parser execution
    let parsedResult: any;
    if (parserFn) {
      parsedResult = parserFn(rawAiResponse, { ...adventure, player: updatedPlayer }, undefined, undefined, activeWorld);
    } else {
      parsedResult = {
        cleanedText: rawAiResponse.trim(),
        updatedLore: adventure.loreDatabase || [],
        updatedPlayer: updatedPlayer,
        updatedNpcs: adventure.npcs || [],
        notifications: [],
        updatedStructuredInventory: adventure.structuredInventory,
        updatedWorld: activeWorld
      };
    }

    // Enforce canonical player location in parsed result
    parsedResult.updatedPlayer = {
      ...parsedResult.updatedPlayer,
      appearance: {
        ...(parsedResult.updatedPlayer.appearance || {}),
        currentLocation: finalLocation.name
      }
    };

    parsedResult.updatedWorld = {
      ...parsedResult.updatedWorld,
      currentLocationId: finalLocation.id,
      currentTerritoryId: finalLocation.territoryId,
      dynamicWorldState: {
        ...(parsedResult.updatedWorld.dynamicWorldState || {}),
        currentLocationId: finalLocation.id,
        currentTerritoryId: finalLocation.territoryId
      }
    };

    const modelMsg = {
      id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'model' as const,
      text: parsedResult.cleanedText
    };

    const finalChatHistory = [...updatedMessagesForAi, modelMsg];

    const finalAdventure: Adventure = {
      ...adventure,
      world: parsedResult.updatedWorld,
      player: parsedResult.updatedPlayer,
      npcs: parsedResult.updatedNpcs,
      loreDatabase: parsedResult.updatedLore,
      structuredInventory: parsedResult.updatedStructuredInventory,
      chatHistory: finalChatHistory
    };

    // Step 6: Atomic Save
    if (saveAdventure) {
      await saveAdventure(finalAdventure);
    }

    return {
      updatedAdventure: finalAdventure,
      activeWorld: parsedResult.updatedWorld,
      simResult,
      rawAiResponse,
      cleanedText: parsedResult.cleanedText,
      notifications: parsedResult.notifications || [],
      userMsg,
      modelMsg,
      routeResolution: routeRes,
      isInterrupted: hasCombatInterruption,
      interruptedAtLocation: interruptedAtLocationName
    };
  }
}
