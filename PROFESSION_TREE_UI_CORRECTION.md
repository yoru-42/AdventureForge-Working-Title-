# AdventureForge – Korrektur: Echter Berufsskilltree statt Berufsliste

## Problem

Die aktuelle Darstellung zeigt die Berufsbezeichnungen eines Berufsfeldes lediglich untereinander bzw. als flache Auswahl.

Das ist **kein Skilltree**.

Ein echter Berufsskilltree muss die Beziehungen zwischen Einstieg, Berufen, Spezialisierungen und möglichen weiteren Pfaden sichtbar machen.

---

# 1. Ziel

Der Benutzer soll nicht einfach eine Liste wie diese sehen:

```text
Koch
Bäcker
Metzger
Konditor
Brauer
```

Sondern eine visuelle Hierarchie:

```text
                         KEIN BERUF
                             │
                        BERUFSEINSTIEG
                             │
                          LEHRLING
                             │
             ┌───────────────┼───────────────┐
             │               │               │
           KOCH            BÄCKER          METZGER
             │               │               │
       ┌─────┼─────┐      ┌──┼──┐        ┌───┼───┐
       │     │     │      │  │  │        │   │   │
    Fleisch Fisch Gourmet  ...          ...
       │
       └───────────┐
                   ↓
             weitere Stufe /
             Spezialisierung
```

Die Darstellung muss also **Knoten und Verbindungen** besitzen.

---

# 2. Berufsfeld ist die oberste Auswahl

Das UI beginnt mit:

```text
BERUFSFELD

[ Lebensmittel & Ernährung ▼ ]
```

Erst danach wird der dazugehörige Berufspfad angezeigt.

Das Feld `Berufsbezeichnung` darf NICHT als zweites flaches Select mit allen Berufen dargestellt werden.

---

# 3. Echter Baum

Nach Auswahl eines Berufsfeldes wird ein interaktiver Baum angezeigt.

Beispiel:

```text
Lebensmittel & Ernährung

                         [LEHRLING]
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           [KOCH]         [BÄCKER]         [METZGER]
              │               │               │
       ┌──────┼──────┐      ┌─┼─┐          ┌──┼──┐
       │      │      │      │ │ │          │  │  │
   [FLEISCH] [FISCH] [GOURMET] ...       ... ... ...
```

Jeder Knoten ist ein auswählbares Element.

---

# 4. Knoten müssen Informationen enthalten

Ein Berufsknoten zeigt mindestens:

```text
┌──────────────────────────┐
│ 🍳 KOCH                  │
│ Lebensmittel & Ernährung │
│                          │
│ ✓ verfügbar              │
│                          │
│ [Auswählen]              │
└──────────────────────────┘
```

Bei nicht verfügbaren Pfaden:

```text
┌──────────────────────────┐
│ ⚒ Schmied                │
│                          │
│ 🔒 Voraussetzungen       │
│                          │
│ 2 Voraussetzungen fehlen │
└──────────────────────────┘
```

Der Benutzer muss erkennen können, **warum** ein Pfad gesperrt ist.

---

# 5. Voraussetzungen

Berufsknoten können Voraussetzungen besitzen.

Beispiele:

```text
Koch
→ keine oder einfache Einstiegsvoraussetzung
```

Eine Spezialisierung:

```text
Gourmetkoch

Voraussetzungen:
✓ Beruf: Koch
✓ bestimmte Kochkompetenzen
✓ Berufserfahrung
✓ eventuell Meister / Lehrer / Prüfung
```

Die Voraussetzungen dürfen individuell definiert werden.

Nicht jeder Beruf muss dieselben Regeln verwenden.

---

# 6. Berufserfahrung ist ein eigener Weg zum Aufstieg

Ein Aufstieg kann unter anderem über tatsächliche Berufserfahrung erfolgen.

Beispiel:

```text
Koch
 ↓
5 Jahre Berufserfahrung
 ↓
Fortgeschrittene Kochposition
```

Die Zahl der Jahre muss aus dem tatsächlichen World State bzw. den gespeicherten Berufsdaten kommen.

Nicht einfach durch ein UI-Level simulieren.

---

# 7. Meister / Prüfung als anderer Aufstiegsweg

Ein Beruf kann eine formale Aufstiegsroute besitzen:

```text
Koch
 ↓
Voraussetzungen erfüllt
 ↓
Meisterprüfung / Anerkennung durch Meister
 ↓
Meisterkoch
```

Diese Route ist unabhängig davon, ob der Charakter beispielsweise bereits einen gesellschaftlichen Adelstitel besitzt.

---

# 8. Anerkennung durch andere Personen als dritte Aufstiegsroute

Ein Beruf oder eine Position kann auch **ohne formale Ausbildung oder Prüfung** entstehen.

Beispiel Kapitän:

```text
Schiff
 ↓
Kapitän fällt im Gefecht
 ↓
niemand mit formaler Kapitänsausbildung vorhanden
 ↓
Besatzung benötigt jemanden, der Befehle gibt
 ↓
Person mit 10 Jahren Seeerfahrung wird anerkannt
 ↓
Position: Kapitän
```

Mögliche Gründe:

```text
requested_by_person
recognized_by_group
appointed_by_authority
forced_by_necessity
elected_by_group
inherited
story_event
```

Die Person muss dadurch nicht automatisch alle Kapitänskompetenzen besitzen.

Die **Position** entsteht durch soziale Anerkennung / Notwendigkeit.

---

# 9. Beruf und Position strikt trennen

Beispiel:

```text
Beruf:
Seemann

Kompetenzen:
Navigation 82%
Segeln 91%
Schiffskunde 76%

Position:
Kapitän

Erwerbsart:
forced_by_necessity
```

Der Charakter wurde also zum Kapitän gemacht, obwohl er vorher kein offizieller Kapitän war.

Das ist ausdrücklich erlaubt.

Ebenso kann jemand Kapitän sein und später eine formale Kapitänsausbildung nachholen.

---

# 10. Adelstitel und Ämter bleiben vollständig getrennt

Nicht in denselben Berufstree integrieren:

```text
Baron
Graf
Herzog
König
Bürgermeister
Richter
Minister
```

Diese gehören zum separaten System für:

```text
gesellschaftliche Titel
Ämter
Positionen
politische Macht
Adel
```

Ein Koch kann Baron sein.

Ein Baron kann Koch sein.

Ein Kapitän kann Graf sein.

Ein Graf kann als Kapitän eingesetzt werden.

Keine automatische Vermischung.

---

# 11. Mehrere Pfade statt einer geraden Linie

Ein Berufstree darf nicht so aussehen:

```text
Koch
 ↓
Stufe 2
 ↓
Stufe 3
 ↓
Stufe 4
```

Sondern beispielsweise:

```text
                         KOCH
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      Fleischküche     Fischküche      Gourmetküche
          │                │                │
      ┌───┴───┐        ┌───┴───┐       ┌────┴────┐
      │       │        │       │       │         │
    Metzger-  ...    Fisch-   ...   Hofkoch   Luxuskoch
    küche             meister
```

Ein Charakter darf sich auf einen Pfad konzentrieren.

---

# 12. Ein Beruf kann mehrere Spezialisierungen besitzen

Beispiel Schmied:

```text
                         SCHMIED
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      Waffenschmied     Rüstungsschmied    Werkzeugschmied
          │                 │
      ┌───┼────┐        ┌───┼────┐
      │   │    │        │   │    │
    Klinge Katana ...   Helm Brust ...
```

Beispiel Koch:

```text
                         KOCH
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Fleischküche        Fischküche        Gourmetküche
        │                                     │
   Grillmeister                         Hofkoch
```

---

# 13. Kompetenzsystem bleibt darunter

Der Baum entscheidet über mögliche berufliche Pfade.

Die individuellen Kompetenzen entscheiden über das tatsächliche Können.

```text
BERUFSFELD
    ↓
BERUFSTREE
    ↓
BERUF
    ↓
SPEZIALISIERUNG
    ↓
INDIVIDUELLE KOMPETENZEN
```

Beispiel:

```text
Koch
 └─ Fleischküche
     ├─ Fleisch schneiden       91%
     ├─ Fleisch marinieren      72%
     ├─ Grillen                 84%
     ├─ Braten                  63%
     └─ anspruchsvolle Fleischgerichte 31%
```

Eine freigeschaltete Spezialisierung setzt die Kompetenzen nicht automatisch auf hohe Werte.

---

# 14. UI-Vorgabe

Das bisherige Dropdown:

```text
Berufsbezeichnung
[ Koch ▼ ]
```

soll **nicht** die einzige Darstellung der verfügbaren Berufe sein.

Stattdessen:

```text
┌───────────────────────────────────────────────────────────┐
│ BERUFSFELD                                                │
│ [ Lebensmittel & Ernährung ▼ ]                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                         [LEHRLING]                        │
│                              │                            │
│             ┌────────────────┼────────────────┐           │
│             │                │                │           │
│          [KOCH]          [BÄCKER]         [METZGER]       │
│             │                │                │           │
│       ┌─────┼─────┐       ┌──┼──┐          ┌──┼──┐        │
│       │     │     │       │  │  │          │  │  │        │
│    [FLEISCH] [FISCH] [GOURMET] ...      ... ... ...      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

Auf Desktop darf der Baum horizontal wachsen.

Auf kleineren Screens darf er zoombar / scrollbar sein.

Die Knoten müssen anklickbar sein.

---

# 15. Interaktion

Beim Anklicken eines Knotens:

```text
Koch

Beschreibung
Voraussetzungen
Freischaltstatus
Spezialisierungen
Berufskompetenzen
Aufstiegswege

[Beruf wählen]
```

Bei bereits aktivem Beruf:

```text
✓ Aktueller Beruf
```

Bei gesperrtem Knoten:

```text
🔒 Gesperrt

Fehlende Voraussetzungen:
- 2 Jahre Berufserfahrung
- Kompetenz „Fleischgerichte“ ≥ 60%
```

---

# 16. Datenmodell für den Tree

Berufe brauchen echte Beziehungen.

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

Die Beziehungen dürfen nicht ausschließlich aus der Reihenfolge eines Arrays entstehen.

`parentIds` / `childIds` oder eine vergleichbare explizite Struktur ist erforderlich.

---

# 17. Wichtig für Gemini / World State

Der Tree ist keine reine UI-Dekoration.

Die Freischaltungen müssen Bestandteil des tatsächlichen World-/Character-State sein.

Der Chat darf nicht einfach sagen:

> „Du bist jetzt Meisterkoch.“

wenn keine gültige Freischaltung vorliegt.

Der Chat darf jedoch eine Situation erzeugen, die eine Anerkennung / Ernennung auslöst.

Beispiel:

```text
Seeschlacht
 ↓
Kapitän tot
 ↓
Besatzung erkennt erfahrenen Seemann an
 ↓
World State setzt Position = Kapitän
```

Die Anwendung entscheidet anschließend über die konkrete Zustandsänderung.

---

# 18. Kernunterscheidung

```text
BERUFS-TREE
= Welche beruflichen Wege gibt es?

KOMPETENZEN
= Was kann diese konkrete Person tatsächlich?

BERUFSERFAHRUNG
= Wie lange / wie viel Erfahrung hat sie in diesem Beruf?

ANERKENNUNG / POSITION
= Welche Rolle wurde ihr von anderen übertragen?

ADEL / ÄMTER / GESELLSCHAFTLICHE TITEL
= Welche gesellschaftliche Stellung besitzt sie?
```

Diese fünf Ebenen dürfen nicht zu einem einzigen Levelsystem verschmolzen werden.

---

# Definition of Done

- [ ] Berufsfeld ist die oberste Auswahl.
- [ ] Berufsbezeichnungen werden nicht als flache Liste dargestellt.
- [ ] Nach Auswahl des Berufsfeldes wird ein echter visueller Baum angezeigt.
- [ ] Der Baum besitzt sichtbare Verbindungen zwischen Eltern und Kindern.
- [ ] Berufe können mehrere Pfade und Spezialisierungen besitzen.
- [ ] Knoten können Voraussetzungen besitzen.
- [ ] Berufserfahrung kann ein Aufstiegsweg sein.
- [ ] Meister / Prüfung / Anerkennung kann ein anderer Aufstiegsweg sein.
- [ ] Positionen können durch andere Personen vergeben, erbeten, gewählt oder erzwungen werden.
- [ ] Kapitän nach einer Notsituation ist ein gültiges Beispiel.
- [ ] Adelstitel und Ämter bleiben vom Berufssystem getrennt.
- [ ] Individuelle Kompetenzen bleiben unabhängig vom Tree.
- [ ] Der Tree ist Datenmodell + UI und nicht nur eine optische Darstellung.
- [ ] Der Chat kann keine ungültigen Freischaltungen selbst erfinden.
