# AdventureForge – World Simulation & Event Architecture Audit

## Status

**Plan / Audit specification – implementation must begin with an audit of the existing code.**

This document defines the next architectural checkpoint for AdventureForge after the World State, Map, Combat Integration and Persistence foundations have been established.

> **Leitsatz:** Eine Welt. Eine Datenbasis. Zeit bewegt diese Welt – aber nur, wenn der Spieler handelt.

---

# 1. Ziel

AdventureForge soll keine Sammlung voneinander unabhängiger Systeme sein. Die Welt soll sich nachvollziehbar entwickeln und auf Handlungen des Spielers reagieren.

Der entscheidende Punkt für die Zeitlogik lautet:

> **Die Weltzeit läuft nicht in Echtzeit und nicht permanent im Hintergrund. Sie schreitet nur fort, wenn der Nutzer eine Nachricht im Chat sendet und diese Nachricht als Weltaktion verarbeitet wird.**

Eine Chat-Nachricht ist damit ein möglicher Zeitfortschritt / Simulationsschritt.

Beispiel:

```text
Spieler sendet Nachricht
        ↓
Nachricht wird verarbeitet
        ↓
Weltzeit wird fortgeschrieben
        ↓
World Simulation verarbeitet fällige Ereignisse
        ↓
World State wird aktualisiert
        ↓
Antwort der KI
```

Es darf **keinen permanent laufenden World-Tick** geben, der die Welt unabhängig vom Nutzer verändert.

---

# 2. Bestehende Architektur zuerst verstehen

Vor jeder Implementierung muss geprüft werden, was bereits vorhanden ist.

Nicht sofort neue Systeme bauen.

Zu untersuchen sind insbesondere:

- `WorldSetting`
- `dynamicWorldState`
- `StorageService`
- `WorldIntegrationService`
- Chat-/Message-Verarbeitung
- Weltzeit / Datums- / Zeitfelder
- Events
- History / Logs
- Faction-System
- Character/NPC-System
- Economy
- BattleInstance
- Tactical Combat
- Beziehungen
- Locations / Territories
- bestehende KI-Aktionen und World Updates

Für jedes gefundene System muss festgestellt werden:

1. Wo werden Daten gespeichert?
2. Wer liest sie?
3. Wer verändert sie?
4. Welche ID verbindet sie mit dem World State?
5. Wird die Änderung gespeichert?
6. Wird sie durch einen Chat-Schritt ausgelöst?
7. Ist sie dauerhaft oder nur UI-Zustand?

---

# 3. Zeitmodell

## 3.1 Keine Echtzeit-Simulation

AdventureForge verwendet **keine kontinuierliche Simulation**.

Nicht zulässig:

```text
setInterval(() => simulateWorld(), ...)
requestAnimationFrame(() => simulateWorld())
Background timer → World State
```

Die Welt darf sich nicht verändern, während der Spieler nichts tut.

---

## 3.2 Chat-Nachricht als Simulationsschritt

Eine erfolgreich verarbeitete relevante Chat-Nachricht kann einen neuen Weltzeitpunkt erzeugen.

Konzeptionell:

```text
Chat Message N
    ↓
Action / Intent
    ↓
Time Advancement
    ↓
Simulation Step
    ↓
World State Update
    ↓
Persist
    ↓
AI Response
```

Die konkrete Dauer muss aus dem bestehenden Spielmodell übernommen werden bzw. als explizite Spielregel definiert werden.

Es darf nicht stillschweigend eine zufällige Zeitspanne erfunden werden.

---

# 4. Unterschied zwischen Nachricht und Weltaktion

Nicht jede Chat-Nachricht muss automatisch denselben Zeitfortschritt erzeugen.

Das System muss vorhandene Message-/Action-Logik auditieren und unterscheiden können zwischen beispielsweise:

- Weltaktion des Spielers
- Gespräch ohne relevante Zeitbewegung
- UI-/Systembefehl
- Rückfrage / Korrektur
- Meta-Kommunikation

Die endgültige Regel muss aus dem bestehenden AdventureForge-Design abgeleitet werden.

Wichtig:

> **Es gibt keinen autonomen Zeitfortschritt nur deshalb, weil die Anwendung geöffnet ist.**

---

# 5. World Simulation

Die Simulation verarbeitet den World State schrittweise.

Konzeptionell:

```text
WORLD STATE
   │
   ├── World Time
   ├── Territories
   ├── Locations
   ├── Factions
   ├── Characters / NPCs
   ├── Relationships
   ├── Economy
   ├── Military
   ├── Trade
   └── Scheduled Events
          ↓
   SIMULATION STEP
          ↓
   EVENTS / CONSEQUENCES
          ↓
   WORLD STATE UPDATE
```

Die Simulation ist **ereignisorientiert**, nicht NPC-für-NPC-per-Tick.

---

# 6. Event-Modell

Ein World Event muss eine stabile ID besitzen.

Mindestens konzeptionell:

```ts
WorldEvent {
  id: string;
  type: string;
  createdAtWorldTime: WorldTime;
  scheduledForWorldTime?: WorldTime;
  sourceType?: string;
  sourceId?: string;
  territoryId?: string;
  locationId?: string;
  factionId?: string;
  characterId?: string;
  battleInstanceId?: string;
  status: "scheduled" | "pending" | "resolved" | "cancelled";
  priority?: number;
  data?: unknown;
}
```

Dies ist eine Prüfstruktur und kein Auftrag, exakt diese TypeScript-Struktur blind einzubauen.

Vorhandene Event-Typen müssen wiederverwendet bzw. erweitert werden, wenn sie die Anforderungen bereits erfüllen.

---

# 7. Event-Quellen

Events können aus bestehenden World-State-Systemen entstehen.

Mögliche Quellen:

- Spieleraktionen
- Charakterhandlungen
- NPC-Handlungen
- Fraktionen
- Militär
- Wirtschaft
- Handel
- Territorien
- Locations
- Beziehungen
- bestehende Story-/Questlogik
- abgeschlossene BattleInstances

Nicht jede mögliche Situation braucht ein Event.

Das Ziel ist eine kontrollierte Simulation, kein zufälliger Event-Spam.

---

# 8. Spieleraktionen und autonome Weltreaktionen

Es müssen zwei Ebenen unterschieden werden:

### Direkt durch Spieler ausgelöst

Beispiel:

```text
Spieler greift Banditen an
→ BattleInstance
→ Kampf
→ Ergebnis
→ World State Update
```

### Durch Weltreaktion ausgelöst

Beispiel:

```text
Spieler zerstört Handelsroute
→ Handelsvolumen sinkt
→ Fraktion erkennt wirtschaftliches Problem
→ Fraktion reagiert
→ Soldaten werden entsendet
→ mögliche BattleInstance
```

Die zweite Ebene darf nicht direkt in der Chat-Antwort erfunden werden, sondern muss auf dem World State und definierten Regeln beruhen.

---

# 9. Events müssen Voraussetzungen besitzen

Ein Event darf nicht einfach auftreten, weil die KI es dramatisch findet.

Beispiel:

```text
Banditenüberfall

Voraussetzungen:
- Handelsroute existiert
- Route ist aktiv
- Banditenfraktion besitzt geeignete Einheit
- Route liegt innerhalb relevanter Reichweite
- Cooldown erfüllt
- Weltzeit erreicht geplanten Zeitpunkt
```

Events brauchen nachvollziehbare Preconditions.

---

# 10. Event-Ergebnisse

Events können den World State verändern.

Beispiele:

- Kontrolle eines Territoriums
- Beziehung verändert sich
- Handelsroute wird unsicher
- Wirtschaftliche Produktion sinkt
- Gebäude wird beschädigt
- NPC wechselt Standort
- Fraktion mobilisiert Einheiten
- BattleInstance wird erzeugt
- Quest-/Storystatus verändert sich
- Geschichte / Ereignisprotokoll erhält Eintrag

Direkte Änderungen müssen über die bestehenden World-State-Update-Pipelines laufen.

Nicht jedes Modul darf seinen eigenen parallelen Weltzustand führen.

---

# 11. BattleInstance als Brücke

Die Simulation darf einen Kampf nicht direkt in die Tactical-Map-Logik hinein erfinden.

Korrekt:

```text
World Event
    ↓
BattleInstance erstellen
    ↓
Battle Location bestimmen
    ↓
Tactical Combat
    ↓
Combat Result
    ↓
WorldIntegrationService
    ↓
World State
```

Die bereits bestehende `BattleInstance`-Architektur und `WorldIntegrationService.completeBattleInstance` müssen wiederverwendet werden.

---

# 12. Combat → Simulation

Ein abgeschlossener Kampf kann weitere Events erzeugen.

Beispiel:

```text
BattleInstance abgeschlossen
        ↓
Sieger / Verlierer
        ↓
Verluste
        ↓
Territory Control
        ↓
Economy
        ↓
Faction Reaction Event
        ↓
World History
```

Der Kampf ist damit kein isolierter Minispielzustand.

---

# 13. Economy → World Simulation

Die Wirtschaft soll auf echte World-State-Zustände reagieren.

Beispiel:

```text
Territory unter Belagerung
        ↓
Handel reduziert
        ↓
Holding-Einnahmen verändert
        ↓
Versorgung verschlechtert sich
        ↓
Fraktion reagiert
```

Wirtschaftliche Auswirkungen müssen deterministisch und nachvollziehbar sein.

Keine zufälligen Geldänderungen ohne Quelle oder Regel.

---

# 14. NPC- und Fraktionsreaktionen

NPCs und Fraktionen sollen nicht jeden Simulationsschritt vollständig simulieren.

Stattdessen:

```text
relevante World-State-Änderung
        ↓
prüfen betroffene Akteure
        ↓
Conditions
        ↓
Reaction Event
```

Beispiel:

```text
Fraktion A verliert Gebiet
→ Verbündete prüfen Beziehung
→ militärische Stärke prüfen
→ Interessen prüfen
→ mögliche Reaktion erzeugen
```

Die KI darf dabei keine Beziehungen, Ziele oder Ressourcen erfinden, die nicht im World State vorhanden sind.

---

# 15. Beziehungen als Simulationsdaten

Beziehungen sind Teil des World State und können Event-Voraussetzungen und Konsequenzen beeinflussen.

Beispiel:

```text
Faction A und Faction B sind Verbündete
        ↓
Faction A wird angegriffen
        ↓
Alliance-Reaction Event
```

Dabei muss geprüft werden, ob das bestehende Relationship-System bereits geeignete IDs und Werte besitzt.

---

# 16. Scheduling

Events können für einen späteren Weltzeitpunkt geplant werden.

Beispiel:

```text
World Time: Tag 10, 14:00

Event:
Karawane verlässt Stadt
Scheduled: Tag 10, 18:00

Spieler schreibt weiter
→ Weltzeit 15:00
→ Event noch nicht fällig

Spieler schreibt weiter
→ Weltzeit 19:00
→ Event wird verarbeitet
```

Wichtig:

**Das Event wird nur verarbeitet, wenn ein neuer Simulationsschritt stattfindet.**

Es passiert nichts im Hintergrund um 18:00 Uhr, wenn der Spieler die Anwendung nicht benutzt.

---

# 17. Verarbeitung fälliger Events

Ein Simulationsschritt sollte konzeptionell:

```text
1. neuen World-Time-Wert bestimmen
2. fällige Events ermitteln
3. Events nach Priorität / Reihenfolge sortieren
4. Preconditions prüfen
5. Event ausführen
6. World State aktualisieren
7. Folgeevents erzeugen
8. History aktualisieren
9. persistieren
```

Die Reihenfolge muss deterministisch sein.

---

# 18. Determinismus

Gleicher Ausgangszustand + gleiche Spieleraktionen müssen bei gleichem Seed zu demselben Ergebnis führen.

Beispiel:

```text
World State A
+ gleiche Chat-Aktionen
+ gleicher Simulation Seed
= gleiche Weltentwicklung
```

Wenn Zufall benötigt wird, muss dieser kontrolliert und reproduzierbar sein.

Nicht zulässig:

```ts
Math.random()
```

wenn dadurch gespeicherter World State nicht reproduzierbar wird.

Das konkrete vorhandene Random-/Seed-System muss vor einer Änderung geprüft werden.

---

# 19. Event Loops verhindern

Folgeevents dürfen keine unkontrollierbaren Ketten erzeugen.

Problem:

```text
Event A
→ Event B
→ Event C
→ Event A
→ Event B
→ ...
```

Es müssen Schutzmechanismen geprüft bzw. implementiert werden:

- Event-ID / Processing-ID
- maximale Verarbeitungstiefe pro Simulationsschritt
- Cooldowns
- Preconditions
- Status `resolved` / `cancelled`
- eindeutige Ursachen

---

# 20. Atomic World Update

Ein Simulationsschritt darf nicht halb gespeichert werden.

Problemfall:

```text
Territory geändert
Economy geändert
Battle Event erstellt
Speichern schlägt fehl
```

Dann darf kein inkonsistenter Zustand zurückbleiben.

Die bestehende Persistenzschicht muss geprüft werden, insbesondere:

- `StorageService`
- Save-Verfahren
- WorldSetting
- dynamicWorldState
- BattleInstance
- Economy Holdings

Wenn bereits eine Transaktions-/Snapshot-Logik vorhanden ist, muss diese wiederverwendet werden.

---

# 21. History / Weltchronik

Wichtige World Events müssen nachvollziehbar bleiben.

Beispiel:

```text
Tag 14
Goblintruppen greifen Handelsroute Nord an.

Tag 14
Karawane zerstört.

Tag 15
Stadt A reduziert Handelsbeziehungen.

Tag 16
Fraktion B entsendet Truppen.
```

Dabei muss zwischen folgenden Ebenen unterschieden werden:

- technische Event-Daten
- historische Weltchronik
- für den Spieler sichtbare Informationen
- geheime / noch unbekannte Informationen

Die KI darf dem Spieler keine Informationen geben, die dessen Wissensstand überschreiten, nur weil sie intern im World State existieren.

---

# 22. Sichtbar vs. verborgen

Ein World Event kann intern stattfinden, ohne sofort im Chat erwähnt zu werden.

Beispiel:

```text
Intern:
Fraktion B beginnt Truppen zu sammeln.

Spieler weiß davon nichts.

Später:
Späher berichten über ungewöhnliche Truppenbewegungen.
```

Die Simulation und die Darstellung müssen deshalb getrennt bleiben.

---

# 23. Keine KI-Erfindung des World State

Die KI darf nicht einfach behaupten:

> "Während du geschlafen hast, hat Königreich A einen Krieg begonnen."

wenn kein entsprechendes Event existiert.

Korrekt:

```text
World State
→ geplantes Event
→ Simulation
→ World State Update
→ Chat-Erzählung
```

Die KI beschreibt die Welt.

Sie ist nicht automatisch die Datenbank der Welt.

---

# 24. Zeit und Chat-Antwort strikt trennen

Die Reihenfolge muss klar sein.

Empfohlen:

```text
USER MESSAGE
     ↓
MESSAGE PARSE / PLAYER ACTION
     ↓
DETERMINE TIME ADVANCEMENT
     ↓
SIMULATION STEP
     ↓
WORLD STATE UPDATE
     ↓
PERSIST
     ↓
GENERATE AI RESPONSE FROM UPDATED STATE
```

Die KI-Antwort darf also nicht zuerst eine Weltentwicklung erzählen und danach versuchen, diese zu speichern.

---

# 25. Reload / Save / Load

Nach einem Neustart muss die Welt exakt auf dem letzten gespeicherten Simulationspunkt fortgesetzt werden.

Beispiel:

```text
Tag 20, 12:00
↓
Spieler sendet Nachricht
↓
Tag 20, 13:00
↓
Event wird verarbeitet
↓
Save
↓
Reload
↓
Tag 20, 13:00
```

Nicht:

```text
Reload
→ Event läuft erneut
→ Zeit läuft weiter
→ doppelte Konsequenz
```

Event-Verarbeitung muss idempotent sein, sofern ein Event erneut aus einem gespeicherten Zustand geladen wird.

---

# 26. Performance

Die Welt muss nicht jeden NPC bei jedem Chat-Schritt simulieren.

Nicht erwünscht:

```text
100.000 NPC
×
jede Nachricht
×
alle Verhaltensregeln
```

Stattdessen:

```text
Chat Step
↓
relevante Events
↓
betroffene Regionen / Fraktionen / Charaktere
↓
notwendige Konsequenzen
```

Große Welten müssen damit skalierbar bleiben.

---

# 27. Weltzeit und Reisen

Reisen müssen als Zeitfortschritt behandelt werden.

Beispiel:

```text
Spieler reist von Stadt A nach Stadt B

Reisezeit: 8 Stunden

→ World Time +8h
→ alle zwischenzeitlich fälligen Events prüfen
→ Ankunft in Stadt B
```

Es darf dabei nicht zwingend jeder einzelne Stunde ein eigener Chat-/UI-Schritt erzeugt werden.

Die Simulation muss fällige Events innerhalb des Zeitfensters verarbeiten können.

---

# 28. Mehrere Events innerhalb eines Zeitfensters

Wenn eine Spieleraktion beispielsweise 8 Stunden dauert, können mehrere Events fällig werden.

```text
Start: Tag 10, 08:00
Ende:  Tag 10, 16:00

10:00 Event A
12:00 Event B
15:30 Event C
```

Diese müssen in deterministischer zeitlicher Reihenfolge verarbeitet werden.

---

# 29. Abhängige Events

Ein Event kann ein anderes Event beeinflussen.

Beispiel:

```text
10:00 Karawane startet
12:00 Banditenüberfall
14:00 Karawane sollte ankommen
```

Wenn die Karawane um 12:00 zerstört wurde, darf das 14:00-Ankunftsevent nicht mehr einfach ausgeführt werden.

Preconditions und Cancellation müssen dies verhindern.

---

# 30. Simulation Scope

Nicht jede Weltinformation muss bei jedem Chat-Schritt neu berechnet werden.

Die Simulation soll bevorzugt:

- fällige Events
- betroffene Systeme
- relevante Konsequenzen
- notwendige Derived Data

verarbeiten.

Caches und abgeleitete Werte dürfen nicht zur zweiten Wahrheit werden.

---

# 31. Bestehende Services wiederverwenden

Vor dem Bau eines `WorldSimulationService` muss geprüft werden, ob bereits ein vergleichbarer Service existiert.

Falls vorhanden:

- erweitern
- stabilisieren
- Verantwortlichkeiten bereinigen

statt einen zweiten parallelen Service zu bauen.

Falls ein neuer Service notwendig ist, soll er klar zwischen folgenden Aufgaben trennen:

```text
Time Advancement
Event Scheduling
Event Processing
World State Mutation
Persistence
```

---

# 32. Keine zweite Welt-Datenbank

Das Event-System darf keine eigene vollständige Kopie von:

- Territories
- Factions
- Characters
- Economy
- Locations

halten.

Events speichern Referenzen über stabile IDs und nur die für das Ereignis notwendigen Daten.

---

# 33. Audit-Matrix

| Bereich | Prüfen |
|---|---|
| World Time | zentrale Quelle? |
| Chat Message | löst Simulationsschritt aus? |
| Time Advance | deterministisch? |
| World Event | stabile ID? |
| Scheduling | vorhanden / dupliziert? |
| Preconditions | vorhanden? |
| Event Processing | deterministisch? |
| Event Chain | geschützt? |
| Territory | echte World-State-Referenz? |
| Location | stabile ID? |
| Faction | stabile ID? |
| Character | stabile ID? |
| Economy | World-State-gebunden? |
| Battle | erzeugt BattleInstance? |
| Tactical | arbeitet mit Snapshot? |
| History | Events nachvollziehbar? |
| Knowledge | verborgen/sichtbar getrennt? |
| Persistence | atomar? |
| Reload | identischer Zustand? |
| Randomness | Seed-basiert? |
| Performance | eventorientiert? |

---

# 34. Tests

Mindestens folgende Tests müssen nach der Implementierung existieren bzw. vorhandene Tests erweitert werden.

### Test 1 – keine Hintergrundsimulation

```text
World State speichern
Warten / App offen lassen
kein Chat
→ World State unverändert
```

### Test 2 – Chat-Schritt

```text
Chat Message
→ definierter Zeitfortschritt
→ Simulation läuft
```

### Test 3 – geplantes Event

```text
Event liegt in Zukunft
→ noch nicht ausgeführt

Zeit wird durch Chat fortgeschrieben
→ Event wird fällig
→ genau einmal ausgeführt
```

### Test 4 – mehrere Events

```text
Zeitfenster enthält mehrere Events
→ alle fälligen Events
→ korrekte Reihenfolge
```

### Test 5 – Event-Abhängigkeit

```text
Event A verhindert Event B
→ B wird cancelled / übersprungen
```

### Test 6 – Event Loop

```text
A → B → A
→ Schutzmechanismus greift
```

### Test 7 – Battle Integration

```text
World Event
→ BattleInstance
→ Combat
→ Result
→ World State
```

### Test 8 – Economy Integration

```text
World Event
→ Territory / Trade Änderung
→ Economy reagiert
```

### Test 9 – Persistence

```text
Simulation
→ Save
→ Reload
→ gleicher Zustand
```

### Test 10 – Idempotency

```text
Event erneut verarbeitet
→ keine doppelte Konsequenz
```

### Test 11 – Determinismus

```text
gleicher Seed
+ gleicher World State
+ gleiche Chat-Aktionen
→ gleicher World State
```

### Test 12 – Hidden Knowledge

```text
internes Event
→ Spieler bekommt Information erst über gültige Wissensquelle
```

---

# 35. Golden World Simulation Test

Zusätzlich soll eine kleine Testwelt verwendet werden.

Beispiel:

```text
Territory: Northvale
Location: Northvale Market
Faction A: Kingdom
Faction B: Bandits
Trade Route: North Road
Economy Holding: Market
Character: Merchant
```

Ablauf:

```text
1. Spieler reist zur Stadt
2. Zeit schreitet fort
3. Karawane startet
4. Banditenevent wird fällig
5. BattleInstance entsteht
6. Kampf wird abgeschlossen
7. Handelsroute wird unsicher
8. Economy reagiert
9. Fraktion reagiert
10. World History erhält Einträge
11. Save
12. Reload
```

Der komplette Ablauf muss nach Reload konsistent sein.

---

# 36. Definition of Done

Die World Simulation gilt als integriert, wenn:

- [ ] keine Echtzeit-World-Simulation im Hintergrund läuft
- [ ] Weltzeit nur durch definierte Spieler-/Chat-Schritte fortschreitet
- [ ] World State zentrale Wahrheit bleibt
- [ ] Events stabile IDs besitzen
- [ ] Events Preconditions besitzen können
- [ ] Events deterministisch verarbeitet werden
- [ ] geplante Events erst bei einem späteren Simulationsschritt ausgeführt werden
- [ ] mehrere fällige Events korrekt verarbeitet werden
- [ ] Event Loops verhindert werden
- [ ] Battle Events über `BattleInstance` laufen
- [ ] Combat-Ergebnisse zurück in den World State laufen
- [ ] Economy auf World-State-Änderungen reagiert
- [ ] NPC-/Faction-Reaktionen datenbasiert sind
- [ ] History nachvollziehbar bleibt
- [ ] verborgenes Wissen nicht automatisch als Spielerwissen ausgegeben wird
- [ ] Save/Load den Simulationszustand erhält
- [ ] Events nicht doppelt ausgeführt werden
- [ ] Zufall reproduzierbar ist, sofern verwendet
- [ ] große NPC-Mengen nicht vollständig pro Chat-Schritt simuliert werden
- [ ] bestehende Systeme wiederverwendet werden
- [ ] Tests erfolgreich sind

---

# 37. KI-Entwicklungsregel

Vor jeder Änderung an der World Simulation muss die KI beantworten können:

1. Welche Datenquelle ist die Wahrheit?
2. Welche stabile ID wird verwendet?
3. Wer liest die Daten?
4. Wer schreibt die Daten?
5. Welche bestehenden Services sind betroffen?
6. Welche Folgeevents können entstehen?
7. Wird die Änderung gespeichert?
8. Ist die Änderung durch einen Chat-/Spieler-Schritt ausgelöst?
9. Ist sie deterministisch?
10. Kann die Änderung doppelt ausgeführt werden?
11. Kann dadurch ein Event Loop entstehen?
12. Welche Informationen darf der Spieler davon tatsächlich wissen?

Wenn diese Fragen nicht beantwortet werden können, darf nicht einfach neuer Simulationscode geschrieben werden.

---

# 38. Implementierungsreihenfolge

Die tatsächliche Arbeit soll in dieser Reihenfolge erfolgen:

### Phase 1 – Audit

Bestehende Zeit-, Chat-, Event-, History- und Simulation-Logik vollständig erfassen.

### Phase 2 – Time Advancement

Zentrale und deterministische Regel für Weltzeit definieren und an den bestehenden Chat-/Action-Flow anbinden.

### Phase 3 – Event Foundation

Bestehende Event-Strukturen vereinheitlichen und stabile IDs / Status / Scheduling sicherstellen.

### Phase 4 – Simulation Step

Einen klaren Simulationsschritt etablieren, der nur bei einem gültigen Zeitfortschritt ausgeführt wird.

### Phase 5 – Existing Systems

Territory, Location, Faction, Character, Economy und BattleInstance anbinden.

### Phase 6 – Consequences

Folgeevents, Reaktionen und History integrieren.

### Phase 7 – Persistence

Save/Load, Idempotency und Recovery testen.

### Phase 8 – Tests

Golden World und deterministische Simulationstests durchführen.

---

# 39. Was ausdrücklich NICHT gebaut werden soll

Nicht bauen:

- einen permanenten Echtzeit-Ticker
- einen zufälligen Event-Generator ohne World-State-Bezug
- eine zweite World-Datenbank
- einen zweiten parallelen Battle-State
- NPC-Simulation jedes einzelnen NPCs bei jeder Nachricht
- KI-generierte Weltänderungen ohne Event/Regel
- nicht reproduzierbaren Zufall
- direkte Tactical-Map-Manipulation aus beliebigem Event-Code
- automatische Weltänderung nur weil die App geöffnet ist

---

# 40. Zielarchitektur

```text
                 PLAYER CHAT MESSAGE
                         │
                         ▼
                PLAYER ACTION / INTENT
                         │
                         ▼
                  TIME ADVANCEMENT
                         │
                         ▼
                 WORLD SIMULATION STEP
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       EVENTS         REACTIONS      SCHEDULED
          │              │           EVENTS
          └──────────────┼──────────────┘
                         ▼
                  WORLD STATE UPDATE
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    TERRITORY         ECONOMY           FACTIONS
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                   BATTLE INSTANCE
                         │
                         ▼
                   TACTICAL COMBAT
                         │
                         ▼
                  COMBAT RESULT
                         │
                         ▼
                 WORLD STATE UPDATE
                         │
                         ▼
                     PERSIST
                         │
                         ▼
                    AI RESPONSE
```

---

# 41. Endzustand

AdventureForge soll sich am Ende so verhalten:

> Der Spieler schreibt eine Nachricht. Diese Handlung bewegt die Weltzeit entsprechend der Spielregeln. Dadurch werden nur die für diesen Zeitraum relevanten Weltprozesse verarbeitet. Ereignisse verändern den gemeinsamen World State. Kämpfe werden als BattleInstances erzeugt. Wirtschaft, Fraktionen, Charaktere und Territorien reagieren auf dieselben Daten. Anschließend wird der neue Zustand gespeichert und die KI beschreibt dem Spieler die daraus entstandene Situation.

Damit bleibt das zentrale Prinzip erhalten:

# **Eine Welt. Eine Datenbasis. Zeit nur durch Handlung. Mehrere Darstellungen.**
