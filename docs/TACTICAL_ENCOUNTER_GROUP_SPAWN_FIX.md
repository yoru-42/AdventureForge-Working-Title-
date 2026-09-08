# AdventureForge – Tactical Encounter Group Spawn Fix

## Problem

The combat preparation UI correctly detects nearby opponents from the current chat scene, including group encounters such as:

- `Späher` – Einzelgegner
- `stämiger Krieger mit Eisenkeule` – Einzelgegner
- `Späher (Gruppe von ca. 20)` – Gruppe / Aufklärung

The preparation UI therefore already knows that the third encounter represents a group.

The problem occurs when the selected encounter is transferred into tactical combat: the group is currently reduced to an individual opponent representation instead of becoming a real `TacticalGroup` with multiple tactical entities in formation.

The existing tactical engine already supports the required model. Do **not** build a second group system.

## Existing authoritative structures

Use the structures already present in the project:

- `CombatState.opponents[]`
  - contains `count?: number`
  - is the combat-preparation / legacy opponent representation.
- `EncounterForce`
  - contains `count`
  - contains `factionId`, `enemyTypeId`, `raceId`, etc.
  - can contain `tacticalGroupId` and `isTacticalSpawned`.
- `TacticalGroup`
  - contains `unitIds[]`
  - contains `requestedCount` / `spawnedCount`
  - contains formation, direction, center and behavior.
- `TacticalEntity`
  - represents an individual tactical unit/token.
  - multiple entities can belong to the same `TacticalGroup` through `groupId`.
- `spawnTacticalGroup()` in `utils/tacticalEngine.ts`
  - already accepts `count`.
  - already calculates formation positions.
  - already creates one `TacticalEntity` per spawned unit.
  - already creates the corresponding `TacticalGroup`.

The tactical engine must remain the single implementation for group spawning.

## Required semantic model

A group encounter is **one encounter selection**, but **multiple tactical units**.

Example:

```text
Encounter selected:
  Späher (Gruppe von ca. 20)
  count = 20

Combat preparation:
  one selectable encounter

BattleInstance:
  one participating encounter force

Tactical combat:
  one TacticalGroup
  ├─ tactical entity 1
  ├─ tactical entity 2
  ├─ ...
  └─ tactical entity 20
```

The group must not be converted into one TacticalEntity with a display name such as `Späher (20)`.

## Required implementation

### 1. Audit the complete production path

Trace the actual production path from:

```text
Chat message
→ recent chat event / encounter detection
→ combat preparation UI
→ selected opponent / encounter
→ CombatState creation
→ BattleInstance creation
→ TacticalCombatMap
→ tactical group/entity initialization
```

Do not create a parallel mock path and do not only patch the preparation UI.

Identify exactly where the `count` of a selected group is lost.

### 2. Preserve group count

When a selected opponent has:

```ts
count > 1
```

that count must survive all transitions until tactical spawning.

Do not normalize it to `1` merely because the opponent has one display name.

For the example:

```ts
{
  id: '...',
  name: 'Späher',
  count: 20,
  role: 'Gegner / Aufklärung'
}
```

must result in a tactical spawn request equivalent to:

```ts
spawnTacticalGroup({
  combatState,
  groupName: 'Späher',
  unitDisplayName: 'Späher',
  count: 20,
  formation: appropriateFormation,
  ...
})
```

Use existing encounter/faction/enemy-type IDs when available.

### 3. Use EncounterForce when available

If the selected encounter originated from an `EncounterForce`, preserve the existing force identity:

```text
EncounterForce.id
EncounterForce.count
EncounterForce.factionId
EncounterForce.enemyTypeId
EncounterForce.raceId
EncounterForce.leaderCharacterId
```

The resulting `TacticalGroup` should reference the source through the existing fields, especially:

```ts
encounterForceId
sourceType: 'encounter_force'
sourceId
```

If the encounter has no EncounterForce, use the existing opponent data without inventing a new world entity.

### 4. Spawn individual tactical entities inside the group

For a group of 20:

```text
TacticalGroup.spawnedCount === 20
TacticalGroup.requestedCount === 20
TacticalGroup.unitIds.length === 20
```

and there must be 20 corresponding `TacticalEntity` objects.

Every entity must have:

```ts
groupId === tacticalGroup.id
```

and unique tactical IDs.

These can remain anonymous/background units. They do **not** need 20 named characters in the Codex.

### 5. Formation

The group must use the existing tactical formation system.

Do not manually place 20 units in the UI.

Use `spawnTacticalGroup()` and its formation calculation.

A sensible default for a scout group is an existing formation such as:

- `loose`
- `scattered`
- `line`

depending on existing encounter data.

If the enemy definition already contains a tactical formation, reuse it instead of overriding it.

The important requirement is that the selected group visibly occupies multiple tactical cells.

### 6. Individual enemies remain individual

A single opponent with no group count or with:

```ts
count === 1
```

must still work normally.

It may either remain a single tactical entity or be represented as a one-unit tactical group if that is already the production convention.

Do not force every opponent into a multi-unit group.

### 7. Do not duplicate or respawn groups

Starting combat must not create the same group twice.

Guard against:

```text
Combat preparation → spawn
TacticalCombatMap mount → spawn again
```

The production path must result in exactly one tactical group for the selected encounter.

If an existing `tacticalGroupId` / `isTacticalSpawned` marker is already present, reuse it instead of spawning another group.

### 8. BattleInstance integration

The created `BattleInstance.tacticalGroupIds` must contain the actual tactical group ID.

The relationship must remain:

```text
EncounterForce
    ↓ encounterForceId
TacticalGroup
    ↓ groupId
TacticalEntity × N
    ↓
BattleInstance.tacticalGroupIds
```

Do not store only the display name as the group identity.

### 9. Tactical UI rendering

Audit `TacticalCombatMap` so that it actually renders the spawned `tacticalEntities` / `tacticalGroups` instead of falling back to `opponents[]` and showing only one token per opponent record.

The combat map must visually demonstrate the difference:

```text
Späher              → 1 tactical unit
Späher (Gruppe 20)  → 20 tactical units in one group
```

The group should still behave as one controllable tactical group where group commands / formation commands are supported.

Do not remove individual entity movement support; a unit may still be moved individually after being spawned as part of a group.

## Important distinction

The following are different concepts and must not be conflated:

```text
Opponent record
    = combat preparation / encounter selection

EncounterForce
    = world-level force / group source

TacticalGroup
    = tactical formation / command group

TacticalEntity
    = one actual tactical unit on the combat grid
```

Therefore:

```text
"Späher (Gruppe von 20)"
```

is **one encounter selection**, but it produces **one TacticalGroup containing 20 TacticalEntities**.

## Data integrity

Do not create 20 full Character/NPC records just to represent a group of unnamed soldiers/scouts.

Anonymous tactical entities are explicitly supported by the existing tactical model.

Do not invent character IDs.

If an existing named leader is present, it may be represented through the existing leader/world-character reference, while the remaining group members remain anonymous.

## Tests / acceptance criteria

Add or update production-path tests covering at least:

### A – Single opponent

Selecting one named scout produces one tactical unit.

### B – Group opponent

Selecting `Späher (Gruppe von ca. 20)` produces:

```text
requestedCount = 20
spawnedCount = 20
unitIds.length = 20
```

### C – Group membership

All 20 tactical entities reference the same `groupId`.

### D – Formation

The 20 entities occupy 20 distinct valid grid cells and are visible in the tactical formation.

### E – EncounterForce linkage

If an EncounterForce exists, its `tacticalGroupId` points to the created TacticalGroup and `isTacticalSpawned` is updated consistently.

### F – BattleInstance linkage

The BattleInstance contains the actual TacticalGroup ID.

### G – No duplicate spawn

Opening/mounting the tactical combat UI does not create a second group or duplicate entities.

### H – Individual remains individual

A normal single opponent is not accidentally expanded into a group of multiple units.

### I – Anonymous units

A 20-unit group does not require 20 Codex characters.

### J – Existing tactical systems remain intact

Formation changes, group movement, individual movement and tactical commands continue to work with the spawned group.

## Regression checks

After implementation:

- TypeScript compile succeeds.
- Lint succeeds.
- Existing tactical movement tests pass.
- Existing world integration tests pass.
- Existing world simulation / persistence tests pass.
- No duplicate React keys are introduced.
- No second tactical spawn occurs on component mount.

## Do not build

Do **not** create:

- a new enemy group data model
- a second formation system
- a second tactical spawning engine
- 20 permanent NPC/Character records
- a new encounter engine
- a new BattleInstance model
- a large UI redesign

This is a data-flow and production-spawn correction using the existing tactical architecture.

## Guiding principle

**Eine Gruppe ist ein Gefechtsteilnehmer, aber keine einzelne Figur.**

**Ein Encounter kann 20 Einheiten enthalten. Ein TacticalGroup hält diese 20 Einheiten zusammen.**

The preparation UI chooses the encounter. The tactical engine decides how many actual units appear on the grid.
