# AdventureForge – World Integration Validation & Context Resolution

## Ziel

Diese Phase härtet die bereits vorhandene World-Integration von AdventureForge. Es geht **nicht** darum, ein neues Welt-, Lore- oder Kampfsystem zu bauen.

AdventureForge soll vorhandene Weltinformationen korrekt miteinander verbinden und aus einer erzählten Situation ableiten können, **was tatsächlich passiert**.

Die Architektur bleibt:

```text
Chat / Story AI
      ↓
Structured World Event / Intent
      ↓
Validation & Context Resolution
      ↓
World State / EncounterForce
      ↓
optional Tactical Spawn
      ↓
Tactical Engine
      ↓
Combat Result
      ↓
World State
```

Die vorhandenen Systeme bleiben Single Source of Truth:

- Codex / LoreDatabase = dauerhafte Definitionen und Wissen
- WorldKnowledgeService / WorldFacts = bekannte Zusammenhänge und Fakten
- WorldSetting / DynamicWorldState = aktueller Weltzustand
- WorldIntegrationService = Verbindung und Auflösung
- EncounterForce = konkrete aktuelle Streitmacht/Situation
- Tactical Engine = lokale taktische Darstellung und Bewegung

---

# 1. Bestehenden Code weiterverwenden

Vor Änderungen zuerst den aktuellen Code prüfen. Insbesondere:

- `services/worldIntegrationService.ts`
- `services/worldKnowledgeService.ts`
- `types.ts`
- `components/GameView.tsx`
- `utils/tacticalEngine.ts`
- alle bestehenden World-Event-/Status-/Encounter-Strukturen

**Keine parallele zweite Implementierung bauen.**

Wenn bereits passende Interfaces oder Funktionen existieren, diese erweitern statt ersetzen.

---

# 2. Entity Resolution härten

## 2.1 Grundregel

Ein Name darf niemals allein durch einen zufälligen Fuzzy-Treffer zu einer anderen Entität werden.

Priorität:

1. exakte ID
2. exakter Name/Title
3. expliziter Alias, falls vorhanden
4. normalisierter exakter Name
5. kontrollierter Fuzzy-Match nur als Kandidat
6. bei mehreren Kandidaten: `ambiguous`, nicht automatisch auswählen
7. kein Treffer: `unresolved`

Fuzzy Matching darf **niemals** stillschweigend einen falschen Codex-Eintrag auswählen.

Beispiel:

```text
Goblin
Goblin-Krieger
Goblin-Späher
```

Eine Eingabe `Goblin` darf nicht automatisch `Goblin-Krieger` werden.

---

# 3. Rasse, Gegnerart und Fraktion strikt trennen

Diese drei Dinge sind unterschiedliche Entitätstypen.

```text
Rasse:
Goblin

Gegnerart:
Goblin-Krieger

Fraktion:
Rotzähne
```

Folgende Regeln müssen gelten:

- `resolveRace()` darf ausschließlich einen validierten Rassen-Eintrag liefern.
- Kein Fallback auf beliebige Lore-Kategorien.
- `resolveEnemyType()` darf ausschließlich `Gegner` liefern.
- `resolveFaction()` darf ausschließlich `Fraktionen` liefern.
- Ein Gegnername darf niemals automatisch als Fraktionsname verwendet werden.
- Eine Rasse darf niemals automatisch als Fraktion interpretiert werden.

Wenn z. B. nur `Goblin` bekannt ist, ist das zunächst eine Rasse bzw. textuelle Beschreibung – **keine Fraktion**.

---

# 4. Kontextabhängige Auflösung

Die Auflösung soll Kontext berücksichtigen.

Beispiel:

```text
50 Goblins greifen das Dorf an.
```

Mögliche bekannte Informationen:

```text
Goblin → Rasse
Goblin-Krieger → Gegnerart
Rotzähne → Fraktion
Rotzähne → verwendet Goblin-Krieger
Grukk → Anführer der Rotzähne
Nordwald → Herkunft
Eichenhain → Ziel
```

Das System soll diese Informationen verbinden, **wenn sie durch vorhandene WorldFacts/Codex-Beziehungen gestützt werden**.

Es darf jedoch nicht erfinden:

```text
Goblin = Rotzähne
```

nur weil beide im gleichen Satz vorkommen.

---

# 5. Bounded World-Fact Graph

`extractConnectedWorldData()` soll langfristig nicht nur direkte Subject/Object-Treffer betrachten.

Implementiere eine kleine, begrenzte Graphauflösung über vorhandene WorldFacts.

Beispiel:

```text
Goblin-Krieger
      ↓
gehört zu / verwendet
      ↓
Rotzähne
      ↓
geführt von
      ↓
Grukk
      ↓
kontrolliert / operiert in
      ↓
Nordwald
```

Wichtig:

- nur vorhandene Fakten verwenden
- keine Fakten erzeugen, nur um einen Graphen vollständig zu machen
- maximale Traversierungstiefe begrenzen, z. B. 2–4 Schritte
- Zyklen verhindern
- bereits besuchte IDs speichern
- unsichere/inferenzielle Fakten entsprechend ihrer Confidence behandeln
- widersprüchliche Fakten nicht automatisch überschreiben

Wenn keine belastbare Verbindung existiert, bleibt das Feld `null`/unresolved.

---

# 6. Resolution Result mit Confidence/Ambiguity

Falls die bestehende Architektur dies zulässt, die Resolver so erweitern, dass neben dem Ergebnis auch der Status bekannt ist.

Empfohlenes Konzept:

```ts
interface ResolutionResult<T> {
  value: T | null;
  status: 'resolved' | 'ambiguous' | 'unresolved';
  confidence: number;
  candidates?: T[];
  reason?: string;
  source?: 'id' | 'exact_name' | 'alias' | 'normalized' | 'fact' | 'fuzzy';
}
```

Falls ein solches Interface bereits existiert, dieses verwenden.

Es ist nicht zwingend notwendig, alle bestehenden öffentlichen Methoden sofort umzubenennen. Rückwärtskompatibilität behalten.

---

# 7. Structured World Event

Die KI soll nicht direkt `TacticalEntity`-Positionen oder rohe CombatState-Daten verändern.

Zwischen Story/Chat und Integration soll ein strukturiertes Ereignis stehen.

Beispiel:

```ts
interface WorldEventIntent {
  type: string;
  subject?: string;
  faction?: string;
  race?: string;
  enemyType?: string;
  leader?: string;
  origin?: string;
  target?: string;
  count?: number;
  objective?: string;
  hostility?: 'neutral' | 'suspicious' | 'hostile';
  movement?: boolean;
  attack?: boolean;
  discoveredByPlayer?: boolean;
  tacticalRelevant?: boolean;
  confidence?: number;
}
```

**Nur ergänzen, falls eine vergleichbare Struktur nicht bereits vorhanden ist.**

Bevorzugte Pipeline:

```text
AI text
→ WorldEventIntent
→ Validation
→ Context Resolution
→ World State
→ EncounterForce
→ optional Tactical Spawn
```

Keine direkte KI-Manipulation von `CombatState.tacticalEntities`.

---

# 8. Encounter ≠ Combat

Das ist eine zentrale Regel.

### Fall A – reine Information

> „Im Nordwald leben 50 Goblins.“

Ergebnis:

```text
World information / fact
kein Tactical Spawn
kein Combat
```

### Fall B – entdeckt

> „Du entdeckst 50 Goblins im Nordwald.“

Ergebnis:

```text
EncounterForce möglich
Tactical Spawn nur wenn die aktuelle Szene taktische Darstellung benötigt
```

### Fall C – Angriff

> „50 Goblins greifen das Dorf an.“

Ergebnis:

```text
hostile EncounterForce
Tactical Spawn
```

### Fall D – Bewegung

> „50 Goblins marschieren auf das Dorf zu.“

Ergebnis:

```text
bewegende EncounterForce
noch nicht automatisch Combat
```

Das System darf einen Konflikt erst dann als taktischen Kampf behandeln, wenn der Kontext dies tatsächlich hergibt.

---

# 9. Keine automatische Dramatisierung

AdventureForge darf nicht aus einer normalen Situation automatisch eine große Verschwörung machen.

Beispiel:

```text
50 Goblins greifen ein Dorf an.
```

Mögliche Interpretationen:

- gewöhnlicher Überfall
- lokale Auseinandersetzung
- Beginn einer größeren Invasion
- fremdgesteuerte Goblins

Das System darf nicht ohne Grundlage automatisch behaupten:

- uralte Macht
- geheime Kontrolle
- Prophezeiung
- Blutlinie
- Dämonenpakt
- übernatürlicher Mastermind

Solche Dinge dürfen nur aus vorhandenem Lore-/World-Kontext oder später bestätigten Ereignissen entstehen.

Hypothesen müssen als Hypothesen behandelt werden.

---

# 10. EncounterForce sauber validieren

Vor `createEncounterForce()` bzw. vor dem Tactical Spawn prüfen:

### Mindestanforderungen

- `count >= 1`
- EnemyType nur wenn tatsächlich auflösbar
- Race nur wenn tatsächlich auflösbar
- Faction nur wenn tatsächlich auflösbar
- Leader nur wenn tatsächlich existierend
- Origin/Target nur wenn auf World Map vorhanden
- keine erfundenen IDs
- keine unbekannten Factions automatisch erzeugen

Wenn ein optionales Feld nicht aufgelöst werden kann:

```text
Warnung + Feld null
```

nicht:

```text
neuen Lore-Eintrag erzeugen
```

---

# 11. Faction-Inferenz nur aus Fakten

Eine Fraktion darf aus einem Gegner nur dann abgeleitet werden, wenn vorhandene Fakten dies stützen.

Beispiel gültig:

```text
WorldFact:
Goblin-Krieger → faction → Rotzähne
```

Dann darf die EncounterForce `factionId = Rotzähne` erhalten.

Nicht gültig:

```text
enemyType = Goblin-Krieger
→ automatisch faction = Goblin-Krieger
```

---

# 12. Leader-Referenzen

Ein vorhandener Charakter/NPC darf niemals dupliziert werden.

Beispiel:

```text
Grukk
id = npc_grukk_123
```

Wenn Grukk als Anführer erkannt wird:

```text
EncounterForce.leaderCharacterId = npc_grukk_123
```

und beim Tactical Spawn:

```text
TacticalEntity.existingCharacterId = npc_grukk_123
```

Nicht:

```text
new Character("Grukk")
```

---

# 13. Tactical Spawn erst nach validiertem Encounter

Die bestehende Funktion `spawnEncounterForceToTactical()` weiterverwenden.

Sie soll weiterhin:

```text
1 EncounterForce
        ↓
1 TacticalGroup
        ↓
N lightweight TacticalEntities
```

erzeugen.

Für 50 Goblins bedeutet das:

```text
1 EncounterForce
1 TacticalGroup
50 TacticalEntities
```

Nicht:

```text
50 Codex-NPCs
```

und nicht nur:

```text
1 Gegner mit count=50
```

---

# 14. Keine falsche Faction-Zuweisung beim automatischen Spawn

Alle bestehenden Stellen in `GameView.tsx` und anderen Komponenten prüfen, an denen `unitDisplayName`, `enemyTypeIdOrName`, `raceIdOrName` und `factionIdOrName` befüllt werden.

Besonders verhindern:

```ts
factionIdOrName: unitDisplayName
```

wenn `unitDisplayName` eigentlich nur `Goblin` oder `Goblin-Krieger` bedeutet.

Die Felder müssen semantisch korrekt befüllt werden.

Wenn keine Fraktion bekannt ist:

```ts
factionIdOrName: undefined
```

---

# 15. Duplicate Encounter Prevention

Mehrfaches Parsen desselben AI-Outputs darf nicht unendlich viele identische EncounterForces erzeugen.

Vor dem Anlegen prüfen, ob bereits eine aktive Force mit vergleichbaren Referenzen existiert:

```text
factionId
enemyTypeId
originId
 targetId
objective
```

und ggf. einen bestehenden Encounter aktualisieren statt einen zweiten identischen zu erzeugen.

Die genaue Merge-Logik soll zum vorhandenen `DynamicWorldState` passen.

Keine aggressiven Zusammenführungen, wenn es sich um zwei tatsächlich unterschiedliche Streitkräfte handeln könnte.

---

# 16. Encounter Lifecycle

Die vorhandenen Statuswerte weiterverwenden bzw. falls notwendig sauber ergänzen.

Beispiel:

```text
detected
moving
engaged
retreated
defeated
resolved
```

Nicht jede Force bleibt nach einem Ereignis dauerhaft `engaged`.

Ein Angriff kann:

```text
moving → engaged → defeated
```

laufen.

Eine Patrouille kann:

```text
detected → moving → resolved
```

enden.

---

# 17. World State bleibt autoritativ

Wichtig:

```text
World State = Wahrheit über die aktuelle Welt
Tactical State = lokale taktische Darstellung
```

Die Tactical Map darf nicht selbst die Weltlogik erfinden.

Nach einem Kampf muss das Ergebnis über die vorhandene Feedback-Schicht zurück in den World State laufen.

Die bestehende `applyCombatResultToWorldState()`-Logik weiterverwenden und nur dort korrigieren/erweitern, wo tatsächlich notwendig.

---

# 18. World Facts korrekt klassifizieren

Neu erzeugte Fakten müssen ihre tatsächliche Herkunft behalten.

Beispiel:

```text
AI inference
observation
established story
computed
```

Eine KI-Vermutung darf nicht als 100%-kanonischer Fakt gespeichert werden.

Insbesondere bei automatisch erzeugten Encounter-Informationen:

```text
confidence
sourceType
knowledgeType
isCurrent
```

korrekt setzen.

---

# 19. Tests

Erstelle oder erweitere Tests für mindestens diese Fälle:

### Test 1 – 50 Goblins

Input:

```text
count = 50
race = Goblin
enemyType = Goblin-Krieger
```

Erwartung:

```text
1 EncounterForce
count = 50
50 TacticalEntities nach Spawn
```

### Test 2 – keine Faction erfunden

Input:

```text
Goblin-Krieger
```

Erwartung:

```text
factionId = undefined/null
```

wenn keine WorldFact-Verbindung existiert.

### Test 3 – explizite Faction

Input:

```text
enemyType = Goblin-Krieger
faction = Rotzähne
```

Erwartung:

```text
factionId = ID von Rotzähne
```

### Test 4 – Leader

Input:

```text
leader = Grukk
```

Erwartung:

bestehende Character/NPC-ID wird verwendet.

### Test 5 – Ambiguous Match

Codex:

```text
Goblin
Goblin-Krieger
Goblin-Späher
```

Input:

```text
Goblin
```

Erwartung:

kein automatischer Treffer auf Goblin-Krieger.

### Test 6 – falsche Kategorie

Input als Race:

```text
Goblin-Krieger
```

Erwartung:

kein Race-Result, wenn kein Rassen-Eintrag dieses Namens existiert.

### Test 7 – World Fact Verbindung

Vorhandene Fakten verbinden:

```text
Goblin-Krieger → Rotzähne → Grukk
```

Erwartung:

Faction und Leader können kontextabhängig aufgelöst werden.

### Test 8 – normale Information

```text
Im Nordwald leben 50 Goblins.
```

Erwartung:

kein automatischer Tactical Spawn.

### Test 9 – Angriff

```text
50 Goblins greifen Eichenhain an.
```

Erwartung:

hostile EncounterForce und taktischer Spawn, sofern Szene/Engine dies unterstützt.

### Test 10 – Bewegung

```text
50 Goblins marschieren auf Eichenhain zu.
```

Erwartung:

EncounterForce / moving force, aber kein automatischer Kampf ohne Angriffssituation.

### Test 11 – unbekannte Faction

Input:

```text
faction = Schattenhorde
```

ohne entsprechenden Codex-/World-Eintrag.

Erwartung:

Warnung/unresolved, keine neue Fraktion erzeugen.

### Test 12 – Duplicate Event

Dasselbe Event zweimal verarbeiten.

Erwartung:

keine unkontrollierte Verdopplung identischer aktiver EncounterForces.

---

# 20. UI nur wenn notwendig

Diese Phase ist primär Backend-/Logik-Arbeit.

Keine neue große UI bauen.

Falls bereits ein Debug-/World-State-Bereich existiert, dürfen dort Resolver-Warnungen oder Encounter-Status sichtbar gemacht werden.

Keine UI-Parallelstruktur für EncounterForce bauen.

---

# 21. Performance

Die Auflösung muss auch bei größeren WorldFacts-Datenmengen funktionieren.

Der World-Fact-Graph muss deshalb:

- Tiefenlimit besitzen
- visited Set verwenden
- unnötige Vollscans vermeiden, wenn vorhandene Indexstrukturen genutzt werden können
- keine rekursive Endlosschleife zulassen

Tactical Spawn für 50–100 Einheiten darf nicht durch die World-Resolution unnötig teuer werden.

---

# 22. Akzeptanzkriterien

Die Phase ist erfolgreich, wenn alle folgenden Aussagen stimmen:

- `Goblin` wird nicht automatisch zu `Goblin-Krieger`.
- `Goblin` wird nicht automatisch zu einer Fraktion.
- `Goblin-Krieger` wird nicht automatisch zu einer Fraktion.
- Rasse, Gegnerart und Fraktion bleiben getrennte Entitätstypen.
- Vorhandene WorldFacts können begrenzt miteinander verknüpft werden.
- Ein vorhandener Charakter/NPC wird über seine bestehende ID referenziert.
- Unbekannte Lore wird nicht automatisch erfunden.
- Eine normale Weltinformation erzeugt keinen Kampf.
- Eine Bewegung erzeugt nicht automatisch Combat.
- Ein tatsächlicher Angriff kann zu EncounterForce + Tactical Spawn führen.
- EncounterForce bleibt eine aktuelle Situation und kein neuer Codex-Eintrag.
- 50 Gegner werden weiterhin als 50 leichte TacticalEntities dargestellt.
- Tactical Engine bleibt für taktische Positionen und Bewegung zuständig.
- World State bleibt autoritativ.
- Combat-Ergebnisse fließen zurück in den World State.
- Bestehende Systeme bleiben kompatibel.
- Keine parallele zweite World-/Lore-/Encounter-Datenbank entsteht.

---

# 23. Abschlussprüfung

Nach der Implementierung:

1. `npm run build` ausführen.
2. Bestehende Tests ausführen.
3. Neue Resolver-/Encounter-Tests ausführen.
4. TypeScript-Fehler beheben.
5. Prüfen, dass keine alten direkten Position-Manipulationen wieder eingeführt wurden.
6. Prüfen, dass `GameView` keine falsche Faction aus einem Unit-Namen ableitet.
7. Prüfen, dass Tactical Spawn weiterhin über `WorldIntegrationService`/`TacticalEngine` läuft.
8. Keine unnötigen Dateien oder parallelen Systeme anlegen.

## Wichtig für Gemini

**Nicht großflächig refactoren. Nicht die bestehende Architektur ersetzen.**

Arbeite inkrementell auf dem vorhandenen Stand.

Wenn eine gewünschte Funktion bereits vorhanden ist, verbessere sie.

Wenn eine Struktur bereits existiert, erweitere sie.

Wenn etwas nicht sicher aus dem vorhandenen Code/Lore ableitbar ist, lasse es unresolved statt eine Information zu erfinden.

Das Ziel dieser Phase ist nicht mehr KI-Drama oder mehr automatisch erzeugte Inhalte.

Das Ziel ist:

> **AdventureForge soll vorhandene Weltinformationen korrekt verstehen, miteinander verbinden und nur dann einen Encounter oder taktischen Konflikt erzeugen, wenn die erzählte Situation dies tatsächlich rechtfertigt.**
