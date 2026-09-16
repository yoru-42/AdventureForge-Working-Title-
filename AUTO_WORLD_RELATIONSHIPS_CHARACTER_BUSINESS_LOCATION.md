# AdventureForge – Automatische Weltverknüpfung: Charaktere, Berufe, Betriebe und Orte

## Ziel

Das Wirtschafts-, Charakter-, Orts- und Codex-System soll stärker miteinander verbunden werden.

Wenn ein Charakter erstellt wird, sollen relevante Informationen nicht nur als isolierte Werte gespeichert werden.

Beispiel:

```text
Charakter:
    Name: Roderik
    Beruf: Schmied
    Wohnort: Dorf Falkengrund
```

Das System soll daraus im Hintergrund erkennen:

```text
Dorf Falkengrund
    │
    └── Schmiede
         │
         └── Besitzer / Schmied:
              Roderik
```

Der Charakter bekommt dadurch einen realen wirtschaftlichen und räumlichen Zusammenhang.

---

# 1. Grundprinzip

Die Welt soll aus den vorhandenen Informationen logisch miteinander verbunden werden.

```text
CHARAKTER
    │
    ├── Beruf
    │
    ├── Wohnort
    │
    ├── Arbeitsplatz
    │
    └── Besitz / Rolle
          │
          ▼
       BETRIEB
          │
          ▼
       GEBÄUDE
          │
          ▼
        ORT
          │
          ▼
       GEBIET
```

Dabei darf das System keine unnötigen Duplikate erzeugen.

---

# 2. Beispiel: Charakter wird als Schmied erstellt

Der Benutzer erstellt:

```text
Name:
Roderik

Alter:
42

Beruf:
Schmied

Wohnort:
Dorf Falkengrund
```

Das System erkennt:

```text
Beruf = Schmied
Wohnort = Dorf Falkengrund
```

und prüft:

```text
Gibt es bereits eine passende Schmiede in Falkengrund?
```

### Wenn NEIN

Automatisch eine neue wirtschaftliche Einheit erzeugen:

```text
Schmiede
Standort:
    Dorf Falkengrund

Betreiber:
    Roderik

Beruf:
    Schmied
```

Optional zusätzlich:

```text
Schmiedegebäude
```

wenn das Gebäudemodell dafür vorgesehen ist.

---

# 3. Wenn bereits eine Schmiede existiert

Beispiel:

```text
Dorf Falkengrund
    Schmiede "Eisenfaust"
```

Charakter:

```text
Roderik
Beruf:
    Schmied

Wohnort:
    Dorf Falkengrund
```

Dann darf NICHT automatisch eine zweite Schmiede erzeugt werden.

Stattdessen:

```text
Roderik
    ↓
arbeitet in
    ↓
Schmiede "Eisenfaust"
```

Falls die Schmiede bereits einen Besitzer hat:

```text
Schmiede "Eisenfaust"
    Besitzer:
        Meister Alrik
```

darf Roderik nicht automatisch zum Besitzer gemacht werden.

Stattdessen kann er beispielsweise sein:

```text
Angestellter
Geselle
Schmied
Mitarbeiter
```

Die genaue Rolle ergibt sich aus den Charakterdaten.

---

# 4. Beruf darf nicht automatisch Besitz bedeuten

Sehr wichtig:

```text
Beruf = Schmied
```

bedeutet nicht automatisch:

```text
Besitzer einer Schmiede
```

Mögliche Situationen:

```text
Charakter:
Schmied

Situation:
arbeitet in der Schmiede eines anderen
```

oder:

```text
Charakter:
Schmied

Situation:
besitzt eigene Schmiede
```

oder:

```text
Charakter:
Schmied

Situation:
arbeitet als reisender Schmied
```

oder:

```text
Charakter:
Schmied

Situation:
arbeitet in einer Burgschmiede
```

Das System soll anhand vorhandener Informationen unterscheiden.

---

# 5. Neue Charakter-zu-Wirtschafts-Verknüpfung

Charakterdaten sollen eine optionale Referenz erhalten können:

```ts
workplaceId?: string;
```

Optional:

```ts
workplaceType?: 'economy' | 'administration' | 'military' | 'other';
```

und:

```ts
residenceId?: string;
```

Dabei gilt:

```text
residenceId
    = Wohnort

workplaceId
    = tatsächlicher Arbeitsplatz
```

Diese beiden Dinge dürfen nicht verwechselt werden.

---

# 6. Automatische Arbeitsplatzermittlung

Beim Erstellen oder Ändern eines Charakters:

```text
Charakter speichern
        ↓
Beruf prüfen
        ↓
Wohnort prüfen
        ↓
vorhandene passende Wirtschaftseinheit suchen
        ↓
wenn vorhanden:
    Charakter verknüpfen
        ↓
wenn nicht vorhanden:
    prüfen, ob Betrieb logisch erzeugt werden darf
        ↓
    falls ja:
        Betrieb erzeugen
        ↓
    Charakter verknüpfen
```

---

# 7. Priorität der Suche

Bei der Suche nach einem Arbeitsplatz:

```text
1. explizit angegebener Arbeitsplatz
2. bereits verknüpfter Arbeitsplatz
3. passender Betrieb am Wohnort
4. passender Betrieb im direkten Umfeld
5. Betrieb neu erzeugen
6. keine automatische Erzeugung, wenn Kontext dagegen spricht
```

Beispiel:

```text
Roderik
Beruf: Schmied
Wohnort: Falkengrund
Arbeitsplatz: Schmiede Eisenfaust
```

→ explizite Angabe gewinnt.

---

# 8. Beruf → möglicher Betrieb

Eine zentrale Zuordnung erstellen.

Beispiel:

```text
Schmied
    → Schmiede

Bäcker
    → Bäckerei

Koch
    → Küche / Gasthaus / Restaurant

Wirt
    → Gasthaus / Taverne

Fischer
    → Fischerei / Fischerbetrieb

Landwirt
    → Bauernhof

Jäger
    → Jagdbetrieb / Jagdrevier
```

Aber:

> Diese Zuordnung ist eine **logische Möglichkeit**, keine starre Zwangsregel.

Ein Koch kann beispielsweise in:

```text
Gasthaus
Burgküche
Adelshaus
Schiff
Militärlager
Privathaushalt
```

arbeiten.

---

# 9. Berufe mit mehreren möglichen Arbeitsorten

Nicht jeder Beruf besitzt einen eigenen Betrieb.

Beispiele:

```text
Soldat
    → Kaserne / Garnison / Burg / Armee

Wache
    → Wachstation / Stadtwache / Burg

Koch
    → Gasthaus / Burg / Haushalt / Schiff

Händler
    → Laden / Marktstand / Handelskontor / reisend

Schreiber
    → Verwaltung / Gilde / Haushalt / Betrieb

Priester
    → Tempel / Schrein / Kirche

Magier
    → Akademie / Gilde / Hof / unabhängig
```

Daher muss das System eine **Berufs-/Arbeitsplatzlogik** besitzen und nicht nur `Beruf -> Betrieb`.

---

# 10. Automatische Erstellung nur bei ausreichendem Kontext

Ein neuer Betrieb darf automatisch erzeugt werden, wenn genügend Informationen vorhanden sind.

Beispiel:

```text
Beruf:
Schmied

Wohnort:
Dorf Falkengrund

Besitz:
eigene Schmiede
```

→ Betrieb erzeugen.

Aber:

```text
Beruf:
Schmied

Wohnort:
Dorf Falkengrund
```

→ zunächst prüfen:

```text
Existiert Schmiede?
Gibt es einen Arbeitsplatz?
Ist der Charakter selbstständig?
Ist ein Arbeitgeber angegeben?
```

Wenn keine eindeutige Information existiert, kann das System einen plausiblen Hintergrunddatensatz erzeugen, dieser muss aber als **automatisch abgeleitet** gekennzeichnet werden.

---

# 11. Automatisch erzeugte Daten kennzeichnen

Automatisch erzeugte Objekte müssen intern nachvollziehbar bleiben.

Beispiel:

```ts
source: 'auto-derived';
```

oder ein gleichwertiges vorhandenes System verwenden.

Zusätzlich:

```ts
derivedFromCharacterId?: string;
derivedFromProfession?: string;
```

Beispiel:

```text
Schmiede Eisenfaust

Quelle:
    automatisch aus Charakter Roderik

Grund:
    Beruf = Schmied
    Wohnort = Dorf Falkengrund
```

Dadurch kann das System später nachvollziehen, warum der Betrieb existiert.

---

# 12. Keine Duplikate

Vor jeder automatischen Erstellung suchen:

```text
gleicher Ort
+
gleicher wirtschaftlicher Typ
+
passender Name / Zweck
+
bestehende Verknüpfung
```

Beispiel:

```text
Dorf Falkengrund
    Schmiede
```

existiert bereits.

Dann:

```text
KEINE neue Schmiede erstellen.
```

Stattdessen vorhandene Schmiede verwenden.

---

# 13. Namen automatisch sinnvoll erzeugen

Wenn ein neuer Betrieb benötigt wird, soll nicht immer einfach:

```text
Schmiede
```

erzeugt werden.

Mögliche automatische Namen:

```text
Schmiede Eisenfaust
Schmiede Falkenhammer
Zum alten Amboss
Werkstatt Roderik
Roderiks Schmiede
```

Der Name soll zum vorhandenen Setting passen.

Dabei gelten die bestehenden Regeln für Namensgebung:

* nicht immer deutsche Namen
* passende japanische Namen möglich
* Fantasy-Namen möglich
* elfische Namen möglich
* zwergische Namen möglich
* regionale Namen möglich
* keine zufällige Überdramatisierung
* Namen können eine kleine verborgene Bedeutung oder lokale Geschichte besitzen
* wichtige Orte dürfen stärker ausgearbeitet werden
* gewöhnliche Orte dürfen schlicht bleiben

---

# 14. Automatische Verbindung zum Wohnort

Wenn der Charakter:

```text
Wohnort:
Dorf Falkengrund
```

besitzt, muss der Betrieb möglichst dort verknüpft werden.

Beispiel:

```text
Charakter
    Roderik
    ↓
Wohnort
    Dorf Falkengrund
    ↓
Arbeitsplatz
    Schmiede Eisenfaust
```

Nicht:

```text
Roderik
    Wohnort Falkengrund

Schmiede
    Standort unbekannt
```

wenn der Kontext eindeutig eine lokale Tätigkeit nahelegt.

---

# 15. Wohnort und Arbeitsplatz dürfen trotzdem unterschiedlich sein

Das System darf nicht davon ausgehen:

```text
Wohnort = Arbeitsplatz
```

Beispiel:

```text
Roderik

Wohnort:
Dorf Falkengrund

Arbeitsplatz:
Schmiede in Stadt Falkenheim
```

Das ist vollkommen gültig.

Deshalb müssen Wohnort und Arbeitsplatz separat gespeichert werden.

---

# 16. Wenn ein Dorf neu erstellt wird

Das ist der zweite große Teil dieses Systems.

Wenn der Benutzer:

```text
Dorf Falkengrund
```

erstellt, soll das System prüfen, welche Informationen für einen vollständigen Ort bereits im Codex-/Weltmodell definiert sind.

---

# 17. Codex als Quelle für Ortsstruktur

Wenn im Codex für einen Ort bereits Angaben vorhanden sind wie:

```text
Dorf Falkengrund

Bevölkerung:
120

Herrschaft:
Dorfältester

Wirtschaft:
Landwirtschaft
Handwerk
kleiner Handel

Besondere Einrichtungen:
Gasthaus
Schmiede
Tempel
```

soll daraus automatisch eine passende Struktur erzeugt werden können.

Beispiel:

```text
Dorf Falkengrund
│
├── Verwaltung
│   └── Dorfältester
│
├── Gebäude
│   ├── Rathaus
│   └── Tempel
│
├── Betriebe
│   ├── Gasthaus
│   └── Schmiede
│
├── Produktion
│   └── Bauernhöfe
│
└── Handel
    └── Markt
```

---

# 18. Wichtig: Codex nicht blind vollständig auslesen

Das System darf nicht aus jedem beliebigen Satz automatisch zehn Objekte erzeugen.

Es muss zwischen:

```text
explizit vorhanden
```

und:

```text
nur erzählerisch erwähnt
```

unterscheiden.

Beispiel:

```text
„Im Dorf gibt es einige Bauernhöfe.“
```

→ nicht automatisch fünf Bauernhöfe erfinden.

Besser:

```text
Landwirtschaft vorhanden
```

und optional eine aggregierte Wirtschaftsinformation.

Wenn ausdrücklich steht:

```text
„Der Hof von Familie Müller liegt am nördlichen Dorfrand.“
```

→ konkreten Hof anlegen/verknüpfen.

---

# 19. Orts-Erstellungsassistent

Beim Erstellen eines neuen Ortes:

```text
Neuer Ort
    ↓
Ortstyp wählen
    ↓
Name
    ↓
Basisdaten
    ↓
Codex-/Story-Info prüfen
    ↓
vorhandene Informationen erkennen
    ↓
Weltstruktur vorbereiten
```

Danach:

```text
Erkannte Struktur:

Verwaltung:
    Dorfältester

Betriebe:
    Schmiede
    Gasthaus

Produktion:
    Landwirtschaft

Religion:
    kleiner Schrein

Handel:
    Wochenmarkt
```

---

# 20. Nicht alles muss sofort sichtbar werden

Die automatisch erzeugten Details können im Hintergrund gespeichert werden.

Beispiel:

```text
Story-Info
    Dorf Falkengrund
        erkannte Wirtschaft
        erkannte Gebäude
        erkannte NPCs
        erkannte Beziehungen
        erkannte Arbeitsplätze
```

Die sichtbare UI muss nicht sofort mit 30 Einträgen überladen werden.

---

# 21. Story-Info bleibt Zwischenstufe

Die bereits festgelegte Story-Info-Logik muss erhalten bleiben.

Automatisch erzeugte Informationen:

```text
Charakter erstellt
    ↓
automatische Ableitung
    ↓
Story-Info
```

Erst wenn die Daten bestätigt/übernommen werden:

```text
Story-Info
    ↓
Codex
```

Dadurch verhindert das System, dass eine automatische Annahme dauerhaft die ursprünglichen Codexdaten überschreibt.

---

# 22. Ausnahme: technische Verknüpfungen

Technische Beziehungen dürfen sofort intern erstellt werden, wenn sie eindeutig sind.

Beispiel:

```text
Charakter Roderik
workplaceId = holding-eisenfaust
```

Das bedeutet nicht automatisch, dass ein großer neuer Lore-Eintrag veröffentlicht werden muss.

Unterscheiden:

```text
technische Beziehung
```

von:

```text
neuer erzählerischer Inhalt
```

---

# 23. Wenn ein Dorf komplett neu erstellt wird

Wenn der Benutzer nur:

```text
Name:
Dorf Falkengrund

Typ:
Dorf
```

eingibt, soll das System optional eine **Grundstruktur** erzeugen können.

Zum Beispiel:

```text
Dorf Falkengrund

Verwaltung:
    Dorfältester

Versorgung:
    Brunnen

Wirtschaft:
    Landwirtschaft
    kleines Handwerk
    lokaler Handel

Mögliche Einrichtungen:
    Gasthaus
    Schmiede
    kleiner Markt
```

Aber:

> Diese generierten Einrichtungen müssen als Vorschläge/abgeleitete Story-Info behandelt werden, sofern der Benutzer sie nicht explizit bestätigt hat.

---

# 24. Setting berücksichtigen

Die automatische Ortsstruktur muss vom Setting abhängen.

Beispiele:

## Mittelalterliches Dorf

```text
Schmiede
Bäckerei
Gasthaus
Bauernhöfe
Mühle
Schrein
```

## Hafenort

```text
Fischerei
Werft
Hafenmeister
Lagerhäuser
Taverne
Händler
```

## Zwergische Siedlung

```text
Schmiede
Mine
Metallverarbeitung
Werkhallen
Handelskontor
Clanverwaltung
```

## Elfen-Siedlung

```text
Heilkundiger
Handwerk
Forstwirtschaft
Schrein
Markt
```

Nicht jede Siedlung bekommt automatisch dieselbe Standardliste.

---

# 25. Bevölkerung berücksichtigen

Die Größe des Ortes beeinflusst die mögliche Infrastruktur.

Beispiel:

```text
20 Einwohner
```

nicht automatisch:

```text
5 Tavernen
3 Schmieden
2 Händler
1 Akademie
```

Beispiel:

```text
120 Einwohner
```

kann eher besitzen:

```text
1 Gasthaus
1 Schmiede
1 Bäcker
mehrere Bauernhöfe
kleinen Markt
```

Das System soll dabei nur plausible Größenordnungen ableiten.

---

# 26. Charaktere als Ankerpunkte verwenden

Charaktere können vorhandene Lücken in einem Ort konkretisieren.

Beispiel:

Ort:

```text
Dorf Falkengrund
```

Charakter:

```text
Karin
Beruf:
Wirtin

Wohnort:
Falkengrund
```

Wenn noch kein Gasthaus existiert:

```text
Gasthaus erzeugen
    ↓
Karin als Wirtin verknüpfen
    ↓
Gasthaus in Falkengrund
```

Später:

```text
Charakter:
Mara
Beruf:
Köchin

Wohnort:
Falkengrund
```

System:

```text
passendes Gasthaus vorhanden
    ↓
Mara arbeitet dort
```

nicht:

```text
zweites Gasthaus erzeugen
```

---

# 27. Mehrere Charaktere können denselben Betrieb nutzen

Beispiel:

```text
Gasthaus "Zum Falken"

Besitzer:
Karin

Personal:
Mara – Köchin
Lena – Schankmagd
Tobias – Bote / Helfer
```

Alle Charaktere erhalten:

```text
workplaceId = Gasthaus-ID
```

Der Betrieb erhält entsprechende Personalreferenzen.

Damit entsteht automatisch eine echte Beziehung:

```text
Gasthaus
    ├── Besitzer → Karin
    ├── Köchin → Mara
    ├── Schankmagd → Lena
    └── Helfer → Tobias
```

---

# 28. Beziehungen bidirektional speichern

Wenn möglich:

```text
Charakter:
workplaceId

Betrieb:
employeeIds[]
```

Beide Seiten müssen aber konsistent gehalten werden.

Wenn:

```text
Roderik.workplaceId
```

geändert wird, muss die alte Personalzuordnung entfernt und die neue ergänzt werden.

Keine veralteten Doppelreferenzen zurücklassen.

---

# 29. Betrieb löschen

Wenn ein Betrieb gelöscht wird:

```text
Betrieb löschen
```

dürfen die Charaktere nicht gelöscht werden.

Stattdessen:

```text
workplaceId = null
```

und ggf.:

```text
Arbeitsplatz unbekannt
```

oder eine entsprechende vorhandene Statuslogik.

---

# 30. Charakter löschen

Wenn ein Charakter gelöscht wird:

```text
Charakter löschen
```

darf die Schmiede nicht automatisch gelöscht werden.

Denn:

```text
Charakter
    = Betreiber / Mitarbeiter

Betrieb
    = eigenständige Weltentität
```

Nur wenn der Betrieb ausschließlich als automatisch abgeleitete Entität dieses Charakters existierte und keine anderen Beziehungen besitzt, darf eine spätere Bereinigung möglich sein.

Auch hier keine sofortige destruktive Löschung.

---

# 31. Wenn der Charakter den Beruf wechselt

Beispiel:

```text
Roderik
Beruf:
Schmied
```

→ Schmiede verbunden.

Später:

```text
Roderik
Beruf:
Händler
```

Dann darf die Schmiede nicht automatisch gelöscht werden.

Mögliche Situation:

```text
Schmiede
    Besitzer:
        Roderik

Roderik
    neuer Beruf:
        Händler
```

Das System muss erkennen:

```text
Betrieb bleibt bestehen.
Besitz-/Arbeitsverhältnis muss neu bewertet werden.
```

Mögliche Ergebnisse:

```text
Schmiede verkauft
Schmiede verpachtet
Schmiede an Nachfolger übergeben
Schmiede weiterhin im Besitz
Charakter arbeitet nicht mehr dort
```

Keine automatische Vernichtung von Weltgeschichte.

---

# 32. Ortswechsel

Wenn:

```text
Roderik
Wohnort:
Falkengrund
```

zu:

```text
Wohnort:
Falkenheim
```

geändert wird, darf die Schmiede in Falkengrund nicht automatisch verschwinden.

Stattdessen:

```text
Roderik
    vorher:
        wohnhaft Falkengrund

    nachher:
        wohnhaft Falkenheim
```

Arbeitsplatz separat prüfen.

---

# 33. Automatische Weltkonsistenzprüfung

Ein Hintergrundsystem soll regelmäßig prüfen:

```text
Charaktere
Betriebe
Gebäude
Orte
Codex
Story-Info
```

auf Inkonsistenzen.

Beispiele:

```text
Charakter verweist auf nicht existierenden Betrieb
Betrieb verweist auf nicht existierenden Ort
Betrieb besitzt Mitarbeiter-ID, Charakter existiert aber nicht
Ort enthält Betrieb, Betrieb kennt Ort nicht
```

Diese Probleme repariere oder als Warnung markieren.

---

# 34. Keine Endlosschleifen

Besonders wichtig bei automatischen Verknüpfungen:

```text
Charakter erzeugt Betrieb
    ↓
Betrieb erzeugt Charakter
    ↓
Charakter erzeugt Betrieb
    ↓
...
```

Das muss verhindert werden.

Jede automatische Erstellung muss einen Ursprung besitzen:

```ts
sourceType
sourceId
```

und vor Erstellung prüfen:

```text
existiert bereits eine passende Entität?
```

---

# 35. Event-/Trigger-System

Wenn bereits ein Event-/Sync-System vorhanden ist, dieses verwenden.

Beispiel:

```text
CHARACTER_CREATED
CHARACTER_UPDATED
CHARACTER_PROFESSION_CHANGED
CHARACTER_RESIDENCE_CHANGED

TERRITORY_CREATED
TERRITORY_UPDATED

ECONOMY_HOLDING_CREATED
ECONOMY_HOLDING_UPDATED
```

Darauf kann ein zentraler Resolver reagieren.

Nicht an zehn verschiedenen UI-Stellen dieselbe Logik duplizieren.

---

# 36. Zentraler World Relationship Resolver

Wenn sinnvoll, eine zentrale Funktion einführen:

```ts
resolveWorldRelationships(...)
```

Aufgabe:

```text
Charakter
    ↔ Beruf
    ↔ Arbeitsplatz
    ↔ Betrieb
    ↔ Gebäude
    ↔ Wohnort
    ↔ Territory
```

und:

```text
Territory
    ↔ Gebäude
    ↔ Betriebe
    ↔ Verwaltung
    ↔ Bevölkerung
```

Damit liegen die Regeln an einer zentralen Stelle.

---

# 37. Beispiel: komplette automatische Kette

Benutzer erstellt:

```text
Dorf Falkengrund
```

System:

```text
Territory erzeugen
        ↓
Codex/Story-Info prüfen
        ↓
erkannte Dorfstruktur vorbereiten
```

Danach erstellt Benutzer:

```text
Roderik
Beruf:
Schmied

Wohnort:
Dorf Falkengrund
```

System:

```text
passende Schmiede suchen
        ↓
keine vorhanden
        ↓
Schmiede erzeugen
        ↓
Standort = Falkengrund
        ↓
Roderik als Betreiber/Schmied verknüpfen
        ↓
Beziehung speichern
        ↓
Story-Info aktualisieren
```

Ergebnis:

```text
Dorf Falkengrund
│
└── Schmiede "Eisenfaust"
      │
      └── Roderik
           Beruf: Schmied
           Wohnort: Falkengrund
```

---

# 38. Noch besser: Dorf-Erstellung aus vorhandenem Codex

Wenn der Codex bereits sagt:

```text
Dorf Falkengrund

Dorfältester:
    Harlan

Schmied:
    Roderik

Wirtin:
    Karin

Bäcker:
    Elina

Tempel:
    kleiner Schrein
```

soll die Erstellung des Ortes daraus erkennen:

```text
Dorf Falkengrund
│
├── Verwaltung
│   └── Harlan
│
├── Schmiede
│   └── Roderik
│
├── Gasthaus
│   └── Karin
│
├── Bäckerei
│   └── Elina
│
└── Schrein
```

Dabei:

> **Existierende Charaktere haben Vorrang vor automatisch erfundenen Charakteren.**

Das System soll nicht zusätzlich einen zweiten Schmied erfinden.

---

# 39. Wenn Informationen fehlen

Wenn nur steht:

```text
Dorf Falkengrund besitzt eine Schmiede.
```

aber kein Schmied bekannt ist:

```text
Schmiede erzeugen
Besitzer:
    unbekannt
```

Nicht automatisch einen vollständigen NPC erfinden, sofern das nicht ausdrücklich durch Smart-Fill gewünscht wird.

Wenn Smart-Fill ausdrücklich vollständige Ortsbevölkerung erzeugen soll, darf es dafür weitere Charaktere erstellen.

---

# 40. Benutzerkontrolle

Automatische Erzeugung soll den Benutzer nicht überraschen.

In der UI kann beispielsweise angezeigt werden:

```text
Automatisch erkannt:

✓ Schmiede in Falkengrund
✓ Arbeitsplatz Roderik → Schmiede
✓ Gasthaus in Falkengrund
✓ Karin → Wirtin
```

Optional:

```text
Details anzeigen
```

Der Benutzer muss nicht jeden technischen Link manuell erstellen.

---

# 41. Story-Info statt sofortigem Codex-Overwrite

Besonders wichtig:

Wenn durch automatische Ableitung neue Informationen entstehen:

```text
Roderik ist Schmied
+
lebt in Falkengrund
```

und daraus:

```text
Schmiede Eisenfaust
```

abgeleitet wird, darf ein bestehender Codex-Eintrag nicht einfach überschrieben werden.

Stattdessen:

```text
Story-Info
    Neue automatisch abgeleitete Information:
    "Roderik betreibt vermutlich eine Schmiede in Falkengrund."
```

Nach Bestätigung:

```text
Story-Info
    ↓
Codex
```

---

# 42. Wirtschaftliche Aggregation

Wenn automatisch Betriebe entstehen, muss die Gebietswirtschaft diese berücksichtigen.

Beispiel:

```text
Falkengrund

1 Schmiede
1 Gasthaus
1 Bäckerei
3 Bauernhöfe
```

Die Gebietswirtschaft berechnet daraus:

```text
Handwerk
Dienstleistung
Landwirtschaft
Beschäftigung
Versorgung
Handel
```

Das Dorf bleibt trotzdem ein `Territory`.

---

# 43. Akzeptanztests

## Test 1

```text
Dorf Falkengrund erstellen
```

Ergebnis:

```text
Territory erstellt
kein künstliches EconomyHolding "Dorf Falkengrund"
```

---

## Test 2

```text
Roderik
Beruf: Schmied
Wohnort: Falkengrund
```

Keine Schmiede vorhanden.

Ergebnis:

```text
Schmiede erzeugt
Standort Falkengrund
Roderik verknüpft
```

---

## Test 3

Schmiede existiert bereits:

```text
Schmiede Eisenfaust
```

Roderik wird erstellt.

Ergebnis:

```text
keine zweite Schmiede
Roderik → Eisenfaust
```

---

## Test 4

```text
Roderik
Beruf: Schmied
Wohnort: Falkengrund
Arbeitsplatz: Stadt Falkenheim
```

Ergebnis:

```text
Arbeitsplatz = Falkenheim
Wohnort = Falkengrund
```

Keine automatische lokale Schmiede erzeugen.

---

## Test 5

```text
Karin
Beruf: Wirtin
Wohnort: Falkengrund
```

Kein Gasthaus vorhanden.

Ergebnis:

```text
Gasthaus erzeugen
Karin → Wirtin
Gasthaus → Falkengrund
```

---

## Test 6

```text
Mara
Beruf: Köchin
Wohnort: Falkengrund
```

Gasthaus vorhanden.

Ergebnis:

```text
Mara → bestehendes Gasthaus
```

Kein neues Gasthaus.

---

## Test 7

Charakter zieht um:

```text
Roderik:
Falkengrund → Falkenheim
```

Ergebnis:

```text
Schmiede Falkengrund bleibt erhalten.
```

---

## Test 8

Charakter wechselt Beruf:

```text
Schmied → Händler
```

Ergebnis:

```text
Schmiede bleibt erhalten.
```

Besitz-/Arbeitsverhältnis wird neu bewertet.

---

## Test 9

Dorf wird aus Codex erzeugt:

```text
Dorf
    Schmiede
    Gasthaus
    Bäckerei
```

Ergebnis:

```text
drei separate wirtschaftliche Einheiten
```

Nicht:

```text
ein EconomyHolding "Dorf"
```

---

## Test 10

Codex enthält:

```text
Schmied Roderik
```

Ergebnis:

```text
kein zweiter Schmied automatisch erzeugen
```

---

# 44. Implementierungsreihenfolge

```text
1. vorhandene Character-Datenstruktur prüfen
2. vorhandene Profession-/Job-Struktur prüfen
3. vorhandene Territory-Struktur prüfen
4. vorhandene EconomyHolding-Struktur prüfen
5. bestehende ID-/Referenzsysteme wiederverwenden
6. Character ↔ Residence ergänzen
7. Character ↔ Workplace ergänzen
8. zentrale Beruf → Arbeitsplatz-Resolverlogik erstellen
9. automatische Betriebssuche implementieren
10. automatische Betriebserstellung implementieren
11. Duplikatprüfung implementieren
12. bidirektionale Beziehungen synchronisieren
13. Orts-Erstellungslogik mit Codex/Story-Info verbinden
14. explizite Codex-Informationen erkennen
15. automatische Story-Info-Ableitungen erzeugen
16. Gebietswirtschaft aus echten Einheiten aggregieren
17. Konsistencyprüfung implementieren
18. Endlosschleifen verhindern
19. UI für automatisch erkannte Beziehungen ergänzen
20. Migration bestehender Daten
21. TypeScript prüfen
22. Build prüfen
23. Akzeptanztests durchführen
```

---

# 45. Wichtige Architekturregel

Es darf niemals passieren:

```text
Charakter
    ↓
Beruf
    ↓
automatisch erfundener Betrieb
    ↓
Betrieb überschreibt Codex
```

Sondern:

```text
Charakter
    ↓
Beruf + Kontext
    ↓
bestehende Welt prüfen
    ↓
passende Entität suchen
    ↓
wenn vorhanden:
    verknüpfen
    ↓
wenn nicht vorhanden:
    neue Entität ableiten
    ↓
Story-Info
    ↓
optional Codex
```

---

# 46. Endzustand

AdventureForge soll am Ende nicht nur Daten speichern, sondern die Welt logisch miteinander verbinden.

Beispiel:

```text
DORF FALKENGRUND
│
├── Verwaltung
│   └── Dorfältester Harlan
│
├── Gebäude
│   ├── Rathaus
│   ├── Schrein
│   └── Wohnhäuser
│
├── Wirtschaft
│   ├── Schmiede "Eisenfaust"
│   │     └── Roderik – Schmied
│   │
│   ├── Gasthaus "Zum Falken"
│   │     ├── Karin – Wirtin
│   │     └── Mara – Köchin
│   │
│   ├── Bäckerei "Goldkruste"
│   │     └── Elina – Bäckerin
│   │
│   └── Bauernhöfe
│
├── Bevölkerung
│   ├── Roderik
│   ├── Karin
│   ├── Mara
│   └── Elina
│
└── Gebietswirtschaft
    ├── Handwerk
    ├── Gastronomie
    ├── Landwirtschaft
    └── lokaler Handel
```

Damit entsteht eine Welt, in der **Charaktere, Berufe, Betriebe, Gebäude, Orte, Bevölkerung, Wirtschaft und Codex nicht mehr isoliert nebeneinander stehen**, sondern über echte Referenzen miteinander verbunden sind.

## Entscheidende Regel

> **Wenn eine Information bereits existiert, verknüpfen statt duplizieren. Wenn sie fehlt und eindeutig aus dem Kontext abgeleitet werden kann, darf das System sie im Hintergrund als Story-Info vorbereiten. Neue erzählerische Fakten dürfen bestehende Codex-Daten niemals ungefragt überschreiben.**
