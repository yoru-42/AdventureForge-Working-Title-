# AdventureForge – Multi-Force Tactical Battle System

## 1. Ziel

Der aktuelle Kampfeinstieg behandelt sichtbare Gegner zu stark wie einzelne Gegner-Datensätze. Das reicht für AdventureForge nicht aus.

Eine Chat-Szene kann mehrere Gruppen gleichzeitig enthalten. Diese Gruppen können:

- miteinander verbündet sein,
- miteinander feindlich sein,
- neutral zueinander sein,
- den Spieler gemeinsam angreifen,
- den Spieler getrennt angreifen,
- oder untereinander kämpfen.

Der taktische Kampf muss deshalb ein **Mehrparteien-Gefecht** darstellen können.

Beispiel für die aktuelle Szene:

```text
Spieler
   │
   ├── eigene Seite
   │
   ├── Gruppe 1: Späher
   │      └── z.B. 20 Einheiten
   │
   └── Gruppe 2: stämmiger Krieger mit Eisenkeule
          └── z.B. 1 Einheit
```

Je nach aus dem Chat ermittelter Beziehung kann daraus z.B. werden:

```text
                    ┌── Gruppe 1: Späher
                    │
Spieler + Verbündete ┤
                    │
                    └── Gruppe 2: Krieger

```

oder ein echtes Free-for-All:

```text
Gruppe 1  ↔  Spieler  ↔  Gruppe 2
   ↕             ↕          ↕
Gruppe 3  ↔  Gruppe 4  ↔  Gruppe 5
```

Wichtig ist nicht die konkrete Anzahl, sondern dass die Kampfteilnehmer **nicht künstlich auf "Spieler gegen eine Gegnergruppe" reduziert werden**.

---

## 2. Zentrales Architekturprinzip

Die Kampfauswahl darf nicht nur einen einzelnen Gegner auswählen.

Sie muss einen **Encounter mit mehreren Forces** in den Kampf übernehmen können.

Die Begriffe sind klar zu trennen:

```text
Chat-Szene
    ↓
Encounter
    ↓
EncounterForce × N
    ↓
TacticalGroup × N
    ↓
TacticalEntity × N
```

Dabei gilt:

- `EncounterForce` = eine zusammengehörige Kraft / Gruppe innerhalb des Gefechts.
- `TacticalGroup` = taktische Formation dieser Kraft.
- `TacticalEntity` = einzelne Figur auf dem taktischen Raster.
- `BattleInstance` = das gesamte laufende Gefecht.

Ein Gefecht kann also mehrere `EncounterForce` und mehrere `TacticalGroup` besitzen.

---

## 3. Warum die aktuelle UI irreführend ist

Die Kampfauswahl zeigt derzeit beispielsweise:

```text
Späher
stämmiger Krieger mit Eisenkeule
Späher (Gruppe von ca. 20)
```

Das suggeriert drei unabhängig auswählbare Gegner.

Wenn der Chat aber beschreibt, dass mehrere dieser Personen **gemeinsam als Gruppe auftreten**, darf der Nutzer nicht gezwungen werden, sie einzeln in den Kampf zu übernehmen.

Die Auswahl sollte vielmehr konzeptionell sein:

```text
KAMPF VORBEREITEN

Teilnehmende Gruppen

[ Späher-Gruppe ]
  ca. 20 Einheiten

[ Krieger / Kaidos Armee ]
  1 Einheit

[ weitere erkannte Gruppe ]
  ...

Beziehungen:
  Gruppe A ↔ Gruppe B = feindlich
  Gruppe A ↔ Spieler = feindlich
  Gruppe B ↔ Spieler = feindlich

          KAMPF BEGINNEN
```

Die genaue UI darf später verbessert werden. Zuerst muss das Datenmodell diese Situation korrekt abbilden.

---

## 4. Kein "selectedEnemyId"-Kampfmodell mehr als alleinige Wahrheit

Bestehende Felder wie:

```ts
selectedEnemyId
selectedEnemyIds
opponents[]
```

dürfen aus Kompatibilitätsgründen bestehen bleiben.

Sie dürfen aber nicht die einzige Quelle für die taktischen Teilnehmer sein.

Für ein Mehrparteien-Gefecht muss die Produktion die tatsächlichen Teilnehmer aus den vorhandenen Encounter-/Force-Daten übernehmen.

Insbesondere darf dieser Fehler nicht passieren:

```text
Encounter enthält:
  Force A = Spähergruppe
  Force B = Krieger
  Force C = weitere Gruppe

↓

CombatState.opponents = [nur Force A]

↓

TacticalCombatMap
  = nur Force A
```

Das würde die Weltinformation des Encounters verlieren.

---

## 5. Beziehungen zwischen Forces

Der wichtigste neue Punkt ist die Beziehung zwischen den Kampfteilnehmern.

Nicht jeder Teilnehmer ist automatisch ein Gegner des Spielers.

Für jedes Paar von Forces muss die Kampflogik grundsätzlich unterscheiden können zwischen:

```text
ally
hostile
disputed
neutral
```

oder einer bereits im Projekt vorhandenen äquivalenten Relation.

Beispiel:

```text
                 Spieler   Späher   Kaido-Krieger
Spieler             —       Feind       Feind
Späher            Feind       —         Verbündet
Kaido-Krieger     Feind    Verbündet       —
```

Dann ist das Gefecht:

```text
Spieler + Späher + Kaido-Krieger
```

aber die taktische Engine muss anhand der Beziehungen entscheiden, wer wen angreifen darf bzw. als gültiges Ziel betrachtet.

Wenn dagegen:

```text
Spieler ↔ Späher      feindlich
Spieler ↔ Krieger     feindlich
Späher ↔ Krieger      feindlich
```

gilt, muss ein echtes Drei-Parteien-Gefecht möglich sein:

```text
Spieler  ↔  Späher
   ↕           ↕
Krieger  ↔  Späher
   ↕
Spieler
```

Der Spieler darf nicht automatisch zur einzigen feindlichen Seite gemacht werden.

---

## 6. Spieler und Verbündete

Ein Spieler kann ebenfalls mehrere verbündete Kräfte im Kampf haben.

Beispiel:

```text
Spieler
  +
Verbündeter NPC
  +
Verbündete Gruppe von 10 Soldaten
```

Diese müssen auf der Karte als getrennte taktische Gruppen erscheinen können:

```text
TacticalGroup: Player
TacticalGroup: Allied NPC
TacticalGroup: Allied Soldiers
```

Sie sind taktisch getrennt steuerbar, können aber dieselbe Allianz-/Teambeziehung besitzen.

Nicht alles, was auf derselben Seite steht, darf deshalb zu einer einzigen `TacticalGroup` verschmolzen werden.

**Seite/Team und TacticalGroup sind unterschiedliche Konzepte.**

---

## 7. Mehrere feindliche Gruppen

Das ist ein Kernfall für AdventureForge.

Beispiel:

```text
Spieler
  │
  ├── Verbündeter NPC
  │
  ├── Spähergruppe × 20
  │
  ├── Kriegergruppe × 5
  │
  └── dritte feindliche Gruppe × 12
```

Die taktische Karte muss alle drei feindlichen Gruppen gleichzeitig darstellen:

```text
       [Späher ×20]
             ↓
[Spieler] ←→ [Krieger ×5]
             ↑
       [Gruppe ×12]
```

Die Gruppen müssen **nicht** in einen einzigen Gegnerblock zusammengeführt werden.

Das ist wichtig für:

- unterschiedliche Positionen,
- unterschiedliche Formationen,
- unterschiedliche Ziele,
- unterschiedliche Moral,
- unterschiedliche Bewegungen,
- unterschiedliche Fraktionen,
- Friendly Fire / gegenseitige Feindschaft,
- dynamische Allianzen,
- Flucht,
- Verstärkung,
- Gruppenspaltung,
- spätere Befehle gegen andere Gruppen.

---

## 8. Alle relevanten Gruppen müssen beim Kampfbeginn gespawnt werden

Wenn ein Encounter mehrere aktive Forces enthält, muss `BattleInstance` diese vollständig übernehmen.

Beispiel:

```text
Encounter
 ├─ Force A: Späher ×20
 ├─ Force B: Krieger ×1
 └─ Force C: Banditen ×8
```

Dann:

```text
BattleInstance
 ├─ tacticalGroupIds: [A, B, C]
 └─ participant force relations
```

und taktisch:

```text
TacticalGroup A
 └─ 20 TacticalEntities

TacticalGroup B
 └─ 1 TacticalEntity

TacticalGroup C
 └─ 8 TacticalEntities
```

Es darf nicht nur die zuerst ausgewählte Force gespawnt werden.

---

## 9. Gruppen und einzelne Figuren

Ein Named Character kann eine eigene Force darstellen:

```text
Force B
  name = "stämmiger Krieger mit Eisenkeule"
  count = 1
```

Eine anonyme Gruppe kann darstellen:

```text
Force A
  name = "Späher"
  count = 20
```

Daraus entstehen:

```text
TacticalGroup B
  └─ Krieger

TacticalGroup A
  ├─ Späher 1
  ├─ Späher 2
  ├─ ...
  └─ Späher 20
```

Es ist **nicht** erforderlich, 20 Codex-Charaktere anzulegen.

Das bereits vorhandene Modell für anonyme `TacticalEntity`-Objekte soll verwendet werden.

---

## 10. Taktische Ziele müssen gruppenübergreifend funktionieren

Die Tactical Engine darf nicht grundsätzlich davon ausgehen:

```ts
allEnemies = allEntitiesExceptPlayer
```

Das wäre für Mehrparteienkämpfe falsch.

Stattdessen muss die Zielgültigkeit auf den vorhandenen Force-/Gruppenbeziehungen basieren.

Beispiele:

```text
Spieler → Späher       gültig
Spieler → Verbündeter  ungültig
Späher → Krieger       je nach Relation gültig/ungültig
Krieger → Späher       je nach Relation gültig/ungültig
Späher → eigener Späher ungültig
```

Wenn zwei Gruppen feindlich zueinander sind, müssen sie sich gegenseitig angreifen können.

---

## 11. Beziehungen dürfen während des Kampfes verändert werden

Die Architektur sollte nicht davon ausgehen, dass Teambeziehungen für immer feststehen.

Beispiele:

```text
Späher und Krieger sind zunächst verbündet.

Spieler überzeugt den Krieger.

→ Krieger wechselt Seite.
```

oder:

```text
Dritter Feind greift Späher an.

Späher und Spieler schließen kurzfristig Waffenstillstand.
```

Das bedeutet nicht, dass sofort ein neues Kampfsystem gebaut werden muss.

Aber `BattleInstance` / taktische Gruppen dürfen nicht so implementiert werden, dass ein einmaliger `isEnemy === true`-Wert die gesamte Zukunft des Gefechts festschreibt.

Wenn das Projekt bereits relationale Daten für Factions/Characters besitzt, sollen diese wiederverwendet werden.

---

## 12. Startpositionen

Mehrere Forces müssen getrennt gespawnt werden.

Nicht alle Gruppen dürfen auf derselben Startposition erscheinen.

Beispiel:

```text
             Späher
          [ ][ ][ ][ ]


Spieler                  Krieger
 [P]                    [K][K]


             Gruppe C
          [ ][ ][ ][ ]
```

Die vorhandene Spawn-/Formation-Logik soll verwendet werden.

Falls bereits `spawnSource`, `center`, `anchorPosition`, `direction` oder ähnliche Informationen vorhanden sind, sollen diese genutzt werden.

Keine neue parallele Spawn-Engine bauen.

---

## 13. Kampfauswahl soll einen Encounter starten, nicht nur einen Gegner

Die UX sollte langfristig ungefähr diesem Prinzip folgen:

```text
KAMPF VORBEREITEN

Erkannte Kampfparteien:

☑ Spieler
☑ Verbündete Gruppe
☑ Späher – 20
☑ Krieger – 1
☑ weitere Gruppe – 8

Beziehungen werden aus Szene / Welt / Fraktionen übernommen.

                 KAMPF BEGINNEN
```

Optional kann der Nutzer später einzelne Forces deaktivieren, wenn das Spielkonzept dies erlaubt.

Aber der Default muss sein:

**Wenn mehrere Gruppen real an der Szene teilnehmen, erscheinen sie auch im Kampf.**

Es darf nicht automatisch nur die zuletzt angeklickte Gegnerkarte verwendet werden.

---

## 14. Chat als Quelle der Kampfsituation

Die Chatbeschreibung ist für die Ermittlung der aktuellen Szene relevant.

Beispiel:

```text
Zwei Männer treten aus dem Unterholz.

Der Späher und der Krieger bemerken den Spieler.

Der Krieger gehört zu Kaidos Armee.

Der Späher arbeitet für eine andere Gruppe.
```

Daraus darf nicht einfach werden:

```text
player vs generic enemy
```

Sondern die Szene muss erhalten:

```text
Force: Späher
Force: Kaido-Krieger
Player

Relations:
  Player ↔ Späher = hostile
  Player ↔ Krieger = hostile
  Späher ↔ Krieger = hostile/ally/neutral
```

Die konkrete Beziehung muss aus vorhandenen Welt-/Charakter-/Fraktionsdaten und den tatsächlich erkannten Informationen kommen.

Die KI darf keine Allianz nur deshalb erfinden, weil zwei Gegner gleichzeitig im Chat erwähnt wurden.

Ebenso darf sie keine Feindschaft erfinden, wenn die Szene sie nicht hergibt.

---

## 15. BattleInstance als Container des gesamten Gefechts

`BattleInstance` muss den gesamten Encounter repräsentieren.

Konzeptionell:

```ts
interface BattleInstance {
  id: string;
  tacticalGroupIds: string[];
  // vorhandene Teilnehmer-/Force-/Relationsdaten weiterverwenden
}
```

Falls das Projekt bereits ein geeignetes Feld für Teilnehmerbeziehungen besitzt, dieses verwenden.

Falls ein neues Feld wirklich notwendig ist, soll es klein und eindeutig sein, z.B.:

```ts
interface BattleParticipantRelation {
  fromForceId: string;
  toForceId: string;
  relation: 'ally' | 'hostile' | 'neutral' | 'disputed';
}
```

Nicht mehrere konkurrierende Relation-Systeme bauen.

---

## 16. Bestehende Architektur wiederverwenden

Die folgenden vorhandenen Strukturen sind ausdrücklich zu prüfen und wiederzuverwenden:

- `EncounterForce`
- `BattleInstance`
- `CombatState`
- `TacticalGroup`
- `TacticalEntity`
- `spawnTacticalGroup()`
- bestehende Faction-/Character-Beziehungen
- bestehende Enemy-/Encounter-Daten
- bestehende Formation-/Spawn-Logik

Die vorhandene `TACTICAL_ENCOUNTER_GROUP_SPAWN_FIX.md` bleibt gültig.

Diese Aufgabe **ersetzt** den Gruppen-Spawn-Fix nicht, sondern erweitert ihn:

```text
TASK 1:
Eine Gruppe von 20 wird korrekt als TacticalGroup × 20 Einheiten gespawnt.

TASK 2:
Mehrere solche TacticalGroups werden gemeinsam als ein BattleInstance gespawnt.
```

Beides muss gleichzeitig funktionieren.

---

## 17. Produktionspfad prüfen

Vor Änderungen den tatsächlichen Produktionspfad untersuchen:

```text
Chat
 ↓
Encounter-Erkennung
 ↓
Combat Preparation
 ↓
Encounter / EncounterForces
 ↓
BattleInstance
 ↓
CombatState
 ↓
TacticalCombatMap
 ↓
TacticalGroup × N
 ↓
TacticalEntity × N
```

Feststellen:

1. Wo werden mehrere Gruppen derzeit erkannt?
2. Wo werden sie auf einen einzelnen Gegner reduziert?
3. Wo geht die Force-ID verloren?
4. Wo werden Beziehungen zwischen Gruppen verloren?
5. Wo werden nur `selectedEnemyId` oder `opponents[]` weitergereicht?
6. Wo wird `BattleInstance.tacticalGroupIds` befüllt?
7. Wo werden TacticalGroups tatsächlich gespawnt?
8. Wo entscheidet die Tactical Engine, ob ein Ziel feindlich ist?

Keine reine UI-Korrektur durchführen.

---

## 18. Akzeptanztests

### A – Eine einzelne Gruppe

```text
Späher ×20
```

→ eine TacticalGroup mit 20 TacticalEntities.

### B – Zwei getrennte Gruppen

```text
Späher ×20
Krieger ×1
```

→ zwei TacticalGroups auf derselben BattleInstance.

### C – Drei Gruppen

```text
Späher ×20
Krieger ×5
Banditen ×8
```

→ drei TacticalGroups sichtbar.

### D – Spieler + Verbündete + Gegner

Spieler und verbündete NPC-/Gruppen-Force werden gemeinsam mit den Gegnern gespawnt.

### E – Gegner gegen Gegner

Wenn Force A und Force B feindlich zueinander sind, dürfen A und B sich gegenseitig als gültige Ziele auswählen.

### F – Verbündete greifen sich nicht an

Wenn Force A und Force B verbündet sind, dürfen sie sich nicht versehentlich als feindliche Ziele behandeln.

### G – Mehrere Feindgruppen

Spieler + Verbündeter gegen Force A + Force B + Force C.

Alle vier/vier+ Gruppen erscheinen gleichzeitig.

### H – Kein automatisches Zusammenführen

Zwei unterschiedliche Forces bleiben zwei TacticalGroups, auch wenn sie derselben Fraktion angehören, sofern sie als getrennte Kräfte im Encounter auftreten.

### I – Gruppengröße bleibt erhalten

Force A `count = 20` → TacticalGroup `spawnedCount = 20` und 20 TacticalEntities.

### J – BattleInstance vollständig

Alle tatsächlich gestarteten TacticalGroups sind in derselben BattleInstance verknüpft.

### K – Startpositionen getrennt

Die Gruppen erscheinen nicht alle auf derselben Position.

### L – Einzelcharakter bleibt Einzelcharakter

Ein einzelner benannter Krieger bleibt eine einzelne TacticalEntity bzw. eine Einheiten-Gruppe mit Count 1.

### M – Keine 20 Codex-NPCs

Anonyme Gruppenmitglieder bleiben anonyme TacticalEntities.

### N – Zielauswahl

Die gültigen Ziele werden aus den Force-/Gruppenbeziehungen bestimmt, nicht nur aus `player vs enemy`.

### O – Keine Duplikate

Der Start des TacticalCombatMap erzeugt keine zweite Kopie einer bereits vorhandenen TacticalGroup.

### P – Save/Reload

BattleInstance, TacticalGroups, TacticalEntities und Teilnehmerbeziehungen bleiben nach Save/Reload korrekt erhalten.

### Q – Chat-Kontext

Die KI erhält den vollständigen aktuellen Kampfkontext mit allen relevanten Forces und ihren Beziehungen.

---

## 19. Regression

Nach der Implementierung müssen mindestens folgende Prüfungen bestehen:

- TypeScript Compile
- Lint
- bestehende Tactical-Movement-Tests
- bestehende Group-Spawn-Tests
- World-State-Tests
- World-Simulation-Tests
- Persistence-Tests
- Travel-Tests
- keine doppelten TacticalEntities
- keine doppelten TacticalGroups
- keine falschen React-Keys
- keine Regression bei Einzelgegnern

---

## 20. Nicht bauen

Nicht als Teil dieser Aufgabe bauen:

- neues Kampfsystem
- neues Schadenssystem
- neue KI für taktische Aktionen
- neue Formation-Engine
- neue Map-Engine
- neuen World-State
- neuen NPC-Datensatz für jedes Gruppenmitglied
- neues separates Fraktionssystem
- neues separates Beziehungs-/Diplomatiesystem
- Echtzeit-Simulation

Es geht um die korrekte Abbildung eines **mehrteiligen Encounters innerhalb des bestehenden taktischen Systems**.

---

## 21. Wichtigster Unterschied zum bisherigen Gruppen-Fix

Der bisherige Gruppen-Fix sagt:

```text
1 EncounterForce
    ↓
1 TacticalGroup
    ↓
N TacticalEntities
```

Diese Aufgabe ergänzt:

```text
N EncounterForces
    ↓
N TacticalGroups
    ↓
N × TacticalEntities
```

und zusätzlich:

```text
Force A ↔ Force B
Force A ↔ Force C
Force B ↔ Force C
```

Die Beziehungen entscheiden, wer wen als Ziel behandeln darf.

---

## 22. Leitprinzip

**Ein Kampf ist keine Beziehung "Spieler gegen Gegner". Ein Kampf ist eine Menge von Kampfparteien mit Beziehungen untereinander.**

**Eine Gruppe ist eine Kampfpartei. Eine einzelne Figur kann ebenfalls eine Kampfpartei sein. Mehrere Kampfparteien können gleichzeitig auf derselben taktischen Karte existieren.**

Für AdventureForge muss deshalb gelten:

```text
Chat-Szene
    ↓
alle relevanten Kampfparteien
    ↓
ihre Gruppen
    ↓
ihre Beziehungen
    ↓
alle TacticalGroups
    ↓
alle TacticalEntities
    ↓
ein gemeinsames BattleInstance
```

**Nicht: Spieler + ausgewählter Gegner.**

**Sondern: Die komplette aktuelle Kampfsituation.**
