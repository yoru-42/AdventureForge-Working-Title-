# AdventureForge – World State / Map Implementation Audit

## Zweck

Dieses Dokument ist der **technische Audit- und Implementierungsauftrag** für die in `WORLD_STATE_MAP_ARCHITECTURE.md` definierte gemeinsame Weltarchitektur.

Der bestehende Code soll **nicht neu erfunden oder unnötig umgebaut** werden.

Ziel ist es, den vorhandenen Zustand von AdventureForge zu untersuchen und nur die fehlenden Verbindungen zu einer gemeinsamen, konsistenten Welt-Datenbasis zu ergänzen.

> **Grundsatz:** Eine Welt. Eine Datenbasis. Mehrere Darstellungen.

---

# 1. Verbindliche Referenz

Vor Beginn der Arbeiten muss diese Datei zusammen mit folgendem Dokument gelesen werden:

- `docs/WORLD_STATE_MAP_ARCHITECTURE.md`

Die Architekturdatei definiert das gewünschte Zielbild.
Diese Datei definiert, **wie der bestehende Code darauf geprüft und schrittweise angepasst wird**.

---

# 2. Wichtige Regel: Bestehenden Code zuerst verstehen

Vor jeder Änderung muss der vorhandene Code untersucht werden.

Insbesondere sind die bereits vorhandenen Systeme zu berücksichtigen:

- World Map
- Territory-System
- Location / POI-System
- Codex / Lore
- Factions
- Characters
- Relationships
- Tactical Combat
- Tactical Grid
- Tactical Groups
- Tactical Entities
- Combat Objects
- Economy / EconomyHolding
- World Time / Events
- State Management / Persistence

**Keines dieser Systeme darf pauschal ersetzt werden, nur weil die Architektur einen saubereren Zusammenhang verlangt.**

Wenn bereits vorhandene Daten oder Funktionen verwendet werden können, müssen sie bevorzugt wiederverwendet werden.

---

# 3. Audit zuerst, Implementierung danach

Die Arbeit erfolgt in zwei klar getrennten Phasen.

## Phase A – Audit

Zuerst ausschließlich feststellen:

1. Welche Datenstrukturen existieren bereits?
2. Welche Datenquelle ist aktuell maßgeblich?
3. Welche IDs existieren?
4. Welche Komponenten lesen diese IDs?
5. Welche Komponenten schreiben diese Daten?
6. Wo werden Daten dupliziert?
7. Wo werden Namen statt stabiler IDs verwendet?
8. Wo entstehen Daten automatisch oder per Default?
9. Wo werden Weltinformationen nur aus Text oder Heuristiken abgeleitet?
10. Welche Systeme sind bereits miteinander verbunden?
11. Welche Verbindungen fehlen?
12. Welche bestehenden Systeme können direkt weiterverwendet werden?

**Während Phase A darf kein großer Umbau erfolgen.**

---

# 4. Zu erstellende Audit-Matrix

Für jede relevante Datenstruktur muss eine Tabelle bzw. strukturierte Liste erstellt werden.

| Bereich | Aktuelle Quelle | ID | Wird gelesen von | Wird geschrieben von | Status | Problem |
|---|---|---|---|---|---|---|
| Territory | ? | ? | ? | ? | ? | ? |
| Location | ? | ? | ? | ? | ? | ? |
| Faction | ? | ? | ? | ? | ? | ? |
| Character | ? | ? | ? | ? | ? | ? |
| Battle | ? | ? | ? | ? | ? | ? |
| Tactical Map | ? | ? | ? | ? | ? | ? |
| Economy | ? | ? | ? | ? | ? | ? |
| Lore/Codex | ? | ? | ? | ? | ? | ? |

Die tatsächlichen Typen, Dateien und Felder des Projekts müssen eingesetzt werden.

Keine Felder oder Systeme erfinden, die im Projekt nicht existieren.

---

# 5. Territory-Audit

Das vorhandene `Territory`-Modell ist besonders wichtig und darf nicht unnötig ersetzt werden.

Prüfen:

- `id`
- `parentId`
- Geometrie
- `shapeType`
- `points`
- Terrain / Biome / Klima
- politische Kontrolle
- Besitzer
- Fraktion
- Bevölkerung
- Ressourcen
- Grenzen
- Nachbarn
- Entfernung / Reisezeit
- militärische Werte
- Wirtschaftsdaten
- `tileData`
- Lore-Verknüpfung

Besonders prüfen:

### Geografische Hierarchie

`parentId` beschreibt geografische bzw. administrative Zugehörigkeit.

### Politische Kontrolle

`controlledByFactionId`, Besitzer- und Fraktionsfelder beschreiben politische Kontrolle.

Diese beiden Konzepte dürfen nicht vermischt werden.

Beispiel:

```text
Kingdom A
└── Province B
    └── Village C
```

Das bedeutet nicht automatisch:

```text
Province B = Besitzer
Village C = Fraktion
```

Geografie und politische Kontrolle müssen unabhängig bleiben.

---

# 6. Location / POI-Audit

Es muss geprüft werden, ob bereits ein belastbares Location-/POI-Modell existiert.

Falls vorhanden:

- vorhandene ID verwenden
- vorhandene Territory-Verknüpfung verwenden
- vorhandene Koordinaten verwenden
- vorhandene Typen verwenden
- vorhandene Gebäude-/Objektinformationen verwenden
- vorhandene Lore-Verknüpfungen verwenden

Falls kein ausreichendes Modell existiert, darf **nur die minimale fehlende Brücke** ergänzt werden.

Eine Location benötigt langfristig mindestens eine stabile Identität, über die sie von anderen Systemen referenziert werden kann.

Beispiel:

```text
locationId
territoryId
locationType
coordinates
terrain
objects
```

Die konkreten Feldnamen müssen sich jedoch am bestehenden Projekt orientieren.

---

# 7. Territory → Location prüfen

Prüfen, ob folgende Beziehung bereits zuverlässig funktioniert:

```text
Territory
   ↓
Location / POI
```

Zu prüfen:

- Kann eine Location eindeutig einem Territory zugeordnet werden?
- Bleibt diese Zuordnung beim Speichern erhalten?
- Wird die Location über ihre ID referenziert?
- Können mehrere Locations innerhalb eines Territory existieren?
- Werden Koordinaten korrekt übernommen?
- Werden Terrain und vorhandene Objekte übernommen?

Falls bereits funktionierend: **nicht neu implementieren.**

---

# 8. Location → Battle prüfen

Prüfen, wie aktuell ein Kampf entsteht.

Die Audit-Frage lautet:

> Kann das Spiel eindeutig sagen, **wo genau** ein Kampf stattfindet?

Nicht ausreichend ist:

```text
"Wald"
"Dorf"
"Stadt"
"Hafen"
```

Besser:

```text
territoryId
locationId
battleId
```

mit konkreten Daten der Location.

Falls bereits ein entsprechender Mechanismus existiert, diesen verwenden und nur fehlende IDs ergänzen.

---

# 9. BattleInstance-Audit

Prüfen, ob bereits ein persistierbares Battle-/Encounter-Modell existiert.

Mindestens zu prüfen:

- eindeutige Battle-ID
- World-State-Referenz
- Territory-ID
- Location-ID
- Tactical-Map-ID bzw. Referenz
- Startzeit
- Status
- beteiligte Fraktionen
- beteiligte Charaktere
- beteiligte Gruppen
- Terrain-Snapshot
- Objekte / Umgebung
- Ergebnis
- Verluste
- Schäden
- Gewinner
- Änderungen an Kontrolle / Weltzustand

Wenn kein passendes Modell vorhanden ist, darf ein minimales Modell eingeführt werden.

Es darf jedoch **nicht** sofort ein komplett neues Kampfsystem entstehen.

---

# 10. Tactical Map Audit

Das bestehende Tactical-System muss untersucht werden.

Besonders prüfen:

- `CombatState`
- `TacticalEntity`
- `TacticalGroup`
- `PlacedCombatObject`
- Grid-Dimensionen
- Grid-Koordinaten
- blockierte Felder
- belegte Felder
- Formation
- Gruppenbewegung
- Einzelbewegung
- Split / Formation Change
- vorhandene Map-Objekte

Die vorhandene Formation- und Bewegungslogik soll weiterverwendet werden.

Nicht neu schreiben, wenn sie bereits funktioniert.

---

# 11. Tactical Map darf keine zweite Welt erzeugen

Besonders kritisch prüfen:

```text
Tactical Map
    ↓
eigene erfundene Weltinformationen
```

Das soll vermieden werden.

Die Tactical Map ist eine **lokale Darstellung einer konkreten Location**.

Ideal:

```text
World State
    ↓
Territory
    ↓
Location
    ↓
Battle Instance
    ↓
Tactical Map
```

Die Tactical Map darf lokale technische Daten besitzen, aber kanonische Informationen wie Fraktion, Gebietskontrolle oder Gelände nicht unabhängig neu erfinden.

---

# 12. Terrain-Audit

Prüfen, woher Terrain aktuell kommt.

Priorität:

1. konkrete Location
2. Territory
3. vorhandene Tile-Daten
4. World-State-Daten
5. nur als letzter Fallback Text/Heuristik

Problematisch sind Konstruktionen wie:

```text
if locationName.includes("forest")
```

wenn tatsächlich bereits strukturierte Terrain-Daten existieren.

Solche Heuristiken dürfen nicht als primäre Weltquelle verwendet werden.

Bestehende Heuristiken nur als Fallback behalten, wenn sie weiterhin sinnvoll sind.

---

# 13. Faction-Audit

Prüfen, ob Tactical Combat, World Map und Economy dieselben Fraktions-IDs verwenden.

Beispiel:

```text
Faction A
id = faction_123
```

Alle Systeme sollen möglichst referenzieren:

```text
faction_123
```

und nicht jeweils eigene Objekte mit leicht abweichenden Namen erzeugen.

Besonders prüfen:

- Territory control
- Character faction
- Tactical Group faction
- Economy ownership
- Battle participants
- Codex references

---

# 14. Character-Audit

Prüfen, ob Charaktere in verschiedenen Systemen über dieselbe Character-ID verbunden werden.

Besonders:

- World State
- Character system
- Faction membership
- Relationships
- Tactical Entity
- Tactical Group
- Battle participation
- Economy roles
- Location

Ein Charakter darf im Tactical-System eine technische Entity besitzen, ohne dass dadurch ein zweiter Charakter entsteht.

Beispiel:

```text
Character
characterId = char_42
        ↓
TacticalEntity
entityId = entity_99
sourceCharacterId = char_42
```

---

# 15. Tactical Group Audit

Prüfen, ob Gruppen eindeutig mit ihrer Weltquelle verbunden werden können.

Beispiel:

```text
TacticalGroup
    ↓
sourceFactionId
sourceCharacterIds
sourceGroupId
```

Die tatsächlichen vorhandenen Felder verwenden, falls vorhanden.

Nicht jede Gruppe muss zwingend ein permanentes World-State-Objekt sein. Es muss jedoch nachvollziehbar sein, **woher sie für den Kampf stammt**.

---

# 16. Combat → World State Audit

Der wichtigste fehlende Zusammenhang ist häufig der Rückweg:

```text
Combat
  ↓
Result
  ↓
World State
```

Prüfen, ob nach einem Kampf bereits Änderungen durchgeführt werden können an:

- Charakterzustand
- HP / Verletzungen / Status
- Verluste
- Gruppenstärke
- Fraktionsstärke
- Gebäude
- zerstörte Objekte
- Territory-Kontrolle
- militärische Stärke
- Bevölkerung
- Wirtschaft
- Geschichte / Events

Falls diese Rückkopplung fehlt, soll zunächst eine **klare minimale Result-Pipeline** geschaffen werden.

---

# 17. Snapshot-Prinzip

Beim Start eines Kampfes soll der für den Kampf relevante Weltzustand eingefroren bzw. als Snapshot übernommen werden.

Beispiel:

```text
World State
   ↓
Battle Snapshot
   ↓
Combat
   ↓
Battle Result
   ↓
World State Update
```

Während des Kampfes darf die Tactical Map nicht unkontrolliert die globale Welt verändern.

Nach dem Kampf werden die definierten Ergebnisse angewendet.

---

# 18. Economy-Audit

Das bestehende Economy-System muss untersucht werden, insbesondere:

- `EconomyHolding`
- Territory-Verknüpfung
- Lore-Verknüpfung
- Fraktionsbesitz
- Rollen
- Personal
- Ressourcen
- Aufgaben
- Pflichten
- Einnahmen
- Unterhalt
- Upgrades

Prüfen:

> Ist ein EconomyHolding eine Darstellung eines realen Ortes der Welt oder existiert es unabhängig davon?

Ziel:

```text
Territory / Location
       ↓
EconomyHolding
```

und nicht:

```text
EconomyHolding
       ↓
zweite unabhängige Welt
```

Bestehende Defaults und Presets dürfen weiterhin für die Initialisierung verwendet werden, solange sie anschließend mit der realen Weltquelle verbunden bleiben.

---

# 19. Codex / Lore Audit

Codex und Lore müssen klar von Runtime-Zustand unterschieden werden.

### World State

Aktueller Zustand:

- Wer kontrolliert das Gebiet?
- Wie viele Einheiten sind vorhanden?
- Ist ein Gebäude beschädigt?
- Wer befindet sich an welchem Ort?
- Welche Wirtschaft läuft aktuell?

### Codex / Lore

Kanonische Beschreibung und Wissen:

- Geschichte
- Beschreibung
- Hintergrund
- bekannte Fakten
- Beziehungen / Wissen

Prüfen, ob beide Ebenen aktuell vermischt werden.

Eine Lore-Änderung darf nicht automatisch den Runtime-Zustand verändern, sofern das nicht ausdrücklich vorgesehen ist.

---

# 20. Stable IDs statt Namen

Alle Querverbindungen müssen langfristig über stabile IDs laufen.

Nicht:

```text
"Braunschweig"
"Goblin"
"Königreich Nord"
```

sondern:

```text
location_123
faction_456
territory_789
```

Namen dürfen für Anzeige, Suche und Fallback verwendet werden.

Sie dürfen aber nicht die primäre Referenz zwischen Systemen sein, wenn bereits IDs vorhanden sind.

---

# 21. Datenfluss prüfen

Der vorhandene Code soll gegen folgenden Ziel-Datenfluss geprüft werden:

```text
WORLD STATE
    │
    ├── Territory
    │      │
    │      └── Location
    │              │
    │              └── Battle Instance
    │                       │
    │                       └── Tactical Map
    │                               │
    │                               └── Combat
    │                                      │
    │                                      └── Result
    │                                             │
    └─────────────────────────────────────────────┘
                         WORLD STATE UPDATE
```

Parallel:

```text
WORLD STATE
    ↓
ECONOMY
    ↓
WORLD STATE UPDATE
```

Codex/Lore bleibt die Wissens-/Beschreibungsseite und darf nicht als parallele Runtime-Datenbank verwendet werden.

---

# 22. Priorität der Implementierung

Nach Abschluss des Audits sind die fehlenden Punkte nach folgender Reihenfolge zu bearbeiten.

## Priorität 1 – IDs und gemeinsame Referenzen

Zuerst stabile Verbindungen schaffen zwischen:

```text
Territory
Location
Faction
Character
Battle
```

## Priorität 2 – Location als Brücke

Eine konkrete Location muss sauber zwischen Weltkarte und Tactical Combat vermitteln.

## Priorität 3 – Battle Instance

Ein Kampf muss wissen, wo und warum er stattfindet.

## Priorität 4 – Tactical Snapshot

Die Tactical Map erhält ihre Umgebung aus der konkreten Weltquelle.

## Priorität 5 – Combat Result

Das Kampfergebnis muss strukturiert zurückgegeben werden können.

## Priorität 6 – World Update

Ergebnisse werden kontrolliert auf den World State angewendet.

## Priorität 7 – Economy Integration

Economy liest denselben Weltzustand und erzeugt daraus keine Parallelwelt.

---

# 23. Was ausdrücklich NICHT gemacht werden darf

Ohne vorherigen Audit und Begründung nicht:

- Tactical Combat komplett neu schreiben
- World Map komplett neu schreiben
- Territory-Modell komplett ersetzen
- Economy komplett neu schreiben
- Codex komplett neu schreiben
- bestehende Komponenten nur wegen Architekturästhetik ersetzen
- große Dateien ohne konkreten Grund komplett neu strukturieren
- bestehende funktionierende Formation-Logik ersetzen
- neue parallele Datenbanken erzeugen
- Weltinformationen ausschließlich anhand von Namen generieren
- politische Kontrolle mit geografischer Hierarchie vermischen
- Battle Maps als unabhängige Weltquellen behandeln

---

# 24. Umgang mit großen Dateien

AdventureForge enthält teilweise sehr große Komponenten.

Besonders bei großen Dateien wie Adventure-/Editor-/GameView-Komponenten gilt:

- nur relevante Stellen ändern
- keine komplette Datei unnötig neu generieren
- bestehende Funktionen erhalten
- Änderungen klein und nachvollziehbar halten
- bei Unsicherheit zuerst die Datenflüsse untersuchen

Dies ist besonders wichtig, um Kontextverlust und versehentliches Löschen bestehender Funktionen zu vermeiden.

---

# 25. Erwartetes Audit-Ergebnis

Am Ende von Phase A muss Gemini einen Bericht erzeugen mit:

### A. Bereits vorhanden

Welche Teile der Zielarchitektur funktionieren bereits?

### B. Teilweise vorhanden

Welche Systeme funktionieren, sind aber nicht sauber verbunden?

### C. Fehlend

Welche minimalen Bausteine fehlen?

### D. Doppelte Datenquellen

Wo existieren mehrere Wahrheiten für denselben Sachverhalt?

### E. Kritische Risiken

Welche Stellen könnten bei Änderungen bestehende Funktionalität beschädigen?

### F. Konkreter Implementierungsplan

Welche Dateien müssen in welcher Reihenfolge geändert werden?

---

# 26. Erwartetes Format des Implementierungsplans

Der Plan soll konkret sein.

Beispiel:

```text
1. types.ts
   - bestehendes Territory weiterverwenden
   - fehlende Location-ID ergänzen

2. worldStateStore.ts
   - zentrale Referenz ergänzen

3. TacticalCombatMap.tsx
   - BattleInstance/Location referenzieren
   - bestehende Grid-Logik unverändert lassen

4. tacticalEngine.ts
   - nur fehlende Source-ID-Verknüpfung ergänzen

5. combatResult.ts
   - Ergebnisstruktur ergänzen

6. worldState update
   - Ergebnis kontrolliert anwenden
```

Die tatsächlichen Dateien müssen natürlich anhand des Repository-Zustands bestimmt werden.

---

# 27. Definition of Done

Die Foundation gilt erst als abgeschlossen, wenn mindestens folgender Ablauf nachvollziehbar funktioniert:

```text
Territory
   ↓
Location
   ↓
BattleInstance
   ↓
TacticalMap
   ↓
Combat
   ↓
BattleResult
   ↓
WorldStateUpdate
```

und:

```text
Territory / Location
   ↓
Economy
   ↓
WorldStateUpdate
```

Dabei müssen stabile IDs verwendet werden und die bestehenden Systeme müssen soweit möglich erhalten bleiben.

---

# 28. Testfälle nach der Implementierung

## Test 1 – Normaler Kampf

Ein Kampf findet an einer existierenden Location statt.

Erwartung:

- Location bleibt identifizierbar
- Terrain wird übernommen
- Beteiligte Fraktionen sind korrekt
- Tactical Map kennt ihre Weltquelle
- Kampf erzeugt ein Result
- Result kann auf World State angewendet werden

## Test 2 – Gebäude beschädigt

Ein vorhandenes Gebäude wird im Kampf beschädigt.

Erwartung:

```text
Location
 ↓
Building
 ↓
Combat Damage
 ↓
World State
```

## Test 3 – Territory erobert

Eine Fraktion gewinnt einen relevanten Kampf.

Erwartung:

```text
Battle Result
 ↓
controlledByFactionId
```

Die geografische `parentId`-Hierarchie darf dabei nicht verändert werden.

## Test 4 – Monsterangriff

Eine nichtstaatliche Gruppe greift eine Location an.

Erwartung:

Der Kampf funktioniert ohne dass dafür künstlich ein neues Territory oder eine neue politische Fraktion erzeugt werden muss.

## Test 5 – Bestehende Location mit Objekten

Eine Location besitzt bereits Terrain und platzierte Objekte.

Erwartung:

Die Tactical Map verwendet diese Informationen, anstatt eine vollständig unabhängige Umgebung zu erzeugen.

---

# 29. AI-Arbeitsregel

Vor jeder Änderung an World Map, Tactical Combat oder Economy muss Gemini intern bzw. im Arbeitsbericht folgende Fragen beantworten können:

1. **Was ist die Datenquelle?**
2. **Welche ID identifiziert das Objekt?**
3. **Wer liest die Daten?**
4. **Wer schreibt die Daten?**
5. **Welche anderen Systeme hängen davon ab?**
6. **Ist die Änderung lokal oder verändert sie den globalen World State?**
7. **Falls global: Wie wird die Änderung kontrolliert zurückgeschrieben?**

Wenn diese Fragen nicht beantwortet werden können, soll nicht einfach eine neue Datenstruktur erfunden werden.

---

# 30. Schlussprinzip

AdventureForge soll keine Sammlung einzelner Generatoren sein.

Es soll eine zusammenhängende Welt sein, die aus mehreren Perspektiven dargestellt wird.

```text
             WORLD STATE
                  │
       ┌──────────┼──────────┐
       │          │          │
    WORLD MAP   ECONOMY   CHARACTERS
       │                     │
    LOCATION              FACTIONS
       │                     │
    BATTLE INSTANCE          │
       │                     │
  TACTICAL COMBAT────────────┘
       │
     RESULT
       │
       └────────→ WORLD STATE UPDATE
```

**Eine Welt. Eine Datenbasis. Mehrere Darstellungen.**

Diese Regel ist für alle weiteren AdventureForge-Systeme verbindlich.