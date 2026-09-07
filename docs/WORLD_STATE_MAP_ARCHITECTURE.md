# AdventureForge – World State & Map Architecture

**Status:** Foundation specification  
**Version:** 1.0  
**Purpose:** Define the authoritative connection between world map, territories, locations, tactical battle maps and persistent world changes.

---

## 1. Ziel

AdventureForge soll keine voneinander getrennten Systeme besitzen, die jeweils ihre eigene Version der Welt erzeugen.

Die Weltkarte ist die geografische Grundlage. Aus ihr entstehen Territorien, konkrete Orte und mögliche Schauplätze. Eine taktische Schlacht ist eine **Instanz eines konkreten Ortes innerhalb der Welt** und darf nicht unabhängig von dieser Welt erzeugt werden.

Grundregel:

> **Die Welt bestimmt den Kampf. Der Kampf verändert die Welt.**

Die Wirtschaft liest denselben Weltzustand und erzeugt daraus keine parallele Welt.

---

## 2. Autoritative Datenhierarchie

Die grundlegende Hierarchie lautet:

```text
WORLD STATE
│
├── TERRITORIES
│   ├── Geography
│   ├── Terrain / Biome / Climate
│   ├── Population
│   ├── Resources
│   ├── Political Control
│   ├── Military State
│   └── Economy
│
├── LOCATIONS / POIs
│   ├── Cities
│   ├── Villages
│   ├── Buildings
│   ├── Roads
│   ├── Ports
│   ├── Fortifications
│   └── Other relevant places
│
├── FACTIONS
├── CHARACTERS
├── RELATIONSHIPS
├── RESOURCES
├── TRADE ROUTES
└── WORLD TIME
```

Territorien und politische Kontrolle müssen getrennt bleiben.

Beispiel:

```text
Territory: Stadtgebiet
parentId = Königreich A
controlledByFactionId = Fraktion B
ownerFactionId = Fraktion A
```

`parentId` beschreibt die geografische/hierarchische Zugehörigkeit. `controlledByFactionId` beschreibt die aktuelle tatsächliche Kontrolle.

---

## 3. Territory ist keine Battlemap

Ein `Territory` darf nicht direkt als taktisches Spielfeld behandelt werden.

Ein Territory beschreibt einen geografischen Raum und kann enthalten:

- Grenzen
- Polygon-/Kreis-/Rechteck-Geometrie
- Gelände
- Biome
- Klima
- Bevölkerung
- Ressourcen
- Siedlungen
- POIs
- Fraktionen
- militärische Stärke
- Wirtschaft
- Nachbarn
- Entfernungen
- Reiseinformationen
- `tileData`

Eine Battlemap ist dagegen eine konkrete, begrenzte Darstellung eines tatsächlichen Schauplatzes.

Beispiel:

```text
Territory: Herzogtum Nordmark
    ↓
Location: Dorf Falkenheim
    ↓
Battle Location: Dorfplatz vor dem Gasthaus
    ↓
Tactical Grid: 30 × 20
```

---

## 4. Location / POI als verbindende Ebene

Zwischen Territory und Tactical Combat muss eine konkrete Location existieren oder eindeutig aus vorhandenen Daten ableitbar sein.

Eine Location benötigt mindestens eine stabile ID.

Empfohlene Mindestinformationen:

```ts
interface WorldLocationReference {
  id: string;
  territoryId: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  description?: string;
  terrainType?: string;
  parentLocationId?: string;
  loreEntryId?: string;
}
```

Wichtig:

**Namen dürfen keine Primärschlüssel ersetzen.**

`name = "Falkenheim"` ist nicht ausreichend. Es muss eine stabile ID geben.

---

## 5. Battle Instance

Ein Kampf benötigt eine eigene Instanz, die auf die Welt verweist.

Empfohlene Struktur:

```ts
interface BattleInstance {
  id: string;
  worldStateId?: string;
  territoryId: string;
  locationId?: string;
  battleMapId?: string;
  startedAtWorldTime?: WorldTime;
  status: 'active' | 'completed' | 'retreated' | 'aborted';

  participatingFactionIds: string[];
  participatingCharacterIds: string[];
  tacticalGroupIds: string[];

  terrainSnapshot?: unknown;
  objectSnapshot?: unknown;

  result?: {
    winnerFactionId?: string;
    casualties?: unknown;
    destroyedObjects?: string[];
    damagedObjects?: string[];
    territoryChanges?: unknown;
  };
}
```

Die Battle Instance ist die Verbindung zwischen Welt und Combat.

---

## 6. Battlemap-Erzeugung

Eine Tactical Map darf nicht nur aufgrund eines Textes oder einer zufälligen Kategorie erzeugt werden.

Der bevorzugte Ablauf ist:

```text
territoryId
   ↓
locationId
   ↓
location type
   ↓
location terrain
   ↓
existing tile/object data
   ↓
battle map generation
   ↓
Tactical Combat Map
```

Beispiel:

```text
Location type = Hafen
Terrain = Küste
Existing objects = Kai, Lagerhaus, Schiffe

→ Battlemap enthält Küstenkante, Wasser, Kai, Lagerhäuser und Schiffe.
```

Die taktische Karte darf zusätzliche taktische Details erzeugen, aber sie darf die grundlegende Geografie des Ortes nicht widersprechen.

---

## 7. Terrain muss aus der Welt stammen

Terrain-Typen dürfen nicht ausschließlich aus heuristischen Textprüfungen entstehen.

Problematisch ist beispielsweise:

```ts
if (locationName.includes('Hafen')) {
  // Hafen erzeugen
}
```

Das kann als Fallback existieren, aber nicht als autoritative Quelle.

Besser:

```text
Location.terrainType
Location.type
Location.tileData
Location.placedObjects
Territory.biome
Territory.geography
```

werden priorisiert.

Text-/Namensheuristiken sind nur Fallbacks für unvollständige Alt-Daten.

---

## 8. Tactical Grid

Das Tactical Grid ist eine lokale Darstellung eines konkreten Schauplatzes.

Es muss mindestens besitzen:

- width
- height
- blocked cells / obstacles
- terrain information
- placed objects
- tactical entities/groups
- eindeutige Battle Instance ID

Das bestehende Formation-System mit `occupiedCells`, `blockedCells`, Grid-Grenzen und Formation-Degradation soll weiterverwendet werden.

Es darf nicht durch eine zweite parallele Positionslogik ersetzt werden.

---

## 9. Tactical Groups und Weltfraktionen

Taktische Gruppen müssen auf ihre Weltquelle zurückverweisen können.

Beispiel:

```text
TacticalGroup
    ↓
factionId
    ↓
Faction
    ↓
World State
```

Für aus der Welt stammende Einheiten sollte zusätzlich nachvollziehbar sein:

```text
sourceType
sourceId
```

Beispiele:

```text
sourceType = 'character'
sourceId = character-123
```

oder

```text
sourceType = 'faction'
sourceId = faction-bandits
```

oder

```text
sourceType = 'territory'
sourceId = territory-forest-01
```

Damit kann AdventureForge später erklären, **warum diese Einheit überhaupt an diesem Ort ist.**

---

## 10. Keine zufällige Welt-Erzeugung innerhalb des Combat Systems

Das Combat-System darf fehlende Informationen ergänzen, aber nicht eigenständig kanonische Weltinformationen erfinden.

Nicht erlaubt als dauerhafte Weltquelle:

```text
Combat → zufällige Fraktion
Combat → zufälliges Terrain
Combat → zufälliger Ort
Combat → zufällige politische Kontrolle
```

Erlaubt:

```text
World → Combat
Combat → temporäre taktische Ableitung
```

und nach dem Kampf:

```text
Combat Result → World State Update
```

---

## 11. Snapshot-Prinzip für Kämpfe

Wenn ein Kampf beginnt, wird der für diesen Kampf relevante Zustand eingefroren bzw. als Snapshot gespeichert.

Beispiel:

```text
World State
   ↓
Battle Start
   ↓
Battle Snapshot
   ├── Terrain
   ├── Objects
   ├── Factions
   ├── Units
   ├── Positions
   └── relevant world conditions
```

Während des Kampfes darf das Combat-System seinen lokalen Zustand verändern.

Die globale Welt wird nicht bei jeder einzelnen UI-Bewegung verändert.

Erst das Ergebnis des Kampfes wird zurückgeschrieben.

---

## 12. Combat → World Update

Nach Abschluss eines Kampfes muss ein definierter Ergebnisprozess laufen.

Beispiel:

```text
Battle completed
      ↓
Determine result
      ↓
Apply casualties
      ↓
Apply character state changes
      ↓
Apply object/building damage
      ↓
Apply territory/control changes
      ↓
Apply military changes
      ↓
Apply economy consequences
      ↓
Write event/history
```

Nicht jeder Kampf muss automatisch die politische Kontrolle eines Territoriums verändern.

Die Auswirkungen hängen von der Art des Kampfes ab.

Beispiele:

- Überfall → lokale Schäden
- Straßenkampf → lokale Kontrolle
- Belagerung → Festungsschäden
- Eroberung → mögliche politische Kontrolle
- Monsterangriff → Bevölkerung/Ökonomie/Militär betroffen
- Duell → primär Charakterzustände

---

## 13. Wirtschaft darf keine parallele Welt besitzen

Die Wirtschaft soll Informationen aus dem World State lesen.

Primäre Quellen:

```text
Territory
Location
Resources
Population
Faction Control
Trade Routes
Buildings / Holdings
Military Security
World Time
```

Ein `EconomyHolding` darf eine verwaltbare wirtschaftliche Sicht auf einen real existierenden Ort darstellen.

Es darf nicht dazu führen, dass zusätzlich ein zweiter Ort mit eigener unabhängiger Identität entsteht.

Empfohlene Verknüpfungen:

```text
EconomyHolding
 ├── territoryId
 ├── locationId / loreEntryId
 ├── ownerFactionId
 ├── controlledByFactionId
 └── ownerCharacterId
```

Die bereits vorhandenen Verknüpfungen wie `territoryId`, `loreEntryId`, `ownerFactionId` und `controlledByFactionId` sollen erhalten und vereinheitlicht werden.

---

## 14. Codex / Lore

Der Codex ist Wissens-/Worldbuilding-Ebene, nicht die einzige Runtime-Datenbank.

Grundregel:

```text
World State = aktueller Zustand
Codex/Lore = kanonische Informationen / Wissen / Beschreibung
```

Eine Änderung im Spiel kann den World State ändern.

Der Codex kann daraus aktualisiert werden, darf aber nicht automatisch jede UI-Ansicht als neue Weltinstanz erzeugen.

---

## 15. IDs statt Namen

Alle wichtigen Verbindungen müssen über stabile IDs erfolgen.

Nicht ausreichend:

```ts
currentLocation = 'Taverne'
```

Bevorzugt:

```ts
currentLocationId = 'location-tavern-001'
```

Der Name ist Anzeigeinformation.

Dasselbe gilt für:

- Territory
- Location
- Faction
- Character
- Holding
- Battle
- Tactical Group
- Combat Object
- Trade Route

---

## 16. Datenfluss

Der verbindliche Hauptfluss lautet:

```text
WORLD STATE
    │
    ├── Territory
    │      │
    │      ├── Geography
    │      ├── Terrain
    │      ├── Resources
    │      ├── Population
    │      └── Political State
    │
    └── Location
           │
           ├── Terrain
           ├── Objects
           └── Local State
                  │
                  ↓
             BATTLE INSTANCE
                  │
                  ├── Battle Map
                  ├── Tactical Groups
                  ├── Tactical Entities
                  └── Combat Objects
                         │
                         ↓
                       COMBAT
                         │
                         ↓
                  COMBAT RESULT
                         │
                         ↓
                   WORLD UPDATE
```

Parallel dazu:

```text
WORLD STATE
     ↓
   ECONOMY
     ↓
 economic consequences
     ↓
WORLD STATE UPDATE
```

---

## 17. Bestehenden Code nicht unnötig ersetzen

Die vorhandenen Systeme sollen weiterverwendet werden.

Insbesondere:

- `Territory`
- `tileData`
- `CombatState`
- `TacticalGroup`
- `TacticalEntity`
- `PlacedCombatObject`
- Tactical Formation Engine
- `EconomyHolding`
- bestehende Lore/Codex-Verknüpfungen

Die Aufgabe ist primär **Integration und Vereinheitlichung**, nicht ein kompletter Rewrite.

---

## 18. Technische Priorität

### Phase 1 – World State Foundation

1. vorhandene World-/Territory-Daten identifizieren
2. stabile IDs überprüfen
3. Location/POI-Verknüpfungen vereinheitlichen
4. `currentLocation` auf ID-basierte Referenzen umstellen, wo möglich
5. Territory → Location eindeutig machen

### Phase 2 – Battle Location

1. Battle Instance einführen
2. Territory + Location Referenzen speichern
3. Terrainquelle definieren
4. Objektquelle definieren
5. Tactical Grid aus Battle Location ableiten

### Phase 3 – Combat Integration

1. Tactical Groups mit World/Faction/Character Sources verbinden
2. Battle Snapshot speichern
3. Combat Result definieren
4. World Update Pipeline implementieren

### Phase 4 – Economy Integration

1. Holdings an echte Locations/Territories binden
2. Ressourcen aus World State verwenden
3. Kontrolle/Ownership aus World State verwenden
4. Sicherheits-/Militärzustand berücksichtigen
5. Kampfresultate als wirtschaftliche Ereignisse verarbeiten

---

## 19. Was NICHT gemacht werden soll

Bis diese Foundation steht, keine großen neuen Systeme für:

- komplexere Kampfformeln
- große Wirtschaftssimulation
- neue Formationsarten
- neue zufällige Battlemap-Generatoren
- zusätzliche parallele Ortsdatenbanken
- weitere Mock-/Demo-Daten

Neue Features dürfen die Foundation nutzen, aber nicht umgehen.

---

## 20. Abnahmekriterien

Die Foundation gilt als stabil, wenn folgende Szenarien funktionieren:

### Szenario A – normaler Kampf

```text
World Territory
→ konkreter Ort
→ Battle Instance
→ Tactical Map
→ Kampf
→ Ergebnis
→ Welt aktualisiert
```

### Szenario B – Gebäude wird beschädigt

```text
Gebäude in Location
→ Tactical Object
→ im Kampf beschädigt
→ World Location aktualisiert
→ Economy Holding erhält Zustand
```

### Szenario C – Fraktion gewinnt Gebiet

```text
Faction A controls Territory
→ Battle
→ Faction B gewinnt
→ World State kontrolliert Territory durch B
→ Economy und NPC/Faction-System sehen B als aktuelle Kontrolle
```

### Szenario D – Monsterangriff

```text
Monsterquelle
→ Territory/Location
→ Battle
→ Verluste/Schäden
→ Bevölkerung/Wirtschaft/Militär aktualisiert
```

### Szenario E – Kampf an bestehendem Ort

```text
Location besitzt Terrain + Objekte
→ Battlemap übernimmt diese Daten
→ keine widersprüchliche zufällige Umgebung
```

---

## 21. Grundsatz für zukünftige KI-Entwicklung

Gemini/AI Studio darf bei Änderungen an World Map, Tactical Combat oder Economy niemals nur die einzelne UI betrachten.

Vor jeder Änderung muss geprüft werden:

```text
Welche World-State-Daten sind die Quelle?
Welche IDs verbinden die Systeme?
Welche Systeme lesen diese Daten?
Welche Systeme schreiben diese Daten?
Welche Folgen hat die Änderung für World Map, Combat, Economy, Codex und NPCs?
```

Eine scheinbar lokale Änderung ist abzulehnen, wenn sie eine zweite widersprüchliche Wahrheit erzeugt.

---

# Endzustand

AdventureForge soll langfristig folgendes Modell besitzen:

```text
                    ┌─────────────┐
                    │  WORLD STATE │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
      WORLD MAP         CODEX           FACTIONS
          │                │                │
          ↓                │                ↓
      TERRITORY ─────── LOCATION ───── CHARACTERS
          │                │
          │                ↓
          │          BATTLE INSTANCE
          │                │
          │                ↓
          │          TACTICAL MAP
          │                │
          │                ↓
          │             COMBAT
          │                │
          │                ↓
          └──────── WORLD UPDATE ──────────┘
                           │
                           ↓
                       ECONOMY
```

**Eine Welt. Eine Datenbasis. Mehrere Darstellungen.**

Das ist die technische Grundlage, auf der anschließend Kampf, Wirtschaft, NPC-Verhalten und Worldbuilding zuverlässig aufbauen können.
