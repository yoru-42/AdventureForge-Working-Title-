# AdventureForge – Überarbeitung Fähigkeiten / Techniken UI

## Ziel

Die bestehende Fähigkeiten-Hierarchie soll nicht mehr als lange, verschachtelte Baumansicht dargestellt werden. Die vorhandene Datenstruktur und Rückwärtskompatibilität müssen erhalten bleiben, aber die Bedienung soll kompakt und übersichtlich werden.

Die neue Navigation lautet:

**Kraftquelle → Grundfähigkeit → Kategorie → Inhalte**

Dabei werden Kraftquellen und Grundfähigkeiten als auswählbare Tags dargestellt. Die Kategorien werden **nur einmal** angezeigt und dienen als Navigation für die aktuell ausgewählte Grundfähigkeit.

---

## 1. Gewünschte UI-Struktur

Die UI soll grundsätzlich so aufgebaut sein:

```text
KRAFTQUELLE
[ Teufelskräfte ] [ Haki ] [ Magie ] [ + ]

GRUNDFÄHIGKEIT
[ Kryokinese ] [ Eiserne Haut ] [ Kältebeherrschung ] [ + ]

KATEGORIEN
[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]

────────────────────────────────────────────

INHALT DER AUSGEWÄHLTEN GRUNDFÄHIGKEIT

z.B. ausgewählte Grundfähigkeit: Kryokinese
aktuelle Kategorie: Techniken

[ Technik 1 ]
[ Technik 2 ]
[ Technik 3 ]
[ + Technik ]
```

### Wichtig

- Die fünf Kategorien dürfen **nicht für jede Grundfähigkeit erneut gerendert werden**.
- Es gibt genau **eine gemeinsame Kategorie-Navigation**.
- Die Kategorie bezieht sich immer auf die aktuell ausgewählte Grundfähigkeit.
- Wird eine andere Grundfähigkeit als Tag ausgewählt, bleibt die Kategorie-Auswahl bestehen und nur deren Inhalte wechseln.
- Wird eine andere Kategorie ausgewählt, werden die Einträge dieser Kategorie für die aktuell ausgewählte Grundfähigkeit angezeigt.
- Dadurch entsteht keine lange Liste mit wiederholten Kategorie-Blöcken.

---

## 2. Kraftquelle

`Kraftquelle` bleibt die oberste Ebene.

Beispiele:

- Teufelskräfte
- Haki
- Magie
- Ki
- Psionik
- Schwertkunst

Anforderungen:

- Mehrere Kraftquellen müssen möglich bleiben.
- Die aktive Kraftquelle wird als Tag ausgewählt.
- Nur die zugehörigen Grundfähigkeiten sollen darunter angezeigt bzw. auswählbar sein.
- Bestehende Felder der `CharacterPowerSource` dürfen nicht verloren gehen.
- Kosten/Ressource der Kraftquelle müssen weiterhin erhalten bleiben.
- Bestehende Daten dürfen nicht durch die UI-Umstellung gelöscht oder neu erzeugt werden.

---

## 3. Grundfähigkeiten

Grundfähigkeiten werden als kompakte Tags dargestellt.

Beispiel:

```text
[ Kryokinese ] [ Kältebeherrschung ] [ Eiserne Haut ] [ + ]
```

Anforderungen:

- Jede vorhandene `BaseAbility` wird als Tag dargestellt.
- Ein Klick auf einen Tag setzt diese Grundfähigkeit als aktive Auswahl.
- Die ausgewählte Grundfähigkeit muss visuell eindeutig erkennbar sein.
- `+` erstellt eine weitere Grundfähigkeit für die aktuell ausgewählte Kraftquelle.
- Beim Erstellen einer neuen Grundfähigkeit darf die bestehende Datenstruktur von `BaseAbility` nicht beschädigt werden.
- Element und Fähigkeitsart bleiben Bestandteile der Grundfähigkeit.
- Der vorhandene automatische Name über `resolveKinesisName()` darf weiter funktionieren.
- Individuelle Namen dürfen weiterhin möglich sein.

### Keine Wiederholung

Es darf nicht mehr für jede Grundfähigkeit ein kompletter großer Block mit allen Kategorien untereinander erzeugt werden.

Stattdessen:

```text
Grundfähigkeit A   Grundfähigkeit B   Grundfähigkeit C
       ↑
   aktive Auswahl

Kategorie-Leiste nur einmal
       ↓
Inhalt der aktiven Grundfähigkeit
```

---

## 4. Gemeinsame Kategorie-Navigation

Die folgenden Kategorien müssen vorhanden sein:

1. `Passive Fähigkeiten`
2. `Techniken`
3. `Ultimative Techniken`
4. `Transformationen`
5. `Talente`

Sie werden **einmal** unterhalb der Grundfähigkeits-Tags angezeigt.

### Verhalten

Beispiel:

```text
Grundfähigkeit:
[ Kryokinese ] [ Eiserne Haut ] [ Blutmagie ]
      ↑
    aktiv

[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]
                                      ↑
                                    aktiv
```

Wenn anschließend `Eiserne Haut` angeklickt wird:

```text
[ Kryokinese ] [ Eiserne Haut ] [ Blutmagie ]
                ↑
              aktiv

[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]
                                      ↑
                                    aktiv

→ Jetzt werden die Techniken von Eiserne Haut angezeigt.
```

Die Kategorie-Tags werden dabei **nicht erneut erzeugt**.

---

## 5. Kategorien und Datenzuordnung

Die Einträge müssen logisch der ausgewählten Grundfähigkeit zugeordnet werden.

### Passive Fähigkeiten

Zeigt passive Fähigkeiten der aktiven Grundfähigkeit.

### Techniken

Zeigt normale Techniken der aktiven Grundfähigkeit.

### Ultimative Techniken

Zeigt ultimative Techniken der aktiven Grundfähigkeit.

### Transformationen

Zeigt Transformationen, die der aktiven Grundfähigkeit zugeordnet sind.

### Talente

Zeigt Talente, die der aktiven Grundfähigkeit zugeordnet sind.

Falls einzelne Kategorien aktuell noch nicht dieselbe Datenstruktur besitzen wie `TechniqueItem`, soll **keine künstliche Migration oder Löschung** erfolgen. Die vorhandenen Datenstrukturen müssen weiter funktionieren.

---

## 6. Techniken

Die vorhandene neue `TechniqueItem`-Struktur soll weiterverwendet werden.

Bereits vorhandene Felder dürfen nicht entfernt werden, insbesondere:

- `name`
- `description`
- `type`
- `subtype`
- `tier`
- `powerSourceId`
- `powerSourceName`
- `baseAbilityIds`
- `baseAbilityNames`
- `element`
- `abilityType`
- `targetType`
- `effects`
- `applications`
- `range`
- `duration`
- `level`
- `maxLevel`
- `xp`
- `xpNeeded`
- `progression`
- `costResource`
- `costResourceName`
- `costValue`
- `costFormula`
- `cost`
- `scaling`
- `metamorphosisImpact`
- `summonCount`

### Mehrere Grundfähigkeiten

Die bestehende Möglichkeit, eine Technik mehreren Grundfähigkeiten zuzuordnen, muss erhalten bleiben.

Beispiel:

```text
Technik: Eisblut-Klinge
Grundfähigkeiten:
- Kryokinese
- Schwertkunst
```

Diese Kombinationstechnik darf nicht durch die UI-Umstellung verloren gehen.

---

## 7. Technik-Modus ergänzen

Für Techniken soll zusätzlich ein eigenes Feld `mode` bzw. `Modus` vorgesehen werden.

Der Modus ist **nicht dasselbe** wie:

- Element
- Fähigkeitsart
- Technik-Typ
- Subtyp

Beispiele für Modi können sein:

- Normal
- Verstärkt
- Dauerhaft
- Aufgeladen
- Schnellzauber
- Konter
- Bereich
- Fernkampf
- Nahkampf
- Kanalisiert

Die konkrete Auswahl darf so umgesetzt werden, dass später weitere Modi ergänzt werden können.

Falls aktuell kein Modus im Datentyp existiert, soll `TechniqueItem` entsprechend erweitert werden.

Bestehende Techniken müssen mit einem sinnvollen Standardwert kompatibel bleiben.

---

## 8. Beschwörungen

`sum​monCount` existiert bereits und muss erhalten bleiben.

Zusätzlich soll eine eigene Angabe für die Kosten pro weiterer Beschwörung vorgesehen werden.

Beispiel:

```text
Beschwörungen: 3
Grundkosten: 20 Mana
Kosten pro Beschwörung: 5 Mana
```

Dafür soll ein separates Feld ergänzt werden, z.B.:

```ts
summonCostValue?: number;
summonCostFormula?: string;
```

oder eine gleichwertige, konsistente Lösung.

Wichtig: Die normale Technik-Kostenberechnung und die Beschwörungskosten dürfen nicht ungewollt vermischt werden.

---

## 9. Smart Fill

Die vorhandene `TechniqueSmartFillModal` muss weiterhin funktionieren.

Sie unterstützt bereits:

- Auswahl einer Kraftquelle
- Auswahl einer Grundfähigkeit
- mehrere Grundfähigkeiten für Kombinationstechniken

Diese Funktionalität muss erhalten bleiben.

Smart Fill soll künftig auch die neuen Technikfelder berücksichtigen, insbesondere:

- Modus
- Beschwörungsanzahl
- Kosten pro Beschwörung

Es darf aber keine Pflicht entstehen, dass Smart Fill jedes optionale Feld immer ausfüllt.

---

## 10. Manuelles Erstellen einer Technik

Beim Klick auf `+ Technik` soll weiterhin eine neue Technik angelegt werden.

Die aktuelle Minimalerzeugung darf beibehalten werden, aber die UI soll danach Zugriff auf die vorhandenen Technikdaten ermöglichen.

Die neue Technik muss automatisch erhalten:

- aktive Grundfähigkeit
- zugehörige Kraftquelle
- Element der Grundfähigkeit
- Fähigkeitsart der Grundfähigkeit
- Standardressource der Kraftquelle

Die Technik darf nicht versehentlich einer falschen Grundfähigkeit zugeordnet werden.

---

## 11. Bestehende Synchronisierung erhalten

Die vorhandene Synchronisierung zwischen neuer Hierarchie und Legacy-Daten muss erhalten bleiben.

Insbesondere:

- `normalizeAbilityHierarchy()`
- `syncCharacterAbilityTree()`

dürfen nicht entfernt oder durch eine zweite konkurrierende Datenhaltung ersetzt werden.

Die alte `CharacterAbility`-Struktur existiert derzeit noch in `CharacterLoreForm.tsx`. Die Umstellung soll deshalb möglichst auf der bestehenden neuen Hierarchie aufbauen und die Rückwärtskompatibilität respektieren.

**Keine komplette Neuentwicklung der Datenhaltung.**

---

## 12. Bestehende UI-Logik aufräumen

Die bisherige `TechniqueHierarchyTree` nutzt eine klassische Baum-/Accordion-Darstellung mit:

- Kraftquellen als große Blöcke
- Grundfähigkeiten als verschachtelte Blöcke
- Collapse/Expand-Zuständen

Diese Darstellung soll für die neue Bedienung ersetzt bzw. entsprechend umgebaut werden.

Ziel ist eine kompakte Auswahl-Navigation statt einer langen Baumansicht.

Die folgenden Zustände werden benötigt:

```ts
activePowerSourceId
activeBaseAbilityId
activeCategory
```

Dabei sollte beim Wechsel der Kraftquelle automatisch eine passende Grundfähigkeit ausgewählt werden, sofern vorhanden.

Beim Löschen der aktiven Grundfähigkeit muss automatisch eine andere vorhandene Grundfähigkeit ausgewählt werden.

Beim Löschen der aktiven Kraftquelle muss ebenfalls eine gültige Auswahl hergestellt werden.

---

## 13. Layout-Ziel

Die UI soll deutlich weniger vertikalen Platz verbrauchen.

Priorität:

1. Kraftquellen kompakt als Tags
2. Grundfähigkeiten kompakt als Tags
3. Kategorien kompakt als Tags
4. Nur der Inhalt der aktuellen Auswahl wird geöffnet
5. Keine mehrfachen Kategorieblöcke
6. Kein unnötiges Scrollen durch bereits bekannte Grundfähigkeiten

Die Darstellung soll weiterhin zum bestehenden AdventureForge-Design passen.

---

## 14. Nicht ändern

Folgende Funktionen dürfen durch die Umstellung nicht verloren gehen:

- mehrere Kraftquellen
- mehrere Grundfähigkeiten
- Technik-Zuordnung zu mehreren Grundfähigkeiten
- Elemente
- Fähigkeitsarten
- Technik-Typen
- Subtypen
- Kosten
- Zieltypen
- Effekte
- Reichweite
- Dauer
- Level/XP/Progression
- Skalierung
- Transformationseinfluss
- Beschwörungsanzahl
- Smart Fill
- Legacy-Synchronisierung
- Read-only-Modus

---

## 15. Technische Umsetzung

Voraussichtlich relevante Dateien:

- `components/TechniqueHierarchyTree.tsx`
- `components/TechniqueSmartFillModal.tsx`
- `components/CharacterLoreForm.tsx`
- `utils/abilityHierarchy.ts`
- `types.ts`

Vor Änderungen prüfen, ob weitere Komponenten direkt auf `TechniqueItem`, `BaseAbility`, `CharacterPowerSource` oder `CharacterAbility.category` zugreifen.

Keine unnötigen Änderungen an anderen Bereichen des Editors vornehmen.

---

## 16. Akzeptanzkriterien

Die Umsetzung ist korrekt, wenn:

- [ ] Kraftquellen als kompakte Tags auswählbar sind.
- [ ] Grundfähigkeiten als kompakte Tags auswählbar sind.
- [ ] Es keine wiederholten Kategorie-Leisten pro Grundfähigkeit gibt.
- [ ] Die fünf Kategorien genau einmal als Navigation erscheinen.
- [ ] Die aktive Grundfähigkeit eindeutig erkennbar ist.
- [ ] Die aktive Kategorie eindeutig erkennbar ist.
- [ ] Beim Wechsel der Grundfähigkeit nur deren Inhalte wechseln.
- [ ] Beim Wechsel der Kategorie nur die Kategorie-Inhalte wechseln.
- [ ] Neue Grundfähigkeiten als neue Tags erscheinen.
- [ ] Neue Techniken automatisch der aktiven Grundfähigkeit zugeordnet werden.
- [ ] Kombinationstechniken mit mehreren Grundfähigkeiten weiterhin funktionieren.
- [ ] Smart Fill weiterhin funktioniert.
- [ ] Technik-Modus unterstützt wird.
- [ ] Beschwörungsanzahl erhalten bleibt.
- [ ] Kosten pro Beschwörung unterstützt werden.
- [ ] `normalizeAbilityHierarchy()` und `syncCharacterAbilityTree()` weiterhin funktionieren.
- [ ] Bestehende Charakterdaten beim Öffnen und Speichern unverändert erhalten bleiben.
- [ ] Read-only weiterhin funktioniert.
- [ ] Die neue UI deutlich weniger vertikalen Platz benötigt als die bisherige Baumansicht.

---

## Wichtigste Vorgabe

**Nicht:**

```text
Grundfähigkeit A
  Passive Fähigkeiten
  Techniken
  Ultimative Techniken
  Transformationen
  Talente

Grundfähigkeit B
  Passive Fähigkeiten
  Techniken
  Ultimative Techniken
  Transformationen
  Talente
```

**Sondern:**

```text
KRAFTQUELLE
[ A ] [ B ] [ C ]

GRUNDFÄHIGKEIT
[ A ] [ B ] [ C ] [ + ]

KATEGORIE
[ Passive ] [ Techniken ] [ Ultimative ] [ Transformationen ] [ Talente ]

INHALT
→ nur Inhalt der aktuell ausgewählten Grundfähigkeit + Kategorie
```

Das ist die zentrale UX-Vorgabe dieser Änderung.
