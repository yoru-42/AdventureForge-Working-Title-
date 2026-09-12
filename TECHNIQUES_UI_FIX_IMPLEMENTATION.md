# AdventureForge – Fähigkeiten-/Techniken-UI: Implementierungsauftrag

## Ziel

Die bereits begonnene neue Struktur der Fähigkeiten-/Techniken-UI soll jetzt sauber fertiggestellt werden.

Die bestehende Architektur wird **weiterverwendet**. Es soll keine neue konkurrierende Datenhaltung und keine komplette Neuentwicklung geben.

Zielstruktur:

```text
KRAFTQUELLE
[ Teufelskräfte ] [ Haki ] [ Magie ] [ + ]

GRUNDFÄHIGKEIT
[ Kryokinese ] [ Kältebeherrschung ] [ Eiserne Haut ] [ + ]

KATEGORIEN
[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]

────────────────────────────────────────

INHALT DER AKTIVEN GRUNDFÄHIGKEIT

```

Die Kategorie-Navigation existiert **genau einmal** und wird nicht unter jeder Grundfähigkeit wiederholt.

---

## 1. Zuerst den vorhandenen Code berücksichtigen

Vor Änderungen die aktuellen Implementierungen in mindestens diesen Dateien prüfen:

- `components/TechniqueHierarchyTree.tsx`
- `components/TechniqueSmartFillModal.tsx`
- `components/CharacterLoreForm.tsx`
- `services/geminiService.ts`
- `utils/abilityHierarchy.ts`
- `types.ts`

Außerdem prüfen, ob weitere Dateien direkt auf folgende Daten zugreifen:

- `TechniqueItem`
- `BaseAbility`
- `CharacterPowerSource`
- `CharacterAbility.category`

**Keine unnötigen Änderungen an anderen Editorbereichen.**

---

# 2. Kritischer Fix: Kraftquelle darf keine Grundfähigkeit automatisch erzeugen

Aktuell erzeugt das Hinzufügen einer Kraftquelle automatisch eine Grundfähigkeit wie z.B. `Kryokinese`.

Das ist nicht gewünscht.

Eine Kraftquelle und eine Grundfähigkeit sind zwei getrennte Ebenen.

Gewünschtes Verhalten:

```text
KRAFTQUELLE
[ Neue Kraftquelle ]

GRUNDFÄHIGKEIT
[ + Grundfähigkeit ]
```

Wenn der Nutzer beispielsweise `Teufelskräfte` erstellt, darf dadurch **nicht automatisch** `Kryokinese` oder eine andere Grundfähigkeit entstehen.

Erst über `+ Grundfähigkeit` wird eine Grundfähigkeit erstellt.

Dabei dürfen vorhandene Daten und bestehende `BaseAbility`-Felder nicht beschädigt werden.

Der vorhandene Mechanismus für automatische Namensbildung, insbesondere `resolveKinesisName()`, soll nur verwendet werden, wenn tatsächlich eine neue Grundfähigkeit erstellt wird.

---

# 3. Kraftquellen als Tags

`CharacterPowerSource` bleibt die oberste Ebene.

Mehrere Kraftquellen müssen weiterhin möglich sein.

Beispiel:

```text
KRAFTQUELLE
[ Teufelskräfte ] [ Haki ] [ Schwertkunst ] [ + ]
```

Beim Anklicken einer Kraftquelle:

1. wird `activePowerSourceId` gesetzt,
2. werden nur die zugehörigen Grundfähigkeiten angezeigt,
3. wird automatisch eine gültige Grundfähigkeit ausgewählt, wenn eine vorhanden ist,
4. bleiben vorhandene Kategorie-Auswahl und Daten erhalten, sofern möglich.

Wenn für die Kraftquelle noch keine Grundfähigkeit existiert, soll keine künstliche Grundfähigkeit erzeugt werden.

Stattdessen soll nur die Möglichkeit `+ Grundfähigkeit` angeboten werden.

---

# 4. Kritischer Fix: Kraftquelle sicher löschen

Das Löschen einer Kraftquelle darf nicht pauschal alle Techniken dieser Kraftquelle löschen.

Besonders wichtig sind Kombinationstechniken, die mehreren Grundfähigkeiten zugeordnet sein können.

Beispiel:

```text
Technik: Eisblut-Klinge
Kraftquelle: Teufelskräfte
Grundfähigkeiten:
- Kryokinese
- Schwertkunst
```

Wenn eine einzelne Zuordnung entfernt wird, darf die Technik nicht automatisch verschwinden, solange sie noch gültige Zuordnungen besitzt.

Beim Löschen einer Kraftquelle:

- Kraftquelle entfernen.
- Zugehörige Grundfähigkeits-Zuordnungen bereinigen.
- `baseAbilityIds` und `baseAbilityNames` der betroffenen Techniken synchron halten.
- Eine Technik nur dann entfernen, wenn sie danach keinerlei gültige Zuordnung mehr besitzt und die bestehende Datenlogik dies ausdrücklich verlangt.
- Keine fremden Techniken löschen.

Wenn die vorhandene Datenstruktur eine Technik zwingend an eine Kraftquelle bindet, muss die bestehende Logik geprüft und möglichst verlustfrei bereinigt werden.

**Keine pauschale Filterlogik verwenden, die sämtliche Techniken mit `powerSourceId === psId` löscht.**

---

# 5. Kritischer Fix: `baseAbilityIds` und `baseAbilityNames` synchron halten

Techniken können mehreren Grundfähigkeiten zugeordnet sein.

Daher müssen folgende Felder immer zusammenpassen:

```ts
baseAbilityIds
baseAbilityNames
```

Wenn eine Grundfähigkeit gelöscht wird:

```text
vorher:
baseAbilityIds   = [A, B, C]
baseAbilityNames = [Kryokinese, Schwertkunst, Haki]

nach Löschen von B:
baseAbilityIds   = [A, C]
baseAbilityNames = [Kryokinese, Haki]
```

Es dürfen keine veralteten Namen zurückbleiben.

Wenn eine Technik nur einer Grundfähigkeit zugeordnet war und diese gelöscht wird, muss die bestehende Logik entscheiden, ob die Technik entfernt oder als nicht zugeordneter Eintrag behandelt wird. Dabei darf keine inkonsistente Technik entstehen.

---

# 6. Aktive Auswahl sauber behandeln

Die neue UI verwendet:

```ts
activePowerSourceId
activeBaseAbilityId
activeCategory
```

Diese drei Zustände müssen immer gültig behandelt werden.

## Beim Wechsel der Kraftquelle

Wenn Grundfähigkeiten vorhanden sind:

```text
activePowerSourceId = neue Kraftquelle
activeBaseAbilityId = erste gültige Grundfähigkeit dieser Kraftquelle
```

Wenn keine Grundfähigkeit vorhanden ist:

```text
activePowerSourceId = neue Kraftquelle
activeBaseAbilityId = null
```

Keine Grundfähigkeit künstlich erstellen.

## Beim Löschen der aktiven Grundfähigkeit

Automatisch eine andere vorhandene Grundfähigkeit auswählen.

Wenn keine mehr vorhanden ist:

```text
activeBaseAbilityId = null
```

## Beim Löschen der aktiven Kraftquelle

Eine andere vorhandene Kraftquelle auswählen, falls vorhanden.

Wenn keine mehr vorhanden ist:

```text
activePowerSourceId = null
activeBaseAbilityId = null
```

`activeCategory` soll dabei möglichst erhalten bleiben.

---

# 7. Kategorien nur einmal rendern

Die fünf Kategorien sind:

1. `Passive Fähigkeiten`
2. `Techniken`
3. `Ultimative Techniken`
4. `Transformationen`
5. `Talente`

Sie werden genau einmal angezeigt.

Beispiel:

```text
Grundfähigkeiten
[ Kryokinese ] [ Eiserne Haut ] [ Schwertkunst ]

Kategorien
[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]
```

Beim Wechsel der Grundfähigkeit wird **nur der Inhalt** darunter gewechselt.

Nicht zulässig:

```text
Kryokinese
  Passive
  Techniken
  Ultimative
  Transformationen
  Talente

Eiserne Haut
  Passive
  Techniken
  Ultimative
  Transformationen
  Talente
```

Die bestehende neue `TechniqueHierarchyTree`-Architektur soll dafür weiter genutzt werden.

---

# 8. Kategorie-Button-Beschriftungen sauber machen

Keine dynamische String-Bastelei wie:

```ts
activeCategory.replace(/en$/, '') + ' hinzufügen'
```

wenn dadurch unnatürliche deutsche Bezeichnungen entstehen.

Stattdessen eine explizite Zuordnung verwenden, z.B.:

```ts
const categoryAddLabels = {
  'Passive Fähigkeiten': 'Passive Fähigkeit hinzufügen',
  'Techniken': 'Technik hinzufügen',
  'Ultimative Techniken': 'Ultimative Technik hinzufügen',
  'Transformationen': 'Transformation hinzufügen',
  'Talente': 'Talent hinzufügen',
};
```

Die vorhandene Datenstruktur soll dabei unverändert bleiben.

---

# 9. Manuelle Technik-Erstellung

`+ Technik` muss die aktive Auswahl verwenden.

Neue Technik automatisch mit folgenden Informationen anlegen, soweit sie im Modell vorgesehen sind:

- aktive Grundfähigkeit
- zugehörige Kraftquelle
- Element der Grundfähigkeit
- Fähigkeitsart der Grundfähigkeit
- Standardressource der Kraftquelle
- Kategorie `Techniken`

Wichtig:

```text
aktive Grundfähigkeit = Kryokinese
→ neue Technik gehört zu Kryokinese
```

Beim Wechsel auf `Schwertkunst`:

```text
→ neue Technik gehört zu Schwertkunst
```

Keine Zuordnung zur vorherigen Auswahl.

---

# 10. Kombinationstechniken erhalten

Eine Technik darf weiterhin mehreren Grundfähigkeiten zugeordnet werden.

Beispiel:

```text
Grundfähigkeit:
[ Kryokinese ] [ Schwertkunst ]

Technik:
Eisblut-Klinge

Grundfähigkeiten:
Kryokinese + Schwertkunst
```

Die UI darf diese Zuordnung nicht auf genau eine Grundfähigkeit reduzieren.

Beim Anzeigen einer Technik unter einer ausgewählten Grundfähigkeit soll sie erscheinen, wenn diese Grundfähigkeit in `baseAbilityIds` enthalten ist.

---

# 11. Smart Fill vollständig prüfen

Die `TechniqueSmartFillModal` unterstützt bereits:

- Kraftquelle
- Grundfähigkeit
- mehrere Grundfähigkeiten
- Kombinationstechniken
- Modus
- Beschwörungsanzahl
- Kosten pro Beschwörung

Jetzt muss zusätzlich geprüft werden, ob `services/geminiService.ts` diese Felder tatsächlich verarbeitet und zurückgibt.

Nicht ausreichend ist:

```ts
mode: generated.mode || 'Normal'
```

wenn das Backend/Prompt/Schema `mode` gar nicht generiert.

Es muss die gesamte Kette geprüft werden:

```text
UI
 ↓
smartFillTechnique()
 ↓
Gemini Prompt / JSON-Schema
 ↓
Antwort
 ↓
Parsing
 ↓
TechniqueItem
```

Dabei insbesondere prüfen:

```ts
mode
summonCount
summonCostValue
summonCostFormula
baseAbilityIds
baseAbilityNames
powerSourceId
powerSourceName
```

Wenn Felder fehlen, Prompt und Schema ergänzen.

Optionale Felder dürfen optional bleiben.

Smart Fill darf nicht fehlschlagen, nur weil `summonCostFormula` oder ein anderer optionaler Wert fehlt.

---

# 12. Technik-Modus

`TechniqueItem.mode` bleibt erhalten.

Standardwert für ältere oder unvollständige Daten:

```text
Normal
```

Der Modus ist unabhängig von:

- Element
- Fähigkeitsart
- Technik-Typ
- Subtyp

Beispiele:

```text
Normal
Verstärkt
Dauerhaft
Aufgeladen
Schnellzauber
Konter
Bereich
Fernkampf
Nahkampf
Kanalisiert
```

Die Liste soll erweiterbar bleiben.

---

# 13. Beschwörungen

`sum​monCount` bzw. `summonCount` muss erhalten bleiben.

Zusätzlich:

```ts
summonCostValue?: number;
summonCostFormula?: string;
```

Beispiel:

```text
Beschwörungen: 3
Grundkosten: 20 Mana
Kosten pro Beschwörung: 5 Mana
```

Normale Technik-Kosten und Beschwörungskosten nicht vermischen.

Wenn keine Beschwörung vorhanden ist, dürfen die zusätzlichen Felder leer/undefiniert bleiben.

---

# 14. Datenmodell nicht beschädigen

Die vorhandenen Felder von `TechniqueItem`, `BaseAbility` und `CharacterPowerSource` bleiben erhalten.

Insbesondere keine Entfernung von:

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
- `mode`
- `summonCostValue`
- `summonCostFormula`

---

# 15. Legacy-Synchronisierung nicht entfernen

Die vorhandene Kompatibilität muss erhalten bleiben.

Insbesondere:

```ts
normalizeAbilityHierarchy()
syncCharacterAbilityTree()
```

Nicht entfernen.

Nicht durch eine zweite parallele Datenhaltung ersetzen.

Die ältere `CharacterAbility`-Struktur in `CharacterLoreForm.tsx` darf weiterhin funktionieren.

Die neue UI soll die vorhandene neue Hierarchie benutzen und die Legacy-Synchronisierung weiterhin respektieren.

---

# 16. Read-only-Modus

Read-only muss weiterhin funktionieren.

Im Read-only-Modus:

- keine Erstellen-Buttons aktiv
- keine Löschaktionen
- keine editierbaren Felder
- vorhandene Daten trotzdem vollständig anzeigen

Die kompakte Tag-Navigation darf auch im Read-only-Modus verwendet werden.

---

# 17. Keine Datenverluste beim Öffnen/Speichern

Besonders prüfen:

1. bestehender Charakter mit mehreren Kraftquellen öffnen
2. bestehender Charakter mit mehreren Grundfähigkeiten öffnen
3. Technik mit mehreren Grundfähigkeiten öffnen
4. Technik mit Smart-Fill-Daten öffnen
5. Transformationen/Talente/Passive öffnen
6. speichern
7. erneut öffnen

Dabei dürfen keine vorhandenen Felder verschwinden.

---

# 18. Tests / Prüfszenarien

Nach der Implementierung mindestens diese Fälle prüfen:

### Fall A – neue Kraftquelle

```text
+ Kraftquelle
→ Kraftquelle entsteht
→ KEINE automatische Grundfähigkeit
```

### Fall B – neue Grundfähigkeit

```text
Kraftquelle: Teufelskräfte
+ Grundfähigkeit
→ Grundfähigkeit entsteht
→ erscheint als Tag
→ wird aktiv ausgewählt
```

### Fall C – Kategorie wechseln

```text
Kryokinese aktiv
Techniken aktiv
→ Techniken von Kryokinese sichtbar

Talente aktiv
→ nur Talente von Kryokinese sichtbar
```

### Fall D – Grundfähigkeit wechseln

```text
Kryokinese aktiv
Techniken aktiv

→ Schwertkunst anklicken

Kategorie bleibt Techniken
Inhalt wechselt auf Techniken von Schwertkunst
```

### Fall E – Kombinationstechnik

```text
Technik A
Grundfähigkeiten: Kryokinese + Schwertkunst
```

→ erscheint unter beiden passenden Grundfähigkeiten.

### Fall F – Grundfähigkeit löschen

```text
Technik A
Grundfähigkeiten: Kryokinese + Schwertkunst

Kryokinese löschen
```

Ergebnis:

```text
Technik A
Grundfähigkeiten: Schwertkunst
```

`baseAbilityIds` und `baseAbilityNames` müssen übereinstimmen.

### Fall G – Kraftquelle löschen

Eine Kraftquelle löschen, die mehrere Techniken und Kombinationstechniken besitzt.

→ Keine pauschale Löschung aller Techniken.

### Fall H – Smart Fill

Smart Fill erzeugt:

- normale Technik
- Modus
- Beschwörungen
- Beschwörungskosten
- Kombination mit mehreren Grundfähigkeiten

Alle Daten korrekt im `TechniqueItem` speichern.

---

# 19. Wichtig: keine automatische Erfindung von Inhalten

Die UI darf beim Anlegen einer Kraftquelle keine Grundfähigkeiten oder Techniken erfinden.

Die UI soll nur die Struktur bereitstellen.

Beispiel:

```text
Kraftquelle: Haki
```

bedeutet nicht automatisch:

```text
Grundfähigkeit: Haki-Verstärkung
Technik: ...
```

Solche Inhalte entstehen nur durch den Nutzer oder durch ausdrücklich ausgelösten Smart Fill/AI-Erstellungsprozess.

---

# 20. Abschlussziel

Nach der Umsetzung soll die Fähigkeiten-UI kompakt und logisch funktionieren:

```text
KRAFTQUELLE
[ Teufelskräfte ] [ Haki ] [ Magie ] [ + ]

GRUNDFÄHIGKEIT
[ Kryokinese ] [ Schwertkunst ] [ Eiserne Haut ] [ + ]

KATEGORIE
[ Passive Fähigkeiten ] [ Techniken ] [ Ultimative Techniken ] [ Transformationen ] [ Talente ]

────────────────────────────────────

Aktive Grundfähigkeit: Kryokinese
Aktive Kategorie: Techniken

[ Eislanze ]
[ Frostschild ]
[ Eisblut-Klinge ]
[ + Technik ]
```

**Kernregel:**

> Kraftquelle → Grundfähigkeit → Kategorie → Inhalt.
>
> Kraftquellen und Grundfähigkeiten sind Tags. Die fünf Kategorien werden nur einmal dargestellt. Die Auswahl bestimmt ausschließlich, welcher Inhalt angezeigt wird.

Bestehende Daten, Kombinationstechniken, Smart Fill, Legacy-Synchronisierung und Read-only dürfen dabei nicht verloren gehen.
