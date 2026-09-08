# WORLD SIMULATION – CHAT INTEGRATION REVIEW 3

## Zweck

Die grundlegende Chat-Integration der Weltzeitsimulation wurde bereits umgesetzt. Diese Prüfung ist der letzte technische Kontrollpunkt, bevor neue Systeme auf dieser Grundlage gebaut werden.

Der Fokus liegt **nicht** auf neuen Features, sondern darauf, dass ein echter Spielerzug den World State genau einmal verändert, Gemini den richtigen Zustand erhält und genau dieser Zustand anschließend gespeichert wird.

---

# 1. Verbindlicher Datenfluss

Für einen normalen Spielerzug muss exakt dieser Ablauf gelten:

```text
USER MESSAGE
    ↓
GAMEVIEW / CHAT HANDLER
    ↓
EXACTLY ONE WorldSimulationService.runSimulationStep()
    ↓
activeWorld
    ↓
GEMINI PROMPT MIT activeWorld
    ↓
GEMINI RESPONSE
    ↓
PARSER MIT activeWorld ALS WORLD-OVERRIDE
    ↓
FINAL ADVENTURE WORLD
    ↓
PERSISTENCE
```

Für Dialog:

```text
USER MESSAGE
    ↓
DIALOG HANDLER
    ↓
EXACTLY ONE WorldSimulationService.runSimulationStep(mode='dialogue')
    ↓
activeWorld
    ↓
GEMINI
    ↓
PARSER MIT activeWorld
    ↓
FINAL ADVENTURE WORLD
    ↓
PERSISTENCE
```

Es darf keinen zweiten versteckten Simulationsschritt geben.

---

# 2. Echte End-to-End-Prüfung statt weiterer Unit-Tests

Die bisherigen Tests prüfen vor allem `WorldSimulationService` direkt. Das reicht für diese Prüfung nicht aus.

Bitte jetzt den tatsächlichen Produktionspfad prüfen:

- `GameView.tsx`
- `handleSend`
- `sendActionText`
- `handleSendDialogue`
- `parseLoreAndCharUpdates`
- `WorldSimulationService`
- `onUpdateAdventure`
- tatsächliche Persistenz / StorageService

Wenn direkte UI-Tests technisch schwierig sind, muss zumindest der komplette Handler-Ablauf mit realen Funktionen bzw. realistischen Test-Doubles abgebildet werden. Ein Test, der nur `runSimulationStep()` aufruft, zählt **nicht** als End-to-End-Test.

---

# 3. Normaler Chat

Bei einem normalen Spielerzug muss die Simulation genau einmal erfolgen.

Der Aufruf soll semantisch eindeutig sein:

```ts
WorldSimulationService.runSimulationStep({
  world,
  mode: 'action',
  actionText: textToSend
});
```

Nicht mehr darauf verlassen, dass

```ts
minutesToAdd: 0
```

als verstecktes Signal für automatische Zeitschätzung dient.

Die bestehende Aktionsdauer-Schätzung bleibt erhalten.

Beispiele:

- Standardaktion → ca. 10 Minuten
- Untersuchung → ca. 30 Minuten
- Reisen → ca. 180 Minuten
- Arbeit/Handwerk/Handel → ca. 120 Minuten
- Schlafen/Rasten → bestehende spezielle Regeln prüfen

Wichtig: Es darf keine zusätzliche Zeitberechnung außerhalb des WorldSimulationService geben, die den WorldTime erneut verändert.

---

# 4. Dialogzeit – endgültige Regel

Die Dialogzeit beträgt:

```ts
Math.min(5, Math.max(1, activeParticipantCount))
```

Dabei gilt:

```text
aktive Teilnehmer = Spieler + tatsächlich aktiv beteiligte NPCs
```

Der Spieler zählt immer als 1.

Beispiele:

| Aktive NPCs | Teilnehmer | Zeit |
|---:|---:|---:|
| 1 | 2 | +2 Minuten |
| 2 | 3 | +3 Minuten |
| 3 | 4 | +4 Minuten |
| 4 | 5 | +5 Minuten |
| 5+ | 6+ | +5 Minuten |

NPCs, die nur in der Szene stehen oder im Hintergrund anwesend sind, zählen nicht.

Ein Sonderfall wie `npc_npc` darf nicht automatisch eine falsche Teilnehmerzahl erzeugen. Es muss immer aus den tatsächlich aktiven Dialogteilnehmern abgeleitet werden.

---

# 5. Dialogmodus darf keine doppelte Zeitlogik besitzen

Prüfen auf:

- zusätzliche Zeitberechnung in `handleSendDialogue`
- zusätzliche Zeitberechnung in `GeminiService`
- Zeitänderung im Parser
- Zeitänderung über `[[STATUS]]`
- alte `advanceGameTime()`-Logik
- weitere Timer oder automatische Weltfortschritte

Die einzige globale Zeitfortschreibung dieses Spielerzugs muss aus dem einen Simulationsschritt stammen.

---

# 6. activeWorld muss wirklich die Basis der gesamten Antwort sein

Nach:

```ts
const activeWorld = simRes.updatedWorld;
```

muss dieser Zustand konsequent verwendet werden für:

- Weltname
- Weltbeschreibung
- Ton / Drama
- WorldTime
- Territorien
- aktuelle politische Kontrolle
- aktuelle Orte
- Fraktionen
- Wirtschaft
- dynamischen Weltzustand
- geplante Ereignisse
- relevante Weltfakten
- Kampagnenregeln
- sonstige World-State-relevante Informationen

Es darf danach nicht versehentlich wieder `adventure.world` für dieselben Informationen verwendet werden, wenn dadurch ein alter Zustand in den Gemini-Prompt gelangt.

Fallbacks auf `adventure.world` sind nur zulässig, wenn das Feld in `activeWorld` tatsächlich fehlt und der Fallback keine widersprüchlichen Werte erzeugt.

---

# 7. Parser-Integration

`parseLoreAndCharUpdates()` muss den simulierten World State als Basis verwenden:

```ts
parseLoreAndCharUpdates(
  rawText,
  adventure,
  ...,
  activeWorld
)
```

Prüfen, ob innerhalb des Parsers oder seiner Helper trotzdem wieder direkt auf `currentAdventure.world` zugegriffen wird und dadurch Simulationsergebnisse überschrieben werden können.

Besonders prüfen:

- neue Orte
- Territorien
- Reiseverbindungen
- Events
- World Facts
- politische Kontrolle
- Wirtschaft
- dynamische Weltzustände

Alle Änderungen müssen auf `activeWorld` aufbauen.

---

# 8. Persistenz – echter Round Trip

Nach einem normalen Chat und nach einem Dialog muss gelten:

```text
Simulation
 ↓
Gemini
 ↓
Parser
 ↓
onUpdateAdventure
 ↓
Save
 ↓
Reload
 ↓
gleicher World State
```

Mindestens prüfen:

- WorldTime
- Territory control
- Event status
- BattleInstances
- EconomyHolding status
- World Facts
- Location changes

Ein erfolgreicher Save-Aufruf allein reicht nicht. Der Test muss den gespeicherten Zustand wieder laden und vergleichen.

---

# 9. Fehlerfall

Wenn `WorldSimulationService.runSimulationStep()` fehlschlägt:

- kein Gemini-Aufruf mit einem fälschlich aktualisierten Zustand
- kein erfolgreicher World-State-Save
- keine Chat-Nachricht, die einen abgeschlossenen Zug vortäuscht
- keine teilweise Zeitfortschreibung

Der Spielerzug muss entweder vollständig erfolgreich sein oder kontrolliert abbrechen.

---

# 10. Geplante Events

`world.scheduledEvents` bleibt die kanonische Quelle.

`dynamicWorldState.scheduledEvents` darf höchstens Spiegel/Cache sein.

Prüfen:

- kein doppeltes Event Processing
- kein doppeltes Auslösen durch beide Arrays
- keine divergierenden Event-Zustände nach Save/Load
- Event-ID bleibt stabil

---

# 11. IDs und Determinismus

Noch vorhandene World-State-relevante IDs mit:

```ts
Date.now()
Math.random()
```

identifizieren.

Für persistente Weltobjekte sollen stabile/deterministische IDs verwendet werden.

Reine UI-/Chatmessage-IDs dürfen weiterhin kurzfristig erzeugt werden, sofern sie keine World-State-Identität darstellen.

---

# 12. Alte Zeitlogik aufräumen

Gezielt nach folgenden Mustern suchen:

- `advanceGameTime(`
- `worldTime`
- `minutesToAdd: 0`
- `Time=`
- `Date.now()` in World-State-Erzeugung
- `setInterval`
- `setTimeout` mit Weltfortschritt
- automatische Zeitfortschreibung nach Gemini

Ziel:

**Zeit vergeht ausschließlich durch einen gültigen Spieler-/Chat-Schritt.**

Kein Hintergrund-Ticker.
Kein Render-Zyklus.
Kein Gemini-Reply.
Kein automatischer zweiter Schritt.

---

# 13. Verbindliche End-to-End-Testfälle

## J – Normaler Spielerzug

Einen echten normalen Chat-Handler ausführen.

Erwartung:

- Simulation exakt 1x
- WorldTime steigt entsprechend der Aktion
- Gemini erhält den neuen WorldTime
- Parser startet mit demselben `activeWorld`
- gespeicherter WorldTime entspricht dem Ergebnis

## K – Dialog mit 1 aktivem NPC

Erwartung: exakt +2 Minuten.

## L – Dialog mit 3 aktiven NPCs

Erwartung: exakt +4 Minuten.

## M – Passive NPCs

Mehrere NPCs befinden sich in der Szene, aber nur ein NPC spricht aktiv mit dem Spieler.

Erwartung: exakt +2 Minuten.

## N – Dialog-Cap

5 oder mehr aktive NPCs.

Erwartung: exakt +5 Minuten.

## O – Simulation → Gemini → Parser → Save

Während des Simulationsschritts eine eindeutig erkennbare World-State-Änderung erzeugen.

Danach prüfen:

- Gemini sieht die Änderung
- Parser überschreibt sie nicht
- Save enthält sie
- Reload enthält sie weiterhin

## P – Kein Double Step

Einen Spielerzug durchführen und die Anzahl der `runSimulationStep()`-Aufrufe instrumentieren.

Erwartung: exakt 1.

## Q – Save/Reload

Je einen normalen Chat und einen Dialog durchführen, speichern und neu laden.

Erwartung: WorldTime und relevante World-State-Daten bleiben identisch.

## R – Simulation Failure

Simulation gezielt fehlschlagen lassen.

Erwartung: kein Gemini-Erfolg und kein falscher World-State-Save.

---

# 14. Keine neuen Systeme bauen

In dieser Prüfung keine neuen großen Features implementieren.

Nicht anfassen bzw. nicht erweitern:

- Kampfsystem
- Wirtschaftssystem
- Techniksystem
- Smart Fill
- Codex
- UI-Redesign

Nur Änderungen vornehmen, die für die korrekte Chat-/World-Simulation-Integration notwendig sind.

---

# 15. Abschlussbericht

Nach der Prüfung bitte konkret ausweisen:

1. Welche Dateien geändert wurden.
2. Welche Stellen tatsächlich korrigiert wurden.
3. Wie der echte End-to-End-Test durchgeführt wurde.
4. Ergebnisse J–R.
5. TypeScript Build-Ergebnis.
6. Bestehende Tests.
7. World-Simulation-Tests.
8. Keine verbleibende doppelte Zeitfortschreibung.
9. Keine verbleibende World-State-Überschreibung durch alten `adventure.world`-Stand.

Nicht nur melden „Tests bestanden“, sondern kurz beschreiben, **was tatsächlich getestet wurde**.

---

# Definition of Done

Diese Prüfung gilt erst als abgeschlossen, wenn:

- [ ] normaler Chat genau einen Simulationsschritt ausführt
- [ ] Dialog genau einen Simulationsschritt ausführt
- [ ] Dialogteilnehmer korrekt gezählt werden
- [ ] Dialogzeit maximal 5 Minuten beträgt
- [ ] passive NPCs nicht zählen
- [ ] `activeWorld` an Gemini geht
- [ ] `activeWorld` die Parser-Basis ist
- [ ] keine alte Welt den simulierten Zustand überschreibt
- [ ] Save den finalen Zustand speichert
- [ ] Reload denselben Zustand ergibt
- [ ] Events nicht doppelt verarbeitet werden
- [ ] Simulation Failure keinen falschen Zug speichert
- [ ] keine zweite globale Zeitfortschreibung existiert
- [ ] echte End-to-End-Tests J–R durchgeführt wurden
- [ ] Build erfolgreich ist
- [ ] bestehende Tests weiterhin erfolgreich sind

## Leitprinzip

> **Ein Spielerzug = ein Simulationsschritt = ein aktualisierter World State = ein Save.**

Oder kurz:

**Eine Nachricht. Ein Zeitfortschritt. Eine Welt.**
