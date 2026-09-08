# ADVENTUREFORGE – TRAVEL & LOCATION SYSTEM

## Zweck

AdventureForge besitzt inzwischen einen zentralen World State, eine Weltzeitsimulation, Territorien, Orte, Events, Wirtschaft und die Verbindung zum taktischen Kampfsystem.

Der nächste Schritt ist die **räumliche Verbindung dieser Systeme**.

Der Spieler soll sich nicht nur textlich von Ort zu Ort bewegen. AdventureForge muss nachvollziehbar wissen:

- wo sich der Spieler befindet
- in welchem Territory dieser Ort liegt
- welche Orte miteinander verbunden sind
- welche Route benutzt wird
- wie weit das Ziel entfernt ist
- wie lange die Reise dauert
- welches Gelände die Reise beeinflusst
- welche Gefahren oder Ereignisse unterwegs möglich sind
- wann der Spieler tatsächlich am Ziel ankommt

Dabei darf kein zweiter Weltzustand entstehen.

**World State bleibt die einzige autoritative Quelle.**

---

# 1. Leitprinzip

```text
WORLD STATE
    ↓
TERRITORY
    ↓
LOCATION
    ↓
CONNECTION / ROUTE
    ↓
TRAVEL
    ↓
WORLD SIMULATION
    ↓
NEW LOCATION
```

Eine Reise ist ein **World-State-Vorgang** und kein reiner Textgenerator.

Die Reisezeit wird ausschließlich über den bereits bestehenden `WorldSimulationService` fortgeschrieben.

Es darf keine eigene parallele Reise-Zeitlogik geben.

---

# 2. Zuerst bestehenden Code prüfen

Vor Implementierung muss der aktuelle Code vollständig auf vorhandene Strukturen geprüft werden.

Insbesondere suchen nach:

- `WorldLocationReference`
- `Territory.placeMarkers`
- `WorldSetting.locations`
- `dynamicWorldState.locations`
- `connections`
- `routeFrom`
- `distance`
- `travelTime`
- `direction`
- `player.location`
- `currentLocation`
- `activeLocation`
- `locationId`
- `territoryId`
- `formatDisplayLocationName`
- vorhandener Reise-/Bewegungslogik
- vorhandener Kartenbewegung
- vorhandener Reisezeitberechnung
- `WorldSimulationService`
- `GameTurnService`

Nicht mehrere bereits vorhandene Systeme parallel neu bauen.

Wenn bestehende Felder oder Services die Anforderungen bereits erfüllen, sollen diese erweitert bzw. vereinheitlicht werden.

---

# 3. Autoritative Ortsstruktur

Die räumliche Hierarchie soll logisch dieser Struktur folgen:

```text
WorldSetting
 └── Territory
      └── Location / POI
           ├── Buildings / POIs
           ├── NPCs
           ├── Factions
           └── Economy
```

Wichtig:

`Territory.parentId` beschreibt geografische Hierarchie.

`Territory.controlledByFactionId` beschreibt politische Kontrolle.

Diese beiden Bedeutungen dürfen nicht vermischt werden.

---

# 4. Location Identity

Jeder spielrelevante Ort benötigt eine stabile ID.

Beispiel:

```ts
interface WorldLocationReference {
  id: string;
  name: string;
  type: string;
  territoryId?: string;
  x?: number;
  y?: number;
}
```

Die konkrete vorhandene TypeScript-Struktur hat Vorrang. Nicht blind diese Struktur duplizieren.

Regeln:

- IDs statt Namen als Referenz verwenden.
- Namen dürfen geändert werden, ohne Referenzen zu zerstören.
- Ein Ort darf nicht gleichzeitig über mehrere unabhängige IDs als derselbe Ort geführt werden.
- Deterministische/stabile IDs für persistente World-State-Objekte.

---

# 5. Spielerposition

Der World State muss eine eindeutige aktuelle Spielerposition besitzen.

Mindestens logisch erforderlich:

```text
currentLocationId
currentTerritoryId
```

Falls bereits eine geeignete Struktur existiert, diese verwenden.

`currentTerritoryId` sollte aus der aktuellen Location ableitbar sein, darf aber als optimierter Zustand gespeichert werden, wenn bestehende Architektur dies benötigt.

Wichtig ist, dass keine widersprüchliche Position möglich ist.

Beispiel:

```text
currentLocationId = loc_village_01
→ Location gehört zu territory_02
→ currentTerritoryId muss territory_02 entsprechen
```

---

# 6. Location Connections

Orte müssen miteinander verbunden werden können.

Konzeptionell:

```ts
interface LocationConnection {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  distanceKm?: number;
  travelTimeMinutes?: number;
  terrain?: string[];
  dangerLevel?: number;
  isBlocked?: boolean;
}
```

Die tatsächliche vorhandene Datenstruktur hat Vorrang.

Verbindungen sollen gerichtet oder ungerichtet sein können, abhängig davon, was die Welt benötigt.

Beispiele:

```text
Dorf A ↔ Waldweg ↔ Stadt B

Stadt B ↔ Passstraße ↔ Bergfestung

Hafen C ↔ Schiffsroute ↔ Insel D
```

Eine Verbindung ist nicht automatisch eine Straße.

Mögliche Verbindungstypen:

- Straße
- Weg
- Pfad
- Gebirgspass
- Flussweg
- Schiffsroute
- Fähre
- Tunnel
- Portal / magische Verbindung
- unbekannter Pfad

Nur vorhandene/erlaubte Verbindungstypen verwenden; keine zufälligen neuen Regeln erfinden.

---

# 7. Reisezeit

Reisezeit soll möglichst aus konkreten World-State-Daten stammen.

Priorität:

```text
1. explizite Reise-/Verbindungsdaten
2. Entfernung + definierte Bewegungsgeschwindigkeit
3. Gelände-/Routenmodifikatoren
4. bestehende Welt-/Kampagnenregeln
5. nur als letzter Fallback eine bestehende Standardannahme
```

Nicht primär aus dem Text ableiten.

Beispiel:

```text
Entfernung: 12 km
Grundgeschwindigkeit: 4 km/h
Gelände: Wald × 1.5

→ berechnete Reisezeit
```

Die genaue Formel muss an vorhandene AdventureForge-Regeln angepasst werden.

Keine neue widersprüchliche Geschwindigkeitslogik erzeugen, wenn bereits eine existiert.

---

# 8. Reise als Spielerzug

Eine Reise ist ein Spielerzug.

Beispiel:

```text
Spieler:
"Ich reise nach Nordhafen."
```

Der Produktionsfluss soll grundsätzlich sein:

```text
User Message
    ↓
GameTurnService
    ↓
Travel Resolution
    ↓
berechnete Reisezeit
    ↓
WorldSimulationService
    ↓
Events während der Reise
    ↓
aktualisierte Zeit
    ↓
neue Spielerposition
    ↓
Gemini
    ↓
Parser
    ↓
Save
```

Wichtig:

**Die Reisezeit darf nicht zusätzlich nach dem Simulationsschritt noch einmal auf WorldTime addiert werden.**

Die Reiseauflösung liefert die Dauer an den zentralen Turn-/Simulationspfad.

---

# 9. Reisezeit und Events

Wenn eine Reise beispielsweise 180 Minuten dauert, soll die Simulation den Zeitraum als echten Simulationsschritt behandeln.

Dadurch können geplante Events innerhalb des Zeitraums ausgelöst werden.

Beispiel:

```text
08:00 Start
↓
Reise 180 Minuten
↓
09:15 geplantes Ereignis
↓
10:30 weiteres Ereignis
↓
11:00 Ankunft
```

Der bestehende Event-Mechanismus entscheidet, welche Events verarbeitet werden.

Reiselogik darf keinen zweiten Event-Processor erfinden.

---

# 10. Reise darf nicht automatisch teleportieren

Wenn eine Verbindung zwischen Start und Ziel nicht existiert, darf das System nicht einfach so tun, als sei der Spieler angekommen.

Mögliche Ergebnisse:

- direkte Verbindung gefunden
- Route über mehrere Verbindungen gefunden
- Ziel erreichbar, aber Route blockiert
- Ziel nicht erreichbar
- unbekannter Ort

Die Antwort muss zum tatsächlichen World State passen.

---

# 11. Routen

Wenn mehrere Verbindungen existieren, soll die Route nachvollziehbar sein.

Beispiel:

```text
Dorf A
 ↓
Waldweg
 ↓
Kreuzung
 ↓
Landstraße
 ↓
Stadt B
```

Die Route kann zunächst als Liste von Location-IDs bzw. Connection-IDs aufgelöst werden.

Ein komplexes Navigationssystem ist in dieser Phase nicht erforderlich.

Priorität:

1. korrekt
2. deterministisch
3. nachvollziehbar
4. erst später optimieren

---

# 12. Gelände und Gefahren

Gelände kann die Reise beeinflussen.

Mögliche Faktoren:

- Wald
- Gebirge
- Sumpf
- Wüste
- Schnee
- Straße
- offenes Land
- Meer

Gefahren können später beispielsweise sein:

- Banditen
- Monster
- politische Kontrolle
- Kriegsgebiet
- Naturgefahren
- Wetter
- Fraktionskontrollen

Aber:

**Keine neue Zufalls-Event-Engine bauen.**

Die Reise liefert nur die relevanten World-State-Faktoren an die bestehende Simulation.

---

# 13. Politische Kontrolle

Eine Reise muss den aktuellen politischen Zustand berücksichtigen.

Beispiel:

```text
Startterritorium: kontrolliert von Fraktion A
Zielterritorium: kontrolliert von Fraktion B
```

Das kann Auswirkungen auf die Reisebeschreibung oder spätere Regeln haben.

Die Kontrolle wird immer über die bestehenden Faction-/Territory-IDs gelesen.

Keine Namen als autoritative politische IDs verwenden.

---

# 14. Wirtschaftliche Auswirkungen

Die Reise selbst darf nicht automatisch Wirtschaftsdaten verändern, außer vorhandene Spielregeln verlangen dies.

Beispielsweise kann später ein Handelssystem Reisen mit Handelsrouten verbinden.

Für diese Phase gilt:

```text
Reise → WorldTime / Position / Events
```

Nicht:

```text
Reise → beliebige Wirtschaftswerte verändern
```

Nur bereits definierte World-State-Regeln anwenden.

---

# 15. Battle Integration

Wenn während einer Reise ein Kampf entsteht, soll daraus eine bestehende `BattleInstance` entstehen.

Grundstruktur:

```text
Travel
 ↓
Event / Encounter
 ↓
BattleInstance
 ↓
Tactical Combat
 ↓
Combat Result
 ↓
WorldIntegrationService
 ↓
World State
```

Das taktische System darf keinen separaten Weltzustand für die Position des Spielers erzeugen.

---

# 16. Ankunft

Nach erfolgreicher Reise muss der Spieler tatsächlich am Zielort stehen.

Mindestens aktualisieren:

```text
currentLocationId = targetLocationId
currentTerritoryId = targetTerritoryId
```

Falls während der Reise ein Ereignis die Route verändert oder der Spieler vom Ziel abgehalten wird, muss der tatsächlich erreichte Ort gespeichert werden.

Nicht einfach immer das ursprünglich gewünschte Ziel setzen.

---

# 17. Gemini-Kontext

Nach der Reise muss Gemini den aktualisierten World State erhalten.

Insbesondere:

- aktueller Ort
- aktuelles Territory
- aktuelle WorldTime
- politische Kontrolle
- aktive Events
- relevante Reiseereignisse
- relevante NPCs/Faktionen
- relevante Wirtschaftsinformationen

Gemini entscheidet nicht selbst über die kanonische Position des Spielers.

Der World State entscheidet.

---

# 18. Parser

Der Parser darf den aktualisierten Reisezustand nicht überschreiben.

Wenn Gemini beispielsweise schreibt:

> "Du erreichst Nordhafen."

ist das nur dann korrekt, wenn die Reiseauflösung den Spieler tatsächlich nach Nordhafen gesetzt hat.

Der Parser soll keine eigene Reisezeit und keine eigene Positionslogik erfinden.

---

# 19. Reiseabbruch

Ein Reisevorgang kann beendet werden durch:

- Kampf
- Event
- Blockade
- Spieleraktion
- unbekannte Route
- sonstige bestehende World-State-Regel

Dann muss der tatsächliche Zwischenstand gespeichert werden.

Beispiel:

```text
Start Dorf A
↓
Route Richtung Stadt B
↓
Kampf bei Waldpass
↓
BattleInstance
↓
Kampf beendet
↓
Spieler bleibt am Waldpass
```

Nicht automatisch weiter nach Stadt B teleportieren.

---

# 20. Keine automatische Weltbewegung

Wichtig im bestehenden AdventureForge-Zeitmodell:

**Die Welt läuft nicht selbstständig weiter.**

Reisezeit vergeht nur, weil der Spieler einen gültigen Zug ausführt.

Kein:

- `setInterval`
- Hintergrund-Ticker
- automatischer Reiseprozess
- Render-basierter Zeitfortschritt
- Gemini-basierter Zeitfortschritt

---

# 21. Persistenz

Nach erfolgreicher Reise muss der vollständige neue Zustand gespeichert werden.

Mindestens:

- WorldTime
- Spielerposition
- Territory-Zugehörigkeit
- Eventstatus
- BattleInstances, falls vorhanden
- relevante World Facts
- relevante Location-Zustände

Save/Reload muss denselben Zustand wiederherstellen.

---

# 22. Fehlerverhalten

Wenn Travel Resolution fehlschlägt:

- kein falscher Zeitfortschritt
- kein falscher Ortswechsel
- kein Gemini-Erfolg mit einem nicht existierenden Zustand
- kein erfolgreicher Save eines halbfertigen Spielerzugs

Der bestehende `GameTurnService` bleibt der atomare Rahmen.

---

# 23. Tests

Mindestens folgende Tests hinzufügen.

### Test A – Direkte Reise

Start:

```text
Dorf A
08:00
```

Ziel:

```text
Stadt B
```

Erwartung:

- gültige Route
- berechnete Reisezeit
- genau ein Simulationsschritt
- korrekte WorldTime
- Spieler am Ziel

### Test B – Mehrere Verbindungen

A → B → C.

Erwartung: Route wird korrekt aufgelöst.

### Test C – Nicht erreichbares Ziel

Erwartung:

- keine Teleportation
- kein falscher Zeitfortschritt
- kontrollierte Fehlermeldung

### Test D – Event während Reise

Reise überschreitet geplantes Event.

Erwartung:

- Event wird über bestehende Simulation verarbeitet
- kein doppeltes Event Processing

### Test E – Reiseabbruch durch Kampf

Erwartung:

- BattleInstance wird korrekt erzeugt
- Spielerposition bleibt am tatsächlichen Ort
- kein automatisches Weiterreisen

### Test F – politische Kontrolle

Route durch mehrere Territorien.

Erwartung: aktuelle Control IDs werden korrekt gelesen.

### Test G – Save/Reload

Reise durchführen → speichern → neu laden.

Erwartung: identischer Ort + WorldTime + relevante Zustände.

### Test H – Gemini Context

Nach Reise muss Gemini den aktualisierten Ort und die neue WorldTime erhalten.

### Test I – kein Double Step

Eine Reiseaktion ausführen.

Erwartung:

```text
WorldSimulationService.runSimulationStep() === 1
```

### Test J – Fehlerfall

Travel Resolution gezielt fehlschlagen lassen.

Erwartung:

- kein World-State-Save
- keine falsche Zeit
- keine falsche Position

---

# 24. Implementierungsstrategie

Nicht alles auf einmal neu bauen.

Empfohlene Reihenfolge:

### Phase 1 – Audit

Vorhandene Location-, Connection-, Position- und Reise-Daten erfassen.

### Phase 2 – Canonical Location State

Sicherstellen, dass Spielerposition eindeutig und persistent ist.

### Phase 3 – Route Resolution

Bestehende Connections verwenden und fehlende minimale Infrastruktur ergänzen.

### Phase 4 – Travel Duration

Reisezeit deterministisch aus World-State-Daten bestimmen.

### Phase 5 – GameTurnService Integration

Reise als normalen atomaren Spielerzug integrieren.

### Phase 6 – Events / Combat

Bestehende Simulation und BattleInstance verwenden.

### Phase 7 – Persistence Tests

Save/Reload und Fehlerfälle testen.

---

# 25. Was NICHT gemacht werden soll

In dieser Aufgabe nicht neu bauen:

- neues Kampfsystem
- neue Wirtschaft
- neue Weltzeit
- neue Event Engine
- neues NPC-System
- neues Fraktionssystem
- neues Kartenformat
- neues Codex-System
- automatische Echtzeit-Simulation
- große UI-Neugestaltung

Vorhandene Systeme verbinden und nur dort erweitern, wo die Reise-/Ortslogik es zwingend benötigt.

---

# 26. Abschlussbericht

Nach der Implementierung bitte konkret berichten:

1. Welche vorhandenen Location-/Connection-Strukturen gefunden wurden.
2. Welche Dateien geändert wurden.
3. Welche neuen Strukturen tatsächlich notwendig waren.
4. Wie Spielerposition gespeichert wird.
5. Wie eine Route aufgelöst wird.
6. Wie Reisezeit berechnet wird.
7. Wie die Reise mit `GameTurnService` und `WorldSimulationService` verbunden ist.
8. Wie Events während der Reise verarbeitet werden.
9. Wie Reiseabbruch funktioniert.
10. Wie BattleInstance angebunden wird.
11. Wie Save/Reload getestet wurde.
12. Ergebnisse der Tests A–J.
13. TypeScript Build.
14. Lint.
15. Bestehende Tests.
16. Keine doppelte Zeitfortschreibung.

Nicht nur "Tests bestanden" melden. Kurz beschreiben, was tatsächlich ausgeführt wurde.

---

# Definition of Done

- [ ] Spielerposition ist eindeutig und persistent.
- [ ] Location IDs sind stabil.
- [ ] Territory und Location sind korrekt verknüpft.
- [ ] vorhandene Connections werden genutzt.
- [ ] Route kann deterministisch aufgelöst werden.
- [ ] Reisezeit stammt aus World-State-Daten.
- [ ] Reise ist ein einziger GameTurnService-Spielerzug.
- [ ] genau ein WorldSimulationService-Schritt pro Reiseaktion.
- [ ] WorldTime wird nicht doppelt verändert.
- [ ] Events während der Reise laufen über die bestehende Simulation.
- [ ] Reiseabbruch speichert den tatsächlichen Zustand.
- [ ] BattleInstance verwendet den bestehenden Combat-/World-State-Pfad.
- [ ] Gemini erhält den aktualisierten World State.
- [ ] Parser überschreibt die Reiseposition nicht.
- [ ] Save/Reload funktioniert.
- [ ] Fehlerfälle führen nicht zu falschen Saves.
- [ ] Tests A–J erfolgreich.
- [ ] Build erfolgreich.
- [ ] Lint erfolgreich.
- [ ] bestehende Tests weiterhin erfolgreich.

## Leitprinzip

> **Eine Reise ist kein Teleport und kein Text. Eine Reise ist ein Spielerzug innerhalb derselben Welt.**

**Eine Welt. Ein Ort. Eine Route. Ein Zeitfortschritt. Ein Save.**
