import { Adventure, WorldSetting, WorldLocationReference, Territory, LoreEntry, BattleInstance } from '../types';
import { WorldIntegrationService } from './worldIntegrationService';
import { WorldSimulationService, SimulationStepResult } from './worldSimulationService';
import type { ProcessPlayerTurnParams, ProcessPlayerTurnResult } from './turnTypes';
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
      if (!isNaN(hours) && hours > 0) return Math.round(hours * 60);
    }

    // Check minutes
    const minMatch = str.match(/([\d.,]+)\s*(min|minuten?|m)/);
    if (minMatch) {
      const mins = parseFloat(minMatch[1].replace(',', '.'));
      if (!isNaN(mins) && mins > 0) return Math.round(mins);
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
      if (!isNaN(dist) && dist > 0) return dist;
    }
    return null;
  }

  /**
   * Calculates duration in minutes and distance in Km for a connection based strictly on connection data and terrain.
   * Returns null if connection data is insufficient (neither explicit travelTime/duration nor distance provided).
   */
  public static calculateSegmentData(
    connection: any,
    terrainTypes: string[] = []
  ): { durationMinutes: number; distanceKm: number } | null {
    if (!connection) return null;

    const explicitMins = this.parseDurationStringToMinutes(connection.travelTime || connection.duration);
    const explicitDist = this.parseDistanceStringToKm(connection.distance);

    if (explicitMins && explicitMins > 0) {
      return {
        durationMinutes: explicitMins,
        distanceKm: explicitDist || 0
      };
    }

    if (explicitDist && explicitDist > 0) {
      // Base walking speed: 4 km/h = 15 min per km
      let baseMinPerKm = 15;
      if (connection.type === 'sea' || connection.type === 'ship') baseMinPerKm = 3; // ~20 km/h
      if (connection.type === 'air') baseMinPerKm = 1.5; // ~40 km/h

      let terrainMultiplier = 1.0;
      for (const t of terrainTypes) {
        if (!t) continue;
        const lower = t.toLowerCase();
        if (lower.includes('berg') || lower.includes('gebirge') || lower.includes('pass')) terrainMultiplier = Math.max(terrainMultiplier, 1.8);
        else if (lower.includes('sumpf')) terrainMultiplier = Math.max(terrainMultiplier, 2.0);
        else if (lower.includes('wald')) terrainMultiplier = Math.max(terrainMultiplier, 1.3);
        else if (lower.includes('wüste') || lower.includes('schnee')) terrainMultiplier = Math.max(terrainMultiplier, 1.5);
      }

      const durationMinutes = Math.max(1, Math.round(explicitDist * baseMinPerKm * terrainMultiplier));
      return {
        durationMinutes,
        distanceKm: explicitDist
      };
    }

    // Insufficient connection data -> cannot be deterministically resolved
    return null;
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
   * Employs Dijkstra's weighted shortest-travel-time path search across unblocked connections.
   * Completely excludes coordinate-teleport fallbacks or invented default distance/time values.
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

    // Helper to run Dijkstra search over connections
    interface Edge {
      targetLoc: WorldLocationReference;
      conn: any;
      durationMinutes: number;
      distanceKm: number;
    }

    interface PathState {
      totalMins: number;
      totalDist: number;
      hops: number;
      steps: Edge[];
    }

    const findShortestPath = (includeBlocked: boolean): PathState | null => {
      const adj = new Map<string, Edge[]>();
      const addEdge = (locA: WorldLocationReference, locB: WorldLocationReference, conn: any, durationMinutes: number, distanceKm: number) => {
        if (!adj.has(locA.id)) adj.set(locA.id, []);
        adj.get(locA.id)!.push({ targetLoc: locB, conn, durationMinutes, distanceKm });
      };

      for (const c of connections) {
        if (c.isBlocked && !includeBlocked) {
          continue; // Skip blocked connections when searching unblocked graph
        }

        const resA = WorldIntegrationService.resolveLocationReference({ idOrName: c.fromId || c.fromPlace, world, loreDatabase });
        const resB = WorldIntegrationService.resolveLocationReference({ idOrName: c.toId || c.toPlace, world, loreDatabase });

        if (resA.value && resB.value) {
          const segData = TravelService.calculateSegmentData(c, [resA.value.terrainType, resB.value.terrainType].filter(Boolean) as string[]);
          if (segData && segData.durationMinutes > 0) {
            addEdge(resA.value, resB.value, c, segData.durationMinutes, segData.distanceKm);
            addEdge(resB.value, resA.value, c, segData.durationMinutes, segData.distanceKm);
          }
        }
      }

      const bestMap = new Map<string, PathState>();
      bestMap.set(fromLoc.id, { totalMins: 0, totalDist: 0, hops: 0, steps: [] });
      const unvisited = new Set<string>([fromLoc.id]);

      while (unvisited.size > 0) {
        let bestNodeId: string | null = null;
        let bestState: PathState | null = null;

        for (const nodeId of unvisited) {
          const state = bestMap.get(nodeId)!;
          if (!bestState) {
            bestNodeId = nodeId;
            bestState = state;
          } else {
            if (state.totalMins < bestState.totalMins) {
              bestNodeId = nodeId;
              bestState = state;
            } else if (state.totalMins === bestState.totalMins) {
              if (state.totalDist < bestState.totalDist) {
                bestNodeId = nodeId;
                bestState = state;
              } else if (state.totalDist === bestState.totalDist) {
                if (state.hops < bestState.hops) {
                  bestNodeId = nodeId;
                  bestState = state;
                } else if (state.hops === bestState.hops && nodeId < bestNodeId!) {
                  bestNodeId = nodeId;
                  bestState = state;
                }
              }
            }
          }
        }

        if (!bestNodeId || !bestState) break;
        unvisited.delete(bestNodeId);

        if (bestNodeId === toLoc.id) {
          break;
        }

        const neighbors = adj.get(bestNodeId) || [];
        for (const edge of neighbors) {
          const targetId = edge.targetLoc.id;
          const candMins = bestState.totalMins + edge.durationMinutes;
          const candDist = bestState.totalDist + edge.distanceKm;
          const candHops = bestState.hops + 1;
          const candSteps = [...bestState.steps, edge];

          const prevBest = bestMap.get(targetId);
          let isBetter = false;

          if (!prevBest) {
            isBetter = true;
          } else if (candMins < prevBest.totalMins) {
            isBetter = true;
          } else if (candMins === prevBest.totalMins && candDist < prevBest.totalDist) {
            isBetter = true;
          } else if (candMins === prevBest.totalMins && candDist === prevBest.totalDist && candHops < prevBest.hops) {
            isBetter = true;
          }

          if (isBetter) {
            bestMap.set(targetId, {
              totalMins: candMins,
              totalDist: candDist,
              hops: candHops,
              steps: candSteps
            });
            unvisited.add(targetId);
          }
        }
      }

      return bestMap.get(toLoc.id) || null;
    };

    // 1. First search on unblocked connections
    const unblockedPath = findShortestPath(false);

    if (unblockedPath && unblockedPath.steps.length > 0) {
      const segments: RouteSegment[] = [];
      const traversedTerrs = new Map<string, Territory>();

      let prevLoc = fromLoc;
      for (const step of unblockedPath.steps) {
        const stepLoc = step.targetLoc;

        segments.push({
          fromLocationId: prevLoc.id,
          fromLocationName: prevLoc.name,
          toLocationId: stepLoc.id,
          toLocationName: stepLoc.name,
          connectionId: step.conn?.id,
          label: step.conn?.label,
          distanceKm: step.distanceKm,
          durationMinutes: step.durationMinutes,
          territoryId: stepLoc.territoryId
        });

        if (stepLoc.territoryId) {
          const t = territories.find(ter => ter.id === stepLoc.territoryId);
          if (t) traversedTerrs.set(t.id, t);
        }

        prevLoc = stepLoc;
      }

      if (fromLoc.territoryId) {
        const tFrom = territories.find(ter => ter.id === fromLoc.territoryId);
        if (tFrom) traversedTerrs.set(tFrom.id, tFrom);
      }

      return {
        status: 'resolved',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments,
        totalDistanceKm: unblockedPath.totalDist,
        totalTravelMinutes: unblockedPath.totalMins,
        traversedTerritories: Array.from(traversedTerrs.values())
      };
    }

    // 2. Check if a route exists when including blocked connections
    const fullPathIncludingBlocked = findShortestPath(true);

    if (fullPathIncludingBlocked && fullPathIncludingBlocked.steps.length > 0) {
      return {
        status: 'blocked',
        fromLocation: fromLoc,
        toLocation: toLoc,
        segments: [],
        totalDistanceKm: 0,
        totalTravelMinutes: 0,
        traversedTerritories: [],
        isBlocked: true,
        reason: `Verbindung oder Route nach "${toLoc.name}" ist derzeit blockiert.`
      };
    }

    // 3. Otherwise, unreachable
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
   * 2. Resolve route to destination using Dijkstra
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
      // Unreachable, blocked, or not found -> Do NOT advance time or move player
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
    const travelMinutes = routeRes.totalTravelMinutes;

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
      const battleInst = simResult.spawnedBattleInstances[0];
      let resolvedInterLocation: WorldLocationReference | null = null;

      // 1. Try resolving battleInst locationId or locationName
      const targetLocIdOrName = battleInst.locationId || battleInst.locationName;
      if (targetLocIdOrName) {
        const interRes = WorldIntegrationService.resolveLocationReference({
          idOrName: targetLocIdOrName,
          world: activeWorld,
          loreDatabase: adventure.loreDatabase
        });
        if (interRes.value) {
          resolvedInterLocation = interRes.value;
        }
      }

      // 2. Try resolving via territoryId if no location resolved yet
      if (!resolvedInterLocation && battleInst.territoryId) {
        const locInTerritory = (activeWorld.locations || []).find(l => l.territoryId === battleInst.territoryId);
        if (locInTerritory) {
          const interRes = WorldIntegrationService.resolveLocationReference({
            idOrName: locInTerritory.id,
            world: activeWorld,
            loreDatabase: adventure.loreDatabase
          });
          if (interRes.value) {
            resolvedInterLocation = interRes.value;
          }
        }
      }

      // 3. Apply resolved intermediate location or safely keep last confirmed origin location
      if (resolvedInterLocation) {
        finalLocation = resolvedInterLocation;
        interruptedAtLocationName = finalLocation.name;
      } else {
        // Fallback to origin / current location before travel without guessing or teleporting
        const originRes = WorldIntegrationService.resolveLocationReference({
          idOrName: currentLocName,
          world: activeWorld,
          loreDatabase: adventure.loreDatabase
        });
        if (originRes.value) {
          finalLocation = originRes.value;
        } else {
          finalLocation = routeRes.fromLocation;
        }
        interruptedAtLocationName = finalLocation.name;
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
