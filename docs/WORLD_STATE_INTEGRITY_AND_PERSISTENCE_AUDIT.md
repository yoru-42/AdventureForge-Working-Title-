# AdventureForge – World State Integrity & Persistence Audit

**Zweck:** Prüfung der Integrität, Lebensdauer und Persistenz des gemeinsamen World State nach der erfolgreichen World-State/Map-Integration.

**Referenzdokumente:**
- `docs/WORLD_STATE_MAP_ARCHITECTURE.md`
- `docs/WORLD_STATE_MAP_IMPLEMENTATION_AUDIT.md`

**Leitsatz:** Eine Welt. Eine Datenbasis. Mehrere Darstellungen.

---

# 1. Ziel

Die World-State-/Map-Integration ist inzwischen technisch verbunden. Der nächste kritische Punkt ist deshalb nicht ein neues Feature, sondern die Frage:

> **Bleibt es wirklich dieselbe Welt, wenn Daten gespeichert, geladen, verändert und erneut verwendet werden?**

Dieser Audit prüft insbesondere:

```text
WORLD STATE
    ↓
MODIFICATION
    ↓
SAVE
    ↓
LOAD
    ↓
SAME WORLD STATE?
```

Es muss verhindert werden, dass World Map, Combat, Economy, NPCs oder Codex nach einem Reload unterschiedliche Wahrheiten über dieselbe Welt besitzen.

---

# 2. Grundbegriffe

AdventureForge besitzt zwei unterschiedliche Arten von Weltinformationen.

## 2.1 Statischer / kanonischer Weltzustand

Beispiele:

- Territory-Struktur
- geografische Grenzen
- Locations
- Factions
- Characters
- grundlegende Weltdefinitionen
- kanonische Zuordnungen

## 2.2 Dynamischer Runtime-Zustand

Beispiele:

- aktuelle Gebietskontrolle
- aktuelle Charakterpositionen
- aktuelle Gruppenstärken
- BattleInstances
- Gebäudeschäden
- Belagerungen
- Wirtschaftszustände
- aktive Events
- laufende Zustandsänderungen

Diese beiden Ebenen dürfen unterschiedlich organisiert sein, müssen aber eindeutig zusammengehören.

```text
WORLD DEFINITION
       │
       ├── Geography
       ├── Locations
       ├── Factions
       └── Characters

DYNAMIC WORLD STATE
       │
       ├── Control
       ├── Position
       ├── Battles
       ├── Damage
       ├── Economy
       └── Events
```

---

# 3. Audit-Regel

Vor Änderungen muss der bestehende Code untersucht werden.

Nicht erlaubt:

- ein neues Save-System erfinden, wenn bereits eines existiert
- `WorldSetting` ersetzen
- `dynamicWorldState` ersetzen
- neue Parallel-Stores ohne zwingenden Grund erzeugen
- Daten nur deshalb verschieben, weil eine andere Struktur theoretisch schöner wäre
- funktionierende Persistenz durch eine neue Architektur ersetzen

Zuerst muss festgestellt werden, **wie AdventureForge aktuell speichert und lädt**.

---

# 4. Persistence Inventory

Gemini muss alle vorhandenen Speichermechanismen identifizieren.

Zu untersuchen sind insbesondere:

- React State
- Contexts
- globale Stores
- LocalStorage
- IndexedDB
- Datei-/JSON-Export
- Import
- Projekt-/World-Saves
- Autosave
- manuelles Save
- Session-State
- URL-/Parameter-State, falls vorhanden
- temporäre Battle-Daten
- persistente World-State-Daten

Für jeden Mechanismus dokumentieren:

| Mechanismus | Quelle | Liest | Schreibt | Lebensdauer | Persistiert? | Risiko |
|---|---|---|---|---|---|---|
| React State | ? | ? | ? | Session | ? | ? |
| LocalStorage | ? | ? | ? | Browser | ? | ? |
| World Save | ? | ? | ? | dauerhaft | ? | ? |
| Battle State | ? | ? | ? | Kampf | ? | ? |

Keine neuen Mechanismen einführen, bevor das bestehende System vollständig verstanden wurde.

---

# 5. WorldSetting Audit

Prüfen, welche Daten aktuell in `WorldSetting` gespeichert werden.

Besonders:

- territories
- locations
- factions
- characters
- NPCs
- loreDatabase
- economyConfig
- battleInstances
- dynamicWorldState
- sonstige World-State-Felder

Für jedes Feld klären:

1. Ist es statisch oder dynamisch?
2. Wird es gespeichert?
3. Wird es geladen?
4. Wird es von mehreren Systemen verwendet?
5. Wird es nach Änderungen aktualisiert?
6. Gibt es eine zweite Quelle für denselben Wert?

---

# 6. DynamicWorldState Audit

`dynamicWorldState` muss besonders genau untersucht werden.

Prüfen:

- Welche Daten liegen darin?
- Welche IDs werden verwendet?
- Welche Daten bleiben dort dauerhaft?
- Welche Daten sind nur temporär?
- Wie werden Änderungen angewendet?
- Wie werden Änderungen gespeichert?
- Wie werden Änderungen geladen?

Ein BattleInstance kann beispielsweise während des Kampfes aktiv sein und nach Abschluss einen dauerhaften historischen Datensatz darstellen.

Es muss klar sein, welche Teile davon Runtime-only und welche persistent sind.

---

# 7. Single Source of Truth Audit

Für jeden wichtigen Wert muss genau eine autoritative Quelle existieren.

Beispiele:

### Territory-Kontrolle

Nicht gleichzeitig:

```text
Territory.controlledByFactionId
Faction.territories
EconomyHolding.owner
Battle.localOwner
```

wenn diese Werte unabhängig voneinander geändert werden können.

Stattdessen muss klar sein, welches Feld die Wahrheit darstellt und welche anderen Werte daraus abgeleitet werden.

### Beispiel

```text
Territory.controlledByFactionId
            ↓
Economy / Map / NPC Logic
```

Wenn inverse Listen existieren, müssen sie synchronisiert oder eindeutig als Cache/Derived Data behandelt werden.

---

# 8. ID Integrity Audit

Alle persistenten Referenzen müssen über stabile IDs funktionieren.

Prüfen:

- Territory IDs
- Location IDs
- BattleInstance IDs
- Faction IDs
- Character IDs
- NPC IDs
- EconomyHolding IDs
- LoreEntry IDs
- Tactical Source IDs

Für jede Referenz prüfen:

```text
ID erzeugt
   ↓
gespeichert
   ↓
geladen
   ↓
weiterhin gültig?
```

IDs dürfen bei einem Reload nicht neu erzeugt werden, wenn dadurch bestehende Referenzen ungültig werden.

---

# 9. Deterministische Fallback-IDs

Das bestehende `resolveLocationReference`-Fallback-System muss geprüft werden.

Es muss sichergestellt werden:

```text
gleiche alte Daten
        ↓
gleiche Location-ID
```

und nicht:

```text
Load 1 → loc_123
Load 2 → loc_987
```

Fallback-IDs müssen stabil und kollisionsarm sein.

Wenn möglich, sollte nach erfolgreicher Auflösung die explizite ID dauerhaft gespeichert werden, sodass der Fallback langfristig nicht mehr benötigt wird.

---

# 10. Save / Load Round Trip

Der wichtigste technische Test ist ein vollständiger Round Trip.

```text
Create World
     ↓
Save
     ↓
Load
     ↓
Compare
```

Mindestens vergleichen:

- Territory IDs
- Territory hierarchy
- Territory control
- Locations
- Location → Territory references
- Factions
- Characters
- Economy Holdings
- BattleInstances
- dynamicWorldState
- relevante Lore IDs

Erwartung:

```text
StateBeforeSave === StateAfterLoad
```

Dabei müssen bewusst Felder ausgeschlossen werden, die technisch transient sind, z.B. UI-Zustand oder laufende React-Referenzen.

---

# 11. Deep Equality statt oberflächlicher Prüfung

Ein Round-Trip-Test darf nicht nur prüfen:

```text
world !== null
```

oder:

```text
territories.length === sameLength
```

Es muss geprüft werden, ob die relevanten Daten tatsächlich gleich geblieben sind.

Besonders wichtig:

- IDs
- Referenzen
- verschachtelte Arrays
- verschachtelte Objekte
- Snapshot-Daten
- Statuswerte
- Kontrollwerte
- Economy-Daten

---

# 12. Mutation Audit

Prüfen, ob Komponenten den globalen World State direkt mutieren.

Problematisch:

```text
territory.controlledByFactionId = factionId
```

wenn dadurch kein zentraler State-Update ausgelöst wird.

Besser ist ein definierter Update-Pfad, beispielsweise:

```text
Action
  ↓
World State Update
  ↓
Persistence
  ↓
Derived Views
```

Die tatsächliche vorhandene Architektur muss verwendet werden.

Nicht pauschal eine neue State-Management-Lösung einführen.

---

# 13. Update Atomicity

Zusammengehörige Änderungen müssen möglichst atomar angewendet werden.

Beispiel Territory-Eroberung:

```text
Battle Result
     ↓
controlledByFactionId
     ↓
Economy ownership/control
     ↓
relevante Fraktions-/Militärdaten
     ↓
History/Event
     ↓
Save
```

Es darf nicht passieren, dass nach einem Fehler nur die Hälfte gespeichert wurde und die Welt dadurch widersprüchlich ist.

Wenn das bestehende Save-System keine echte Transaktion unterstützt, soll mindestens ein konsistenter Update-/Commit-Punkt geschaffen werden.

---

# 14. Battle Persistence Audit

Prüfen, was mit einer BattleInstance passiert.

### Vor dem Kampf

```text
World State
   ↓
Battle Snapshot
```

### Während des Kampfes

```text
Battle Snapshot
   ↓
Combat State
```

### Nach dem Kampf

```text
Combat Result
   ↓
World State Update
   ↓
Persist
```

Es muss verhindert werden, dass:

- taktische Zwischenbewegungen dauerhaft im globalen State landen
- ein abgebrochener Kampf bereits als gewonnen gilt
- ein Reload einen abgeschlossenen Kampf erneut ausführt
- ein Battle Result doppelt angewendet wird

---

# 15. Idempotency des Battle Result

`completeBattleInstance` und vergleichbare Abschlusslogik müssen geprüft werden.

Folgender Fall darf keine doppelten Änderungen erzeugen:

```text
completeBattleInstance(battle_123)
completeBattleInstance(battle_123)
```

Das Ergebnis muss entweder:

- beim zweiten Aufruf sicher ignoriert werden, oder
- nachweislich dasselbe Ergebnis liefern, ohne erneut Schäden/Verluste/Kontrollwechsel anzuwenden.

Beispiel:

```text
status = completed
```

kann als Schutz dienen, sofern die Implementierung tatsächlich darauf prüft.

---

# 16. Economy Persistence Audit

Nach einem Kampf oder einer anderen Weltänderung muss geprüft werden:

```text
World State
    ↓
Economy
    ↓
Save
    ↓
Load
```

Beispiel:

```text
Building status = damaged
```

Nach Reload muss weiterhin gelten:

```text
Building status = damaged
```

und nicht wieder:

```text
Building status = operational
```

weil EconomyHolding beim Start erneut aus einem Default-Preset erzeugt wurde.

---

# 17. Default-/Preset-Audit

Besonders wichtig sind automatische Initialisierungen.

Prüfen:

- Economy Presets
- Default Holdings
- Default Locations
- Default Factions
- Default NPCs
- Default Battle Data

Ein Default darf nur beim **Erstellen neuer Daten** greifen.

Er darf nicht bei jedem Reload vorhandene Daten überschreiben.

Falsch:

```text
Load
 ↓
CreateDefaultHolding()
 ↓
overwrite existing holding
```

Richtig:

```text
Load
 ↓
Existing holding found?
 ├── yes → use existing
 └── no  → create default
```

---

# 18. Save Version / Migration Audit

Prüfen, ob gespeicherte World States eine Versionsinformation besitzen.

Beispiel:

```text
schemaVersion: 1
```

Bei späteren Änderungen an Datenstrukturen muss eine Migration möglich sein.

Beispiel:

```text
Version 1
   ↓ migration
Version 2
```

Falls bereits ein Versions-/Migration-System existiert, muss dieses weiterverwendet werden.

Falls nicht, soll nur eine minimale Versionierung ergänzt werden, bevor komplexere Persistenzänderungen vorgenommen werden.

---

# 19. Corrupt / Partial Data Audit

Prüfen, wie das System mit unvollständigen Daten umgeht.

Beispiele:

- Location verweist auf nicht vorhandenes Territory
- EconomyHolding verweist auf gelöschte Location
- BattleInstance verweist auf nicht vorhandene Faction
- Character-ID fehlt
- alter Save besitzt noch keine Location-ID

Das System soll:

1. Fehler erkennen
2. nicht stillschweigend eine neue falsche Welt erzeugen
3. sichere Fallbacks verwenden, wenn vorhanden
4. Fehler nachvollziehbar protokollieren

---

# 20. Delete / Rename Integrity

Prüfen, was passiert, wenn ein Objekt gelöscht oder umbenannt wird.

Besonders:

- Territory
- Location
- Faction
- Character
- EconomyHolding
- LoreEntry

Ein Name darf geändert werden, ohne dass eine ID ungültig wird.

Beim Löschen müssen abhängige Referenzen bewusst behandelt werden.

Beispiel:

```text
Delete Location
   ↓
BattleInstance reference?
   ↓
EconomyHolding reference?
   ↓
NPC position?
   ↓
History?
```

Nicht einfach verwaiste Referenzen erzeugen.

---

# 21. Derived Data Audit

Einige Daten können aus anderen Daten abgeleitet werden.

Beispiele:

```text
Territory.controlledByFactionId
        ↓
Economy control
```

oder:

```text
Location.territoryId
        ↓
Territory lookup
```

Prüfen, welche Daten tatsächlich gespeichert werden müssen und welche besser abgeleitet werden.

Ziel ist nicht maximale Speicherung, sondern **eine klare Datenhoheit**.

---

# 22. Cache Audit

Prüfen, ob Caches oder lokale Kopien existieren.

Ein Cache darf niemals unbemerkt zur zweiten Wahrheit werden.

Beispiel:

```text
World State
    ↓
Economy Cache
```

Wenn sich der World State ändert, muss klar sein:

- wann der Cache invalidiert wird
- wann er neu berechnet wird
- ob er gespeichert wird
- ob er beim Laden neu aufgebaut wird

---

# 23. UI-State vs World-State

UI-Zustände dürfen nicht versehentlich als Weltzustand gespeichert werden.

Beispiele für UI-only:

- aktuell geöffneter Editor
- ausgewähltes Panel
- Cursorposition
- Zoom
- Auswahl eines Tabs
- temporäre Dialogzustände

Beispiele für World-State:

- Territory control
- Character location
- Battle status
- Gebäudezustand
- Wirtschaftszustand

Diese Ebenen müssen getrennt bleiben.

---

# 24. Reload Consistency Test

Ein wichtiger Praxistest:

```text
World öffnen
 ↓
Territory verändern
 ↓
Location verändern
 ↓
Kampf durchführen
 ↓
Economy verändern
 ↓
Save
 ↓
Anwendung neu laden
 ↓
World öffnen
```

Danach müssen alle Änderungen weiterhin vorhanden sein.

Nicht nur die World Map muss stimmen.

Auch:

- Combat
- Economy
- Characters
- Factions
- Locations
- Battle History

müssen denselben Zustand sehen.

---

# 25. Cross-System Consistency Tests

Mindestens folgende Tests sollen existieren.

## Test A – Territory Control

```text
Faction A controls Territory X
Save
Load
```

Erwartung:

```text
Territory X → Faction A
```

## Test B – Location Reference

```text
Location L → Territory X
Save
Load
```

Erwartung:

```text
Location L.territoryId === X
```

## Test C – Battle

```text
Create Battle
Complete Battle
Save
Load
```

Erwartung:

- Battle bleibt abgeschlossen
- Result bleibt vorhanden
- World-State-Änderungen bleiben vorhanden

## Test D – Economy

```text
Building damaged
Save
Load
```

Erwartung:

```text
Building remains damaged
```

## Test E – ID Stability

```text
Save
Load
Save
Load
```

Erwartung:

IDs bleiben identisch.

---

# 26. Golden World Test

Es soll mindestens eine kleine, reproduzierbare Testwelt geben, die als Referenzzustand dient.

Beispiel:

```text
Territory: territory_test_01
Location: loc_test_01
Faction A: faction_test_a
Faction B: faction_test_b
Character: char_test_01
Holding: holding_test_01
```

Diese Welt kann verwendet werden für:

- Save/Load Tests
- Battle Tests
- Economy Tests
- ID Tests
- Migration Tests

Sie muss klein sein und darf keine zufälligen Daten benötigen.

---

# 27. Determinism Audit

Wenn dieselben Eingabedaten verarbeitet werden, sollen deterministische Operationen dasselbe Ergebnis liefern.

Beispiel:

```text
same Territory
same Location
same seed
        ↓
same derived battle map
```

Zufall darf dort verwendet werden, wo er bewusst Bestandteil der Simulation ist.

Er darf nicht versehentlich dafür sorgen, dass ein Reload eine andere Welt erzeugt.

---

# 28. Autosave Audit

Falls AdventureForge Autosave besitzt, muss geprüft werden:

- wann gespeichert wird
- welche Daten gespeichert werden
- ob Zwischenzustände gespeichert werden
- ob Tactical-Transient-State versehentlich global persistiert wird
- ob ein Autosave einen konsistenten World State enthält

Ein Autosave darf keinen halbfertigen World-State-Commit erzeugen.

---

# 29. Fehler- und Recovery-Verhalten

Prüfen, was bei einem Fehler während Save/Load passiert.

Beispiel:

```text
World Update
 ↓
Save fails
```

Das System darf nicht unbemerkt behaupten, die Welt sei gespeichert.

Wenn das bestehende System keine Recovery besitzt, soll mindestens:

- Fehler erkannt werden
- Zustand nicht stillschweigend verworfen werden
- Fehler protokolliert werden
- Benutzerzustand nachvollziehbar bleiben

---

# 30. Erwartetes Audit-Ergebnis

Gemini muss nach dem Audit einen Bericht liefern mit:

## A. Persistence Architecture

Welche Speichermechanismen existieren?

## B. Source of Truth

Welche Felder sind autoritativ?

## C. Runtime vs Persistent

Welche Daten sind temporär und welche dauerhaft?

## D. ID Integrity

Sind alle Referenzen reload-sicher?

## E. Save/Load Round Trip

Ist der Zustand nach Reload identisch?

## F. Battle Persistence

Sind BattleInstance und Result korrekt persistent?

## G. Economy Persistence

Bleiben wirtschaftliche Folgen erhalten?

## H. Risks

Welche Inkonsistenzen oder Datenverlust-Risiken bestehen?

## I. Required Changes

Welche **minimalen** Änderungen sind notwendig?

---

# 31. Implementierungsregeln

Nach Abschluss des Audits gilt:

1. Bestehende funktionierende Persistenz weiterverwenden.
2. Keine zweite World-State-Datenbank erzeugen.
3. Keine unnötige Migration großer Komponenten.
4. Keine Änderung an Tactical Combat, wenn nur Persistenz betroffen ist.
5. Keine Änderung an World Map, wenn nur Save/Load betroffen ist.
6. Kleine, isolierte Änderungen bevorzugen.
7. Jede Änderung muss ihre Auswirkungen auf andere Systeme berücksichtigen.
8. Nach jeder Änderung Tests ausführen.
9. Bestehende 60 World-Integration-Assertions dürfen nicht regressieren.
10. Neue Tests müssen die tatsächliche Persistenz prüfen und nicht nur Typen oder Existenz.

---

# 32. Definition of Done

Die Persistenz-Foundation gilt als stabil, wenn folgender Ablauf zuverlässig funktioniert:

```text
CREATE WORLD
    ↓
SAVE
    ↓
LOAD
    ↓
SAME WORLD
```

und:

```text
WORLD CHANGE
    ↓
SAVE
    ↓
APPLICATION RELOAD
    ↓
WORLD CHANGE STILL EXISTS
```

sowie:

```text
BATTLE
    ↓
RESULT
    ↓
WORLD UPDATE
    ↓
SAVE
    ↓
LOAD
    ↓
RESULT STILL APPLIED
```

und:

```text
ECONOMY CHANGE
    ↓
SAVE
    ↓
LOAD
    ↓
ECONOMY STILL CONSISTENT
```

---

# 33. Abschlussprinzip

AdventureForge darf nicht nur während einer laufenden Session eine zusammenhängende Welt darstellen.

Die Welt muss auch nach:

- Save
- Load
- Reload
- Battle
- Economy Update
- Editor-Änderung
- Migration

dieselbe Welt bleiben.

**Eine Welt. Eine Datenbasis. Mehrere Darstellungen. Auch über Neustarts hinweg.**