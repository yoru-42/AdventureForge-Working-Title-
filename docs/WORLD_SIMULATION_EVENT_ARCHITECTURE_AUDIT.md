# WORLD SIMULATION & EVENT ARCHITECTURE AUDIT

## Executive Summary & Architectural Pillars

The **World Simulation & Event Architecture** in AdventureForge governs how time, world events, political shifts, economic impacts, and tactical encounters interact deterministically. In alignment with the core principle **"One world. One data basis. Multiple representations."**, the simulation engine operates on strict architectural guarantees:

1. **No Background Realtime Clock**: The world time does NOT advance permanently in the background or via `setInterval`. Time advances strictly and deterministically when the player performs an action or sends a chat message.
2. **Turn-Based Deterministic Simulation Engine**: Each action triggers `WorldSimulationService.runSimulationStep`. Given the same initial world state, seed, and elapsed action duration, the simulation step produces 100% identical outcomes.
3. **Lossless Structured Time Math**: Time is represented via `WorldTime` `{ day, hour, minute, totalMinutes }`. Conversion between total minutes and structured clock representations guarantees precise hour/day rollovers without truncation loss.
4. **Declarative Event Architecture**: Scheduled world events (`WorldEvent`) encapsulate execution preconditions, structural consequences, priorities, processing depth tracking, and visibility controls.
5. **Event Loop Protection**: Recursive follow-up events are capped at `MAX_EVENT_PROCESSING_DEPTH = 10` to prevent infinite event loops and runaway state mutations.
6. **Player Visibility Filtering**: Hidden/secret world events update underlying world facts, faction states, and economic statuses silently without spoiling unrevealed narrative plot points in the AI prompt summary.

---

## Core Interfaces & Data Structures

### 1. `WorldTime`
```typescript
export interface WorldTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes?: number;
}
```

### 2. `WorldEvent`
```typescript
export interface WorldEvent {
  id: string;
  type: 'raid' | 'movement' | 'siege' | 'reinforcement' | 'trade_shift' | 'economic_payout' | 'observation' | 'general' | string;
  title?: string;
  description?: string;
  createdAtWorldTime: WorldTime;
  scheduledForWorldTime: WorldTime;
  sourceType?: 'character' | 'faction' | 'territory' | 'location' | 'encounter_force' | 'system';
  sourceId?: string;
  territoryId?: string;
  locationId?: string;
  factionId?: string;
  characterId?: string;
  battleInstanceId?: string;
  status: 'scheduled' | 'pending' | 'resolved' | 'cancelled';
  priority?: number; // Higher priority executes first at equal scheduled time
  preconditions?: EventPreconditions;
  consequences?: EventConsequences;
  isPlayerVisible?: boolean; // Determines prompt summary inclusion
  processingDepth?: number; // Recursion loop guard
  data?: Record<string, any>;
}
```

### 3. `EventPreconditions` & `EventConsequences`
```typescript
export interface EventPreconditions {
  locationExists?: boolean;
  territoryControlledByFactionId?: string;
  routeActive?: boolean;
  minimumUnitCount?: number;
  customCheckKey?: string;
  requiredWorldFactPredicate?: string;
}

export interface EventConsequences {
  damageToLocation?: string;
  controlTransferFactionId?: string;
  spawnBattleInstance?: boolean;
  economicImpact?: 'damaged' | 'under_siege' | 'operational' | 'boosted';
  followUpEventDelayMinutes?: number;
  followUpEventType?: string;
  followUpEventTitle?: string;
  holdingStatusUpdate?: { holdingId: string; status: 'operational' | 'under_siege' | 'damaged' | 'destroyed' };
  generatedFactText?: string;
}
```

---

## Simulation Processing Pipeline (`runSimulationStep`)

Whenever a player submits an action in `GameView.tsx`:

```
Player Action Text
       │
       ▼
1. Action Duration Estimation (Sleep: 480m, Rest: 60m, Travel: 180m, Search: 30m, Combat: 15m, Default: 10m)
       │
       ▼
2. Advance WorldTime from timeStart to timeEnd
       │
       ▼
3. Query Due Events (scheduledForWorldTime <= timeEnd && status === 'scheduled')
       │
       ▼
4. Sort Queue (Scheduled Time ASC -> Priority DESC -> Stable Event ID ASC)
       │
       ▼
5. Processing Loop (Max Depth Check -> Precondition Check -> Execute Consequences -> Enqueue Follow-Ups)
       │
       ▼
6. State Mutation & Storage (Update territories, economy holdings, world facts, eventHistory)
       │
       ▼
7. Prompt Injection (Filter playerVisibleSummary -> Pass to AI Dungeon Master)
```

---

## Safety Mechanisms & Integrity Controls

| Risk Area | Architectural Guardrail | Implementation Mechanism |
| :--- | :--- | :--- |
| **Infinite Event Loops** | Depth Tracking | `processingDepth >= MAX_EVENT_PROCESSING_DEPTH (10)` cancels event and logs reason. |
| **Invalid Target State** | Precondition Validation | `evaluatePreconditions` verifies location existence, faction control, unit count, and active facts before execution. |
| **Falsy 0-Minute Delays** | Strict Type Check | `typeof cons.followUpEventDelayMinutes === 'number'` ensures 0-minute follow-up events execute immediately without default fallback override. |
| **Duplicate Event Mutation** | Deduplication & State Guard | Events move to `eventHistory` on completion (`status = 'resolved' \| 'cancelled'`); execution is idempotent. |
| **Spoiling Plot Secrets** | Player Visibility Filter | Only `isPlayerVisible: true` events append text to `playerVisibleSummary`; secret events mutate facts silently. |

---

## Test Verification Suite

The entire simulation architecture is validated via `tests/worldSimulationTests.ts`. All 27 assertions pass cleanly:

1. **Time Math & Rollover Accuracy**: Validates lossless minute math and hour/day rollovers (e.g. Day 1 23:50 + 20m -> Day 2 00:10).
2. **Action Duration Heuristics**: Verifies action keyword parsing for sleep, rest, travel, combat, search, and general dialogue.
3. **Queue Sorting & Scheduling**: Confirms correct priority and chronological queue ordering.
4. **Precondition Failures**: Verifies graceful cancellation when target locations or required conditions fail.
5. **Political & Economic Mutators**: Confirms territory political control transfer and `EconomyHolding` status updates with `EconomyLogEntry` records.
6. **Recursion Safeguard**: Confirms execution chain stops at depth 10 when recursive follow-up events trigger.
7. **Visibility Filtering**: Confirms private/secret events do not appear in player-visible prompts.
8. **Determinism**: Confirms identical inputs and random seed produce identical simulation outcomes.

---

## Conclusion & Integration Status

The **World Simulation & Event Architecture** is fully implemented, strictly typed, test-verified, and integrated into `GameView.tsx`. It provides AdventureForge with a persistent, reactive, and logically grounded dynamic world engine that evolves cleanly based on player actions.
