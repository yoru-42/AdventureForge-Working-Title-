# WORLD SIMULATION – REAL PRODUCTION TURN TEST

## Zweck

Dies ist die **letzte gezielte Prüfung** der Chat-/World-Simulation-Integration.

Die bisherigen Prüfungen haben gezeigt, dass `WorldSimulationService` funktioniert und dass die Produktionslogik in `GameView.tsx` angepasst wurde. Die bisherigen E2E-Tests bilden den Produktionsablauf jedoch teilweise nur nach. Das reicht nicht als endgültiger Nachweis.

Jetzt muss der **echte Produktionspfad** testbar gemacht und getestet werden.

Wichtig:

> **Keinen weiteren Test-Simulator bauen, der `GameView` nachprogrammiert.**

Wenn `GameView.tsx` zu groß oder zu stark an React/UI gebunden ist, soll die eigentliche Spielerzug-Logik in eine kleine testbare Produktionsfunktion ausgelagert werden. `GameView` muss anschließend genau diese Funktion verwenden. Der Test ruft ebenfalls genau diese Produktionsfunktion auf.

---

# 1. Zielarchitektur

Der tatsächliche Produktionsablauf muss sein:

```text
USER MESSAGE
    ↓
GAMEVIEW HANDLER
    ↓
PRODUCTION TURN FUNCTION
    ↓
EXACTLY ONE WorldSimulationService.runSimulationStep()
    ↓
activeWorld
    ↓
GEMINI PROMPT / GEMINI CALL
    ↓
PARSER MIT activeWorld ALS BASIS
    ↓
FINAL ADVENTURE STATE
    ↓
onUpdateAdventure / PERSISTENCE
```

Für Dialog gilt derselbe Ablauf:

```text
USER MESSAGE
    ↓
DIALOG HANDLER
    ↓
PRODUCTION TURN FUNCTION
    ↓
EXACTLY ONE WorldSimulationService.runSimulationStep(mode='dialogue')
    ↓
activeWorld
    ↓
GEMINI
    ↓
PARSER
    ↓
FINAL ADVENTURE STATE
    ↓
PERSISTENCE
```

Es darf keinen zweiten Simulationsschritt geben.

---

# 2. Keine Testkopie der Produktionslogik

Die bisherigen Helper wie `simulateGameViewActionTurn()` und `simulateGameViewDialogueTurn()` dürfen **nicht** als endgültige E2E-Lösung betrachtet werden, wenn sie den Ablauf aus `GameView.tsx` nur nachbauen.

Ein Test ist nur dann ein echter Produktionspfad-Test, wenn:

1. die Produktionsfunktion importiert wird,
2. die Produktionsfunktion ausgeführt wird,
3. `WorldSimulationService` dabei tatsächlich aufgerufen wird,
4. der echte Gemini-Aufruf über eine injizierbare Mock-Abhängigkeit ersetzt werden kann,
5. der echte Parser bzw. die echte Parser-Integration verwendet wird,
6. die echte finale Adventure-Aktualisierung ausgeführt wird,
7. die Persistenz über einen Test-Datenspeicher geprüft wird.

Test-Doubles für externe Abhängigkeiten sind erlaubt. Eine zweite Implementierung des gesamten Turn-Ablaufs ist es nicht.

---

# 3. Sinnvolle technische Lösung

Falls notwendig, eine kleine Produktionsdatei anlegen, z. B.:

```text
services/gameTurnService.ts
```

Der genaue Dateiname darf angepasst werden, wenn eine bestehende Architektur einen besseren Ort bietet.

Die Funktion soll **nicht** React-State, Rendering, Audio, DOM oder UI-Details enthalten.

Sie soll nur die fachliche Turn-Pipeline kapseln.

Beispielhafte Verantwortung:

```ts
processPlayerTurn(...): Promise<...>
```

Die Funktion soll:

1. World State entgegennehmen,
2. Turn-Modus entgegennehmen,
3. bei normalem Chat die Aktionssimulation ausführen,
4. bei Dialog die tatsächlichen aktiven Teilnehmer aus den übergebenen Dialogdaten bestimmen,
5. genau einen `WorldSimulationService.runSimulationStep()` ausführen,
6. `activeWorld` zurückgeben/weiterreichen,
7. Gemini mit `activeWorld` als aktueller Welt aufrufen,
8. Parser mit `activeWorld` als World Override/Basis aufrufen,
9. den finalen Adventure-Zustand erzeugen,
10. nur bei erfolgreichem vollständigem Ablauf die Persistenz-/Update-Funktion ausführen.

Gemini, Parser und Persistence sollen möglichst über Parameter/Dependency Injection testbar sein, damit die echten Produktionsfunktionen ausgeführt werden können, während externe Nebenwirkungen kontrolliert werden.

---

# 4. GameView muss Produktionsfunktion verwenden

`GameView.tsx` darf danach nicht weiterhin eine eigene parallele Turn-Logik enthalten.

Die Handler:

- `handleSend`
- `sendActionText`
- `handleSendDialogue`

sollen die gemeinsame Produktionslogik verwenden, soweit es sinnvoll ist.

UI-spezifische Dinge bleiben in `GameView`:

- Loading-State
- Audio
- Chat-Rendering
- UI-Fehleranzeige
- Eingabefelder
- Scrollposition
- React State

Die fachliche Welt-/Turn-Logik gehört in die testbare Produktionsfunktion.

---

# 5. Normaler Chat

Normaler Chat muss semantisch eindeutig aufgerufen werden:

```ts
WorldSimulationService.runSimulationStep({
  world,
  mode: 'action',
  actionText: textToSend
});
```

Nicht:

```ts
minutesToAdd: 0
```

als verstecktes Signal.

Die bestehende Aktionsdauer-Schätzung bleibt ausschließlich im `WorldSimulationService`.

Erwartung:

```text
User-Nachricht
→ 1 Simulation
→ aktive WorldTime
→ Gemini
→ Parser
→ Save
```

---

# 6. Dialog – tatsächliche Teilnehmer bestimmen

Die Produktionslogik muss die Teilnehmer aus den tatsächlichen Dialogdaten bestimmen.

Regel:

```ts
const activeParticipantCount = 1 + activeNpcParticipants.length;
const dialogueMinutes = Math.min(5, Math.max(1, activeParticipantCount));
```

Der Spieler zählt immer als 1.

Nur NPCs, die tatsächlich am aktuellen Dialog beteiligt sind, zählen.

NPCs, die lediglich:

- im Raum stehen,
- auf der Karte vorhanden sind,
- im Hintergrund erwähnt werden,
- in der Szene existieren,

zählen nicht.

Beispiele:

| Aktive NPCs | Teilnehmer | Zeit |
|---:|---:|---:|
| 1 | 2 | +2 Minuten |
| 2 | 3 | +3 Minuten |
| 3 | 4 | +4 Minuten |
| 4 | 5 | +5 Minuten |
| 5+ | 6+ | +5 Minuten |

Es darf keinen fest verdrahteten Sonderfall wie `npc_npc => 3` geben, der unabhängig von den tatsächlichen Teilnehmern eine falsche Zahl erzeugt.

---

# 7. activeWorld – Single Source innerhalb des Turns

Nach:

```ts
const activeWorld = simRes.updatedWorld;
```

muss `activeWorld` die Grundlage für den restlichen Turn sein.

Gemini muss den aktuellen Zustand sehen, insbesondere:

- WorldTime
- Weltname
- Weltbeschreibung
- Ton/Drama
- Territorien
- politische Kontrolle
- aktuelle Orte
- Fraktionen
- Wirtschaft
- dynamischer World State
- geplante Events
- World Facts
- Kampagnenregeln
- relevante Lore

Der alte Zustand `adventure.world` darf nicht erneut als Quelle verwendet werden, wenn dadurch ein älterer Zustand in Gemini oder den Parser gelangt.

---

# 8. Parser – echter Produktionsparser

Der Test muss die echte Parser-Integration verwenden.

Nicht ausreichend:

```ts
mockParserMerge(activeWorld, adventure.world)
```

wenn dies lediglich eine Testfunktion ist, die das Verhalten des echten Parsers nachbildet.

Stattdessen muss die echte Parser-Funktion verwendet werden, wobei Gemini-Antwort und notwendige Abhängigkeiten kontrolliert werden können.

Der Parser muss mit `activeWorld` als World Override/Basis arbeiten.

Besonders sicherstellen:

- neue Orte
- Territorien
- Events
- World Facts
- politische Kontrolle
- Wirtschaft
- dynamischer World State

überschreiben nicht versehentlich den simulierten Zustand.

---

# 9. Gemini-Testdouble

Der echte Produktionspfad soll verwendet werden, aber der externe Gemini-Dienst darf im Test durch eine kontrollierte Testimplementierung ersetzt werden.

Der Test-Gemini soll beispielsweise prüfen können:

```text
Welche WorldTime wurde übergeben?
Welche Territory-Control-Daten wurden übergeben?
Welche Event-/Fact-Daten wurden übergeben?
```

und anschließend eine kontrollierte Antwort zurückgeben.

So kann nachgewiesen werden:

```text
Simulation verändert World State
        ↓
Gemini erhält genau diesen Zustand
```

---

# 10. Persistenz-Test

Der Test muss einen echten Save/Reload-Roundtrip der bestehenden Persistenzschicht durchführen oder eine realistische Test-Storage-Implementierung verwenden, die dieselbe Produktionsschnittstelle benutzt.

Nicht ausreichend:

```ts
const saved = result.updatedAdventure;
const reloaded = saved;
```

Das ist kein Reload.

Erwartung:

```text
Production Turn
      ↓
Save
      ↓
Storage
      ↓
Reload
      ↓
vergleichbarer World State
```

Mindestens prüfen:

- WorldTime
- Territory Control
- Scheduled Events
- BattleInstances
- EconomyHolding Status
- World Facts
- Location changes

---

# 11. Fehlerfall – echter Produktionspfad

Die Simulation soll im Test gezielt fehlschlagen.

Danach muss geprüft werden:

- Gemini wurde nicht erfolgreich ausgeführt,
- kein finaler erfolgreicher Turn wurde gespeichert,
- WorldTime wurde nicht teilweise fortgeschrieben,
- keine Chatantwort wird als abgeschlossener Spielerzug gespeichert,
- kein beschädigter Adventure-State wird persistiert.

Der Fehler muss kontrolliert an `GameView` zurückgegeben werden.

---

# 12. Instrumentierung – genau ein Simulationsschritt

Im Test muss `WorldSimulationService.runSimulationStep()` instrumentiert werden.

Wichtig:

Die Produktionsfunktion darf nicht durch einen Testzähler ersetzt werden.

Der Test soll den echten Aufruf beobachten, z. B. über einen Spy/Wrapper oder eine geeignete Dependency-Injection-Lösung.

Erwartung pro User-Nachricht:

```text
runSimulationStep calls = 1
```

---

# 13. Verbindliche echte Produktionspfad-Tests

## J – Normaler Spielerzug

Produktionsfunktion für einen normalen Chat aufrufen.

Prüfen:

- echter Produktionspfad
- genau 1 Simulation
- WorldTime wird korrekt erhöht
- Gemini sieht die neue WorldTime
- Parser bekommt denselben `activeWorld`
- finaler Adventure-State enthält die Änderung
- Save enthält die Änderung
- Reload enthält die Änderung

---

## K – Dialog mit 1 aktivem NPC

Echten Produktions-Dialogpfad ausführen.

Erwartung:

```text
+2 Minuten
```

und genau 1 Simulationsschritt.

---

## L – Dialog mit 3 aktiven NPCs

Echten Produktions-Dialogpfad ausführen.

Erwartung:

```text
+4 Minuten
```

---

## M – Passive NPCs

Beispiel:

```text
Spieler
NPC A = aktiv
NPC B = nur anwesend
NPC C = nur anwesend
NPC D = Hintergrundfigur
```

Erwartung:

```text
+2 Minuten
```

Nicht +4 oder +5.

---

## N – Dialog-Cap

Mindestens 5 aktive NPCs.

Erwartung:

```text
+5 Minuten
```

---

## O – Simulation → Gemini → Parser → Save → Reload

Während der Simulation eine eindeutig erkennbare Änderung erzeugen.

Beispiel:

```text
WorldTime 08:00 → 08:10
Territory Control = faction_A
Event = pending
```

Gemini muss diesen Zustand sehen.

Der Parser darf ihn nicht verlieren.

Save und Reload müssen denselben Zustand ergeben.

---

## P – Kein Double Step

Produktionsfunktion ausführen.

Spy auf `runSimulationStep()`.

Erwartung:

```text
1 Aufruf
```

Nicht 2.

---

## Q – Normal + Dialog Save/Reload

Je einen echten Produktions-Chat und Dialog ausführen.

Nach jedem Turn:

```text
Save → Reload → Vergleich
```

WorldTime und relevante World-State-Daten müssen erhalten bleiben.

---

## R – Simulation Failure

Simulation gezielt fehlschlagen lassen.

Erwartung:

```text
Simulation fails
↓
kein Gemini-Erfolg
↓
kein erfolgreicher Save
↓
kein abgeschlossener Chat-Turn
```

Der ursprüngliche World State muss unverändert bleiben.

---

# 14. Zusätzliche Prüfung – keine zweite Zeitlogik

Nach der Extraktion/Integration gezielt suchen nach:

- `advanceGameTime(`
- zusätzlichen `worldTime`-Mutationen
- `minutesToAdd: 0`
- `Time=`-Parsing als globale Zeitquelle
- Zeitfortschritt in `GeminiService`
- Zeitfortschritt im Parser
- Zeitfortschritt in `[[STATUS]]`
- `setInterval`
- `setTimeout` mit Weltfortschritt
- Simulation beim Rendern
- Simulation beim Empfang einer Gemini-Antwort

Ziel:

> **Ein User-Input darf genau einen globalen Zeitfortschritt verursachen.**

---

# 15. Keine parallele Architektur

Nach der Änderung darf es nicht zwei verschiedene Turn-Pipelines geben:

```text
GameView-Pipeline A
Simulation-Pipeline B
```

Es muss genau eine fachliche Produktionspipeline geben.

Tests müssen diese Pipeline verwenden.

---

# 16. Bestehende Tests behalten

Nicht die vorhandenen Simulationstests entfernen.

Sie bleiben für die Prüfung des `WorldSimulationService` sinnvoll.

Aber klar unterscheiden:

```text
Unit/Service Tests
≠
Production Turn Integration Tests
```

Beide Testarten müssen erfolgreich sein.

---

# 17. Build und Tests

Nach der Änderung ausführen:

1. TypeScript Build
2. Lint, falls vorhanden
3. bestehende Tests
4. World-Simulation-Tests
5. echte Produktionspfad-Tests J–R

Keine Prüfung gilt als abgeschlossen, wenn nur die neuen Tests erfolgreich sind.

---

# 18. Abschlussbericht

Bitte nach der Umsetzung konkret berichten:

1. Welche Produktionsdatei(en) geändert wurden.
2. Ob eine Turn-Service-/Helper-Datei extrahiert wurde.
3. Wie `GameView` jetzt diese Produktionsfunktion verwendet.
4. Wie Gemini im E2E-Test ersetzt/injiziert wurde.
5. Wie der echte Parser getestet wurde.
6. Wie Save/Reload tatsächlich getestet wurde.
7. Ergebnisse J–R einzeln.
8. Anzahl der echten `runSimulationStep()`-Aufrufe pro Turn.
9. Ergebnis TypeScript Build.
10. Ergebnis bestehender Tests.
11. Ergebnis World-Simulation-Tests.
12. Ob alte doppelte Zeitlogik gefunden/entfernt wurde.
13. Ob noch ein Test-Simulator existiert und warum er gegebenenfalls nur als Unit-Test verwendet wird.

Nicht einfach „Tests bestanden“ schreiben.

Kurz beschreiben, **welcher echte Produktionscode dabei ausgeführt wurde**.

---

# Definition of Done

Diese Prüfung ist abgeschlossen, wenn:

- [ ] kein Test den Turn-Ablauf lediglich nachprogrammiert
- [ ] der Test eine echte Produktionsfunktion aufruft
- [ ] `GameView` dieselbe Produktionsfunktion verwendet
- [ ] normaler Chat genau einen Simulationsschritt ausführt
- [ ] Dialog genau einen Simulationsschritt ausführt
- [ ] aktive Dialogteilnehmer aus echten Dialogdaten ermittelt werden
- [ ] passive NPCs nicht zählen
- [ ] Dialogzeit maximal 5 Minuten beträgt
- [ ] `activeWorld` Gemini erreicht
- [ ] `activeWorld` die Parser-Basis ist
- [ ] der echte Parser getestet wird
- [ ] der finale Adventure-State den simulierten Zustand enthält
- [ ] Save/Reload tatsächlich durchgeführt wird
- [ ] Simulation Failure keinen falschen Save erzeugt
- [ ] keine doppelte Zeitfortschreibung existiert
- [ ] J–R als echte Produktionspfad-Tests bestanden sind
- [ ] TypeScript Build erfolgreich ist
- [ ] bestehende Tests erfolgreich sind
- [ ] World-Simulation-Tests erfolgreich sind

# Leitprinzip

> **Nicht testen, ob wir GameView nachbauen können. Testen, ob GameView selbst den richtigen Turn ausführt.**

Und danach gilt:

**Ein Spielerzug = ein Simulationsschritt = ein aktualisierter World State = ein Save.**

**Eine Nachricht. Ein Zeitfortschritt. Eine Welt.**
