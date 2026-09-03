export interface ProfessionDutyTemplate {
  archetype: string;
  levelDuties: { [level: string]: string[] };
}

export const DUTIES_BY_ARCHETYPE: { [key: string]: ProfessionDutyTemplate } = {
  "handwerk": {
    archetype: "Handwerk & Produktion",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Reinigung der Werkstatt und Sortierung der Arbeitsmaterialien",
        "Einfache Hilfsarbeiten und Tragen von schweren Lasten",
        "Zuarbeit nach direkter Anweisung ohne eigene Entscheidungsbefugnis"
      ],
      "Neuling / Anfänger": [
        "Erlernen des sicheren Umgangs mit grundlegenden Werkzeugen",
        "Ausführen einfachster Handgriffe unter ständiger Aufsicht",
        "Vorbereitung von Rohmaterialien für die Weiterverarbeitung"
      ],
      "Lehrling / Auszubildender": [
        "Systematisches Erlernen der Materialkunde und Fertigungstechniken",
        "Herstellung einfacher Bauteile und Werkstücke nach Vorgabe",
        "Wartung und Pflege der Werkzeuge und Maschinen"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Anfertigung von Standard-Erzeugnissen und Waren",
        "Anleitung und Beaufsichtigung von Lehrlingen in der Werkstatt",
        "Durchführung von Standard-Reparaturen und Kundenberatungen"
      ],
      "Experte / Spezialist": [
        "Herstellung von komplexen Spezialanfertigungen und Maßarbeiten",
        "Fehlersuche und Behebung anspruchsvoller technischer Probleme",
        "Qualitätssicherung und Optimierung der Produktionsabläufe"
      ],
      "Meister / Führungskraft": [
        "Gesamtleitung des Werkstattbetriebs und Personalplanung",
        "Fachliche und pädagogische Ausbildung von Lehrlingen und Gesellen",
        "Kalkulation von Angeboten und Abnahme fertiger Arbeiten"
      ],
      "Großmeister / Koryphäe": [
        "Entwicklung neuartiger Fertigungsverfahren und Entwurfsmuster",
        "Herstellung von Meisterwerken für hochrangige Auftraggeber",
        "Gutachtertätigkeit bei Streitfragen innerhalb der Zunft oder Gilde"
      ],
      "Veteran / Legendär": [
        "Erschaffung von legendären Gegenständen und historischen Monumenten",
        "Bewahrung und Weitergabe von geheimen, jahrhundertealten Techniken",
        "Strategische Beratung von Herrschern und Gildenoberhäuptern"
      ]
    }
  },
  "landwirtschaft": {
    archetype: "Landwirtschaft, Viehzucht & Lebensmittel",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Manuelle Erntehilfe und einfache Feldarbeiten",
        "Fütterung von Kleintieren und einfache Reinigungsarbeiten",
        "Hilfsdienste bei schweren körperlichen Verrichtungen"
      ],
      "Neuling / Anfänger": [
        "Erlernen der saisonalen Arbeitsabläufe und Grundtechniken",
        "Bedienung einfacher landwirtschaftlicher Geräte unter Anleitung",
        "Pflege von Nutzpflanzen und Unterstützung bei der Tierpflege"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen von Pflanzenbau, Bodenkunde oder Tierphysiologie",
        "Selbstständige Durchführung von Routinearbeiten auf dem Feld oder Hof",
        "Instandhaltung von Zäunen, Stallungen und Betriebsgeräten"
      ],
      "Geselle / Fortgeschritten": [
        "Eigenverantwortliche Bewirtschaftung von Teilbereichen des Betriebs",
        "Überwachung der Gesundheit der Tierbestände oder des Pflanzenwachstums",
        "Bedienung und Wartung komplexer Betriebsmittel und Maschinen"
      ],
      "Experte / Spezialist": [
        "Zuchtplanung, Veredelung von Kulturen oder Rezepturentwicklung",
        "Behandlung von Pflanzenkrankheiten oder Optimierung von Gärungsprozessen",
        "Steuerung von anspruchsvollen Herstellungsverfahren"
      ],
      "Meister / Führungskraft": [
        "Wirtschaftliche und organisatorische Leitung des landwirtschaftlichen Betriebs",
        "Anleitung von Angestellten, Saisonkräften und Auszubildenden",
        "Ressourcenplanung, Einkauf von Saatgut und Vertrieb der Erzeugnisse"
      ],
      "Großmeister / Koryphäe": [
        "Entwicklung neuer, hocheffizienter Anbaumethoden oder Veredelungstechniken",
        "Erzeugung von prämierten Spezialitäten von überregionalem Ruf",
        "Beratung von landwirtschaftlichen Kammern oder Herrschaftshöfen"
      ],
      "Veteran / Legendär": [
        "Sicherung der regionalen Nahrungsmittelversorgung in Krisenzeiten",
        "Kultivierung seltener, fast ausgestorbener Ur-Sorten oder Rassen",
        "Lebenswerk-Prägung ganzer Agrarlandschaften oder kulinarischer Traditionen"
      ]
    }
  },
  "handel": {
    archetype: "Handel, Wirtschaft & Finanzen",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Verpacken und Transportieren von Handelswaren",
        "Einfache Botengänge und Reinigen der Verkaufsräume",
        "Durchführung von einfachen Zähltätigkeiten unter Aufsicht"
      ],
      "Neuling / Anfänger": [
        "Erlernen der gängigen Maßeinheiten, Währungen und Warenbezeichnungen",
        "Freundliche Bedienung von Kunden bei einfachen Verkäufen",
        "Regalpflege, Preisauszeichnung und Warenpräsentation"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen der Buchführung, Lagerhaltung und Kalkulation",
        "Prüfung von Wareneingängen auf Vollständigkeit und Mängel",
        "Vorbereitung von Verkaufsberichten und Kassenabrechnungen"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Abwicklung von Verkaufs- und Einkaufsgesprächen",
        "Pflege von Kundenbeziehungen und Bearbeitung von Reklamationen",
        "Überwachung der Lagerbestände und Nachbestellung von Standardwaren"
      ],
      "Experte / Spezialist": [
        "Durchführung von Marktanalysen und Erschließung neuer Lieferanten",
        "Verhandlung komplexer Verträge und Großkundenbetreuung",
        "Risikobewertung und Steuerung von anspruchsvollen Finanztransaktionen"
      ],
      "Meister / Führungskraft": [
        "Strategische und kaufmännische Leitung eines Handelshauses oder Kontors",
        "Budgetverantwortung, Personalsteuerung und Expansionsplanung",
        "Vertretung des Betriebs in Kaufmannsgilden und Handelskammern"
      ],
      "Großmeister / Koryphäe": [
        "Aufbau internationaler Handelsrouten und globaler Netzwerke",
        "Einflussnahme auf die regionale Wirtschaftspolitik und Zollabkommen",
        "Finanzierung großer Expeditionen oder staatlicher Vorhaben"
      ],
      "Veteran / Legendär": [
        "Prägung des gesamten Wirtschaftssystems eines Kontinents",
        "Monopolstellung in Schlüsselindustrien und Schlichtung von Handelskriegen",
        "Finanzieller Rückhalt von Königreichen und Gestaltung historischer Handelsdynastien"
      ]
    }
  },
  "logistik": {
    archetype: "Transport, Logistik & Seefahrt",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Manuelles Be- und Entladen von Transportmitteln",
        "Einfache Sicherung von Frachtgütern nach Anweisung",
        "Reinigungs- und Hilfsdienste an Bord oder im Fuhrpark"
      ],
      "Neuling / Anfänger": [
        "Erlernen von Sicherheitsvorschriften und Packtechniken",
        "Einfache Fahr- oder Ruderdienste unter direkter Aufsicht",
        "Überwachung von Frachtstücken während des Transports"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen von Routenkunde, Wetterzeichen und Fahrzeugtechnik",
        "Erstellung einfacher Frachtpapiere und Inventarlisten",
        "Pflege und Wartung der Transportmittel, Geschirre oder Takelagen"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Durchführung von Transportfahrten oder Standardrouten",
        "Sichere Navigation und Führung von Standard-Fahrzeugen oder Booten",
        "Koordination des Be- und Entladeprozesses inklusive Ladungssicherung"
      ],
      "Experte / Spezialist": [
        "Planung und Durchführung von schwierigen Spezialtransporten",
        "Navigation unter erschwerten Bedingungen oder in unbekannten Gewässern",
        "Krisenmanagement bei Transportverzögerungen oder Havarien"
      ],
      "Meister / Führungskraft": [
        "Flottensteuerung, Routenoptimierung und Fuhrparkleitung",
        "Sicherheitsverantwortung für Personal, Fracht und Transportmittel",
        "Kalkulation von Frachtraten und Verhandlung mit Zollbehörden"
      ],
      "Großmeister / Koryphäe": [
        "Erschließung und Kartografierung neuer Passagen und Seewege",
        "Kommando über riesige Handelskonvois oder Expeditionsflotten",
        "Entwicklung zukunftsweisender Logistiksysteme für Metropolen"
      ],
      "Veteran / Legendär": [
        "Legendärer Entdecker unberührter Kontinente und Meere",
        "Sicherung überlebenswichtiger Versorgungswege im globalen Maßstab",
        "Höchste nautische oder logistische Instanz mit historischer Vorbildwirkung"
      ]
    }
  },
  "medizin": {
    archetype: "Medizin & Heilkunst",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Säuberung von Behandlungsräumen und medizinischen Instrumenten",
        "Hilfe beim Halten oder Umlagern von Patienten",
        "Einfache Handreichungen nach Anweisung in Notfällen"
      ],
      "Neuling / Anfänger": [
        "Erlernen der Grundlagen der Anatomie und Wundversorgung",
        "Anlegen einfacher Verbände und Versorgung kleinerer Schürfwunden",
        "Sammeln und Sortieren von bekannten Heilkräutern"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen der Krankheitslehre, Pharmakologie und chirurgischen Techniken",
        "Selbstständige Zubereitung von Standard-Salben, Tinkturen und Tees",
        "Assistenz bei Operationen und Dokumentation von Behandlungsverläufen"
      ],
      "Geselle / Fortgeschritten": [
        "Eigenständige Diagnose und Behandlung alltäglicher Krankheiten",
        "Durchführung kleinerer chirurgischer Eingriffe und Wundnähte",
        "Betreuung von Patienten im Stationsalltag oder auf Hausbesuchen"
      ],
      "Experte / Spezialist": [
        "Spezialisierung auf komplexe Fachgebiete (z. B. Chirurgie, Toxikologie)",
        "Behandlung schwerer Verletzungen, seltener Krankheiten und Vergiftungen",
        "Durchführung risikoreicher medizinischer Eingriffe unter Zeitdruck"
      ],
      "Meister / Führungskraft": [
        "Leitung eines Lazaretts, einer Apotheke oder einer Heilanstalt",
        "Ausbildung des medizinischen Nachwuchses nach wissenschaftlichen Standards",
        "Seuchenschutz-Koordination und Krisenmanagement in der Region"
      ],
      "Großmeister / Koryphäe": [
        "Erforschung neuartiger Heilmethoden, Gegenmittel und Operationsverfahren",
        "Behandlung von Monarchen und hochgestellten Persönlichkeiten",
        "Verfassung von medizinischen Standardwerken für die Nachwelt"
      ],
      "Veteran / Legendär": [
        "Erschaffung von Elixieren, die an der Grenze des Möglichen kratzen",
        "Eindämmung kontinentaler Pandemien und Rettung unzähliger Leben",
        "Legendäre Koryphäe, deren medizinisches Wissen als unfehlbar gilt"
      ]
    }
  },
  "magie": {
    archetype: "Magie & Arkanes",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Aufsaugen von unkontrollierter Restmagie zur Schadensvermeidung",
        "Säuberung des alchemistischen Labors und Sortierung von Reagenzien",
        "Abschreiben einfacher arkane Symbole ohne magische Aktivierung"
      ],
      "Neuling / Anfänger": [
        "Erlernen der Meditation zur Kanalisierung und Fokussierung der Mana-Flüsse",
        "Wirken einfachster Gebrauchszauber (z. B. Licht, kleine Funken)",
        "Identifikation elementarer magischer Essenzen und Erze"
      ],
      "Lehrling / Auszubildender": [
        "Studium der theoretischen Magie, Runenkunde und Zauberformeln",
        "Herstellung grundlegender Tränke oder Aufladen einfacher Fokussteine",
        "Überwachung magischer Barrieren und Protokollierung von Experimenten"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständiges Wirken mittelschwerer Zauber für Praxis und Verteidigung",
        "Durchführung standardisierter Verzauberungen oder alchemistischer Prozesse",
        "Unterstützung bei der Erforschung anomaler magischer Phänomene"
      ],
      "Experte / Spezialist": [
        "Spezialisierung auf eine magische Schule (z. B. Elementar, Alchemie, Runen)",
        "Bannung gefährlicher Flüche oder Neutralisierung wilder Magie",
        "Konstruktion komplexer magischer Artefakte und Glyphen-Netzwerke"
      ],
      "Meister / Führungskraft": [
        "Leitung einer Magierakademie, Gilde oder eines Forschungslabors",
        "Sicherheitsverantwortung bei der Erprobung neuer, mächtiger Zauber",
        "Ausbildung von Magiebegabten und Abnahme von Gildenprüfungen"
      ],
      "Großmeister / Koryphäe": [
        "Entwicklung völlig neuer Zauberformeln und magischer Theorien",
        "Erschaffung permanenter magischer Strukturen oder Teleportationsnetzwerke",
        "Berater in arkanen Fragen für Kaiser, Könige oder den hohen Rat"
      ],
      "Veteran / Legendär": [
        "Manipulation der Realität, Zeit oder Dimensionen im monumentalen Maßstab",
        "Abwendung weltbedrohender magischer Katastrophen",
        "Aufstieg in den Rang einer unsterblichen Legende des arkanen Zeitalters"
      ]
    }
  },
  "militaer": {
    archetype: "Militär & Kriegskunst",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Wartung der Ausrüstung und Reinigung der Unterkünfte",
        "Graben von Schützengräben und Errichtung einfacher Barrikaden",
        "Hilfsdienste im Tross und Transport von Versorgungsgütern"
      ],
      "Neuling / Anfänger": [
        "Erlernen der militärischen Disziplin, Marschordnung und Befehlskette",
        "Grundausbildung an Standardwaffen (z. B. Speer, Kurzschwert)",
        "Durchführung einfacher Wach- und Küchendienste im Lager"
      ],
      "Lehrling / Auszubildender": [
        "Intensives Training im Formationskampf und taktischen Manövern",
        "Sicherer Umgang mit Fernkampfwaffen oder Belagerungsgeräten",
        "Unterstützung bei der Ausbildung neuer Rekruten"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Ausführung von Kampfeinsätzen im Truppenverband",
        "Verteidigung strategischer Stellungen und Durchführung von Patrouillen",
        "Pflege und Instandhaltung von Waffen, Rüstungen und Befestigungen"
      ],
      "Experte / Spezialist": [
        "Spezialeinsätze (z. B. Aufklärung hinter feindlichen Linien, Scharfschütze)",
        "Taktische Beratung von Truppenführern bei schwierigen Geländegegebenheiten",
        "Wartung und Einsatz hochkomplexer Kriegstechnik"
      ],
      "Meister / Führungskraft": [
        "Kommando über eine Kompanie, ein Bataillon oder eine Festung",
        "Verantwortung für die taktische Planung, Logistik und Truppenmoral",
        "Ausbildung und strategische Vorbereitung von Einheiten auf den Ernstfall"
      ],
      "Großmeister / Koryphäe": [
        "Entwicklung kontinentaler Militärstrategien und Verteidigungskonzepte",
        "Oberbefehl über gesamte Armeen oder Expeditionsstreitkräfte",
        "Führung von Friedensverhandlungen und Gestaltung von Militärbündnissen"
      ],
      "Veteran / Legendär": [
        "Siege in historisch entscheidenden Schlachten gegen erdrückende Übermächte",
        "Prägung des militärischen Doktrins für Generationen",
        "Als lebende Legende verehrt, deren Name allein Feinde zur Kapitulation bewegt"
      ]
    }
  },
  "sicherheit": {
    archetype: "Wachen & Sicherheit",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Einfache Schmierdienste und Aufhalten von Schaulustigen",
        "Melden von Vorfällen an reguläre Sicherheitskräfte",
        "Präsenz zeigen an unkritischen Absperrungen"
      ],
      "Neuling / Anfänger": [
        "Erlernen der Hausordnung, Dienstvorschriften und grundlegenden Griffe",
        "Durchführung von Routinegängen in sicheren Bereichen",
        "Kontrolle von Einlasskarten oder einfachen Pässen"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen von Deeskalationstechniken und Fesselungsgriffen",
        "Mitwirken bei der Absicherung von Veranstaltungen oder Transporten",
        "Wartung der Sicherheitsausrüstung und Protokollführung"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Durchführung von Streifengängen und Torkontrollen",
        "Deeskalation von Konflikten und Festnahme von Unruhestiftern",
        "Gewährleistung des Schutzes von Schutzbefohlenen im Alltag"
      ],
      "Experte / Spezialist": [
        "Spezialsicherungsaufgaben (z. B. Personenschutz hochrangiger Gäste)",
        "Erstellung von Sicherheitskonzepten für Gebäude oder Werttransporte",
        "Einsatzleitung bei akuten Bedrohungslagen oder Einbrüchen"
      ],
      "Meister / Führungskraft": [
        "Leitung der Stadtwache, einer Sicherheitsfirma oder Leibgarde",
        "Dienstplanerstellung, Personalverantwortung und Budgetkontrolle",
        "Kooperation mit Justizbehörden und der Stadtverwaltung"
      ],
      "Großmeister / Koryphäe": [
        "Konzeptionierung des gesamten städtischen oder nationalen Sicherheitsnetzes",
        "Persönlicher Schutz des Monarchen oder der obersten Staatsführung",
        "Erfolgreiche Zerschlagung organisierter Spionageringe oder Kartelle"
      ],
      "Veteran / Legendär": [
        "Aufbau einer legendären Garde von unbeflecktem Ruf",
        "Verhinderung historischer Attentate und Staatsstreiche",
        "Symbol für absolute, unbezwingbare Loyalität und Sicherheit"
      ]
    }
  },
  "verwaltung": {
    archetype: "Verwaltung, Staat & Recht",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Sortieren, Abheften und Transportieren von Akten",
        "Einfache Schreibarbeiten und Vervielfältigungen von Dokumenten",
        "Botengänge zwischen verschiedenen Ämtern und Behörden"
      ],
      "Neuling / Anfänger": [
        "Erlernen der Amtswege, Archivierungsstrukturen und Rechtsbegriffe",
        "Freundliche Entgegennahme von Bürgeranträgen und Formularen",
        "Erfassung einfacher Daten in Registern oder Listen"
      ],
      "Lehrling / Auszubildender": [
        "Studium des Verwaltungsrechts, der Heraldik oder Finanzrechnung",
        "Prüfung einfacher Anträge auf formelle Richtigkeit",
        "Verfassen von standardisierten Bescheiden und Sitzungsprotokollen"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Bearbeitung komplexer Anträge und Rechtsfälle",
        "Führung von Registern, Steuerbüchern oder Archivbeständen",
        "Beratung von Bürgern bei rechtlichen oder behördlichen Anliegen"
      ],
      "Experte / Spezialist": [
        "Ausarbeitung von Gesetzesentwürfen, Verträgen oder Finanzberichten",
        "Leitung von anspruchsvollen Prüfungsverfahren oder Audits",
        "Spezialisierung auf Fachgebiete wie Außenpolitik, Zoll oder Justiz"
      ],
      "Meister / Führungskraft": [
        "Leitung einer Behörde, eines Gerichts oder eines Ministeriums",
        "Personalverantwortung für die Beamten und Verwaltungskräfte",
        "Budgetplanung und strategische Ausrichtung der Institution"
      ],
      "Großmeister / Koryphäe": [
        "Führung von diplomatischen Verhandlungen auf internationaler Ebene",
        "Prägung der Gesetzgebung oder des Justizsystems eines Staates",
        "Enger Berater der Staatsführung in allen administrativen Fragen"
      ],
      "Veteran / Legendär": [
        "Gestaltung einer Ära durch weitsichtige Reformen und Staatsverträge",
        "Sicherung der staatlichen Ordnung in Phasen des Machtwechsels",
        "Architekt von Friedensverträgen und Bündnissen von weltgeschichtlicher Bedeutung"
      ]
    }
  },
  "adel": {
    archetype: "Adel & Herrschaft",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Repräsentation des Hauses bei kleineren lokalen Anlässen",
        "Erlernen der höfischen Etikette und Stammbäume im Selbststudium",
        "Verwaltung des eigenen kleinen Taschenbudgets"
      ],
      "Neuling / Anfänger": [
        "Teilnahme an Staatsakten und Hofzeremonien als Beobachter",
        "Erlernen von Fremdsprachen, Rhetorik und Reitkunst",
        "Übernahme von Schirmherrschaften über wohltätige Projekte"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Staatsführung, Ökonomie und Militärtaktik",
        "Hospitation bei Gerichtsverhandlungen und Ratsbeschlüssen",
        "Verwaltung von kleineren Familiengütern unter Aufsicht"
      ],
      "Geselle / Fortgeschritten": [
        "Eigenständige Verwaltung von Ländereien, Dörfern oder Gütern",
        "Sprecher des Hauses in regionalen Gremien und Ausschüssen",
        "Ausübung der niederen Gerichtsbarkeit im eigenen Herrschaftsgebiet"
      ],
      "Experte / Spezialist": [
        "Verhandlung von Verträgen und Bündnissen im Namen des Hauses",
        "Leitung wichtiger diplomatischer Missionen im Ausland",
        "Finanz- und Ressourcenplanung für das gesamte Herrschaftsgebiet"
      ],
      "Meister / Führungskraft": [
        "Regierung des Fürstentums, Herzogtums oder Königreichs",
        "Ernennung von Beamten, Richtern und Militärführern",
        "Entscheidung über Krieg und Frieden sowie die Steuergesetzgebung"
      ],
      "Großmeister / Koryphäe": [
        "Führung von herrschaftlichen Allianzen und Imperien",
        "Durchsetzung tiefgreifender gesellschaftlicher und wirtschaftlicher Reformen",
        "Sicherung des Fortbestands der Dynastie durch weitsichtige Bündnispolitik"
      ],
      "Veteran / Legendär": [
        "Prägung eines goldenen Zeitalters, das Jahrhunderte überdauert",
        "Vereinigung verfeindeter Reiche und Stiftung dauerhaften Friedens",
        "Als weiser, gerechter und unvergesslicher Herrscher in die Geschichte eingehen"
      ]
    }
  },
  "religion": {
    archetype: "Religion & Klerus",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Instandhaltung und Reinigung des Tempels oder Klosters",
        "Hilfe bei der Vorbereitung einfacher religiöser Zeremonien",
        "Sammeln von Spenden und Verteilung von Almosen nach Anweisung"
      ],
      "Neuling / Anfänger": [
        "Erlernen der heiligen Schriften, Gebete und Ordensregeln",
        "Teilnahme an den täglichen Chorgebeten und Andachten",
        "Einfache Seelsorgedienste im Umfeld der Gemeinde"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Theologie, Philosophie und alten Sprachen",
        "Durchführung einfacher liturgischer Handlungen unter Aufsicht",
        "Mitarbeit in der klösterlichen Krankenpflege oder Bibliothek"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Leitung von Gottesdiensten, Taufen und Bestattungen",
        "Erteilung von Religionsunterricht und spiritueller Unterweisung",
        "Seelsorgerische Betreuung einer Kirchengemeinde im Alltag"
      ],
      "Experte / Spezialist": [
        "Spezialisierung auf Fachgebiete (z. B. Exorzismus, theologische Forschung)",
        "Leitung anspruchsvoller Missionen oder wissenschaftlicher Dispute",
        "Verfassen von theologischen Abhandlungen und Kommentaren"
      ],
      "Meister / Führungskraft": [
        "Leitung eines Klosters, einer Diözese oder eines Ordenshauses",
        "Personalverantwortung für Priester, Mönche und Tempeldiener",
        "Verwaltung der kirchlichen Besitztümer, Ländereien und Finanzen"
      ],
      "Großmeister / Koryphäe": [
        "Wegweisende theologische Reformen und Auslegung von Dogmen",
        "Vertretung des Glaubens gegenüber der höchsten Staatsführung",
        "Kommando über kirchliche Ritterorden oder weltweite Missionen"
      ],
      "Veteran / Legendär": [
        "Auslösung einer spirituellen Erweckung oder Epochenwende",
        "Vermittlung von Frieden in globalen Glaubenskonflikten",
        "Heiligsprechung oder Verehrung als Prophet und spirituelles Vorbild"
      ]
    }
  },
  "forschung": {
    archetype: "Forschung & Bildung",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Sortieren und Abstauben von Büchern und Exponaten",
        "Einfache Abschriftarbeiten von leicht verständlichen Texten",
        "Reinigung und Vorbereitung der Laborgeräte oder Arbeitsräume"
      ],
      "Neuling / Anfänger": [
        "Erlernen wissenschaftlicher Methoden, Recherchetechniken und Sprachen",
        "Katalogisierung einfacher Fundstücke oder Buchbestände",
        "Unterstützung bei der Durchführung einfacher Messungen"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Fachliteratur, Archivkunde und mathematischen Grundlagen",
        "Verfassen erster kleinerer Berichte oder Zusammenfassungen",
        "Pflege und Wartung empfindlicher wissenschaftlicher Instrumente"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Durchführung von Recherchen, Experimenten oder Exkursionen",
        "Erstellung detaillierter Berichte, Karten oder Dokumentationen",
        "Erteilung von Grundunterricht für Studenten oder Schüler"
      ],
      "Experte / Spezialist": [
        "Leitung spezialisierter Forschungsprojekte oder Expeditionen",
        "Veröffentlichung von wissenschaftlichen Aufsätzen in Fachkreisen",
        "Entwicklung neuer Analysemethoden oder Messgeräte"
      ],
      "Meister / Führungskraft": [
        "Leitung eines Instituts, einer Fakultät, Bibliothek oder Schule",
        "Personalverantwortung für Dozenten, Forscher und Assistenten",
        "Budgetplanung, Akquise von Fördermitteln und Lehrplangestaltung"
      ],
      "Großmeister / Koryphäe": [
        "Etablierung völlig neuer Forschungsrichtungen und Denkschulen",
        "Verfassung wegweisender Standardwerke von weltweiter Bedeutung",
        "Wissenschaftlicher Berater für Regierungen und Akademien"
      ],
      "Veteran / Legendär": [
        "Entdeckungen, die das Weltbild der Menschheit nachhaltig verändern",
        "Lebenswerk von unschätzbarem Wert für den Fortschritt der Zivilisation",
        "Als unsterblicher Pionier der Wissenschaft in den Geschichtsbüchern verankert"
      ]
    }
  },
  "natur": {
    archetype: "Natur, Wildnis & Forstwirtschaft",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Sammeln von einfachem Brennholz und Wildbeeren",
        "Instandhaltung einfacher Pfade und Lagerplätze nach Anweisung",
        "Hilfsdienste beim Transport von Holz oder Jagdbeute"
      ],
      "Neuling / Anfänger": [
        "Erlernen des Fährtenlesens, der Tierbeobachtung und Baumkunde",
        "Unterstützung bei der Hege und Pflege von Waldbeständen",
        "Bedienung einfacher Forstwerkzeuge unter ständiger Aufsicht"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Ökologie, Wildbiologie und Holzmesskunde",
        "Selbstständige Durchführung einfacher Jagd- oder Hegetätigkeiten",
        "Wartung der Ausrüstung und Instandhaltung von Hochsitzen"
      ],
      "Geselle / Fortgeschritten": [
        "Eigenverantwortliche Betreuung eines zugewiesenen Revierabschnitts",
        "Bekämpfung von Wilderei, Forstschädlingen und Waldbränden",
        "Planung und Durchführung von Holzeinschlägen oder Hegemaßnahmen"
      ],
      "Experte / Spezialist": [
        "Kartografierung unwegsamen Geländes und Leitung schwieriger Suchen",
        "Umgang mit anspruchsvollen Jagdtechniken oder seltenen Tierarten",
        "Gutachter für forstwirtschaftliche Fragen und Artenschutz"
      ],
      "Meister / Führungskraft": [
        "Leitung eines Forstamtes, Jagdreviers oder einer Nationalparkverwaltung",
        "Personalverantwortung für Förster, Jäger und Waldarbeiter",
        "Absprache mit Holzindustrie, Naturschutzbehörden und Grundeigentümern"
      ],
      "Großmeister / Koryphäe": [
        "Konzeptionierung großflächiger Naturschutz- und Forstprogramme",
        "Erschließung und Sicherung unentdeckter Urwälder und Wildnisse",
        "Berater für Umwelt- und Ressourcenfragen auf nationaler Ebene"
      ],
      "Veteran / Legendär": [
        "Rettung ganzer Ökosysteme vor der Zerstörung oder Ausbeutung",
        "Legendärer Hüter der Natur, dessen Wort in der Wildnis Gesetz ist",
        "Lebenswerk zur Harmonisierung von Zivilisation und unberührter Natur"
      ]
    }
  },
  "dienstleistung": {
    archetype: "Dienstleistung & Gastgewerbe",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Abwaschen von Geschirr und einfache Reinigungsarbeiten",
        "Ausführen von schweren Tragediensten im Betrieb",
        "Zuarbeit in der Küche oder im Service nach Bedarf"
      ],
      "Neuling / Anfänger": [
        "Erlernen der Servierregeln, Hygienevorschriften und des Sortiments",
        "Freundliche Bedienung von Gästen bei einfachen Bestellungen",
        "Vorbereitung der Gasträume, Tischendecken und Dekoration"
      ],
      "Lehrling / Auszubildender": [
        "Erlernen der gehobenen Gastronomie, Zimmerpflege oder Küchenkunst",
        "Selbstständige Betreuung einfacher Gästegruppen oder Zimmer",
        "Mitwirken bei der Lagerhaltung und Qualitätskontrolle der Waren"
      ],
      "Geselle / Fortgeschritten": [
        "Eigenverantwortliche Führung des Services, der Küche oder des Empfangs",
        "Professionelle Beratung der Gäste bei Speisen- und Getränkeauswahl",
        "Koordination von Arbeitsabläufen im Team während der Stoßzeiten"
      ],
      "Experte / Spezialist": [
        "Spezialisierung (z. B. Sommelier, Diätkoch, Eventmanagement)",
        "Planung und Durchführung exklusiver Veranstaltungen und Menüs",
        "Umgang mit anspruchsvollen Gästen und Reklamationsmanagement"
      ],
      "Meister / Führungskraft": [
        "Leitung des gesamten Gastronomie- oder Beherbergungsbetriebs",
        "Personalverantwortung, Dienstplangestaltung und Ausbildung",
        "Kalkulation, Einkauf, Marketing und Einhaltung aller Standards"
      ],
      "Großmeister / Koryphäe": [
        "Entwicklung innovativer Gastro-Konzepte von überregionalem Ruf",
        "Bewirtung von Staatsgästen, königlichen Banketten und Festen",
        "Auszeichnung mit renommierten Preisen der Branche"
      ],
      "Veteran / Legendär": [
        "Prägung einer ganzen Epoche der Gastfreundschaft oder Kulinarik",
        "Leitung weltberühmter Traditionshäuser von historischem Rang",
        "Legendäres Lebenswerk als Gastgeber oder Meisterkoch der Könige"
      ]
    }
  },
  "unterhaltung": {
    archetype: "Unterhaltung & Kunst",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Auf- und Abbau von Bühnenbildern und Requisiten",
        "Einfache Statistenrollen oder Verteilen von Handzetteln",
        "Säuberung der Probenräume und Backstage-Bereiche"
      ],
      "Neuling / Anfänger": [
        "Erlernen von Schauspiel-, Tanz-, Gesangs- oder Instrumentaltechniken",
        "Übernahme kleinerer Nebenrollen oder Soloparts unter Anleitung",
        "Tägliches intensives Üben der künstlerischen Fertigkeiten"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Kunstgeschichte, Musiktheorie oder Dramaturgie",
        "Mitwirken bei der Erstellung von Choreografien oder Drehbüchern",
        "Pflege und Instandhaltung von Instrumenten, Kostümen und Masken"
      ],
      "Geselle / Fortgeschritten": [
        "Selbstständige Durchführung von Auftritten und Darbietungen",
        "Begeisterung des Publikums durch ausdrucksstarkes Spiel",
        "Leitung von Proben in Teilbereichen des Ensembles"
      ],
      "Experte / Spezialist": [
        "Übernahme von anspruchsvollen Hauptrollen oder Solo-Konzerten",
        "Entwicklung eigener künstlerischer Handschriften und Stücke",
        "Unterricht für fortgeschrittene Künstler und Nachwuchstalente"
      ],
      "Meister / Führungskraft": [
        "Leitung eines Theaters, Orchesters, einer Truppe oder Schule",
        "Gesamtverantwortung für Inszenierung, Spielplan und Finanzen",
        "Förderung und Ausbildung von Talenten auf professionellem Niveau"
      ],
      "Großmeister / Koryphäe": [
        "Erschaffung von zeitlosen Kunstwerken, Kompositionen oder Dramen",
        "Künstlerischer Magnet für das Publikum im gesamten Kulturraum",
        "Kultureller Botschafter an herrschaftlichen Höfen und Akademien"
      ],
      "Veteran / Legendär": [
        "Prägung der Kulturepoche, deren Werke noch Jahrhunderte überdauern",
        "Legende der Bühne oder Musik, deren Name weltweit Ehrfurcht weckt",
        "Inbegriff der künstlerischen Vollendung mit historischem Vorbildstatus"
      ]
    }
  },
  "kriminell": {
    archetype: "Kriminelle Berufe",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Einfache Schmierestehen-Dienste in sicheren Gassen",
        "Botengänge für Hehler ohne Kenntnis der Frachtdetails",
        "Einfache Ablenkungsmanöver auf belebten Märkten"
      ],
      "Neuling / Anfänger": [
        "Erlernen von unauffälligem Bewegen, Schlösserknacken oder Taschendiebstahl",
        "Ausführen kleinerer Delikte unter direkter Anleitung",
        "Kundschaften von einfachen Fluchtwegen und Zielobjekten"
      ],
      "Lehrling / Auszubildender": [
        "Studium der Wachpläne, Sicherheitsvorkehrungen und Verkleidungskunst",
        "Selbstständige Durchführung kleinerer Einbrüche oder Diebstähle",
        "Instandhaltung und Verstecken der kriminellen Werkzeuge"
      ],
      "Geselle / Fortgeschritten": [
        "Erfolgreiche Planung und Durchführung mittelschwerer Raubzüge oder Schmuggelaktionen",
        "Sichere Deeskalation bei Konfrontationen mit der Stadtwache",
        "Pflege von Kontakten zu Hehlern, Informanten und Bandenmitgliedern"
      ],
      "Experte / Spezialist": [
        "Spezialisierung (z. B. Tresorknacker, lautloser Attentäter, Fälscher)",
        "Ausschaltung komplexer mechanischer oder magischer Sicherungen",
        "Krisenmanagement und spurenloses Entkommen aus brenzligen Situationen"
      ],
      "Meister / Führungskraft": [
        "Leitung einer Diebesgilde, Schmugglerbande oder eines kriminellen Rings",
        "Planung von spektakulären Coups von strategischer Bedeutung",
        "Gewährleistung der Disziplin in der Gilde und Verhandlung von Reviergrenzen"
      ],
      "Großmeister / Koryphäe": [
        "Einflussnahme auf die städtische Unterwelt und korrupte Beamte",
        "Aufbau eines dichten, internationalen Netzwerks für illegale Waren",
        "Durchführung von legendären Diebstählen, die als unmöglich galten"
      ],
      "Veteran / Legendär": [
        "Unsichtbarer Herrscher des gesamten kriminellen Netzwerks eines Reiches",
        "Sagenumwobene Legende der Unterwelt, deren Existenz oft bezweifelt wird",
        "Lebenswerk, das die Machtstrukturen von Staaten im Verborgenen lenkte"
      ]
    }
  },
  "abenteuer": {
    archetype: "Abenteuer, Erkundung & Söldnertum",
    levelDuties: {
      "Ungelernt / Autodidakt": [
        "Tragen von Ausrüstung und Proviant auf einfachen Wegen",
        "Aufstellen von Zelten und Entfachen des Lagerfeuers",
        "Einfache Wachedienste in sicheren Lagern nach Anweisung"
      ],
      "Neuling / Anfänger": [
        "Erlernen von Überlebenstechniken, Orientierung und Erster Hilfe",
        "Ausführen einfacher Erkundungen im nahen Umkreis",
        "Pflege der Expeditionsausrüstung und Waffen"
      ],
      "Lehrling / Auszubildender": [
        "Studium von alten Karten, Ruinenplänen und Monsterkunde",
        "Selbstständiges Meistern einfacher Hindernisse und Kletterpassagen",
        "Protokollierung von Entdeckungen und Wegpunkten"
      ],
      "Geselle / Fortgeschritten": [
        "Sichere Durchführung von Expeditionen in unwegsames Gelände",
        "Erfolgreiche Bekämpfung von Standard-Bedrohungen und Monstern",
        "Navigation und Pfadfindung in schwierigen Gebieten"
      ],
      "Experte / Spezialist": [
        "Spezialisierung (z. B. Entschärfen von Fallen, Fährtenleser, Bestienbändiger)",
        "Erkundung extrem gefährlicher Zonen (z. B. tiefe Dungeons, giftige Sümpfe)",
        "Sichere Bergung wertvoller und empfindlicher Relikte"
      ],
      "Meister / Führungskraft": [
        "Leitung großer Expeditionsgruppen, Söldnergarden oder Erkundungsteams",
        "Verantwortung für die Sicherheit, Logistik und Verpflegung der Gruppe",
        "Verhandlung von Verträgen mit Gilden, Gelehrten oder Herrschern"
      ],
      "Großmeister / Koryphäe": [
        "Erschließung komplett weißer Flecken auf der Weltkarte",
        "Bezwingung legendärer Bestien und Klärung uralter Mysterien",
        "Weltruhm als führender Entdecker und Wegbereiter für die Zivilisation"
      ],
      "Veteran / Legendär": [
        "Entdeckung verschollener Zivilisationen und mächtiger Artefakte",
        "Überleben in lebensfeindlichen Dimensionen oder Extremzonen",
        "Als unsterbliche Abenteurer-Legende verehrt, die das Schicksal der Welt prägte"
      ]
    }
  }
};

// Map any specific job title to its closest archetype category
export function getArchetypeKeyForJob(jobTitle: string): string {
  const title = (jobTitle || "").toLowerCase().trim();
  if (!title) return "handwerk";

  // Handwerk
  if (
    /schmied|schreiner|tischler|schneider|schuster|töpfer|glasbläser|maurer|bogenbauer|gerber|weber|steinmetz|zimmermann|seiler|büchsenmacher|feinmechaniker|uhrmacher|goldschmied|juwelier|instrumentenbauer|optiker|graveur|siegelstecher/i.test(title)
  ) {
    return "handwerk";
  }

  // Landwirtschaft
  if (
    /bauer|landwirt|viehzüchter|bäcker|metzger|fleischer|brauer|winzer|fischer|imker|müller|obstbauer|hirte|käser/i.test(title)
  ) {
    return "landwirtschaft";
  }

  // Handel
  if (
    /händler|kaufmann|krämer|geldwechsler|kontorist|auktion|hausierer|import|export|verkäufer/i.test(title)
  ) {
    return "handel";
  }

  // Logistik
  if (
    /fuhrmann|kutscher|kapitän|schiffer|hafenarbeiter|bote|eilbote|logistiker|fährmann|karren|matrose/i.test(title)
  ) {
    return "logistik";
  }

  // Medizin
  if (
    /arzt|heiler|feldscher|apotheker|seuchen|pfleger|hebamme|quacksalber|wundarzt/i.test(title)
  ) {
    return "medizin";
  }

  // Magie
  if (
    /alchemist|runenschmied|magie|verzauberer|beschwörer|nekromant|illusionist|rituale/i.test(title)
  ) {
    return "magie";
  }

  // Militär
  if (
    /soldat|kavallerist|infanterist|schütze|offizier|söldner|strategie|kommandant|rekrut|hauptmann/i.test(title)
  ) {
    return "militaer";
  }

  // Sicherheit
  if (
    /wache|türsteher|leibwächter|wärter|patrouille|torkontrolleur/i.test(title)
  ) {
    return "sicherheit";
  }

  // Verwaltung
  if (
    /schreiber|beamter|steuer|richter|diplomat|notar|verwalter|kanzler|herold|vogt/i.test(title)
  ) {
    return "verwaltung";
  }

  // Adel
  if (
    /fürst|könig|herzog|graf|baron|freiherr|lord|lady|hofdame|berater|seneschall|lehntherr|prinz|junker|komtesse|adels/i.test(title)
  ) {
    return "adel";
  }

  // Religion
  if (
    /priester|kleriker|mönch|nonne|inquisitor|diener|exorzist|orakel|paladin/i.test(title)
  ) {
    return "religion";
  }

  // Forschung
  if (
    /gelehrter|kartograf|bibliothekar|professor|lehrmeister|historiker|astronom|student|schüler|philosoph|archivar/i.test(title)
  ) {
    return "forschung";
  }

  // Natur
  if (
    /jäger|förster|waldläufer|falkner|kräuter|kundschafter|trapper|holzfäller/i.test(title)
  ) {
    return "natur";
  }

  // Dienstleistung
  if (
    /wirt|kellner|maid|mädchen|magd|koch|friseur|herberg|bote|butler|haus/i.test(title)
  ) {
    return "dienstleistung";
  }

  // Unterhaltung
  if (
    /barde|musiker|tänzer|gaukler|akrobat|schauspieler|narr|artist|jongleur|dichter/i.test(title)
  ) {
    return "unterhaltung";
  }

  // Kriminell
  if (
    /dieb|taschendieb|schmuggler|assassine|mörder|hehler|fälscher|räuber|bandit|einbrecher/i.test(title)
  ) {
    return "kriminell";
  }

  // Abenteuer
  if (
    /abenteurer|schatz|kopfgeld|monster|ruinen|scout|relikt/i.test(title)
  ) {
    return "abenteuer";
  }

  return "handwerk"; // Default to handwerk
}

export function getDutiesForProfessionAndLevel(jobTitle: string, level: string): string[] {
  const key = getArchetypeKeyForJob(jobTitle);
  const archetype = DUTIES_BY_ARCHETYPE[key];
  if (!archetype) return [];

  // Match the level exactly, or fallback to nearest if not found
  const duties = archetype.levelDuties[level];
  if (duties) return duties;

  // Fallback to first available level
  const keys = Object.keys(archetype.levelDuties);
  return archetype.levelDuties[keys[0]] || [];
}
