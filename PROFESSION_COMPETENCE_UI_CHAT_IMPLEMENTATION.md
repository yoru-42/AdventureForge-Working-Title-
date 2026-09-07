# AdventureForge – Profession Competence UI & Chat Integration

## Zweck

Diese Datei beschreibt die konkrete Umsetzung der bereits definierten **individuellen Berufs-Kompetenzen** im UI und deren Verbindung mit dem Chat-/World-State-System.

Die Umsetzung darf **kein klassischer Skilltree** werden.

Die zentrale Logik lautet:

> **Beruf ist die Rolle. Berufsfortschritt ist allgemeine Erfahrung. Kompetenzen sind konkrete Tätigkeiten. Talent bestimmt die Lernfähigkeit. Der Chat beobachtet Handlungen; die World-State-Logik berechnet den Fortschritt.**

---

# 1. Zielbild

Ein Charakter kann beispielsweise besitzen:

```text
Beruf: Schmied
Berufsfortschritt: 42%
Berufsstufe: Lehrling

Kompetenzen:
- Schmiedefeuer entzünden       91%   Talent 5/5
- Schmiedetemperatur beurteilen 86%   Talent 4/5
- Bronze bearbeiten             74%   Talent 3/5
- Eisen bearbeiten              58%   Talent 4/5
- Stahl bearbeiten              31%   Talent 5/5
- Dolche schmieden               93%   Talent 5/5
- Kurzschwerter schmieden        67%   Talent 4/5
- Langschwerter schmieden        28%   Talent 3/5
- Rüstung schmieden               7%   Talent 2/5
- Katana schmieden                94%   Talent 5/5
```

Das ist ausdrücklich erlaubt.

Der Charakter muss nicht in allen Bereichen auf dem Niveau seines Berufslevels sein.

---

# 2. Keine Skilltree-Logik

Nicht implementieren:

- keine linearen Skillpfade
- keine erzwungenen Voraussetzungen zwischen allen Kompetenzen
- kein automatisches Freischalten aller Kompetenzen durch Berufslevel
- kein "Berufslevel 5 = alle Schmiedekompetenzen Level 5"
- keine pauschale Erhöhung aller Kompetenzen bei einer einzelnen Tätigkeit

Stattdessen:

- jede Kompetenz ist eigenständig
- Tätigkeiten verbessern hauptsächlich die tatsächlich ausgeführte Kompetenz
- verwandte Kompetenzen dürfen geringfügig mitprofitieren, wenn die Aktion dies plausibel macht
- Talent beeinflusst die Lernrate
- Berufsfortschritt bleibt ein separater Wert

---

# 3. Datenmodell

Falls noch nicht vorhanden, in `types.ts` ergänzen bzw. mit den bestehenden Typen zusammenführen:

```ts
export interface ProfessionCompetency {
  id: string;
  name: string;
  category: 'Grundlage' | 'Fortgeschritten' | 'Spezialisierung' | 'Meisterschaft';
  proficiency: number; // 0–100
  experiencePoints: number;
  talent: number; // 0–5
  description?: string;
  notes?: string;
  practiceCount?: number;
  lastPracticedAt?: string;
  relatedCompetencyIds?: string[];
}

export interface ProfessionProgress {
  professionId?: string;
  professionName: string;
  level?: string;
  overallProficiency: number; // 0–100
  experiencePoints: number;
  experienceText?: string;
  promotionConditions?: string[];
}
```

Bestehende Felder wie `profession`, `professionLevel`, `craftingSkills`, `talents`, `professionProficiencyScore` usw. bleiben vorerst erhalten, damit alte Spielstände nicht brechen.

Neue strukturierte Felder:

```ts
professionProgress?: ProfessionProgress;
professionCompetencies?: ProfessionCompetency[];
```

Diese Daten können sowohl bei Player-Characters als auch bei NPCs vorhanden sein.

---

# 4. Kompetenzkatalog

Der Kompetenzkatalog soll zentral gepflegt werden.

Neue Datei bevorzugt:

```text
professionCompetencies.ts
```

Alternativ kann der bestehende `jobPresets.ts` / `professionDuties.ts`-Aufbau erweitert werden, wenn dadurch keine doppelte Datenhaltung entsteht.

Beispiel:

```ts
export interface ProfessionCompetencyDefinition {
  id: string;
  professionId: string;
  name: string;
  category: ProfessionCompetency['category'];
  description: string;
}
```

Beispiel Schmied:

```text
Schmied
├─ Grundlagen
│  ├─ Schmiedefeuer entzünden
│  ├─ Brennstoff vorbereiten
│  ├─ Schmiedetemperatur beurteilen
│  ├─ Amboss sicher benutzen
│  ├─ Hammerführung
│  └─ Werkstück richtig halten
│
├─ Materialien
│  ├─ Bronze bearbeiten
│  ├─ Kupfer bearbeiten
│  ├─ Eisen bearbeiten
│  ├─ Stahl bearbeiten
│  └─ Stahl herstellen
│
├─ Waffen
│  ├─ Dolche schmieden
│  ├─ Kurzschwerter schmieden
│  ├─ Langschwerter schmieden
│  ├─ Äxte schmieden
│  ├─ Speerspitzen schmieden
│  └─ Katana schmieden
│
└─ Rüstung
   ├─ Helme schmieden
   ├─ Armschienen schmieden
   ├─ Brustplatten schmieden
   └─ vollständige Rüstung fertigen
```

Beispiel Koch:

```text
Koch
├─ Grundlagen
│  ├─ Gemüse schneiden
│  ├─ Fleisch schneiden
│  ├─ Fisch vorbereiten
│  ├─ Messer sicher benutzen
│  ├─ Zutaten portionieren
│  └─ Gewürze dosieren
│
├─ Zubereitung
│  ├─ Suppe kochen
│  ├─ Fleischgerichte kochen
│  ├─ Fischgerichte kochen
│  ├─ Gemüsegerichte kochen
│  ├─ Sauce herstellen
│  └─ Teig zubereiten
│
└─ Fortgeschritten
   ├─ mehrere Komponenten gleichzeitig zubereiten
   ├─ Garzustand beurteilen
   ├─ Rezept improvisieren
   └─ anspruchsvolle Gerichte zubereiten
```

Der Katalog muss erweiterbar sein und darf nicht auf zwei Berufe beschränkt werden.

---

# 5. UI – Berufsbereich komplett umbauen

Die bestehende Registerkarte `beruf_talente` in `CharacterLoreForm.tsx` soll weiterverwendet werden.

Nicht einfach einen zweiten parallelen Berufsbereich bauen.

Der vorhandene `CompetenceProfileEditor` soll entweder erweitert oder durch einen strukturierten Editor ersetzt werden.

## Aufbau

### Bereich A – Beruf

Oben:

```text
BERUF
────────────────────────────
Schmied
Lehrling

Berufsfortschritt       42%
████████████░░░░░░░░░░

Berufserfahrung         1.240 XP
```

Berufsfortschritt beschreibt die allgemeine Entwicklung im Beruf.

Er bestimmt NICHT automatisch die Werte der einzelnen Kompetenzen.

---

# 6. Kompetenzliste

Darunter:

```text
KOMPETENZEN

[Alle] [Grundlagen] [Fortgeschritten] [Spezialisierungen]

[ Suche nach Kompetenz ... ]
```

Jede Kompetenz wird als kompakte Karte dargestellt.

Beispiel:

```text
┌──────────────────────────────────────────────┐
│ Katana schmieden                    94%       │
│ Spezialisierung                              │
│                                              │
│ ███████████████████░                         │
│                                              │
│ 1.840 XP       Talent ★★★★★                 │
│ 24 Übungen                                  │
│                                              │
│ [Bearbeiten] [Üben]                         │
└──────────────────────────────────────────────┘
```

Anzeigen:

- Name
- Kategorie
- Fortschritt 0–100%
- XP
- Talent 0–5
- Anzahl der Übungen, wenn vorhanden
- optionale Beschreibung
- optionale Notizen

Keine übertriebene Darstellung oder unnötige Animation.

---

# 7. Kompetenz hinzufügen

Buttons:

```text
+ Kompetenz hinzufügen
Aus Berufskatalog auswählen
Alle passenden Grundlagen hinzufügen
```

## Berufskatalog

Der Spieler/Editor kann einzelne Kompetenzen aus dem aktuellen Beruf auswählen.

Beim Hinzufügen:

```ts
{
  proficiency: 0,
  experiencePoints: 0,
  talent: 0
}
```

Talent darf anschließend separat gesetzt werden.

Eine Kompetenz wird nicht automatisch hochgestuft, nur weil sie hinzugefügt wurde.

---

# 8. Talent-System

Talent ist eine Eigenschaft der einzelnen Kompetenz.

```text
0/5  kein besonderes Talent
1/5  langsam
2/5  eher langsam
3/5  normal
4/5  talentiert
5/5  außergewöhnliches Talent
```

Talent bedeutet:

> Wie leicht lernt diese Person genau diese Kompetenz?

Talent bedeutet NICHT:

- aktuelles Können
- Berufslevel
- automatische Beherrschung

Ein Charakter kann also haben:

```text
Katana schmieden
94%
Talent 5/5
```

ohne deswegen alle anderen Schmiedekompetenzen auf 94% zu besitzen.

---

# 9. Sekundärberufe

Sekundärberufe behalten dieselbe Struktur.

Beispiel:

```text
Hauptberuf
Schmied

Sekundärberuf
Koch

Koch-Kompetenzen
- Gemüse schneiden       72%
- Fleisch schneiden      61%
- Suppe kochen            43%
- Sauce herstellen        19%
```

Jeder Beruf besitzt seine eigene Kompetenzliste.

Es darf keine globale gemeinsame Skillliste entstehen.

---

# 10. Verbindung mit dem Chat

Der Chat muss die Kompetenzen **lesen können**.

Die relevanten Daten müssen in den bestehenden Gemini-/World-State-Kontext integriert werden.

Nicht einen separaten Chat-Kontext bauen.

Der bestehende `GeminiService` und die vorhandenen World-Knowledge-/World-State-Direktiven bleiben die zentrale Infrastruktur.

---

# 11. Kompetenzkontext für Gemini

Wenn ein Charakter relevante Berufsaktionen ausführt, soll Gemini den vorhandenen Kompetenzstatus kennen.

Beispiel Kontext:

```text
BERUF:
Schmied (Lehrling)
Allgemeiner Berufsfortschritt: 42%

RELEVANTE KOMPETENZEN:
- Schmiedefeuer entzünden: 91% | Talent 5/5
- Schmiedetemperatur beurteilen: 86% | Talent 4/5
- Eisen bearbeiten: 58% | Talent 4/5
- Stahl bearbeiten: 31% | Talent 5/5
- Dolche schmieden: 93% | Talent 5/5
- Katana schmieden: 94% | Talent 5/5
- Rüstung schmieden: 7% | Talent 2/5
```

Gemini soll bevorzugt nur die für die aktuelle Szene relevanten Kompetenzen erhalten, damit der Kontext nicht unnötig groß wird.

---

# 12. Verhalten des Chats

Der Chat soll aus den Kompetenzdaten ableiten, was ein Charakter plausibel tun kann.

Beispiel:

```text
Charakter:
Schmied

Katana schmieden: 94%
Rüstung schmieden: 7%
```

Wenn der Charakter ein Katana reparieren soll:

→ kompetent handeln.

Wenn der Charakter eine schwere Vollrüstung herstellen soll:

→ Unsicherheit, Fehler oder längere Arbeitszeit sind plausibel.

Der Chat darf nicht schreiben:

> "Er ist Schmied, deshalb kann er selbstverständlich jede Schmiedearbeit perfekt."

---

# 13. Chat darf Fortschritt nicht direkt erfinden

Wichtig:

Gemini darf nicht selbstständig Werte wie diese erzeugen:

```text
Katana schmieden +17%
```

oder

```text
Schmiedekompetenz jetzt 100%
```

Die KI soll stattdessen eine **beobachtete Aktion / Lernhandlung** liefern.

Beispiel internes Ereignis:

```ts
{
  type: 'profession_competency_activity',
  characterId: '...',
  professionId: 'blacksmith',
  competencyId: 'forge_katana',
  action: 'practice',
  difficulty: 'medium',
  successful: true,
  meaningfulPractice: true
}
```

Die eigentliche Fortschrittsberechnung erfolgt deterministisch in der Anwendung.

---

# 14. Fortschrittsberechnung

Eine Aktivität darf nur einen kleinen Fortschritt erzeugen.

Beispielprinzip:

```text
Übung erfolgreich
→ passende Kompetenz erhält XP
→ XP wird unter Berücksichtigung von Talent in Fortschritt umgerechnet
```

Talent beeinflusst die Geschwindigkeit.

Beispiel:

```text
Talent 1/5 → langsamer Fortschritt
Talent 3/5 → normaler Fortschritt
Talent 5/5 → schneller Fortschritt
```

Aber:

```text
Talent 5/5 ≠ sofort hohe Beherrschung
```

Der Fortschritt muss mit steigender Beherrschung schwieriger werden.

Beispiel:

```text
0–20%    relativ schnell
20–50%   normal
50–75%   langsamer
75–90%   deutlich langsamer
90–99%   sehr langsam
99–100%  Meisterschaft
```

Keine riesigen Sprünge durch eine einzelne Aktion.

---

# 15. Verwandte Kompetenzen

Eine Aktion kann optional geringe Nebeneffekte auf verwandte Kompetenzen haben.

Beispiel:

```text
Katana schmieden
```

Primär:

```text
Katana schmieden +XP
```

Möglicherweise sekundär:

```text
Hammerführung +kleines XP
Schmiedetemperatur beurteilen +kleines XP
Stahl bearbeiten +kleines XP
```

Aber niemals:

```text
alle Schmiedekompetenzen +XP
```

Nur tatsächlich verwandte Kompetenzen.

---

# 16. Berufsfortschritt

Berufsfortschritt bleibt separat.

Er kann durch relevante berufliche Tätigkeiten steigen.

Beispiel:

```text
Katana schmieden
→ Katana-Kompetenz steigt deutlich
→ Berufsfortschritt steigt geringfügig
```

Eine einzelne Kompetenz kann dadurch weit über dem allgemeinen Berufsfortschritt liegen.

Das ist gewollt.

---

# 17. NPCs

Das System gilt auch für NPCs.

Aber NPCs dürfen nicht automatisch mit dutzenden Kompetenzen gefüllt werden.

Grundregel:

> Nur Kompetenzen anlegen, die für Beruf, Hintergrund oder Geschichte relevant sind.

Ein gewöhnlicher Dorfschmied benötigt beispielsweise nicht automatisch 50 detaillierte Kompetenzen.

Er kann zunächst nur relevante Grundlagen und tatsächlich etablierte Spezialisierungen besitzen.

Beispiel:

```text
Dorfschmied

Feuer entzünden       71%
Eisen bearbeiten      64%
Dolche schmieden       73%
Hufeisen fertigen      81%
Katana schmieden        3%
```

Der NPC wird dadurch glaubwürdig, ohne künstlich dramatisiert zu werden.

---

# 18. Keine erfundenen Geheimnisse

Das Kompetenzsystem darf nicht dazu führen, dass normale NPCs automatisch:

- geheime Meistertechniken besitzen
- legendäre Fähigkeiten haben
- verborgene Identitäten erhalten
- dramatische Geheimnisse bekommen
- außergewöhnlich talentiert sind

Besondere Kompetenzen müssen aus Welt, Hintergrund, Codex oder tatsächlichen Ereignissen hervorgehen.

---

# 19. Codex-Verbindung

Codex-Einträge dürfen Kompetenzverhalten beeinflussen.

Beispiel:

```text
Codex:
Der Charakter wurde von einem Meister der traditionellen Katana-Schmiedekunst ausgebildet.
```

Daraus kann eine hohe Katana-Kompetenz plausibel sein.

Umgekehrt darf der Chat nicht ohne Grundlage behaupten, dass ein Charakter eine seltene Technik beherrscht.

---

# 20. UI-Aktionen und Speicherung

Alle Änderungen müssen über den bestehenden Character-/NPC-State gespeichert werden.

Nicht:

```text
local UI state only
```

sondern:

```text
UI
 ↓
Character/NPC State
 ↓
StorageService
 ↓
Save / Load
```

Beim Laden alter Spielstände:

- fehlende neue Felder dürfen nicht zum Absturz führen
- alte `craftingSkills` dürfen erhalten bleiben
- neue Kompetenzlisten können aus dem Berufskatalog initialisiert werden
- keine alten Daten überschreiben

---

# 21. Migration alter Daten

Wenn ein alter Charakter beispielsweise besitzt:

```text
profession: Schmied
craftingSkills: "Dolche, Schwerter, einfache Rüstungen"
professionProficiencyScore: 40
```

soll daraus kein aggressiver automatischer Skillstand konstruiert werden.

Stattdessen:

```text
Berufsfortschritt ≈ vorhandener globaler Wert

craftingSkills
→ als Hinweise / Notizen erhalten

Kompetenzen
→ vorsichtig initialisieren
```

Wenn eine genaue Kompetenz nicht aus den alten Daten ableitbar ist:

```text
proficiency = 0
```

oder ein neutraler, klar definierter Startwert.

Keine erfundenen hohen Werte.

---

# 22. Neue zentrale Services

Empfohlen:

```text
services/
  professionCompetencyService.ts
```

Aufgaben:

```ts
getProfessionCompetencyDefinitions(professionId)

createCompetencyFromDefinition(definition)

normalizeCompetency(competency)

calculateCompetencyProgress(...)

applyProfessionCompetencyActivity(...)

calculateProfessionProgress(...)

migrateLegacyProfessionData(...)

getRelevantCompetenciesForContext(...)
```

Die Berechnung soll nicht in React-Komponenten und nicht direkt im Gemini-Prompt stattfinden.

---

# 23. Gemini-Antwortformat

Wenn der Chat eine relevante berufliche Tätigkeit erkennt, soll die bestehende strukturierte World-State-Ausgabe um eine optionale Aktivität erweitert werden.

Beispiel:

```json
{
  "professionActivities": [
    {
      "characterId": "char_123",
      "professionId": "blacksmith",
      "competencyId": "forge_katana",
      "action": "practice",
      "difficulty": "medium",
      "successful": true,
      "meaningfulPractice": true
    }
  ]
}
```

Die Anwendung verarbeitet dieses Ereignis anschließend deterministisch.

Gemini liefert also:

```text
Was wurde getan?
```

Die Anwendung entscheidet:

```text
Wie viel Fortschritt entsteht?
```

---

# 24. Schutz vor Missbrauch durch die KI

Die World-State-Logik muss verhindern, dass Gemini beispielsweise erzeugt:

```json
{
  "proficiency": 100
}
```

Die Anwendung darf solche direkten Werte aus einer normalen Chatantwort nicht blind übernehmen.

Erlaubt sind Aktivitäten/Beobachtungen.

Die Anwendung berechnet daraus den tatsächlichen Fortschritt.

---

# 25. Relevanzfilter für den Chat

Nicht jede Chatnachricht benötigt den gesamten Kompetenzkatalog.

Beispiel:

```text
Charakter spricht in einer Taverne.
```

→ keine Schmiedekompetenzen notwendig.

```text
Charakter repariert ein Schwert.
```

→ relevante Schmiedekompetenzen laden.

```text
Charakter kocht eine Suppe.
```

→ Kochkompetenzen laden.

Die Auswahl soll anhand von:

- aktueller Tätigkeit
- Beruf
- Szene
- verwendeten Gegenständen
- bereits bekannten Charakterdaten
- Codex-/World-State-Kontext

erfolgen.

---

# 26. Konkrete UI-Komponenten

Bestehende Komponenten bevorzugt erweitern statt doppelte Systeme zu erzeugen.

Relevante bestehende Komponenten:

```text
CharacterLoreForm.tsx
CompetenceProfileEditor.tsx
CompetenceProficiencyWidget.tsx
ProfessionSelect.tsx
ProfessionLevelSelect.tsx
```

Mögliche neue Komponenten:

```text
ProfessionCompetencyList.tsx
ProfessionCompetencyCard.tsx
ProfessionCompetencyPicker.tsx
ProfessionProgressHeader.tsx
```

Nur erstellen, wenn sie die bestehende Struktur sauberer machen.

---

# 27. UI-Interaktion

Beim Ändern einer Kompetenz:

```text
Benutzer ändert Talent
        ↓
Character State aktualisieren
        ↓
Speichern
```

Beim manuellen Eintragen einer Beherrschung:

```text
Benutzer setzt proficiency
        ↓
Wert validieren 0–100
        ↓
Character State aktualisieren
        ↓
Speichern
```

Beim Chat-Fortschritt:

```text
Chataktion
 ↓
Gemini erkennt relevante Tätigkeit
 ↓
strukturierte Aktivität
 ↓
World-State-Processor
 ↓
Kompetenz-XP
 ↓
neuer Proficiency-Wert
 ↓
UI aktualisiert
```

---

# 28. Validierung

Alle Werte müssen normalisiert werden:

```text
proficiency: 0–100
experiencePoints: >= 0
talent: 0–5
practiceCount: >= 0
```

Ungültige KI-Werte dürfen den Spielstand nicht beschädigen.

---

# 29. Akzeptanztests

## Test 1 – unabhängige Kompetenzen

Charakter:

```text
Schmied
Katana 94%
Rüstung 7%
```

Erwartung:

→ Werte bleiben unabhängig.

## Test 2 – Chatübung

Charakter übt Katana-Schmieden.

Erwartung:

→ Katana erhält XP.
→ Berufsfortschritt kann geringfügig steigen.
→ Rüstung bleibt unverändert.

## Test 3 – Talent

Zwei Charaktere führen dieselbe Übung aus.

Charakter A:

```text
Talent 5/5
```

Charakter B:

```text
Talent 1/5
```

Erwartung:

→ A lernt schneller.
→ keiner springt sofort massiv nach oben.

## Test 4 – NPC

Normaler Dorfschmied.

Erwartung:

→ keine automatisch erzeugten legendären Kompetenzen oder Geheimnisse.

## Test 5 – alter Spielstand

Alte Charakterdaten ohne `professionCompetencies` laden.

Erwartung:

→ Spiel läuft weiter.
→ alte Berufsdaten bleiben erhalten.
→ neue Struktur wird bei Bedarf sauber initialisiert.

## Test 6 – KI versucht direkten Wert

Gemini liefert hypothetisch:

```json
{"proficiency":100}
```

Erwartung:

→ nicht blind übernehmen.

---

# 30. Implementierungsreihenfolge

### Schritt 1

`types.ts` prüfen und `ProfessionCompetency` / `ProfessionProgress` sauber integrieren.

### Schritt 2

Zentralen Kompetenzkatalog aus bestehenden Berufs-/Aufgabendaten aufbauen.

### Schritt 3

`professionCompetencyService.ts` erstellen.

### Schritt 4

Bestehenden `CompetenceProfileEditor` auf strukturierte Kompetenzlisten umbauen.

### Schritt 5

`CharacterLoreForm.tsx` an die neuen Daten anbinden.

### Schritt 6

Sekundärberufe sauber unterstützen.

### Schritt 7

Migration alter Berufsdaten implementieren.

### Schritt 8

Gemini-Kontext um relevante Kompetenzen erweitern.

### Schritt 9

Strukturierte `professionActivities` in den bestehenden World-State-Update-Prozess integrieren.

### Schritt 10

Deterministische Fortschrittsberechnung implementieren.

### Schritt 11

UI nach Chataktionen automatisch aktualisieren.

### Schritt 12

TypeScript-/Build-/Runtime-Tests durchführen.

---

# 31. Wichtige Architekturregel

Es darf am Ende nicht zwei voneinander unabhängige Berufssysteme geben.

Falsch:

```text
Altes Berufssystem
+
neues Kompetenzsystem
+
separater Chat-Skill-State
```

Richtig:

```text
                 Character / NPC
                       │
          ┌────────────┴────────────┐
          │                         │
   Berufsfortschritt          Kompetenzen
          │                         │
          │                   einzelne Tätigkeiten
          │                         │
          └────────────┬────────────┘
                       │
                  World State
                       │
                     Chat
                       │
              beobachtete Aktionen
                       │
             Fortschrittsberechnung
                       │
                  Character/NPC
```

---

# 32. Definition of Done

Die Umsetzung ist erst abgeschlossen, wenn:

- [ ] jeder Beruf individuelle Kompetenzen besitzen kann
- [ ] Kompetenzen unabhängig voneinander steigen können
- [ ] Berufsfortschritt separat bleibt
- [ ] Talent pro Kompetenz gespeichert wird
- [ ] UI Kompetenzen anzeigen, hinzufügen, bearbeiten und entfernen kann
- [ ] Sekundärberufe unterstützt werden
- [ ] alte Spielstände weiterhin funktionieren
- [ ] Gemini relevante Kompetenzen lesen kann
- [ ] Chataktionen strukturierte berufliche Aktivitäten erzeugen können
- [ ] die Anwendung Fortschritt deterministisch berechnet
- [ ] Gemini keine direkten Fortschrittswerte erzwingen kann
- [ ] NPCs nur plausible/relevante Kompetenzen erhalten
- [ ] Codex-/World-State-Informationen bei Bedarf berücksichtigt werden
- [ ] keine Skilltree-Zwangslogik eingeführt wurde
- [ ] keine riesigen Fortschrittssprünge entstehen
- [ ] bestehende AdventureForge-World-State- und Storage-Architektur weiterverwendet wird

---

# Kernprinzip

**Ein Beruf sagt, was jemand grundsätzlich macht. Eine Kompetenz sagt, was diese Person konkret kann. Talent sagt, wie leicht sie darin besser wird. Der Chat beschreibt die Handlung. Die World-State-Logik entscheidet über den tatsächlichen Fortschritt.**
