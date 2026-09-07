import { 
  WorldSetting, 
  WorldTime, 
  WorldEvent, 
  EventPreconditions, 
  EventConsequences, 
  BattleInstance, 
  WorldFact, 
  WorldFactChangeLogEntry,
  Territory,
  WorldLocationReference,
  EconomyHolding
} from '../types';
import { WorldIntegrationService } from './worldIntegrationService';

export const MAX_EVENT_PROCESSING_DEPTH = 10;

export interface SimulationStepParams {
  world: WorldSetting;
  minutesToAdd: number;
  seed?: number;
  actionText?: string;
}

export interface SimulationStepResult {
  updatedWorld: WorldSetting;
  timeStart: WorldTime;
  timeEnd: WorldTime;
  processedEvents: WorldEvent[];
  cancelledEvents: WorldEvent[];
  spawnedBattleInstances: BattleInstance[];
  generatedFacts: WorldFact[];
  changeLogs: WorldFactChangeLogEntry[];
  playerVisibleSummary: string;
}

export class WorldSimulationService {
  /**
   * Converts a WorldTime object to total accumulated minutes from start of Day 1.
   */
  static toTotalMinutes(wt?: WorldTime): number {
    if (!wt) return 0;
    if (typeof wt.totalMinutes === 'number' && !isNaN(wt.totalMinutes)) {
      return wt.totalMinutes;
    }
    const day = Math.max(1, wt.day || 1);
    const hour = Math.max(0, Math.min(23, wt.hour || 0));
    const minute = Math.max(0, Math.min(59, wt.minute || 0));
    return (day - 1) * 24 * 60 + hour * 60 + minute;
  }

  /**
   * Converts total accumulated minutes back to a structured WorldTime object.
   */
  static fromTotalMinutes(totalMins: number): WorldTime {
    const validMins = Math.max(0, Math.floor(totalMins));
    const dayMins = 24 * 60;
    const day = Math.floor(validMins / dayMins) + 1;
    const remainder = validMins % dayMins;
    const hour = Math.floor(remainder / 60);
    const minute = remainder % 60;
    return { day, hour, minute, totalMinutes: validMins };
  }

  /**
   * Adds specified minutes to a WorldTime object.
   */
  static addMinutes(wt: WorldTime | undefined, minsToAdd: number): WorldTime {
    const currentMins = this.toTotalMinutes(wt);
    return this.fromTotalMinutes(currentMins + Math.max(0, minsToAdd));
  }

  /**
   * Compares two WorldTime objects. Returns negative if a < b, 0 if equal, positive if a > b.
   */
  static compareWorldTime(a?: WorldTime, b?: WorldTime): number {
    return this.toTotalMinutes(a) - this.toTotalMinutes(b);
  }

  /**
   * Checks if time `a` is equal to or after time `b`.
   */
  static isTimeEqualOrAfter(a?: WorldTime, b?: WorldTime): boolean {
    return this.compareWorldTime(a, b) >= 0;
  }

  /**
   * Estimates time advancement in minutes based on player action text or intent.
   */
  static estimateActionDurationMinutes(actionText?: string): number {
    if (!actionText || !actionText.trim()) return 10;

    const text = actionText.toLowerCase();

    // Sleep / Night Rest / Collapse
    if (/(?:schlaf|schläft|schlafe|zubett|zu\s*bett|ruhe\s*legen|hinlegen\s*zum|zur\s*ruhe|nachtruhe|einschlaf)/.test(text)) {
      return 480; // 8 hours
    }
    // Short Rest / Nap
    if (/(?:rasten|rast|pause|verschnaufen|kurzes\s*schläfchen|nap)/.test(text)) {
      return 60; // 1 hour
    }
    // Long Travel
    if (/(?:reisen|reise|marschieren|wanderung|seefahrt|überqueren|weg\s*nach|reiten\s*nach)/.test(text)) {
      return 180; // 3 hours
    }
    // Search / Investigate / Explore
    if (/(?:durchsuchen|untersuchen|erkunden|erforschen|durchkämmen|spuren\s*suchen)/.test(text)) {
      return 30;
    }
    // Combat / Raid / Attack
    if (/(?:angreifen|angreif|greife|kampf|gefecht|überfall|attacke|sturm)/.test(text)) {
      return 15;
    }
    // Work / Crafting / Trade
    if (/(?:arbeiten|handeln|feilschen|schmieden|brauen|reparieren)/.test(text)) {
      return 120; // 2 hours
    }

    // Default chat step duration
    return 10;
  }

  /**
   * Schedules a new WorldEvent onto the WorldSetting.
   */
  static scheduleEvent(params: {
    world: WorldSetting;
    event: Partial<WorldEvent> & { type: string };
  }): { updatedWorld: WorldSetting; createdEvent: WorldEvent } {
    const { world, event } = params;

    const currentWorldTime = world.worldTime || { day: 1, hour: 8, minute: 0, totalMinutes: 480 };
    const createdAtWorldTime = event.createdAtWorldTime || { ...currentWorldTime };
    const scheduledForWorldTime = event.scheduledForWorldTime || { ...currentWorldTime };

    const eventId = event.id || `event_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    const createdEvent: WorldEvent = {
      id: eventId,
      type: event.type,
      title: event.title || `Ereignis: ${event.type}`,
      description: event.description || '',
      createdAtWorldTime,
      scheduledForWorldTime,
      sourceType: event.sourceType || 'system',
      sourceId: event.sourceId,
      territoryId: event.territoryId,
      locationId: event.locationId,
      factionId: event.factionId,
      characterId: event.characterId,
      battleInstanceId: event.battleInstanceId,
      status: 'scheduled',
      priority: event.priority ?? 0,
      preconditions: event.preconditions || {},
      consequences: event.consequences || {},
      isPlayerVisible: event.isPlayerVisible ?? true,
      processingDepth: event.processingDepth ?? 0,
      data: event.data || {}
    };

    const updatedWorld: WorldSetting = {
      ...world,
      scheduledEvents: [...(world.scheduledEvents || []), createdEvent],
      dynamicWorldState: {
        ...(world.dynamicWorldState || {}),
        scheduledEvents: [...(world.dynamicWorldState?.scheduledEvents || []), createdEvent]
      }
    };

    return { updatedWorld, createdEvent };
  }

  /**
   * Evaluates if event preconditions are met within the world state.
   */
  static evaluatePreconditions(event: WorldEvent, world: WorldSetting): { satisfied: boolean; reason?: string } {
    const pre = event.preconditions;
    if (!pre) return { satisfied: true };

    // 1. Location existence
    if (pre.locationExists && event.locationId) {
      const locMatch = world.locations?.find(l => l.id === event.locationId) ||
                       world.territories?.flatMap(t => t.placeMarkers || []).find(p => p.id === event.locationId);
      if (!locMatch) {
        return { satisfied: false, reason: `Location ID '${event.locationId}' does not exist in world.` };
      }
    }

    // 2. Territory controlling faction
    if (pre.territoryControlledByFactionId && event.territoryId) {
      const terr = world.territories?.find(t => t.id === event.territoryId);
      if (!terr) {
        return { satisfied: false, reason: `Territory ID '${event.territoryId}' does not exist.` };
      }
      if (terr.controlledByFactionId !== pre.territoryControlledByFactionId) {
        return { 
          satisfied: false, 
          reason: `Territory '${event.territoryId}' controlled by '${terr.controlledByFactionId}', expected '${pre.territoryControlledByFactionId}'.` 
        };
      }
    }

    // 3. Minimum unit count in encounter force
    if (pre.minimumUnitCount && event.sourceId) {
      const forceMap = world.dynamicWorldState?.encounterForces || {};
      const force = forceMap[event.sourceId] || world.encounterForces?.find(f => f.id === event.sourceId);
      if (force && force.count < pre.minimumUnitCount) {
        return { 
          satisfied: false, 
          reason: `EncounterForce '${event.sourceId}' unit count (${force.count}) below required minimum (${pre.minimumUnitCount}).` 
        };
      }
    }

    // 4. Required WorldFact predicate
    if (pre.requiredWorldFactPredicate) {
      const factExists = world.facts?.some(f => f.predicate === pre.requiredWorldFactPredicate && f.status === 'known');
      if (!factExists) {
        return { satisfied: false, reason: `Required WorldFact predicate '${pre.requiredWorldFactPredicate}' not active.` };
      }
    }

    return { satisfied: true };
  }

  /**
   * Executes consequences of a validated WorldEvent and applies mutations to WorldSetting.
   */
  static executeEventConsequences(params: {
    event: WorldEvent;
    world: WorldSetting;
    currentDepth: number;
  }): {
    updatedWorld: WorldSetting;
    spawnedBattleInstance?: BattleInstance | null;
    generatedFacts: WorldFact[];
    followUpEvents: WorldEvent[];
    changeLogs: WorldFactChangeLogEntry[];
  } {
    const { event, world, currentDepth } = params;
    let currentWorld = { ...world };
    const generatedFacts: WorldFact[] = [];
    const changeLogs: WorldFactChangeLogEntry[] = [];
    const followUpEvents: WorldEvent[] = [];
    let spawnedBattleInstance: BattleInstance | null = null;

    const cons = event.consequences || {};

    // 1. Territory Political Control Transfer
    if (cons.controlTransferFactionId && event.territoryId) {
      const updatedTerritories = (currentWorld.territories || []).map(terr => {
        if (terr.id === event.territoryId) {
          const oldFaction = terr.controlledByFactionId;
          changeLogs.push({
            id: `log_ctrl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            entityType: 'territory',
            entityId: terr.id,
            whatChanged: 'controlledByFactionId',
            oldValue: oldFaction,
            newValue: cons.controlTransferFactionId,
            source: 'calculated',
            reason: `WorldEvent [${event.type}]: ${event.title || event.id}`
          });
          return { ...terr, controlledByFactionId: cons.controlTransferFactionId };
        }
        return terr;
      });
      currentWorld = { ...currentWorld, territories: updatedTerritories };
    }

    // 2. Economic Impact / Holding Status Update
    if ((cons.economicImpact || cons.holdingStatusUpdate) && currentWorld.economyConfig?.holdings) {
      const holdings = [...currentWorld.economyConfig.holdings];
      const targetHoldingId = cons.holdingStatusUpdate?.holdingId;
      
      const updatedHoldings: EconomyHolding[] = holdings.map(h => {
        const matchesLocation = event.locationId ? h.territoryId === event.territoryId || h.locationName === event.locationId : true;
        const matchesId = targetHoldingId ? h.id === targetHoldingId : false;

        if (matchesId || (matchesLocation && cons.economicImpact)) {
          const newStatus: 'active' | 'damaged' | 'expanding' | 'bankrupt' | 'under_siege' = 
            cons.holdingStatusUpdate?.status === 'damaged' ? 'damaged' :
            cons.holdingStatusUpdate?.status === 'under_siege' ? 'under_siege' :
            cons.holdingStatusUpdate?.status === 'destroyed' ? 'damaged' :
            cons.economicImpact === 'damaged' ? 'damaged' :
            cons.economicImpact === 'under_siege' ? 'under_siege' : 'active';
          
          changeLogs.push({
            id: `log_econ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            entityType: 'holding',
            entityId: h.id,
            whatChanged: 'status',
            oldValue: h.status,
            newValue: newStatus,
            source: 'calculated',
            reason: `WorldEvent [${event.type}]: ${event.title || event.id}`
          });

          const logEntry = {
            id: `log_act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: `Tag ${event.scheduledForWorldTime.day}, ${String(event.scheduledForWorldTime.hour).padStart(2, '0')}:${String(event.scheduledForWorldTime.minute).padStart(2, '0')}`,
            type: 'incident' as const,
            message: `${event.title || 'Wirtschaftliches Ereignis'}: Status zu ${newStatus} geändert.`,
            severity: 'warning' as const
          };

          return {
            ...h,
            status: newStatus,
            activityLogs: [
              ...(h.activityLogs || []),
              logEntry
            ]
          };
        }
        return h;
      });

      currentWorld = {
        ...currentWorld,
        economyConfig: {
          ...currentWorld.economyConfig,
          holdings: updatedHoldings
        }
      };
    }

    // 3. Spawn BattleInstance if requested
    if (cons.spawnBattleInstance && (event.territoryId || event.locationId)) {
      const battleRes = WorldIntegrationService.createBattleInstance({
        territoryId: event.territoryId || 'territory_default',
        locationIdOrName: event.locationId,
        world: currentWorld,
        participatingFactionIds: event.factionId ? [event.factionId] : []
      });
      currentWorld = battleRes.updatedWorld;
      spawnedBattleInstance = battleRes.battleInstance;
    }

    // 4. Generate WorldFact
    const factText = cons.generatedFactText || event.description || event.title || `Ereignis '${event.type}' ausgeführt.`;
    const newFact: WorldFact = {
      id: `fact_evt_${event.id}_${Date.now()}`,
      subjectId: event.locationId || event.territoryId || 'world',
      predicate: `event_${event.type}`,
      objectName: factText,
      sourceType: 'calculated',
      status: 'known',
      knowledgeType: 'fact',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    generatedFacts.push(newFact);
    currentWorld = {
      ...currentWorld,
      facts: [...(currentWorld.facts || []), newFact]
    };

    // 5. Schedule Follow-Up Event if requested and depth limit allows
    if (cons.followUpEventType && currentDepth <= MAX_EVENT_PROCESSING_DEPTH) {
      const delayMins = typeof cons.followUpEventDelayMinutes === 'number' ? cons.followUpEventDelayMinutes : 60;
      const followUpTime = this.addMinutes(event.scheduledForWorldTime, delayMins);
      const followUpEvent: WorldEvent = {
        id: `event_fu_${event.id}_d${currentDepth + 1}_${Math.random().toString(36).substring(2, 7)}`,
        type: cons.followUpEventType,
        title: cons.followUpEventTitle || `Folgeereignis zu ${event.title || event.type}`,
        createdAtWorldTime: event.scheduledForWorldTime,
        scheduledForWorldTime: followUpTime,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        territoryId: event.territoryId,
        locationId: event.locationId,
        factionId: event.factionId,
        status: 'scheduled',
        priority: (event.priority || 0) + 1,
        isPlayerVisible: event.isPlayerVisible,
        processingDepth: currentDepth + 1,
        consequences: event.consequences ? { ...event.consequences } : {},
        data: event.data || {}
      };
      followUpEvents.push(followUpEvent);
    }

    return {
      updatedWorld: currentWorld,
      spawnedBattleInstance,
      generatedFacts,
      followUpEvents,
      changeLogs
    };
  }

  /**
   * Main deterministic simulation step execution engine.
   * Runs whenever player sends a message / performs an action in the game.
   */
  static runSimulationStep(params: SimulationStepParams): SimulationStepResult {
    const { world, minutesToAdd, seed = 42, actionText } = params;

    const actualMinsToAdd = minutesToAdd > 0 ? minutesToAdd : this.estimateActionDurationMinutes(actionText);

    const timeStart = world.worldTime || { day: 1, hour: 8, minute: 0, totalMinutes: 480 };
    const timeEnd = this.addMinutes(timeStart, actualMinsToAdd);

    let currentWorld: WorldSetting = { ...world, worldTime: timeEnd };

    const rawScheduledEvents = [
      ...(currentWorld.dynamicWorldState?.scheduledEvents || []),
      ...(currentWorld.scheduledEvents || [])
    ];

    // Deduplicate by event ID
    const eventMap = new Map<string, WorldEvent>();
    for (const evt of rawScheduledEvents) {
      if (evt && evt.id) {
        eventMap.set(evt.id, evt);
      }
    }

    const allEvents = Array.from(eventMap.values());

    // Filter events that are due (scheduledForWorldTime <= timeEnd) and currently status === 'scheduled'
    let dueEvents = allEvents.filter(
      evt => evt.status === 'scheduled' && this.compareWorldTime(evt.scheduledForWorldTime, timeEnd) <= 0
    );

    // Sort deterministically: earliest scheduled time, highest priority, then stable ID
    dueEvents.sort((a, b) => {
      const timeDiff = this.compareWorldTime(a.scheduledForWorldTime, b.scheduledForWorldTime);
      if (timeDiff !== 0) return timeDiff;
      const prioDiff = (b.priority || 0) - (a.priority || 0);
      if (prioDiff !== 0) return prioDiff;
      return a.id.localeCompare(b.id);
    });

    const processedEvents: WorldEvent[] = [];
    const cancelledEvents: WorldEvent[] = [];
    const spawnedBattleInstances: BattleInstance[] = [];
    const generatedFacts: WorldFact[] = [];
    const changeLogs: WorldFactChangeLogEntry[] = [];
    const playerVisibleMessages: string[] = [];

    // Processing loop with depth protection
    const pendingQueue = [...dueEvents];

    while (pendingQueue.length > 0) {
      const currentEvt = pendingQueue.shift()!;

      // 1. Event Loop Protection Check
      if ((currentEvt.processingDepth || 0) >= MAX_EVENT_PROCESSING_DEPTH) {
        const cancelledEvt: WorldEvent = {
          ...currentEvt,
          status: 'cancelled',
          data: { ...(currentEvt.data || {}), cancelReason: 'Max event processing depth exceeded (event loop protection)' }
        };
        cancelledEvents.push(cancelledEvt);
        eventMap.set(cancelledEvt.id, cancelledEvt);
        continue;
      }

      // 2. Preconditions Evaluation
      const preCheck = this.evaluatePreconditions(currentEvt, currentWorld);
      if (!preCheck.satisfied) {
        const cancelledEvt: WorldEvent = {
          ...currentEvt,
          status: 'cancelled',
          data: { ...(currentEvt.data || {}), cancelReason: preCheck.reason }
        };
        cancelledEvents.push(cancelledEvt);
        eventMap.set(cancelledEvt.id, cancelledEvt);
        continue;
      }

      // 3. Execute Consequences
      const execRes = this.executeEventConsequences({
        event: currentEvt,
        world: currentWorld,
        currentDepth: currentEvt.processingDepth || 0
      });

      currentWorld = execRes.updatedWorld;
      if (execRes.spawnedBattleInstance) {
        spawnedBattleInstances.push(execRes.spawnedBattleInstance);
      }
      generatedFacts.push(...execRes.generatedFacts);
      changeLogs.push(...execRes.changeLogs);

      const resolvedEvt: WorldEvent = {
        ...currentEvt,
        status: 'resolved'
      };

      processedEvents.push(resolvedEvt);
      eventMap.set(resolvedEvt.id, resolvedEvt);

      if (resolvedEvt.isPlayerVisible && (resolvedEvt.title || resolvedEvt.description)) {
        playerVisibleMessages.push(`[${resolvedEvt.title}] ${resolvedEvt.description || ''}`.trim());
      }

      // 4. Enqueue follow-up events if due before timeEnd
      for (const fu of execRes.followUpEvents) {
        eventMap.set(fu.id, fu);
        if (this.compareWorldTime(fu.scheduledForWorldTime, timeEnd) <= 0) {
          pendingQueue.push(fu);
        }
      }
    }

    // Update active vs history event lists in WorldSetting
    const finalScheduledEvents = Array.from(eventMap.values()).filter(e => e.status === 'scheduled');
    const finalHistoryEvents = Array.from(eventMap.values()).filter(e => e.status === 'resolved' || e.status === 'cancelled');

    const updatedWorld: WorldSetting = {
      ...currentWorld,
      worldTime: timeEnd,
      scheduledEvents: finalScheduledEvents,
      dynamicWorldState: {
        ...(currentWorld.dynamicWorldState || {}),
        scheduledEvents: finalScheduledEvents,
        eventHistory: finalHistoryEvents,
        simulationSeed: seed,
        lastUpdated: Date.now()
      }
    };

    const playerVisibleSummary = playerVisibleMessages.join('\n');

    return {
      updatedWorld,
      timeStart,
      timeEnd,
      processedEvents,
      cancelledEvents,
      spawnedBattleInstances,
      generatedFacts,
      changeLogs,
      playerVisibleSummary
    };
  }
}
