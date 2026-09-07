# AdventureForge – Berufssystem V2

## 1. Grundidee

AdventureForge trennt künftig strikt zwischen:

1. **Berufsfeld** – große fachliche Kategorie
2. **Beruf** – konkrete Tätigkeit
3. **Spezialisierung** – mögliche fachliche Vertiefung eines Berufs
4. **individuelle Kompetenzen** – konkrete Tätigkeiten, die eine Person tatsächlich beherrscht
5. **Berufserfahrung** – tatsächliche Erfahrung in Jahren bzw. erfahrungsbasierter Fortschritt
6. **berufliche Anerkennung / Position** – eine Rolle, die durch andere Personen verliehen, angeboten, erzwungen oder benötigt wird
7. **gesellschaftliche Titel** – Adelstitel, Ämter, Ehrentitel und ähnliche soziale Positionen

**Wichtig:** Gesellschaftliche Titel und Berufe sind zwei vollständig getrennte Systeme.

Ein Charakter kann beispielsweise sein:

```text
Beruf: Koch
Berufserfahrung: 8 Jahre
Spezialisierung: Fleischküche

Gesellschaftlicher Titel:
Baron

Amt:
Mitglied des Stadtrates
```

Der Baron-Titel macht die Person nicht automatisch zu einem besseren Koch.

Umgekehrt macht ein Meisterkoch die Person nicht automatisch adelig.

---

# 2. Kein klassischer Titel für jede Berufsstufe

Bezeichnungen wie „Lehrling“, „Geselle“ oder „Meister“ dürfen nicht als universelle Charaktertitel behandelt werden.

Sie können in einzelnen Welten, Gilden oder Berufen existieren, sind aber nicht das zentrale globale Rangsystem.

Das eigentliche Berufssystem basiert auf:

```text
Berufsfeld
    ↓
Beruf
    ↓
Kompetenzen
    ↓
Berufserfahrung
    ↓
Aufstiegsbedingungen
```

Ein Beruf kann eigene Ränge besitzen, wenn die Welt sie kennt.

Beispiel:

```text
Schmied
├─ Lehrling
├─ Geselle
└─ Meister
```

Ein anderes Berufssystem kann dagegen besitzen:

```text
Magier
├─ Novize
├─ Arkanist
└─ Erzmagier
```

Und ein Beruf kann auch völlig ohne formale Ränge funktionieren.

---

# 3. Berufsfelder

Berufe werden nicht mehr als eine flache Liste behandelt.

Der Kompetenz-/Berufskatalog soll in große Berufsfelder gegliedert werden.

Beispielhafte Felder:

```text
Bau & Handwerk
Lebensmittel & Ernährung
Natur & Landwirtschaft
Tierhaltung
Wissenschaft & Forschung
Medizin & Heilkunde
Handel & Wirtschaft
Verwaltung & Recht
Militär & Sicherheit
Seefahrt
Transport & Logistik
Kunst & Kultur
Unterhaltung
Religion & Klerus
Magie & Arkane Künste
Alchemie
Bergbau & Rohstoffe
Schrift & Bildung
Dienstleistungen
```

Die Liste muss erweiterbar sein.

Keine künstliche Begrenzung auf die genannten Kategorien.

---

# 4. Berufspfad

Innerhalb eines Berufsfeldes befinden sich konkrete Berufe.

Beispiel:

```text
Lebensmittel & Ernährung
│
├─ Koch
├─ Bäcker
├─ Metzger
├─ Konditor
├─ Brauer
└─ Lebensmittelhändler
```

```text
Bau & Handwerk
│
├─ Schmied
├─ Tischler
├─ Maurer
├─ Zimmermann
├─ Gerber
├─ Töpfer
├─ Schneider
└─ Werkzeugmacher
```

```text
Wissenschaft & Forschung
│
├─ Naturforscher
├─ Mathematiker
├─ Astronom
├─ Alchemist
├─ Ingenieur
└─ Gelehrter
```

Berufsfelder und Berufe sind Datenstrukturen und keine hart codierte UI-Liste.

---

# 5. Einstieg in das Berufssystem

Ein Charakter kann ohne Beruf beginnen.

```text
Beruf: keiner
```

Der Charakter kann anschließend einen Einstieg erhalten durch:

- freie Wahl
- Ausbildung
- Eltern/Familie
- Gilde
- Schule
- Meister
- Arbeitgeber
- Militär
- Kirche/Orden
- staatliche Stelle
- Notwendigkeit der Situation
- Storyereignis

Beispiel:

```text
Kein Beruf
↓
Ausbildung bei einem Bäcker
↓
Beruf: Bäcker
```

Der Chat darf den Beruf nicht einfach vergeben, wenn dafür in der Welt keine plausible Grundlage existiert.

---

# 6. Individuelle Kompetenzen bleiben erhalten

Die vorher definierte individuelle Kompetenzlogik bleibt vollständig bestehen.

Eine Person besitzt nicht einfach „Schmied Level 8“.

Sie besitzt konkrete Kompetenzen:

```text
Schmiedefeuer entzünden        91%
Schmiedetemperatur beurteilen  86%
Eisen bearbeiten               58%
Stahl bearbeiten               31%
Dolche schmieden               93%
Langschwerter schmieden        28%
Rüstung schmieden               7%
Katana schmieden                94%
```

Jede Kompetenz ist unabhängig trainierbar.

Talent ist ebenfalls individuell pro Kompetenz.

---

# 7. Kompetenzkatalog muss berufsabhängig sein

Die bisherige generische Struktur wie:

```text
Grundwerkzeuge
Material- & Fachkunde
Standardaufgaben
Fachspezifische Spezialtechnik
Meisterleistung
```

darf nicht die eigentlichen Kompetenzen ersetzen.

Sie kann höchstens als UI-Kategorie dienen.

Ein Gerber muss beispielsweise echte Gerber-Kompetenzen besitzen:

```text
Grundlagen
├─ Häute reinigen
├─ Häute entfleischen
├─ Häute spannen
└─ Häute trocknen

Gerbung
├─ pflanzlich gerben
├─ mineralisch gerben
├─ Fettgerbung durchführen
└─ Gerbstoffe ansetzen

Materialien
├─ Rinderhaut bearbeiten
├─ Ziegenhaut bearbeiten
├─ Schweinehaut bearbeiten
├─ Wildleder herstellen
└─ exotische Häute bearbeiten

Produkte
├─ Rüstleder herstellen
├─ Schuhleder herstellen
├─ weiches Leder herstellen
└─ hochwertiges Leder herstellen
```

Jeder konkrete Beruf benötigt einen eigenen sinnvollen Kompetenzkatalog.

---

# 8. Berufserfahrung

Berufserfahrung ist ein eigener Faktor.

Sie kann als reale Spielzeit in Jahren geführt werden:

```text
Berufserfahrung: 0 Jahre
Berufserfahrung: 3 Jahre
Berufserfahrung: 10 Jahre
```

Optional können zusätzlich Monate/Tage gespeichert werden, wenn die Weltzeit dies unterstützt.

Beispiel:

```ts
professionExperience: {
  years: 8,
  months: 4,
  days: 12
}
```

Die UI darf daraus beispielsweise „8 Jahre, 4 Monate“ anzeigen.

Berufserfahrung bedeutet aber nicht automatisch perfekte Kompetenz.

Ein Charakter kann zehn Jahre Koch sein und trotzdem bei einer speziellen Tätigkeit schlecht sein.

---

# 9. Aufstiegsmöglichkeiten

Ein beruflicher Aufstieg kann auf mehreren unterschiedlichen Wegen erfolgen.

## Weg A – Prüfung / Meister / formale Bedingungen

Ein Beruf kann formale Bedingungen besitzen:

```text
Meisterprüfung
```

oder:

```text
Voraussetzungen:
- Beruf: Schmied
- bestimmte Kernkompetenzen erfüllt
- Berufserfahrung >= 5 Jahre
- Prüfung bestanden
```

Die Bedingungen werden vom jeweiligen Beruf bzw. der Welt definiert.

Nicht jeder Beruf benötigt eine Prüfung.

---

# 10. Weg B – Berufserfahrung

Ein Aufstieg kann auch automatisch bzw. regulär durch lange Berufserfahrung möglich werden.

Beispiel:

```text
10 Jahre Berufserfahrung
```

können bei einem Beruf eine ausreichende Voraussetzung für eine höhere Position darstellen.

Wichtig:

```text
10 Jahre Erfahrung ≠ automatisch 100% in jeder Kompetenz
```

Erfahrung ist ein eigener Faktor.

---

# 11. Weg C – Anerkennung durch andere Personen

Dies ist ein zentraler Bestandteil des neuen Systems.

Eine Person kann eine Position bekommen, obwohl sie keinen formalen Ausbildungsweg dafür abgeschlossen hat.

Der Grund ist:

> Andere Personen erkennen die Person als geeignet an oder benötigen sie in dieser Position.

Beispiele:

- Ernennung
- Wahl
- Bitte
- Vertrauen
- Empfehlung
- Notfall
- Stellvertretung
- Zwang durch die Situation
- Befehl eines Vorgesetzten
- Übernahme einer vakanten Position

---

# 12. Beispiel: Kapitän nach einer Seeschlacht

Situation:

```text
Eine Seeschlacht endet.
Der Schiffskapitän ist tot.
Die verbleibende Besatzung befindet sich auf See.
Niemand mit formaler Kapitänsposition ist mehr an Bord.
```

Ein Charakter sagt:

> „Ich kann das Schiff bis zum nächsten Hafen bringen.“

Die Mannschaft kann reagieren:

```text
„Dann übernimm das Kommando.“
```

Der Charakter erhält:

```text
Position:
Kapitän

Grund:
Anerkennung / Notfallernennung
```

Er muss dafür nicht vorher offiziell Kapitän gelernt haben.

---

# 13. Beispiel: langjährige Erfahrung

Alternativ:

```text
Person:
10 Jahre auf See

Keine formale Kapitänsausbildung
```

Die Besatzung kann sagen:

> „Du bist seit zehn Jahren auf See. Du kennst das Schiff. Übernimm das Kommando.“

Dann entsteht:

```text
Position: Kapitän
Erwerbsart: Anerkennung
Begründung: langjährige Erfahrung
```

Die Person darf anschließend als Kapitän handeln.

Ihre tatsächliche nautische Kompetenz bleibt trotzdem individuell gespeichert.

---

# 14. Position ≠ Kompetenz

Ganz wichtig:

Eine verliehene Position darf keine Fähigkeiten erschaffen.

Wenn jemand zum Kapitän ernannt wird:

```text
Position: Kapitän
```

bedeutet das nicht automatisch:

```text
Navigation: 100%
Seekampf: 100%
Schiffsführung: 100%
```

Die Person kann ein unerfahrener, aber anerkannter Kapitän sein.

Das erzeugt interessante Situationen:

```text
Position vorhanden
Kompetenz teilweise vorhanden
Erfahrung vorhanden
```

---

# 15. Positionen können aus der Welt entstehen

Berufe und Positionen sollen nicht nur über das Charaktermenü entstehen.

Die Welt kann Bedarf erzeugen.

Beispiel:

```text
Stadtwache verliert ihren Hauptmann.
```

Mögliche Reaktionen:

```text
Der Stadtherr ernennt jemanden.
Die Soldaten wählen jemanden.
Ein Stellvertreter übernimmt.
Ein erfahrener Soldat wird gedrängt.
Ein Adliger beansprucht die Position.
```

Die resultierende Position hängt von Welt, Fraktionen, Beziehungen, Macht und Situation ab.

---

# 16. Anerkennungsarten

Eine Position kann mindestens folgende Erwerbsarten besitzen:

```text
formal_training
exam
experience
appointment
recommendation
election
emergency_succession
forced_assignment
request
inheritance
political_decision
religious_appointment
guild_recognition
military_command
```

Die Liste muss erweiterbar bleiben.

---

# 17. Zwang / Pflichtübernahme

Eine Person kann eine Position auch übernehmen, obwohl sie dies nicht möchte.

Beispiel:

```text
Schiffskapitän tot
Besatzung braucht Führung
```

Die Mannschaft kann bestimmen:

> „Du hast die meiste Erfahrung. Du übernimmst.“

Dann:

```text
Position erhalten: Kapitän
Motivation: widerwillig
Erwerbsart: forced_assignment
```

Die Persönlichkeit und Motivation des Charakters müssen weiterhin berücksichtigt werden.

Ein Charakter kann also gleichzeitig sein:

```text
Kapitän
+ will diese Position eigentlich nicht
+ fühlt sich überfordert
+ versucht trotzdem seine Pflicht zu erfüllen
```

---

# 18. Gesellschaftliche Titel vollständig trennen

Adelstitel und gesellschaftliche Titel gehören nicht in das Berufssystem.

Beispiel:

```text
Adelstitel
├─ Baron
├─ Graf
├─ Herzog
└─ König
```

Diese können unabhängig vom Beruf existieren.

Beispiel:

```text
Beruf: Schmied
Titel: Baron
```

oder:

```text
Beruf: Koch
Titel: Graf
```

oder:

```text
Beruf: keiner
Titel: Herzog
```

Ein Adelstitel kann allerdings Voraussetzungen für bestimmte Ämter oder Positionen schaffen.

---

# 19. Ämter

Ämter bilden eine dritte soziale Ebene neben Beruf und Adelstitel.

Beispiele:

```text
Bürgermeister
Stadtrat
Richter
Hofmeister
Minister
General
Admiral
Botschafter
Gildenmeister
Priesteroberhaupt
```

Ein Amt kann Voraussetzungen besitzen oder durch Personen vergeben werden.

Beispiel:

```text
Amt: Bürgermeister

Mögliche Voraussetzungen:
- Bürger der Stadt
- ausreichender Ruf
- Wahl
- Ernennung
- politische Unterstützung
```

Ein Amt muss nicht zwingend ein Beruf sein.

---

# 20. Beruf, Position, Titel und Amt im Character State

Die Datenstruktur soll diese Bereiche getrennt speichern.

Beispiel:

```ts
profession: {
  fieldId: 'food',
  professionId: 'cook',
  specializationId: 'meat_cuisine',
  experience: {
    years: 8,
    months: 4,
    days: 12
  },
  rankId?: 'master',
  competencies: [...]
}

socialTitles: [...]

positions: [...]

offices: [...]
```

Falls AdventureForge bereits andere Datenstrukturen besitzt, diese erweitern statt parallel ein zweites System aufzubauen.

---

# 21. Beruflicher Rang

Ein Beruf darf optionale Ränge besitzen.

Beispiel:

```text
Schmied
├─ Lehrling
├─ Geselle
└─ Meister
```

Diese Ränge sind aber **berufsspezifisch**.

Sie sind nicht mit gesellschaftlichen Titeln gleichzusetzen.

Der Rang kann durch unterschiedliche Bedingungen erreicht werden:

```text
rankRequirements: {
  requiredExperienceYears?: number,
  requiredCompetencies?: [...],
  requiredExam?: string,
  requiredRecognition?: boolean,
  requiredPersonIds?: [...]
}
```

---

# 22. Individuelle Kompetenzen und Berufsrang

Berufsrang darf die individuellen Kompetenzen nicht überschreiben.

Beispiel:

```text
Beruf: Schmied
Rang: Meister

Katana schmieden: 94%
Rüstung schmieden: 34%
Werkzeugbau: 81%
```

Das ist gültig.

Ein Meister kann ein Spezialist sein und nicht jede mögliche Tätigkeit gleichermaßen beherrschen.

---

# 23. Chat-Integration

Der Chat erhält relevante Informationen aus allen vier Ebenen:

```text
Beruf
Kompetenzen
Positionen
gesellschaftliche Titel
```

Aber die Ebenen müssen getrennt interpretiert werden.

Beispiel:

```text
Beruf: Koch
Kompetenz: Fleisch schneiden 82%
Titel: Baron
Amt: Mitglied des Stadtrates
```

Der Chat darf daraus nicht ableiten:

> „Der Baron kann hervorragend kochen, weil er adelig ist.“

Ebenso darf er nicht aus einem Amt automatisch fehlende Fachkompetenzen ableiten.

---

# 24. Chat erkennt berufliche Handlungen

Wenn ein Charakter tatsächlich arbeitet, soll der Chat eine strukturierte Aktivität melden.

Beispiel:

```json
{
  "type": "profession_competency_activity",
  "characterId": "char_123",
  "professionId": "cook",
  "competencyId": "prepare_fish",
  "action": "practice",
  "successful": true,
  "meaningfulPractice": true
}
```

Die KI bestimmt nicht direkt den neuen Prozentwert.

Die Anwendung berechnet den Fortschritt.

---

# 25. Chat erkennt auch Positionsereignisse

Wenn die Geschichte eine Position verändert, soll dies ebenfalls strukturiert erkannt werden.

Beispiel:

```json
{
  "type": "position_change",
  "characterId": "char_123",
  "positionId": "ship_captain",
  "action": "appoint",
  "method": "emergency_succession",
  "appointedBy": ["crew_01", "crew_02"],
  "reason": "captain_died_in_battle"
}
```

Die World-State-Logik prüft anschließend, ob diese Veränderung plausibel und erlaubt ist.

---

# 26. KI darf keine Position einfach erfinden

Gemini darf nicht ohne Kontext schreiben:

```text
Der Charakter ist jetzt König.
```

oder:

```text
Der Charakter ist jetzt Meisterschmied.
```

Dafür muss es einen nachvollziehbaren World-State-Grund geben:

- Prüfung
- Ernennung
- Wahl
- Erbschaft
- Notfall
- Anerkennung
- Befehl
- bestehendes Ereignis
- vorher etablierte Regel

---

# 27. Personen als Auslöser

Bestimmte Positionen können von konkreten Personen vergeben oder anerkannt werden.

Beispiel:

```text
König
→ ernennt Hofschmied

Gildenmeister
→ anerkennt Meisterstatus

Besatzung
→ akzeptiert Kapitän

Soldaten
→ wählen Hauptmann
```

Damit können Beziehungen, Reputation und Fraktionen Einfluss auf berufliche und soziale Entwicklung nehmen.

---

# 28. Mehrere Personen können eine Anerkennung bilden

Eine Position kann durch mehrere Personen legitimiert werden.

Beispiel:

```text
Besatzung: 12 Personen

8 akzeptieren den Charakter als Kapitän.
```

Das System kann abhängig von der Weltregeln prüfen:

```text
Mehrheit erreicht
→ Position anerkannt
```

Oder:

```text
Offizieller Kommandant notwendig
→ Anerkennung allein reicht nicht
```

Das muss weltabhängig sein.

---

# 29. UI – neue Struktur

Das bisherige UI sollte nicht mehr alles unter „Beruf / Talente“ zusammenwerfen.

Empfohlene Struktur:

```text
BERUF & KOMPETENZEN

Berufsfeld
[ Lebensmittel & Ernährung ]

Beruf
[ Koch ]

Spezialisierung
[ Fleischküche ]

Berufsrang
[ optional: Meister ]

Berufserfahrung
[ 8 Jahre, 4 Monate ]

Berufsfortschritt
██████████████░░ 72%
```

Darunter:

```text
KOMPETENZEN
[Alle] [Grundlagen] [Fortgeschritten] [Spezialisierung]
[ Suche ... ]

Kompetenzkarten
```

---

# 30. Separater Bereich für soziale Titel und Ämter

Nicht im Kompetenzkatalog anzeigen.

Eigener Bereich:

```text
TITEL & POSITIONEN

Adelstitel
Baron von ...

Ämter
Mitglied des Stadtrates

Positionen
Kapitän der „Morgenstern“
```

Dadurch ist sofort erkennbar:

```text
Beruf = was die Person beruflich macht
Titel = gesellschaftlicher Status
Amt = institutionelle Funktion
Position = aktuell übernommene Rolle
```

---

# 31. Berufskatalog UI

Der Katalog soll nach Berufsfeld filtern können.

Beispiel:

```text
BERUFSKATALOG

[ Lebensmittel ] [ Handwerk ] [ Natur ] [ Wissenschaft ] ...

Lebensmittel

□ Koch
□ Bäcker
□ Metzger
□ Konditor
□ Brauer
```

Nach Auswahl eines Berufs werden dessen tatsächliche Kompetenzen angezeigt.

Nicht mehr generische Platzhalter wie:

```text
Standardaufgaben: Gerber
```

sondern echte konkrete Kompetenzen.

---

# 32. Freischaltung von Berufen

Ein Beruf kann Voraussetzungen besitzen.

Beispiel:

```text
Kapitän

Mögliche Voraussetzungen:
- 10 Jahre Seefahrt
- bestimmte nautische Kompetenzen
- Empfehlung eines Kapitäns
- Besitz eines Schiffes
- militärische Ernennung
```

Aber Voraussetzungen dürfen alternative Wege erlauben.

Beispiel:

```text
Kapitän erhalten durch:

A: formale Ausbildung
ODER
B: 10 Jahre Erfahrung
ODER
C: Ernennung durch autorisierte Person
ODER
D: Notfallübernahme + Anerkennung der Besatzung
```

Das System soll keine unnötige lineare Progression erzwingen.

---

# 33. Storybasierte Entwicklung

Berufliche Entwicklung ist ein Teil des Worldbuildings.

Beispiele:

```text
Ein Meister stirbt.
→ Werkstatt braucht Nachfolger.
→ jemand wird zum Meister ernannt.
```

```text
Ein Kapitän stirbt.
→ Besatzung braucht Führung.
→ erfahrener Seemann übernimmt.
```

```text
Ein König gründet eine neue Akademie.
→ neue Berufe/Spezialisierungen werden verfügbar.
```

```text
Eine Gilde verbietet eine bestimmte Technik.
→ Kompetenz kann weiterhin vorhanden sein.
→ aber gesellschaftliche Anerkennung kann fehlen.
```

---

# 34. Kompetenz bleibt unabhängig von Anerkennung

Wenn jemand eine Technik tatsächlich beherrscht, darf eine fehlende Anerkennung diese Kompetenz nicht löschen.

Beispiel:

```text
Katana schmieden: 94%
```

Der Charakter verliert seinen Meistertitel.

Ergebnis:

```text
Titel/Rang verloren
Katana-Kompetenz bleibt 94%
```

Das gleiche gilt umgekehrt:

```text
Meistertitel erhalten
Kompetenz bleibt möglicherweise niedrig
```

---

# 35. Berufserfahrung bleibt erhalten

Wenn eine Person ihren Beruf wechselt:

```text
Koch → Bäcker
```

soll die Koch-Erfahrung nicht gelöscht werden.

Beispiel:

```text
Berufshistorie:
Koch: 8 Jahre
Bäcker: 2 Jahre
```

Dies kann später relevant werden.

Beispiel:

```text
Bäcker + Koch
→ Spezialist für herzhafte Backwaren
```

---

# 36. Mehrfachberufe

Ein Charakter darf mehrere Berufe besitzen oder besessen haben.

Aktuell:

```text
Hauptberuf: Koch
Nebenberuf: Fischer
```

Historisch:

```text
früher: Bäcker
```

Kompetenzen und Erfahrung müssen dem jeweiligen Beruf zugeordnet bleiben.

---

# 37. Fortschritt durch tatsächliche Aktivität

Wenn der Charakter arbeitet:

```text
Aktion
↓
passende Kompetenz
↓
XP
↓
Talent beeinflusst Lernrate
↓
Kompetenzfortschritt
```

Zusätzlich kann:

```text
Kompetenzfortschritt
↓
Berufserfahrung / Berufsfortschritt
```

beeinflusst werden.

Aber eine einzelne Aktion darf keine riesigen Sprünge erzeugen.

---

# 38. Keine automatische Gleichschaltung

Nicht implementieren:

```text
Berufsfortschritt 70%
→ alle Kompetenzen 70%
```

Nicht implementieren:

```text
Meister
→ alle Kompetenzen 100%
```

Nicht implementieren:

```text
10 Jahre Beruf
→ jede Kompetenz automatisch hoch
```

Erfahrung kann Entwicklung unterstützen, ersetzt aber nicht die tatsächliche Praxis.

---

# 39. NPC-Regel

NPCs erhalten keine künstlich aufgeblähten Kompetenzlisten.

Ein normaler NPC bekommt nur Kompetenzen, die für:

- Beruf
- Hintergrund
- bekannte Erfahrung
- aktuelle Tätigkeit
- Storyrelevanz

notwendig sind.

Ein NPC wird nicht automatisch interessant gemacht, indem die KI ihm:

- geheime Meistertechniken
- legendäre Talente
- außergewöhnliche Fähigkeiten
- dramatische Geheimnisse

gibt.

---

# 40. Deterministische World-State-Verarbeitung

Gemini beschreibt Ereignisse.

AdventureForge entscheidet über die tatsächliche Zustandsänderung.

```text
Gemini
 ↓
beobachtete Aktion / Ernennung / Ereignis
 ↓
World-State-Processor
 ↓
Voraussetzungen prüfen
 ↓
Zustand ändern
 ↓
Speichern
 ↓
UI aktualisieren
```

Die KI darf keine kritischen Werte blind überschreiben.

---

# 41. Empfohlene Services

Bestehende Architektur bevorzugen.

Falls noch nicht vorhanden:

```text
services/professionService.ts
services/professionCompetencyService.ts
services/positionService.ts
```

Aufgaben:

```ts
getProfessionFields()
getProfessionsByField(fieldId)
getProfessionSpecializations(professionId)
getProfessionCompetencies(professionId)
checkProfessionRequirements(character, profession)
checkRankRequirements(character, rank)
applyCompetencyActivity(character, activity)
applyPositionChange(worldState, event)
validateAppointment(worldState, event)
```

Kein Fortschritts-/Positionssystem direkt in React-Komponenten oder Gemini-Prompts implementieren.

---

# 42. Datenmodell – Beispiel

```ts
interface ProfessionState {
  fieldId: string;
  professionId: string;
  specializationId?: string;
  rankId?: string;
  experienceYears: number;
  experienceMonths?: number;
  experienceDays?: number;
  overallProgress: number;
  competencies: ProfessionCompetency[];
  history?: ProfessionHistoryEntry[];
}

interface ProfessionHistoryEntry {
  professionId: string;
  startedAt: string;
  endedAt?: string;
  experienceAtEnd?: number;
  reason?: string;
}

interface PositionState {
  id: string;
  positionId: string;
  holderCharacterId: string;
  acquiredAt: string;
  acquisitionMethod: string;
  reason?: string;
  appointedBy?: string[];
  recognizedBy?: string[];
  voluntary?: boolean;
}

interface SocialTitleState {
  id: string;
  titleId: string;
  grantedAt: string;
  grantedBy?: string[];
  inherited?: boolean;
  reason?: string;
}
```

Vorhandene Typen zuerst prüfen und integrieren. Keine unnötigen parallelen Interfaces erzeugen.

---

# 43. Akzeptanztests

## Test A – Berufsfeld

Charakter wählt Lebensmittel.

Erwartung:

→ Koch, Bäcker, Metzger usw. erscheinen.

## Test B – echter Kompetenzkatalog

Gerber wird ausgewählt.

Erwartung:

→ konkrete Gerber-Kompetenzen erscheinen.
→ keine generischen Platzhalter als eigentliche Kompetenzen.

## Test C – unabhängige Kompetenzen

```text
Katana 94%
Rüstung 7%
```

Erwartung:

→ Werte bleiben unabhängig.

## Test D – formaler Aufstieg

Charakter erfüllt alle Meisterbedingungen.

Erwartung:

→ Rang kann erworben werden.

## Test E – Erfahrung

Charakter erreicht die für den Beruf definierte Erfahrungszeit.

Erwartung:

→ alternativer Aufstiegsweg kann verfügbar werden.

## Test F – Anerkennung

Kapitän stirbt.
Besatzung erkennt erfahrenen Seemann an.

Erwartung:

→ Position Kapitän kann entstehen.
→ keine automatische Erhöhung nautischer Kompetenzen.

## Test G – Zwang

Besatzung benötigt dringend einen Kommandanten.

Erwartung:

→ Position kann auch gegen den Willen der Person entstehen, wenn die Weltregeln dies zulassen.

## Test H – Adel

Charakter erhält Baronstitel.

Erwartung:

→ Beruf bleibt unverändert.
→ Kompetenzen bleiben unverändert.

## Test I – Positionsverlust

Kapitän wird abgesetzt.

Erwartung:

→ Position verschwindet.
→ Berufserfahrung und Kompetenzen bleiben erhalten.

## Test J – Berufwechsel

Koch wird Bäcker.

Erwartung:

→ Koch-Erfahrung bleibt in der Historie.
→ Bäcker erhält eigenen Kompetenzbereich.

---

# 44. Definition of Done

- [ ] Berufsfelder existieren als eigene Datenebene
- [ ] konkrete Berufe gehören zu Berufsfeldern
- [ ] Spezialisierungen sind optional
- [ ] individuelle Kompetenzen bleiben separat
- [ ] Berufserfahrung wird separat gespeichert
- [ ] berufliche Ränge sind optional und berufsspezifisch
- [ ] Geselle/Meister sind keine globalen gesellschaftlichen Titel
- [ ] Adelstitel sind vollständig vom Beruf getrennt
- [ ] Ämter sind vollständig vom Beruf getrennt
- [ ] aktuelle Positionen sind vollständig vom Beruf getrennt
- [ ] Aufstieg kann über formale Bedingungen erfolgen
- [ ] Aufstieg kann über Berufserfahrung erfolgen
- [ ] Positionen können durch Anerkennung entstehen
- [ ] Positionen können durch Ernennung entstehen
- [ ] Positionen können durch Wahl entstehen
- [ ] Positionen können in Notfällen entstehen
- [ ] Positionen können bei Bedarf/unter Zwang übernommen werden
- [ ] konkrete Personen/Fraktionen können Positionen vergeben oder anerkennen
- [ ] Positionen verändern nicht automatisch Kompetenzen
- [ ] Adelstitel verändern nicht automatisch Kompetenzen
- [ ] Chat kann berufliche Aktivitäten erkennen
- [ ] Chat kann Positions-/Ernennungsereignisse erkennen
- [ ] World State entscheidet deterministisch über Änderungen
- [ ] KI kann keine direkten Kompetenzwerte erzwingen
- [ ] alte Spielstände bleiben kompatibel
- [ ] NPCs erhalten nur plausible/relevante Kompetenzen
- [ ] generische Kompetenz-Platzhalter werden durch echte berufsspezifische Kataloge ersetzt

---

# Kernprinzip

> **Der Beruf beschreibt, was eine Person beruflich tut. Kompetenzen beschreiben, was sie tatsächlich kann. Berufserfahrung beschreibt, wie lange sie diesen Weg geht. Ein Rang kann durch Ausbildung, Prüfung oder Erfahrung entstehen. Eine Position kann aber auch einfach entstehen, weil andere Menschen jemanden brauchen, ihm vertrauen, ihn wählen, ernennen, bitten oder dazu zwingen. Adelstitel und Ämter sind davon getrennte soziale Systeme.**
