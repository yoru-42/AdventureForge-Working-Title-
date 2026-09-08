# Travel System Review & Fix

## Zweck

Diese Datei ist eine gezielte Korrekturprüfung der aktuellen Travel-Implementierung. Das bestehende System soll **nicht neu gebaut** werden. Die bereits funktionierende Integration mit `GameTurnService`, `WorldSimulationService`, World State, Gemini, Parser und Persistence bleibt erhalten.

Ziel ist, die Reiseauflösung so zu korrigieren, dass eine Reise vollständig aus dem vorhandenen World State abgeleitet wird und niemals künstliche Wege, Entfernungen oder Zeitwerte erfindet.

> Eine Reise ist kein Teleport und kein Text. Eine Reise ist ein Spielerzug innerhalb derselben Welt.

---

## 1. Aktueller Stand – erhalten

Die vorhandene Implementierung hat bereits wichtige Teile korrekt umgesetzt:

- Travel ist in `GameTurnService` integriert.
- Travel verwendet genau **einen** `WorldSimulationService.runSimulationStep(...)` pro Reisezug.
- Die aktuelle Position wird über bestehende Location-/Territory-Strukturen bestimmt.
- World Time wird über die vorhandene Simulation fortgeschrieben.
- Gemini und Parser können mit dem aktualisierten World State arbeiten.
- Unreachable Travel darf keinen Zeitfortschritt erzeugen.
- Bestehende World-State-Strukturen sollen wiederverwendet werden.
- Mehrsegment-Routen über `world.connections` sind bereits vorgesehen.
- Blockierte Connections werden bei der Pfadsuche berücksichtigt.

Diese Teile dürfen nicht unnötig ersetzt oder dupliziert werden.

---

# 2. Kritische Korrekturen

## 2.1 Keine künstliche Route über Koordinaten

Die aktuelle Implementierung besitzt einen Fallback, der bei fehlender Connection anhand von X/Y-Koordinaten eine direkte Route erfindet.

Das ist nicht zulässig.

### Vorgabe

Wenn zwischen Start und Ziel keine nutzbare Route aus den vorhandenen World-State-Connections existiert:

```text
keine Connection
→ keine Reise
→ keine Zeitänderung
→ keine Positionsänderung
→ kein Save
```

Koordinaten dürfen für Darstellung, Distanzberechnung innerhalb einer **bereits bekannten Connection** oder zukünftige Map-Funktionen verwendet werden, aber niemals selbst eine Route erzeugen.

Den Coordinate-Fallback vollständig entfernen.

---

## 2.2 Keine erfundenen Distanz- oder Zeitwerte

Die aktuelle Implementierung verwendet Fallbackwerte wie beispielsweise:

- 15 km für eine direkte Connection ohne Distanz
- 10 km für einen Route-Segment-Fallback
- 30 Minuten als allgemeiner Travel-Fallback

Solche Werte verändern die Welt ohne Grundlage im World State.

### Vorgabe

Travel-Dauer muss deterministisch aus vorhandenen Daten entstehen.

Priorität:

1. explizite `travelTimeMinutes` / vorhandene Dauer der Connection
2. explizite Distanz + definierte Bewegungsgeschwindigkeit
3. vorhandene Terrain-/Routenregeln
4. vorhandene Kampagnen-/World-Regeln
5. wenn keine ausreichenden Daten vorhanden sind: **Route nicht auflösbar**

Kein erfundener Kilometerwert und keine pauschale Default-Reisezeit.

Eine Connection ohne ausreichende Daten darf nicht stillschweigend zu einer künstlichen Reise werden.

---

# 3. Routing muss Travel Time berücksichtigen

Die aktuelle BFS-Suche minimiert primär die Anzahl der Connections.

Das ist für AdventureForge nicht korrekt.

Beispiel:

```text
Route A: 2 Segmente → 4 Stunden
Route B: 3 Segmente → 90 Minuten
```

Die kürzere Reisezeit soll Route B wählen, sofern keine andere World-Regel dagegen spricht.

## Vorgabe

Eine gewichtete deterministische Pfadsuche verwenden, vorzugsweise **Dijkstra**.

Gewicht:

```text
travelTimeMinutes
```

Für jede Connection muss die effektive Reisezeit vor der Auswahl berechnet werden.

### Determinismus

Bei exakt gleicher Reisezeit muss ein stabiler Tie-Breaker verwendet werden, z. B.:

1. kleinere Gesamtstrecke
2. danach stabile Connection-/Location-ID-Reihenfolge

Keine zufällige Routenauswahl.

---

# 4. Blockierte Direct Connection darf Alternativroute nicht verhindern

Aktuell kann eine direkte Connection zwischen Start und Ziel als `blocked` erkannt werden und die Funktion sofort `blocked` zurückgeben.

Das ist falsch, wenn eine andere nutzbare Route existiert.

### Vorgabe

Eine blockierte Connection wird aus dem Routing-Graph entfernt.

Danach wird geprüft, ob eine alternative Route existiert.

```text
Direct Connection blocked
        ↓
Connection aus Graph entfernen
        ↓
alternative Route suchen
        ↓
gefunden → alternative Route verwenden
nicht gefunden → blocked/unreachable
```

Die Entscheidung muss auf dem gesamten Graphen beruhen, nicht nur auf der Direct Connection.

---

# 5. Travel darf nicht über unbekannte Orte springen

Eine Route darf ausschließlich über echte vorhandene Locations/Connections führen.

Nicht erlaubt:

- Ziel direkt setzen, obwohl keine Route existiert
- Koordinatenroute erfinden
- Namen als ausreichenden Beweis für eine Verbindung verwenden
- fehlende Location durch eine Textbeschreibung ersetzen

Stable IDs bleiben die primäre Referenz.

Namen dürfen für Benutzer-/Parser-Eingaben auf eine vorhandene Location aufgelöst werden, danach muss die Reise intern mit den stabilen IDs arbeiten.

---

# 6. Unterbrechung einer langen Reise

Eine Reise über mehrere Connections darf nicht einfach am Endziel landen, wenn während des Reiseintervalls ein Battle/Event die Reise unterbricht.

Grundregel:

```text
Start
 ↓
Segment 1
 ↓
Segment 2
 ↓
Ereignis / Battle
 ↓
Reise stoppt dort
```

Der Spieler darf nicht zum eigentlichen Ziel teleportiert werden.

## Vorgabe

Die Travel-Logik muss die Reiseprogression kennen:

- aktuelle Connection
- bereits vergangene Reisezeit
- verbleibende Reisezeit
- erreichter Travel-Punkt / Location
- ggf. BattleInstance

Wenn die bestehende WorldSimulation einen BattleInstance erzeugt, muss dessen Location/Context verwendet werden, sofern diese eindeutig vorhanden ist.

Falls die Simulation nur an einem bekannten Location-/Event-Punkt unterbrechen kann, darf die Reise auch nur dort gestoppt werden. Es darf keine erfundene Zwischenposition entstehen.

### Wichtig

Keine automatische Weiterreise nach einem Battle.

```text
Battle während Travel
→ Travel stoppt
→ BattleInstance bleibt bestehen
→ Player bleibt am tatsächlichen Unterbrechungspunkt
→ Save
```

Eine spätere Fortsetzung ist ein neuer Spielerzug.

---

# 7. Keine Circular Dependency

Aktuell besteht eine problematische Abhängigkeit:

```text
GameTurnService
    ↓
TravelService
    ↓
GameTurnService
```

`travelService.ts` importiert `GameTurnService`, während `gameTurnService.ts` `TravelService` importiert.

Diese zyklische Modulabhängigkeit muss entfernt werden.

## Ziel

TravelService darf nicht von GameTurnService abhängig sein, wenn diese Abhängigkeit nur für Typen, Hilfsfunktionen oder Rückgabetypen benötigt wird.

Mögliche Lösung:

- gemeinsame Interfaces in eine neutrale Datei verschieben
- reine Travel-Typen separat halten
- benötigte Hilfslogik extrahieren
- oder TravelService so strukturieren, dass es ausschließlich seine eigenen Inputs/Outputs verwendet

Keine funktionale Duplizierung des gesamten Turn-Systems.

Nach der Änderung muss die Laufzeit insbesondere in Production-Builds geprüft werden.

---

# 8. GameTurnService bleibt der Einstiegspunkt

Die Architektur bleibt:

```text
User Message
    ↓
GameTurnService
    ↓
Travel Resolution
    ↓
Travel Duration
    ↓
WorldSimulationService – genau einmal
    ↓
Travel Event / Battle
    ↓
aktualisierte Position
    ↓
Gemini
    ↓
Parser
    ↓
Save
```

TravelService soll die Reise auflösen und ausführen, aber keine zweite parallele Turn-/Simulation-Logik erzeugen.

---

# 9. Genau ein Zeitfortschritt

Pro Travel-Spielerzug gilt weiterhin:

```text
1 × WorldSimulationService.runSimulationStep
```

Nicht erlaubt:

- Simulation vor Travel und danach erneut
- Parser erzeugt zusätzliche Reisezeit
- Gemini erzeugt zusätzliche Reisezeit
- UI erzeugt zusätzliche Reisezeit
- TravelService + GameTurnService simulieren beide
- Event-Verarbeitung zählt als zweiter Spielerzug

Die komplette Reisezeit wird in **diesem einen Simulation Step** übergeben.

---

# 10. Parser darf Travel-Zustand nicht überschreiben

Nach erfolgreicher Travel-Simulation ist der aktualisierte World State autoritativ.

Der Parser darf nicht:

- die Reisezeit zurücksetzen
- den Spieler wieder an den Start setzen
- das Ziel ändern
- einen nicht gereisten Ort eintragen
- eine alternative Route erfinden

Wenn Parserdaten mit dem Travel-Ergebnis kollidieren, muss der kanonische Travel-/World-State Vorrang haben.

---

# 11. Fehler- und Atomicity-Verhalten

Wenn Travel nicht aufgelöst werden kann:

```text
World Time unverändert
Player Position unverändert
kein Battle künstlich erzeugt
kein Save eines veränderten World State
```

Wenn Simulation oder Gemini/Parser während des produktiven Turns fehlschlägt, darf kein halbfertiger Travel State persistiert werden.

Die bereits bestehende Atomicity des `GameTurnService` muss erhalten bleiben.

---

# 12. Tests – gezielte Korrekturtests

Die vorhandenen Travel-Tests bleiben bestehen. Zusätzlich müssen folgende Fälle explizit getestet werden.

## A – Keine Connection

Start und Ziel haben keine Verbindung.

Erwartung:

- unreachable
- 0 Minuten Fortschritt
- Position unverändert

## B – Keine Coordinate-Teleport-Route

Start und Ziel besitzen X/Y-Koordinaten, aber keine Connection.

Erwartung:

- unreachable
- keine Zeitänderung
- keine Bewegung

Dieser Test beweist, dass der Coordinate-Fallback entfernt wurde.

## C – Fehlende Distanz/Dauer

Eine Connection besitzt keine ausreichenden Daten für eine belastbare Travel-Dauer.

Erwartung:

- keine erfundene 10/15-km- oder 30-Minuten-Route
- deterministischer Fehler/unauflösbare Route
- kein Zeitfortschritt

## D – Schnellere Route gewinnt

Mehrere nutzbare Routen existieren.

Beispiel:

```text
Route A: 2 Hops / 240 min
Route B: 3 Hops / 90 min
```

Erwartung:

```text
Route B
```

## E – Blockierte Direct Connection mit Alternativroute

Direct Connection blockiert, alternative Route vorhanden.

Erwartung:

- Direct Connection wird ignoriert
- Alternative Route wird gewählt

## F – Alle Routen blockiert

Keine nutzbare Route vorhanden.

Erwartung:

- unreachable/blocked
- kein Zeitfortschritt
- keine Positionsänderung

## G – Reiseunterbrechung

Mehrsegment-Reise erzeugt während der Simulation ein Battle/Event.

Erwartung:

- Reise endet am tatsächlichen bekannten Unterbrechungspunkt
- Ziel wird nicht erreicht
- BattleInstance bleibt bestehen
- keine automatische Weiterreise

## H – Ein Simulation Step

Eine gültige Travel-Aktion führt zu genau einem Aufruf von `runSimulationStep`.

## I – Save/Reload

Nach erfolgreicher Reise:

- aktuelle Location
- aktuelles Territory
- World Time
- Event/Battle State

müssen nach Save/Reload identisch bleiben.

## J – Circular Dependency / Production Build

Production Build und Runtime prüfen, dass Travel/GameTurn ohne zyklische Modulprobleme funktionieren.

---

# 13. Bestehende Tests dürfen nicht beschädigt werden

Nach den Travel-Korrekturen müssen mindestens ausgeführt werden:

- alle bestehenden World-State-Tests
- World-Simulation-Tests
- GameTurn-Tests
- Persistence-Tests
- Tactical-Tests
- bestehende Travel-Tests
- neue Travel-Korrekturtests A-J
- TypeScript/Compile
- Lint
- Production Build

Keine bestehende Funktion darf nur deshalb entfernt oder umgangen werden, damit die neuen Travel-Tests bestehen.

---

# 14. Was NICHT gebaut werden soll

Diese Änderung ist eine Korrektur des bestehenden Travel-Systems.

Nicht Teil dieser Aufgabe:

- neues Kampfsystem
- neue Economy Engine
- neue Event Engine
- neue World-Time Engine
- neue NPC Engine
- neue Faction Engine
- neue Kartenstruktur
- neues Codex-System
- Echtzeit-Simulation
- Hintergrund-Timer
- Render-Tick-Simulation
- große UI-Neugestaltung
- zufällige Reiseereignisse als separates System
- neues Parallel-Travel-System

Bestehende Systeme verwenden.

---

# 15. Abschlussbericht für Gemini

Nach der Implementierung muss Gemini einen konkreten Bericht liefern mit:

1. welche bestehenden Travel-Strukturen gefunden wurden
2. welche Dateien geändert wurden
3. welche neuen Dateien/Typen ggf. notwendig waren
4. wie der Coordinate-Fallback entfernt wurde
5. wie künstliche Distanz-/Zeit-Fallbacks entfernt wurden
6. wie gewichtetes Routing implementiert wurde
7. wie Blocked Connections behandelt werden
8. wie Travel-Unterbrechungen bestimmt werden
9. wie die Circular Dependency entfernt wurde
10. wie `GameTurnService` und `TravelService` jetzt voneinander getrennt sind
11. Bestätigung: genau ein `WorldSimulationService`-Step pro erfolgreicher Reise
12. Parser-/World-State-Authority
13. Atomicity und Save-Verhalten
14. Ergebnisse der Tests A-J
15. Ergebnisse aller bestehenden Tests
16. Compile/Lint/Production-Build
17. Bestätigung, dass keine Coordinate-Teleport-Fallbacks mehr existieren
18. Bestätigung, dass keine erfundenen 10/15-km-/30-Minuten-Werte mehr für Travel verwendet werden

---

# 16. Akzeptanzkriterium

Die Travel-Implementierung ist erst abgeschlossen, wenn gilt:

```text
Eine Reise existiert nur, wenn eine echte World-State-Route existiert.

Eine Route besteht nur aus echten Connections.

Die beste Route wird nach Reisezeit bestimmt.

Blockierte Connections werden korrekt umfahren.

Keine Distanz und keine Reisezeit wird erfunden.

Eine Unterbrechung stoppt die Reise am tatsächlichen bekannten Punkt.

Ein Travel-Zug erzeugt genau einen Zeitfortschritt.

World State bleibt die einzige Autorität.

Gemini und Parser dürfen Travel-Zustände nicht zurückschreiben.

Save erfolgt nur mit einem konsistenten World State.

GameTurnService und TravelService haben keine Circular Dependency.
```

## Leitprinzip

> **Eine Welt. Ein Ort. Eine echte Route. Ein Zeitfortschritt. Ein Save.**
