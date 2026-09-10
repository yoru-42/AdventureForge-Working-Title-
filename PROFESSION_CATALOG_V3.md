# AdventureForge – Berufskatalog V3

## Ziel

Dieser Katalog definiert die vollständige sichtbare Liste der Berufe, Tätigkeiten und beruflichen Pfade für die Berufs-UI.

Wichtig:
- Alle Einträge müssen in der UI grundsätzlich erreichbar und darstellbar sein.
- Die Kategorien dienen zur Gruppierung und Platzersparnis.
- Eintrag ist nicht automatisch gleichbedeutend mit Adelstitel, Amt oder sozialer Position.
- Doppelte Begriffe bleiben als Datenpfade möglich, wenn derselbe Begriff in unterschiedlichen Berufsfeldern verwendet wird (z. B. General, Kommandant, Jäger, Ninja, Koch, Sekretär, Florist, Puppenspieler).
- Das UI darf die vollständige Liste nicht durch eine kleine Beispielauswahl ersetzen.
- Die Berufsfeld-Auswahl erfolgt am Anfang. Danach wird der Beruf als verzweigter Talentbaum dargestellt.

---

# 1. Adel & Herrschaft

- Kaiser / Kaiserin
- König / Königin
- Großherzog
- Herzog
- Fürst / Fürstin

## Hofnahe Rollen

- Berater
- Diplomat / Unterhändler
- Taktiker
- Kanzler
- Verwalter
- Kurfürstlicher Beamter
- Kommandant
- Admiral
- General
- Ritter
- Edler / Edle
- Paladin / Heiliger Ritter
- Runenritter
- Drachenritter / Drachenkrieger
- Leibwächter
- Körperdouble
- Grenzpatrouille

## Hofspezialisten

- Architekt (Festungsbau)
- Astrologe
- Wahrsager
- Held

---

# 2. Religion & Klerus

## Hoher Klerus

- Saint / Saintess
- Hochpriester / Kardinal
- Bischof / Propst
- Theokrat
- Abt / Äbtissin
- Orakel
- Kleriker
- Kriegspriester
- Exorzist
- Inquisitor
- Pilger

## Shinto / japanisch geprägte Pfade

- Kannushi / Shinshoku
- Gūji (Oberpriester)
- Negi / Gon-Negi
- Miko
- Kannagi
- Sohei (Kriegermönch)
- Yamabushi
- Onmyōji
- Ajari

---

# 3. Arkan & Magie

- Arkan
- Arkanist
- Elementarist
- Sigilmancer
- Talismanzer
- Runenmeister
- Runenschmied
- Magischer Kunstfertiger
- Orakel
- Medium
- Traumwandler

## Dunkle / gefährliche Magie

- Nekromant
- Curseblade
- Specter-Benutzer
- Untotenbeschwörer
- Giftbenutzer

---

# 4. Militär & reguläre Streitkräfte

## Regulär

- Soldat
- Offizier
- Kommandant
- General
- Admiral
- Quartiermeister
- Belagerungsingenieur

## Spezialkämpfer

- Berserker
- Rächer / Avenger
- Duellant
- Kanonier / Gunner
- Jäger
- Scout / Pfadfinder
- Taktiker
- Riesentöter

---

# 5. Unabhängige Kämpfer & Abenteurer

- Söldner
- Gladiator
- Ninja
- Drachenjäger
- Arzt
- Alchemist
- Apotheker
- Forscher
- Bibliothekar
- Archäologe
- Kryptograph
- Kartograph
- Lehrer / Trainer
- Detektiv

---

# 6. Verwaltung & Wirtschaft

- Buchhalter
- Steuereintreiber
- Händler
- Vermieter
- Verhandlungsführer
- Sekretär
- Kurier

---

# 7. Kunst & Kultur

- Musiker
- Maler
- Schriftsteller / Romancier
- Schauspieler / Tänzer
- Bänkelsänger
- Puppenspieler
- Idol / Diva

---

# 8. Metall & Waffen

- Schmied
- Waffenschmied
- Schwertschmied
- Rüstungsschmied
- Mechaniker
- Instrumentenbauer

---

# 9. Materialverarbeitung

- Gerber
- Kürschner
- Seiler
- Glasmacher
- Wagner
- Zimmermann
- Holzarbeiter

---

# 10. Luxus & Spezial

- Juwelier
- Edelsteinschmied
- Parfümeur
- Brauer
- Koch / Küchenchef
- Florist

---

# 11. Landwirtschaft, Versorgung & Sammelberufe

- Bauer / Landwirt
- Fischer
- Bergmann
- Sammler
- Kräutersammler
- Fallensteller
- Verkäufer
- Milchbauer
- Futtersucher

---

# 12. Wandernde Existenzen & Erkundung

- Nomade
- Wanderer
- Prospektor
- Entdecker
- Tracker / Trapper
- Jäger

---

# 13. Tierführung & Tamer

- Tiertrainer
- Falkner
- Mahout (Elefantenführer)
- Beast Tamer
- Bug Tamer
- Drachenzähmer
- Dämonen-Tamer

---

# 14. Kriminelle Berufe

- Dieb / Rogue
- Schurke
- Outlaw
- Pirat
- Schmuggler
- Fälscher
- Glücksspieler
- Phantom-Dieb

---

# 15. Geheimoperationen & Überleben

- Spion
- Auftragskiller / Hitman
- Ninja
- Deserteur
- Überlebenskünstler
- Survivor
- Flüchtiger
- Kopfgeldjäger
- Untotenjäger

---

# 16. Haushalt & persönliche Dienste

- Butler
- Maid / Dienstmädchen
- Haushälterin
- Koch
- Kutscher
- Sekretär
- Florist
- Vorkoster

---

# 17. Unterhaltung & besondere Tätigkeiten

- Akrobat
- Tänzer
- Kurtisane
- Puppenspieler
- Totengräber
- Vogelabrichter
- Magical Girl

---

# 18. Private / gesellschaftliche Lebensrollen

- Hausfrau / Hausmann
- Sklave
- Schüler
- Student

---

# UI-Regeln

## 1. Keine abgeschnittene Berufsliste

Die UI darf nicht nur beispielsweise 5 oder 10 Berufe anzeigen, während weitere Daten im System vorhanden sind.

Alle oben definierten Einträge müssen aus dem Datenmodell generierbar sein.

## 2. Kategorien einklappbar

Die Kategorien sollen im UI einklappbar sein, damit die Charakterseite nicht unnötig lang wird.

Beispiel:

```text
BERUFE

[ Adel & Herrschaft        ▼ ]
[ Religion & Klerus        ▶ ]
[ Arkan & Magie            ▶ ]
[ Militär                  ▶ ]
[ Unabhängig               ▶ ]
[ Verwaltung & Wirtschaft  ▶ ]
[ Kunst & Kultur            ▶ ]
...
```

## 3. Berufsfeld nur am Einstieg wählen

Der Benutzer wählt zu Beginn ein Berufsfeld.

Danach erscheint der Berufstalentbaum.

Es soll nicht bei jedem Schritt wieder ein flaches Dropdown mit allen Berufen geben.

## 4. Berufstalentbaum

Beispiel:

```text
                         LEHRLING
                             │
                 ┌───────────┼───────────┐
                 │           │           │
              SCHMIED      KOCH       SOLDAT
                 │           │           │
          ┌──────┼──────┐    │      ┌────┼────┐
          │      │      │    │      │    │    │
       WAFFEN- RÜSTUNGS- WERK-  GOURMET  OFFIZIER ...
       SCHMIED SCHMIED  ZEUG    KOCH
```

## 5. Mehrere Pfade sind erlaubt

Ein Charakter darf mehrere berufliche Spezialisierungen verfolgen, sofern die jeweiligen Voraussetzungen erfüllt sind.

Beispiel:

```text
Schmied
├─ Waffenschmied
│  └─ Schwertschmied
├─ Rüstungsschmied
└─ Werkzeugschmied
```

## 6. Nebenberufe

Nebenberufe bleiben ein separates Konzept.

Ein Charakter kann beispielsweise sein:

```text
Hauptberuf: Schmied
Nebenberuf: Kräutersammler
Nebenberuf: Musiker
```

Die UI soll Hauptberuf und Nebenberufe klar trennen.

## 7. Beruf ist nicht automatisch Position

Beispiele:

```text
Beruf: Seemann
Position: Kapitän
```

oder

```text
Beruf: Koch
Titel: Baron
```

Diese Systeme dürfen nicht automatisch miteinander verschmolzen werden.

## 8. Voraussetzungen

Jeder Berufsknoten kann individuelle Voraussetzungen besitzen:

- vorheriger Beruf
- Kompetenzwert
- Berufserfahrung
- Ausbildung
- Prüfung
- Meisteranerkennung
- soziale Anerkennung
- Story-Ereignis
- andere individuell definierte Bedingungen

## 9. Kompetenz bleibt separat

Ein freigeschalteter Beruf bedeutet nicht automatisch hohe Kompetenz.

```text
Beruf: Schmied
Kompetenz: 18 %
```

ist genauso gültig wie:

```text
Beruf: Schmied
Kompetenz: 94 %
```

## 10. Doppelte Begriffe

Doppelte Begriffe werden nicht einfach global entfernt.

Beispiele:

- General
- Admiral
- Kommandant
- Taktiker
- Jäger
- Ninja
- Koch
- Sekretär
- Florist
- Puppenspieler
- Orakel

Wenn derselbe Name in mehreren Berufsfeldern vorkommt, muss das Datenmodell über eine eindeutige `id` unterscheiden.

Beispiel:

```ts
{
  id: "military-general",
  name: "General",
  fieldId: "military"
}

{
  id: "court-general",
  name: "General",
  fieldId: "court"
}
```

---

# Datenmodell-Anforderung

```ts
interface ProfessionNode {
  id: string;
  fieldId: string;
  name: string;
  parentIds?: string[];
  childIds?: string[];
  specializationOf?: string;
  prerequisites?: ProfessionPrerequisite[];
  categoryId?: string;
  isMainProfession?: boolean;
  isSecondaryProfession?: boolean;
}
```

Die Beziehungen müssen explizit gespeichert werden. Die Reihenfolge einer Liste darf nicht als Talentbaum interpretiert werden.

---

# Definition of Done

- [ ] Alle Einträge dieses Katalogs sind im Datenmodell vorhanden.
- [ ] Alle Einträge besitzen eine eindeutige ID.
- [ ] Doppelte Namen dürfen unterschiedliche IDs besitzen.
- [ ] Kategorien können eingeklappt werden.
- [ ] Berufsfeld wird nur am Einstieg ausgewählt.
- [ ] Danach wird ein echter Talentbaum angezeigt.
- [ ] Der Talentbaum zeigt Verbindungen zwischen den Berufsstufen.
- [ ] Mehrere Spezialisierungspfade sind möglich.
- [ ] Hauptberuf und Nebenberuf bleiben getrennt.
- [ ] Beruf, Kompetenz, Erfahrung und Position bleiben getrennte Systeme.
- [ ] Gesperrte Berufe zeigen ihre Voraussetzungen.
- [ ] Die UI darf keine Berufe aus der Liste unterschlagen.
