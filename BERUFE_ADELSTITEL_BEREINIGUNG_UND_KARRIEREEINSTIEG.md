# AdventureForge – Berufe, Adelstitel und passende Karriere-Einstiege

## Ziel

Die vorhandenen Berufs-, Rollen- und Adelssysteme sollen erweitert und gleichzeitig bereinigt werden.

Gemini soll **zuerst den gesamten bestehenden Code/Datenbestand durchsuchen** und feststellen, welche der unten genannten Einträge bereits vorhanden sind.

### Absolute Regel: keine Dubletten

- Bereits vorhandene Einträge NICHT erneut anlegen.
- Semantisch identische Einträge zusammenführen bzw. den vorhandenen Eintrag weiterverwenden.
- Varianten wie `Koch` und `Koch / Küchenchef` prüfen, bevor ein neuer Datensatz angelegt wird.
- Gleiches gilt für `Jäger`, `Ninja`, `General`, `Admiral`, `Kommandant`, `Taktiker`, `Florist`, `Sekretär`, `Koch`, `Puppenspieler` usw.
- Nicht nur auf exakte Schreibweise prüfen, sondern auch auf vorhandene Synonyme/Aliase.

---

# 1. Wichtige Änderung am Karrierebaum

**Nicht jeder Beruf beginnt mit „Lehrling“.**

Das bisherige Konzept darf NICHT pauschal so umgesetzt werden:

```text
Lehrling → Beruf → Spezialisierung
```

Das ist für viele Berufsfelder unpassend.

Der erste Knoten muss zur jeweiligen Domäne passen.

Beispiele:

```text
Handwerk:
Lehrling → Schmied → Waffenschmied / Rüstungsschmied / ...

Küche:
Lehrling → Koch → Spezialisierung

Militär:
Rekrut → Soldat → Offizier → Kommandant → General

Marine:
Rekrut / Matrose → Matrose → Offizier → Admiral

Magie:
Magieschüler / Novize → Arkanist / Elementarist → Spezialisierung

Klerus:
Novize → Kleriker → höhere geistliche Position

Kriminelle:
Anfänger / Kleinkrimineller → Dieb / Schurke → Spezialisierung

Wissenschaft:
Schüler / Student → Forscher → Spezialgebiet

Verwaltung:
Gehilfe / Schreiber → Verwalter / Buchhalter / ...
```

Die konkreten Bezeichnungen sollen **aus dem vorhandenen System und der jeweiligen Kultur/Weltlogik sinnvoll gewählt** werden.

Es ist ausdrücklich erlaubt, dass ein Pfad **gar keinen klassischen Lehrlingsbegriff** besitzt.

`Lehrling` darf nur dort verwendet werden, wo die Bezeichnung fachlich sinnvoll ist.

---

# 2. UI des Beruf-Talentbaums

Die Darstellung bleibt ein echter Talentbaum.

```text
BERUFSFELD
[ Militär ▼ ]

                         REKRUT
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       SOLDAT          SCOUT            KANONIER
          │
     BERUFSZWEIG WÄHLEN

[Infanterie] [Fernkampf] [Artillerie] [Aufklärung]

          │
          ▼
        OFFIZIER
          │
     [Kommandant] [Taktiker]
```

Die **Berufszweig-Auswahl bleibt als kompakte Tags/Chips** erhalten.

Keine großen Karten für jeden Berufszweig.

Jeder aktive Berufsknoten zeigt:

```text
Berufsfortschritt
Berufserfahrung
Fachkompetenzen
  └─ Grundlagen
Talente
```

Alltagskompetenzen bleiben ein separates System.

---

# 3. Adelstitel – getrennt vom Berufssystem

Folgende Adelstitel prüfen und, falls nicht vorhanden, im separaten Adel-/Gesellschaftstitel-System ergänzen:

- Kaiser / Kaiserin
- König / Königin
- Großherzog
- Herzog
- Fürst / Fürstin
- Edler / Edle

Diese dürfen **nicht** als normale Berufe in den Berufstalentbaum eingetragen werden.

---

# 4. Hofnahe Rollen / Ämter

Als Rollen/Positionen behandeln, nicht automatisch als Berufe:

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
- Leibwächter
- Körperdouble
- Grenzpatrouille

Prüfen, ob ein Eintrag bereits als Beruf, Position oder Titel existiert. Die semantisch passende vorhandene Kategorie verwenden.

---

# 5. Hofspezialisten

- Architekt (Festungsbau)
- Astrologe
- Wahrsager
- Held

`Held` kann ein gesellschaftlicher/auszeichnungsähnlicher Titel oder Status sein und soll nicht zwangsläufig als normaler Beruf behandelt werden.

---

# 6. Hoher Klerus / Religion

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
- Kannushi / Shinshoku
- Gūji (Oberpriester)
- Negi / Gon-Negi
- Miko
- Kannagi
- Sohei (Kriegermönch)
- Yamabushi
- Onmyōji
- Ajari

Religiöse Ämter und Ränge nicht blind als normale Handwerksberufe einordnen. Geeignete Kategorie im bestehenden System wählen.

---

# 7. Arkan / Magie

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

Doppelte `Orakel`-Nennung nur einmal anlegen.

---

# 8. Dunkle / gefährliche Magie

- Nekromant
- Curseblade
- Specter-Benutzer
- Untotenbeschwörer
- Giftbenutzer

Prüfen, ob diese bereits als Magie-/Kampf-Spezialisierungen vorhanden sind.

---

# 9. Reguläres Militär / Kampf

- Soldat
- Offizier
- Kommandant
- General
- Admiral
- Quartiermeister
- Belagerungsingenieur
- Spezialkämpfer
- Berserker
- Rächer / Avenger
- Duellant
- Kanonier / Gunner
- Jäger
- Scout / Pfadfinder
- Taktiker
- Riesentöter

Dubletten zusammenführen.

Beispiel eines sinnvollen Pfades:

```text
Rekrut
  ↓
Soldat
  ├─ Spezialkämpfer
  ├─ Scout
  ├─ Kanonier
  └─ Taktiker
       ↓
   Offizier / Kommandant
       ↓
     General
```

Nicht jeder Charakter muss denselben linearen Weg durchlaufen.

---

# 10. Unabhängige / freie Berufe

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

# 11. Verwaltung & Wirtschaft

- Buchhalter
- Steuereintreiber
- Händler
- Vermieter
- Verhandlungsführer
- Sekretär
- Kurier

---

# 12. Kunst & Kultur

- Musiker
- Maler
- Schriftsteller / Romancier
- Schauspieler / Tänzer
- Bänkelsänger
- Puppenspieler
- Idol / Diva

---

# 13. Metall & Waffen

- Schmied
- Waffenschmied
- Schwertschmied
- Rüstungsschmied
- Mechaniker
- Instrumentenbauer

---

# 14. Materialverarbeitung

- Gerber
- Kürschner
- Seiler
- Glasmacher
- Wagner
- Zimmermann
- Holzarbeiter

---

# 15. Luxus & Spezial

- Juwelier
- Edelsteinschmied
- Parfümeur
- Brauer
- Koch / Küchenchef
- Florist
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

# 16. Wandernde Existenzen / Natur

- Nomade
- Wanderer
- Prospektor
- Entdecker
- Tracker / Trapper
- Jäger
- Tiertrainer
- Falkner
- Mahout (Elefantenführer)
- Beast Tamer
- Bug Tamer
- Drachenzähmer
- Dämonen-Tamer

---

# 17. Kriminelle

- Dieb / Rogue
- Schurke
- Outlaw
- Pirat
- Schmuggler
- Fälscher
- Glücksspieler
- Phantom-Dieb

---

# 18. Geheimoperationen

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

# 19. Dienstpersonal / Haushalt

- Butler
- Maid / Dienstmädchen
- Haushälterin
- Koch
- Kutscher
- Sekretär
- Florist
- Vorkoster
- Akrobat
- Tänzer
- Kurtisane
- Puppenspieler
- Totengräber
- Vogelabrichter
- Magical Girl
- Hausfrau / Hausmann
- Sklave
- Schüler
- Student

Auch hier Dubletten vermeiden.

`Schüler` und `Student` sind Bildungs-/Lebensrollen und müssen nicht zwingend normale Berufe sein.

`Sklave` ist ein Status-/Lebenszustand und darf nicht als regulärer Beruf behandelt werden, sofern das bestehende System Status und Beruf getrennt führt.

---

# 20. Semantische Prüfung vor dem Anlegen

Für jeden Eintrag muss Gemini zuerst prüfen:

1. Existiert er bereits?
2. Existiert ein Synonym?
3. Existiert er bereits in einer anderen Kategorie?
4. Ist es überhaupt ein Beruf?
5. Ist es stattdessen ein Adelstitel?
6. Ist es eine Position / ein Amt?
7. Ist es ein militärischer Rang?
8. Ist es ein religiöses Amt?
9. Ist es eine Spezialisierung?
10. Ist es ein Status oder eine Auszeichnung?

Erst danach entscheiden, wo der Datensatz hingehört.

---

# 21. Keine künstlichen Universal-Stufen

Folgendes ist ausdrücklich verboten:

```text
Lehrling
 ↓
Beruf
 ↓
Geselle
 ↓
Meister
```

als universelles Schema für alle Berufsfelder.

Insbesondere darf ein Militärberuf nicht so aussehen:

```text
Lehrling
 ↓
Soldat
```

sondern beispielsweise:

```text
Rekrut
 ↓
Soldat
```

Ebenso sollte ein religiöser Weg beispielsweise mit `Novize` beginnen können und ein magischer Weg mit `Magieschüler` oder einem vergleichbaren passenden Begriff.

Die Bezeichnung des Einstiegsknotens muss **fachlich und weltlogisch zum Berufsfeld passen**.

---

# 22. Adel / Titel / Position / Beruf strikt trennen

```text
BERUF
= Was arbeitet / beherrscht die Person?

BERUFSERFAHRUNG
= Wie viel praktische Erfahrung besitzt sie?

BERUFSFORTSCHRITT
= Wie weit ist sie auf ihrem beruflichen Pfad?

TITEL
= Welche gesellschaftliche oder verliehene Bezeichnung besitzt sie?

POSITION / AMT
= Welche Funktion übt sie aktuell aus?

STATUS
= Welche soziale/rechtliche Lebenssituation besitzt sie?
```

Beispiel:

```text
Beruf: Koch
Berufsfortschritt: 64 %
Berufserfahrung: 4 Jahre
Titel: Baron
Position: Hofkoch
```

Das ist gültig und darf nicht zu einem einzigen „Level“ verschmolzen werden.

---

# 23. Erwartetes Ergebnis

Nach der Prüfung soll Gemini eine Übersicht erzeugen:

```text
BESTANDEN / WIEDERVERWENDET
- Koch
- Schmied
- General
...

NEU ANGELEGT
- Kaiser / Kaiserin
- Großherzog
- Runenritter
...

ZUSAMMENGEFÜHRT / SYNONYM
- Koch / Küchenchef → Koch
- Kanonier / Gunner → vorhandener Kanonier
...

ANDERE KATEGORIE
- König → Adelstitel
- General → militärischer Rang / Position
- Sklave → Status
- Schüler → Bildung
...
```

Erst danach die tatsächlichen Datenänderungen durchführen.

---

# Definition of Done

- [ ] Gesamten bestehenden Beruf-/Titel-/Rollen-Datenbestand geprüft.
- [ ] Keine Dubletten erzeugt.
- [ ] Synonyme sinnvoll zusammengeführt.
- [ ] Adelstitel separat gehalten.
- [ ] Positionen und Ämter nicht fälschlich als Berufe angelegt.
- [ ] Militärische Einstiege verwenden passende Begriffe wie Rekrut statt pauschal Lehrling.
- [ ] Magie, Religion, Verwaltung, Handwerk usw. können unterschiedliche Einstiegsknoten besitzen.
- [ ] Berufszweig-Auswahl bleibt als kompakte Tags/Chips erhalten.
- [ ] Beruf-Talentbaum bleibt verzweigt und visuell verbunden.
- [ ] Jeder Berufsknoten besitzt Berufsfortschritt, Berufserfahrung, Fachkompetenzen, Grundlagen und Talente.
- [ ] Geselle/Meister werden nicht mehr als universelle Berufsstufen verwendet.
- [ ] Alltagskompetenzen bleiben getrennt.
- [ ] Bestehende Daten werden bevorzugt weiterverwendet statt neu angelegt.
