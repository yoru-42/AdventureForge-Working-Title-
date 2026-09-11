# AdventureForge – Profession Tree Logic Fix V5

## Ziel

Die aktuelle UI sieht bereits wie ein Talentbaum aus, verwendet aber noch eine falsche Daten-/Darstellungslogik. Berufszweig, Lehrling, Berufe und Spezialisierungen müssen strikt voneinander getrennt werden.

Diese Datei ist die verbindliche Arbeitsanweisung für die nächste Implementierung.

---

## 1. Grundregel: Berufszweig ist KEIN Beruf

`professionField` beschreibt ausschließlich den übergeordneten beruflichen Bereich.

Beispiel:

```text
Berufszweig: Luxus & Spezial
```

Daraus darf niemals ein Beruf wie

```text
Luxusgewerbe-Lehrling
```

generiert werden.

Der Berufszweig dient nur als Kategorie bzw. Einstiegspunkt für den Talentbaum.

---

## 2. Lehrling ist der gemeinsame Einstiegsknoten

Nach Auswahl eines Berufszweigs beginnt der Talentbaum immer mit einem neutralen Knoten:

```text
LEHRLING
```

Optionaler Untertitel:

```text
Einstieg in den Berufszweig „Luxus & Spezial“
```

Nicht zulässig:

```text
LUXUSGEWERBE-LEHRLING
```

Der Lehrlingsknoten darf nicht mit einem konkreten Beruf verschmolzen werden.

Der Lehrlingsknoten enthält weiterhin:

- Berufsfortschritt
- Berufserfahrung
- Fachkompetenzen
  - Grundlagen
  - Talente

---

## 3. Jeder Beruf ist ein eigener Datenknoten

Jeder Beruf benötigt eine eigene eindeutige ID und einen eigenen Tree-Knoten.

Beispiel für den Bereich `luxus_spezial`:

```text
LEHRLING
├── Juwelier
├── Brauer
├── Koch
└── Florist
```

NICHT:

```text
Juwelier & Brauer
Koch & Florist
```

Ebenso niemals andere unabhängige Berufe künstlich zusammenfassen.

### Beispielhafte IDs

```ts
luxus_spezial.juwelier
luxus_spezial.brauer
luxus_spezial.koch
luxus_spezial.florist
```

IDs dürfen nicht aus einer kombinierten Anzeige erzeugt werden.

---

## 4. Berufe dürfen gleichzeitig aktiv sein

Das System muss mehrere eigenständige Berufe unterstützen.

Wenn ein Charakter Koch und Florist gelernt hat, müssen zwei getrennte Knoten existieren:

```text
LEHRLING
├── Koch ✓ Aktiv
│   ├── Berufsfortschritt
│   ├── Berufserfahrung
│   └── Fachkompetenzen
│
└── Florist ✓ Aktiv
    ├── Berufsfortschritt
    ├── Berufserfahrung
    └── Fachkompetenzen
```

Die UI darf daraus niemals `Koch & Florist` machen.

`&` in einer Berufsbezeichnung ist nur erlaubt, wenn es tatsächlich Teil eines einzelnen offiziellen Berufsnamen ist. Es darf nicht als Ergebnis einer UI-Kombination entstehen.

---

## 5. Spezialisierungen gehören nur zu ihrem Elternberuf

Eine Spezialisierung darf ausschließlich unter dem Beruf erscheinen, von dem sie abstammt.

Beispiel:

```text
Schmied
├── Waffenschmied
│   └── Schwertschmied
└── Rüstungsschmied
```

oder:

```text
Koch
└── Küchenchef
```

Dagegen darf die UI niemals eine falsche Verbindung erzeugen wie:

```text
Koch
└── Florist
```

wenn Florist ein unabhängiger Beruf ist.

---

## 6. Tree-Datenmodell

Das vorhandene `ProfessionSkillTree` und `professionTreeData` sollen weiterverwendet werden.

Es darf kein zweites paralleles Berufssystem entstehen.

Die Tree-Daten müssen logisch folgende Eigenschaften unterstützen:

```ts
interface ProfessionTreeNode {
  id: string;
  name: string;
  fieldId: string;
  tier: 'lehrling' | 'beruf' | 'spezialisierung' | 'meisterschaft';
  parentIds: string[];
  childIds: string[];
  specializationOf?: string;
}
```

Wichtig:

- `fieldId` = Berufszweig
- `tier` = Position im Talentbaum
- `parentIds` = tatsächliche Elternknoten
- `specializationOf` = konkreter Beruf, auf den sich die Spezialisierung bezieht
- keine zusammengesetzten Berufsnamen zur Darstellung mehrerer Knoten

---

## 7. Berufszweig-Auswahl nur einmal anzeigen

Die vorhandene obere Auswahl bleibt der einzige Bereich für:

```text
BERUFSZWEIG WÄHLEN
```

Sie soll kompakt als Tag/Chip dargestellt werden:

```text
Berufszweig: Luxus & Spezial   ×
```

Danach darf im Tree kein zweites `BERUFSZWEIG WÄHLEN` erscheinen.

Der Bereich zwischen Lehrling und den Berufsknoten darf stattdessen beispielsweise heißen:

```text
BERUFSWEGE
```

oder einfach durch die Tree-Verbindung dargestellt werden.

---

## 8. Konkretes gewünschtes UI

Für `Luxus & Spezial` soll die Struktur sinngemäß so aussehen:

```text
┌─────────────────────────────────────────┐
│ BERUFSZWEIG WÄHLEN                      │
│ Berufszweig: Luxus & Spezial     ×      │
│ Freitext                                │
└─────────────────────────────────────────┘

                 │
                 ▼

┌─────────────────────────────────────────┐
│ LEHRLING                         AKTIV  │
│ Einstieg in Luxus & Spezial             │
│                                         │
│ Berufsfortschritt             0 %       │
│ Berufserfahrung              180 Tage   │
│                                         │
│ FACHKOMPETENZEN                         │
│ Grundlagen                              │
│ • Arbeitsplatz vorbereiten              │
│ • Werkzeuge sicher benutzen             │
│ • Materialkunde                         │
│                                         │
│ Talente                                 │
│ • Handgeschick                           │
│ • Lernfähigkeit                          │
│ • Sorgfalt                               │
└─────────────────────────────────────────┘
                 │
        ┌────────┼────────┬────────┐
        ▼        ▼        ▼        ▼
     Juwelier  Brauer    Koch    Florist
```

Jeder dieser vier Knoten ist eigenständig.

---

## 9. Eigenschaften eines Berufsknotens

Ein Berufsknoten soll mindestens besitzen:

- Name
- Aktiv/Gesperrt-Status
- Voraussetzungen
- Berufsfortschritt
- Berufserfahrung
- Fachkompetenzen
  - Grundlagen
  - Talente
- Verbindungen zu seinen tatsächlichen Spezialisierungen

Beispiel:

```text
KOCH
├── Berufsfortschritt: 42 %
├── Berufserfahrung: 2 Jahre
├── Grundlagen
│   ├── Lebensmittel vorbereiten
│   └── Grundgerichte kochen
└── Talente
    ├── Gewürzkunde
    └── Feine Küche
```

---

## 10. Freischaltung

Ein Beruf kann abhängig von den vorhandenen Voraussetzungen gesperrt oder freigeschaltet werden.

Mögliche Voraussetzungen:

- Berufserfahrung
- Berufsfortschritt
- Fachkompetenzen
- absolvierte Aufgaben
- Ausbildung
- Prüfung
- Anerkennung
- Ernennung
- Story-Ereignis

Die Voraussetzung darf aber nicht dazu führen, dass mehrere Berufe zu einem Knoten zusammengefasst werden.

---

## 11. Nebenberufe bleiben getrennt

Die UI muss weiterhin zwischen folgenden Bereichen unterscheiden:

```text
[ Berufe ]
[ Nebenberufe ]
[ Adelstitel ]
```

Nebenberufe werden nicht in den Hauptberufsbaum hineingemischt.

Wenn ein Charakter beispielsweise Hauptberuf `Koch` und Nebenberuf `Florist` hat, bleiben beide Datensätze getrennt.

---

## 12. Adelstitel bleiben komplett außerhalb des Berufbaums

Folgende Dinge dürfen nicht als Berufsknoten behandelt werden:

- Kaiser / Kaiserin
- König / Königin
- Großherzog
- Herzog
- Fürst / Fürstin
- sonstige Adelstitel

Sie gehören in den separaten Bereich `Adelstitel`.

Auch Ämter und politische Positionen müssen nicht automatisch als Berufsknoten behandelt werden.

---

## 13. Bestehende Daten nicht zerstören

Die Implementierung darf bestehende Charakterdaten nicht pauschal überschreiben.

Beim Umbau:

- bestehendes `professionField` erhalten
- bestehendes `profession` erhalten, wenn es einem einzelnen Beruf entspricht
- bestehende `professionSpecialization` erhalten
- bestehende `professionProgress` erhalten
- bestehende `secondaryProfessions` erhalten
- bestehende Kompetenzen erhalten

Falls alte Daten eine zusammengefasste Bezeichnung wie `Koch & Florist` enthalten, darf diese nicht als neuer kombinierter Beruf weitergeführt werden.

Stattdessen muss die Migration die Daten – soweit eindeutig möglich – in getrennte Berufseinträge überführen.

---

## 14. Keine neue Parallelarchitektur

Besonders wichtig:

Nicht zusätzlich einen neuen `ProfessionTreeV2`, `ProfessionCareerTree` oder ähnlichen zweiten Baum erstellen.

Stattdessen:

1. vorhandene `ProfessionSkillTree` untersuchen
2. vorhandene `professionTreeData` korrigieren
3. `ProfessionCompetencySection` an die korrigierte Tree-Logik anschließen
4. bestehende Datenstrukturen weiterverwenden
5. nur notwendige Felder ergänzen

---

## 15. Konkrete Korrekturen an der aktuellen UI

### Entfernen

Die zweite Anzeige

```text
BERUFSZWEIG WÄHLEN
Juwelier & Brauer
Koch & Florist
```

muss vollständig entfernt werden.

### Ersetzen durch

Einen echten Tree-Knotenbereich:

```text
LEHRLING
     │
     ├── Juwelier
     ├── Brauer
     ├── Koch
     └── Florist
```

### Umbenennen

```text
LUXUSGEWERBE-LEHRLING
```

→

```text
LEHRLING
```

mit optionalem Untertitel:

```text
Einstieg in den Berufszweig „Luxus & Spezial“
```

---

## 16. Keine kombinierte Anzeige aus mehreren aktiven Berufen

Die UI darf niemals aus einem Array aktiver Berufe automatisch einen String bilden wie:

```ts
activeProfessions.join(' & ')
```

oder sinngemäß:

```ts
`${professionA} & ${professionB}`
```

Stattdessen muss jeder aktive Beruf einzeln gerendert werden.

```tsx
activeProfessions.map(profession => (
  <ProfessionTreeNode key={profession.id} ... />
))
```

---

## 17. Akzeptanztest

Nach der Implementierung muss mindestens folgender Test funktionieren:

### Test A – Luxus & Spezial

Auswahl:

```text
Berufszweig: Luxus & Spezial
```

Erwartung:

```text
LEHRLING
│
├── Juwelier
├── Brauer
├── Koch
└── Florist
```

Keine Kombinationen.

### Test B – mehrere Berufe aktiv

Aktivieren:

```text
Koch
Florist
```

Erwartung:

```text
Koch ✓
Florist ✓
```

Nicht:

```text
Koch & Florist
```

### Test C – Spezialisierung

Aktivieren:

```text
Schmied
```

Erwartung:

```text
Schmied
├── Waffenschmied
│   └── Schwertschmied
└── Rüstungsschmied
```

### Test D – Berufszweig

`Luxus & Spezial` darf nur einmal als Berufszweig-Auswahl erscheinen.

---

## 18. Definition of Done

- [ ] Berufszweig ist nur Kategorie/Filter.
- [ ] Lehrling ist neutraler gemeinsamer Einstiegsknoten.
- [ ] Kein `LUXUSGEWERBE-LEHRLING` mehr.
- [ ] Jeder Beruf besitzt einen eigenen Tree-Knoten.
- [ ] Keine kombinierten Berufe wie `Juwelier & Brauer`.
- [ ] Keine kombinierten Berufe wie `Koch & Florist`.
- [ ] Mehrere Berufe können gleichzeitig aktiv sein.
- [ ] Jeder aktive Beruf wird separat dargestellt.
- [ ] Spezialisierungen hängen nur an ihrem echten Elternberuf.
- [ ] Berufszweig-Auswahl erscheint nur einmal.
- [ ] Nebenberufe bleiben getrennt.
- [ ] Adelstitel bleiben getrennt.
- [ ] Bestehende Charakterdaten werden nicht unnötig überschrieben.
- [ ] `ProfessionSkillTree` bleibt die zentrale Tree-Komponente.
- [ ] `professionTreeData` bleibt die zentrale Tree-Datenquelle.
- [ ] Keine zweite parallele Berufssystem-Architektur.

---

## Kurzfassung für Codex / Gemini

> Korrigiere das bestehende Berufssystem anhand dieser Datei. Der Berufszweig ist nur eine Kategorie und niemals selbst ein Beruf. Nach Auswahl des Berufszweigs gibt es einen neutralen Knoten `Lehrling`. Darunter müssen alle einzelnen Berufe als getrennte Tree-Knoten erscheinen. Niemals unabhängige Berufe zu Namen wie `Juwelier & Brauer` oder `Koch & Florist` zusammenfassen. Mehrere Berufe dürfen gleichzeitig aktiv sein und müssen einzeln gerendert werden. Spezialisierungen dürfen nur unter ihrem tatsächlichen Elternberuf erscheinen. Die zweite `BERUFSZWEIG WÄHLEN`-Auswahl im Tree entfernen. `ProfessionSkillTree` und `professionTreeData` als bestehende zentrale Architektur weiterverwenden. Keine neue parallele Berufssystem-Implementierung erstellen. Bestehende Charakterdaten und Kompetenzen erhalten.`