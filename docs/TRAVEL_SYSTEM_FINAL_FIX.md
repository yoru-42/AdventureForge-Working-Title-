# AdventureForge – Travel System Final Fix

## Ziel

Dies ist eine **kleine, gezielte Abschlusskorrektur** für das bereits implementierte Travel-System.

Die bestehende Travel-Architektur soll **nicht neu geschrieben** und nicht durch ein paralleles System ersetzt werden.

Bereits behobene Punkte bleiben erhalten:

- keine Koordinaten als künstliche Route
- keine erfundenen Distanz-/Zeitwerte
- keine pauschalen Fallback-Werte wie 10/15 km oder 30 Minuten
- Routenauflösung über vorhandene `world.connections`
- gewichtete Routenwahl nach tatsächlicher Reisezeit
- deterministisches Tie-Breaking
- blockierte Verbindungen werden aus dem nutzbaren Graphen entfernt
- alternative Routen bleiben möglich
- keine zirkuläre Abhängigkeit zwischen `GameTurnService` und `TravelService`
- Travel verwendet genau einen autoritativen World-Simulation-Step
- kein zweiter Zeitfortschritt durch Parser, UI oder Save

Diese Datei behandelt ausschließlich die **letzten zwei bekannten Fehler**:

1. falsche Unterbrechungsposition bei einem Kampf während der Reise
2. falsche Klassifizierung von `blocked` vs. `unreachable`

---

# 1. Kampfunterbrechung darf niemals zurückteleportieren

## Problem

In `TravelService.executeTravelTurn` existiert aktuell sinngemäß folgende Logik:

```ts
if (hasCombatInterruption) {
  const battleInst = simResult.spawnedBattleInstances[0];

  if (battleInst.locationName) {
    interruptedAtLocationName = battleInst.locationName;
  } else if (routeRes.segments.length > 0) {
    interruptedAtLocationName = routeRes.segments[0].fromLocationName;
  } else {
    interruptedAtLocationName = currentLocName;
  }
}
```

Der Fallback auf

```ts
routeRes.segments[0].fromLocationName
```

ist falsch.

Bei einer mehrteiligen Reise kann der Kampf beispielsweise nach dem ersten oder zweiten Abschnitt auftreten. Der Spieler darf dann nicht wieder an den Start der gesamten Reise gesetzt werden.

## Verbindliche Regel

Ein Travel-Interrupt darf den Spieler **nur auf einen tatsächlich bekannten und bestätigten Ort bzw. Zwischenpunkt setzen**.

Priorität der Ermittlung:

1. BattleInstance enthält eine valide `locationId`.
2. BattleInstance enthält einen anderen eindeutig auflösbaren Ortsbezug.
3. BattleInstance enthält einen eindeutig auflösbaren `territoryId`/Tactical-Kontext, aus dem ein konkreter aktueller Ort zuverlässig bestimmt werden kann.
4. Travel-Auflösung kennt einen zuletzt bestätigten Route-Punkt, der bis zum Interrupt tatsächlich erreicht wurde.
5. Wenn kein sicherer Unterbrechungspunkt vorhanden ist: **keinen erfundenen Ort setzen und niemals zum Reiseanfang zurückspringen.**

Ein unbekannter Unterbrechungspunkt darf nicht durch einen geratenen Namen ersetzt werden.

## Besonders wichtig

Folgende Fallbacks sind verboten:

```ts
routeRes.segments[0].fromLocationName
```

oder sinngemäß:

```ts
firstSegment.from
startLocation
currentLocName
```

wenn daraus behauptet wird, dass der Kampf dort stattgefunden hat, obwohl der Interrupt tatsächlich später aufgetreten sein kann.

## Verhalten bei fehlender Position

Wenn der BattleInstance keine ausreichende Positionsinformation besitzt, soll die Reise **nicht künstlich an einen falschen Ort verschoben werden**.

Stattdessen:

- letzten sicher bekannten World-State beibehalten
- keine falsche `currentLocationId` setzen
- keine falsche Location aus einem Namen ableiten
- BattleInstance trotzdem korrekt speichern
- keine Teleportation
- Fehler bzw. unbestimmte Unterbrechungsposition sauber zurückgeben/loggen

Falls die vorhandene Architektur einen `lastConfirmedLocationId` oder vergleichbaren Wert sinnvoll führen kann, darf dieser verwendet werden. Es darf dafür aber kein neues paralleles Positionssystem entstehen.

## Zielzustand

Bei einer Reise

```text
A → B → C → D
```

und einem Kampf während des Abschnitts

```text
B → C
```

darf das Ergebnis niemals automatisch

```text
A
```

sein.

Es darf nur ein tatsächlich bestätigter Punkt verwendet werden.

---

# 2. `blocked` und `unreachable` müssen route-spezifisch sein

## Problem

Aktuell existiert sinngemäß ein globales Flag:

```ts
const hasBlockedConnections = world.connections.some(connection => connection.isBlocked);
```

und dieses kann bei einer fehlgeschlagenen Route dazu führen, dass das Ergebnis `blocked` lautet, obwohl die blockierte Verbindung überhaupt nichts mit der gewünschten Reise zu tun hat.

Beispiel:

```text
Gewünschte Reise:
A → B

Unabhängig davon existiert:
X → Y (blocked)
```

Wenn A und B nicht verbunden sind, darf das Ergebnis wegen X → Y **nicht** `blocked` sein.

Das korrekte Ergebnis ist:

```text
unreachable
```

## Verbindliche Regel

`blocked` darf nur zurückgegeben werden, wenn eine Blockierung tatsächlich für die Verbindung zwischen Start und Ziel relevant ist.

Eine beliebige blockierte Verbindung irgendwo im World State reicht nicht.

## Erwartete Semantik

### `success`

Eine gültige Route existiert und alle benötigten Verbindungen sind nutzbar.

### `blocked`

Start und Ziel gehören grundsätzlich zu einem relevanten erreichbaren Verbindungsbereich, aber der Weg ist wegen blockierter relevanter Verbindung(en) nicht nutzbar und es existiert keine nutzbare Alternative.

### `unreachable`

Start und Ziel sind über die vorhandenen Verbindungen nicht erreichbar oder es gibt überhaupt keine ausreichende Route.

Unabhängige blockierte Verbindungen außerhalb des relevanten Bereichs dürfen daran nichts ändern.

## Umsetzung

Die Prüfung soll sich am tatsächlichen Start-Ziel-Graphen orientieren.

Keine globale Abfrage wie:

```ts
world.connections.some(c => c.isBlocked)
```

für die Klassifizierung des Ergebnisses.

Stattdessen kann die bestehende Graphstruktur genutzt werden, um festzustellen:

1. Welche Knoten vom Start über **nicht blockierte** Verbindungen erreichbar sind.
2. Ob das Ziel dort erreichbar ist.
3. Falls nicht: ob es einen Zusammenhang zwischen Start und Ziel gibt, der ausschließlich durch blockierte relevante Verbindungen unterbrochen wird.

Dabei dürfen weiterhin keine neuen künstlichen Routen erzeugt werden.

---

# 3. Keine Regression der bereits korrigierten Routenlogik

Die folgenden Regeln müssen nach der Änderung weiterhin gelten.

## Keine Koordinatenroute

Koordinaten dürfen niemals als Ersatz für fehlende `world.connections` verwendet werden.

```text
Location A coordinates
        ↓
Location B coordinates
        ↓
keine Verbindung
        ↓
NICHT automatisch reisen
```

## Keine erfundenen Werte

Wenn eine Connection keine ausreichende Reisezeit und keine ausreichende Distanz besitzt, darf keine beliebige Zeit erfunden werden.

Keine Werte wie:

```text
10 km
15 km
30 Minuten
```

als pauschaler Fallback.

## Reisezeit

Priorität bleibt:

1. explizite Connection-Reisezeit
2. Distanz + definierte Bewegungsgeschwindigkeit
3. vorhandene Terrain-/Bewegungsmodifikatoren
4. bestehende Welt-/Campaign-Regeln
5. nur wenn weiterhin eindeutig berechenbar

Keine künstliche Zeit.

## Routenwahl

Die bestehende gewichtete Routenauflösung bleibt erhalten:

1. minimale Gesamt-Reisezeit
2. minimale Gesamtdistanz
3. minimale Anzahl Segmente
4. deterministischer Node-/ID-Tie-Breaker

Es darf nicht wieder auf reines BFS/minimale Hop-Anzahl zurückgegangen werden.

## Blockierte Connections

Blockierte Connections dürfen alternative Wege nicht verhindern.

Beispiel:

```text
A ── blocked ── B
│              │
└──── C ───────┘
```

Wenn A → C → B möglich ist, muss diese Route verwendet werden.

---

# 4. Keine Änderung am Zeitmodell

Travel bleibt ein normaler Spielerzug.

```text
User Message
    ↓
GameTurnService
    ↓
TravelService
    ↓
Travel Resolution
    ↓
WorldSimulationService  ← genau EINMAL
    ↓
World State
    ↓
Gemini
    ↓
Parser mit activeWorld
    ↓
Save
```

Kein zusätzlicher Zeitfortschritt durch:

- TravelService zusätzlich
- GameTurnService zusätzlich
- Gemini
- Parser
- UI
- Save
- Render-Tick
- Timer
- Background Simulation

---

# 5. Parser darf Travel-Zustand nicht überschreiben

Die bestehende Regel bleibt bestehen:

Der Parser erhält den nach Travel/Simulation aktualisierten `activeWorld` als `worldOverride` bzw. entsprechenden Baseline-State.

Der Parser darf nicht aus altem Adventure-State wieder herstellen:

- alte Location
- altes Territory
- alte WorldTime
- alte BattleInstances
- alten Travel-Zustand

Travel-State aus dem autoritativen World State ist maßgeblich.

---

# 6. Atomarität und Fehlerverhalten

Wenn Travel oder die Simulation fehlschlägt:

- keine teilweise Positionsänderung
- kein falscher Zeitfortschritt
- kein falscher Save
- kein Zurücksetzen auf einen geratenen Ort

Bei Erfolg:

- Position aktualisieren
- Territory konsistent halten
- WorldTime aktualisieren
- BattleInstance/Events übernehmen
- Gemini mit aktualisiertem World State versorgen
- Parser auf aktualisiertem World State ausführen
- finalen World State speichern

---

# 7. Tests

Bestehende Travel-Tests müssen erhalten bleiben.

Zusätzlich müssen mindestens diese Fälle explizit abgedeckt werden.

## Test K – BattleInstance ohne locationName/locationId

Gegeben:

```text
A → B → C
```

Während der Reise wird ein BattleInstance erzeugt, der keinen ausreichend sicheren Ortsbezug besitzt.

Erwartung:

- kein Fallback auf A
- kein falscher Ortsname
- keine Teleportation
- World State bleibt bezüglich Position konsistent
- BattleInstance wird trotzdem korrekt behandelt

## Test L – Battle-Unterbrechung nach mehreren Segmenten

Gegeben:

```text
A → B → C → D
```

Interrupt tritt nach B bzw. während C auf.

Erwartung:

- nicht A
- nicht automatisch der gesamte Zielort D
- nur tatsächlich bestätigter Zwischenpunkt bzw. sicherer Battle-Ort

## Test M – Unabhängig blockierte Verbindung

Gegeben:

```text
A → B nicht verbunden

X → Y blocked
```

Erwartung:

```text
unreachable
```

nicht:

```text
blocked
```

## Test N – Relevante Blockierung ohne Alternative

Gegeben:

```text
A ── blocked ── B
```

und keine andere Verbindung A → B.

Erwartung:

```text
blocked
```

## Test O – Relevante Blockierung mit Alternative

Gegeben:

```text
A ── blocked ── B
│              │
└──── C ───────┘
```

Erwartung:

```text
success
```

über A → C → B.

## Test P – Kein Fallback auf Koordinaten

A und B besitzen Koordinaten, aber keine Connection.

Erwartung:

```text
unreachable
```

## Test Q – Kein künstlicher Zeitwert

Eine Connection besitzt weder valide Reisezeit noch ausreichende Distanz.

Erwartung:

- keine erfundene Reisezeit
- keine automatische Route
- sauberer Fehler/unreachable-Zustand entsprechend der bestehenden API

## Test R – Genau ein Simulation-Step

Eine erfolgreiche Reise darf den WorldTime nur einmal um die berechnete Reisezeit verändern.

## Test S – Save/Reload

Nach erfolgreicher Reise und anschließendem Reload müssen mindestens erhalten bleiben:

- aktuelle Location
- aktuelles Territory
- WorldTime
- relevante BattleInstances
- relevante Events/World-State-Änderungen

---

# 8. Produktionspfad testen

Die Tests dürfen nicht nur eine vereinfachte Kopie der GameView-/Travel-Logik ausführen.

Sie müssen den echten Produktionspfad bzw. die echte abstrahierte Produktionsfunktion verwenden:

```text
GameTurnService.processPlayerTurn(...)
        ↓
TravelService.executeTravelTurn(...)
        ↓
WorldSimulationService
```

Mocks sind nur für externe Abhängigkeiten wie Gemini oder Persistence zulässig.

Nicht zulässig ist eine Testfunktion, die die Produktionslogik lediglich nachprogrammiert und anschließend deren Ergebnis behauptet.

---

# 9. Änderungen klein halten

Bitte keine neuen großen Systeme erstellen.

Nicht neu bauen:

- Combat Engine
- Event Engine
- Economy Engine
- World Simulation
- Map-System
- Location-System
- neues Positionssystem
- neues Save-System
- neues UI-System

Nur die beiden beschriebenen Fehler korrigieren und die Regressionstests ergänzen.

Bestehende stabile Architektur wiederverwenden.

---

# 10. Abschlusskriterien

Die Aufgabe ist abgeschlossen, wenn:

- kein Travel-Interrupt mehr auf den ersten Segmentstart zurückfallen kann
- kein unbekannter Battle-Ort durch einen geratenen Ort ersetzt wird
- `blocked` nur noch bei relevanter Blockierung gemeldet wird
- unabhängige blockierte Connections keinen Einfluss auf fremde Reisen haben
- alternative Routen weiterhin funktionieren
- keine Koordinatenroute existiert
- keine künstlichen Distanz-/Zeitwerte existieren
- Dijkstra/gewichtete Reisezeit erhalten bleibt
- keine zirkuläre Dependency entsteht
- genau ein World-Simulation-Step erfolgt
- Parser den aktualisierten World State verwendet
- Travel atomar bleibt
- Tests K-S plus bestehende Travel-/World-Simulation-Tests erfolgreich sind
- Build erfolgreich ist
- Lint erfolgreich ist
- keine Regression der bereits funktionierenden Systeme entsteht

## Leitprinzip

> **Eine Reise ist kein Teleport und kein Text. Eine Reise ist ein Spielerzug innerhalb derselben Welt.**
>
> **Eine Welt. Ein Ort. Eine Route. Ein Zeitfortschritt. Ein Save.**
