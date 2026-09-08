# AdventureForge – World Simulation Chat Integration Review 2

## Zweck

Die erste Implementierungsrunde von `docs/WORLD_SIMULATION_CHAT_INTEGRATION_FIX.md` ist vorhanden. Diese zweite Prüfung konzentriert sich ausschließlich auf die tatsächliche Integration und auf Stellen, an denen die aktuelle Umsetzung noch von der gewünschten Architektur abweichen kann.

**Nicht nur Tests der Simulation selbst ergänzen. Die echten Chat-/Dialogpfade müssen geprüft und bei Bedarf korrigiert werden.**

Leitsatz:

> Eine Nutzernachricht erzeugt genau einen Simulationsschritt. Der daraus entstehende World State ist die Grundlage für Gemini, Parser und Persistenz.

---

# 1. Echte Integration prüfen

Prüfe in `components/GameView.tsx` den vollständigen normalen Chatpfad und den vollständigen `handleSendDialogue()`-Pfad.

Für beide Pfade muss die Reihenfolge tatsächlich sein:

```text
User Message
    ↓
exactly one WorldSimulationService.runSimulationStep()
    ↓
activeWorld
    ↓
Gemini prompt/context uses activeWorld
    ↓
Gemini response
    ↓
parser uses activeWorld as base
    ↓
final adventure.world
    ↓
persist
```

Nicht ausreichend ist ein isolierter Unit-Test, der nur `runSimulationStep()` aufruft.

---

# 2. Normaler Chat

Sicherstellen:

- `runSimulationStep()` wird genau einmal pro verarbeiteter Nutzernachricht ausgeführt.
- Normaler Chat verwendet `mode: 'action'` bzw. die bestehende Aktionsdauerlogik.
- Die bisherige Aktionszeit bleibt erhalten:
  - Schlafen: 480 Minuten
  - Rast: 60 Minuten
  - Reise: 180 Minuten
  - Suche/Untersuchung: 30 Minuten
  - Kampf/Angriff: 15 Minuten
  - Arbeit/Handwerk/Handel: 120 Minuten
  - Fallback: 10 Minuten
- Kein zweiter Simulationsaufruf in demselben Turn.
- Kein erneuter Simulationsaufruf beim Gemini-Response-Handling.

---

# 3. Dialogmodus – Teilnehmerzahl korrigieren

Die gewünschte Regel lautet:

```text
Dialogzeit = 1 + Anzahl tatsächlich aktiv am Dialog beteiligter NPCs
Maximum = 5 Minuten
```

Der Spieler zählt immer als 1.

Wichtig: Die Teilnehmerzahl darf **nicht allein aus einem groben `dialogueType`-Fall abgeleitet werden**, wenn dadurch Teilnehmer erfunden werden.

Prüfe die vorhandenen Dialogdaten und ermittle die tatsächlich aktiven Gesprächsteilnehmer.

Beispiele:

```text
User + 1 aktiver NPC = 2 Minuten
User + 2 aktive NPCs = 3 Minuten
User + 3 aktive NPCs = 4 Minuten
User + 4 aktive NPCs = 5 Minuten
User + 10 aktive NPCs = 5 Minuten
```

NPCs, die nur in der Szene vorhanden sind, aber nicht sprechen bzw. nicht als aktive Dialogteilnehmer geführt werden, zählen nicht.

`npc_npc` darf nicht automatisch `3` Teilnehmer bedeuten, wenn tatsächlich nur User + ein NPC aktiv beteiligt sind.

Die Berechnung sollte möglichst aus den bereits vorhandenen Dialog-/Gruppendaten erfolgen.

---

# 4. Dialogzeit muss ausschließlich über Simulation laufen

`handleSendDialogue()` darf keine eigene Zeitberechnung außerhalb der Simulation durchführen.

Es muss einen einzigen Aufruf geben:

```ts
WorldSimulationService.runSimulationStep({
  world: adventure.world,
  mode: 'dialogue',
  dialogueParticipantCount: activeParticipantCount
});
```

Die Simulation berechnet daraus die Minuten.

Keine Textlängen-Schätzung.
Keine Aktions-Regex für Dialoge.
Keine zweite Zeitaddition nach dem Simulation-Step.

---

# 5. Explizite Zeitparameter korrekt behandeln

In `WorldSimulationService.runSimulationStep()` gilt:

- Ein explizit übergebener positiver `minutesToAdd`-Wert hat Vorrang.
- `mode === 'dialogue'` verwendet ansonsten ausschließlich `dialogueParticipantCount`.
- `mode === 'action'` verwendet ansonsten `estimateActionDurationMinutes(actionText)`.
- `minutesToAdd: 0` darf nicht versehentlich als versteckte Aufforderung zur Textschätzung behandelt werden, wenn ein anderer expliziter Modus die Zeit bestimmt.

Die Semantik muss klar und durch Tests abgesichert sein.

---

# 6. Gemini muss wirklich den vollständigen aktuellen World State sehen

Es reicht nicht, nur `activeWorld.title`, `description` oder einzelne Territory-Werte zu verwenden.

Prüfe alle relevanten Prompt-/Context-Erzeugungen in `GameView.tsx`.

Wenn ein bestehender Prompt strukturierte Weltinformationen aus `adventure.world` erzeugt, muss für diesen Turn `activeWorld` verwendet werden.

Besonders prüfen:

- World description/settings
- Territory-Daten
- aktive Location
- politische Kontrolle
- Economy-Kontext
- Faction-Kontext
- WorldTime
- Dynamic World State / Events
- relevante Lore-/World-State-Informationen

Keine versehentliche Mischung:

```text
activeWorld.time
oldWorld.territory
oldWorld.events
```

Der Turn muss konsistent aus demselben World-State-Snapshot stammen.

---

# 7. Parser-Basis

`parseLoreAndCharUpdates()` muss bei einem simulierten Turn mit `worldOverride: activeWorld` arbeiten.

Prüfe außerdem, ob es weitere Parser oder Hilfsfunktionen gibt, die intern wieder direkt `currentAdventure.world` lesen und dadurch Simulationsergebnisse überschreiben können.

Ziel:

```text
activeWorld
   ↓
Parser clone
   ↓
Parser additions
   ↓
finalWorld
```

Nicht:

```text
activeWorld
   ↓
Parser
   ↓
old adventure.world
   ↓
Simulation changes lost
```

---

# 8. Dialog-Persistenz

Nach `handleSendDialogue()` muss der gespeicherte Adventure-State mindestens enthalten:

- aktualisierte `worldTime`
- verarbeitete World Events
- eventuelle Territory-/Faction-/Economy-Änderungen
- `chatHistory`

Der Dialogpfad darf nicht nur `chatHistory` speichern und dabei den simulierten World State verlieren.

---

# 9. Fehlerbehandlung

Prüfe, was passiert, wenn `runSimulationStep()` oder die Weltverarbeitung einen Fehler wirft.

Keine teilweise simulierte Welt speichern.

Keine Nachricht als vollständig verarbeitete Weltaktion markieren, wenn die Simulation fehlgeschlagen ist.

Wenn ein sicherer Fallback verwendet wird, darf dieser **keinen Zeitfortschritt vortäuschen**.

---

# 10. Scheduled Events

`WorldSetting.scheduledEvents` bleibt die kanonische Quelle.

`dynamicWorldState.scheduledEvents` darf nur ein synchronisiertes Laufzeit-Spiegelbild sein.

Prüfen:

- Schreiben
- Lesen
- Deduplication
- Entfernen verarbeiteter Events
- Save/Reload

Ein Event darf nicht zweimal verarbeitet werden, nur weil es in beiden Feldern existiert.

---

# 11. Deterministische IDs

Prüfen, ob für World-State-relevante Objekte weiterhin `Date.now()` oder `Math.random()` verwendet werden.

Besonders:

- World Events
- World Facts
- Simulation Change Logs
- automatisch erzeugte Folgeevents

Bestehende Spielstände dürfen nicht durch eine ID-Migration beschädigt werden.

---

# 12. Tests – echte Integration statt nur Simulation Unit Tests

Die bisherigen Tests A–I bleiben bestehen.

Zusätzlich müssen mindestens diese echten Integrationsfälle abgedeckt werden:

### J – Normaler GameView Turn

Ein normaler Chat-Turn wird simuliert.

Prüfen:

```text
Start worldTime
→ GameView Turn
→ final adventure.world.worldTime
```

Zeit darf genau einmal fortgeschritten sein.

### K – Dialog GameView Turn

`handleSendDialogue()` mit User + 1 aktivem NPC.

Erwartung: exakt +2 Minuten.

### L – Dialog mit 3 aktiven NPCs

User + 3 tatsächlich aktive NPCs.

Erwartung: exakt +4 Minuten.

### M – Szene mit passiven NPCs

User + 1 aktiver NPC + mehrere nur anwesende NPCs.

Erwartung: nur +2 Minuten.

### N – Dialog-Cap

User + mindestens 10 aktive NPCs.

Erwartung: exakt +5 Minuten.

### O – World-State-Persistenz

Ein Simulationsevent verändert einen World-State-Wert.

Danach Gemini/Parser/Persistenz durchlaufen.

Der Wert muss im finalen `adventure.world` erhalten bleiben.

### P – Kein Double Step

Ein vollständiger Chat-Turn darf die Weltzeit nicht zweimal erhöhen.

### Q – Save/Reload

Nach normalem Chat und nach Dialog jeweils speichern/laden und World State vergleichen.

---

# 13. Keine neue Architektur erfinden

Diese Prüfung soll bestehende Systeme korrigieren, nicht neue parallele Systeme erzeugen.

Nicht neu bauen:

- zweites World State
- zweites Event-System
- zweites Dialogsystem
- zweite Zeitlogik
- zweite Economy-Datenbank

Bestehende `WorldSimulationService`, `WorldSetting`, `dynamicWorldState`, `BattleInstance`, Economy und Lore-Strukturen weiterverwenden.

---

# 14. Abschlussprüfung

Nach der Umsetzung bitte tatsächlich prüfen:

1. Git diff der geänderten Dateien
2. TypeScript Build / Compile
3. bestehende World-State- und Persistence-Tests
4. World Simulation Tests
5. neue Integrationstests J–Q

Am Ende kurz dokumentieren:

```text
Changed files:
...

Tests:
...

Build:
...

Remaining risks:
...
```

**Wichtig:** Nicht nur behaupten, dass die Tests bestanden wurden. Nur tatsächlich ausgeführte Tests als bestanden melden.

---

# Definition of Done

- [ ] Normaler GameView-Chat: genau 1 Simulation Step
- [ ] Dialog GameView: genau 1 Simulation Step
- [ ] Teilnehmerzahl basiert auf tatsächlich aktiven NPCs
- [ ] User zählt als Teilnehmer
- [ ] Dialogzeit maximal 5 Minuten
- [ ] Passive NPCs zählen nicht
- [ ] Gemini verwendet konsistent `activeWorld`
- [ ] Parser basiert auf `activeWorld`
- [ ] Finaler Save enthält `activeWorld` plus Parseränderungen
- [ ] Scheduled Events haben eine kanonische Quelle
- [ ] World-State-IDs sind für Simulationen möglichst deterministisch
- [ ] Fehler führen nicht zu falschem Zeitfortschritt
- [ ] Tests A–I bleiben grün
- [ ] Tests J–Q decken die echte Chatintegration ab
- [ ] TypeScript Build bleibt fehlerfrei

## Ziel

**Eine Nutzernachricht = genau ein Weltzeitschritt. Ein konsistenter World State für Simulation, KI, Parser und Persistenz.**
