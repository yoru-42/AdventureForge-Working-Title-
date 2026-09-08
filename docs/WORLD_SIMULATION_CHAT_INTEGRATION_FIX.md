# AdventureForge – World Simulation Chat Integration Fix

## Ziel

Die bereits vorhandene World Simulation muss jetzt tatsächlich Teil des normalen Chat-/Dialogablaufs werden.

Leitsatz:

> **Eine Nachricht des Nutzers = ein Simulationsschritt. Die Simulation verändert den World State. Danach erhält die KI genau diesen aktualisierten World State. Danach wird genau dieser World State gespeichert.**

Es darf keinen zweiten, alten World State geben, der die Simulationsergebnisse anschließend überschreibt.

---

# 1. Kritischer Fehler: Simulationsergebnis wird aktuell überschrieben

In `components/GameView.tsx` wird bereits:

```ts
const simRes = WorldSimulationService.runSimulationStep({
  world,
  minutesToAdd: 0,
  actionText: textToSend
});

const activeWorld = simRes.updatedWorld;
```

aufgerufen.

Das Ergebnis `activeWorld` darf danach nicht verloren gehen.

Aktuell startet `parseLoreAndCharUpdates(...)` seinen World State wieder aus:

```ts
currentAdventure.world
```

und der finale `onUpdateAdventure(...)` speichert anschließend diesen alten bzw. daraus erzeugten World State.

## Reparatur

`parseLoreAndCharUpdates` muss einen optionalen World-State-Override akzeptieren, z. B.:

```ts
worldOverride?: WorldSetting
```

und verwenden:

```ts
let updatedWorld = worldOverride
  ? JSON.parse(JSON.stringify(worldOverride))
  : currentAdventure.world
    ? JSON.parse(JSON.stringify(currentAdventure.world))
    : { territories: [], connections: [] };
```

Beim normalen Chat muss danach zwingend:

```ts
worldOverride: activeWorld
```

übergeben werden.

Damit werden Änderungen aus `WorldSimulationService` nicht mehr durch den alten `adventure.world`-Stand überschrieben.

---

# 2. KI muss den aktualisierten World State erhalten

Die Simulation muss **vor** der Erstellung des eigentlichen Gemini-Prompts laufen.

Die KI darf nicht nur eine Zusammenfassung der Simulation bekommen, sondern muss für Weltentscheidungen auf den aktualisierten World State zugreifen.

Der relevante Ablauf muss sein:

```text
NUTZER-NACHRICHT
      ↓
Simulation Step
      ↓
activeWorld
      ↓
Gemini Prompt mit activeWorld
      ↓
KI-Antwort
      ↓
Lore/Character/NPC-Parsing
      ↓
Parser basiert auf activeWorld
      ↓
Finaler World State
      ↓
Persistenz
```

Wenn der bestehende Prompt bereits strukturierte Weltinformationen aus `world` erzeugt, muss dort `activeWorld` anstelle des alten `world` verwendet werden.

Nicht zulässig:

```text
Simulation → activeWorld
              ↓
              X nicht an Gemini übergeben
              ↓
Gemini bekommt alten world
```

---

# 3. Normaler Chat: Aktionszeit bleibt erhalten

Für normalen Chat bzw. Weltaktionen bleibt die vorhandene Aktionszeitlogik grundsätzlich bestehen:

- Schlafen → 480 Minuten
- kurze Rast → 60 Minuten
- Reise → 180 Minuten
- Untersuchung/Suche → 30 Minuten
- Kampf/Angriff → 15 Minuten
- Arbeit/Handel/Handwerk → 120 Minuten
- normale kurze Aktion → 10 Minuten

Diese Regex-/Fallback-Logik darf aber **nicht für den Dialogmodus** verwendet werden.

---

# 4. Dialogmodus: Zeit anhand der Gesprächsteilnehmer

Im reinen Dialogmodus wird die Zeit nicht aus dem Nachrichtentext geschätzt.

Regel:

> **Zeitfortschritt = Anzahl aller Gesprächsteilnehmer, inklusive Nutzer/Spieler. Maximum 5 Minuten pro Nachricht.**

Beispiele:

| Teilnehmer | Zeit |
|---|---:|
| Nutzer + 1 NPC | 2 Minuten |
| Nutzer + 2 NPCs | 3 Minuten |
| Nutzer + 3 NPCs | 4 Minuten |
| Nutzer + 4 NPCs | 5 Minuten |
| Nutzer + 5 oder mehr NPCs | 5 Minuten |

Der Nutzer/Spieler zählt immer als ein Teilnehmer.

Das bedeutet ausdrücklich:

```text
1 Nutzer + 1 NPC = 2 Minuten
1 Nutzer + 2 NPCs = 3 Minuten
1 Nutzer + 3 NPCs = 4 Minuten
1 Nutzer + 4 NPCs = 5 Minuten
1 Nutzer + 20 NPCs = 5 Minuten
```

## Technische Umsetzung

Nicht versuchen, Dialogzeit aus dem Text zu erkennen.

Stattdessen einen expliziten Simulationsparameter verwenden, z. B.:

```ts
interface SimulationStepParams {
  world: WorldSetting;
  minutesToAdd?: number;
  seed?: number;
  actionText?: string;
  mode?: 'action' | 'dialogue';
  dialogueParticipantCount?: number;
}
```

Berechnung:

```ts
const dialogueMinutes = Math.min(
  5,
  Math.max(1, dialogueParticipantCount ?? 1)
);
```

Für `mode === 'dialogue'` muss diese Zahl verwendet werden.

Für `mode === 'action'` bleibt die bisherige Aktionszeitlogik bestehen.

Wichtig: `minutesToAdd = 0` darf nicht mehr stillschweigend bedeuten „schätze die Zeit aus dem Text“.

Explizite Zeitwerte müssen Vorrang haben.

---

# 5. Dialogmodus darf die Simulation nicht mehr umgehen

Aktuell existiert ein separater `handleSendDialogue()`-Pfad, der direkt `GeminiService.chat()` aufruft.

Dieser Pfad muss ebenfalls einen Simulationsschritt ausführen.

Ablauf:

```text
Dialognachricht
    ↓
Teilnehmer bestimmen
    ↓
Dialogzeit berechnen
    ↓
WorldSimulationService.runSimulationStep({
    mode: 'dialogue',
    dialogueParticipantCount: ...
})
    ↓
aktualisierter World State
    ↓
Gemini mit aktualisiertem World State
    ↓
Antwort
    ↓
Persistenz
```

Die Simulation darf nur einmal pro gesendeter Nutzernachricht ausgeführt werden.

Nicht pro Gemini-Antwort.

Nicht per React Render.

Nicht per Timer.

Nicht im Hintergrund.

---

# 6. Teilnehmerzahl im Dialogmodus korrekt bestimmen

Die vorhandenen Dialogdaten sollen verwendet werden.

Grundregel:

```text
dialogueParticipantCount = 1 + Anzahl tatsächlich am Dialog beteiligter NPCs
```

Der Spieler/Nutzer wird immer als `1` gezählt.

Nur tatsächlich aktive Gesprächsteilnehmer zählen. NPCs, die lediglich in der Szene vorhanden sind, aber nicht am Dialog teilnehmen, dürfen die Zeit nicht erhöhen.

Danach auf maximal 5 Minuten begrenzen.

---

# 7. Finales Speichern muss den Simulation-World-State behalten

Nach Gemini-/Lore-/Character-Parsing darf der World State nicht wieder auf den ursprünglichen `adventure.world`-Stand zurückfallen.

Final:

```ts
onUpdateAdventure({
  ...adventureRef.current,
  ...,
  world: updatedWorld
});
```

wobei `updatedWorld` auf dem bereits simulierten World State basiert.

Bei konkurrierenden Änderungen gilt:

```text
Simulation World
      ↓
Parser darf Änderungen daran ergänzen
      ↓
Final World
```

nicht:

```text
Alter World
      ↓
Simulation
      ↓
Simulationsergebnis wegwerfen
      ↓
Alter World speichern
```

---

# 8. `scheduledEvents` darf keine zweite Wahrheit werden

`WorldSimulationService.scheduleEvent()` schreibt derzeit Events sowohl nach:

```ts
world.scheduledEvents
```

als auch nach:

```ts
world.dynamicWorldState.scheduledEvents
```

Das ist nur zulässig, wenn klar definiert ist, dass eines davon die kanonische Quelle und das andere ein synchronisiertes Spiegel-/Cache-Feld ist.

Empfehlung:

- `WorldSetting.scheduledEvents` = kanonische Quelle
- `dynamicWorldState.scheduledEvents` = synchronisiertes Laufzeit-Spiegelbild

Beim Lesen nicht beide Listen als zwei unabhängige Eventquellen behandeln und danach wieder zusammenwerfen, wenn dadurch unnötige Komplexität entsteht.

Die Event-ID muss weiterhin als Deduplication-Key dienen.

Bestehende Speicher-/Kompatibilitätslogik darf dabei nicht beschädigt werden.

---

# 9. Event-IDs und Determinismus verbessern

Die eigentliche Simulation soll bei gleichen Eingabedaten deterministisch bleiben.

Aktuell werden an mehreren Stellen IDs mit:

```ts
Date.now()
Math.random()
```

erzeugt.

Das ist für reine Laufzeit-UI-IDs nicht grundsätzlich problematisch, aber für World Events, Facts und Simulation-ChangeLogs ungünstig.

Für World-State-relevante IDs möglichst stabile, reproduzierbare IDs aus vorhandenen IDs und einem Simulationskontext verwenden.

Beispielprinzip:

```text
event_<sourceId>_<simulationStep>_<index>
fact_<eventId>
log_<eventId>_<changeType>
```

Keine zufällige ID darf notwendig sein, damit dieselbe Simulation korrekt funktioniert.

Bestehende IDs alter Spielstände müssen natürlich erhalten bleiben.

---

# 10. Simulation nur bei echter Nutzernachricht

Die bestehende Architekturregel bleibt strikt:

> **Zeit vergeht ausschließlich durch eine vom Nutzer gesendete und verarbeitete Nachricht.**

Nicht auslösen bei:

- Rendern
- `useEffect` ohne Nutzereingabe
- Öffnen eines Menüs
- Wechsel der Ansicht
- KI-Antwort allein
- Autosave allein
- Laden eines Spielstands
- Hintergrund-Timer
- `setInterval`
- `requestAnimationFrame`

---

# 11. Fehlerbehandlung

Wenn die Simulation fehlschlägt, darf nicht stillschweigend ein alter World State als „simuliert“ ausgegeben werden.

Die normale Chatverarbeitung soll entweder:

1. den Simulationsfehler sauber behandeln und die Nachricht nicht als abgeschlossenen Weltzug speichern, oder
2. klar auf einen sicheren unveränderten World State zurückfallen, ohne falschen Zeitfortschritt zu behaupten.

Keine teilweise angewendeten World-State-Änderungen speichern.

---

# 12. Tests erweitern

Die bestehenden World-State- und Persistence-Tests bleiben bestehen.

Zusätzliche Tests:

### Test A – Normaler Chat

```text
Startzeit: Tag 1, 08:00
Nachricht: „Ich gehe zum Markt.“
```

Erwartung: vorhandene normale Aktionszeitregel wird angewendet.

### Test B – Dialog mit einem NPC

```text
Nutzer + NPC
```

Erwartung:

```text
+2 Minuten
```

### Test C – Gruppendialog

```text
Nutzer + 3 NPCs
```

Erwartung:

```text
+4 Minuten
```

### Test D – Dialog-Cap

```text
Nutzer + 10 NPCs
```

Erwartung:

```text
+5 Minuten
```

### Test E – Simulation bleibt erhalten

Ein Event verändert einen Territory-/Economy-Wert.

Nach dem vollständigen Chat-Parsing muss dieser Wert noch vorhanden sein.

### Test F – Gemini bekommt aktuellen Zustand

Ein Simulationsschritt verändert z. B. die Kontrolle eines Territoriums.

Der Prompt für die KI muss den neuen Wert verwenden, nicht den Wert vor der Simulation.

### Test G – Dialogpfad

`handleSendDialogue()` muss ebenfalls genau einen Simulationsschritt ausführen.

### Test H – Keine doppelte Simulation

Eine Nutzernachricht darf die Weltzeit exakt einmal verändern.

### Test I – Save/Reload

Nach einem Chat mit Simulation:

```text
save → reload → World State vergleichen
```

Der simulierte Zustand muss identisch bleiben.

---

# 13. Definition of Done

Die Umsetzung ist erst abgeschlossen, wenn alle folgenden Aussagen wahr sind:

- [ ] Normaler Chat führt genau einen Simulation Step aus.
- [ ] Dialogmodus führt genau einen Simulation Step aus.
- [ ] Dialogzeit basiert ausschließlich auf Teilnehmerzahl.
- [ ] Nutzer zählt als Teilnehmer.
- [ ] Dialogzeit ist auf 5 Minuten begrenzt.
- [ ] Normaler Chat verwendet weiterhin Aktionsdauerregeln.
- [ ] `activeWorld`/Simulationsergebnis wird nicht überschrieben.
- [ ] Gemini erhält den aktualisierten World State.
- [ ] Parser basiert auf dem aktualisierten World State.
- [ ] Finaler Save verwendet den aktualisierten World State.
- [ ] Keine zweite unabhängige Welt-Datenbank entsteht.
- [ ] Scheduled Events bleiben konsistent.
- [ ] Keine Background-Zeit läuft.
- [ ] Battle-/Economy-/Territory-Änderungen aus der Simulation bleiben persistent.
- [ ] Bestehende 87/87 Tests bleiben grün bzw. werden entsprechend erweitert.
- [ ] TypeScript Build/Compile bleibt fehlerfrei.

---

# Architekturziel

```text
USER MESSAGE
     ↓
MESSAGE / MODE
     ↓
TIME RULE
     ↓
WORLD SIMULATION
     ↓
UPDATED WORLD STATE
     ↓
GEMINI RESPONSE
     ↓
PARSER MERGES ON UPDATED WORLD
     ↓
FINAL WORLD STATE
     ↓
PERSISTENCE
```

**Eine Welt. Eine Datenbasis. Zeit nur durch Handlung. Dialogzeit nach Teilnehmerzahl.**
