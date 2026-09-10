# AdventureForge – Berufstree UI: kompakter Berufszweig-Talentbaum

## Ziel

Die UI **Berufe, Talente & Alltagskompetenzen** wird so umgebaut, dass der Beruf tatsächlich als verzweigter Talentbaum funktioniert.

Die bisherige Darstellung mit großen Berufskarten, Berufsgraden und einer langen Rang-/Karriereübersicht wird nicht weitergeführt.

Die zentrale Struktur lautet:

```text
Berufsfeld
    ↓
Lehrling
    ↓
Berufszweig wählen
    ↓
konkreter Beruf
    ↓
weitere Berufsäste / Spezialisierungen
```

Wichtig: **„Berufszweig wählen“ bleibt als kompakte Tag-/Chip-Auswahl erhalten.** Diese Tags sind ausdrücklich gewünscht, weil sie wenig Platz benötigen und die Übersicht verbessern.

---

# 1. Oberste Ebene: Berufsfeld

Ganz oben wird weiterhin nur das Berufsfeld ausgewählt:

```text
BERUFSFELD
[ Bau & Handwerk ▼ ]
```

Alternativ z. B.:

```text
[ Lebensmittel & Ernährung ▼ ]
[ Natur & Landwirtschaft ▼ ]
[ Medizin & Heilkunde ▼ ]
[ Handel & Wirtschaft ▼ ]
```

Das Berufsfeld ist die einzige große Auswahl am Anfang.

Es darf **kein zusätzliches großes Dropdown „Berufsbezeichnung“** geben, das alle Berufe des Feldes als flache Liste enthält.

---

# 2. Lehrling ist der erste Knoten des Berufstrees

Nach der Berufsfeldauswahl wird der Einstiegsknoten angezeigt:

```text
LEHRLING
```

Der Lehrling ist kein gesellschaftlicher Titel und kein globaler Charakterrang.

Er ist der **erste berufliche Knoten im Berufstree**.

Der Lehrlingsknoten zeigt:

```text
Lehrling

Berufsfortschritt       24 %
██████░░░░░░░░░░░░░░░

Berufserfahrung         180 Tage

Fachkompetenzen
Grundlagen
- Arbeitsplatz vorbereiten
- Werkzeuge sicher benutzen
- einfache Tätigkeiten

Talente
- Handgeschick
- Lernfähigkeit
- Sorgfalt
```

Die tatsächlichen Kompetenzen und Werte kommen aus dem Character-/World-State.

---

# 3. Berufszweig wählen bleibt als Tags

Unter dem Lehrlingsknoten wird **kein großer Kartenblock** erzeugt.

Stattdessen bleibt die vorhandene kompakte Tag-/Chip-Darstellung:

```text
BERUFSZWEIG WÄHLEN

[ Schmied ] [ Schreiner & Tischler ] [ Zimmermann & Dachdecker ]
[ Maurer & Steinmetz ] [ Gerber & Leder ] [ Schneider & Gewandmacher ]
```

Weitere Beispiele:

```text
Lebensmittel & Ernährung

[ Koch ] [ Bäcker ] [ Metzger ] [ Konditor ] [ Brauer ]
```

Die Tags:

- sind anklickbar
- benötigen nur so viel Breite wie ihr Text benötigt
- umbrechen automatisch in mehrere Zeilen
- dürfen nicht unnötig groß werden
- sollen deutlich weniger Platz benötigen als die bisherigen Berufskarten
- zeigen den aktuell ausgewählten Zweig optisch hervorgehoben
- sollen die Auswahl schnell und übersichtlich machen

**Diese Tag-Auswahl ist ausdrücklich Teil des gewünschten Designs und darf nicht wieder durch große Karten ersetzt werden.**

---

# 4. Nach Auswahl des Berufszweigs kommt der Berufsknoten

Beispiel:

```text
Berufsfeld: Bau & Handwerk

                 LEHRLING
                     │
                     │
            BERUFSZWEIG WÄHLEN

 [Schmied] [Schreiner] [Zimmermann] [Maurer] [Gerber]
      ▲
   ausgewählt
      │
      ▼
                  SCHMIED
```

Der ausgewählte Beruf wird anschließend als nächster Knoten des Trees dargestellt.

Beispiel Koch:

```text
Berufsfeld: Lebensmittel & Ernährung

                 LEHRLING
                     │
                     │
            BERUFSZWEIG WÄHLEN

 [Koch] [Bäcker] [Metzger] [Konditor] [Brauer]
    ▲
 ausgewählt
    │
    ▼
                   KOCH
```

---

# 5. Jeder Berufsknoten besitzt denselben Informationsaufbau

Für **Lehrling, Koch, Schmied, Bäcker usw.** wird derselbe kompakte Informationsaufbau verwendet.

```text
┌─────────────────────────────────────────────┐
│ KOCH                                        │
│                                             │
│ Berufsfortschritt                41 %       │
│ ████████████░░░░░░░░                      │
│                                             │
│ Berufserfahrung                2 J. 3 Mon. │
│                                             │
│ FACHKOMPETENZEN                             │
│                                             │
│ Grundlagen                                  │
│ • Gemüse schneiden               72 %      │
│ • Fleisch schneiden              61 %      │
│ • Messer benutzen                81 %      │
│ • Zutaten vorbereiten            68 %      │
│                                             │
│ TALENTE                                     │
│ • Fleischgerichte                ★★★☆☆     │
│ • Saucen                         ★★★★★     │
└─────────────────────────────────────────────┘
```

Reihenfolge innerhalb jedes Berufsknotens:

1. Berufsbezeichnung
2. Berufsfortschritt
3. Berufserfahrung
4. Fachkompetenzen
5. Grundlagen innerhalb der Fachkompetenzen
6. Talente

Keine zusätzlichen globalen Berufsgrade in diesem Block.

---

# 6. Berufsfortschritt und Berufserfahrung sind getrennte Werte

**Berufsfortschritt** und **Berufserfahrung** dürfen nicht zu einem Wert verschmolzen werden.

Beispiel:

```text
Berufsfortschritt: 41 %
Berufserfahrung: 2 Jahre, 3 Monate
```

Berufserfahrung ist tatsächliche Erfahrung in diesem Beruf.

Berufsfortschritt beschreibt den Fortschritt innerhalb des Berufspfades.

Beides muss aus dem vorhandenen Datenmodell/World-State kommen und darf nicht nur als dekorative UI-Zahl erfunden werden.

---

# 7. Fachkompetenzen sind individuelle Fähigkeiten

Der Beruf definiert, welche Fachkompetenzen sinnvoll angezeigt werden.

Die Werte gehören aber zum jeweiligen Charakter.

Beispiel Koch:

```text
FACHKOMPETENZEN

Grundlagen
├─ Gemüse schneiden             72 %
├─ Fleisch schneiden            61 %
├─ Fisch vorbereiten            48 %
├─ Messer sicher benutzen       81 %
└─ Gewürze dosieren             54 %

Zubereitung
├─ Suppen kochen                66 %
├─ Fleischgerichte              58 %
├─ Fischgerichte                41 %
├─ Gemüsegerichte               73 %
└─ Saucen herstellen             35 %
```

Das Freischalten eines Berufes setzt die Fachkompetenzen **nicht automatisch auf hohe Werte**.

---

# 8. Talente gehören zum jeweiligen Berufsknoten

Talente werden ebenfalls im jeweiligen Knoten angezeigt.

Beispiel:

```text
TALENTE

Saucen herstellen       ★★★★★
Gemüse schneiden        ★★★★☆
Fleischgerichte          ★★★☆☆
```

Talente sind individuell und dürfen nicht mit Berufsrängen verwechselt werden.

---

# 9. Der Berufstree verzweigt sich weiter

Nach einem konkreten Beruf können weitere Berufsäste folgen.

Beispiel Koch:

```text
                         KOCH
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Fleischküche        Fischküche        Gourmetküche
        │                  │                  │
        ▼                  ▼                  ▼
 weitere Berufe      weitere Berufe      weitere Berufe
```

Diese Äste sind wiederum auswählbare Knoten.

Bei einer späteren Auswahl kann der nächste Knoten wieder seine eigenen Werte anzeigen:

```text
GOURMETKOCH

Berufsfortschritt
Berufserfahrung
Fachkompetenzen
Grundlagen
Talente
```

Damit entsteht ein echter Talentbaum und keine lineare Liste.

---

# 10. Wichtig: Der Baum muss platzsparend bleiben

Der Tree soll nicht durch riesige Karten unübersichtlich werden.

Priorität:

```text
kompakte Knoten
+ klare Verbindungen
+ kleine Tags für Zweigwahl
+ wenige große Container
```

Die Berufszweig-Tags dürfen mehrere Zeilen bilden.

Beispiel:

```text
BERUFSZWEIG WÄHLEN

[Schmied] [Schreiner & Tischler] [Zimmermann & Dachdecker]
[Maurer & Steinmetz] [Gerber & Leder] [Schneider & Gewandmacher]
```

Keine sechs großen Karten nebeneinander.

---

# 11. Visuelle Struktur

Das UI soll ungefähr diese Hierarchie besitzen:

```text
BERUFE, TALENTE & ALLTAGSKOMPETENZEN
│
├── BERUFSFELD
│   [ Bau & Handwerk ▼ ]
│
├── LEHRLING
│   ├── Berufsfortschritt
│   ├── Berufserfahrung
│   ├── Fachkompetenzen
│   │   └── Grundlagen
│   └── Talente
│
├── BERUFSZWEIG WÄHLEN
│   [Schmied] [Schreiner] [Zimmermann] [Maurer] ...
│
├── SCHMIED
│   ├── Berufsfortschritt
│   ├── Berufserfahrung
│   ├── Fachkompetenzen
│   │   └── Grundlagen
│   └── Talente
│
└── weitere Berufsäste
    ├── Waffenschmied
    ├── Rüstungsschmied
    └── Werkzeugschmied
```

---

# 12. Ausgewählter Pfad muss sichtbar sein

Der aktuelle Pfad soll optisch nachvollziehbar bleiben:

```text
Lehrling
   │
   ▼
[Schmied]
   │
   ▼
Schmied
   │
   ├── Waffenschmied
   ├── Rüstungsschmied
   └── Werkzeugschmied
```

Ausgewählte Knoten/Tags werden hervorgehoben.

Nicht ausgewählte Alternativen bleiben sichtbar, damit der Spieler die anderen Möglichkeiten erkennen kann.

---

# 13. Keine Berufsgrade „Geselle“, „Meister“ usw. in diesem UI

Die bisherige Darstellung mit:

```text
Schmiedegeselle
Grobschmied
Schmiedemeister
Gesellenstück
Meisterprüfung
```

wird aus dieser UI entfernt.

Ebenso keine Box:

```text
Mögliche Berufsgrade & Ränge
```

und keine Karrierebox:

```text
Karriere- & Aufstiegswege
```

Diese Begriffe dürfen nicht die Struktur des Berufstrees bestimmen.

Falls eine Welt später konkrete formale Positionen oder Anerkennungen benötigt, gehören diese in ein separates System und nicht als globaler Rangblock in diesen Berufsknoten.

---

# 14. Keine zusätzlichen gesellschaftlichen Titel

Folgende Dinge gehören nicht in den Berufstree:

```text
Baron
Graf
Herzog
König
Bürgermeister
Richter
Minister
```

Beruf, Position, Amt und gesellschaftlicher Titel bleiben getrennt.

---

# 15. Alltagskompetenzen bleiben separat

Die vorhandene Sektion

```text
ALLTAGSKOMPETENZEN & PRAKTISCHE FERTIGKEITEN
```

bleibt bestehen.

Sie gehört **nicht** in jeden Berufsknoten.

Beispiel:

```text
ALLTAGSKOMPETENZEN

Überleben & Orientierung
[ Lagerfeuer machen ] [ Orientierung im Gelände ] [ Spurenlesen ]

Haushalt, Kochen & Proviant
[ Kochen & Backen ] [ Reinigung & Wäsche ] [ Vorratsverwaltung ]

Tiere, Reiten & Transport
[ Reiten ] [ Pferdepflege & Satteln ] [ Kutsche & Wagen fahren ]
```

Die Auswahl als Tags/Chips darf auch hier kompakt bleiben.

---

# 16. Spezielle Talente & Spezialwissen

Die bestehende Sektion für:

```text
SPEZIELLE TALENTE & SPEZIALWISSEN
```

bleibt separat vom Berufstree.

Sie darf weiterhin allgemeines spezielles Wissen/Talente aufnehmen, das nicht sauber einem konkreten Berufsknoten zugeordnet ist.

---

# 17. Interaktion

### Berufsfeld ändern

Beim Ändern des Berufsfeldes wird der dazugehörige Berufstree neu aufgebaut.

### Berufszweig auswählen

Klick auf einen Tag:

```text
[ Schmied ]
```

setzt diesen Zweig als ausgewählten Pfad und zeigt darunter den Schmied-Knoten.

### Weiteren Berufsknoten auswählen

Ein Klick auf einen nachfolgenden Berufsknoten setzt diesen als ausgewählten aktuellen Berufspfad.

### Bereits aktiver Beruf

Der aktuell aktive Beruf wird eindeutig markiert:

```text
✓ Aktueller Beruf
```

### Gesperrter Knoten

Falls ein Knoten noch nicht erreichbar ist:

```text
🔒 Gesperrt
```

Die tatsächlichen fehlenden Voraussetzungen können beim Anklicken kompakt angezeigt werden.

---

# 18. Datenmodell

Berufsfeld, Berufszweig und Berufsknoten müssen datengetrieben sein.

Beispiel:

```ts
interface ProfessionNode {
  id: string;
  fieldId: string;
  name: string;
  parentIds?: string[];
  childIds?: string[];
  specializationOf?: string;
  prerequisites?: ProfessionPrerequisite[];
}
```

Zusätzlich muss der Character-State die tatsächliche Auswahl und Werte speichern können, z. B.:

```ts
profession: {
  fieldId: string;
  professionId: string;
  pathIds: string[];
  progress: number;
  experience: {
    years: number;
    months: number;
    days: number;
  };
  competencies: Record<string, number>;
  talents: Record<string, number>;
}
```

Die genaue bestehende Datenstruktur soll wiederverwendet bzw. sauber migriert werden. Keine parallele zweite Berufsdatenbank erzeugen.

---

# 19. Beispiel: kompletter Kochpfad

```text
BERUFSFELD
Lebensmittel & Ernährung

                     LEHRLING
                         │
                         │
                BERUFSZWEIG WÄHLEN

 [Koch] [Bäcker] [Metzger] [Konditor] [Brauer]
    ▲
 ausgewählt
    │
    ▼
                      KOCH

              Berufsfortschritt: 41 %
              Berufserfahrung: 2 J. 3 Mon.

              Fachkompetenzen
              └─ Grundlagen
                 ├─ Gemüse schneiden 72 %
                 ├─ Fleisch schneiden 61 %
                 └─ Messer benutzen 81 %

              Talente
              ├─ Saucen herstellen ★★★★★
              └─ Fleischgerichte ★★★☆☆

                         │
           ┌─────────────┼─────────────┐
           │             │             │
      Fleischküche    Fischküche    Gourmetküche
           │             │             │
           ▼             ▼             ▼
        weiterer       weiterer      weiterer
         Knoten         Knoten        Knoten
```

Das ist die gewünschte Grundlogik.

---

# 20. Was NICHT umgesetzt werden darf

Nicht zurückkehren zu:

```text
Berufsbezeichnung [ Koch ▼ ]
```

als alleinige Berufsauswahl.

Nicht:

```text
Stufe 1: Lehrling
Stufe 2: Kernberuf
Stufe 3: Spezialisierung
Stufe 4: Meisterstufe
```

Nicht:

```text
Mögliche Berufsgrade & Ränge
```

Nicht:

```text
Geselle → Meister
```

Nicht große Karten für alle Berufszweige.

Nicht Alltagskompetenzen in jeden Berufsknoten kopieren.

---

# Definition of Done

- [ ] Berufsfeld bleibt die oberste Auswahl.
- [ ] Lehrling ist der erste Knoten des Berufstrees.
- [ ] Lehrling zeigt Berufsfortschritt, Berufserfahrung, Fachkompetenzen/Grundlagen und Talente.
- [ ] „Berufszweig wählen“ bleibt als kompakte Tags/Chips erhalten.
- [ ] Tags benötigen nur wenig Platz und umbrechen bei Bedarf.
- [ ] Ein ausgewählter Tag wird klar hervorgehoben.
- [ ] Nach der Zweigwahl erscheint der konkrete Beruf als nächster Tree-Knoten.
- [ ] Koch, Schmied usw. zeigen Berufsfortschritt, Berufserfahrung, Fachkompetenzen/Grundlagen und Talente.
- [ ] Nach dem Beruf können weitere Äste/Spezialisierungen folgen.
- [ ] Die Verbindungen zwischen den Knoten sind sichtbar.
- [ ] Der aktuelle Pfad ist nachvollziehbar.
- [ ] Keine großen Berufszweig-Karten.
- [ ] Keine globale Darstellung von Geselle/Meister/Berufsgraden in diesem UI.
- [ ] Keine gesellschaftlichen Titel oder Ämter im Berufstree.
- [ ] Alltagskompetenzen bleiben als eigene Sektion erhalten.
- [ ] Spezielle Talente/Spezialwissen bleiben separat.
- [ ] Berufsfortschritt und Berufserfahrung bleiben getrennte Werte.
- [ ] Fachkompetenzen bleiben individuelle Werte.
- [ ] Talente bleiben individuelle Werte.
- [ ] Bestehende Datenstrukturen werden wiederverwendet statt parallel dupliziert.
- [ ] Auswahl und Fortschritt bleiben mit dem Character-/World-State verbunden.
