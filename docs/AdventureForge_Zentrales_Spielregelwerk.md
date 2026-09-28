# AdventureForge – Zentrales Spielregelwerk

## Zweck

Diese Datei definiert die zentralen Spielregeln von AdventureForge.

Sie dient als verbindliche Grundlage für:

* Charaktere
* Spielercharakter
* NPCs
* Bevölkerung
* Berufe und Talente
* Fähigkeiten
* Attribute
* Progression
* Gebäude
* Wirtschaft
* Weltentwicklung
* automatische Generierung
* Smart Fill
* KI-Auslöser

Ziel ist es, wiederkehrende und logisch berechenbare Vorgänge möglichst durch das Spielsystem abzuwickeln.

Die KI soll nur dort eingesetzt werden, wo kreative, sprachliche oder komplexe erzählerische Entscheidungen erforderlich sind.

---

# 1. Grundprinzip der Systemlogik

AdventureForge unterscheidet grundsätzlich zwischen drei Arten der Erzeugung und Verarbeitung.

## 1.1 Spielsystem

Das Spielsystem verarbeitet feste Regeln, Berechnungen und Bedingungen.

Beispiele:

* Werte berechnen
* Progression durchführen
* Bevölkerung verändern
* Gebäudeanforderungen bestimmen
* Arbeitsplätze berechnen
* Ressourcenverbrauch berechnen
* NPC-Grunddaten erzeugen
* Bedingungen prüfen
* Ereignisse anhand definierter Bedingungen auslösen

Diese Vorgänge benötigen keine KI.

---

## 1.2 Zufalls- und Auswahlmechanismen

Zufall darf innerhalb definierter Regeln verwendet werden.

Beispiele:

* zufälliges Alter innerhalb eines erlaubten Bereichs
* zufällige Auswahl eines passenden Berufs
* zufällige Charaktereigenschaft
* zufällige Talentverteilung
* zufällige Herkunft
* zufällige Namensauswahl aus vorhandenen Namenslisten
* zufällige Ereignisse innerhalb definierter Wahrscheinlichkeiten

Der Zufall darf dabei niemals bestehende Spielregeln überschreiben.

Beispiel:

Ein NPC darf nicht zufällig einen Beruf erhalten, für den es im betreffenden Kontext keine Voraussetzungen gibt.

---

## 1.3 KI

Die KI wird verwendet, wenn eine kreative oder sprachliche Verarbeitung notwendig ist.

Beispiele:

* Dialoge
* Beschreibungen
* individuelle Hintergrundgeschichten
* erzählerische Ausgestaltung
* Reaktionen von NPCs
* kreative Namensfindung, wenn keine passende Systemauswahl vorhanden ist
* komplexe Storyentwicklung
* situationsabhängige Darstellung bereits vorhandener Daten

Die KI soll keine grundlegenden Spielwerte eigenständig festlegen, wenn dafür bereits eine globale Spielregel existiert.

---

# 2. Priorität der Regeln

Bei widersprüchlichen Informationen gilt folgende Priorität:

1. Zentrale Spielregeln
2. Globale Progressionsregeln
3. Spezifische Systemregeln
4. gespeicherte Charakter-/Weltdaten
5. Zufallsmechanismen
6. KI-generierte Ausgestaltung

Eine KI-Ausgabe darf keine verbindliche Spielregel außer Kraft setzen.

---

# 3. Globale Progressionsregel

Die globale Progressionsregel ist ein zentraler Bestandteil des AdventureForge-Regelwerks.

Sie gilt grundsätzlich für alle relevanten Charaktere und Wesen, sofern ein System keine ausdrücklich definierte Ausnahme besitzt.

Dazu gehören insbesondere:

* Spielercharaktere
* NPCs
* Begleiter
* Gegner
* wichtige Storycharaktere
* automatisch erzeugte Bewohner

## 3.1 Rangsystem

Das Rangsystem bildet die allgemeine Entwicklungsstufe eines Charakters ab.

Aktuelle Rangstruktur:

**F → E → D → C → B → A → S**

Ein neu erzeugter gewöhnlicher Charakter beginnt grundsätzlich entsprechend seinem vorgesehenen Entwicklungsstand.

Der Rang darf nicht ausschließlich durch Zufall bestimmt werden, sondern muss sich aus den definierten Voraussetzungen und dem vorgesehenen Charaktertyp ergeben.

---

## 3.2 Grundwerte

Die globalen Grundwerte werden durch das zentrale Progressionssystem bestimmt.

Aktuelle Grundlage:

* Rang F
* HP-Basis: 30
* weitere Grundwerte: 10

Die konkreten Formeln für Wachstum, Skalierung und Rangaufstieg werden in der globalen Progressionsregel verbindlich definiert.

Bereits bestehende funktionierende Werte- und Progressionssysteme dürfen nicht unnötig dupliziert werden.

---

## 3.3 Attribute

Attribute werden zentral verwaltet.

Aktueller Wertebereich:

**0–1000**

Negative Werte können für bestimmte Zustände oder Modifikatoren technisch zugelassen werden, sofern dies durch das jeweilige System erforderlich ist.

Die globale Progressionsregel bestimmt:

* wie Attribute steigen
* wodurch sie steigen
* welche Grenzen gelten
* wie Rang, Erfahrung und Potenzial zusammenwirken
* wie Training berücksichtigt wird
* wie natürliche Entwicklung berücksichtigt wird

---

## 3.4 Potenzial

Jeder Charakter kann ein individuelles Entwicklungspotenzial besitzen.

Das Potenzial bestimmt nicht zwangsläufig den aktuellen Wert eines Charakters.

Es beschreibt vielmehr, welches Entwicklungsniveau unter geeigneten Bedingungen grundsätzlich erreichbar ist.

Potenzial und aktueller Wert müssen deshalb getrennt gespeichert werden.

---

## 3.5 Erfahrung und Entwicklung

Entwicklung kann durch verschiedene Quellen ausgelöst werden.

Beispiele:

* Training
* Kämpfe
* Berufserfahrung
* Lernen
* praktische Tätigkeit
* besondere Ereignisse
* Storyfortschritt
* Alter und natürliche Entwicklung

Alle diese Quellen müssen letztlich mit der globalen Progressionsregel kompatibel sein.

---

# 4. Automatische Charaktererzeugung

Automatisch erzeugte Charaktere werden nicht vollständig durch die KI erstellt.

Der grundlegende Ablauf:

```text
Charakter benötigt
↓
System prüft Voraussetzungen
↓
Charaktertyp bestimmen
↓
Rang / Entwicklungsstand bestimmen
↓
globale Progressionsregel anwenden
↓
Grundwerte erzeugen
↓
Beruf / Talent / Fähigkeiten bestimmen
↓
weitere Eigenschaften bestimmen
↓
Zufallswerte innerhalb erlaubter Grenzen
↓
Charakter speichern
↓
KI nur bei Bedarf zur erzählerischen Ausgestaltung
```

---

# 5. Bevölkerung

Bevölkerung wird als eigenständiges System behandelt.

Das System kann abhängig von definierten Bedingungen:

* neue Bewohner erzeugen
* Bewohner altern lassen
* Bewohner umziehen lassen
* Bewohner sterben lassen
* Familien bilden
* Arbeitskräfte verändern
* Bevölkerungsgrenzen berücksichtigen

Bevölkerungsveränderungen werden grundsätzlich durch Regeln und Bedingungen ausgelöst.

Die KI wird nicht benötigt, um die reine Bevölkerungsberechnung durchzuführen.

---

# 6. Berufe und Arbeitsplätze

Berufe müssen mit der Welt und der Wirtschaft verbunden sein.

Das System berücksichtigt unter anderem:

* vorhandene Gebäude
* vorhandene Arbeitsplätze
* Bevölkerungsgröße
* wirtschaftlichen Bedarf
* vorhandene Ressourcen
* Versorgung
* bereits vorhandene Berufe

Beispiel:

```text
Dorf benötigt Schmied
↓
Schmiede vorhanden?
↓
Nein
↓
Arbeitsplatz erforderlich
↓
geeigneten NPC bestimmen oder neuen NPC erzeugen
```

Die KI muss nicht entscheiden, ob ein Dorf grundsätzlich einen Schmied benötigt.

Diese Entscheidung gehört zum Spielsystem.

---

# 7. Gebäude

Gebäude werden anhand definierter Regeln erzeugt und verwaltet.

Dabei können berücksichtigt werden:

* Bevölkerung
* Wohnbedarf
* Arbeitsplätze
* Wirtschaft
* Ressourcen
* Versorgung
* Religion
* Verwaltung
* Militär
* Handel
* regionale Besonderheiten

Gebäude besitzen eigene Daten und dürfen nicht lediglich als grafische Symbole behandelt werden.

---

# 8. Smart Fill

Smart Fill nutzt das zentrale Regelwerk.

Smart Fill soll nicht automatisch die komplette Welt durch KI erzeugen lassen.

Grundprinzip:

```text
Benutzervorgaben
↓
Spielregeln
↓
Berechnungen
↓
automatische Systemerzeugung
↓
Zufalls-/Auswahlsysteme
↓
fertige strukturierte Daten
↓
KI-Ausgestaltung nur bei Bedarf
```

## 8.1 Smart Fill darf selbstständig erzeugen

Beispiele:

* benötigte Gebäude
* Wohnraum
* Arbeitsplätze
* NPC-Grunddaten
* Berufe
* Ressourcen
* grundlegende Bevölkerung
* Werte innerhalb definierter Regeln
* Verbindungen zwischen Systemdaten

## 8.2 Smart Fill darf keine Regeln umgehen

Smart Fill darf nicht:

* globale Progressionsregeln überschreiben
* ungültige Werte erzeugen
* bestehende Daten ohne entsprechende Regel ersetzen
* Voraussetzungen ignorieren
* bereits vorhandene Systeme doppelt aufbauen

---

# 9. KI-Auslöser

Für jedes zukünftige System soll geprüft werden:

**Muss hierfür wirklich KI verwendet werden?**

Wenn eine Aufgabe vollständig durch Regeln, Berechnungen oder Auswahlmechanismen lösbar ist, soll sie ohne KI ausgeführt werden.

Beispiel:

```text
"Erzeuge einen neuen Dorfbewohner."
→ System

"Bestimme seine Werte."
→ globale Progressionsregel

"Bestimme seinen Beruf."
→ Berufs-/Wirtschaftsregeln

"Bestimme zufällige Eigenschaften."
→ Zufallssystem

"Schreibe seine Hintergrundgeschichte."
→ KI
```

---

# 10. Zukünftige Regelbereiche

Diese Datei wird schrittweise erweitert.

Geplante Bereiche:

* [ ] Zeit- und Tagesregeln
* [ ] Alters- und Wachstumsregeln
* [ ] Rassenregeln
* [ ] Charaktererzeugung
* [ ] globale Progressionsformeln
* [ ] Fähigkeitenentwicklung
* [ ] Kraftquellen
* [ ] Techniken
* [ ] Waffenbeherrschung
* [ ] Alltagskompetenzen
* [ ] Berufe
* [ ] Beziehungen
* [ ] Bevölkerung
* [ ] Gebäude
* [ ] Wirtschaft
* [ ] Ressourcen
* [ ] Items
* [ ] Weltgenerierung
* [ ] Reise und Navigation
* [ ] Kampfregeln
* [ ] Story- und ATE-Regeln
* [ ] NPC-Verhalten
* [ ] Smart-Fill-Regeln
* [ ] KI-Auslöser

---

# 11. Zentrale Entwicklungsregel

Bevor ein neues automatisches System entwickelt wird, muss geprüft werden:

1. Existiert dafür bereits eine Regel?
2. Kann die Aufgabe durch vorhandene Systemlogik gelöst werden?
3. Gibt es bereits eine globale Regel, die verwendet werden muss?
4. Wird dadurch ein bestehendes System dupliziert?
5. Ist tatsächlich KI erforderlich?
6. Falls KI erforderlich ist: Welche Daten werden der KI bereits strukturiert übergeben?

Ziel:

**Eine zentrale Regel – eine zentrale Logik – mehrere Systeme können sie verwenden.**

Neue Systeme sollen bestehende Regeln verwenden und nicht eigene widersprüchliche Varianten derselben Logik erzeugen.
