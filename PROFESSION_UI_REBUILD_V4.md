# AdventureForge – Profession UI Rebuild V4

## Ziel

Das Berufssystem wird **einheitlich, kompakt und als echter verzweigter Talentbaum** dargestellt.

Die UI soll nicht mehr wie eine lange Liste von Berufsbezeichnungen wirken. Der Spieler wählt zunächst ein Berufsfeld bzw. einen Berufszweig und entwickelt sich danach vom **Lehrling** aus durch einzelne Berufsknoten und Spezialisierungen weiter.

---

# 1. Grundstruktur

Im Charakter-Editor gibt es drei voneinander getrennte Bereiche:

- **Berufe** – Hauptberuf / berufliche Laufbahn
- **Nebenberufe** – zusätzliche, eigenständige Berufe
- **Adelstitel** – gesellschaftliche Titel, die NICHT als Berufe behandelt werden

Diese drei Bereiche dürfen weder im Datenmodell noch in der Anzeige zu einem gemeinsamen Berufsfeld vermischt werden.

Beispiel:

```text
[ Berufe ]
[ Nebenberufe ]
[ Adelstitel ]
```

Jeder Bereich ist kompakt auf- und zuklappbar, damit der Charakter-Editor nicht unnötig groß wird.

---

# 2. Berufsfeld / Berufszweig

Die Auswahl **„Berufszweig wählen“** bleibt als kompakte Tag-Auswahl bestehen.

KEIN großes dauerhaft geöffnetes Dropdown.

Beispiel:

```text
Berufszweig wählen

[ Metall & Waffen ] [ Lebensmittel ] [ Magie ] [ Militär ]
[ Religion ] [ Verwaltung ] [ Handwerk ] [ Kunst ] ...
```

Der gewählte Berufszweig wird als Tag angezeigt.

```text
Berufszweig
[ Metall & Waffen × ]
```

Dadurch bleibt die Übersicht kompakt.

Die Berufszweig-Auswahl findet **nur am Anfang** statt. Sobald der Zweig gewählt wurde, soll die eigentliche Entwicklung über den Talentbaum erfolgen.

---

# 3. Talentbaum

Nach Auswahl des Berufszweigs beginnt jeder Charakter grundsätzlich bei:

```text
LEHRLING
```

Danach verzweigt sich der Berufspfad.

Beispiel Lebensmittel:

```text
                    LEHRLING
                       │
          ┌────────────┼────────────┐
          │            │            │
        KOCH         BÄCKER       BRAUER
          │            │
     ┌────┼────┐       ├──────────┐
     │    │    │       │          │
 Fleisch Fisch Gourmet Konditor  ...
```

Beispiel Metall & Waffen:

```text
                    LEHRLING
                       │
                     SCHMIED
                       │
          ┌────────────┼────────────┐
          │            │            │
    WAFFENSCHMIED  RÜSTUNGSSCHMIED  WERKZEUGSCHMIED
          │
     ┌────┴────┐
     │         │
 SCHWERT-    ...
 SCHMIED
```

## Wichtig

Der Talentbaum ist **nicht linear**.

Ein Charakter darf mehrere Zweige gleichzeitig entwickeln, sofern die Voraussetzungen erfüllt sind.

Beispiel:

```text
Schmied
 ├─ Waffenschmied ✓
 │   └─ Schwertschmied ✓
 └─ Rüstungsschmied ✓
```

Es darf also nicht automatisch nur eine Spezialisierung aktiv sein.

---

# 4. Struktur jedes Berufsknotens

Jeder einzelne Berufsknoten besitzt dieselbe kompakte Struktur.

Beispiel:

```text
KOCH

Berufsfortschritt
Berufserfahrung
Fachkompetenzen
  ├─ Grundlagen
  └─ Talente
```

Das gilt genauso für Bäcker, Schmied, Waffenschmied, Florist, Fischer usw.

**Kein Beruf darf mit einem anderen Beruf zusammengelegt werden.**

---

# 5. Berufe bleiben eigenständige Einträge

Besonders wichtig wegen der aktuellen Gemini-Änderungen:

Folgende Einträge sind jeweils eigenständige Berufe:

```text
Koch
Florist
Bäcker
Brauer
Schmied
Waffenschmied
Rüstungsschmied
Fischer
Jäger
Tiertrainer
usw.
```

NICHT:

```text
Koch & Florist
Bäcker & Brauer
Jäger & Fischer
```

Mehrere Berufe dürfen nur dann gemeinsam ausgeübt werden, wenn sie als **separate Haupt-/Nebenberufe oder separate Talentbaum-Zweige** gespeichert werden.

Der Name eines Berufes darf niemals automatisch durch das Zusammenfügen zweier Katalogeinträge erzeugt werden.

---

# 6. Hauptberuf vs. Nebenberuf

Ein Charakter kann beispielsweise besitzen:

```text
Berufe
  Berufszweig: Metall & Waffen
  └─ Schmied
      └─ Waffenschmied

Nebenberufe
  ├─ Kräutersammler
  └─ Fischer

Adelstitel
  └─ Baron
```

Das bedeutet:

- Schmied = Teil der Hauptberufslaufbahn
- Waffenschmied = Spezialisierung innerhalb dieser Laufbahn
- Kräutersammler = eigenständiger Nebenberuf
- Fischer = eigenständiger Nebenberuf
- Baron = Adelstitel, KEIN Beruf

---

# 7. Adelstitel vollständig vom Berufssystem trennen

Adelstitel dürfen nicht als Berufsknoten im Talentbaum erscheinen.

Beispiele:

```text
Kaiser / Kaiserin
König / Königin
Großherzog
Herzog
Fürst / Fürstin
Graf / Gräfin
Baron / Baronin
Edler / Edle
```

Diese Einträge gehören in:

```text
[ Adelstitel ]
```

und nicht in:

```text
[ Berufe ]
```

Ein Charakter kann gleichzeitig beispielsweise sein:

```text
Beruf: Schmied
Nebenberuf: Kräutersammler
Adelstitel: Baron
```

Der Adelstitel darf die berufliche Laufbahn nicht ersetzen.

---

# 8. Fachkompetenzen

Jeder Berufsknoten besitzt zwei getrennte Kompetenzbereiche:

```text
Fachkompetenzen

  Grundlagen
  ├─ grundlegende Tätigkeiten
  ├─ Werkzeugkunde
  └─ Materialkunde

  Talente
  ├─ besondere Spezialisierung
  ├─ außergewöhnliche Technik
  └─ individuelle Stärke
```

Die Kompetenzen gehören zum jeweiligen Berufsknoten.

Beispiel Koch:

```text
KOCH

Berufsfortschritt: 62 %
Berufserfahrung: 4 Jahre

Fachkompetenzen

Grundlagen
  ├─ Gemüse schneiden
  ├─ Fleisch vorbereiten
  ├─ Suppen kochen
  └─ Gewürzkunde

Talente
  ├─ Saucen
  ├─ Gourmetküche
  └─ Großküche
```

---

# 9. Berufsfortschritt

Berufsfortschritt ist unabhängig vom Adelstitel und unabhängig von allgemeinen Charakterwerten.

Der Fortschritt kann beispielsweise berücksichtigen:

- Berufserfahrung
- tatsächlich ausgeübte Tätigkeiten
- erworbene Fachkompetenzen
- erfüllte Voraussetzungen
- Prüfungen
- Anerkennung durch andere
- Ernennung / Berufung
- besondere Ereignisse

Ein neuer Berufsknoten darf daher nicht ausschließlich durch einen simplen Levelwert freigeschaltet werden.

---

# 10. Mehrere Berufszweige / Spezialisierungen

Nach dem Einstieg darf der Charakter mehrere passende Pfade entwickeln.

Beispiel:

```text
Lehrling
   ↓
Schmied
   ↓
├── Waffenschmied
│    └── Schwertschmied
│
└── Rüstungsschmied
```

Wenn beide Voraussetzungen erfüllt sind, können beide Zweige aktiv sein.

Es gibt daher kein Datenmodell nach dem Prinzip:

```text
currentSpecialization = genau eine Auswahl
```

wenn dadurch mehrere aktive Spezialisierungen verhindert werden.

Stattdessen muss die Struktur mehrere aktive Knoten unterstützen.

---

# 11. UI-Verhalten

## Standardzustand

Der Bereich bleibt kompakt:

```text
BERUFE                                      [▼]

Berufszweig
[ Metall & Waffen ]

Lehrling → Schmied → Waffenschmied
                    → Rüstungsschmied
```

Beim Anklicken eines Knotens öffnet sich dessen Detailbereich.

```text
[ Waffenschmied ▼ ]

Berufsfortschritt  64 %
Berufserfahrung    5 Jahre

Fachkompetenzen
  Grundlagen       [▼]
  Talente          [▼]
```

Andere Knoten bleiben kompakt.

---

# 12. Keine redundanten Felder

Nicht mehr verwenden:

```text
Berufsfeld
Berufsbezeichnung
Berufszweig
Spezialisierung
Berufsbezeichnung 2
```

wenn dieselben Informationen mehrfach dargestellt werden.

Stattdessen:

```text
Berufszweig wählen
        ↓
Lehrling
        ↓
Talentbaum
```

Der jeweils ausgewählte Knoten definiert den aktuellen Berufspfad.

---

# 13. Freitext

Eine manuelle Berufsbezeichnung darf weiterhin möglich sein, aber nur als explizite Sonderfunktion.

Sie darf den strukturierten Katalog nicht verändern.

Freitext darf insbesondere nicht dazu führen, dass automatisch neue kombinierte Berufe entstehen.

---

# 14. Datenmodell

Das Datenmodell muss mindestens unterscheiden zwischen:

```ts
professionField
mainProfession
activeProfessionNodes[]
secondaryProfessions[]
socialTitles[]
```

Dabei gilt:

- `professionField` = gewählter Berufszweig
- `mainProfession` = aktueller Hauptberuf / Hauptpfad
- `activeProfessionNodes[]` = mehrere aktive Berufsknoten und Spezialisierungen
- `secondaryProfessions[]` = eigenständige Nebenberufe
- `socialTitles[]` = Adelstitel und andere gesellschaftliche Titel

Keine automatische Vermischung dieser Daten.

---

# 15. Katalogregeln

Der vollständige Berufskatalog muss erhalten bleiben.

Jeder Katalogeintrag erhält eine eindeutige ID.

Wenn gleiche Namen in unterschiedlichen Bereichen vorkommen, bleiben sie trotzdem getrennte Datensätze.

Beispiel:

```text
koch
koch_service
koch_hof
```

oder andere eindeutige IDs – aber niemals Zusammenfassung zu einem künstlichen Namen.

Besonders wichtig:

```text
Koch ≠ Florist
Koch ≠ Koch & Florist
Jäger ≠ Fischer
Ninja ≠ Spion
General ≠ Adelstitel
Ritter ≠ Adelstitel
```

Ein Titel wie „Ritter“ darf nur dann als Beruf verwendet werden, wenn er im konkreten System ausdrücklich als berufliche Kampfklasse definiert ist. Ein gesellschaftlicher Adelstitel bleibt davon getrennt.

---

# 16. Umsetzung im bestehenden Code

Der vorhandene `ProfessionSkillTree` soll **nicht durch ein zweites paralleles Berufssystem ersetzt werden**.

Stattdessen:

1. vorhandene Tree-Daten prüfen
2. doppelte/kombinierte Berufe entfernen
3. einzelne Katalogeinträge eindeutig machen
4. Berufsfeld-Auswahl auf kompakte Tags umstellen
5. `Lehrling` als echten Root-Knoten verwenden
6. Berufsknoten darunter verzweigen
7. mehrere aktive Zweige ermöglichen
8. jeden Knoten mit Berufsfortschritt, Berufserfahrung und Fachkompetenzen darstellen
9. Nebenberufe separat halten
10. Adelstitel separat halten
11. alte redundante Berufs-Dropdowns entfernen
12. keine bestehenden Charakterdaten ungefragt löschen

---

# 17. Definition of Done

Die Umsetzung gilt erst als abgeschlossen, wenn:

- [ ] Berufszweig als kompakter Tag auswählbar ist
- [ ] Berufszweig-Auswahl nicht dauerhaft als großes Dropdown angezeigt wird
- [ ] Lehrling der Startpunkt des Talentbaums ist
- [ ] Berufe unter Lehrling verzweigt dargestellt werden
- [ ] weitere Spezialisierungen ebenfalls verzweigt dargestellt werden
- [ ] mehrere Spezialisierungen gleichzeitig möglich sind
- [ ] jeder Beruf ein eigener Katalogeintrag bleibt
- [ ] keine künstlichen Kombinationen wie „Koch & Florist“ entstehen
- [ ] Beruf ≠ Nebenberuf
- [ ] Beruf ≠ Adelstitel
- [ ] Nebenberufe separat angezeigt werden
- [ ] Adelstitel separat angezeigt werden
- [ ] jeder Berufsknoten Berufsfortschritt besitzt
- [ ] jeder Berufsknoten Berufserfahrung besitzt
- [ ] jeder Berufsknoten Fachkompetenzen besitzt
- [ ] Fachkompetenzen in Grundlagen und Talente getrennt sind
- [ ] Voraussetzungen weiterhin berücksichtigt werden
- [ ] bestehende Charakterdaten nicht überschrieben werden
- [ ] alle vorhandenen echten Berufe erreichbar und in der UI sichtbar sind
- [ ] Kategorien platzsparend auf- und zuklappbar sind
- [ ] keine zweite konkurrierende Berufssystem-Implementierung entsteht

---

# Kurzfassung für Codex / Gemini

> Baue das bestehende Berufssystem sauber als echten verzweigten Talentbaum um. Die einzige anfängliche Auswahl ist „Berufszweig wählen“ und diese Auswahl wird als kompakter Tag dargestellt. Danach beginnt der Charakter bei „Lehrling“ und entwickelt sich über einzelne, eigenständige Berufsknoten weiter. Jeder Berufsknoten enthält Berufsfortschritt, Berufserfahrung und Fachkompetenzen mit den Unterbereichen Grundlagen und Talente. Der Baum muss echte Verzweigungen unterstützen und mehrere aktive Spezialisierungen gleichzeitig erlauben.
>
> Ganz wichtig: Berufe niemals künstlich zusammenfassen. „Koch“ und „Florist“ sind zwei eigenständige Berufe und dürfen niemals als „Koch & Florist“ gespeichert oder angezeigt werden. Dasselbe gilt für alle anderen Katalogeinträge.
>
> Hauptberufe, Nebenberufe und Adelstitel müssen vollständig getrennt werden. Im Charakter-UI gibt es daher kompakte, auf-/zuklappbare Bereiche für „Berufe“, „Nebenberufe“ und „Adelstitel“. Adelstitel gehören nicht in den Berufstalentbaum.
>
> Verwende den bereits vorhandenen `ProfessionSkillTree` und das bestehende Datenmodell als Grundlage. Keine parallele zweite Berufssystem-Implementierung erstellen. Alte redundante Berufsfeld-/Berufsbezeichnung-Dropdowns entfernen bzw. durch die neue Struktur ersetzen. Bestehende Charakterdaten dürfen nicht ungefragt überschrieben oder gelöscht werden.
